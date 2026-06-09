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

const MAJOR_THAI_STOCKS = Object.keys(MOCK_STOCKS)

export async function fetchThaiStocksData(): Promise<ThaiStockData[]> {
  // Return mock data for Thai stocks (no free API available)
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
