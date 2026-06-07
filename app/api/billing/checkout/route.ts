import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY.' }, { status: 503 })
    }

    const { plan = 'pro' } = await request.json()

    // Check if customer already exists
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let customerId = sub?.stripe_customer_id

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email!,
        metadata: { user_id: user.id },
      })
      customerId = customer.id
    }

    const planConfig: Record<string, { name: string; desc: string; priceIdEnv: string; fallbackAmount: number }> = {
      pro: { name: 'StockGuru Pro', desc: 'แผน Pro สำหรับนักลงทุนจริงจัง', priceIdEnv: 'STRIPE_PRICE_PRO', fallbackAmount: 19900 },
      founding_pro: { name: 'StockGuru Founding Pro', desc: 'แผน Pro ราคาพิเศษช่วงเปิดตัว', priceIdEnv: 'STRIPE_PRICE_FOUNDING_PRO', fallbackAmount: 14900 },
      trader: { name: 'StockGuru Trader', desc: 'แผน Trader สำหรับเทรดเดอร์มืออาชีพ', priceIdEnv: 'STRIPE_PRICE_TRADER', fallbackAmount: 34900 },
    }

    const config = planConfig[plan] ?? planConfig.pro
    const envPriceId = process.env[config.priceIdEnv]

    const lineItem: Stripe.Checkout.SessionCreateParams.LineItem = envPriceId
      ? { price: envPriceId, quantity: 1 }
      : {
          price_data: {
            currency: 'thb',
            product_data: { name: config.name, description: config.desc },
            unit_amount: config.fallbackAmount,
            recurring: { interval: 'month' },
          },
          quantity: 1,
        }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [lineItem],
      subscription_data: {
        metadata: { user_id: user.id, plan },
      },
      allow_promotion_codes: true,
      success_url: `${request.headers.get('origin')}/pricing?success=true`,
      cancel_url: `${request.headers.get('origin')}/pricing?canceled=true`,
      metadata: { user_id: user.id, plan },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Checkout error:', err)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
