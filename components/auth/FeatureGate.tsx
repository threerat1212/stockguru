'use client'

import { Lock, Zap } from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { canAccessFeature, type FeatureKey } from '@/lib/subscription/plan-utils'
import type { Plan } from '@/lib/hooks/use-subscription'
import Button from '@/components/ui/Button'
import AuthModal from './AuthModal'
import { useState } from 'react'

const FEATURE_COPY: Record<FeatureKey, { title: string; description: string }> = {
  advancedScreener: {
    title: 'Screener ขั้นสูง',
    description: 'ตัวกรองขั้นสูง ตลาด กลุ่มอุตสาหกรรม และช่วง Volume/% เปลี่ยนแปลง ต้องการแผน Pro',
  },
  compare: {
    title: 'เปรียบเทียบหุ้น',
    description: 'เปรียบเทียบหุ้นหลายตัวพร้อมกราฟ ต้องการแผน Pro',
  },
  portfolio: {
    title: 'พอร์ตการลงทุน',
    description: 'บันทึกและติดตามพอร์ตบน cloud ต้องการแผน Pro',
  },
  newsImpact: {
    title: 'สรุปผลกระทบข่าว',
    description: 'รายละเอียดผลกระทบข่าวต่อตลาด ต้องการแผน Pro',
  },
  exportCsv: {
    title: 'Export CSV',
    description: 'ส่งออกข้อมูลเป็น CSV ต้องการแผน Pro',
  },
}

interface FeatureGateProps {
  feature: FeatureKey
  children?: React.ReactNode
  /** Optional inline fallback instead of full-page gate */
  inline?: boolean
}

export default function FeatureGate({ feature, children, inline = false }: FeatureGateProps) {
  const { isAuthenticated } = useAuth()
  const { plan, isLoading } = useSubscription()
  const [authOpen, setAuthOpen] = useState(false)
  const copy = FEATURE_COPY[feature]

  if (isLoading) {
    return (
      <div className={inline ? 'py-8' : 'flex items-center justify-center py-16'}>
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    if (inline) {
      return (
        <div className="rounded-lg border border-brand-border bg-brand-bg-secondary p-4 text-sm text-brand-text-secondary">
          {copy.description}{' '}
          <button type="button" className="text-brand-primary underline" onClick={() => setAuthOpen(true)}>
            เข้าสู่ระบบ
          </button>
          <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        <div className="w-14 h-14 bg-brand-primary/10 rounded-full flex items-center justify-center">
          <Lock size={24} className="text-brand-primary" />
        </div>
        <div className="text-center max-w-sm">
          <p className="text-brand-text-primary font-medium mb-1">{copy.title}</p>
          <p className="text-sm text-brand-text-secondary">{copy.description}</p>
        </div>
        <Button onClick={() => setAuthOpen(true)}>
          <Zap size={16} />
          เข้าสู่ระบบ
        </Button>
      </div>
    )
  }

  if (!canAccessFeature(plan, feature)) {
    if (inline) {
      return (
        <div className="rounded-lg border border-brand-accent/30 bg-brand-accent/5 p-4 text-sm text-brand-text-secondary">
          {copy.description}{' '}
          <a href="/pricing" className="text-brand-primary font-medium underline">
            อัพเกรด Pro
          </a>
        </div>
      )
    }
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-14 h-14 bg-brand-accent/10 rounded-full flex items-center justify-center">
          <Zap size={24} className="text-brand-accent" />
        </div>
        <div className="text-center max-w-sm">
          <p className="text-brand-text-primary font-medium mb-1">{copy.title}</p>
          <p className="text-sm text-brand-text-secondary">{copy.description}</p>
        </div>
        <Button variant="primary" onClick={() => { window.location.href = '/pricing' }}>
          <Zap size={16} />
          ดูแผนราคา
        </Button>
      </div>
    )
  }

  return <>{children}</>
}

/** Gate by minimum plan (e.g. trader for journal) */
export function PlanGate({
  requiredPlan,
  children,
  title,
  description,
}: {
  requiredPlan: Plan
  children: React.ReactNode
  title: string
  description: string
}) {
  const { isAuthenticated } = useAuth()
  const { plan, isLoading } = useSubscription()
  const [authOpen, setAuthOpen] = useState(false)
  const ranks: Record<Plan, number> = { free: 0, pro: 1, founding_pro: 1, trader: 2 }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        <Lock size={28} className="text-brand-primary" />
        <p className="text-sm text-brand-text-secondary">{description}</p>
        <Button onClick={() => setAuthOpen(true)}>เข้าสู่ระบบ</Button>
      </div>
    )
  }

  if (ranks[plan] < ranks[requiredPlan]) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <Zap size={28} className="text-brand-accent" />
        <h2 className="text-xl font-bold text-brand-text-primary">{title}</h2>
        <p className="text-sm text-brand-text-secondary max-w-sm">{description}</p>
        <Button variant="primary" onClick={() => { window.location.href = '/pricing' }}>
          อัพเกรด {requiredPlan === 'trader' ? 'Trader' : 'Pro'}
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
