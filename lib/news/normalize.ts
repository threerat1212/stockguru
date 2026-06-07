import type { NewsArticle } from '@/types/stock'

/** Map Supabase snake_case row to client NewsArticle */
export function normalizeNewsArticle(row: Record<string, unknown>): NewsArticle {
  const slug = row.slug ? String(row.slug) : undefined
  const id = String(row.id)

  return {
    id,
    slug,
    title: String(row.title),
    summary: String(row.summary),
    content: Array.isArray(row.content) ? (row.content as string[]) : undefined,
    url: String(row.url ?? `/news/${slug ?? id}`),
    source: String(row.source ?? 'StockGuru'),
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    publishedAt: String(row.published_at ?? row.created_at ?? new Date().toISOString()),
    updatedAt: row.updated_at ? String(row.updated_at) : undefined,
    category: (row.category as NewsArticle['category']) ?? 'market',
    relatedSymbols: Array.isArray(row.related_symbols)
      ? (row.related_symbols as string[])
      : undefined,
    marketImpactScore:
      typeof row.market_impact_score === 'number' ? row.market_impact_score : undefined,
    impactPoints: Array.isArray(row.impact_points)
      ? (row.impact_points as NewsArticle['impactPoints'])
      : undefined,
    references: Array.isArray(row.references)
      ? (row.references as NewsArticle['references'])
      : undefined,
    infographic: row.infographic as NewsArticle['infographic'],
  }
}

/** URL path segment for news detail — prefer stable slug */
export function newsDetailPath(article: Pick<NewsArticle, 'id' | 'slug'>): string {
  return `/news/${article.slug ?? article.id}`
}
