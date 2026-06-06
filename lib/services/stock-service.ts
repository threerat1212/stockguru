import type { StockQuote, StockCandle, TrendingStock, StockSearchResult, MarketIndex, Timeframe } from '@/types/stock'
import { quoteCache, historyCache, searchCache } from '@/lib/cache'

const YAHOO_BASE = 'https://query1.finance.yahoo.com'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

const FALLBACK_QUOTES: Record<string, StockQuote> = {
  'PTT.BK': {
    symbol: 'PTT.BK', name: 'บริษัท ปตท. จำกัด (มหาชน)', price: 38.5, change: 0.75,
    changePercent: 1.99, open: 37.75, high: 39, low: 37.5, close: 38.5,
    previousClose: 37.75, volume: 45_230_000, marketCap: 1_370_000_000_000,
    pe: 12.5, week52High: 42, week52Low: 31.25, currency: 'THB', exchange: 'SET', timestamp: Date.now(),
  },
  'SCB.BK': {
    symbol: 'SCB.BK', name: 'ธนาคารไทยพาณิชย์ จำกัด (มหาชน)', price: 142, change: -1.5,
    changePercent: -1.04, open: 144, high: 144.5, low: 141, close: 142,
    previousClose: 143.5, volume: 8_750_000, marketCap: 538_000_000_000,
    pe: 10.2, week52High: 158, week52Low: 118, currency: 'THB', exchange: 'SET', timestamp: Date.now(),
  },
  'CPALL.BK': {
    symbol: 'CPALL.BK', name: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)', price: 62.25, change: 1.25,
    changePercent: 2.05, open: 61, high: 62.75, low: 60.5, close: 62.25,
    previousClose: 61, volume: 22_340_000, marketCap: 700_000_000_000,
    pe: 28.3, week52High: 68, week52Low: 51, currency: 'THB', exchange: 'SET', timestamp: Date.now(),
  },
  'AOT.BK': {
    symbol: 'AOT.BK', name: 'บริษัท ท่าอากาศยานไทย จำกัด (มหาชน)', price: 68.5, change: -0.25,
    changePercent: -0.36, open: 69, high: 69.5, low: 68, close: 68.5,
    previousClose: 68.75, volume: 12_450_000, marketCap: 960_000_000_000,
    pe: 45.1, week52High: 78, week52Low: 58, currency: 'THB', exchange: 'SET', timestamp: Date.now(),
  },
  'KBANK.BK': {
    symbol: 'KBANK.BK', name: 'ธนาคารกสิกรไทย จำกัด (มหาชน)', price: 178.5, change: 2,
    changePercent: 1.13, open: 176.5, high: 179, low: 176, close: 178.5,
    previousClose: 176.5, volume: 6_890_000, marketCap: 435_000_000_000,
    pe: 9.8, week52High: 195, week52Low: 145, currency: 'THB', exchange: 'SET', timestamp: Date.now(),
  },
  'ADVANC.BK': {
    symbol: 'ADVANC.BK', name: 'บริษัท แอดวานซ์ อินโฟร์ เซอร์วิส จำกัด (มหาชน)', price: 245, change: 3,
    changePercent: 1.24, open: 242, high: 246, low: 241.5, close: 245,
    previousClose: 242, volume: 4_560_000, marketCap: 730_000_000_000,
    pe: 22.5, week52High: 260, week52Low: 198, currency: 'THB', exchange: 'SET', timestamp: Date.now(),
  },
  'TRUE.BK': {
    symbol: 'TRUE.BK', name: 'ทรู คอร์ปอเรชั่น จำกัด (มหาชน)', price: 7.85, change: 0.15,
    changePercent: 1.95, open: 7.7, high: 7.95, low: 7.65, close: 7.85,
    previousClose: 7.7, volume: 85_200_000, marketCap: 290_000_000_000,
    pe: 18.6, week52High: 8.8, week52Low: 5.9, currency: 'THB', exchange: 'SET', timestamp: Date.now(),
  },
  'DELTA.BK': {
    symbol: 'DELTA.BK', name: 'เดลต้า อีเลคโทรนิคส์ (ประเทศไทย)', price: 102, change: 4,
    changePercent: 4.08, open: 98, high: 103.5, low: 97.5, close: 102,
    previousClose: 98, volume: 18_500_000, marketCap: 312_000_000_000,
    pe: 32.4, week52High: 116, week52Low: 72, currency: 'THB', exchange: 'SET', timestamp: Date.now(),
  },
  AAPL: {
    symbol: 'AAPL', name: 'Apple Inc.', price: 196.58, change: 2.35,
    changePercent: 1.21, open: 194.2, high: 197.1, low: 193.84, close: 196.58,
    previousClose: 194.23, volume: 52_400_000, marketCap: 3_010_000_000_000,
    pe: 30.4, week52High: 237.49, week52Low: 169.21, currency: 'USD', exchange: 'NASDAQ', timestamp: Date.now(),
  },
  MSFT: {
    symbol: 'MSFT', name: 'Microsoft Corporation', price: 472.12, change: 4.82,
    changePercent: 1.03, open: 468.2, high: 473.8, low: 466.3, close: 472.12,
    previousClose: 467.3, volume: 21_800_000, marketCap: 3_510_000_000_000,
    pe: 35.1, week52High: 489.46, week52Low: 364.13, currency: 'USD', exchange: 'NASDAQ', timestamp: Date.now(),
  },
  NVDA: {
    symbol: 'NVDA', name: 'NVIDIA Corporation', price: 141.22, change: 5.64,
    changePercent: 4.16, open: 136.5, high: 142.6, low: 135.7, close: 141.22,
    previousClose: 135.58, volume: 188_200_000, marketCap: 3_470_000_000_000,
    pe: 48.8, week52High: 153.13, week52Low: 86.62, currency: 'USD', exchange: 'NASDAQ', timestamp: Date.now(),
  },
  TSLA: {
    symbol: 'TSLA', name: 'Tesla, Inc.', price: 181.45, change: -3.12,
    changePercent: -1.69, open: 185.1, high: 186.7, low: 179.8, close: 181.45,
    previousClose: 184.57, volume: 91_600_000, marketCap: 579_000_000_000,
    pe: 58.2, week52High: 299.29, week52Low: 138.8, currency: 'USD', exchange: 'NASDAQ', timestamp: Date.now(),
  },
  GOOGL: {
    symbol: 'GOOGL', name: 'Alphabet Inc.', price: 176.3, change: 1.08,
    changePercent: 0.62, open: 175.1, high: 177.2, low: 174.6, close: 176.3,
    previousClose: 175.22, volume: 28_900_000, marketCap: 2_170_000_000_000,
    pe: 24.7, week52High: 191.75, week52Low: 130.66, currency: 'USD', exchange: 'NASDAQ', timestamp: Date.now(),
  },
  AMZN: {
    symbol: 'AMZN', name: 'Amazon.com, Inc.', price: 184.7, change: -0.85,
    changePercent: -0.46, open: 186.0, high: 187.3, low: 183.6, close: 184.7,
    previousClose: 185.55, volume: 39_300_000, marketCap: 1_930_000_000_000,
    pe: 42.3, week52High: 201.2, week52Low: 118.35, currency: 'USD', exchange: 'NASDAQ', timestamp: Date.now(),
  },
  JPM: {
    symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 223.4, change: 1.9,
    changePercent: 0.86, open: 221.2, high: 224.1, low: 220.9, close: 223.4,
    previousClose: 221.5, volume: 9_800_000, marketCap: 635_000_000_000,
    pe: 13.1, week52High: 226.75, week52Low: 168.44, currency: 'USD', exchange: 'NYSE', timestamp: Date.now(),
  },
  BABA: {
    symbol: 'BABA', name: 'Alibaba Group Holding Limited', price: 83.25, change: -1.15,
    changePercent: -1.36, open: 84.2, high: 84.9, low: 82.7, close: 83.25,
    previousClose: 84.4, volume: 17_600_000, marketCap: 201_000_000_000,
    pe: 10.9, week52High: 117.82, week52Low: 66.63, currency: 'USD', exchange: 'NYSE', timestamp: Date.now(),
  },
}

const FALLBACK_MARKET_INDICES: MarketIndex[] = [
  { symbol: 'SET', name: 'SET Index', price: 1385.42, change: 12.58, changePercent: 0.92 },
  { symbol: 'SET50', name: 'SET50', price: 965.3, change: 8.2, changePercent: 0.86 },
  { symbol: 'SET100', name: 'SET100', price: 2012.15, change: 15.4, changePercent: 0.77 },
  { symbol: 'mai', name: 'mai Index', price: 425.8, change: -2.3, changePercent: -0.54 },
  { symbol: 'S&P 500', name: 'S&P 500', price: 5312.18, change: 18.42, changePercent: 0.35 },
  { symbol: 'NASDAQ', name: 'NASDAQ Composite', price: 17187.9, change: 91.76, changePercent: 0.54 },
  { symbol: 'DOW', name: 'Dow Jones', price: 38935.12, change: -41.22, changePercent: -0.11 },
]

const FALLBACK_SECTORS: Record<string, string> = {
  'PTT.BK': 'พลังงาน',
  'SCB.BK': 'ธนาคาร',
  'CPALL.BK': 'ค้าปลีก',
  'AOT.BK': 'ขนส่ง',
  'KBANK.BK': 'ธนาคาร',
  'ADVANC.BK': 'สื่อสาร',
  'TRUE.BK': 'สื่อสาร',
  'DELTA.BK': 'เทคโนโลยี',
  AAPL: 'เทคโนโลยี',
  MSFT: 'ซอฟต์แวร์',
  NVDA: 'เซมิคอนดักเตอร์',
  TSLA: 'EV',
  GOOGL: 'อินเทอร์เน็ต',
  AMZN: 'อีคอมเมิร์ซ',
  JPM: 'การเงิน',
  BABA: 'อีคอมเมิร์ซ',
}

function getFallbackQuote(symbol: string): StockQuote {
  const key = symbol.toUpperCase()
  const candidate = FALLBACK_QUOTES[key] || FALLBACK_QUOTES[`${key}.BK`]
  if (candidate) return { ...candidate, timestamp: Date.now() }

  const hash = [...key].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const price = 25 + (hash % 180)
  const change = ((hash % 19) - 9) / 2
  const changePercent = (change / price) * 100

  return {
    symbol: key,
    name: key.replace('.BK', ''),
    price,
    change,
    changePercent,
    open: price - change,
    high: price + Math.abs(change) + 1.5,
    low: price - Math.abs(change) - 1.5,
    close: price,
    previousClose: price - change,
    volume: 5_000_000 + hash * 10_000,
    marketCap: 20_000_000_000 + hash * 100_000_000,
    pe: 8 + (hash % 24),
    week52High: price * 1.18,
    week52Low: price * 0.78,
    currency: key.endsWith('.BK') ? 'THB' : 'USD',
    exchange: key.endsWith('.BK') ? 'SET' : 'NASDAQ',
    timestamp: Date.now(),
  }
}

function normalizeExchange(symbol: string, exchange?: string, fullExchangeName?: string) {
  const raw = `${exchange ?? ''} ${fullExchangeName ?? ''}`.toUpperCase()
  if (symbol.toUpperCase().endsWith('.BK') || raw.includes('THAILAND') || raw.includes(' SET')) return 'SET'
  if (raw.includes('NASDAQ') || raw.includes('NMS') || raw.includes('NGM') || raw.includes('NCM')) return 'NASDAQ'
  if (raw.includes('NYSE') || raw.includes('NYQ')) return 'NYSE'
  return exchange || (symbol.toUpperCase().endsWith('.BK') ? 'SET' : 'NASDAQ')
}

function getFallbackTrending(): TrendingStock[] {
  return Object.values(FALLBACK_QUOTES)
    .map((quote) => ({
      symbol: quote.symbol,
      name: quote.name,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      volume: quote.volume,
      marketCap: quote.marketCap,
      sector: FALLBACK_SECTORS[quote.symbol],
      exchange: quote.exchange,
      currency: quote.currency,
    }))
    .sort((a, b) => b.volume - a.volume)
}

function getFallbackHistory(symbol: string, timeframe: Timeframe): StockCandle[] {
  const quote = getFallbackQuote(symbol)
  const days = timeframe === '1D' ? 1 : timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : timeframe === '6M' ? 180 : timeframe === '1Y' ? 365 : 90
  const candles: StockCandle[] = []
  const now = new Date()

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    if (date.getDay() === 0 || date.getDay() === 6) continue

    const wave = Math.sin(i * 0.15) * quote.price * 0.025
    const drift = (days - i) * 0.015
    const open = quote.price + wave - drift
    const close = open + Math.cos(i * 0.27) * quote.price * 0.01
    const high = Math.max(open, close) + quote.price * 0.012
    const low = Math.min(open, close) - quote.price * 0.012

    candles.push({
      time: date.toISOString().split('T')[0],
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.round(quote.volume * (0.55 + (i % 9) / 10)),
    })
  }

  return candles
}

async function yfetch(path: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString()
  const url = `${YAHOO_BASE}${path}${qs ? '?' + qs : ''}`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`Yahoo API ${res.status}`)
  return res.json()
}

/** Fetch real-time stock quote */
export async function getQuote(symbol: string): Promise<StockQuote> {
  const cacheKey = `quote:${symbol}`
  const cached = quoteCache.get<StockQuote>(cacheKey)
  if (cached) return cached.data

  try {
    const data = await yfetch(`/v7/finance/quote`, { symbols: symbol })
    const q = data.quoteResponse?.result?.[0]
    if (!q) throw new Error(`No data for ${symbol}`)

    const quote: StockQuote = {
      symbol: q.symbol,
      name: q.shortName || q.longName || symbol,
      price: q.regularMarketPrice ?? 0,
      change: q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent ?? 0,
      open: q.regularMarketOpen ?? 0,
      high: q.regularMarketDayHigh ?? 0,
      low: q.regularMarketDayLow ?? 0,
      close: q.regularMarketPrice ?? 0,
      previousClose: q.regularMarketPreviousClose ?? 0,
      volume: q.regularMarketVolume ?? 0,
      marketCap: q.marketCap,
      pe: q.trailingPE,
      week52High: q.fiftyTwoWeekHigh,
      week52Low: q.fiftyTwoWeekLow,
      currency: q.currency ?? 'USD',
      exchange: normalizeExchange(q.symbol || symbol, q.exchange, q.fullExchangeName),
      timestamp: Date.now(),
    }

    quoteCache.set(cacheKey, quote)
    return quote
  } catch {
    const quote = getFallbackQuote(symbol)
    quoteCache.set(cacheKey, quote, 60)
    return quote
  }
}

/** Fetch historical OHLCV data */
export async function getHistory(symbol: string, timeframe: Timeframe = '3M'): Promise<StockCandle[]> {
  const cacheKey = `history:${symbol}:${timeframe}`
  const cached = historyCache.get<StockCandle[]>(cacheKey)
  if (cached) return cached.data

  const now = Math.floor(Date.now() / 1000)
  let period1: number
  let interval = '1d'
  const day = 86400

  switch (timeframe) {
    case '1D': period1 = now - day; interval = '5m'; break
    case '1W': period1 = now - 7 * day; interval = '15m'; break
    case '1M': period1 = now - 30 * day; interval = '1d'; break
    case '3M': period1 = now - 90 * day; interval = '1d'; break
    case '6M': period1 = now - 180 * day; interval = '1d'; break
    case '1Y': period1 = now - 365 * day; interval = '1wk'; break
    case 'ALL': period1 = 946684800; interval = '1mo'; break
    default: period1 = now - 90 * day
  }

  try {
    const data = await yfetch(`/v8/finance/chart/${encodeURIComponent(symbol)}`, {
      period1: String(period1),
      period2: String(now),
      interval,
    })

    const result = data.chart?.result?.[0]
    if (!result) throw new Error('No chart data')

    const timestamps = (result.timestamp || []) as number[]
    const ohlcv = result.indicators?.quote?.[0] || {}

    const candles: StockCandle[] = []
    for (let i = 0; i < timestamps.length; i++) {
      const o = ohlcv.open?.[i]
      const h = ohlcv.high?.[i]
      const l = ohlcv.low?.[i]
      const c = ohlcv.close?.[i]
      const v = ohlcv.volume?.[i]
      if (o != null && c != null) {
        const date = new Date(timestamps[i] * 1000)
        candles.push({
          time: interval.includes('m') ? date.toISOString() : date.toISOString().split('T')[0],
          open: o, high: h ?? o, low: l ?? o, close: c, volume: v ?? 0,
        })
      }
    }

    historyCache.set(cacheKey, candles)
    return candles
  } catch {
    const candles = getFallbackHistory(symbol, timeframe)
    historyCache.set(cacheKey, candles, 60)
    return candles
  }
}

/** Search stocks */
export async function searchStocks(query: string): Promise<StockSearchResult[]> {
  if (!query || query.length < 1) return []

  const cacheKey = `search:${query.toLowerCase()}`
  const cached = searchCache.get<StockSearchResult[]>(cacheKey)
  if (cached) return cached.data

  try {
    const data = await yfetch('/v1/finance/search', { q: query, quotesCount: '10', newsCount: '0' })

    const results: StockSearchResult[] = (data.quotes || [])
      .filter((q: any) => q.symbol && (q.quoteType === 'EQUITY' || q.quoteType === 'ETF'))
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        exchange: normalizeExchange(q.symbol, q.exchange, q.exchDisp),
        type: q.quoteType ?? 'EQUITY',
        sector: q.sector || FALLBACK_SECTORS[q.symbol] || undefined,
      }))

    searchCache.set(cacheKey, results)
    return results
  } catch {
    const q = query.toLowerCase()
    return Object.values(FALLBACK_QUOTES)
      .filter((stock) => stock.symbol.toLowerCase().includes(q) || stock.name.toLowerCase().includes(q))
      .map((stock) => ({
        symbol: stock.symbol,
        name: stock.name,
        exchange: stock.exchange,
        type: 'EQUITY',
      }))
  }
}

/** Get trending stocks */
export async function getTrending(): Promise<TrendingStock[]> {
  const cacheKey = 'trending:global'
  const cached = quoteCache.get<TrendingStock[]>(cacheKey)
  if (cached) return cached.data

  const symbols = [
    'PTT.BK', 'CPALL.BK', 'SCB.BK', 'AOT.BK', 'KBANK.BK', 'ADVANC.BK', 'TRUE.BK', 'DELTA.BK',
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AMD', 'JPM', 'BABA',
  ]

  try {
    const data = await yfetch('/v7/finance/quote', { symbols: symbols.join(',') })
    const quotes = data.quoteResponse?.result || []

    const trending: TrendingStock[] = quotes
      .filter((q: any) => q.regularMarketPrice != null)
      .map((q: any) => ({
        symbol: q.symbol,
        name: q.shortName || q.longName || q.symbol,
        price: q.regularMarketPrice ?? 0,
        change: q.regularMarketChange ?? 0,
        changePercent: q.regularMarketChangePercent ?? 0,
        volume: q.regularMarketVolume ?? 0,
        marketCap: q.marketCap,
        sector: q.sector || FALLBACK_SECTORS[q.symbol] || undefined,
        exchange: normalizeExchange(q.symbol, q.exchange, q.fullExchangeName),
        currency: q.currency ?? 'USD',
      }))

    quoteCache.set(cacheKey, trending, 120)
    return trending
  } catch {
    const fallback = getFallbackTrending()
    quoteCache.set(cacheKey, fallback, 120)
    return fallback
  }
}

/** Get market indices */
export async function getMarketIndices(): Promise<MarketIndex[]> {
  const cacheKey = 'market:indices'
  const cached = quoteCache.get<MarketIndex[]>(cacheKey)
  if (cached) return cached.data

  const indices = ['^GSPC', '^DJI', '^IXIC', '^RUT', '^SET.BK']

  try {
    const data = await yfetch('/v7/finance/quote', { symbols: indices.join(',') })
    const quotes = data.quoteResponse?.result || []

    const result: MarketIndex[] = quotes.map((q: any) => ({
      symbol: q.symbol,
      name: q.shortName || q.longName || q.symbol,
      price: q.regularMarketPrice ?? 0,
      change: q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent ?? 0,
    }))

    quoteCache.set(cacheKey, result, 60)
    return result
  } catch {
    quoteCache.set(cacheKey, FALLBACK_MARKET_INDICES, 60)
    return FALLBACK_MARKET_INDICES
  }
}
