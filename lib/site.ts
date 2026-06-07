/**
 * Canonical site URL used for metadata, sitemap, robots, and OG tags.
 * Override with NEXT_PUBLIC_SITE_URL in the deployment environment.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://stockguru-web.onrender.com'

export const SITE_NAME = 'StockGuru'
