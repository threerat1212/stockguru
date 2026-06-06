'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Brain, AlertTriangle, Calendar, TrendingUp, XCircle, CheckCircle, RefreshCw } from 'lucide-react'
import { useTrades } from '@/lib/hooks/use-journal'
import JournalGate from '@/components/journal/JournalGate'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/Loading'

interface AIReview {
  summary: string
  strengths: string[]
  weaknesses: string[]
  suggestions: string[]
  disclaimer: string
  metrics?: {
    total_trades: number
    win_rate: number
    total_pnl: number
    avg_r: number
    top_mistakes: [string, number][]
  }
}

async function fetchAIReview(): Promise<AIReview> {
  const res = await fetch('/api/journal/review', { method: 'POST' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Failed to generate review')
  }
  return res.json()
}

export default function ReviewPage() {
  const { data: trades, isLoading: tradesLoading } = useTrades()
  const [enabled, setEnabled] = useState(false)

  const { data: review, isLoading: reviewLoading, error, refetch } = useQuery({
    queryKey: ['journal-review'],
    queryFn: fetchAIReview,
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  })

  const all = trades ?? []
  const closed = all.filter((t) => t.status === 'closed')

  // Emotion analysis (local, no AI needed)
  const emotions = closed.map((t) => t.emotion).filter(Boolean) as string[]
  const emotionCounts = new Map<string, number>()
  emotions.forEach((e) => emotionCounts.set(e, (emotionCounts.get(e) ?? 0) + 1))
  const topEmotions = Array.from(emotionCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3)

  const isLoading = tradesLoading || (enabled && reviewLoading)

  return (
    <JournalGate>
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/journal">
              <Button variant="ghost" size="sm" className="gap-1">
                <ArrowLeft size={16} />
                กลับ
              </Button>
            </Link>
            <h1 className="heading-balance text-2xl font-bold text-brand-text-primary flex items-center gap-2">
              <Brain size={24} className="text-brand-accent" />
              AI Weekly Review
            </h1>
          </div>
          {review && (
            <Button variant="secondary" size="sm" className="gap-1" onClick={() => refetch()}>
              <RefreshCw size={14} />
              สรุปใหม่
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-brand-text-secondary">
          <Calendar size={16} />
          <span>สรุปจากข้อมูลที่บันทึกทั้งหมด</span>
          <span className="text-brand-text-muted">({closed.length} รายการปิด)</span>
        </div>

        {!enabled && (
          <Card className="p-6 text-center">
            <div className="w-16 h-16 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain size={28} className="text-brand-accent" />
            </div>
            <h2 className="text-lg font-semibold text-brand-text-primary mb-2">สรุปพฤติกรรมการเทรดด้วย AI</h2>
            <p className="text-sm text-brand-text-secondary mb-4 max-w-md mx-auto">
              AI จะวิเคราะห์ข้อมูลการเทรดที่คุณบันทึกในช่วง 30 วันที่ผ่านมา และสรุปพฤติกรรม จุดแข็ง จุดอ่อน และข้อเสนอแนะ
            </p>
            <Button variant="primary" onClick={() => setEnabled(true)}>
              เริ่มวิเคราะห์
            </Button>
          </Card>
        )}

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm text-brand-text-secondary">AI กำลังวิเคราะห์ข้อมูลการเทรดของคุณ...</p>
          </div>
        )}

        {error && (
          <Card className="p-4 border border-brand-danger/30">
            <p className="text-sm text-brand-danger">{(error as Error).message}</p>
            <Button variant="secondary" size="sm" className="mt-2" onClick={() => refetch()}>
              ลองใหม่
            </Button>
          </Card>
        )}

        {review && (
          <>
            {/* Summary */}
            <Card className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-brand-accent/10 rounded-lg flex items-center justify-center shrink-0">
                  <Brain size={20} className="text-brand-accent" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-brand-text-primary mb-1">สรุปพฤติกรรมการเทรด</h2>
                  <p className="text-sm text-brand-text-secondary leading-relaxed">{review.summary}</p>
                </div>
              </div>
            </Card>

            {/* Metrics */}
            {review.metrics && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Card className="p-3">
                  <p className="text-xs text-brand-text-secondary">Trades</p>
                  <p className="text-lg font-bold text-brand-text-primary">{review.metrics.total_trades}</p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-brand-text-secondary">Win Rate</p>
                  <p className="text-lg font-bold text-brand-text-primary">{review.metrics.win_rate.toFixed(1)}%</p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-brand-text-secondary">Net P&L</p>
                  <p className={`text-lg font-bold ${review.metrics.total_pnl >= 0 ? 'text-brand-success' : 'text-brand-danger'}`}>
                    {review.metrics.total_pnl >= 0 ? '+' : ''}{review.metrics.total_pnl.toFixed(0)}
                  </p>
                </Card>
                <Card className="p-3">
                  <p className="text-xs text-brand-text-secondary">Avg R</p>
                  <p className="text-lg font-bold text-brand-text-primary">{review.metrics.avg_r.toFixed(2)}R</p>
                </Card>
              </div>
            )}

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4 space-y-3">
                <h2 className="text-sm font-semibold text-brand-text-primary flex items-center gap-2">
                  <CheckCircle size={16} className="text-brand-success" />
                  จุดแข็ง
                </h2>
                <ul className="space-y-2">
                  {review.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-brand-text-secondary">
                      <CheckCircle size={14} className="text-brand-success shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </Card>

              <Card className="p-4 space-y-3">
                <h2 className="text-sm font-semibold text-brand-text-primary flex items-center gap-2">
                  <XCircle size={16} className="text-brand-danger" />
                  จุดที่ควรปรับปรุง
                </h2>
                <ul className="space-y-2">
                  {review.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-brand-text-secondary">
                      <XCircle size={14} className="text-brand-danger shrink-0 mt-0.5" />
                      {w}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Emotion */}
            {topEmotions.length > 0 && (
              <Card className="p-4 space-y-3">
                <h2 className="text-sm font-semibold text-brand-text-primary">อารมณ์ที่พบบ่อย</h2>
                <div className="flex flex-wrap gap-2">
                  {topEmotions.map(([emotion, count]) => (
                    <span key={emotion} className="px-3 py-1 bg-brand-bg-secondary text-sm text-brand-text-primary rounded-full">
                      {emotion} <span className="text-brand-text-muted">({count})</span>
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* Suggestions */}
            <Card className="p-4 space-y-3">
              <h2 className="text-sm font-semibold text-brand-text-primary flex items-center gap-2">
                <TrendingUp size={16} className="text-brand-primary" />
                ข้อเสนอแนะสำหรับสัปดาห์ถัดไป
              </h2>
              <ul className="space-y-2">
                {review.suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-brand-text-secondary">
                    <span className="w-5 h-5 bg-brand-primary/10 rounded flex items-center justify-center text-xs text-brand-primary shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </Card>

            {review.disclaimer && (
              <p className="text-xs text-brand-text-muted text-center">{review.disclaimer}</p>
            )}
          </>
        )}

        <div className="flex items-start gap-2 p-3 bg-brand-warning/5 border border-brand-warning/20 rounded-lg">
          <AlertTriangle size={16} className="text-brand-warning shrink-0 mt-0.5" />
          <p className="text-xs text-brand-text-secondary leading-relaxed">
            การวิเคราะห์นี้สรุปจากข้อมูลที่คุณบันทึกเท่านั้น ใช้เพื่อการทบทวนตนเอง ไม่ใช่คำแนะนำการลงทุน
          </p>
        </div>
      </div>
    </JournalGate>
  )
}
