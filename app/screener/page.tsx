'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  BarChart3,
  Brain,
  ChevronDown,
  ChevronUp,
  Database,
  Download,
  Filter,
  LineChart,
  RotateCcw,
  Save,
  Search,
  Star,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'
import { useWatchlist } from '@/lib/hooks/use-watchlist'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { useScreenerUniverse } from '@/lib/hooks/use-screener'
import { canAccessFeature } from '@/lib/subscription/plan-utils'
import FeatureGate from '@/components/auth/FeatureGate'
import type { ScreenerFilters, ScreenerStock, SortField, SortOrder } from '@/types/stock'
import { screenStocks } from '@/lib/screener/utils'
import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatVolume,
  getPriceColor,
  cn,
} from '@/lib/utils/format'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'

const markets = ['ทั้งหมด', 'ไทย', 'SET', 'mai']
const defaultSortField: SortField = 'volume'
const defaultSortOrder: SortOrder = 'desc'
const savedScreensStorageKey = 'stockguru:saved-screener-screens'

interface SavedScreenerScreen extends ScreenerFilters {
  id: string
  name: string
  createdAt: number
}

function getExchange(stock: ScreenerStock) {
  return stock.exchange ?? (stock.symbol.endsWith('.BK') ? 'SET' : 'US')
}

function getCurrency(stock: ScreenerStock) {
  return stock.currency ?? (stock.symbol.endsWith('.BK') ? 'THB' : 'USD')
}

function formatTableCurrency(value: number, currency: string) {
  const symbol = currency === 'THB' ? '฿' : currency === 'USD' ? '$' : `${currency} `
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 1_000_000_000_000) return `${sign}${symbol}${(abs / 1_000_000_000_000).toFixed(2)}T`
  if (abs >= 1_000_000_000) return `${sign}${symbol}${(abs / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `${sign}${symbol}${(abs / 1_000_000).toFixed(2)}M`
  if (abs >= 1_000) return `${sign}${symbol}${(abs / 1_000).toFixed(1)}K`
  return formatCurrency(value, currency)
}

function numberInput(value?: number) {
  return value === undefined || Number.isNaN(value) ? '' : String(value)
}

function numberOrUndefined(value: string) {
  if (value.trim() === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function nowLabel() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

export default function ScreenerPage() {
  const { isInWatchlist, addWatchlistItem, removeWatchlistItem } = useWatchlist()
  const { plan } = useSubscription()
  const hasAdvancedScreener = canAccessFeature(plan, 'advancedScreener')
  const hasExport = canAccessFeature(plan, 'exportCsv')

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMarket, setSelectedMarket] = useState('ทั้งหมด')
  const [selectedSector, setSelectedSector] = useState('ทั้งหมด')
  const [minVolume, setMinVolume] = useState('')
  const [maxVolume, setMaxVolume] = useState('')
  const [minChange, setMinChange] = useState('')
  const [maxChange, setMaxChange] = useState('')
  const [minMarketCap, setMinMarketCap] = useState('')
  const [maxMarketCap, setMaxMarketCap] = useState('')
  const [minPe, setMinPe] = useState('')
  const [maxPe, setMaxPe] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [minDividendYield, setMinDividendYield] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortField, setSortField] = useState<SortField>(defaultSortField)
  const [sortOrder, setSortOrder] = useState<SortOrder>(defaultSortOrder)
  const [activeQuickScreen, setActiveQuickScreen] = useState<string | null>(null)
  const [savedScreens, setSavedScreens] = useState<SavedScreenerScreen[]>([])
  const [savedScreenName, setSavedScreenName] = useState('')
  const [saveMessage, setSaveMessage] = useState('')

  const filters = useMemo<ScreenerFilters>(() => ({
    query: searchQuery,
    market: selectedMarket,
    sector: selectedSector,
    minMarketCap: numberOrUndefined(minMarketCap),
    maxMarketCap: numberOrUndefined(maxMarketCap),
    minPe: numberOrUndefined(minPe),
    maxPe: numberOrUndefined(maxPe),
    minVolume: numberOrUndefined(minVolume),
    maxVolume: numberOrUndefined(maxVolume),
    minPrice: numberOrUndefined(minPrice),
    maxPrice: numberOrUndefined(maxPrice),
    minChange: numberOrUndefined(minChange),
    maxChange: numberOrUndefined(maxChange),
    minDividendYield: numberOrUndefined(minDividendYield),
    sortBy: sortField,
    sortOrder,
  }), [
    searchQuery,
    selectedMarket,
    selectedSector,
    minMarketCap,
    maxMarketCap,
    minPe,
    maxPe,
    minVolume,
    maxVolume,
    minPrice,
    maxPrice,
    minChange,
    maxChange,
    minDividendYield,
    sortField,
    sortOrder,
  ])

  const {
    data: allStocks = [],
    total,
    filtered,
    meta,
    isLoading,
    error,
  } = useScreenerUniverse(filters)

  const sectors = useMemo(() => {
    const unique = Array.from(new Set(allStocks.map((stock) => stock.sector).filter(Boolean))) as string[]
    return ['ทั้งหมด', ...unique.sort((a, b) => a.localeCompare(b, 'th'))]
  }, [allStocks])

  const filteredStocks = useMemo(() => {
    if (!allStocks.length) return []
    return screenStocks(allStocks, filters)
  }, [allStocks, filters])

  const activeFilters = useMemo(() => [
    searchQuery.trim() ? `ค้นหา: ${searchQuery.trim()}` : null,
    selectedMarket !== 'ทั้งหมด' ? `ตลาด: ${selectedMarket}` : null,
    selectedSector !== 'ทั้งหมด' ? `กลุ่ม: ${selectedSector}` : null,
    minVolume ? `Volume >= ${minVolume}M` : null,
    maxVolume ? `Volume <= ${maxVolume}M` : null,
    minChange ? `% เปลี่ยน >= ${minChange}` : null,
    maxChange ? `% เปลี่ยน <= ${maxChange}` : null,
    minMarketCap ? `Market Cap >= ${minMarketCap}` : null,
    maxMarketCap ? `Market Cap <= ${maxMarketCap}` : null,
    minPe ? `P/E >= ${minPe}` : null,
    maxPe ? `P/E <= ${maxPe}` : null,
    minPrice ? `ราคา >= ${minPrice}` : null,
    maxPrice ? `ราคา <= ${maxPrice}` : null,
    minDividendYield ? `Div Yield >= ${minDividendYield}%` : null,
  ].filter(Boolean) as string[], [
    searchQuery,
    selectedMarket,
    selectedSector,
    minVolume,
    maxVolume,
    minChange,
    maxChange,
    minMarketCap,
    maxMarketCap,
    minPe,
    maxPe,
    minPrice,
    maxPrice,
    minDividendYield,
  ])

  const isFocusedScan = Boolean(searchQuery.trim() || activeFilters.length > 0 || activeQuickScreen)
  const visibleStocks = useMemo(
    () => (isFocusedScan ? filteredStocks : filteredStocks.slice(0, 24)),
    [filteredStocks, isFocusedScan]
  )
  const isPreviewLimited = !isFocusedScan && filteredStocks.length > visibleStocks.length

  useEffect(() => {
    try {
      const raw = localStorage.getItem(savedScreensStorageKey)
      if (raw) setSavedScreens(JSON.parse(raw))
    } catch {
      setSavedScreens([])
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(savedScreensStorageKey, JSON.stringify(savedScreens))
    } catch {
      // Ignore localStorage write failures.
    }
  }, [savedScreens])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedMarket('ทั้งหมด')
    setSelectedSector('ทั้งหมด')
    setMinVolume('')
    setMaxVolume('')
    setMinChange('')
    setMaxChange('')
    setMinMarketCap('')
    setMaxMarketCap('')
    setMinPe('')
    setMaxPe('')
    setMinPrice('')
    setMaxPrice('')
    setMinDividendYield('')
    setActiveQuickScreen(null)
    setSortField(defaultSortField)
    setSortOrder(defaultSortOrder)
  }

  const applyQuickScreen = (key: string) => {
    clearFilters()
    setActiveQuickScreen(key)

    if (key === 'volume') {
      setSelectedMarket('ไทย')
      setMinVolume('1')
      setSortField('volume')
      setSortOrder('desc')
    }

    if (key === 'largeCap') {
      setSelectedMarket('ไทย')
      setMinMarketCap('100000000000')
      setSortField('marketCap')
      setSortOrder('desc')
    }

    if (key === 'gainers') {
      setSelectedMarket('ไทย')
      setMinVolume('1')
      setMinChange('1')
      setSortField('change')
      setSortOrder('desc')
    }

    if (key === 'pullback') {
      setSelectedMarket('ไทย')
      setMinVolume('1')
      setMaxChange('-1')
      setSortField('change')
      setSortOrder('asc')
    }

    if (key === 'banks') {
      setSelectedMarket('ไทย')
      setSelectedSector('ธนาคาร')
      setSortField('marketCap')
      setSortOrder('desc')
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
      return
    }
    setSortField(field)
    setSortOrder('desc')
  }

  const saveCurrentScreen = () => {
    if (!hasAdvancedScreener) return
    const name = savedScreenName.trim()
    if (!name) {
      setSaveMessage('ตั้งชื่อชุดกรองก่อนบันทึก')
      return
    }

    const screen: SavedScreenerScreen = {
      id: `${Date.now()}`,
      name,
      createdAt: Date.now(),
      ...filters,
    }

    const next = [screen, ...savedScreens.filter((item) => item.name !== name)].slice(0, 20)
    setSavedScreens(next)
    setSavedScreenName('')
    setSaveMessage('บันทึกชุดกรองแล้ว')
    window.setTimeout(() => setSaveMessage(''), 2500)
  }

  const loadScreen = (screen: SavedScreenerScreen) => {
    setSearchQuery(screen.query ?? '')
    setSelectedMarket(screen.market ?? 'ทั้งหมด')
    setSelectedSector(screen.sector ?? 'ทั้งหมด')
    setMinVolume(numberInput(screen.minVolume))
    setMaxVolume(numberInput(screen.maxVolume))
    setMinChange(numberInput(screen.minChange))
    setMaxChange(numberInput(screen.maxChange))
    setMinMarketCap(numberInput(screen.minMarketCap))
    setMaxMarketCap(numberInput(screen.maxMarketCap))
    setMinPe(numberInput(screen.minPe))
    setMaxPe(numberInput(screen.maxPe))
    setMinPrice(numberInput(screen.minPrice))
    setMaxPrice(numberInput(screen.maxPrice))
    setMinDividendYield(numberInput(screen.minDividendYield))
    setSortField((screen.sortBy ?? defaultSortField) as SortField)
    setSortOrder(screen.sortOrder ?? defaultSortOrder)
    setActiveQuickScreen(null)
  }

  const removeScreen = (id: string) => {
    setSavedScreens((current) => current.filter((screen) => screen.id !== id))
  }

  const exportCsv = async () => {
    if (!hasExport) return
    try {
      const res = await fetch('/api/screener/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters }),
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `stockguru-screener-${nowLabel()}.csv`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch {
      setSaveMessage('Export CSV ล้มเหลว กรุณาลองใหม่')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronDown size={12} className="text-brand-text-secondary" />
    return sortOrder === 'asc' ? (
      <ChevronUp size={12} className="text-brand-primary" />
    ) : (
      <ChevronDown size={12} className="text-brand-primary" />
    )
  }

  return (
    <div className="min-w-0 space-y-6 fade-in">
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
            <Database size={20} className="text-brand-primary" />
          </div>
          <div>
            <h1 className="heading-balance text-2xl font-bold text-brand-text-primary">Advanced Stock Screener</h1>
            <p className="text-sm text-brand-text-secondary">
              คัดหุ้นจาก full universe SET/mai พร้อมตัวกรองขั้นสูง บันทึกชุดกรอง และ export CSV
            </p>
          </div>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-brand-border bg-brand-bg-secondary p-4">
            <p className="text-xs font-medium text-brand-text-secondary">Full universe</p>
            <p className="mt-1 text-2xl font-bold text-brand-text-primary">{formatNumber(total, 0)}</p>
            <p className="text-xs text-brand-text-secondary">รายการหุ้น SET/mai จาก SiamChart</p>
          </div>
          <div className="rounded-lg border border-brand-border bg-brand-bg-secondary p-4">
            <p className="text-xs font-medium text-brand-text-secondary">ตรงกับเงื่อนไข</p>
            <p className="mt-1 text-2xl font-bold text-brand-text-primary">{formatNumber(filtered || filteredStocks.length, 0)}</p>
            <p className="text-xs text-brand-text-secondary">นับตามตัวกรองปัจจุบัน</p>
          </div>
          <div className="rounded-lg border border-brand-border bg-brand-bg-secondary p-4">
            <p className="text-xs font-medium text-brand-text-secondary">ข้อมูลล่าสุด</p>
            <p className="mt-1 text-lg font-semibold text-brand-text-primary">
              {meta?.updatedAt ? new Date(meta.updatedAt).toLocaleTimeString('th-TH') : '-'}
            </p>
            <p className="text-xs text-brand-text-secondary">{meta?.provider ?? 'SiamChart'}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { key: 'volume', title: 'Volume leader', description: 'หุ้นไทยที่มีแรงซื้อขายสูง', icon: Activity },
          { key: 'largeCap', title: 'SET ใหญ่', description: 'หุ้นไทยขนาดใหญ่ เหมาะดูผู้นำตลาด', icon: BarChart3 },
          { key: 'gainers', title: 'Gainers', description: 'หุ้นไทยที่ขึ้นแรงวันนี้', icon: TrendingUp },
          { key: 'pullback', title: 'Pullback watch', description: 'หุ้นไทยที่อ่อนตัวแรง', icon: TrendingDown },
          { key: 'banks', title: 'Bank focus', description: 'โฟกัสกลุ่มธนาคาร', icon: LineChart },
        ].map((screen) => {
          const Icon = screen.icon
          const isActive = activeQuickScreen === screen.key
          return (
            <button
              key={screen.key}
              type="button"
              onClick={() => applyQuickScreen(screen.key)}
              aria-pressed={isActive}
              className={cn(
                'min-w-0 rounded-lg border bg-brand-card p-4 text-left transition-colors hover:border-brand-primary/40 hover:bg-brand-surface-hover/70 focus:outline-none focus:ring-2 focus:ring-brand-primary/40',
                isActive ? 'border-brand-primary/70 bg-brand-primary/10' : 'border-brand-border'
              )}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/10">
                  <Icon size={17} className="text-brand-primary" />
                </div>
                {isActive && <Badge variant="outline" size="sm">ใช้งานอยู่</Badge>}
              </div>
              <p className="text-sm font-semibold text-brand-text-primary">{screen.title}</p>
              <p className="mt-1 text-xs leading-5 text-brand-text-secondary">{screen.description}</p>
            </button>
          )
        })}
      </div>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
          <div className="flex-1">
            <Input
              icon={<Search size={16} />}
              placeholder="ค้นหาด้วยชื่อหรือสัญลักษณ์หุ้น..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            ตัวกรอง
            {activeFilters.length > 0 && <span className="w-2 h-2 bg-brand-primary rounded-full" />}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={clearFilters}
            disabled={!activeFilters.length}
          >
            <RotateCcw size={16} />
            ล้าง
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={exportCsv}
            disabled={!hasExport || filteredStocks.length === 0}
          >
            <Download size={16} />
            Export CSV
          </Button>
        </div>

        {showFilters && !hasAdvancedScreener && (
          <div className="mt-4 pt-4 border-t border-brand-border">
            <FeatureGate feature="advancedScreener" inline />
          </div>
        )}

        {showFilters && hasAdvancedScreener && (
          <div className="mt-4 pt-4 border-t border-brand-border space-y-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-brand-text-secondary mb-2 block">ตลาด</label>
                <div className="flex flex-wrap gap-2">
                  {markets.map((market) => (
                    <button
                      key={market}
                      type="button"
                      onClick={() => setSelectedMarket(market)}
                      className={cn(
                        'px-3 py-1.5 text-xs font-medium rounded-lg border transition-all',
                        selectedMarket === market
                          ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
                          : 'bg-brand-bg-secondary border-brand-border text-brand-text-secondary hover:border-brand-primary/30'
                      )}
                    >
                      {market}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-brand-text-secondary mb-2 block">กลุ่มอุตสาหกรรม</label>
                <select
                  value={selectedSector}
                  onChange={(event) => setSelectedSector(event.target.value)}
                  className="w-full rounded-lg border border-brand-border bg-brand-bg-secondary px-4 py-2.5 text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/60"
                >
                  {sectors.map((sector) => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Input type="number" placeholder="Volume ต่ำสุด (ล้าน)" value={minVolume} onChange={(event) => setMinVolume(event.target.value)} />
              <Input type="number" placeholder="Volume สูงสุด (ล้าน)" value={maxVolume} onChange={(event) => setMaxVolume(event.target.value)} />
              <Input type="number" placeholder="% เปลี่ยนต่ำสุด" value={minChange} onChange={(event) => setMinChange(event.target.value)} />
              <Input type="number" placeholder="% เปลี่ยนสูงสุด" value={maxChange} onChange={(event) => setMaxChange(event.target.value)} />
              <Input type="number" placeholder="Market Cap ต่ำสุด" value={minMarketCap} onChange={(event) => setMinMarketCap(event.target.value)} />
              <Input type="number" placeholder="Market Cap สูงสุด" value={maxMarketCap} onChange={(event) => setMaxMarketCap(event.target.value)} />
              <Input type="number" placeholder="P/E ต่ำสุด" value={minPe} onChange={(event) => setMinPe(event.target.value)} />
              <Input type="number" placeholder="P/E สูงสุด" value={maxPe} onChange={(event) => setMaxPe(event.target.value)} />
              <Input type="number" placeholder="ราคาต่ำสุด" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} />
              <Input type="number" placeholder="ราคาสูงสุด" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} />
              <Input type="number" placeholder="Dividend Yield ต่ำสุด (%)" value={minDividendYield} onChange={(event) => setMinDividendYield(event.target.value)} />
            </div>

            <div className="rounded-lg border border-brand-border bg-brand-bg-secondary p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="flex-1">
                  <label className="text-xs font-medium text-brand-text-secondary mb-2 block">บันทึกชุดกรองปัจจุบัน</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="เช่น หุ้นใหญ่ Volume สูง"
                      value={savedScreenName}
                      onChange={(event) => setSavedScreenName(event.target.value)}
                    />
                    <Button type="button" variant="secondary" onClick={saveCurrentScreen}>
                      <Save size={16} />
                      บันทึก
                    </Button>
                  </div>
                </div>
                {saveMessage && <p className="text-sm text-brand-primary">{saveMessage}</p>}
              </div>

              {savedScreens.length > 0 && (
                <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                  {savedScreens.map((screen) => (
                    <div key={screen.id} className="flex items-center justify-between gap-3 rounded-lg border border-brand-border bg-brand-card p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-brand-text-primary">{screen.name}</p>
                        <p className="text-xs text-brand-text-secondary">
                          {new Date(screen.createdAt).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button type="button" variant="ghost" size="sm" onClick={() => loadScreen(screen)}>โหลด</Button>
                        <button
                          type="button"
                          onClick={() => removeScreen(screen.id)}
                          className="rounded-lg p-2 text-brand-text-secondary transition-colors hover:bg-brand-danger/10 hover:text-brand-danger"
                          aria-label={`ลบ ${screen.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {error && (
        <div className="rounded-lg border border-brand-danger/30 bg-brand-danger/10 p-4 text-sm text-brand-danger">
          ไม่สามารถโหลดข้อมูล screener ได้: {error.message}
        </div>
      )}

      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filter) => (
            <span key={filter} className="rounded-md border border-brand-primary/20 bg-brand-primary/10 px-2.5 py-1 text-xs text-brand-primary">
              {filter}
            </span>
          ))}
        </div>
      )}

      <Card padding="none">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="md" />
          </div>
        ) : filteredStocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Search size={32} className="text-brand-text-secondary" />
            <div className="text-center">
              <p className="text-sm font-medium text-brand-text-primary">ไม่พบหุ้นที่ตรงกับเงื่อนไข</p>
              <p className="mt-1 text-sm text-brand-text-secondary">ลองลดตัวกรอง หรือเริ่มจาก quick screen ด้านบน</p>
            </div>
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              <X size={14} />
              ล้างตัวกรอง
            </Button>
          </div>
        ) : (
          <>
          <div className="flex flex-col gap-2 border-b border-brand-border px-4 py-3 text-sm text-brand-text-secondary md:flex-row md:items-center md:justify-between">
            <span>
              {isPreviewLimited
                ? `แสดงตัวอย่าง ${visibleStocks.length} รายการแรกจาก ${formatNumber(filteredStocks.length, 0)} รายการ ใช้ค้นหาหรือตัวกรองเพื่อเจาะหุ้นที่ต้องการ`
                : `แสดง ${formatNumber(visibleStocks.length, 0)} รายการตามเงื่อนไขปัจจุบัน`}
            </span>
            {isPreviewLimited && (
              <button type="button" onClick={() => setShowFilters(true)} className="self-start text-xs font-semibold text-brand-primary hover:text-emerald-300 md:self-auto">
                เปิดตัวกรอง
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] w-full table-fixed">
              <colgroup>
                <col className="w-[128px]" />
                <col className="w-[220px]" />
                <col className="w-[76px]" />
                <col className="w-[112px]" />
                <col className="w-[100px]" />
                <col className="w-[118px]" />
                <col className="w-[104px]" />
                <col className="w-[118px]" />
                <col className="w-[64px]" />
                <col className="w-[86px]" />
                <col className="w-[96px]" />
              </colgroup>
              <thead className="sticky top-0 z-10 bg-brand-card">
                <tr className="border-b border-brand-border">
                  <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary">สัญลักษณ์</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary">ชื่อบริษัท</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary">ตลาด</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-brand-text-secondary">กลุ่ม</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-brand-text-secondary">
                    <button type="button" onClick={() => handleSort('price')} className="flex items-center gap-1 ml-auto hover:text-brand-text-primary transition-colors">
                      ราคา <SortIcon field="price" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-brand-text-secondary">
                    <button type="button" onClick={() => handleSort('change')} className="flex items-center gap-1 ml-auto hover:text-brand-text-primary transition-colors">
                      เปลี่ยนแปลง <SortIcon field="change" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-brand-text-secondary">
                    <button type="button" onClick={() => handleSort('volume')} className="flex items-center gap-1 ml-auto hover:text-brand-text-primary transition-colors">
                      Volume <SortIcon field="volume" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-brand-text-secondary">
                    <button type="button" onClick={() => handleSort('marketCap')} className="flex items-center gap-1 ml-auto hover:text-brand-text-primary transition-colors">
                      มูลค่าตลาด <SortIcon field="marketCap" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-brand-text-secondary">P/E</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-brand-text-secondary">Div Yield</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-brand-text-secondary">ทำต่อ</th>
                </tr>
              </thead>
              <tbody>
                {visibleStocks.map((stock) => {
                  const displaySym = stock.symbol.replace('.BK', '')
                  const isPositive = stock.change >= 0
                  const inWatchlist = isInWatchlist(stock.symbol)
                  const exchange = getExchange(stock)
                  const currency = getCurrency(stock)

                  return (
                    <tr
                      key={stock.symbol}
                      className="border-b border-brand-border/50 hover:bg-brand-bg-secondary/50 transition-colors"
                    >
                      <td className="px-4 py-3 align-middle">
                        <Link href={`/stock/${encodeURIComponent(stock.symbol)}`} className="group flex min-w-0 items-center gap-2">
                          <div className="w-8 h-8 bg-brand-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-brand-primary">{displaySym.substring(0, 2)}</span>
                          </div>
                          <span className="min-w-0 truncate text-sm font-semibold text-brand-text-primary transition-colors group-hover:text-brand-primary">
                            {displaySym}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="block truncate text-sm text-brand-text-secondary" title={stock.name}>{stock.name}</span>
                      </td>
                      <td className="px-4 py-3 align-middle"><Badge variant="info" size="sm">{exchange}</Badge></td>
                      <td className="px-4 py-3 align-middle">
                        {stock.sector && (
                          <span className="block truncate" title={stock.sector}>
                            <Badge variant="outline" size="sm">{stock.sector}</Badge>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right align-middle">
                        <span className="block truncate font-mono-nums text-sm font-medium text-brand-text-primary" title={formatCurrency(stock.price, currency)}>
                          {formatTableCurrency(stock.price, currency)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPositive ? <TrendingUp size={14} className="text-brand-success" /> : <TrendingDown size={14} className="text-brand-danger" />}
                          <span className={cn('truncate text-sm font-mono-nums font-medium', getPriceColor(stock.change))}>
                            {formatPercent(stock.changePercent)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right align-middle"><span className="block truncate font-mono-nums text-sm text-brand-text-secondary">{formatVolume(stock.volume)}</span></td>
                      <td className="px-4 py-3 text-right align-middle">
                        <span className="block truncate font-mono-nums text-sm text-brand-text-secondary" title={stock.marketCap ? formatCurrency(stock.marketCap, currency) : '-'}>
                          {stock.marketCap ? formatTableCurrency(stock.marketCap, currency) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right align-middle"><span className="block truncate font-mono-nums text-sm text-brand-text-secondary">{stock.pe !== undefined ? formatNumber(stock.pe, 2) : '-'}</span></td>
                      <td className="px-4 py-3 text-right align-middle"><span className="block truncate font-mono-nums text-sm text-brand-text-secondary">{stock.dividendYield !== undefined ? `${formatNumber(stock.dividendYield, 2)}%` : '-'}</span></td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/stock/${encodeURIComponent(stock.symbol)}`} aria-label={`เปิดกราฟ ${displaySym}`} className="rounded-lg p-2 text-brand-text-secondary transition-colors hover:bg-brand-primary/10 hover:text-brand-primary">
                            <LineChart size={15} />
                          </Link>
                          <Link href={`/ai?symbol=${encodeURIComponent(stock.symbol)}`} aria-label={`ถาม AI เกี่ยวกับ ${displaySym}`} className="rounded-lg p-2 text-brand-text-secondary transition-colors hover:bg-brand-accent/10 hover:text-brand-accent">
                            <Brain size={15} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              if (inWatchlist) removeWatchlistItem(stock.symbol)
                              else addWatchlistItem(stock.symbol)
                            }}
                            aria-label={inWatchlist ? `ลบ ${displaySym} จากรายการโปรด` : `เพิ่ม ${displaySym} เข้ารายการโปรด`}
                            className={cn(
                              'rounded-lg p-2 transition-colors hover:bg-brand-warning/10 hover:text-brand-warning',
                              inWatchlist ? 'text-brand-warning' : 'text-brand-text-secondary'
                            )}
                          >
                            <Star size={15} fill={inWatchlist ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          </>
        )}
      </Card>
    </div>
  )
}
