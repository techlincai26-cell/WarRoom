'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import { LeaderboardPanel } from '@/src/components/LeaderboardPanel'
import { StartAssessmentDialog } from '@/src/components/StartAssessmentDialog'
import { useLeaderboard } from '@/src/hooks/useLeaderboard'
import { Play, ArrowRight, CheckCircle2, Clock, Plus, Trophy, Target, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import api from '@/src/lib/api'
import type { Assessment } from '@/src/types'
import { FadeInUp, ScaleOnHover, CountUp, AnimatedGradientText, Floating } from '@/src/components/AnimatedComponents'

function stageLabel(stageName: string): string {
  return stageName
    .replace('STAGE_', '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function statusBadgeVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
  switch (status) {
    case 'COMPLETED': return 'default'
    case 'IN_PROGRESS': return 'outline'
    default: return 'secondary'
  }
}

function formatRevenue(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(1)}K`
  return `$${amount.toLocaleString('en-US')}`
}

export default function DashboardPage() {
  const router = useRouter()
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [loading, setLoading] = useState(true)
  const [startDialogOpen, setStartDialogOpen] = useState(false)
  const [user, setUser] = useState<{ name: string; email: string; batchCode?: string; id?: string } | null>(null)
  const [batch, setBatch] = useState<{ code: string; name: string } | null>(null)

  const { entries, connected, updatedAt } = useLeaderboard(batch?.code)

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null')
    const storedBatch = JSON.parse(localStorage.getItem('batch') || 'null')
    if (!storedUser) {
      router.push('/login')
      return
    }
    setUser(storedUser)
    setBatch(storedBatch)

    api.assessments
      .list()
      .then(setAssessments)
      .catch(() => setAssessments([]))
      .finally(() => setLoading(false))
  }, [router])

  const handleAssessmentCreated = (assessmentId: string) => {
    setStartDialogOpen(false)
    router.push(`/assessment/${assessmentId}`)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('batch')
    router.push('/login')
  }

  const activeAssessments = assessments.filter(
    (a) => a.status === 'IN_PROGRESS' || a.status === 'NOT_STARTED'
  )
  const completedAssessments = assessments.filter((a) => a.status === 'COMPLETED')

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.1 }}
              className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-sm"
            >
              KK
            </motion.div>
            <div>
              <span className="font-semibold text-sm">{user?.name || 'Loading...'}</span>
              {batch && (
                <Badge variant="outline" className="ml-2 text-xs">
                  {batch.code}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/leaderboard">
              <Button variant="ghost" size="sm">
                <Trophy className="h-4 w-4 mr-1" /> Leaderboard
              </Button>
            </Link>
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Welcome + Start CTA */}
            <FadeInUp>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl font-bold">
                    Welcome back,{' '}
                    <AnimatedGradientText from="#6366f1" via="#f59e0b" to="#ef4444">
                      {user?.name?.split(' ')[0] || 'User'}
                    </AnimatedGradientText>
                    !
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    {batch
                      ? `Batch: ${batch.name || batch.code}`
                      : 'Ready to assess your entrepreneurial skills?'}
                  </p>
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                  <Button onClick={() => setStartDialogOpen(true)} size="lg" className="flex-shrink-0 glow-button">
                    <Plus className="h-5 w-5 mr-2" />
                    Start New Assessment
                  </Button>
                </motion.div>
              </div>
            </FadeInUp>

            {/* Active Assessments */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                    className="h-24 rounded-xl bg-muted"
                  />
                ))}
              </div>
            ) : activeAssessments.length > 0 ? (
              <div className="space-y-4">
                <FadeInUp delay={0.1}>
                  <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                    Active Assessments
                  </h2>
                </FadeInUp>
                {activeAssessments.map((a, idx) => (
                  <FadeInUp key={a.id} delay={0.15 + idx * 0.08}>
                    <ScaleOnHover>
                      <Card className="hover:shadow-lg transition-shadow border-border/50">
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-center gap-4">
                            <motion.div
                              whileHover={{ rotate: 15 }}
                              className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0"
                            >
                              <Play className="h-5 w-5 text-primary" />
                            </motion.div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium">Assessment</span>
                                <Badge variant={statusBadgeVariant(a.status)} className="text-xs">
                                  {a.status === 'IN_PROGRESS' ? 'In Progress' : 'Not Started'}
                                </Badge>
                              </div>
                              <div className="text-sm text-muted-foreground mt-0.5">
                                Stage: {stageLabel(a.currentStage)} •{' '}
                                Started {new Date(a.createdAt).toLocaleDateString()}
                              </div>
                              {(a as any).revenueProjection > 0 && (
                                <div className="text-sm font-medium text-green-600 mt-0.5">
                                  {formatRevenue((a as any).revenueProjection)} projected
                                </div>
                              )}
                            </div>
                            <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.95 }}>
                              <Button
                                onClick={() => router.push(`/assessment/${a.id}`)}
                                size="sm"
                                variant={a.status === 'IN_PROGRESS' ? 'default' : 'outline'}
                              >
                                {a.status === 'IN_PROGRESS' ? 'Continue' : 'Start'}
                                <ArrowRight className="h-4 w-4 ml-1" />
                              </Button>
                            </motion.div>
                          </div>
                        </CardContent>
                      </Card>
                    </ScaleOnHover>
                  </FadeInUp>
                ))}
              </div>
            ) : (
              <FadeInUp delay={0.2}>
                <Card className="border-dashed">
                  <CardContent className="py-12 text-center">
                    <Floating duration={3} y={8}>
                      <Target className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
                    </Floating>
                    <h3 className="font-semibold mb-2">No Active Assessments</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Start your first assessment to begin your entrepreneurial journey.
                    </p>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="inline-block">
                      <Button onClick={() => setStartDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" /> Start Assessment
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </FadeInUp>
            )}

            {/* Completed Assessments */}
            {completedAssessments.length > 0 && (
              <div className="space-y-4">
                <FadeInUp delay={0.3}>
                  <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                    Completed ({completedAssessments.length})
                  </h2>
                </FadeInUp>
                <div className="space-y-3">
                  {completedAssessments.map((a, idx) => (
                    <FadeInUp key={a.id} delay={0.35 + idx * 0.06}>
                      <Card className="bg-muted/30 hover:bg-muted/50 transition-colors">
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">
                                Completed {new Date(a.completedAt || a.createdAt).toLocaleDateString()}
                              </div>
                              {(a as any).revenueProjection > 0 && (
                                <div className="text-xs text-muted-foreground">
                                  Final ARR: {formatRevenue((a as any).revenueProjection)}
                                </div>
                              )}
                            </div>
                            <Link href={`/results/${a.id}`}>
                              <Button variant="ghost" size="sm" className="text-xs">
                                View Report
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    </FadeInUp>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Live Leaderboard */}
          <div className="space-y-6">
            <FadeInUp delay={0.2}>
              <div>
                <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
                  Batch Leaderboard
                </h2>
                {batch ? (
                  <LeaderboardPanel
                    entries={entries}
                    currentUserId={user?.id}
                    connected={connected}
                    updatedAt={updatedAt}
                    className="h-[500px]"
                  />
                ) : (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center text-sm text-muted-foreground">
                      Sign in with a batch code to see live leaderboard
                    </CardContent>
                  </Card>
                )}
              </div>
            </FadeInUp>
          </div>
        </div>
      </div>

      <StartAssessmentDialog
        open={startDialogOpen}
        onOpenChange={setStartDialogOpen}
        onCreated={handleAssessmentCreated}
      />
    </div>
  )
}
