import React, { useState } from 'react';
import { Quiz, Round, RoundType } from '../../types/quiz';
import {
  Layers,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  Save,
  Clock,
  Award,
  Zap,
  BookOpen,
  HelpCircle,
} from 'lucide-react';

interface RoundBuilderModalProps {
  quiz: Quiz;
  isOpen: boolean;
  onClose: () => void;
  onSaveRounds: (updatedRounds: Round[]) => Promise<void>;
}

export const RoundBuilderModal: React.FC<RoundBuilderModalProps> = ({
  quiz,
  isOpen,
  onClose,
  onSaveRounds,
}) => {
  const [rounds, setRounds] = useState<Round[]>(JSON.parse(JSON.stringify(quiz.rounds)));
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const currentRound = rounds[selectedRoundIndex] || rounds[0];

  // Helper to recalculate max marks for a round
  const calculateRoundMaxMarks = (round: Round): number => {
    const qCount = round.questions.length || 5;
    return qCount * (round.scoring.marksCorrect || 10);
  };

  const handleUpdateCurrentRound = (partial: Partial<Round>) => {
    setRounds((prev) => {
      const next = [...prev];
      const updated = { ...next[selectedRoundIndex], ...partial };
      updated.maxMarksCalculated = calculateRoundMaxMarks(updated);
      next[selectedRoundIndex] = updated;
      return next;
    });
  };

  const handleUpdateScoring = (partial: Partial<Round['scoring']>) => {
    if (!currentRound) return;
    const nextScoring = { ...currentRound.scoring, ...partial };
    handleUpdateCurrentRound({ scoring: nextScoring });
  };

  const handleUpdateTiming = (partial: Partial<Round['timing']>) => {
    if (!currentRound) return;
    const nextTiming = { ...currentRound.timing, ...partial };
    handleUpdateCurrentRound({ timing: nextTiming });
  };

  const handleAddRound = () => {
    const newRoundNumber = rounds.length + 1;
    const newRound: Round = {
      id: `round_${Date.now()}`,
      roundNumber: newRoundNumber,
      name: `Round ${newRoundNumber} – Custom Round`,
      type: 'basic',
      description: 'Custom round configured with flexible rules.',
      instructionsForQuizmaster: `1. Introduce the round and explain scoring rules.
2. Pose questions sequentially.
3. Award points based on verified answers.`,
      rulesSummary: '30s per question • +10 / 0 marks',
      questions: [
        {
          id: `q_new_${Date.now()}_1`,
          text: 'Sample question text for new round. Replace with actual question from Question Bank.',
          type: 'verbal',
          category: 'General',
          difficulty: 'medium',
          answer: 'Sample Answer',
        },
      ],
      scoring: {
        marksCorrect: 10,
        marksIncorrect: 0,
        marksUnanswered: 0,
        allowPass: false,
      },
      timing: {
        durationSeconds: 30,
        timerType: 'per_question',
      },
      presentationOrder: 'horizontal',
      responseMode: 'verbal',
      isCompleted: false,
      maxMarksCalculated: 10,
    };

    setRounds([...rounds, newRound]);
    setSelectedRoundIndex(rounds.length);
  };

  const handleRemoveRound = (idx: number) => {
    if (rounds.length <= 1) return;
    const filtered = rounds.filter((_, i) => i !== idx).map((r, i) => ({ ...r, roundNumber: i + 1 }));
    setRounds(filtered);
    setSelectedRoundIndex(Math.max(0, idx - 1));
  };

  const handleMoveRound = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= rounds.length) return;

    const next = [...rounds];
    const temp = next[idx];
    next[idx] = next[targetIdx];
    next[targetIdx] = temp;

    const renumbered = next.map((r, i) => ({ ...r, roundNumber: i + 1 }));
    setRounds(renumbered);
    setSelectedRoundIndex(targetIdx);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveRounds(rounds);
    setIsSaving(false);
    onClose();
  };

  // Grand Max Marks total
  const totalMaxMarks = rounds.reduce((sum, r) => sum + calculateRoundMaxMarks(r), 0);

  const roundTypes: { type: RoundType; label: string }[] = [
    { type: 'basic', label: 'Basic Round (Standard Questions)' },
    { type: 'rapid_fire', label: 'Rapid Fire Round (90s Speed Qs)' },
    { type: 'straightforward', label: 'Straightforward Round (Direct Knowledge)' },
    { type: 'visual', label: 'Visual Round (Images, Diagrams, Apparatus)' },
    { type: 'current_affairs', label: 'Current Affairs in Pharmaceutical Sciences' },
    { type: 'buzzer', label: 'Buzzer Round (Fastest Finger First)' },
    { type: 'audio', label: 'Identify the Sound (Audio Round)' },
    { type: 'video', label: 'Identify the Video Round' },
    { type: 'connect_clues', label: 'Connect the Clues' },
    { type: 'jumbled_word', label: 'Jumbled Word Anagram' },
    { type: 'true_false', label: 'True or False Round' },
    { type: 'mcq', label: 'Multiple Choice Round' },
    { type: 'pass_on', label: 'Pass-On Round' },
    { type: 'wager', label: 'Wager / Betting Round' },
    { type: 'bonus', label: 'Bonus / Double-Points Round' },
    { type: 'tie_breaker', label: 'Tie-Breaker Sudden Death' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-5xl w-full shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Flexible Round Builder &amp; Rule Engine</h2>
              <p className="text-xs text-slate-400">
                Configure unlimited custom rounds, timings, scoring formulas, and private anchor instructions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-xs bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300">
              Total Calculated Max Score: <strong className="text-amber-400">{totalMaxMarks} Marks</strong>
            </div>
            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content: Left Round List | Right Round Configuration Form */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
          {/* Left Column: Round List & Add/Reorder */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                <span>Rounds Sequence</span>
                <span>{rounds.length} Total</span>
              </div>

              {rounds.map((round, idx) => {
                const isSelected = idx === selectedRoundIndex;
                return (
                  <div
                    key={round.id}
                    onClick={() => setSelectedRoundIndex(idx)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-sky-950/80 border-sky-500 text-white shadow-md'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-900'
                    }`}
                  >
                    <div className="truncate">
                      <div className="font-extrabold text-xs truncate">
                        Round {idx + 1}: {round.name}
                      </div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {round.type} • {round.questions.length} Qs • {calculateRoundMaxMarks(round)} pts
                      </div>
                    </div>

                    {/* Move Up/Down Controls */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleMoveRound(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:bg-slate-800 rounded disabled:opacity-30 text-slate-400"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleMoveRound(idx, 'down')}
                        disabled={idx === rounds.length - 1}
                        className="p-1 hover:bg-slate-800 rounded disabled:opacity-30 text-slate-400"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      {rounds.length > 1 && (
                        <button
                          onClick={() => handleRemoveRound(idx)}
                          className="p-1 hover:bg-rose-950 rounded text-rose-400"
                          title="Delete Round"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleAddRound}
              className="mt-4 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-sky-600/60 text-sky-300 hover:bg-sky-950/50 text-xs font-bold transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Round</span>
            </button>
          </div>

          {/* Right Column: Detailed Settings for Selected Round */}
          {currentRound && (
            <div className="md:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-5 overflow-y-auto space-y-4">
              <div className="border-b border-slate-800 pb-3">
                <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">
                  Configuring Round {selectedRoundIndex + 1}
                </span>
                <input
                  type="text"
                  value={currentRound.name}
                  onChange={(e) => handleUpdateCurrentRound({ name: e.target.value })}
                  placeholder="Round Name"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-base font-extrabold text-white mt-1"
                />
              </div>

              {/* Round Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Round Format / Engine</label>
                <select
                  value={currentRound.type}
                  onChange={(e) => handleUpdateCurrentRound({ type: e.target.value as RoundType })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white"
                >
                  {roundTypes.map((rt) => (
                    <option key={rt.type} value={rt.type}>
                      {rt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scoring Configuration Grid */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <Award className="w-4 h-4" />
                  Scoring Configuration
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                      Correct Answer Marks:
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={currentRound.scoring.marksCorrect}
                      onChange={(e) => handleUpdateScoring({ marksCorrect: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                      Incorrect Penalty Marks:
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={currentRound.scoring.marksIncorrect}
                      onChange={(e) => handleUpdateScoring({ marksIncorrect: Number(e.target.value) })}
                      placeholder="-5 or 0"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                      Unanswered / Pass:
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={currentRound.scoring.marksUnanswered}
                      onChange={(e) => handleUpdateScoring({ marksUnanswered: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs pt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={currentRound.scoring.allowPass}
                      onChange={(e) => handleUpdateScoring({ allowPass: e.target.checked })}
                      className="rounded accent-sky-500"
                    />
                    <span>Allow Question Pass</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={currentRound.scoring.passToNextInQueue || false}
                      onChange={(e) => handleUpdateScoring({ passToNextInQueue: e.target.checked })}
                      className="rounded accent-sky-500"
                    />
                    <span>Pass to Next Team in Buzzer Queue</span>
                  </label>
                </div>
              </div>

              {/* Timing & Presentation Order */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  Timing &amp; Presentation Mode
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                      Duration (Seconds):
                    </label>
                    <input
                      type="number"
                      value={currentRound.timing.durationSeconds}
                      onChange={(e) => handleUpdateTiming({ durationSeconds: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">Timer Scope:</label>
                    <select
                      value={currentRound.timing.timerType}
                      onChange={(e) =>
                        handleUpdateTiming({
                          timerType: e.target.value as Round['timing']['timerType'],
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="per_question">Per Question (e.g. 30s)</option>
                      <option value="per_participant_total">Per Participant Total (e.g. 90s Rapid Fire)</option>
                      <option value="manual">Manual / No Timer</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                      Question Order:
                    </label>
                    <select
                      value={currentRound.presentationOrder}
                      onChange={(e) =>
                        handleUpdateCurrentRound({
                          presentationOrder: e.target.value as Round['presentationOrder'],
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="horizontal">Horizontal (Q1 to Team A, then Team B, then Team C...)</option>
                      <option value="consecutive">Consecutive (All 5 questions to Team A, then Team B...)</option>
                      <option value="buzzer_open">Buzzer Open (Open to all teams simultaneously)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                      Response Interface:
                    </label>
                    <select
                      value={currentRound.responseMode}
                      onChange={(e) =>
                        handleUpdateCurrentRound({
                          responseMode: e.target.value as Round['responseMode'],
                        })
                      }
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="verbal">Verbal Answer on Stage</option>
                      <option value="mobile_buzzer">Mobile Phone Buzzer Button</option>
                      <option value="mobile_options">Mobile MCQ Tap (A/B/C/D)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Private Anchor & Quizmaster Instructions */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  Private Quizmaster Anchor Instructions (Confidential):
                </label>
                <textarea
                  rows={3}
                  value={currentRound.instructionsForQuizmaster}
                  onChange={(e) => handleUpdateCurrentRound({ instructionsForQuizmaster: e.target.value })}
                  placeholder="Instructions explaining round introduction, rules, passing rules, and conclusion..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-4">
          <div className="text-xs text-slate-400">
            {rounds.length} Rounds Configured • Each round saves its own scoring and question rules
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/30"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save All Rounds'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
