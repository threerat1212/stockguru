'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, Clock, DollarSign, Filter, AlertCircle, Plus, X, Star } from 'lucide-react'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils/format'
import type { EarningsCalendarEvent } from '@/types/stock'

const SAMPLE_EARNINGS: EarningsCalendarEvent[] = [
  { symbol: 'PTT.BK', name: 'ปตท.', earningsDate: '2026-08-12', epsEstimate: 2.45, quarter: 2, year: 2026, earningsCallTime: 'after' },
  { symbol: 'SCB.BK', name: 'ไทยพาณิชย์', earningsDate: '2026-07-18', epsEstimate: 4.12, quarter: 2, year: 2026, earningsCallTime: 'after' },
  { symbol: 'CPALL.BK', name: 'ซีพี ออลล์', earningsDate: '2026-08-14', epsEstimate: 0.68, quarter: 2, year: 2026, earningsCallTime: 'after' },
  { symbol: 'KBANK.BK', name: 'กสิกรไทย', earningsDate: '2026-07-17', epsEstimate: 3.85, quarter: 2, year: 2026, earningsCallTime: 'after' },
  { symbol: 'AOT.BK', name: 'ท่าอากาศยานไทย', earningsDate: '2026-08-08', epsEstimate: 0.42, quarter: 3, year: 2026, earningsCallTime: 'after' },
  { symbol: 'CPN.BK', name: 'เซ็นทรัลพัฒนา', earningsDate: '2026-07-25', epsEstimate: 1.15, quarter: 2, year: 2026, earningsCallTime: 'after' },
  { symbol: 'ADVANC.BK', name: 'แอดวานซ์', earningsDate: '2026-07-23', epsEstimate: 3.20, quarter: 2, year: 2026, earningsCallTime: 'after' },
  { symbol: 'BDMS.BK', name: 'กรุงเทพดุสิตเวชการ', earningsDate: '2026-08-07', epsEstimate: 0.35, quarter: 2, year: 2026, earningsCallTime: 'after' },
  { symbol: 'TRUE.BK', name: 'ทรู คอร์ปอเรชั่น', earningsDate: '2026-08-01', epsEstimate: 0.08, quarter: 2, year: 2026, earningsCallTime: 'after' },
  { symbol: 'GULF.BK', name: 'กัลฟ์', earningsDate: '2026-08-13', epsEstimate: 0.95, quarter: 2, year: 2026, earningsCallTime: 'after' },
  { symbol: 'MINT.BK', name: 'ไมเนอร์', earningsDate: '2026-08-15', epsEstimate: 0.45, quarter: 2, year: 2026, earningsCallTime: 'after' },
  { symbol: 'BBL.BK', name: 'กรุงเทพ', earningsDate: '2026-07-16', epsEstimate: 5.20, quarter: 2, year: 2026, earningsCallTime: 'after' },
  { symbol: 'IVL.BK', name: 'อินโดรามา', earningsDate: '2026-08-08', epsEstimate: 0.72, quarter: 2, year: 2026, earningsCallTime: 'after' },
  { symbol: 'TISCO.BK', name: 'ทิสโก้', earningsDate: '2026-07-15', epsEstimate: 2.80, quarter: 2, year: 2026, earningsCallTime: 'after' },
  { symbol: 'TU.BK', name: 'ไทยยูเนี่ยน', earningsDate: '2026-08-06', epsEstimate: 0.28, quarter: 2, year: 2026, earningsCallTime: 'after' },
]

const STORAGE_KEY = 'stockguru_earnings_symbols'
const QUICK_SYMBOLS = ['PTT.BK', 'SCB.BK', 'KBANK.BK', 'CPALL.BK', 'AOT.BK', 'ADVANC.BK', 'GULF.BK']
type FilterPeriod = 'all' | 'thisWeek' | 'nextWeek' | 'thisMonth'

function normalizeSymbol(value: string) {
  const upper = value.trim().toUpperCase()
  if (!upper) return ''
  if (upper.includes('.') || ['AAPL', 'MSFT', 'NVDA', 'TSLA'].includes(upper)) return upper
  return `${upper}.BK`
}

export default function EarningsPage() {
  const [filter, setFilter] = useState<FilterPeriod>('all')
  const [customInput, setCustomInput] = useState('')
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([])

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved) setSelectedSymbols(JSON.parse(saved))
  }, [])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selectedSymbols))
  }, [selectedSymbols])

  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  const startOfNextWeek = new Date(endOfWeek)
  startOfNextWeek.setDate(endOfWeek.getDate() + 1)
  const endOfNextWeek = new Date(startOfNextWeek)
  endOfNextWeek.setDate(startOfNextWeek.getDate() + 6)

  const filteredEarnings = SAMPLE_EARNINGS.filter(event => {
    const eventDate = new Date(event.earningsDate)
    const matchPeriod = (() => {
      switch (filter) {
        case 'thisWeek': return eventDate >= startOfWeek && eventDate <= endOfWeek
        case 'nextWeek': return eventDate >= startOfNextWeek && eventDate <= endOfNextWeek
        case 'thisMonth': return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear()
        default: return true
      }
    })()
    const matchSymbols = selectedSymbols.length === 0 || selectedSymbols.includes(event.symbol)
    return matchPeriod && matchSymbols
  }).sort((a, b) => new Date(a.earningsDate).getTime() - new Date(b.earningsDate).getTime())

  function addSymbol(value: string) {
    const symbol = normalizeSymbol(value)
    if (!symbol || selectedSymbols.includes(symbol)) return
    setSelectedSymbols(prev => [...prev, symbol])
    setCustomInput('')
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  function isToday(dateStr: string): boolean {
    return new Date(dateStr).toDateString() === new Date().toDateString()
  }

  function isPast(dateStr: string): boolean {
    return new Date(dateStr) < new Date()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-primary/10">
            <Calendar size={20} className="text-brand-primary" />
          </div>
          <div>
            <h1 className="heading-balance text-2xl font-bold text-brand-text-primary">ปฏิทินประกาศงบ</h1>
            <Badge variant="warning" size="sm">ข้อมูลตัวอย่าง</Badge>
            <p className="text-sm text-brand-text-secondary">เลือกหุ้นที่ต้องการติดตามเอง แล้วระบบจะจำไว้ในเครื่องนี้</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Star size={18} className="text-brand-warning" /> หุ้นที่ต้องการติดตาม</CardTitle>
        </CardHeader>
        <div className="rounded-lg border border-brand-warning/30 bg-brand-warning/5 px-3 py-2 text-xs text-brand-text-secondary">
          ปฏิทินประกาศงบเป็นข้อมูลตัวอย่างเพื่อสาธิต UI ยังไม่ใช่ข้อมูลจริงจาก SET
        </div>
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input value={customInput} onChange={(e) => setCustomInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addSymbol(customInput)} placeholder="เพิ่มหุ้น เช่น PTT, KBANK, AAPL" className="flex-1 rounded-lg border border-brand-border bg-brand-bg-secondary px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-primary" />
            <Button onClick={() => addSymbol(customInput)} disabled={!customInput.trim()}><Plus size={16} /> เพิ่ม</Button>
            {selectedSymbols.length > 0 && <Button variant="secondary" onClick={() => setSelectedSymbols([])}>ดูทั้งหมด</Button>}
          </div>
          <div className="flex flex-wrap gap-2">
            {QUICK_SYMBOLS.map(sym => <button key={sym} onClick={() => addSymbol(sym)} disabled={selectedSymbols.includes(sym)} className="rounded-lg border border-brand-border px-3 py-1.5 text-xs text-brand-text-secondary hover:border-brand-primary/40 disabled:opacity-50">{sym.replace('.BK', '')}</button>)}
          </div>
          {selectedSymbols.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedSymbols.map(sym => (
                <span key={sym} className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-3 py-1 text-xs text-brand-primary">
                  {sym.replace('.BK', '')}
                  <button onClick={() => setSelectedSymbols(prev => prev.filter(s => s !== sym))}><X size={12} /></button>
                </span>
              ))}
            </div>
          )}
        </div>
      </Card>

      <Card padding="sm">
        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter size={16} className="shrink-0 text-brand-text-secondary" />
          {[
            { key: 'all' as const, label: 'ทั้งหมด' },
            { key: 'thisWeek' as const, label: 'สัปดาห์นี้' },
            { key: 'nextWeek' as const, label: 'สัปดาห์หน้า' },
            { key: 'thisMonth' as const, label: 'เดือนนี้' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={cn('whitespace-nowrap rounded-lg px-3 py-1.5 text-sm transition-all', filter === f.key ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-brand-bg-secondary hover:text-brand-text-primary')}>
              {f.label}
            </button>
          ))}
        </div>
      </Card>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-border">
                <th className="p-3 text-left text-xs font-medium text-brand-text-secondary sm:p-4">วันที่</th>
                <th className="p-3 text-left text-xs font-medium text-brand-text-secondary sm:p-4">หุ้น</th>
                <th className="hidden p-3 text-center text-xs font-medium text-brand-text-secondary sm:table-cell sm:p-4">ไตรมาส</th>
                <th className="p-3 text-right text-xs font-medium text-brand-text-secondary sm:p-4">EPS คาดการณ์</th>
                <th className="hidden p-3 text-center text-xs font-medium text-brand-text-secondary md:table-cell sm:p-4">เวลา</th>
                <th className="p-3 text-center text-xs font-medium text-brand-text-secondary sm:p-4">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {filteredEarnings.map((event) => {
                const past = isPast(event.earningsDate)
                const today = isToday(event.earningsDate)
                return (
                  <tr key={`${event.symbol}-${event.earningsDate}`} className={cn('border-b border-brand-border/50 transition-colors', today ? 'bg-brand-primary/5' : 'hover:bg-brand-bg-secondary/50', past && 'opacity-60')}>
                    <td className="p-3 sm:p-4"><div className="flex items-center gap-2"><Calendar size={14} className="text-brand-text-secondary" /><span className={cn('text-sm', today ? 'font-bold text-brand-primary' : 'text-brand-text-primary')}>{formatDate(event.earningsDate)}</span></div></td>
                    <td className="p-3 sm:p-4"><Link href={`/stock/${encodeURIComponent(event.symbol)}`} className="group"><p className="text-sm font-semibold text-brand-text-primary group-hover:text-brand-primary">{event.symbol.replace('.BK', '')}</p>{event.name && <p className="max-w-[150px] truncate text-xs text-brand-text-secondary">{event.name}</p>}</Link></td>
                    <td className="hidden p-3 text-center sm:table-cell sm:p-4"><Badge variant="outline" size="sm">Q{event.quarter}/{event.year}</Badge></td>
                    <td className="p-3 text-right sm:p-4">{event.epsEstimate !== undefined ? <div className="flex items-center justify-end gap-1"><DollarSign size={12} className="text-brand-text-secondary" /><span className="font-mono-nums text-sm font-semibold text-brand-text-primary">{event.epsEstimate.toFixed(2)}</span></div> : <span className="text-xs text-brand-text-secondary">—</span>}</td>
                    <td className="hidden p-3 text-center md:table-cell sm:p-4"><div className="flex items-center justify-center gap-1"><Clock size={12} className="text-brand-text-secondary" /><span className="text-xs text-brand-text-secondary">{event.earningsCallTime === 'after' ? 'หลังตลาด' : event.earningsCallTime === 'before' ? 'ก่อนตลาด' : 'TBA'}</span></div></td>
                    <td className="p-3 text-center sm:p-4">{today ? <Badge variant="info" size="sm">วันนี้</Badge> : past ? <Badge variant="default" size="sm">ผ่านไปแล้ว</Badge> : <Badge variant="success" size="sm">กำลังจะมาถึง</Badge>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filteredEarnings.length === 0 && <div className="p-8 text-center"><Calendar size={32} className="mx-auto mb-2 text-brand-text-secondary" /><p className="text-sm text-brand-text-secondary">ไม่มีกำหนดการประกาศงบสำหรับหุ้น/ช่วงเวลาที่เลือก</p></div>}
      </Card>

      <Card className="border-brand-primary/20 bg-brand-primary/5">
        <div className="flex items-start gap-3">
          <AlertCircle size={18} className="mt-0.5 shrink-0 text-brand-primary" />
          <div className="space-y-1 text-sm text-brand-text-secondary">
            <p className="font-medium text-brand-text-primary">เกี่ยวกับปฏิทินประกาศงบ</p>
            <p>📅 วันที่เป็นข้อมูลตัวอย่างและอาจเปลี่ยนแปลง ควรตรวจสอบจาก SET / IR บริษัทอีกครั้ง</p>
            <p>⭐ ถ้าเลือกหุ้นเอง ระบบจะแสดงเฉพาะหุ้นที่เลือก ถ้ากด “ดูทั้งหมด” จะกลับไปแสดงทุกหุ้น</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
