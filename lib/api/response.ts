import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/stock'
import type { MarketDataMeta } from '@/lib/market-data/types'

export function apiSuccess<T>(
  data: T,
  options?: { cached?: boolean; meta?: MarketDataMeta }
): NextResponse<ApiResponse<T>> {
  const cached = options?.cached ?? false
  const meta = options?.meta
  return NextResponse.json({ success: true, data, cached, ...(meta ? { meta } : {}) })
}

export function apiError(error: string, status = 500): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error }, { status })
}

export function apiBadRequest(error: string): NextResponse<ApiResponse<never>> {
  return apiError(error, 400)
}

export function apiNotFound(error = 'Not found'): NextResponse<ApiResponse<never>> {
  return apiError(error, 404)
}
