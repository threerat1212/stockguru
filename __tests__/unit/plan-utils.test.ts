import { describe, it, expect } from 'vitest'
import {
  effectivePlan,
  canAccessFeature,
  planMeetsMinimum,
  isPaidPlan,
} from '@/lib/subscription/plan-utils'

describe('plan-utils', () => {
  it('effectivePlan returns free when inactive', () => {
    expect(effectivePlan('pro', 'canceled')).toBe('free')
    expect(effectivePlan('trader', 'expired')).toBe('free')
  })

  it('effectivePlan returns plan when active', () => {
    expect(effectivePlan('pro', 'active')).toBe('pro')
    expect(effectivePlan('trader', 'active')).toBe('trader')
  })

  it('canAccessFeature gates compare for free', () => {
    expect(canAccessFeature('free', 'compare')).toBe(false)
    expect(canAccessFeature('pro', 'compare')).toBe(true)
  })

  it('planMeetsMinimum respects hierarchy', () => {
    expect(planMeetsMinimum('free', 'pro')).toBe(false)
    expect(planMeetsMinimum('trader', 'pro')).toBe(true)
    expect(planMeetsMinimum('founding_pro', 'pro')).toBe(true)
  })

  it('isPaidPlan', () => {
    expect(isPaidPlan('free')).toBe(false)
    expect(isPaidPlan('pro')).toBe(true)
  })
})
