'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/src/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  BarChart3,
  Trophy,
  Target,
  TrendingUp,
  Loader2,
  Play,
  Award,
  Star,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type {
  SimulationState,
  CompetencyScore,
  EvaluationReport,
} from '@/src/types'

// ---- Stage display names ----

const STAGE_LABELS: Record<string, string> = {
  STAGE_NEG2_IDEATION: 'Ideation',
  STAGE_NEG1_VISION: 'Vision',
  STAGE_0_COMMITMENT: 'Commitment',
  STAGE_1_VALIDATION: 'Validation',
  STAGE_2A_GROWTH: 'Growth',
  STAGE_2B_EXPANSION: 'Expansion',
  STAGE_3_SCALE: 'Scale',
  STAGE_WARROOM_PREP: 'War Room Prep',
  STAGE_4_WARROOM: 'War Room',
}

const CATEGORY_COLORS: Record<string, string> = {
  NATURAL_DOMINANT: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-950/40',
  STRONG: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/40',
  FUNCTIONAL: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950/40',
  DEVELOPMENT_REQUIRED: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/40',
  HIGH_RISK: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950/40',
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function SimulationResultPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params?.assessmentId as string

  const [state, setState] = useState<SimulationState | null>(null)
  const [report, setReport] = useState<EvaluationReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const assessmentData = await api.assessments.get(assessmentId)
      setState(assessmentData)

      // Try to load report if simulation is completed or in progress
      try {
        const reportData = await api.assessments.getReport(assessmentId)
        setReport(reportData)
      } catch {
        // Report may not be ready yet - that's okay
      }
    } catch (err: any) {
      if (err.message?.includes('Unauthorized') || err.message?.includes('401')) {
        router.push('/login')
        return
      }
      setError(err.message || 'Failed to load simulation results')
    } finally {
      setLoading(false)
    }
  }, [assessmentId, router])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading simulation results...</p>
        </div>
      </div>
    )
  }

  if (error || !state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <p className="text-destructive text-lg">{error || 'Simulation not found'}</p>
        <Button onClick={() => router.push('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    )
  }

  const { simulation, competencies, progress } = state
  const isCompleted = simulation.status === 'COMPLETED'
  const isInProgress = simulation.status === 'IN_PROGRESS'

  // Compute stats
  const avgScore = competencies && competencies.length > 0
    ? Math.round(competencies.reduce((sum, c) => sum + (c.weightedAverage || 0), 0) / competencies.length)
    : 0
  const strengths = competencies?.filter(c => c.category === 'NATURAL_DOMINANT' || c.category === 'STRONG') || []
  const weaknesses = competencies?.filter(c => c.category === 'HIGH_RISK' || c.category === 'DEVELOPMENT_REQUIRED') || []
  const revenueProjection = (simulation as any).revenueProjection || 0

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-30">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Dashboard
                </Button>
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-xl font-bold">Simulation Results</h1>
                <p className="text-sm text-muted-foreground">
                  {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : simulation.status}
                  {simulation.startedAt && ` - Started ${new Date(simulation.startedAt).toLocaleDateString()}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={isCompleted ? 'default' : 'outline'} className="text-sm px-3 py-1">
                {isCompleted ? (
                  <><CheckCircle2 className="h-4 w-4 mr-1" /> Completed</>
                ) : (
                  <><Clock className="h-4 w-4 mr-1" /> {simulation.status?.replace(/_/g, ' ')}</>
                )}
              </Badge>
              {isInProgress && (
                <Link href={`/assessment/${assessmentId}`}>
                  <Button size="sm">
                    <Play className="h-4 w-4 mr-1" /> Continue
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-amber-500" />
              <div className="text-3xl font-bold">{avgScore}</div>
              <div className="text-xs text-muted-foreground">Avg Competency Score</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="text-3xl font-bold">
                {revenueProjection >= 1000000
                  ? `${(revenueProjection / 1000000).toFixed(1)}M`
                  : revenueProjection >= 1000
                    ? `${(revenueProjection / 1000).toFixed(0)}K`
                    : revenueProjection}
              </div>
              <div className="text-xs text-muted-foreground">Revenue Projection</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="text-3xl font-bold">{progress?.percentComplete || 0}%</div>
              <div className="text-xs text-muted-foreground">Progress</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <div className="text-3xl font-bold">{progress?.answeredQuestions || 0}</div>
              <div className="text-xs text-muted-foreground">Questions Answered</div>
            </CardContent>
          </Card>
        </div>

        {/* Current Stage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Stage Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
              {Object.entries(STAGE_LABELS).map(([stageId, label]) => {
                const stagesCompleted = Object.keys(STAGE_LABELS)
                const currentIdx = stagesCompleted.indexOf(simulation.currentStage)
                const thisIdx = stagesCompleted.indexOf(stageId)
                const isActive = stageId === simulation.currentStage
                const isDone = thisIdx < currentIdx || isCompleted

                return (
                  <div
                    key={stageId}
                    className={cn(
                      'text-center p-2 rounded-lg text-xs border transition-colors',
                      isDone && 'bg-green-100 dark:bg-green-950/30 border-green-300 dark:border-green-800',
                      isActive && !isCompleted && 'bg-blue-100 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/30',
                      !isDone && !isActive && 'bg-muted/30 border-border'
                    )}
                  >
                    <div className="font-semibold truncate">{label}</div>
                    <div className="text-muted-foreground mt-0.5">
                      {isDone ? <CheckCircle2 className="h-3 w-3 mx-auto text-green-600" /> : isActive ? '...' : '-'}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4">
              <Progress value={progress?.percentComplete || 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Competency Scores */}
        {competencies && competencies.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Competency Scores
              </CardTitle>
              <CardDescription>
                Your performance across all 8 entrepreneurial competencies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[...competencies]
                .sort((a, b) => (b.weightedAverage || 0) - (a.weightedAverage || 0))
                .map((comp, i) => (
                  <div key={comp.competencyCode} className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground w-6">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium truncate">{comp.competencyName}</span>
                        <Badge
                          variant="outline"
                          className={cn('text-xs', CATEGORY_COLORS[comp.category] || '')}
                        >
                          {comp.category?.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <Progress
                        value={Math.min(comp.weightedAverage || 0, 100)}
                        className="h-2"
                      />
                    </div>
                    <span className="text-sm font-mono font-bold w-10 text-right">
                      {Math.round(comp.weightedAverage || 0)}
                    </span>
                  </div>
                ))}
            </CardContent>
          </Card>
        )}

        {/* Report section */}
        {report && (
          <>
            {/* Entrepreneur Type */}
            {report.entrepreneurType && (
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
                <CardContent className="pt-6 text-center space-y-3">
                  <Star className="h-12 w-12 mx-auto text-primary" />
                  <h2 className="text-2xl font-bold">{report.entrepreneurType}</h2>
                  {report.organizationalRole && (
                    <p className="text-muted-foreground">Best Organizational Role: {report.organizationalRole}</p>
                  )}
                  {report.archetypeNarrative && (
                    <p className="text-sm text-muted-foreground max-w-2xl mx-auto mt-2">
                      {report.archetypeNarrative}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action Plan */}
            {report.actionPlan && report.actionPlan.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Action Plan</CardTitle>
                  <CardDescription>Recommended actions to improve your entrepreneurial skills</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {report.actionPlan.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                          {i + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-medium">{item.competency}</div>
                          <p className="text-sm text-muted-foreground mt-0.5">{item.action}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stage Narrations */}
            {report.stageNarrations && report.stageNarrations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Stage-by-Stage Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {report.stageNarrations.map((narration, i) => (
                      <div key={i} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{STAGE_LABELS[narration.stage] || narration.stage}</Badge>
                          <span className="text-xs text-muted-foreground">{narration.questionsAnswered} questions</span>
                        </div>
                        {narration.decisions && narration.decisions.length > 0 && (
                          <div className="mt-2">
                            <h5 className="text-xs font-semibold text-muted-foreground mb-1">Key Decisions</h5>
                            <ul className="text-sm space-y-1">
                              {narration.decisions.map((d, j) => (
                                <li key={j} className="text-muted-foreground">- {d}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {narration.scoringRationale && (
                          <p className="text-sm text-muted-foreground mt-2">{narration.scoringRationale}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Detailed Competency Breakdown */}
        {competencies && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Competency Analysis
              </CardTitle>
              <CardDescription>
                Detailed breakdown of your performance across the 8 core competencies.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {competencies.slice().sort((a, b) => (b.weightedAverage || 0) - (a.weightedAverage || 0)).map((comp) => (
                  <div key={comp.competencyCode} className="space-y-3 p-4 rounded-xl border bg-card/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm tracking-tight">{comp.competencyName}</h4>
                        <span className="text-[10px] text-muted-foreground uppercase font-semibold">{comp.competencyCode}</span>
                      </div>
                      <Badge variant="outline" className={cn("text-[10px] px-2 py-0", CATEGORY_COLORS[comp.category] || '')}>
                        {comp.category}
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Proficiency</span>
                        <span className="font-mono">{(comp.weightedAverage || 0).toFixed(1)} / 3.0</span>
                      </div>
                      <Progress value={((comp.weightedAverage || 0) / 3) * 100} className="h-1.5" />
                    </div>

                    {(comp as any).strengths?.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase">Positive Signals</span>
                        <ul className="text-[11px] space-y-0.5">
                          {(comp as any).strengths.slice(0, 2).map((s: string, i: number) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-green-500 mt-0.5">•</span>
                              <span className="text-muted-foreground leading-tight">{s}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(comp as any).weaknesses?.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Development Areas</span>
                        <ul className="text-[11px] space-y-0.5">
                          {(comp as any).weaknesses.slice(0, 2).map((w: string, i: number) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-amber-500 mt-0.5">•</span>
                              <span className="text-muted-foreground leading-tight">{w}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Previous sections... */}

        {/* Bottom Actions */}
        <div className="flex justify-center gap-4 pb-8">
          <Link href="/dashboard">
            <Button variant="outline" size="lg">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          {isInProgress && (
            <Link href={`/assessment/${assessmentId}`}>
              <Button size="lg">
                <Play className="h-4 w-4 mr-2" />
                Continue Simulation
              </Button>
            </Link>
          )}
        </div>
      </main>
    </div>
  )
}
