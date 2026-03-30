'use client'

import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, ChevronRight, ChevronLeft } from 'lucide-react'
import { CharacterPicker } from './CharacterPicker'
import api from '@/src/lib/api'
import type { Mentor, Leader, Investor } from '@/src/types'

interface StartSimulationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (assessmentId: string) => void
}

type Step = 'idea' | 'level'

export function StartSimulationDialog({
  open,
  onOpenChange,
  onCreated,
}: StartSimulationDialogProps) {
  const [step, setStep] = useState<Step>('idea')
  const [idea, setIdea] = useState('')
  const [level, setLevel] = useState<1 | 2>(1)

  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const reset = () => {
    setStep('idea')
    setIdea('')
    setLevel(1)
    setError('')
  }

  const handleOpenChange = (v: boolean) => {
    if (!v) reset()
    onOpenChange(v)
  }

  const handleCreateSimulation = async () => {
    setCreating(true)
    setError('')
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      const batchCode = user?.batchCode || ''

      const simulation = await api.assessments.create({
        level,
        userIdea: idea.trim() || undefined,
        batchCode,
        // Characters are now selected later in the flow
        selectedMentors: [],
        selectedLeaders: [],
        selectedInvestors: [],
      })

      reset()
      onCreated(simulation.id)
    } catch (err: any) {
      setError(err.message || 'Failed to create simulation')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Start New Simulation</DialogTitle>
          <DialogDescription>
            {step === 'idea' && 'Describe your business idea'}
            {step === 'level' && 'Choose your experience level'}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 py-2">
          {(['idea', 'level'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div
                className={`h-2 w-2 rounded-full ${
                  step === s
                    ? 'bg-primary'
                    : step === 'level' && i === 0
                    ? 'bg-primary/60'
                    : 'bg-muted-foreground/20'
                }`}
              />
              {i < 1 && <div className="flex-1 h-0.5 bg-muted" />}
            </React.Fragment>
          ))}
        </div>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
            {error}
          </div>
        )}

        {/* Step: Idea */}
        {step === 'idea' && (
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-2 block">
                What&apos;s your business idea?
              </label>
              <Textarea
                placeholder="Describe your business idea in a few sentences. What problem does it solve? Who is it for?"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can leave this blank and describe your idea during the simulation.
              </p>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep('level')}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: Level */}
        {step === 'level' && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => setLevel(1)}
                className={`p-6 rounded-xl border-2 text-left space-y-2 transition-all ${
                  level === 1
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-lg font-bold">Level 1</div>
                <Badge variant="secondary">Student / Fresher</Badge>
                <div className="text-sm text-muted-foreground">
                  Early-stage entrepreneur or student exploring business for the first time.
                </div>
              </button>
              <button
                onClick={() => setLevel(2)}
                className={`p-6 rounded-xl border-2 text-left space-y-2 transition-all ${
                  level === 2
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-lg font-bold">Level 2</div>
                <Badge variant="secondary">Manager / Professional</Badge>
                <div className="text-sm text-muted-foreground">
                  Experienced professional or manager with prior business exposure.
                </div>
              </button>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('idea')}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button onClick={handleCreateSimulation} disabled={creating}>
                {creating ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
                ) : (
                  <>Start Simulation <ChevronRight className="h-4 w-4 ml-1" /></>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default StartSimulationDialog

