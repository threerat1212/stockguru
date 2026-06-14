import Link from 'next/link'
import {
  ArrowLeft,
  Brain,
  LineChart,
  Shield,
  Target,
  TrendingUp,
} from 'lucide-react'
import { opportunityRows, type OpportunityTone } from '@/lib/data/opportunities'
import { cn } from '@/lib/utils/format'

function getStockHref(symbol: string) {
  const clean = symbol.trim().toUpperCase()
  const nextSymbol = clean.includes('.') ? clean : `${clean}.BK`
  return `/stock/${encodeURIComponent(nextSymbol)}`
}

function getSignalBadge(tone: OpportunityTone) {
  const colors: Record<OpportunityTone, string> = {
    success: 'bg-brand-success/10 text-brand-success border-brand-success/20',
    warning: 'bg-brand-warning/10 text-brand-warning border-brand-warning/20',
    danger: 'bg-brand-danger/10 text-brand-danger border-brand-danger/20',
    info: 'bg-brand-accent/10 text-brand-accent border-brand-accent/20',
  }
  return colors[tone]
}

function getScoreColor(score: number) {
  if (score >= 5) return 'bg-brand-success'
  if (score >= 4) return 'bg-brand-warning'
  if (score >= 3) return 'bg-brand-danger'
  return 'bg-brand-text-muted'
}

function getRiskTone(tone: OpportunityTone) {
  if (tone === 'success') return 'text-brand-success'
  if (tone === 'warning') return 'text-brand-warning'
  if (tone === 'danger') return 'text-brand-danger'
  return 'text-brand-accent'
}

export default function OpportunitiesPage() {
  const topCount = opportunityRows.filter((row) => row.score >= 4).length
  const watchCount = opportunityRows.filter((row) => row.tone === 'danger').length

  return (
    <div className="space-y-5 fade-in">
      <section className="market-frame rounded-xl border border-brand-border p-4 lg:p-5">
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <Link href="/" className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-brand-text-secondary transition-colors hover:text-brand-primary">
              <ArrowLeft size={14} />
              กลับ Market desk
            </Link>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-brand-text-primary">
              <Target size={22} className="text-brand-primary" />
              Opportunity Queue
              <span className="rounded-full bg-brand-primary/15 px-2 py-0.5 text-xs font-bold text-brand-primary">{opportunityRows.length}</span>
            </h1>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-brand-text-secondary">
              รายการหุ้นที่ระบบจัดคิวจากสัญญาณราคา, volume, momentum และ risk context เพื่อให้ต่อยอดเข้าหน้าหุ้นตัวนั้นได้ทันที
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 text-right">
            <div className="rounded-lg border border-brand-border bg-brand-bg/55 p-3">
              <p className="text-[11px] text-brand-text-muted">ทั้งหมด</p>
              <p className="font-mono-nums text-lg font-semibold text-brand-text-primary">{opportunityRows.length}</p>
            </div>
            <div className="rounded-lg border border-brand-success/20 bg-brand-success/5 p-3">
              <p className="text-[11px] text-brand-text-muted">คะแนนสูง</p>
              <p className="font-mono-nums text-lg font-semibold text-brand-success">{topCount}</p>
            </div>
            <div className="rounded-lg border border-brand-danger/20 bg-brand-danger/5 p-3">
              <p className="text-[11px] text-brand-text-muted">เฝ้าระวัง</p>
              <p className="font-mono-nums text-lg font-semibold text-brand-danger">{watchCount}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="market-panel rounded-xl p-4 lg:p-5">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-brand-text-primary">Queue รายละเอียด</h2>
            <p className="mt-0.5 text-xs text-brand-text-muted">โครงสร้างเดียวกับ widget หน้าแรก แต่เพิ่ม trigger, risk และ next step</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-brand-primary/20 bg-brand-primary/10 px-2.5 py-1 text-xs font-medium text-brand-primary">
            <TrendingUp size={14} />
            Risk first ranking
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full table-fixed">
            <colgroup>
              <col className="w-[70px]" />
              <col className="w-[110px]" />
              <col className="w-[160px]" />
              <col className="w-[190px]" />
              <col className="w-[190px]" />
              <col className="w-[150px]" />
              <col className="w-[150px]" />
              <col className="w-[118px]" />
              <col className="w-[112px]" />
            </colgroup>
            <thead>
              <tr className="border-b border-brand-border/50">
                <th className="px-3 pb-3 text-left text-[11px] font-medium text-brand-text-muted">อันดับ</th>
                <th className="px-3 pb-3 text-left text-[11px] font-medium text-brand-text-muted">สัญลักษณ์</th>
                <th className="px-3 pb-3 text-left text-[11px] font-medium text-brand-text-muted">สัญญาณ</th>
                <th className="px-3 pb-3 text-left text-[11px] font-medium text-brand-text-muted">เหตุผล</th>
                <th className="px-3 pb-3 text-left text-[11px] font-medium text-brand-text-muted">Trigger</th>
                <th className="px-3 pb-3 text-left text-[11px] font-medium text-brand-text-muted">Risk</th>
                <th className="px-3 pb-3 text-left text-[11px] font-medium text-brand-text-muted">Next step</th>
                <th className="px-3 pb-3 text-center text-[11px] font-medium text-brand-text-muted">ความน่าสนใจ</th>
                <th className="px-3 pb-3 text-right text-[11px] font-medium text-brand-text-muted">ทำต่อ</th>
              </tr>
            </thead>
            <tbody>
              {opportunityRows.map((row) => (
                <tr key={row.rank} className="border-b border-brand-border/30 transition-colors hover:bg-brand-bg-secondary/45">
                  <td className="px-3 py-3 font-mono-nums text-sm text-brand-text-secondary">{row.rank}</td>
                  <td className="px-3 py-3">
                    <Link href={getStockHref(row.symbol)} className="font-semibold text-brand-text-primary transition-colors hover:text-brand-primary">
                      {row.symbol}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <span className={cn('inline-flex max-w-full truncate rounded-md border px-2 py-0.5 text-[11px] font-medium', getSignalBadge(row.tone))}>
                      {row.signal}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs text-brand-text-secondary">
                    <span className="block truncate" title={row.reason}>{row.reason}</span>
                  </td>
                  <td className="px-3 py-3 text-xs text-brand-text-secondary">
                    <span className="block truncate" title={row.trigger}>{row.trigger}</span>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <span className={cn('block truncate font-medium', getRiskTone(row.tone))} title={row.risk}>{row.risk}</span>
                  </td>
                  <td className="px-3 py-3 text-xs text-brand-text-secondary">
                    <span className="block truncate" title={row.nextStep}>{row.nextStep}</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-center gap-[2px]">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className={cn('h-2 w-4 rounded-sm', i < row.score ? getScoreColor(row.score) : 'bg-brand-border')} />
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={getStockHref(row.symbol)} aria-label={`เปิดกราฟ ${row.symbol}`} className="rounded-lg p-2 text-brand-text-secondary transition-colors hover:bg-brand-primary/10 hover:text-brand-primary">
                        <LineChart size={15} />
                      </Link>
                      <Link href={`/ai?symbol=${encodeURIComponent(`${row.symbol}.BK`)}`} aria-label={`ถาม AI เกี่ยวกับ ${row.symbol}`} className="rounded-lg p-2 text-brand-text-secondary transition-colors hover:bg-brand-accent/10 hover:text-brand-accent">
                        <Brain size={15} />
                      </Link>
                      <Link href={`/stock/${encodeURIComponent(`${row.symbol}.BK`)}#risk`} aria-label={`ดู risk ${row.symbol}`} className="rounded-lg p-2 text-brand-text-secondary transition-colors hover:bg-brand-warning/10 hover:text-brand-warning">
                        <Shield size={15} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
