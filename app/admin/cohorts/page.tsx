'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import api from '@/src/lib/api'
import type { AdminBatch, CreateBatchRequest } from '@/src/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Search, Users, Calendar, Hash, Copy, Check } from 'lucide-react'

export default function CohortsPage() {
  const [batches, setBatches] = useState<AdminBatch[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  // Create form
  const [newCode, setNewCode] = useState('')
  const [newName, setNewName] = useState('')
  const [newLevel, setNewLevel] = useState(1)

  const fetchBatches = useCallback(async () => {
    try {
      const data = await api.admin.listBatches()
      setBatches(data)
    } catch (err) {
      console.error('Failed to fetch batches:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBatches()
  }, [fetchBatches])

  const handleCreate = async () => {
    if (!newCode.trim() || !newName.trim()) {
      setCreateError('Code and name are required')
      return
    }
    setCreating(true)
    setCreateError('')
    try {
      const req: CreateBatchRequest = {
        code: newCode.trim().toUpperCase(),
        name: newName.trim(),
        level: newLevel,
      }
      await api.admin.createBatch(req)
      setShowCreate(false)
      setNewCode('')
      setNewName('')
      setNewLevel(1)
      fetchBatches()
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create batch')
    } finally {
      setCreating(false)
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const toggleActive = async (batch: AdminBatch) => {
    try {
      await api.admin.updateBatch(batch.id, { active: !batch.active })
      fetchBatches()
    } catch (err) {
      console.error('Failed to toggle batch:', err)
    }
  }

  const filteredBatches = batches.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.code.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">Loading batches...</p>
      </div>
    )
  }

  return (
    <div className="py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Batch Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage assessment batches</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Batch
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{batches.length}</div>
            <p className="text-xs text-muted-foreground">Total Batches</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{batches.filter(b => b.active).length}</div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{batches.reduce((sum, b) => sum + b.participantCount, 0)}</div>
            <p className="text-xs text-muted-foreground">Total Participants</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{batches.filter(b => !b.active).length}</div>
            <p className="text-xs text-muted-foreground">Inactive</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
        <Input
          placeholder="Search batches by name or code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Batches Grid */}
      {filteredBatches.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredBatches.map((batch) => (
            <Card key={batch.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="text-lg truncate">{batch.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => handleCopyCode(batch.code)}
                        className="flex items-center gap-1 font-mono text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Hash className="h-3 w-3" />
                        {batch.code}
                        {copiedCode === batch.code ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Badge
                    variant={batch.active ? 'default' : 'secondary'}
                    className="cursor-pointer"
                    onClick={() => toggleActive(batch)}
                  >
                    {batch.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{batch.participantCount} participants</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{new Date(batch.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Level {batch.level} {batch.level === 1 ? '(Student)' : '(Manager)'}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <Link href={`/admin/cohorts/${batch.id}`}>View Details</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {searchQuery ? 'No batches match your search.' : 'No batches created yet.'}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowCreate(true)}>Create First Batch</Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {createError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
                {createError}
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Batch Code</label>
              <Input
                placeholder="e.g. SPRING2025A"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                className="mt-1 font-mono"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Participants will use this code to join. Must be unique.
              </p>
            </div>
            <div>
              <label className="text-sm font-medium">Batch Name</label>
              <Input
                placeholder="e.g. Spring 2025 Cohort A"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Level</label>
              <div className="flex gap-2 mt-1">
                <Button
                  type="button"
                  variant={newLevel === 1 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewLevel(1)}
                >
                  Level 1 (Student)
                </Button>
                <Button
                  type="button"
                  variant={newLevel === 2 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewLevel(2)}
                >
                  Level 2 (Manager)
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating...' : 'Create Batch'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}