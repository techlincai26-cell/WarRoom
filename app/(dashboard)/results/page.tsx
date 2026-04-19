'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { ThemeToggle } from '@/components/theme-toggle'
import { ArrowLeft, CheckCircle2, Clock, Play, BarChart3, AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'
import { CompetencyRadarChart } from '@/components/competency-radar-chart'
import gsap from 'gsap'
import ScrollTrigger from 'gsap/ScrollTrigger'

import api from '@/src/lib/api'

gsap.registerPlugin(ScrollTrigger)

interface SimulationResult {
  id: string
  attemptNumber: number
  status: string
  currentStage: number
  startedAt: string | null
  completedAt: string | null
  stages: {
    stageNumber: number
    stageName: string
    completedAt: string | null
    questionsAnswered: number
  }[]
  responses: {
    questionId: string
    rawScore: number | null
    stage: { stageNumber: number; stageName: string } | null
  }[]
  competencyScores: {
    competencyCode: string
    competencyName: string
    normalizedScore: number
    levelAchieved: string
  }[]
  mistakesTriggered: {
    mistakeCode: string
    mistakeName: string
    triggeredAtStage: number
    hasCompounded: boolean
  }[]
}

export default function ResultsPage() {
  const router = useRouter()
  const [simulations, setSimulations] = useState<SimulationResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Header animation
    if (headerRef.current && !loading) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
      )
    }

    // Cards entrance with stagger
    if (cardsRef.current && !loading) {
      const cards = cardsRef.current.querySelectorAll('.result-card')
      gsap.fromTo(
        cards,
        { opacity: 0, y: 40, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'back.out(1.7)',
        }
      )
    }
  }, [loading])

  useEffect(() => {
    async function fetchResults() {
      try {
        const simulations: any = await api.assessments.list()

        // Transform data if needed
        setSimulations(simulations || [])
        if (simulations?.length > 0) {
          setExpandedAttempt(simulations[0].id)
        }
      } catch (err: any) {
        if (err.message?.includes('Unauthorized')) {
          router.push('/login')
          return
        }
        console.error(err)
        setError('Failed to load simulation results.')
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Skeleton className="h-9 w-48 mb-2 animate-pulse" />
              <Skeleton className="h-5 w-64 animate-pulse" />
            </motion.div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          {[1, 2].map(i => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Skeleton className="h-64 w-full mb-6 animate-pulse" />
            </motion.div>
          ))}
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const stageNames: Record<number, string> = {
    [-2]: 'Ideating',
    [-1]: 'Concepting',
    0: 'Committing',
    1: 'Validating',
    2: 'Scaling',
    3: 'Establishing',
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header ref={headerRef} className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Dashboard
                  </Button>
                </Link>
              </div>
              <h1 className="text-3xl font-bold">Simulation Results</h1>
              <p className="text-muted-foreground mt-1">Detailed breakdown of all your simulation attempts</p>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {simulations.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground mb-4">No simulations found. Start your first simulation to see results here.</p>
              <Link href="/assessment/start">
                <Button>
                  <Play className="h-4 w-4 mr-2" />
                  Start Simulation
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div ref={cardsRef} className="space-y-8">
            {simulations.map((simulation) => {
              const isCompleted = simulation.status === 'COMPLETED'
              const isExpanded = expandedAttempt === simulation.id
              const totalResponses = simulation.responses?.length || 0
              const completedStages = simulation.stages?.filter((s: any) => s.completedAt)?.length || 0
              const avgScore = simulation.competencyScores?.length > 0
                ? Math.round(simulation.competencyScores.reduce((sum, c) => sum + (c.normalizedScore || 0), 0) / simulation.competencyScores.length)
                : null

              return (
                <motion.div key={simulation.id} className="result-card">
                  <Card className="overflow-hidden border-border/50 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">Attempt {simulation.attemptNumber}</CardTitle>
                        <CardDescription>
                          {isCompleted && simulation.completedAt
                            ? `Completed on ${new Date(simulation.completedAt).toLocaleDateString()}`
                            : simulation.startedAt
                              ? `Started on ${new Date(simulation.startedAt).toLocaleDateString()}`
                              : 'Not started'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-3">
                        {avgScore !== null && (
                          <motion.div
                            className="text-right"
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, type: 'spring', stiffness: 300 }}
                            viewport={{ once: true }}
                          >
                            <div className="text-2xl font-bold text-primary animate-glow-border pb-1">{avgScore}</div>
                            <div className="text-xs text-muted-foreground">Avg Score</div>
                          </motion.div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, x: 10 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          viewport={{ once: true }}
                        >
                          <Badge variant={isCompleted ? 'default' : 'outline'} className={isCompleted ? 'animate-pulse-ring-thick' : ''}>
                            {isCompleted ? (
                              <><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</>
                            ) : (
                              <><Clock className="h-3 w-3 mr-1" /> {simulation.status?.replace('_', ' ')}</>
                            )}
                          </Badge>
                        </motion.div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Quick Stats Row */}
                    <motion.div className="grid grid-cols-4 gap-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                      {[
                        { label: 'Responses', value: totalResponses },
                        { label: 'Stages', value: `${completedStages}/6` },
                        { label: 'Competencies', value: simulation.competencyScores?.length || 0 },
                        { label: 'Mistakes', value: simulation.mistakesTriggered?.length || 0 },
                      ].map((stat, idx) => (
                        <motion.div
                          key={idx}
                          className="text-center p-3 bg-muted/50 rounded-lg border border-border/50 hover:border-primary/50 transition-all"
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          viewport={{ once: true }}
                          whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(99, 102, 241, 0.1)' }}
                        >
                          <div className="text-lg font-bold text-primary">{stat.value}</div>
                          <div className="text-xs text-muted-foreground">{stat.label}</div>
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Stage Progress */}
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
                      <h4 className="text-sm font-semibold mb-3">Stage Progress</h4>
                      <motion.div className="grid grid-cols-6 gap-2">
                        {[-2, -1, 0, 1, 2, 3].map((stageNum, idx) => {
                          const stage = simulation.stages?.find((s: any) => s.stageNumber === stageNum)
                          const isStageCompleted = stage?.completedAt
                          const isCurrent = !isStageCompleted && simulation.currentStage === stageNum
                          const stageResponses = simulation.responses?.filter((r: any) => r.stage?.stageNumber === stageNum) || []

                          return (
                            <motion.div
                              key={stageNum}
                              className={`text-center p-2 rounded-lg text-xs cursor-pointer transition-all ${isStageCompleted ? 'bg-emerald-100 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-700 shadow-sm shadow-emerald-500/10' :
                                  isCurrent ? 'bg-blue-100 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-700 animate-pulse-ring-thick' :
                                    'bg-muted/30 border border-border/50 hover:border-primary/30'
                                }`}
                              initial={{ opacity: 0, y: 10 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              whileHover={{ scale: 1.05 }}
                              viewport={{ once: true }}
                            >
                              <div className="font-semibold truncate">{stageNames[stageNum] || `S${stageNum}`}</div>
                              <div className="text-muted-foreground">
                                {stageResponses.length > 0 ? `${stageResponses.length} Q` : '--'}
                              </div>
                            </motion.div>
                          )
                        })}
                      </motion.div>
                    </motion.div>

                    {/* Expand/Collapse Details */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedAttempt(isExpanded ? null : simulation.id)}
                      className="w-full"
                    >
                      {isExpanded ? 'Hide Details' : 'Show Details'}
                    </Button>

                    {isExpanded && (
                      <div className="space-y-6 pt-4 border-t border-border">
                        {/* Competency Scores */}
                        {simulation.competencyScores?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                              <BarChart3 className="h-4 w-4" />
                              Competency Profile
                            </h4>
                            <div className="mb-6 border border-border rounded-xl bg-card p-4">
                               <CompetencyRadarChart 
                                 spiderData={simulation.competencyScores.reduce((acc, c) => ({...acc, [c.competencyCode]: c.normalizedScore || 0}), {})}
                                 competencyRanking={simulation.competencyScores.map(c => ({ code: c.competencyCode, name: c.competencyName }))}
                               />
                            </div>
                            <div className="space-y-2">
                              {simulation.competencyScores.map((c) => (
                                <div key={c.competencyCode} className="flex items-center gap-3">
                                  <span className="text-xs w-8 text-muted-foreground">{c.competencyCode}</span>
                                  <span className="text-sm w-48 truncate">{c.competencyName}</span>
                                  <Progress value={c.normalizedScore || 0} className="flex-1 h-2" />
                                  <Badge variant="outline" className="text-xs w-10 justify-center">
                                    {c.levelAchieved}
                                  </Badge>
                                  <span className="text-sm font-mono w-8 text-right">{c.normalizedScore || 0}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Mistakes Triggered */}
                        {simulation.mistakesTriggered?.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4" />
                              Mistakes Triggered
                            </h4>
                            <div className="space-y-2">
                              {simulation.mistakesTriggered.map((m, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                                  <div>
                                    <span className="text-sm font-medium">{m.mistakeName || m.mistakeCode}</span>
                                    <span className="text-xs text-muted-foreground ml-2">Stage {m.triggeredAtStage}</span>
                                  </div>
                                  {m.hasCompounded && (
                                    <Badge variant="destructive" className="text-xs">Compounded</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                      {isCompleted && (
                        <Link href={`/assessment/${simulation.id}/final-report`}>
                          <Button variant="outline" size="sm">
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Full Report
                          </Button>
                        </Link>
                      )}
                      {!isCompleted && simulation.status !== 'NOT_STARTED' && (
                        <Link href={`/assessment/${simulation.id}`}>
                          <Button size="sm">
                            <Play className="h-4 w-4 mr-2" />
                            Continue Simulation
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

