import { NextRequest } from 'next/server'
import { apiSuccess, apiBadRequest, apiError } from '@/lib/api/response'
import type { EarningsCalendarEvent } from '@/types/stock'

const YAHOO_BASE = 'https://query1.finance.yahoo.com'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'

/**
 * GET /api/stock/earnings?month=6&year=2025
 * Returns a list of upcoming earnings events for the given month/year.
 * Uses Yahoo Finance earnings calendar API; falls back to curated mock data.
 */
export async function GET(request: NextRequest) {
  const monthStr = request.nextUrl.searchParams.get('month')
  const yearStr = request.nextUrl.searchParams.get('year')

  if (!monthStr || !yearStr) {
    return apiBadRequest('Missing required parameters: month, year')
  }

  const month = parseInt(monthStr, 10)
  const year = parseInt(yearStr, 10)

  if (isNaN(month) || month < 1 || month > 12) {
    return apiBadRequest('Invalid month (1-12)')
  }
  if (isNaN(year) || year < 2020 || year > 2030) {
    return apiBadRequest('Invalid year (2020-2030)')
  }

  try {
    // Try Yahoo Finance earnings calendar
    const events = await fetchYahooEarningsCalendar(month, year)
    return apiSuccess(events)
  } catch (error) {
    // Fall back to mock data if Yahoo API fails
    const events = generateMockEarnings(month, year)
    return apiSuccess(events)
  }
}

/**
 * Fetch earnings calendar from Yahoo Finance for the given month.
 * Uses the /v1/calendar/earnings endpoint.
 */
async function fetchYahooEarningsCalendar(
  month: number,
  year: number,
): Promise<EarningsCalendarEvent[]> {
  // Calculate start/end timestamps for the month
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0) // last day of month

  const period1 = Math.floor(startDate.getTime() / 1000)
  const period2 = Math.floor(endDate.getTime() / 1000)

  const qs = new URLSearchParams({
    period1: String(period1),
    period2: String(period2),
  }).toString()

  const url = `${YAHOO_BASE}/v1/calendar/earnings?${qs}`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })

  if (!res.ok) throw new Error(`Yahoo API ${res.status}`)
  const data = await res.json()

  const earnings = data.earningsCalendar?.earnings || []

  return earnings.map((item: any) => ({
    symbol: item.symbol || '',
    name: item.companyShortName || undefined,
    earningsDate: item.startDateTime || item.earningsDate || '',
    earningsCallTime: item.time || undefined,
    epsEstimate: item.epsEstimate ?? undefined,
    epsActual: item.epsActual ?? undefined,
    revenueEstimate: item.revenueEstimate ?? undefined,
    revenueActual: item.revenueActual ?? undefined,
    quarter: item.quarter ?? undefined,
    year: item.year ?? undefined,
    epsSurprise: item.epsDifference ?? undefined,
    epsSurprisePercent: item.surprisePercent ?? undefined,
  }))
}

/**
 * Generate mock earnings data for a given month/year.
 * Provides realistic-looking data for major companies.
 */
function generateMockEarnings(month: number, year: number): EarningsCalendarEvent[] {
  const companies = [
    { symbol: 'AAPL', name: 'Apple Inc.', qOffset: [1, 4, 7, 10] },
    { symbol: 'MSFT', name: 'Microsoft Corp.', qOffset: [1, 4, 7, 10] },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', qOffset: [1, 4, 7, 10] },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', qOffset: [2, 5, 8, 11] },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', qOffset: [2, 5, 8, 11] },
    { symbol: 'META', name: 'Meta Platforms Inc.', qOffset: [2, 5, 8, 11] },
    { symbol: 'TSLA', name: 'Tesla Inc.', qOffset: [1, 4, 7, 10] },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', qOffset: [1, 4, 7, 10] },
    { symbol: 'V', name: 'Visa Inc.', qOffset: [1, 4, 8, 11] },
    { symbol: 'JNJ', name: 'Johnson & Johnson', qOffset: [1, 4, 7, 10] },
    { symbol: 'WMT', name: 'Walmart Inc.', qOffset: [2, 5, 8, 11] },
    { symbol: 'PG', name: 'Procter & Gamble Co.', qOffset: [1, 4, 7, 10] },
    { symbol: 'MA', name: 'Mastercard Inc.', qOffset: [1, 4, 7, 10] },
    { symbol: 'UNH', name: 'UnitedHealth Group', qOffset: [1, 4, 7, 10] },
    { symbol: 'HD', name: 'Home Depot Inc.', qOffset: [2, 5, 8, 11] },
    { symbol: 'DIS', name: 'Walt Disney Co.', qOffset: [2, 5, 8, 11] },
    { symbol: 'BAC', name: 'Bank of America Corp.', qOffset: [1, 4, 7, 10] },
    { symbol: 'XOM', name: 'Exxon Mobil Corp.', qOffset: [2, 5, 8, 11] },
    { symbol: 'PFE', name: 'Pfizer Inc.', qOffset: [2, 5, 8, 11] },
    { symbol: 'KO', name: 'Coca-Cola Co.', qOffset: [2, 5, 7, 10] },
  ]

  const events: EarningsCalendarEvent[] = []

  for (const co of companies) {
    // Check if this company reports in the given month
    if (!co.qOffset.includes(month)) continue

    // Determine quarter
    const quarterMap: Record<number, number> = { 1: 4, 2: 1, 4: 1, 5: 2, 7: 2, 8: 3, 10: 3, 11: 4 }
    const quarter = quarterMap[month] ?? Math.ceil(month / 3)

    // Generate a semi-random day in the month (seeded by symbol + month)
    const seed = co.symbol.charCodeAt(0) + co.symbol.charCodeAt(1) * 3 + month * 7
    const daysInMonth = new Date(year, month, 0).getDate()
    const day = (seed % (daysInMonth - 1)) + 1

    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const timeOptions = ['BMO', 'AMC', 'DMT'] as const
    const time = timeOptions[seed % timeOptions.length]

    const baseEps = (seed % 5) + 1 + (seed % 100) / 100

    events.push({
      symbol: co.symbol,
      name: co.name,
      earningsDate: dateStr,
      earningsCallTime: time,
      epsEstimate: parseFloat(baseEps.toFixed(2)),
      quarter,
      year,
    })
  }

  // Sort by date
  events.sort((a, b) => a.earningsDate.localeCompare(b.earningsDate))

  return events
}
