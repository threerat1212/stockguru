import type { Plan, Subscription } from '@/lib/hooks/use-subscription'

const LIFETIME_TRADER_EMAILS = new Set(['threerat2541@gmail.com'])

export function isLifetimeTraderEmail(email?: string | null) {
  return Boolean(email && LIFETIME_TRADER_EMAILS.has(email.trim().toLowerCase()))
}

export function getLifetimeSubscriptionForEmail(email?: string | null): Subscription | null {
  if (!isLifetimeTraderEmail(email)) return null
  return {
    plan: 'trader',
    status: 'active',
    currentPeriodEnd: null,
  }
}

export function getLifetimePlanForEmail(email?: string | null): Plan | null {
  return isLifetimeTraderEmail(email) ? 'trader' : null
}
