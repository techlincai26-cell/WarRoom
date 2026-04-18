'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, List, Award, TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import api from '@/src/lib/api'
import { CompetencyRadarChart } from '@/components/competency-radar-chart'

export default function AdminUserReportPage() {
  const { id: batchId, assessmentId } = useParams() as { id: string, assessmentId: string }
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchReport() {
      try {
        const data = await api.assessments.getReport(assessmentId)
        setReport(data)
      } catch (err: any) {
        console.error(err)
        setError('Failed to load user report for assessment ' + assessmentId)
      } finally {
        setLoading(false)
      }
    }
    if (assessmentId && assessmentId !== 'null') {
      fetchReport()
    } else {
        setLoading(false)
        setError('No assessment ID associated with this user yet.')
    }
  }, [assessmentId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Loading saved report...</p>
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="py-6 space-y-6">
         <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
            <Link href={`/admin/cohorts/${batchId}`}>
                <ArrowLeft className="h-4 w-4" />
            </Link>
            </Button>
            <h1 className="text-2xl font-bold">User Report</h1>
        </div>
        <Card><CardContent className="pt-6 text-center text-muted-foreground">{error}</CardContent></Card>
      </div>
    )
  }

  return (
    <div className="py-6 space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/admin/cohorts/${batchId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">User Assessment Report</h1>
          <p className="text-muted-foreground">Detailed evaluation and competency breakdown</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader>
                <CardTitle>Entrepreneur Profile</CardTitle>
                <CardDescription>Overall persona and fit</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                   <span className="text-sm text-muted-foreground">Archetype Profile:</span>
                   <p className="text-lg font-medium">{report.entrepreneurType || 'N/A'}</p>
                </div>
                <div>
                   <span className="text-sm text-muted-foreground">Organizational Role Fit:</span>
                   <p className="text-lg font-medium">{report.organizationalRole || 'N/A'}</p>
                </div>
                {report.archetypeNarrative && (
                    <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm italic break-words">{report.archetypeNarrative}</p>
                    </div>
                )}
            </CardContent>
        </Card>

        {report.spiderChartData && report.competencyRanking && (
            <Card>
                <CardHeader>
                    <CardTitle>Competency Analysis</CardTitle>
                    <CardDescription>Spider web radar chart of assessed competencies</CardDescription>
                </CardHeader>
                <CardContent>
                    <CompetencyRadarChart 
                        spiderData={report.spiderChartData} 
                        competencyRanking={report.competencyRanking} 
                    />
                </CardContent>
            </Card>
        )}
      </div>

      {report.competencyRanking && (
        <Card>
            <CardHeader><CardTitle>Detailed Competencies</CardTitle></CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {report.competencyRanking.map((comp: any, idx: number) => (
                        <div key={comp.code} className="p-4 border border-border rounded-lg bg-card">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-lg">{comp.name}</h3>
                                <Badge variant="outline">{comp.weightedAverage?.toFixed(1) || 0} / 5</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">Category: {comp.category?.replace(/_/g, ' ')}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mt-3">
                                {comp.strengths && comp.strengths.length > 0 && (
                                    <div>
                                        <span className="font-semibold text-green-600 block mb-1">Strengths:</span>
                                        <ul className="list-disc pl-4 space-y-1">
                                            {comp.strengths.map((s: string, i: number) => <li key={i}>{s}</li>)}
                                        </ul>
                                    </div>
                                )}
                                {comp.weaknesses && comp.weaknesses.length > 0 && (
                                    <div>
                                        <span className="font-semibold text-red-600 block mb-1">Areas for Growth:</span>
                                        <ul className="list-disc pl-4 space-y-1">
                                            {comp.weaknesses.map((w: string, i: number) => <li key={i}>{w}</li>)}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
      )}

      {report.detailedAnalysis && (
        <Card>
            <CardHeader><CardTitle>Executive Summary</CardTitle></CardHeader>
            <CardContent>
                <p className="whitespace-pre-line text-sm">{report.detailedAnalysis}</p>
            </CardContent>
        </Card>
      )}

    </div>
  )
}
