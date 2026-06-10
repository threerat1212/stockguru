import type { StockQuote } from '@/types/stock'

export type AlertType = 'price' | 'percent_change' | 'volume_spike'
export type AlertCondition = 'above' | 'below'
export type AlertChannel = 'email' | 'push'

export interface SmartAlert {
  id: string
  userId: string
  symbol: string
  type: AlertType
  condition: AlertCondition
  targetPrice: number
  triggered: boolean
  triggeredAt?: string
  notificationChannels: AlertChannel[]
  createdAt: string
}

export interface SmartAlertRecord {
  id: string
  user_id: string
  symbol: string
  type: AlertType
  condition: AlertCondition
  target_price: number
  triggered: boolean
  triggered_at?: string
  notification_channels?: AlertChannel[] | string | null
  created_at: string
}

export interface PushSubscriptionRecord {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
  updated_at: string
}

export interface PushSubscription {
  endpoint?: string
  expirationTime?: string | number | null
  keys?: {
    p256dh: string
    auth: string
  }
}

export function normalizeAlertChannels(value: SmartAlertRecord['notification_channels']): AlertChannel[] {
  if (Array.isArray(value)) return value.filter((channel): channel is AlertChannel => channel === 'email' || channel === 'push')
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value) as unknown
      if (Array.isArray(parsed)) return parsed.filter((channel): channel is AlertChannel => channel === 'email' || channel === 'push')
    } catch {
      if (value === 'push') return ['push']
      if (value === 'email') return ['email']
    }
  }
  return ['email']
}

export function mapSmartAlert(row: SmartAlertRecord): SmartAlert {
  return {
    id: row.id,
    userId: row.user_id,
    symbol: row.symbol,
    type: row.type,
    condition: row.condition,
    targetPrice: Number(row.target_price),
    triggered: Boolean(row.triggered),
    triggeredAt: row.triggered_at,
    notificationChannels: normalizeAlertChannels(row.notification_channels),
    createdAt: row.created_at,
  }
}

export function shouldTriggerAlert(alert: Pick<SmartAlert, 'type' | 'condition' | 'targetPrice'>, quote: StockQuote): boolean {
  const current = getCurrentAlertValue(alert.type, quote)
  if (!Number.isFinite(current)) return false

  if (alert.condition === 'above') return current >= alert.targetPrice
  return current <= alert.targetPrice
}

export function getCurrentAlertValue(type: AlertType, quote: StockQuote): number {
  switch (type) {
    case 'percent_change':
      return quote.changePercent
    case 'volume_spike':
      return quote.volume
    case 'price':
    default:
      return quote.price
  }
}

export function getAlertTypeLabel(type: AlertType): string {
  switch (type) {
    case 'percent_change':
      return 'เปลี่ยนแปลง %'
    case 'volume_spike':
      return 'Volume spike'
    case 'price':
    default:
      return 'ราคา'
  }
}
