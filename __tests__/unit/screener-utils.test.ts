import { describe, expect, it } from 'vitest'
import type { ScreenerStock } from '@/types/stock'
import { applyScreenerFilters, normalizeSiamchartStockRows, screenStocks } from '@/lib/screener/utils'

const rows = [
  {
    symbol: 'PTT',
    yahooSymbol: 'PTT.BK',
    name: 'ปตท',
    exchange: 'SET',
    sector: 'ทรัพยากร',
    tags: ['RESOURC', 'SET50'],
    close: 35,
    changePercent: 2,
    volume: 10_000_000,
    value: 350_000_000,
    marketCap: 1_000_000_000_000,
    pe: 15,
    pb: 2,
    de: 1,
    dividendYield: 4,
    freeFloat: 45,
  },
  {
    symbol: 'A5',
    yahooSymbol: 'A5.BK',
    name: 'แอสเซท ไฟว์ กรุ๊ป',
    exchange: 'mai',
    sector: 'อสังหาริมทรัพย์และก่อสร้าง',
    tags: ['MAI', 'PROPCON-ms'],
    close: 12,
    changePercent: -2,
    volume: 500_000,
    value: 6_000_000,
    marketCap: 1_200_000_000,
    pe: 20,
    dividendYield: 1,
    freeFloat: 30,
  },
]

const stocks: ScreenerStock[] = [
  {
    symbol: 'PTT.BK',
    name: 'ปตท',
    price: 35,
    change: 0.7,
    changePercent: 2,
    volume: 10_000_000,
    marketCap: 1_000_000_000_000,
    sector: 'ทรัพยากร',
    exchange: 'SET',
    currency: 'THB',
    pe: 15,
    dividendYield: 4,
  },
  {
    symbol: 'A5.BK',
    name: 'แอสเซท ไฟว์ กรุ๊ป',
    price: 12,
    change: -0.24,
    changePercent: -2,
    volume: 500_000,
    marketCap: 1_200_000_000,
    sector: 'อสังหาริมทรัพย์และก่อสร้าง',
    exchange: 'mai',
    currency: 'THB',
    pe: 20,
    dividendYield: 1,
  },
]

describe('screener utilities', () => {
  it('normalizes SiamChart rows into screener stocks', () => {
    const normalized = normalizeSiamchartStockRows(rows as any)

    expect(normalized).toHaveLength(2)
    expect(normalized[0]).toMatchObject({ symbol: 'PTT', exchange: 'SET', sector: 'ทรัพยากร', price: 35 })
    expect(normalized[1]).toMatchObject({ symbol: 'A5', exchange: 'mai', sector: 'อสังหาริมทรัพย์และก่อสร้าง', price: 12 })
  })

  it('filters by market, sector, volume, change, market cap, and P/E', () => {
    const filtered = applyScreenerFilters(stocks, {
      market: 'ไทย',
      minVolume: 1,
      minChange: 1,
      minMarketCap: 100_000_000_000,
      maxPe: 16,
    })

    expect(filtered).toHaveLength(1)
    expect(filtered[0].symbol).toBe('PTT.BK')
  })

  it('sorts and screens stocks in one pass', () => {
    const screened = screenStocks(stocks, { minVolume: 0, sortBy: 'change', sortOrder: 'asc' })

    expect(screened.map((stock) => stock.symbol)).toEqual(['A5.BK', 'PTT.BK'])
  })
})
