import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MarketDataMeta, MarketIndex, TrendingStock } from '@/types/stock'
import type { SiamchartStockRow } from '@/lib/market-data/providers/set-provider'

const mocks = vi.hoisted(() => ({
  getMarketIndices: vi.fn(),
  getTrending: vi.fn(),
  fetchSiamchartStockRows: vi.fn(),
}))

import {
  buildMarketSummary,
  createMarketSummaryMeta,
  getMarketTradingSession,
  summarizeBreadthByExchange,
  summarizeForeign,
  summarizeMovers,
  summarizeSectors,
} from '@/app/api/market/summary/summarize'

const rows: SiamchartStockRow[] = [
  {
    symbol: 'PTT',
    yahooSymbol: 'PTT.BK',
    name: 'PTT',
    exchange: 'SET',
    sector: 'ทรัพยากร',
    tags: [],
    close: 40,
    changePercent: 1.25,
    volume: 1_000,
    value: 40_000,
  },
  {
    symbol: 'A5',
    yahooSymbol: 'A5.BK',
    name: 'A5',
    exchange: 'mai',
    sector: 'อสังหาริมทรัพย์และก่อสร้าง',
    tags: [],
    close: 10,
    changePercent: -2.5,
    volume: 500,
    value: 5_000,
  },
  {
    symbol: 'NVDR',
    yahooSymbol: 'NVDR.BK',
    name: 'NVDR',
    exchange: 'SET',
    sector: 'กระดานต่างชาติ',
    tags: [],
    close: 20,
    changePercent: 0.5,
    volume: 250,
    value: 5_000,
  },
]

const trending: TrendingStock[] = Array.from({ length: 12 }, (_, index) => ({
  symbol: `S${index}.BK`,
  name: `Stock ${index}`,
  price: 100 + index,
  change: index - 5,
  changePercent: index - 5,
  volume: index * 1000,
  exchange: index % 2 ? 'mai' : 'SET',
}))

const indices: MarketIndex[] = [
  { symbol: 'SET', name: 'SET Index', price: 1400, change: 10, changePercent: 0.72 },
  { symbol: 'MAI', name: 'mai Index', price: 120, change: -1, changePercent: -0.83 },
]

function meta(source: MarketDataMeta['source'], updatedAt: number, warning?: string): MarketDataMeta {
  return {
    source,
    isDemo: source === 'fallback',
    provider: source === 'siamchart' ? 'SiamChart' : 'Yahoo Finance',
    updatedAt,
    ...(warning ? { warning } : {}),
  }
}

describe('market summary summarizers', () => {
  it('splits breadth by SET and mai while keeping aggregate totals', () => {
    const split = summarizeBreadthByExchange(rows)

    expect(split.SET).toMatchObject({ advancing: 2, declining: 0, unchanged: 0, total: 2, volume: 1_250, value: 45_000 })
    expect(split.mai).toMatchObject({ advancing: 0, declining: 1, unchanged: 0, total: 1, volume: 500, value: 5_000 })
  })

  it('summarizes sectors, movers, and optional foreign flow', () => {
    const sectors = summarizeSectors(rows)
    const movers = summarizeMovers(trending)
    const foreign = summarizeForeign(rows)

    expect(sectors[0]).toMatchObject({ sector: 'ทรัพยากร', count: 1, advancing: 1, topSymbol: 'PTT' })
    expect(movers.gainers).toHaveLength(10)
    expect(movers.gainers[0]).toMatchObject({ symbol: 'S11.BK', changePercent: 6 })
    expect(movers.losers[0]).toMatchObject({ symbol: 'S0.BK', changePercent: -5 })
    expect(foreign).toEqual({ netValue: 5_000 })
  })

  it('builds a backward-compatible summary with new breadth split and aggregate value/volume', () => {
    const summary = buildMarketSummary({ indices, trending, stockRows: rows, updatedAt: '2026-06-12T10:00:00.000Z' })

    expect(summary.indices).toBe(indices)
    expect(summary.breadth).toMatchObject({ total: 3, volume: 1_750, value: 50_000 })
    expect(summary.breadthByExchange.mai.total).toBe(1)
    expect(summary.value).toBe(50_000)
    expect(summary.volume).toBe(1_750)
    expect(summary.foreign).toEqual({ netValue: 5_000 })
    expect(summary.movers.active).toHaveLength(10)
  })

  it('creates typed summary meta with stale, fallback, and trading/session fields', () => {
    const now = Date.UTC(2026, 5, 12, 3, 30, 0)
    const summaryMeta = createMarketSummaryMeta({
      indices: meta('cache', now - 10 * 60_000),
      trending: meta('fallback', now - 60_000, 'demo warning'),
      stocks: meta('siamchart', now),
      indicesCount: indices.length,
      trendingCount: trending.length,
      stockCount: rows.length,
      breadthTotal: 3,
      now,
    })

    expect(summaryMeta).toMatchObject({
      source: 'siamchart',
      isDemo: true,
      provider: 'SiamChart',
      updatedAt: now - 10 * 60_000,
      trading: {
        state: 'open',
        session: {
          exchange: 'SET/mai',
          localDate: '2026-06-12',
          phase: 'market_open',
        },
      },
    })
    expect(summaryMeta.sources.indices.source).toBe('cache')
    expect(summaryMeta.sources.trending.source).toBe('fallback')
    expect(summaryMeta.warnings.some((warning) => warning.type === 'stale' && warning.field === 'indices')).toBe(true)
    expect(summaryMeta.warnings.some((warning) => warning.type === 'fallback' && warning.field === 'trending')).toBe(true)
    expect(summaryMeta.warnings.some((warning) => warning.type === 'demo' && warning.message === 'demo warning')).toBe(true)
  })

  it('classifies SET trading session phases in Bangkok time', () => {
    expect(getMarketTradingSession(new Date(Date.UTC(2026, 5, 12, 2, 30, 0)))).toMatchObject({
      phase: 'pre_open',
      nextOpenAt: '2026-06-12T10:00:00+07:00',
    })
    expect(getMarketTradingSession(new Date(Date.UTC(2026, 5, 12, 5, 30, 0)))).toMatchObject({
      phase: 'lunch_break',
      nextOpenAt: '2026-06-12T14:30:00+07:00',
    })
    expect(getMarketTradingSession(new Date(Date.UTC(2026, 5, 13, 10, 0, 0)))).toMatchObject({
      phase: 'closed',
      nextOpenAt: '2026-06-15T09:30:00+07:00',
    })
  })
})

describe('/api/market/summary route', () => {
  beforeEach(() => {
    vi.mocked(activeMarketDataProvider.getMarketIndices).mockResolvedValue({
      data: indices,
      meta: meta('siamchart', Date.UTC(2026, 5, 12, 3, 30, 0)),
    })
    vi.mocked(activeMarketDataProvider.getTrending).mockResolvedValue({
      data: trending,
      meta: meta('siamchart', Date.UTC(2026, 5, 12, 3, 30, 0)),
    })
    vi.mocked(fetchSiamchartStockRows).mockResolvedValue(rows)
  })

  it('returns typed meta without raw ad-hoc freshness fields', async () => {
    const response = await GET()
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.breadthByExchange.SET.total).toBe(2)
    expect(json.data.breadthByExchange.mai.total).toBe(1)
    expect(json.meta.sources.stocks).toEqual({
      source: 'siamchart',
      isDemo: false,
      provider: 'SiamChart',
      updatedAt: expect.any(Number),
    })
    expect(json.meta.sources.stocks).not.toHaveProperty('freshness')
    expect(json.meta.trading.session.exchange).toBe('SET/mai')
  })
})

vi.mock('@/lib/market-data/client', () => ({
  activeMarketDataProvider: {
    getMarketIndices: mocks.getMarketIndices,
    getTrending: mocks.getTrending,
  },
}))

vi.mock('@/lib/market-data/providers/set-provider', () => ({
  fetchSiamchartStockRows: mocks.fetchSiamchartStockRows,
}))

import { activeMarketDataProvider } from '@/lib/market-data/client'
import { fetchSiamchartStockRows } from '@/lib/market-data/providers/set-provider'
import { GET } from '@/app/api/market/summary/route'
