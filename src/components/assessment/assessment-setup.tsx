'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Lightbulb, ArrowRight } from 'lucide-react'
import PanelSelection from './panel-selection'

interface AssessmentSetupProps {
  onComplete: (data: { pitchTarget: string; userIdea: string; selectedPanelists: string[] }) => void
  initialData?: {
    pitchTarget?: string
    userIdea?: string
    selectedPanelists?: string[]
  }
}

export default function AssessmentSetup({ onComplete, initialData }: AssessmentSetupProps) {
  // pitchTarget is no longer selected by user, defaulting to 'vc' or generic
  const [pitchTarget] = useState<string>('vc') 
  const [userIdea, setUserIdea] = useState<string>(initialData?.userIdea || '')
  const [selectedPanelists, setSelectedPanelists] = useState<string[]>(initialData?.selectedPanelists || [])

  const [step, setStep] = useState<1 | 2>(() => {
    if (!initialData?.selectedPanelists || initialData.selectedPanelists.length === 0) return 1
    // If panels selected, go straight to idea (step 2)
    return 2
  })

  const handlePanelSelectionComplete = (panelists: string[]) => {
    setSelectedPanelists(panelists)
    setStep(2)
  }

  const handleNext = () => {
    if (step === 2 && userIdea.trim().length > 10) {
      onComplete({ pitchTarget, userIdea, selectedPanelists })
    }
  }

  if (step === 1) {
    return <PanelSelection onComplete={handlePanelSelectionComplete} />
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Setup Your War Room</h1>
        <p className="text-muted-foreground">
          Step {step} of 2: Your Big Idea
        </p>
      </div>

      <div className="grid gap-8">
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">What is your Big Idea?</h2>
                  <p className="text-sm text-muted-foreground">Describe your business concept, problem, and solution briefly.</p>
                </div>
              </div>

              <div className="space-y-4">
                <Textarea
                  placeholder="e.g., A subscription-based meal kit service for elderly people with specific dietary restrictions..."
                  className="min-h-[150px] text-lg resize-none"
                  value={userIdea}
                  onChange={(e) => setUserIdea(e.target.value)}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {userIdea.length} characters
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        <div className="flex justify-end pt-4">
          <Button
            size="lg"
            onClick={handleNext}
            disabled={userIdea.trim().length < 10}
            className="w-full sm:w-auto"
          >
            Enter the War Room
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
