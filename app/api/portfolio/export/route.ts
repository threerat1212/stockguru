import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireFeature } from '@/lib/subscription/server'

function csvEscape(value: unknown) {
  const text = value === undefined || value === null ? '' : String(value)
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { userId } = await requireFeature('exportCsv')
    const supabase = createClient()
    const { data: holdings, error } = await supabase
      .from('holdings')
      .select('symbol, quantity, buy_price, currency, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const headers = ['symbol', 'quantity', 'buy_price', 'currency', 'created_at']
    const csv = [
      headers.join(','),
      ...(holdings ?? []).map((holding) => headers.map((header) => csvEscape(holding[header as keyof typeof holding])).join(',')),
    ].join('\n')

    return new NextResponse(`\ufeff${csv}`, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="stockguru-portfolio-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.csv"`,
      },
    })
  } catch (error) {
    const isUpgrade = error instanceof Error && error.message === 'UPGRADE_REQUIRED'
    const isUnauthorized = error instanceof Error && error.message === 'UNAUTHORIZED'
    const message = isUpgrade ? 'Export CSV requires a paid plan' : isUnauthorized ? 'กรุณาเข้าสู่ระบบก่อน export CSV' : 'Export failed'
    return NextResponse.json({ success: false, error: message }, { status: isUpgrade ? 403 : isUnauthorized ? 401 : 503 })
  }
}
