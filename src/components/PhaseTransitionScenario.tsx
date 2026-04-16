'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Send, CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { PhaseScenarioOut, LeaderboardEntry } from '@/src/types'
import { RevenueSidePanel } from './RevenueSidePanel'
import { LeaderboardPanel } from './LeaderboardPanel'

interface PhaseTransitionScenarioProps {
  scenario: PhaseScenarioOut
  onSubmit: (response: string) => Promise<void>
  className?: string
  revenue?: number
  previousRevenue?: number
  leaderboardEntries?: LeaderboardEntry[]
  currentUserId?: string
}

export function PhaseTransitionScenario({
  scenario,
  onSubmit,
  className,
  revenue = 0,
  previousRevenue,
  leaderboardEntries = [],
  currentUserId
}: PhaseTransitionScenarioProps) {
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showSnapshot, setShowSnapshot] = useState(true)

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

  if (showSnapshot) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('max-w-4xl mx-auto space-y-8 py-8', className)}
      >
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight">Phase Complete!</h2>
          <p className="text-muted-foreground text-lg">Here is your snapshot report before proceeding to the next stage.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue Snapshot */}
          <div className="bg-card rounded-2xl border p-6 shadow-sm flex flex-col items-center justify-center">
            <h3 className="font-semibold text-muted-foreground uppercase tracking-widest text-xs mb-4">Current ARR</h3>
            <div className="text-5xl font-black text-green-500 mb-2">
              ${(revenue / 1000).toFixed(0)}K
            </div>
            {previousRevenue !== undefined && (
              <div className="text-sm font-medium text-muted-foreground">
                Previous: ${(previousRevenue / 1000).toFixed(0)}K
                {revenue > previousRevenue && <span className="text-green-500 ml-2">↑ Growth</span>}
              </div>
            )}
          </div>

          {/* Leaderboard Snapshot */}
          <div className="bg-card rounded-2xl border p-4 shadow-sm flex flex-col max-h-[400px]">
            <h3 className="font-semibold text-muted-foreground uppercase tracking-widest text-xs mb-4 text-center">Batch Leaderboard</h3>
            <div className="flex-1 overflow-y-auto">
              <LeaderboardPanel
                entries={leaderboardEntries}
                currentUserId={currentUserId}
                connected={true}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-6">
          <Button onClick={() => setShowSnapshot(false)} size="lg" className="gap-2 font-bold px-8">
            Face Transition Scenario <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn('max-w-2xl mx-auto space-y-6 py-8', className)}
    >
      {/* Phase transition header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center space-y-2"
      >
        <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
          Phase Transition
        </div>
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="text-xs text-primary font-medium bg-primary/10 px-3 py-1 rounded-full inline-flex items-center gap-2"
        >
          {scenario.fromStage.replace('STAGE_', '').replace(/_/g, ' ')}
          <ArrowRight className="h-3 w-3" />
          {scenario.toStage.replace('STAGE_', '').replace(/_/g, ' ')}
        </motion.div>
      </motion.div>

      {/* Leader card — slide in */}
      <motion.div
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        className="flex items-center gap-4 p-4 rounded-xl border bg-muted/30"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 300 }}
          className="h-14 w-14 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center text-xl font-bold flex-shrink-0 animate-glow-pulse"
        >
          {scenario.leaderAvatar ? (
            <img
              src={scenario.leaderAvatar}
              alt={scenario.leaderName}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            scenario.leaderName.charAt(0)
          )}
        </motion.div>
        <div>
          <div className="font-semibold">{scenario.leaderName}</div>
          <div className="text-xs text-muted-foreground">challenges you with a scenario</div>
        </div>
      </motion.div>

      {/* Scenario title */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold">{scenario.scenarioTitle}</h2>
      </motion.div>

      {/* Scenario setup */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
      >
        <div className="text-xs text-amber-700 dark:text-amber-400 font-semibold uppercase tracking-wide mb-2">
          Situation
        </div>
        <p className="text-sm leading-relaxed">{scenario.scenarioSetup}</p>
      </motion.div>

      {/* Leader prompt */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="p-4 rounded-xl border-l-4 border-primary bg-primary/5"
      >
        <div className="text-xs text-primary font-semibold uppercase tracking-wide mb-2">
          {scenario.leaderName} asks:
        </div>
        <p className="text-base font-medium leading-relaxed">{scenario.leaderPrompt}</p>
      </motion.div>

      {/* Response area */}
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.div
            key="response-form"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            <Textarea
              placeholder="Type your response here..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              rows={6}
              className="resize-none transition-all duration-300 focus:shadow-md focus:border-primary"
              disabled={loading}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{response.length} characters</span>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
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
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="submitted"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
            >
              <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto mb-2" />
            </motion.div>
            <div className="text-green-600 dark:text-green-400 font-semibold">Response submitted!</div>
            <div className="text-sm text-muted-foreground mt-1">
              Proceeding to the next phase...
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default PhaseTransitionScenario
