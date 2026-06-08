import type { FundamentalData } from '@/types/stock'
import { fundamentalCache } from '@/lib/cache'
import { getQuote } from '@/lib/services/stock-service'

const YAHOO_BASE = 'https://query1.finance.yahoo.com'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

const FUNDAMENTAL_MODULES = [
  'financialData',
  'defaultKeyStatistics',
  'incomeStatementHistory',
  'balanceSheetHistory',
  'assetProfile',
  'summaryDetail',
].join(',')

async function yfetch(path: string, params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString()
  const url = `${YAHOO_BASE}${path}${qs ? '?' + qs : ''}`
  const res = await fetch(url, {
    headers: { 'User-Agent': UA },
    next: { revalidate: 600 },
  })
  if (!res.ok) throw new Error(`Yahoo API ${res.status}`)
  return res.json()
}

/**
 * Fetch fundamental data for a stock symbol via Yahoo Finance quoteSummary.
 * Results are cached for 10 minutes.
 */
export async function getFundamentalData(symbol: string): Promise<FundamentalData> {
  const cacheKey = `fundamental:${symbol}`
  const cached = fundamentalCache.get<FundamentalData>(cacheKey)
  if (cached) return cached.data

  const upper = symbol.toUpperCase()

  try {
    const data = await yfetch(`/v10/finance/quoteSummary/${encodeURIComponent(upper)}`, {
      modules: FUNDAMENTAL_MODULES,
    })

    const result = data.quoteSummary?.result?.[0]
    if (!result) throw new Error(`No fundamental data for ${upper}`)

    const fin = result.financialData || {}
    const stats = result.defaultKeyStatistics || {}
    const profile = result.assetProfile || {}
    const summary = result.summaryDetail || {}

    // Extract revenue & net income from most recent income statement
    const incomeHistory = result.incomeStatementHistory?.incomeStatementHistory || []
    const latestIncome = incomeHistory[0] || {}
    const totalRevenue = latestIncome.totalRevenue ?? fin.totalRevenue ?? undefined
    const netIncome = latestIncome.netIncome ?? undefined

    // Extract total debt and cash from most recent balance sheet
    const bsHistory = result.balanceSheetHistory?.balanceSheetStatements || []
    const latestBS = bsHistory[0] || {}

    const fundamental: FundamentalData = {
      symbol: upper,
      name: profile.longBusinessSummary ? upper : upper, // name comes from quote API
      sector: profile.sector || undefined,
      industry: profile.industry || undefined,
      description: profile.longBusinessSummary || undefined,
      website: profile.website || undefined,

      // Valuation
      marketCap: summary.marketCap?.raw ?? stats.marketCap?.raw,
      enterpriseValue: stats.enterpriseValue?.raw,
      trailingPE: summary.trailingPE?.raw ?? stats.trailingPE?.raw,
      forwardPE: summary.forwardPE?.raw ?? stats.forwardPE?.raw,
      pegRatio: stats.pegRatio?.raw,
      priceToBook: stats.priceToBook?.raw,
      priceToSalesTrailing12Months: stats.priceToSalesTrailing12Months?.raw,
      enterpriseToRevenue: stats.enterpriseToRevenue?.raw,
      enterpriseToEbitda: stats.enterpriseToEbitda?.raw,

      // Profitability
      profitMargin: fin.profitMargins?.raw,
      operatingMargin: fin.operatingMargins?.raw,
      returnOnAssets: fin.returnOnAssets?.raw,
      returnOnEquity: fin.returnOnEquity?.raw,
      revenueGrowth: fin.revenueGrowth?.raw,
      earningsGrowth: fin.earningsGrowth?.raw,

      // Financial health
      totalRevenue: totalRevenue,
      totalDebt: fin.totalDebt?.raw ?? latestBS.totalDebt?.raw,
      totalCash: fin.totalCash?.raw ?? latestBS.cash?.raw,
      debtToEquity: fin.debtToEquity?.raw,
      currentRatio: fin.currentRatio?.raw,
      bookValue: stats.bookValue?.raw,
      freeCashflow: fin.freeCashflow?.raw,
      operatingCashflow: fin.operatingCashflow?.raw,

      // Dividends
      dividendRate: summary.dividendRate?.raw,
      dividendYield: summary.dividendYield?.raw,
      payoutRatio: summary.payoutRatio?.raw,
      fiveYearAvgDividendYield: summary.fiveYearAvgDividendYield?.raw,

      // Per share
      trailingEps: stats.trailingEps?.raw,
      forwardEps: stats.forwardEps?.raw,

      // Price context
      fiftyTwoWeekHigh: summary.fiftyTwoWeekHigh?.raw,
      fiftyTwoWeekLow: summary.fiftyTwoWeekLow?.raw,
      fiftyDayAverage: summary.fiftyDayAverage?.raw,
      twoHundredDayAverage: summary.twoHundredDayAverage?.raw,
      beta: stats.beta?.raw,

      // Earnings
      earningsQuarterlyGrowth: stats.earningsQuarterlyGrowth?.raw,

      // Analyst
      targetHighPrice: fin.targetHighPrice?.raw,
      targetLowPrice: fin.targetLowPrice?.raw,
      targetMeanPrice: fin.targetMeanPrice?.raw,
      recommendationMean: fin.recommendationMean?.raw,
      recommendationKey: fin.recommendationKey,
      numberOfAnalystOpinions: fin.numberOfAnalystOpinions?.raw,
    }

    fundamentalCache.set(cacheKey, fundamental)
    return fundamental
  } catch (error) {
    console.warn(`[getFundamentalData] ${upper} quoteSummary failed:`, error)

    try {
      const quoteResult = await getQuote(upper)
      const quote = quoteResult.data
      const fallback: FundamentalData = {
        symbol: quote.symbol,
        name: quote.name,
        marketCap: quote.marketCap,
        trailingPE: quote.pe,
        fiftyTwoWeekHigh: quote.week52High,
        fiftyTwoWeekLow: quote.week52Low,
      }

      fundamentalCache.set(cacheKey, fallback, 60)
      return fallback
    } catch (fallbackError) {
      throw new Error(`Failed to fetch fundamental data for ${upper}: ${(fallbackError as Error).message}`)
    }
  }
}
