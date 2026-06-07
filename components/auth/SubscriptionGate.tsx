'use client'

import { Lock, Zap } from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSubscription, type Plan } from '@/lib/hooks/use-subscription'
import Button from '@/components/ui/Button'
import AuthModal from './AuthModal'
import { useState } from 'react'

interface SubscriptionGateProps {
  children: React.ReactNode
  requiredPlan?: Plan
  fallback?: React.ReactNode
}

export default function SubscriptionGate({ children, requiredPlan = 'pro', fallback }: SubscriptionGateProps) {
  const { isAuthenticated } = useAuth()
  const { plan, isLoading } = useSubscription()
  const [authOpen, setAuthOpen] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-primary border-t-transparent" />
      </div>
    )
  }

  if (!isAuthenticated) {
    if (fallback) return <>{fallback}</>
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
        <div className="w-14 h-14 bg-brand-primary/10 rounded-full flex items-center justify-center">
          <Lock size={24} className="text-brand-primary" />
        </div>
        <div className="text-center">
          <p className="text-brand-text-primary font-medium mb-1">เข้าสู่ระบบเพื่อใช้งาน</p>
          <p className="text-sm text-brand-text-secondary max-w-sm">
            ฟีเจอร์นี้ต้องการบัญชี StockGuru {requiredPlan !== 'free' && `และแผน ${requiredPlan.toUpperCase()}`}
          </p>
        </div>
        <Button onClick={() => setAuthOpen(true)}>
          <Zap size={16} />
          เข้าสู่ระบบ
        </Button>
      </div>
    )
  }

  const planHierarchy: Record<Plan, number> = { free: 0, pro: 1, founding_pro: 1, trader: 2 }
  const userLevel = planHierarchy[plan]
  const requiredLevel = planHierarchy[requiredPlan]

  if (userLevel < requiredLevel) {
    if (fallback) return <>{fallback}</>
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-14 h-14 bg-brand-accent/10 rounded-full flex items-center justify-center">
          <Zap size={24} className="text-brand-accent" />
        </div>
        <div className="text-center">
          <p className="text-brand-text-primary font-medium mb-1">ต้องอัพเกรดแผน</p>
          <p className="text-sm text-brand-text-secondary max-w-sm">
            ฟีเจอร์นี้ต้องการแผน {requiredPlan.toUpperCase()} หรือสูงกว่า
          </p>
        </div>
        <Button variant="primary" onClick={() => window.location.href = '/pricing'}>
          <Zap size={16} />
          ดูแผนราคา
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
