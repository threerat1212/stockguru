import type { MarketDataProvider } from '@/lib/market-data/provider'
import type { MarketDataMeta, MarketDataResult } from '@/lib/market-data/types'
import { cacheMeta, demoMeta, liveMeta } from '@/lib/market-data/types'
import { quoteCache, historyCache, searchCache } from '@/lib/cache'
import type { MarketIndex, StockCandle, StockQuote, StockSearchResult, Timeframe, TrendingStock } from '@/types/stock'
import { yahooProvider } from '@/lib/market-data/providers/yahoo-provider'

export const MARKET_DATA_PROVIDER_SET = 'set'

const SIAMCHART_STOCK_LIST_URL = 'https://siamchart.com/stock/'
const SIAMCHART_HISTORY_URL = 'http://siamchart.com/query/history'
const SIAMCHART_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'

const SIAMCHART_HEADERS: Record<string, string> = {
  'User-Agent': SIAMCHART_UA,
  'Accept': '*/*',
  'Accept-Language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7',
  'X-Requested-With': 'XMLHttpRequest',
}

const INDEX_SYMBOLS: Array<{ symbol: string; yahooSymbol: string; name: string }> = [
  { symbol: 'SET', yahooSymbol: '^SET.BK', name: 'SET Index' },
  { symbol: 'SET50', yahooSymbol: '^SET50.BK', name: 'SET50' },
  { symbol: 'SET100', yahooSymbol: '^SET100.BK', name: 'SET100' },
  { symbol: 'SETHD', yahooSymbol: '^SETHD.BK', name: 'SETHD' },
  { symbol: 'MAI', yahooSymbol: '^MAI.BK', name: 'mai Index' },
]

const SECTOR_LABELS: Record<string, string> = {
  AGRO: 'เกษตรและอุตสาหกรรมอาหาร',
  CONSUMP: 'สินค้าอุปโภคบริโภค',
  FINCIAL: 'การเงิน',
  INDUS: 'สินค้าอุตสาหกรรม',
  PROPCON: 'อสังหาริมทรัพย์และก่อสร้าง',
  RESOURC: 'ทรัพยากร',
  SERVICE: 'บริการ',
  TECH: 'เทคโนโลยี',
  PF_REIT: 'อสังหาริมทรัพย์และกองทุนรวมโครงสร้างพื้นฐาน',
  FOREIGN: 'กระดานต่างชาติ',
}

let siamCookie: string | null = null
let stockRowsCache: { data: SiamchartStockRow[]; expiresAt: number } | null = null

export interface SiamchartStockRow {
  symbol: string
  yahooSymbol: string
  name: string
  exchange: 'SET' | 'mai'
  sector?: string
  industry?: string
  tags: string[]
  close: number
  changePercent: number
  volume: number
  value?: number
  marketCap?: number
  pe?: number
  pb?: number
  de?: number
  dividendYield?: number
  freeFloat?: number
  links?: string
  sign?: string
}

interface SiamchartHistoryResponse {
  s: string
  t: number[]
  o: number[]
  h: number[]
  l: number[]
  c: number[]
  v: number[]
}

function joinCookies(setCookies: string[]): string {
  return setCookies.map((c) => c.split(';')[0].trim()).filter(Boolean).join('; ')
}

async function siamFetch(url: string, init: RequestInit = {}): Promise<string> {
  const headers: Record<string, string> = { ...SIAMCHART_HEADERS, ...(init.headers as Record<string, string> | undefined) }
  if (siamCookie) headers.Cookie = siamCookie

  const res = await fetch(url, { ...init, headers })
  const setCookie = res.headers.getSetCookie?.()
  if (setCookie?.length) siamCookie = joinCookies(setCookie)

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`SiamChart API ${res.status}: ${body.slice(0, 160)}`)
  }

  return res.text()
}

function parseNumber(value: unknown): number | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  const text = String(value).trim().replace(/,/g, '').replace(/&nbsp;/g, '')
  if (!text || text === '-') return undefined
  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseTags(name: string): { cleanName: string; tags: string[] } {
  const match = name.match(/\[(.*)\]/)
  const tags = match ? match[1].split(',').map((tag) => tag.trim()).filter(Boolean) : []
  const cleanName = name.replace(/\s*\[.*\]/, '').trim()
  return { cleanName, tags }
}

function sectorFromTags(tags: string[]) {
  const normalizedIndustryTags = tags.filter((tag) => tag.endsWith('-m') || tag.endsWith('-ms'))
  const msIndustry = normalizedIndustryTags.find((tag) => tag.endsWith('-ms'))
  const mIndustry = normalizedIndustryTags.find((tag) => tag.endsWith('-m'))
  const sector =
    tags.find((tag) => !['MAI', 'SET50', 'SET100', 'SETHD'].includes(tag) && !tag.endsWith('-m') && !tag.endsWith('-ms')) ??
    msIndustry?.replace('-ms', '') ??
    mIndustry?.replace('-m', '')

  return {
    sectorCode: sector,
    sector: sector ? SECTOR_LABELS[sector] ?? sector : undefined,
    industry: msIndustry ?? mIndustry ?? tags.find((tag) => tag !== sector && !['MAI', 'SET50', 'SET100', 'SETHD'].includes(tag)) ?? undefined,
  }
}

export function parseSiamchartStockRows(html: string): SiamchartStockRow[] {
  const match = html.match(/store_real_data\s*=\s*\[([\s\S]*?)\];/)
  if (!match) return []

  const rawRows = match[1]
    .replace(/&nbsp;/g, '')
    .replace(/'/g, '"')
    .replace(/\],\s*\[/g, '],[')
    .replace(/,\s*}/g, '}')
    .replace(/,\s*$/m, '')
    .trim()
  const jsArray = `[${rawRows}]`
  const rows = JSON.parse(jsArray) as string[][]
  return rows
    .map((row) => {
      const rawName = row[2] ?? row[1] ?? ''
      const { cleanName, tags } = parseTags(rawName)
      const { sectorCode, sector, industry } = sectorFromTags(tags)
      const symbol = row[1]?.trim()
      if (!symbol) return null

      return {
        symbol,
        yahooSymbol: `${symbol}.BK`,
        name: cleanName || symbol,
        exchange: tags.includes('MAI') ? 'mai' : 'SET',
        sector,
        industry,
        tags,
        close: parseNumber(row[5]) ?? 0,
        changePercent: parseNumber(row[6]) ?? 0,
        volume: parseNumber(row[7]) ?? 0,
        value: parseNumber(row[8]),
        marketCap: parseNumber(row[9]) == null ? undefined : parseNumber(row[9])! * 1_000_000,
        pe: parseNumber(row[11]),
        pb: parseNumber(row[12]),
        de: parseNumber(row[13]),
        dividendYield: parseNumber(row[19]),
        freeFloat: parseNumber(row[20]),
        links: row[3],
        sign: row[4],
      } as SiamchartStockRow
    })
    .filter((row): row is SiamchartStockRow => Boolean(row?.symbol))
}

export async function fetchSiamchartStockRows(): Promise<SiamchartStockRow[]> {
  const cached = quoteCache.get<SiamchartStockRow[]>('siamchart:stock-rows')
  if (cached) return cached.data
  if (stockRowsCache && stockRowsCache.expiresAt > Date.now()) return stockRowsCache.data

  const html = await siamFetch(SIAMCHART_STOCK_LIST_URL)
  const rows = parseSiamchartStockRows(html)
  if (!rows.length) throw new Error('ไม่พบรายการหุ้นไทยจาก SiamChart')

  stockRowsCache = { data: rows, expiresAt: Date.now() + 5 * 60 * 1000 }
  quoteCache.set('siamchart:stock-rows', rows, 300)
  return rows
}

function normalizeSiamSymbol(symbol: string): string {
  return symbol.toUpperCase().replace(/^\^/, '').replace(/\.BK$/, '')
}

function isIndexSymbol(symbol: string): boolean {
  return INDEX_SYMBOLS.some((index) => index.symbol === normalizeSiamSymbol(symbol))
}

function timeframeToDays(timeframe: Timeframe): number {
  switch (timeframe) {
    case '1D':
      return 3
    case '1W':
      return 21
    case '1M':
      return 95
    case '3M':
      return 275
    case '6M':
      return 550
    case '1Y':
      return 1100
    case 'ALL':
      return 10000
    default:
      return 275
  }
}

export function parseSiamchartHistory(html: string): StockCandle[] {
  const data = JSON.parse(html) as SiamchartHistoryResponse
  if (data.s !== 'ok') return []

  const timestamps = data.t ?? []
  const open = data.o ?? []
  const high = data.h ?? []
  const low = data.l ?? []
  const close = data.c ?? []
  const volume = data.v ?? []

  return timestamps
    .map((timestamp, index) => {
      const o = open[index]
      const h = high[index]
      const l = low[index]
      const c = close[index]
      if (o == null || c == null) return null

      const date = new Date(timestamp * 1000)
      return {
        time: date.toISOString().split('T')[0],
        open: Number(o),
        high: Number(h ?? o),
        low: Number(l ?? o),
        close: Number(c),
        volume: Number(volume[index] ?? 0),
      }
    })
    .filter((candle): candle is StockCandle => Boolean(candle))
}

export async function fetchSiamchartHistory(symbol: string, timeframe: Timeframe = '3M'): Promise<StockCandle[]> {
  const cacheKey = `siamchart:history:${normalizeSiamSymbol(symbol)}:${timeframe}`
  const cached = historyCache.get<StockCandle[]>(cacheKey)
  if (cached) return cached.data

  const now = Math.floor(Date.now() / 1000)
  const period1 = now - timeframeToDays(timeframe) * 86_400
  const html = await siamFetch(`${SIAMCHART_HISTORY_URL}?symbol=${encodeURIComponent(symbol)}&resolution=D&from=${period1}&to=${now}`)
  const candles = parseSiamchartHistory(html).filter((candle) => {
    const candleTime = new Date(candle.time).getTime()
    return candleTime >= period1 * 1000
  })

  historyCache.set(cacheKey, candles, 300)
  return candles
}

async function getRecentHistory(symbol: string, timeframe: Timeframe): Promise<StockCandle[]> {
  try {
    return await fetchSiamchartHistory(symbol, timeframe)
  } catch (error) {
    console.error(`[set-provider] history fallback for ${symbol}:`, error)
    const result = await yahooProvider.getHistory(`${symbol}.BK`, timeframe)
    return result.data
  }
}

function meta(provider = 'SiamChart', source: MarketDataMeta['source'] = 'siamchart'): MarketDataMeta {
  return liveMeta(source, provider)
}

function toSearchResult(row: SiamchartStockRow): StockSearchResult {
  return {
    symbol: row.yahooSymbol,
    name: row.name,
    exchange: row.exchange,
    type: 'EQUITY',
    sector: row.sector,
  }
}

function toTrending(row: SiamchartStockRow): TrendingStock {
  return {
    symbol: row.yahooSymbol,
    name: row.name,
    price: row.close,
    change: row.close * (row.changePercent / 100),
    changePercent: row.changePercent,
    volume: row.volume,
    marketCap: row.marketCap,
    sector: row.sector,
    exchange: row.exchange,
    currency: 'THB',
  }
}

async function getStockRowsBySymbol(symbol: string): Promise<Map<string, SiamchartStockRow>> {
  const rows = await fetchSiamchartStockRows()
  const map = new Map<string, SiamchartStockRow>()
  for (const row of rows) {
    map.set(row.symbol, row)
    map.set(row.yahooSymbol, row)
  }
  return map
}

async function getQuoteFromSiamchart(symbol: string): Promise<MarketDataResult<StockQuote>> {
  const normalized = normalizeSiamSymbol(symbol)
  const rows = await getStockRowsBySymbol(normalized)
  const row = rows.get(symbol) ?? rows.get(normalized) ?? rows.get(`${normalized}.BK`)
  if (!row) throw new Error(`ไม่พบข้อมูลราคาสำหรับ ${symbol}`)

  const history = await getRecentHistory(normalized, '1M')
  const last = history[history.length - 1]
  const previous = history[history.length - 2]
  const price = row.close || last?.close || 0
  const previousClose = previous?.close ?? price
  const change = row.changePercent ? price * (row.changePercent / 100) : price - previousClose

  const quote: StockQuote = {
    symbol: row.yahooSymbol,
    name: row.name,
    price,
    change,
    changePercent: row.changePercent,
    open: last?.open ?? price,
    high: last?.high ?? price,
    low: last?.low ?? price,
    close: price,
    previousClose,
    volume: row.volume,
    marketCap: row.marketCap,
    pe: row.pe,
    currency: 'THB',
    exchange: row.exchange,
    timestamp: Date.now(),
  }

  quoteCache.set(`quote:${row.yahooSymbol}`, quote, 300)
  return { data: quote, meta: meta('SiamChart') }
}

async function getHistoryFromSiamchart(symbol: string, timeframe: Timeframe): Promise<MarketDataResult<StockCandle[]>> {
  const normalized = normalizeSiamSymbol(symbol)
  const rows = await getStockRowsBySymbol(normalized)
  const row = rows.get(normalized) ?? rows.get(symbol) ?? rows.get(`${normalized}.BK`)
  if (!row && !isIndexSymbol(normalized)) throw new Error(`ไม่พบข้อมูลกราฟสำหรับ ${symbol}`)

  const candles = await fetchSiamchartHistory(normalized, timeframe)
  if (!candles.length) throw new Error(`ไม่พบข้อมูลกราฟสำหรับ ${symbol}`)

  historyCache.set(`history:${row?.yahooSymbol ?? normalized}:${timeframe}`, candles, 300)
  return { data: candles, meta: meta('SiamChart') }
}

async function getMarketIndicesFromSiamchart(): Promise<MarketDataResult<MarketIndex[]>> {
  const cacheKey = 'market:set-indices'
  const cached = quoteCache.get<MarketIndex[]>(cacheKey)
  if (cached) return { data: cached.data, meta: cacheMeta('SiamChart') }

  const indices: MarketIndex[] = []
  for (const index of INDEX_SYMBOLS) {
    try {
      const candles = await fetchSiamchartHistory(index.symbol, '1M')
      const latest = candles[candles.length - 1]
      const previous = candles[candles.length - 2]
      if (!latest) continue

      const price = latest.close
      const change = previous ? price - previous.close : 0
      const changePercent = previous && previous.close ? (change / previous.close) * 100 : 0

      indices.push({
        symbol: index.symbol,
        name: index.name,
        price,
        change,
        changePercent,
      })
    } catch (error) {
      console.error(`[set-provider] index ${index.symbol} failed:`, error)
    }
  }

  if (!indices.length) {
    const yahooResult = await yahooProvider.getMarketIndices()
    quoteCache.set(cacheKey, yahooResult.data, 60)
    return yahooResult
  }

  quoteCache.set(cacheKey, indices, 300)
  return { data: indices, meta: meta('SiamChart') }
}

async function searchThaiStocks(query: string): Promise<StockSearchResult[]> {
  const normalizedQuery = query.trim().toUpperCase()
  const rows = await fetchSiamchartStockRows()
  const results = rows
    .filter((row) => {
      const haystack = `${row.symbol} ${row.yahooSymbol} ${row.name} ${row.sector ?? ''} ${row.industry ?? ''}`.toUpperCase()
      return haystack.includes(normalizedQuery)
    })
    .slice(0, 20)
    .map(toSearchResult)

  if (results.length) return results

  const yahooResults = await yahooProvider.searchStocks(query)
  return yahooResults
}

export const setProvider: MarketDataProvider = {
  id: MARKET_DATA_PROVIDER_SET,
  displayName: 'SET/mai (SiamChart + Yahoo fallback)',

  async getQuote(symbol: string): Promise<MarketDataResult<StockQuote>> {
    const normalized = normalizeSiamSymbol(symbol)
    const rows = await getStockRowsBySymbol(normalized).catch(() => new Map<string, SiamchartStockRow>())
    const row = rows.get(normalized) ?? rows.get(symbol) ?? rows.get(`${normalized}.BK`)

    if (row || symbol.toUpperCase().endsWith('.BK') || isIndexSymbol(normalized)) {
      try {
        return await getQuoteFromSiamchart(symbol)
      } catch (error) {
        console.error(`[set-provider] quote failed:`, error)
      }
    }

    return yahooProvider.getQuote(symbol)
  },

  async getHistory(symbol: string, timeframe: Timeframe = '3M'): Promise<MarketDataResult<StockCandle[]>> {
    const normalized = normalizeSiamSymbol(symbol)
    const isThai = symbol.toUpperCase().endsWith('.BK') || isIndexSymbol(normalized)
    if (isThai) {
      try {
        return await getHistoryFromSiamchart(symbol, timeframe)
      } catch (error) {
        console.error(`[set-provider] history failed:`, error)
      }
    }

    return yahooProvider.getHistory(symbol, timeframe)
  },

  async searchStocks(query: string): Promise<StockSearchResult[]> {
    const cacheKey = `search:set:${query.toLowerCase()}`
    const cached = searchCache.get<StockSearchResult[]>(cacheKey)
    if (cached) return cached.data

    try {
      const results = await searchThaiStocks(query)
      searchCache.set(cacheKey, results)
      return results
    } catch (error) {
      console.error(`[set-provider] search failed:`, error)
      return yahooProvider.searchStocks(query)
    }
  },

  async getTrending(): Promise<MarketDataResult<TrendingStock[]>> {
    const cacheKey = 'trending:set'
    const cached = quoteCache.get<TrendingStock[]>(cacheKey)
    if (cached) return { data: cached.data, meta: cacheMeta('SiamChart') }

    try {
      const rows = await fetchSiamchartStockRows()
      const trending = rows
        .filter((row) => row.close > 0)
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 30)
        .map(toTrending)

      quoteCache.set(cacheKey, trending, 300)
      return { data: trending, meta: meta('SiamChart') }
    } catch (error) {
      console.error(`[set-provider] trending failed:`, error)
      const yahooResult = await yahooProvider.getTrending()
      return {
        ...yahooResult,
        meta: yahooResult.meta.isDemo ? demoMeta(yahooResult.meta.warning ?? 'ไม่สามารถดึงข้อมูล SET/mai ได้') : yahooResult.meta,
      }
    }
  },

  async getMarketIndices(): Promise<MarketDataResult<MarketIndex[]>> {
    return getMarketIndicesFromSiamchart()
  },
}
