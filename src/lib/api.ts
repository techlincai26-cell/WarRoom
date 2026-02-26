// ============================================
// KK's War Room 2.0 - API Client
// ============================================

import type {
  Assessment,
  AssessmentState,
  SubmitResponseResult,
  MentorLifelineResult,
  InvestorScorecard,
  EvaluationReport,
  ResponseData,
  Mentor,
  Investor,
  Leader,
  Competency,
  SimStage,
  CompetencyCode,
  StageName,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

// ============================================
// Helper
// ============================================

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${res.status}`);
  }

  return res.json();
}

// ============================================
// AUTH
// ============================================

export const api = {
  auth: {
    register: (data: { email: string; password: string; name: string }) =>
      request<{ token: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: (data: { email: string; password: string }) =>
      request<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    me: () => request<any>('/auth/me'),
  },

  // ============================================
  // CONFIG (public)
  // ============================================

  config: {
    getMentors: () => request<Mentor[]>('/config/mentors'),
    getInvestors: () => request<Investor[]>('/config/investors'),
    getLeaders: () => request<Leader[]>('/config/leaders'),
    getCompetencies: () => request<Competency[]>('/config/competencies'),
    getStages: () => request<SimStage[]>('/config/stages'),
    getStageWeights: () =>
      request<Record<StageName, Record<CompetencyCode, number>>>('/config/stage-weights'),
  },

  // ============================================
  // ASSESSMENTS
  // ============================================

  assessments: {
    create: (data: { level: 1 | 2; userIdea?: string }) =>
      request<Assessment>('/assessments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    list: () => request<Assessment[]>('/assessments'),

    get: (id: string) => request<AssessmentState>(`/assessments/${id}`),

    submitResponse: (id: string, data: { questionId: string; responseData: ResponseData }) =>
      request<SubmitResponseResult>(`/assessments/${id}/responses`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    submitStageResponses: (id: string, responses: Record<string, ResponseData>) =>
      request<SubmitResponseResult>(`/assessments/${id}/stage-responses`, {
        method: 'POST',
        body: JSON.stringify({ responses }),
      }),

    // Mentor Lifeline
    useMentorLifeline: (id: string, mentorId: string, question: string) =>
      request<MentorLifelineResult>(`/assessments/${id}/mentor`, {
        method: 'POST',
        body: JSON.stringify({ mentorId, question }),
      }),

    // War Room
    submitPitch: (id: string, pitchText: string) =>
      request<{ pitchReceived: boolean; investors: any[]; message: string }>(
        `/assessments/${id}/warroom/pitch`,
        {
          method: 'POST',
          body: JSON.stringify({ pitchText }),
        }
      ),

    respondToInvestor: (id: string, investorId: string, response: string) =>
      request<InvestorScorecard>(`/assessments/${id}/warroom/respond`, {
        method: 'POST',
        body: JSON.stringify({ investorId, response }),
      }),

    getScorecard: (id: string) =>
      request<InvestorScorecard[]>(`/assessments/${id}/warroom/scorecard`),

    // Report
    getReport: (id: string) => request<EvaluationReport>(`/assessments/${id}/report`),
  },
};

export default api;
