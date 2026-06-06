'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, ArrowLeft, AlertTriangle } from 'lucide-react'
import { useCreateTrade, usePortfolios } from '@/lib/hooks/use-journal'
import { useSubscription } from '@/lib/hooks/use-subscription'
import JournalGate from '@/components/journal/JournalGate'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { cn } from '@/lib/utils/format'

const MISTAKE_OPTIONS = [
  'FOMO',
  'Revenge Trade',
  'Over-risk',
  'Early Exit',
  'No Checklist',
  'News Trade',
  'Chasing Price',
  'Ignoring Stop Loss',
  'Overtrading',
]

export default function NewTradePage() {
  const router = useRouter()
  const createTrade = useCreateTrade()
  const { data: portfolios } = usePortfolios()
  const { journalLimit } = useSubscription()

  const [portfolioId, setPortfolioId] = useState(portfolios?.[0]?.id ?? '')
  const [symbol, setSymbol] = useState('')
  const [market, setMarket] = useState('SET')
  const [direction, setDirection] = useState<'long' | 'short'>('long')
  const [entryPrice, setEntryPrice] = useState('')
  const [exitPrice, setExitPrice] = useState('')
  const [stopLoss, setStopLoss] = useState('')
  const [takeProfit, setTakeProfit] = useState('')
  const [quantity, setQuantity] = useState('')
  const [fees, setFees] = useState('')
  const [openedAt, setOpenedAt] = useState(new Date().toISOString().slice(0, 16))
  const [closedAt, setClosedAt] = useState('')
  const [setup, setSetup] = useState('')
  const [reason, setReason] = useState('')
  const [emotion, setEmotion] = useState('')
  const [mistakeTags, setMistakeTags] = useState<string[]>([])
  const [resultNote, setResultNote] = useState('')
  const [status, setStatus] = useState<'open' | 'closed'>('open')

  useEffect(() => {
    if (!portfolioId && portfolios?.[0]?.id) {
      setPortfolioId(portfolios[0].id)
    }
  }, [portfolioId, portfolios])

  function toggleMistake(tag: string) {
    setMistakeTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await createTrade.mutateAsync({
      portfolio_id: portfolioId,
      symbol: symbol.toUpperCase(),
      market,
      direction,
      entry_price: parseFloat(entryPrice),
      exit_price: exitPrice ? parseFloat(exitPrice) : undefined,
      stop_loss: stopLoss ? parseFloat(stopLoss) : undefined,
      take_profit: takeProfit ? parseFloat(takeProfit) : undefined,
      quantity: parseFloat(quantity),
      fees: fees ? parseFloat(fees) : 0,
      opened_at: new Date(openedAt).toISOString(),
      closed_at: closedAt ? new Date(closedAt).toISOString() : undefined,
      setup,
      reason,
      emotion,
      mistake_tags: mistakeTags,
      result_note: resultNote,
      status,
      pnl: undefined,
      r_multiple: undefined,
    })
    router.push('/journal')
  }

  return (
    <JournalGate>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-brand-card border border-brand-border hover:bg-brand-bg-secondary transition-colors"
          >
            <ArrowLeft size={18} className="text-brand-text-secondary" />
          </button>
          <div>
            <h1 className="heading-balance text-xl font-bold text-brand-text-primary flex items-center gap-2">
              <BookOpen size={22} className="text-brand-primary" />
              บันทึกการเทรดใหม่
            </h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic Info */}
          <Card className="p-4 space-y-4">
            <h2 className="text-sm font-semibold text-brand-text-primary">ข้อมูลพื้นฐาน</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-brand-text-secondary mb-1">พอร์ต</label>
                <select
                  value={portfolioId}
                  onChange={(e) => setPortfolioId(e.target.value)}
                  className="w-full bg-brand-bg-secondary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                  required
                >
                  {portfolios?.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.type})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-brand-text-secondary mb-1">สัญลักษณ์</label>
                <Input
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="เช่น PTT, AAPL"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-brand-text-secondary mb-1">ตลาด</label>
                <select
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                  className="w-full bg-brand-bg-secondary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                >
                  <option value="SET">SET (Thailand)</option>
                  <option value="NASDAQ">NASDAQ</option>
                  <option value="NYSE">NYSE</option>
                  <option value="CRYPTO">Crypto</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-brand-text-secondary mb-1">ทิศทาง</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDirection('long')}
                    className={cn(
                      'flex-1 py-2 text-sm rounded-lg border transition-colors',
                      direction === 'long'
                        ? 'bg-brand-success/10 border-brand-success text-brand-success'
                        : 'bg-brand-bg-secondary border-brand-border text-brand-text-secondary'
                    )}
                  >
                    Long
                  </button>
                  <button
                    type="button"
                    onClick={() => setDirection('short')}
                    className={cn(
                      'flex-1 py-2 text-sm rounded-lg border transition-colors',
                      direction === 'short'
                        ? 'bg-brand-danger/10 border-brand-danger text-brand-danger'
                        : 'bg-brand-bg-secondary border-brand-border text-brand-text-secondary'
                    )}
                  >
                    Short
                  </button>
                </div>
              </div>
            </div>
          </Card>

          {/* Prices */}
          <Card className="p-4 space-y-4">
            <h2 className="text-sm font-semibold text-brand-text-primary">ราคาและปริมาณ</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-brand-text-secondary mb-1">ราคาเข้า *</label>
                <Input type="number" step="0.01" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs text-brand-text-secondary mb-1">ราคาออก</label>
                <Input type="number" step="0.01" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-brand-text-secondary mb-1">Stop Loss</label>
                <Input type="number" step="0.01" value={stopLoss} onChange={(e) => setStopLoss(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-brand-text-secondary mb-1">Take Profit</label>
                <Input type="number" step="0.01" value={takeProfit} onChange={(e) => setTakeProfit(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-brand-text-secondary mb-1">จำนวน *</label>
                <Input type="number" step="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs text-brand-text-secondary mb-1">ค่าธรรมเนียม</label>
                <Input type="number" step="0.01" value={fees} onChange={(e) => setFees(e.target.value)} placeholder="0" />
              </div>
            </div>
          </Card>

          {/* Dates */}
          <Card className="p-4 space-y-4">
            <h2 className="text-sm font-semibold text-brand-text-primary">วันที่และสถานะ</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-brand-text-secondary mb-1">เปิด *</label>
                <Input type="datetime-local" value={openedAt} onChange={(e) => setOpenedAt(e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs text-brand-text-secondary mb-1">ปิด</label>
                <Input type="datetime-local" value={closedAt} onChange={(e) => setClosedAt(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs text-brand-text-secondary mb-1">สถานะ</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'open' | 'closed')}
                  className="w-full bg-brand-bg-secondary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text-primary outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20"
                >
                  <option value="open">Open (ค้าง)</option>
                  <option value="closed">Closed (ปิด)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Notes */}
          <Card className="p-4 space-y-4">
            <h2 className="text-sm font-semibold text-brand-text-primary">บันทึกและวิเคราะห์</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-brand-text-secondary mb-1">Setup / รูปแบบ</label>
                <Input value={setup} onChange={(e) => setSetup(e.target.value)} placeholder="เช่น Breakout, Pullback, Gap..." />
              </div>
              <div>
                <label className="block text-xs text-brand-text-secondary mb-1">เหตุผลในการเข้า</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  className="w-full bg-brand-bg-secondary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text-primary placeholder-brand-text-secondary outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 resize-none"
                  placeholder="ทำไมถึงตัดสินใจเข้าเทรดรายการนี้?"
                />
              </div>
              <div>
                <label className="block text-xs text-brand-text-secondary mb-1">อารมณ์ / สภาพจิตใจ</label>
                <Input value={emotion} onChange={(e) => setEmotion(e.target.value)} placeholder="เช่น มั่นใจ, กลัว, โมโห, ใจเย็น" />
              </div>
              <div>
                <label className="block text-xs text-brand-text-secondary mb-1">แท็กความผิดพลาด</label>
                <div className="flex flex-wrap gap-2">
                  {MISTAKE_OPTIONS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleMistake(tag)}
                      className={cn(
                        'px-2.5 py-1 text-xs rounded-full border transition-colors',
                        mistakeTags.includes(tag)
                          ? 'bg-brand-danger/10 border-brand-danger text-brand-danger'
                          : 'bg-brand-bg-secondary border-brand-border text-brand-text-secondary hover:text-brand-text-primary'
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-brand-text-secondary mb-1">บันทึกผล / สรุป</label>
                <textarea
                  value={resultNote}
                  onChange={(e) => setResultNote(e.target.value)}
                  rows={2}
                  className="w-full bg-brand-bg-secondary border border-brand-border rounded-lg px-3 py-2 text-sm text-brand-text-primary placeholder-brand-text-secondary outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 resize-none"
                  placeholder="สรุปบทเรียนจากรายการนี้"
                />
              </div>
            </div>
          </Card>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 p-3 bg-brand-warning/5 border border-brand-warning/20 rounded-lg">
            <AlertTriangle size={16} className="text-brand-warning shrink-0 mt-0.5" />
            <p className="text-xs text-brand-text-secondary leading-relaxed">
              ข้อมูลนี้ใช้เพื่อการทบทวนตนเองและวิเคราะห์พฤติกรรมการเทรดเท่านั้น ไม่ใช่คำแนะนำการลงทุน
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" isLoading={createTrade.isPending} disabled={!portfolioId}>
              บันทึก
            </Button>
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              ยกเลิก
            </Button>
          </div>
        </form>
      </div>
    </JournalGate>
  )
}
