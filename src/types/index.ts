// ============================================
// KK's War Room 2.0 - TypeScript Types
// Aligned with SOP 2.0 (8 Competencies, 7 Stages)
// ============================================

// ============================================
// COMPETENCIES (C1-C8)
// ============================================

export type CompetencyCode = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6' | 'C7' | 'C8';

export interface Competency {
  code: CompetencyCode;
  name: string;
  description: string;
  what_it_measures: string[];
  developing: string[]; // P1
  strong: string[];     // P2
  advanced: string[];   // P3
}

export type ProficiencyLevel = 1 | 2 | 3; // P1=Developing, P2=Strong, P3=Advanced

export type CompetencyCategory =
  | 'NATURAL_DOMINANT'    // 2.7-3.0
  | 'STRONG'              // 2.3-2.69
  | 'FUNCTIONAL'          // 2.0-2.29
  | 'DEVELOPMENT_REQUIRED' // 1.6-1.99
  | 'HIGH_RISK';          // 1.0-1.59

// ============================================
// STAGES
// ============================================

export type StageName =
  | 'STAGE_NEG2_IDEATION'
  | 'STAGE_NEG1_VISION'
  | 'STAGE_0_COMMITMENT'
  | 'STAGE_1_VALIDATION'
  | 'STAGE_2A_GROWTH'
  | 'STAGE_2B_EXPANSION'
  | 'STAGE_3_SCALE'
  | 'STAGE_WARROOM_PREP'
  | 'STAGE_4_WARROOM';

export interface SimStage {
  id: StageName;
  name: string;
  title: string;
  stage_number: number;
  goal: string;
  what_happens: string[];
  pressure_injected: string[];
  duration_minutes: number;
  simulated_months: number[];
  competencies: CompetencyCode[];
  questions: SimQuestion[];
}

// ============================================
// QUESTIONS
// ============================================

export type QuestionType =
  | 'open_text'
  | 'multiple_choice'
  | 'scenario'
  | 'budget_allocation';

export interface SimQuestion {
  q_id: string;
  type: QuestionType;
  text: string;
  context_text?: string;
  pressure_text?: string;
  assess: CompetencyCode[];
  section?: string;
  options?: SimOption[];
  ai_eval_prompt?: string;
  scoring_guide?: Record<string, any>;
  next?: string;
  follow_up?: SimQuestion;
}

export interface SimOption {
  id: string;
  text: string;
  proficiency?: ProficiencyLevel;
  signal?: string;
  next?: string;
  warning?: string;
  impact?: Record<string, any>;
}

// ============================================
// PERSONAS
// ============================================

export interface Mentor {
  id: string;
  name: string;
  specialization: string;
  avatar: string;
  bio: string;
  guidance_style: string;
  tone: string;
}

export interface Investor {
  id: string;
  name: string;
  primary_lens: string;
  bias_trait_name: string;
  avatar: string;
  bio: string;
  signature_question: string;
  walk_out_trigger: string;
  tone: string;
  characteristics: string[];
}

export interface Leader {
  id: string;
  name: string;
  specialization: string;
  avatar: string;
  bio: string;
  tone: string;
}

// ============================================
// ASSESSMENT
// ============================================

export type AssessmentStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED' | 'ABANDONED';

export interface Assessment {
  id: string;
  userId: string;
  level: 1 | 2;
  attemptNumber: number;
  status: AssessmentStatus;
  currentStage: StageName;
  currentQuestionId: string;
  simulatedMonth: number;
  businessContext?: Record<string, any>;
  userIdea?: string;
  financialState?: FinancialState;
  teamState?: TeamState;
  customerState?: CustomerState;
  productState?: ProductState;
  marketState?: MarketState;
  mentorLifelinesRemaining: number;
  warRoomPitch?: string;
  dealResult?: DealResult;
  startedAt?: string;
  completedAt?: string;
  totalDurationMinutes?: number;
  lastActiveAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SIMULATION STATE
// ============================================

export interface FinancialState {
  capital: number;
  revenue: number;
  burnRate: number;
  runway: number;
  equity: number;
  debt: number;
}

export interface TeamState {
  size: number;
  morale: number;
  roles: string[];
}

export interface CustomerState {
  count: number;
  retention: number;
  satisfaction: number;
}

export interface ProductState {
  quality: number;
  features: number;
  mvpLaunched: boolean;
}

export interface MarketState {
  competition: string;
  positioning: string;
}

// ============================================
// RESPONSE
// ============================================

export interface ResponseData {
  selectedOptionId?: string;
  text?: string;
  allocations?: Record<string, number>; // for budget_allocation
}

export interface SubmitResponseResult {
  responseId: string;
  aiEvaluation: AIEvaluation;
  proficiency: ProficiencyLevel;
  nextQuestion?: {
    qId: string;
    data: SimQuestion;
  };
  stageCompleted: boolean;
  nextStage?: {
    id: StageName;
    name: string;
    title: string;
    stageNumber: number;
    competencies: CompetencyCode[];
    firstQuestion: string;
  };
  simCompleted: boolean;
  stateUpdates?: Record<string, any>;
}

export interface AIEvaluation {
  proficiency: ProficiencyLevel;
  feedback: string;
  reasoning?: string;
  signal?: string;
  warning?: string;
  strengths?: string[];
  weaknesses?: string[];
}

// ============================================
// COMPETENCY SCORES
// ============================================

export interface CompetencyScore {
  id: string;
  assessmentId: string;
  competencyCode: CompetencyCode;
  competencyName: string;
  stageScores: Record<StageName, number>;
  weightedAverage: number;
  category: CompetencyCategory;
  evidence?: EvidenceItem[];
  strengths?: string[];
  weaknesses?: string[];
}

export interface EvidenceItem {
  stage: StageName;
  questionId: string;
  proficiency: ProficiencyLevel;
  response?: string;
}

// ============================================
// MENTOR LIFELINE
// ============================================

export interface MentorLifelineResult {
  mentorId: string;
  mentorName: string;
  guidance: string;
  lifelinesLeft: number;
}

// ============================================
// INVESTOR SCORECARD
// ============================================

export type DealDecision = 'PRIORITY_1' | 'PRIORITY_2' | 'WALK_OUT';

export interface InvestorScorecard {
  id: string;
  assessmentId: string;
  investorId: string;
  investorName: string;
  primaryScore: number;
  biasTraitScore: number;
  biasTraitName: string;
  redFlag: boolean;
  redFlagReasons: string[];
  dealDecision: DealDecision;
  dealProposed?: DealOffer;
  dealAccepted?: DealOffer;
  question: string;
  participantResponse: string;
  investorReaction: string;
}

export interface DealOffer {
  capitalOffer?: number;
  equityAsk?: number;
  decision?: string;
}

export interface DealResult {
  dealMade: boolean;
  investorId?: string;
  investorName?: string;
  capitalOffered?: number;
  equityGiven?: number;
}

// ============================================
// REPORT
// ============================================

export interface EvaluationReport {
  id: string;
  assessmentId: string;
  reportType: 'FINAL' | 'STAGE_END';

  // Page 1: Deal
  dealSummary: {
    totalInvestors: number;
    dealsOffered: number;
    bestDeal?: DealOffer;
    investorResults: InvestorScorecard[];
  };

  // Page 2: Competency Profile
  competencyRanking: RankedCompetency[];
  spiderChartData: Record<CompetencyCode, number>;
  archetypeNarrative: string;
  entrepreneurType: string;
  organizationalRole: string;
  actionPlan: ActionItem[];

  // Page 3: Deep Dive
  stageNarrations: StageNarration[];

  // Role Fit
  roleFitMap: {
    role: string;
    dominantCompetencies: CompetencyCode[];
    bestEnvironment: string;
  };

  generatedAt: string;
}

export interface RankedCompetency {
  rank: number;
  code: CompetencyCode;
  name: string;
  weightedAverage: number;
  category: CompetencyCategory;
}

export interface ActionItem {
  competency: string;
  category: CompetencyCategory;
  currentAvg: number;
  action: string;
  targetDate: string;
}

export interface StageNarration {
  stage: StageName;
  stageNumber: number;
  questionsAnswered: number;
  decisions?: string[];
  positiveOutcomes?: string[];
  negativeOutcomes?: string[];
  scoringRationale?: string;
}

// ============================================
// ASSESSMENT STATE (from GET /assessments/:id)
// ============================================

export interface AssessmentState {
  assessment: Assessment;
  currentStageQuestions: SimQuestion[];
  currentStage: SimStage | null;
  progress: AssessmentProgress;
  competencies: CompetencyScore[];
}

export interface AssessmentProgress {
  totalQuestions: number;
  answeredQuestions: number;
  percentComplete: number;
  currentStage: StageName;
  simulatedMonth: number;
  mentorLifelinesRemaining: number;
}

// ============================================
// SIMULATION CONFIG
// ============================================

export interface SimulationConfig {
  name: string;
  version: string;
  levels: number[];
  mentors: Mentor[];
  investors: Investor[];
  leaders: Leader[];
  competencies: Competency[];
  stage_weights: Record<StageName, Record<CompetencyCode, number>>;
  stages: SimStage[];
}
