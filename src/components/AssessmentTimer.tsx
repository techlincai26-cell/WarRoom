'use client'

import { useState, useEffect, useRef } from 'react'

export interface AssessmentTimerProps {
    assessmentId: string
    globalStartTime: string | undefined // ISO string
    stageId: string | undefined
    durationMinutes: number | undefined
    onTimeUp: () => void
    theme: { accent: string }
}

export default function AssessmentTimer({
    assessmentId,
    globalStartTime,
    stageId,
    durationMinutes,
    onTimeUp,
    theme,
}: AssessmentTimerProps) {
    const [globalElapsedStr, setGlobalElapsedStr] = useState('00:00:00')
    const [stageRemainingStr, setStageRemainingStr] = useState('00:00')
    const [isWarning, setIsWarning] = useState(false)

    const onTimeUpRef = useRef(onTimeUp)
    useEffect(() => {
        onTimeUpRef.current = onTimeUp
    }, [onTimeUp])

    // 1. Global Timer (count up)
    useEffect(() => {
        if (!globalStartTime) return

        const start = new Date(globalStartTime).getTime()
        const interval = setInterval(() => {
            const now = Date.now()
            const diff = Math.max(0, now - start)

            const hours = Math.floor(diff / 3600000)
            const mins = Math.floor((diff % 3600000) / 60000)
            const secs = Math.floor((diff % 60000) / 1000)

            setGlobalElapsedStr(
                `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
            )
        }, 1000)

        return () => clearInterval(interval)
    }, [globalStartTime])

    // 2. Stage Timer (count down)
    useEffect(() => {
        if (!stageId || durationMinutes === undefined || durationMinutes <= 0) {
            setStageRemainingStr('--:--')
            setIsWarning(false)
            return
        }

        const storageKey = `timer_${assessmentId}_${stageId}`
        let startTime = parseInt(localStorage.getItem(storageKey) || '0', 10)

        if (!startTime) {
            startTime = Date.now()
            localStorage.setItem(storageKey, startTime.toString())
        }

        const durationMs = durationMinutes * 60 * 1000

        const interval = setInterval(() => {
            const now = Date.now()
            const elapsed = now - startTime
            const remaining = Math.max(0, durationMs - elapsed)

            if (remaining <= 0) {
                setStageRemainingStr('00:00')
                setIsWarning(true)
                clearInterval(interval)
                onTimeUpRef.current()
                return
            }

            const mins = Math.floor(remaining / 60000)
            const secs = Math.floor((remaining % 60000) / 1000)
            setStageRemainingStr(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`)

            if (remaining < 60000) {
                setIsWarning(true)
            } else {
                setIsWarning(false)
            }

        }, 1000)

        return () => clearInterval(interval)
    }, [stageId, durationMinutes, assessmentId])

    if (!globalStartTime || !durationMinutes) return null

    return (
        <div className="assessment-timer">
            <div className="global-timer" title="Total Running Time">
                ⏱ {globalElapsedStr}
            </div>
            <div
                className={`stage-timer ${isWarning ? 'warning' : ''}`}
                style={{ color: isWarning ? '#ef4444' : theme.accent }}
                title="Stage Time Remaining"
            >
                {stageRemainingStr}
            </div>

            <style jsx>{`
        .assessment-timer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
          font-family: inherit;
          font-size: 1.1rem;
          font-weight: 700;
          background: rgba(0, 0, 0, 0.2);
          padding: 0.6rem 1.2rem;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          margin-top: 0.8rem;
        }
        .global-timer {
          color: #9ca3af;
          font-size: 0.95rem;
          font-family: monospace;
        }
        .stage-timer {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-family: monospace;
          letter-spacing: 1px;
        }
        .stage-timer::before {
          content: '⌛';
          font-size: 1rem;
          filter: grayscale(100%) brightness(200%);
        }
        .stage-timer.warning {
          animation: pulse 1.5s infinite;
        }
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }
      `}</style>
        </div>
    )
}
