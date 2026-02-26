'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Clock, ArrowRight, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'

interface AssessmentHistoryItem {
  id: string
  attemptNumber: number
  status: string
  score: number | null
  date: string
  duration: number | null
  stage: string
  mistakes: number
}

export default function HistoryPage() {
  const router = useRouter()
  const [history, setHistory] = useState<AssessmentHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch('/api/history')
        if (response.status === 401) {
          router.push('/login')
          return
        }

        const { default: api } = await import('@/src/lib/api')
        const assessments: any = await api.assessments.list()

        // Transform for history view
        const historyItems = (assessments || []).map((a: any) => ({
          id: a.id,
          date: a.createdAt,
          stage: `Stage ${a.currentStage}`,
          mistakes: 0,
          status: a.status || 'in-progress'
        }))

        setHistory(historyItems)
      } catch (err: any) {
        if (err.message?.includes('Unauthorized')) {
          router.push('/login')
          return
        }
        setError('Failed to load history.')
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [router])

  if (loading) {
    return (
      <div className="py-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error loading history</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    )
  }

  return (
    <div className="py-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessment History</h1>
          <p className="text-muted-foreground mt-1">Review your past performance and track your growth.</p>
        </div>
        <Link href="/assessment/start">
          <Button>Start New Assessment</Button>
        </Link>
      </div>

      {history.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No assessments yet</h3>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Complete your first assessment to see your history and track your entrepreneurial progress.
            </p>
            <Link href="/assessment/start">
              <Button>Start Assessment</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {history.map((item) => (
            <Link key={item.id} href={`/history/${item.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer group">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">
                        Attempt {item.attemptNumber}
                      </CardTitle>
                      <Badge variant={item.status === 'COMPLETED' ? 'default' : 'secondary'}>
                        {item.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <CardDescription className="flex items-center gap-4 text-sm mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(new Date(item.date), 'PPP')}
                    </span>
                    {item.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {Math.round(item.duration)} min
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground text-xs uppercase font-semibold">Stage Reached</p>
                      <p className="font-medium">{item.stage}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase font-semibold">Score</p>
                      <p className="font-medium">{item.score !== null ? `${item.score}%` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-xs uppercase font-semibold">Mistakes</p>
                      <div className="flex items-center gap-1">
                        {item.mistakes === 0 ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-orange-500" />
                        )}
                        <span className="font-medium">{item.mistakes} triggered</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
