'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { PLAN_LIMITS } from '@/lib/hooks/use-subscription'
import { effectivePlan } from '@/lib/subscription/plan-utils'
import type { AlertChannel, AlertType, SmartAlert, PushSubscription } from '@/lib/alerts/types'

export interface PriceAlert {
  id: string
  symbol: string
  type: AlertType
  targetPrice: number
  condition: 'above' | 'below'
  triggered: boolean
  triggeredAt?: string
  notificationChannels: AlertChannel[]
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
      type: (String(item.type ?? 'price') as AlertType),
      condition: String(item.condition) as 'above' | 'below',
      triggered: Boolean(item.triggered ?? false),
      triggeredAt: item.triggeredAt ? String(item.triggeredAt) : item.triggered_at ? String(item.triggered_at) : undefined,
      notificationChannels: Array.isArray(item.notificationChannels) ? item.notificationChannels as AlertChannel[] : ['email'],
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
        type: a.type,
        condition: a.condition,
        triggered: a.triggered,
        triggeredAt: a.triggeredAt,
        notificationChannels: a.notificationChannels,
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
            type: String(row.type ?? 'price') as AlertType,
            condition: String(row.condition) as 'above' | 'below',
            triggered: Boolean(row.triggered ?? false),
            triggeredAt: row.triggered_at ? String(row.triggered_at) : undefined,
            notificationChannels: Array.isArray(row.notification_channels)
              ? (row.notification_channels as AlertChannel[])
              : ['email'],
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
    async (symbol: string, targetPrice: number, condition: 'above' | 'below', options: {
      type?: AlertType
      notificationChannels?: AlertChannel[]
    } = {}) => {
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
          type: options.type ?? 'price',
          target_price: targetPrice,
          condition,
          notification_channels: options.notificationChannels ?? ['email'],
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
          type: data.type as AlertType,
          condition: data.condition as 'above' | 'below',
          triggered: data.triggered ?? false,
          triggeredAt: data.triggered_at,
          notificationChannels: Array.isArray(data.notification_channels) ? data.notification_channels as AlertChannel[] : ['email'],
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

  const registerPushSubscription = useCallback(async (subscription: PushSubscription) => {
    const res = await fetch('/api/alerts/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? 'ไม่สามารถเปิดการแจ้งเตือนแบบ push ได้')
    }
  }, [])

  const unregisterPushSubscription = useCallback(async (subscription: PushSubscription) => {
    const res = await fetch('/api/alerts/push/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? 'ไม่สามารถปิดการแจ้งเตือนแบบ push ได้')
    }
  }, [])

  return { alerts, isLoading, isAuthenticated, alertsLimit, addAlert, removeAlert, clearTriggered, registerPushSubscription, unregisterPushSubscription }
}
