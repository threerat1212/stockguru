import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET!
}

export async function POST(request: Request) {
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = getStripe().webhooks.constructEvent(payload, signature, getWebhookSecret())
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Log billing event
  await supabase.from('billing_events').insert({
    user_id: (event.data.object as any)?.metadata?.user_id ?? null,
    event_type: event.type,
    stripe_event_id: event.id,
    payload: event.data.object as any,
  })

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        // Get user by customer ID (stored in metadata during checkout)
        const userId = session.metadata?.user_id
        if (!userId) break

        const subscription = await getStripe().subscriptions.retrieve(subscriptionId)

        await supabase.from('subscriptions').upsert({
          user_id: userId,
          plan: session.metadata?.plan ?? 'pro',
          status: 'active',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
          current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

        await supabase.from('profiles').update({ plan: session.metadata?.plan ?? 'pro' }).eq('id', userId)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (sub?.user_id) {
          await supabase.from('subscriptions').update({ status: 'past_due' }).eq('user_id', sub.user_id)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (sub?.user_id) {
          await supabase.from('subscriptions').update({ status: 'canceled' }).eq('user_id', sub.user_id)
          await supabase.from('profiles').update({ plan: 'free' }).eq('id', sub.user_id)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (sub?.user_id) {
          const status = subscription.status === 'active' ? 'active' : subscription.status === 'canceled' ? 'canceled' : 'past_due'
          await supabase.from('subscriptions').update({
            status,
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('user_id', sub.user_id)

          if (status !== 'active') {
            await supabase.from('profiles').update({ plan: 'free' }).eq('id', sub.user_id)
          }
        }
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Stripe webhook handler error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }
}
