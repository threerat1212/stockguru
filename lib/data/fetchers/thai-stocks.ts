import { fetchSiamchartStockRows } from '@/lib/market-data/providers/set-provider'

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

export async function fetchThaiStocksData(): Promise<ThaiStockData[]> {
  const rows = await fetchSiamchartStockRows()
  return rows
    .filter((row) => row.close > 0)
    .map((row) => ({
      symbol: row.yahooSymbol,
      name: row.name,
      price: row.close,
      change: row.changePercent ? row.close * (row.changePercent / 100) : 0,
      changePercent: row.changePercent,
      volume: row.volume,
      marketCap: row.marketCap ?? 0,
      pe: row.pe ?? 0,
      pb: row.pb ?? 0,
      high: row.close,
      low: row.close,
      open: row.close,
      previousClose: row.close - (row.changePercent ? row.close * (row.changePercent / 100) : 0),
      timestamp: new Date().toISOString(),
    }))
}
