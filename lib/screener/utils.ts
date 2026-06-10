import type { SiamchartStockRow } from '@/lib/market-data/providers/set-provider'
import type { ScreenerFilters, ScreenerStock, SortField, SortOrder } from '@/types/stock'

export const DEFAULT_SCREENER_FILTERS: ScreenerFilters = {
  market: 'ทั้งหมด',
  sector: 'ทั้งหมด',
  sortBy: 'volume',
  sortOrder: 'desc',
}

export function normalizeSiamchartStock(row: SiamchartStockRow): ScreenerStock {
  const change = row.close * (row.changePercent / 100)
  return {
    symbol: row.symbol,
    name: row.name,
    price: row.close,
    change,
    changePercent: row.changePercent,
    volume: row.volume,
    marketCap: row.marketCap,
    sector: row.sector,
    exchange: row.exchange,
    currency: 'THB',
    pe: row.pe,
    pb: row.pb,
    de: row.de,
    dividendYield: row.dividendYield,
    freeFloat: row.freeFloat,
  }
}

export function normalizeSiamchartStockRows(rows: SiamchartStockRow[]): ScreenerStock[] {
  return rows.map(normalizeSiamchartStock).filter((stock) => stock.price > 0)
}

export function parseScreenerFilters(params: URLSearchParams): ScreenerFilters {
  const filters: ScreenerFilters = { ...DEFAULT_SCREENER_FILTERS }

  const readOptionalString = (key: string) => {
    const value = params.get(key)
    return value && value !== 'ทั้งหมด' ? value : undefined
  }

  const readNumber = (key: string) => {
    const value = params.get(key)
    const parsed = value === null || value === '' ? undefined : Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  filters.market = readOptionalString('market')
  filters.sector = readOptionalString('sector')
  filters.minMarketCap = readNumber('minMarketCap')
  filters.maxMarketCap = readNumber('maxMarketCap')
  filters.minPe = readNumber('minPe')
  filters.maxPe = readNumber('maxPe')
  filters.minVolume = readNumber('minVolume')
  filters.maxVolume = readNumber('maxVolume')
  filters.minPrice = readNumber('minPrice')
  filters.maxPrice = readNumber('maxPrice')
  filters.minChange = readNumber('minChange')
  filters.maxChange = readNumber('maxChange')
  filters.minDividendYield = readNumber('minDividendYield')

  const sortBy = params.get('sortBy') as SortField | null
  const sortOrder = params.get('sortOrder') as SortOrder | null
  if (sortBy) filters.sortBy = sortBy
  if (sortOrder === 'asc' || sortOrder === 'desc') filters.sortOrder = sortOrder

  return filters
}

export function applyScreenerFilters(stocks: ScreenerStock[], filters: ScreenerFilters): ScreenerStock[] {
  let result = stocks

  if (filters.market && filters.market !== 'ทั้งหมด') {
    result = result.filter((stock) => {
      if (filters.market === 'ไทย') return stock.exchange === 'SET' || stock.exchange === 'mai'
      if (filters.market === 'SET') return stock.exchange === 'SET'
      if (filters.market === 'mai') return stock.exchange === 'mai'
      if (filters.market === 'US') return stock.exchange === 'NASDAQ' || stock.exchange === 'NYSE'
      return stock.exchange === filters.market
    })
  }

  if (filters.sector && filters.sector !== 'ทั้งหมด') {
    result = result.filter((stock) => stock.sector === filters.sector)
  }

  if (filters.minMarketCap !== undefined) {
    result = result.filter((stock) => (stock.marketCap ?? 0) >= filters.minMarketCap!)
  }
  if (filters.maxMarketCap !== undefined) {
    result = result.filter((stock) => (stock.marketCap ?? 0) <= filters.maxMarketCap!)
  }

  if (filters.minPe !== undefined) {
    result = result.filter((stock) => (stock.pe ?? 0) >= filters.minPe!)
  }
  if (filters.maxPe !== undefined) {
    result = result.filter((stock) => (stock.pe ?? 0) <= filters.maxPe!)
  }

  if (filters.minVolume !== undefined) {
    result = result.filter((stock) => stock.volume >= filters.minVolume!)
  }
  if (filters.maxVolume !== undefined) {
    result = result.filter((stock) => stock.volume <= filters.maxVolume!)
  }

  if (filters.minPrice !== undefined) {
    result = result.filter((stock) => stock.price >= filters.minPrice!)
  }
  if (filters.maxPrice !== undefined) {
    result = result.filter((stock) => stock.price <= filters.maxPrice!)
  }

  if (filters.minChange !== undefined) {
    result = result.filter((stock) => stock.changePercent >= filters.minChange!)
  }
  if (filters.maxChange !== undefined) {
    result = result.filter((stock) => stock.changePercent <= filters.maxChange!)
  }

  if (filters.minDividendYield !== undefined) {
    result = result.filter((stock) => (stock.dividendYield ?? 0) >= filters.minDividendYield!)
  }

  if (filters.query?.trim()) {
    const q = filters.query.trim().toLowerCase()
    result = result.filter((stock) => stock.symbol.toLowerCase().includes(q) || stock.name.toLowerCase().includes(q))
  }

  return result
}

export function sortScreenerStocks(stocks: ScreenerStock[], sortBy: SortField, sortOrder: SortOrder): ScreenerStock[] {
  return [...stocks].sort((a, b) => {
    const aVal = sortBy === 'marketCap' ? a.marketCap ?? 0 : a[sortBy] ?? 0
    const bVal = sortBy === 'marketCap' ? b.marketCap ?? 0 : b[sortBy] ?? 0
    const diff = aVal - bVal
    return sortOrder === 'asc' ? diff : -diff
  })
}

export function screenStocks(stocks: ScreenerStock[], filters: ScreenerFilters): ScreenerStock[] {
  return sortScreenerStocks(applyScreenerFilters(stocks, filters), filters.sortBy ?? 'volume', filters.sortOrder ?? 'desc')
}

export function formatScreenerCsvValue(value: unknown): string {
  if (value === undefined || value === null) return ''
  const text = String(value)
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function exportScreenerCsv(stocks: ScreenerStock[], filters: ScreenerFilters, filename = 'stockguru-screener.csv') {
  const headers = [
    'symbol',
    'name',
    'exchange',
    'sector',
    'price',
    'change',
    'changePercent',
    'volume',
    'marketCap',
    'pe',
    'pb',
    'de',
    'dividendYield',
    'freeFloat',
  ]
  const rows = stocks.map((stock) =>
    headers
      .map((header) => formatScreenerCsvValue(stock[header as keyof ScreenerStock]))
      .join(',')
  )
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
