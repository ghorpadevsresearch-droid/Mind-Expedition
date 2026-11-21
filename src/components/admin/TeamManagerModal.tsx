import React, { useState } from 'react';
import { Quiz, Team } from '../../types/quiz';
import { Users, Plus, Trash2, X, Save, Palette } from 'lucide-react';

interface TeamManagerModalProps {
  quiz: Quiz;
  isOpen: boolean;
  onClose: () => void;
  onSaveTeams: (updatedTeams: Team[]) => Promise<void>;
}

export const TeamManagerModal: React.FC<TeamManagerModalProps> = ({
  quiz,
  isOpen,
  onClose,
  onSaveTeams,
}) => {
  const [teams, setTeams] = useState<Team[]>(JSON.parse(JSON.stringify(quiz.teams)));
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleAddTeam = () => {
    const nextIdx = teams.length;
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];
    const newTeam: Team = {
      id: `team_${Date.now()}`,
      name: `Team ${String.fromCharCode(65 + nextIdx)}`,
      institution: 'College of Pharmaceutical Sciences',
      department: 'Department of Pharmacy',
      rollNo: `EXP-${101 + nextIdx}`,
      color: colors[nextIdx % colors.length],
      participants: [{ name: 'Participant 1' }, { name: 'Participant 2' }],
      isOnline: false,
    };
    setTeams([...teams, newTeam]);
  };

  const handleUpdateTeam = (teamId: string, partial: Partial<Team>) => {
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, ...partial } : t)));
  };

  const handleRemoveTeam = (teamId: string) => {
    if (teams.length <= 1) return;
    setTeams((prev) => prev.filter((t) => t.id !== teamId));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSaveTeams(teams);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-4xl w-full shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Participants &amp; Team Roster</h2>
              <p className="text-xs text-slate-400">
                Register competing teams, institution affiliations, roll numbers, and colors
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Round 1 & Round 2 Scaling Info Banner */}
        <div className="mb-3 px-3.5 py-2 rounded-xl bg-sky-950/60 border border-sky-800/70 text-xs text-sky-200 flex items-center justify-between gap-2">
          <span>
            <strong>Round I &amp; Round II (Rapid Fire):</strong> Automatically scale to{' '}
            <strong>5 distinct questions per team</strong> ({teams.length} teams × 5 ={' '}
            <strong>{teams.length * 5} questions</strong> per round).
          </span>
        </div>

        {/* Teams List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {teams.map((team, idx) => (
            <div
              key={team.id}
              className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={team.color}
                    onChange={(e) => handleUpdateTeam(team.id, { color: e.target.value })}
                    className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                    title="Change team display color"
                  />
                  <input
                    type="text"
                    value={team.name}
                    onChange={(e) => handleUpdateTeam(team.id, { name: e.target.value })}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-sm font-bold text-white"
                  />
                  <span className="text-xs font-mono text-slate-400">ID: {team.rollNo || team.id}</span>
                </div>

                {teams.length > 1 && (
                  <button
                    onClick={() => handleRemoveTeam(team.id)}
                    className="p-1 text-rose-400 hover:bg-rose-950 rounded"
                    title="Remove team"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Institution / College Name:
                  </label>
                  <input
                    type="text"
                    value={team.institution}
                    onChange={(e) => handleUpdateTeam(team.id, { institution: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">
                    Department / Division:
                  </label>
                  <input
                    type="text"
                    value={team.department || ''}
                    onChange={(e) => handleUpdateTeam(team.id, { department: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
                  />
                </div>
              </div>

              {/* Participants list */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Team Members / Student Names (comma-separated):
                </label>
                <input
                  type="text"
                  value={team.participants.map((p) => p.name).join(', ')}
                  onChange={(e) => {
                    const names = e.target.value.split(',').map((n) => n.trim());
                    handleUpdateTeam(team.id, {
                      participants: names.map((name) => ({ name })),
                    });
                  }}
                  placeholder="e.g. Rahul Patil, Sneha Kulkarni"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-4">
          <button
            onClick={handleAddTeam}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold border border-slate-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Competing Team</span>
          </button>

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
              <span>{isSaving ? 'Saving...' : 'Save Teams'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
