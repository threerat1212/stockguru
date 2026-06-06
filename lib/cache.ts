/**
 * Simple in-memory cache with TTL support for API responses.
 * In production, replace with Redis or similar.
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>()
  private readonly defaultTTL: number

  constructor(defaultTTLSeconds = 60) {
    this.defaultTTL = defaultTTLSeconds * 1000

    // Cleanup expired entries every 5 minutes
    setInterval(() => this.cleanup(), 5 * 60 * 1000)
  }

  get<T>(key: string): { data: T; cached: boolean } | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return { data: entry.data as T, cached: true }
  }

  set<T>(key: string, data: T, ttlSeconds?: number): void {
    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.defaultTTL
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttl,
    })
  }

  delete(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store) {
      if (now > entry.expiresAt) {
        this.store.delete(key)
      }
    }
  }
}

// Singleton instances with different TTLs
export const quoteCache = new MemoryCache(30) // 30s for real-time quotes
export const historyCache = new MemoryCache(300) // 5min for historical data
export const searchCache = new MemoryCache(600) // 10min for search results
export const newsCache = new MemoryCache(120) // 2min for news
export const analysisCache = new MemoryCache(900) // 15min for AI analysis
export const fundamentalCache = new MemoryCache(600) // 10min for fundamental data
export const earningsCache = new MemoryCache(300) // 5min for earnings calendar
