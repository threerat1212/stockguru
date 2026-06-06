import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number, decimals = 2): string {
  return new Intl.NumberFormat('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num)
}

export function formatCurrency(num: number, currency = 'THB'): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(num)
}

export function formatVolume(num: number): string {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(2)}B`
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(2)}M`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
  return num.toString()
}

export function formatPercent(num: number): string {
  const sign = num >= 0 ? '+' : ''
  return `${sign}${num.toFixed(2)}%`
}

export function formatChange(num: number): string {
  const sign = num >= 0 ? '+' : ''
  return `${sign}${num.toFixed(2)}`
}

export function getPriceColor(change: number): string {
  if (change > 0) return 'text-brand-success'
  if (change < 0) return 'text-brand-danger'
  return 'text-brand-text-secondary'
}

export function getPriceBgColor(change: number): string {
  if (change > 0) return 'bg-brand-success/10'
  if (change < 0) return 'bg-brand-danger/10'
  return 'bg-brand-text-secondary/10'
}

export function timeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'เมื่อสักครู่'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} นาทีที่แล้ว`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} ชั่วโมงที่แล้ว`
  return `${Math.floor(seconds / 86400)} วันที่แล้ว`
}


const THB_PER_USD = 36

export function formatCompactUsd(num: number): string {
  const abs = Math.abs(num)
  const sign = num < 0 ? '-' : ''
  if (abs >= 1_000_000_000_000) return `${sign}$${(abs / 1_000_000_000_000).toFixed(2)}T`
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`
  return `${sign}$${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}

export function formatMarketCapUsd(marketCap: number | undefined, sourceCurrency = 'USD'): string {
  if (!marketCap) return '—'
  const usdValue = sourceCurrency === 'THB' ? marketCap / THB_PER_USD : marketCap
  return formatCompactUsd(usdValue)
}
