'use client'

import { useState } from 'react'
import { Check, X, Crown, Zap, Shield, NotebookPen, Sparkles } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import AuthModal from '@/components/auth/AuthModal'
import { useAuth } from '@/lib/hooks/use-auth'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { cn } from '@/lib/utils/format'

type CheckoutPlan = 'pro' | 'founding_pro' | 'trader'

const freeFeatures = [
  'AI 3 คำถามต่อวัน',
  'Watchlist 10 หุ้น',
  'การแจ้งเตือน 3 รายการ',
  'Screener พื้นฐาน',
  'AI Market Brief (สรุปข่าว)',
  'กราฟราคา',
]

const proFeatures = [
  'AI 300 คำถามต่อเดือน',
  'Watchlist 200 หุ้น',
  'การแจ้งเตือน 100 รายการ',
  'Screener ขั้นสูง',
  'เปรียบเทียบหุ้น',
  'พอร์ตการลงทุน',
  'สรุปผลกระทบข่าว',
  'Export CSV',
]

const traderFeatures = [
  'ทุกอย่างใน Pro',
  'Trading Journal เต็มรูปแบบ',
  'บันทึก trade ไม่จำกัด',
  'Equity Curve และสถิติผลงาน',
  'AI Weekly Review พฤติกรรมเทรด',
  'Export Journal CSV',
]

function FeatureList({ items, mutedItems = [] }: { items: string[]; mutedItems?: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((feature) => (
        <li key={feature} className="flex items-center gap-2 text-sm text-brand-text-secondary">
          <Check size={16} className="text-brand-success shrink-0" />
          <span>{feature}</span>
        </li>
      ))}
      {mutedItems.map((feature) => (
        <li key={feature} className="flex items-center gap-2 text-sm text-brand-text-muted">
          <X size={16} className="shrink-0" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  )
}

export default function PricingPage() {
  const { isAuthenticated } = useAuth()
  const { isPro, plan } = useSubscription()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [checkoutPlan, setCheckoutPlan] = useState<CheckoutPlan | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState('')

  async function startCheckout(plan: CheckoutPlan) {
    setError('')

    if (!isAuthenticated) {
      setAuthModalOpen(true)
      return
    }

    setCheckoutPlan(plan)
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? 'ไม่สามารถเริ่ม checkout ได้')
      }
      window.location.href = data.url
    } catch (err) {
      setError((err as Error).message)
      setCheckoutPlan(null)
    }
  }

  async function openBillingPortal() {
    setError('')
    setPortalLoading(true)
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'ไม่สามารถเปิดหน้าจัดการแผนได้')
      if (data.url) window.location.href = data.url
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto fade-in">
      <div className="text-center space-y-3">
        <h1 className="heading-balance text-3xl font-bold text-brand-text-primary">
          เลือกแผนที่เหมาะกับวิธีลงทุนของคุณ
        </h1>
        <p className="text-brand-text-secondary max-w-2xl mx-auto">
          StockGuru เป็น workspace วิเคราะห์หุ้นสำหรับนักลงทุนไทย AI ช่วยสรุปข้อมูล ตรวจเหตุผล และเช็กความเสี่ยง
          โดยไม่ใช่คำแนะนำซื้อขายหรือการรับประกันผลตอบแทน
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-brand-danger/30 bg-brand-danger/10 px-4 py-3 text-sm text-brand-danger">
          {error}
        </div>
      )}

      {isAuthenticated && isPro && (
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
          <p className="text-sm text-brand-text-secondary">
            แผนปัจจุบัน: <span className="font-medium text-brand-text-primary">{plan.toUpperCase()}</span>
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={openBillingPortal}
            isLoading={portalLoading}
          >
            จัดการแผน / ยกเลิก subscription
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-brand-text-primary">Free</h2>
              <p className="text-sm text-brand-text-secondary">ทดลองใช้เครื่องมือพื้นฐาน</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-brand-text-primary">0</span>
              <span className="text-brand-text-secondary">THB/เดือน</span>
            </div>
            <FeatureList items={freeFeatures} mutedItems={['Screener ขั้นสูง', 'Compare / Portfolio', 'Trading Journal']} />
            <Button variant="secondary" className="w-full" onClick={() => setAuthModalOpen(true)}>
              เริ่มใช้งานฟรี
            </Button>
          </div>
        </Card>

        <Card className="p-6 relative border-brand-primary/30 ring-1 ring-brand-primary/20">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-brand-primary text-white text-xs font-semibold rounded-full">
              <Crown size={12} />
              เหมาะกับส่วนใหญ่
            </span>
          </div>
          <div className="space-y-4 pt-2">
            <div>
              <h2 className="text-xl font-bold text-brand-text-primary">Pro</h2>
              <p className="text-sm text-brand-text-secondary">สำหรับนักลงทุนที่ต้องการ workspace ครบ</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-brand-primary">199</span>
              <span className="text-brand-text-secondary">THB/เดือน</span>
            </div>
            <FeatureList items={proFeatures} />
            <div className="space-y-2">
              <Button
                variant="primary"
                className="w-full gap-1"
                onClick={() => startCheckout('pro')}
                isLoading={checkoutPlan === 'pro'}
              >
                <Zap size={16} />
                สมัคร Pro
              </Button>
              <Button
                variant="ghost"
                className="w-full gap-1"
                onClick={() => startCheckout('founding_pro')}
                isLoading={checkoutPlan === 'founding_pro'}
              >
                <Sparkles size={16} />
                Founding Pro 149 THB/เดือน
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6 relative border-brand-accent/30">
          <div className="space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-brand-text-primary">Trader</h2>
                <NotebookPen size={18} className="text-brand-accent" />
              </div>
              <p className="text-sm text-brand-text-secondary">สำหรับคนที่บันทึกและรีวิวการเทรดจริง</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-brand-accent">349</span>
              <span className="text-brand-text-secondary">THB/เดือน</span>
            </div>
            <FeatureList items={traderFeatures} />
            <Button
              variant="success"
              className={cn('w-full gap-1', checkoutPlan === 'trader' && 'opacity-80')}
              onClick={() => startCheckout('trader')}
              isLoading={checkoutPlan === 'trader'}
            >
              <NotebookPen size={16} />
              สมัคร Trader
            </Button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-4 bg-brand-card border border-brand-border rounded-lg">
          <Shield size={24} className="text-brand-primary" />
          <div>
            <p className="text-sm font-medium text-brand-text-primary">ข้อมูลเพื่อการศึกษา</p>
            <p className="text-xs text-brand-text-secondary">ไม่ใช่คำแนะนำลงทุน</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-brand-card border border-brand-border rounded-lg">
          <Zap size={24} className="text-brand-accent" />
          <div>
            <p className="text-sm font-medium text-brand-text-primary">ยกเลิกได้ตลอด</p>
            <p className="text-xs text-brand-text-secondary">ไม่มีสัญญาระยะยาว</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-brand-card border border-brand-border rounded-lg">
          <Crown size={24} className="text-brand-warning" />
          <div>
            <p className="text-sm font-medium text-brand-text-primary">ราคาเปิดตัว</p>
            <p className="text-xs text-brand-text-secondary">Founding Pro 149 THB/เดือน</p>
          </div>
        </div>
      </div>

      <div className="p-4 bg-brand-warning/5 border border-brand-warning/20 rounded-lg">
        <p className="text-xs text-brand-text-secondary leading-relaxed">
          <strong>ข้อจำกัดความรับผิดชอบ:</strong> StockGuru เป็นเครื่องมือวิเคราะห์ข้อมูลเพื่อการศึกษาเท่านั้น
          ไม่ใช่การให้คำแนะนำการลงทุนที่ได้รับอนุญาต ไม่รับประกันผลตอบแทน ผู้ใช้รับผิดชอบการตัดสินใจลงทุนด้วยตนเอง
          ควรปรึกษาที่ปรึกษาการเงินก่อนตัดสินใจลงทุน
        </p>
      </div>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  )
}
