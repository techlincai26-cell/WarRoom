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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  CheckCircle2,
  Send,
  AlertTriangle,
  Lightbulb,
  Target,
  FileText,
  DollarSign,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  AssessmentState,
  SimQuestion,
  SimOption,
  PhaseResponse,
  PhaseScenarioOut,
  StageName,
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

// Stage order for navigation
const STAGE_ORDER: StageName[] = [
  'STAGE_NEG2_IDEATION',
  'STAGE_NEG1_VISION',
  'STAGE_0_COMMITMENT',
  'STAGE_1_VALIDATION',
  'STAGE_2A_GROWTH',
  'STAGE_2B_EXPANSION',
  'STAGE_3_SCALE',
  'STAGE_WARROOM_PREP',
  'STAGE_4_WARROOM',
]

// Stage durations in minutes (from SOP)
const STAGE_DURATIONS: Record<string, number> = {
  STAGE_NEG2_IDEATION: 10,
  STAGE_NEG1_VISION: 5,
  STAGE_0_COMMITMENT: 10,
  STAGE_1_VALIDATION: 10,
  STAGE_2A_GROWTH: 10,
  STAGE_2B_EXPANSION: 10,
  STAGE_3_SCALE: 10,
  STAGE_WARROOM_PREP: 5,
  STAGE_4_WARROOM: 15,
}

function getQuestionTypeLabel(type: string): string {
  switch (type) {
    case 'multiple_choice': return 'Multiple Choice'
    case 'scenario': return 'Scenario Based'
    case 'budget_allocation': return 'Budget Allocation'
    case 'open_text': return 'Open Response'
    default: return 'Question'
  }
}

function getQuestionTypeIcon(type: string) {
  switch (type) {
    case 'scenario': return <AlertTriangle className="h-3.5 w-3.5" />
    case 'multiple_choice': return <Target className="h-3.5 w-3.5" />
    case 'budget_allocation': return <DollarSign className="h-3.5 w-3.5" />
    default: return <FileText className="h-3.5 w-3.5" />
  }
}

function getQuestionTypeColor(type: string): string {
  switch (type) {
    case 'scenario': return '#f59e0b'
    case 'multiple_choice': return '#3b82f6'
    case 'budget_allocation': return '#10b981'
    default: return '#8b5cf6'
  }
}

// Ideation form section icons
const SECTION_ICONS: Record<string, React.ReactNode> = {
  'The Idea': <Lightbulb className="h-5 w-5" />,
  'Market Reality': <Target className="h-5 w-5" />,
  'Money & Model': <DollarSign className="h-5 w-5" />,
  'Founder Fit': <FileText className="h-5 w-5" />,
}

// ---- Stage Countdown Timer ----

function useStageTimer(stageId: string | undefined, durationMinutes: number, running: boolean) {
  const [remaining, setRemaining] = useState(durationMinutes * 60)
  const [expired, setExpired] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!stageId || !running) return

    const storageKey = `timer_${stageId}`
    let startTime = parseInt(localStorage.getItem(storageKey) || '0', 10)
    if (!startTime) {
      startTime = Date.now()
      localStorage.setItem(storageKey, startTime.toString())
    }

    const durationMs = durationMinutes * 60 * 1000

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const rem = Math.max(0, durationMs - elapsed)
      setRemaining(Math.ceil(rem / 1000))
      if (rem <= 0) {
        setExpired(true)
        if (intervalRef.current) clearInterval(intervalRef.current)
      }
    }, 1000)

    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [stageId, durationMinutes, running])

  // Reset on stage change
  useEffect(() => {
    setExpired(false)
    setRemaining(durationMinutes * 60)
  }, [stageId, durationMinutes])

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const display = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  const isWarning = remaining < 60 && remaining > 0

  return { display, expired, isWarning, remaining }
}

// ---- Phase answers ----

interface PhaseAnswers {
  [questionId: string]: PhaseResponse
}

// ---- AI Generated Question ----

interface AIGeneratedQuestion {
  text: string
  leaderName: string
  loading: boolean
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

  // AI generated end-of-phase question
  const [aiQuestion, setAiQuestion] = useState<AIGeneratedQuestion | null>(null)
  const [aiQuestionAnswer, setAiQuestionAnswer] = useState('')
  const [showingAiQuestion, setShowingAiQuestion] = useState(false)

  // Revenue
  const [revenue, setRevenue] = useState(100000)
  const [prevRevenue, setPrevRevenue] = useState<number | undefined>(undefined)

  // User + batch
  const [userId, setUserId] = useState<string | undefined>()
  const [batchCode, setBatchCode] = useState<string | undefined>()

  // Budget allocation state
  const [budgetAllocations, setBudgetAllocations] = useState<Record<string, Record<string, number>>>({})

  // Leaderboard
  const { entries, connected, updatedAt } = useLeaderboard(batchCode)

  // Stage timer with auto-advance
  const stageDuration = state ? (STAGE_DURATIONS[state.assessment.currentStage] || 10) : 10
  const stageTimer = useStageTimer(
    state?.assessment.currentStage,
    stageDuration,
    !submitting && !loading && !showingScenario && !showingAiQuestion && !!state
  )

  // Auto-submit on timer expiry
  const autoSubmitTriggered = useRef(false)
  useEffect(() => {
    if (stageTimer.expired && !autoSubmitTriggered.current && !submitting && state) {
      autoSubmitTriggered.current = true
      handleSubmitPhase()
    }
  }, [stageTimer.expired])

  // Reset auto-submit flag on stage change
  useEffect(() => {
    autoSubmitTriggered.current = false
  }, [state?.assessment.currentStage])

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
    setShowingAiQuestion(false)
    setAiQuestion(null)
    setAiQuestionAnswer('')
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
  const isIdeationStage = assessment.currentStage === 'STAGE_NEG2_IDEATION'
  const isWarRoomPrepOrBeyond = assessment.currentStage === 'STAGE_WARROOM_PREP' || assessment.currentStage === 'STAGE_4_WARROOM'

  // ---- Handlers ----

  function handleSelectOption(opt: SimOption, questionId?: string) {
    const qId = questionId || currentQ?.q_id
    if (!qId) return
    setAnswers((prev) => ({
      ...prev,
      [qId]: { questionId: qId, type: 'multiple_choice', selectedOptionId: opt.id },
    }))
    if (!questionId) setMcqFeedback(opt.feedback || null)
  }

  function handleTextChange(text: string, questionId?: string) {
    const qId = questionId || currentQ?.q_id
    if (!qId) return
    setAnswers((prev) => ({
      ...prev,
      [qId]: { questionId: qId, type: 'open_text', text },
    }))
  }

  function handleBudgetAllocation(questionId: string, optionId: string, value: number) {
    setBudgetAllocations((prev) => {
      const updated = { ...prev }
      if (!updated[questionId]) updated[questionId] = {}
      updated[questionId] = { ...updated[questionId], [optionId]: value }
      return updated
    })
    const allocs = { ...(budgetAllocations[questionId] || {}), [optionId]: value }
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { questionId, type: 'budget_allocation', allocations: allocs },
    }))
  }

  function goBack() {
    if (qIndex > 0) { setQIndex((i) => i - 1); setMcqFeedback(null) }
  }

  function goNext() {
    if (qIndex < questions.length - 1) { setQIndex((i) => i + 1); setMcqFeedback(null) }
  }

  async function generateAiEndOfPhaseQuestion() {
    setShowingAiQuestion(true)
    setAiQuestion({ text: '', leaderName: '', loading: true })
    try {
      const summaryResponses = questions.map((q) => {
        const a = answers[q.q_id]
        if (!a) return { questionId: q.q_id, summary: '(not answered)' }
        if (a.selectedOptionId) {
          const opt = q.options?.find(o => o.id === a.selectedOptionId)
          return { questionId: q.q_id, summary: opt?.text || a.selectedOptionId }
        }
        return { questionId: q.q_id, summary: a.text || '(not answered)' }
      })

      const result = await api.assessments.generateAiQuestion(assessmentId, {
        stageId: assessment.currentStage,
        responses: summaryResponses,
        userIdea: assessment.userIdea || '',
      })
      setAiQuestion({
        text: result.question,
        leaderName: result.leaderName,
        loading: false,
      })
    } catch {
      // If AI question generation fails, skip to submission
      setShowingAiQuestion(false)
      setAiQuestion(null)
      await doPhaseSubmit()
    }
  }

  async function handleSubmitAiQuestion() {
    setShowingAiQuestion(false)
    // Include the AI question answer as an extra response
    if (aiQuestionAnswer.trim()) {
      setAnswers((prev) => ({
        ...prev,
        [`AI_${assessment.currentStage}`]: {
          questionId: `AI_${assessment.currentStage}`,
          type: 'open_text',
          text: aiQuestionAnswer,
        },
      }))
    }
    await doPhaseSubmit()
  }

  async function handleSubmitPhase() {
    // First generate AI end-of-phase question, then submit
    if (!showingAiQuestion && !aiQuestion) {
      await generateAiEndOfPhaseQuestion()
      return
    }
    await doPhaseSubmit()
  }

  async function doPhaseSubmit() {
    setSubmitting(true)
    setSubmitError('')
    try {
      const responses: PhaseResponse[] = questions.map((q: SimQuestion) => {
        const a = answers[q.q_id]
        return a || { questionId: q.q_id, type: q.type as PhaseResponse['type'], text: '' }
      })
      // Add AI question response if exists
      const aiKey = `AI_${assessment.currentStage}`
      if (answers[aiKey]) {
        responses.push(answers[aiKey])
      }

      const result = await api.assessments.submitPhase(assessmentId, {
        stageId: assessment.currentStage,
        responses,
      })
      if (result.revenueProjection) {
        setPrevRevenue(revenue)
        setRevenue(result.revenueProjection)
      }

      // Clear the stage timer from localStorage
      localStorage.removeItem(`timer_${assessment.currentStage}`)

      if (result.phaseScenario) {
        setPhaseScenario(result.phaseScenario)
        setShowingScenario(true)
      } else if (result.nextStage) {
        // If next stage is WAR ROOM, navigate directly to war room page
        if (result.nextStage === 'STAGE_4_WARROOM') {
          router.push(`/assessment/${assessmentId}/war-room`)
          return
        }
        await load()
      } else {
        // Simulation complete, check if we should go to war room or results
        router.push(`/assessment/${assessmentId}/war-room`)
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

      // If transitioning to war room stage, redirect directly
      if (phaseScenario.toStage === 'STAGE_4_WARROOM') {
        router.push(`/assessment/${assessmentId}/war-room`)
        return
      }
      await load()
    }, 1500)
  }

  // ---- AI End-of-Phase Question Screen ----

  if (showingAiQuestion && aiQuestion) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-md h-14 flex items-center px-6 gap-4">
          <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-white text-xs font-bold">KK</div>
          <div className="flex-1">
            <span className="text-sm font-medium" style={{ color: accent }}>AI Scenario Challenge</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-mono">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className={stageTimer.isWarning ? 'text-red-500 animate-pulse' : ''}>{stageTimer.display}</span>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
          {aiQuestion.loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-lg font-medium">A leader is reviewing your responses...</p>
              <p className="text-sm text-muted-foreground">Preparing a scenario challenge based on your decisions</p>
            </div>
          ) : (
            <>
              <div className="text-center space-y-2">
                <Badge variant="outline" className="text-xs" style={{ borderColor: '#f59e0b60', color: '#f59e0b' }}>
                  <AlertTriangle className="h-3 w-3 mr-1" /> End-of-Phase Scenario
                </Badge>
                <h2 className="text-xl font-bold mt-3">Leader Challenge</h2>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/30">
                <div className="h-12 w-12 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-lg font-bold flex-shrink-0">
                  {aiQuestion.leaderName.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold">{aiQuestion.leaderName}</div>
                  <div className="text-xs text-muted-foreground">challenges you based on your phase decisions</div>
                </div>
              </div>

              <div className="p-4 rounded-xl border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-900/20">
                <p className="text-base font-medium leading-relaxed">{aiQuestion.text}</p>
              </div>

              <div className="space-y-3">
                <Textarea
                  placeholder="How would you handle this scenario? Explain your reasoning..."
                  value={aiQuestionAnswer}
                  onChange={(e) => setAiQuestionAnswer(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{aiQuestionAnswer.length} characters</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setShowingAiQuestion(false); doPhaseSubmit() }}>
                      Skip
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSubmitAiQuestion}
                      disabled={!aiQuestionAnswer.trim()}
                      style={{ backgroundColor: accent }}
                    >
                      <Send className="h-4 w-4 mr-2" /> Submit & Continue
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
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
          <div className="flex items-center gap-1.5 text-sm font-mono">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{stageTimer.display}</span>
          </div>
        </header>
        <div className="max-w-3xl mx-auto px-4 py-8">
          <PhaseTransitionScenario scenario={phaseScenario} onSubmit={handleScenarioSubmit} />
        </div>
      </div>
    )
  }

  // ---- IDEATION STAGE: Form-based UI ----

  if (isIdeationStage) {
    // Group questions by section
    const sections: Record<string, SimQuestion[]> = {}
    questions.forEach((q) => {
      const sec = q.section || 'General'
      if (!sections[sec]) sections[sec] = []
      sections[sec].push(q)
    })

    const allAnswered = questions.every(q => answers[q.q_id])

    return (
      <div className="min-h-screen bg-background flex flex-col">
        {submitting && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-lg font-medium">Evaluating your ideation...</p>
            <p className="text-sm text-muted-foreground">AI is reviewing your business concept</p>
          </div>
        )}

        {/* Top Bar */}
        <header className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur-md h-14 flex items-center px-4 gap-4"
          style={{ borderBottomColor: `${accent}40` }}
        >
          <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">KK</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground">
              <span style={{ color: accent }} className="font-medium">Stage -2: IDEATION</span>
              <span className="mx-2 text-muted-foreground/40">|</span>
              <span>{answeredCount}/{questions.length} answered</span>
            </div>
            <Progress value={Math.round((answeredCount / questions.length) * 100)} className="h-1 mt-1" />
          </div>
          <div className={cn(
            "flex items-center gap-1.5 text-sm font-mono flex-shrink-0 px-3 py-1 rounded-lg",
            stageTimer.isWarning ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-muted'
          )}>
            <Clock className="h-4 w-4" />
            <span>{stageTimer.display}</span>
          </div>
        </header>

        {/* 3-column body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[200px_1fr_220px] gap-6 max-w-7xl mx-auto w-full px-4 py-6">
          {/* LEFT: Revenue */}
          <div className="hidden lg:flex flex-col gap-4">
            <RevenueSidePanel revenue={revenue} previousRevenue={prevRevenue} currentStage={assessment.currentStage} />
          </div>

          {/* CENTER: Ideation Form */}
          <div className="flex flex-col gap-6 min-w-0">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">Define Your Business Idea</h1>
              <p className="text-sm text-muted-foreground">Complete all sections below. This is your foundation — be specific and thoughtful.</p>
            </div>

            {Object.entries(sections).map(([sectionName, sectionQuestions]) => (
              <div key={sectionName} className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b bg-muted/30 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}20`, color: accent }}>
                    {SECTION_ICONS[sectionName] || <FileText className="h-5 w-5" />}
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">{sectionName}</h2>
                    <p className="text-xs text-muted-foreground">{sectionQuestions.length} questions</p>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {sectionQuestions.map((q, idx) => {
                    const answer = answers[q.q_id]
                    const typeColor = getQuestionTypeColor(q.type)

                    return (
                      <div key={q.q_id} className="space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="text-xs font-bold text-muted-foreground mt-1 w-6 flex-shrink-0">
                            {idx + 1}.
                          </span>
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-[10px] gap-1" style={{ borderColor: `${typeColor}60`, color: typeColor }}>
                                {getQuestionTypeIcon(q.type)}
                                {getQuestionTypeLabel(q.type)}
                              </Badge>
                              {answer && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                            </div>
                            <Label className="text-sm font-medium leading-snug block">{q.text}</Label>
                            {q.context_text && (
                              <p className="text-xs text-muted-foreground">{q.context_text}</p>
                            )}

                            {/* Open text */}
                            {q.type === 'open_text' && (
                              <Textarea
                                placeholder="Type your response..."
                                value={(answer as any)?.text || ''}
                                onChange={(e) => handleTextChange(e.target.value, q.q_id)}
                                rows={3}
                                className="resize-none text-sm"
                              />
                            )}

                            {/* MCQ */}
                            {(q.type === 'multiple_choice' || q.type === 'scenario') && q.options && (
                              <div className="space-y-2">
                                {q.options.map((opt: SimOption) => {
                                  const isSelected = answer?.selectedOptionId === opt.id
                                  return (
                                    <button
                                      key={opt.id}
                                      onClick={() => handleSelectOption(opt, q.q_id)}
                                      className={cn(
                                        'w-full text-left px-3 py-2.5 rounded-lg border-2 transition-all text-sm',
                                        isSelected ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:border-primary/50 hover:bg-muted/30'
                                      )}
                                    >
                                      {opt.text}
                                    </button>
                                  )
                                })}
                                {answer?.selectedOptionId && (() => {
                                  const selectedOpt = q.options?.find(o => o.id === answer.selectedOptionId)
                                  if (selectedOpt?.feedback) {
                                    return (
                                      <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
                                        <span className="font-medium">Insight: </span>{selectedOpt.feedback}
                                      </div>
                                    )
                                  }
                                  return null
                                })()}
                              </div>
                            )}
                          </div>
                        </div>
                        {idx < sectionQuestions.length - 1 && <hr className="border-border/50" />}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Submit Button */}
            <div className="flex justify-center pb-6">
              <Button
                onClick={handleSubmitPhase}
                disabled={submitting}
                size="lg"
                className="px-8"
                style={{ backgroundColor: accent }}
              >
                {submitting ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Evaluating Ideation...</>
                ) : (
                  <><Send className="h-5 w-5 mr-2" />Submit Ideation & Enter Simulation</>
                )}
              </Button>
            </div>

            {submitError && (
              <div className="text-center">
                <p className="text-sm text-red-500">{submitError}</p>
              </div>
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

  // ---- NORMAL STAGE: Step-by-step question UI ----

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
            <span className="mx-2 text-muted-foreground/40">|</span>
            <span>Q{qIndex + 1} of {questions.length}</span>
          </div>
          <Progress value={pct} className="h-1 mt-1" />
        </div>
        <div className={cn(
          "flex items-center gap-1.5 text-sm font-mono flex-shrink-0 px-3 py-1 rounded-lg",
          stageTimer.isWarning ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-muted'
        )}>
          <Clock className="h-4 w-4" />
          <span>{stageTimer.display}</span>
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
                  {/* Question type badge with icon */}
                  <Badge variant="outline" className="text-xs gap-1" style={{ borderColor: `${getQuestionTypeColor(currentQ.type)}60`, color: getQuestionTypeColor(currentQ.type) }}>
                    {getQuestionTypeIcon(currentQ.type)}
                    {getQuestionTypeLabel(currentQ.type)}
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
                  <div className="mt-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{currentQ.pressure_text}</span>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 flex-1">
                {/* SCENARIO-based questions: MCQ with context styling */}
                {currentQ.type === 'scenario' && currentQ.options ? (
                  <div className="space-y-3">
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Choose your decision wisely — this scenario tests your real-world judgment
                    </div>
                    {currentQ.options.map((opt: SimOption) => {
                      const isSelected = currentAnswer?.selectedOptionId === opt.id
                      return (
                        <button
                          key={opt.id}
                          onClick={() => handleSelectOption(opt)}
                          className={cn(
                            'w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm',
                            isSelected ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 font-medium' : 'border-border hover:border-amber-400/50 hover:bg-muted/30'
                          )}
                        >
                          <span>{opt.text}</span>
                          {isSelected && opt.warning && (
                            <div className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> {opt.warning}
                            </div>
                          )}
                        </button>
                      )
                    })}
                    {mcqFeedback && currentAnswer?.selectedOptionId && (
                      <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
                        <span className="font-medium">Mentor insight: </span>{mcqFeedback}
                      </div>
                    )}
                  </div>
                ) : currentQ.type === 'multiple_choice' && currentQ.options ? (
                  /* Standard MCQ */
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
                ) : currentQ.type === 'budget_allocation' && currentQ.options ? (
                  /* Budget allocation UI */
                  <div className="space-y-4">
                    <div className="text-xs text-muted-foreground mb-2">Allocate your budget across categories. Must total 100%.</div>
                    {currentQ.options.map((opt: SimOption) => {
                      const val = budgetAllocations[currentQ.q_id]?.[opt.id] || 0
                      return (
                        <div key={opt.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{opt.text}</span>
                            <span className="font-mono font-medium text-primary">{val}%</span>
                          </div>
                          <Slider
                            value={[val]}
                            onValueChange={([v]) => handleBudgetAllocation(currentQ.q_id, opt.id, v)}
                            max={100}
                            step={5}
                            className="w-full"
                          />
                        </div>
                      )
                    })}
                    {(() => {
                      const total = Object.values(budgetAllocations[currentQ.q_id] || {}).reduce((s, v) => s + v, 0)
                      return (
                        <div className={cn(
                          'text-sm font-medium text-center p-2 rounded-lg',
                          total === 100 ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                          total > 100 ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                          'bg-muted text-muted-foreground'
                        )}>
                          Total: {total}% {total === 100 ? '✓' : total > 100 ? '(exceeds 100%)' : `(${100 - total}% remaining)`}
                        </div>
                      )
                    })()}
                  </div>
                ) : (
                  /* Open text */
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
