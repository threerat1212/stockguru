'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WatchlistItem, Timeframe, Indicator } from '@/types/stock'

interface AppState {
  // Watchlist
  watchlist: WatchlistItem[]
  addToWatchlist: (symbol: string, notes?: string) => void
  removeFromWatchlist: (symbol: string) => void
  isInWatchlist: (symbol: string) => boolean
  setWatchlist: (items: WatchlistItem[]) => void

  // Chart settings
  timeframe: Timeframe
  setTimeframe: (tf: Timeframe) => void
  indicators: Indicator[]
  toggleIndicator: (ind: Indicator) => void

  // Search
  searchHistory: string[]
  addSearchHistory: (symbol: string) => void
  clearSearchHistory: () => void

  // Sidebar
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Watchlist
      watchlist: [],
      addToWatchlist: (symbol, notes) =>
        set((state) => ({
          watchlist: [
            ...state.watchlist,
            { symbol, addedAt: Date.now(), notes },
          ],
        })),
      removeFromWatchlist: (symbol) =>
        set((state) => ({
          watchlist: state.watchlist.filter((item) => item.symbol !== symbol),
        })),
      isInWatchlist: (symbol) =>
        get().watchlist.some((item) => item.symbol === symbol),
      setWatchlist: (items) => set({ watchlist: items }),

      // Chart settings
      timeframe: '1M',
      setTimeframe: (tf) => set({ timeframe: tf }),
      indicators: [],
      toggleIndicator: (ind) =>
        set((state) => ({
          indicators: state.indicators.includes(ind)
            ? state.indicators.filter((i) => i !== ind)
            : [...state.indicators, ind],
        })),

      // Search
      searchHistory: [],
      addSearchHistory: (symbol) =>
        set((state) => ({
          searchHistory: [
            symbol,
            ...state.searchHistory.filter((s) => s !== symbol),
          ].slice(0, 10),
        })),
      clearSearchHistory: () => set({ searchHistory: [] }),

      // Sidebar
      sidebarOpen: false,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'stockguru-storage',
      partialize: (state) => ({
        watchlist: state.watchlist,
        timeframe: state.timeframe,
        indicators: state.indicators,
        searchHistory: state.searchHistory,
      }),
    }
  )
)
