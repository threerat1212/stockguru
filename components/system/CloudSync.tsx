'use client'

import { useWatchlistSync } from '@/lib/hooks/use-watchlist-sync'

/**
 * Headless component that syncs local persisted state with Supabase
 * for signed-in users. Renders nothing.
 */
export default function CloudSync() {
  useWatchlistSync()
  return null
}
