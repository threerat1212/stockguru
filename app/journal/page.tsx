'use client'

import Link from 'next/link'
import { BookOpen, Plus, TrendingUp, TrendingDown, BarChart3, Eye, Download, Trash2 } from 'lucide-react'
import { useTrades, usePortfolios } from '@/lib/hooks/use-journal'
import { useSubscription } from '@/lib/hooks/use-subscription'
import JournalGate from '@/components/journal/JournalGate'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'
import { formatCurrency, cn } from '@/lib/utils/format'

export default function JournalPage() {
  const { data: trades, isLoading: tradesLoading } = useTrades()
  const { data: portfolios } = usePortfolios()
  const { journalLimit } = useSubscription()

  function exportCsv() {
    if (!trades || trades.length === 0) return
    const headers = ['symbol', 'market', 'direction', 'entry_price', 'exit_price', 'quantity', 'fees', 'pnl', 'opened_at', 'closed_at', 'setup', 'emotion', 'mistake_tags', 'result_note']
    const rows = trades.map((t) => headers.map((h) => {
      const key = h as keyof typeof t
      const v = t[key]
      if (Array.isArray(v)) return `"${v.join(',')}"`
      if (v === null || v === undefined) return ''
      return `"${String(v).replace(/"/g, '""')}"`
    }))
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stockguru-journal-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const openTrades = trades?.filter((t) => t.status === 'open') ?? []
  const closedTrades = trades?.filter((t) => t.status === 'closed') ?? []
  const totalPnL = closedTrades.reduce((sum, t) => sum + (t.pnl ?? 0), 0)
  const winCount = closedTrades.filter((t) => (t.pnl ?? 0) > 0).length
  const winRate = closedTrades.length > 0 ? Math.round((winCount / closedTrades.length) * 100) : 0

  return (
    <JournalGate>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="heading-balance text-2xl font-bold text-brand-text-primary flex items-center gap-2">
              <BookOpen size={24} className="text-brand-primary" />
              Trading Journal
            </h1>
            <p className="text-sm text-brand-text-secondary">
              บันทึกและวิเคราะห์การเทรดของคุณ — ข้อมูลเพื่อการทบทวนตนเองเท่านั้น
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1" onClick={exportCsv} disabled={!trades || trades.length === 0}>
              <Download size={16} />
              Export CSV
            </Button>
            <Link href="/journal/analytics">
              <Button variant="secondary" size="sm" className="gap-1">
                <BarChart3 size={16} />
                วิเคราะห์
              </Button>
            </Link>
            <Link href="/journal/new">
              <Button variant="primary" size="sm" className="gap-1">
                <Plus size={16} />
                บันทึกใหม่
              </Button>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="p-4">
            <p className="text-xs text-brand-text-secondary mb-1">ทั้งหมด</p>
            <p className="text-2xl font-bold text-brand-text-primary">{trades?.length ?? 0}</p>
            <p className="text-xs text-brand-text-muted">รายการ</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-brand-text-secondary mb-1">กำไร/ขาดทุน</p>
            <p className={cn('text-2xl font-bold', totalPnL >= 0 ? 'text-brand-success' : 'text-brand-danger')}>
              {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
            </p>
            <p className="text-xs text-brand-text-muted">รวมรายการปิด</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-brand-text-secondary mb-1">Win Rate</p>
            <p className="text-2xl font-bold text-brand-text-primary">{winRate}%</p>
            <p className="text-xs text-brand-text-muted">{winCount}/{closedTrades.length} รายการ</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-brand-text-secondary mb-1">Open</p>
            <p className="text-2xl font-bold text-brand-primary">{openTrades.length}</p>
            <p className="text-xs text-brand-text-muted">รายการค้าง</p>
          </Card>
        </div>

        {/* Trades List */}
        {tradesLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : trades && trades.length > 0 ? (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-brand-border">
                    <th className="text-left text-xs font-medium text-brand-text-secondary px-4 py-3">สัญลักษณ์</th>
                    <th className="text-left text-xs font-medium text-brand-text-secondary px-4 py-3">ทิศทาง</th>
                    <th className="text-right text-xs font-medium text-brand-text-secondary px-4 py-3">ราคาเข้า</th>
                    <th className="text-right text-xs font-medium text-brand-text-secondary px-4 py-3">ราคาออก</th>
                    <th className="text-right text-xs font-medium text-brand-text-secondary px-4 py-3">P&L</th>
                    <th className="text-center text-xs font-medium text-brand-text-secondary px-4 py-3">สถานะ</th>
                    <th className="text-right text-xs font-medium text-brand-text-secondary px-4 py-3">วันที่</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => {
                    const portfolio = portfolios?.find((p) => p.id === trade.portfolio_id)
                    return (
                      <tr key={trade.id} className="border-b border-brand-border/50 hover:bg-brand-bg-secondary/50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <span className="text-sm font-medium text-brand-text-primary">{trade.symbol}</span>
                            <span className="text-xs text-brand-text-muted ml-1">{portfolio?.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
                            trade.direction === 'long' ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-danger/10 text-brand-danger'
                          )}>
                            {trade.direction === 'long' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                            {trade.direction === 'long' ? 'Long' : 'Short'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-brand-text-primary font-mono-nums">
                          {formatCurrency(trade.entry_price)}
                        </td>
                        <td className="px-4 py-3 text-right text-sm text-brand-text-primary font-mono-nums">
                          {trade.exit_price ? formatCurrency(trade.exit_price) : '-'}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-mono-nums">
                          {trade.pnl !== undefined && trade.pnl !== null ? (
                            <span className={trade.pnl >= 0 ? 'text-brand-success' : 'text-brand-danger'}>
                              {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                            </span>
                          ) : (
                            <span className="text-brand-text-muted">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full',
                            trade.status === 'open' ? 'bg-brand-primary/10 text-brand-primary' :
                            trade.status === 'closed' ? 'bg-brand-success/10 text-brand-success' :
                            'bg-brand-text-muted/10 text-brand-text-muted'
                          )}>
                            {trade.status === 'open' ? 'ค้าง' : trade.status === 'closed' ? 'ปิด' : 'ยกเลิก'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-brand-text-secondary">
                          {new Date(trade.opened_at).toLocaleDateString('th-TH')}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/journal/${trade.id}`}>
                            <button className="p-1.5 text-brand-text-secondary hover:text-brand-primary rounded-lg hover:bg-brand-primary/10 transition-colors">
                              <Eye size={16} />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-16 h-16 bg-brand-primary/10 rounded-full flex items-center justify-center">
                <BookOpen size={28} className="text-brand-primary" />
              </div>
              <div>
                <p className="text-brand-text-primary font-medium mb-1">ยังไม่มีการเทรด</p>
                <p className="text-sm text-brand-text-secondary mb-4">
                  เริ่มบันทึกการเทรดครั้งแรกของคุณเพื่อติดตามและวิเคราะห์ผลงาน
                </p>
              </div>
              <Link href="/journal/new">
                <Button variant="primary" className="gap-1">
                  <Plus size={16} />
                  บันทึกการเทรด
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </JournalGate>
  )
}
