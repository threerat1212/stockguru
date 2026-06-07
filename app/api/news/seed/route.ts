import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const force = searchParams.get('force') === 'true'

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.RENDER_EXTERNAL_HOSTNAME
    ? `https://${process.env.RENDER_EXTERNAL_HOSTNAME}`
    : new URL(request.url).origin

  // If not forced, check if already seeded
  if (!force) {
    try {
      const check = await fetch(`${baseUrl}/api/news?category=all&page=1&limit=1`)
      if (check.ok) {
        const data = await check.json()
        if (data.total > 0) {
          return NextResponse.json({ success: true, message: 'Already seeded', count: data.total })
        }
      }
    } catch {
      // ignore check error
    }
  }

  // Trigger refresh
  try {
    const res = await fetch(`${baseUrl}/api/news/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cronSecret ?? 'dev'}`,
      },
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json({ error: err.error ?? 'Refresh failed' }, { status: res.status })
    }

    const result = await res.json()
    return NextResponse.json({ success: true, message: 'Seed triggered', ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
