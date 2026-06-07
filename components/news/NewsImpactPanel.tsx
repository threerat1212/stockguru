'use client'

import Link from 'next/link'
import { BarChart3, ShieldAlert, Lock } from 'lucide-react'
import { useSubscription } from '@/lib/hooks/use-subscription'
import { canAccessFeature } from '@/lib/subscription/plan-utils'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { cn } from '@/lib/utils/format'

interface ImpactPoint {
  label: string
  value: string
  sentiment?: 'positive' | 'negative' | 'neutral'
}

interface NewsImpactPanelProps {
  marketImpactScore?: number | null
  impactPoints: ImpactPoint[]
  toneClasses: Record<string, string>
}

export function NewsImpactScore({ score }: { score: number }) {
  const { plan } = useSubscription()
  const allowed = canAccessFeature(plan, 'newsImpact')

  if (!allowed) {
    return (
      <div className="rounded-xl border border-brand-border bg-brand-bg-secondary p-4 text-sm text-brand-text-secondary">
        <div className="mb-2 flex items-center gap-2 font-semibold text-brand-text-primary">
          <Lock size={14} className="text-brand-primary" />
          สรุปผลกระทบตลาด (Pro)
        </div>
        <p className="mb-3 text-xs">อัพเกรดแผน Pro เพื่อดูคะแนนผลกระทบและรายละเอียด</p>
        <Link href="/pricing">
          <Button variant="primary" size="sm">
            ดูแผนราคา
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-brand-warning/30 bg-brand-warning/10 p-4">
      <div className="mb-1 flex items-center gap-2 font-semibold text-brand-text-primary">
        <ShieldAlert size={16} className="text-brand-warning" /> ผลกระทบต่อตลาด
      </div>
      <p>คะแนนผลกระทบ: {score}/100</p>
    </div>
  )
}

export default function NewsImpactPanel({
  marketImpactScore,
  impactPoints,
  toneClasses,
}: NewsImpactPanelProps) {
  const { plan } = useSubscription()
  const allowed = canAccessFeature(plan, 'newsImpact')

  if (!impactPoints.length && !marketImpactScore) return null

  if (!allowed) {
    return (
      <Card className="border border-brand-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock size={16} className="text-brand-primary" />
            Impact Analysis (Pro)
          </CardTitle>
        </CardHeader>
        <p className="text-sm text-brand-text-secondary mb-3">
          สรุปผลกระทบข่าวต่อตลาดและหุ้นที่เกี่ยวข้อง — ต้องการแผน Pro
        </p>
        <Link href="/pricing">
          <Button variant="primary" size="sm">
            อัพเกรด Pro
          </Button>
        </Link>
      </Card>
    )
  }

  return (
    <>
      {impactPoints.length > 0 && (
        <Card className={cn('border', toneClasses[impactPoints[0]?.sentiment ?? 'neutral'])}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 size={18} /> Impact Points
            </CardTitle>
          </CardHeader>
          <div className="space-y-2">
            {impactPoints.map((pt, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg bg-brand-card/60 p-2 text-sm text-brand-text-primary"
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    pt.sentiment === 'positive'
                      ? 'bg-brand-success'
                      : pt.sentiment === 'negative'
                        ? 'bg-brand-danger'
                        : 'bg-brand-primary'
                  }`}
                />
                <span className="font-medium">{pt.label}</span>
                <span className="text-brand-text-secondary">{pt.value}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  )
}
