import { PLAN_LIMITS, type Plan } from '@/lib/subscription/plans'

export type FeatureKey = keyof (typeof PLAN_LIMITS)['free']['features']

const PLAN_RANK: Record<Plan, number> = {
  free: 0,
  pro: 1,
  founding_pro: 1,
  trader: 2,
}

export function effectivePlan(plan: Plan | string | null | undefined, status?: string): Plan {
  if (!plan || status !== 'active') return 'free'
  if (plan in PLAN_RANK) return plan as Plan
  return 'free'
}

export function isPaidPlan(plan: Plan): boolean {
  return PLAN_RANK[plan] >= 1
}

export function isTraderPlan(plan: Plan): boolean {
  return plan === 'trader'
}

export function canAccessFeature(plan: Plan, feature: FeatureKey): boolean {
  const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
  return Boolean(limits.features[feature])
}

export function planMeetsMinimum(current: Plan, required: Plan): boolean {
  return PLAN_RANK[current] >= PLAN_RANK[required]
}

export function getLimits(plan: Plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
}
