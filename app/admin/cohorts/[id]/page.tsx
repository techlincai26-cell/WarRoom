'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import api from '@/src/lib/api'
import type { AdminBatchDetail, BatchParticipant, BatchStats, UpdateBatchRequest } from '@/src/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Users,
  BarChart3,
  Copy,
  Check,
  Hash,
  Trash2,
  Pencil,
} from 'lucide-react'

export default function BatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const batchId = params.id as string

  const [batch, setBatch] = useState<AdminBatchDetail | null>(null)
  const [participants, setParticipants] = useState<BatchParticipant[]>([])
  const [stats, setStats] = useState<BatchStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [editName, setEditName] = useState('')
  const [editLevel, setEditLevel] = useState(1)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [batchData, participantsData, statsData] = await Promise.all([
        api.admin.getBatch(batchId),
        api.admin.getParticipants(batchId),
        api.admin.getStats(batchId),
      ])
      setBatch(batchData)
      setParticipants(participantsData)
      setStats(statsData)
      setEditName(batchData.name)
      setEditLevel(batchData.level)
    } catch (err) {
      console.error('Failed to fetch batch:', err)
    } finally {
      setLoading(false)
    }
  }, [batchId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCopy = () => {
    if (batch) {
      navigator.clipboard.writeText(batch.code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates: UpdateBatchRequest = {}
      if (editName !== batch?.name) updates.name = editName
      if (editLevel !== batch?.level) updates.level = editLevel
      await api.admin.updateBatch(batchId, updates)
      setShowEdit(false)
      fetchData()
    } catch (err) {
      console.error('Failed to update batch:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async () => {
    if (!batch) return
    try {
      await api.admin.updateBatch(batchId, { active: !batch.active })
      fetchData()
    } catch (err) {
      console.error('Failed to toggle batch:', err)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.admin.deleteBatch(batchId)
      router.push('/admin/cohorts')
    } catch (err) {
      console.error('Failed to delete batch:', err)
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <Badge variant="default">In Progress</Badge>
      case 'COMPLETED':
        return <Badge className="bg-green-600 text-white">Completed</Badge>
      case 'NOT_STARTED':
        return <Badge variant="secondary">Not Started</Badge>
      default:
        return <Badge variant="outline">No Simulation</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading batch details...</p>
      </div>
    )
  }

  if (!batch) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Batch not found</p>
      </div>
    )
  }

  return (
    <div className="py-6 space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/cohorts">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{batch.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 font-mono text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Hash className="h-3 w-3" />
              {batch.code}
              {copiedCode ? (
                <Check className="h-3 w-3 text-green-500" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
            <Badge variant={batch.active ? 'default' : 'secondary'}>
              {batch.active ? 'Active' : 'Inactive'}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Level {batch.level} {batch.level === 1 ? '(Student)' : '(Manager)'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleActive}
          >
            {batch.active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDelete(true)}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold">{stats.totalParticipants}</div>
              <p className="text-xs text-muted-foreground">Participants</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold">{stats.simulationsTotal ?? stats.assessmentsTotal}</div>
              <p className="text-xs text-muted-foreground">Simulations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold">{stats.completed}</div>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">In Progress</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold">{stats.notStarted}</div>
              <p className="text-xs text-muted-foreground">Not Started</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold">${Math.round(stats.avgRevenue).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Avg Revenue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="text-2xl font-bold">${stats.maxRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Max Revenue</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Participants Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participants ({participants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {participants.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">Name</th>
                    <th className="text-left py-3 px-2 font-medium">Email</th>
                    <th className="text-left py-3 px-2 font-medium">Joined</th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                    <th className="text-left py-3 px-2 font-medium">Stage</th>
                    <th className="text-right py-3 px-2 font-medium">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.userId} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-3 px-2 font-medium">{p.userName}</td>
                      <td className="py-3 px-2 text-muted-foreground">{p.email}</td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {new Date(p.joinedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2">{getStatusBadge(p.status)}</td>
                      <td className="py-3 px-2 text-muted-foreground font-mono text-xs">
                        {p.currentStage?.replace('STAGE_', '').replace(/_/g, ' ') || '-'}
                      </td>
                      <td className="py-3 px-2 text-right font-mono">
                        {p.revenueProjection != null ? `$${p.revenueProjection.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No participants have joined this batch yet. Share the batch code to invite participants.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Batch Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Level</label>
              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  variant={editLevel === 1 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEditLevel(1)}
                >
                  Level 1 (Student)
                </Button>
                <Button
                  type="button"
                  variant={editLevel === 2 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setEditLevel(2)}
                >
                  Level 2 (Manager)
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Batch</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-4">
            Are you sure you want to delete <strong>{batch.name}</strong> ({batch.code})?
            This action cannot be undone. All participant data will remain but the batch will be removed.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete Batch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
