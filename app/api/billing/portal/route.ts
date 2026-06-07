import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

/**
 * POST /api/billing/portal
 * Open Stripe Customer Portal (manage/cancel subscription)
 * Requires: STRIPE_SECRET_KEY + Customer Portal enabled in Stripe Dashboard
 */
export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY.' },
      { status: 503 }
    )
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id, plan, status')
    .eq('user_id', user.id)
    .single()

  if (!sub?.stripe_customer_id) {
    return NextResponse.json(
      { error: 'ยังไม่มีการสมัครแผนชำระเงิน หรือยังไม่เคย checkout สำเร็จ' },
      { status: 400 }
    )
  }

  const origin = new URL(request.url).origin

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: `${origin}/pricing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const message = (error as Error).message
    return NextResponse.json(
      {
        error:
          message.includes('portal') || message.includes('configuration')
            ? 'เปิด Stripe Customer Portal ใน Dashboard ก่อน (Settings → Billing → Customer portal)'
            : message,
      },
      { status: 500 }
    )
  }
}
