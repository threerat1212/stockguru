import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/types/stock'

export function apiSuccess<T>(data: T, cached = false): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data, cached })
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
