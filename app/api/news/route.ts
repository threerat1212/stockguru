import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeNewsArticle } from '@/lib/news/normalize'

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

  const articles = (data ?? []).map((row: Record<string, unknown>) => normalizeNewsArticle(row))

  return NextResponse.json({
    articles,
    total: count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  })
}
