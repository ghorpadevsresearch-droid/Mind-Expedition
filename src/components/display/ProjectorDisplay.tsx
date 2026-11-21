import React, { useEffect, useState, useMemo } from 'react';
import { useQuiz } from '../../context/QuizContext';
import { MathText } from '../common/MathText';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Clock,
  Zap,
  Users,
  Award,
  ChevronRight,
  Sparkles,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Radio,
  Calendar,
  Building2,
} from 'lucide-react';

const formatQuizDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const parsed = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const ProjectorDisplay: React.FC = () => {
  const { activeQuiz, lastBuzzerPress } = useQuiz();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const activeQuizId = activeQuiz?.id;
  const displayScreen = activeQuiz?.displayScreen;
  const teams = activeQuiz?.teams;
  const totalScores = activeQuiz?.totalScores;

  // Generate QR code for mobile joining
  useEffect(() => {
    if (!activeQuizId) return;
    const origin = window.location.origin;
    const joinUrl = `${origin}?role=mobile&quizId=${activeQuizId}`;
    QRCode.toDataURL(joinUrl, {
      margin: 2,
      width: 240,
      color: {
        dark: '#0284c7',
        light: '#ffffff',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('QR code generation failed:', err));
  }, [activeQuizId]);

  // Confetti on winner screen
  useEffect(() => {
    if (displayScreen === 'winner') {
      const end = Date.now() + 4 * 1000;
      const colors = ['#38bdf8', '#fbbf24', '#f43f5e', '#a855f7', '#10b981'];

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [displayScreen]);

  // Ranked teams
  const rankedTeams = useMemo(() => {
    if (!teams || !totalScores) return [];
    return [...teams].sort(
      (a, b) => (totalScores[b.id] || 0) - (totalScores[a.id] || 0)
    );
  }, [teams, totalScores]);

  if (!activeQuiz) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-medium">Loading MIND EXPEDITION Competition...</p>
        </div>
      </div>
    );
  }

  const currentRound = activeQuiz.rounds[activeQuiz.currentRoundIndex] || null;
  const currentQuestion = currentRound?.questions[activeQuiz.currentQuestionIndex] || null;
  const activeTeam = activeQuiz.teams.find((t) => t.id === activeQuiz.activeTeamId) || null;
  const isRapidFire = currentRound?.type === 'rapid_fire';
  const rapidFirePhase = activeQuiz.rapidFirePhase || 'ready';
  const activeTeamIdx = Math.max(
    0,
    activeQuiz.teams.findIndex((t) => t.id === activeTeam?.id)
  );
  const rfLotStart = currentRound
    ? Math.min(activeTeamIdx * 5, Math.max(0, currentRound.questions.length - 1))
    : 0;
  const rfLotEnd = currentRound
    ? Math.min(rfLotStart + 4, Math.max(0, currentRound.questions.length - 1))
    : 0;
  const rfQuestionInLot = Math.max(1, activeQuiz.currentQuestionIndex - rfLotStart + 1);
  const rfLotTotal = Math.max(1, rfLotEnd - rfLotStart + 1);

  // Timer ring percentage
  const totalSeconds = activeQuiz.timer.totalSeconds || 30;
  const remainingSeconds = activeQuiz.timer.remainingSeconds;
  const timerPercent = Math.max(0, Math.min(100, (remainingSeconds / totalSeconds) * 100));
  const isUrgentTimer = remainingSeconds <= 5 && remainingSeconds > 0 && activeQuiz.timer.isRunning;

  // First buzzer in queue
  const firstBuzz = activeQuiz.buzzer.queue[0] || null;
  const remainingBuzzQueue = activeQuiz.buzzer.queue.slice(1);

  return (
    <div className="min-h-[calc(100vh-57px)] bg-radial from-slate-900 via-slate-950 to-black text-slate-100 flex flex-col justify-between p-4 md:p-8 select-none overflow-x-hidden font-sans">
      {/* Broadcast Header Banner */}
      <div className="flex items-center justify-between border-b border-sky-900/50 pb-4 mb-4 backdrop-blur-sm gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {activeQuiz.collegeLogoUrl ? (
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-white p-1.5 shadow-lg shadow-sky-500/20 border-2 border-sky-400/50 shrink-0">
              <img
                src={activeQuiz.collegeLogoUrl}
                alt={`${activeQuiz.organizedBy || activeQuiz.title} Logo`}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-amber-400 p-0.5 shadow-lg shadow-sky-500/25 shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Trophy className="w-7 h-7 text-amber-400 drop-shadow" />
              </div>
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-black tracking-wider bg-gradient-to-r from-sky-300 via-blue-100 to-amber-300 bg-clip-text text-transparent">
                MIND EXPEDITION
              </h1>
              <span className="bg-sky-500/20 border border-sky-400/40 text-sky-300 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-widest uppercase">
                {activeQuiz.code}
              </span>
            </div>
            <p className="text-xs md:text-sm text-slate-400 font-medium truncate">
              {activeQuiz.title}
              {activeQuiz.organizedBy ? ` • Organized by ${activeQuiz.organizedBy}` : ''}
              {activeQuiz.date ? ` • ${formatQuizDate(activeQuiz.date)}` : ''}
              {activeQuiz.venue ? ` • ${activeQuiz.venue}` : ''}
            </p>
          </div>
        </div>

        {/* Current Round indicator & Live Status */}
        <div className="flex items-center gap-6 shrink-0">
          {currentRound && activeQuiz.displayScreen !== 'welcome' && activeQuiz.displayScreen !== 'winner' && (
            <div className="text-right">
              <div className="text-[11px] font-bold uppercase tracking-widest text-sky-400">
                Round {currentRound.roundNumber} of {activeQuiz.rounds.length}
              </div>
              <div className="text-lg md:text-xl font-extrabold text-white">{currentRound.name}</div>
            </div>
          )}

          {/* Active buzzer badge */}
          {activeQuiz.buzzer.isActive && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-extrabold animate-pulse shadow-lg shadow-emerald-500/30">
              <Zap className="w-5 h-5 text-emerald-400" />
              <span>BUZZER ACTIVE</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Dynamic Center Screen */}
      <div className="flex-1 flex flex-col justify-center items-center my-2 max-w-7xl mx-auto w-full">
        {/* 1. WELCOME SCREEN */}
        {activeQuiz.displayScreen === 'welcome' && (
          <div className="w-full text-center py-6 px-4">
            {activeQuiz.collegeLogoUrl ? (
              <div className="mx-auto mb-5 flex flex-col items-center gap-3">
                <div className="w-24 h-24 md:w-28 md:h-28 rounded-3xl bg-white p-2.5 shadow-2xl shadow-sky-500/20 border-2 border-sky-400/60 flex items-center justify-center">
                  <img
                    src={activeQuiz.collegeLogoUrl}
                    alt={`${activeQuiz.organizedBy || activeQuiz.title} Logo`}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-950/80 border border-sky-800 text-sky-300 text-sm font-semibold tracking-wide">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Welcome to the Grand Arena</span>
                </div>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-950/80 border border-sky-800 text-sky-300 text-sm font-semibold tracking-wide mb-6">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Welcome to the Grand Arena</span>
              </div>
            )}

            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-3 drop-shadow-md">
              {activeQuiz.title}
            </h2>
            {activeQuiz.subtitle && (
              <p className="text-xl md:text-2xl text-sky-200/85 font-medium mb-5 max-w-3xl mx-auto">
                {activeQuiz.subtitle}
              </p>
            )}

            {/* Organized By College & Date Showcase */}
            {(activeQuiz.organizedBy || activeQuiz.date) && (
              <div className="inline-flex flex-wrap items-center justify-center gap-3 md:gap-5 px-5 py-3 rounded-2xl bg-slate-900/90 border border-sky-700/50 shadow-xl mb-7">
                {activeQuiz.organizedBy && (
                  <div className="flex items-center gap-2 text-left">
                    <Building2 className="w-5 h-5 text-amber-400 shrink-0" />
                    <div className="text-sm md:text-base">
                      <span className="text-slate-400 font-semibold">Organized by </span>
                      <strong className="text-white font-extrabold tracking-wide">
                        {activeQuiz.organizedBy}
                      </strong>
                    </div>
                  </div>
                )}
                {activeQuiz.organizedBy && activeQuiz.date && (
                  <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-sky-500" />
                )}
                {activeQuiz.date && (
                  <div className="flex items-center gap-2 text-sm md:text-base text-sky-300 font-bold">
                    <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
                    <span>{formatQuizDate(activeQuiz.date)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Participating Teams Roster (No QR code shown until Buzzer Round) */}
            <div className="max-w-4xl mx-auto mt-6">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 text-left shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                    <h3 className="font-bold text-slate-200 flex items-center gap-2">
                      <Users className="w-5 h-5 text-sky-400" />
                      Participating Teams &amp; Institutions
                    </h3>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
                      {activeQuiz.teams.length} Teams Registered
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeQuiz.teams.map((team, idx) => (
                      <div
                        key={team.id}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-3"
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm"
                          style={{ backgroundColor: team.color }}
                        >
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-sm text-white truncate">{team.name}</div>
                          <div className="text-[11px] text-slate-400 truncate">{team.institution}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                  <span>Quizmaster: <strong className="text-slate-200">{activeQuiz.quizmasterName}</strong></span>
                  <span>Date: <strong className="text-slate-200">{activeQuiz.date}</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. ROUND INTRODUCTION SCREEN (Includes QR Join Lobby ONLY for Buzzer Round before questions start) */}
        {activeQuiz.displayScreen === 'round_intro' && currentRound && (
          <div className="w-full max-w-5xl text-center py-8 px-6 bg-slate-900/90 border border-sky-800/60 rounded-3xl shadow-2xl backdrop-blur-md">
            <div className="inline-block px-4 py-1.5 rounded-full bg-sky-500/20 text-sky-300 text-sm font-bold uppercase tracking-widest mb-3 border border-sky-400/30">
              Round {currentRound.roundNumber} of {activeQuiz.rounds.length}
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
              {currentRound.name}
            </h2>
            <p className="text-base md:text-lg text-slate-300 mb-6 max-w-2xl mx-auto font-medium">
              {currentRound.description}
            </p>

            {currentRound.type === 'buzzer' ? (
              /* BUZZER ROUND ONLY: QR Code & Live Participant Join Confirmation */
              (() => {
                const joinedCount = activeQuiz.teams.filter((t) => t.isOnline).length;
                const allJoined = activeQuiz.teams.length > 0 && joinedCount === activeQuiz.teams.length;

                return (
                  <div className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch text-left">
                      {/* QR Code Card (Shown ONLY before starting Buzzer Round questions) */}
                      <div className="bg-slate-950/90 border-2 border-sky-500/50 rounded-2xl p-6 flex flex-col items-center justify-center shadow-xl">
                        <div className="bg-white p-3 rounded-xl shadow-lg mb-3">
                          {qrDataUrl ? (
                            <img src={qrDataUrl} alt="Join QR Code" className="w-44 h-44" />
                          ) : (
                            <QrCode className="w-44 h-44 text-slate-800" />
                          )}
                        </div>
                        <div className="text-xs font-extrabold text-sky-400 uppercase tracking-wider mb-1 text-center">
                          SCAN TO JOIN ON PHONE
                        </div>
                        <div className="text-sm text-slate-300 font-mono">
                          Room Code: <strong className="text-white text-base">{activeQuiz.code}</strong>
                        </div>
                        <p className="text-[11px] text-slate-400 text-center mt-2">
                          Scan and select your Team on mobile before buzzer questions start.
                        </p>
                      </div>

                      {/* Live Participant Join Verification Grid */}
                      <div className="md:col-span-2 bg-slate-950/80 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
                            <h3 className="font-black text-white text-base flex items-center gap-2">
                              <Zap className="w-5 h-5 text-amber-400" />
                              Participant Mobile Join Status
                            </h3>
                            <span
                              className={`text-xs px-3 py-1 rounded-full font-black uppercase border ${
                                allJoined
                                  ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                                  : 'bg-amber-950/80 text-amber-300 border-amber-600/80 animate-pulse'
                              }`}
                            >
                              {joinedCount} / {activeQuiz.teams.length} Joined
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {activeQuiz.teams.map((team, idx) => (
                              <div
                                key={team.id}
                                className={`p-3.5 rounded-xl border-2 flex items-center justify-between gap-3 transition-all ${
                                  team.isOnline
                                    ? 'bg-emerald-950/30 border-emerald-500/70'
                                    : 'bg-slate-900/70 border-slate-800'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div
                                    className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm shrink-0"
                                    style={{ backgroundColor: team.color }}
                                  >
                                    {String.fromCharCode(65 + idx)}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-sm text-white truncate">{team.name}</div>
                                    <div className="text-[11px] text-slate-400 truncate">{team.institution}</div>
                                  </div>
                                </div>

                                {team.isOnline ? (
                                  <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 text-[11px] font-black uppercase">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Joined
                                  </span>
                                ) : (
                                  <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-700/70 text-amber-300 text-[11px] font-bold uppercase animate-pulse">
                                    <Clock className="w-3 h-3" />
                                    Waiting
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div
                          className={`mt-4 p-3 rounded-xl border text-xs font-bold flex items-center justify-between ${
                            allJoined
                              ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                              : 'bg-amber-950/50 border-amber-700/60 text-amber-200'
                          }`}
                        >
                          <span>
                            {allJoined
                              ? '✓ All competing participants have joined via QR code! Ready to start Buzzer Round questions.'
                              : `Waiting for ${activeQuiz.teams.length - joinedCount} more participant team(s) to scan the QR code and join...`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-sky-950/40 border border-sky-900/80 p-3.5 rounded-xl text-sm text-sky-200">
                      <strong>Rules:</strong> {currentRound.rulesSummary}
                    </div>
                  </div>
                );
              })()
            ) : (
              /* STANDARD ROUND INTRO (No QR code shown) */
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-6">
                  <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl">
                    <div className="text-xs text-slate-400 uppercase font-semibold">Time Allocation</div>
                    <div className="text-2xl font-black text-sky-400 mt-1">
                      {currentRound.timing.durationSeconds}s
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {currentRound.timing.timerType === 'per_participant_total' ? 'Total round time' : 'Per question'}
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl">
                    <div className="text-xs text-slate-400 uppercase font-semibold">Scoring Rule</div>
                    <div className="text-2xl font-black text-emerald-400 mt-1">
                      +{currentRound.scoring.marksCorrect} / {currentRound.scoring.marksIncorrect}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {currentRound.scoring.marksIncorrect < 0 ? 'Negative marking active' : 'No negative marking'}
                    </div>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl">
                    <div className="text-xs text-slate-400 uppercase font-semibold">Maximum Marks</div>
                    <div className="text-2xl font-black text-amber-400 mt-1">
                      {currentRound.maxMarksCalculated} pts
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {currentRound.roundNumber === 1 || currentRound.type === 'rapid_fire'
                        ? `5 Distinct Qs per Team (${activeQuiz.teams.length} Teams = ${currentRound.questions.length} Qs)`
                        : `${currentRound.questions.length} Questions in round`}
                    </div>
                  </div>
                </div>

                <div className="bg-sky-950/40 border border-sky-900/80 p-3.5 rounded-xl text-sm text-sky-200">
                  <strong>Rules:</strong> {currentRound.rulesSummary}
                </div>
              </>
            )}
          </div>
        )}

        {/* 3. QUESTION / VISUAL PRESENTATION SCREEN */}
        {activeQuiz.displayScreen === 'question' && currentQuestion && (
          <div className="w-full flex flex-col gap-6">
            {/* Top question status row: Active Team turn + Timer */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 px-6 py-3.5 rounded-2xl shadow-lg">
              {/* Question metadata badge */}
              <div className="flex items-center gap-3">
                <span className="bg-sky-600 text-white font-extrabold text-sm px-3 py-1 rounded-lg">
                  {isRapidFire
                    ? `Lot Q${rfQuestionInLot}/${rfLotTotal}`
                    : `Q${activeQuiz.currentQuestionIndex + 1}`}
                </span>
                {currentRound?.roundNumber === 1 && activeQuiz.teams.length > 0 && (
                  <span className="bg-indigo-950 border border-indigo-700/70 text-indigo-200 font-bold text-xs px-2.5 py-1 rounded-lg">
                    Cycle {Math.floor(activeQuiz.currentQuestionIndex / activeQuiz.teams.length) + 1} of{' '}
                    {Math.ceil(currentRound.questions.length / activeQuiz.teams.length)}
                  </span>
                )}
                {isRapidFire && activeQuiz.teams.length > 0 && (
                  <span className="bg-indigo-950 border border-indigo-700/70 text-indigo-200 font-bold text-xs px-2.5 py-1 rounded-lg">
                    Team Lot {activeTeamIdx + 1} of {activeQuiz.teams.length} • Q
                    {activeQuiz.currentQuestionIndex + 1}
                  </span>
                )}
                <span className="text-slate-300 font-semibold text-sm">
                  {currentQuestion.category}
                </span>
                <span className="text-xs px-2 py-0.5 rounded uppercase font-bold tracking-wider bg-slate-800 text-slate-400">
                  {currentQuestion.difficulty}
                </span>
              </div>

              {/* Active team turn (for horizontal / consecutive rounds) */}
              {activeTeam && currentRound?.presentationOrder !== 'buzzer_open' && (
                <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 px-4 py-1.5 rounded-xl">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Team Turn:</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: activeTeam.color }}
                    />
                    <span className="font-extrabold text-base text-white">{activeTeam.name}</span>
                  </div>
                </div>
              )}

              {/* Circular / Linear Countdown Timer */}
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center border-4 font-black text-xl transition-all ${
                      isUrgentTimer
                        ? 'border-rose-500 text-rose-400 bg-rose-950/40 scale-110 animate-ping-short'
                        : activeQuiz.timer.isRunning
                        ? 'border-sky-400 text-sky-300 bg-sky-950/30'
                        : 'border-slate-700 text-slate-400 bg-slate-900'
                    }`}
                  >
                    {remainingSeconds}
                  </div>
                </div>
                <div className="text-xs font-semibold text-slate-400">
                  {activeQuiz.timer.isRunning ? 'SECONDS' : 'STOPPED'}
                </div>
              </div>
            </div>

            {/* Question Text Box */}
            <div className="bg-slate-900/90 border border-sky-900/50 rounded-3xl p-6 md:p-10 shadow-2xl backdrop-blur-md">
              {isRapidFire && rapidFirePhase === 'ready' ? (
                <div className="py-12 text-center space-y-4">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/20 border border-sky-400/50 text-sky-300 text-sm font-black uppercase tracking-widest">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span>Rapid Fire Standby — Team Lot {activeTeamIdx + 1}</span>
                  </div>
                  <h3 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                    Get Ready: {activeTeam?.name || 'Next Team'}
                  </h3>
                  <p className="text-base md:text-xl text-slate-300 max-w-2xl mx-auto">
                    {rfLotTotal} Rapid Fire Questions • {remainingSeconds} Seconds Continuous Clock
                  </p>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-300 animate-pulse">
                    Waiting for Quizmaster to press Start...
                  </div>
                </div>
              ) : isRapidFire && rapidFirePhase === 'lot_done' && currentRound ? (
                /* RAPID FIRE 5-QUESTION LOT REVIEW & ANSWER REVEAL */
                (() => {
                  const lotQuestions = currentRound.questions.slice(rfLotStart, rfLotEnd + 1);
                  const lotResults = activeQuiz.rapidFireLotResults || {};
                  const correctCount = lotQuestions.filter((q) => lotResults[q.id] === 'correct').length;
                  const wrongCount = lotQuestions.filter((q) => lotResults[q.id] === 'incorrect').length;
                  const lotPoints = correctCount * (currentRound.scoring?.marksCorrect || 10);

                  return (
                    <div className="space-y-5 animate-fade-in">
                      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="w-8 h-8 text-sky-400 shrink-0" />
                          <div>
                            <div className="text-xs font-black uppercase tracking-widest text-sky-400">
                              Rapid Fire Lot Review — Timer Stopped ({remainingSeconds}s left)
                            </div>
                            <h3 className="text-2xl md:text-3xl font-black text-white">
                              {activeTeam?.name} — 5 Questions &amp; Official Answers
                            </h3>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-3 py-1.5 rounded-xl bg-emerald-950/90 border border-emerald-500/70 text-emerald-400 font-black text-xs uppercase">
                            ✓ {correctCount} Correct (+{lotPoints} pts)
                          </span>
                          <span className="px-3 py-1.5 rounded-xl bg-rose-950/90 border border-rose-500/70 text-rose-400 font-black text-xs uppercase">
                            ✗ {wrongCount} Wrong
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {lotQuestions.map((qItem, idx) => {
                          const status = lotResults[qItem.id] || 'unanswered';
                          const isCorrect = status === 'correct';
                          const isWrong = status === 'incorrect';
                          const isPassed = status === 'passed';

                          return (
                            <div
                              key={qItem.id}
                              className={`p-4 rounded-2xl border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                                isCorrect
                                  ? 'bg-emerald-950/35 border-emerald-500/70 shadow-lg shadow-emerald-950/30'
                                  : isWrong
                                  ? 'bg-rose-950/40 border-rose-500/80 shadow-lg shadow-rose-950/30'
                                  : 'bg-slate-950/80 border-slate-700/80'
                              }`}
                            >
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <span
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                                    isCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : isWrong
                                      ? 'bg-rose-600 text-white'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}
                                >
                                  Q{idx + 1}
                                </span>
                                <div className="space-y-1.5 min-w-0">
                                  <div className="text-base md:text-lg font-bold text-white leading-snug">
                                    <MathText text={qItem.text} />
                                  </div>
                                  <div className="text-sm md:text-base flex flex-wrap items-center gap-2">
                                    <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                                      Correct Answer:
                                    </span>
                                    <span
                                      className={`font-black text-base md:text-lg ${
                                        isCorrect
                                          ? 'text-emerald-400'
                                          : isWrong
                                          ? 'text-rose-400'
                                          : 'text-amber-300'
                                      }`}
                                    >
                                      <MathText text={qItem.answer} />
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center md:justify-end">
                                {isCorrect ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-400 text-xs font-black uppercase">
                                    <CheckCircle2 className="w-4 h-4" />
                                    Correct (+{currentRound.scoring?.marksCorrect || 10})
                                  </span>
                                ) : isWrong ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-400 text-rose-400 text-xs font-black uppercase">
                                    <XCircle className="w-4 h-4" />
                                    Wrong (0)
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/70 border border-amber-600/60 text-amber-300 text-xs font-bold uppercase">
                                    {isPassed ? 'Passed (0)' : 'Unanswered (0)'}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <>
                  <div className="text-2xl md:text-4xl font-extrabold text-white leading-relaxed tracking-tight text-center md:text-left mb-6">
                    <MathText text={currentQuestion.text} />
                  </div>

                  {/* Visual Round Image / Media Display */}
                  {currentQuestion.mediaUrl && (
                    <div className="my-6 rounded-2xl overflow-hidden border-2 border-sky-800/80 bg-slate-950 flex items-center justify-center p-3 shadow-inner">
                      <img
                        src={currentQuestion.mediaUrl}
                        alt="Question Visual Material"
                        className="max-h-[380px] w-auto object-contain rounded-xl drop-shadow-2xl"
                      />
                    </div>
                  )}

                  {/* Multiple Choice Options (for Rounds 1, 3, 5 and MCQ questions) */}
                  {currentQuestion.options && currentQuestion.options.length > 0 && (
                    <div className="mt-8">
                      {!activeQuiz.optionsRevealed ? (
                        <div className="p-8 rounded-3xl bg-slate-950/80 border-2 border-dashed border-sky-600/40 text-center flex flex-col items-center justify-center gap-3 shadow-inner">
                          <div className="w-14 h-14 rounded-2xl bg-sky-950/90 border border-sky-700/80 text-sky-400 flex items-center justify-center animate-pulse">
                            <Radio className="w-7 h-7" />
                          </div>
                          <div>
                            <div className="text-xl font-black text-white tracking-wide">
                              QUESTION DICTATED BY QUIZMASTER
                            </div>
                            <p className="text-sm text-sky-300 font-semibold mt-1">
                              Listen to the Quizmaster • Four options will appear when announced
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-fade-in">
                          {currentQuestion.options.map((opt, idx) => {
                            const isSelected = activeQuiz.selectedOptionIndex === idx;
                            const isCorrectKey = idx === currentQuestion.correctOptionIndex;
                            const isAnswerEvaluated =
                              activeQuiz.answerRevealed ||
                              (activeQuiz.selectedOptionIndex !== null && activeQuiz.selectedOptionIndex !== undefined);

                            let cardStyle =
                              'bg-slate-950/80 border-slate-700/80 text-white shadow-xl hover:border-sky-500/50';
                            let badgeStyle = 'bg-slate-800 text-sky-400 border border-slate-700';
                            let statusTag = null;

                            if (isAnswerEvaluated) {
                              if (isCorrectKey) {
                                cardStyle =
                                  'bg-emerald-950/95 border-emerald-400 text-emerald-100 ring-4 ring-emerald-500/50 shadow-2xl shadow-emerald-950/80 scale-[1.02]';
                                badgeStyle = 'bg-emerald-600 text-white border-emerald-400';
                                statusTag = (
                                  <span className="ml-auto text-xs font-black uppercase tracking-wider bg-emerald-500 text-slate-950 px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-md">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    CORRECT
                                  </span>
                                );
                              } else if (isSelected) {
                                cardStyle =
                                  'bg-rose-950/95 border-rose-500 text-rose-100 ring-4 ring-rose-500/50 shadow-2xl shadow-rose-950/80 animate-pulse';
                                badgeStyle = 'bg-rose-600 text-white border-rose-400';
                                statusTag = (
                                  <span className="ml-auto text-xs font-black uppercase tracking-wider bg-rose-500 text-white px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-md">
                                    <XCircle className="w-3.5 h-3.5" />
                                    SELECTED (0 PTS)
                                  </span>
                                );
                              } else {
                                cardStyle = 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-40';
                                badgeStyle = 'bg-slate-900 text-slate-600 border-slate-800';
                              }
                            }

                            return (
                              <div
                                key={idx}
                                className={`p-5 rounded-2xl border-2 flex items-center gap-4 text-lg md:text-xl font-bold transition-all ${cardStyle}`}
                              >
                                <span
                                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black shrink-0 ${badgeStyle}`}
                                >
                                  {String.fromCharCode(65 + idx)}
                                </span>
                                <span className="leading-snug">
                                  <MathText text={opt} />
                                </span>
                                {statusTag}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Time Out Alert Banner (when 30s expires with no answer) */}
                  {activeQuiz.timer.remainingSeconds === 0 &&
                    !activeQuiz.timer.isRunning &&
                    (activeQuiz.selectedOptionIndex === null || activeQuiz.selectedOptionIndex === undefined) &&
                    currentRound &&
                    (currentRound.roundNumber === 1 || currentRound.roundNumber === 3 || currentRound.roundNumber === 5) && (
                      <div className="mt-6 p-4 rounded-2xl bg-amber-950/80 border-2 border-amber-500 text-amber-200 flex items-center justify-between gap-4 shadow-xl animate-bounce-short">
                        <div className="flex items-center gap-3">
                          <Clock className="w-6 h-6 text-amber-400 animate-spin" />
                          <div>
                            <div className="text-base font-black text-white">TIME EXPIRED — 0 POINTS ALLOTTED</div>
                            <div className="text-xs text-amber-300">
                              Answer was not submitted within the 30-second time limit.
                            </div>
                          </div>
                        </div>
                        <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase">
                          0 Marks
                        </span>
                      </div>
                    )}

                  {/* Answer Revealed Highlight (Official Explanation & Context) */}
                  {activeQuiz.answerRevealed && (
                    <div className="mt-8 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-teal-950/80 to-slate-900 border-2 border-emerald-400/80 text-emerald-100 shadow-2xl animate-fade-in">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-400 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Official Answer & Scientific Explanation
                      </div>
                      <div className="text-2xl md:text-3xl font-black text-white mb-2">
                        <MathText text={currentQuestion.answer} />
                      </div>
                      {currentQuestion.explanation && (
                        <p className="text-sm md:text-base text-emerald-200/90 font-medium">
                          <MathText text={currentQuestion.explanation} />
                        </p>
                      )}
                      {currentQuestion.sourceUrl && (
                        <div className="text-[11px] text-emerald-400/70 mt-3 font-mono">
                          Ref: {currentQuestion.sourceUrl} ({currentQuestion.publicationDate})
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* 4. BUZZER ACTIVATED & LIVE QUEUE SCREEN */}
        {activeQuiz.displayScreen === 'buzzer' && (
          <div className="w-full max-w-5xl flex flex-col items-center">
            {/* Buzzer header banner */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/20 border-2 border-emerald-400 text-emerald-300 font-extrabold text-lg uppercase tracking-wider mb-2 shadow-lg shadow-emerald-500/30 animate-pulse">
                <Zap className="w-6 h-6 text-emerald-400" />
                <span>FASTEST FINGER FIRST — BUZZER ACTIVATED!</span>
              </div>
              <p className="text-slate-300 text-sm">
                Press the <strong>BUZZ IN!</strong> button on your smartphone screen immediately!
              </p>
            </div>

            {/* Current Question preview */}
            {currentQuestion && (
              <div className="w-full bg-slate-900/90 border border-slate-800 p-6 rounded-3xl mb-6 shadow-xl text-center">
                <div className="text-xs uppercase font-bold text-sky-400 tracking-wider mb-2">
                  Question on Stage
                </div>
                <div className="text-xl md:text-2xl font-extrabold text-white">
                  <MathText text={currentQuestion.text} />
                </div>
              </div>
            )}

            {/* FIRST TO BUZZ - HERO SPOTLIGHT */}
            {firstBuzz ? (
              <div className="w-full bg-gradient-to-b from-emerald-950/80 via-slate-900/95 to-slate-950 border-2 border-emerald-400 p-8 rounded-3xl text-center shadow-2xl shadow-emerald-500/20 mb-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 animate-pulse" />
                <div className="inline-block px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest mb-2 shadow">
                  ★ FIRST TO BUZZ ★
                </div>
                <div className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">
                  {firstBuzz.teamName}
                </div>
                <div className="text-sm md:text-base text-emerald-300 font-medium">
                  {firstBuzz.institution}
                </div>
                <div className="text-xs text-slate-400 font-mono mt-2">
                  Response Latency: <span className="text-emerald-400 font-bold">+{firstBuzz.latencyMs}ms</span>
                </div>
              </div>
            ) : (
              <div className="w-full bg-slate-900/50 border-2 border-dashed border-sky-800/80 p-12 rounded-3xl text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-sky-950 border border-sky-700 flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Zap className="w-8 h-8 text-amber-400" />
                </div>
                <div className="text-xl md:text-2xl font-bold text-slate-200">
                  Waiting for First Buzzer Press...
                </div>
                <div className="text-sm text-slate-400 mt-1">
                  Server timestamp synchronized at sub-millisecond precision
                </div>
              </div>
            )}

            {/* Other participants in the queue */}
            {remainingBuzzQueue.length > 0 && (
              <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <div className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-3 px-2">
                  Remaining Queue Order
                </div>
                <div className="space-y-2">
                  {remainingBuzzQueue.map((item, idx) => (
                    <div
                      key={item.teamId}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold flex items-center justify-center">
                          #{idx + 2}
                        </span>
                        <div>
                          <div className="font-bold text-white text-sm">{item.teamName}</div>
                          <div className="text-[11px] text-slate-400">{item.institution}</div>
                        </div>
                      </div>
                      <div className="text-xs font-mono text-slate-400">
                        +{item.latencyMs}ms
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. SCOREBOARD / LEADERBOARD SCREEN */}
        {activeQuiz.displayScreen === 'scoreboard' && (
          <div className="w-full max-w-5xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
                  <Award className="w-8 h-8 text-amber-400" />
                  Official Live Leaderboard
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Cumulative scores across all completed competition rounds
                </p>
              </div>
              <div className="text-xs font-mono bg-sky-950/60 border border-sky-800 text-sky-300 px-3 py-1.5 rounded-xl font-bold">
                {activeQuiz.rounds.length} Total Rounds
              </div>
            </div>

            {/* Ranked bar cards */}
            <div className="space-y-3 mb-6">
              {rankedTeams.map((team, idx) => {
                const totalScore = activeQuiz.totalScores[team.id] || 0;
                const isLeader = idx === 0 && totalScore > 0;

                return (
                  <div
                    key={team.id}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isLeader
                        ? 'bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/80 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shadow ${
                          idx === 0
                            ? 'bg-amber-400 text-slate-950'
                            : idx === 1
                            ? 'bg-slate-300 text-slate-950'
                            : idx === 2
                            ? 'bg-amber-700 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        #{idx + 1}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: team.color }}
                          />
                          <span className="font-bold text-base md:text-lg text-white">
                            {team.name}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">{team.institution}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl md:text-3xl font-black text-white font-mono">
                        {totalScore}
                      </div>
                      <div className="text-[11px] text-slate-400 font-semibold uppercase">
                        Total Marks
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Round-by-round score breakdown matrix */}
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3">Team</th>
                    {activeQuiz.rounds.map((r) => (
                      <th key={r.id} className="p-3 text-center">
                        R{r.roundNumber}
                      </th>
                    ))}
                    <th className="p-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {rankedTeams.map((team) => (
                    <tr key={team.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-white">{team.name}</td>
                      {activeQuiz.rounds.map((r) => (
                        <td key={r.id} className="p-3 text-center font-mono text-slate-300">
                          {activeQuiz.roundScores[team.id]?.[r.id] ?? 0}
                        </td>
                      ))}
                      <td className="p-3 text-right font-black font-mono text-sky-400 text-sm">
                        {activeQuiz.totalScores[team.id] || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 6. WINNER CELEBRATION SCREEN */}
        {activeQuiz.displayScreen === 'winner' && (
          <div className="w-full max-w-4xl text-center py-6 px-6 bg-radial from-slate-900 via-slate-950 to-black border-2 border-amber-500/80 rounded-3xl shadow-2xl relative overflow-hidden">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 p-1 mx-auto mb-4 shadow-xl shadow-amber-500/30 flex items-center justify-center">
              <Trophy className="w-12 h-12 text-slate-950" />
            </div>

            <div className="inline-block px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-black uppercase tracking-widest mb-3">
              MIND EXPEDITION CHAMPION
            </div>

            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-2 drop-shadow">
              {rankedTeams[0]?.name || 'Champion Team'}
            </h2>
            <p className="text-lg md:text-xl text-amber-200/90 font-medium mb-6">
              {rankedTeams[0]?.institution}
            </p>

            <div className="inline-block bg-slate-900/90 border border-amber-500/40 px-8 py-4 rounded-2xl mb-8 shadow-xl">
              <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Winning Grand Total
              </div>
              <div className="text-4xl md:text-5xl font-black text-amber-400 font-mono mt-1">
                {activeQuiz.totalScores[rankedTeams[0]?.id] || 0} Marks
              </div>
            </div>

            {/* Podium 2nd and 3rd */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
              {rankedTeams[1] && (
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-700">
                  <div className="text-xs font-bold text-slate-300 uppercase">1st Runner-Up</div>
                  <div className="text-lg font-bold text-white mt-1">{rankedTeams[1].name}</div>
                  <div className="text-xs text-slate-400 truncate">{rankedTeams[1].institution}</div>
                  <div className="text-xl font-black text-slate-200 font-mono mt-2">
                    {activeQuiz.totalScores[rankedTeams[1].id] || 0} pts
                  </div>
                </div>
              )}
              {rankedTeams[2] && (
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-amber-900/60">
                  <div className="text-xs font-bold text-amber-500 uppercase">2nd Runner-Up</div>
                  <div className="text-lg font-bold text-white mt-1">{rankedTeams[2].name}</div>
                  <div className="text-xs text-slate-400 truncate">{rankedTeams[2].institution}</div>
                  <div className="text-xl font-black text-amber-400 font-mono mt-2">
                    {activeQuiz.totalScores[rankedTeams[2].id] || 0} pts
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Broadcast Bottom Leaderboard Ticker */}
      <div className="border-t border-slate-800 pt-3 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Live Score Ticker:
          </span>
          <div className="flex flex-wrap items-center gap-3">
            {rankedTeams.map((team, idx) => (
              <div
                key={team.id}
                className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: team.color }}
                />
                <span className="font-semibold text-slate-200">{team.name}:</span>
                <span className="font-black text-sky-400 font-mono">
                  {activeQuiz.totalScores[team.id] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="text-slate-400 text-[11px] font-medium hidden sm:block">
          MIND EXPEDITION • Live Academic Quiz Arena
        </div>
      </div>
    </div>
  );
};
