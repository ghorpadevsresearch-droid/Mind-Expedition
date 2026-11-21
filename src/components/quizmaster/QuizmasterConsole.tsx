import React, { useState, useEffect } from 'react';
import { useQuiz } from '../../context/QuizContext';
import { MathText } from '../common/MathText';
import { soundManager } from '../../utils/sound';
import QRCode from 'qrcode';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  XCircle,
  SkipForward,
  Zap,
  Eye,
  Tv,
  Users,
  ChevronRight,
  ChevronLeft,
  Award,
  BookOpen,
  Edit3,
  ShieldAlert,
  Clock,
  Radio,
  Sparkles,
  QrCode,
  Smartphone,
} from 'lucide-react';

export const QuizmasterConsole: React.FC = () => {
  const { activeQuiz, dispatchAction } = useQuiz();

  const [showManualCorrectionModal, setShowManualCorrectionModal] = useState(false);
  const [correctionTeamId, setCorrectionTeamId] = useState('');
  const [correctionDelta, setCorrectionDelta] = useState<number>(0);
  const [correctionReason, setCorrectionReason] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const activeQuizId = activeQuiz?.id;
  useEffect(() => {
    if (!activeQuizId) return;
    const joinUrl = `${window.location.origin}?role=mobile&quizId=${activeQuizId}`;
    QRCode.toDataURL(joinUrl, {
      margin: 2,
      width: 220,
      color: { dark: '#0284c7', light: '#ffffff' },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation failed:', err));
  }, [activeQuizId]);

  if (!activeQuiz) {
    return (
      <div className="p-8 text-center text-slate-400">
        No active quiz selected. Select or create a quiz from Admin Panel.
      </div>
    );
  }

  const currentRound = activeQuiz.rounds[activeQuiz.currentRoundIndex] || null;
  const currentQuestion = currentRound?.questions[activeQuiz.currentQuestionIndex] || null;
  const activeTeam = activeQuiz.teams.find((t) => t.id === activeQuiz.activeTeamId) || activeQuiz.teams[0];

  const isRapidFire = currentRound?.type === 'rapid_fire';
  const isBuzzerRound = currentRound?.type === 'buzzer';
  const joinedTeamsCount = activeQuiz.teams.filter((t) => t.isOnline).length;
  const allTeamsJoined = activeQuiz.teams.length > 0 && joinedTeamsCount === activeQuiz.teams.length;

  const rapidFirePhase = activeQuiz.rapidFirePhase || 'ready';
  const activeTeamIndex = Math.max(
    0,
    activeQuiz.teams.findIndex((t) => t.id === activeTeam?.id)
  );
  const rapidFireLotStart = currentRound
    ? Math.min(activeTeamIndex * 5, Math.max(0, currentRound.questions.length - 1))
    : 0;
  const rapidFireLotEnd = currentRound
    ? Math.min(rapidFireLotStart + 4, Math.max(0, currentRound.questions.length - 1))
    : 0;
  const rapidFireQuestionInLot = Math.max(1, activeQuiz.currentQuestionIndex - rapidFireLotStart + 1);
  const rapidFireLotTotal = Math.max(1, rapidFireLotEnd - rapidFireLotStart + 1);
  const hasNextRapidFireTeam = activeTeamIndex + 1 < activeQuiz.teams.length;
  const nextRapidFireTeam = hasNextRapidFireTeam ? activeQuiz.teams[activeTeamIndex + 1] : null;

  // Answer Evaluation Handler with auto-advance for rapid-fire
  const handleEvaluate = async (status: 'correct' | 'incorrect' | 'passed') => {
    if (!activeTeam) return;
    if (isRapidFire && rapidFirePhase !== 'active') return;

    if (status === 'correct') {
      soundManager.playCorrect();
    } else if (status === 'incorrect') {
      soundManager.playIncorrect();
    }

    await dispatchAction('EVALUATE_ANSWER', {
      teamId: activeTeam.id,
      status,
      autoAdvance: isRapidFire,
    });
  };

  const handleRapidFireStartLot = async () => {
    soundManager.playRoundTransition();
    await dispatchAction('RAPID_FIRE_START_LOT');
  };

  const handleRapidFireNextQuestion = async () => {
    await dispatchAction('RAPID_FIRE_NEXT_QUESTION');
  };

  const handleRapidFireNextTeam = async () => {
    soundManager.playRoundTransition();
    await dispatchAction('RAPID_FIRE_NEXT_TEAM');
  };

  // MCQ Option Selection based on participant's verbal answer (Rounds 1, 3, 5)
  const handleSelectMcqOption = async (optionIndex: number) => {
    if (!currentQuestion) return;
    const isCorrect = optionIndex === currentQuestion.correctOptionIndex;
    if (isCorrect) {
      soundManager.playCorrect();
    } else {
      soundManager.playIncorrect();
    }
    await dispatchAction('SELECT_MCQ_OPTION', { optionIndex });
  };

  // Reveal options on stage and trigger the 30-second timer
  const handleRevealOptionsAndStartTimer = async () => {
    soundManager.playRoundTransition();
    await dispatchAction('REVEAL_OPTIONS');
  };

  // Start round introduction on stage projector
  const handleStartRoundIntro = async (rIdx?: number) => {
    soundManager.playRoundTransition();
    await dispatchAction('START_ROUND_INTRO', { roundIndex: rIdx ?? activeQuiz.currentRoundIndex });
  };

  // Start round questions (Q1) on stage projector
  const handleStartRoundQuestions = async (rIdx?: number) => {
    soundManager.playRoundTransition();
    await dispatchAction('START_ROUND_QUESTIONS', { roundIndex: rIdx ?? activeQuiz.currentRoundIndex });
  };

  // Next Question with rotation rule:
  // - In Round 1, 4, 5: questions asked one by one to each team (turn rotates sequentially)
  // - In Round 3 ONLY: all 5 questions asked in one lot to the same team
  const handleNextQuestion = async () => {
    if (!currentRound) return;
    const nextIdx = activeQuiz.currentQuestionIndex + 1;
    if (nextIdx >= currentRound.questions.length) return;

    const isRotatingRound =
      currentRound.roundNumber === 1 ||
      currentRound.roundNumber === 4 ||
      currentRound.roundNumber === 5 ||
      (currentRound.roundNumber !== 3 && currentRound.presentationOrder === 'horizontal');

    if (isRotatingRound && activeQuiz.teams.length > 0) {
      const curTeamPos = activeQuiz.teams.findIndex((t) => t.id === activeQuiz.activeTeamId);
      const nextTeamPos = curTeamPos >= 0 ? (curTeamPos + 1) % activeQuiz.teams.length : nextIdx % activeQuiz.teams.length;
      const nextTeam = activeQuiz.teams[nextTeamPos];
      await dispatchAction('SET_QUESTION', { questionIndex: nextIdx, teamId: nextTeam.id });
    } else {
      await dispatchAction('SET_QUESTION', { questionIndex: nextIdx, teamId: activeQuiz.activeTeamId });
    }
  };

  // For Round 3 (one-lot round): start the next team's 5-question lot from Q1
  const handleStartNextTeamLot = async () => {
    if (!activeQuiz.teams.length) return;
    const curTeamPos = activeQuiz.teams.findIndex((t) => t.id === activeQuiz.activeTeamId);
    const nextTeam = activeQuiz.teams[(curTeamPos + 1) % activeQuiz.teams.length];
    soundManager.playRoundTransition();
    await dispatchAction('SET_ACTIVE_TEAM', { teamId: nextTeam.id, resetToFirstQuestion: true });
  };

  // Submit manual score correction
  const handleScoreCorrectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionTeamId || correctionDelta === 0) return;

    await dispatchAction('MANUAL_SCORE_CORRECTION', {
      teamId: correctionTeamId,
      delta: correctionDelta,
      reason: correctionReason || 'Quizmaster discretionary score correction',
      quizmaster: activeQuiz.quizmasterName,
    });

    setShowManualCorrectionModal(false);
    setCorrectionDelta(0);
    setCorrectionReason('');
  };

  // Timer helpers
  const handleToggleTimer = () => {
    if (activeQuiz.timer.isRunning) {
      dispatchAction('TIMER_PAUSE');
    } else {
      dispatchAction('TIMER_START');
    }
  };

  const handleResetTimer = () => {
    dispatchAction('TIMER_RESET');
  };

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-950 text-slate-100 p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Control Bar: Quiz Status, Emergency Pause, Projector Screen Selector */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 rounded-xl bg-sky-950 border border-sky-800 text-sky-300 font-extrabold text-sm uppercase">
              Quizmaster: {activeQuiz.quizmasterName}
            </div>
            <div className="text-xs text-slate-400">
              Competition Status:{' '}
              <strong className="text-white uppercase font-bold">{activeQuiz.status}</strong>
            </div>
            {activeQuiz.isPaused && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500 text-amber-300 text-xs font-bold animate-pulse">
                COMPETITION PAUSED
              </span>
            )}
          </div>

          {/* Screen Presentation Switcher for Projector */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-400 font-bold uppercase px-2">Stage View:</span>
            {[
              { id: 'welcome', label: 'Welcome' },
              { id: 'round_intro', label: 'Round Info' },
              { id: 'question', label: 'Question' },
              { id: 'buzzer', label: 'Buzzer' },
              { id: 'scoreboard', label: 'Scores' },
              { id: 'winner', label: 'Winner' },
            ].map((scr) => (
              <button
                key={scr.id}
                onClick={() => dispatchAction('SET_DISPLAY_SCREEN', { screen: scr.id })}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                  activeQuiz.displayScreen === scr.id
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {scr.label}
              </button>
            ))}
          </div>

          {/* Emergency Pause & Score Correction Controls */}
          <div className="flex items-center gap-2">
            {activeQuiz.isPaused ? (
              <button
                onClick={() => dispatchAction('RESUME_QUIZ')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30"
              >
                <Play className="w-3.5 h-3.5" />
                Resume Quiz
              </button>
            ) : (
              <button
                onClick={() => dispatchAction('PAUSE_QUIZ')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600/20 border border-amber-500/40 hover:bg-amber-600/30 text-amber-300 text-xs font-bold"
              >
                <Pause className="w-3.5 h-3.5" />
                Pause Quiz
              </button>
            )}

            <button
              onClick={() => setShowManualCorrectionModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
            >
              <Edit3 className="w-3.5 h-3.5 text-sky-400" />
              Score Correction
            </button>
          </div>
        </div>

        {/* Main Grid: Left Operating Card (65%) | Right Stage Preview & Notes (35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Active Question, Unified Button Row, and Buzzer Engine (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* ROUND DIRECTOR: START QUIZ (ROUND INTRO) & PER-ROUND LAUNCH PAD */}
            <div className="bg-gradient-to-br from-slate-900 via-sky-950/30 to-slate-900 border-2 border-sky-600/40 rounded-2xl p-4 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-600/30 border border-sky-400/50 flex items-center justify-center text-sky-400 shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">
                        Quizmaster Launch Control
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-950 border border-sky-800 text-sky-300 font-extrabold">
                        Selected: Round {activeQuiz.currentRoundIndex + 1}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 mt-0.5">
                      Click <strong>Start Quiz</strong> to show the selected round&apos;s intro, or click a round&apos;s <strong>Start</strong> button to launch questions.
                    </div>
                  </div>
                </div>

                {/* Primary Start Quiz button (shows selected round introduction) + Active Round Start Questions button */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleStartRoundIntro()}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs shadow-lg shadow-sky-600/30 transition transform active:scale-95 cursor-pointer"
                    title={
                      isBuzzerRound
                        ? 'Show Buzzer Join QR Code & live participant check on projector'
                        : `Show introduction screen for Round ${activeQuiz.currentRoundIndex + 1}: ${currentRound?.name}`
                    }
                  >
                    {isBuzzerRound ? <QrCode className="w-4 h-4" /> : <Radio className="w-4 h-4" />}
                    <span>
                      {isBuzzerRound
                        ? `Show QR Join Lobby (${joinedTeamsCount}/${activeQuiz.teams.length})`
                        : `Start Quiz (Round ${activeQuiz.currentRoundIndex + 1} Intro)`}
                    </span>
                  </button>

                  {isBuzzerRound && !allTeamsJoined && activeQuiz.displayScreen !== 'question' && activeQuiz.displayScreen !== 'buzzer' ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-950/70 border border-amber-600/60 text-amber-300 font-black text-xs cursor-not-allowed"
                        title="Confirm all participants have joined via QR code before starting buzzer questions"
                      >
                        <Smartphone className="w-4 h-4 animate-pulse" />
                        <span>Waiting for Teams ({joinedTeamsCount}/{activeQuiz.teams.length})</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStartRoundQuestions()}
                        className="px-2.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold border border-slate-700 cursor-pointer"
                        title="Start Buzzer Round questions even if not all teams have joined on mobile"
                      >
                        Start Anyway
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartRoundQuestions()}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition transform active:scale-95 cursor-pointer"
                      title={`Display questions for Round ${activeQuiz.currentRoundIndex + 1}: ${currentRound?.name}`}
                    >
                      <Play className="w-4 h-4" />
                      <span>
                        {isBuzzerRound && allTeamsJoined
                          ? `All ${activeQuiz.teams.length} Joined ✓ Start Questions`
                          : `Start Round ${activeQuiz.currentRoundIndex + 1} Questions`}
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {/* Per-Round Cards with Separate Start Button for Every Round */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2 border-t border-slate-800/80">
                {activeQuiz.rounds.map((r, idx) => {
                  const isCurrent = idx === activeQuiz.currentRoundIndex;
                  const shortTitle = r.name.includes('–') ? r.name.split('–')[1].trim() : r.name;
                  const modeHint =
                    r.roundNumber === 1
                      ? 'MCQ • 5 Qs/Team (Rotates)'
                      : r.roundNumber === 5
                      ? 'MCQ • Team Rotates'
                      : r.roundNumber === 3
                      ? 'MCQ • 5 Qs / 1 Lot'
                      : r.roundNumber === 4
                      ? 'Visual • Team Rotates'
                      : r.type === 'rapid_fire'
                      ? 'Rapid Fire • 5 Qs/Team (90s)'
                      : r.type === 'buzzer'
                      ? `QR Join (${joinedTeamsCount}/${activeQuiz.teams.length}) • Buzzer`
                      : r.type;

                  return (
                    <div
                      key={r.id}
                      onClick={() => dispatchAction('SET_ROUND', { roundIndex: idx })}
                      className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                        isCurrent
                          ? 'bg-sky-950/70 border-sky-500 shadow-md shadow-sky-950/50'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                              isCurrent ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            R{idx + 1}
                          </span>
                          <span className="text-xs font-bold text-white truncate">{shortTitle}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate">{modeHint}</div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (r.type === 'buzzer' && !allTeamsJoined) {
                            // Open QR Join Lobby on stage first so participants can scan & join before starting questions
                            handleStartRoundIntro(idx);
                          } else {
                            handleStartRoundQuestions(idx);
                          }
                        }}
                        className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-black flex items-center gap-1 transition active:scale-95 cursor-pointer ${
                          isCurrent && activeQuiz.displayScreen === 'question'
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow'
                            : r.type === 'buzzer' && !allTeamsJoined
                            ? 'bg-amber-950/90 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-700/70'
                            : 'bg-emerald-950/90 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-700/70'
                        }`}
                        title={
                          r.type === 'buzzer' && !allTeamsJoined
                            ? 'Open QR Join Lobby on projector so all teams can join first'
                            : `Start Round ${idx + 1} questions on stage`
                        }
                      >
                        {r.type === 'buzzer' && !allTeamsJoined ? (
                          <>
                            <QrCode className="w-3 h-3" />
                            <span>QR Lobby</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            <span>Start</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Round & Question Navigation */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                    Round {activeQuiz.currentRoundIndex + 1} of {activeQuiz.rounds.length}
                  </span>
                  <div className="text-xl font-extrabold text-white">{currentRound?.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{currentRound?.rulesSummary}</div>
                </div>

                {/* Round Switcher Selector */}
                <select
                  value={activeQuiz.currentRoundIndex}
                  onChange={(e) => dispatchAction('SET_ROUND', { roundIndex: Number(e.target.value) })}
                  className="bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl px-3 py-2 cursor-pointer focus:ring-2 focus:ring-sky-500"
                >
                  {activeQuiz.rounds.map((r, idx) => (
                    <option key={r.id} value={idx}>
                      Round {idx + 1}: {r.name} ({r.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Questions Carousel Tabs */}
              {currentRound && (
                <div className="space-y-2.5 pb-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400 shrink-0 mr-1">Questions:</span>
                      {currentRound.questions.map((q, idx) => {
                        const isSelected = idx === activeQuiz.currentQuestionIndex;
                        const isRotating =
                          currentRound.roundNumber === 1 ||
                          currentRound.roundNumber === 4 ||
                          currentRound.roundNumber === 5 ||
                          (currentRound.roundNumber !== 3 && currentRound.presentationOrder === 'horizontal');
                        const assignedTeam =
                          isRapidFire && activeQuiz.teams.length > 0
                            ? activeQuiz.teams[Math.min(activeQuiz.teams.length - 1, Math.floor(idx / 5))]
                            : isRotating && activeQuiz.teams.length > 0
                            ? activeQuiz.teams[idx % activeQuiz.teams.length]
                            : null;
                        const cycleNum =
                          currentRound.roundNumber === 1 && activeQuiz.teams.length > 0
                            ? Math.floor(idx / activeQuiz.teams.length) + 1
                            : null;
                        const isInActiveRapidLot =
                          isRapidFire && idx >= rapidFireLotStart && idx <= rapidFireLotEnd;

                        return (
                          <button
                            key={q.id}
                            onClick={() => {
                              if (isRapidFire && activeQuiz.teams.length > 0) {
                                const targetTeam =
                                  activeQuiz.teams[Math.min(activeQuiz.teams.length - 1, Math.floor(idx / 5))];
                                dispatchAction('SET_QUESTION', { questionIndex: idx, teamId: targetTeam.id });
                              } else if (isRotating && activeQuiz.teams.length > 0) {
                                const targetTeam = activeQuiz.teams[idx % activeQuiz.teams.length];
                                dispatchAction('SET_QUESTION', { questionIndex: idx, teamId: targetTeam.id });
                              } else {
                                dispatchAction('SET_QUESTION', { questionIndex: idx, teamId: activeQuiz.activeTeamId });
                              }
                            }}
                            title={
                              assignedTeam
                                ? isRapidFire
                                  ? `Q${idx + 1} • ${assignedTeam.name} (Lot Q${(idx % 5) + 1}/5)`
                                  : `Q${idx + 1} • ${assignedTeam.name}${cycleNum ? ` (Cycle ${cycleNum}/5)` : ''}`
                                : `Q${idx + 1}`
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30 ring-1 ring-sky-300'
                                : isInActiveRapidLot
                                ? 'bg-slate-900 text-slate-200 border border-sky-700/70 hover:border-sky-400'
                                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            {assignedTeam && (
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: assignedTeam.color }}
                              />
                            )}
                            <span>Q{idx + 1}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* In Round 3 (one-lot round), quick button to move to next team's 5-question lot */}
                    {currentRound.roundNumber === 3 && activeQuiz.teams.length > 1 && (
                      <button
                        onClick={handleStartNextTeamLot}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/90 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-700/70 text-[11px] font-bold transition cursor-pointer"
                        title="Switch to the next team and reset to Q1 for their 5-question lot"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Next Team Lot (Q1)</span>
                      </button>
                    )}

                    {/* In Rapid Fire round, quick Next Team button */}
                    {isRapidFire && hasNextRapidFireTeam && nextRapidFireTeam && (
                      <button
                        onClick={handleRapidFireNextTeam}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/90 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-700/70 text-[11px] font-bold transition cursor-pointer"
                        title={`Move to ${nextRapidFireTeam.name}'s distinct 5-question set and reset timer to 90s`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Next Team: {nextRapidFireTeam.name} →</span>
                      </button>
                    )}
                  </div>

                  {/* Round 2 Rapid Fire Per-Team Distinct 5-Question Lot Tracker */}
                  {isRapidFire && activeQuiz.teams.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px]">
                        <span className="font-bold text-sky-400">
                          Lot {activeTeamIndex + 1} of {activeQuiz.teams.length} •{' '}
                          <span className="text-white">
                            {activeTeam?.name} (Q{rapidFireQuestionInLot}/{rapidFireLotTotal} — Global Q
                            {activeQuiz.currentQuestionIndex + 1})
                          </span>
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {activeQuiz.teams.map((t, tIdx) => {
                            const startQ = tIdx * 5 + 1;
                            const endQ = Math.min((tIdx + 1) * 5, currentRound.questions.length);
                            const isCurrentTurn = t.id === activeTeam?.id;
                            const isCompletedTeam = tIdx < activeTeamIndex || (isCurrentTurn && rapidFirePhase === 'lot_done');
                            return (
                              <button
                                key={t.id}
                                type="button"
                                onClick={() => dispatchAction('SET_ACTIVE_TEAM', { teamId: t.id })}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border cursor-pointer transition ${
                                  isCurrentTurn
                                    ? 'bg-sky-950/80 border-sky-500 text-white font-bold'
                                    : isCompletedTeam
                                    ? 'bg-emerald-950/40 border-emerald-800/70 text-emerald-300'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                }`}
                              >
                                <span
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: t.color }}
                                />
                                <span>
                                  {t.name}: Q{startQ}–Q{endQ} {isCompletedTeam && !isCurrentTurn ? '✓' : ''}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {rapidFirePhase === 'lot_done' && (
                        <div className="p-3 rounded-xl bg-amber-950/70 border border-amber-500/70 flex flex-wrap items-center justify-between gap-3">
                          <div className="text-xs font-bold text-amber-100">
                            {hasNextRapidFireTeam && nextRapidFireTeam ? (
                              <>
                                ✓ <strong>{activeTeam?.name}</strong> finished their 5-question lot — Timer stopped! Click{' '}
                                <strong>Next Team: {nextRapidFireTeam.name}</strong> to load Q
                                {(activeTeamIndex + 1) * 5 + 1}–Q
                                {Math.min((activeTeamIndex + 2) * 5, currentRound.questions.length)} &amp; reset timer to 90s.
                              </>
                            ) : (
                              <>
                                ✓ All {activeQuiz.teams.length} teams have completed Rapid Fire! Timer stopped.
                              </>
                            )}
                          </div>
                          {hasNextRapidFireTeam && nextRapidFireTeam ? (
                            <button
                              type="button"
                              onClick={handleRapidFireNextTeam}
                              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-xs font-black shadow cursor-pointer"
                            >
                              Next Team: {nextRapidFireTeam.name} →
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => dispatchAction('SET_DISPLAY_SCREEN', { screen: 'scoreboard' })}
                              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow cursor-pointer"
                            >
                              View Live Leaderboard →
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Round 1 Horizontal Cycle & Per-Team 5-Question Tracker */}
                  {currentRound.roundNumber === 1 && activeQuiz.teams.length > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px]">
                      <span className="font-bold text-sky-400">
                        Cycle {Math.floor(activeQuiz.currentQuestionIndex / activeQuiz.teams.length) + 1} of{' '}
                        {Math.ceil(currentRound.questions.length / activeQuiz.teams.length)} •{' '}
                        <span className="text-white">
                          {activeTeam?.name} (Q
                          {Math.floor(activeQuiz.currentQuestionIndex / activeQuiz.teams.length) + 1}/5)
                        </span>
                      </span>
                      <div className="flex flex-wrap items-center gap-2">
                        {activeQuiz.teams.map((t, tIdx) => {
                          const totalForTeam = currentRound.questions.filter(
                            (_q, qIdx) => qIdx % activeQuiz.teams.length === tIdx
                          ).length;
                          const askedForTeam = currentRound.questions.filter(
                            (_q, qIdx) =>
                              qIdx <= activeQuiz.currentQuestionIndex &&
                              qIdx % activeQuiz.teams.length === tIdx
                          ).length;
                          const isCurrentTurn = t.id === activeTeam?.id;
                          return (
                            <span
                              key={t.id}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                                isCurrentTurn
                                  ? 'bg-sky-950/80 border-sky-500 text-white font-bold'
                                  : 'bg-slate-900 border-slate-800 text-slate-400'
                              }`}
                            >
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: t.color }}
                              />
                              <span>
                                {t.name}: {askedForTeam}/{totalForTeam}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Active Question Details Card */}
              {currentQuestion ? (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="bg-sky-950 text-sky-300 border border-sky-800 px-2.5 py-1 rounded-lg font-bold">
                      Category: {currentQuestion.category}
                    </span>
                    <span className="text-slate-400">
                      Difficulty: <strong className="text-white capitalize">{currentQuestion.difficulty}</strong>
                    </span>
                  </div>

                  <div className="text-lg md:text-xl font-bold text-white leading-snug">
                    <MathText text={currentQuestion.text} />
                  </div>

                  {currentQuestion.mediaUrl && (
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-4">
                      <img
                        src={currentQuestion.mediaUrl}
                        alt="Question Media"
                        className="w-24 h-24 object-contain rounded-lg border border-slate-700 bg-black"
                      />
                      <div className="text-xs text-slate-300">
                        <strong>Visual Material:</strong> Displayed on projector screen.
                      </div>
                    </div>
                  )}

                  {/* MULTIPLE CHOICE OPTIONS SELECTION FOR QUIZMASTER (ROUNDS 1, 3, 5) */}
                  {currentQuestion.options && currentQuestion.options.length > 0 && (
                    <div className="p-4 rounded-2xl bg-slate-900/90 border border-sky-800/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                            Multiple Choice Options (Verbal Answer Selection)
                          </span>
                        </div>

                        {!activeQuiz.optionsRevealed ? (
                          <span className="text-[11px] font-bold text-amber-300 bg-amber-950/70 border border-amber-700/80 px-2.5 py-0.5 rounded-full animate-pulse">
                            Options Hidden from Stage
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                            Options Live on Stage ✓
                          </span>
                        )}
                      </div>

                      {/* If Options Hidden: Reveal Button */}
                      {!activeQuiz.optionsRevealed ? (
                        <div className="p-3.5 rounded-xl bg-sky-950/50 border border-sky-700/60 flex flex-wrap items-center justify-between gap-3">
                          <div className="text-xs text-sky-200 max-w-sm">
                            Question is visible on stage. Dictate question to <strong>{activeTeam?.name}</strong>, then click to reveal options and start the 30s timer.
                          </div>
                          <button
                            onClick={handleRevealOptionsAndStartTimer}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-sky-600/30 transition transform active:scale-95 cursor-pointer animate-pulse"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Reveal Options & Start Timer (30s)</span>
                          </button>
                        </div>
                      ) : null}

                      {/* 4 Options Grid: Click to evaluate based on verbal answer */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {currentQuestion.options.map((opt, idx) => {
                          const isSelected = activeQuiz.selectedOptionIndex === idx;
                          const isCorrectKey = idx === currentQuestion.correctOptionIndex;
                          const isEvaluated =
                            activeQuiz.selectedOptionIndex !== null && activeQuiz.selectedOptionIndex !== undefined;

                          let btnStyle =
                            'bg-slate-950 hover:bg-slate-800/80 border-slate-700 text-slate-200 hover:border-sky-500';
                          let badgeStyle = 'bg-slate-800 text-sky-400';
                          let tag = null;

                          if (isEvaluated) {
                            if (isCorrectKey) {
                              btnStyle =
                                'bg-emerald-950/90 border-emerald-400 text-emerald-100 ring-2 ring-emerald-500/50 shadow-md';
                              badgeStyle = 'bg-emerald-600 text-white';
                              tag = (
                                <span className="ml-auto text-[10px] font-black uppercase bg-emerald-500 text-slate-950 px-2 py-0.5 rounded shadow">
                                  ✓ +10 PTS
                                </span>
                              );
                            } else if (isSelected) {
                              btnStyle =
                                'bg-rose-950/90 border-rose-500 text-rose-100 ring-2 ring-rose-500/50 shadow-md';
                              badgeStyle = 'bg-rose-600 text-white';
                              tag = (
                                <span className="ml-auto text-[10px] font-black uppercase bg-rose-500 text-white px-2 py-0.5 rounded shadow">
                                  ✗ 0 PTS
                                </span>
                              );
                            } else {
                              btnStyle = 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-40 cursor-not-allowed';
                              badgeStyle = 'bg-slate-900 text-slate-600';
                            }
                          } else if (isCorrectKey) {
                            // Confidential key preview for Quizmaster
                            tag = (
                              <span className="ml-auto text-[10px] font-bold text-amber-400 bg-amber-950/70 border border-amber-800 px-1.5 py-0.5 rounded">
                                Key ✓
                              </span>
                            );
                          }

                          return (
                            <button
                              key={idx}
                              disabled={isEvaluated || !activeQuiz.optionsRevealed}
                              onClick={() => handleSelectMcqOption(idx)}
                              className={`p-3 rounded-xl border text-left flex items-center gap-3 transition font-semibold text-xs ${
                                isEvaluated || !activeQuiz.optionsRevealed ? 'cursor-not-allowed' : 'cursor-pointer'
                              } ${btnStyle} ${!activeQuiz.optionsRevealed && !isEvaluated ? 'opacity-65' : ''}`}
                              title={
                                !activeQuiz.optionsRevealed
                                  ? 'Click "Reveal Options & Start Timer" first to show options to participants'
                                  : isEvaluated
                                  ? undefined
                                  : `Select Option ${String.fromCharCode(65 + idx)} for ${activeTeam?.name}`
                              }
                            >
                              <span
                                className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${badgeStyle}`}
                              >
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span className="min-w-0 leading-snug break-words">
                                <MathText text={opt} />
                              </span>
                              {tag}
                            </button>
                          );
                        })}
                      </div>

                      {/* Time-out Alert (0 points allotted) */}
                      {activeQuiz.timer.remainingSeconds === 0 &&
                        !activeQuiz.timer.isRunning &&
                        (activeQuiz.selectedOptionIndex === null || activeQuiz.selectedOptionIndex === undefined) && (
                          <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-600 text-amber-200 text-xs flex items-center justify-between">
                            <span className="font-bold">
                              ⏰ Time Expired! 0 points allotted to {activeTeam?.name}. Advancing automatically...
                            </span>
                            <span className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-black">
                              0 Marks
                            </span>
                          </div>
                        )}
                    </div>
                  )}

                  {/* Private Quizmaster Answer Key & Scientific Explanation */}
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5" />
                        QUIZMASTER CONFIDENTIAL ANSWER KEY
                      </span>
                      {activeQuiz.answerRevealed ? (
                        <span className="text-xs font-bold text-emerald-400">Revealed on Projector ✓</span>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">Hidden from Audience</span>
                      )}
                    </div>
                    <div className="text-base font-extrabold text-white mt-1">
                      <MathText text={currentQuestion.answer} />
                    </div>
                    {currentQuestion.explanation && (
                      <p className="text-xs text-amber-200/80 mt-1 font-medium">
                        <MathText text={currentQuestion.explanation} />
                      </p>
                    )}
                  </div>

                  {/* ------------------------------------------------------------- */}
                  {/* UNIFIED ACTION BUTTON TOOLBAR (IN LINE AS REQUESTED IN IMAGE 1) */}
                  {/* ------------------------------------------------------------- */}
                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                    {/* Left: Reveal Answer & Navigation */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Reveal Answer to Audience Button (Green pill) */}
                      <button
                        onClick={() => dispatchAction('REVEAL_ANSWER')}
                        disabled={activeQuiz.answerRevealed}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold transition shadow ${
                          activeQuiz.answerRevealed
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                        }`}
                      >
                        <Eye className="w-4 h-4" />
                        <span>{activeQuiz.answerRevealed ? 'Answer Revealed ✓' : 'Reveal Answer to Audience'}</span>
                      </button>

                      {/* Dynamic Start -> Next Question -> Next Team button for Rapid Fire; standard Next Question otherwise */}
                      {isRapidFire ? (
                        rapidFirePhase === 'ready' ? (
                          <button
                            onClick={handleRapidFireStartLot}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-lg shadow-sky-600/30 transition transform active:scale-95 cursor-pointer animate-pulse"
                            title={`Start ${activeTeam?.name}'s 90s Rapid Fire 5-question lot (converts to Next Question)`}
                          >
                            <Play className="w-4 h-4" />
                            <span>Start</span>
                          </button>
                        ) : rapidFirePhase === 'active' ? (
                          <button
                            onClick={handleRapidFireNextQuestion}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold bg-slate-800 hover:bg-slate-700 text-white border border-sky-500/60 cursor-pointer shadow"
                            title={
                              activeQuiz.currentQuestionIndex < rapidFireLotEnd
                                ? `Advance to next question for ${activeTeam?.name} (Q${rapidFireQuestionInLot + 1}/${rapidFireLotTotal})`
                                : `Finish ${activeTeam?.name}'s 5-question lot and stop timer`
                            }
                          >
                            <span>
                              {activeQuiz.currentQuestionIndex < rapidFireLotEnd
                                ? 'Next Question'
                                : 'Finish Team Lot'}
                            </span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        ) : hasNextRapidFireTeam && nextRapidFireTeam ? (
                          <button
                            onClick={handleRapidFireNextTeam}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white shadow-lg shadow-indigo-600/30 transition transform active:scale-95 cursor-pointer"
                            title={`Move to ${nextRapidFireTeam.name}, reset timer to 90s, and show Start button`}
                          >
                            <span>Next Team: {nextRapidFireTeam.name}</span>
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => dispatchAction('SET_DISPLAY_SCREEN', { screen: 'scoreboard' })}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black bg-emerald-700 hover:bg-emerald-600 text-white cursor-pointer shadow"
                            title="All teams completed Rapid Fire — view scoreboard"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Rapid Fire Done</span>
                          </button>
                        )
                      ) : (
                        <button
                          onClick={handleNextQuestion}
                          disabled={
                            !currentRound || activeQuiz.currentQuestionIndex >= currentRound.questions.length - 1
                          }
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 disabled:opacity-40 cursor-pointer shadow"
                        >
                          <span>Next Question</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      )}

                      {/* Round Timer Button in the same region */}
                      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                        <button
                          onClick={handleToggleTimer}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition shadow ${
                            activeQuiz.timer.isRunning
                              ? 'bg-amber-600 hover:bg-amber-500 text-white animate-pulse'
                              : 'bg-sky-600 hover:bg-sky-500 text-white'
                          }`}
                          title={
                            isRapidFire
                              ? 'Continuous 90s Rapid Fire Timer (does not reset across a team’s 5 questions)'
                              : 'Question Countdown Timer'
                          }
                        >
                          {activeQuiz.timer.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                          <span className="font-mono">{activeQuiz.timer.remainingSeconds}s</span>
                        </button>

                        <button
                          onClick={handleResetTimer}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                          title="Reset Timer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Right: Point Award Buttons & Turn Selector */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Points Button (Correct +10) */}
                      <button
                        onClick={() => handleEvaluate('correct')}
                        disabled={isRapidFire && rapidFirePhase !== 'active'}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-emerald-600/30 transition active:scale-95 cursor-pointer"
                        title={
                          isRapidFire && rapidFirePhase !== 'active'
                            ? 'Click Start to begin this team’s Rapid Fire lot before scoring'
                            : `Award +${currentRound?.scoring.marksCorrect} to ${activeTeam?.name}`
                        }
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>+{currentRound?.scoring.marksCorrect}</span>
                      </button>

                      {/* Negative Marking Button (Incorrect -5 or 0) */}
                      <button
                        onClick={() => handleEvaluate('incorrect')}
                        disabled={isRapidFire && rapidFirePhase !== 'active'}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-rose-600/30 transition active:scale-95 cursor-pointer"
                        title={
                          isRapidFire && rapidFirePhase !== 'active'
                            ? 'Click Start to begin this team’s Rapid Fire lot before scoring'
                            : `Allot ${currentRound?.scoring.marksIncorrect} to ${activeTeam?.name}`
                        }
                      >
                        <XCircle className="w-4 h-4" />
                        <span>{currentRound?.scoring.marksIncorrect}</span>
                      </button>

                      {/* Pass Button (ONLY present in Rapid Fire round as instructed!) */}
                      {isRapidFire && (
                        <button
                          onClick={() => handleEvaluate('passed')}
                          disabled={rapidFirePhase !== 'active'}
                          className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-black bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-md shadow-indigo-600/30 transition active:scale-95 cursor-pointer"
                          title={
                            rapidFirePhase !== 'active'
                              ? 'Click Start to begin this team’s Rapid Fire lot before passing'
                              : 'Pass Question (Advances to next question in lot automatically with 0 marks)'
                          }
                        >
                          <SkipForward className="w-4 h-4" />
                          <span>Pass (0)</span>
                        </button>
                      )}

                      {/* Turn / Active Team Selector with Auto-Rotation note */}
                      <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700/80 px-2.5 py-1 rounded-xl">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase leading-none">
                            Turn:
                          </span>
                          <span className="text-[9px] text-sky-400 font-semibold leading-none">
                            {isRapidFire
                              ? '5 Qs Lot'
                              : currentRound?.roundNumber === 3
                              ? '1 Lot'
                              : currentRound?.roundNumber === 1 || currentRound?.roundNumber === 4 || currentRound?.roundNumber === 5
                              ? 'Rotates'
                              : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {activeTeam && (
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: activeTeam.color }}
                            />
                          )}
                          <select
                            value={activeQuiz.activeTeamId || ''}
                            onChange={(e) => dispatchAction('SET_ACTIVE_TEAM', { teamId: e.target.value })}
                            className="bg-transparent text-white font-extrabold text-xs cursor-pointer focus:outline-none"
                          >
                            {activeQuiz.teams.map((t) => (
                              <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                                {t.name} ({activeQuiz.totalScores[t.id] || 0} pts)
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500">No questions in this round.</div>
              )}
            </div>

            {/* Buzzer Engine Card (Enforces Buzzer Round Only Requirement) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <h3 className="font-extrabold text-slate-200 text-sm">Buzzer Engine (Fastest Finger First)</h3>
                </div>

                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                    isBuzzerRound
                      ? activeQuiz.buzzer.isActive
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 animate-pulse'
                        : 'bg-slate-800 text-slate-400'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isBuzzerRound ? (activeQuiz.buzzer.isActive ? 'ACTIVE' : 'LOCKED') : 'DISABLED FOR THIS ROUND'}
                </span>
              </div>

              {isBuzzerRound ? (
                <div className="space-y-4">
                  {/* Participant QR Join Verification Panel (Ensure all teams joined before asking questions) */}
                  <div
                    className={`p-3.5 rounded-xl border space-y-3 ${
                      allTeamsJoined
                        ? 'bg-emerald-950/30 border-emerald-500/60'
                        : 'bg-amber-950/30 border-amber-500/60'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <QrCode className={`w-4 h-4 ${allTeamsJoined ? 'text-emerald-400' : 'text-amber-400'}`} />
                        <span className="text-xs font-black uppercase tracking-wider text-white">
                          QR Join Verification: {joinedTeamsCount} / {activeQuiz.teams.length} Teams Joined
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleStartRoundIntro()}
                        className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <QrCode className="w-3 h-3" />
                        <span>Show QR on Stage</span>
                      </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      {qrDataUrl && (
                        <div className="bg-white p-1.5 rounded-xl shrink-0 shadow">
                          <img src={qrDataUrl} alt="Buzzer Join QR Code" className="w-20 h-20" />
                        </div>
                      )}
                      <div className="flex-1 w-full grid grid-cols-2 gap-2">
                        {activeQuiz.teams.map((t) => (
                          <div
                            key={t.id}
                            className={`px-2.5 py-1.5 rounded-lg border text-[11px] flex items-center justify-between gap-1.5 ${
                              t.isOnline
                                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 font-bold'
                                : 'bg-slate-950/80 border-slate-800 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: t.color }}
                              />
                              <span className="truncate">{t.name}</span>
                            </div>
                            <span className={`shrink-0 text-[10px] font-black ${t.isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {t.isOnline ? '✓' : '⏳'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {activeQuiz.displayScreen === 'round_intro' && (
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/70">
                        <span className="text-[11px] text-slate-300">
                          {allTeamsJoined
                            ? 'All participants confirmed joined on mobile! Start asking questions.'
                            : 'Ask remaining teams to scan the QR code on the main projector screen.'}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={!allTeamsJoined}
                            onClick={() => handleStartRoundQuestions()}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-black transition ${
                              allTeamsJoined
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow'
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            Start Buzzer Questions
                          </button>
                          {!allTeamsJoined && (
                            <button
                              type="button"
                              onClick={() => handleStartRoundQuestions()}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold border border-slate-700 cursor-pointer"
                            >
                              Start Anyway
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    {activeQuiz.buzzer.queue.length > 0 ? (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                        <div className="text-[11px] font-bold text-slate-400 uppercase mb-2">
                          Live Response Queue:
                        </div>
                        {activeQuiz.buzzer.queue.map((item, idx) => (
                          <div
                            key={item.teamId}
                            className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs ${
                              idx === 0
                                ? 'bg-emerald-950/80 text-emerald-200 font-extrabold border border-emerald-800/80'
                                : 'text-slate-300'
                            }`}
                          >
                            <span>
                              #{idx + 1} {item.teamName} ({item.institution})
                            </span>
                            <span className="font-mono text-slate-400">+{item.latencyMs}ms delay</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3 text-xs text-slate-500">
                        Buzzer queue is empty. Click "Activate Buzzer" to open buzzers on participant phones.
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    {activeQuiz.buzzer.isActive ? (
                      <button
                        onClick={() => dispatchAction('BUZZER_DEACTIVATE')}
                        className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow"
                      >
                        Lock Buzzer
                      </button>
                    ) : (
                      <button
                        onClick={() => dispatchAction('BUZZER_ACTIVATE', { timeAllowedSeconds: 15 })}
                        className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md shadow-amber-600/30 flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-4 h-4" /> Activate Buzzer on Phones!
                      </button>
                    )}

                    <button
                      onClick={() => dispatchAction('BUZZER_PASS_NEXT')}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
                      title="Pass opportunity to next participant in queue"
                    >
                      Pass Next
                    </button>

                    <button
                      onClick={() => dispatchAction('BUZZER_CLEAR')}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700"
                      title="Clear queue"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-400 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 flex items-center gap-2">
                  <span className="text-amber-400">ℹ</span>
                  <span>
                    Buzzer is deactivated. Mobile phones are used exclusively in <strong>Round VI – Buzzer Round</strong>.
                    In this round, questions are dictated verbally by the Quizmaster and answered on stage.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Projector Monitor (Confidence Screen) & Anchor Notes (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* LIVE STAGE PROJECTOR MONITOR (16:9 CONFIDENCE SCREEN) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <Tv className="w-4 h-4 text-sky-400" />
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-200">
                    Live Stage Projector Monitor
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-black text-rose-400 bg-rose-950/60 border border-rose-900 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  <span>CONFIDENCE SCREEN</span>
                </div>
              </div>

              {/* Scaled-down 16:9 Cinema Monitor */}
              <div className="aspect-video bg-radial from-slate-900 via-slate-950 to-black rounded-xl border-2 border-slate-700/80 p-3 flex flex-col justify-between shadow-2xl relative overflow-hidden select-none">
                {/* Mini Top Banner */}
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5 text-[10px]">
                  <div className="flex items-center gap-1 font-black text-sky-400 tracking-wider">
                    <span>MIND EXPEDITION</span>
                    <span className="text-[9px] text-slate-500">[{activeQuiz.code}]</span>
                  </div>
                  <div className="text-[10px] text-slate-300 font-semibold truncate max-w-[140px]">
                    {activeQuiz.displayScreen === 'question'
                      ? currentRound?.name
                      : `View: ${activeQuiz.displayScreen}`}
                  </div>
                </div>

                {/* Center preview content */}
                <div className="my-auto text-center py-1">
                  {activeQuiz.displayScreen === 'welcome' && (
                    <div className="space-y-1.5">
                      {activeQuiz.collegeLogoUrl && (
                        <div className="w-10 h-10 rounded-lg bg-white p-1 mx-auto flex items-center justify-center shadow">
                          <img
                            src={activeQuiz.collegeLogoUrl}
                            alt="College Logo"
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      )}
                      <div className="text-xs font-black text-white">{activeQuiz.title}</div>
                      {activeQuiz.organizedBy && (
                        <div className="text-[9px] text-amber-300 font-bold">
                          Organized by {activeQuiz.organizedBy} • {activeQuiz.date}
                        </div>
                      )}
                      <div className="text-[9px] text-sky-300">STAGE OPEN • COMPETING TEAMS READY</div>
                    </div>
                  )}

                  {activeQuiz.displayScreen === 'round_intro' && currentRound && (
                    <div className="space-y-1">
                      <div className="text-[10px] text-sky-400 font-bold uppercase">
                        Round {currentRound.roundNumber}
                      </div>
                      <div className="text-xs font-extrabold text-white">{currentRound.name}</div>
                      {currentRound.type === 'buzzer' ? (
                        <div className="flex items-center justify-center gap-3 mt-1.5 text-left">
                          {qrDataUrl && (
                            <div className="bg-white p-1 rounded-lg shrink-0 shadow">
                              <img src={qrDataUrl} alt="Stage QR Code" className="w-16 h-16" />
                            </div>
                          )}
                          <div className="space-y-1">
                            <div className="text-[9px] font-black text-amber-300 uppercase">
                              📱 QR JOIN LOBBY LIVE ({joinedTeamsCount}/{activeQuiz.teams.length} JOINED)
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {activeQuiz.teams.map((t) => (
                                <span
                                  key={t.id}
                                  className={`text-[8px] px-1.5 py-0.5 rounded border ${
                                    t.isOnline
                                      ? 'bg-emerald-950 border-emerald-500 text-emerald-300 font-bold'
                                      : 'bg-slate-900 border-slate-700 text-slate-400'
                                  }`}
                                >
                                  {t.name} {t.isOnline ? '✓' : '⏳'}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[9px] text-slate-400">{currentRound.rulesSummary}</div>
                      )}
                    </div>
                  )}

                  {activeQuiz.displayScreen === 'question' && currentQuestion && (
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center justify-between text-[9px] font-bold">
                        <span className="bg-sky-600 px-1.5 py-0.5 rounded text-white">
                          {isRapidFire
                            ? `Lot Q${rapidFireQuestionInLot}/${rapidFireLotTotal}`
                            : `Q${activeQuiz.currentQuestionIndex + 1}`}
                        </span>
                        {activeTeam && (
                          <span className="text-slate-300">
                            Turn: <strong>{activeTeam.name}</strong>
                          </span>
                        )}
                        <span className="font-mono text-amber-400">⏳ {activeQuiz.timer.remainingSeconds}s</span>
                      </div>

                      {isRapidFire && rapidFirePhase === 'ready' ? (
                        <div className="p-2 rounded bg-sky-950/70 border border-sky-600/60 text-center space-y-0.5">
                          <div className="text-[10px] font-black text-white">
                            GET READY: {activeTeam?.name}
                          </div>
                          <div className="text-[8px] text-sky-300">
                            5 Rapid Fire Questions • 90s Clock • Press Start
                          </div>
                        </div>
                      ) : isRapidFire && rapidFirePhase === 'lot_done' && currentRound ? (
                        <div className="space-y-1">
                          <div className="text-[9px] font-black text-amber-300 uppercase">
                            ✓ {activeTeam?.name} — 5 Answers Live on Stage
                          </div>
                          <div className="space-y-0.5">
                            {currentRound.questions
                              .slice(rapidFireLotStart, rapidFireLotEnd + 1)
                              .map((qItem, idx) => {
                                const st = activeQuiz.rapidFireLotResults?.[qItem.id] || 'unanswered';
                                const cls =
                                  st === 'correct'
                                    ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-400'
                                    : st === 'incorrect'
                                    ? 'bg-rose-950/70 border-rose-500/60 text-rose-400'
                                    : 'bg-slate-900 border-slate-700 text-amber-300';
                                return (
                                  <div
                                    key={qItem.id}
                                    className={`px-1.5 py-0.5 rounded border text-[8px] flex items-center justify-between gap-1 ${cls}`}
                                  >
                                    <span className="truncate text-white font-semibold">
                                      Q{idx + 1}:{' '}
                                      <span
                                        className={
                                          st === 'correct'
                                            ? 'text-emerald-400 font-bold'
                                            : st === 'incorrect'
                                            ? 'text-rose-400 font-bold'
                                            : 'text-amber-300 font-bold'
                                        }
                                      >
                                        <MathText text={qItem.answer} />
                                      </span>
                                    </span>
                                    <span className="shrink-0 font-black uppercase">
                                      {st === 'correct' ? '✓' : st === 'incorrect' ? '✗' : '–'}
                                    </span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] font-extrabold text-white line-clamp-2 leading-tight">
                          <MathText text={currentQuestion.text} />
                        </div>
                      )}

                      {/* Mini Options Preview */}
                      {currentQuestion.options && currentQuestion.options.length > 0 && (
                        <div>
                          {!activeQuiz.optionsRevealed ? (
                            <div className="text-[8px] text-sky-300 font-semibold bg-sky-950/60 p-1 rounded border border-sky-800/60 text-center">
                              Options Hidden from Stage
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-1 text-[8px]">
                              {currentQuestion.options.map((opt, idx) => {
                                const isSelected = activeQuiz.selectedOptionIndex === idx;
                                const isCorrectKey = idx === currentQuestion.correctOptionIndex;
                                const isEvaluated =
                                  activeQuiz.selectedOptionIndex !== null && activeQuiz.selectedOptionIndex !== undefined;

                                let cls = 'bg-slate-900 border-slate-800 text-slate-300';
                                if (isEvaluated) {
                                  if (isCorrectKey) cls = 'bg-emerald-950 border-emerald-400 text-emerald-200 font-black';
                                  else if (isSelected) cls = 'bg-rose-950 border-rose-500 text-rose-200 font-black';
                                  else cls = 'bg-slate-950/50 border-slate-900 text-slate-600 opacity-40';
                                }
                                return (
                                  <div key={idx} className={`p-0.5 px-1 rounded border truncate flex items-center gap-1 ${cls}`}>
                                    <span className="font-bold">{String.fromCharCode(65 + idx)}:</span>
                                    <span className="truncate">
                                      <MathText text={opt} />
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {activeQuiz.timer.remainingSeconds === 0 &&
                        !activeQuiz.timer.isRunning &&
                        (activeQuiz.selectedOptionIndex === null || activeQuiz.selectedOptionIndex === undefined) &&
                        currentRound &&
                        (currentRound.roundNumber === 1 || currentRound.roundNumber === 3 || currentRound.roundNumber === 5) && (
                          <div className="p-1 rounded bg-amber-950/90 border border-amber-500 text-[9px] text-amber-200 font-bold text-center">
                            ⏰ TIME UP — 0 PTS ALLOTTED
                          </div>
                        )}

                      {activeQuiz.answerRevealed && (
                        <div className="p-1 rounded bg-emerald-950/80 border border-emerald-500/80 text-[9px] text-emerald-200">
                          <strong className="text-white">Ans:</strong> <MathText text={currentQuestion.answer} />
                        </div>
                      )}
                    </div>
                  )}

                  {activeQuiz.displayScreen === 'buzzer' && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-black text-emerald-400 uppercase">
                        ⚡ BUZZER ACTIVATED
                      </div>
                      {activeQuiz.buzzer.queue[0] ? (
                        <div className="bg-emerald-950 p-1.5 rounded border border-emerald-500 text-xs font-black text-white">
                          1st: {activeQuiz.buzzer.queue[0].teamName} (+{activeQuiz.buzzer.queue[0].latencyMs}ms)
                        </div>
                      ) : (
                        <div className="text-[10px] text-slate-400">Waiting for first press...</div>
                      )}
                    </div>
                  )}

                  {activeQuiz.displayScreen === 'scoreboard' && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-bold text-amber-400 uppercase">Leaderboard Screen</div>
                      <div className="grid grid-cols-2 gap-1 text-[9px]">
                        {activeQuiz.teams.map((t) => (
                          <div key={t.id} className="bg-slate-900 p-1 rounded flex justify-between">
                            <span className="truncate">{t.name}</span>
                            <span className="font-bold text-sky-400">{activeQuiz.totalScores[t.id] || 0}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeQuiz.displayScreen === 'winner' && (
                    <div className="space-y-1">
                      <div className="text-xs font-black text-amber-400">★ GRAND CHAMPION ★</div>
                      <div className="text-[10px] text-white font-bold">{activeQuiz.teams[0]?.name}</div>
                    </div>
                  )}
                </div>

                {/* Mini Bottom Ticker */}
                <div className="border-t border-slate-800/60 pt-1 flex items-center justify-between text-[9px] text-slate-400">
                  <span>Timer: {activeQuiz.timer.isRunning ? 'Running' : 'Stopped'}</span>
                  <span>{activeQuiz.answerRevealed ? 'Answer Live' : 'Answer Hidden'}</span>
                </div>
              </div>
            </div>

            {/* Private Anchor & Quizmaster Guidance Notes */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-3 text-sky-400">
                <BookOpen className="w-4 h-4" />
                <h3 className="font-extrabold text-sm uppercase tracking-wide text-slate-200">
                  Private Anchor / Master Guidance Notes
                </h3>
              </div>
              <div className="text-xs text-slate-300 space-y-2 whitespace-pre-line bg-slate-950 p-4 rounded-xl border border-slate-800 leading-relaxed max-h-56 overflow-y-auto">
                {currentRound?.instructionsForQuizmaster ||
                  'No private anchor instructions configured for this round.'}
              </div>
            </div>

            {/* Live Teams Score Summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  Live Team Standings
                </h3>
                <span className="text-[10px] text-slate-400">{activeQuiz.teams.length} Teams</span>
              </div>

              <div className="space-y-2">
                {activeQuiz.teams.map((team) => {
                  const isCurrentTurn = team.id === activeQuiz.activeTeamId;
                  return (
                    <div
                      key={team.id}
                      onClick={() => dispatchAction('SET_ACTIVE_TEAM', { teamId: team.id })}
                      className={`p-2 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                        isCurrentTurn
                          ? 'bg-sky-950/70 border-sky-500'
                          : 'bg-slate-950 border-slate-800 hover:bg-slate-900'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="text-xs font-bold text-white truncate">{team.name}</span>
                        {team.isOnline && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Online" />
                        )}
                      </div>
                      <div className="font-mono font-black text-amber-400 text-xs">
                        {activeQuiz.totalScores[team.id] || 0} pts
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Score Correction Modal with Reason Log */}
      {showManualCorrectionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                Authorized Score Correction
              </h3>
              <button
                onClick={() => setShowManualCorrectionModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleScoreCorrectionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Select Team / Participant:
                </label>
                <select
                  value={correctionTeamId}
                  onChange={(e) => setCorrectionTeamId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
                >
                  <option value="">-- Choose Team --</option>
                  {activeQuiz.teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Current: {activeQuiz.totalScores[t.id] || 0} pts)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Mark Adjustment Delta:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    value={correctionDelta}
                    onChange={(e) => setCorrectionDelta(Number(e.target.value))}
                    required
                    placeholder="+10 or -5"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white font-mono"
                  />
                  <span className="text-xs text-slate-400 font-semibold">points</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Reason for Audit Record:
                </label>
                <textarea
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  required
                  rows={2}
                  placeholder="e.g. Disputed answer verified by technical jury"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowManualCorrectionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow"
                >
                  Save &amp; Record Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
