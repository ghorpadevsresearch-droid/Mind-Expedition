import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Quiz, RoleType, BuzzerPress } from '../types/quiz';
import { soundManager } from '../utils/sound';

interface QuizContextType {
  quizzes: Quiz[];
  activeQuiz: Quiz | null;
  activeQuizId: string;
  role: RoleType;
  mobileTeamId: string;
  isConnected: boolean;
  isSoundMuted: boolean;
  soundVolume: number;
  lastBuzzerPress: BuzzerPress | null;
  setRole: (role: RoleType) => void;
  setActiveQuizId: (quizId: string) => void;
  setMobileTeamId: (teamId: string) => void;
  toggleMute: () => void;
  setSoundVolume: (vol: number) => void;
  dispatchAction: (type: string, payload?: unknown) => Promise<void>;
  pressBuzzer: () => Promise<{ success: boolean; message: string; position?: number }>;
  reloadQuizzes: () => Promise<void>;
  createQuiz: (newQuiz: Quiz) => Promise<Quiz>;
  updateQuizData: (updatedQuiz: Quiz) => Promise<void>;
  duplicateQuiz: (quizId: string) => Promise<Quiz>;
  deleteQuiz: (quizId: string) => Promise<void>;
}

const QuizContext = createContext<QuizContextType | null>(null);

export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuizId, setActiveQuizIdState] = useState<string>('quiz_pharm_2026');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [role, setRoleState] = useState<RoleType>('projector');
  const [mobileTeamId, setMobileTeamIdState] = useState<string>('team_alpha');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(false);
  const [soundVolume, setVolumeState] = useState<number>(0.8);
  const [lastBuzzerPress, setLastBuzzerPress] = useState<BuzzerPress | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const activeQuizRef = useRef<Quiz | null>(null);
  activeQuizRef.current = activeQuiz;

  // Read URL query params on load (e.g. ?role=mobile&team=team_alpha&quizId=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlRole = params.get('role') as RoleType | null;
    const urlQuiz = params.get('quizId');
    const urlTeam = params.get('teamId');

    if (urlRole && ['admin', 'quizmaster', 'projector', 'mobile'].includes(urlRole)) {
      setRoleState(urlRole);
    }
    if (urlQuiz) {
      setActiveQuizIdState(urlQuiz);
    }
    if (urlTeam) {
      setMobileTeamIdState(urlTeam);
    }
  }, []);

  const setActiveQuizId = (id: string) => {
    setActiveQuizIdState(id);
    const found = quizzes.find((q) => q.id === id);
    if (found) {
      setActiveQuiz(found);
    }
  };

  const setRole = (newRole: RoleType) => {
    setRoleState(newRole);
  };

  const setMobileTeamId = (teamId: string) => {
    setMobileTeamIdState(teamId);
  };

  const toggleMute = () => {
    const next = !isSoundMuted;
    setIsSoundMuted(next);
    soundManager.setMute(next);
  };

  const setSoundVolume = (vol: number) => {
    setVolumeState(vol);
    soundManager.setVolume(vol);
  };

  // Fetch initial quizzes from REST API
  const reloadQuizzes = useCallback(async () => {
    try {
      const res = await fetch('/api/quizzes');
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const list: Quiz[] = await res.json();
        setQuizzes(list);
        const current = list.find((q) => q.id === activeQuizId) || list[0] || null;
        if (current) {
          setActiveQuiz(current);
          if (current.id !== activeQuizId) {
            setActiveQuizIdState(current.id);
          }
        }
      }
    } catch (e) {
      console.warn('Waiting for quiz server to synchronize:', e);
    }
  }, [activeQuizId]);

  useEffect(() => {
    reloadQuizzes();
  }, [reloadQuizzes]);

  // Connect WebSocket and subscribe to active quiz room
  useEffect(() => {
    let isMounted = true;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    function connectWs() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        if (!isMounted) return;
        setIsConnected(true);
        // Join quiz room
        socket.send(
          JSON.stringify({
            type: 'JOIN_ROOM',
            quizId: activeQuizId,
            role,
            teamId: role === 'mobile' ? mobileTeamId : undefined,
          })
        );
      };

      socket.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const msg = JSON.parse(event.data);
          const { event: evType, payload } = msg;

          if (evType === 'INITIAL_STATE' || evType === 'QUIZ_UPDATED') {
            const updated = payload as Quiz;
            if (updated.id === activeQuizId) {
              const previous = activeQuizRef.current;

              // Sound triggers based on state transitions
              if (!previous?.buzzer.isActive && updated.buzzer.isActive) {
                soundManager.playBuzzerActivate();
              }
              if (previous?.displayScreen !== updated.displayScreen) {
                if (updated.displayScreen === 'winner') {
                  soundManager.playWinnerFanfare();
                } else {
                  soundManager.playRoundTransition();
                }
              }

              setActiveQuiz(updated);
              setQuizzes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
            }
          } else if (evType === 'BUZZER_UPDATE') {
            const { buzzer, newPress } = payload;
            setActiveQuiz((prev) => {
              if (!prev) return prev;
              return { ...prev, buzzer };
            });
            if (newPress) {
              setLastBuzzerPress(newPress);
              soundManager.playBuzzPressed();
            }
          } else if (evType === 'TIMER_TICK') {
            const { remainingSeconds, isRunning } = payload;
            setActiveQuiz((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                timer: {
                  ...prev.timer,
                  remainingSeconds,
                  isRunning,
                },
              };
            });
            if (remainingSeconds <= 5 && remainingSeconds > 0 && isRunning) {
              soundManager.playTimerTick(true);
            } else if (remainingSeconds > 5 && isRunning && remainingSeconds % 2 === 0) {
              soundManager.playTimerTick(false);
            }
          }
        } catch (err) {
          console.error('Error handling WebSocket message:', err);
        }
      };

      socket.onclose = () => {
        if (!isMounted) return;
        setIsConnected(false);
        reconnectTimeout = setTimeout(connectWs, 2000);
      };

      socket.onerror = (err) => {
        console.warn('WebSocket encountered error:', err);
      };
    }

    connectWs();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [activeQuizId, role, mobileTeamId]);

  // Optimistic local state applier for instant zero-latency UI
  const applyOptimisticAction = (type: string, payload: any) => {
    setActiveQuiz((prev) => {
      if (!prev) return prev;
      const copy: Quiz = JSON.parse(JSON.stringify(prev));
      const currentRound = copy.rounds[copy.currentRoundIndex];

      switch (type) {
        case 'START_QUIZ':
          copy.status = 'active';
          copy.isPaused = false;
          break;
        case 'PAUSE_QUIZ':
          copy.isPaused = true;
          copy.timer.isRunning = false;
          break;
        case 'RESUME_QUIZ':
          copy.isPaused = false;
          break;
        case 'END_QUIZ':
          copy.status = 'completed';
          copy.timer.isRunning = false;
          copy.buzzer.isActive = false;
          copy.displayScreen = 'winner';
          break;
        case 'SET_DISPLAY_SCREEN':
          copy.displayScreen = payload.screen;
          break;
        case 'START_ROUND_INTRO': {
          const rIdx = Number(payload?.roundIndex ?? copy.currentRoundIndex);
          if (rIdx >= 0 && rIdx < copy.rounds.length) {
            copy.status = 'active';
            copy.isPaused = false;
            copy.currentRoundIndex = rIdx;
            copy.currentQuestionIndex = 0;
            copy.displayScreen = 'round_intro';
            copy.answerRevealed = false;
            copy.optionsRevealed = false;
            copy.selectedOptionIndex = null;
            copy.rapidFirePhase = 'ready';
            copy.rapidFireLotResults = {};
            copy.currentQuestionAnswers = {};
            copy.timer.isRunning = false;
            const r = copy.rounds[rIdx];
            copy.timer.totalSeconds = r.timing.durationSeconds;
            copy.timer.remainingSeconds = r.timing.durationSeconds;
            copy.buzzer.isActive = false;
            copy.buzzer.queue = [];
            copy.buzzer.locked = false;

            const isRotating =
              r.roundNumber === 1 ||
              r.roundNumber === 4 ||
              r.roundNumber === 5 ||
              r.presentationOrder === 'horizontal' ||
              r.type === 'rapid_fire';
            if (isRotating && copy.teams.length > 0) {
              copy.activeTeamId = copy.teams[0].id;
            }
          }
          break;
        }
        case 'START_ROUND_QUESTIONS': {
          const rIdx = Number(payload?.roundIndex ?? copy.currentRoundIndex);
          if (rIdx >= 0 && rIdx < copy.rounds.length) {
            copy.status = 'active';
            copy.isPaused = false;
            copy.currentRoundIndex = rIdx;
            copy.currentQuestionIndex = 0;
            copy.displayScreen = 'question';
            copy.answerRevealed = false;
            copy.optionsRevealed = false;
            copy.selectedOptionIndex = null;
            copy.rapidFirePhase = 'ready';
            copy.rapidFireLotResults = {};
            copy.currentQuestionAnswers = {};
            const r = copy.rounds[rIdx];
            copy.timer.totalSeconds = r.timing.durationSeconds;
            copy.timer.remainingSeconds = r.timing.durationSeconds;
            copy.timer.isRunning = false;
            copy.buzzer.isActive = false;
            copy.buzzer.queue = [];
            copy.buzzer.locked = false;

            const isRotating =
              r.roundNumber === 1 ||
              r.roundNumber === 4 ||
              r.roundNumber === 5 ||
              r.presentationOrder === 'horizontal' ||
              r.type === 'rapid_fire';
            if (isRotating && copy.teams.length > 0) {
              copy.activeTeamId = copy.teams[0].id;
            }
          }
          break;
        }
        case 'RAPID_FIRE_START_LOT': {
          if (currentRound && currentRound.type === 'rapid_fire') {
            const teamIdx = Math.max(0, copy.teams.findIndex((t) => t.id === copy.activeTeamId));
            const lotStart = Math.min(teamIdx * 5, Math.max(0, currentRound.questions.length - 1));
            const lotEnd = Math.min(lotStart + 4, Math.max(0, currentRound.questions.length - 1));
            if (copy.currentQuestionIndex < lotStart || copy.currentQuestionIndex > lotEnd) {
              copy.currentQuestionIndex = lotStart;
            }
            copy.rapidFireLotResults = {};
            copy.status = 'active';
            copy.isPaused = false;
            copy.displayScreen = 'question';
            copy.rapidFirePhase = 'active';
            copy.timer.isRunning = true;
          }
          break;
        }
        case 'RAPID_FIRE_NEXT_QUESTION': {
          if (currentRound && currentRound.type === 'rapid_fire') {
            const teamIdx = Math.max(0, copy.teams.findIndex((t) => t.id === copy.activeTeamId));
            const lotStart = Math.min(teamIdx * 5, Math.max(0, currentRound.questions.length - 1));
            const lotEnd = Math.min(lotStart + 4, Math.max(0, currentRound.questions.length - 1));
            const curQ = currentRound.questions[copy.currentQuestionIndex];
            if (!copy.rapidFireLotResults) copy.rapidFireLotResults = {};
            if (curQ && !copy.rapidFireLotResults[curQ.id]) {
              copy.rapidFireLotResults[curQ.id] = 'unanswered';
            }
            if (copy.currentQuestionIndex < lotEnd) {
              copy.currentQuestionIndex += 1;
              copy.answerRevealed = false;
              copy.currentQuestionAnswers = {};
            } else {
              copy.timer.isRunning = false;
              copy.rapidFirePhase = 'lot_done';
            }
          }
          break;
        }
        case 'RAPID_FIRE_NEXT_TEAM': {
          if (currentRound && currentRound.type === 'rapid_fire' && copy.teams.length > 0) {
            const curIdx = copy.teams.findIndex((t) => t.id === copy.activeTeamId);
            const nextTeamIdx = curIdx >= 0 && curIdx + 1 < copy.teams.length ? curIdx + 1 : 0;
            copy.activeTeamId = copy.teams[nextTeamIdx].id;
            copy.currentQuestionIndex = Math.min(nextTeamIdx * 5, Math.max(0, currentRound.questions.length - 1));
            copy.answerRevealed = false;
            copy.optionsRevealed = false;
            copy.selectedOptionIndex = null;
            copy.currentQuestionAnswers = {};
            copy.rapidFireLotResults = {};
            copy.timer.totalSeconds = currentRound.timing.durationSeconds;
            copy.timer.remainingSeconds = currentRound.timing.durationSeconds;
            copy.timer.isRunning = false;
            copy.rapidFirePhase = 'ready';
            copy.displayScreen = 'question';
          }
          break;
        }
        case 'REVEAL_OPTIONS':
          copy.optionsRevealed = true;
          copy.timer.isRunning = true;
          break;
        case 'SELECT_MCQ_OPTION': {
          const { optionIndex } = payload;
          if (currentRound) {
            const currentQ = currentRound.questions[copy.currentQuestionIndex];
            const teamId = copy.activeTeamId || copy.teams[0]?.id;
            copy.selectedOptionIndex = optionIndex;
            copy.optionsRevealed = true;
            copy.answerRevealed = true;
            copy.timer.isRunning = false;

            const isCorrect = currentQ && optionIndex === currentQ.correctOptionIndex;
            const status = isCorrect ? 'correct' : 'incorrect';
            copy.currentQuestionAnswers[teamId] = status;

            const delta = isCorrect ? currentRound.scoring.marksCorrect : 0;
            if (!copy.roundScores[teamId]) copy.roundScores[teamId] = {};
            copy.roundScores[teamId][currentRound.id] = (copy.roundScores[teamId][currentRound.id] || 0) + delta;
            copy.totalScores[teamId] = (copy.totalScores[teamId] || 0) + delta;
          }
          break;
        }
        case 'SET_ROUND': {
          const rIdx = Number(payload.roundIndex);
          if (rIdx >= 0 && rIdx < copy.rounds.length) {
            copy.currentRoundIndex = rIdx;
            copy.currentQuestionIndex = 0;
            copy.answerRevealed = false;
            copy.optionsRevealed = false;
            copy.selectedOptionIndex = null;
            copy.rapidFirePhase = 'ready';
            copy.rapidFireLotResults = {};
            copy.currentQuestionAnswers = {};
            const r = copy.rounds[rIdx];
            copy.timer.totalSeconds = r.timing.durationSeconds;
            copy.timer.remainingSeconds = r.timing.durationSeconds;
            copy.timer.isRunning = false;
            copy.buzzer.isActive = false;
            copy.buzzer.queue = [];
            copy.buzzer.locked = false;

            const isRotating =
              r.roundNumber === 1 ||
              r.roundNumber === 4 ||
              r.roundNumber === 5 ||
              r.presentationOrder === 'horizontal' ||
              r.type === 'rapid_fire';
            if (isRotating && copy.teams.length > 0) {
              copy.activeTeamId = copy.teams[0].id;
            }
            if (r.type === 'buzzer') {
              copy.displayScreen = 'round_intro';
            }
          }
          break;
        }
        case 'SET_QUESTION': {
          const qIdx = Number(payload.questionIndex);
          if (currentRound && qIdx >= 0 && qIdx < currentRound.questions.length) {
            const prevQIdx = copy.currentQuestionIndex;
            copy.currentQuestionIndex = qIdx;
            copy.answerRevealed = false;
            copy.optionsRevealed = false;
            copy.selectedOptionIndex = null;
            copy.currentQuestionAnswers = {};

            const isRotating =
              currentRound.roundNumber === 1 ||
              currentRound.roundNumber === 4 ||
              currentRound.roundNumber === 5 ||
              (currentRound.roundNumber !== 3 && currentRound.presentationOrder === 'horizontal');

            if (currentRound.type === 'rapid_fire' && copy.teams.length > 0) {
              const targetTeamIdx = Math.min(copy.teams.length - 1, Math.floor(qIdx / 5));
              const targetTeam = copy.teams[targetTeamIdx];
              const switchedTeam = targetTeam && targetTeam.id !== copy.activeTeamId;
              if (targetTeam) {
                copy.activeTeamId = targetTeam.id;
              }
              if (switchedTeam) {
                copy.timer.totalSeconds = currentRound.timing.durationSeconds;
                copy.timer.remainingSeconds = currentRound.timing.durationSeconds;
                copy.timer.isRunning = false;
                copy.rapidFirePhase = 'ready';
                copy.rapidFireLotResults = {};
              }
            } else if (isRotating && copy.teams.length > 0) {
              if (payload.teamId) {
                copy.activeTeamId = payload.teamId;
              } else if (qIdx === prevQIdx + 1) {
                const curTeamPos = copy.teams.findIndex((t) => t.id === copy.activeTeamId);
                const nextTeamPos = curTeamPos >= 0 ? (curTeamPos + 1) % copy.teams.length : qIdx % copy.teams.length;
                copy.activeTeamId = copy.teams[nextTeamPos].id;
              } else {
                copy.activeTeamId = copy.teams[qIdx % copy.teams.length].id;
              }
            } else if (payload.teamId) {
              copy.activeTeamId = payload.teamId;
            }

            const isContinuous =
              currentRound.type === 'rapid_fire' || currentRound.timing.timerType === 'per_participant_total';
            if (!isContinuous) {
              copy.timer.totalSeconds = currentRound.timing.durationSeconds;
              copy.timer.remainingSeconds = currentRound.timing.durationSeconds;
              copy.timer.isRunning = false;
            }
          }
          break;
        }
        case 'SET_ACTIVE_TEAM':
          copy.activeTeamId = payload.teamId;
          if (
            currentRound &&
            (payload.resetToFirstQuestion ||
              currentRound.type === 'rapid_fire' ||
              currentRound.timing.timerType === 'per_participant_total')
          ) {
            const teamIdx = Math.max(0, copy.teams.findIndex((t) => t.id === payload.teamId));
            const startIdx =
              currentRound.type === 'rapid_fire'
                ? Math.min(teamIdx * 5, Math.max(0, currentRound.questions.length - 1))
                : 0;
            copy.currentQuestionIndex = startIdx;
            copy.answerRevealed = false;
            copy.optionsRevealed = false;
            copy.selectedOptionIndex = null;
            copy.currentQuestionAnswers = {};
            copy.timer.totalSeconds = currentRound.timing.durationSeconds;
            copy.timer.remainingSeconds = currentRound.timing.durationSeconds;
            copy.timer.isRunning = false;
            if (currentRound.type === 'rapid_fire') {
              copy.rapidFirePhase = 'ready';
              copy.rapidFireLotResults = {};
            }
          }
          break;
        case 'TIMER_START':
          copy.timer.isRunning = true;
          if (currentRound?.type === 'rapid_fire' && copy.rapidFirePhase !== 'lot_done') {
            copy.rapidFirePhase = 'active';
          }
          break;
        case 'TIMER_PAUSE':
          copy.timer.isRunning = false;
          break;
        case 'TIMER_RESET':
          if (currentRound) {
            copy.timer.totalSeconds = currentRound.timing.durationSeconds;
            copy.timer.remainingSeconds = currentRound.timing.durationSeconds;
            copy.timer.isRunning = false;
            if (currentRound.type === 'rapid_fire') {
              copy.rapidFirePhase = 'ready';
            }
          }
          break;
        case 'REVEAL_ANSWER':
          copy.answerRevealed = true;
          break;
        case 'BUZZER_ACTIVATE':
          if (currentRound?.type === 'buzzer') {
            copy.buzzer.isActive = true;
            copy.buzzer.queue = [];
            copy.buzzer.locked = false;
          }
          break;
        case 'BUZZER_DEACTIVATE':
          copy.buzzer.isActive = false;
          copy.buzzer.locked = true;
          break;
        case 'BUZZER_CLEAR':
          copy.buzzer.queue = [];
          copy.buzzer.locked = false;
          break;
        case 'EVALUATE_ANSWER': {
          const { teamId, status, customDelta, autoAdvance } = payload;
          if (currentRound) {
            let delta = 0;
            if (typeof customDelta === 'number') delta = customDelta;
            else if (status === 'correct') delta = currentRound.scoring.marksCorrect;
            else if (status === 'incorrect') delta = currentRound.scoring.marksIncorrect;
            else if (status === 'passed') delta = currentRound.scoring.marksUnanswered;

            copy.currentQuestionAnswers[teamId] = status;
            if (!copy.roundScores[teamId]) copy.roundScores[teamId] = {};
            copy.roundScores[teamId][currentRound.id] =
              (copy.roundScores[teamId][currentRound.id] || 0) + delta;
            copy.totalScores[teamId] = (copy.totalScores[teamId] || 0) + delta;

            if (currentRound.type === 'rapid_fire') {
              const currentQ = currentRound.questions[copy.currentQuestionIndex];
              if (currentQ) {
                if (!copy.rapidFireLotResults) copy.rapidFireLotResults = {};
                copy.rapidFireLotResults[currentQ.id] = status;
              }
              const teamIdx = Math.max(0, copy.teams.findIndex((t) => t.id === copy.activeTeamId));
              const lotStart = Math.min(teamIdx * 5, Math.max(0, currentRound.questions.length - 1));
              const lotEnd = Math.min(lotStart + 4, Math.max(0, currentRound.questions.length - 1));
              if (copy.currentQuestionIndex < lotEnd) {
                copy.currentQuestionIndex += 1;
                copy.answerRevealed = false;
                copy.currentQuestionAnswers = {};
              } else {
                copy.timer.isRunning = false;
                copy.rapidFirePhase = 'lot_done';
              }
            } else if (autoAdvance) {
              if (copy.currentQuestionIndex + 1 < currentRound.questions.length) {
                copy.currentQuestionIndex += 1;
                copy.answerRevealed = false;
                copy.currentQuestionAnswers = {};
              } else {
                copy.timer.isRunning = false;
              }
            }
          }
          break;
        }
      }
      return copy;
    });
  };

  // Dispatch Quizmaster & Admin actions with immediate optimistic feedback
  const dispatchAction = async (type: string, payload: unknown = {}) => {
    if (!activeQuiz) return;

    // Apply locally first so UI responds instantaneously
    applyOptimisticAction(type, payload);

    try {
      const res = await fetch(`/api/quizzes/${activeQuiz.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const updated = await res.json();
        setActiveQuiz(updated);
        setQuizzes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
      } else {
        // Response was not JSON (e.g. server starting or proxy warmup), keep optimistic update
        console.warn('API returned non-JSON response during action dispatch, local state preserved.');
      }
    } catch (err) {
      console.warn('Network issue during action dispatch, local state preserved:', err);
    }
  };

  // Participant buzz in
  const pressBuzzer = async (): Promise<{ success: boolean; message: string; position?: number }> => {
    if (!activeQuiz) return { success: false, message: 'No active quiz' };
    if (!mobileTeamId) return { success: false, message: 'No team selected' };

    // Haptic vibration feedback on phones
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([80, 40, 80]);
      } catch {
        // ignore
      }
    }

    // Try WebSocket message first for lowest latency
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'BUZZ_PRESS',
          quizId: activeQuiz.id,
          teamId: mobileTeamId,
        })
      );
    }

    // Also call REST endpoint to guarantee authoritative completion
    try {
      const res = await fetch('/api/buzzer/press', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: activeQuiz.id, teamId: mobileTeamId }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        return data;
      }
      return { success: true, message: 'Buzzer registered via real-time sync' };
    } catch {
      return { success: true, message: 'Buzzer queued via real-time link' };
    }
  };

  // CRUD operations with content-type verification
  const createQuiz = async (newQuiz: Quiz): Promise<Quiz> => {
    try {
      const res = await fetch('/api/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newQuiz),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const created = await res.json();
        setQuizzes((prev) => [...prev, created]);
        setActiveQuiz(created);
        setActiveQuizIdState(created.id);
        return created;
      }
    } catch (err) {
      console.warn('Network issue creating quiz, saving locally:', err);
    }
    setQuizzes((prev) => [...prev, newQuiz]);
    setActiveQuiz(newQuiz);
    setActiveQuizIdState(newQuiz.id);
    return newQuiz;
  };

  const updateQuizData = async (updatedQuiz: Quiz): Promise<void> => {
    setActiveQuiz(updatedQuiz);
    setQuizzes((prev) => prev.map((q) => (q.id === updatedQuiz.id ? updatedQuiz : q)));

    try {
      const res = await fetch(`/api/quizzes/${updatedQuiz.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedQuiz),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const saved = await res.json();
        setActiveQuiz(saved);
        setQuizzes((prev) => prev.map((q) => (q.id === saved.id ? saved : q)));
      }
    } catch (err) {
      console.warn('Network issue saving quiz, local state updated:', err);
    }
  };

  const duplicateQuiz = async (quizId: string): Promise<Quiz> => {
    try {
      const res = await fetch(`/api/quizzes/${quizId}/duplicate`, {
        method: 'POST',
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const cloned = await res.json();
        setQuizzes((prev) => [...prev, cloned]);
        return cloned;
      }
    } catch (err) {
      console.warn('Network issue duplicating quiz:', err);
    }
    const source = quizzes.find((q) => q.id === quizId) || activeQuiz;
    const fallbackCloned: Quiz = JSON.parse(JSON.stringify(source));
    fallbackCloned.id = `quiz_${Date.now()}`;
    fallbackCloned.title = `${fallbackCloned.title} (Copy)`;
    setQuizzes((prev) => [...prev, fallbackCloned]);
    return fallbackCloned;
  };

  const deleteQuiz = async (quizId: string): Promise<void> => {
    setQuizzes((prev) => prev.filter((q) => q.id !== quizId));
    if (activeQuizId === quizId) {
      const remaining = quizzes.filter((q) => q.id !== quizId);
      if (remaining.length > 0) {
        setActiveQuiz(remaining[0]);
        setActiveQuizIdState(remaining[0].id);
      }
    }
    try {
      await fetch(`/api/quizzes/${quizId}`, { method: 'DELETE' });
    } catch (err) {
      console.warn('Network issue deleting quiz:', err);
    }
  };

  return (
    <QuizContext.Provider
      value={{
        quizzes,
        activeQuiz,
        activeQuizId,
        role,
        mobileTeamId,
        isConnected,
        isSoundMuted,
        soundVolume,
        lastBuzzerPress,
        setRole,
        setActiveQuizId,
        setMobileTeamId,
        toggleMute,
        setSoundVolume,
        dispatchAction,
        pressBuzzer,
        reloadQuizzes,
        createQuiz,
        updateQuizData,
        duplicateQuiz,
        deleteQuiz,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};
