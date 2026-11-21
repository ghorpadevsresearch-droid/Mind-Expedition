import React, { useState } from 'react';
import { useQuiz } from '../../context/QuizContext';
import { Quiz } from '../../types/quiz';
import { syncRoundOneQuestions, syncRoundTwoQuestions } from '../../data/defaultQuizzes';
import { QuizEditorModal } from './QuizEditorModal';
import { RoundBuilderModal } from './RoundBuilderModal';
import { QuestionBankModal } from './QuestionBankModal';
import { TeamManagerModal } from './TeamManagerModal';
import { ReportsModal } from './ReportsModal';
import {
  Trophy,
  Plus,
  Copy,
  Trash2,
  Edit,
  Layers,
  HelpCircle,
  Users,
  Award,
  PlayCircle,
  RotateCcw,
  Calendar,
  CheckCircle,
  Sliders,
  ExternalLink,
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const {
    quizzes,
    activeQuiz,
    setActiveQuizId,
    createQuiz,
    updateQuizData,
    duplicateQuiz,
    deleteQuiz,
    dispatchAction,
    setRole,
  } = useQuiz();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);

  const [isRoundBuilderOpen, setIsRoundBuilderOpen] = useState(false);
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);
  const [isTeamManagerOpen, setIsTeamManagerOpen] = useState(false);
  const [isReportsOpen, setIsReportsOpen] = useState(false);

  // Handlers
  const handleOpenCreate = () => {
    setEditingQuiz(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (q: Quiz) => {
    setEditingQuiz(q);
    setIsEditorOpen(true);
  };

  const handleSaveQuiz = async (saved: Quiz) => {
    if (editingQuiz) {
      await updateQuizData(saved);
    } else {
      await createQuiz(saved);
    }
  };

  const handleDuplicate = async (quizId: string) => {
    await duplicateQuiz(quizId);
  };

  const handleDelete = async (quizId: string) => {
    if (quizzes.length <= 1) {
      alert('Cannot delete the only remaining quiz competition.');
      return;
    }
    if (confirm('Are you sure you want to delete this quiz competition? This cannot be undone.')) {
      await deleteQuiz(quizId);
    }
  };

  const handleResetScores = async (quizId: string) => {
    if (confirm('Reset all scores, buzzer queues, and question progress for this quiz?')) {
      setActiveQuizId(quizId);
      await dispatchAction('RESET_QUIZ_SCORES');
    }
  };

  // Metric summaries
  const totalRoundsCount = quizzes.reduce((sum, q) => sum + q.rounds.length, 0);
  const totalQuestionsCount = quizzes.reduce(
    (sum, q) => sum + q.rounds.reduce((rSum, r) => rSum + r.questions.length, 0),
    0
  );
  const totalTeamsCount = quizzes.reduce((sum, q) => sum + q.teams.length, 0);

  return (
    <div className="min-h-[calc(100vh-57px)] bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Title & Metrics Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-sky-600/20 text-sky-400 border border-sky-500/30">
                <Trophy className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  MIND EXPEDITION Administrator Panel
                </h1>
                <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                  Multi-Quiz Tournament Hub • Flexible Round Builder • Question Bank • Reports
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-sky-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Quiz Competition</span>
          </button>
        </div>

        {/* Global Statistics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="text-xs font-bold text-slate-400 uppercase">Total Quizzes</div>
            <div className="text-3xl font-black text-white mt-1">{quizzes.length}</div>
            <div className="text-[11px] text-sky-400 mt-0.5">Independent tournaments</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="text-xs font-bold text-slate-400 uppercase">Configured Rounds</div>
            <div className="text-3xl font-black text-indigo-400 mt-1">{totalRoundsCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Custom scoring engines</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="text-xs font-bold text-slate-400 uppercase">Total Questions</div>
            <div className="text-3xl font-black text-emerald-400 mt-1">{totalQuestionsCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Verified in Question Banks</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
            <div className="text-xs font-bold text-slate-400 uppercase">Registered Teams</div>
            <div className="text-3xl font-black text-amber-400 mt-1">{totalTeamsCount}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Colleges &amp; institutions</div>
          </div>
        </div>

        {/* Competitions Cards List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-white">Quiz Competitions Library</h2>
            <span className="text-xs text-slate-400">
              Each quiz operates completely independently with isolated rounds and scores
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {quizzes.map((quiz) => {
              const isActive = quiz.id === activeQuiz?.id;
              const maxScore = quiz.rounds.reduce(
                (sum, r) => sum + r.questions.length * r.scoring.marksCorrect,
                0
              );

              return (
                <div
                  key={quiz.id}
                  className={`bg-slate-900 border-2 rounded-3xl p-5 md:p-6 transition-all shadow-xl ${
                    isActive ? 'border-sky-500/80 shadow-sky-500/10' : 'border-slate-800'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      {quiz.collegeLogoUrl && (
                        <div className="w-11 h-11 rounded-xl bg-white p-1 shrink-0 flex items-center justify-center border border-slate-700 shadow">
                          <img
                            src={quiz.collegeLogoUrl}
                            alt={`${quiz.organizedBy || quiz.title} logo`}
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      )}
                      <span className="px-2.5 py-1 rounded-xl bg-sky-950 border border-sky-800 text-sky-300 font-mono text-xs font-black">
                        {quiz.code}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg md:text-xl font-extrabold text-white">
                            {quiz.title}
                          </h3>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase">
                              CURRENT LIVE
                            </span>
                          )}
                        </div>
                        {quiz.subtitle && (
                          <p className="text-xs text-slate-400 mt-0.5">{quiz.subtitle}</p>
                        )}
                        {quiz.organizedBy && (
                          <p className="text-xs text-sky-300 font-semibold mt-0.5">
                            Organized by {quiz.organizedBy}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Quick activate button & actions */}
                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <button
                          onClick={() => setActiveQuizId(quiz.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600/20 border border-sky-500/40 hover:bg-sky-600/30 text-sky-300 text-xs font-bold"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Set Live</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setActiveQuizId(quiz.id);
                          setRole('quizmaster');
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow"
                        title="Open Quizmaster Console"
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Quizmaster</span>
                      </button>

                      <button
                        onClick={() => handleDuplicate(quiz.id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                        title="Duplicate quiz as copy"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleResetScores(quiz.id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700"
                        title="Reset scores to zero"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(quiz.id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-950 text-rose-400 border border-slate-700"
                        title="Delete quiz"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata chips */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-5">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">
                        Quizmaster
                      </span>
                      <strong className="text-slate-200">{quiz.quizmasterName}</strong>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">
                        Competition Date
                      </span>
                      <strong className="text-slate-200">{quiz.date}</strong>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">
                        Calculated Max Score
                      </span>
                      <strong className="text-amber-400 font-mono">{maxScore} Points</strong>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">
                        Rounds &amp; Teams
                      </span>
                      <strong className="text-slate-200">
                        {quiz.rounds.length} Rounds • {quiz.teams.length} Teams
                      </strong>
                    </div>
                  </div>

                  {/* 4 Feature Action Buttons: Edit, Round Builder, Question Bank, Teams, Reports */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleOpenEdit(quiz)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
                    >
                      <Edit className="w-3.5 h-3.5 text-sky-400" />
                      <span>Edit Info &amp; College Logo</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveQuizId(quiz.id);
                        setIsRoundBuilderOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
                    >
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Round Builder ({quiz.rounds.length})</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveQuizId(quiz.id);
                        setIsQuestionBankOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Question Bank</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveQuizId(quiz.id);
                        setIsTeamManagerOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
                    >
                      <Users className="w-3.5 h-3.5 text-amber-400" />
                      <span>Teams &amp; Participants ({quiz.teams.length})</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveQuizId(quiz.id);
                        setIsReportsOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
                    >
                      <Award className="w-3.5 h-3.5 text-rose-400" />
                      <span>Results &amp; Reports</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sub-Modals */}
      {isEditorOpen && (
        <QuizEditorModal
          quizToEdit={editingQuiz}
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          onSave={handleSaveQuiz}
        />
      )}

      {isRoundBuilderOpen && activeQuiz && (
        <RoundBuilderModal
          quiz={activeQuiz}
          isOpen={isRoundBuilderOpen}
          onClose={() => setIsRoundBuilderOpen(false)}
          onSaveRounds={async (updatedRounds) => {
            await updateQuizData({ ...activeQuiz, rounds: updatedRounds });
          }}
        />
      )}

      {isQuestionBankOpen && activeQuiz && (
        <QuestionBankModal
          quiz={activeQuiz}
          isOpen={isQuestionBankOpen}
          onClose={() => setIsQuestionBankOpen(false)}
          onSaveQuestions={async (updatedRounds) => {
            await updateQuizData({ ...activeQuiz, rounds: updatedRounds });
          }}
        />
      )}

      {isTeamManagerOpen && activeQuiz && (
        <TeamManagerModal
          quiz={activeQuiz}
          isOpen={isTeamManagerOpen}
          onClose={() => setIsTeamManagerOpen(false)}
          onSaveTeams={async (updatedTeams) => {
            const syncedRounds = activeQuiz.rounds.map((r) => {
              if (r.roundNumber === 1) return syncRoundOneQuestions(r, updatedTeams.length);
              if (r.type === 'rapid_fire' || r.roundNumber === 2) return syncRoundTwoQuestions(r, updatedTeams.length);
              return r;
            });
            const nextTotalScores = { ...activeQuiz.totalScores };
            const nextRoundScores = { ...activeQuiz.roundScores };
            updatedTeams.forEach((t) => {
              if (nextTotalScores[t.id] === undefined) nextTotalScores[t.id] = 0;
              if (!nextRoundScores[t.id]) nextRoundScores[t.id] = {};
              syncedRounds.forEach((r) => {
                if (nextRoundScores[t.id][r.id] === undefined) nextRoundScores[t.id][r.id] = 0;
              });
            });
            await updateQuizData({
              ...activeQuiz,
              teams: updatedTeams,
              rounds: syncedRounds,
              totalScores: nextTotalScores,
              roundScores: nextRoundScores,
            });
          }}
        />
      )}

      {isReportsOpen && activeQuiz && (
        <ReportsModal
          quiz={activeQuiz}
          isOpen={isReportsOpen}
          onClose={() => setIsReportsOpen(false)}
        />
      )}
    </div>
  );
};
