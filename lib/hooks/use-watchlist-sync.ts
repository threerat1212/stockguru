'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/lib/store/stockStore'
import { useAuth } from '@/lib/hooks/use-auth'
import type { WatchlistItem } from '@/types/stock'

interface WatchlistRow {
  symbol: string
  notes: string | null
  added_at: string | null
}

/**
 * Keeps the local watchlist (Zustand + localStorage) in sync with Supabase
 * when a user is signed in. Guests keep using localStorage only.
 *
 * - On sign-in: merge local + cloud, push local-only items up, hydrate store.
 * - On local change while signed in: diff against the last cloud snapshot and
 *   insert/delete the difference in Supabase.
 */
export function useWatchlistSync() {
  const { user, isAuthenticated } = useAuth()
  // Symbols currently known to exist on the server (for diffing local changes).
  const cloudSymbols = useRef<Set<string> | null>(null)

  // Hydrate + merge when the user signs in.
  useEffect(() => {
    if (!isAuthenticated || !user) {
      cloudSymbols.current = null
      return
    }

    let cancelled = false
    const supabase = createClient()

    ;(async () => {
      const { data, error } = await supabase
        .from('watchlists')
        .select('symbol, notes, added_at')
        .eq('user_id', user.id)
      if (cancelled || error) return

      const rows = (data ?? []) as WatchlistRow[]
      const cloud: WatchlistItem[] = rows.map((r) => ({
        symbol: r.symbol,
        notes: r.notes ?? undefined,
        addedAt: r.added_at ? new Date(r.added_at).getTime() : Date.now(),
      }))
      const cloudSet = new Set(cloud.map((i) => i.symbol))

      const local = useAppStore.getState().watchlist
      const localOnly = local.filter((i) => !cloudSet.has(i.symbol))

      // Push local-only items up to the cloud.
      if (localOnly.length > 0) {
        await supabase.from('watchlists').upsert(
          localOnly.map((i) => ({ user_id: user.id, symbol: i.symbol, notes: i.notes ?? null })),
          { onConflict: 'user_id,symbol' }
        )
      }

      // Merge (cloud + local-only), de-duplicated by symbol.
      const merged: WatchlistItem[] = [...cloud]
      for (const i of localOnly) merged.push(i)

      // Record snapshot BEFORE updating the store so the subscriber below
      // does not treat this hydration as a user-initiated change.
      cloudSymbols.current = new Set(merged.map((i) => i.symbol))
      useAppStore.getState().setWatchlist(merged)
    })()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user])

  // Write through local add/remove to Supabase while signed in.
  useEffect(() => {
    const supabase = createClient()
    const unsub = useAppStore.subscribe((state, prev) => {
      if (state.watchlist === prev.watchlist) return
      const snapshot = cloudSymbols.current
      const currentUser = user
      if (!snapshot || !currentUser) return

      const next = new Set(state.watchlist.map((i) => i.symbol))
      const added = state.watchlist.filter((i) => !snapshot.has(i.symbol))
      const removed = [...snapshot].filter((s) => !next.has(s))

      if (added.length) {
        supabase.from('watchlists').upsert(
          added.map((i) => ({ user_id: currentUser.id, symbol: i.symbol, notes: i.notes ?? null })),
          { onConflict: 'user_id,symbol' }
        ).then(() => undefined)
      }
      if (removed.length) {
        supabase.from('watchlists').delete().eq('user_id', currentUser.id).in('symbol', removed).then(() => undefined)
      }

      cloudSymbols.current = next
    })
    return unsub
  }, [user])
}
