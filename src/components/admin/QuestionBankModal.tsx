import React, { useState, useRef } from 'react';
import { Quiz, Question, Round } from '../../types/quiz';
import { syncRoundOneQuestions, syncRoundTwoQuestions } from '../../data/defaultQuizzes';
import { MathText, hasMathMarkup } from '../common/MathText';
import {
  HelpCircle,
  Plus,
  Trash2,
  FileSpreadsheet,
  Sparkles,
  Shuffle,
  X,
  Save,
  Image as ImageIcon,
  Upload,
  CheckCircle,
  ExternalLink,
  Eye,
  Sigma,
} from 'lucide-react';

interface QuestionBankModalProps {
  quiz: Quiz;
  isOpen: boolean;
  onClose: () => void;
  onSaveQuestions: (updatedRounds: Round[]) => Promise<void>;
}

type FieldTarget =
  | { field: 'text' }
  | { field: 'option'; optIndex: number }
  | { field: 'answer' }
  | { field: 'explanation' };

interface MathPreset {
  label: string;
  title: string;
  latex: string;
  placeholder?: string;
}

const MATH_PRESETS: MathPreset[] = [
  { label: '√x', title: 'Square root (wraps selection)', latex: '\\sqrt{x}', placeholder: 'x' },
  { label: 'ⁿ√x', title: 'nth root', latex: '\\sqrt[n]{x}', placeholder: 'n' },
  { label: 'a/b', title: 'Fraction', latex: '\\frac{a}{b}', placeholder: 'a' },
  { label: '∫', title: 'Definite Integral', latex: '\\int_{a}^{b} f(x)\\,dx', placeholder: 'a' },
  { label: '∫dx', title: 'Indefinite Integral', latex: '\\int f(x)\\,dx', placeholder: 'f(x)' },
  { label: 'd/dx', title: 'Derivative d/dx', latex: '\\frac{d}{dx}', placeholder: '' },
  { label: 'dy/dx', title: 'Derivative dy/dx', latex: '\\frac{dy}{dx}', placeholder: '' },
  { label: '∂/∂x', title: 'Partial Derivative', latex: '\\frac{\\partial}{\\partial x}', placeholder: '' },
  { label: 'lim', title: 'Limit', latex: '\\lim_{x \\to 0}', placeholder: '0' },
  { label: '∑', title: 'Summation', latex: '\\sum_{i=1}^{n}', placeholder: 'n' },
  { label: '×10ⁿ', title: 'Scientific notation power of 10', latex: '\\times 10^{n}', placeholder: 'n' },
  { label: 'logₐ', title: 'Logarithm with base', latex: '\\log_{10}(x)', placeholder: '10' },
];

const QUICK_SYMBOLS = [
  'α',
  'β',
  'γ',
  'Δ',
  'θ',
  'λ',
  'μ',
  'π',
  'σ',
  'Ω',
  '±',
  '×',
  '÷',
  '≤',
  '≥',
  '≈',
  '≠',
  '∞',
  '°',
  '→',
  '⇌',
];

const countUnescapedDollars = (str: string): number => {
  let count = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === '$' && (i === 0 || str[i - 1] !== '\\')) {
      count++;
    }
  }
  return count;
};

export const QuestionBankModal: React.FC<QuestionBankModalProps> = ({
  quiz,
  isOpen,
  onClose,
  onSaveQuestions,
}) => {
  const [rounds, setRounds] = useState<Round[]>(JSON.parse(JSON.stringify(quiz.rounds)));
  const [selectedRoundId, setSelectedRoundId] = useState<string>(quiz.rounds[0]?.id || '');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('Pharmaceutics & Drug Delivery');
  const [showAiModal, setShowAiModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeFieldByQ, setActiveFieldByQ] = useState<Record<string, FieldTarget>>({});
  const [previewOpenByQ, setPreviewOpenByQ] = useState<Record<string, boolean>>({});
  const [showMathGuide, setShowMathGuide] = useState(false);
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({});

  if (!isOpen) return null;

  const currentRound = rounds.find((r) => r.id === selectedRoundId) || rounds[0];

  const isMcqRound = (round: Round | undefined) =>
    !!round && (round.roundNumber === 1 || round.roundNumber === 3 || round.roundNumber === 5);

  const getFieldKey = (qId: string, target: FieldTarget) =>
    target.field === 'option' ? `${qId}:opt:${target.optIndex}` : `${qId}:${target.field}`;

  const getTargetLabel = (target: FieldTarget) => {
    if (target.field === 'option') return `Option ${String.fromCharCode(65 + target.optIndex)}`;
    if (target.field === 'answer') return 'Verified Answer Key';
    if (target.field === 'explanation') return 'Explanation';
    return 'Question Text';
  };

  const applyFieldValue = (q: Question, target: FieldTarget, newValue: string) => {
    if (target.field === 'text') {
      handleUpdateQuestion(q.id, { text: newValue });
    } else if (target.field === 'answer') {
      handleUpdateQuestion(q.id, { answer: newValue });
    } else if (target.field === 'explanation') {
      handleUpdateQuestion(q.id, { explanation: newValue });
    } else if (target.field === 'option') {
      const opts = q.options && q.options.length === 4 ? [...q.options] : ['', '', '', ''];
      opts[target.optIndex] = newValue;
      const isCorrectOpt = (q.correctOptionIndex ?? 0) === target.optIndex;
      handleUpdateQuestion(q.id, {
        type: 'mcq',
        options: opts,
        correctOptionIndex: q.correctOptionIndex ?? 0,
        ...(isCorrectOpt ? { answer: newValue } : {}),
      });
    }
  };

  const getFieldValue = (q: Question, target: FieldTarget): string => {
    if (target.field === 'text') return q.text || '';
    if (target.field === 'answer') return q.answer || '';
    if (target.field === 'explanation') return q.explanation || '';
    const opts = q.options && q.options.length === 4 ? q.options : ['', '', '', ''];
    return opts[target.optIndex] || '';
  };

  const insertIntoActiveField = (
    q: Question,
    mode: 'sup' | 'sub' | 'latex' | 'symbol',
    payload: string,
    placeholder?: string
  ) => {
    const target: FieldTarget = activeFieldByQ[q.id] || { field: 'text' };
    const key = getFieldKey(q.id, target);
    const el = fieldRefs.current[key];
    const currentVal = getFieldValue(q, target);

    const start = el?.selectionStart ?? currentVal.length;
    const end = el?.selectionEnd ?? currentVal.length;
    const selected = currentVal.slice(start, end);
    const before = currentVal.slice(0, start);
    const after = currentVal.slice(end);
    const insideMath = countUnescapedDollars(before) % 2 === 1;

    let inserted = '';
    let selStartOffset = 0;
    let selEndOffset = 0;

    if (mode === 'sup' || mode === 'sub') {
      const inner = selected || '2';
      if (insideMath) {
        const prefix = mode === 'sup' ? '^{' : '_{';
        inserted = `${prefix}${inner}}`;
        selStartOffset = selected ? inserted.length : prefix.length;
        selEndOffset = selected ? inserted.length : prefix.length + inner.length;
      } else {
        const tag = mode === 'sup' ? 'sup' : 'sub';
        inserted = `<${tag}>${inner}</${tag}>`;
        const openLen = `<${tag}>`.length;
        selStartOffset = selected ? inserted.length : openLen;
        selEndOffset = selected ? inserted.length : openLen + inner.length;
      }
    } else if (mode === 'latex') {
      let expr = payload;
      if (selected) {
        if (expr === '\\sqrt{x}') {
          expr = `\\sqrt{${selected}}`;
        } else if (expr === '\\sqrt[n]{x}') {
          expr = `\\sqrt[n]{${selected}}`;
        } else if (expr === '\\frac{a}{b}') {
          expr = `\\frac{${selected}}{b}`;
        } else if (expr === '\\int f(x)\\,dx') {
          expr = `\\int ${selected}\\,dx`;
        }
      }
      if (insideMath) {
        inserted = expr;
        if (!selected && placeholder) {
          const idx = inserted.indexOf(placeholder);
          if (idx >= 0) {
            selStartOffset = idx;
            selEndOffset = idx + placeholder.length;
          } else {
            selStartOffset = inserted.length;
            selEndOffset = inserted.length;
          }
        } else {
          selStartOffset = inserted.length;
          selEndOffset = inserted.length;
        }
      } else {
        inserted = `$${expr}$`;
        if (!selected && placeholder) {
          const idx = inserted.indexOf(placeholder, 1);
          if (idx >= 0) {
            selStartOffset = idx;
            selEndOffset = idx + placeholder.length;
          } else {
            selStartOffset = inserted.length;
            selEndOffset = inserted.length;
          }
        } else {
          selStartOffset = inserted.length;
          selEndOffset = inserted.length;
        }
      }
    } else {
      inserted = payload;
      selStartOffset = inserted.length;
      selEndOffset = inserted.length;
    }

    const updatedVal = `${before}${inserted}${after}`;
    applyFieldValue(q, target, updatedVal);

    requestAnimationFrame(() => {
      const targetEl = fieldRefs.current[key];
      if (targetEl) {
        targetEl.focus();
        targetEl.setSelectionRange(start + selStartOffset, start + selEndOffset);
      }
    });
  };

  const handleAddQuestion = () => {
    if (!currentRound) return;
    const mcq = isMcqRound(currentRound);
    const newQ: Question = {
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: '',
      type: mcq ? 'mcq' : currentRound.type === 'visual' ? 'visual' : 'verbal',
      category: 'Pharmaceutical Sciences',
      difficulty: 'medium',
      options: mcq ? ['', '', '', ''] : undefined,
      correctOptionIndex: mcq ? 0 : undefined,
      answer: '',
      explanation: '',
    };

    setRounds((prev) =>
      prev.map((r) => (r.id === currentRound.id ? { ...r, questions: [...r.questions, newQ] } : r))
    );
  };

  const handleUpdateQuestion = (qId: string, partial: Partial<Question>) => {
    if (!currentRound) return;
    setRounds((prev) =>
      prev.map((r) =>
        r.id === currentRound.id
          ? {
              ...r,
              questions: r.questions.map((q) => (q.id === qId ? { ...q, ...partial } : q)),
            }
          : r
      )
    );
  };

  const handleRemoveQuestion = (qId: string) => {
    if (!currentRound) return;
    setRounds((prev) =>
      prev.map((r) =>
        r.id === currentRound.id
          ? { ...r, questions: r.questions.filter((q) => q.id !== qId) }
          : r
      )
    );
  };

  const handleShuffleQuestions = () => {
    if (!currentRound) return;
    const shuffled = [...currentRound.questions].sort(() => Math.random() - 0.5);
    setRounds((prev) =>
      prev.map((r) => (r.id === currentRound.id ? { ...r, questions: shuffled } : r))
    );
  };

  // CSV Import parser
  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentRound) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      const imported: Question[] = [];

      // Assume CSV format: text, answer, category, difficulty, explanation
      lines.slice(1).forEach((line, idx) => {
        const parts = line.split(',').map((p) => p.replace(/^"|"$/g, '').trim());
        if (parts[0] && parts[1]) {
          imported.push({
            id: `imported_${Date.now()}_${idx}`,
            text: parts[0],
            answer: parts[1],
            category: parts[2] || 'Imported Subject',
            difficulty: (parts[3] as 'easy' | 'medium' | 'hard') || 'medium',
            explanation: parts[4] || '',
            type: 'verbal',
          });
        }
      });

      if (imported.length > 0) {
        setRounds((prev) =>
          prev.map((r) =>
            r.id === currentRound.id ? { ...r, questions: [...r.questions, ...imported] } : r
          )
        );
      }
    };
    reader.readAsText(file);
  };

  // AI Generation trigger
  const handleGenerateAI = async () => {
    if (!currentRound) return;
    setIsAiGenerating(true);

    try {
      const res = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: aiTopic,
          roundType: currentRound.type,
          count: 3,
          difficulty: 'medium',
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          setRounds((prev) =>
            prev.map((r) =>
              r.id === currentRound.id ? { ...r, questions: [...r.questions, ...data.questions] } : r
            )
          );
        }
      }
    } catch (err) {
      console.error('Error generating AI questions:', err);
    } finally {
      setIsAiGenerating(false);
      setShowAiModal(false);
    }
  };

  const handleImageUpload = (qId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleUpdateQuestion(qId, {
          mediaUrl: dataUrl,
          mediaType: 'image',
          type: 'visual',
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    await onSaveQuestions(rounds);
    setIsSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-5xl w-full shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Question Bank &amp; Media Management</h2>
              <p className="text-xs text-slate-400">
                Manage questions, math equations, superscripts/subscripts, images, CSV import &amp; AI generation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowMathGuide((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                showMathGuide
                  ? 'bg-sky-600/30 border-sky-400 text-sky-200'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-sky-300'
              }`}
              title="How to insert mathematical equations, square roots, integrals, derivatives & superscript/subscript"
            >
              <Sigma className="w-3.5 h-3.5" />
              <span>Math &amp; Sup/Sub Guide</span>
            </button>

            <button
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs font-bold hover:bg-purple-600/40 shadow"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>AI Question Gen</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer border border-slate-700">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Import CSV</span>
              <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
            </label>

            <button
              onClick={handleShuffleQuestions}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              title="Shuffle question order"
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Collapsible Math & Superscript/Subscript Quick Guide */}
        {showMathGuide && (
          <div className="mb-3 p-3.5 rounded-2xl bg-sky-950/50 border border-sky-700/60 text-xs text-slate-200 space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <span className="font-black text-sky-300 uppercase tracking-wider text-[11px]">
                Equation, Superscript &amp; Subscript Quick Authoring Guide
              </span>
              <button
                type="button"
                onClick={() => setShowMathGuide(false)}
                className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                Close ✕
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 text-[11px]">
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 space-y-1">
                <div className="font-bold text-amber-300">1. Point-and-Click Toolbar</div>
                <div className="text-slate-400">
                  Click any field (Question, Option A–D, Answer, or Explanation), optionally highlight text, and click{' '}
                  <strong className="text-white">x²</strong>, <strong className="text-white">x₁</strong>,{' '}
                  <strong className="text-white">√x</strong>, <strong className="text-white">∫</strong>, or{' '}
                  <strong className="text-white">d/dx</strong>.
                </div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 space-y-1">
                <div className="font-bold text-emerald-300">2. Equations ($...$)</div>
                <div className="text-slate-400">
                  Type or insert LaTeX inside <code className="text-sky-300">$...$</code>: e.g.{' '}
                  <code className="text-sky-300">$\sqrt&#123;x^2+1&#125;$</code>,{' '}
                  <code className="text-sky-300">$\int_0^1 x\,dx$</code>,{' '}
                  <code className="text-sky-300">$\frac&#123;dy&#125;&#123;dx&#125;$</code>
                </div>
              </div>
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 space-y-1">
                <div className="font-bold text-sky-300">3. Text Sup / Sub</div>
                <div className="text-slate-400">
                  Use <code className="text-sky-300">&lt;sup&gt;...&lt;/sup&gt;</code> &amp;{' '}
                  <code className="text-sky-300">&lt;sub&gt;...&lt;/sub&gt;</code>: e.g.{' '}
                  <code className="text-sky-300">Ca&lt;sup&gt;2+&lt;/sup&gt;</code> →{' '}
                  <MathText text="Ca<sup>2+</sup>" />,{' '}
                  <code className="text-sky-300">H&lt;sub&gt;2&lt;/sub&gt;O</code> → <MathText text="H<sub>2</sub>O" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Round Tabs — Wrapped & shrink-0 so all rounds remain fully visible and clickable */}
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-800 mb-4 shrink-0">
          {rounds.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedRoundId(r.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                r.id === currentRound?.id
                  ? 'bg-sky-600 text-white shadow-md ring-1 ring-sky-400/50'
                  : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-600'
              }`}
            >
              {r.name} ({r.questions.length} Qs)
            </button>
          ))}
        </div>

        {/* Round 1 & Round 2 Per-Team Target Banner */}
        {currentRound?.roundNumber === 1 && (
          <div className="mb-3 px-3.5 py-2 rounded-xl bg-sky-950/60 border border-sky-800/70 text-xs text-sky-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <span>
              <strong>Round I Rule:</strong> 5 questions per team × {quiz.teams.length} competing teams ={' '}
              <strong>{quiz.teams.length * 5} questions total</strong> (Currently{' '}
              <strong>{currentRound.questions.length}</strong>).
            </span>
            {currentRound.questions.length !== quiz.teams.length * 5 && (
              <button
                type="button"
                onClick={() =>
                  setRounds((prev) =>
                    prev.map((r) =>
                      r.id === currentRound.id ? syncRoundOneQuestions(r, quiz.teams.length) : r
                    )
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] cursor-pointer"
              >
                Auto-Fill to {quiz.teams.length * 5} Questions
              </button>
            )}
          </div>
        )}

        {(currentRound?.type === 'rapid_fire' || currentRound?.roundNumber === 2) && (
          <div className="mb-3 px-3.5 py-2 rounded-xl bg-sky-950/60 border border-sky-800/70 text-xs text-sky-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <span>
              <strong>Round II Rapid Fire Rule:</strong> 5 distinct questions per team × {quiz.teams.length} teams ={' '}
              <strong>{quiz.teams.length * 5} questions total</strong> (Currently{' '}
              <strong>{currentRound.questions.length}</strong>).
            </span>
            {currentRound.questions.length !== quiz.teams.length * 5 && (
              <button
                type="button"
                onClick={() =>
                  setRounds((prev) =>
                    prev.map((r) =>
                      r.id === currentRound.id ? syncRoundTwoQuestions(r, quiz.teams.length) : r
                    )
                  )
                }
                className="px-2.5 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[11px] cursor-pointer"
              >
                Auto-Fill to {quiz.teams.length * 5} Questions
              </button>
            )}
          </div>
        )}

        {/* Questions Editor List */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {currentRound && currentRound.questions.length > 0 ? (
            currentRound.questions.map((q, idx) => {
              const activeTarget = activeFieldByQ[q.id] || { field: 'text' as const };
              const hasAnyMath =
                hasMathMarkup(q.text) ||
                hasMathMarkup(q.answer) ||
                hasMathMarkup(q.explanation) ||
                (q.options || []).some((o) => hasMathMarkup(o));
              const showLivePreview = previewOpenByQ[q.id] ?? hasAnyMath;

              return (
                <div
                  key={q.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-sky-950 text-sky-400 font-black text-xs flex items-center justify-center border border-sky-800">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={q.category}
                        onChange={(e) => handleUpdateQuestion(q.id, { category: e.target.value })}
                        placeholder="Category e.g. Pharmacology"
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-semibold"
                      />
                      <select
                        value={q.difficulty}
                        onChange={(e) =>
                          handleUpdateQuestion(q.id, {
                            difficulty: e.target.value as Question['difficulty'],
                          })
                        }
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 capitalize"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setPreviewOpenByQ((prev) => ({
                            ...prev,
                            [q.id]: !showLivePreview,
                          }))
                        }
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                          showLivePreview
                            ? 'bg-emerald-950/70 border-emerald-600/70 text-emerald-300'
                            : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                        }`}
                        title="Toggle live formatted math & superscript/subscript preview"
                      >
                        <Eye className="w-3 h-3" />
                        <span>{showLivePreview ? 'Preview On' : 'Preview'}</span>
                      </button>

                      <button
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="p-1 hover:bg-rose-950 rounded text-rose-400"
                        title="Delete question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Equation, Superscript & Subscript Formatting Toolbar */}
                  <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 flex items-center gap-1 mr-1">
                          <Sigma className="w-3 h-3" />
                          Insert Formula / Format:
                        </span>

                        {/* Superscript & Subscript Buttons */}
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => insertIntoActiveField(q, 'sup', '')}
                          className="px-2 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-700/70 text-[11px] font-black cursor-pointer transition"
                          title="Superscript (highlight text or click to insert <sup>...</sup> or ^{...} inside math)"
                        >
                          x<sup className="text-[9px]">2</sup> Sup
                        </button>
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => insertIntoActiveField(q, 'sub', '')}
                          className="px-2 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-600 text-amber-200 hover:text-white border border-amber-700/70 text-[11px] font-black cursor-pointer transition"
                          title="Subscript (highlight text or click to insert <sub>...</sub> or _{...} inside math)"
                        >
                          x<sub className="text-[9px]">1</sub> Sub
                        </button>

                        <span className="h-4 w-px bg-slate-700 mx-0.5" />

                        {/* Calculus, Root & Fraction Equation Buttons */}
                        {MATH_PRESETS.map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() =>
                              insertIntoActiveField(q, 'latex', preset.latex, preset.placeholder)
                            }
                            className="px-2 py-1 rounded-lg bg-slate-950 hover:bg-sky-700 text-sky-200 hover:text-white border border-slate-700 hover:border-sky-400 text-[11px] font-bold cursor-pointer transition"
                            title={`${preset.title} (${preset.latex})`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>

                      <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/60 border border-emerald-800/70 px-2 py-0.5 rounded-md">
                        Target: {getTargetLabel(activeTarget)}
                      </span>
                    </div>

                    {/* Quick Scientific & Mathematical Symbols Row */}
                    <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-800/80">
                      <span className="text-[10px] font-bold text-slate-400 mr-1">Symbols:</span>
                      {QUICK_SYMBOLS.map((sym) => (
                        <button
                          key={sym}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => insertIntoActiveField(q, 'symbol', sym)}
                          className="w-6 h-6 rounded bg-slate-950 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-800 text-xs font-bold flex items-center justify-center cursor-pointer transition"
                          title={`Insert ${sym}`}
                        >
                          {sym}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question text */}
                  <div>
                    <textarea
                      ref={(el) => {
                        fieldRefs.current[`${q.id}:text`] = el;
                      }}
                      rows={2}
                      value={q.text}
                      onFocus={() =>
                        setActiveFieldByQ((prev) => ({ ...prev, [q.id]: { field: 'text' } }))
                      }
                      onChange={(e) => handleUpdateQuestion(q.id, { text: e.target.value })}
                      placeholder="Enter question text... (Supports math like $\sqrt{x}$, $\int_0^1 x\,dx$, $\frac{dy}{dx}$ and <sup>/<sub>)"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-xl p-2.5 text-xs text-white font-medium outline-none"
                    />
                  </div>

                  {/* Multiple Choice Options A-D (for MCQ questions or Rounds 1, 3, 5) */}
                  {(q.type === 'mcq' || isMcqRound(currentRound)) && (
                    <div className="p-3 rounded-xl bg-slate-900/70 border border-sky-900/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">
                          4 Multiple Choice Options (Select correct key — supports equations &amp; sup/sub)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[0, 1, 2, 3].map((optIdx) => {
                          const opts = q.options && q.options.length === 4 ? q.options : ['', '', '', ''];
                          const isCorrectOpt = (q.correctOptionIndex ?? 0) === optIdx;
                          return (
                            <div key={optIdx} className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  const nextAnswer = opts[optIdx] || q.answer;
                                  handleUpdateQuestion(q.id, {
                                    type: 'mcq',
                                    options: opts,
                                    correctOptionIndex: optIdx,
                                    answer: nextAnswer,
                                  });
                                }}
                                className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 border transition cursor-pointer ${
                                  isCorrectOpt
                                    ? 'bg-emerald-600 border-emerald-400 text-white'
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                                }`}
                                title={`Mark Option ${String.fromCharCode(65 + optIdx)} as correct`}
                              >
                                {isCorrectOpt ? <CheckCircle className="w-3.5 h-3.5" /> : String.fromCharCode(65 + optIdx)}
                              </button>
                              <input
                                ref={(el) => {
                                  fieldRefs.current[`${q.id}:opt:${optIdx}`] = el;
                                }}
                                type="text"
                                value={opts[optIdx] || ''}
                                onFocus={() =>
                                  setActiveFieldByQ((prev) => ({
                                    ...prev,
                                    [q.id]: { field: 'option', optIndex: optIdx },
                                  }))
                                }
                                onChange={(e) => {
                                  const updatedOpts = [...opts];
                                  updatedOpts[optIdx] = e.target.value;
                                  handleUpdateQuestion(q.id, {
                                    type: 'mcq',
                                    options: updatedOpts,
                                    correctOptionIndex: q.correctOptionIndex ?? 0,
                                    ...(isCorrectOpt ? { answer: e.target.value } : {}),
                                  });
                                }}
                                placeholder={`Option ${String.fromCharCode(65 + optIdx)} (text or $equation$)`}
                                className="w-full bg-slate-950 border border-slate-700 focus:border-sky-500 rounded-lg px-2.5 py-1 text-xs text-white outline-none"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Answer key & explanation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-400 mb-1">
                        Verified Answer Key *
                      </label>
                      <input
                        ref={(el) => {
                          fieldRefs.current[`${q.id}:answer`] = el;
                        }}
                        type="text"
                        value={q.answer}
                        onFocus={() =>
                          setActiveFieldByQ((prev) => ({ ...prev, [q.id]: { field: 'answer' } }))
                        }
                        onChange={(e) => handleUpdateQuestion(q.id, { answer: e.target.value })}
                        placeholder="Exact correct answer (supports equations & sup/sub)"
                        className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Explanation (For Quizmaster Reference)
                      </label>
                      <input
                        ref={(el) => {
                          fieldRefs.current[`${q.id}:explanation`] = el;
                        }}
                        type="text"
                        value={q.explanation || ''}
                        onFocus={() =>
                          setActiveFieldByQ((prev) => ({
                            ...prev,
                            [q.id]: { field: 'explanation' },
                          }))
                        }
                        onChange={(e) => handleUpdateQuestion(q.id, { explanation: e.target.value })}
                        placeholder="Context or formula explanation"
                        className="w-full bg-slate-900 border border-slate-700 focus:border-sky-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none"
                      />
                    </div>
                  </div>

                  {/* Live Rendered Preview (Auto-shown when math/sup/sub markup is used or toggled) */}
                  {showLivePreview && (
                    <div className="p-3 rounded-xl bg-slate-900/95 border border-emerald-700/50 space-y-2">
                      <div className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <Eye className="w-3 h-3" />
                        Live Projector Render Preview
                      </div>
                      <div className="text-sm font-bold text-white leading-relaxed">
                        <MathText text={q.text || 'Question text preview...'} />
                      </div>
                      {q.options && q.options.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                          {q.options.map((opt, oIdx) => (
                            <div
                              key={oIdx}
                              className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-2 ${
                                oIdx === (q.correctOptionIndex ?? 0)
                                  ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-100'
                                  : 'bg-slate-950 border-slate-800 text-slate-200'
                              }`}
                            >
                              <span className="font-black text-sky-400">
                                {String.fromCharCode(65 + oIdx)}.
                              </span>
                              <MathText text={opt || `Option ${String.fromCharCode(65 + oIdx)}`} />
                            </div>
                          ))}
                        </div>
                      )}
                      {q.answer && (
                        <div className="text-xs text-amber-300 font-semibold">
                          <span className="text-slate-400">Answer Key: </span>
                          <MathText text={q.answer} />
                        </div>
                      )}
                      {q.explanation && (
                        <div className="text-[11px] text-slate-300">
                          <span className="text-slate-400">Explanation: </span>
                          <MathText text={q.explanation} />
                        </div>
                      )}
                    </div>
                  )}

                {/* Visual Image Upload, Preview & URL for Visual or Media Questions */}
                <div
                  className={`p-3 rounded-xl border space-y-2.5 ${
                    currentRound.type === 'visual' || q.type === 'visual'
                      ? 'bg-sky-950/30 border-sky-800/60'
                      : 'bg-slate-900/50 border-slate-800'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-sky-400 flex items-center gap-1.5 uppercase tracking-wider">
                      <ImageIcon className="w-3.5 h-3.5" />
                      {currentRound.type === 'visual'
                        ? 'Visual Round Image Attachment'
                        : 'Optional Image Attachment'}
                    </span>

                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold cursor-pointer shadow transition">
                        <Upload className="w-3.5 h-3.5" />
                        <span>{q.mediaUrl ? 'Replace Image' : 'Upload Image'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(q.id, e)}
                          className="hidden"
                        />
                      </label>

                      {q.mediaUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateQuestion(q.id, {
                              mediaUrl: '',
                            })
                          }
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-800/70 cursor-pointer"
                          title="Remove attached image"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      )}

                      {q.sourceUrl && (
                        <a
                          href={q.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-sky-400 hover:underline flex items-center gap-1 shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" /> Source
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    {q.mediaUrl && (
                      <div className="w-32 h-20 rounded-xl bg-black border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center p-1">
                        <img
                          src={q.mediaUrl}
                          alt={`Question ${idx + 1} visual`}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    )}

                    <div className="flex-1 w-full space-y-1">
                      {q.mediaUrl?.startsWith('data:image/') ? (
                        <div className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs">
                          <span className="text-emerald-400 font-semibold">
                            Uploaded / Embedded Image Attached ✓
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQuestion(q.id, { mediaUrl: '' })}
                            className="text-[11px] text-slate-400 hover:text-white underline cursor-pointer"
                          >
                            Switch to URL
                          </button>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={q.mediaUrl || ''}
                          onChange={(e) =>
                            handleUpdateQuestion(q.id, {
                              mediaUrl: e.target.value,
                              mediaType: 'image',
                            })
                          }
                          placeholder="Or paste an external image URL (PNG, JPG, SVG, WebP)..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono"
                        />
                      )}
                      <p className="text-[10px] text-slate-400">
                        Supports PNG, JPG, WebP, GIF, and SVG uploads from your computer or external image URLs.
                      </p>
                    </div>
                  </div>
                </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500">
              No questions added to this round yet. Click "Add Question" or "AI Question Gen" below.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-4 shrink-0">
          <button
            onClick={handleAddQuestion}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-bold border border-slate-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/30"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Questions'}</span>
            </button>
          </div>
        </div>

        {/* AI Question Generation Modal Popup */}
        {showAiModal && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-lg font-black text-white flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                AI-Assisted Question Generator
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Generates verified, scientific competition questions with source references and publication dates.
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Topic / Specialization</label>
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="e.g. Current Oncology Approvals, Novel Drug Delivery, CDSCO Regulations"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isAiGenerating}
                  className="px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow"
                >
                  {isAiGenerating ? 'Generating Scientific Qs...' : 'Generate 3 Questions'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
