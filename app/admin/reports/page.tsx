'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { BarChart3, Download, Filter, TrendingUp, Users } from 'lucide-react'
import api from '@/src/lib/api'
import type { AdminBatch } from '@/src/types'

interface ReportMetric {
  id: string
  name: string
  cohort: string
  type: 'cohort'
  generatedAt: string
  participantCount: number
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [totalParticipants, setTotalParticipants] = useState(0)

  useEffect(() => {
    async function loadReports() {
      try {
        const batches = await api.admin.listBatches()
        
        let participantsCount = 0
        const batchReports: ReportMetric[] = batches.map((b: AdminBatch) => {
          participantsCount += b.participantCount || 0
          return {
            id: b.id,
            name: `${b.name} - Overall Analysis`,
            cohort: b.name,
            type: 'cohort',
            generatedAt: new Date(b.createdAt).toISOString().split('T')[0],
            participantCount: b.participantCount || 0
          }
        })
        
        setTotalParticipants(participantsCount)
        setReports(batchReports)
      } catch (err) {
        console.error('Failed to load reports', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadReports()
  }, [])

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'cohort':
        return '👥 Cohort'
      case 'individual':
        return '👤 Individual'
      case 'comparative':
        return '📊 Comparative'
      default:
        return type
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Reports</h1>
              <p className="text-muted-foreground mt-1">View and manage simulation reports</p>
            </div>
            <Button className="gap-2" disabled={loading}>
              <Download className="h-4 w-4" />
              Export Summary
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
           <div className="flex justify-center py-20">
             <p className="text-muted-foreground animate-pulse">Loading report data...</p>
           </div>
        ) : (
           <>
              {/* Stats */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-12">
                {[
                  { label: 'Total Cohort Reports', value: reports.length, icon: BarChart3 },
                  { label: 'Total Participants Active', value: totalParticipants, icon: Users },
                  { label: 'Metrics Tracked', value: '8+', icon: TrendingUp }
                ].map((stat, idx) => {
                  const Icon = stat.icon
                  return (
                    <Card key={idx} className="card-base border border-border bg-card shadow-sm">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                            <p className="text-3xl font-bold text-primary mt-2">{stat.value}</p>
                          </div>
                          <Icon className="h-8 w-8 text-primary/20" />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {/* Reports Table */}
              <Card className="card-base border border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Recent Cohort Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  {reports.length === 0 ? (
                      <p className="text-muted-foreground text-center py-6">No reports available. Create a batch to see analytics.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground">
                            <th className="text-left py-3 px-4 font-medium">Report</th>
                            <th className="text-left py-3 px-4 font-medium">Type</th>
                            <th className="text-left py-3 px-4 font-medium">Cohort</th>
                            <th className="text-left py-3 px-4 font-medium">Participants</th>
                            <th className="text-left py-3 px-4 font-medium">Generated</th>
                            <th className="text-right py-3 px-4 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reports.map((report) => (
                            <tr key={report.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                              <td className="py-4 px-4 font-medium text-foreground">{report.name}</td>
                              <td className="py-4 px-4">
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300">
                                  {getTypeLabel(report.type)}
                                </Badge>
                              </td>
                              <td className="py-4 px-4 text-muted-foreground">{report.cohort}</td>
                              <td className="py-4 px-4 text-muted-foreground">{report.participantCount}</td>
                              <td className="py-4 px-4 text-muted-foreground">{report.generatedAt}</td>
                              <td className="py-4 px-4 text-right">
                                <Link href={`/admin/cohorts/${report.id}`}>
                                   <Button variant="ghost" size="sm" className="gap-2">
                                     <BarChart3 className="h-4 w-4" />
                                     View Data
                                   </Button>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
           </>
        )}
      </main>
    </div>
  )
}
