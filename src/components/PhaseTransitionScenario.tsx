'use client'

import React, { useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { PhaseScenarioOut } from '@/src/types'

interface PhaseTransitionScenarioProps {
  scenario: PhaseScenarioOut
  onSubmit: (response: string) => Promise<void>
  className?: string
}

export function PhaseTransitionScenario({
  scenario,
  onSubmit,
  className,
}: PhaseTransitionScenarioProps) {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!response.trim() || loading) return
    setLoading(true)
    try {
      await onSubmit(response.trim())
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('max-w-2xl mx-auto space-y-6 py-8', className)}>
      {/* Phase transition header */}
      <div className="text-center space-y-2">
        <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
          Phase Transition
        </div>
        <div className="text-xs text-primary font-medium bg-primary/10 px-3 py-1 rounded-full inline-block">
          {scenario.fromStage.replace('STAGE_', '').replace(/_/g, ' ')} →{' '}
          {scenario.toStage.replace('STAGE_', '').replace(/_/g, ' ')}
        </div>
      </div>

      {/* Leader card */}
      <div className="flex items-center gap-4 p-4 rounded-xl border bg-muted/30">
        <div className="h-14 w-14 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-xl font-bold flex-shrink-0">
          {scenario.leaderAvatar ? (
            <img
              src={scenario.leaderAvatar}
              alt={scenario.leaderName}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            scenario.leaderName.charAt(0)
          )}
        </div>
        <div>
          <div className="font-semibold">{scenario.leaderName}</div>
          <div className="text-xs text-muted-foreground">challenges you with a scenario</div>
        </div>
      </div>

      {/* Scenario title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">{scenario.scenarioTitle}</h2>
      </div>

      {/* Scenario setup */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold uppercase tracking-wide mb-2">
          Situation
        </div>
        <p className="text-sm leading-relaxed">{scenario.scenarioSetup}</p>
      </div>

      {/* Leader prompt */}
      <div className="p-4 rounded-xl border-l-4 border-primary bg-primary/5">
        <div className="text-xs text-primary font-semibold uppercase tracking-wide mb-2">
          {scenario.leaderName} asks:
        </div>
        <p className="text-base font-medium leading-relaxed">{scenario.leaderPrompt}</p>
      </div>

      {/* Response area */}
      {!submitted ? (
        <div className="space-y-3">
          <Textarea
            placeholder="Type your response here..."
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={6}
            className="resize-none"
            disabled={loading}
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{response.length} characters</span>
            <Button onClick={handleSubmit} disabled={!response.trim() || loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Response
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
          <div className="text-green-600 dark:text-green-400 font-semibold">Response submitted!</div>
          <div className="text-sm text-muted-foreground mt-1">
            Proceeding to the next phase...
          </div>
        </div>
      )}
    </div>
  )
}

export default PhaseTransitionScenario
