'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Activity,
  Search,
  BarChart3,
  Brain,
  Filter,
  LineChart,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Star,
  X,
} from 'lucide-react'
import { useTrending } from '@/lib/hooks/use-stock'
import { useWatchlist } from '@/lib/hooks/use-watchlist'
import { useAppStore } from '@/lib/store/stockStore'
import type { TrendingStock } from '@/types/stock'
import {
  formatPercent,
  formatVolume,
  formatCurrency,
  getPriceColor,
  cn,
} from '@/lib/utils/format'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { LoadingSpinner } from '@/components/ui/Loading'

const markets = ['ทั้งหมด', 'ไทย', 'SET', 'US', 'NASDAQ', 'NYSE']
const sectors = [
  'ทั้งหมด',
  'พลังงาน',
  'ธนาคาร',
  'การเงิน',
  'ค้าปลีก',
  'ขนส่ง',
  'สื่อสาร',
  'อสังหาริมทรัพย์',
  'เทคโนโลยี',
  'ซอฟต์แวร์',
  'เซมิคอนดักเตอร์',
  'EV',
  'อินเทอร์เน็ต',
  'อีคอมเมิร์ซ',
  'อาหาร',
  'เกษตร',
]

type SortField = 'volume' | 'change' | 'marketCap' | 'price'
type SortOrder = 'asc' | 'desc'
type QuickScreenKey = 'volume' | 'usLeaders' | 'gainers' | 'pullback' | 'banks'

const quickScreens: {
  key: QuickScreenKey
  title: string
  description: string
  icon: typeof BarChart3
}[] = [
  {
    key: 'volume',
    title: 'Volume leader',
    description: 'หุ้นไทยและหุ้นนอกที่มีแรงซื้อขายสูง เหมาะสำหรับเริ่มดูแรงตลาด',
    icon: Activity,
  },
  {
    key: 'usLeaders',
    title: 'US leaders',
    description: 'หุ้นสหรัฐขนาดใหญ่ที่นักลงทุนไทยมักใช้ดูทิศทางตลาดโลก',
    icon: LineChart,
  },
  {
    key: 'gainers',
    title: 'Global gainers',
    description: 'หุ้นที่ปรับขึ้นแรง พร้อมบังคับให้เช็ก volume ก่อนตามราคา',
    icon: TrendingUp,
  },
  {
    key: 'pullback',
    title: 'Pullback watch',
    description: 'หุ้นที่อ่อนตัวแรงและควรตรวจแนวรับก่อนตัดสินใจ',
    icon: TrendingDown,
  },
  {
    key: 'banks',
    title: 'Bank focus',
    description: 'โฟกัสกลุ่มธนาคารเพื่อเทียบการเคลื่อนไหวใน sector เดียวกัน',
    icon: BarChart3,
  },
]

function getExchange(stock: TrendingStock) {
  if (stock.exchange) return stock.exchange
  return stock.symbol.endsWith('.BK') ? 'SET' : 'US'
}

function getCurrency(stock: TrendingStock) {
  return stock.currency ?? (stock.symbol.endsWith('.BK') ? 'THB' : 'USD')
}

function isThaiStock(stock: TrendingStock) {
  const exchange = getExchange(stock)
  return stock.symbol.endsWith('.BK') || exchange === 'SET' || exchange === 'mai'
}

function isUsStock(stock: TrendingStock) {
  const exchange = getExchange(stock)
  return exchange === 'NASDAQ' || exchange === 'NYSE' || (!stock.symbol.endsWith('.BK') && exchange !== 'SET' && exchange !== 'mai')
}

export default function ScreenerPage() {
  const { data: trendingData, isLoading } = useTrending()
  const { isInWatchlist, addWatchlistItem, removeWatchlistItem } = useWatchlist()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMarket, setSelectedMarket] = useState('ทั้งหมด')
  const [selectedSector, setSelectedSector] = useState('ทั้งหมด')
  const [minVolume, setMinVolume] = useState('')
  const [maxVolume, setMaxVolume] = useState('')
  const [minChange, setMinChange] = useState('')
  const [maxChange, setMaxChange] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortField, setSortField] = useState<SortField>('volume')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [activeQuickScreen, setActiveQuickScreen] = useState<QuickScreenKey | null>(null)

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedMarket('ทั้งหมด')
    setSelectedSector('ทั้งหมด')
    setMinVolume('')
    setMaxVolume('')
    setMinChange('')
    setMaxChange('')
    setActiveQuickScreen(null)
  }

  const applyQuickScreen = (key: QuickScreenKey) => {
    clearFilters()
    setActiveQuickScreen(key)

    if (key === 'volume') {
      setMinVolume('10')
      setSortField('volume')
      setSortOrder('desc')
    }

    if (key === 'usLeaders') {
      setSelectedMarket('US')
      setMinVolume('10')
      setSortField('marketCap')
      setSortOrder('desc')
    }

    if (key === 'gainers') {
      setMinVolume('5')
      setMinChange('1')
      setSortField('change')
      setSortOrder('desc')
    }

    if (key === 'pullback') {
      setMinVolume('5')
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
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  // Generate extended mock data from trending for the screener
  const allStocks = useMemo(() => {
    if (!trendingData) return []

    const extraStocks: TrendingStock[] = [
      { symbol: 'SCC.BK', name:  'ปูนซิเมนต์ไทย', price: 385.00, change: -2.50, changePercent: -0.65, volume: 3_450_000, marketCap: 462_000_000_000, sector: 'วัสดุก่อสร้าง', exchange: 'SET', currency: 'THB' },
      { symbol: 'TRUE.BK', name: 'ทรู คอร์ปอเรชั่น', price: 7.85, change: 0.15, changePercent: 1.95, volume: 85_200_000, marketCap: 290_000_000_000, sector: 'สื่อสาร', exchange: 'SET', currency: 'THB' },
      { symbol: 'BBL.BK', name: 'ธนาคารกรุงเทพ', price: 198.00, change: 1.00, changePercent: 0.51, volume: 4_320_000, marketCap: 380_000_000_000, sector: 'ธนาคาร', exchange: 'SET', currency: 'THB' },
      { symbol: 'MINT.BK', name: 'ไมเนอร์ อินเตอร์', price: 32.50, change: -0.75, changePercent: -2.26, volume: 12_800_000, marketCap: 145_000_000_000, sector: 'ขนส่ง', exchange: 'SET', currency: 'THB' },
      { symbol: 'TOP.BK', name: 'ไทยออยล์', price: 58.25, change: 1.75, changePercent: 3.10, volume: 8_900_000, marketCap: 168_000_000_000, sector: 'พลังงาน', exchange: 'SET', currency: 'THB' },
      { symbol: 'GULF.BK', name: 'กัลฟ์ เอ็นเนอร์จี', price: 52.00, change: 0.50, changePercent: 0.97, volume: 15_600_000, marketCap: 265_000_000_000, sector: 'พลังงาน', exchange: 'SET', currency: 'THB' },
      { symbol: 'EGCO.BK', name: 'เอ็กโก กรุ๊ป', price: 215.00, change: -3.00, changePercent: -1.38, volume: 2_100_000, marketCap: 78_000_000_000, sector: 'พลังงาน', exchange: 'SET', currency: 'THB' },
      { symbol: 'DELTA.BK', name: 'เดลต้า อีเลคโทรนิคส์', price: 102.00, change: 4.00, changePercent: 4.08, volume: 18_500_000, marketCap: 312_000_000_000, sector: 'เทคโนโลยี', exchange: 'SET', currency: 'THB' },
      { symbol: 'HMPRO.BK', name: 'โฮม โปรดักส์', price: 14.20, change: 0.30, changePercent: 2.16, volume: 22_400_000, marketCap: 115_000_000_000, sector: 'ค้าปลีก', exchange: 'SET', currency: 'THB' },
      { symbol: 'BEM.BK', name: 'บีอีเอ็ม', price: 9.45, change: -0.10, changePercent: -1.05, volume: 32_100_000, marketCap: 72_000_000_000, sector: 'ขนส่ง', exchange: 'SET', currency: 'THB' },
    ]

    const stockMap = new Map<string, TrendingStock>()
    ;[...trendingData, ...extraStocks].forEach((stock) => {
      stockMap.set(stock.symbol, { ...stockMap.get(stock.symbol), ...stock })
    })

    return Array.from(stockMap.values())
  }, [trendingData])

  const filteredStocks = useMemo(() => {
    let result = allStocks

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        s =>
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q)
      )
    }

    // Market filter
    if (selectedMarket !== 'ทั้งหมด') {
      result = result.filter(s => {
        const exchange = getExchange(s)
        if (selectedMarket === 'ไทย') return isThaiStock(s)
        if (selectedMarket === 'SET') return exchange === 'SET' || s.symbol.endsWith('.BK')
        if (selectedMarket === 'US') return isUsStock(s)
        if (selectedMarket === 'NASDAQ') return exchange === 'NASDAQ'
        if (selectedMarket === 'NYSE') return exchange === 'NYSE'
        return true
      })
    }

    // Sector filter
    if (selectedSector !== 'ทั้งหมด') {
      result = result.filter(s => s.sector === selectedSector)
    }

    // Volume filter
    if (minVolume) {
      const min = parseFloat(minVolume) * 1_000_000
      result = result.filter(s => s.volume >= min)
    }
    if (maxVolume) {
      const max = parseFloat(maxVolume) * 1_000_000
      result = result.filter(s => s.volume <= max)
    }

    // Change% filter
    if (minChange) {
      result = result.filter(s => s.changePercent >= parseFloat(minChange))
    }
    if (maxChange) {
      result = result.filter(s => s.changePercent <= parseFloat(maxChange))
    }

    // Sort
    result = [...result].sort((a, b) => {
      const aVal = sortField === 'marketCap' ? (a.marketCap ?? 0) : a[sortField]
      const bVal = sortField === 'marketCap' ? (b.marketCap ?? 0) : b[sortField]
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal
    })

    return result
  }, [allStocks, searchQuery, selectedMarket, selectedSector, minVolume, maxVolume, minChange, maxChange, sortField, sortOrder])

  const activeFilters = [
    selectedMarket !== 'ทั้งหมด' ? `ตลาด: ${selectedMarket}` : null,
    selectedSector !== 'ทั้งหมด' ? `กลุ่ม: ${selectedSector}` : null,
    minVolume ? `Volume >= ${minVolume}M` : null,
    maxVolume ? `Volume <= ${maxVolume}M` : null,
    minChange ? `% เปลี่ยน >= ${minChange}` : null,
    maxChange ? `% เปลี่ยน <= ${maxChange}` : null,
  ].filter(Boolean) as string[]

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-brand-text-secondary" />
    return sortOrder === 'asc' ? (
      <ChevronUp size={12} className="text-brand-primary" />
    ) : (
      <ChevronDown size={12} className="text-brand-primary" />
    )
  }

  return (
    <div className="min-w-0 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center">
            <BarChart3 size={20} className="text-brand-primary" />
          </div>
          <div>
            <h1 className="heading-balance text-2xl font-bold text-brand-text-primary">Stock Screener</h1>
            <p className="text-sm text-brand-text-secondary">ค้นหาและกรองหุ้นไทย หุ้นสหรัฐ และหุ้นต่างประเทศตามเงื่อนไขที่ต้องการ</p>
          </div>
        </div>
      </div>

      {/* Quick Screens */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {quickScreens.map((screen) => {
          const Icon = screen.icon
          const isActive = activeQuickScreen === screen.key
          return (
            <button
              key={screen.key}
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
                {isActive && (
                  <span className="rounded-md border border-brand-primary/30 bg-brand-primary/10 px-2 py-1 text-xs text-brand-primary">
                    ใช้งานอยู่
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-brand-text-primary">{screen.title}</p>
              <p className="mt-1 text-xs leading-5 text-brand-text-secondary">{screen.description}</p>
            </button>
          )
        })}
      </div>

      {/* Search & Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              icon={<Search size={16} />}
              placeholder="ค้นหาด้วยชื่อหรือสัญลักษณ์หุ้น..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            ตัวกรอง
            {activeFilters.length > 0 && (
              <span className="w-2 h-2 bg-brand-primary rounded-full" />
            )}
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-brand-border space-y-4">
            {/* Market */}
            <div>
              <label className="text-xs font-medium text-brand-text-secondary mb-2 block">ตลาด</label>
              <div className="flex flex-wrap gap-2">
                {markets.map((market) => (
                  <button
                    key={market}
                    onClick={() => setSelectedMarket(market)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors',
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

            {/* Sector */}
            <div>
              <label className="text-xs font-medium text-brand-text-secondary mb-2 block">กลุ่มอุตสาหกรรม</label>
              <div className="flex flex-wrap gap-2">
                {sectors.map((sector) => (
                  <button
                    key={sector}
                    onClick={() => setSelectedSector(sector)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-lg border transition-all',
                      selectedSector === sector
                        ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
                        : 'bg-brand-bg-secondary border-brand-border text-brand-text-secondary hover:border-brand-primary/30'
                    )}
                  >
                    {sector}
                  </button>
                ))}
              </div>
            </div>

            {/* Volume Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-brand-text-secondary mb-1.5 block">Volume ต่ำสุด (ล้าน)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={minVolume}
                  onChange={(e) => setMinVolume(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-brand-text-secondary mb-1.5 block">Volume สูงสุด (ล้าน)</label>
                <Input
                  type="number"
                  placeholder="ไม่จำกัด"
                  value={maxVolume}
                  onChange={(e) => setMaxVolume(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-brand-text-secondary mb-1.5 block">%เปลี่ยนแปลง ต่ำสุด</label>
                <Input
                  type="number"
                  placeholder="-100"
                  value={minChange}
                  onChange={(e) => setMinChange(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-brand-text-secondary mb-1.5 block">%เปลี่ยนแปลง สูงสุด</label>
                <Input
                  type="number"
                  placeholder="100"
                  value={maxChange}
                  onChange={(e) => setMaxChange(e.target.value)}
                />
              </div>
            </div>

            {/* Clear Filters */}
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                <X size={14} />
                ล้างตัวกรอง
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Results Count */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-brand-text-secondary">
          พบ <span className="font-semibold text-brand-text-primary">{filteredStocks.length}</span> จาก {allStocks.length} รายการ
        </p>
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {activeFilters.map((filter) => (
              <span key={filter} className="rounded-md border border-brand-primary/20 bg-brand-primary/10 px-2.5 py-1 text-xs text-brand-primary">
                {filter}
              </span>
            ))}
            <button
              onClick={clearFilters}
              className="text-xs text-brand-text-secondary transition-colors hover:text-brand-text-primary"
            >
              ล้างทั้งหมด
            </button>
          </div>
        )}
      </div>

      {/* Results Table */}
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
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="sticky top-0 z-10 bg-brand-card">
                <tr className="border-b border-brand-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-brand-text-secondary">สัญลักษณ์</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-brand-text-secondary">ชื่อบริษัท</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-brand-text-secondary">ตลาด</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-brand-text-secondary">กลุ่ม</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-brand-text-secondary">
                    <button
                      onClick={() => handleSort('price')}
                      className="flex items-center gap-1 ml-auto hover:text-brand-text-primary transition-colors"
                    >
                      ราคา <SortIcon field="price" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-brand-text-secondary">
                    <button
                      onClick={() => handleSort('change')}
                      className="flex items-center gap-1 ml-auto hover:text-brand-text-primary transition-colors"
                    >
                      เปลี่ยนแปลง <SortIcon field="change" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-brand-text-secondary">
                    <button
                      onClick={() => handleSort('volume')}
                      className="flex items-center gap-1 ml-auto hover:text-brand-text-primary transition-colors"
                    >
                      Volume <SortIcon field="volume" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-brand-text-secondary">
                    <button
                      onClick={() => handleSort('marketCap')}
                      className="flex items-center gap-1 ml-auto hover:text-brand-text-primary transition-colors"
                    >
                      มูลค่าตลาด <SortIcon field="marketCap" />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-brand-text-secondary">ทำต่อ</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.map((stock) => {
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
                      <td className="px-4 py-3">
                        <Link
                          href={`/stock/${encodeURIComponent(stock.symbol)}`}
                          className="flex items-center gap-2 group"
                        >
                          <div className="w-8 h-8 bg-brand-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-brand-primary">
                              {displaySym.substring(0, 2)}
                            </span>
                          </div>
                          <span className="text-sm font-semibold text-brand-text-primary group-hover:text-brand-primary transition-colors">
                            {displaySym}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-brand-text-secondary max-w-[180px] truncate block">
                          {stock.name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="info" size="sm">{exchange}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {stock.sector && (
                          <Badge variant="outline" size="sm">{stock.sector}</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-mono-nums font-medium text-brand-text-primary">
                          {formatCurrency(stock.price, currency)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPositive ? (
                            <TrendingUp size={14} className="text-brand-success" />
                          ) : (
                            <TrendingDown size={14} className="text-brand-danger" />
                          )}
                          <span className={cn('text-sm font-mono-nums font-medium', getPriceColor(stock.change))}>
                            {formatPercent(stock.changePercent)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-mono-nums text-brand-text-secondary">
                          {formatVolume(stock.volume)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-mono-nums text-brand-text-secondary">
                          {stock.marketCap ? formatCurrency(stock.marketCap, currency) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/stock/${encodeURIComponent(stock.symbol)}`}
                            aria-label={`เปิดกราฟ ${displaySym}`}
                            className="rounded-lg p-2 text-brand-text-secondary transition-colors hover:bg-brand-primary/10 hover:text-brand-primary"
                          >
                            <LineChart size={15} />
                          </Link>
                          <Link
                            href={`/ai?symbol=${encodeURIComponent(stock.symbol)}`}
                            aria-label={`ถาม AI เกี่ยวกับ ${displaySym}`}
                            className="rounded-lg p-2 text-brand-text-secondary transition-colors hover:bg-brand-accent/10 hover:text-brand-accent"
                          >
                            <Brain size={15} />
                          </Link>
                          <button
                            onClick={() => {
                              if (inWatchlist) {
                                removeWatchlistItem(stock.symbol)
                              } else {
                                addWatchlistItem(stock.symbol)
                              }
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
        )}
      </Card>
    </div>
  )
}
