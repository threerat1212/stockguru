import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null,
    },
  })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : ''
  const p256dh = typeof body?.keys?.p256dh === 'string' ? body.keys.p256dh : ''
  const authKey = typeof body?.keys?.auth === 'string' ? body.keys.auth : ''

  if (!endpoint || !p256dh || !authKey) {
    return NextResponse.json({ success: false, error: 'Invalid push subscription' }, { status: 400 })
  }

  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: user.id,
      endpoint,
      p256dh,
      auth: authKey,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,endpoint',
    })

  if (error) {
    console.error('Failed to save push subscription:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: { subscribed: true } })
}
