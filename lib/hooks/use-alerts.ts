'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/lib/hooks/use-auth'

export interface PriceAlert {
  id: string
  symbol: string
  targetPrice: number
  condition: 'above' | 'below'
  createdAt: number
  triggered: boolean
  triggeredAt?: number
}

interface AlertRow {
  id: string
  symbol: string
  target_price: number
  condition: 'above' | 'below'
  triggered: boolean
  triggered_at: string | null
  created_at: string | null
}

const STORAGE_KEY = 'stockguru-alerts'

function rowToAlert(r: AlertRow): PriceAlert {
  return {
    id: r.id,
    symbol: r.symbol,
    targetPrice: Number(r.target_price),
    condition: r.condition,
    triggered: r.triggered,
    triggeredAt: r.triggered_at ? new Date(r.triggered_at).getTime() : undefined,
    createdAt: r.created_at ? new Date(r.created_at).getTime() : Date.now(),
  }
}

function loadLocal(): PriceAlert[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveLocal(alerts: PriceAlert[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts))
}

/**
 * Price alerts with hybrid persistence:
 * - Signed in: stored in Supabase (`alerts` table, RLS by user).
 * - Guest: stored in localStorage.
 * Local alerts are migrated to the cloud once on sign-in.
 */
export function useAlerts() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const queryClient = useQueryClient()
  const [localAlerts, setLocalAlerts] = useState<PriceAlert[]>([])
  const [mounted, setMounted] = useState(false)
  const migratedFor = useRef<string | null>(null)

  useEffect(() => {
    setLocalAlerts(loadLocal())
    setMounted(true)
  }, [])

  const cloud = useQuery({
    queryKey: ['alerts', user?.id],
    enabled: isAuthenticated && !!user,
    queryFn: async (): Promise<PriceAlert[]> => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true })
      if (error) throw error
      return ((data ?? []) as AlertRow[]).map(rowToAlert)
    },
  })

  // Migrate local alerts to the cloud once after sign-in.
  useEffect(() => {
    if (!isAuthenticated || !user || migratedFor.current === user.id) return
    const local = loadLocal()
    if (local.length === 0) {
      migratedFor.current = user.id
      return
    }
    const supabase = createClient()
    ;(async () => {
      await supabase.from('alerts').insert(
        local.map((a) => ({
          user_id: user.id,
          symbol: a.symbol,
          target_price: a.targetPrice,
          condition: a.condition,
          triggered: a.triggered,
        }))
      )
      localStorage.removeItem(STORAGE_KEY)
      setLocalAlerts([])
      migratedFor.current = user.id
      queryClient.invalidateQueries({ queryKey: ['alerts', user.id] })
    })()
  }, [isAuthenticated, user, queryClient])

  const useCloud = isAuthenticated && !!user
  const alerts = useCloud ? cloud.data ?? [] : localAlerts

  const addAlert = useCallback(
    async (symbol: string, targetPrice: number, condition: 'above' | 'below') => {
      if (useCloud && user) {
        const supabase = createClient()
        await supabase.from('alerts').insert({ user_id: user.id, symbol, target_price: targetPrice, condition })
        queryClient.invalidateQueries({ queryKey: ['alerts', user.id] })
      } else {
        setLocalAlerts((prev) => {
          const next = [...prev, { id: Date.now().toString(), symbol, targetPrice, condition, createdAt: Date.now(), triggered: false }]
          saveLocal(next)
          return next
        })
      }
    },
    [useCloud, user, queryClient]
  )

  const removeAlert = useCallback(
    async (id: string) => {
      if (useCloud && user) {
        const supabase = createClient()
        await supabase.from('alerts').delete().eq('user_id', user.id).eq('id', id)
        queryClient.invalidateQueries({ queryKey: ['alerts', user.id] })
      } else {
        setLocalAlerts((prev) => {
          const next = prev.filter((a) => a.id !== id)
          saveLocal(next)
          return next
        })
      }
    },
    [useCloud, user, queryClient]
  )

  const triggerAlert = useCallback(
    async (id: string) => {
      if (useCloud && user) {
        const supabase = createClient()
        await supabase
          .from('alerts')
          .update({ triggered: true, triggered_at: new Date().toISOString() })
          .eq('user_id', user.id)
          .eq('id', id)
        queryClient.invalidateQueries({ queryKey: ['alerts', user.id] })
      } else {
        setLocalAlerts((prev) => {
          const next = prev.map((a) => (a.id === id ? { ...a, triggered: true, triggeredAt: Date.now() } : a))
          saveLocal(next)
          return next
        })
      }
    },
    [useCloud, user, queryClient]
  )

  const clearTriggered = useCallback(async () => {
    if (useCloud && user) {
      const supabase = createClient()
      await supabase.from('alerts').delete().eq('user_id', user.id).eq('triggered', true)
      queryClient.invalidateQueries({ queryKey: ['alerts', user.id] })
    } else {
      setLocalAlerts((prev) => {
        const next = prev.filter((a) => !a.triggered)
        saveLocal(next)
        return next
      })
    }
  }, [useCloud, user, queryClient])

  return {
    alerts,
    addAlert,
    removeAlert,
    triggerAlert,
    clearTriggered,
    loading: !mounted || authLoading || (useCloud && cloud.isLoading),
    isCloud: useCloud,
  }
}
