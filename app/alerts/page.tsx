'use client'

import { useState, useCallback, useRef } from 'react'
import {
  Bell,
  Plus,
  Trash2,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  BellRing,
  CheckCircle,
  X,
  Cloud,
  HardDrive,
} from 'lucide-react'
import { useQuote } from '@/lib/hooks/use-stock'
import { useAlerts, type PriceAlert } from '@/lib/hooks/use-alerts'
import { formatCurrency, cn } from '@/lib/utils/format'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'

const FOREIGN_SYMBOLS = new Set(['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'AMZN', 'META', 'AMD', 'JPM', 'BABA'])

function normalizeSymbol(symbol: string) {
  const upper = symbol.trim().toUpperCase()
  if (!upper) return ''
  if (upper.includes('.')) return upper
  return FOREIGN_SYMBOLS.has(upper) ? upper : `${upper}.BK`
}

function AlertChecker({ alerts, onTrigger }: { alerts: PriceAlert[]; onTrigger: (id: string) => void }) {
  const symbols = [...new Set(alerts.filter(a => !a.triggered).map(a => a.symbol))]
  const prevPrices = useRef<Record<string, number>>({})

  // Poll each symbol
  for (const sym of symbols) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { data: quote } = useQuote(sym)
    if (quote) {
      const prev = prevPrices.current[sym]
      if (prev !== quote.price) {
        prevPrices.current[sym] = quote.price
        // Check all alerts for this symbol
        for (const alert of alerts) {
          if (alert.symbol !== sym || alert.triggered) continue
          if (
            (alert.condition === 'above' && quote.price >= alert.targetPrice) ||
            (alert.condition === 'below' && quote.price <= alert.targetPrice)
          ) {
            onTrigger(alert.id)
          }
        }
      }
    }
  }

  return null
}

function AlertItem({ alert, onRemove }: { alert: PriceAlert; onRemove: () => void }) {
  const { data: quote, isLoading } = useQuote(alert.symbol)
  const displaySym = alert.symbol.replace('.BK', '')
  const currentPrice = quote?.price ?? 0
  const currency = quote?.currency ?? (alert.symbol.endsWith('.BK') ? 'THB' : 'USD')
  const isAbove = alert.condition === 'above'
  const diff = isAbove
    ? alert.targetPrice - currentPrice
    : currentPrice - alert.targetPrice
  const diffPct = currentPrice > 0 ? (diff / currentPrice) * 100 : 0

  return (
    <div className={cn(
      'flex items-center justify-between p-4 rounded-xl border transition-all group',
      alert.triggered
        ? 'bg-brand-warning/5 border-brand-warning/30'
        : 'bg-brand-card border-brand-border hover:border-brand-primary/30'
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center',
          alert.triggered ? 'bg-brand-warning/10' : isAbove ? 'bg-brand-success/10' : 'bg-brand-danger/10'
        )}>
          {alert.triggered ? (
            <BellRing size={18} className="text-brand-warning" />
          ) : isAbove ? (
            <ArrowUp size={18} className="text-brand-success" />
          ) : (
            <ArrowDown size={18} className="text-brand-danger" />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-brand-text-primary">{displaySym}</p>
            {alert.triggered && (
              <Badge variant="warning" size="sm">แจ้งเตือนแล้ว!</Badge>
            )}
          </div>
          <p className="text-xs text-brand-text-secondary">
            {isAbove ? 'แจ้งเตือนเมื่อราคาขึ้นถึง' : 'แจ้งเตือนเมื่อราคาลงถึง'}{' '}
            <span className="font-semibold text-brand-text-primary">{formatCurrency(alert.targetPrice, currency)}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <p className="text-xs text-brand-text-secondary">ราคาปัจจุบัน</p>
          <p className="text-sm font-mono-nums font-semibold text-brand-text-primary">
            {isLoading ? '...' : formatCurrency(currentPrice, currency)}
          </p>
          {!isLoading && currentPrice > 0 && !alert.triggered && (
            <p className={cn('text-xs font-mono-nums', diffPct > 0 ? 'text-brand-text-secondary' : 'text-brand-text-secondary')}>
              {isAbove ? 'เหลืออีก' : 'เหลืออีก'} {formatCurrency(Math.abs(diff), currency)} ({diffPct.toFixed(1)}%)
            </p>
          )}
        </div>

        <button
          onClick={onRemove}
          className="p-2 text-brand-text-secondary hover:text-brand-danger rounded-lg hover:bg-brand-danger/10 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

export default function AlertsPage() {
  const { alerts, addAlert, removeAlert, triggerAlert, clearTriggered, loading, isCloud } = useAlerts()

  // Form state
  const [formSymbol, setFormSymbol] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formCondition, setFormCondition] = useState<'above' | 'below'>('above')
  const [formError, setFormError] = useState('')

  const handleTrigger = useCallback((id: string) => {
    void triggerAlert(id)
  }, [triggerAlert])

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    const symbol = normalizeSymbol(formSymbol)
    const targetPrice = parseFloat(formPrice)

    if (!symbol) { setFormError('กรุณาใส่ชื่อหุ้น'); return }
    if (isNaN(targetPrice) || targetPrice <= 0) { setFormError('กรุณาใส่ราคาที่ถูกต้อง'); return }

    void addAlert(symbol, targetPrice, formCondition)

    setFormSymbol('')
    setFormPrice('')
  }

  if (loading) return null

  const activeAlerts = alerts.filter(a => !a.triggered)
  const triggeredAlerts = alerts.filter(a => a.triggered)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-danger/10 rounded-lg flex items-center justify-center">
            <Bell size={20} className="text-brand-danger" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="heading-balance text-2xl font-bold text-brand-text-primary">แจ้งเตือนราคา</h1>
              <Badge variant={isCloud ? 'info' : 'outline'} size="sm" className="gap-1">
                {isCloud ? <Cloud size={12} /> : <HardDrive size={12} />}
                {isCloud ? 'ซิงค์คลาวด์' : 'บันทึกในเครื่อง'}
              </Badge>
            </div>
            <p className="text-sm text-brand-text-secondary">
              ตั้งแจ้งเตือนเมื่อราคาหุ้นถึงระดับที่ต้องการ {activeAlerts.length > 0 && `(${activeAlerts.length} รายการ)`}
            </p>
          </div>
        </div>
        {triggeredAlerts.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearTriggered}>
            <X size={14} />
            ล้างที่แจ้งแล้ว
          </Button>
        )}
      </div>

      {/* Hidden alert checker - polls prices in background */}
      {alerts.length > 0 && (
        <AlertChecker alerts={alerts} onTrigger={handleTrigger} />
      )}

      {/* Add Alert Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Plus size={18} className="text-brand-primary" />
            ตั้งแจ้งเตือนใหม่
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="ชื่อหุ้น (เช่น PTT, AAPL)"
              value={formSymbol}
              onChange={(e) => setFormSymbol(e.target.value)}
              icon={<Bell size={16} />}
            />
          </div>
          <div className="w-full sm:w-40">
            <Input
              type="number"
              placeholder="ราคาเป้าหมาย"
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
              min="0.01"
              step="0.01"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormCondition('above')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all',
                formCondition === 'above'
                  ? 'bg-brand-success/10 border-brand-success/30 text-brand-success'
                  : 'bg-brand-card border-brand-border text-brand-text-secondary hover:text-brand-text-primary'
              )}
            >
              <ArrowUp size={14} />
              ขึ้นถึง
            </button>
            <button
              type="button"
              onClick={() => setFormCondition('below')}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all',
                formCondition === 'below'
                  ? 'bg-brand-danger/10 border-brand-danger/30 text-brand-danger'
                  : 'bg-brand-card border-brand-border text-brand-text-secondary hover:text-brand-text-primary'
              )}
            >
              <ArrowDown size={14} />
              ลงถึง
            </button>
          </div>
          <Button type="submit" className="sm:w-auto">
            <Plus size={16} />
            ตั้งแจ้งเตือน
          </Button>
        </form>
        {formError && (
          <p className="mt-2 text-xs text-brand-danger">{formError}</p>
        )}
      </Card>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-brand-text-secondary flex items-center gap-2">
            <Bell size={14} className="text-brand-primary" />
            แจ้งเตือนที่กำลังทำงาน ({activeAlerts.length})
          </h2>
          {activeAlerts.map(alert => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onRemove={() => removeAlert(alert.id)}
            />
          ))}
        </div>
      )}

      {/* Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-brand-text-secondary flex items-center gap-2">
            <CheckCircle size={14} className="text-brand-warning" />
            แจ้งเตือนที่ทำงานแล้ว ({triggeredAlerts.length})
          </h2>
          {triggeredAlerts.map(alert => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onRemove={() => removeAlert(alert.id)}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {alerts.length === 0 && (
        <Card>
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 bg-brand-danger/10 rounded-full flex items-center justify-center">
              <Bell size={28} className="text-brand-danger" />
            </div>
            <div className="text-center">
              <p className="text-brand-text-primary font-medium mb-1">ยังไม่มีการแจ้งเตือน</p>
              <p className="text-sm text-brand-text-secondary">
                ตั้งแจ้งเตือนเพื่อไม่พลาดจังหวะสำคัญในการซื้อขาย
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Info */}
      <Card className="border-brand-warning/20 bg-brand-warning/5">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-brand-warning mt-0.5 flex-shrink-0" />
          <div className="text-sm text-brand-text-secondary">
            <p className="font-medium text-brand-text-primary mb-1">หมายเหตุ</p>
            <p>การแจ้งเตือนจะทำงานเมื่อหน้าเว็บเปิดอยู่และมีการอัพเดทราคาทุก 30 วินาที {isCloud ? 'ข้อมูลถูกบันทึกในบัญชีของคุณ (ซิงค์ข้ามอุปกรณ์)' : 'ข้อมูลจะถูกบันทึกในเบราว์เซอร์ของคุณ — เข้าสู่ระบบเพื่อซิงค์ข้ามอุปกรณ์'}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
