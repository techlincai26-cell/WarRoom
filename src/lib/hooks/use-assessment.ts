'use client';

import { useState, useCallback, useEffect } from 'react'
import api from '@/src/lib/api'
import type {
  AssessmentState,
  SimQuestion,
  SubmitResponseResult,
  ResponseData,
} from '@/src/types'

/**
 * Legacy hook — the main assessment page now manages its own state inline.
 * This hook is kept for backward compatibility with any remaining pages.
 */
export function useAssessment(assessmentId: string) {
  const [state, setState] = useState<AssessmentState | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      try {
        const data = await api.assessments.get(assessmentId)
        setState(data)
      } catch (err) {
        console.error('Error loading assessment:', err)
      } finally {
        setIsLoading(false)
      }
    }
    if (assessmentId) load()
  }, [assessmentId])

  const submitAnswer = useCallback(
    async (questionId: string, responseData: ResponseData) => {
      const result = await api.assessments.submitResponse(assessmentId, {
        questionId,
        responseData,
      })
      // Reload state after submitting
      const updated = await api.assessments.get(assessmentId)
      setState(updated)
      return result
    },
    [assessmentId]
  )

  return {
    state,
    isLoading,
    assessment: state?.assessment ?? null,
    currentQuestion: state?.currentQuestion ?? null,
    progress: state?.progress ?? null,
    competencies: state?.competencies ?? [],
    submitAnswer,
  }
}
