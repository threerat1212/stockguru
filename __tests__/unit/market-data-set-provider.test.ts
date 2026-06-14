import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getMarketDataProvider, activeMarketDataProvider } from '@/lib/market-data/client'
import {
  MARKET_DATA_PROVIDER_SET,
  MARKET_DATA_PROVIDER_STOCKGURU_DEMO,
  MARKET_DATA_PROVIDER_YAHOO,
} from '@/lib/market-data/provider'
import { yahooProvider } from '@/lib/market-data/providers/yahoo-provider'
import { setProvider, fetchSiamchartStockRows, fetchSiamchartHistory, parseSiamchartStockRows, parseSiamchartHistory } from '@/lib/market-data/providers/set-provider'
import { fetchThaiStocksData } from '@/lib/data/fetchers/thai-stocks'
import { quoteCache, historyCache, searchCache } from '@/lib/cache'

const SAMPLE_STOCK_HTML = `
var store_real_data = [
  ['1|2','PTT','บริษัท ปตท จำกัด (มหาชน) [RESOURC,ENERG,SET50,SET100]','&nbsp;','XD','32.50','1.25','100000','3250','1050000','100','40','2','3','1','2','5','7','8','4.5','30','','','','','',''],
  ['3|4','A5','บริษัท แอสเซท ไฟว์ กรุ๊ป จำกัด (มหาชน) [MAI,PROPCON-m,PROPCON-ms]','&nbsp;','','12.00','-2.50','50000','600','120000','','','','','','','','','','','','','','',''],
];
`

const SAMPLE_HISTORY_TIMESTAMP = Math.floor(Date.now() / 1000)
const SAMPLE_HISTORY = JSON.stringify({
  s: 'ok',
  t: [SAMPLE_HISTORY_TIMESTAMP - 86_400, SAMPLE_HISTORY_TIMESTAMP],
  o: [10, 11],
  h: [12, 13],
  l: [9, 10],
  c: [11, 12],
  v: [100, 200],
})

function mockFetch(bodyByPath: Record<string, string>) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString()
      const path = new URL(url).pathname
      const body = bodyByPath[path] ?? bodyByPath[url] ?? ''
      return {
        ok: true,
        status: 200,
        text: async () => body,
        headers: {
          getSetCookie: () => [],
        },
        json: async () => (typeof body === 'string' && body.trim().startsWith('{') ? JSON.parse(body) : body),
      } as unknown as Response
    })
  )
}

describe('market data provider abstraction', () => {
  beforeEach(() => {
    quoteCache.clear()
    historyCache.clear()
    searchCache.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('registers SET/mai as the default provider', () => {
    expect(getMarketDataProvider().id).toBe(MARKET_DATA_PROVIDER_SET)
    expect(getMarketDataProvider().displayName).toBe('SET/mai (SiamChart + Yahoo fallback)')
  })

  it('falls back to SET/mai when an unknown provider id is requested', () => {
    const provider = getMarketDataProvider('unknown-provider')
    expect(provider).toBe(setProvider)
  })

  it('exports the active provider used by stock-service', () => {
    expect(activeMarketDataProvider.id).toBe(MARKET_DATA_PROVIDER_SET)
  })

  it('keeps Yahoo and demo provider identity available', () => {
    expect(MARKET_DATA_PROVIDER_YAHOO).toBe('yahoo')
    expect(MARKET_DATA_PROVIDER_STOCKGURU_DEMO).toBe('stockguru-demo')
  })
})

describe('SiamChart SET/mai provider', () => {
  beforeEach(() => {
    quoteCache.clear()
    historyCache.clear()
    searchCache.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('parses full Thai stock list with exchange, sector, and industry tags', () => {
    const rows = parseSiamchartStockRows(SAMPLE_STOCK_HTML)

    expect(rows).toHaveLength(2)
    expect(rows[0]).toMatchObject({
      symbol: 'PTT',
      yahooSymbol: 'PTT.BK',
      exchange: 'SET',
      sector: 'ทรัพยากร',
      industry: 'ENERG',
      close: 32.5,
      changePercent: 1.25,
      volume: 100000,
      marketCap: 1_050_000_000_000,
      pe: 40,
      dividendYield: 4.5,
      freeFloat: 30,
    })
    expect(rows[1]).toMatchObject({
      symbol: 'A5',
      yahooSymbol: 'A5.BK',
      exchange: 'mai',
      sector: 'อสังหาริมทรัพย์และก่อสร้าง',
      industry: 'PROPCON-ms',
    })
  })

  it('fetches cached Thai stock rows from SiamChart', async () => {
    mockFetch({ '/stock/': SAMPLE_STOCK_HTML })

    const rows = await fetchSiamchartStockRows()

    expect(rows).toHaveLength(2)
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/stock/'), expect.any(Object))
  })

  it('parses SiamChart history JSON into candles', () => {
    const candles = parseSiamchartHistory(SAMPLE_HISTORY)

    expect(candles).toHaveLength(2)
    const firstDate = new Date((SAMPLE_HISTORY_TIMESTAMP - 86_400) * 1000).toISOString().split('T')[0]
    const secondDate = new Date(SAMPLE_HISTORY_TIMESTAMP * 1000).toISOString().split('T')[0]
    expect(candles[0]).toMatchObject({ time: firstDate, open: 10, high: 12, low: 9, close: 11, volume: 100 })
    expect(candles[1]).toMatchObject({ time: secondDate, open: 11, high: 13, low: 10, close: 12, volume: 200 })
  })

  it('fetches SET/mai history from SiamChart over HTTPS', async () => {
    mockFetch({ '/query/history': SAMPLE_HISTORY })

    const candles = await fetchSiamchartHistory('SET', 'ALL')

    expect(candles).toHaveLength(2)
    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/siamchart\.com\/query\/history/), expect.any(Object))
  })

  it('retries SiamChart history requests with a timeout', async () => {
    vi.useFakeTimers()
    let calls = 0
    const fetchMock = vi.fn(async () => {
      calls += 1
      return {
        ok: calls === 1 ? false : true,
        status: calls === 1 ? 500 : 200,
        text: async () => (calls === 1 ? 'bad' : SAMPLE_HISTORY),
        headers: {
          getSetCookie: () => [],
        },
      } as unknown as Response
    })
    vi.stubGlobal('fetch', fetchMock)

    try {
      const candles = fetchSiamchartHistory('SET', '1D')
      await vi.advanceTimersByTimeAsync(100)

      await expect(candles).resolves.toHaveLength(2)
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        expect.stringMatching(/^https:\/\/siamchart\.com\/query\/history/),
        expect.objectContaining({ signal: expect.any(AbortSignal) })
      )
    } finally {
      vi.useRealTimers()
    }
  })

  it('rejects invalid SiamChart history JSON', () => {
    const invalidHistory = JSON.stringify({
      s: 'ok',
      t: [SAMPLE_HISTORY_TIMESTAMP],
      o: [10],
      h: [12],
      l: [9],
    })

    expect(() => parseSiamchartHistory(invalidHistory)).toThrow('Invalid SiamChart history response')
  })

  it('rejects empty SiamChart history responses with a clean error', () => {
    expect(() => parseSiamchartHistory('')).toThrow('SiamChart history response is empty')
  })

  it('returns a SiamChart quote from the stock table when history is empty', async () => {
    mockFetch({
      '/stock/': SAMPLE_STOCK_HTML,
      '/query/history': '',
    })

    const result = await setProvider.getQuote('PTT')

    expect(result.data).toMatchObject({
      symbol: 'PTT.BK',
      price: 32.5,
      previousClose: 32.5,
      change: 0.40625,
      changePercent: 1.25,
    })
    expect(result.meta.provider).toBe('SiamChart')
  })

  it('returns Thai trending stocks from the live stock table', async () => {
    mockFetch({ '/stock/': SAMPLE_STOCK_HTML })

    const result = await setProvider.getTrending()

    expect(result.meta.provider).toBe('SiamChart')
    expect(result.data).toHaveLength(2)
    expect(result.data[0]).toMatchObject({ symbol: 'PTT.BK', price: 32.5, volume: 100000, exchange: 'SET' })
  })

  it('returns SET index movement from history candles', async () => {
    mockFetch({ '/query/history': SAMPLE_HISTORY })

    const result = await setProvider.getMarketIndices()

    expect(result.meta.provider).toBe('SiamChart')
    expect(result.data.find((index) => index.symbol === 'SET')).toMatchObject({
      symbol: 'SET',
      price: 12,
      change: 1,
      changePercent: expect.closeTo(9.09, 0.01),
    })
  })

  it('returns all Thai stock rows without the 80-stock limit', async () => {
    mockFetch({ '/stock/': SAMPLE_STOCK_HTML })

    const data = await fetchThaiStocksData()

    expect(data).toHaveLength(2)
  })

  it('returns SiamChart metadata for Thai stock search', async () => {
    mockFetch({ '/stock/': SAMPLE_STOCK_HTML })

    const result = await setProvider.searchStocksWithMeta('PTT')

    expect(result.meta).toMatchObject({ source: 'siamchart', provider: 'SiamChart' })
    expect(result.data).toHaveLength(1)
    expect(result.data[0]).toMatchObject({ symbol: 'PTT.BK', exchange: 'SET' })
  })

  it('returns fallback metadata when Thai stock search uses Yahoo', async () => {
    mockFetch({ '/stock/': SAMPLE_STOCK_HTML })
    const yahooSearchSpy = vi.spyOn(yahooProvider, 'searchStocksWithMeta').mockResolvedValue({
      data: [{ symbol: 'PTT.BK', name: 'บริษัท ปตท จำกัด (มหาชน)', exchange: 'SET', type: 'EQUITY' }],
      meta: { source: 'yahoo', isDemo: false, provider: 'Yahoo Finance', updatedAt: Date.now() },
    })

    const result = await setProvider.searchStocksWithMeta('MISSING')

    expect(result.meta).toMatchObject({
      source: 'fallback',
      provider: 'Yahoo Finance',
      warning: expect.stringContaining('Yahoo Finance'),
    })
    expect(yahooSearchSpy).toHaveBeenCalled()
  })
})
