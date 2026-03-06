'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/src/lib/api'
import { RevenueSidePanel } from '@/src/components/RevenueSidePanel'
import { LeaderboardPanel } from '@/src/components/LeaderboardPanel'
import { PhaseTransitionScenario } from '@/src/components/PhaseTransitionScenario'
import { useLeaderboard } from '@/src/hooks/useLeaderboard'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  CheckCircle2,
  Send,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  AssessmentState,
  SimQuestion,
  SimOption,
  PhaseResponse,
  PhaseScenarioOut,
} from '@/src/types'

// ---- Helpers ----

function stageLabel(s: string) {
  return s.replace('STAGE_', '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

const STAGE_THEMES: Record<string, string> = {
  STAGE_NEG2_IDEATION: '#6366f1',
  STAGE_NEG1_VISION: '#8b5cf6',
  STAGE_0_COMMITMENT: '#f59e0b',
  STAGE_1_VALIDATION: '#10b981',
  STAGE_2A_GROWTH: '#3b82f6',
  STAGE_2B_EXPANSION: '#06b6d4',
  STAGE_3_SCALE: '#a855f7',
  STAGE_WARROOM_PREP: '#ef4444',
  STAGE_4_WARROOM: '#dc2626',
}

// ---- Timer ----

function useTimer(running: boolean) {
  const [seconds, setSeconds] = useState(0)
  const ref = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } else {
      if (ref.current) clearInterval(ref.current)
    }
    return () => { if (ref.current) clearInterval(ref.current) }
  }, [running])
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// ---- Phase answers ----

interface PhaseAnswers {
  [questionId: string]: PhaseResponse
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AssessmentPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params?.assessmentId as string

  const [state, setState] = useState<AssessmentState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Phase answers - collected locally, no API until phase complete
  const [answers, setAnswers] = useState<PhaseAnswers>({})
  const [qIndex, setQIndex] = useState(0)
  const [mcqFeedback, setMcqFeedback] = useState<string | null>(null)

  // Phase submitting
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Phase transition
  const [phaseScenario, setPhaseScenario] = useState<PhaseScenarioOut | null>(null)
  const [showingScenario, setShowingScenario] = useState(false)

  // Revenue
  const [revenue, setRevenue] = useState(100000)
  const [prevRevenue, setPrevRevenue] = useState<number | undefined>(undefined)

  // User + batch
  const [userId, setUserId] = useState<string | undefined>()
  const [batchCode, setBatchCode] = useState<string | undefined>()

  // Timer
  const timer = useTimer(!submitting && !loading && !showingScenario && !!state)

  // Leaderboard
  const { entries, connected, updatedAt } = useLeaderboard(batchCode)

  // Load assessment
  const load = useCallback(async () => {
    try {
      const data = await api.assessments.get(assessmentId)
      setState(data)
      if ((data.assessment as any).revenueProjection) {
        setRevenue((data.assessment as any).revenueProjection)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load assessment')
    } finally {
      setLoading(false)
    }
  }, [assessmentId])

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
    const storedBatch = JSON.parse(localStorage.getItem('batch') || '{}')
    setUserId(storedUser?.id)
    setBatchCode(storedBatch?.code)
    load()
  }, [load])

  // Reset on stage change
  useEffect(() => {
    setQIndex(0)
    setAnswers({})
    setMcqFeedback(null)
    setSubmitError('')
  }, [state?.assessment.currentStage])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => router.push('/dashboard')}>Back to Dashboard</Button>
      </div>
    )
  }

  if (!state) return null

  const { assessment, currentStageQuestions } = state
  const questions: SimQuestion[] = currentStageQuestions || []
  const currentQ = questions[qIndex] as SimQuestion | undefined
  const accent = STAGE_THEMES[assessment.currentStage] || '#6366f1'
  const isLastQuestion = qIndex === questions.length - 1
  const isFirstQuestion = qIndex === 0
  const currentAnswer = currentQ ? answers[currentQ.q_id] : undefined
  const answeredCount = Object.keys(answers).length

  // ---- Handlers ----

  function handleSelectOption(opt: SimOption) {
    if (!currentQ) return
    setAnswers((prev) => ({
      ...prev,
      [currentQ.q_id]: { questionId: currentQ.q_id, type: 'multiple_choice', selectedOptionId: opt.id },
    }))
    setMcqFeedback(opt.feedback || null)
  }

  function handleTextChange(text: string) {
    if (!currentQ) return
    setAnswers((prev) => ({
      ...prev,
      [currentQ.q_id]: { questionId: currentQ.q_id, type: 'open_text', text },
    }))
  }

  function goBack() {
    if (qIndex > 0) { setQIndex((i) => i - 1); setMcqFeedback(null) }
  }

  function goNext() {
    if (qIndex < questions.length - 1) { setQIndex((i) => i + 1); setMcqFeedback(null) }
  }

  async function handleSubmitPhase() {
    setSubmitting(true)
    setSubmitError('')
    try {
      const responses: PhaseResponse[] = questions.map((q: SimQuestion) => {
        const a = answers[q.q_id]
        return a || { questionId: q.q_id, type: q.type as PhaseResponse['type'], text: '' }
      })
      const result = await api.assessments.submitPhase(assessmentId, {
        stageId: assessment.currentStage,
        responses,
      })
      if (result.revenueProjection) {
        setPrevRevenue(revenue)
        setRevenue(result.revenueProjection)
      }
      if (result.phaseScenario) {
        setPhaseScenario(result.phaseScenario)
        setShowingScenario(true)
      } else if (result.nextStage) {
        await load()
      } else {
        router.push(`/results/${assessmentId}`)
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit phase')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleScenarioSubmit(response: string) {
    if (!phaseScenario) return
    await api.assessments.answerPhaseScenario(assessmentId, {
      fromStage: phaseScenario.fromStage,
      toStage: phaseScenario.toStage,
      response,
    })
    setTimeout(async () => {
      setShowingScenario(false)
      setPhaseScenario(null)
      await load()
    }, 1500)
  }

  // ---- Phase transition scenario screen ----

  if (showingScenario && phaseScenario) {
    return (
      <div className="min-h-screen bg-background">
        {submitting && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-lg font-medium">AI is evaluating your responses...</p>
          </div>
        )}
        <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-md h-14 flex items-center px-6 gap-4">
          <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-white text-xs font-bold">KK</div>
          <div className="flex-1" />
          <Badge variant="outline" className="font-mono">{timer}</Badge>
        </header>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <PhaseTransitionScenario scenario={phaseScenario} onSubmit={handleScenarioSubmit} />
        </div>
      </div>
    )
  }

  // ---- Main assessment layout ----

  const pct = questions.length > 0 ? Math.round(((qIndex + 1) / questions.length) * 100) : 0

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {submitting && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-lg font-medium">Evaluating phase responses...</p>
          <p className="text-sm text-muted-foreground">AI is reviewing your answers</p>
        </div>
      )}

      {/* Top Bar */}
      <header
        className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur-md h-14 flex items-center px-4 gap-4"
        style={{ borderBottomColor: `${accent}40` }}
      >
        <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">KK</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground">
            <span style={{ color: accent }} className="font-medium">{stageLabel(assessment.currentStage)}</span>
            <span className="mx-2 text-muted-foreground/40">•</span>
            <span>Q{qIndex + 1} of {questions.length}</span>
          </div>
          <Progress value={pct} className="h-1 mt-1" />
        </div>
        <div className="flex items-center gap-1.5 text-sm font-mono flex-shrink-0">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{timer}</span>
        </div>
      </header>

      {/* 3-column body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[200px_1fr_220px] gap-6 max-w-7xl mx-auto w-full px-4 py-6">
        {/* LEFT: Revenue */}
        <div className="hidden lg:flex flex-col gap-4">
          <RevenueSidePanel revenue={revenue} previousRevenue={prevRevenue} currentStage={assessment.currentStage} />
          <div className="text-xs text-muted-foreground text-center p-2 border rounded-lg bg-muted/20">
            <div className="font-medium mb-1">Phase Progress</div>
            <div>{answeredCount}/{questions.length} answered</div>
          </div>
        </div>

        {/* CENTER: Question */}
        <div className="flex flex-col gap-4 min-w-0">
          {currentQ ? (
            <div className="flex flex-col flex-1 bg-card rounded-2xl border shadow-sm overflow-hidden">
              <div className="px-6 pt-6 pb-4 border-b">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge variant="outline" className="text-xs" style={{ borderColor: `${accent}60`, color: accent }}>
                    {currentQ.type === 'multiple_choice' ? 'Multiple Choice' : 'Open Response'}
                  </Badge>
                  {currentQ.assess && currentQ.assess.length > 0 && (
                    <Badge variant="secondary" className="text-xs">{currentQ.assess.join(', ')}</Badge>
                  )}
                  {currentAnswer && <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />}
                </div>
                <h2 className="text-lg font-semibold leading-snug">{currentQ.text}</h2>
                {currentQ.context_text && (
                  <p className="text-sm text-muted-foreground mt-2">{currentQ.context_text}</p>
                )}
                {currentQ.pressure_text && (
                  <div className="mt-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-400">
                    {currentQ.pressure_text}
                  </div>
                )}
              </div>

              <div className="px-6 py-4 flex-1">
                {currentQ.type === 'multiple_choice' && currentQ.options ? (
                  <div className="space-y-3">
                    {currentQ.options.map((opt: SimOption) => {
                      const isSelected = currentAnswer?.selectedOptionId === opt.id
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelectOption(opt)}
                          className={cn(
                            'w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm',
                            isSelected ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:border-primary/50 hover:bg-muted/30'
                          )}
                        >
                          {opt.text}
                        </button>
                      )
                    })}
                    {mcqFeedback && currentAnswer?.selectedOptionId && (
                      <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
                        <span className="font-medium">Mentor insight: </span>{mcqFeedback}
                      </div>
                    )}
                  </div>
                ) : (
                  <Textarea
                    placeholder="Type your response here..."
                    value={(currentAnswer as any)?.text || ''}
                    onChange={(e) => handleTextChange(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                )}
              </div>

              <div className="px-6 py-4 border-t flex items-center justify-between gap-4">
                <Button variant="outline" onClick={goBack} disabled={isFirstQuestion} size="sm">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>

                <div className="flex items-center gap-1.5">
                  {questions.map((_q: SimQuestion, i: number) => (
                    <button
                      key={i}
                      onClick={() => { setQIndex(i); setMcqFeedback(null) }}
                      className={cn(
                        'h-2 w-2 rounded-full transition-all',
                        i === qIndex ? 'bg-primary scale-125' : answers[questions[i].q_id] ? 'bg-primary/40' : 'bg-muted-foreground/20'
                      )}
                    />
                  ))}
                </div>

                {isLastQuestion ? (
                  <Button onClick={handleSubmitPhase} disabled={submitting} size="sm" style={{ backgroundColor: accent }}>
                    {submitting ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Evaluating...</>
                    ) : (
                      <><Send className="h-4 w-4 mr-2" />Submit Phase</>
                    )}
                  </Button>
                ) : (
                  <Button onClick={goNext} size="sm">
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>

              {submitError && (
                <div className="px-6 pb-4">
                  <p className="text-sm text-red-500">{submitError}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">No questions available</div>
          )}
        </div>

        {/* RIGHT: Leaderboard */}
        <div className="hidden lg:flex flex-col gap-4">
          {batchCode ? (
            <LeaderboardPanel
              entries={entries}
              currentUserId={userId}
              connected={connected}
              updatedAt={updatedAt}
              className="flex-1 max-h-[600px]"
            />
          ) : (
            <div className="rounded-xl border bg-card p-4 text-center text-sm text-muted-foreground">
              Join a batch to see live leaderboard
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
