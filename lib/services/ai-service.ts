import type { AIAnalysis, ChatMessage, StockQuote, StockCandle } from '@/types/stock'
import { analysisCache } from '@/lib/cache'

// Pay-as-you-go (sk-) keys use api.xiaomimimo.com; Token Plan (tp-) keys use a
// cluster-specific host (e.g. token-plan-sgp.xiaomimimo.com). Override via env.
const MIMO_BASE_URL = (process.env.MIMO_BASE_URL ?? 'https://api.xiaomimimo.com/v1').replace(/\/$/, '')
const MIMO_API_URL = `${MIMO_BASE_URL}/chat/completions`
const MIMO_MODEL = 'mimo-v2.5-pro'

function getApiKey(): string | null {
  return process.env.MIMO_API_KEY ?? null
}

async function callMimo(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  temperature = 0.7,
  maxTokens = 2000
): Promise<string> {
  const response = await fetch(MIMO_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: MIMO_MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    await response.text()
    throw new Error(`MiMo API error ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}

/**
 * Build a technical summary string from quote + candles for the AI prompt
 */
function buildTechnicalContext(quote: StockQuote, candles: StockCandle[]): string {
  const recent = candles.slice(-20)
  const sma5 = recent.slice(-5).reduce((s, c) => s + c.close, 0) / Math.min(5, recent.length)
  const sma20 = recent.reduce((s, c) => s + c.close, 0) / recent.length
  const recentHigh = Math.max(...recent.map((c) => c.high))
  const recentLow = Math.min(...recent.map((c) => c.low))
  const avgVolume = recent.reduce((s, c) => s + c.volume, 0) / recent.length

  return `
Stock: ${quote.symbol} (${quote.name})
Current Price: ${quote.price} ${quote.currency}
Change: ${quote.change} (${quote.changePercent.toFixed(2)}%)
Open: ${quote.open} | High: ${quote.high} | Low: ${quote.low}
Previous Close: ${quote.previousClose}
Volume: ${quote.volume.toLocaleString()}
Market Cap: ${quote.marketCap?.toLocaleString() ?? 'N/A'}
P/E Ratio: ${quote.pe?.toFixed(2) ?? 'N/A'}
52-Week High: ${quote.week52High ?? 'N/A'} | Low: ${quote.week52Low ?? 'N/A'}

Technical Data (last ${recent.length} periods):
SMA(5): ${sma5.toFixed(2)}
SMA(20): ${sma20.toFixed(2)}
Recent High: ${recentHigh.toFixed(2)}
Recent Low: ${recentLow.toFixed(2)}
Average Volume: ${avgVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}

Price History (last 10 periods):
${candles
  .slice(-10)
  .map((c) => `  ${c.time}: O=${c.open} H=${c.high} L=${c.low} C=${c.close} V=${c.volume}`)
  .join('\n')}
`.trim()
}

function generateMockAnalysis(symbol: string, quote: StockQuote, candles: StockCandle[]): AIAnalysis {
  const recent = candles.slice(-20)
  const sma5 = recent.slice(-5).reduce((s, c) => s + c.close, 0) / Math.min(5, recent.length)
  const sma20 = recent.reduce((s, c) => s + c.close, 0) / recent.length
  const price = quote.price
  const changePct = quote.changePercent

  const isBullish = changePct > 0 && price > sma5 && sma5 > sma20
  const isBearish = changePct < 0 && price < sma5 && sma5 < sma20
  const trend = isBullish ? 'bullish' : isBearish ? 'bearish' : 'neutral'
  const view = isBullish ? 'bullish_momentum' : isBearish ? 'bearish_momentum' : 'neutral_consolidation'
  const confidence = Math.min(85, Math.max(40, Math.abs(changePct) * 5 + 40))

  const support1 = Math.round(Math.min(price * 0.97, sma20 * 0.98) * 100) / 100
  const support2 = Math.round(Math.min(price * 0.94, sma20 * 0.95) * 100) / 100
  const resistance1 = Math.round(Math.max(price * 1.03, sma20 * 1.02) * 100) / 100
  const resistance2 = Math.round(Math.max(price * 1.06, sma20 * 1.05) * 100) / 100

  const summaries: Record<string, string> = {
    bullish: `${quote.name} (${symbol}) แสดงแนวโน้มบวกจากราคาเหนือค่าเฉลี่ยระยะสั้นและระยะยาว มูลค่าการซื้อขายสนับสนุนแนวโน้มขาขึ้น`,
    bearish: `${quote.name} (${symbol}) อยู่ในแนวโน้มลดลงเมื่อเทียบกับค่าเฉลี่ย ควรระมัดระวังและรอสัญญาณกลับตัว`,
    neutral: `${quote.name} (${symbol}) อยู่ในช่วงสร้างฐานราคา แนวโน้มยังไม่ชัดเจน ควรรอดูทิศทางการเคลื่อนไหวต่อไป`,
  }

  const ta: Record<string, string> = {
    bullish: `จากการวิเคราะห์ทางเทคนิค ราคาปัจจุบัน ${price} อยู่เหนือ SMA(5) ที่ ${sma5.toFixed(2)} และ SMA(20) ที่ ${sma20.toFixed(2)} ซึ่งเป็นสัญญาณขาขึ้นระยะสั้น แนวรับแรกอยู่ที่ ${support1} และแนวต้านแรกที่ ${resistance1} หากราคายืนเหนือแนวต้านได้ มีโอกาสปรับตัวขึ้นต่อ`,
    bearish: `ราคาปัจจุบัน ${price} ต่ำกว่า SMA(5) ${sma5.toFixed(2)} และ SMA(20) ${sma20.toFixed(2)} แสดงแนวโน้มขาลง แนวรับ ${support1} และ ${support2} เป็นจุดที่ต้องจับตา หากหลุดแนวรับอาจมีแรงขายเพิ่ม ควรรอข้อมูลยืนยันการกลับตัวก่อนประเมินต่อ`,
    neutral: `ราคา ${price} เคลื่อนไหวใกล้ค่าเฉลี่ย SMA(5) ${sma5.toFixed(2)} และ SMA(20) ${sma20.toFixed(2)} ยังไม่มีสัญญาณชัดเจน แนวรับ ${support1} และแนวต้าน ${resistance1} เป็นกรอบการเคลื่อนไหวที่สำคัญ ควรรอดูการยืนยันจาก volume และข่าวที่เกี่ยวข้อง`,
  }

  const risks: Record<string, string> = {
    bullish: 'ความเสี่ยงหลักคือการถอยตัวของราคาหากขาดแรงซื้อเข้าสนับสนุน ตลาดโดยรวมและข่าวสารภายนอกอาจกระทบแนวโน้ม ควรมีจุดตัดขาดทุน (Stop Loss) ใต้แนวรับ',
    bearish: 'ความเสี่ยงจากแรงขายต่อเนื่องหรือข่าวลบ อาจมี dead cat bounce ที่หลอกลวง ควรรอสัญญาณกลับตัวที่ชัดเจนและยืนยันด้วย volume',
    neutral: 'ความเสี่ยงจากการเคลื่อนไหว sideways ที่ทำให้เสียโอกาสและเวลา หรืออาจมีการ breakout ปลอม (false breakout) ควรยืนยันด้วย volume และบริบทตลาดก่อนประเมินต่อ',
  }

  const keyPointsBullish = [
    'ราคาอยู่เหนือค่าเฉลี่ยระยะสั้นและระยะยาว',
    'แนวโน้มเป็นขาขึ้นระยะสั้น',
    `แนวรับ ${support1} / แนวต้าน ${resistance1}`,
    'ควรตั้ง Stop Loss ใต้แนวรับแรก',
  ]
  const keyPointsBearish = [
    'ราคาต่ำกว่าค่าเฉลี่ยระยะสั้นและระยะยาว',
    'แนวโน้มเป็นขาลงระยะสั้น',
    `แนวรับ ${support1} / แนวต้าน ${resistance1}`,
    'รอข้อมูลยืนยันการกลับตัวที่ชัดเจนก่อนประเมินต่อ',
  ]
  const keyPointsNeutral = [
    'ราคาเคลื่อนไหวในกรอบแคบ',
    'รอ breakout ก่อนตัดสินใจ',
    `แนวรับ ${support1} / แนวต้าน ${resistance1}`,
    'ยืนยันสัญญาณด้วยปริมาณการซื้อขาย (Volume)',
  ]

  return {
    symbol,
    trend,
    view,
    confidence: Math.round(confidence),
    support: [support1, support2],
    resistance: [resistance1, resistance2],
    summary: summaries[trend],
    technicalAnalysis: ta[trend],
    riskAssessment: risks[trend],
    keyPoints: trend === 'bullish' ? keyPointsBullish : trend === 'bearish' ? keyPointsBearish : keyPointsNeutral,
    disclaimer: 'ข้อมูลนี้เพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำการลงทุน ผู้ใช้ควรศึกษาข้อมูลเพิ่มเติมและใช้วิจารณญาณก่อนตัดสินใจ',
    isDemo: true,
  }
}

/**
 * Generate AI analysis for a stock
 */
export async function analyzeStock(
  symbol: string,
  quote: StockQuote,
  candles: StockCandle[]
): Promise<AIAnalysis> {
  const cacheKey = `analysis:${symbol}`
  const cached = analysisCache.get<AIAnalysis>(cacheKey)
  if (cached) return cached.data

  // If no API key, return realistic mock analysis immediately
  if (!getApiKey()) {
    const mock = generateMockAnalysis(symbol, quote, candles)
    analysisCache.set(cacheKey, mock)
    return mock
  }

  const technicalContext = buildTechnicalContext(quote, candles)

  const systemPrompt = `You are StockGuru, a stock data analysis assistant. You summarize technical indicators and market data. You NEVER give buy/sell advice. You always include a disclaimer that this is not financial advice. Respond in Thai. Always respond in valid JSON format.`

  const userPrompt = `Analyze the following stock and summarize the technical context.

${technicalContext}

Respond with ONLY a valid JSON object (no markdown, no code fences) with these exact fields:
{
  "trend": "bullish" | "bearish" | "neutral",
  "view": "bullish_momentum" | "bearish_momentum" | "neutral_consolidation",
  "confidence": <number 0-100>,
  "support": [<number>, <number>],
  "resistance": [<number>, <number>],
  "summary": "<2-3 sentence overview in Thai>",
  "technicalAnalysis": "<detailed technical context paragraph in Thai>",
  "riskAssessment": "<risk factors paragraph in Thai>",
  "keyPoints": ["<point1>", "<point2>", "<point3>", "<point4>"],
  "disclaimer": "<disclaimer in Thai that this is not financial advice>"
}`

  try {
    const response = await callMimo(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      0.3,
      1500
    )

    // Parse JSON from response, handling possible markdown fences
    let jsonStr = response.trim()
    if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    }

    const parsed = JSON.parse(jsonStr)

    const analysis: AIAnalysis = {
      symbol,
      trend: ['bullish', 'bearish', 'neutral'].includes(parsed.trend) ? parsed.trend : 'neutral',
      view: ['bullish_momentum', 'bearish_momentum', 'neutral_consolidation'].includes(parsed.view)
        ? parsed.view
        : 'neutral_consolidation',
      confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 50)),
      support: Array.isArray(parsed.support) ? parsed.support.slice(0, 3) : [],
      resistance: Array.isArray(parsed.resistance) ? parsed.resistance.slice(0, 3) : [],
      summary: String(parsed.summary || 'Analysis unavailable.'),
      technicalAnalysis: String(parsed.technicalAnalysis || 'Technical analysis unavailable.'),
      riskAssessment: String(parsed.riskAssessment || 'Risk assessment unavailable.'),
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, 6) : [],
      disclaimer: String(parsed.disclaimer || 'ข้อมูลนี้เพื่อการศึกษาเท่านั้น ไม่ใช่คำแนะนำการลงทุน'),
      isDemo: false,
    }

    analysisCache.set(cacheKey, analysis)
    return analysis
  } catch (error) {
    // If AI fails, return realistic mock analysis instead of error
    console.error(`AI analysis failed for ${symbol}:`, error)
    const mock = generateMockAnalysis(symbol, quote, candles)
    analysisCache.set(cacheKey, mock)
    return mock
  }
}

/**
 * AI chat: answer user questions about stocks / market
 */
export async function chatCompletion(
  messages: ChatMessage[],
  context?: { symbol?: string; quote?: StockQuote }
): Promise<string> {
  const systemMessage = `You are StockGuru AI, a knowledgeable stock market assistant. You help users understand stocks, market trends, technical indicators, and investment concepts. Be concise, clear, and helpful. Always remind users that your analysis is for informational purposes only and not financial advice.${
    context?.symbol
      ? `\n\nThe user is currently looking at ${context.symbol}${
          context.quote
            ? ` (Price: ${context.quote.price} ${context.quote.currency}, Change: ${context.quote.changePercent.toFixed(2)}%)`
            : ''
        }.`
      : ''
  }`

  const apiMessages = [
    { role: 'system' as const, content: systemMessage },
    ...messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ]

  return callMimo(apiMessages, 0.7, 2000)
}

/**
 * Generate market news summary
 */
export async function generateMarketSummary(): Promise<string> {
  const systemPrompt = `You are StockGuru, a market analyst. Provide a brief, informative market summary.`

  const userPrompt = `Provide a brief market summary covering:
1. Overall market sentiment today
2. Key sectors to watch
3. Major events or catalysts
4. A short outlook

Keep it under 200 words. Be informative but concise.`

  try {
    return await callMimo(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      0.7,
      500
    )
  } catch {
    return 'Market summary is temporarily unavailable. Please check back later.'
  }
}
