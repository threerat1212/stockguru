/**
 * Backward-compatible market data service entrypoint.
 *
 * PR9 note: providers are now isolated under lib/market-data/providers/*.
 * Keep these exports stable so existing routes/hooks do not need churn.
 */

import { activeMarketDataProvider } from '@/lib/market-data/client'
import type { Timeframe } from '@/types/stock'
import { yahooProvider } from '@/lib/market-data/providers/yahoo-provider'

export const getQuote = (symbol: string) => activeMarketDataProvider.getQuote(symbol)
export const getHistory = (symbol: string, timeframe: Timeframe = '3M') => activeMarketDataProvider.getHistory(symbol, timeframe)
export const searchStocks = (query: string) => activeMarketDataProvider.searchStocks(query)
export const searchStocksWithMeta = (query: string) => activeMarketDataProvider.searchStocksWithMeta(query)
export const getTrending = () => activeMarketDataProvider.getTrending()
export const getMarketIndices = () => activeMarketDataProvider.getMarketIndices()

export { yahooProvider }
