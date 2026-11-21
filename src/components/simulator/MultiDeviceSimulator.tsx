import React, { useState } from 'react';
import { useQuiz } from '../../context/QuizContext';
import {
  Zap,
  Smartphone,
  X,
  Play,
  CheckCircle2,
  Users,
  Timer,
  Sparkles,
} from 'lucide-react';

interface MultiDeviceSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MultiDeviceSimulator: React.FC<MultiDeviceSimulatorProps> = ({
  isOpen,
  onClose,
}) => {
  const { activeQuiz, dispatchAction } = useQuiz();
  const [simulatingRace, setSimulatingRace] = useState(false);
  const [localPressResults, setLocalPressResults] = useState<Record<string, { pos?: number; time: string }>>({});

  if (!isOpen || !activeQuiz) return null;

  // Single team buzz simulator
  const handleSingleBuzz = async (teamId: string) => {
    try {
      const res = await fetch('/api/buzzer/press', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: activeQuiz.id, teamId }),
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setLocalPressResults((prev) => ({
          ...prev,
          [teamId]: { pos: data.position, time: new Date().toLocaleTimeString() },
        }));
      }
    } catch (err) {
      console.warn('Simulator buzz request:', err);
    }
  };

  // Simulate concurrent rapid-fire race with realistic random millisecond offsets
  const handleSimulateConcurrentRace = async () => {
    if (!activeQuiz.buzzer.isActive) {
      await dispatchAction('BUZZER_ACTIVATE', { timeAllowedSeconds: 15 });
    }

    setSimulatingRace(true);
    setLocalPressResults({});

    // Generate random delay offsets (between 40ms and 600ms) to simulate distinct human reaction times
    const teams = activeQuiz.teams.slice(0, 4);
    const randomized = teams.map((team) => ({
      teamId: team.id,
      delay: Math.floor(60 + Math.random() * 450),
    }));

    // Trigger presses with exact timeout delays
    randomized.forEach(({ teamId, delay }) => {
      setTimeout(() => {
        handleSingleBuzz(teamId);
      }, delay);
    });

    setTimeout(() => {
      setSimulatingRace(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-5xl w-full shadow-2xl flex flex-col max-h-[90vh]">
        {/* Simulator Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                Multi-Device Synchronized Buzzer Simulator
              </h2>
              <p className="text-xs text-slate-400">
                Simulate 4 independent participant smartphones side-by-side to verify atomic server queue ordering
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateConcurrentRace}
              disabled={simulatingRace}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Real-Time Race</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Buzzer status banner */}
        <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800 mb-4 text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                activeQuiz.buzzer.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
              }`}
            />
            <span className="font-bold text-slate-200">
              Server Buzzer Status: {activeQuiz.buzzer.isActive ? 'ACTIVE & LISTENING' : 'LOCKED'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!activeQuiz.buzzer.isActive ? (
              <button
                onClick={() => dispatchAction('BUZZER_ACTIVATE', { timeAllowedSeconds: 15 })}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Activate Buzzer
              </button>
            ) : (
              <button
                onClick={() => dispatchAction('BUZZER_DEACTIVATE')}
                className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Lock Buzzer
              </button>
            )}
            <button
              onClick={() => dispatchAction('BUZZER_CLEAR')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700"
            >
              Clear Queue
            </button>
          </div>
        </div>

        {/* 4 Phones Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 overflow-y-auto p-1">
          {activeQuiz.teams.slice(0, 4).map((team, idx) => {
            const queueEntry = activeQuiz.buzzer.queue.find((p) => p.teamId === team.id);
            const isFirst = queueEntry?.sequence === 1;
            const hasBuzzed = !!queueEntry;

            return (
              <div
                key={team.id}
                className="bg-slate-950 border-2 rounded-2xl p-4 flex flex-col justify-between shadow-lg relative min-h-[300px]"
                style={{ borderColor: isFirst ? '#10b981' : hasBuzzed ? '#0284c7' : '#334155' }}
              >
                {/* Simulated Phone Top Speaker & Camera Notch */}
                <div className="w-16 h-1.5 bg-slate-800 rounded-full mx-auto mb-3" />

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: team.color }}
                    />
                    <div className="font-extrabold text-sm text-white truncate">{team.name}</div>
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{team.institution}</div>
                  <div className="text-xs font-mono font-bold text-amber-400 mt-1">
                    Score: {activeQuiz.totalScores[team.id] || 0} pts
                  </div>
                </div>

                {/* Simulated Mobile Buzz Button */}
                <div className="my-4 flex flex-col items-center">
                  <button
                    onClick={() => handleSingleBuzz(team.id)}
                    disabled={!activeQuiz.buzzer.isActive || activeQuiz.buzzer.locked || hasBuzzed}
                    className={`w-28 h-28 rounded-full font-black text-sm uppercase flex flex-col items-center justify-center gap-1 shadow-lg transition-all active:scale-95 ${
                      hasBuzzed
                        ? isFirst
                          ? 'bg-emerald-500 text-slate-950 ring-4 ring-emerald-500/40'
                          : 'bg-sky-700 text-white ring-2 ring-sky-500/30'
                        : !activeQuiz.buzzer.isActive || activeQuiz.buzzer.locked
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-rose-600/50 cursor-pointer'
                    }`}
                  >
                    <Zap className="w-6 h-6" />
                    <span>{hasBuzzed ? 'BUZZED' : 'BUZZ IN'}</span>
                  </button>
                </div>

                {/* Queue Position Pill */}
                <div className="text-center">
                  {hasBuzzed ? (
                    <div
                      className={`py-1.5 px-2 rounded-xl text-xs font-extrabold ${
                        isFirst
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-slate-900 text-slate-300 border border-slate-800'
                      }`}
                    >
                      {isFirst ? '★ 1st Position (First!)' : `Position #${queueEntry.sequence}`}
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        +{queueEntry.latencyMs}ms delay
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 font-medium">Ready to press</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
