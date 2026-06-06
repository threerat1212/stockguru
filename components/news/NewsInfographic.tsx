import { Activity, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3 } from 'lucide-react'
import type { NewsArticle, NewsImpactPoint } from '@/types/stock'
import { cn } from '@/lib/utils/format'

function sentimentStyle(sentiment: NewsImpactPoint['sentiment']) {
  if (sentiment === 'positive') return 'border-brand-success/30 bg-brand-success/10 text-brand-success'
  if (sentiment === 'negative') return 'border-brand-danger/30 bg-brand-danger/10 text-brand-danger'
  return 'border-brand-warning/30 bg-brand-warning/10 text-brand-warning'
}

function SentimentIcon({ sentiment }: { sentiment: NewsImpactPoint['sentiment'] }) {
  if (sentiment === 'positive') return <ArrowUpRight size={16} />
  if (sentiment === 'negative') return <ArrowDownRight size={16} />
  return <ArrowRight size={16} />
}

export default function NewsInfographic({ article }: { article: NewsArticle }) {
  const score = article.marketImpactScore ?? 50

  return (
    <div className="rounded-2xl border border-brand-border bg-gradient-to-br from-brand-card to-brand-bg-secondary p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-primary/10">
            <BarChart3 size={18} className="text-brand-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-brand-text-primary">Market Impact Infographic</h2>
            <p className="text-xs text-brand-text-secondary">สรุปผลกระทบจากข่าวเป็นภาพรวมเร็ว</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-brand-text-secondary">Impact Score</p>
          <p className="text-2xl font-bold text-brand-primary">{score}</p>
        </div>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-brand-bg">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-accent" style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {(article.impactPoints ?? []).map((point) => (
          <div key={point.label} className={cn('rounded-xl border p-3', sentimentStyle(point.sentiment))}>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium opacity-90">{point.label}</span>
              <SentimentIcon sentiment={point.sentiment} />
            </div>
            <p className="text-sm font-semibold text-brand-text-primary">{point.value}</p>
          </div>
        ))}
      </div>

      {article.relatedSymbols && article.relatedSymbols.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-brand-border bg-brand-bg/40 p-3">
          <Activity size={16} className="text-brand-primary" />
          <span className="text-xs text-brand-text-secondary">หุ้นที่เกี่ยวข้อง:</span>
          {article.relatedSymbols.map((symbol) => (
            <span key={symbol} className="rounded-md bg-brand-primary/10 px-2 py-1 text-xs font-semibold text-brand-primary">
              {symbol.replace('.BK', '')}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
