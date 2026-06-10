import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getQuote } from '@/lib/services/stock-service'
import { sendAlertEmail, sendWebPushAlert } from '@/lib/services/notification-service'
import { mapSmartAlert, shouldTriggerAlert } from '@/lib/alerts/types'
import type { AlertChannel } from '@/lib/alerts/types'

type AlertRow = Record<string, any>
type PushSubscriptionRow = Record<string, any>

function isDuplicateDelivery(error: any) {
  return error?.code === '23505' || /duplicate key/i.test(error?.message ?? '')
}

async function claimDelivery(supabase: ReturnType<typeof createAdminClient>, alert: AlertRow, channel: AlertChannel, deliveryKey: string) {
  const { error } = await supabase.from('alert_deliveries').insert({
    alert_id: alert.id,
    user_id: alert.user_id,
    channel,
    delivery_key: deliveryKey,
    status: 'pending',
    attempts: 1,
    last_attempt_at: new Date().toISOString(),
  })

  if (error) {
    if (isDuplicateDelivery(error)) return false
    console.error(`Failed to claim ${channel} delivery for alert ${alert.id}:`, error)
    return false
  }

  return true
}

async function markDelivery(supabase: ReturnType<typeof createAdminClient>, alert: AlertRow, channel: AlertChannel, deliveryKey: string, status: 'sent' | 'failed', error?: string) {
  const payload: Record<string, any> = {
    status,
    last_attempt_at: new Date().toISOString(),
  }

  if (status === 'sent') payload.sent_at = new Date().toISOString()
  if (error) payload.error = error

  const { error: updateError } = await supabase
    .from('alert_deliveries')
    .update(payload)
    .eq('alert_id', alert.id)
    .eq('channel', channel)
    .eq('delivery_key', deliveryKey)

  if (updateError) {
    console.error(`Failed to mark ${channel} delivery for alert ${alert.id}:`, updateError)
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET

  if (!expectedSecret) {
    return new Response('CRON_SECRET not configured', { status: 503 })
  }

  const token = authHeader?.replace('Bearer ', '')
  if (!token || token !== expectedSecret) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createAdminClient()

  try {
    const { data: alerts, error: fetchError } = await supabase
      .from('alerts')
      .select('*')
      .eq('triggered', false)

    if (fetchError) {
      console.error('Failed to fetch alerts:', fetchError)
      return new Response('Failed to fetch alerts', { status: 500 })
    }

    if (!alerts || alerts.length === 0) {
      return Response.json({ checked: 0, triggered: 0, notified: 0 })
    }

    let checkedCount = alerts.length
    let triggeredCount = 0
    let notifiedCount = 0
    const triggeredIds: string[] = []
    const triggeredAlerts: AlertRow[] = []

    for (const rawAlert of alerts) {
      const alert = mapSmartAlert(rawAlert)

      try {
        const { data: quote } = await getQuote(alert.symbol)
        if (!quote?.price) continue

        const shouldTrigger = shouldTriggerAlert(alert, quote)
        if (!shouldTrigger) continue

        const triggeredAt = new Date().toISOString()
        const currentValue = alert.type === 'percent_change' ? quote.changePercent : alert.type === 'volume_spike' ? quote.volume : quote.price

        triggeredIds.push(alert.id)
        triggeredAlerts.push({
          ...rawAlert,
          triggered_at: triggeredAt,
          _current_value: currentValue,
          _quote: quote,
        })
      } catch (err) {
        console.error(`Failed to check alert ${alert.id} for ${alert.symbol}:`, err)
      }
    }

    if (triggeredIds.length > 0) {
      const { error: updateError } = await supabase
        .from('alerts')
        .update({
          triggered: true,
          triggered_at: new Date().toISOString(),
        })
        .in('id', triggeredIds)

      if (updateError) {
        console.error('Failed to mark alerts as triggered:', updateError)
        return new Response('Failed to mark alerts as triggered', { status: 500 })
      }

      triggeredCount = triggeredIds.length
    }

    for (const alert of triggeredAlerts) {
      const smartAlert = mapSmartAlert(alert as any)
      const channels = smartAlert.notificationChannels.length > 0 ? smartAlert.notificationChannels : ['email']
      const deliveryKey = `${smartAlert.id}:${alert.triggered_at ?? new Date().toISOString()}`

      for (const channel of channels) {
        const claimed = await claimDelivery(supabase, alert, channel as AlertChannel, `${deliveryKey}:${channel}`)
        if (!claimed) continue

        let sent = false

        try {
          if (channel === 'email') {
            const { data: userData } = await supabase.auth.admin.getUserById(smartAlert.userId)
            const userEmail = userData?.user?.email
            if (userEmail) {
              sent = await sendAlertEmail({
                userId: smartAlert.userId,
                userEmail,
                symbol: smartAlert.symbol,
                condition: smartAlert.condition,
                targetPrice: smartAlert.targetPrice,
                currentPrice: Number(alert._current_value ?? smartAlert.targetPrice),
                alertType: smartAlert.type,
              })
            }
          }

          if (channel === 'push') {
            const { data: subscriptions, error: subscriptionError } = await supabase
              .from('push_subscriptions')
              .select('*')
              .eq('user_id', smartAlert.userId)

            if (subscriptionError) {
              console.error(`Failed to fetch push subscriptions for user ${smartAlert.userId}:`, subscriptionError)
            } else {
              const pushPayloads = (subscriptions ?? []).map((row: PushSubscriptionRow) => ({
                endpoint: row.endpoint,
                keys: {
                  p256dh: row.p256dh,
                  auth: row.auth,
                },
              }))

              const results = await Promise.all(pushPayloads.map((subscription) => sendWebPushAlert(subscription, {
                userId: smartAlert.userId,
                userEmail: '',
                symbol: smartAlert.symbol,
                condition: smartAlert.condition,
                targetPrice: smartAlert.targetPrice,
                currentPrice: Number(alert._current_value ?? smartAlert.targetPrice),
                alertType: smartAlert.type,
                alertId: smartAlert.id,
              })))

              sent = results.some(Boolean)
            }
          }

          await markDelivery(supabase, alert, channel as AlertChannel, `${deliveryKey}:${channel}`, sent ? 'sent' : 'failed', sent ? undefined : 'Delivery attempted but no provider/config/recipient was available')
          if (sent) notifiedCount += 1
        } catch (err) {
          console.error(`Failed to deliver ${channel} alert ${smartAlert.id}:`, err)
          await markDelivery(supabase, alert, channel as AlertChannel, `${deliveryKey}:${channel}`, 'failed', err instanceof Error ? err.message : 'Unknown delivery error')
        }
      }
    }

    return Response.json({
      checked: checkedCount,
      triggered: triggeredCount,
      notified: notifiedCount,
      triggeredIds,
    })
  } catch (error) {
    console.error('Alert check failed:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
