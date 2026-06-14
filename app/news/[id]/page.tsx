import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Clock, ExternalLink, Newspaper, AlertTriangle } from 'lucide-react'
import NewsImpactPanel, { NewsImpactScore } from '@/components/news/NewsImpactPanel'
import { createClient } from '@/lib/supabase/server'
import { getNewsById } from '@/lib/data/news'
import Badge from '@/components/ui/Badge'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import { timeAgo } from '@/lib/utils/format'
import type { NewsArticle, NewsImpactPoint, NewsReference } from '@/types/stock'

const categoryLabels: Record<string, string> = {
  market: 'ตลาด',
  sector: 'กลุ่มอุตสาหกรรม',
  company: 'บริษัท',
  global: 'โลก',
  crypto: 'คริปโต',
}

const toneClasses: Record<string, string> = {
  positive: 'border-brand-success/30 bg-brand-success/10 text-brand-success',
  negative: 'border-brand-danger/30 bg-brand-danger/10 text-brand-danger',
  neutral: 'border-brand-primary/30 bg-brand-primary/10 text-brand-primary',
}

type NewsDetailArticle = {
  id: string
  title: string
  summary: string
  content: string[]
  url: string
  source: string
  image_url?: string | null
  published_at: string
  category: NewsArticle['category'] | string
  related_symbols: string[]
  market_impact_score?: number | null
  impact_points: NewsImpactPoint[]
  references: NewsReference[]
}

function normalizeReferences(
  references: NewsArticle['references'] | undefined,
  fallbackUrl: string,
  fallbackSource: string
): NewsReference[] {
  if (!references?.length) {
    return fallbackUrl ? [{ title: 'Source', url: fallbackUrl, source: fallbackSource }] : []
  }

  return references.map((ref, index) => {
    if (typeof ref === 'string') {
      return {
        title: `Reference ${index + 1}`,
        url: ref,
        source: fallbackSource,
      }
    }

    return ref
  })
}

function scoreFromTone(tone?: 'positive' | 'negative' | 'neutral') {
  if (tone === 'positive') return 68
  if (tone === 'negative') return 38
  return 52
}

function normalizeLocalArticle(article: NewsArticle): NewsDetailArticle {
  const content = article.content?.length
    ? article.content
    : [article.detail, article.impact].filter((item): item is string => Boolean(item))
  const tone = article.infographic?.tone ?? 'neutral'
  const impactPoints = article.impactPoints?.length
    ? article.impactPoints
    : article.impact
      ? [{ label: 'มุมมองตลาด', value: article.impact, sentiment: tone }]
      : []

  return {
    id: article.id,
    title: article.title,
    summary: article.summary,
    content,
    url: article.url,
    source: article.source,
    image_url: article.imageUrl ?? null,
    published_at: article.publishedAt,
    category: article.category,
    related_symbols: article.relatedSymbols ?? [],
    market_impact_score: article.marketImpactScore ?? scoreFromTone(tone),
    impact_points: impactPoints,
    references: normalizeReferences(article.references, article.url, article.source),
  }
}

export const revalidate = 0

export default async function NewsDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const id = params.id
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)

  const query = supabase.from('news_articles').select('*')
  const { data: dbArticle } = isUuid
    ? await query.eq('id', id).single()
    : await query.eq('slug', id).single()

  const localArticle = dbArticle ? null : getNewsById(id)
  const article = (dbArticle ?? (localArticle ? normalizeLocalArticle(localArticle) : null)) as NewsDetailArticle | null

  if (!article) notFound()

  const impactPoints = Array.isArray(article.impact_points) ? article.impact_points : []
  const references = Array.isArray(article.references) ? normalizeReferences(article.references, article.url, article.source) : []
  const relatedSymbols = Array.isArray(article.related_symbols) ? article.related_symbols : []
  const content = Array.isArray(article.content) ? article.content : []

  return (
    <div className="space-y-6">
      <Link href="/news" className="inline-flex min-h-10 items-center gap-2 rounded-lg pr-3 text-sm text-brand-text-secondary transition-colors hover:text-brand-primary">
        <ArrowLeft size={16} /> กลับหน้าข่าวทั้งหมด
      </Link>

      <div className="flex items-start gap-2 p-3 bg-brand-warning/5 border border-brand-warning/20 rounded-lg">
        <AlertTriangle size={16} className="text-brand-warning shrink-0 mt-0.5" />
        <p className="text-xs text-brand-text-secondary leading-relaxed">
          บทความนี้สร้างโดย AI เพื่อสรุปแนวโน้มตลาด ไม่ใช่ข่าวจริงจากสำนักข่าว ใช้เพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำการลงทุน
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_360px]">
        <article className="space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info" size="sm">{categoryLabels[article.category] ?? article.category}</Badge>
              <span className="inline-flex items-center gap-1 text-xs text-brand-text-secondary"><Clock size={12} />{timeAgo(article.published_at)}</span>
            </div>
            <h1 className="heading-balance text-[clamp(1.5rem,3vw,2.25rem)] font-bold leading-tight text-brand-text-primary">{article.title}</h1>
            <p className="text-base leading-7 text-brand-text-secondary">{article.summary}</p>
          </div>

          {article.image_url && (
            <div className="relative aspect-video overflow-hidden rounded-xl border border-brand-border bg-brand-bg-secondary">
              <Image src={article.image_url} alt={article.title} fill sizes="(min-width: 1280px) 60vw, 100vw" className="object-cover" priority unoptimized />
            </div>
          )}

          <Card>
            <div className="space-y-4 text-sm leading-7 text-brand-text-secondary">
              {content.map((para: string, i: number) => (
                <p key={i}>{para}</p>
              ))}
              {article.market_impact_score != null && (
                <NewsImpactScore score={article.market_impact_score} />
              )}
            </div>
          </Card>
        </article>

        <aside className="space-y-4">
          <NewsImpactPanel
            marketImpactScore={article.market_impact_score}
            impactPoints={impactPoints}
            toneClasses={toneClasses}
          />

          {relatedSymbols.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">หุ้นที่เกี่ยวข้อง</CardTitle></CardHeader>
              <div className="flex flex-wrap gap-2">
                {relatedSymbols.map((sym: string) => (
                  <Link key={sym} href={`/stock/${encodeURIComponent(sym)}`} className="rounded-lg border border-brand-border px-3 py-2 text-sm text-brand-primary hover:border-brand-primary/40">
                    {sym.replace('.BK', '')}
                  </Link>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Newspaper size={16} /> References</CardTitle>
            </CardHeader>
            <div className="space-y-2">
              {(references.length > 0 ? references : [{ url: article.url, title: 'Source', source: article.source }]).map((ref: NewsReference, i: number) => (
                <a key={i} href={String(ref.url ?? article.url)} target="_blank" rel="noopener noreferrer" className="flex min-h-10 items-center gap-2 break-all rounded-lg border border-brand-border px-3 py-2 text-xs text-brand-text-secondary hover:text-brand-primary">
                  <ExternalLink size={13} className="shrink-0" /> {String(ref.title ?? ref.source ?? 'Reference')}
                </a>
              ))}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
