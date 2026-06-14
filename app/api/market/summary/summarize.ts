import type { MarketDataMeta, MarketDataWarning } from '@/lib/market-data/types'
import type {
  MarketBreadth,
  MarketBreadthSplit,
  MarketForeignFlow,
  MarketMover,
  MarketSectorSummary,
  MarketSummary,
  MarketSummaryMeta,
  MarketSummaryWarning,
  MarketTradingSession,
  MarketTradingStatus,
  TrendingStock,
} from '@/types/stock'
import type { SiamchartStockRow } from '@/lib/market-data/providers/set-provider'

const LIVE_META_STALE_MS = 5 * 60 * 1000
const THAI_TIMEZONE = 'Asia/Bangkok'

export function summarizeBreadth(rows: SiamchartStockRow[], exchange?: 'SET' | 'mai'): MarketBreadth {
  const activeRows = exchange ? rows.filter((row) => row.exchange === exchange) : rows
  const total = activeRows.filter((row) => row.close > 0).length
  const advancing = activeRows.filter((row) => row.changePercent > 0).length
  const declining = activeRows.filter((row) => row.changePercent < 0).length

  return {
    advancing,
    declining,
    unchanged: Math.max(total - advancing - declining, 0),
    total,
    volume: activeRows.reduce((sum, row) => sum + (row.volume ?? 0), 0),
    value: activeRows.reduce((sum, row) => sum + (row.value ?? 0), 0),
  }
}

export function summarizeBreadthByExchange(rows: SiamchartStockRow[]): MarketBreadthSplit {
  return {
    SET: summarizeBreadth(rows, 'SET'),
    mai: summarizeBreadth(rows, 'mai'),
  }
}

export function summarizeSectors(rows: SiamchartStockRow[]): MarketSectorSummary[] {
  const bySector = new Map<string, SiamchartStockRow[]>()

  for (const row of rows) {
    const sector = row.sector ?? 'ไม่ระบุกลุ่ม'
    const bucket = bySector.get(sector) ?? []
    bucket.push(row)
    bySector.set(sector, bucket)
  }

  return Array.from(bySector.entries())
    .map(([sector, sectorRows]) => {
      const activeRows = sectorRows.filter((row) => row.close > 0)
      const advancing = activeRows.filter((row) => row.changePercent > 0).length
      const declining = activeRows.filter((row) => row.changePercent < 0).length
      const avgChangePercent = activeRows.length
        ? activeRows.reduce((sum, row) => sum + row.changePercent, 0) / activeRows.length
        : 0
      const avgChange = activeRows.length
        ? activeRows.reduce((sum, row) => sum + row.close * (row.changePercent / 100), 0) / activeRows.length
        : 0
      const top = activeRows.slice().sort((a, b) => b.changePercent - a.changePercent)[0]

      return {
        sector,
        count: activeRows.length,
        advancing,
        declining,
        avgChangePercent,
        avgChange,
        topSymbol: top?.symbol ?? '—',
        topChangePercent: top?.changePercent ?? 0,
      }
    })
    .sort((a, b) => b.avgChangePercent - a.avgChangePercent)
}

export function summarizeMovers(rows: TrendingStock[]) {
  const activeRows = rows
    .filter((row) => row.price > 0)
    .map((row) => ({
      symbol: row.symbol,
      name: row.name,
      sector: row.sector,
      exchange: row.exchange,
      price: row.price,
      change: row.change,
      changePercent: row.changePercent,
      volume: row.volume,
    }))
    .filter((row: MarketMover) => Number.isFinite(row.price) && Number.isFinite(row.changePercent))

  const gainers = activeRows.slice().sort((a, b) => b.changePercent - a.changePercent).slice(0, 10)
  const losers = activeRows.slice().sort((a, b) => a.changePercent - b.changePercent).slice(0, 10)
  const active = activeRows.slice().sort((a, b) => b.volume - a.volume).slice(0, 10)

  return { gainers, losers, active }
}

export function summarizeForeign(rows: SiamchartStockRow[]): MarketForeignFlow | undefined {
  const foreignRows = rows.filter((row) => row.sector === 'กระดานต่างชาติ')
  if (!foreignRows.length) return undefined

  const netValue = foreignRows.reduce((sum, row) => sum + (row.value ?? 0), 0)
  return {
    netValue,
  }
}

function normalizeMeta(meta: MarketDataMeta): MarketDataMeta {
  return {
    source: meta.source,
    isDemo: meta.isDemo,
    provider: meta.provider,
    updatedAt: meta.updatedAt,
    ...(meta.warning ? { warning: meta.warning } : {}),
    ...(meta.warnings?.length ? { warnings: meta.warnings } : {}),
  }
}

function warningForMeta(meta: MarketDataMeta, field: string, now: number): MarketSummaryWarning[] {
  const warnings: MarketSummaryWarning[] = []
  const age = now - meta.updatedAt

  for (const warning of meta.warnings ?? []) {
    warnings.push({ ...warning, field: warning.field ?? field })
  }

  if (meta.warning && !warnings.some((warning) => warning.message === meta.warning)) {
    warnings.push({
      type: meta.isDemo || meta.source === 'fallback' ? 'demo' : 'stale',
      message: meta.warning,
      field,
    })
  }

  if (meta.source === 'fallback' || meta.isDemo) {
    warnings.push({
      type: 'fallback',
      message: `${field} ใช้ข้อมูล fallback หรือข้อมูลตัวอย่าง`,
      field,
    })
  }

  if (meta.source === 'cache') {
    warnings.push({
      type: 'stale',
      message: `${field} เป็นข้อมูลแคช`,
      field,
    })
  }

  if (meta.source !== 'cache' && age > LIVE_META_STALE_MS) {
    warnings.push({
      type: 'stale',
      message: `${field} ล่าช้ากว่า ${Math.ceil(age / 60_000)} นาที`,
      field,
    })
  }

  return warnings
}

function uniqueWarnings(warnings: MarketSummaryWarning[]): MarketSummaryWarning[] {
  const seen = new Set<string>()
  return warnings.filter((warning) => {
    const key = `${warning.type}:${warning.field ?? ''}:${warning.message}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function primaryMeta(meta: MarketSummaryMeta['sources']): MarketDataMeta {
  if (meta.indices.source === 'siamchart') return meta.indices
  if (meta.trending.source === 'siamchart') return meta.trending
  return meta.stocks
}

function getThaiDate(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: THAI_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

function getThaiTime(now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: THAI_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now)
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0)

  return {
    minutes: value('hour') * 60 + value('minute') + value('second') / 60,
  }
}

function nextBusinessDate(date: Date) {
  const next = new Date(date)
  next.setDate(next.getDate() + 1)
  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1)
  }
  return next
}

function isoAt(date: Date, time: string) {
  return `${getThaiDate(date)}T${time}:00+07:00`
}

export function getMarketTradingSession(now = new Date()): MarketTradingSession {
  const day = now.getDay()
  const { minutes } = getThaiTime(now)
  const localDate = getThaiDate(now)
  const base: Omit<MarketTradingSession, 'phase' | 'updatedAt'> = {
    exchange: 'SET/mai',
    localDate,
    nextOpenAt: undefined,
    nextCloseAt: undefined,
  }

  if (day === 0 || day === 6) {
    const next = nextBusinessDate(now)
    return {
      ...base,
      phase: 'closed',
      updatedAt: now.getTime(),
      nextOpenAt: isoAt(next, '09:30'),
      nextCloseAt: isoAt(next, '16:30'),
    }
  }

  if (minutes < 9 * 60 + 30) {
    return { ...base, phase: 'pre_open', updatedAt: now.getTime(), nextOpenAt: isoAt(now, '09:30'), nextCloseAt: isoAt(now, '16:30') }
  }

  if (minutes < 10 * 60) {
    return { ...base, phase: 'pre_open', updatedAt: now.getTime(), nextOpenAt: isoAt(now, '10:00'), nextCloseAt: isoAt(now, '16:30') }
  }

  if (minutes < 12 * 60 + 30) {
    return { ...base, phase: 'market_open', updatedAt: now.getTime(), nextCloseAt: isoAt(now, '12:30') }
  }

  if (minutes < 14 * 60 + 30) {
    return { ...base, phase: 'lunch_break', updatedAt: now.getTime(), nextOpenAt: isoAt(now, '14:30'), nextCloseAt: isoAt(now, '16:30') }
  }

  if (minutes < 16 * 60 + 30) {
    return { ...base, phase: 'market_open', updatedAt: now.getTime(), nextCloseAt: isoAt(now, '16:30') }
  }

  const next = nextBusinessDate(now)
  return { ...base, phase: 'after_hours', updatedAt: now.getTime(), nextOpenAt: isoAt(next, '09:30'), nextCloseAt: isoAt(next, '16:30') }
}

export function getMarketTradingStatus(now = new Date()): MarketTradingStatus {
  const session = getMarketTradingSession(now)
  return {
    state: session.phase === 'market_open' ? 'open' : 'closed',
    session,
  }
}

export function createMarketSummaryMeta(options: {
  indices: MarketDataMeta
  trending: MarketDataMeta
  stocks: MarketDataMeta
  indicesCount?: number
  trendingCount?: number
  stockCount?: number
  breadthTotal?: number
  now?: number
}): MarketSummaryMeta {
  const now = options.now ?? Date.now()
  const sources = {
    indices: normalizeMeta(options.indices),
    trending: normalizeMeta(options.trending),
    stocks: normalizeMeta(options.stocks),
  }
  const warnings = uniqueWarnings([
    ...warningForMeta(sources.indices, 'indices', now),
    ...warningForMeta(sources.trending, 'trending', now),
    ...warningForMeta(sources.stocks, 'stocks', now),
    ...(options.indicesCount === 0 ? [{ type: 'partial' as const, message: 'ดัชนีตลาดไม่ครบถ้วน', field: 'indices' }] : []),
    ...(options.trendingCount === 0 ? [{ type: 'partial' as const, message: 'หุ้นเคลื่อนไหวไม่ครบถ้วน', field: 'trending' }] : []),
    ...(options.stockCount === 0 ? [{ type: 'missing' as const, message: 'ไม่พบข้อมูลหุ้น SET/mai', field: 'stocks' }] : []),
    ...(options.breadthTotal === 0 ? [{ type: 'partial' as const, message: 'Market breadth ไม่สามารถคำนวณได้', field: 'breadth' }] : []),
  ])
  const primary = primaryMeta(sources)

  return {
    source: primary.source,
    isDemo: primary.isDemo || warnings.some((warning) => warning.type === 'fallback' || warning.type === 'demo'),
    provider: primary.provider,
    updatedAt: Math.min(sources.indices.updatedAt, sources.trending.updatedAt, sources.stocks.updatedAt),
    ...(primary.warning ? { warning: primary.warning } : {}),
    ...(primary.warnings?.length ? { warnings: primary.warnings } : {}),
    sources,
    trading: getMarketTradingStatus(new Date(now)),
    warnings,
  }
}

export function buildMarketSummary(options: {
  indices: MarketSummary['indices']
  trending: TrendingStock[]
  stockRows: SiamchartStockRow[]
  updatedAt?: string
}): MarketSummary {
  const breadth = summarizeBreadth(options.stockRows)
  const updatedAt = options.updatedAt ?? new Date().toISOString()
  const foreign = summarizeForeign(options.stockRows)

  return {
    indices: options.indices,
    breadth,
    breadthByExchange: summarizeBreadthByExchange(options.stockRows),
    sectors: summarizeSectors(options.stockRows),
    movers: summarizeMovers(options.trending),
    ...(foreign ? { foreign } : {}),
    value: breadth.value,
    volume: breadth.volume,
    updatedAt,
  }
}

export function addMetaWarning(meta: MarketDataMeta, warning: MarketDataWarning): MarketDataMeta {
  return {
    ...meta,
    warnings: [...(meta.warnings ?? []), warning],
  }
}
