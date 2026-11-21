import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { INITIAL_QUIZ, SECOND_QUIZ, syncRoundOneQuestions, syncRoundTwoQuestions } from './src/data/defaultQuizzes';
import { Quiz, BuzzerPress, ScoreAuditEntry, Question } from './src/types/quiz';

const PORT = 3000;
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json({ limit: '20mb' }));

// In-memory store + file persistence
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'quizzes.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let quizzes: Record<string, Quiz> = {};

function loadQuizzes() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      quizzes = JSON.parse(raw);
      // Synchronize default competition rounds with latest multiple-choice & per-team 5-question Round 1 & Round 2 pools
      const initR1 = quizzes[INITIAL_QUIZ.id]?.rounds?.[0];
      const initR2 = quizzes[INITIAL_QUIZ.id]?.rounds?.[1];
      const initTeamCount = quizzes[INITIAL_QUIZ.id]?.teams?.length || 4;
      if (
        !initR1?.questions[0]?.options ||
        initR1.questions.length < initTeamCount * 5 ||
        !initR2 ||
        initR2.questions.length < initTeamCount * 5
      ) {
        quizzes[INITIAL_QUIZ.id] = JSON.parse(JSON.stringify(INITIAL_QUIZ));
        quizzes[SECOND_QUIZ.id] = JSON.parse(JSON.stringify(SECOND_QUIZ));
        saveQuizzes();
      }
      // Always reset ephemeral live WebSocket online statuses on server startup
      Object.values(quizzes).forEach((qz) => {
        qz.teams?.forEach((t) => {
          t.isOnline = false;
        });
      });
    } else {
      quizzes = {
        [INITIAL_QUIZ.id]: JSON.parse(JSON.stringify(INITIAL_QUIZ)),
        [SECOND_QUIZ.id]: JSON.parse(JSON.stringify(SECOND_QUIZ)),
      };
      saveQuizzes();
    }
  } catch (err) {
    console.error('Failed to load quizzes from disk, using defaults:', err);
    quizzes = {
      [INITIAL_QUIZ.id]: JSON.parse(JSON.stringify(INITIAL_QUIZ)),
      [SECOND_QUIZ.id]: JSON.parse(JSON.stringify(SECOND_QUIZ)),
    };
  }
}

function saveQuizzes() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(quizzes, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save quizzes to disk:', err);
  }
}

loadQuizzes();

// Client connection tracking
interface ClientMeta {
  ws: WebSocket;
  quizId: string;
  role: 'admin' | 'quizmaster' | 'projector' | 'mobile';
  teamId?: string;
}

const connectedClients: Set<ClientMeta> = new Set();

function broadcastToQuiz(quizId: string, event: string, payload: unknown) {
  const message = JSON.stringify({ event, payload, timestamp: Date.now() });
  for (const client of connectedClients) {
    if (client.quizId === quizId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

function updateTeamOnlineStatuses(quizId: string) {
  const quiz = quizzes[quizId];
  if (!quiz) return;

  const onlineTeamIds = new Set<string>();
  for (const client of connectedClients) {
    if (client.quizId === quizId && client.role === 'mobile' && client.teamId) {
      onlineTeamIds.add(client.teamId);
    }
  }

  let changed = false;
  quiz.teams.forEach((team) => {
    const isOnline = onlineTeamIds.has(team.id);
    if (team.isOnline !== isOnline) {
      team.isOnline = isOnline;
      changed = true;
    }
  });

  if (changed) {
    saveQuizzes();
    broadcastToQuiz(quizId, 'QUIZ_UPDATED', quiz);
  }
}

// Server-authoritative timer interval
setInterval(() => {
  let anyTimerChanged = false;
  for (const quizId of Object.keys(quizzes)) {
    const quiz = quizzes[quizId];
    if (quiz && quiz.timer.isRunning && !quiz.isPaused) {
      if (quiz.timer.remainingSeconds > 0) {
        quiz.timer.remainingSeconds -= 1;
        anyTimerChanged = true;
      }

      if (quiz.timer.remainingSeconds === 0) {
        quiz.timer.isRunning = false;
        anyTimerChanged = true;

        // Auto-lock buzzer if buzzer was running with timer
        if (quiz.buzzer.isActive) {
          quiz.buzzer.locked = true;
        }

        // In Rapid Fire round, reaching 0s stops the timer, marks remaining lot questions unanswered, and sets lot_done
        const roundIdx = quiz.currentRoundIndex;
        const qIdx = quiz.currentQuestionIndex;
        const currentRound = quiz.rounds[roundIdx];
        if (currentRound?.type === 'rapid_fire') {
          const teamIdx = Math.max(0, quiz.teams.findIndex((t) => t.id === quiz.activeTeamId));
          const lotStart = Math.min(teamIdx * 5, Math.max(0, currentRound.questions.length - 1));
          const lotEnd = Math.min(lotStart + 4, Math.max(0, currentRound.questions.length - 1));
          if (!quiz.rapidFireLotResults) quiz.rapidFireLotResults = {};
          for (let i = lotStart; i <= lotEnd; i++) {
            const qItem = currentRound.questions[i];
            if (qItem && !quiz.rapidFireLotResults[qItem.id]) {
              quiz.rapidFireLotResults[qItem.id] = 'unanswered';
            }
          }
          quiz.rapidFirePhase = 'lot_done';
          broadcastToQuiz(quizId, 'QUIZ_UPDATED', quiz);
        }

        // In MCQ rounds (1, 3, 5), if stipulated time expires without an answer:
        // Allot 0 points, show timeout/answer briefly, then auto-advance to next question
        // for next team (Round 1 & 5) or same participant/team (Round 3).
        const isMcqRound =
          currentRound &&
          (currentRound.roundNumber === 1 || currentRound.roundNumber === 3 || currentRound.roundNumber === 5);

        if (
          isMcqRound &&
          quiz.activeTeamId &&
          (quiz.selectedOptionIndex === null || quiz.selectedOptionIndex === undefined)
        ) {
          const teamId = quiz.activeTeamId;
          if (!quiz.currentQuestionAnswers[teamId]) {
            quiz.currentQuestionAnswers[teamId] = 'unanswered';
            if (!quiz.roundScores[teamId]) quiz.roundScores[teamId] = {};
            quiz.roundScores[teamId][currentRound.id] = (quiz.roundScores[teamId][currentRound.id] || 0) + 0;
            quiz.totalScores[teamId] = (quiz.totalScores[teamId] || 0) + 0;
            quiz.answerRevealed = true;
            broadcastToQuiz(quizId, 'QUIZ_UPDATED', quiz);

            // Schedule automatic progression to the next question after 2 seconds
            setTimeout(() => {
              const latestQuiz = quizzes[quizId];
              if (!latestQuiz) return;
              // Guard: only auto-advance if quizmaster has not manually moved away
              if (
                latestQuiz.currentRoundIndex !== roundIdx ||
                latestQuiz.currentQuestionIndex !== qIdx ||
                latestQuiz.timer.isRunning
              ) {
                return;
              }

              const latestRound = latestQuiz.rounds[roundIdx];
              if (!latestRound) return;

              const nextIdx = qIdx + 1;
              if (nextIdx < latestRound.questions.length) {
                latestQuiz.currentQuestionIndex = nextIdx;
                latestQuiz.optionsRevealed = false;
                latestQuiz.selectedOptionIndex = null;
                latestQuiz.answerRevealed = false;
                latestQuiz.currentQuestionAnswers = {};
                latestQuiz.timer.totalSeconds = latestRound.timing.durationSeconds;
                latestQuiz.timer.remainingSeconds = latestRound.timing.durationSeconds;
                latestQuiz.timer.isRunning = false;

                // Round 1 & 5 rotate to the next team; Round 3 stays on the same team/participant
                if (latestRound.roundNumber === 1 || latestRound.roundNumber === 5) {
                  if (latestQuiz.teams.length > 0) {
                    const curTeamPos = latestQuiz.teams.findIndex((t) => t.id === latestQuiz.activeTeamId);
                    const nextTeamPos = curTeamPos >= 0 ? (curTeamPos + 1) % latestQuiz.teams.length : nextIdx % latestQuiz.teams.length;
                    latestQuiz.activeTeamId = latestQuiz.teams[nextTeamPos].id;
                  }
                }

                latestQuiz.updatedAt = new Date().toISOString();
                saveQuizzes();
                broadcastToQuiz(quizId, 'QUIZ_UPDATED', latestQuiz);
              }
            }, 2200);
          }
        }
      }

      broadcastToQuiz(quizId, 'TIMER_TICK', {
        remainingSeconds: quiz.timer.remainingSeconds,
        isRunning: quiz.timer.isRunning,
      });
    }
  }
  if (anyTimerChanged) {
    saveQuizzes();
  }
}, 1000);

// WebSocket connection handling
wss.on('connection', (ws: WebSocket) => {
  let currentClient: ClientMeta | null = null;

  ws.on('message', (data: string) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'JOIN_ROOM') {
        const { quizId, role, teamId } = msg;
        currentClient = { ws, quizId, role, teamId };
        connectedClients.add(currentClient);

        // Send current quiz state immediately
        const quiz = quizzes[quizId] || INITIAL_QUIZ;
        ws.send(JSON.stringify({ event: 'INITIAL_STATE', payload: quiz }));

        updateTeamOnlineStatuses(quizId);
      } else if (msg.type === 'BUZZ_PRESS') {
        const { quizId, teamId } = msg;
        handleBuzzerPress(quizId, teamId);
      }
    } catch (e) {
      console.error('WebSocket message parsing error:', e);
    }
  });

  ws.on('close', () => {
    if (currentClient) {
      connectedClients.delete(currentClient);
      updateTeamOnlineStatuses(currentClient.quizId);
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket client error:', err);
  });
});

// Authoritative atomic buzzer press registration
function handleBuzzerPress(quizId: string, teamId: string): { success: boolean; message: string; position?: number } {
  const quiz = quizzes[quizId];
  if (!quiz) return { success: false, message: 'Quiz not found' };

  const currentRound = quiz.rounds[quiz.currentRoundIndex];
  if (!currentRound || currentRound.type !== 'buzzer') {
    return { success: false, message: 'Buzzer is only active during the Buzzer Round' };
  }

  if (!quiz.buzzer.isActive || quiz.buzzer.locked) {
    return { success: false, message: 'Buzzer is currently inactive or locked' };
  }

  // Deduplication: Has this team already buzzed for this question?
  const alreadyBuzzed = quiz.buzzer.queue.some((p) => p.teamId === teamId);
  if (alreadyBuzzed) {
    return { success: false, message: 'Already registered in the buzzer queue' };
  }

  const team = quiz.teams.find((t) => t.id === teamId);
  if (!team) return { success: false, message: 'Team not found' };

  const serverTime = Date.now();
  const latency = quiz.buzzer.activatedAt ? serverTime - quiz.buzzer.activatedAt : 0;
  const sequence = quiz.buzzer.queue.length + 1;

  const press: BuzzerPress = {
    sequence,
    teamId: team.id,
    teamName: team.name,
    institution: team.institution,
    timestamp: serverTime,
    latencyMs: latency,
    status: sequence === 1 ? 'first' : 'queued',
  };

  quiz.buzzer.queue.push(press);

  if (sequence === 1) {
    quiz.buzzer.currentTurnParticipantId = team.id;
  }

  // If maximum attempts reached, lock the buzzer
  if (quiz.buzzer.queue.length >= quiz.buzzer.maxAttempts) {
    quiz.buzzer.locked = true;
  }

  saveQuizzes();

  // Broadcast immediate buzzer update with authoritative queue
  broadcastToQuiz(quizId, 'BUZZER_UPDATE', {
    buzzer: quiz.buzzer,
    newPress: press,
  });

  return { success: true, message: 'Buzzer registered successfully', position: sequence };
}

// ---------------- REST API ROUTES ----------------

// Get all quizzes
app.get('/api/quizzes', (_req: Request, res: Response) => {
  res.json(Object.values(quizzes));
});

// Get single quiz
app.get('/api/quizzes/:id', (req: Request, res: Response) => {
  const quiz = quizzes[req.params.id];
  if (!quiz) {
    return res.status(404).json({ error: 'Quiz not found' });
  }
  res.json(quiz);
});

// Create new quiz
app.post('/api/quizzes', (req: Request, res: Response) => {
  const newQuiz: Quiz = req.body;
  if (!newQuiz.id || !newQuiz.title) {
    return res.status(400).json({ error: 'Invalid quiz payload' });
  }
  const teamCount = newQuiz.teams?.length || 1;
  newQuiz.rounds = (newQuiz.rounds || []).map((r) => {
    if (r.roundNumber === 1) return syncRoundOneQuestions(r, teamCount);
    if (r.type === 'rapid_fire' || r.roundNumber === 2) return syncRoundTwoQuestions(r, teamCount);
    return r;
  });
  quizzes[newQuiz.id] = newQuiz;
  saveQuizzes();
  res.json(newQuiz);
});

// Update quiz
app.put('/api/quizzes/:id', (req: Request, res: Response) => {
  const quizId = req.params.id;
  if (!quizzes[quizId]) {
    return res.status(404).json({ error: 'Quiz not found' });
  }
  const prevQuiz = quizzes[quizId];
  const merged: Quiz = { ...prevQuiz, ...req.body, updatedAt: new Date().toISOString() };

  // When team count changes, ensure Round 1 & Round 2 scale to 5 questions per team and score maps stay intact
  if (Array.isArray(req.body.teams)) {
    const newTeamCount = merged.teams.length;
    if (newTeamCount !== prevQuiz.teams.length) {
      merged.rounds = merged.rounds.map((r) => {
        if (r.roundNumber === 1) return syncRoundOneQuestions(r, newTeamCount);
        if (r.type === 'rapid_fire' || r.roundNumber === 2) return syncRoundTwoQuestions(r, newTeamCount);
        return r;
      });
      const activeRound = merged.rounds[merged.currentRoundIndex];
      if (activeRound && merged.currentQuestionIndex >= activeRound.questions.length) {
        merged.currentQuestionIndex = Math.max(0, activeRound.questions.length - 1);
      }
    }
    merged.teams.forEach((t) => {
      if (merged.totalScores[t.id] === undefined) merged.totalScores[t.id] = 0;
      if (!merged.roundScores[t.id]) merged.roundScores[t.id] = {};
      merged.rounds.forEach((r) => {
        if (merged.roundScores[t.id][r.id] === undefined) merged.roundScores[t.id][r.id] = 0;
      });
    });
    if (!merged.teams.some((t) => t.id === merged.activeTeamId) && merged.teams.length > 0) {
      merged.activeTeamId = merged.teams[0].id;
    }
  }

  quizzes[quizId] = merged;
  saveQuizzes();
  broadcastToQuiz(quizId, 'QUIZ_UPDATED', quizzes[quizId]);
  res.json(quizzes[quizId]);
});

// Duplicate quiz
app.post('/api/quizzes/:id/duplicate', (req: Request, res: Response) => {
  const source = quizzes[req.params.id];
  if (!source) return res.status(404).json({ error: 'Source quiz not found' });

  const newId = `quiz_${Date.now()}`;
  const code = `MIND${Math.floor(10 + Math.random() * 90)}`;
  const cloned: Quiz = JSON.parse(JSON.stringify(source));
  cloned.id = newId;
  cloned.code = code;
  cloned.title = `${source.title} (Copy)`;
  cloned.status = 'draft';
  cloned.createdAt = new Date().toISOString();
  cloned.updatedAt = new Date().toISOString();

  // Reset scores and active state
  cloned.currentRoundIndex = 0;
  cloned.currentQuestionIndex = 0;
  cloned.timer.isRunning = false;
  cloned.buzzer.isActive = false;
  cloned.buzzer.queue = [];
  cloned.manualScoreCorrections = [];

  const zeroScores: Record<string, number> = {};
  const zeroRoundScores: Record<string, Record<string, number>> = {};
  cloned.teams.forEach((t) => {
    zeroScores[t.id] = 0;
    zeroRoundScores[t.id] = {};
    cloned.rounds.forEach((r) => {
      zeroRoundScores[t.id][r.id] = 0;
    });
  });
  cloned.totalScores = zeroScores;
  cloned.roundScores = zeroRoundScores;

  quizzes[newId] = cloned;
  saveQuizzes();
  res.json(cloned);
});

// Delete quiz
app.delete('/api/quizzes/:id', (req: Request, res: Response) => {
  const quizId = req.params.id;
  if (!quizzes[quizId]) {
    return res.status(404).json({ error: 'Quiz not found' });
  }
  delete quizzes[quizId];
  saveQuizzes();
  res.json({ success: true });
});

// Authoritative Buzzer Press Endpoint (supports HTTP or WebSocket)
app.post('/api/buzzer/press', (req: Request, res: Response) => {
  const { quizId, teamId } = req.body;
  if (!quizId || !teamId) {
    return res.status(400).json({ error: 'quizId and teamId are required' });
  }
  const result = handleBuzzerPress(quizId, teamId);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// Action Dispatcher for Quizmaster and Admin
app.post('/api/quizzes/:id/action', (req: Request, res: Response) => {
  const quizId = req.params.id;
  const quiz = quizzes[quizId];
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

  const { type, payload } = req.body;

  switch (type) {
    case 'START_QUIZ':
      quiz.status = 'active';
      quiz.isPaused = false;
      break;

    case 'PAUSE_QUIZ':
      quiz.isPaused = true;
      quiz.timer.isRunning = false;
      break;

    case 'RESUME_QUIZ':
      quiz.isPaused = false;
      break;

    case 'END_QUIZ':
      quiz.status = 'completed';
      quiz.timer.isRunning = false;
      quiz.buzzer.isActive = false;
      quiz.displayScreen = 'winner';
      break;

    case 'SET_DISPLAY_SCREEN':
      quiz.displayScreen = payload.screen;
      break;

    case 'START_ROUND_INTRO': {
      const rIdx = Number(payload?.roundIndex ?? quiz.currentRoundIndex);
      if (rIdx >= 0 && rIdx < quiz.rounds.length) {
        quiz.status = 'active';
        quiz.isPaused = false;
        quiz.currentRoundIndex = rIdx;
        quiz.currentQuestionIndex = 0;
        quiz.displayScreen = 'round_intro';
        quiz.answerRevealed = false;
        quiz.optionsRevealed = false;
        quiz.selectedOptionIndex = null;
        quiz.rapidFirePhase = 'ready';
        quiz.rapidFireLotResults = {};
        quiz.currentQuestionAnswers = {};
        quiz.timer.isRunning = false;
        const round = quiz.rounds[rIdx];
        quiz.timer.totalSeconds = round.timing.durationSeconds;
        quiz.timer.remainingSeconds = round.timing.durationSeconds;
        quiz.buzzer.isActive = false;
        quiz.buzzer.queue = [];
        quiz.buzzer.locked = false;

        const isRotating =
          round.roundNumber === 1 ||
          round.roundNumber === 4 ||
          round.roundNumber === 5 ||
          round.presentationOrder === 'horizontal' ||
          round.type === 'rapid_fire';
        if (isRotating && quiz.teams.length > 0) {
          quiz.activeTeamId = quiz.teams[0].id;
        }
      }
      break;
    }

    case 'START_ROUND_QUESTIONS': {
      const rIdx = Number(payload?.roundIndex ?? quiz.currentRoundIndex);
      if (rIdx >= 0 && rIdx < quiz.rounds.length) {
        quiz.status = 'active';
        quiz.isPaused = false;
        quiz.currentRoundIndex = rIdx;
        quiz.currentQuestionIndex = 0;
        quiz.displayScreen = 'question';
        quiz.answerRevealed = false;
        quiz.optionsRevealed = false;
        quiz.selectedOptionIndex = null;
        quiz.rapidFirePhase = 'ready';
        quiz.rapidFireLotResults = {};
        quiz.currentQuestionAnswers = {};
        const round = quiz.rounds[rIdx];
        quiz.timer.totalSeconds = round.timing.durationSeconds;
        quiz.timer.remainingSeconds = round.timing.durationSeconds;
        quiz.timer.isRunning = false;
        quiz.buzzer.isActive = false;
        quiz.buzzer.queue = [];
        quiz.buzzer.locked = false;

        const isRotating =
          round.roundNumber === 1 ||
          round.roundNumber === 4 ||
          round.roundNumber === 5 ||
          round.presentationOrder === 'horizontal' ||
          round.type === 'rapid_fire';
        if (isRotating && quiz.teams.length > 0) {
          quiz.activeTeamId = quiz.teams[0].id;
        }
      }
      break;
    }

    case 'RAPID_FIRE_START_LOT': {
      const round = quiz.rounds[quiz.currentRoundIndex];
      if (!round || round.type !== 'rapid_fire') break;
      const teamIdx = Math.max(0, quiz.teams.findIndex((t) => t.id === quiz.activeTeamId));
      const lotStart = Math.min(teamIdx * 5, Math.max(0, round.questions.length - 1));
      const lotEnd = Math.min(lotStart + 4, Math.max(0, round.questions.length - 1));
      if (quiz.currentQuestionIndex < lotStart || quiz.currentQuestionIndex > lotEnd) {
        quiz.currentQuestionIndex = lotStart;
      }
      quiz.rapidFireLotResults = {};
      quiz.status = 'active';
      quiz.isPaused = false;
      quiz.displayScreen = 'question';
      quiz.rapidFirePhase = 'active';
      quiz.timer.isRunning = true;
      quiz.timer.startedAtServer = Date.now();
      break;
    }

    case 'RAPID_FIRE_NEXT_QUESTION': {
      const round = quiz.rounds[quiz.currentRoundIndex];
      if (!round || round.type !== 'rapid_fire') break;
      const teamIdx = Math.max(0, quiz.teams.findIndex((t) => t.id === quiz.activeTeamId));
      const lotStart = Math.min(teamIdx * 5, Math.max(0, round.questions.length - 1));
      const lotEnd = Math.min(lotStart + 4, Math.max(0, round.questions.length - 1));
      const curQ = round.questions[quiz.currentQuestionIndex];
      if (!quiz.rapidFireLotResults) quiz.rapidFireLotResults = {};
      if (curQ && !quiz.rapidFireLotResults[curQ.id]) {
        quiz.rapidFireLotResults[curQ.id] = 'unanswered';
      }
      if (quiz.currentQuestionIndex < lotEnd) {
        quiz.currentQuestionIndex += 1;
        quiz.answerRevealed = false;
        quiz.currentQuestionAnswers = {};
      } else {
        quiz.timer.isRunning = false;
        quiz.rapidFirePhase = 'lot_done';
      }
      break;
    }

    case 'RAPID_FIRE_NEXT_TEAM': {
      const round = quiz.rounds[quiz.currentRoundIndex];
      if (!round || round.type !== 'rapid_fire' || quiz.teams.length === 0) break;
      const curIdx = quiz.teams.findIndex((t) => t.id === quiz.activeTeamId);
      const nextTeamIdx = curIdx >= 0 && curIdx + 1 < quiz.teams.length ? curIdx + 1 : 0;
      quiz.activeTeamId = quiz.teams[nextTeamIdx].id;
      quiz.currentQuestionIndex = Math.min(nextTeamIdx * 5, Math.max(0, round.questions.length - 1));
      quiz.answerRevealed = false;
      quiz.optionsRevealed = false;
      quiz.selectedOptionIndex = null;
      quiz.currentQuestionAnswers = {};
      quiz.rapidFireLotResults = {};
      quiz.timer.totalSeconds = round.timing.durationSeconds;
      quiz.timer.remainingSeconds = round.timing.durationSeconds;
      quiz.timer.isRunning = false;
      quiz.rapidFirePhase = 'ready';
      quiz.displayScreen = 'question';
      break;
    }

    case 'REVEAL_OPTIONS': {
      quiz.optionsRevealed = true;
      quiz.timer.isRunning = true;
      quiz.timer.startedAtServer = Date.now();
      break;
    }

    case 'SELECT_MCQ_OPTION': {
      const { optionIndex } = payload;
      const currentRound = quiz.rounds[quiz.currentRoundIndex];
      const currentQuestion = currentRound?.questions[quiz.currentQuestionIndex];
      if (!currentRound || !currentQuestion) break;

      const teamId = quiz.activeTeamId || quiz.teams[0]?.id;
      quiz.selectedOptionIndex = optionIndex;
      quiz.optionsRevealed = true;
      quiz.answerRevealed = true;
      quiz.timer.isRunning = false;

      const isCorrect = optionIndex === currentQuestion.correctOptionIndex;
      const status = isCorrect ? 'correct' : 'incorrect';
      quiz.currentQuestionAnswers[teamId] = status;

      // In Round 1, 3, 5: correct awards marksCorrect (10), incorrect awards 0
      const delta = isCorrect ? currentRound.scoring.marksCorrect : 0;
      if (!quiz.roundScores[teamId]) quiz.roundScores[teamId] = {};
      quiz.roundScores[teamId][currentRound.id] = (quiz.roundScores[teamId][currentRound.id] || 0) + delta;
      quiz.totalScores[teamId] = (quiz.totalScores[teamId] || 0) + delta;
      break;
    }

    case 'SET_ROUND': {
      const rIdx = Number(payload.roundIndex);
      if (rIdx >= 0 && rIdx < quiz.rounds.length) {
        quiz.currentRoundIndex = rIdx;
        quiz.currentQuestionIndex = 0;
        quiz.answerRevealed = false;
        quiz.optionsRevealed = false;
        quiz.selectedOptionIndex = null;
        quiz.rapidFirePhase = 'ready';
        quiz.rapidFireLotResults = {};
        quiz.currentQuestionAnswers = {};
        const round = quiz.rounds[rIdx];
        quiz.timer.totalSeconds = round.timing.durationSeconds;
        quiz.timer.remainingSeconds = round.timing.durationSeconds;
        quiz.timer.isRunning = false;
        quiz.buzzer.isActive = false;
        quiz.buzzer.queue = [];
        quiz.buzzer.locked = false;

        const isRotating =
          round.roundNumber === 1 ||
          round.roundNumber === 4 ||
          round.roundNumber === 5 ||
          round.presentationOrder === 'horizontal' ||
          round.type === 'rapid_fire';
        if (isRotating && quiz.teams.length > 0) {
          quiz.activeTeamId = quiz.teams[0].id;
        }

        // In Buzzer Round, automatically show the QR Join Lobby before starting questions
        if (round.type === 'buzzer') {
          quiz.displayScreen = 'round_intro';
        }
      }
      break;
    }

    case 'SET_QUESTION': {
      const qIdx = Number(payload.questionIndex);
      const currentRound = quiz.rounds[quiz.currentRoundIndex];
      if (currentRound && qIdx >= 0 && qIdx < currentRound.questions.length) {
        const prevQIdx = quiz.currentQuestionIndex;
        quiz.currentQuestionIndex = qIdx;
        quiz.answerRevealed = false;
        quiz.optionsRevealed = false;
        quiz.selectedOptionIndex = null;
        quiz.currentQuestionAnswers = {};

        // In round 1, round 4, and round 5: questions are asked one by one to each team.
        // As we move from question one to question two, the team turn changes!
        // In round 3 ONLY: all five questions are asked one after the other in one lot to the same team.
        // In rapid_fire: each consecutive 5-question lot (Q1-Q5, Q6-Q10, ...) belongs to a distinct team.
        const isRotatingRound =
          currentRound.roundNumber === 1 ||
          currentRound.roundNumber === 4 ||
          currentRound.roundNumber === 5 ||
          (currentRound.roundNumber !== 3 && currentRound.presentationOrder === 'horizontal');

        if (currentRound.type === 'rapid_fire' && quiz.teams.length > 0) {
          const targetTeamIdx = Math.min(quiz.teams.length - 1, Math.floor(qIdx / 5));
          const targetTeam = quiz.teams[targetTeamIdx];
          const switchedTeam = targetTeam && targetTeam.id !== quiz.activeTeamId;
          if (targetTeam) {
            quiz.activeTeamId = targetTeam.id;
          }
          if (switchedTeam) {
            quiz.timer.totalSeconds = currentRound.timing.durationSeconds;
            quiz.timer.remainingSeconds = currentRound.timing.durationSeconds;
            quiz.timer.isRunning = false;
            quiz.rapidFirePhase = 'ready';
            quiz.rapidFireLotResults = {};
          }
        } else if (isRotatingRound && quiz.teams.length > 0) {
          if (payload.teamId) {
            quiz.activeTeamId = payload.teamId;
          } else if (qIdx === prevQIdx + 1) {
            const curTeamPos = quiz.teams.findIndex((t) => t.id === quiz.activeTeamId);
            const nextTeamPos = curTeamPos >= 0 ? (curTeamPos + 1) % quiz.teams.length : qIdx % quiz.teams.length;
            quiz.activeTeamId = quiz.teams[nextTeamPos].id;
          } else {
            quiz.activeTeamId = quiz.teams[qIdx % quiz.teams.length].id;
          }
        } else if (payload.teamId) {
          quiz.activeTeamId = payload.teamId;
        }

        // In rapid fire (or per_participant_total), timing is continuous across the team's 5-question lot
        const isContinuousTimer = currentRound.type === 'rapid_fire' || currentRound.timing.timerType === 'per_participant_total';
        if (!isContinuousTimer) {
          quiz.timer.totalSeconds = currentRound.timing.durationSeconds;
          quiz.timer.remainingSeconds = currentRound.timing.durationSeconds;
          quiz.timer.isRunning = false;
        }

        if (currentRound.type === 'buzzer') {
          quiz.buzzer.isActive = false;
          quiz.buzzer.queue = [];
          quiz.buzzer.locked = false;
        }
      }
      break;
    }

    case 'SET_ACTIVE_TEAM': {
      quiz.activeTeamId = payload.teamId;
      const currentRound = quiz.rounds[quiz.currentRoundIndex];
      if (
        currentRound &&
        (payload.resetToFirstQuestion ||
          currentRound.type === 'rapid_fire' ||
          currentRound.timing.timerType === 'per_participant_total')
      ) {
        const teamIdx = Math.max(0, quiz.teams.findIndex((t) => t.id === payload.teamId));
        const startIdx =
          currentRound.type === 'rapid_fire'
            ? Math.min(teamIdx * 5, Math.max(0, currentRound.questions.length - 1))
            : 0;
        quiz.currentQuestionIndex = startIdx;
        quiz.answerRevealed = false;
        quiz.optionsRevealed = false;
        quiz.selectedOptionIndex = null;
        quiz.currentQuestionAnswers = {};
        quiz.timer.totalSeconds = currentRound.timing.durationSeconds;
        quiz.timer.remainingSeconds = currentRound.timing.durationSeconds;
        quiz.timer.isRunning = false;
        if (currentRound.type === 'rapid_fire') {
          quiz.rapidFirePhase = 'ready';
          quiz.rapidFireLotResults = {};
        }
      }
      break;
    }

    case 'TIMER_START': {
      quiz.timer.isRunning = true;
      quiz.timer.startedAtServer = Date.now();
      const curRound = quiz.rounds[quiz.currentRoundIndex];
      if (curRound?.type === 'rapid_fire' && quiz.rapidFirePhase !== 'lot_done') {
        quiz.rapidFirePhase = 'active';
      }
      break;
    }

    case 'TIMER_PAUSE':
      quiz.timer.isRunning = false;
      break;

    case 'TIMER_RESET': {
      const curRound = quiz.rounds[quiz.currentRoundIndex];
      const dur = curRound ? curRound.timing.durationSeconds : 30;
      quiz.timer.totalSeconds = dur;
      quiz.timer.remainingSeconds = dur;
      quiz.timer.isRunning = false;
      if (curRound?.type === 'rapid_fire') {
        quiz.rapidFirePhase = 'ready';
      }
      break;
    }

    case 'TIMER_ADJUST':
      quiz.timer.remainingSeconds = Math.max(0, quiz.timer.remainingSeconds + (payload.deltaSeconds || 0));
      break;

    case 'BUZZER_ACTIVATE': {
      const currentRound = quiz.rounds[quiz.currentRoundIndex];
      if (currentRound && currentRound.type !== 'buzzer') {
        return res.status(400).json({ error: 'Buzzer can only be activated during the Buzzer Round' });
      }
      quiz.buzzer.isActive = true;
      quiz.buzzer.activatedAt = Date.now();
      quiz.buzzer.queue = [];
      quiz.buzzer.locked = false;
      quiz.buzzer.currentTurnParticipantId = null;
      if (payload?.timeAllowedSeconds) {
        quiz.buzzer.timeAllowedSeconds = payload.timeAllowedSeconds;
      }
      break;
    }

    case 'BUZZER_DEACTIVATE':
      quiz.buzzer.isActive = false;
      quiz.buzzer.locked = true;
      break;

    case 'BUZZER_PASS_NEXT': {
      const q = quiz.buzzer.queue;
      const currentIdx = q.findIndex((p) => p.teamId === quiz.buzzer.currentTurnParticipantId);
      if (currentIdx !== -1 && currentIdx + 1 < q.length) {
        quiz.buzzer.currentTurnParticipantId = q[currentIdx + 1].teamId;
      } else {
        quiz.buzzer.currentTurnParticipantId = null;
      }
      break;
    }

    case 'BUZZER_CLEAR':
      quiz.buzzer.queue = [];
      quiz.buzzer.currentTurnParticipantId = null;
      quiz.buzzer.locked = false;
      break;

    case 'REVEAL_ANSWER':
      quiz.answerRevealed = true;
      break;

    case 'EVALUATE_ANSWER': {
      const { teamId, status, customDelta, autoAdvance } = payload;
      const round = quiz.rounds[quiz.currentRoundIndex];
      if (!round) break;

      let delta = 0;
      if (typeof customDelta === 'number') {
        delta = customDelta;
      } else if (status === 'correct') {
        delta = round.scoring.marksCorrect;
      } else if (status === 'incorrect') {
        delta = round.scoring.marksIncorrect;
      } else if (status === 'passed' || status === 'unanswered') {
        delta = round.scoring.marksUnanswered;
      }

      // Record answer state
      quiz.currentQuestionAnswers[teamId] = status;

      // Update round score
      if (!quiz.roundScores[teamId]) quiz.roundScores[teamId] = {};
      quiz.roundScores[teamId][round.id] = (quiz.roundScores[teamId][round.id] || 0) + delta;

      // Update total score
      quiz.totalScores[teamId] = (quiz.totalScores[teamId] || 0) + delta;

      // In rapid-fire round, record question outcome, auto-advance within team's 5-question lot, and stop timer when lot completes
      if (round.type === 'rapid_fire') {
        const currentQ = round.questions[quiz.currentQuestionIndex];
        if (currentQ) {
          if (!quiz.rapidFireLotResults) quiz.rapidFireLotResults = {};
          quiz.rapidFireLotResults[currentQ.id] = status;
        }
        const teamIdx = Math.max(0, quiz.teams.findIndex((t) => t.id === quiz.activeTeamId));
        const lotStart = Math.min(teamIdx * 5, Math.max(0, round.questions.length - 1));
        const lotEnd = Math.min(lotStart + 4, Math.max(0, round.questions.length - 1));
        if (quiz.currentQuestionIndex < lotEnd) {
          quiz.currentQuestionIndex += 1;
          quiz.answerRevealed = false;
          quiz.currentQuestionAnswers = {};
        } else {
          quiz.timer.isRunning = false;
          quiz.rapidFirePhase = 'lot_done';
        }
      } else if (autoAdvance) {
        if (quiz.currentQuestionIndex + 1 < round.questions.length) {
          quiz.currentQuestionIndex += 1;
          quiz.answerRevealed = false;
          quiz.currentQuestionAnswers = {};
        } else {
          quiz.timer.isRunning = false;
        }
      }

      // Update buzzer press status if in buzzer queue
      const buzzPress = quiz.buzzer.queue.find((p) => p.teamId === teamId);
      if (buzzPress) {
        buzzPress.status = status === 'correct' ? 'answered_correct' : 'answered_incorrect';
        if (status === 'incorrect' && round.scoring.passToNextInQueue) {
          const curIdx = quiz.buzzer.queue.findIndex((p) => p.teamId === teamId);
          if (curIdx + 1 < quiz.buzzer.queue.length) {
            quiz.buzzer.currentTurnParticipantId = quiz.buzzer.queue[curIdx + 1].teamId;
          }
        }
      }
      break;
    }

    case 'MANUAL_SCORE_CORRECTION': {
      const { teamId, delta, reason, quizmaster } = payload;
      const round = quiz.rounds[quiz.currentRoundIndex];
      if (!round) break;

      if (!quiz.roundScores[teamId]) quiz.roundScores[teamId] = {};
      quiz.roundScores[teamId][round.id] = (quiz.roundScores[teamId][round.id] || 0) + delta;
      quiz.totalScores[teamId] = (quiz.totalScores[teamId] || 0) + delta;

      const audit: ScoreAuditEntry = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        teamId,
        teamName: quiz.teams.find((t) => t.id === teamId)?.name || teamId,
        roundId: round.id,
        roundName: round.name,
        questionId: round.questions[quiz.currentQuestionIndex]?.id,
        delta,
        newTotal: quiz.totalScores[teamId],
        reason: reason || 'Manual adjustment by quizmaster',
        quizmaster: quizmaster || quiz.quizmasterName,
      };

      quiz.manualScoreCorrections.push(audit);
      break;
    }

    case 'RESET_QUIZ_SCORES': {
      quiz.teams.forEach((t) => {
        quiz.totalScores[t.id] = 0;
        quiz.roundScores[t.id] = {};
        quiz.rounds.forEach((r) => {
          quiz.roundScores[t.id][r.id] = 0;
        });
      });
      quiz.manualScoreCorrections = [];
      quiz.currentRoundIndex = 0;
      quiz.currentQuestionIndex = 0;
      quiz.displayScreen = 'welcome';
      quiz.answerRevealed = false;
      quiz.optionsRevealed = false;
      quiz.selectedOptionIndex = null;
      quiz.rapidFirePhase = 'ready';
      quiz.rapidFireLotResults = {};
      quiz.currentQuestionAnswers = {};
      const firstDur = quiz.rounds[0]?.timing.durationSeconds || 30;
      quiz.timer.totalSeconds = firstDur;
      quiz.timer.remainingSeconds = firstDur;
      quiz.timer.isRunning = false;
      quiz.activeTeamId = quiz.teams[0]?.id || null;
      quiz.buzzer.queue = [];
      quiz.buzzer.isActive = false;
      quiz.buzzer.locked = false;
      break;
    }

    default:
      return res.status(400).json({ error: `Unknown action type: ${type}` });
  }

  quiz.updatedAt = new Date().toISOString();
  saveQuizzes();
  broadcastToQuiz(quizId, 'QUIZ_UPDATED', quiz);
  res.json(quiz);
});

// AI Question Generation endpoint using @google/genai
app.post('/api/ai/generate-questions', async (req: Request, res: Response) => {
  const { topic = 'Pharmaceutical Sciences', roundType = 'basic', count = 3, difficulty = 'medium' } = req.body;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a distinguished professor and scientific quizmaster creating verified, high-caliber quiz questions for the MIND EXPEDITION national competition.
Topic: "${topic}"
Round Type: "${roundType}"
Number of questions: ${count}
Difficulty level: ${difficulty}

Return ONLY valid JSON (an array of objects) with NO surrounding markdown backticks. Each object must have:
- "text": string (crisp, unambiguous question text)
- "answer": string (accurate answer key)
- "explanation": string (scientific explanation or context)
- "category": string (e.g., Pharmaceutics, Medicinal Chemistry, Pharmacology, Regulatory Affairs)
- "difficulty": "${difficulty}"
- "sourceUrl": string (legitimate scientific or regulatory reference URL e.g. WHO, CDSCO, FDA, PubMed)
- "publicationDate": string (YYYY-MM-DD)`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text || '';
      const cleanJson = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const generated: Partial<Question>[] = JSON.parse(cleanJson);

      const questionsWithIds: Question[] = generated.map((q, idx) => ({
        id: `ai_q_${Date.now()}_${idx}`,
        text: q.text || 'Question',
        type: 'verbal',
        category: q.category || topic,
        difficulty: (q.difficulty as 'easy' | 'medium' | 'hard') || 'medium',
        answer: q.answer || 'Answer',
        explanation: q.explanation || '',
        sourceUrl: q.sourceUrl || 'https://cdsco.gov.in',
        publicationDate: q.publicationDate || new Date().toISOString().split('T')[0],
      }));

      return res.json({ questions: questionsWithIds });
    }
  } catch (err) {
    console.warn('AI Generation via Gemini SDK failed or key not configured, falling back to curated bank:', err);
  }

  // Curated scientific fallback
  const fallbackBank: Question[] = [
    {
      id: `fallback_${Date.now()}_1`,
      text: 'Which polymorphic form of a pharmaceutical crystal typically demonstrates higher solubility and dissolution rate but lower thermodynamic stability?',
      type: 'verbal',
      category: 'Solid State Pharmaceutics',
      difficulty: 'medium',
      answer: 'Metastable Form (or Amorphous Form)',
      explanation: 'Metastable polymorphs possess higher free energy and lattice entropy, leading to enhanced aqueous solubility.',
      sourceUrl: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7120485/',
      publicationDate: '2023-04-12',
    },
    {
      id: `fallback_${Date.now()}_2`,
      text: 'What is the name of the biological membrane transporter whose active overexpression confers multidrug resistance against chemotherapeutic agents?',
      type: 'verbal',
      category: 'Pharmacology',
      difficulty: 'hard',
      answer: 'P-glycoprotein (P-gp / MDR1 / ABCB1)',
      explanation: 'P-gp is an ATP-dependent efflux pump that exports amphiphilic xenobiotics across cell membranes.',
      sourceUrl: 'https://www.nature.com/articles/s41573-021-00276-8',
      publicationDate: '2023-09-18',
    },
    {
      id: `fallback_${Date.now()}_3`,
      text: 'Which United States Pharmacopeia (USP) chapter specifies mandatory standards for Pharmaceutical Compounding – Sterile Preparations?',
      type: 'verbal',
      category: 'Quality Assurance & Regulatory',
      difficulty: 'hard',
      answer: 'USP Chapter <797>',
      explanation: 'USP <797> sets legal standards for sterile compounding to prevent contamination and infection in compounded preparations.',
      sourceUrl: 'https://www.usp.org/compounding/general-chapter-797',
      publicationDate: '2023-11-01',
    },
  ];

  res.json({ questions: fallbackBank.slice(0, count) });
});

// Explicit JSON 404 handler for all unmatched API routes so they never fall through to HTML
app.all('/api/*', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'API route not found' });
});

// Global Express JSON error handler middleware
app.use((err: any, _req: Request, res: Response, next: any) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error('Express API error:', err);
  res.status(500).json({ error: err?.message || 'Internal server error' });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`MIND EXPEDITION Live Quiz Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
