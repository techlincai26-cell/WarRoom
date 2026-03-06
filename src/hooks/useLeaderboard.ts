'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import type { LeaderboardEntry } from '@/src/types'

const WS_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api').replace(/^http/, 'ws')

export interface LeaderboardState {
  entries: LeaderboardEntry[]
  updatedAt: string | null
  connected: boolean
  error: string | null
}

export function useLeaderboard(batchCode: string | null | undefined): LeaderboardState {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [updatedAt, setUpdatedAt] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const connect = useCallback(() => {
    if (!batchCode || !mountedRef.current) return

    const url = `${WS_BASE}/batches/${batchCode}/live`

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        if (mountedRef.current) {
          setConnected(true)
          setError(null)
        }
      }

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'leaderboard' && mountedRef.current) {
            setEntries(data.entries || [])
            setUpdatedAt(data.updatedAt || null)
          }
        } catch {
          // invalid JSON — ignore
        }
      }

      ws.onclose = () => {
        if (mountedRef.current) {
          setConnected(false)
          // Reconnect after 5 seconds
          reconnectTimeoutRef.current = setTimeout(() => {
            if (mountedRef.current) connect()
          }, 5000)
        }
      }

      ws.onerror = () => {
        if (mountedRef.current) {
          setError('Connection error')
          setConnected(false)
        }
      }
    } catch (e) {
      setError('Failed to connect to leaderboard')
    }
  }, [batchCode])

  useEffect(() => {
    mountedRef.current = true
    connect()

    return () => {
      mountedRef.current = false
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      if (wsRef.current) {
        wsRef.current.onclose = null
        wsRef.current.close()
      }
    }
  }, [connect])

  return { entries, updatedAt, connected, error }
}
