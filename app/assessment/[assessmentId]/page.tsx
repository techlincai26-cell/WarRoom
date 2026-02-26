'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/src/lib/api'
import type {
  AssessmentState,
  SimQuestion,
  SimStage,
  SimOption,
  SubmitResponseResult,
  ResponseData,
  MentorLifelineResult,
  Mentor,
  CompetencyScore,
  ProficiencyLevel,
} from '@/src/types'

// ============================================
// STAGE COLORS / THEMING
// ============================================
const STAGE_THEMES: Record<string, { bg: string; accent: string; glow: string }> = {
  STAGE_NEG2_IDEATION: { bg: '#0f1729', accent: '#6366f1', glow: 'rgba(99,102,241,0.15)' },
  STAGE_NEG1_VISION: { bg: '#0f1729', accent: '#8b5cf6', glow: 'rgba(139,92,246,0.15)' },
  STAGE_0_COMMITMENT: { bg: '#0f1725', accent: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
  STAGE_1_VALIDATION: { bg: '#0f1720', accent: '#10b981', glow: 'rgba(16,185,129,0.15)' },
  STAGE_2A_GROWTH: { bg: '#0f1725', accent: '#3b82f6', glow: 'rgba(59,130,246,0.15)' },
  STAGE_2B_EXPANSION: { bg: '#0f1725', accent: '#06b6d4', glow: 'rgba(6,182,212,0.15)' },
  STAGE_3_SCALE: { bg: '#170f25', accent: '#a855f7', glow: 'rgba(168,85,247,0.15)' },
  STAGE_WARROOM_PREP: { bg: '#1a0f0f', accent: '#ef4444', glow: 'rgba(239,68,68,0.15)' },
  STAGE_4_WARROOM: { bg: '#1a0f0f', accent: '#dc2626', glow: 'rgba(220,38,38,0.2)' },
}

export default function AssessmentPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params?.assessmentId as string

  const [state, setState] = useState<AssessmentState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<SubmitResponseResult | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})
  const [textResponses, setTextResponses] = useState<Record<string, string>>({})
  const [allocationsData, setAllocationsData] = useState<Record<string, Record<string, number>>>({})

  // Mentor Modal
  const [showMentorModal, setShowMentorModal] = useState(false)
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [mentorResult, setMentorResult] = useState<MentorLifelineResult | null>(null)
  const [mentorLoading, setMentorLoading] = useState(false)

  // Stage Transition
  const [showStageTransition, setShowStageTransition] = useState(false)
  const [nextStageInfo, setNextStageInfo] = useState<SubmitResponseResult['nextStage'] | null>(null)

  const loadAssessment = useCallback(async () => {
    try {
      const data = await api.assessments.get(assessmentId)
      setState(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [assessmentId])

  useEffect(() => {
    loadAssessment()
    // Load mentors for lifeline
    api.config.getMentors().then(setMentors).catch(() => { })
  }, [loadAssessment])

  // Reset input state when stage questions change
  useEffect(() => {
    setSelectedOptions({})
    setTextResponses({})
    setAllocationsData({})
    setFeedback(null)
  }, [state?.currentStageQuestions])

  const handleSubmit = async () => {
    if (!state?.currentStageQuestions || state.currentStageQuestions.length === 0) return
    setIsSubmitting(true)
    setError('')

    const responses: Record<string, ResponseData> = {}

    for (const q of state.currentStageQuestions) {
      let responseData: ResponseData = {}

      switch (q.type) {
        case 'multiple_choice':
        case 'scenario':
          if (!selectedOptions[q.q_id]) {
            setError('Please answer all questions before submitting')
            setIsSubmitting(false)
            return
          }
          responseData = { selectedOptionId: selectedOptions[q.q_id] }
          break
        case 'open_text':
          if (!textResponses[q.q_id] || !textResponses[q.q_id].trim()) {
            setError('Please answer all questions before submitting')
            setIsSubmitting(false)
            return
          }
          responseData = { text: textResponses[q.q_id] }
          break
        case 'budget_allocation':
          responseData = { allocations: allocationsData[q.q_id] || {} }
          break
      }

      responses[q.q_id] = responseData
    }

    try {
      const result = await api.assessments.submitStageResponses(assessmentId, responses)
      setFeedback(result)

      if (result.simCompleted) {
        setTimeout(() => router.push(`/assessment/${assessmentId}/final-report`), 2000)
      } else if (result.stageCompleted && result.nextStage) {
        setNextStageInfo(result.nextStage)
        setShowStageTransition(true)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit responses')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleNextQuestion = () => {
    setFeedback(null)
    loadAssessment()
  }

  const handleStageTransition = () => {
    setShowStageTransition(false)
    setNextStageInfo(null)
    setFeedback(null)
    loadAssessment()
  }

  const handleUseMentor = async (mentorId: string, question: string) => {
    setMentorLoading(true)
    try {
      const result = await api.assessments.useMentorLifeline(assessmentId, mentorId, question)
      setMentorResult(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setMentorLoading(false)
    }
  }

  if (loading) return <LoadingScreen />
  if (error && !state) return <ErrorScreen message={error} />
  if (!state) return <ErrorScreen message="Assessment not found" />

  const theme = STAGE_THEMES[state.assessment.currentStage] || STAGE_THEMES.STAGE_NEG2_IDEATION
  const questions = state.currentStageQuestions || []

  return (
    <div className="assessment-page" style={{ background: theme.bg }}>
      {/* Top Bar */}
      <header className="top-bar" style={{ borderColor: `${theme.accent}33` }}>
        <div className="top-left">
          <span className="stage-label" style={{ color: theme.accent }}>
            {state.currentStage?.name || state.assessment.currentStage}
          </span>
          <span className="month-label">Month {state.assessment.simulatedMonth}</span>
        </div>
        <div className="top-center">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${state.progress.percentComplete}%`,
                background: theme.accent,
              }}
            />
          </div>
          <span className="progress-text">
            {state.progress.answeredQuestions}/{state.progress.totalQuestions} Questions
          </span>
        </div>
        <div className="top-right">
          <button
            className="mentor-btn"
            onClick={() => setShowMentorModal(true)}
            disabled={state.progress.mentorLifelinesRemaining <= 0}
            title={`${state.progress.mentorLifelinesRemaining} lifelines remaining`}
          >
            🧠 Mentor ({state.progress.mentorLifelinesRemaining})
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Stage Transition Overlay */}
        {showStageTransition && nextStageInfo && (
          <StageTransitionOverlay
            stage={nextStageInfo}
            theme={theme}
            onContinue={handleStageTransition}
          />
        )}

        {/* Feedback View */}
        {feedback && !showStageTransition ? (
          <FeedbackView
            feedback={feedback}
            theme={theme}
            onNext={handleNextQuestion}
            simCompleted={feedback.simCompleted}
          />
        ) : questions && questions.length > 0 && !showStageTransition ? (
          /* Question View (Multiple) */
          <div className="questions-container">
            {questions.map((q) => (
              <div key={q.q_id} className="question-container" style={{ marginBottom: '3rem', paddingBottom: '2rem', borderBottom: `1px solid ${theme.accent}33` }}>
                {/* Context / Pressure */}
                {q.context_text && (
                  <div className="context-block" style={{ borderColor: `${theme.accent}44` }}>
                    <span className="context-label">📋 Context</span>
                    <p>{q.context_text}</p>
                  </div>
                )}
                {q.pressure_text && (
                  <div className="pressure-block">
                    <span className="pressure-label">⚠️ Pressure</span>
                    <p>{q.pressure_text}</p>
                  </div>
                )}

                {/* Question */}
                <div className="question-text">
                  <h2>{q.text}</h2>
                  {q.section && <span className="section-tag">{q.section}</span>}
                </div>

                {/* Competency Tags */}
                <div className="assessed-comps">
                  {q.assess?.map((c: string) => (
                    <span key={c} className="comp-badge" style={{ borderColor: theme.accent }}>
                      {c}
                    </span>
                  ))}
                </div>

                {/* Input Area */}
                {(q.type === 'multiple_choice' || q.type === 'scenario') && q.options && (
                  <div className="options-list">
                    {q.options.map((opt: SimOption) => (
                      <button
                        key={opt.id}
                        className={`option-btn ${selectedOptions[q.q_id] === opt.id ? 'selected' : ''}`}
                        onClick={() => setSelectedOptions(prev => ({ ...prev, [q.q_id]: opt.id }))}
                        style={{
                          borderColor: selectedOptions[q.q_id] === opt.id ? theme.accent : 'rgba(255,255,255,0.08)',
                          background: selectedOptions[q.q_id] === opt.id ? `${theme.accent}15` : 'rgba(255,255,255,0.03)',
                        }}
                      >
                        {opt.text}
                        {opt.warning && <span className="warning-badge">⚠</span>}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === 'open_text' && (
                  <textarea
                    className="text-input"
                    value={textResponses[q.q_id] || ''}
                    onChange={(e) => setTextResponses(prev => ({ ...prev, [q.q_id]: e.target.value }))}
                    placeholder="Share your thoughts in detail..."
                    rows={6}
                    style={{ borderColor: `${theme.accent}33` }}
                  />
                )}

                {q.type === 'budget_allocation' && (
                  <BudgetAllocator
                    allocations={allocationsData[q.q_id] || {}}
                    onChange={(a) => setAllocationsData(prev => ({ ...prev, [q.q_id]: a }))}
                    theme={theme}
                  />
                )}
              </div>
            ))}

            {error && <div className="inline-error">{error}</div>}

            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={isSubmitting}
              style={{ background: theme.accent, marginTop: '1rem' }}
            >
              {isSubmitting ? 'Evaluating Phase...' : 'Submit Phase Responses →'}
            </button>
          </div>
        ) : null}
      </main>

      {/* Mentor Modal */}
      {showMentorModal && (
        <MentorModal
          mentors={mentors}
          mentorResult={mentorResult}
          mentorLoading={mentorLoading}
          onSelect={handleUseMentor}
          onClose={() => { setShowMentorModal(false); setMentorResult(null) }}
          lifelinesLeft={state.progress.mentorLifelinesRemaining}
          theme={theme}
        />
      )}

      <style jsx>{`
        .assessment-page {
          min-height: 100vh;
          color: #e0e0e0;
          transition: background 0.5s;
        }
        .top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 2rem;
          border-bottom: 1px solid;
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 10;
          background: rgba(10,10,30,0.85);
        }
        .top-left { display: flex; align-items: center; gap: 1rem; }
        .stage-label {
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: 0.5px;
        }
        .month-label {
          color: #6b7280;
          font-size: 0.85rem;
        }
        .top-center {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
          flex: 1;
          max-width: 400px;
          margin: 0 2rem;
        }
        .progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(255,255,255,0.08);
          border-radius: 3px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.4s;
        }
        .progress-text { color: #6b7280; font-size: 0.75rem; }
        .top-right { display: flex; gap: 0.8rem; }
        .mentor-btn {
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          color: #e0e0e0;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
        }
        .mentor-btn:hover:not(:disabled) {
          background: rgba(255,255,255,0.1);
        }
        .mentor-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .main-content {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .question-container {
          animation: fadeIn 0.4s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .context-block, .pressure-block {
          border-radius: 12px;
          padding: 1rem 1.2rem;
          margin-bottom: 1.5rem;
        }
        .context-block {
          background: rgba(255,255,255,0.03);
          border-left: 3px solid;
        }
        .pressure-block {
          background: rgba(239,68,68,0.06);
          border-left: 3px solid rgba(239,68,68,0.5);
        }
        .context-label, .pressure-label {
          font-weight: 600;
          font-size: 0.8rem;
          display: block;
          margin-bottom: 0.4rem;
          color: #9ca3af;
        }
        .context-block p, .pressure-block p {
          font-size: 0.95rem;
          line-height: 1.5;
          color: #d1d5db;
          margin: 0;
        }

        .question-text {
          margin-bottom: 1rem;
        }
        .question-text h2 {
          font-size: 1.35rem;
          font-weight: 600;
          line-height: 1.5;
          color: white;
          margin-bottom: 0.5rem;
        }
        .section-tag {
          font-size: 0.75rem;
          color: #9ca3af;
          background: rgba(255,255,255,0.05);
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
        }

        .assessed-comps {
          display: flex;
          gap: 0.4rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }
        .comp-badge {
          font-size: 0.7rem;
          font-weight: 600;
          border: 1px solid;
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
          color: #a5b4fc;
        }

        .options-list {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
          margin-bottom: 1.5rem;
        }
        .option-btn {
          text-align: left;
          padding: 1rem 1.2rem;
          border: 1.5px solid;
          border-radius: 12px;
          color: #e0e0e0;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.95rem;
          line-height: 1.4;
          position: relative;
        }
        .option-btn:hover {
          background: rgba(255,255,255,0.06) !important;
        }
        .option-btn.selected {
          font-weight: 500;
        }
        .warning-badge {
          position: absolute;
          top: 8px;
          right: 12px;
          font-size: 0.8rem;
        }

        .text-input {
          width: 100%;
          padding: 1rem;
          background: rgba(255,255,255,0.03);
          border: 1.5px solid;
          border-radius: 12px;
          color: #e0e0e0;
          font-size: 0.95rem;
          resize: vertical;
          margin-bottom: 1.5rem;
          font-family: inherit;
          line-height: 1.5;
        }
        .text-input:focus {
          outline: none;
          background: rgba(255,255,255,0.05);
        }
        .text-input::placeholder { color: #6b7280; }

        .inline-error {
          color: #fca5a5;
          font-size: 0.85rem;
          margin-bottom: 1rem;
          padding: 0.5rem 0.8rem;
          background: rgba(239,68,68,0.08);
          border-radius: 8px;
        }

        .submit-btn {
          width: 100%;
          padding: 1rem;
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 1.05rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          .top-bar { flex-wrap: wrap; gap: 0.5rem; padding: 0.8rem 1rem; }
          .top-center { order: 3; max-width: 100%; margin: 0; }
          .main-content { padding: 1.5rem; }
          .question-text h2 { font-size: 1.1rem; }
        }
      `}</style>
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

function LoadingScreen() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a1a', color: '#e0e0e0' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p>Loading simulation...</p>
      </div>
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a1a', color: '#fca5a5' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>❌</div>
        <p>{message}</p>
        <a href="/" style={{ color: '#a5b4fc', marginTop: '1rem', display: 'inline-block' }}>← Return Home</a>
      </div>
    </div>
  )
}

function FeedbackView({
  feedback,
  theme,
  onNext,
  simCompleted,
}: {
  feedback: SubmitResponseResult
  theme: { accent: string }
  onNext: () => void
  simCompleted: boolean
}) {
  const profLabels: Record<number, { text: string; color: string }> = {
    1: { text: 'P1 — Developing', color: '#ef4444' },
    2: { text: 'P2 — Strong', color: '#f59e0b' },
    3: { text: 'P3 — Advanced', color: '#10b981' },
  }
  const prof = profLabels[feedback.proficiency] || profLabels[2]

  const evalData = typeof feedback.aiEvaluation === 'string'
    ? JSON.parse(feedback.aiEvaluation)
    : feedback.aiEvaluation

  return (
    <div className="feedback-view" style={{ animation: 'fadeIn 0.4s ease' }}>
      <div
        className="proficiency-badge"
        style={{
          background: `${prof.color}15`,
          borderColor: `${prof.color}44`,
          color: prof.color,
        }}
      >
        {prof.text}
      </div>

      <div className="feedback-content">
        <p>{evalData?.feedback || 'Response recorded.'}</p>
        {evalData?.signal && (
          <div className="signal-block">
            <strong>Signal:</strong> {evalData.signal}
          </div>
        )}
        {evalData?.warning && (
          <div className="warning-block">
            <strong>⚠ Warning:</strong> {evalData.warning}
          </div>
        )}
      </div>

      <button
        className="next-btn"
        onClick={onNext}
        style={{ background: theme.accent }}
      >
        {simCompleted
          ? '🎯 View Your Report'
          : feedback.stageCompleted
            ? 'Continue to Next Stage →'
            : 'Next Question →'}
      </button>

      <style jsx>{`
        .feedback-view {
          text-align: center;
          padding: 2rem 0;
        }
        .proficiency-badge {
          display: inline-block;
          padding: 0.5rem 1.5rem;
          border: 1.5px solid;
          border-radius: 12px;
          font-weight: 700;
          font-size: 1.1rem;
          margin-bottom: 1.5rem;
        }
        .feedback-content {
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          text-align: left;
        }
        .feedback-content p {
          font-size: 1rem;
          line-height: 1.6;
          color: #d1d5db;
          margin: 0;
        }
        .signal-block, .warning-block {
          margin-top: 1rem;
          padding: 0.6rem 0.8rem;
          border-radius: 8px;
          font-size: 0.9rem;
        }
        .signal-block {
          background: rgba(16,185,129,0.08);
          color: #34d399;
        }
        .warning-block {
          background: rgba(239,68,68,0.08);
          color: #fca5a5;
        }
        .next-btn {
          width: 100%;
          padding: 1rem;
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 1.05rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
        }
        .next-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  )
}

function StageTransitionOverlay({
  stage,
  theme,
  onContinue,
}: {
  stage: NonNullable<SubmitResponseResult['nextStage']>
  theme: { accent: string; glow: string }
  onContinue: () => void
}) {
  return (
    <div className="stage-overlay" style={{ animation: 'fadeIn 0.5s ease' }}>
      <div className="stage-card" style={{ borderColor: `${theme.accent}44`, boxShadow: `0 0 40px ${theme.glow}` }}>
        <div className="stage-tag" style={{ background: `${theme.accent}20`, color: theme.accent }}>
          Stage {stage.stageNumber}
        </div>
        <h1>{stage.title || stage.name}</h1>
        <div className="comps-assessed">
          <span>Competencies assessed:</span>
          <div className="comp-list">
            {stage.competencies?.map((c: string) => (
              <span key={c} className="comp-chip" style={{ borderColor: theme.accent }}>{c}</span>
            ))}
          </div>
        </div>
        <button
          className="continue-btn"
          onClick={onContinue}
          style={{ background: theme.accent }}
        >
          Enter Stage →
        </button>
      </div>

      <style jsx>{`
        .stage-overlay {
          text-align: center;
          padding: 3rem 0;
        }
        .stage-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid;
          border-radius: 20px;
          padding: 3rem;
          max-width: 600px;
          margin: 0 auto;
        }
        .stage-tag {
          display: inline-block;
          padding: 0.3rem 1rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        h1 {
          font-size: 2rem;
          font-weight: 800;
          color: white;
          margin-bottom: 1.5rem;
        }
        .comps-assessed {
          margin-bottom: 2rem;
        }
        .comps-assessed span {
          font-size: 0.85rem;
          color: #9ca3af;
          display: block;
          margin-bottom: 0.6rem;
        }
        .comp-list {
          display: flex;
          gap: 0.4rem;
          justify-content: center;
          flex-wrap: wrap;
        }
        .comp-chip {
          border: 1px solid;
          padding: 0.2rem 0.6rem;
          border-radius: 6px;
          font-size: 0.8rem;
          color: #a5b4fc;
          font-weight: 600;
        }
        .continue-btn {
          padding: 0.8rem 2rem;
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
        }
        .continue-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  )
}

function MentorModal({
  mentors,
  mentorResult,
  mentorLoading,
  onSelect,
  onClose,
  lifelinesLeft,
  theme,
}: {
  mentors: Mentor[]
  mentorResult: MentorLifelineResult | null
  mentorLoading: boolean
  onSelect: (id: string, question: string) => void
  onClose: () => void
  lifelinesLeft: number
  theme: { accent: string }
}) {
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null)
  const [questionText, setQuestionText] = useState('')
  return (
    <div className="mentor-overlay" onClick={onClose}>
      <div className="mentor-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🧠 Mentor Lifeline</h2>
          <span className="lifelines">{lifelinesLeft} remaining</span>
        </div>

        {mentorResult ? (
          <div className="guidance-view">
            <div className="mentor-name" style={{ color: theme.accent }}>
              {mentorResult.mentorName}
            </div>
            <blockquote>{mentorResult.guidance}</blockquote>
            <button className="close-modal-btn" onClick={() => {
              setSelectedMentor(null)
              setQuestionText('')
              onClose()
            }}>
              Got it, thanks →
            </button>
          </div>
        ) : selectedMentor ? (
          <div className="question-view">
            <button className="back-btn" onClick={() => setSelectedMentor(null)}>
              ← Back to Mentors
            </button>
            <div className="selected-mentor-header" style={{ borderColor: theme.accent }}>
              <span className="mentor-avatar-small">{selectedMentor.avatar}</span>
              <div>
                <strong>{selectedMentor.name}</strong>
                <p>{selectedMentor.specialization}</p>
              </div>
            </div>

            <p className="prompt-text">What specific advice do you need?</p>
            <textarea
              className="mentor-question-input"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="E.g., Should I focus on marketing or product development right now?"
              rows={4}
              style={{ borderColor: `${theme.accent}44` }}
            />

            <button
              className="ask-btn"
              disabled={mentorLoading || !questionText.trim()}
              onClick={() => onSelect(selectedMentor.id, questionText)}
              style={{ background: theme.accent }}
            >
              {mentorLoading ? 'Consulting...' : 'Ask Mentor →'}
            </button>
          </div>
        ) : (
          <div className="mentor-grid">
            {mentors.map((m) => (
              <button
                key={m.id}
                className="mentor-card"
                onClick={() => setSelectedMentor(m)}
                disabled={mentorLoading || lifelinesLeft <= 0}
              >
                <div className="mentor-avatar">{m.avatar}</div>
                <div className="mentor-info">
                  <strong>{m.name}</strong>
                  <p>{m.specialization}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .mentor-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          backdrop-filter: blur(4px);
          animation: fadeIn 0.2s ease;
        }
        .mentor-modal {
          background: #1a1a3e;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 2rem;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .modal-header h2 { color: white; font-size: 1.3rem; margin: 0; }
        .lifelines {
          color: #f59e0b;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .mentor-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.8rem;
        }
        .mentor-card {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          text-align: left;
          color: #e0e0e0;
          display: flex;
          align-items: center;
          gap: 0.8rem;
        }
        .mentor-card:hover:not(:disabled) {
          border-color: rgba(139,92,246,0.3);
          background: rgba(139,92,246,0.08);
        }
        .mentor-card:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .mentor-avatar { font-size: 1.8rem; }
        .mentor-info strong {
          display: block;
          font-size: 0.9rem;
          color: white;
          margin-bottom: 0.2rem;
        }
        .mentor-info p {
          font-size: 0.75rem;
          color: #9ca3af;
          margin: 0;
        }
        .guidance-view { text-align: center; }
        .mentor-name {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }
        blockquote {
          background: rgba(255,255,255,0.03);
          border-left: 3px solid rgba(139,92,246,0.5);
          padding: 1rem 1.2rem;
          border-radius: 0 8px 8px 0;
          font-style: italic;
          color: #d1d5db;
          line-height: 1.6;
          margin: 0 0 1.5rem 0;
          text-align: left;
        }
        .close-modal-btn {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          color: white;
          padding: 0.6rem 1.5rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }
        .close-modal-btn:hover {
          background: rgba(255,255,255,0.15);
        }

        .question-view {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .back-btn {
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          text-align: left;
          padding: 0;
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }
        .back-btn:hover { color: white; }
        .selected-mentor-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid;
          margin-bottom: 0.5rem;
        }
        .mentor-avatar-small { font-size: 2rem; }
        .selected-mentor-header strong { color: white; display: block; }
        .selected-mentor-header p { color: #9ca3af; margin: 0; font-size: 0.8rem; }
        .prompt-text {
          color: #e0e0e0;
          font-weight: 600;
          margin: 0;
        }
        .mentor-question-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid;
          border-radius: 8px;
          padding: 1rem;
          color: white;
          font-family: inherit;
          resize: vertical;
        }
        .mentor-question-input:focus { outline: none; background: rgba(255,255,255,0.05); }
        .ask-btn {
          padding: 0.8rem;
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .ask-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .ask-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        @media (max-width: 600px) {
          .mentor-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}

function BudgetAllocator({
  allocations,
  onChange,
  theme,
}: {
  allocations: Record<string, number>
  onChange: (a: Record<string, number>) => void
  theme: { accent: string }
}) {
  const categories = [
    { key: 'product_dev', label: 'Product Development', icon: '🛠️' },
    { key: 'marketing', label: 'Marketing & Sales', icon: '📣' },
    { key: 'hiring', label: 'Hiring & Team', icon: '👥' },
    { key: 'buffer', label: 'Emergency Buffer', icon: '🛡️' },
  ]

  const total = Object.values(allocations).reduce((s, v) => s + (v || 0), 0)

  return (
    <div className="budget-allocator">
      {categories.map(({ key, label, icon }) => (
        <div key={key} className="budget-row">
          <span className="budget-label">{icon} {label}</span>
          <input
            type="range"
            min="0"
            max="100"
            value={allocations[key] || 0}
            onChange={(e) => onChange({ ...allocations, [key]: parseInt(e.target.value) })}
            style={{ accentColor: theme.accent }}
          />
          <span className="budget-value">{allocations[key] || 0}%</span>
        </div>
      ))}
      <div className={`budget-total ${total !== 100 ? 'over' : ''}`}>
        Total: {total}% {total !== 100 && `(must be 100%)`}
      </div>
      <style jsx>{`
        .budget-allocator { margin-bottom: 1.5rem; }
        .budget-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.8rem;
        }
        .budget-label {
          width: 180px;
          font-size: 0.9rem;
          color: #d1d5db;
        }
        input[type="range"] {
          flex: 1;
          height: 6px;
          border-radius: 3px;
        }
        .budget-value {
          width: 50px;
          text-align: right;
          font-weight: 600;
          color: white;
          font-size: 0.9rem;
        }
        .budget-total {
          text-align: center;
          margin-top: 0.8rem;
          font-size: 0.9rem;
          font-weight: 600;
          color: #34d399;
        }
        .budget-total.over { color: #fca5a5; }
      `}</style>
    </div>
  )
}
