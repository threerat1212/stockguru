'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getLifetimeSubscriptionForEmail } from '@/lib/subscription/lifetime'

import { PLAN_LIMITS, type Plan } from '@/lib/subscription/plans'

export { PLAN_LIMITS, type Plan } from '@/lib/subscription/plans'

export interface Subscription {
  plan: Plan
  status: 'active' | 'canceled' | 'past_due' | 'expired'
  currentPeriodEnd: string | null
}

export interface UsageCounters {
  aiQuestionsToday: number
  aiQuestionsMonth: number
  watchlistCount: number
  alertsCount: number
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [usage, setUsage] = useState<UsageCounters | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function fetchSubscription() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        setSubscription(null)
        setUsage(null)
        setIsLoading(false)
        return
      }

      const lifetimeSubscription = getLifetimeSubscriptionForEmail(user.email)

      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      const { data: usageData } = await supabase
        .from('usage_counters')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (cancelled) return

      if (lifetimeSubscription) {
        setSubscription(lifetimeSubscription)
      } else if (subData) {
        setSubscription({
          plan: subData.plan as Plan,
          status: subData.status as Subscription['status'],
          currentPeriodEnd: subData.current_period_end,
        })
      } else {
        setSubscription({ plan: 'free', status: 'active', currentPeriodEnd: null })
      }

      if (usageData) {
        setUsage({
          aiQuestionsToday: usageData.ai_questions_today ?? 0,
          aiQuestionsMonth: usageData.ai_questions_month ?? 0,
          watchlistCount: usageData.watchlist_count ?? 0,
          alertsCount: usageData.alerts_count ?? 0,
        })
      }

      setIsLoading(false)
    }

    void fetchSubscription()

    const authState = supabase.auth.onAuthStateChange(() => {
      void fetchSubscription()
    })

    return () => {
      cancelled = true
      authState.data.subscription.unsubscribe()
    }
  }, [])

  const plan = subscription?.status === 'active' ? subscription.plan : 'free'
  const limits = PLAN_LIMITS[plan]

  return {
    subscription,
    usage,
    plan,
    limits,
    isLoading,
    isPro: plan === 'pro' || plan === 'founding_pro' || plan === 'trader',
    isTrader: plan === 'trader',
    isFree: plan === 'free',
    hasJournalAccess: plan === 'trader',
    journalLimit: plan === 'trader' ? 9999 : 0,
  }
}
