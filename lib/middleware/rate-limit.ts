/**
 * Simple in-memory rate limiter for API routes.
 * In production, replace with Redis or a shared store.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetAt: number
}

export function rateLimit(
  key: string,
  options: { limit?: number; windowMs?: number } = {}
): RateLimitResult {
  const limit = options.limit ?? 60
  const windowMs = options.windowMs ?? 60_000 // 1 minute
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    const newEntry: RateLimitEntry = { count: 1, resetAt: now + windowMs }
    store.set(key, newEntry)
    return { allowed: true, limit, remaining: limit - 1, resetAt: newEntry.resetAt }
  }

  if (entry.count >= limit) {
    return { allowed: false, limit, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count += 1
  return { allowed: true, limit, remaining: limit - entry.count, resetAt: entry.resetAt }
}

export function rateLimitMiddleware(
  identifier: string,
  options?: { limit?: number; windowMs?: number }
): RateLimitResult {
  return rateLimit(identifier, options)
}
