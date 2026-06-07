'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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
  Lock,
} from 'lucide-react'
import { useQuote } from '@/lib/hooks/use-stock'
import { useAlerts } from '@/lib/hooks/use-alerts'
import { formatCurrency, cn } from '@/lib/utils/format'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import AuthModal from '@/components/auth/AuthModal'

const FOREIGN_SYMBOLS = new Set(['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'AMZN', 'META', 'AMD', 'JPM', 'BABA'])

function normalizeSymbol(symbol: string) {
  const upper = symbol.trim().toUpperCase()
  if (!upper) return ''
  if (upper.includes('.')) return upper
  return FOREIGN_SYMBOLS.has(upper) ? upper : `${upper}.BK`
}

function AlertChecker({ alerts, onTrigger }: { alerts: { symbol: string; triggered: boolean; targetPrice: number; condition: 'above' | 'below' }[]; onTrigger: (symbol: string) => void }) {
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
            onTrigger(sym)
          }
        }
      }
    }
  }

  return null
}

function AlertItem({ alert, onRemove }: { alert: { id: string; symbol: string; targetPrice: number; condition: 'above' | 'below'; triggered: boolean; triggeredAt?: string }; onRemove: () => void }) {
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
            <p className="text-xs font-mono-nums text-brand-text-secondary">
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
  const { alerts, isLoading, isAuthenticated, addAlert, removeAlert, clearTriggered } = useAlerts()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Form state
  const [formSymbol, setFormSymbol] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formCondition, setFormCondition] = useState<'above' | 'below'>('above')
  const [formError, setFormError] = useState('')

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleTrigger = useCallback((symbol: string) => {
    // Visual trigger only; cron job handles backend trigger
    console.log(`Alert triggered for ${symbol}`)
  }, [])

  const handleRemove = useCallback(async (id: string) => {
    try {
      await removeAlert(id)
    } catch (err) {
      console.error('Failed to remove alert:', err)
    }
  }, [removeAlert])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    const symbol = normalizeSymbol(formSymbol)
    const targetPrice = parseFloat(formPrice)

    if (!symbol) { setFormError('กรุณาใส่ชื่อหุ้น'); return }
    if (isNaN(targetPrice) || targetPrice <= 0) { setFormError('กรุณาใส่ราคาที่ถูกต้อง'); return }

    try {
      await addAlert(symbol, targetPrice, formCondition)
      setFormSymbol('')
      setFormPrice('')
    } catch (err) {
      setFormError('ไม่สามารถเพิ่มแจ้งเตือนได้ กรุณาลองใหม่')
    }
  }

  if (!mounted) return null

  const activeAlerts = alerts.filter(a => !a.triggered)
  const triggeredAlerts = alerts.filter(a => a.triggered)

  return (
    <div className="space-y-6">
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <AlertChecker alerts={alerts} onTrigger={handleTrigger} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-danger/10 rounded-lg flex items-center justify-center">
            <Bell size={20} className="text-brand-danger" />
          </div>
          <div>
            <h1 className="heading-balance text-2xl font-bold text-brand-text-primary">แจ้งเตือนราคา</h1>
            <p className="text-sm text-brand-text-secondary">
              {isAuthenticated
                ? 'ตั้งแจ้งเตือนเมื่อราคาหุ้นถึงระดับที่ต้องการ'
                : 'เข้าสู่ระบบเพื่อบันทึกแจ้งเตือนบนคลาวด์ (ขณะนี้ใช้ local อยู่)'}
            </p>
          </div>
        </div>
        {!isAuthenticated && (
          <button
            type="button"
            onClick={() => setAuthModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand-primary/30 bg-brand-primary/10 px-3 py-1.5 text-xs text-brand-primary transition-colors hover:bg-brand-primary/20"
          >
            <Lock size={13} />
            เข้าสู่ระบบ
          </button>
        )}
      </div>

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
          <div className="w-full sm:w-36">
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
                'flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5',
                formCondition === 'above'
                  ? 'bg-brand-success/10 text-brand-success border border-brand-success/30'
                  : 'bg-brand-bg-secondary text-brand-text-secondary border border-brand-border'
              )}
            >
              <ArrowUp size={14} />
              ขึ้นถึง
            </button>
            <button
              type="button"
              onClick={() => setFormCondition('below')}
              className={cn(
                'flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5',
                formCondition === 'below'
                  ? 'bg-brand-danger/10 text-brand-danger border border-brand-danger/30'
                  : 'bg-brand-bg-secondary text-brand-text-secondary border border-brand-border'
              )}
            >
              <ArrowDown size={14} />
              ลงถึง
            </button>
          </div>
          <Button type="submit" className="sm:w-auto" isLoading={isLoading}>
            <Plus size={16} />
            เพิ่ม
          </Button>
        </form>
        {formError && (
          <p className="mt-2 text-xs text-brand-danger">{formError}</p>
        )}
      </Card>

      {/* Triggered Alerts */}
      {triggeredAlerts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-brand-warning" />
              <h2 className="text-sm font-semibold text-brand-text-primary">
                แจ้งเตือนที่แตะเป้าแล้ว ({triggeredAlerts.length})
              </h2>
            </div>
            <button
              onClick={() => clearTriggered()}
              className="text-xs text-brand-text-secondary hover:text-brand-danger flex items-center gap-1 transition-colors"
            >
              <X size={14} />
              ลบทั้งหมด
            </button>
          </div>
          {triggeredAlerts.map((alert) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onRemove={() => handleRemove(alert.id)}
            />
          ))}
        </div>
      )}

      {/* Active Alerts */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className="text-brand-success" />
          <h2 className="text-sm font-semibold text-brand-text-primary">
            แจ้งเตือนที่รออยู่ ({activeAlerts.length})
          </h2>
        </div>

        {isLoading ? (
          <Card>
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-brand-text-secondary">กำลังโหลด...</p>
            </div>
          </Card>
        ) : activeAlerts.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-12 h-12 bg-brand-bg-secondary rounded-full flex items-center justify-center">
                <Bell size={20} className="text-brand-text-muted" />
              </div>
              <div className="text-center">
                <p className="text-brand-text-primary font-medium text-sm">ยังไม่มีแจ้งเตือน</p>
                <p className="text-xs text-brand-text-secondary mt-1">
                  ตั้งแจ้งเตือนราคาหุ้นด้วยฟอร์มด้านบน
                </p>
              </div>
            </div>
          </Card>
        ) : (
          activeAlerts.map((alert) => (
            <AlertItem
              key={alert.id}
              alert={alert}
              onRemove={() => handleRemove(alert.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
