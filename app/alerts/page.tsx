'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useQueries } from '@tanstack/react-query'
import type { StockQuote } from '@/types/stock'
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
import Badge from '@/components/ui/Badge'
import AuthModal from '@/components/auth/AuthModal'
import { formatCurrency, cn } from '@/lib/utils/format'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { useAlerts } from '@/lib/hooks/use-alerts'
import { useQuote } from '@/lib/hooks/use-stock'
import type { AlertChannel, AlertType, PushSubscription } from '@/lib/alerts/types'

const FOREIGN_SYMBOLS = new Set(['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'AMZN', 'META', 'AMD', 'JPM', 'BABA'])

function normalizeSymbol(symbol: string) {
  const upper = symbol.trim().toUpperCase()
  if (!upper) return ''
  if (upper.includes('.')) return upper
  return FOREIGN_SYMBOLS.has(upper) ? upper : `${upper}.BK`
}

function getAlertTypeLabel(type: AlertType) {
  switch (type) {
    case 'percent_change':
      return 'เปลี่ยนแปลง %'
    case 'volume_spike':
      return 'Volume spike'
    default:
      return 'ราคา'
  }
}

function getAlertTypePlaceholder(type: AlertType) {
  switch (type) {
    case 'percent_change':
      return 'เปอร์เซ็นต์ เช่น 3'
    case 'volume_spike':
      return 'ปริมาณหุ้น เช่น 1000000'
    default:
      return 'ราคาเป้าหมาย'
  }
}

function toggleAlertChannel(channels: AlertChannel[], channel: AlertChannel) {
  return channels.includes(channel) ? channels.filter((item) => item !== channel) : [...channels, channel]
}

function getPushMessageClass(message: string) {
  const lower = message.toLowerCase()
  if (lower.includes('ไม่ได้') || lower.includes('ต้อง') || lower.includes('ยังไม่ได้') || lower.includes('ไม่ถูกต้อง')) return 'text-brand-warning'
  return 'text-brand-success'
}

function AlertChecker({ alerts, onTrigger }: { alerts: { symbol: string; type: AlertType; triggered: boolean; targetPrice: number; condition: 'above' | 'below' }[]; onTrigger: (symbol: string) => void }) {
  const prevPrices = useRef<Record<string, number>>({})
  const activeSymbols = useMemo(
    () => [...new Set(alerts.filter((alert) => !alert.triggered).map((alert) => alert.symbol))],
    [alerts]
  )

  const quoteResults = useQueries({
    queries: activeSymbols.map((symbol) => ({
      queryKey: ['quote', symbol] as const,
      queryFn: async (): Promise<{ data: StockQuote; meta?: unknown }> => {
        const res = await fetch(`/api/stock/quote?symbol=${encodeURIComponent(symbol)}`)
        const json = await res.json()
        if (!json.success) throw new Error(json.error || 'API request failed')
        return json.data as { data: StockQuote; meta?: unknown }
      },
      enabled: activeSymbols.length > 0,
      refetchInterval: 30_000,
      staleTime: 15_000,
    })),
  })

  useEffect(() => {
    const quoteBySymbol = activeSymbols.reduce<Record<string, StockQuote | undefined>>((acc, symbol, index) => {
      acc[symbol] = quoteResults[index]?.data?.data
      return acc
    }, {})

    activeSymbols.forEach((symbol) => {
      const quote = quoteBySymbol[symbol]
      if (!quote) return

      const prev = prevPrices.current[symbol]
      if (prev === quote.price) return
      prevPrices.current[symbol] = quote.price

      alerts.forEach((alert) => {
        if (alert.symbol !== symbol || alert.triggered) return
        const currentValue = alert.type === 'percent_change' ? quote.changePercent : alert.type === 'volume_spike' ? quote.volume : quote.price
        if (
          (alert.condition === 'above' && currentValue >= alert.targetPrice) ||
          (alert.condition === 'below' && currentValue <= alert.targetPrice)
        ) {
          onTrigger(symbol)
        }
      })
    })
  }, [activeSymbols, quoteResults, alerts, onTrigger])

  return null
}

function AlertItem({ alert, onRemove }: { alert: { id: string; symbol: string; type: AlertType; targetPrice: number; condition: 'above' | 'below'; triggered: boolean; triggeredAt?: string; notificationChannels: AlertChannel[] }; onRemove: () => void }) {
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
            {isAbove ? 'แจ้งเตือนเมื่อ' : 'แจ้งเตือนเมื่อ'} {getAlertTypeLabel(alert.type).toLowerCase()} {isAbove ? 'ขึ้นถึง' : 'ลงถึง'}{' '}
            <span className="font-semibold text-brand-text-primary">{formatCurrency(alert.targetPrice, currency)}</span>
          </p>
          <div className="mt-1 flex items-center gap-1">
            {alert.notificationChannels.map((channel) => (
              <Badge key={channel} variant="info" size="sm">
                {channel === 'push' ? 'Push' : 'Email'}
              </Badge>
            ))}
          </div>
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
  const { alerts, isLoading, isAuthenticated, addAlert, removeAlert, clearTriggered, registerPushSubscription, unregisterPushSubscription } = useAlerts()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Form state
  const [formSymbol, setFormSymbol] = useState('')
  const [formPrice, setFormPrice] = useState('')
  const [formType, setFormType] = useState<AlertType>('price')
  const [formCondition, setFormCondition] = useState<'above' | 'below'>('above')
  const [formChannels, setFormChannels] = useState<AlertChannel[]>(['email'])
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushMessage, setPushMessage] = useState('')
  const [formError, setFormError] = useState('')
  const pushSupported = mounted && 'serviceWorker' in navigator && 'PushManager' in window
  const canUsePush = isAuthenticated && pushSupported

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

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    for (let i = 0; i < rawData.length; i += 1) outputArray[i] = rawData.charCodeAt(i)
    return outputArray
  }

  const handlePushToggle = useCallback(async () => {
    if (!isAuthenticated) {
      setAuthModalOpen(true)
      return
    }

    if (!pushSupported) {
      setPushMessage('เบราว์เซอร์นี้ไม่รองรับ Web Push')
      return
    }

    try {
      const keyRes = await fetch('/api/alerts/push/public-key')
      const keyData = await keyRes.json().catch(() => ({}))
      const publicKey = keyData.data?.publicKey

      if (!keyData.data?.configured) {
        setPushMessage('ยังไม่ได้ตั้งค่า VAPID keys')
        return
      }

      if (!publicKey) {
        setPushMessage('VAPID public key ไม่ถูกต้อง')
        return
      }

      if (pushEnabled) {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          const payload = subscription.toJSON() as PushSubscription
          if (!payload.endpoint || !payload.keys?.p256dh || !payload.keys.auth) throw new Error('Push subscription keys are missing')
          await unregisterPushSubscription(payload)
          await subscription.unsubscribe()
        }
        setPushEnabled(false)
        setPushMessage('ปิด push notification แล้ว')
        return
      }

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setPushMessage('ต้องอนุญาตการแจ้งเตือนในเบราว์เซอร์ก่อน')
        return
      }

      const registration = await navigator.serviceWorker.register('/service-worker.js')
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
      const payload = subscription.toJSON() as PushSubscription
      if (!payload.endpoint || !payload.keys?.p256dh || !payload.keys.auth) throw new Error('Push subscription keys are missing')

      await registerPushSubscription(payload)
      setPushEnabled(true)
      setPushMessage('เปิด push notification แล้ว')
    } catch (err) {
      console.error('Failed to toggle push:', err)
      setPushMessage('ไม่สามารถเปิด push notification ได้')
    }
  }, [isAuthenticated, pushSupported, pushEnabled, registerPushSubscription, unregisterPushSubscription])

  useEffect(() => {
    if (!canUsePush) return
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => setPushEnabled(!!subscription))
      .catch(() => undefined)
  }, [canUsePush])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setFormError('')

    const symbol = normalizeSymbol(formSymbol)
    const targetPrice = parseFloat(formPrice)

    if (!symbol) { setFormError('กรุณาใส่ชื่อหุ้น'); return }
    if (isNaN(targetPrice) || targetPrice <= 0) { setFormError('กรุณาใส่ค่าแจ้งเตือนที่ถูกต้อง'); return }
    if (!isAuthenticated) { setFormError('กรุณาเข้าสู่ระบบเพื่อตั้งการแจ้งเตือน'); return }
    if (formChannels.includes('push') && !canUsePush) {
      setFormError('ต้องล็อกอินและใช้เบราว์เซอร์ที่รองรับ Web Push ก่อนเลือก Push')
      return
    }

    try {
      await addAlert(symbol, targetPrice, formCondition, {
        type: formType,
        notificationChannels: formChannels.length > 0 ? formChannels : ['email'],
      })
      setFormSymbol('')
      setFormPrice('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'ไม่สามารถเพิ่มแจ้งเตือนได้ กรุณาลองใหม่')
    }
  }

  if (!mounted) return null

  const activeAlerts = alerts.filter(a => !a.triggered)
  const triggeredAlerts = alerts.filter(a => a.triggered)

  return (
    <div className="space-y-6 fade-in">
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
                ? 'ตั้งแจ้งเตือนเมื่อราคาหุ้นถึงระดับที่ต้องการ — ระบบส่งอีเมลเมื่อแตะเป้า (ต้องตั้งค่า RESEND_API_KEY)'
                : 'เข้าสู่ระบบเพื่อตั้งแจ้งเตือน — แจ้งเตือน guest ไม่ทำงานกับ cron'}
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
              placeholder={getAlertTypePlaceholder(formType)}
              value={formPrice}
              onChange={(e) => setFormPrice(e.target.value)}
              min="0.01"
              step="0.01"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormType('price')}
              className={cn(
                'flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5',
                formType === 'price'
                  ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30'
                  : 'bg-brand-bg-secondary text-brand-text-secondary border border-brand-border'
              )}
            >
              ราคา
            </button>
            <button
              type="button"
              onClick={() => setFormType('percent_change')}
              className={cn(
                'flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5',
                formType === 'percent_change'
                  ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30'
                  : 'bg-brand-bg-secondary text-brand-text-secondary border border-brand-border'
              )}
            >
              % เปลี่ยน
            </button>
            <button
              type="button"
              onClick={() => setFormType('volume_spike')}
              className={cn(
                'flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5',
                formType === 'volume_spike'
                  ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30'
                  : 'bg-brand-bg-secondary text-brand-text-secondary border border-brand-border'
              )}
            >
              Volume
            </button>
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
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormChannels((prev) => toggleAlertChannel(prev, 'email'))}
              className={cn(
                'flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5',
                formChannels.includes('email')
                  ? 'bg-brand-success/10 text-brand-success border border-brand-success/30'
                  : 'bg-brand-bg-secondary text-brand-text-secondary border border-brand-border'
              )}
            >
              Email
            </button>
            <button
              type="button"
              disabled={!canUsePush}
              onClick={() => setFormChannels((prev) => toggleAlertChannel(prev, 'push'))}
              className={cn(
                'flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed',
                formChannels.includes('push')
                  ? 'bg-brand-info/10 text-brand-info border border-brand-info/30'
                  : 'bg-brand-bg-secondary text-brand-text-secondary border border-brand-border'
              )}
              title={isAuthenticated ? 'เบราว์เซอร์นี้ไม่รองรับ Web Push' : 'เข้าสู่ระบบเพื่อเลือก Push'}
            >
              Push
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BellRing size={18} className="text-brand-info" />
            Push notification
          </CardTitle>
        </CardHeader>
        <div className="space-y-3">
          {!isAuthenticated ? (
            <p className="text-sm text-brand-text-secondary">
              เข้าสู่ระบบเพื่อเปิดการแจ้งเตือนแบบ browser push ให้ cron ส่ง alert เข้าเครื่องได้โดยตรง
            </p>
          ) : !pushSupported ? (
            <p className="text-sm text-brand-warning">เบราว์เซอร์นี้ไม่รองรับ Web Push</p>
          ) : (
            <p className="text-sm text-brand-text-secondary">
              เปิดการแจ้งเตือนแบบ browser push เพื่อให้ cron ส่ง alert เข้าเครื่องได้โดยตรง เมื่อตั้งค่า VAPID keys แล้ว
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <Button type="button" variant="secondary" onClick={handlePushToggle}>
              {isAuthenticated ? (pushEnabled ? 'ปิด Push' : 'เปิด Push') : 'ล็อกอินเพื่อเปิด Push'}
            </Button>
            {pushMessage && <p className={cn('text-xs', getPushMessageClass(pushMessage))}>{pushMessage}</p>}
          </div>
        </div>
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
