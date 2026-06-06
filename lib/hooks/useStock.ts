'use client'

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import type { StockQuote, StockCandle, TrendingStock, StockSearchResult, NewsArticle, AIAnalysis, MarketIndex } from '@/types/stock'
import { MARKET_NEWS } from '@/lib/data/news'

// Mock data for demo
const MOCK_STOCKS: Record<string, StockQuote> = {
  'PTT.BK': {
    symbol: 'PTT.BK', name: 'บริษัท ปตท. จำกัด (มหาชน)', price: 38.50, change: 0.75,
    changePercent: 1.99, open: 37.75, high: 39.00, low: 37.50, close: 38.50,
    previousClose: 37.75, volume: 45_230_000, marketCap: 1_370_000_000_000,
    pe: 12.5, week52High: 42.00, week52Low: 31.25, currency: 'THB', exchange: 'SET', timestamp: Date.now()
  },
  'SCB.BK': {
    symbol: 'SCB.BK', name: 'ธนาคารไทยพาณิชย์ จำกัด (มหาชน)', price: 142.00, change: -1.50,
    changePercent: -1.04, open: 144.00, high: 144.50, low: 141.00, close: 142.00,
    previousClose: 143.50, volume: 8_750_000, marketCap: 538_000_000_000,
    pe: 10.2, week52High: 158.00, week52Low: 118.00, currency: 'THB', exchange: 'SET', timestamp: Date.now()
  },
  'CPALL.BK': {
    symbol: 'CPALL.BK', name: 'บริษัท ซีพี ออลล์ จำกัด (มหาชน)', price: 62.25, change: 1.25,
    changePercent: 2.05, open: 61.00, high: 62.75, low: 60.50, close: 62.25,
    previousClose: 61.00, volume: 22_340_000, marketCap: 700_000_000_000,
    pe: 28.3, week52High: 68.00, week52Low: 51.00, currency: 'THB', exchange: 'SET', timestamp: Date.now()
  },
  'AOT.BK': {
    symbol: 'AOT.BK', name: 'บริษัท ท่าอากาศยานไทย จำกัด (มหาชน)', price: 68.50, change: -0.25,
    changePercent: -0.36, open: 69.00, high: 69.50, low: 68.00, close: 68.50,
    previousClose: 68.75, volume: 12_450_000, marketCap: 960_000_000_000,
    pe: 45.1, week52High: 78.00, week52Low: 58.00, currency: 'THB', exchange: 'SET', timestamp: Date.now()
  },
  'KBANK.BK': {
    symbol: 'KBANK.BK', name: 'ธนาคารกสิกรไทย จำกัด (มหาชน)', price: 178.50, change: 2.00,
    changePercent: 1.13, open: 176.50, high: 179.00, low: 176.00, close: 178.50,
    previousClose: 176.50, volume: 6_890_000, marketCap: 435_000_000_000,
    pe: 9.8, week52High: 195.00, week52Low: 145.00, currency: 'THB', exchange: 'SET', timestamp: Date.now()
  },
  'ADVANC.BK': {
    symbol: 'ADVANC.BK', name: 'บริษัท แอดวานซ์ อินโฟร์ เซอร์วิส จำกัด (มหาชน)', price: 245.00, change: 3.00,
    changePercent: 1.24, open: 242.00, high: 246.00, low: 241.50, close: 245.00,
    previousClose: 242.00, volume: 4_560_000, marketCap: 730_000_000_000,
    pe: 22.5, week52High: 260.00, week52Low: 198.00, currency: 'THB', exchange: 'SET', timestamp: Date.now()
  },
  AAPL: {
    symbol: 'AAPL', name: 'Apple Inc.', price: 196.58, change: 2.35,
    changePercent: 1.21, open: 194.20, high: 197.10, low: 193.84, close: 196.58,
    previousClose: 194.23, volume: 52_400_000, marketCap: 3_010_000_000_000,
    pe: 30.4, week52High: 237.49, week52Low: 169.21, currency: 'USD', exchange: 'NASDAQ', timestamp: Date.now()
  },
  MSFT: {
    symbol: 'MSFT', name: 'Microsoft Corporation', price: 472.12, change: 4.82,
    changePercent: 1.03, open: 468.20, high: 473.80, low: 466.30, close: 472.12,
    previousClose: 467.30, volume: 21_800_000, marketCap: 3_510_000_000_000,
    pe: 35.1, week52High: 489.46, week52Low: 364.13, currency: 'USD', exchange: 'NASDAQ', timestamp: Date.now()
  },
  NVDA: {
    symbol: 'NVDA', name: 'NVIDIA Corporation', price: 141.22, change: 5.64,
    changePercent: 4.16, open: 136.50, high: 142.60, low: 135.70, close: 141.22,
    previousClose: 135.58, volume: 188_200_000, marketCap: 3_470_000_000_000,
    pe: 48.8, week52High: 153.13, week52Low: 86.62, currency: 'USD', exchange: 'NASDAQ', timestamp: Date.now()
  },
  TSLA: {
    symbol: 'TSLA', name: 'Tesla, Inc.', price: 181.45, change: -3.12,
    changePercent: -1.69, open: 185.10, high: 186.70, low: 179.80, close: 181.45,
    previousClose: 184.57, volume: 91_600_000, marketCap: 579_000_000_000,
    pe: 58.2, week52High: 299.29, week52Low: 138.80, currency: 'USD', exchange: 'NASDAQ', timestamp: Date.now()
  },
  JPM: {
    symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 223.40, change: 1.90,
    changePercent: 0.86, open: 221.20, high: 224.10, low: 220.90, close: 223.40,
    previousClose: 221.50, volume: 9_800_000, marketCap: 635_000_000_000,
    pe: 13.1, week52High: 226.75, week52Low: 168.44, currency: 'USD', exchange: 'NYSE', timestamp: Date.now()
  },
}

const MOCK_TRENDING: TrendingStock[] = [
  { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 141.22, change: 5.64, changePercent: 4.16, volume: 188_200_000, marketCap: 3_470_000_000_000, sector: 'เซมิคอนดักเตอร์', exchange: 'NASDAQ', currency: 'USD' },
  { symbol: 'TSLA', name: 'Tesla, Inc.', price: 181.45, change: -3.12, changePercent: -1.69, volume: 91_600_000, marketCap: 579_000_000_000, sector: 'EV', exchange: 'NASDAQ', currency: 'USD' },
  { symbol: 'AAPL', name: 'Apple Inc.', price: 196.58, change: 2.35, changePercent: 1.21, volume: 52_400_000, marketCap: 3_010_000_000_000, sector: 'เทคโนโลยี', exchange: 'NASDAQ', currency: 'USD' },
  { symbol: 'PTT.BK', name: 'ปตท.', price: 38.50, change: 0.75, changePercent: 1.99, volume: 45_230_000, marketCap: 1_370_000_000_000, sector: 'พลังงาน', exchange: 'SET', currency: 'THB' },
  { symbol: 'CPALL.BK', name: 'ซีพี ออลล์', price: 62.25, change: 1.25, changePercent: 2.05, volume: 22_340_000, marketCap: 700_000_000_000, sector: 'ค้าปลีก', exchange: 'SET', currency: 'THB' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', price: 472.12, change: 4.82, changePercent: 1.03, volume: 21_800_000, marketCap: 3_510_000_000_000, sector: 'ซอฟต์แวร์', exchange: 'NASDAQ', currency: 'USD' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', price: 223.40, change: 1.90, changePercent: 0.86, volume: 9_800_000, marketCap: 635_000_000_000, sector: 'การเงิน', exchange: 'NYSE', currency: 'USD' },
  { symbol: 'SCB.BK', name: 'ไทยพาณิชย์', price: 142.00, change: -1.50, changePercent: -1.04, volume: 8_750_000, marketCap: 538_000_000_000, sector: 'ธนาคาร', exchange: 'SET', currency: 'THB' },
  { symbol: 'AOT.BK', name: 'ท่าอากาศยาน', price: 68.50, change: -0.25, changePercent: -0.36, volume: 12_450_000, marketCap: 960_000_000_000, sector: 'ขนส่ง', exchange: 'SET', currency: 'THB' },
  { symbol: 'KBANK.BK', name: 'กสิกรไทย', price: 178.50, change: 2.00, changePercent: 1.13, volume: 6_890_000, marketCap: 435_000_000_000, sector: 'ธนาคาร', exchange: 'SET', currency: 'THB' },
  { symbol: 'ADVANC.BK', name: 'เอไอเอส', price: 245.00, change: 3.00, changePercent: 1.24, volume: 4_560_000, marketCap: 730_000_000_000, sector: 'สื่อสาร', exchange: 'SET', currency: 'THB' },
]

const MOCK_INDICES: MarketIndex[] = [
  { symbol: 'SET', name: 'SET Index', price: 1385.42, change: 12.58, changePercent: 0.92 },
  { symbol: 'SET50', name: 'SET50', price: 965.30, change: 8.20, changePercent: 0.86 },
  { symbol: 'S&P 500', name: 'S&P 500', price: 5312.18, change: 18.42, changePercent: 0.35 },
  { symbol: 'NASDAQ', name: 'NASDAQ Composite', price: 17187.90, change: 91.76, changePercent: 0.54 },
  { symbol: 'DOW', name: 'Dow Jones', price: 38935.12, change: -41.22, changePercent: -0.11 },
  { symbol: 'mai', name: 'mai Index', price: 425.80, change: -2.30, changePercent: -0.54 },
]

function generateCandles(symbol: string, days: number = 90): StockCandle[] {
  const basePrice = MOCK_STOCKS[symbol]?.price ?? 100
  const candles: StockCandle[] = []
  const now = new Date()

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    if (date.getDay() === 0 || date.getDay() === 6) continue

    const volatility = basePrice * 0.03
    const trend = Math.sin(i * 0.05) * volatility
    const noise = (Math.random() - 0.5) * volatility

    const open = basePrice + trend + noise
    const close = open + (Math.random() - 0.48) * volatility
    const high = Math.max(open, close) + Math.random() * volatility * 0.5
    const low = Math.min(open, close) - Math.random() * volatility * 0.5

    candles.push({
      time: date.toISOString().split('T')[0],
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume: Math.floor(Math.random() * 50_000_000) + 5_000_000,
    })
  }
  return candles
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Hook: fetch stock quote
export function useStockQuote(symbol: string | null) {
  const [data, setData] = useState<StockQuote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!symbol) return
    let cancelled = false
    setLoading(true)
    setError(null)

    delay(300).then(() => {
      if (cancelled) return
      const quote = MOCK_STOCKS[symbol]
      if (quote) {
        setData(quote)
      } else {
        // Generate a synthetic quote
        const isThai = symbol.toUpperCase().endsWith('.BK')
        const price = 50 + Math.random() * 200
        const change = (Math.random() - 0.5) * 10
        setData({
          symbol, name: symbol.replace('.BK', ''), price: +price.toFixed(2),
          change: +change.toFixed(2), changePercent: +((change / price) * 100).toFixed(2),
          open: +(price - 2 + Math.random() * 4).toFixed(2),
          high: +(price + Math.random() * 5).toFixed(2),
          low: +(price - Math.random() * 5).toFixed(2),
          close: +price.toFixed(2),
          previousClose: +(price - change).toFixed(2),
          volume: Math.floor(Math.random() * 30_000_000),
          currency: isThai ? 'THB' : 'USD',
          exchange: isThai ? 'SET' : 'NASDAQ',
          timestamp: Date.now()
        })
      }
      setLoading(false)
    }).catch(() => {
      if (!cancelled) {
        setError('ไม่สามารถโหลดข้อมูลได้')
        setLoading(false)
      }
    })

    return () => { cancelled = true }
  }, [symbol])

  return { data, loading, error }
}

// Hook: fetch candle data
export function useStockCandles(symbol: string | null) {
  const [data, setData] = useState<StockCandle[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!symbol) return
    let cancelled = false
    setLoading(true)

    delay(400).then(() => {
      if (cancelled) return
      setData(generateCandles(symbol))
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [symbol])

  return { data, loading }
}

// Hook: trending stocks
export function useTrendingStocks() {
  const [data, setData] = useState<TrendingStock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    delay(200).then(() => {
      setData(MOCK_TRENDING)
      setLoading(false)
    })
  }, [])

  return { data, loading }
}

// Hook: market indices
export function useMarketIndices() {
  const [data, setData] = useState<MarketIndex[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    delay(150).then(() => {
      setData(MOCK_INDICES)
      setLoading(false)
    })
  }, [])

  return { data, loading }
}

// Hook: search
export function useStockSearch() {
  const [results, setResults] = useState<StockSearchResult[]>([])
  const [loading, setLoading] = useState(false)

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([])
      return
    }
    setLoading(true)
    await delay(200)
    const all = Object.values(MOCK_STOCKS).map(s => ({
      symbol: s.symbol, name: s.name, exchange: s.exchange, type: 'Equity', sector: ''
    }))
    const filtered = all.filter(
      s => s.symbol.toLowerCase().includes(query.toLowerCase()) || s.name.includes(query)
    )
    setResults(filtered)
    setLoading(false)
  }, [])

  return { results, loading, search }
}

// Hook: news (paginated from API)
interface NewsApiResponse {
  articles: NewsArticle[]
  total: number
  page: number
  limit: number
  totalPages: number
}

async function fetchNews({ category, page }: { category: string; page: number }): Promise<NewsApiResponse> {
  const res = await fetch(`/api/news?category=${category}&page=${page}&limit=12`)
  if (!res.ok) throw new Error('Failed to fetch news')
  return res.json()
}

export function useNews(category = 'all') {
  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ['news', category, 1],
    queryFn: () => fetchNews({ category, page: 1 }),
    staleTime: 5 * 60 * 1000,
  })

  return {
    data: data?.articles ?? [],
    loading: isLoading,
    error: error ? (error as Error).message : null,
  }
}

export function useNewsPaginated(category = 'all') {
  return useInfiniteQuery<NewsApiResponse, Error>({
    queryKey: ['news', 'infinite', category],
    queryFn: ({ pageParam = 1 }) => fetchNews({ category, page: pageParam as number }),
    getNextPageParam: (lastPage) => {
      if (lastPage.page >= lastPage.totalPages) return undefined
      return lastPage.page + 1
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000,
  })
}

// Hook: AI analysis
export function useAIAnalysis(symbol: string | null) {
  const [data, setData] = useState<AIAnalysis | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!symbol) return
    let cancelled = false
    setLoading(true)

    delay(800).then(() => {
      if (cancelled) return
      const quote = MOCK_STOCKS[symbol]
      const price = quote?.price ?? 100
      const changePercent = quote?.changePercent ?? 0
      const currencyLabel = quote?.currency === 'THB' ? 'บาท' : 'USD'

      const trend = changePercent > 1 ? 'bullish' : changePercent < -1 ? 'bearish' : 'neutral'
      const view = trend === 'bullish' ? 'bullish_momentum' : trend === 'bearish' ? 'bearish_momentum' : 'neutral_consolidation'

      setData({
        symbol,
        trend,
        view,
        confidence: 65 + Math.floor(Math.random() * 25),
        support: [+(price * 0.95).toFixed(2), +(price * 0.90).toFixed(2)],
        resistance: [+(price * 1.05).toFixed(2), +(price * 1.10).toFixed(2)],
        summary: `${symbol} อยู่ในแนวโน้ม${trend === 'bullish' ? 'ขาขึ้น' : trend === 'bearish' ? 'ขาลง' : 'ไซด์เวย์'} โดยมีแนวรับที่ ${(+price * 0.95).toFixed(2)} ${currencyLabel} และแนวต้านที่ ${(+price * 1.05).toFixed(2)} ${currencyLabel}`,
        technicalAnalysis: `RSI อยู่ที่ ${40 + Math.floor(Math.random() * 30)} บ่งชี้ว่าราคายังมีโอกาสเคลื่อนไหวได้ทั้งสองทาง MACD อยู่เหนือ Signal Line สนับสนุนแนวโน้ม${trend === 'bullish' ? 'ขาขึ้น' : 'ขาลง'}`,
        riskAssessment: 'ความเสี่ยงอยู่ในระดับปานกลาง ควรตั้งจุด Stop Loss ที่แนวรับสำคัญ',
        keyPoints: [
          'ราคายืนเหนือเส้น EMA 20 วัน',
          'Volume เพิ่มขึ้นอย่างมีนัยสำคัญ',
          'MACD ตัด Signal ขึ้น',
          'แนวรับสำคัญที่ ' + (+price * 0.92).toFixed(2) + ` ${currencyLabel}`,
        ],
        disclaimer: 'ข้อมูลนี้เพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำการลงทุน ผู้ใช้ควรศึกษาข้อมูลเพิ่มเติมและใช้วิจารณญาณก่อนตัดสินใจ',
      })
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [symbol])

  return { data, loading }
}
