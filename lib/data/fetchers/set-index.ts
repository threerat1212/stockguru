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
  // Return mock data for SET index (no free API available)
  return {
    index: 'SET',
    price: 1350.00,
    change: 0,
    changePercent: 0,
    volume: 50000000000,
    marketCap: 0,
    high: 1350.00,
    low: 1350.00,
    open: 1350.00,
    previousClose: 1350.00,
    timestamp: new Date().toISOString(),
  }
}
