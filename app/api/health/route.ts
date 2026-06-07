import { NextResponse } from 'next/server'

/**
 * GET /api/health
 * Lightweight health check for Render / uptime monitors
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    ok: true,
    service: 'stockguru',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV ?? 'development',
  })
}
