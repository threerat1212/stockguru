'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export interface Holding {
  id: string
  symbol: string
  quantity: number
  buyPrice: number
  currency: string
  createdAt: string
}

const STORAGE_KEY = 'stockguru-portfolio'

function loadLocalHoldings(): Holding[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: Array<Record<string, unknown>> = JSON.parse(raw)
    return parsed.map((item) => ({
      id: String(item.id ?? crypto.randomUUID()),
      symbol: String(item.symbol),
      quantity: Number(item.quantity),
      buyPrice: Number(item.buyPrice),
      currency: String(item.currency ?? 'THB'),
      createdAt: item.addedAt ? new Date(Number(item.addedAt)).toISOString() : new Date().toISOString(),
    }))
  } catch {
    return []
  }
}

function saveLocalHoldings(items: Holding[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.map(h => ({
    id: h.id,
    symbol: h.symbol,
    quantity: h.quantity,
    buyPrice: h.buyPrice,
    currency: h.currency,
    addedAt: new Date(h.createdAt).getTime(),
  }))))
}

export function useHoldings() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

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
      setHoldings(loadLocalHoldings())
      setIsLoading(false)
      return
    }

    const fetchHoldings = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('holdings')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Failed to fetch holdings:', error)
        setHoldings(loadLocalHoldings())
      } else {
        setHoldings(
          (data ?? []).map((row: Record<string, unknown>) => ({
            id: String(row.id),
            symbol: String(row.symbol),
            quantity: Number(row.quantity),
            buyPrice: Number(row.buy_price),
            currency: String(row.currency ?? 'THB'),
            createdAt: String(row.created_at),
          }))
        )
      }
      setIsLoading(false)
    }

    fetchHoldings()
  }, [isAuthenticated, supabase])

  const addHolding = useCallback(
    async (symbol: string, quantity: number, buyPrice: number, currency = 'THB') => {
      if (!isAuthenticated || !user) {
        const newHolding: Holding = {
          id: crypto.randomUUID(),
          symbol,
          quantity,
          buyPrice,
          currency,
          createdAt: new Date().toISOString(),
        }
        const next = [...holdings, newHolding]
        saveLocalHoldings(next)
        setHoldings(next)
        return
      }

      const { data, error } = await supabase
        .from('holdings')
        .insert({
          user_id: user.id,
          symbol,
          quantity,
          buy_price: buyPrice,
          currency,
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to add holding:', error)
        throw error
      }

      if (data) {
        const newHolding: Holding = {
          id: data.id,
          symbol: data.symbol,
          quantity: data.quantity,
          buyPrice: Number(data.buy_price),
          currency: data.currency ?? 'THB',
          createdAt: data.created_at,
        }
        setHoldings((prev) => [...prev, newHolding])
      }
    },
    [isAuthenticated, user, holdings, supabase]
  )

  const removeHolding = useCallback(
    async (id: string) => {
      if (!isAuthenticated || !user) {
        const next = holdings.filter((h) => h.id !== id)
        saveLocalHoldings(next)
        setHoldings(next)
        return
      }

      const { error } = await supabase.from('holdings').delete().eq('id', id)

      if (error) {
        console.error('Failed to remove holding:', error)
        throw error
      }

      setHoldings((prev) => prev.filter((h) => h.id !== id))
    },
    [isAuthenticated, user, holdings, supabase]
  )

  return { holdings, isLoading, isAuthenticated, addHolding, removeHolding }
}
