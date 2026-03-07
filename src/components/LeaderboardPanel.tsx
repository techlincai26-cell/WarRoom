'use client'

import React from 'react'
import { Trophy, Wifi, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LeaderboardEntry } from '@/src/types'

interface LeaderboardPanelProps {
  entries: LeaderboardEntry[]
  currentUserId?: string
  connected?: boolean
  updatedAt?: string | null
  className?: string
}

function formatRevenue(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`
  if (amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`
  return `$${amount}`
}

const RANK_COLORS = [
  'text-yellow-500',
  'text-slate-400',
  'text-amber-600',
]

const RANK_ICONS = ['🥇', '🥈', '🥉']

export function LeaderboardPanel({
  entries,
  currentUserId,
  connected = false,
  updatedAt,
  className,
}: LeaderboardPanelProps) {
  return (
    <div className={cn('flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/40">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          <span className="text-sm font-semibold">Live Leaderboard</span>
        </div>
        <div className={cn('flex items-center gap-1 text-xs', connected ? 'text-green-600' : 'text-muted-foreground')}>
          {connected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          {connected ? 'Live' : 'Offline'}
        </div>
      </div>

      {/* Entries */}
      <div className="flex-1 overflow-y-auto divide-y">
        {entries.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Waiting for participants...
          </div>
        ) : (
          entries.map((entry, idx) => (
            <div
              key={entry.userId}
              className={cn(
                'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                entry.userId === currentUserId && 'bg-primary/5 font-medium',
                idx === 0 && 'bg-yellow-50/50 dark:bg-yellow-900/10'
              )}
            >
              {/* Rank */}
              <div className={cn('w-6 text-center font-bold', RANK_COLORS[idx] || 'text-muted-foreground')}>
                {idx < 3 ? RANK_ICONS[idx] : `#${idx + 1}`}
              </div>

              {/* Name */}
              <div className="flex-1 truncate">
                {entry.name}
                {entry.userId === currentUserId && (
                  <span className="ml-1 text-xs text-primary">(you)</span>
                )}
              </div>

              {/* Revenue */}
              <div className={cn('font-mono font-semibold tabular-nums', RANK_COLORS[idx] || '')}>
                {formatRevenue(entry.revenueProjection)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {updatedAt && (
        <div className="px-4 py-2 text-[10px] text-muted-foreground border-t bg-muted/20 text-right">
          Updated {new Date(updatedAt).toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}

export default LeaderboardPanel
