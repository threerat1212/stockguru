import type { StockQuote, StockCandle, TrendingStock, StockSearchResult, MarketIndex, Timeframe } from '@/types/stock'
import type { MarketDataResult } from '@/lib/market-data/types'
import { MARKET_DATA_PROVIDER_SET, MARKET_DATA_PROVIDER_YAHOO } from '@/lib/market-data/types'

export interface MarketDataProvider {
  readonly id: string
  readonly displayName: string

  getQuote(symbol: string): Promise<MarketDataResult<StockQuote>>
  getHistory(symbol: string, timeframe: Timeframe): Promise<MarketDataResult<StockCandle[]>>
  searchStocks(query: string): Promise<StockSearchResult[]>
  getTrending(): Promise<MarketDataResult<TrendingStock[]>>
  getMarketIndices(): Promise<MarketDataResult<MarketIndex[]>>
}

export { MARKET_DATA_PROVIDER_YAHOO, MARKET_DATA_PROVIDER_SET }
export const MARKET_DATA_PROVIDER_STOCKGURU_DEMO = 'stockguru-demo'

export function getProviderId(): string {
  return process.env.MARKET_DATA_PROVIDER ?? MARKET_DATA_PROVIDER_SET
}
