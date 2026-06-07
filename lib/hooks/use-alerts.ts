'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { PLAN_LIMITS } from '@/lib/hooks/use-subscription'
import { effectivePlan } from '@/lib/subscription/plan-utils'

export interface PriceAlert {
  id: string
  symbol: string
  targetPrice: number
  condition: 'above' | 'below'
  triggered: boolean
  triggeredAt?: string
  createdAt: string
}

const STORAGE_KEY = 'stockguru-alerts'

function loadLocalAlerts(): PriceAlert[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: Array<Record<string, unknown>> = JSON.parse(raw)
    return parsed.map((item) => ({
      id: String(item.id ?? crypto.randomUUID()),
      symbol: String(item.symbol),
      targetPrice: Number(item.targetPrice ?? item.target_price),
      condition: String(item.condition) as 'above' | 'below',
      triggered: Boolean(item.triggered ?? false),
      triggeredAt: item.triggeredAt ? String(item.triggeredAt) : item.triggered_at ? String(item.triggered_at) : undefined,
      createdAt: item.createdAt ? new Date(Number(item.createdAt)).toISOString() : new Date().toISOString(),
    }))
  } catch {
    return []
  }
}

function saveLocalAlerts(alerts: PriceAlert[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      alerts.map((a) => ({
        id: a.id,
        symbol: a.symbol,
        targetPrice: a.targetPrice,
        condition: a.condition,
        triggered: a.triggered,
        triggeredAt: a.triggeredAt,
        createdAt: new Date(a.createdAt).getTime(),
      }))
    )
  )
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [plan, setPlan] = useState<'free' | 'pro' | 'founding_pro' | 'trader'>('free')

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setIsAuthenticated(!!data.user)
    }
    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, session: { user: User | null } | null) => {
      setUser(session?.user ?? null)
      setIsAuthenticated(!!session?.user)
    })

    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (!isAuthenticated) {
      setAlerts([])
      setIsLoading(false)
      return
    }

    const fetchAlerts = async () => {
      setIsLoading(true)

      const { data: subData } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', user!.id)
        .single()

      setPlan(effectivePlan(subData?.plan, subData?.status))

      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch alerts:', error)
        setAlerts(loadLocalAlerts())
      } else {
        setAlerts(
          (data ?? []).map((row: Record<string, unknown>) => ({
            id: String(row.id),
            symbol: String(row.symbol),
            targetPrice: Number(row.target_price),
            condition: String(row.condition) as 'above' | 'below',
            triggered: Boolean(row.triggered ?? false),
            triggeredAt: row.triggered_at ? String(row.triggered_at) : undefined,
            createdAt: String(row.created_at),
          }))
        )
      }
      setIsLoading(false)
    }

    fetchAlerts()
  }, [isAuthenticated, supabase, user])

  const alertsLimit = PLAN_LIMITS[plan]?.alerts ?? PLAN_LIMITS.free.alerts

  const addAlert = useCallback(
    async (symbol: string, targetPrice: number, condition: 'above' | 'below') => {
      if (!isAuthenticated || !user) {
        throw new Error('กรุณาเข้าสู่ระบบเพื่อตั้งการแจ้งเตือน — แจ้งเตือนจะส่งทางอีเมลเมื่อราคาแตะเป้า')
      }

      if (alerts.length >= alertsLimit) {
        throw new Error(`ถึงขีดจำกัดการแจ้งเตือนแล้ว (${alertsLimit} รายการ) กรุณาอัพเกรดแผน`)
      }

      const { data, error } = await supabase
        .from('alerts')
        .insert({
          user_id: user.id,
          symbol,
          target_price: targetPrice,
          condition,
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to add alert:', error)
        throw error
      }

      if (data) {
        const newAlert: PriceAlert = {
          id: data.id,
          symbol: data.symbol,
          targetPrice: Number(data.target_price),
          condition: data.condition as 'above' | 'below',
          triggered: data.triggered ?? false,
          triggeredAt: data.triggered_at,
          createdAt: data.created_at,
        }
        setAlerts((prev) => [...prev, newAlert])
      }
    },
    [isAuthenticated, user, alerts, supabase, alertsLimit]
  )

  const removeAlert = useCallback(
    async (id: string) => {
      if (!isAuthenticated || !user) return

      const { error } = await supabase.from('alerts').delete().eq('id', id)

      if (error) {
        console.error('Failed to remove alert:', error)
        throw error
      }

      setAlerts((prev) => prev.filter((a) => a.id !== id))
    },
    [isAuthenticated, user, supabase]
  )

  const clearTriggered = useCallback(async () => {
    if (!isAuthenticated || !user) return

    const triggeredIds = alerts.filter((a) => a.triggered).map((a) => a.id)
    if (triggeredIds.length === 0) return

    const { error } = await supabase.from('alerts').delete().in('id', triggeredIds)

    if (error) {
      console.error('Failed to clear triggered alerts:', error)
      throw error
    }

    setAlerts((prev) => prev.filter((a) => !a.triggered))
  }, [isAuthenticated, user, alerts, supabase])

  return { alerts, isLoading, isAuthenticated, alertsLimit, addAlert, removeAlert, clearTriggered }
}
