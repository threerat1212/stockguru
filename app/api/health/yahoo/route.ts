import { NextResponse } from 'next/server'

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

export async function GET() {
  const results: Record<string, unknown> = {}
  const start = Date.now()

  try {
    // Test 1: Simple v7 quote
    const quoteRes = await fetch(
      `${YAHOO_BASE}/v7/finance/quote?symbols=AAPL`,
      { headers: YAHOO_HEADERS }
    )
    results.quoteStatus = quoteRes.status
    results.quoteOk = quoteRes.ok
    if (quoteRes.ok) {
      const data = await quoteRes.json()
      const q = data.quoteResponse?.result?.[0]
      results.quotePrice = q?.regularMarketPrice ?? null
      results.quoteName = q?.shortName ?? null
    } else {
      results.quoteBody = await quoteRes.text().catch(() => '')
    }
  } catch (err) {
    results.quoteError = err instanceof Error ? err.message : String(err)
  }

  try {
    // Test 2: Chart endpoint
    const now = Math.floor(Date.now() / 1000)
    const chartRes = await fetch(
      `${YAHOO_BASE}/v8/finance/chart/AAPL?period1=${now - 86400}&period2=${now}&interval=1d`,
      { headers: YAHOO_HEADERS }
    )
    results.chartStatus = chartRes.status
    results.chartOk = chartRes.ok
    if (!chartRes.ok) {
      results.chartBody = await chartRes.text().catch(() => '')
    }
  } catch (err) {
    results.chartError = err instanceof Error ? err.message : String(err)
  }

  try {
    // Test 3: Search endpoint
    const searchRes = await fetch(
      `${YAHOO_BASE}/v1/finance/search?q=AAPL&quotesCount=1&newsCount=0`,
      { headers: YAHOO_HEADERS }
    )
    results.searchStatus = searchRes.status
    results.searchOk = searchRes.ok
    if (!searchRes.ok) {
      results.searchBody = await searchRes.text().catch(() => '')
    }
  } catch (err) {
    results.searchError = err instanceof Error ? err.message : String(err)
  }

  results.latencyMs = Date.now() - start

  return NextResponse.json({
    ok: !!results.quoteOk || !!results.chartOk || !!results.searchOk,
    ...results,
  })
}
