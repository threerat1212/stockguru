import { NextResponse } from 'next/server'
import { fetchAllData } from '@/lib/data/scheduler'

export async function POST(request: Request) {
  // Cron/admin gate — mirrors /api/news/refresh and /api/alerts/check.
  // Without this, any anonymous client could force an expensive full data fetch.
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const results = await fetchAllData()
    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
