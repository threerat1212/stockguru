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
  simulated?: boolean // true when generated locally (no AI provider configured), not from the AI model
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
  market?: string
  sector?: string
  minMarketCap?: number
  maxMarketCap?: number
  minPe?: number
  maxPe?: number
  minVolume?: number
  minChange?: number
  maxChange?: number
  sortBy?: 'volume' | 'change' | 'marketCap' | 'pe'
  sortOrder?: 'asc' | 'desc'
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

// API response wrapper
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  cached?: boolean
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
  action: 'BUY' | 'SELL'
  price: number
  shares: number
  value: number
  reason: string
}

export interface BacktestResult {
  symbol: string
  strategy: string
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
}
