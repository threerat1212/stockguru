import { describe, it, expect } from 'vitest'
import { normalizeNewsArticle, newsDetailPath } from '@/lib/news/normalize'

describe('news normalize', () => {
  it('maps snake_case to camelCase', () => {
    const article = normalizeNewsArticle({
      id: 'uuid-1',
      slug: 'set-rally-today',
      title: 'Test',
      summary: 'Summary',
      url: '/news/set-rally-today',
      source: 'StockGuru',
      image_url: 'https://example.com/img.jpg',
      published_at: '2026-06-07T10:00:00Z',
      category: 'market',
      related_symbols: ['PTT.BK'],
    })

    expect(article.imageUrl).toBe('https://example.com/img.jpg')
    expect(article.publishedAt).toBe('2026-06-07T10:00:00Z')
    expect(article.relatedSymbols).toEqual(['PTT.BK'])
  })

  it('newsDetailPath prefers slug', () => {
    expect(newsDetailPath({ id: 'uuid-1', slug: 'my-slug' })).toBe('/news/my-slug')
    expect(newsDetailPath({ id: 'uuid-1' })).toBe('/news/uuid-1')
  })
})
