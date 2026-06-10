import { yahooProvider } from '@/lib/market-data/providers/yahoo-provider'
import { setProvider } from '@/lib/market-data/providers/set-provider'
import type { MarketDataProvider } from '@/lib/market-data/provider'
import { getProviderId, MARKET_DATA_PROVIDER_SET, MARKET_DATA_PROVIDER_YAHOO } from '@/lib/market-data/provider'

const providers: Record<string, MarketDataProvider> = {
  [MARKET_DATA_PROVIDER_YAHOO]: yahooProvider,
  [MARKET_DATA_PROVIDER_SET]: setProvider,
}

export function getMarketDataProvider(id = getProviderId()): MarketDataProvider {
  return providers[id] ?? setProvider
}

export const activeMarketDataProvider = getMarketDataProvider()
