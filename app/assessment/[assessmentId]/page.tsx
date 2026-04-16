'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/src/lib/api'
import { RevenueSidePanel } from '@/src/components/RevenueSidePanel'
import { LeaderboardPanel } from '@/src/components/LeaderboardPanel'
import { PhaseTransitionScenario } from '@/src/components/PhaseTransitionScenario'
import { useLeaderboard } from '@/src/hooks/useLeaderboard'
import { FadeInUp, CinemaOverlay } from '@/src/components/AnimatedComponents'
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
  Users,
  MessageSquare,
  X,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CharacterPicker } from '@/src/components/CharacterPicker'
import type {
  SimQuestion,
  SimOption,
  PhaseResponse,
  PhaseScenarioOut,
  StageName,
  Mentor,
  Leader,
  Investor,
  MentorLifelineResult,
} from '@/src/types'

// ---- Helpers ----

function stageLabel(s: string) {
  return s.replace('STAGE_', '').replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatRevenue(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`
  return `$${amount.toLocaleString('en-US')}`
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

const STAGE_NARRATIVES: Record<string, { month: string, title: string, desc: string }> = {
  STAGE_NEG2_IDEATION: { month: 'Month 0', title: 'Ideation', desc: 'Every great company starts with an idea. Define your vision, target market, and initial model.' },
  STAGE_NEG1_VISION: { month: 'Month 1', title: 'Vision & Alignment', desc: 'Align your goals. Decide what kind of company you want to build before taking the leap.' },
  STAGE_0_COMMITMENT: { month: 'Month 2', title: 'The Commitment', desc: 'It is time to decide if you are all-in. Are you ready to commit your time and capital?' },
  STAGE_1_VALIDATION: { month: 'Month 3', title: 'Market Validation', desc: 'Get out of the building. Talk to customers and prove they actually want what you are building.' },
  STAGE_2A_GROWTH: { month: 'Month 6', title: 'Initial Growth', desc: 'You have a product. Now you need to find your first true believers and early adopters.' },
  STAGE_2B_EXPANSION: { month: 'Month 9', title: 'Expansion & Churn', desc: 'Growth brings problems. Deal with scaling issues, team dynamics, and keeping customers happy.' },
  STAGE_3_SCALE: { month: 'Month 12', title: 'Scaling Up', desc: 'You have hit early product-market fit. Now it is time to pour fuel on the fire and scale operations.' },
  STAGE_WARROOM_PREP: { month: 'Month 15', title: 'Pitch Prep', desc: 'You need outside capital to truly win the market. Perfect your pitch before facing the Sharks.' },
  STAGE_4_WARROOM: { month: 'Month 18', title: 'The War Room', desc: 'Face the investors. Defend your valuation, handle tough questions, and secure the bag.' },
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
  STAGE_WARROOM_PREP: 10,
  STAGE_4_WARROOM: 15,
}

function getQuestionTypeLabel(type: string): string {
  switch (type) {
    case 'multiple_choice': return 'Multiple Choice'
    case 'scenario': return 'Scenario Based'
    case 'budget_allocation': return 'Budget Allocation'
    case 'open_text': return 'Open Response'
    case 'ai_scenario': return 'AI Scenario'
    case 'info': return 'Information'
    default: return 'Question'
  }
}

function getQuestionTypeIcon(type: string) {
  switch (type) {
    case 'scenario': return <AlertTriangle className="h-3.5 w-3.5" />
    case 'multiple_choice': return <Target className="h-3.5 w-3.5" />
    case 'budget_allocation': return <DollarSign className="h-3.5 w-3.5" />
    case 'ai_scenario': return <Lightbulb className="h-3.5 w-3.5" />
    case 'info': return <FileText className="h-3.5 w-3.5" />
    default: return <FileText className="h-3.5 w-3.5" />
  }
}

function getQuestionTypeColor(type: string): string {
  switch (type) {
    case 'scenario': return '#f59e0b'
    case 'multiple_choice': return '#3b82f6'
    case 'budget_allocation': return '#10b981'
    case 'ai_scenario': return '#ef4444'
    case 'info': return '#06b6d4'
    default: return '#8b5cf6'
  }
}

// Scenario step styling
const SCENARIO_STEP_STYLES: Record<string, { icon: string; label: string; color: string; bgColor: string }> = {
  environment: { icon: '🌍', label: 'ENVIRONMENT', color: '#3b82f6', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  problem: { icon: '⚠️', label: 'PROBLEM', color: '#f59e0b', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
  decision: { icon: '🎯', label: 'YOUR DECISION', color: '#8b5cf6', bgColor: 'bg-violet-50 dark:bg-violet-900/20' },
  consequence: { icon: '📊', label: 'CONSEQUENCE', color: '#10b981', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20' },
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

// ============================================
// MAIN COMPONENT
// ============================================

export default function SimulationPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params?.assessmentId as string

  const [state, setState] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Phase answers - collected locally, no API until phase complete
  const [answers, setAnswers] = useState<PhaseAnswers>({})
  const [qIndex, setQIndex] = useState(0)
  const [mcqFeedback, setMcqFeedback] = useState<string | null>(null)

  // Dynamic scenario state
  const [dynamicScenario, setDynamicScenario] = useState<any | null>(null)
  const [loadingScenario, setLoadingScenario] = useState(false)
  const loadingScenarioRef = useRef(false)
  const [dynamicScenarioError, setDynamicScenarioError] = useState('')
  const [dynamicScenarioBlocked, setDynamicScenarioBlocked] = useState<Record<string, boolean>>({})
  const [stageDynamicScenarios, setStageDynamicScenarios] = useState<Record<string, any>>({})
  const [loadingStageScenarios, setLoadingStageScenarios] = useState(false)

  // Follow-up branching
  const [loadingFollowup, setLoadingFollowup] = useState<Record<string, boolean>>({})
  const [followupScenarios, setFollowupScenarios] = useState<Record<string, { question: string }>>({})

  const [buyoutCompany, setBuyoutCompany] = useState('')
  const [buyoutAmount, setBuyoutAmount] = useState('')

  // Phase submitting
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Phase transition
  const [phaseScenario, setPhaseScenario] = useState<PhaseScenarioOut | null>(null)
  const [showingScenario, setShowingScenario] = useState(false)

  // Revenue
  const [revenue, setRevenue] = useState(0)
  const [prevRevenue, setPrevRevenue] = useState<number | undefined>(undefined)

  // User + batch
  const [userId, setUserId] = useState<string | undefined>()
  const [batchCode, setBatchCode] = useState<string | undefined>()

  // Budget allocation state
  const [budgetAllocations, setBudgetAllocations] = useState<Record<string, Record<string, number>>>({})

  // Mentor lifeline state
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [leaders, setLeaders] = useState<Leader[]>([])
  const [investors, setInvestors] = useState<Investor[]>([])
  const [loadingConfig, setLoadingConfig] = useState(false)

  const [showMentorPanel, setShowMentorPanel] = useState(false)
  const [selectedMentorId, setSelectedMentorId] = useState('')
  const [mentorQuestion, setMentorQuestion] = useState('')
  const [mentorLoading, setMentorLoading] = useState(false)
  const [mentorResult, setMentorResult] = useState<MentorLifelineResult | null>(null)

  // Flow views
  const [showPanelSelection, setShowPanelSelection] = useState(false)
  const [showRestartCheckpoint, setShowRestartCheckpoint] = useState(false)
  const [settingCharacters, setSettingCharacters] = useState(false)
  const [showCapitalAnimation, setShowCapitalAnimation] = useState(false)

  // Leaderboard
  const { entries, connected, updatedAt } = useLeaderboard(batchCode)

  // Derived state (needs to be above useEffects to prevent TDZ errors)
  const simulation = state?.simulation
  const currentStageQuestions = state?.currentStageQuestions
  const questions: SimQuestion[] = currentStageQuestions || []
  const currentQ = questions[qIndex] as SimQuestion | undefined

  // Timer logic
  const shouldRunTimer = state?.simulation?.currentStage ? STAGE_ORDER.indexOf(state?.simulation?.currentStage as StageName) >= STAGE_ORDER.indexOf('STAGE_1_VALIDATION') : false

  // Stage timer with auto-advance
  const stageDuration = state?.simulation?.currentStage ? (STAGE_DURATIONS[state?.simulation?.currentStage] || 10) : 10
  const stageTimer = useStageTimer(
    state?.simulation?.currentStage,
    stageDuration,
    !submitting && !loading && !showingScenario && !!state && shouldRunTimer
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
    }, [state?.simulation?.currentStage])
  const load = useCallback(async () => {
    if (!assessmentId) return
    try {
      const data = await api.assessments.get(assessmentId)
      setState(data)
      if (((data as any)?.simulation as any)?.revenueProjection) {
        setRevenue(((data as any)?.simulation as any).revenueProjection)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load simulation')
    } finally {
      setLoading(false)
    }
  }, [assessmentId])

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
    const storedBatch = JSON.parse(localStorage.getItem('batch') || '{}')
    setUserId(storedUser?.id)
    setBatchCode(storedBatch?.code)
    
    setLoadingConfig(true)
    Promise.all([
      api.config.getMentors(),
      api.config.getLeaders(),
      api.config.getInvestors(),
    ])
      .then(([m, l, i]) => {
        setMentors(m)
        setLeaders(l)
        setInvestors(i)
      })
      .catch(() => {})
      .finally(() => setLoadingConfig(false))

    load()
  }, [load])

  // Check if we need to show panel selection
  useEffect(() => {
    if (state?.simulation?.currentStage === 'STAGE_NEG1_VISION') {
      const raw = (state?.simulation as any)?.selectedMentors
      let selectedMentors: string[] = []
      
      if (Array.isArray(raw)) {
        selectedMentors = raw
      } else if (typeof raw === 'string') {
        const trimmed = raw.trim()
        if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
          try { selectedMentors = JSON.parse(trimmed) } catch { selectedMentors = [] }
        } else if (trimmed) {
          // If it's a raw string like "id1,id2" or just "id1"
          selectedMentors = trimmed.split(',').map(s => s.trim())
        }
      }
      
      if (selectedMentors.length === 0) {
        setShowPanelSelection(true)
      }
    }
}, [state?.simulation?.currentStage, state?.simulation?.selectedMentors])

  // Reset on stage change
  useEffect(() => {
    setQIndex(0)
    setAnswers({})
    setMcqFeedback(null)
    setSubmitError('')
    setDynamicScenario(null)
    setDynamicScenarioError('')
    setDynamicScenarioBlocked({})
    }, [state?.simulation?.currentStage])
  useEffect(() => {
    if (simulation?.currentStage && assessmentId) {
      setLoadingStageScenarios(true)
      api.assessments.getStageDynamicScenarios(assessmentId, simulation.currentStage)
        .then(scenarios => {
          const scenarioMap: Record<string, any> = {}
          scenarios.forEach(scenario => {
            scenarioMap[scenario.questionId] = scenario
          })
          setStageDynamicScenarios(scenarioMap)
        })
        .catch(err => {
          console.error('Failed to load stage dynamic scenarios:', err)
        })
        .finally(() => setLoadingStageScenarios(false))
    }
  }, [simulation?.currentStage, assessmentId])

  // Reset dynamic scenario state when question changes
  useEffect(() => {
    if ((currentQ as any)?.type === 'dynamic_scenario') {
      setDynamicScenario(null)
      setMcqFeedback(null)
      setDynamicScenarioError('')
    }
  }, [currentQ?.q_id])

  // Fetch dynamic scenario if current question needs it
  useEffect(() => {
    let ignore = false;
    if (
      currentQ &&
      (currentQ as any)?.type === 'dynamic_scenario' &&
      simulation &&
      !loadingScenarioRef.current &&
      // Check both currentQ.q_id AND dynamicScenario.questionId
      ((dynamicScenario?.questionId || dynamicScenario?.question_id) !== currentQ.q_id || !dynamicScenario) &&
      !dynamicScenarioBlocked[currentQ.q_id]
    ) {
      const fetchScenario = async () => {
        if (!currentQ) return;
        // Check cache first
        const cached = stageDynamicScenarios[currentQ.q_id]
        if (cached && cached.questionId === currentQ.q_id) {
          if (!ignore) {
            setDynamicScenario(cached)
            setDynamicScenarioError('')
            // If already answered, set feedback
            if (cached.selectedOptionId) {
              const options = typeof cached.options === 'string' ? JSON.parse(cached.options) : cached.options;
              const opt = options.find((o: any) => o.id === cached.selectedOptionId)
              if (opt) setMcqFeedback(opt.feedback)
              // Pre-fill answer
              setAnswers(prev => ({
                ...prev,
                [currentQ.q_id]: { questionId: currentQ.q_id, type: 'dynamic_scenario', selectedOptionId: cached.selectedOptionId } as any
              }))
            }
          }
          return
        }

        loadingScenarioRef.current = true;
        setLoadingScenario(true)
        try {
          const ds = await api.assessments.getDynamicScenario(assessmentId, simulation.currentStage, currentQ.q_id)
          if (!ignore && ds && (ds.questionId === currentQ.q_id || ds.question_id === currentQ.q_id)) {
            // Normalize for the rest of the component
            ds.questionId = ds.questionId || ds.question_id;
            setDynamicScenario(ds)
            setDynamicScenarioError('')
            setDynamicScenarioBlocked(prev => ({ ...prev, [currentQ.q_id]: false }))
            // If already answered, set feedback
            if (ds.selectedOptionId) {
              const options = typeof ds.options === 'string' ? JSON.parse(ds.options) : ds.options;
              const opt = options.find((o: any) => o.id === ds.selectedOptionId)
              if (opt) setMcqFeedback(opt.feedback)
              // Pre-fill answer
              setAnswers(prev => ({
                ...prev,
                [currentQ.q_id]: { questionId: currentQ.q_id, type: 'dynamic_scenario', selectedOptionId: ds.selectedOptionId } as any
              }))
            }
          } else if (!ignore && (!ds || (ds.questionId !== currentQ.q_id && ds.question_id !== currentQ.q_id))) {
            // Wrong scenario returned or null
            console.error('Wrong scenario returned:', ds, 'expected:', currentQ.q_id);
            setDynamicScenarioError('Received incorrect scenario data.')
          }
        } catch (err: any) {
          if (!ignore) {
            const message = err?.message || 'Failed to generate scenario right now.'
            setDynamicScenarioError(message)
            setDynamicScenarioBlocked(prev => ({ ...prev, [currentQ.q_id]: true }))
            console.error('Failed to fetch dynamic scenario:', err)
          }
        } finally {
          loadingScenarioRef.current = false;
          setLoadingScenario(false)
        }
      }
      fetchScenario()
    }
    return () => { ignore = true; }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQ?.q_id, assessmentId, simulation?.currentStage, stageDynamicScenarios, dynamicScenarioBlocked, dynamicScenario])

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

  if (!state || !simulation) return null

  const accent = STAGE_THEMES[simulation.currentStage] || '#6366f1'
  const isLastQuestion = qIndex === questions.length - 1
  const isFirstQuestion = qIndex === 0
  const currentAnswer = currentQ ? answers[currentQ.q_id] : undefined
  const answeredCount = Object.keys(answers).length
  const isIdeationStage = simulation.currentStage === 'STAGE_NEG2_IDEATION'
  const isWarRoomPrepOrBeyond = simulation.currentStage === 'STAGE_WARROOM_PREP' || simulation.currentStage === 'STAGE_4_WARROOM'

  // Mentor lifeline derived data
  const lifelinesLeft = simulation.mentorLifelinesRemaining ?? 0
  const selectedMentorIds: string[] = (() => {
    const raw = (simulation as any).selectedMentors
    if (Array.isArray(raw)) return raw
    if (typeof raw === 'string') {
      const trimmed = raw.trim()
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try { return JSON.parse(trimmed) } catch { return [] }
      } else if (trimmed) {
        return trimmed.split(',').map(s => s.trim())
      }
    }
    return []
  })()
  const availableMentors = mentors.filter(m => selectedMentorIds.includes(m.id))

  // Mentor lifeline panel UI (overlay)

  const MentorLifelineCard = () => (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Mentor Lifelines</span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn('h-2.5 w-2.5 rounded-full', i < lifelinesLeft ? 'bg-primary' : 'bg-muted')}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground">{lifelinesLeft} left</span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="w-full text-xs"
        disabled={lifelinesLeft <= 0}
        onClick={() => { setMentorResult(null); setShowMentorPanel(true) }}
      >
        {lifelinesLeft > 0 ? <><MessageSquare className="h-3.5 w-3.5 mr-1.5" />Ask a Mentor</> : 'No lifelines left'}
      </Button>
    </div>
  )

  // ---- Handlers ----

  async function handleSelectOption(opt: SimOption, questionId?: string) {
    const qId = questionId || currentQ?.q_id
    if (!qId) return
    
    // Check if we require branching logic here
    const qType = currentQ?.type || (currentQ as any)?.type || ''
    const isScenario = qType === 'scenario' || qType === 'dynamic_scenario'

    // Update state to record selected option WITHOUT overriding text if it exists
    setAnswers((prev) => ({
      ...prev,
      [qId]: { 
        ...prev[qId], 
        questionId: qId, 
        type: (isScenario ? qType : 'multiple_choice') as any,
        selectedOptionId: opt.id 
      },
    }))
    if (!questionId) setMcqFeedback(opt.feedback || null)

    // Capital Generation immediate UI update
    if (qId === 'Q_0_1' || qId === 'Q_0_CAPITAL') {
      setState((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          simulation: {
            ...prev.simulation,
            capital: 50000,
          }
        };
      });
      setPrevRevenue(revenue);
      setRevenue(50000);
      setShowCapitalAnimation(true);
      setTimeout(() => setShowCapitalAnimation(false), 3000);
    }

    // Secondary Branching logic for scenarios
    if (isScenario && !followupScenarios[qId]) {
      setLoadingFollowup(prev => ({ ...prev, [qId]: true }))
      try {
        const payloadTitle = simulation?.userIdea || 'The entrepreneur is building a business.'
        const payloadQuestion = (qType === 'dynamic_scenario' && dynamicScenario) 
          ? dynamicScenario.questionText 
          : (currentQ?.text || 'A strategic challenge has emerged.')

        const result = await api.assessments.generateFollowup({
          introduction: payloadTitle,
          originalQuestion: payloadQuestion,
          selectedOptionText: opt.text,
          selectedOptionFeedback: opt.feedback || opt.signal || '',
          roundNumber: Array.isArray(questions) ? questions.findIndex((q: any) => q.q_id === qId) + 1 : 1
        })

        if (result && result.question) {
          setFollowupScenarios(prev => ({ ...prev, [qId]: { question: result.question } }))
        }
      } catch (err: any) {
        console.error('Failed to generate follow-up:', err)
      } finally {
        setLoadingFollowup(prev => ({ ...prev, [qId]: false }))
      }
    }
  }

  function handleTextChange(text: string, questionId?: string) {
    const qId = questionId || currentQ?.q_id
    if (!qId) return
    setAnswers((prev) => {
      const existing = prev[qId] || {}
      return {
        ...prev,
        [qId]: { ...existing, questionId: qId, type: existing.type || 'open_text', text },
      }
    })
  }

  function handleBudgetAllocation(questionId: string, optionId: string, value: number) {
    const opt = currentQ?.options?.find((o: SimOption) => o.id === optionId)
    const label = opt?.text || optionId

    setBudgetAllocations(prevBudgets => {
      const newAllocsForQuestion = {
        ...(prevBudgets[questionId] || {}),
        [optionId]: value,
      };

      const updatedBudgets = {
        ...prevBudgets,
        [questionId]: newAllocsForQuestion,
      };

      setAnswers(prevAnswers => ({
        ...prevAnswers,
        [questionId]: { questionId, type: 'budget_allocation', allocations: newAllocsForQuestion },
      }));

      setState((prevState: any) => {
        if (!prevState) return prevState;

        const sidePanelAllocs: Record<string, number> = {};

        questions.filter(q => q.type === 'budget_allocation' && q.options).forEach(q => {
            const questionAllocs = updatedBudgets[q.q_id];
            if (questionAllocs) {
                q.options!.forEach(o => {
                    if (questionAllocs[o.id] !== undefined && questionAllocs[o.id] > 0) {
                        sidePanelAllocs[o.text] = questionAllocs[o.id];
                    }
                });
            }
        });

        return {
          ...prevState,
          simulation: {
            ...prevState.simulation,
            budgetAllocations: sidePanelAllocs,
          },
        };
      });

      return updatedBudgets;
    });
  }

  function goBack() {
    if (qIndex > 0) { setQIndex((i) => i - 1); setMcqFeedback(null) }
  }

  function goNext() {
    if (qIndex < questions.length - 1) { setQIndex((i) => i + 1); setMcqFeedback(null) }
  }

  async function handleSubmitPhase() {
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
      const aiKey = `AI_${simulation.currentStage}`
      if (answers[aiKey]) {
        responses.push(answers[aiKey])
      }

      const result = await api.assessments.submitPhase(assessmentId, {
        stageId: simulation.currentStage,
        responses,
      })
      if (result.revenueProjection) {
        setPrevRevenue(revenue)
        setRevenue(result.revenueProjection)
      }

      // Clear the stage timer from localStorage
      localStorage.removeItem(`timer_${simulation.currentStage}`)

      if ((result as any).simCompleted) {
        router.push(`/assessment/${assessmentId}/final-report`)
        return
      }

      if ((result as any).phaseScenario) {
        setPhaseScenario((result as any).phaseScenario)
        setShowingScenario(true)
      } else if (result.nextStage) {
        // If next stage is WAR ROOM, navigate directly to war room page
        if ((result.nextStage as any).id === 'STAGE_4_WARROOM' || result.nextStage === 'STAGE_4_WARROOM') {
          router.push(`/assessment/${assessmentId}/war-room`)
          return
        }
        await load()
      } else {
        // Fallback
        router.push(`/assessment/${assessmentId}/war-room`)
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit phase')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCharacterConfirm(selected: {
    mentors: string[]
    leaders: string[]
    investors: string[]
  }) {
    setSettingCharacters(true)
    try {
      await api.assessments.setCharacters(assessmentId, {
        selectedMentors: selected.mentors,
        selectedLeaders: selected.leaders,
        selectedInvestors: selected.investors,
      })
      setShowPanelSelection(false)
      await load()
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to set characters')
    } finally {
      setSettingCharacters(false)
    }
  }

  async function handleRestart() {
    setSubmitting(true)
    try {
      await api.assessments.restartAssessment(assessmentId)
      setShowingScenario(false)
      setPhaseScenario(null)
      await load()
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to restart')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleContinue() {
    setShowingScenario(false)
    setPhaseScenario(null)
    await load()
  }

  async function handleUseMentor() {
    if (!selectedMentorId) return
    setMentorLoading(true)
    try {
      const result = await api.assessments.useMentorLifeline(assessmentId, selectedMentorId, mentorQuestion)
      setMentorResult(result)
      // Update lifelines remaining in local state
      if (state) {
        setState((prev: any) => prev ? {
          ...prev,
          simulation: { ...prev.simulation, mentorLifelinesRemaining: result.lifelinesLeft },
          progress: { ...prev.progress, mentorLifelinesRemaining: result.lifelinesLeft },
        } : prev)
      }
    } catch (err: any) {
      setMentorResult({ mentorId: selectedMentorId, mentorName: '', guidance: `Error: ${err.message}`, lifelinesLeft: 0 })
    } finally {
      setMentorLoading(false)
    }
  }

  function closeMentorPanel() {
    setShowMentorPanel(false)
    setMentorResult(null)
    setMentorQuestion('')
    setSelectedMentorId('')
  }

  async function handleBuyoutSubmit() {
    if (!buyoutCompany.trim() || !buyoutAmount.trim()) {
      setSubmitError('Please provide both the acquiring company name and the buyout amount.')
      return
    }
    const numericAmount = parseFloat(buyoutAmount)
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setSubmitError('Please provide a valid buyout amount.')
      return
    }
    if (submitting) return
    setSubmitting(true)
    try {
      await api.assessments.chooseBuyout(assessmentId as string, buyoutCompany, numericAmount)
      router.push(`/assessment/${assessmentId}/final-report`)
    } catch (err: any) {
      console.error('Buyout error:', err)
      setSubmitError(err.message || 'Failed to process buyout')
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
    
    // If it's a checkpoint, we don't proceed until the user chooses restart or continue
    if (phaseScenario.isCheckpoint) {
      setShowRestartCheckpoint(true)
      return
    }

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

  // ---- Mentor lifeline overlay (rendered on top of any screen) ----
  const mentorOverlay = showMentorPanel ? (
    <div className="fixed inset-0 z-[60] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Consult a Mentor</h3>
            <p className="text-xs text-muted-foreground">{lifelinesLeft} lifeline{lifelinesLeft !== 1 ? 's' : ''} remaining</p>
          </div>
          <Button variant="ghost" size="icon" onClick={closeMentorPanel}><X className="h-4 w-4" /></Button>
        </div>

        {mentorResult ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
              <div className="h-10 w-10 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-lg font-bold flex-shrink-0">
                {mentorResult.mentorName.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-sm">{mentorResult.mentorName}</div>
                <div className="text-xs text-muted-foreground">Mentor Guidance</div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm leading-relaxed">
              {mentorResult.guidance}
            </div>
            <div className="text-xs text-muted-foreground text-center">
              {mentorResult.lifelinesLeft} lifeline{mentorResult.lifelinesLeft !== 1 ? 's' : ''} remaining
            </div>
            <Button className="w-full" onClick={closeMentorPanel}>Close</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Choose your mentor</Label>
              {availableMentors.length > 0 ? (
                <div className="space-y-2">
                  {availableMentors.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMentorId(m.id)}
                      className={cn(
                        'w-full text-left px-3 py-2.5 rounded-lg border-2 transition-all text-sm',
                        selectedMentorId === m.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                      )}
                    >
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-muted-foreground">{m.specialization}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No mentors selected. Please complete character selection first.</p>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium mb-2 block">Your question (optional)</Label>
              <Textarea
                placeholder="What specific advice do you need? (Leave blank for general guidance)"
                value={mentorQuestion}
                onChange={(e) => setMentorQuestion(e.target.value)}
                rows={3}
                className="resize-none text-sm"
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={closeMentorPanel}>Cancel</Button>
              <Button
                className="flex-1"
                onClick={handleUseMentor}
                disabled={!selectedMentorId || mentorLoading || availableMentors.length === 0}
              >
                {mentorLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Getting advice...</> : <><MessageSquare className="h-4 w-4 mr-2" />Get Advice</>}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null

  // ---- Panel Selection View ----
  if (showPanelSelection) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="w-full max-w-4xl space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Assemble Your Board</h1>
            <p className="text-muted-foreground">Select the mentors, leaders, and investors who will guide your journey.</p>
          </div>
          <CharacterPicker
            mentors={mentors}
            leaders={leaders}
            investors={investors}
            onConfirm={handleCharacterConfirm}
            loading={settingCharacters}
          />
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
            <p className="text-lg font-medium">Processing...</p>
          </div>
        )}
        <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur-md h-14 flex items-center px-6 gap-4">
          <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-white text-xs font-bold">KK</div>
          <div className="flex-1 text-center">
            <Badge variant="outline" className="animate-pulse border-primary/40 text-primary">TRANSITION PHASE</Badge>
          </div>
          {shouldRunTimer && (
            <div className="flex items-center gap-1.5 text-sm font-mono">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>{stageTimer.display}</span>
            </div>
          )}
        </header>

        <div className="max-w-3xl mx-auto px-4 py-8">
          {showRestartCheckpoint ? (
            <FadeInUp className="space-y-8 bg-card border p-8 rounded-3xl shadow-xl">
              <div className="text-center space-y-4">
                <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <Lightbulb className="h-8 w-8" />
                </div>
                <h2 className="text-2xl font-bold">The Crossroads</h2>
                <p className="text-muted-foreground">
                  You have laid the groundwork. Now, before you commit your capital and enter the 60-minute execution phase, you must decide:
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="border rounded-2xl p-6 flex flex-col items-center text-center space-y-4 bg-muted/20">
                  <div className="h-10 w-10 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold">I need to rethink</h3>
                    <p className="text-xs text-muted-foreground">I found flaws in my idea. Restart from the beginning with a new concept.</p>
                  </div>
                  <div className="flex-1" />
                  <Button variant="outline" className="w-full" onClick={handleRestart} disabled={submitting}>
                    Restart Simulation
                  </Button>
                </div>

                <div className="border rounded-2xl p-6 flex flex-col items-center text-center space-y-4 bg-primary/5 border-primary/20">
                  <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold">I am ready</h3>
                    <p className="text-xs text-muted-foreground">My idea is solid. I am ready to commit capital and build the business.</p>
                  </div>
                  <div className="flex-1" />
                  <Button className="w-full" onClick={handleContinue} disabled={submitting}>
                    Continue to Execution
                  </Button>
                </div>
              </div>
            </FadeInUp>
          ) : (
            <PhaseTransitionScenario 
              scenario={phaseScenario} 
              onSubmit={handleScenarioSubmit} 
              revenue={revenue}
              previousRevenue={prevRevenue}
              leaderboardEntries={entries}
              currentUserId={userId}
            />
          )}
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
      <>
        {mentorOverlay}
        <div className="min-h-screen bg-background flex flex-col">
        <CinemaOverlay
          show={submitting}
          icon={<Loader2 className="h-10 w-10 animate-spin text-primary" />}
          title="Evaluating your ideation..."
          subtitle="AI is reviewing your business concept"
        />

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
          {shouldRunTimer && (
            <div className={cn(
              "flex items-center gap-1.5 text-sm font-mono flex-shrink-0 px-3 py-1 rounded-lg",
              stageTimer.isWarning ? 'bg-red-500/10 text-red-500 animate-pulse' : 'bg-muted'
            )}>
              <Clock className="h-4 w-4" />
              <span>{stageTimer.display}</span>
            </div>
          )}
        </header>

        {/* 3-column body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[200px_1fr_220px] gap-6 max-w-7xl mx-auto w-full px-4 py-6">
          {/* LEFT: Revenue */}
          <div className="hidden lg:flex flex-col gap-4">
            <RevenueSidePanel 
              revenue={revenue} 
              previousRevenue={prevRevenue} 
              currentStage={simulation.currentStage} 
              capital={simulation.capital} 
              budgetAllocations={simulation.budgetAllocations}
            />
          </div>

          {/* CENTER: Ideation Form */}
          <div className="flex flex-col gap-6 min-w-0">
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold">Define Your Business Idea</h1>
              <p className="text-sm text-muted-foreground">Complete all sections below. This is your foundation — be specific and thoughtful.</p>
            </div>

            {Object.entries(sections).map(([sectionName, sectionQuestions], secIdx) => (
              <FadeInUp key={sectionName} delay={0.1 + secIdx * 0.1}>
              <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
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
              </FadeInUp>
            ))}

            {/* Submit Button */}
            <div className="flex justify-center pb-6">
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Button
                onClick={handleSubmitPhase}
                disabled={submitting}
                size="lg"
                className="px-8 glow-button"
                style={{ backgroundColor: accent }}
              >
                {submitting ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Evaluating Ideation...</>
                ) : (
                  <><Send className="h-5 w-5 mr-2" />Submit Ideation & Enter Simulation</>
                )}
              </Button>
              </motion.div>
            </div>

            {submitError && (
              <div className="text-center">
                <p className="text-sm text-red-500">{submitError}</p>
              </div>
            )}
          </div>

          {/* RIGHT: Mentor Lifeline + Leaderboard */}
          <div className="hidden lg:flex flex-col gap-4">
            <MentorLifelineCard />
            {batchCode ? (
              <LeaderboardPanel
                entries={entries}
                currentUserId={userId}
                connected={connected}
                updatedAt={updatedAt}
                className="flex-1 max-h-[500px]"
              />
            ) : (
              <div className="rounded-xl border bg-card p-4 text-center text-sm text-muted-foreground">
                Join a batch to see live leaderboard
              </div>
            )}
          </div>
        </div>
      </div>
    </>
    )
  }

  // ---- NORMAL STAGE: Step-by-step question UI ----

  const pct = questions.length > 0 ? Math.round(((qIndex + 1) / questions.length) * 100) : 0

  return (
    <>
      {mentorOverlay}
      <AnimatePresence>
        {showCapitalAnimation && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.5, y: -50 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="bg-green-500 text-white font-black text-4xl sm:text-6xl px-12 py-8 rounded-full shadow-[0_0_100px_rgba(34,197,94,0.8)] border-4 border-white/20 transform -rotate-6 tracking-tight">
              +$50,000 RAISED! 🎉
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Mentor Button */}
      <div className="fixed bottom-6 right-6 z-40 group">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowMentorPanel(true)}
          className="flex items-center gap-3 bg-card border-2 shadow-xl rounded-full p-3 pr-5 text-sm font-semibold transition-all hover:bg-muted"
          style={{ borderColor: accent, color: accent }}
        >
          <div className="h-10 w-10 rounded-full flex items-center justify-center bg-background border relative">
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
            <Users className="h-5 w-5" />
          </div>
          <span>Need Help?</span>
        </motion.button>
      </div>

      <div className="min-h-screen bg-background flex flex-col">
      <CinemaOverlay
        show={submitting}
        icon={<Loader2 className="h-10 w-10 animate-spin text-primary" />}
        title="Evaluating phase responses..."
        subtitle="AI is reviewing your answers"
      />

      {/* Top Bar */}
      <header
        className="sticky top-0 z-30 border-b bg-card/90 backdrop-blur-md h-14 flex items-center px-4 gap-4"
        style={{ borderBottomColor: `${accent}40` }}
      >
        <div className="h-6 w-6 rounded bg-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">KK</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground">
            <span style={{ color: accent }} className="font-medium">{stageLabel(simulation.currentStage)}</span>
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
          <RevenueSidePanel 
            revenue={revenue} 
            previousRevenue={prevRevenue} 
            currentStage={simulation.currentStage} 
            capital={simulation.capital} 
            budgetAllocations={simulation.budgetAllocations}
          />
          <div className="text-xs text-muted-foreground text-center p-2 border rounded-lg bg-muted/20">
            <div className="font-medium mb-1">Phase Progress</div>
            <div>{answeredCount}/{questions.length} answered</div>
          </div>
        </div>

        <div className="flex flex-col gap-4 min-w-0 relative">
          
          {/* 1. UI Narration - Month by Month handholding */}
          {STAGE_NARRATIVES[simulation?.currentStage] && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl border bg-card/60 shadow-sm backdrop-blur flex flex-col md:flex-row items-center gap-4 text-center md:text-left"
              style={{ borderColor: `${STAGE_THEMES[simulation.currentStage] || '#8b5cf6'}50` }}
            >
              <div 
                className="h-12 w-12 rounded-full flex items-center justify-center text-xl shadow-lg font-black shrink-0"
                style={{ backgroundColor: `${STAGE_THEMES[simulation.currentStage] || '#8b5cf6'}20`, color: STAGE_THEMES[simulation.currentStage] || '#8b5cf6' }}
              >
                📅
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-1">
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{STAGE_NARRATIVES[simulation.currentStage].month}</span>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                  <span className="text-sm font-bold" style={{ color: STAGE_THEMES[simulation.currentStage] || '#8b5cf6' }}>{STAGE_NARRATIVES[simulation.currentStage].title}</span>
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed max-w-xl">
                  {STAGE_NARRATIVES[simulation.currentStage].desc}
                </p>
              </div>
            </motion.div>
          )}

          {/* 3. Red visual effects on the screen when there is a problem question */}
          {((currentQ as any)?.type === 'scenario' || currentQ?.scenario_step === 'problem' || currentQ?.pressure_text) && (
            <div className="pointer-events-none absolute -inset-2 z-0 rounded-3xl border border-red-500/40 bg-red-500/5 animate-pulse" />
          )}

          <AnimatePresence mode="wait">
          {currentQ ? (
            <motion.div
              key={currentQ.q_id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
              className={cn(
                "flex flex-col flex-1 bg-card rounded-2xl border shadow-sm overflow-hidden relative z-10",
                ((currentQ as any)?.type === 'scenario' || currentQ?.scenario_step === 'problem') && "border-red-500/50 shadow-sm shadow-red-500/20"
              )}>
              <div className="px-6 pt-6 pb-4 border-b">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {/* Question type badge with icon */}
                  <Badge variant="outline" className="text-xs gap-1" style={{ borderColor: `${getQuestionTypeColor((currentQ as any).type)}60`, color: getQuestionTypeColor((currentQ as any).type) }}>
                    {getQuestionTypeIcon((currentQ as any).type)}
                    {getQuestionTypeLabel((currentQ as any).type)}
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
                {(currentQ as any).type === 'dynamic_scenario' ? (
                  /* AI-generated Dynamic Scenario */
                  <div className="space-y-4">
                    {loadingScenario ? (
                      <div className="flex flex-col items-center justify-center py-12 gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground italic">AI is generating a custom scenario based on your journey...</p>
                      </div>
                    ) : dynamicScenario ? (
                      <FadeInUp className="space-y-4">
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-sm leading-relaxed whitespace-pre-line font-medium italic">
                          "{dynamicScenario.questionText}"
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {(typeof dynamicScenario.options === 'string' ? JSON.parse(dynamicScenario.options || '[]') : (dynamicScenario.options || [])).map((opt: any) => {
                            const isSelected = currentAnswer?.selectedOptionId === opt.id
                            return (
                              <button
                                key={opt.id}
                                onClick={() => {
                                  handleSelectOption(opt)
                                  setMcqFeedback(opt.feedback)
                                }}
                                className={cn(
                                  'w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm',
                                  isSelected ? 'border-primary bg-primary/5 font-bold' : 'border-border hover:border-primary/40 hover:bg-muted/30'
                                )}
                              >
                                {opt.text}
                              </button>
                            )
                          })}
                        </div>
                        
                        {/* FOLLOWUP BRANCHING SECTION */}
                        {(loadingFollowup[currentQ.q_id] || followupScenarios[currentQ.q_id]) && currentAnswer?.selectedOptionId && (
                          <FadeInUp className="mt-6 pl-4 border-l-2 border-primary/40 space-y-4">
                            <div className="flex items-center gap-2">
                               <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                               <span className="text-xs font-bold text-primary uppercase tracking-wider">Consequence</span>
                            </div>
                            
                            {loadingFollowup[currentQ.q_id] ? (
                              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl">
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                <span className="text-sm italic text-muted-foreground">AI is assessing the impact of your decision...</span>
                              </div>
                            ) : followupScenarios[currentQ.q_id] && (
                              <div className="space-y-3">
                                <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-sm font-medium leading-relaxed whitespace-pre-line text-foreground/90">
                                  {followupScenarios[currentQ.q_id].question}
                                </div>
                                
                                <div className="pt-2">
                                  <div className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-1">
                                    <MessageSquare className="h-3 w-3" /> How do you respond?
                                  </div>
                                  <Textarea
                                    placeholder="Type your response here..."
                                    value={(currentAnswer as any)?.text || ''}
                                    onChange={(e) => handleTextChange(e.target.value)}
                                    rows={4}
                                    className="resize-none border-primary/30 focus:border-primary transition-colors text-sm"
                                  />
                                </div>
                              </div>
                            )}
                          </FadeInUp>
                        )}

                      </FadeInUp>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground space-y-3">
                        <div>{dynamicScenarioError || 'Failed to generate scenario. Please try again.'}</div>
                        {currentQ?.q_id && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setDynamicScenarioError('')
                              setDynamicScenarioBlocked(prev => ({ ...prev, [currentQ.q_id]: false }))
                            }}
                          >
                            Retry scenario generation
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ) : currentQ.type === 'scenario' && currentQ.options ? (
                  <div className="space-y-3">
                    <div className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-2 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" /> Choose your decision wisely — this scenario tests your real-world judgment
                    </div>
                    {currentQ.options.map((opt: SimOption, optIdx: number) => {
                      const isSelected = currentAnswer?.selectedOptionId === opt.id
                      return (
                        <motion.button
                          key={opt.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: optIdx * 0.05 }}
                          whileHover={{ scale: 1.01, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectOption(opt)}
                          className={cn(
                            'w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm flex flex-col',
                            isSelected ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 font-medium' : 'border-border hover:border-amber-400/50 hover:bg-muted/30'
                          )}
                        >
                          <span>{opt.text}</span>
                          {isSelected && opt.warning && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> {opt.warning}
                            </motion.div>
                          )}
                        </motion.button>
                      )
                    })}
                    {mcqFeedback && currentAnswer?.selectedOptionId && !followupScenarios[currentQ.q_id] && (
                      <div className="mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
                        <span className="font-medium">Mentor insight: </span>{mcqFeedback}
                      </div>
                    )}
                    
                    {/* FOLLOWUP BRANCHING SECTION */}
                    {(loadingFollowup[currentQ.q_id] || followupScenarios[currentQ.q_id]) && currentAnswer?.selectedOptionId && (
                      <FadeInUp className="mt-6 pl-4 border-l-2 border-amber-500/40 space-y-4">
                        <div className="flex items-center gap-2">
                           <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                           <span className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">Consequence</span>
                        </div>
                        
                        {loadingFollowup[currentQ.q_id] ? (
                          <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl">
                            <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
                            <span className="text-sm italic text-amber-700 dark:text-amber-400">AI is developing the scenario consequence...</span>
                          </div>
                        ) : followupScenarios[currentQ.q_id] && (
                          <div className="space-y-3">
                            <div className="p-4 bg-amber-50/50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-sm font-medium leading-relaxed whitespace-pre-line text-amber-900 dark:text-amber-100">
                              {followupScenarios[currentQ.q_id].question}
                            </div>
                            
                            <div className="pt-2">
                              <div className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" /> How do you manage this consequence?
                              </div>
                              <Textarea
                                placeholder="Type your strategic response here..."
                                value={(currentAnswer as any)?.text || ''}
                                onChange={(e) => handleTextChange(e.target.value)}
                                rows={4}
                                className="resize-none border-amber-200 dark:border-amber-800 focus:border-amber-500 transition-colors text-sm"
                              />
                            </div>
                          </div>
                        )}
                      </FadeInUp>
                    )}
                  </div>
                ) : currentQ.type === 'multiple_choice' && currentQ.options ? (
                  /* Standard MCQ */
                  <div className="space-y-3">
                    {currentQ.options.map((opt: SimOption, optIdx: number) => {
                      const isSelected = currentAnswer?.selectedOptionId === opt.id
                      return (
                        <motion.button
                          key={opt.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: optIdx * 0.05 }}
                          whileHover={{ scale: 1.01, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleSelectOption(opt)}
                          className={cn(
                            'w-full text-left px-4 py-3 rounded-xl border-2 transition-all text-sm',
                            isSelected ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:border-primary/50 hover:bg-muted/30'
                          )}
                        >
                          {opt.text}
                        </motion.button>
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
                    <div className="text-xs text-muted-foreground mb-2">
                      Allocate your budget of {formatRevenue(simulation.capital || 100000)} across categories.
                    </div>
                    {currentQ.options.map((opt: SimOption) => {
                      const val = budgetAllocations[currentQ.q_id]?.[opt.id] || 0
                      const totalBudget = simulation.capital || 100000
                      return (
                        <div key={opt.id} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{opt.text}</span>
                            <span className="font-mono font-medium text-primary">{formatRevenue(val)}</span>
                          </div>
                          <Slider
                            value={[val]}
                            onValueChange={([v]) => handleBudgetAllocation(currentQ.q_id, opt.id, v)}
                            max={totalBudget}
                            step={totalBudget / 20} // 5% increments
                            className="w-full"
                          />
                        </div>
                      )
                    })}
                    {(() => {
                      const total = Object.values(budgetAllocations[currentQ.q_id] || {}).reduce((s, v) => s + v, 0)
                      const totalBudget = simulation.capital || 100000
                      const isComplete = total === totalBudget
                      const isExceeded = total > totalBudget

                      return (
                        <div className={cn(
                          'text-sm font-medium text-center p-2 rounded-lg',
                          isComplete ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                          isExceeded ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' :
                          'bg-muted text-muted-foreground'
                        )}>
                          Total: {formatRevenue(total)} {isComplete ? '✓' : isExceeded ? `(exceeds ${formatRevenue(totalBudget)})` : `(${formatRevenue(totalBudget - total)} remaining)`}
                        </div>
                      )
                    })()}
                  </div>
                ) : currentQ.type === 'ai_scenario' ? (
                  /* AI Scenario — Environment / Problem / Decision / Consequence */
                  <div className="space-y-4">
                    {(() => {
                      const stepStyle = SCENARIO_STEP_STYLES[currentQ.scenario_step || 'environment']
                      const isDecisionStep = currentQ.scenario_step === 'decision'
                      const isInfoStep = currentQ.scenario_step === 'environment' || currentQ.scenario_step === 'consequence'

                      return (
                        <>
                          {/* Scenario step indicator */}
                          <div className="flex items-center gap-3 mb-4">
                            <div className="flex items-center gap-2">
                              {['environment', 'problem', 'decision', 'consequence'].map((step, i) => {
                                const s = SCENARIO_STEP_STYLES[step]
                                const isCurrent = step === currentQ.scenario_step
                                const isPast = ['environment', 'problem', 'decision', 'consequence'].indexOf(currentQ.scenario_step || '') > i
                                return (
                                  <div key={step} className="flex items-center gap-1">
                                    <div className={cn(
                                      'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                                      isCurrent ? 'ring-2 ring-offset-1' : '',
                                      isPast ? 'opacity-50' : ''
                                    )} style={{
                                      backgroundColor: isCurrent ? `${s.color}20` : isPast ? `${s.color}10` : 'var(--muted)',
                                      color: isCurrent || isPast ? s.color : 'var(--muted-foreground)',
                                      boxShadow: isCurrent ? `0 0 0 2px ${s.color}` : 'none',
                                    }}>
                                      {s.icon}
                                    </div>
                                    {i < 3 && <div className="w-4 h-0.5 bg-muted-foreground/20" />}
                                  </div>
                                )
                              })}
                            </div>
                            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: stepStyle.color }}>
                              {stepStyle.label}
                            </span>
                          </div>

                          {/* Scenario group badge */}
                          {currentQ.scenario_group && (
                            <div className="text-xs text-muted-foreground font-medium mb-2">
                              📋 {currentQ.scenario_group.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </div>
                          )}

                          {/* Context card */}
                          {currentQ.context_text && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 }}
                              className={cn(
                                'p-4 rounded-xl border text-sm leading-relaxed',
                                stepStyle.bgColor
                              )}
                              style={{ borderColor: `${stepStyle.color}30` }}
                            >
                              <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: stepStyle.color }}>
                                {stepStyle.icon} {stepStyle.label}
                              </div>
                              <p className="text-foreground/80 whitespace-pre-line">{currentQ.context_text}</p>
                            </motion.div>
                          )}

                          {/* Decision step: open text for user response OR specific Buyout UI */}
                          {isDecisionStep && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              className="space-y-4"
                            >
                              {currentQ.q_id === 'Q_3_BUYOUT_DECISION' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div className="p-6 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5 space-y-4">
                                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-600 flex items-center justify-center">
                                      <TrendingUp className="h-6 w-6" />
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-emerald-700 dark:text-emerald-400">Accept Buyout Deal</h4>
                                      <p className="text-xs text-muted-foreground mt-1">Exit now with a guaranteed return and scale under new ownership.</p>
                                    </div>
                                    <div className="space-y-3 pt-2">
                                      <div>
                                        <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Acquiring Company Name</label>
                                        <input
                                          type="text"
                                          value={buyoutCompany}
                                          onChange={(e) => setBuyoutCompany(e.target.value)}
                                          placeholder="e.g. Google, Target"
                                          className="w-full mt-1 bg-background/50 border border-emerald-500/30 rounded-md py-1.5 px-3 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                      </div>
                                      <div>
                                        <label className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Deal Value ($)</label>
                                        <input
                                          type="number"
                                          value={buyoutAmount}
                                          onChange={(e) => setBuyoutAmount(e.target.value)}
                                          placeholder="e.g. 5000000"
                                          className="w-full mt-1 bg-background/50 border border-emerald-500/30 rounded-md py-1.5 px-3 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                                        />
                                      </div>
                                      <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleBuyoutSubmit}
                                        disabled={submitting}
                                        className="w-full bg-emerald-600/90 text-white text-sm font-bold py-2 rounded-md hover:bg-emerald-600 transition"
                                      >
                                        Confirm
                                      </motion.button>
                                      {submitError && (
                                        <p className="text-xs text-red-500 mt-1">{submitError}</p>
                                      )}
                                    </div>
                                  </div>

                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleTextChange('I choose to WALK OUT OF THE DEAL and ENTER THE WAR ROOM for investments.')}
                                    className={cn(
                                      "p-6 rounded-2xl border-2 text-left space-y-3 transition-all group",
                                      (currentAnswer as any)?.text?.includes('WALK OUT') 
                                        ? "border-primary bg-primary/5" 
                                        : "border-border hover:border-primary/30 hover:bg-muted"
                                    )}
                                  >
                                    <div className="h-10 w-10 rounded-full bg-red-500/20 text-red-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                      <ShieldAlert className="h-6 w-6" />
                                    </div>
                                    <div>
                                      <h4 className="font-bold">Enter War Room</h4>
                                      <p className="text-xs text-muted-foreground mt-1">Reject the buyout. Fight for valuation and retain control.</p>
                                    </div>
                                    <div className="text-xs font-bold text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      Prepare for War <ChevronRight className="h-3 w-3" />
                                    </div>
                                  </motion.button>
                                </div>
                              ) : (
                                <>
                                  <div className="text-xs font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1">
                                    🎯 How do you respond to this situation?
                                  </div>
                                  <Textarea
                                    placeholder="Describe your decision and reasoning..."
                                    value={(currentAnswer as any)?.text || ''}
                                    onChange={(e) => handleTextChange(e.target.value)}
                                    rows={5}
                                    className="resize-none border-violet-200 dark:border-violet-800 focus:border-violet-500"
                                  />
                                </>
                              )}
                            </motion.div>
                          )}

                          {/* Info steps (environment/consequence): auto-acknowledge */}
                          {isInfoStep && !currentAnswer && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.3 }}
                              className="text-center"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setAnswers(prev => ({
                                    ...prev,
                                    [currentQ.q_id]: { questionId: currentQ.q_id, type: 'ai_scenario', text: 'acknowledged' },
                                  }))
                                }}
                                className="text-xs"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                I understand — Continue
                              </Button>
                            </motion.div>
                          )}

                          {/* Problem step: acknowledge */}
                          {currentQ.scenario_step === 'problem' && !currentAnswer && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 0.3 }}
                              className="text-center"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setAnswers(prev => ({
                                    ...prev,
                                    [currentQ.q_id]: { questionId: currentQ.q_id, type: 'ai_scenario', text: 'acknowledged' },
                                  }))
                                }}
                                className="text-xs"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                I understand the problem — Continue
                              </Button>
                            </motion.div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                ) : currentQ.type === 'info' ? (
                  /* Info / Dashboard display */
                  <div className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-5 rounded-xl bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800"
                    >
                      <div className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        ℹ️ INFORMATION
                      </div>
                      {currentQ.context_text && (
                        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{currentQ.context_text}</p>
                      )}
                    </motion.div>
                    {!currentAnswer && (
                      <div className="text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setAnswers(prev => ({
                              ...prev,
                              [currentQ.q_id]: { questionId: currentQ.q_id, type: 'info', text: 'acknowledged' },
                            }))
                          }}
                          className="text-xs"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                          Got it — Continue
                        </Button>
                      </div>
                    )}
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
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-64 text-muted-foreground">No questions available</motion.div>
          )}
          </AnimatePresence>
        </div>

        {/* RIGHT: Mentor Lifeline + Leaderboard */}
        <div className="hidden lg:flex flex-col gap-4">
          <MentorLifelineCard />
          {batchCode ? (
            <LeaderboardPanel
              entries={entries}
              currentUserId={userId}
              connected={connected}
              updatedAt={updatedAt}
              className="flex-1 max-h-[500px]"
            />
          ) : (
            <div className="rounded-xl border bg-card p-4 text-center text-sm text-muted-foreground">
              Join a batch to see live leaderboard
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  )
}
