import { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getQuote } from '@/lib/services/stock-service'
import { sendAlertEmail } from '@/lib/services/notification-service'

/**
 * POST /api/alerts/check
 * Cron job endpoint: checks all active alerts against current prices.
 * Sends email notification when alert triggers.
 * Requires CRON_SECRET header.
 *
 * Body: none
 */
export async function POST(request: NextRequest) {
  // Verify CRON_SECRET
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
    // Fetch all active (not triggered) alerts
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

    // Group alerts by symbol to minimize API calls
    const alertsBySymbol = new Map<string, typeof alerts>()
    for (const alert of alerts) {
      const existing = alertsBySymbol.get(alert.symbol) ?? []
      existing.push(alert)
      alertsBySymbol.set(alert.symbol, existing)
    }

    let triggeredCount = 0
    let notifiedCount = 0
    const triggeredIds: string[] = []
    const triggeredAlerts: typeof alerts = []

    // Check each symbol
    for (const [symbol, symbolAlerts] of alertsBySymbol) {
      try {
        const quote = await getQuote(symbol)
        if (!quote || !quote.price) continue

        const currentPrice = quote.price

        for (const alert of symbolAlerts) {
          const shouldTrigger =
            (alert.condition === 'above' && currentPrice >= alert.target_price) ||
            (alert.condition === 'below' && currentPrice <= alert.target_price)

          if (shouldTrigger) {
            triggeredIds.push(alert.id)
            triggeredAlerts.push(alert)
          }
        }
      } catch (err) {
        console.error(`Failed to check alert for ${symbol}:`, err)
        // Continue with next symbol
      }
    }

    // Mark triggered alerts and send notifications
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
      } else {
        triggeredCount = triggeredIds.length
      }

      // Send email notifications
      for (const alert of triggeredAlerts) {
        try {
          // Get user email from auth.users
          const { data: userData } = await supabase.auth.admin.getUserById(alert.user_id)
          const userEmail = userData?.user?.email

          if (userEmail) {
            const sent = await sendAlertEmail({
              userId: alert.user_id,
              userEmail,
              symbol: alert.symbol,
              condition: alert.condition as 'above' | 'below',
              targetPrice: Number(alert.target_price),
              currentPrice: Number(alert.current_price ?? alert.target_price),
            })
            if (sent) notifiedCount++
          }
        } catch (notifyErr) {
          console.error(`Failed to notify user for alert ${alert.id}:`, notifyErr)
        }
      }
    }

    return Response.json({
      checked: alerts.length,
      triggered: triggeredCount,
      notified: notifiedCount,
      triggeredIds,
    })
  } catch (error) {
    console.error('Alert check failed:', error)
    return new Response('Internal server error', { status: 500 })
  }
}
