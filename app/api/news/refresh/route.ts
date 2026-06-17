import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

const MIMO_BASE_URL = (process.env.MIMO_BASE_URL ?? 'https://token-plan-sgp.xiaomimimo.com/v1').replace(/\/$/, '')
const MIMO_API_URL = `${MIMO_BASE_URL}/chat/completions`
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
    body: JSON.stringify({ model: MIMO_MODEL, messages, temperature: 0.75, max_tokens: 16000 }),
  })
  if (!response.ok) {
    const errBody = await response.text()
    throw new Error(`MiMo API error ${response.status}: ${errBody}`)
  }
  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}

async function readCachedData() {
  const cacheDir = join(process.cwd(), 'lib', 'data', 'cache')
  const data: { [key: string]: any } = {
    setIndex: null,
    thaiStocks: [],
    crypto: [],
    fearGreed: null,
    macro: null,
  }

  try {
    if (existsSync(join(cacheDir, 'set-index.json'))) {
      data.setIndex = JSON.parse(await readFile(join(cacheDir, 'set-index.json'), 'utf-8'))
    }
  } catch (e) {
    console.log('Failed to read set-index.json')
  }

  try {
    if (existsSync(join(cacheDir, 'thai-stocks.json'))) {
      data.thaiStocks = JSON.parse(await readFile(join(cacheDir, 'thai-stocks.json'), 'utf-8'))
    }
  } catch (e) {
    console.log('Failed to read thai-stocks.json')
  }

  try {
    if (existsSync(join(cacheDir, 'crypto.json'))) {
      data.crypto = JSON.parse(await readFile(join(cacheDir, 'crypto.json'), 'utf-8'))
    }
  } catch (e) {
    console.log('Failed to read crypto.json')
  }

  try {
    if (existsSync(join(cacheDir, 'fear-greed.json'))) {
      data.fearGreed = JSON.parse(await readFile(join(cacheDir, 'fear-greed.json'), 'utf-8'))
    }
  } catch (e) {
    console.log('Failed to read fear-greed.json')
  }

  try {
    if (existsSync(join(cacheDir, 'macro.json'))) {
      data.macro = JSON.parse(await readFile(join(cacheDir, 'macro.json'), 'utf-8'))
    }
  } catch (e) {
    console.log('Failed to read macro.json')
  }

  return data
}

function buildPrompt(cachedData: any): string {
  const now = new Date().toISOString()
  const { setIndex, thaiStocks, crypto, fearGreed, macro } = cachedData

  return `You are a Senior Investment Strategist at a top-tier Thai securities firm (equivalent to Goldman Sachs or Morgan Stanley research quality). Write 12 premium market intelligence briefs for institutional and sophisticated retail Thai investors.

TODAY'S CONTEXT: ${now.slice(0, 10)} | Thai SET Market

LIVE DATA (use these actual numbers in your analysis):
${setIndex ? `SET Index: ${setIndex.price} (${setIndex.changePercent > 0 ? '+' : ''}${setIndex.changePercent.toFixed(2)}%), Volume: ${setIndex.volume.toLocaleString()}` : 'SET Index: n/a'}
${crypto.length > 0 ? `Crypto: BTC $${crypto[0].price} (${crypto[0].changePercent24h > 0 ? '+' : ''}${crypto[0].changePercent24h.toFixed(2)}%), ETH $${crypto[1].price} (${crypto[1].changePercent24h > 0 ? '+' : ''}${crypto[1].changePercent24h.toFixed(2)}%)` : 'Crypto: n/a'}
${fearGreed ? `Fear & Greed: ${fearGreed.classification} (${fearGreed.value})` : 'Fear & Greed: n/a'}
${macro ? `Macro: USD/THB ${macro.usdThb}, Fed Rate ${(macro.fedRate * 100).toFixed(2)}%, Oil $${macro.oilPrice}, Gold $${macro.goldPrice}, VIX ${macro.vix}` : 'Macro: n/a'}
${thaiStocks.length > 0 ? `Top Thai Stocks: ${thaiStocks.slice(0, 5).map((s: any) => `${s.symbol} ${s.price} (${s.changePercent > 0 ? '+' : ''}${s.changePercent.toFixed(2)}%)`).join(', ')}` : 'Thai Stocks: n/a'}

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

function parseNewsJson(raw: string): Array<Record<string, unknown>> {
  let text = raw.trim()
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  }
  // Fix unterminated strings by adding closing quotes
  const lines = text.split('\n')
  let fixedLines: string[] = []

  for (const line of lines) {
    let fixedLine = line
    let quoteCount = 0

    for (const char of line) {
      if (char === '"') quoteCount++
    }

    // If odd number of quotes, string is likely unterminated
    if (quoteCount % 2 !== 0) {
      fixedLine = line + '"'
    }

    fixedLines.push(fixedLine)
  }

  const fixedText = fixedLines.join('\n')

  try {
    const parsed = JSON.parse(fixedText)
    if (!Array.isArray(parsed)) throw new Error('Response is not an array')
    return parsed
  } catch (e) {
    // If fixing failed, try parsing original
    try {
      const parsed = JSON.parse(text)
      if (!Array.isArray(parsed)) throw new Error('Response is not an array')
      return parsed
    } catch (e2) {
      throw new Error(`Failed to parse JSON: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = getApiKey()
  if (!apiKey) {
    return NextResponse.json({ error: 'MIMO_API_KEY not configured' }, { status: 503 })
  }

  const supabase = createAdminClient()

  try {
    // Read cached data
    const cachedData = await readCachedData()
    console.log('Cached data loaded:', Object.keys(cachedData).filter(k => cachedData[k]))

    const aiResponse = await callMimo([
      { role: 'system', content: 'You are a professional Thai stock market analyst. You write informed behavioral summaries. You NEVER give buy/sell advice. You NEVER claim these are real news events. Always respond with valid JSON only.' },
      { role: 'user', content: buildPrompt(cachedData) },
    ])

    console.log('AI response length:', aiResponse.length)
    console.log('AI response preview:', aiResponse.substring(0, 500))

    const articles = parseNewsJson(aiResponse)

    console.log('Parsed articles count:', articles.length)

    const now = new Date().toISOString()
    const toInsertArticles = articles.map((a: Record<string, unknown>) => ({
      slug: a.slug,
      title: a.title,
      summary: a.summary,
      content: a.content ?? [],
      category: a.category,
      source: a.source ?? 'StockGuru AI Analysis',
      url: a.url ?? 'https://www.set.or.th',
      related_symbols: a.relatedSymbols ?? [],
      references: a.references ?? [{ title: 'SET', url: 'https://www.set.or.th', source: 'SET' }],
      published_at: now,
    }))

    console.log('Inserting articles count:', toInsertArticles.length)

    const { data: insertedArticles, error } = await supabase
      .from('news_articles')
      .insert(toInsertArticles)
      .select('id')

    if (error) {
      console.error('Supabase insert error:', error)
      throw error
    }

    const toInsertImpact = (insertedArticles ?? []).map((article, index) => ({
      article_id: article.id,
      market_impact_score: Number(articles[index].marketImpactScore) || 50,
      impact_points: articles[index].impactPoints ?? [],
    }))

    if (toInsertImpact.length > 0) {
      const { error: impactError } = await supabase.from('news_article_impact').insert(toInsertImpact)
      if (impactError) {
        console.error('Supabase news impact insert error:', impactError)
        throw impactError
      }
    }

    console.log('Insert successful')

    // Keep only last 200 articles to prevent table bloat
    const { error: cleanupError } = await supabase.rpc('cleanup_old_news')
    if (cleanupError) {
      // Don't fail the whole refresh just because cleanup failed, but surface it.
      console.error('cleanup_old_news RPC error (non-fatal):', cleanupError)
    }

    return NextResponse.json({ success: true, count: toInsertArticles.length })
  } catch (err) {
    console.error('News refresh error:', err)
    // Supabase errors are plain objects (not Error instances), so extract a
    // useful message from the common shapes instead of falling back to
    // "Unknown error" which hides the real cause.
    const message =
      err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : JSON.stringify(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
