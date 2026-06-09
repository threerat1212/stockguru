import yahooFinance from 'yahoo-finance2'

interface SetIndexData {
  index: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  high: number
  low: number
  open: number
  previousClose: number
  timestamp: string
}

export async function fetchSetIndexData(): Promise<SetIndexData> {
  try {
    // Try multiple symbols for SET index
    const symbols = ['^SET.BK', '^SET', 'SET.BK']
    let result = null

    for (const symbol of symbols) {
      try {
        result = await yahooFinance.quote(symbol)
        if (result && result.regularMarketPrice) {
          break
        }
      } catch (e) {
        console.log(`Failed to fetch ${symbol}, trying next...`)
      }
    }

    if (!result || !result.regularMarketPrice) {
      throw new Error('Failed to fetch SET index data from all symbols')
    }

    return {
      index: 'SET',
      price: result.regularMarketPrice || 0,
      change: result.regularMarketChange || 0,
      changePercent: result.regularMarketChangePercent || 0,
      volume: result.regularMarketVolume || 0,
      marketCap: result.marketCap || 0,
      high: result.regularMarketDayHigh || 0,
      low: result.regularMarketDayLow || 0,
      open: result.regularMarketOpen || 0,
      previousClose: result.previousClose || 0,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error fetching SET index data:', error)
    throw error
  }
}
