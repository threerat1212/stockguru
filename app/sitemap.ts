import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Public, content-oriented routes. Personal/auth-gated pages
// (journal, portfolio, watchlist, alerts) are intentionally excluded.
const ROUTES = [
  '',
  '/trending',
  '/screener',
  '/sector',
  '/compare',
  '/news',
  '/learn',
  '/earnings',
  '/ai',
  '/pricing',
  '/privacy',
  '/terms',
  '/risk-disclaimer',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return ROUTES.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.7,
  }))
}
