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

const MOCK_STOCKS: Record<string, { name: string; price: number }> = {
  'PTT.BK': { name: 'PTT Public Company Limited', price: 32.50 },
  'SCB.BK': { name: 'Siam Commercial Bank', price: 138.00 },
  'KBANK.BK': { name: 'Kasikornbank', price: 165.00 },
  'AOT.BK': { name: 'Airports of Thailand', price: 68.00 },
  'CPALL.BK': { name: 'CP All', price: 42.00 },
  'ADVANC.BK': { name: 'Advanced Info Service', price: 235.00 },
  'DELTA.BK': { name: 'Delta Electronics', price: 280.00 },
  'CPF.BK': { name: 'Charoen Pokphand Foods', price: 28.00 },
  'BDMS.BK': { name: 'Bangkok Dusit Medical Services', price: 32.00 },
  'BH.BK': { name: 'Bangkok Hospital', price: 18.00 },
}

export async function fetchThaiStocksData(): Promise<ThaiStockData[]> {
  try {
    const results = await Promise.all(
      MAJOR_THAI_STOCKS.map(async (symbol) => {
        try {
          const result = await yahooFinance.quote(symbol)
          if (!result || !result.regularMarketPrice) {
            console.log(`No data for ${symbol}, using mock data`)
            // Return mock data if real data not available
            const mock = MOCK_STOCKS[symbol] || { name: symbol, price: 0 }
            return {
              symbol,
              name: mock.name,
              price: mock.price,
              change: 0,
              changePercent: 0,
              volume: 0,
              marketCap: 0,
              pe: 0,
              pb: 0,
              high: mock.price,
              low: mock.price,
              open: mock.price,
              previousClose: mock.price,
              timestamp: new Date().toISOString(),
            }
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
          console.error(`Error fetching ${symbol}, using mock data:`, error)
          // Return mock data on error
          const mock = MOCK_STOCKS[symbol] || { name: symbol, price: 0 }
          return {
            symbol,
            name: mock.name,
            price: mock.price,
            change: 0,
            changePercent: 0,
            volume: 0,
            marketCap: 0,
            pe: 0,
            pb: 0,
            high: mock.price,
            low: mock.price,
            open: mock.price,
            previousClose: mock.price,
            timestamp: new Date().toISOString(),
          }
        }
      })
    )

    return results.filter((stock): stock is ThaiStockData => stock !== null)
  } catch (error) {
    console.error('Error fetching Thai stocks data:', error)
    // Return all mock data on complete failure
    return MAJOR_THAI_STOCKS.map((symbol) => {
      const mock = MOCK_STOCKS[symbol] || { name: symbol, price: 0 }
      return {
        symbol,
        name: mock.name,
        price: mock.price,
        change: 0,
        changePercent: 0,
        volume: 0,
        marketCap: 0,
        pe: 0,
        pb: 0,
        high: mock.price,
        low: mock.price,
        open: mock.price,
        previousClose: mock.price,
        timestamp: new Date().toISOString(),
      }
    })
  }
}
