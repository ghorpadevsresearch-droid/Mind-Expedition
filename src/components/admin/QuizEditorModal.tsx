import React, { useState } from 'react';
import { Quiz } from '../../types/quiz';
import { DEFAULT_ROUNDS, DEFAULT_TEAMS, syncRoundOneQuestions, syncRoundTwoQuestions } from '../../data/defaultQuizzes';
import { Trophy, X, Save, Building2, Upload, Trash2, Image as ImageIcon } from 'lucide-react';

interface QuizEditorModalProps {
  quizToEdit?: Quiz | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (quiz: Quiz) => Promise<void>;
}

export const QuizEditorModal: React.FC<QuizEditorModalProps> = ({
  quizToEdit,
  isOpen,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(quizToEdit?.title || '');
  const [subtitle, setSubtitle] = useState(quizToEdit?.subtitle || '');
  const [organizedBy, setOrganizedBy] = useState(quizToEdit?.organizedBy || '');
  const [collegeLogoUrl, setCollegeLogoUrl] = useState(quizToEdit?.collegeLogoUrl || '');
  const [description, setDescription] = useState(quizToEdit?.description || '');
  const [date, setDate] = useState(quizToEdit?.date || new Date().toISOString().split('T')[0]);
  const [venue, setVenue] = useState(quizToEdit?.venue || 'Main Auditorium');
  const [quizmasterName, setQuizmasterName] = useState(quizToEdit?.quizmasterName || 'Prof. Quizmaster');
  const [individualOrTeam, setIndividualOrTeam] = useState<'individual' | 'team'>(
    quizToEdit?.individualOrTeam || 'team'
  );
  const [status, setStatus] = useState<Quiz['status']>(quizToEdit?.status || 'draft');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCollegeLogoUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const now = new Date().toISOString();
    const id = quizToEdit ? quizToEdit.id : `quiz_${Date.now()}`;
    const code = quizToEdit ? quizToEdit.code : `MIND${Math.floor(10 + Math.random() * 90)}`;

    const teams = quizToEdit ? quizToEdit.teams : JSON.parse(JSON.stringify(DEFAULT_TEAMS));
    const rawRounds = quizToEdit ? quizToEdit.rounds : JSON.parse(JSON.stringify(DEFAULT_ROUNDS));
    const rounds = quizToEdit
      ? rawRounds
      : rawRounds.map((r: typeof DEFAULT_ROUNDS[number]) => {
          if (r.roundNumber === 1) return syncRoundOneQuestions(r, teams.length);
          if (r.type === 'rapid_fire' || r.roundNumber === 2) return syncRoundTwoQuestions(r, teams.length);
          return r;
        });

    const zeroScores: Record<string, number> = quizToEdit ? { ...quizToEdit.totalScores } : {};
    const zeroRoundScores: Record<string, Record<string, number>> = quizToEdit
      ? { ...quizToEdit.roundScores }
      : {};

    if (!quizToEdit) {
      teams.forEach((t: { id: string }) => {
        zeroScores[t.id] = 0;
        zeroRoundScores[t.id] = {};
        rounds.forEach((r: { id: string }) => {
          zeroRoundScores[t.id][r.id] = 0;
        });
      });
    }

    const payload: Quiz = {
      id,
      code,
      title,
      subtitle,
      organizedBy: organizedBy.trim(),
      collegeLogoUrl: collegeLogoUrl.trim(),
      description,
      date,
      venue,
      quizmasterName,
      individualOrTeam,
      status,
      teams,
      rounds,
      currentRoundIndex: quizToEdit ? quizToEdit.currentRoundIndex : 0,
      currentQuestionIndex: quizToEdit ? quizToEdit.currentQuestionIndex : 0,
      activeTeamId: quizToEdit ? quizToEdit.activeTeamId : teams[0]?.id || null,
      isPaused: quizToEdit ? quizToEdit.isPaused : false,
      timer: quizToEdit
        ? quizToEdit.timer
        : {
            isRunning: false,
            remainingSeconds: 30,
            totalSeconds: 30,
            timerType: 'per_question',
          },
      buzzer: quizToEdit
        ? quizToEdit.buzzer
        : {
            isActive: false,
            activatedAt: null,
            queue: [],
            maxAttempts: 3,
            timeAllowedSeconds: 15,
            currentTurnParticipantId: null,
            locked: false,
          },
      answerRevealed: quizToEdit ? quizToEdit.answerRevealed : false,
      currentQuestionAnswers: quizToEdit ? quizToEdit.currentQuestionAnswers : {},
      manualScoreCorrections: quizToEdit ? quizToEdit.manualScoreCorrections : [],
      roundScores: zeroRoundScores,
      totalScores: zeroScores,
      displayScreen: quizToEdit ? quizToEdit.displayScreen : 'welcome',
      createdAt: quizToEdit ? quizToEdit.createdAt : now,
      updatedAt: now,
    };

    await onSave(payload);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black text-white">
              {quizToEdit ? 'Edit Quiz Competition & College Branding' : 'Create New Quiz Competition'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Quiz Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. MIND EXPEDITION 2026"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Subtitle / Edition</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="e.g. National Intercollegiate Live Quiz Competition"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
            />
          </div>

          {/* Organized By College + College Logo Upload */}
          <div className="p-4 rounded-2xl bg-sky-950/30 border border-sky-800/60 space-y-3">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-sky-400">
              <Building2 className="w-4 h-4" />
              <span>Organizing College &amp; Projector Logo</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Organized By (College / Institution Name)
              </label>
              <input
                type="text"
                value={organizedBy}
                onChange={(e) => setOrganizedBy(e.target.value)}
                placeholder="e.g. St. Xavier's Institute of Pharmaceutical Sciences"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Displayed as &ldquo;Organized by ...&rdquo; on the main Projector Display welcome screen and stage header.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                  <span>College Logo (Visible on Projector Display)</span>
                </label>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer shadow transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{collegeLogoUrl ? 'Change Logo' : 'Upload College Logo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </label>

                  {collegeLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setCollegeLogoUrl('')}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-800/70 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                {collegeLogoUrl && (
                  <div className="w-20 h-20 rounded-xl bg-white border-2 border-sky-400/50 overflow-hidden shrink-0 flex items-center justify-center p-1.5 shadow">
                    <img
                      src={collegeLogoUrl}
                      alt="College Logo Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}

                <div className="flex-1 w-full space-y-1">
                  {collegeLogoUrl.startsWith('data:image/') ? (
                    <div className="flex items-center justify-between gap-2 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs">
                      <span className="text-emerald-400 font-semibold">
                        Uploaded College Logo Ready for Projector ✓
                      </span>
                      <button
                        type="button"
                        onClick={() => setCollegeLogoUrl('')}
                        className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={collegeLogoUrl}
                      onChange={(e) => setCollegeLogoUrl(e.target.value)}
                      placeholder="Or paste an image URL for the college logo (PNG, JPG, SVG, WebP)..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono"
                    />
                  )}
                  <p className="text-[10px] text-slate-400">
                    Supports PNG, JPG, SVG, and WebP logos. Automatically displays on the projector welcome screen &amp; stage banner.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short brief of topic and scope"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Date of Quiz *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Venue / Auditorium</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="Auditorium Hall A"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Quizmaster Name</label>
              <input
                type="text"
                required
                value={quizmasterName}
                onChange={(e) => setQuizmasterName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Format</label>
              <select
                value={individualOrTeam}
                onChange={(e) => setIndividualOrTeam(e.target.value as 'individual' | 'team')}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              >
                <option value="team">Team Competition</option>
                <option value="individual">Individual Participants</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as Quiz['status'])}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white"
              >
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/30"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving...' : 'Save Competition'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
