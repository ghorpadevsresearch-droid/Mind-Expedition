export type RoundType =
  | 'basic'
  | 'rapid_fire'
  | 'straightforward'
  | 'visual'
  | 'current_affairs'
  | 'buzzer'
  | 'audio'
  | 'video'
  | 'connect_clues'
  | 'jumbled_word'
  | 'true_false'
  | 'mcq'
  | 'pass_on'
  | 'bonus'
  | 'wager'
  | 'tie_breaker';

export interface Participant {
  name: string;
  rollNo?: string;
  email?: string;
  phone?: string;
}

export interface Team {
  id: string;
  name: string;
  institution: string;
  department?: string;
  rollNo?: string;
  color: string;
  avatarIcon?: string;
  participants: Participant[];
  isOnline?: boolean;
  lastActive?: number;
}

export interface Question {
  id: string;
  text: string;
  type: 'verbal' | 'mcq' | 'visual' | 'audio' | 'video' | 'connect_clues' | 'jumbled' | 'true_false';
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  answer: string;
  explanation?: string;
  options?: string[]; // A, B, C, D
  correctOptionIndex?: number;
  mediaUrl?: string; // image, diagram, audio, video
  mediaType?: 'image' | 'audio' | 'video';
  clues?: string[]; // for Connect the clues
  jumbledWord?: string; // for Jumbled word
  sourceUrl?: string; // for verified current affairs
  publicationDate?: string;
  targetTeamId?: string; // for assigned questions
}

export interface RoundScoring {
  marksCorrect: number;
  marksIncorrect: number;
  marksUnanswered: number;
  bonusPoints?: number;
  passPenalty?: number;
  allowPass: boolean;
  passToNextInQueue?: boolean;
  wagerMin?: number;
  wagerMax?: number;
}

export interface RoundTiming {
  durationSeconds: number;
  timerType: 'per_question' | 'per_participant_total' | 'manual';
}

export interface Round {
  id: string;
  roundNumber: number;
  name: string;
  type: RoundType;
  description: string;
  instructionsForQuizmaster: string; // Private anchor notes
  rulesSummary: string;
  questions: Question[];
  scoring: RoundScoring;
  timing: RoundTiming;
  presentationOrder: 'horizontal' | 'consecutive' | 'buzzer_open';
  responseMode: 'verbal' | 'mobile_buzzer' | 'mobile_options';
  isCompleted: boolean;
  isBonus?: boolean;
  isTieBreaker?: boolean;
  maxMarksCalculated: number;
}

export interface BuzzerPress {
  sequence: number; // 1, 2, 3...
  teamId: string;
  teamName: string;
  institution: string;
  timestamp: number; // Server time ms
  latencyMs: number; // Time relative to buzzer activation
  status: 'first' | 'queued' | 'answered_correct' | 'answered_incorrect' | 'skipped';
}

export interface ScoreAuditEntry {
  id: string;
  timestamp: string;
  teamId: string;
  teamName: string;
  roundId: string;
  roundName: string;
  questionId?: string;
  delta: number;
  newTotal: number;
  reason: string;
  quizmaster: string;
}

export type QuizStatus = 'draft' | 'scheduled' | 'active' | 'completed' | 'archived';

export interface QuizTimer {
  isRunning: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  timerType: 'per_question' | 'per_participant_total' | 'manual';
  startedAtServer?: number;
}

export interface QuizBuzzerState {
  isActive: boolean;
  activatedAt: number | null;
  queue: BuzzerPress[];
  maxAttempts: number;
  timeAllowedSeconds: number;
  currentTurnParticipantId: string | null;
  locked: boolean;
}

export interface Quiz {
  id: string;
  code: string; // e.g. "MIND01"
  title: string;
  subtitle?: string;
  organizedBy?: string;
  collegeLogoUrl?: string;
  description: string;
  date: string;
  venue?: string;
  individualOrTeam: 'individual' | 'team';
  quizmasterName: string;
  status: QuizStatus;
  teams: Team[];
  rounds: Round[];
  currentRoundIndex: number;
  currentQuestionIndex: number;
  activeTeamId: string | null;
  isPaused: boolean;
  timer: QuizTimer;
  buzzer: QuizBuzzerState;
  answerRevealed: boolean;
  optionsRevealed?: boolean;
  selectedOptionIndex?: number | null;
  rapidFirePhase?: 'ready' | 'active' | 'lot_done';
  rapidFireLotResults?: Record<string, 'correct' | 'incorrect' | 'passed' | 'unanswered'>;
  currentQuestionAnswers: Record<string, 'correct' | 'incorrect' | 'passed' | 'unanswered'>;
  manualScoreCorrections: ScoreAuditEntry[];
  roundScores: Record<string, Record<string, number>>; // [teamId][roundId] => score
  totalScores: Record<string, number>; // [teamId] => score
  finalRankings?: { teamId: string; rank: number; totalScore: number }[];
  displayScreen: 'welcome' | 'round_intro' | 'question' | 'buzzer' | 'scoreboard' | 'winner';
  createdAt: string;
  updatedAt: string;
}

export type RoleType = 'admin' | 'quizmaster' | 'projector' | 'mobile';

export interface ClientConnectionInfo {
  role: RoleType;
  quizId: string;
  teamId?: string;
  clientIp?: string;
  connectedAt: number;
}
