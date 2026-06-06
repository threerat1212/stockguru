'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Brain,
  CheckCircle2,
  Clock,
  Globe,
  LineChart,
  ListChecks,
  Newspaper,
  Search,
  Shield,
  Star,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react'
import MarketOverview from '@/components/market/MarketOverview'
import NewsFeed from '@/components/news/NewsFeed'
import AIChat from '@/components/ai/AIChat'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import { useTrendingStocks } from '@/lib/hooks/useStock'
import { useAppStore } from '@/lib/store/stockStore'
import {
  cn,
  formatCurrency,
  formatPercent,
  formatVolume,
  getPriceColor,
} from '@/lib/utils/format'
import type { TrendingStock } from '@/types/stock'

const scanPresets = [
  {
    href: '/screener',
    icon: Activity,
    title: 'Volume leader',
    filter: 'Volume > 10M',
    action: 'เปิดตารางหุ้นที่ตลาดกำลังไล่ราคา',
    description: 'เริ่มจากแรงซื้อขายก่อนดูข่าวและกราฟ',
  },
  {
    href: '/screener',
    icon: LineChart,
    title: 'US leaders',
    filter: 'US large cap',
    action: 'อ่านทิศทางตลาดโลกจากหุ้นนำ',
    description: 'เหมาะก่อนเปิดตลาดไทยและหลังตลาดสหรัฐปิด',
  },
  {
    href: '/screener',
    icon: TrendingUp,
    title: 'Global gainers',
    filter: 'Change > 1%',
    action: 'ดูว่าขึ้นด้วย volume จริงหรือไม่',
    description: 'กันการตามราคาจาก headline อย่างเดียว',
  },
  {
    href: '/screener',
    icon: TrendingDown,
    title: 'Pullback watch',
    filter: 'Change < -1%',
    action: 'เช็กแนวรับก่อนคิดเรื่องจังหวะ',
    description: 'แยกหุ้นพักฐานออกจากหุ้นที่ข่าวเสีย',
  },
  {
    href: '/sector',
    icon: Globe,
    title: 'Sector momentum',
    filter: 'Sector flow',
    action: 'ดูเงินไหลเข้ากลุ่มก่อนเลือกรายตัว',
    description: 'ลดการตัดสินใจจากหุ้นตัวเดียว',
  },
]

const sessionNotes = [
  { label: 'ตลาดหลัก', value: 'SET, SET50, US indices' },
  { label: 'งานวันนี้', value: 'สแกน 2-3 หุ้นที่ควรเปิดกราฟ' },
  { label: 'AI ใช้เพื่อ', value: 'สรุปเหตุผลและ risk checks' },
]

const riskChecks = [
  'Volume รองรับการเคลื่อนไหวหรือเป็นแค่ราคาไหล',
  'Sector เดียวกันยืนยันแรงซื้อขายหรือไม่',
  'ข่าวล่าสุดเป็นตัวเร่งระยะสั้นหรือเปลี่ยนพื้นฐาน',
  'มีแผน watchlist หรือ alert แทนการเฝ้าจอซ้ำ',
]

function getCurrency(stock: TrendingStock) {
  return stock.currency ?? (stock.symbol.endsWith('.BK') ? 'THB' : 'USD')
}

function getExchange(stock: TrendingStock) {
  return stock.exchange ?? (stock.symbol.endsWith('.BK') ? 'SET' : 'US')
}

function formatDisplaySymbol(symbol: string) {
  return symbol.replace('.BK', '')
}

export default function HomePage() {
  const { data: stocks, loading } = useTrendingStocks()
  const { isInWatchlist, addToWatchlist, removeFromWatchlist } = useAppStore()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const queue = stocks.slice(0, 6)
  const watchlistPreview = stocks
    .filter((stock) => isInWatchlist(stock.symbol))
    .slice(0, 4)

  return (
    <div className="min-w-0 space-y-6">
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <div className="rounded-lg border border-brand-border bg-brand-bg-secondary p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/10">
                    <BarChart3 size={20} className="text-brand-primary" />
                  </div>
                  <div>
                    <h1 className="heading-balance text-2xl font-bold leading-tight tracking-[-0.02em] text-brand-text-primary sm:text-3xl">
                      Market desk วันนี้
                    </h1>
                    <p className="mt-1 text-sm leading-6 text-brand-text-secondary">
                      สแกนตลาดไทย หุ้นนอก ข่าว และ risk checks ในหน้าทำงานเดียว
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Link href="/screener">
                    <Button size="lg">
                      <Search size={18} />
                      เริ่มสแกนหุ้น
                    </Button>
                  </Link>
                  <Link href="/stock/NVDA">
                    <Button variant="secondary" size="lg">
                      <LineChart size={18} />
                      เปิดกราฟตัวอย่าง
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="grid min-w-[260px] gap-2 text-sm">
                {sessionNotes.map((note) => (
                  <div key={note.label} className="flex items-center justify-between gap-3 rounded-lg border border-brand-border bg-brand-card px-3 py-2">
                    <span className="text-brand-text-secondary">{note.label}</span>
                    <span className="text-right font-medium text-brand-text-primary">{note.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <section>
            <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-brand-text-primary">
                  <Globe size={20} className="text-brand-primary" />
                  Market pulse
                </h2>
                <p className="text-sm text-brand-text-secondary">ใช้เป็นภาพรวมก่อนเลือกหุ้นรายตัว</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-brand-text-secondary">
                <Clock size={13} />
                รีเฟรชอัตโนมัติเมื่อมีข้อมูลใหม่
              </span>
            </div>
            <MarketOverview />
          </section>
        </div>

        <aside className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield size={16} className="text-brand-warning" />
                ก่อนตัดสินใจ
              </CardTitle>
            </CardHeader>
            <div className="space-y-3">
              {riskChecks.map((check) => (
                <div key={check} className="flex items-start gap-2 text-sm text-brand-text-secondary">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-brand-primary" />
                  <p>{check}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Star size={16} className="text-brand-warning" />
                Watchlist ตอนนี้
              </CardTitle>
              <Link href="/watchlist" className="text-sm text-brand-primary transition-colors hover:text-blue-400">
                เปิดทั้งหมด
              </Link>
            </CardHeader>
            <div className="space-y-2">
              {(watchlistPreview.length > 0 ? watchlistPreview : queue.slice(0, 4)).map((stock) => {
                const displaySymbol = formatDisplaySymbol(stock.symbol)
                return (
                  <Link
                    key={stock.symbol}
                    href={`/stock/${encodeURIComponent(stock.symbol)}`}
                    className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-brand-bg-secondary"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brand-text-primary">{displaySymbol}</p>
                      <p className="truncate text-xs text-brand-text-secondary">{stock.name}</p>
                    </div>
                    <span className={cn('font-mono-nums text-sm font-medium', getPriceColor(stock.change))}>
                      {formatPercent(stock.changePercent)}
                    </span>
                  </Link>
                )
              })}
            </div>
          </Card>
        </aside>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-brand-text-primary">
              <ListChecks size={20} className="text-brand-primary" />
              เริ่มจาก preset ที่มีเหตุผล
            </h2>
            <p className="text-sm text-brand-text-secondary">ยืม mental model จาก screener ชั้นนำ แต่ปรับภาษาและ action ให้เหมาะกับนักลงทุนไทย</p>
          </div>
          <Link href="/screener" className="inline-flex items-center gap-1 text-sm text-brand-primary transition-colors hover:text-blue-400">
            ไปที่ Screener <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          {scanPresets.map((preset) => {
            const Icon = preset.icon
            return (
              <Link
                key={preset.title}
                href={preset.href}
                className="group flex min-h-[172px] flex-col rounded-lg border border-brand-border bg-brand-card p-4 transition-colors hover:border-brand-primary/40 hover:bg-brand-surface-hover/70"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/10">
                    <Icon size={17} className="text-brand-primary" />
                  </div>
                  <span className="rounded-md border border-brand-border px-2 py-1 text-xs text-brand-text-secondary">
                    {preset.filter}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-brand-text-primary transition-colors group-hover:text-brand-primary">
                  {preset.title}
                </h3>
                <p className="mt-2 text-sm leading-5 text-brand-text-primary">{preset.action}</p>
                <p className="mt-auto pt-3 text-xs leading-5 text-brand-text-secondary">{preset.description}</p>
              </Link>
            )
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <section>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-brand-text-primary">
                  <Zap size={20} className="text-brand-warning" />
                  หุ้นที่ต้องดูต่อ
                </h2>
                <p className="text-sm text-brand-text-secondary">เรียงเป็นคิวงาน พร้อม action ไปกราฟ, AI, watchlist</p>
              </div>
              <Link href="/trending" className="inline-flex items-center gap-1 text-sm text-brand-primary transition-colors hover:text-blue-400">
                ดูทั้งหมด <ArrowRight size={14} />
              </Link>
            </div>

            <div className="overflow-hidden rounded-lg border border-brand-border bg-brand-card">
              <div className="grid grid-cols-[minmax(120px,1.2fr)_88px_92px_92px_112px] gap-3 border-b border-brand-border bg-brand-bg-secondary px-4 py-3 text-xs font-medium text-brand-text-secondary max-lg:hidden">
                <span>สัญลักษณ์</span>
                <span>ตลาด</span>
                <span className="text-right">ราคา</span>
                <span className="text-right">เปลี่ยน</span>
                <span className="text-right">ทำต่อ</span>
              </div>

              {loading ? (
                <div className="p-4 text-sm text-brand-text-secondary">กำลังโหลดหุ้นที่ต้องดูต่อ...</div>
              ) : (
                <div className="divide-y divide-brand-border/60">
                  {queue.map((stock) => {
                    const displaySymbol = formatDisplaySymbol(stock.symbol)
                    const currency = getCurrency(stock)
                    const exchange = getExchange(stock)
                    const inWatchlist = isInWatchlist(stock.symbol)

                    return (
                      <div key={stock.symbol} className="grid gap-3 px-4 py-3 transition-colors hover:bg-brand-bg-secondary/60 lg:grid-cols-[minmax(120px,1.2fr)_88px_92px_92px_112px] lg:items-center">
                        <div className="min-w-0">
                          <Link href={`/stock/${encodeURIComponent(stock.symbol)}`} className="flex items-center gap-3 group">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-primary/10">
                              <span className="text-xs font-bold text-brand-primary">{displaySymbol.substring(0, 2)}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-brand-text-primary transition-colors group-hover:text-brand-primary">{displaySymbol}</p>
                              <p className="truncate text-xs text-brand-text-secondary">{stock.name}</p>
                            </div>
                          </Link>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 lg:block">
                          <span className="rounded-md border border-brand-border px-2 py-1 text-xs text-brand-text-secondary">{exchange}</span>
                          {stock.sector && (
                            <span className="rounded-md border border-brand-border px-2 py-1 text-xs text-brand-text-secondary lg:hidden">{stock.sector}</span>
                          )}
                        </div>
                        <p className="font-mono-nums text-sm font-semibold text-brand-text-primary lg:text-right">
                          {formatCurrency(stock.price, currency)}
                        </p>
                        <div className="flex items-center gap-1.5 lg:justify-end">
                          {stock.change >= 0 ? (
                            <TrendingUp size={14} className="text-brand-success" />
                          ) : (
                            <TrendingDown size={14} className="text-brand-danger" />
                          )}
                          <span className={cn('font-mono-nums text-sm font-medium', getPriceColor(stock.change))}>
                            {formatPercent(stock.changePercent)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 lg:justify-end">
                          <Link
                            href={`/stock/${encodeURIComponent(stock.symbol)}`}
                            aria-label={`เปิดกราฟ ${displaySymbol}`}
                            className="rounded-lg p-2 text-brand-text-secondary transition-colors hover:bg-brand-primary/10 hover:text-brand-primary"
                          >
                            <LineChart size={15} />
                          </Link>
                          <Link
                            href={`/ai?symbol=${encodeURIComponent(stock.symbol)}`}
                            aria-label={`ถาม AI เกี่ยวกับ ${displaySymbol}`}
                            className="rounded-lg p-2 text-brand-text-secondary transition-colors hover:bg-brand-accent/10 hover:text-brand-accent"
                          >
                            <Brain size={15} />
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              if (inWatchlist) removeFromWatchlist(stock.symbol)
                              else addToWatchlist(stock.symbol)
                            }}
                            aria-label={inWatchlist ? `ลบ ${displaySymbol} จากรายการโปรด` : `เพิ่ม ${displaySymbol} เข้ารายการโปรด`}
                            className={cn(
                              'rounded-lg p-2 transition-colors hover:bg-brand-warning/10 hover:text-brand-warning',
                              inWatchlist ? 'text-brand-warning' : 'text-brand-text-secondary'
                            )}
                          >
                            <Star size={15} fill={inWatchlist ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                        <p className="text-xs text-brand-text-secondary lg:col-start-1 lg:col-end-6">
                          Volume {formatVolume(stock.volume)}
                          {stock.sector ? ` · กลุ่ม ${stock.sector}` : ''}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-brand-text-primary">
                  <Newspaper size={20} className="text-brand-primary" />
                  ข่าวที่กระทบตลาด
                </h2>
                <p className="text-sm text-brand-text-secondary">อ่านเฉพาะข่าวที่มี ticker หรือ sector ให้ตามต่อ</p>
              </div>
              <Link href="/news" className="inline-flex items-center gap-1 text-sm text-brand-primary transition-colors hover:text-blue-400">
                ดูทั้งหมด <ArrowRight size={14} />
              </Link>
            </div>
            <NewsFeed limit={3} />
          </section>
        </div>

        <aside className="space-y-4">
          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Brain size={20} className="text-brand-accent" />
                <h2 className="text-lg font-semibold text-brand-text-primary">ถาม AI เพื่อสรุปต่อ</h2>
              </div>
              <span className="rounded-md border border-brand-accent/30 bg-brand-accent/10 px-2 py-1 text-xs text-brand-accent">
                Risk first
              </span>
            </div>
            <AIChat />
          </section>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell size={16} className="text-brand-primary" />
                งานที่ควรตั้งเตือน
              </CardTitle>
            </CardHeader>
            <div className="space-y-3 text-sm text-brand-text-secondary">
              <p>ตั้ง alert เมื่อราคาแตะแนวรับหรือ volume เพิ่มผิดปกติ แทนการไล่เปิดหน้าจอซ้ำตลอดวัน</p>
              <Link href="/alerts" className="inline-flex items-center gap-1 text-sm font-medium text-brand-primary transition-colors hover:text-blue-400">
                ไปที่แจ้งเตือนราคา <ArrowRight size={14} />
              </Link>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
