import React from 'react';
import { Quiz } from '../../types/quiz';
import { exportQuizToCSV, printOfficialScorecard } from '../../utils/export';
import {
  FileSpreadsheet,
  Printer,
  Trophy,
  X,
  Award,
  ShieldCheck,
  Calendar,
  Clock,
} from 'lucide-react';

interface ReportsModalProps {
  quiz: Quiz;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportsModal: React.FC<ReportsModalProps> = ({ quiz, isOpen, onClose }) => {
  if (!isOpen) return null;

  // Rank teams
  const rankedTeams = [...quiz.teams].sort(
    (a, b) => (quiz.totalScores[b.id] || 0) - (quiz.totalScores[a.id] || 0)
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-4xl w-full shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Official Competition Reports &amp; Results</h2>
              <p className="text-xs text-slate-400">{quiz.title} • {quiz.date}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => exportQuizToCSV(quiz)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/30 border border-emerald-500/50 hover:bg-emerald-600/40 text-emerald-200 text-xs font-bold shadow"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export CSV / Excel</span>
            </button>

            <button
              onClick={() => printOfficialScorecard(quiz)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600/30 border border-sky-500/50 hover:bg-sky-600/40 text-sky-200 text-xs font-bold shadow"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>Print Scorecard</span>
            </button>

            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-6 pr-1">
          {/* Winner Banner */}
          {rankedTeams[0] && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                    Grand Champion
                  </div>
                  <div className="text-xl font-black text-white">{rankedTeams[0].name}</div>
                  <div className="text-xs text-slate-400">{rankedTeams[0].institution}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black font-mono text-amber-400">
                  {quiz.totalScores[rankedTeams[0].id] || 0}
                </div>
                <div className="text-[10px] uppercase font-bold text-slate-400">Winning Points</div>
              </div>
            </div>
          )}

          {/* Round-wise Matrix Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <h3 className="font-extrabold text-sm text-slate-200 mb-3">
              Round-by-Round Official Marks Table
            </h3>
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="p-3 text-center">Rank</th>
                    <th className="p-3">Team</th>
                    <th className="p-3">Institution</th>
                    {quiz.rounds.map((r) => (
                      <th key={r.id} className="p-3 text-center">
                        {r.name}
                      </th>
                    ))}
                    <th className="p-3 text-right">Total Marks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-medium">
                  {rankedTeams.map((team, idx) => (
                    <tr key={team.id} className="hover:bg-slate-900/60">
                      <td className="p-3 text-center font-bold text-white">#{idx + 1}</td>
                      <td className="p-3 font-extrabold text-white">{team.name}</td>
                      <td className="p-3 text-slate-400">{team.institution}</td>
                      {quiz.rounds.map((r) => (
                        <td key={r.id} className="p-3 text-center font-mono text-slate-300">
                          {quiz.roundScores[team.id]?.[r.id] ?? 0}
                        </td>
                      ))}
                      <td className="p-3 text-right font-black font-mono text-sky-400 text-sm">
                        {quiz.totalScores[team.id] || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Score Audit Trail */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <h3 className="font-extrabold text-sm text-slate-200">
                Score Correction Audit Trail
              </h3>
            </div>

            {quiz.manualScoreCorrections.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Team</th>
                      <th className="p-3">Round</th>
                      <th className="p-3">Delta</th>
                      <th className="p-3">Reason</th>
                      <th className="p-3">Authorized By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {quiz.manualScoreCorrections.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-900/60">
                        <td className="p-3 text-slate-400 font-mono">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="p-3 font-bold text-white">{entry.teamName}</td>
                        <td className="p-3 text-slate-300">{entry.roundName}</td>
                        <td className="p-3 font-mono font-bold text-amber-400">
                          {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                        </td>
                        <td className="p-3 text-slate-300">{entry.reason}</td>
                        <td className="p-3 text-slate-400">{entry.quizmaster}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-slate-500">
                No manual score corrections recorded. All marks evaluated directly through standard round rules.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
