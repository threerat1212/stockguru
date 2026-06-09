import yahooFinance from 'yahoo-finance2'

interface ThaiStockData {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  pe: number
  pb: number
  high: number
  low: number
  open: number
  previousClose: number
  timestamp: string
}

const MAJOR_THAI_STOCKS = [
  'PTT.BK',
  'SCB.BK',
  'KBANK.BK',
  'AOT.BK',
  'CPALL.BK',
  'ADVANC.BK',
  'DELTA.BK',
  'CPF.BK',
  'BDMS.BK',
  'BH.BK',
]

export async function fetchThaiStocksData(): Promise<ThaiStockData[]> {
  try {
    const results = await Promise.all(
      MAJOR_THAI_STOCKS.map(async (symbol) => {
        try {
          const result = await yahooFinance.quote(symbol)
          if (!result || !result.regularMarketPrice) {
            console.log(`No data for ${symbol}`)
            return null
          }
          return {
            symbol,
            name: result.longName || symbol,
            price: result.regularMarketPrice || 0,
            change: result.regularMarketChange || 0,
            changePercent: result.regularMarketChangePercent || 0,
            volume: result.regularMarketVolume || 0,
            marketCap: result.marketCap || 0,
            pe: result.trailingPE || 0,
            pb: result.priceToBook || 0,
            high: result.regularMarketDayHigh || 0,
            low: result.regularMarketDayLow || 0,
            open: result.regularMarketOpen || 0,
            previousClose: result.previousClose || 0,
            timestamp: new Date().toISOString(),
          }
        } catch (error) {
          console.error(`Error fetching ${symbol}:`, error)
          return null
        }
      })
    )

    return results.filter((stock): stock is ThaiStockData => stock !== null)
  } catch (error) {
    console.error('Error fetching Thai stocks data:', error)
    throw error
  }
}
