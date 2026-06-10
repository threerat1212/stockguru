import { getMarketIndices } from '@/lib/services/stock-service'

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
  meta?: unknown
}

export async function fetchSetIndexData(): Promise<SetIndexData> {
  const result = await getMarketIndices()
  const setIndex = result.data.find((index) => index.symbol === 'SET') ?? result.data[0]

  if (!setIndex) {
    throw new Error('ไม่พบข้อมูลดัชนี SET')
  }

  return {
    index: setIndex.symbol,
    price: setIndex.price,
    change: setIndex.change,
    changePercent: setIndex.changePercent,
    volume: 0,
    marketCap: 0,
    high: setIndex.price,
    low: setIndex.price,
    open: setIndex.price,
    previousClose: setIndex.price - setIndex.change,
    timestamp: new Date().toISOString(),
    meta: result.meta,
  }
}
