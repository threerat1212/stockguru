import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const MIMO_API_URL = 'https://api.xiaomimimo.com/v1/chat/completions'
const MIMO_MODEL = 'mimo-v2.5-pro'

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
    body: JSON.stringify({ model: MIMO_MODEL, messages, temperature: 0.75, max_tokens: 8000 }),
  })
  if (!response.ok) {
    const errBody = await response.text()
    throw new Error(`MiMo API error ${response.status}: ${errBody}`)
  }
  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}

function buildPrompt(): string {
  const now = new Date().toISOString()
  return `You are a Senior Investment Strategist at a top-tier Thai securities firm (equivalent to Goldman Sachs or Morgan Stanley research quality). Write 12 premium market intelligence briefs for institutional and sophisticated retail Thai investors.

TODAY'S CONTEXT: ${now.slice(0, 10)} | Thai SET Market

Each brief must demonstrate deep macro understanding, sector rotation insights, technical analysis perspective, and risk-aware commentary. Write in professional Thai with occasional English financial terms where standard.

Return ONLY valid JSON array with exactly 12 objects:
[
  {
    "slug": "descriptive-english-slug",
    "title": "Compelling Thai headline (40-70 chars, analyst tone, not clickbait)",
    "summary": "Executive summary (1-2 sentences, 100-150 chars) capturing the core thesis",
    "content": [
      "PARAGRAPH 1 — Setup/Context: Current macro or micro condition driving the theme. Reference specific SET sectors or recent policy/regulatory developments.",
      "PARAGRAPH 2 — Deep Analysis: Technical perspective (support/resistance levels if relevant), valuation commentary, fund flow implications, or structural changes. Use specific SET tickers naturally.",
      "PARAGRAPH 3 — Forward View: What investors should monitor next. Key catalysts, earnings expectations, or macro events on the horizon. Include risk factors.",
      "PARAGRAPH 4 — Sector/Stock Implications: Which specific stocks or sectors benefit or suffer. Use real SET names (PTT, SCB, KBANK, AOT, CPALL, ADVANC, DELTA, etc.)",
      "PARAGRAPH 5 — Conclusion & Risk Disclaimer: Balanced wrap-up emphasizing this is behavioral analysis, not investment advice. Mention key uncertainties."
    ],
    "category": "one of: market | sector | company | global | crypto",
    "source": "StockGuru AI Analysis",
    "url": "https://www.set.or.th",
    "relatedSymbols": ["PTT.BK", "SET", "AOT.BK", "SCB.BK"],
    "marketImpactScore": 55,
    "impactPoints": [
      {"label": "Thai label", "value": "Thai value", "sentiment": "positive"},
      {"label": "Thai label", "value": "Thai value", "sentiment": "neutral"}
    ],
    "references": [
      {"title": "SET", "url": "https://www.set.or.th", "source": "SET"}
    ]
  }
]

CATEGORY ALLOCATION (must be exact):
- 3 market (macro themes, SET index dynamics, fund flows, policy)
- 3 sector (banking, energy, tourism, tech, property, healthcare, food)
- 3 company (specific SET-listed company deep-dives with realistic narratives)
- 2 global (Fed policy impact on EM/Thailand, China stimulus effect, US tech, global oil)
- 1 crypto (Bitcoin/ETH institutional adoption, Thai crypto regulation, stablecoin trends)

QUALITY STANDARDS:
- Titles must read like a top broker research desk headline
- Content must be detailed, nuanced, and intellectually honest — never boosterish
- Use phrases like "จับตา", "ประเด็นสำคัญ", "ความเสี่ยง", "โอกาส", "แรงหนุน", "แรงกดดัน"
- Cite realistic but non-verifiable dynamics: "volume เริ่มกลับมา", "funds มองเก็งกำไร", "valuations อยู่ในระดับที่น่าสนใจ"
- marketImpactScore: 35-85 based on breadth of impact
- impactPoints: exactly 3 items, each with clear sentiment
- relatedSymbols: 3-5 real tickers, including .BK suffix for SET stocks, BTC for crypto
- NEVER include specific price targets, specific EPS numbers, or definitive buy/sell recommendations
- Always frame as "analysis perspective" or "behavioral summary" — not fact
- This is labeled "AI Analysis" — readers know this is simulation, not real news
`
}

function parseNewsJson(raw: string): any[] {
  let text = raw.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  }
  const parsed = JSON.parse(text)
  if (!Array.isArray(parsed)) throw new Error('Response is not an array')
  return parsed
}

export async function POST(request: Request) {
  // Verify cron secret or skip auth for cron jobs
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Also allow if no CRON_SECRET is set (dev mode)
    if (cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const apiKey = getApiKey()
  if (!apiKey) {
    return NextResponse.json({ error: 'MIMO_API_KEY not configured' }, { status: 503 })
  }

  const supabase = createClient()

  try {
    const aiResponse = await callMimo([
      { role: 'system', content: 'You are a professional Thai stock market analyst. You write informed behavioral summaries. You NEVER give buy/sell advice. You NEVER claim these are real news events. Always respond with valid JSON only.' },
      { role: 'user', content: buildPrompt() },
    ])

    const articles = parseNewsJson(aiResponse)

    const now = new Date().toISOString()
    const toInsert = articles.map((a: any) => ({
      slug: a.slug,
      title: a.title,
      summary: a.summary,
      content: a.content ?? [],
      category: a.category,
      source: a.source ?? 'StockGuru AI Analysis',
      url: a.url ?? 'https://www.set.or.th',
      related_symbols: a.relatedSymbols ?? [],
      market_impact_score: Number(a.marketImpactScore) || 50,
      impact_points: a.impactPoints ?? [],
      references: a.references ?? [{ title: 'SET', url: 'https://www.set.or.th', source: 'SET' }],
      published_at: now,
    }))

    const { error } = await supabase.from('news_articles').insert(toInsert)
    if (error) throw error

    // Keep only last 200 articles to prevent table bloat
    await supabase.rpc('cleanup_old_news')

    return NextResponse.json({ success: true, count: toInsert.length })
  } catch (err: any) {
    console.error('News refresh error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
