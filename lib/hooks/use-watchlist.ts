'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { PLAN_LIMITS } from '@/lib/hooks/use-subscription'
import { effectivePlan } from '@/lib/subscription/plan-utils'

export interface WatchlistItemCloud {
  id: string
  symbol: string
  notes?: string
  addedAt: string
}

const STORAGE_KEY = 'stockguru-watchlist'

function loadLocalWatchlist(): WatchlistItemCloud[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: Array<Record<string, unknown>> = JSON.parse(raw)
    return parsed.map((item) => ({
      id: String(item.id ?? crypto.randomUUID()),
      symbol: String(item.symbol),
      notes: item.notes ? String(item.notes) : undefined,
      addedAt: item.addedAt ? new Date(Number(item.addedAt)).toISOString() : new Date().toISOString(),
    }))
  } catch {
    return []
  }
}

function saveLocalWatchlist(items: WatchlistItemCloud[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      items.map((i) => ({
        id: i.id,
        symbol: i.symbol,
        notes: i.notes,
        addedAt: new Date(i.addedAt).getTime(),
      }))
    )
  )
}

export function useWatchlist() {
  const [items, setItems] = useState<WatchlistItemCloud[]>([])
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

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event: string, session: { user: User | null } | null) => {
        setUser(session?.user ?? null)
        setIsAuthenticated(!!session?.user)
      }
    )

    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (!isAuthenticated) {
      setItems(loadLocalWatchlist())
      setIsLoading(false)
      return
    }

    const fetchWatchlist = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('watchlists')
        .select('*')
        .order('added_at', { ascending: false })

      const { data: subData } = await supabase
        .from('subscriptions')
        .select('plan, status')
        .eq('user_id', user!.id)
        .single()

      setPlan(effectivePlan(subData?.plan, subData?.status))

      if (error) {
        console.error('Failed to fetch watchlist:', error)
        setItems(loadLocalWatchlist())
      } else {
        setItems(
          (data ?? []).map((row: Record<string, unknown>) => ({
            id: String(row.id),
            symbol: String(row.symbol),
            notes: row.notes ? String(row.notes) : undefined,
            addedAt: String(row.added_at),
          }))
        )
      }
      setIsLoading(false)
    }

    fetchWatchlist()
  }, [isAuthenticated, supabase, user])

  const watchlistLimit = PLAN_LIMITS[plan]?.watchlist ?? PLAN_LIMITS.free.watchlist

  const addWatchlistItem = useCallback(
    async (symbol: string, notes?: string) => {
      if (items.length >= watchlistLimit) {
        throw new Error(`Watchlist เต็มแล้ว (สูงสุด ${watchlistLimit} หุ้น) กรุณาอัพเกรดแผน`)
      }

      if (!isAuthenticated || !user) {
        const newItem: WatchlistItemCloud = {
          id: crypto.randomUUID(),
          symbol,
          notes,
          addedAt: new Date().toISOString(),
        }
        const next = [...items, newItem]
        saveLocalWatchlist(next)
        setItems(next)
        return
      }

      const { data, error } = await supabase
        .from('watchlists')
        .insert({ user_id: user.id, symbol, notes })
        .select()
        .single()

      if (error) {
        console.error('Failed to add watchlist item:', error)
        throw error
      }

      if (data) {
        const newItem: WatchlistItemCloud = {
          id: String(data.id),
          symbol: String(data.symbol),
          notes: data.notes ? String(data.notes) : undefined,
          addedAt: String(data.added_at),
        }
        setItems((prev) => [...prev, newItem])
      }
    },
    [isAuthenticated, user, items, supabase, watchlistLimit]
  )

  const removeWatchlistItem = useCallback(
    async (symbol: string) => {
      if (!isAuthenticated || !user) {
        const next = items.filter((i) => i.symbol !== symbol)
        saveLocalWatchlist(next)
        setItems(next)
        return
      }

      const { error } = await supabase
        .from('watchlists')
        .delete()
        .eq('user_id', user.id)
        .eq('symbol', symbol)

      if (error) {
        console.error('Failed to remove watchlist item:', error)
        throw error
      }

      setItems((prev) => prev.filter((i) => i.symbol !== symbol))
    },
    [isAuthenticated, user, items, supabase]
  )

  const isInWatchlist = useCallback(
    (symbol: string) => items.some((i) => i.symbol === symbol),
    [items]
  )

  return {
    watchlist: items,
    isLoading,
    isAuthenticated,
    watchlistLimit,
    addWatchlistItem,
    removeWatchlistItem,
    isInWatchlist,
  }
}
