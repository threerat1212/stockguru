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

export function useHoldings() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user)
      setIsAuthenticated(!!data.user)
      setIsAuthLoading(false)
    }
    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, session: { user: User | null } | null) => {
      setUser(session?.user ?? null)
      setIsAuthenticated(!!session?.user)
      setIsAuthLoading(false)
    })

    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    if (isAuthLoading) return

    if (!isAuthenticated) {
      setHoldings([])
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
        setHoldings([])
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
  }, [isAuthLoading, isAuthenticated, supabase])

  const addHolding = useCallback(
    async (symbol: string, quantity: number, buyPrice: number, currency = 'THB') => {
      if (!isAuthenticated || !user) {
        throw new Error('Sign in required to save holdings')
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
    [isAuthenticated, user, supabase]
  )

  const removeHolding = useCallback(
    async (id: string) => {
      if (!isAuthenticated || !user) {
        throw new Error('Sign in required to remove holdings')
      }

      const { error } = await supabase.from('holdings').delete().eq('id', id)

      if (error) {
        console.error('Failed to remove holding:', error)
        throw error
      }

      setHoldings((prev) => prev.filter((h) => h.id !== id))
    },
    [isAuthenticated, user, supabase]
  )

  return { holdings, isLoading: isAuthLoading || isLoading, isAuthenticated, addHolding, removeHolding }
}
