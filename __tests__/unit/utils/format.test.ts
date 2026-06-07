import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatPercent,
  formatCompactUsd,
  formatMarketCapUsd,
  getPriceColor,
  cn,
} from '@/lib/utils/format'

describe('formatCurrency', () => {
  it('formats THB correctly', () => {
    expect(formatCurrency(1234.5, 'THB')).toBe('฿1,234.50')
  })

  it('formats USD correctly', () => {
    expect(formatCurrency(1234.5, 'USD')).toBe('US$1,234.50')
  })

  it('handles zero', () => {
    expect(formatCurrency(0, 'THB')).toBe('฿0.00')
  })
})

describe('formatPercent', () => {
  it('formats positive percent', () => {
    expect(formatPercent(5.25)).toBe('+5.25%')
  })

  it('formats negative percent', () => {
    expect(formatPercent(-3.1)).toBe('-3.10%')
  })
})

describe('formatCompactUsd', () => {
  it('formats millions', () => {
    expect(formatCompactUsd(1_500_000)).toBe('$1.50M')
  })

  it('formats billions', () => {
    expect(formatCompactUsd(2_500_000_000)).toBe('$2.50B')
  })
})

describe('formatMarketCapUsd', () => {
  it('converts THB to USD', () => {
    // 36 THB/USD assumed rate
    const thbCap = 1_000_000_000_000 // 1T THB
    expect(formatMarketCapUsd(thbCap, 'THB')).toBe('$27.78B')
  })
})

describe('getPriceColor', () => {
  it('returns success for positive', () => {
    expect(getPriceColor(1)).toBe('text-brand-success')
  })

  it('returns danger for negative', () => {
    expect(getPriceColor(-1)).toBe('text-brand-danger')
  })
})

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('a', 'b', { c: true, d: false })).toBe('a b c')
  })
})
