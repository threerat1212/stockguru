import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MIMO_BASE_URL = (process.env.MIMO_BASE_URL ?? 'https://api.xiaomimimo.com/v1').replace(/\/$/, '')
const MIMO_API_URL = `${MIMO_BASE_URL}/chat/completions`
const MIMO_MODEL = 'mimo-v2.5-pro'

interface TradeRecord {
  symbol: string
  direction: string
  entry_price: number
  exit_price: number | null
  pnl: number | null
  r_multiple: number | null
  setup: string | null
  emotion: string | null
  mistake_tags: string[] | null
  status: string
}

function getApiKey(): string | null {
  return process.env.MIMO_API_KEY ?? null
}

async function callMimo(messages: { role: string; content: string }[]): Promise<string> {
  const response = await fetch(MIMO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({ model: MIMO_MODEL, messages, temperature: 0.5, max_tokens: 1500 }),
  })
  if (!response.ok) {
    const errBody = await response.text()
    throw new Error(`MiMo API error ${response.status}: ${errBody}`)
  }
  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check plan — Trader only
  const { data: profile } = await supabase.from('profiles').select('plan').eq('id', user.id).single()
  if (profile?.plan !== 'trader') {
    return NextResponse.json({ error: 'Trader plan required' }, { status: 403 })
  }

  if (!getApiKey()) {
    return NextResponse.json({ error: 'AI provider is not configured. Please set MIMO_API_KEY.' }, { status: 503 })
  }

  // Rate limit: max 1 review per user per day
  const today = new Date().toISOString().slice(0, 10)
  const { data: recentLog } = await supabase
    .from('ai_usage_logs')
    .select('created_at')
    .eq('user_id', user.id)
    .eq('feature', 'journal_review')
    .gte('created_at', `${today}T00:00:00Z`)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (recentLog) {
    return NextResponse.json({ error: 'Rate limited: 1 review per day' }, { status: 429 })
  }

  // Fetch user's closed trades from the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: trades } = await supabase
    .from('trades')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'closed')
    .gte('closed_at', thirtyDaysAgo)
    .order('closed_at', { ascending: true })

  if (!trades || trades.length === 0) {
    return NextResponse.json({
      summary: 'ยังไม่มีข้อมูลการเทรดในช่วง 30 วันที่ผ่านมา บันทึกการเทรดเพื่อให้ AI สรุปพฤติกรรมของคุณ',
      strengths: [],
      weaknesses: [],
      suggestions: [],
    })
  }

  const total = trades.length
  const typedTrades = trades as TradeRecord[]
  const wins = typedTrades.filter((t) => (t.pnl ?? 0) > 0)
  const losses = typedTrades.filter((t) => (t.pnl ?? 0) <= 0)
  const winRate = total > 0 ? (wins.length / total) * 100 : 0
  const totalPnL = typedTrades.reduce((s, t) => s + (t.pnl ?? 0), 0)
  const tradesWithR = typedTrades.filter((t) => t.r_multiple !== null)
  const avgR = tradesWithR.length > 0
    ? tradesWithR.reduce((s, t) => s + (t.r_multiple ?? 0), 0) / tradesWithR.length
    : 0

  const mistakeCounts: Record<string, number> = {}
  typedTrades.forEach((t) => {
    (t.mistake_tags ?? []).forEach((tag) => {
      mistakeCounts[tag] = (mistakeCounts[tag] ?? 0) + 1
    })
  })
  const topMistakes = Object.entries(mistakeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const setupCounts: Record<string, number> = {}
  typedTrades.forEach((t) => {
    if (t.setup) setupCounts[t.setup] = (setupCounts[t.setup] ?? 0) + 1
  })

  const tradeSummary = typedTrades.map((t, i) =>
    `${i + 1}. ${t.symbol} ${t.direction.toUpperCase()} ${t.entry_price}→${t.exit_price ?? '-'} PnL:${t.pnl ?? '-'} R:${t.r_multiple ?? '-'} Setup:${t.setup ?? '-'} Emotion:${t.emotion ?? '-'} Mistakes:${(t.mistake_tags ?? []).join(',') || 'none'}`
  ).join('\n')

  const prompt = `You are a trading behavior analyst. Review the following trade logs from a single trader over the past 30 days and provide a behavioral analysis. DO NOT give buy/sell signals or market predictions. Respond in Thai. Focus only on behavioral patterns.

TRADE LOGS (${total} trades, Win Rate ${winRate.toFixed(1)}%, Net PnL ${totalPnL.toFixed(2)}, Avg R ${avgR.toFixed(2)}):
${tradeSummary}

Top mistakes: ${topMistakes.map(([k, v]) => `${k}(${v})`).join(', ') || 'none'}
Top setups: ${Object.entries(setupCounts).map(([k, v]) => `${k}(${v})`).join(', ') || 'none'}

Respond with ONLY a valid JSON object:
{
  "summary": "<2-3 sentence overview of trading behavior in Thai>",
  "strengths": ["<strength1>", "<strength2>"],
  "weaknesses": ["<weakness1>", "<weakness2>"],
  "suggestions": ["<suggestion1>", "<suggestion2>", "<suggestion3>"],
  "disclaimer": "<disclaimer in Thai that this is self-review only not financial advice>"
}`

  const startTime = Date.now()
  let aiResponse = ''
  let error = null

  try {
    aiResponse = await callMimo([
      { role: 'system', content: 'You are a trading psychology assistant. You only review past behavior. You NEVER give future trading advice or buy/sell signals.' },
      { role: 'user', content: prompt },
    ])
  } catch (err) {
    error = err instanceof Error ? err.message : 'Unknown error'
  }

  // Log AI usage
  await supabase.from('ai_usage_logs').insert({
    user_id: user.id,
    feature: 'journal_review',
    prompt,
    response: aiResponse || null,
    prompt_length: prompt.length,
    response_length: aiResponse.length,
    latency_ms: Date.now() - startTime,
    error,
  })

  if (error) {
    return NextResponse.json({ error: 'AI analysis failed', detail: error }, { status: 500 })
  }

  // Parse JSON
  let parsed: Record<string, unknown> = {}
  try {
    let jsonStr = aiResponse.trim()
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    }
    parsed = JSON.parse(jsonStr)
  } catch {
    // Fallback to raw text split
    parsed = {
      summary: aiResponse.slice(0, 300),
      strengths: [],
      weaknesses: [],
      suggestions: [],
      disclaimer: 'ข้อมูลนี้ใช้เพื่อการทบทวนตนเองเท่านั้น ไม่ใช่คำแนะนำการลงทุน',
    }
  }

  return NextResponse.json({
    summary: parsed.summary ?? '',
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    disclaimer: parsed.disclaimer ?? 'ข้อมูลนี้ใช้เพื่อการทบทวนตนเองเท่านั้น ไม่ใช่คำแนะนำการลงทุน',
    metrics: {
      total_trades: total,
      win_rate: winRate,
      total_pnl: totalPnL,
      avg_r: avgR,
      top_mistakes: topMistakes,
    },
  })
}
