'use client'

import { useAnalysis } from '@/lib/hooks/use-stock'
import { TrendingUp, TrendingDown, Minus, Shield, Target, AlertTriangle, CheckCircle2 } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingSpinner } from '@/components/ui/Loading'
import { cn } from '@/lib/utils/format'

interface AIAnalysisPanelProps {
  symbol: string
}

export default function AIAnalysisPanel({ symbol }: AIAnalysisPanelProps) {
  const { data: analysis, isLoading: loading } = useAnalysis(symbol)

  if (loading) {
    return (
      <Card>
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-brand-text-secondary">AI กำลังวิเคราะห์...</p>
        </div>
      </Card>
    )
  }

  if (!analysis) return null

  const trendConfig = {
    bullish: { label: 'ขาขึ้น', icon: TrendingUp, color: 'text-brand-success', bg: 'bg-brand-success/10', variant: 'success' as const },
    bearish: { label: 'ขาลง', icon: TrendingDown, color: 'text-brand-danger', bg: 'bg-brand-danger/10', variant: 'danger' as const },
    neutral: { label: 'ไซด์เวย์', icon: Minus, color: 'text-brand-warning', bg: 'bg-brand-warning/10', variant: 'warning' as const },
  }

  const viewConfig = {
    bullish_momentum: { label: 'แรงซื้อสะสม', color: 'text-brand-success', variant: 'success' as const },
    bearish_momentum: { label: 'แรงขายกดดัน', color: 'text-brand-danger', variant: 'danger' as const },
    neutral_consolidation: { label: 'สร้างฐาน', color: 'text-brand-warning', variant: 'warning' as const },
  }

  const trend = trendConfig[analysis.trend]
  const view = viewConfig[analysis.view]
  const TrendIcon = trend.icon

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-accent/10 rounded-lg flex items-center justify-center">
              <span className="text-sm">🤖</span>
            </div>
            AI วิเคราะห์
          </CardTitle>
        </CardHeader>

        <div className="grid grid-cols-3 gap-4 mb-5">
          {/* Trend */}
          <div className={cn('flex flex-col items-center p-3 rounded-lg', trend.bg)}>
            <TrendIcon size={20} className={trend.color} />
            <span className="text-xs text-brand-text-secondary mt-1">แนวโน้ม</span>
            <span className={cn('text-sm font-semibold', trend.color)}>{trend.label}</span>
          </div>

          {/* Signal Context */}
          <div className="flex flex-col items-center p-3 rounded-lg bg-brand-card">
            <Target size={20} className={view.color} />
            <span className="text-xs text-brand-text-secondary mt-1">สภาวะตลาด</span>
            <span className={cn('text-sm font-semibold', view.color)}>{view.label}</span>
          </div>

          {/* Confidence */}
          <div className="flex flex-col items-center p-3 rounded-lg bg-brand-card">
            <Shield size={20} className="text-brand-primary" />
            <span className="text-xs text-brand-text-secondary mt-1">ความมั่นใจ</span>
            <span className="text-sm font-semibold text-brand-primary">{analysis.confidence}%</span>
          </div>
        </div>

        <div className="p-3 bg-brand-bg-secondary rounded-lg">
          <p className="text-sm text-brand-text-primary leading-relaxed">{analysis.summary}</p>
        </div>
        <p className="text-xs text-brand-text-muted mt-2">{analysis.disclaimer}</p>
      </Card>

      {/* Technical Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp size={16} className="text-brand-primary" />
            การวิเคราะห์ทางเทคนิค
          </CardTitle>
        </CardHeader>
        <p className="text-sm text-brand-text-secondary leading-relaxed">{analysis.technicalAnalysis}</p>

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-3 bg-brand-success/5 border border-brand-success/20 rounded-lg">
            <span className="text-xs text-brand-text-secondary">แนวรับ</span>
            <div className="space-y-1 mt-1">
              {analysis.support.map((price, i) => (
                <p key={i} className="text-sm font-medium font-mono-nums text-brand-success">{price.toFixed(2)}</p>
              ))}
            </div>
          </div>
          <div className="p-3 bg-brand-danger/5 border border-brand-danger/20 rounded-lg">
            <span className="text-xs text-brand-text-secondary">แนวต้าน</span>
            <div className="space-y-1 mt-1">
              {analysis.resistance.map((price, i) => (
                <p key={i} className="text-sm font-medium font-mono-nums text-brand-danger">{price.toFixed(2)}</p>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Risk & Key Points */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle size={16} className="text-brand-warning" />
            ความเสี่ยง
          </CardTitle>
        </CardHeader>
        <p className="text-sm text-brand-text-secondary leading-relaxed mb-4">{analysis.riskAssessment}</p>

        <h4 className="text-sm font-medium text-brand-text-primary mb-2">จุดสำคัญ:</h4>
        <ul className="space-y-2">
          {analysis.keyPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 size={16} className="text-brand-primary mt-0.5 shrink-0" />
              <span className="text-sm text-brand-text-secondary">{point}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
