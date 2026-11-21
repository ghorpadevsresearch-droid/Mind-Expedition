import React, { useState } from 'react';
import { useQuiz } from '../../context/QuizContext';
import {
  Zap,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Wifi,
  WifiOff,
  Trophy,
  Users,
  Clock,
  Sparkles,
  Tv,
} from 'lucide-react';

export const MobileParticipantView: React.FC = () => {
  const {
    activeQuiz,
    mobileTeamId,
    setMobileTeamId,
    pressBuzzer,
    isConnected,
  } = useQuiz();

  const [isPressing, setIsPressing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  if (!activeQuiz) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-400">
        Connecting to MIND EXPEDITION...
      </div>
    );
  }

  const selectedTeam = activeQuiz.teams.find((t) => t.id === mobileTeamId) || activeQuiz.teams[0];
  const currentRound = activeQuiz.rounds[activeQuiz.currentRoundIndex];
  const currentQuestion = currentRound?.questions[activeQuiz.currentQuestionIndex];
  const isBuzzerRound = currentRound?.type === 'buzzer';
  const buzzerState = activeQuiz.buzzer;

  // Has this team already buzzed for the active question?
  const alreadyBuzzed = buzzerState.queue.some((p) => p.teamId === selectedTeam?.id);
  const myQueueEntry = buzzerState.queue.find((p) => p.teamId === selectedTeam?.id);
  const isFirst = myQueueEntry?.sequence === 1;

  // Handle buzzer press
  const handleBuzzClick = async () => {
    if (!isBuzzerRound || !buzzerState.isActive || buzzerState.locked || alreadyBuzzed) return;

    setIsPressing(true);
    const res = await pressBuzzer();
    setIsPressing(false);

    if (res.success) {
      setFeedbackMsg({
        text: res.position === 1 ? '🎉 FIRST TO BUZZ! Get ready to answer.' : `Registered as #${res.position} in response queue!`,
        type: 'success',
      });
    } else {
      setFeedbackMsg({ text: res.message, type: 'error' });
    }
  };

  const isMyTurn = activeQuiz.activeTeamId === selectedTeam?.id;

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-950 text-slate-100 flex flex-col justify-between max-w-md mx-auto p-4 md:p-6 font-sans">
      {/* Mobile Top Header: Room Code, Connection & Team Identity */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center font-bold text-white shadow">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black tracking-wider text-sky-400">MIND EXPEDITION</div>
              <div className="text-[10px] text-slate-400">Room: {activeQuiz.code}</div>
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
              isConnected
                ? 'bg-emerald-950 border-emerald-800 text-emerald-300'
                : 'bg-rose-950 border-rose-800 text-rose-300'
            }`}
          >
            {isConnected ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-rose-400" />}
            <span>{isConnected ? 'ONLINE' : 'CONNECTING'}</span>
          </div>
        </div>

        {/* Team Selector & Score Badge */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-base shadow"
              style={{ backgroundColor: selectedTeam?.color || '#0284c7' }}
            >
              {selectedTeam?.name.charAt(selectedTeam.name.length - 1)}
            </div>
            <div>
              <select
                value={selectedTeam?.id || ''}
                onChange={(e) => setMobileTeamId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white font-extrabold text-sm rounded-lg px-2 py-1 cursor-pointer focus:ring-1 focus:ring-sky-500"
              >
                {activeQuiz.teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[180px]">
                {selectedTeam?.institution}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-black font-mono text-amber-400">
              {activeQuiz.totalScores[selectedTeam?.id || ''] || 0}
            </div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Points</div>
          </div>
        </div>
      </div>

      {/* Main Dynamic Center: Buzzer Mode ONLY during Buzzer Round */}
      <div className="flex-1 flex flex-col justify-center items-center py-6">
        {isBuzzerRound ? (
          /* BUZZER ROUND ONLY: MOBILE PHONES ACTIVE FOR BUZZER */
          buzzerState.isActive ? (
            <div className="w-full flex flex-col items-center">
              {/* Buzzer Button */}
              <button
                onClick={handleBuzzClick}
                disabled={buzzerState.locked || alreadyBuzzed || isPressing}
                className={`w-64 h-64 md:w-72 md:h-72 rounded-full font-black text-3xl tracking-widest uppercase transition-all transform active:scale-95 flex flex-col items-center justify-center gap-3 shadow-2xl relative select-none ${
                  alreadyBuzzed
                    ? isFirst
                      ? 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 text-slate-950 ring-8 ring-emerald-500/30'
                      : 'bg-gradient-to-tr from-sky-700 to-indigo-800 text-white ring-4 ring-sky-500/20'
                    : buzzerState.locked
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-4 border-slate-700'
                    : 'bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 text-white hover:from-rose-500 hover:to-amber-400 ring-8 ring-rose-500/30 animate-pulse cursor-pointer shadow-red-500/50'
                }`}
              >
                <Zap className={`w-14 h-14 ${alreadyBuzzed ? 'text-white' : 'text-amber-200'}`} />
                <span>{alreadyBuzzed ? 'LOCKED IN!' : buzzerState.locked ? 'LOCKED' : 'BUZZ IN!'}</span>
                <span className="text-xs font-semibold tracking-normal lowercase opacity-80">
                  {alreadyBuzzed ? `#${myQueueEntry?.sequence} in queue` : 'tap as fast as possible'}
                </span>
              </button>

              {/* Queue position feedback */}
              {alreadyBuzzed && myQueueEntry && (
                <div
                  className={`mt-6 p-4 rounded-2xl w-full text-center border font-bold text-sm shadow-xl ${
                    isFirst
                      ? 'bg-emerald-950/80 border-emerald-400 text-emerald-200'
                      : 'bg-slate-900 border-slate-700 text-slate-300'
                  }`}
                >
                  {isFirst ? (
                    <div>
                      <span className="text-base text-white">★ YOU ARE #1 IN QUEUE! ★</span>
                      <p className="text-xs text-emerald-300/80 mt-1">Answer verbally when invited by Quizmaster</p>
                    </div>
                  ) : (
                    <div>
                      Registered as <strong>Position #{myQueueEntry.sequence}</strong> (+{myQueueEntry.latencyMs}ms)
                      <p className="text-xs text-slate-400 mt-1">Standing by if pass occurs</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-xl space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                <Zap className="w-8 h-8" />
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Round VI – Buzzer Round (Fastest Finger First)
                </div>
                <h3 className="text-lg font-black text-white mt-1">
                  Buzzer Standby
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  The Quizmaster will read the question on stage and activate the buzzer.
                  Keep your fingers ready on this screen!
                </p>
              </div>
            </div>
          )
        ) : (
          /* ALL OTHER ROUNDS: NOT A BUZZER ROUND */
          <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center shadow-xl space-y-5">
            <div className="w-16 h-16 rounded-full bg-sky-950 border border-sky-800 flex items-center justify-center mx-auto text-sky-400">
              <Tv className="w-8 h-8" />
            </div>

            <div>
              <div className="inline-block px-3 py-1 rounded-full bg-sky-950 border border-sky-800 text-[11px] font-bold uppercase tracking-wider text-sky-300 mb-2">
                {currentRound?.name || 'Stage Question Round'}
              </div>
              <h3 className="text-xl font-black text-white">
                Main Stage Display Mode
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Mobile phones are used <strong className="text-white">only for the Buzzer Round</strong>.
                For all other rounds, questions are displayed on the main projector screen and dictated by the Quizmaster.
              </p>
            </div>

            {/* Current Turn Indicator */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-left">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">
                Current Question Turn:
              </div>
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm text-white">
                  {activeQuiz.activeTeamId
                    ? activeQuiz.teams.find((t) => t.id === activeQuiz.activeTeamId)?.name || 'Next Team'
                    : 'Open Turn'}
                </div>
                {isMyTurn && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500 text-[10px] font-bold animate-pulse">
                    YOUR TEAM'S TURN!
                  </span>
                )}
              </div>
            </div>

            {/* Live timer preview */}
            {activeQuiz.timer.isRunning && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-lg font-bold text-sky-300">
                ⏳ Stage Timer: {activeQuiz.timer.remainingSeconds}s
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Status Ticker */}
      <div className="border-t border-slate-800 pt-3 text-center text-xs text-slate-500">
        MIND EXPEDITION Participant Terminal • {selectedTeam?.name}
      </div>
    </div>
  );
};
