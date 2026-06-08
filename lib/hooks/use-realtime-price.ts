'use client'

import { useEffect, useState } from 'react'

export interface RealtimeTick {
  type: 'price'
  symbol: string
  price: number
  timestamp: number
  volume?: number
  source: 'finnhub' | 'yahoo'
  market: 'US' | 'SET' | 'GLOBAL'
}

type ConnectionState = 'idle' | 'connecting' | 'open' | 'error' | 'closed'

interface RealtimeState {
  tick: RealtimeTick | null
  status: ConnectionState
  error: string | null
}

export function useRealtimePrice(symbol: string | null, enabled = true): RealtimeState {
  const [tick, setTick] = useState<RealtimeTick | null>(null)
  const [status, setStatus] = useState<ConnectionState>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!symbol || !enabled) {
      setStatus('idle')
      setTick(null)
      setError(null)
      return
    }

    setStatus('connecting')
    setError(null)

    const stream = new EventSource(`/api/stock/realtime?symbol=${encodeURIComponent(symbol)}`)

    stream.onopen = () => {
      setStatus('open')
      setError(null)
    }

    stream.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data)
        if (payload.type === 'price') {
          setTick(payload)
        }
      } catch (err) {
        setError((err as Error).message)
      }
    }

    stream.onerror = () => {
      setStatus('error')
      setError('ไม่สามารถเชื่อมต่อข้อมูล realtime ได้')
      stream.close()
    }

    return () => {
      stream.close()
      setStatus('closed')
    }
  }, [enabled, symbol])

  return { tick, status, error }
}
