'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface Trade {
  id: string
  user_id: string
  portfolio_id: string
  symbol: string
  market: string
  direction: 'long' | 'short'
  entry_price: number
  exit_price?: number
  stop_loss?: number
  take_profit?: number
  quantity: number
  fees: number
  opened_at: string
  closed_at?: string
  setup?: string
  reason?: string
  emotion?: string
  mistake_tags: string[]
  result_note?: string
  pnl?: number
  r_multiple?: number
  status: 'open' | 'closed' | 'cancelled'
  created_at: string
}

export interface Portfolio {
  id: string
  user_id: string
  name: string
  type: 'real' | 'demo' | 'prop_firm'
  currency: string
  broker?: string
  active: boolean
}

const supabase = createClient()

async function fetchTrades(portfolioId?: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  let query = supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .order('opened_at', { ascending: false })

  if (portfolioId) {
    query = query.eq('portfolio_id', portfolioId)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as Trade[]
}

async function fetchPortfolios() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', user.id)
    .eq('active', true)
    .order('created_at')

  if (error) throw error

  if (!data || data.length === 0) {
    const { data: created, error: createError } = await supabase
      .from('portfolios')
      .insert({
        user_id: user.id,
        name: 'Default',
        type: 'real',
        currency: 'THB',
      })
      .select('*')
      .single()

    if (createError) throw createError
    return created ? [created as Portfolio] : []
  }

  return data as Portfolio[]
}

export function useTrades(portfolioId?: string) {
  return useQuery({
    queryKey: ['trades', portfolioId],
    queryFn: () => fetchTrades(portfolioId),
    enabled: true,
  })
}

export function usePortfolios() {
  return useQuery({
    queryKey: ['portfolios'],
    queryFn: fetchPortfolios,
  })
}

export function useCreateTrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (trade: Omit<Trade, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Unauthorized')

      // Calculate PnL and R-multiple if closed
      let pnl = trade.pnl
      let r_multiple = trade.r_multiple
      if (trade.status === 'closed' && trade.exit_price) {
        const gross = (trade.exit_price - trade.entry_price) * trade.quantity * (trade.direction === 'long' ? 1 : -1)
        pnl = gross - (trade.fees ?? 0)
        const risk = trade.stop_loss ? Math.abs(trade.entry_price - trade.stop_loss) * trade.quantity : gross
        r_multiple = risk > 0 ? pnl / risk : 0
      }

      const { data, error } = await supabase
        .from('trades')
        .insert({ ...trade, user_id: user.id, pnl, r_multiple })
        .select()
        .single()

      if (error) throw error
      return data as Trade
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trades'] }),
  })
}

export function useUpdateTrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...trade }: Partial<Trade> & { id: string }) => {
      const { data, error } = await supabase
        .from('trades')
        .update(trade)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Trade
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trades'] }),
  })
}

export function useDeleteTrade() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('trades').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['trades'] }),
  })
}
