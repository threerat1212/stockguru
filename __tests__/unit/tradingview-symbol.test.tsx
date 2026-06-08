import { describe, expect, it } from 'vitest'
import { normalizeTradingViewSymbol } from '@/components/stock/TradingViewWidget'

describe('normalizeTradingViewSymbol', () => {
  it('keeps explicit TradingView exchange prefixes', () => {
    expect(normalizeTradingViewSymbol('BINANCE:BTCUSDT')).toBe('BINANCE:BTCUSDT')
    expect(normalizeTradingViewSymbol('tvc:dxy')).toBe('TVC:DXY')
    expect(normalizeTradingViewSymbol('oanda:xauusd')).toBe('OANDA:XAUUSD')
  })

  it('maps Thai Yahoo symbols to SET symbols', () => {
    expect(normalizeTradingViewSymbol('PTT.BK')).toBe('SET:PTT')
    expect(normalizeTradingViewSymbol('advanc.bk')).toBe('SET:ADVANC')
    expect(normalizeTradingViewSymbol('CPALL', 'SET')).toBe('SET:CPALL')
  })

  it('maps common US exchange metadata', () => {
    expect(normalizeTradingViewSymbol('AAPL', 'NASDAQ')).toBe('NASDAQ:AAPL')
    expect(normalizeTradingViewSymbol('JPM', 'NYSE')).toBe('NYSE:JPM')
  })

  it('uses NASDAQ as the fallback for plain unprefixed symbols', () => {
    expect(normalizeTradingViewSymbol('NVDA')).toBe('NASDAQ:NVDA')
  })
})
