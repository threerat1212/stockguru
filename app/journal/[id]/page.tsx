'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Trash2, Edit3, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { useTrades, useUpdateTrade, useDeleteTrade } from '@/lib/hooks/use-journal'
import JournalGate from '@/components/journal/JournalGate'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { formatCurrency, cn } from '@/lib/utils/format'

export default function TradeDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const { data: trades, isLoading } = useTrades()
  const updateTrade = useUpdateTrade()
  const deleteTrade = useDeleteTrade()
  const [editing, setEditing] = useState(false)

  const trade = trades?.find((t) => t.id === id)

  if (isLoading) {
    return (
      <JournalGate>
        <div className="flex items-center justify-center py-20">กำลังโหลด...</div>
      </JournalGate>
    )
  }

  if (!trade) {
    return (
      <JournalGate>
        <div className="text-center py-20">
          <p className="text-brand-text-secondary">ไม่พบรายการ</p>
          <Button variant="secondary" className="mt-4" onClick={() => router.push('/journal')}>
            กลับไป Journal
          </Button>
        </div>
      </JournalGate>
    )
  }

  async function handleDelete() {
    if (!trade) return
    if (!confirm('ต้องการลบรายการนี้? การกระทำนี้ไม่สามารถย้อนกลับได้')) return
    await deleteTrade.mutateAsync(trade.id)
    router.push('/journal')
  }

  return (
    <JournalGate>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/journal')}
              className="p-2 rounded-lg bg-brand-card border border-brand-border hover:bg-brand-bg-secondary transition-colors"
            >
              <ArrowLeft size={18} className="text-brand-text-secondary" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-brand-text-primary flex items-center gap-2">
                {trade.symbol}
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded-full',
                  trade.direction === 'long' ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-danger/10 text-brand-danger'
                )}>
                  {trade.direction === 'long' ? <TrendingUp size={12} className="inline mr-1" /> : <TrendingDown size={12} className="inline mr-1" />}
                  {trade.direction === 'long' ? 'Long' : 'Short'}
                </span>
              </h1>
              <p className="text-xs text-brand-text-secondary">{trade.market} · {new Date(trade.opened_at).toLocaleDateString('th-TH')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-1 text-brand-danger" onClick={handleDelete}>
              <Trash2 size={14} />
              ลบ
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="p-4">
            <p className="text-xs text-brand-text-secondary">ราคาเข้า</p>
            <p className="text-lg font-bold text-brand-text-primary font-mono-nums">{formatCurrency(trade.entry_price)}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-brand-text-secondary">ราคาออก</p>
            <p className="text-lg font-bold text-brand-text-primary font-mono-nums">{trade.exit_price ? formatCurrency(trade.exit_price) : '-'}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-brand-text-secondary">P&L</p>
            <p className={cn('text-lg font-bold font-mono-nums', (trade.pnl ?? 0) >= 0 ? 'text-brand-success' : 'text-brand-danger')}>
              {trade.pnl !== undefined && trade.pnl !== null ? `${trade.pnl >= 0 ? '+' : ''}${formatCurrency(trade.pnl)}` : '-'}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-brand-text-secondary">R-Multiple</p>
            <p className={cn('text-lg font-bold font-mono-nums', (trade.r_multiple ?? 0) >= 0 ? 'text-brand-success' : 'text-brand-danger')}>
              {trade.r_multiple !== undefined && trade.r_multiple !== null ? `${trade.r_multiple >= 0 ? '+' : ''}${trade.r_multiple.toFixed(2)}R` : '-'}
            </p>
          </Card>
        </div>

        {/* Details */}
        <Card className="p-4 space-y-4">
          <h2 className="text-sm font-semibold text-brand-text-primary">รายละเอียดการเทรด</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-brand-text-secondary">จำนวน</p>
              <p className="text-sm font-medium text-brand-text-primary">{trade.quantity}</p>
            </div>
            <div>
              <p className="text-xs text-brand-text-secondary">ค่าธรรมเนียม</p>
              <p className="text-sm font-medium text-brand-text-primary">{formatCurrency(trade.fees)}</p>
            </div>
            <div>
              <p className="text-xs text-brand-text-secondary">Stop Loss</p>
              <p className="text-sm font-medium text-brand-text-primary">{trade.stop_loss ? formatCurrency(trade.stop_loss) : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-brand-text-secondary">Take Profit</p>
              <p className="text-sm font-medium text-brand-text-primary">{trade.take_profit ? formatCurrency(trade.take_profit) : '-'}</p>
            </div>
            <div>
              <p className="text-xs text-brand-text-secondary">เปิด</p>
              <p className="text-sm font-medium text-brand-text-primary">{new Date(trade.opened_at).toLocaleString('th-TH')}</p>
            </div>
            <div>
              <p className="text-xs text-brand-text-secondary">ปิด</p>
              <p className="text-sm font-medium text-brand-text-primary">{trade.closed_at ? new Date(trade.closed_at).toLocaleString('th-TH') : '-'}</p>
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card className="p-4 space-y-4">
          <h2 className="text-sm font-semibold text-brand-text-primary">บันทึกและทบทวน</h2>
          {trade.setup && (
            <div>
              <p className="text-xs text-brand-text-secondary mb-1">Setup</p>
              <p className="text-sm text-brand-text-primary">{trade.setup}</p>
            </div>
          )}
          {trade.reason && (
            <div>
              <p className="text-xs text-brand-text-secondary mb-1">เหตุผล</p>
              <p className="text-sm text-brand-text-primary">{trade.reason}</p>
            </div>
          )}
          {trade.emotion && (
            <div>
              <p className="text-xs text-brand-text-secondary mb-1">อารมณ์</p>
              <p className="text-sm text-brand-text-primary">{trade.emotion}</p>
            </div>
          )}
          {trade.mistake_tags && trade.mistake_tags.length > 0 && (
            <div>
              <p className="text-xs text-brand-text-secondary mb-1">แท็กความผิดพลาด</p>
              <div className="flex flex-wrap gap-1.5">
                {trade.mistake_tags.map((tag) => (
                  <Badge key={tag} variant="danger" size="sm">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
          {trade.result_note && (
            <div>
              <p className="text-xs text-brand-text-secondary mb-1">สรุปผล</p>
              <p className="text-sm text-brand-text-primary">{trade.result_note}</p>
            </div>
          )}
        </Card>

        <div className="flex items-start gap-2 p-3 bg-brand-warning/5 border border-brand-warning/20 rounded-lg">
          <AlertTriangle size={16} className="text-brand-warning shrink-0 mt-0.5" />
          <p className="text-xs text-brand-text-secondary leading-relaxed">
            ข้อมูลนี้ใช้เพื่อการทบทวนตนเองและวิเคราะห์พฤติกรรมการเทรดเท่านั้น ไม่ใช่คำแนะนำการลงทุน
          </p>
        </div>
      </div>
    </JournalGate>
  )
}
