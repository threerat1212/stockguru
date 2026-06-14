import { createClient } from '@/lib/supabase/server'
import { effectivePlan, type FeatureKey, canAccessFeature } from '@/lib/subscription/plan-utils'
import { getLifetimePlanForEmail } from '@/lib/subscription/lifetime'
import type { Plan } from '@/lib/hooks/use-subscription'

export interface ServerSubscriptionContext {
  userId: string | null
  plan: Plan
}

export async function getServerSubscription(): Promise<ServerSubscriptionContext> {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { userId: null, plan: 'free' }
  }

  const lifetimePlan = getLifetimePlanForEmail(user.email)
  if (lifetimePlan) {
    return { userId: user.id, plan: lifetimePlan }
  }

  const { data: subData } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .single()

  return {
    userId: user.id,
    plan: effectivePlan(subData?.plan, subData?.status),
  }
}

export async function requireAuth(): Promise<{ userId: string; plan: Plan }> {
  const ctx = await getServerSubscription()
  if (!ctx.userId) {
    throw new Error('UNAUTHORIZED')
  }
  return { userId: ctx.userId, plan: ctx.plan }
}

export async function requireFeature(feature: FeatureKey): Promise<{ userId: string; plan: Plan }> {
  const ctx = await requireAuth()
  if (!canAccessFeature(ctx.plan, feature)) {
    throw new Error('UPGRADE_REQUIRED')
  }
  return ctx
}
