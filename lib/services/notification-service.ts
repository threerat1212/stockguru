/**
 * Notification service for sending alert emails.
 * Uses Resend if RESEND_API_KEY is configured, otherwise logs only.
 */

interface AlertNotification {
  userId: string
  userEmail: string
  symbol: string
  condition: 'above' | 'below'
  targetPrice: number
  currentPrice: number
}

export async function sendAlertEmail(notification: AlertNotification): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.log(`[Alert Notification] Would email ${notification.userEmail}: ${notification.symbol} ${notification.condition} ${notification.targetPrice} (current: ${notification.currentPrice})`)
    return false
  }

  const displaySym = notification.symbol.replace('.BK', '')
  const conditionText = notification.condition === 'above' ? 'ขึ้นถึง' : 'ลงถึง'

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
        subject: `แจ้งเตือน: ${displaySym} ${conditionText} ${notification.targetPrice}`,
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
                <td style="padding: 8px; border: 1px solid #e5e7eb;">${conditionText}</td>
              </tr>
              <tr style="background: #f3f4f6;">
                <td style="padding: 8px; border: 1px solid #e5e7eb;">ราคาเป้าหมาย</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">${notification.targetPrice}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">ราคาปัจจุบัน</td>
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
