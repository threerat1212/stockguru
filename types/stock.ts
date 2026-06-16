import type { MarketDataMeta, MarketDataSource } from '../lib/market-data/types'

// Stock quote data
export interface StockQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  open: number
  high: number
  low: number
  close: number
  previousClose: number
  volume: number
  marketCap?: number
  pe?: number
  week52High?: number
  week52Low?: number
  currency: string
  exchange: string
  timestamp: number
}

// OHLCV candle data for charts
export interface StockCandle {
  time: string // ISO date or timestamp
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// Trending stock item
export interface TrendingStock {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
  sector?: string
  exchange?: string
  currency?: string
}

// Stock search result
export interface StockSearchResult {
  symbol: string
  name: string
  exchange: string
  type: string
  sector?: string
}

// News article
export interface NewsReference {
  title: string
  url: string
  source: string
}

export interface NewsImpactPoint {
  label: string
  value: string
  sentiment: 'positive' | 'negative' | 'neutral'
}

export interface NewsArticle {
  id: string
  slug?: string
  title: string
  summary: string
  content?: string[]
  url: string
  source: string
  imageUrl?: string
  publishedAt: string
  updatedAt?: string
  category: 'market' | 'sector' | 'company' | 'global' | 'crypto'
  relatedSymbols?: string[]
  marketImpactScore?: number
  impactPoints?: NewsImpactPoint[]
  detail?: string
  impact?: string
  references?: Array<NewsReference | string>
  infographic?: {
    headline: string
    metric: string
    tone: 'positive' | 'negative' | 'neutral'
    bullets: string[]
  }
  isDemo?: boolean
}

// AI Analysis result
export interface AIAnalysis {
  symbol: string
  trend: 'bullish' | 'bearish' | 'neutral'
  view: 'bullish_momentum' | 'bearish_momentum' | 'neutral_consolidation'
  confidence: number // 0-100
  support: number[]
  resistance: number[]
  summary: string
  technicalAnalysis: string
  riskAssessment: string
  keyPoints: string[]
  disclaimer: string
  // true when produced by the local heuristic (no MIMO_API_KEY / AI call failed)
  isDemo?: boolean
}

// AI Chat message
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

// Screener filter
export interface ScreenerFilters {
  query?: string
  market?: string
  sector?: string
  minMarketCap?: number
  maxMarketCap?: number
  minPe?: number
  maxPe?: number
  minVolume?: number
  maxVolume?: number
  minPrice?: number
  maxPrice?: number
  minChange?: number
  maxChange?: number
  minDividendYield?: number
  sortBy?: 'volume' | 'change' | 'marketCap' | 'pe' | 'dividendYield' | 'price'
  sortOrder?: 'asc' | 'desc'
}

export type SortField = 'volume' | 'change' | 'marketCap' | 'pe' | 'dividendYield' | 'price'
export type SortOrder = 'asc' | 'desc'

export interface ScreenerStock extends TrendingStock {
  pe?: number
  pb?: number
  de?: number
  dividendYield?: number
  freeFloat?: number
}

// Chart timeframe
export type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'

// Chart indicator
export type Indicator = 'SMA' | 'EMA' | 'RSI' | 'MACD' | 'BB'

// Watchlist item
export interface WatchlistItem {
  symbol: string
  addedAt: number
  notes?: string
}

// Market index
export interface MarketIndex {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}

export interface MarketBreadthSegment {
  advancing: number
  declining: number
  unchanged: number
  total: number
  volume: number
  value: number
}

export interface MarketBreadth {
  advancing: number
  declining: number
  unchanged: number
  total: number
  volume: number
  value: number
}

export interface MarketBreadthSplit {
  SET: MarketBreadth
  mai: MarketBreadth
}

export interface MarketForeignFlow {
  buyValue?: number
  sellValue?: number
  netValue?: number
}

export type MarketTradingPhase = 'pre_open' | 'market_open' | 'lunch_break' | 'after_hours' | 'closed' | 'unknown'

export interface MarketTradingSession {
  phase: MarketTradingPhase
  exchange: 'SET' | 'mai' | 'SET/mai'
  localDate: string
  updatedAt: number
  nextOpenAt?: string
  nextCloseAt?: string
}

export interface MarketTradingStatus {
  state: 'open' | 'closed'
  session: MarketTradingSession
}

export type MarketSummaryWarningType = 'stale' | 'fallback' | 'demo' | 'partial' | 'missing'

export interface MarketSummaryWarning {
  type: MarketSummaryWarningType
  message: string
  field?: string
}

export interface MarketSummaryMeta extends MarketDataMeta {
  sources: {
    indices: MarketDataMeta
    trending: MarketDataMeta
    stocks: MarketDataMeta
  }
  trading: MarketTradingStatus
  warnings: MarketSummaryWarning[]
}

export type MarketDataSourceMeta = MarketDataMeta | MarketSummaryMeta

export interface MarketSectorSummary {
  sector: string
  count: number
  advancing: number
  declining: number
  avgChangePercent: number
  avgChange: number
  topSymbol: string
  topChangePercent: number
}

export interface MarketMover {
  symbol: string
  name: string
  sector?: string
  exchange?: string
  price: number
  change: number
  changePercent: number
  volume: number
}

export interface MarketSummary {
  indices: MarketIndex[]
  breadth: MarketBreadth
  breadthByExchange: MarketBreadthSplit
  sectors: MarketSectorSummary[]
  movers: {
    gainers: MarketMover[]
    losers: MarketMover[]
    active: MarketMover[]
  }
  foreign?: MarketForeignFlow
  value?: number
  volume?: number
  updatedAt: string
}

// Market data provenance (see lib/market-data/types.ts)
export type { MarketDataMeta, MarketDataSource } from '../lib/market-data/types'

// API response wrapper

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  cached?: boolean
  meta?: MarketDataSourceMeta
}

// ============================================================
// Fundamental Data Types
// ============================================================

export interface FundamentalData {
  symbol: string
  name: string
  sector?: string
  industry?: string
  description?: string
  website?: string
  // Valuation metrics
  marketCap?: number
  enterpriseValue?: number
  trailingPE?: number
  forwardPE?: number
  pegRatio?: number
  priceToBook?: number
  priceToSalesTrailing12Months?: number
  enterpriseToRevenue?: number
  enterpriseToEbitda?: number
  // Profitability
  profitMargin?: number
  operatingMargin?: number
  returnOnAssets?: number
  returnOnEquity?: number
  revenueGrowth?: number
  earningsGrowth?: number
  // Financial health
  totalRevenue?: number
  totalDebt?: number
  totalCash?: number
  debtToEquity?: number
  currentRatio?: number
  bookValue?: number
  freeCashflow?: number
  operatingCashflow?: number
  // Dividends
  dividendRate?: number
  dividendYield?: number
  payoutRatio?: number
  fiveYearAvgDividendYield?: number
  // Per share
  trailingEps?: number
  forwardEps?: number
  // Price context
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
  fiftyDayAverage?: number
  twoHundredDayAverage?: number
  beta?: number
  // Earnings info
  earningsQuarterlyGrowth?: number
  // Analyst
  targetHighPrice?: number
  targetLowPrice?: number
  targetMeanPrice?: number
  recommendationMean?: number
  recommendationKey?: string
  numberOfAnalystOpinions?: number
}

export interface EarningsCalendarEvent {
  symbol: string
  name?: string
  earningsDate: string
  earningsCallTime?: string
  epsEstimate?: number
  epsActual?: number
  revenueEstimate?: number
  revenueActual?: number
  quarter?: number
  year?: number
  // Surprise metrics
  epsSurprise?: number
  epsSurprisePercent?: number
}

export interface BacktestRequest {
  symbol: string
  strategy: 'sma_crossover' | 'rsi' | 'macd' | 'buy_and_hold'
  period?: '3M' | '6M' | '1Y' | string
  startDate: string // YYYY-MM-DD
  endDate: string   // YYYY-MM-DD
  params?: {
    initialCapital?: number
    // SMA crossover params
    fastPeriod?: number
    slowPeriod?: number
    // RSI params
    rsiPeriod?: number
    rsiOverbought?: number
    rsiOversold?: number
    // MACD params
    macdFast?: number
    macdSlow?: number
    macdSignal?: number
  }
}

export interface BacktestTrade {
  date: string
  action: 'ENTRY' | 'EXIT'
  price: number
  shares: number
  value: number
  reason: string
}

export interface BacktestResult {
  symbol: string
  strategy: string
  timeframe: '3M' | '6M' | '1Y'
  startDate: string
  endDate: string
  // Performance
  initialCapital: number
  finalValue: number
  totalReturn: number
  totalReturnPercent: number
  annualizedReturn: number
  // Risk
  maxDrawdown: number
  maxDrawdownPercent: number
  sharpeRatio: number
  volatility: number
  // Trading stats
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  averageWin: number
  averageLoss: number
  profitFactor: number
  // Benchmark comparison
  buyAndHoldReturn: number
  alpha: number
  // Detail
  trades: BacktestTrade[]
  equityCurve: { date: string; value: number }[]
  disclaimer: string
  isSimulation: boolean
}
