import { useQuery } from '@tanstack/react-query'
import type { ApiResponse, ScreenerFilters, ScreenerStock } from '@/types/stock'

export interface ScreenerUniverseMeta {
  source: 'siamchart'
  provider: string
  freshness: 'live'
  updatedAt: string
}

export interface ScreenerUniverseResponse {
  stocks: ScreenerStock[]
  total: number
  filtered: number
  meta?: ScreenerUniverseMeta
}

function buildScreenerUrl(filters: ScreenerFilters) {
  const params = new URLSearchParams()

  if (filters.query) params.set('query', filters.query)
  if (filters.market) params.set('market', filters.market)
  if (filters.sector) params.set('sector', filters.sector)
  if (filters.minMarketCap !== undefined) params.set('minMarketCap', String(filters.minMarketCap))
  if (filters.maxMarketCap !== undefined) params.set('maxMarketCap', String(filters.maxMarketCap))
  if (filters.minPe !== undefined) params.set('minPe', String(filters.minPe))
  if (filters.maxPe !== undefined) params.set('maxPe', String(filters.maxPe))
  if (filters.minVolume !== undefined) params.set('minVolume', String(filters.minVolume))
  if (filters.maxVolume !== undefined) params.set('maxVolume', String(filters.maxVolume))
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice))
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice))
  if (filters.minChange !== undefined) params.set('minChange', String(filters.minChange))
  if (filters.maxChange !== undefined) params.set('maxChange', String(filters.maxChange))
  if (filters.minDividendYield !== undefined) params.set('minDividendYield', String(filters.minDividendYield))
  if (filters.sortBy) params.set('sortBy', filters.sortBy)
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder)

  return `/api/screener/universe?${params.toString()}`
}

async function fetchApi<T>(url: string): Promise<T> {
  const res = await fetch(url)
  const json: ApiResponse<T> = await res.json()
  if (!json.success) throw new Error(json.error || 'API request failed')
  return json.data as T
}

export function useScreenerUniverse(filters: ScreenerFilters) {
  const queryKey = ['screener-universe', filters]
  const query = useQuery<ScreenerUniverseResponse>({
    queryKey,
    queryFn: () => fetchApi<ScreenerUniverseResponse>(buildScreenerUrl(filters)),
    staleTime: 60_000,
    refetchInterval: 120_000,
  })

  return {
    ...query,
    data: query.data?.stocks,
    total: query.data?.total ?? 0,
    filtered: query.data?.filtered ?? 0,
    meta: query.data?.meta,
  }
}
