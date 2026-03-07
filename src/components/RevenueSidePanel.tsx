'use client'

import React, { useEffect, useRef, useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RevenueSidePanelProps {
  revenue: number
  previousRevenue?: number
  currentStage: string
  className?: string
}

function formatRevenue(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(2)}M`
  } else if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`
  }
  return `$${amount.toLocaleString('en-US')}`
}

export function RevenueSidePanel({
  revenue,
  previousRevenue,
  currentStage,
  className,
}: RevenueSidePanelProps) {
  const prevRef = useRef(revenue)
  const [animating, setAnimating] = useState(false)
  const [direction, setDirection] = useState<'up' | 'down' | null>(null)

  useEffect(() => {
    if (revenue !== prevRef.current) {
      setDirection(revenue > prevRef.current ? 'up' : 'down')
      setAnimating(true)
      const t = setTimeout(() => setAnimating(false), 1500)
      prevRef.current = revenue
      return () => clearTimeout(t)
    }
  }, [revenue])

  const pct =
    previousRevenue && previousRevenue > 0
      ? Math.round(((revenue - previousRevenue) / previousRevenue) * 100)
      : null

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-start gap-4 p-4 rounded-xl border bg-card shadow-sm',
        className
      )}
    >
      <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
        Projected ARR
      </div>

      <div
        className={cn(
          'flex flex-col items-center transition-all duration-700',
          animating && direction === 'up' && 'scale-110 text-green-600',
          animating && direction === 'down' && 'scale-95 text-red-500'
        )}
      >
        <div className="text-3xl font-bold font-mono leading-tight">
          {formatRevenue(revenue)}
        </div>
        {pct !== null && (
          <div
            className={cn(
              'flex items-center gap-1 text-sm font-medium mt-1',
              pct >= 0 ? 'text-green-600' : 'text-red-500'
            )}
          >
            {pct >= 0 ? (
              <TrendingUp className="h-3 w-3" />
            ) : (
              <TrendingDown className="h-3 w-3" />
            )}
            {pct >= 0 ? '+' : ''}
            {pct}% from last phase
          </div>
        )}
      </div>

      <div className="w-full border-t pt-3 space-y-2">
        <div className="text-xs text-muted-foreground text-center">Current Stage</div>
        <div className="text-xs font-medium text-center bg-muted px-2 py-1 rounded">
          {currentStage.replace('STAGE_', '').replace(/_/g, ' ')}
        </div>
      </div>

      <div className="w-full border-t pt-3">
        <div className="text-[10px] text-muted-foreground text-center leading-relaxed">
          Revenue updates after each phase submission
        </div>
      </div>
    </div>
  )
}

export default RevenueSidePanel
