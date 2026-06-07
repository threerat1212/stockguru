import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://stockguru.app'

  const routes = [
    '',
    '/screener',
    '/watchlist',
    '/portfolio',
    '/alerts',
    '/news',
    '/learn',
    '/compare',
    '/pricing',
    '/ai',
    '/trending',
    '/sector',
    '/earnings',
    '/journal',
    '/privacy',
    '/terms',
    '/risk-disclaimer',
  ]

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))
}
