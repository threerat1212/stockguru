import type { StockQuote, StockCandle, TrendingStock, StockSearchResult, MarketIndex, Timeframe } from '@/types/stock'
import { quoteCache, historyCache, searchCache } from '@/lib/cache'
import type { MarketDataMeta, MarketDataResult } from '@/lib/market-data/types'
import { cacheMeta, demoMeta, liveMeta } from '@/lib/market-data/types'
import type { MarketDataProvider } from '@/lib/market-data/provider'

const YAHOO_BASE = 'https://query1.finance.yahoo.com'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'
const YAHOO_HEADERS: Record<string, string> = {
  'User-Agent': UA,
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Cache-Control': 'max-age=0',
}

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

function getKnownFallbackQuote(symbol: string): StockQuote | null {
  const key = symbol.toUpperCase()
  const candidate = FALLBACK_QUOTES[key] || FALLBACK_QUOTES[`${key}.BK`]
  if (!candidate) return null
  return { ...candidate, timestamp: Date.now() }
}

const DEMO_WARNING =
  'ไม่สามารถดึงราคาสดได้ — กำลังแสดงข้อมูลตัวอย่างเท่านั้น อย่าใช้ตัดสินใจลงทุน'

// Yahoo's shortName for SET (.BK) tickers is an awkward "PTT_PTT" form, so prefer
// a curated Thai name, then the clean longName, before falling back to shortName.
function resolveName(symbol: string, shortName?: string, longName?: string): string {
  const curated = FALLBACK_QUOTES[symbol.toUpperCase()]?.name
  if (curated) return curated
  if (symbol.toUpperCase().endsWith('.BK') && longName) return longName
  return shortName || longName || symbol
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
  const quote = getKnownFallbackQuote(symbol)
  if (!quote) return []
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

// Yahoo's /v7/finance/quote endpoint requires a session cookie + crumb token.
// We seed a cookie from a finance page, exchange it for a crumb, and cache both.
const CRUMB_TTL_MS = 30 * 60 * 1000
let crumbCache: { crumb: string; cookie: string; expires: number } | null = null

function joinCookies(setCookies: string[]): string {
  return setCookies.map((c) => c.split(';')[0].trim()).filter(Boolean).join('; ')
}

async function fetchCrumb(): Promise<{ crumb: string; cookie: string } | null> {
  try {
    // fc.yahoo.com sets the consent cookie (A3) with a tiny response — the full
    // finance.yahoo.com page overflows undici's header limit and throws.
    const seed = await fetch('https://fc.yahoo.com', {
      headers: { 'User-Agent': UA },
    })
    const cookie = joinCookies(seed.headers.getSetCookie())
    if (!cookie) return null
    const crumbRes = await fetch(`${YAHOO_BASE}/v1/test/getcrumb`, {
      headers: { 'User-Agent': UA, Cookie: cookie },
    })
    if (!crumbRes.ok) return null
    const crumb = (await crumbRes.text()).trim()
    if (!crumb || crumb.startsWith('{')) return null
    return { crumb, cookie }
  } catch {
    return null
  }
}

async function getCrumb(force = false): Promise<{ crumb: string; cookie: string } | null> {
  if (!force && crumbCache && crumbCache.expires > Date.now()) {
    return { crumb: crumbCache.crumb, cookie: crumbCache.cookie }
  }
  const fresh = await fetchCrumb()
  crumbCache = fresh ? { ...fresh, expires: Date.now() + CRUMB_TTL_MS } : null
  return fresh
}

async function yfetch(path: string, params: Record<string, string> = {}, useCrumb = false) {
  const request = async (cred: { crumb: string; cookie: string } | null) => {
    const merged = cred ? { ...params, crumb: cred.crumb } : params
    const qs = new URLSearchParams(merged).toString()
    const url = `${YAHOO_BASE}${path}${qs ? '?' + qs : ''}`
    const headers = cred ? { ...YAHOO_HEADERS, Cookie: cred.cookie } : YAHOO_HEADERS
    return { res: await fetch(url, { headers }), url }
  }

  let cred = useCrumb ? await getCrumb() : null
  let { res, url } = await request(cred)
  // A stale crumb/cookie returns 401 — refresh once and retry.
  if (res.status === 401 && useCrumb) {
    cred = await getCrumb(true)
    ;({ res, url } = await request(cred))
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error(`[Yahoo] ${res.status} ${url} body=${body.slice(0, 200)}`)
    throw new Error(`Yahoo API ${res.status}`)
  }
  return res.json()
}

/** Fetch real-time stock quote */
export async function getQuote(symbol: string): Promise<MarketDataResult<StockQuote>> {
  const cacheKey = `quote:${symbol}`
  const cached = quoteCache.get<StockQuote>(cacheKey)
  if (cached) {
    return { data: cached.data, meta: cacheMeta() }
  }

  try {
    const data = await yfetch(`/v7/finance/quote`, { symbols: symbol }, true)
    const q = data.quoteResponse?.result?.[0]
    if (!q) throw new Error(`No data for ${symbol}`)

    const quote: StockQuote = {
      symbol: q.symbol,
      name: resolveName(q.symbol || symbol, q.shortName, q.longName),
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
    return { data: quote, meta: liveMeta('yahoo') }
  } catch (err) {
    console.error(`[getQuote] ${symbol} failed:`, err)
    const quote = getKnownFallbackQuote(symbol)
    if (!quote) {
      throw new Error(`ไม่พบข้อมูลราคาสำหรับ ${symbol} และไม่มีข้อมูลตัวอย่าง`)
    }
    const meta = demoMeta(DEMO_WARNING)
    quoteCache.set(cacheKey, quote, 60)
    return { data: quote, meta }
  }
}

/** Fetch historical OHLCV data */
export async function getHistory(
  symbol: string,
  timeframe: Timeframe = '3M'
): Promise<MarketDataResult<StockCandle[]>> {
  const cacheKey = `history:${symbol}:${timeframe}`
  const cached = historyCache.get<StockCandle[]>(cacheKey)
  if (cached) return { data: cached.data, meta: cacheMeta() }

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
    return { data: candles, meta: liveMeta('yahoo') }
  } catch (err) {
    console.error(`[getHistory] ${symbol} ${timeframe} failed:`, err)
    const candles = getFallbackHistory(symbol, timeframe)
    if (!candles.length) {
      throw new Error(`ไม่พบข้อมูลกราฟสำหรับ ${symbol}`)
    }
    historyCache.set(cacheKey, candles, 60)
    return { data: candles, meta: demoMeta(DEMO_WARNING) }
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
      .filter((q: Record<string, unknown>) => q.symbol && (q.quoteType === 'EQUITY' || q.quoteType === 'ETF'))
      .map((q: Record<string, unknown>) => ({
        symbol: String(q.symbol),
        name: String(q.shortname || q.longname || q.symbol),
        exchange: normalizeExchange(String(q.symbol), q.exchange as string | undefined, q.exchDisp as string | undefined),
        type: String(q.quoteType ?? 'EQUITY'),
        sector: (q.sector as string) || FALLBACK_SECTORS[String(q.symbol)] || undefined,
      }))

    searchCache.set(cacheKey, results)
    return results
  } catch (err) {
    console.error(`[searchStocks] "${query}" failed:`, err)
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

export async function searchStocksWithMeta(query: string): Promise<MarketDataResult<StockSearchResult[]>> {
  const results = await searchStocks(query)
  return { data: results, meta: liveMeta('yahoo') }
}

/** Get trending stocks */
export async function getTrending(): Promise<MarketDataResult<TrendingStock[]>> {
  const cacheKey = 'trending:global'
  const cached = quoteCache.get<TrendingStock[]>(cacheKey)
  if (cached) return { data: cached.data, meta: cacheMeta() }

  const symbols = [
    // SET / mai
    'PTT.BK', 'CPALL.BK', 'SCB.BK', 'AOT.BK', 'KBANK.BK', 'ADVANC.BK', 'TRUE.BK', 'DELTA.BK',
    'BBL.BK', 'MINT.BK', 'TOP.BK', 'GULF.BK', 'EGCO.BK', 'SCC.BK', 'BDMS.BK', 'HMPRO.BK',
    'INTUCH.BK', 'CPF.BK', 'BANPU.BK', 'TU.BK',
    // US
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'TSLA', 'AMD', 'JPM', 'BABA',
    'NFLX', 'V', 'MA', 'WMT', 'COST',
  ]

  try {
    const data = await yfetch('/v7/finance/quote', { symbols: symbols.join(',') }, true)
    const quotes = data.quoteResponse?.result || []

    const trending: TrendingStock[] = quotes
      .filter((q: Record<string, unknown>) => q.regularMarketPrice != null)
      .map((q: Record<string, unknown>) => ({
        symbol: String(q.symbol),
        name: resolveName(String(q.symbol), q.shortName as string | undefined, q.longName as string | undefined),
        price: Number(q.regularMarketPrice ?? 0),
        change: Number(q.regularMarketChange ?? 0),
        changePercent: Number(q.regularMarketChangePercent ?? 0),
        volume: Number(q.regularMarketVolume ?? 0),
        marketCap: q.marketCap as number | undefined,
        sector: (q.sector as string) || FALLBACK_SECTORS[String(q.symbol)] || undefined,
        exchange: normalizeExchange(String(q.symbol), q.exchange as string | undefined, q.fullExchangeName as string | undefined),
        currency: String(q.currency ?? 'USD'),
      }))

    quoteCache.set(cacheKey, trending, 120)
    return { data: trending, meta: liveMeta('yahoo') }
  } catch (err) {
    console.error(`[getTrending] failed:`, err)
    const fallback = getFallbackTrending()
    quoteCache.set(cacheKey, fallback, 120)
    return { data: fallback, meta: demoMeta(DEMO_WARNING) }
  }
}

/** Get market indices */
export async function getMarketIndices(): Promise<MarketDataResult<MarketIndex[]>> {
  const cacheKey = 'market:indices'
  const cached = quoteCache.get<MarketIndex[]>(cacheKey)
  if (cached) return { data: cached.data, meta: cacheMeta() }

  const indices = ['^GSPC', '^DJI', '^IXIC', '^RUT', '^SET.BK']

  try {
    const data = await yfetch('/v7/finance/quote', { symbols: indices.join(',') }, true)
    const quotes = data.quoteResponse?.result || []

    const result: MarketIndex[] = quotes.map((q: Record<string, unknown>) => ({
      symbol: String(q.symbol),
      name: String(q.shortName || q.longName || q.symbol),
      price: Number(q.regularMarketPrice ?? 0),
      change: Number(q.regularMarketChange ?? 0),
      changePercent: Number(q.regularMarketChangePercent ?? 0),
    }))

    quoteCache.set(cacheKey, result, 60)
    return { data: result, meta: liveMeta('yahoo') }
  } catch (err) {
    console.error(`[getMarketIndices] failed:`, err)
    quoteCache.set(cacheKey, FALLBACK_MARKET_INDICES, 60)
    return { data: FALLBACK_MARKET_INDICES, meta: demoMeta(DEMO_WARNING) }
  }
}

export const yahooProvider: MarketDataProvider = {
  id: 'yahoo',
  displayName: 'Yahoo Finance',
  getQuote,
  getHistory,
  searchStocksWithMeta,
  searchStocks,
  getTrending,
  getMarketIndices,
}

