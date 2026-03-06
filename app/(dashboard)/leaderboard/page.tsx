'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LeaderboardPanel } from '@/src/components/LeaderboardPanel'
import { useLeaderboard } from '@/src/hooks/useLeaderboard'
import { ArrowLeft, Trophy } from 'lucide-react'

export default function LeaderboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string; id?: string } | null>(null)
  const [batch, setBatch] = useState<{ code: string; name: string } | null>(null)

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null')
    const storedBatch = JSON.parse(localStorage.getItem('batch') || 'null')
    if (!storedUser) {
      router.push('/login')
      return
    }
    setUser(storedUser)
    setBatch(storedBatch)
  }, [router])

  const { entries, connected, updatedAt } = useLeaderboard(batch?.code)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-card/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span className="font-semibold">Live Batch Leaderboard</span>
            {batch && (
              <Badge variant="outline" className="text-xs ml-1">
                {batch.code}
              </Badge>
            )}
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {batch ? (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold">{batch.name || batch.code}</h1>
              <p className="text-muted-foreground text-sm mt-1">
                {connected ? '● Live updates active' : '○ Reconnecting...'}
              </p>
            </div>

            <LeaderboardPanel
              entries={entries}
              currentUserId={user?.id}
              connected={connected}
              updatedAt={updatedAt}
              className="w-full min-h-[400px]"
            />

            <p className="text-xs text-muted-foreground text-center mt-4">
              Rankings are based on projected annual revenue calculated from your assessment decisions.
            </p>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p>No batch associated with your account.</p>
            <p className="text-sm mt-1">Sign in with a batch code to see live rankings.</p>
          </div>
        )}
      </div>
    </div>
  )
}
