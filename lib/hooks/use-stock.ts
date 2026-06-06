import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  StockQuote,
  StockCandle,
  TrendingStock,
  StockSearchResult,
  MarketIndex,
  AIAnalysis,
  ChatMessage,
  Timeframe,
  ApiResponse,
} from '@/types/stock'

// Generic fetch helper
async function fetchApi<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const json: ApiResponse<T> = await res.json()
  if (!json.success) throw new Error(json.error || 'API request failed')
  return json.data as T
}

async function postApi<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json: ApiResponse<T> = await res.json()
  if (!json.success) throw new Error(json.error || 'API request failed')
  return json.data as T
}

// ─── Stock Quote ───────────────────────────────────────────
export function useQuote(symbol: string | null) {
  return useQuery<StockQuote>({
    queryKey: ['quote', symbol],
    queryFn: () => fetchApi<StockQuote>(`/api/stock/quote?symbol=${symbol}`),
    enabled: !!symbol,
    refetchInterval: 30_000, // refresh every 30s
    staleTime: 15_000,
  })
}

// ─── Stock History (OHLCV) ─────────────────────────────────
export function useHistory(symbol: string | null, timeframe: Timeframe = '3M') {
  const isIntraday = timeframe === '1D' || timeframe === '1W'
  return useQuery<StockCandle[]>({
    queryKey: ['history', symbol, timeframe],
    queryFn: () =>
      fetchApi<StockCandle[]>(`/api/stock/history?symbol=${symbol}&timeframe=${timeframe}`),
    enabled: !!symbol,
    staleTime: isIntraday ? 15_000 : 60_000,
    refetchInterval: isIntraday ? 30_000 : false,
  })
}

// ─── Stock Search ──────────────────────────────────────────
export function useSearch(query: string) {
  return useQuery<StockSearchResult[]>({
    queryKey: ['search', query],
    queryFn: () => fetchApi<StockSearchResult[]>(`/api/stock/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 1,
    staleTime: 300_000,
  })
}

// ─── Trending Stocks ───────────────────────────────────────
export function useTrending() {
  return useQuery<TrendingStock[]>({
    queryKey: ['trending'],
    queryFn: () => fetchApi<TrendingStock[]>('/api/stock/trending'),
    staleTime: 120_000,
  })
}

// ─── Market Indices ────────────────────────────────────────
export function useMarketIndices() {
  return useQuery<MarketIndex[]>({
    queryKey: ['market-indices'],
    queryFn: () => fetchApi<MarketIndex[]>('/api/market'),
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
}

// ─── Market Summary (AI) ──────────────────────────────────
export function useMarketSummary() {
  return useQuery<{ summary: string }>({
    queryKey: ['market-summary'],
    queryFn: () => fetchApi<{ summary: string }>('/api/market/summary'),
    staleTime: 600_000, // 10 min
  })
}

// ─── AI Analysis ───────────────────────────────────────────
export function useAnalysis(symbol: string | null) {
  return useQuery<AIAnalysis>({
    queryKey: ['analysis', symbol],
    queryFn: () => fetchApi<AIAnalysis>(`/api/stock/analysis?symbol=${symbol}`),
    enabled: !!symbol,
    staleTime: 900_000, // 15 min
  })
}

// ─── AI Chat ───────────────────────────────────────────────
export function useChat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (variables: { messages: ChatMessage[]; symbol?: string }) =>
      postApi<{ response: string }>('/api/chat', variables),
  })
}
