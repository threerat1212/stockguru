import { formatCurrency, formatPercent, formatVolume } from '@/lib/utils/format'
import type { StockCandle, StockQuote } from '@/types/stock'
import { AGENT_LOOP_DISCLAIMER, type AgentEvidence, type AgentLoopContext, type AgentLoopHoldingInput, type AgentResult, type VerificationResult } from './types'

function latestCandle(candles: StockCandle[]) {
  return candles[candles.length - 1]
}

function average(values: number[]) {
  if (!values.length) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function sma(candles: StockCandle[], period: number) {
  const slice = candles.slice(-period)
  if (slice.length < Math.max(5, Math.floor(period * 0.6))) return null
  return average(slice.map((candle) => candle.close))
}

function rsi(candles: StockCandle[]) {
  if (candles.length < 15) return null
  const changes = []
  for (let i = 1; i < candles.length; i += 1) {
    changes.push(candles[i].close - candles[i - 1].close)
  }
  const gains = changes.filter((change) => change > 0)
  const losses = changes.filter((change) => change < 0).map((change) => Math.abs(change))
  const avgGain = average(gains) ?? 0
  const avgLoss = average(losses) ?? 0
  if (avgLoss === 0) return avgGain > 0 ? 100 : 50
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

function trendLabel(changePercent: number, rsiValue: number | null, aboveSma20: boolean | null) {
  if (changePercent < -1.5 && rsiValue !== null && rsiValue < 35) return 'bearish'
  if (changePercent > 1.5 && rsiValue !== null && rsiValue > 55 && aboveSma20 !== false) return 'bullish'
  if (Math.abs(changePercent) <= 0.5) return 'neutral'
  return changePercent > 0 ? 'bullish' : 'bearish'
}

function quoteEvidence(symbol: string, quote: StockQuote): AgentEvidence[] {
  return [
    { label: `${symbol} ราคา`, value: formatCurrency(quote.price, quote.currency), source: 'market_data' },
    { label: `${symbol} เปลี่ยนแปลง`, value: formatPercent(quote.changePercent), source: 'market_data' },
    { label: `${symbol} volume`, value: formatVolume(quote.volume), source: 'market_data' },
  ]
}

function historyEvidence(symbol: string, candles: StockCandle[]) {
  const last = latestCandle(candles)
  if (!last) return []
  return [
    { label: `${symbol} candle ล่าสุด`, value: `${last.time} close ${formatCurrency(last.close, 'THB')}`, source: 'history' },
    { label: `${symbol} จำนวน candle`, value: String(candles.length), source: 'history' },
  ]
}

export function runDataAgent(context: AgentLoopContext): AgentResult {
  const available = context.quotes.filter((item) => item.quote).length
  const errors = context.quotes.filter((item) => item.error).map((item) => item.error)
  const evidence: AgentEvidence[] = [
    { label: 'โหมด', value: context.mode, source: 'user_input' },
    { label: 'หุ้นที่วิเคราะห์', value: context.symbols.join(', '), source: 'user_input' },
    { label: 'timeframe', value: context.timeframe, source: 'user_input' },
  ]

  context.quotes.forEach((item) => {
    if (item.quote) evidence.push(...quoteEvidence(item.symbol, item.quote))
  })

  const findings = [
    `ดึงข้อมูล ${available}/${context.symbols.length} สัญลักษณ์สำเร็จ`,
    `scenario: ${context.scenario || 'ไม่มี scenario เฉพาะ — ใช้กรอบความเสี่ยงมาตรฐาน'}`,
  ]

  return {
    id: 'data',
    role: 'data',
    label: 'Data Agent',
    status: available === context.symbols.length ? 'pass' : 'needs_review',
    confidence: available === context.symbols.length ? 78 : 55,
    summary: available === context.symbols.length
      ? 'Data Agent ดึงราคาและประวัติได้ครบตามขอบเขต MVP'
      : `Data Agent ดึงข้อมูลได้ไม่ครบ ${errors.length ? `(${errors[0]})` : ''}`,
    findings,
    risks: context.isDemo
      ? ['ข้อมูลบางส่วนอาจเป็น fallback/demo ต้องดู badge และ source ก่อนใช้อ้างอิง']
      : ['ข้อมูลตลาดหุ้นมีความล่าช้า/คลาดเคลื่อนได้ ต้องเช็กกับแหล่งข้อมูลหลัก'],
    evidence,
  }
}

export function runTechnicalAgent(context: AgentLoopContext): AgentResult {
  const evidence: AgentEvidence[] = []
  const findings: string[] = []
  const risks: string[] = []

  context.histories.forEach((item) => {
    const candles = item.candles
    const last = latestCandle(candles)
    const quote = context.quotes.find((q) => q.symbol === item.symbol)?.quote
    const changePercent = quote?.changePercent ?? (last ? ((last.close - (candles[candles.length - 2]?.close ?? last.close)) / (candles[candles.length - 2]?.close ?? last.close)) * 100 : 0)
    const sma20 = sma(candles, 20)
    const sma50 = sma(candles, 50)
    const rsiValue = rsi(candles)
    const aboveSma20 = last && sma20 ? last.close > sma20 : null
    const trend = trendLabel(changePercent, rsiValue, aboveSma20)
    const volumeAvg = average(candles.slice(-20).map((candle) => candle.volume))
    const volumeSpike = last && volumeAvg ? last.volume > volumeAvg * 1.5 : false

    if (last) {
      evidence.push(
        { label: `${item.symbol} close ล่าสุด`, value: formatCurrency(last.close, 'THB'), source: 'history' },
        { label: `${item.symbol} SMA20`, value: sma20 ? formatCurrency(sma20, 'THB') : 'ไม่พอข้อมูล', source: 'heuristic' },
        { label: `${item.symbol} SMA50`, value: sma50 ? formatCurrency(sma50, 'THB') : 'ไม่พอข้อมูล', source: 'heuristic' },
        { label: `${item.symbol} RSI`, value: rsiValue ? rsiValue.toFixed(1) : 'ไม่พอข้อมูล', source: 'heuristic' }
      )
      findings.push(`${item.symbol}: trend ${trend}, change ${formatPercent(changePercent)}, volume ${volumeSpike ? 'spike' : 'normal'}`)
    }

    if (trend === 'bearish') risks.push(`${item.symbol}: โมเมนตัมเชิงเทคนิคอ่อน และควรเช็กแนวรับ/ข่าวลบ`)
    if (volumeSpike) risks.push(`${item.symbol}: volume spike อาจมาจากข่าวหรือแรงซื้อขายระยะสั้น`)
    if (!last) risks.push(`${item.symbol}: ไม่มีประวัติราคาพอให้วิเคราะห์เทคนิค`)
  })

  return {
    id: 'technical',
    role: 'technical',
    label: 'Technical Agent',
    status: risks.length ? 'needs_review' : 'pass',
    confidence: evidence.length >= context.symbols.length * 3 ? 70 : 45,
    summary: 'Technical Agent ดู price action, SMA20/SMA50, RSI และ volume เบื้องต้น',
    findings,
    risks,
    evidence,
  }
}

export function runFundamentalAgent(context: AgentLoopContext): AgentResult {
  const evidence: AgentEvidence[] = []
  const findings: string[] = []
  const risks: string[] = []

  context.quotes.forEach((item) => {
    const quote = item.quote
    if (!quote) {
      risks.push(`${item.symbol}: ไม่มี quote data สำหรับประเมิน valuation เบื้องต้น`)
      return
    }

    evidence.push(
      { label: `${item.symbol} PE`, value: quote.pe ? quote.pe.toFixed(1) : 'ไม่มีข้อมูล', source: 'market_data' },
      { label: `${item.symbol} market cap`, value: quote.marketCap ? formatCurrency(quote.marketCap, quote.currency) : 'ไม่มีข้อมูล', source: 'market_data' }
    )

    if (quote.pe && quote.pe < 15) findings.push(`${item.symbol}: PE ต่ำกว่า 15x — เป็น candidate ที่ต้องดูคุณภาพกำไรต่อ`)
    else if (quote.pe && quote.pe > 35) {
      findings.push(`${item.symbol}: PE สูงกว่า 35x — valuation ต้องพึ่ง growth สูง`)
      risks.push(`${item.symbol}: valuation premium ถ้ากำไรไม่โตตามคาด ราคาอาจโดน compress`)
    } else findings.push(`${item.symbol}: valuation อยู่ในช่วงที่ต้องเทียบกับ peer และ growth`)

    if (quote.marketCap && quote.marketCap < 10_000_000_000) {
      risks.push(`${item.symbol}: market cap เล็ก — liquidity และ bid/ask spread อาจเป็นความเสี่ยง`)
    }
  })

  return {
    id: 'fundamental',
    role: 'fundamental',
    label: 'Fundamental Agent',
    status: risks.length ? 'needs_review' : 'pass',
    confidence: evidence.length >= context.symbols.length * 2 ? 66 : 48,
    summary: 'Fundamental Agent ใช้ PE, market cap และ liquidity proxy เพื่อตั้งคำถามต่อ ไม่ใช่ฟันธงคุณค่าหุ้น',
    findings,
    risks,
    evidence,
  }
}

export function runNewsAgent(context: AgentLoopContext): AgentResult {
  const evidence = context.news.map((article) => ({
    label: article.title,
    value: article.impact || article.summary,
    source: 'news' as const,
  }))

  const findings = context.news.length
    ? context.news.map((article) => `${article.source}: ${article.title}`)
    : ['ไม่พบข่าวในชุด demo ที่ตรงกับ watchlist/scenario — News Agent จึงไม่ดึงข่าวสดเพิ่มใน MVP นี้']

  const risks = context.news.length
    ? ['ข่าวเป็นชุด demo/curated ใน MVP ต้องเชื่อม news provider จริงก่อนใช้กับ production']
    : ['ไม่มีข่าวสดใน loop นี้ ต้องเช็กข่าวแยกก่อนตัดสินใจ']

  return {
    id: 'news',
    role: 'news',
    label: 'News Agent',
    status: context.news.length ? 'pass' : 'needs_review',
    confidence: context.news.length ? 62 : 40,
    summary: 'News Agent จัดกลุ่มข่าวที่เกี่ยวข้องกับสัญลักษณ์/scenario และแยก impact เบื้องต้น',
    findings,
    risks,
    evidence,
  }
}

export function runRiskAgent(context: AgentLoopContext, technical: AgentResult, fundamental: AgentResult, news: AgentResult): AgentResult {
  const risks = [
    ...technical.risks,
    ...fundamental.risks,
    ...news.risks,
    'AI loop ไม่ควรใช้แทนการอ่านงบ ข่าวประกาศ และกราฟด้วยตนเอง',
  ]
  const uniqueRisks = Array.from(new Set(risks)).slice(0, 8)
  const reviewCount = [technical, fundamental, news].filter((agent) => agent.status === 'needs_review').length

  return {
    id: 'risk',
    role: 'risk',
    label: 'Risk Agent',
    status: reviewCount >= 2 ? 'needs_review' : 'pass',
    confidence: reviewCount >= 2 ? 58 : 72,
    summary: 'Risk Agent รวมสัญญาณเทคนิค งบเบื้องต้น ข่าว และขอบเขต scenario เพื่อจัดความเสี่ยงที่ต้องตรวจต่อ',
    findings: [`พบประเด็นเฝ้าระวัง ${uniqueRisks.length} ข้อ`],
    risks: uniqueRisks,
    evidence: [
      { label: 'technical findings', value: technical.findings.length ? technical.findings.join('; ') : 'ไม่มี', source: 'heuristic' },
      { label: 'fundamental findings', value: fundamental.findings.length ? fundamental.findings.join('; ') : 'ไม่มี', source: 'heuristic' },
      { label: 'news findings', value: news.findings.length ? news.findings.join('; ') : 'ไม่มี', source: 'heuristic' },
      { label: 'scenario', value: context.scenario || 'standard risk checklist', source: 'user_input' },
    ],
  }
}

export function runPortfolioAgent(context: AgentLoopContext): AgentResult {
  const holdings = context.holdings ?? []
  const evidence = holdings.map((holding) => ({
    label: holding.symbol,
    value: holding.quantity && holding.buyPrice ? `${holding.quantity} หุ้น @ ${formatCurrency(holding.buyPrice, 'THB')}` : 'ไม่มี quantity/buyPrice',
    source: 'user_input' as const,
  }))

  if (!holdings.length) {
    return {
      id: 'portfolio',
      role: 'portfolio',
      label: 'Portfolio Agent',
      status: 'needs_review',
      confidence: 45,
      summary: 'Portfolio Agent ไม่พบ holding input ในรอบนี้ จึงวิเคราะห์เฉพาะ watchlist/scenario',
      findings: ['ถ้าต้องการ portfolio drill ให้ส่ง holding quantity/buyPrice หรือเชื่อม portfolio page'],
      risks: ['ไม่มีการคำนวณ concentration หรือ PnL impact เพราะไม่มีข้อมูลพอร์ต'],
      evidence,
    }
  }

  const symbols = new Set(holdings.map((holding) => holding.symbol))
  const missing = holdings.filter((holding) => !context.symbols.includes(holding.symbol))
  if (missing.length) {
    return {
      id: 'portfolio',
      role: 'portfolio',
      label: 'Portfolio Agent',
      status: 'needs_review',
      confidence: 52,
      summary: 'Portfolio Agent พบ holding ที่ไม่อยู่ใน symbols list จึงต้องใช้ watchlist/default symbols ร่วมด้วย',
      findings: [`holding ${missing.map((h) => h.symbol).join(', ')} ไม่มี quote/history ในรอบนี้`],
      risks: ['portfolio risk drill ไม่ครบทุก holding'],
      evidence,
    }
  }

  const topHolding = holdings[0]?.symbol ?? '—'
  return {
    id: 'portfolio',
    role: 'portfolio',
    label: 'Portfolio Agent',
    status: 'pass',
    confidence: 68,
    summary: `Portfolio Agent ตรวจ holding ${holdings.length} รายการ; top weight proxy คือ ${topHolding}`,
    findings: [`holding count: ${holdings.length}`, `symbols coverage: ${symbols.size}/${context.symbols.length}`],
    risks: ['MVP ยังใช้ quantity/buyPrice เป็น proxy เท่านั้น ยังไม่ใช่ full portfolio optimization'],
    evidence,
  }
}

export function runReportAgent(context: AgentLoopContext, agents: AgentResult[], risk: AgentResult): { summary: string; thesis: string; suggestedChecks: string[]; confidence: number } {
  const positiveAgents = agents.filter((agent) => agent.status === 'pass').length
  const reviewAgents = agents.filter((agent) => agent.status === 'needs_review').length
  const confidence = Math.max(45, Math.min(82, 74 + positiveAgents * 2 - reviewAgents * 5 - (context.isDemo ? 8 : 0)))
  const topRisks = risk.risks.slice(0, 3)

  const thesis = reviewAgents > 0
    ? 'ภาพรวมยังไม่ควรสรุปแรง ให้ใช้รอบนี้เป็น checklist เพื่อเช็กข้อมูลต่อ'
    : 'ภาพรวมมีข้อมูลพอให้ทำ scenario review ได้ แต่ยังคงเป็น decision support ไม่ใช่คำแนะนำซื้อขาย'

  return {
    summary: `Closed Loop วิเคราะห์ ${context.symbols.length} สัญลักษณ์ ด้วย Data → Technical → Fundamental → News → Risk → Portfolio → Report → Verifier โดยเน้น “สิ่งที่ต้องเช็กต่อ” มากกว่าการฟันธงทิศทางราคา`,
    thesis,
    suggestedChecks: [
      topRisks[0] ?? 'เช็กข่าวประกาศล่าสุดจากแหล่งข้อมูลหลัก',
      topRisks[1] ?? 'เทียบกับกราฟและแนวรับ/แนวต้านด้วยตนเอง',
      topRisks[2] ?? 'ตรวจสอบงบ/valuation/liquidity ก่อนใช้ข้อมูลต่อ',
      'บันทึกผลลัพธ์เข้า journal พร้อมเหตุผลและสมมติฐาน',
    ],
    confidence,
  }
}

export const AGENT_LOOP_SAFETY_COPY = AGENT_LOOP_DISCLAIMER
