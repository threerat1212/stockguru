import { describe, expect, it } from 'vitest'
import { getMarketDataProvider, activeMarketDataProvider } from '@/lib/market-data/client'
import {
  MARKET_DATA_PROVIDER_SET,
  MARKET_DATA_PROVIDER_STOCKGURU_DEMO,
  MARKET_DATA_PROVIDER_YAHOO,
} from '@/lib/market-data/provider'
import { setProvider } from '@/lib/market-data/providers/set-provider'
import { yahooProvider } from '@/lib/market-data/providers/yahoo-provider'

describe('market data provider abstraction', () => {
  it('registers SET/mai as the default provider for Thai-first data', () => {
    expect(getMarketDataProvider().id).toBe(MARKET_DATA_PROVIDER_SET)
    expect(getMarketDataProvider().displayName).toBe('SET/mai (SiamChart + Yahoo fallback)')
  })

  it('keeps Yahoo provider available for non-Thai symbols and explicit provider selection', () => {
    expect(getMarketDataProvider(MARKET_DATA_PROVIDER_YAHOO)).toBe(yahooProvider)
  })

  it('falls back to SET/mai when an unknown provider id is requested', () => {
    const provider = getMarketDataProvider('unknown-provider')
    expect(provider).toBe(setProvider)
  })

  it('exports the active provider used by stock-service', () => {
    expect(activeMarketDataProvider.id).toBe(MARKET_DATA_PROVIDER_SET)
  })

  it('keeps demo provider identity available for future non-live providers', () => {
    expect(MARKET_DATA_PROVIDER_STOCKGURU_DEMO).toBe('stockguru-demo')
  })
})
