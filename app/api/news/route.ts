import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeNewsArticle } from '@/lib/news/normalize'
import { canAccessFeature } from '@/lib/subscription/plan-utils'
import { getServerSubscription } from '@/lib/subscription/server'
import type { MarketDataMeta } from '@/lib/market-data/types'
import type { NewsArticle } from '@/types/stock'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') ?? 'all'
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const limit = parseInt(searchParams.get('limit') ?? '12', 10)

  const supabase = createClient()
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('news_articles')
    .select('*', { count: 'exact' })
    .order('published_at', { ascending: false })
    .range(from, to)

  if (category !== 'all') {
    query = query.eq('category', category)
  }

  const { data, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const subscription = await getServerSubscription()
  const canShowImpact = canAccessFeature(subscription.plan, 'newsImpact')
  const rows = data ?? []
  const articleIds = rows.map((row) => String(row.id))
  const { data: impactRows, error: impactError } = canShowImpact && articleIds.length > 0
    ? await supabase
      .from('news_article_impact')
      .select('*')
      .in('article_id', articleIds)
    : { data: [], error: null }

  if (impactError) {
    return NextResponse.json({ error: impactError.message }, { status: 500 })
  }

  const impactByArticleId = new Map<string, Record<string, unknown>>(
    (impactRows ?? []).map((row) => [String(row.article_id), row])
  )

  const articles = rows.map((row: Record<string, unknown>) => {
    const article = normalizeNewsArticle(row)
    const impact = impactByArticleId.get(article.id)
    if (!canShowImpact || !impact) return article

    const impactPoints = Array.isArray(impact.impact_points)
      ? impact.impact_points as NewsArticle['impactPoints']
      : undefined

    return {
      ...article,
      marketImpactScore: typeof impact.market_impact_score === 'number' ? impact.market_impact_score : article.marketImpactScore,
      impactPoints,
    }
  })

  const updatedAt = Date.now()
  const meta: MarketDataMeta = {
    source: 'fallback',
    isDemo: true,
    provider: 'StockGuru news_articles',
    updatedAt,
    warning: 'News articles are AI-generated briefs, not a real-time news wire.',
  }

  return NextResponse.json({
    articles,
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
    meta,
  })
}
