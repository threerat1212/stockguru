export const MARKET_DATA_PROVIDER_YAHOO = 'yahoo'
export const MARKET_DATA_PROVIDER_SET = 'set'
export const MARKET_DATA_PROVIDER_STOCKGURU_DEMO = 'stockguru-demo'

export type MarketDataSource = 'yahoo' | 'siamchart' | 'cache' | 'fallback'

export interface MarketDataMeta {
  source: MarketDataSource
  isDemo: boolean
  provider: string
  updatedAt: number
  warning?: string
}

export interface MarketDataResult<T> {
  data: T
  meta: MarketDataMeta
}

export function liveMeta(source: MarketDataSource = 'yahoo', provider = 'Yahoo Finance'): MarketDataMeta {
  return {
    source,
    isDemo: false,
    provider,
    updatedAt: Date.now(),
  }
}

export function demoMeta(warning: string): MarketDataMeta {
  return {
    source: 'fallback',
    isDemo: true,
    provider: 'StockGuru Demo',
    updatedAt: Date.now(),
    warning,
  }
}

export function cacheMeta(provider = 'Yahoo Finance'): MarketDataMeta {
  return {
    source: 'cache',
    isDemo: false,
    provider,
    updatedAt: Date.now(),
  }
}
