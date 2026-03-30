'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, Clock, ArrowLeft, Download, AlertCircle, Share2, Printer, MapPin } from 'lucide-react'
import { format } from 'date-fns'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface ResponseDetail {
  id: string
  questionText: string
  userAnswer: string
  aiFeedback: string
  score: number
  stage: number
  timestamp: string
}

interface SimulationDetail {
  id: string
  attemptNumber: number
  status: string
  createdAt: string
  completedAt: string | null
  totalDuration: number
  score: number
  mistakes: Array<{ name: string; impact: string }>
  competencies: Array<{ name: string; score: number; level: string }>
  responses: ResponseDetail[]
}

export default function HistoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const assessmentId = params.assessmentId as string
  
  const [simulation, setSimulation] = useState<SimulationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDetail() {
      try {
        const res = await fetch(`/api/history/${assessmentId}`)
        if (res.status === 401) {
          router.push('/login')
          return
        }
        if (!res.ok) throw new Error('Failed to load simulation details')
        const data = await res.json()
        setSimulation(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [assessmentId, router])

  if (loading) return <DetailSkeleton />
  
  if (error || !simulation) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Error Loading Simulation</h2>
        <p className="text-muted-foreground">{error || 'Simulation not found'}</p>
        <Link href="/history">
          <Button variant="outline">Back to History</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Link href="/history" className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="h-4 w-4" />
              Back to History
            </Link>
            <span>/</span>
            <span>Attempt {simulation.attemptNumber}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Simulation Report</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(simulation.createdAt), 'PPP')}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {simulation.totalDuration} min
            </span>
            <Badge variant={simulation.status === 'COMPLETED' ? 'default' : 'secondary'}>
              {simulation.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="responses">Response History</TabsTrigger>
          <TabsTrigger value="competencies">Competencies</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Score Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Overall Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-primary">{simulation.score}%</div>
                <p className="text-xs text-muted-foreground mt-1">Based on 14 competencies</p>
              </CardContent>
            </Card>

            {/* Mistakes Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Critical Mistakes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-orange-500">{simulation.mistakes.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Fatal errors triggered</p>
              </CardContent>
            </Card>
            
            {/* Completion Card */}
             <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completion Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{simulation.status === 'COMPLETED' ? '100%' : 'Partial'}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {simulation.completedAt ? `Finished on ${format(new Date(simulation.completedAt), 'P')}` : 'In progress'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Mistakes Detail */}
          {simulation.mistakes.length > 0 && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader>
                <CardTitle className="text-lg text-orange-700 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Critical Mistakes Identified
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {simulation.mistakes.map((mistake, idx) => (
                  <div key={idx} className="flex gap-4 items-start p-3 bg-white rounded-lg border border-orange-100">
                    <div className="h-6 w-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 text-sm font-bold">
                      !
                    </div>
                    <div>
                      <h4 className="font-semibold text-orange-900">{mistake.name}</h4>
                      <p className="text-sm text-orange-800 mt-1">{mistake.impact}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Responses History Tab */}
        <TabsContent value="responses">
          <Card>
            <CardHeader>
              <CardTitle>Session Transcript</CardTitle>
              <CardDescription>
                Review every question, your answer, and the panel's feedback.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {simulation.responses.map((resp, index) => (
                  <AccordionItem key={resp.id} value={resp.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex text-left gap-4 items-center w-full pr-4">
                        <Badge variant="outline" className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full p-0">
                          {index + 1}
                        </Badge>
                        <div className="flex-1">
                          <p className="font-medium line-clamp-1">{resp.questionText}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Stage {resp.stage} • {format(new Date(resp.timestamp), 'p')}
                          </p>
                        </div>
                        <Badge variant={resp.score >= 70 ? 'default' : resp.score >= 40 ? 'secondary' : 'destructive'}>
                          {resp.score}/100
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-6 pt-2 bg-muted/30 rounded-b-lg space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your Answer</h4>
                        <div className="p-4 bg-background rounded-md border text-sm whitespace-pre-wrap">
                          {resp.userAnswer}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          Panel Feedback
                        </h4>
                        <div className="p-4 bg-primary/5 border border-primary/10 rounded-md text-sm">
                          {resp.aiFeedback || "No specific feedback recorded for this response."}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competencies Tab */}
        <TabsContent value="competencies">
           <Card>
            <CardHeader>
              <CardTitle>Competency Breakdown</CardTitle>
              <CardDescription>Detailed analysis of your entrepreneurial skills.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {simulation.competencies.map((comp, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <h4 className="font-medium">{comp.name}</h4>
                      <span className="text-sm font-mono text-muted-foreground">{comp.score}/100</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500" 
                        style={{ width: `${comp.score}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Level: {comp.level}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32" />)}
      </div>
      <Skeleton className="h-[500px]" />
    </div>
  )
}
