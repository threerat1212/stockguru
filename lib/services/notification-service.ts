/**
 * Notification service for sending alert emails and web push messages.
 * Uses Resend if RESEND_API_KEY is configured, otherwise logs only.
 * Uses Web Push if VAPID keys are configured, otherwise logs only.
 */
import webpush from 'web-push'

interface AlertNotification {
  userId: string
  userEmail: string
  symbol: string
  condition: 'above' | 'below'
  targetPrice: number
  currentPrice: number
  alertType?: 'price' | 'percent_change' | 'volume_spike'
  alertId?: string
}

interface WebPushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

function getConditionText(condition: 'above' | 'below'): string {
  return condition === 'above' ? 'ขึ้นถึง' : 'ลงถึง'
}

function getAlertTypeText(alertType: AlertNotification['alertType']): string {
  switch (alertType) {
    case 'percent_change':
      return 'เปลี่ยนแปลง %'
    case 'volume_spike':
      return 'Volume spike'
    case 'price':
    default:
      return 'ราคา'
  }
}

export async function sendAlertEmail(notification: AlertNotification): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.log(`[Alert Notification] Would email ${notification.userEmail}: ${notification.symbol} ${getAlertTypeText(notification.alertType)} ${getConditionText(notification.condition)} ${notification.targetPrice} (current: ${notification.currentPrice})`)
    return false
  }

  const displaySym = notification.symbol.replace('.BK', '')
  const conditionText = getConditionText(notification.condition)
  const alertTypeText = getAlertTypeText(notification.alertType)

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'StockGuru Alerts <alerts@stockguru.app>',
        to: notification.userEmail,
        subject: `แจ้งเตือน: ${displaySym} ${alertTypeText} ${conditionText} ${notification.targetPrice}`,
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #10b981;">StockGuru Alert Triggered</h2>
            <p>หุ้น <strong>${displaySym}</strong> ที่คุณตั้งแจ้งเตือนไว้ได้${conditionText}ราคาเป้าหมายแล้ว</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr style="background: #f3f4f6;">
                <td style="padding: 8px; border: 1px solid #e5e7eb;">สัญลักษณ์</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>${displaySym}</strong></td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">เงื่อนไข</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">${alertTypeText} ${conditionText}</td>
              </tr>
              <tr style="background: #f3f4f6;">
                <td style="padding: 8px; border: 1px solid #e5e7eb;">ราคาเป้าหมาย</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">${notification.targetPrice}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">ค่าปัจจุบัน</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb;"><strong>${notification.currentPrice}</strong></td>
              </tr>
            </table>
            <p style="color: #6b7280; font-size: 12px;">ข้อมูลเพื่อการศึกษา ไม่ใช่คำแนะนำซื้อขาย</p>
          </div>
        `,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('Resend email failed:', err)
      return false
    }

    return true
  } catch (err) {
    console.error('Failed to send alert email:', err)
    return false
  }
}

export function configureWebPush() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY

  if (!vapidPublicKey || !vapidPrivateKey) {
    console.log('[Alert Notification] Web Push disabled: NEXT_PUBLIC_VAPID_PUBLIC_KEY or VAPID_PRIVATE_KEY is not configured')
    return false
  }

  webpush.setVapidDetails(
    'mailto:alerts@stockguru.app',
    vapidPublicKey,
    vapidPrivateKey
  )
  return true
}

export async function sendWebPushAlert(subscription: WebPushSubscription, notification: AlertNotification): Promise<boolean> {
  if (!configureWebPush()) return false

  const displaySym = notification.symbol.replace('.BK', '')
  const conditionText = getConditionText(notification.condition)
  const alertTypeText = getAlertTypeText(notification.alertType)

  try {
    await webpush.sendNotification(subscription, JSON.stringify({
      title: `StockGuru แจ้งเตือน: ${displaySym}`,
      body: `${displaySym} ${alertTypeText} ${conditionText} ${notification.targetPrice} (ปัจจุบัน ${notification.currentPrice})`,
      icon: '/icons/icon-192.png',
      data: {
        userId: notification.userId,
        alertId: notification.alertId ?? notification.userId,
        symbol: notification.symbol,
        url: `/stock/${encodeURIComponent(notification.symbol)}`,
      },
    }))
    return true
  } catch (err) {
    console.error('Web push failed:', err)
    return false
  }
}
