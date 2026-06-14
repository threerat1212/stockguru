import { DEFAULT_AGENT_LOOP_SYMBOLS, type AgentLoopMode, type Timeframe } from '../types'
import type { DebateIntent, DebateSeed, MiroFishDebateRequest } from './types'

const THAI_SYMBOL_MAP: Record<string, string> = {
  พีทีที: 'PTT.BK',
  ปตท: 'PTT.BK',
  เอสซีบี: 'SCB.BK',
  ไทยพาณิชย์: 'SCB.BK',
  กสิกร: 'KBANK.BK',
  ธนาคารกสิกร: 'KBANK.BK',
  บีบีแอล: 'BBL.BK',
  ธนาคารกรุงเทพ: 'BBL.BK',
  ซีพีออลล์: 'CPALL.BK',
  เซเว่น: 'CPALL.BK',
  ท่าอากาศยาน: 'AOT.BK',
  ทอท: 'AOT.BK',
  แอดวานซ์: 'ADVANC.BK',
  เอไอเอส: 'ADVANC.BK',
  ดิจิทัล: 'DELTA.BK',
  เดลต้า: 'DELTA.BK',
}

const SYMBOL_PATTERN = /\b[A-Z]{1,6}(?:\.[A-Z]{2})?\b/g
const COMMON_ENGLISH_WORDS = new Set(['AI', 'BUBBLE', 'ETF', 'USD', 'THB', 'FED', 'MACRO', 'TECH', 'TECHNICAL', 'SET', 'SET50', 'ALL', 'TIME', 'MARKET'])
const SCENARIO_PROSE_WORDS = new Set(['ARPU', 'CAPEX', 'CORE', 'COST', 'GROWTH', 'HEDGE', 'MARGIN', 'NPL', 'PROXY', 'STORY', 'THESIS', 'TRAP', 'VALUE', 'YIELD'])

function normalizeSymbolInput(symbol: string) {
  const clean = symbol.trim().toUpperCase().replace(/^@/, '').replace(/\s+/g, '')
  if (!clean) return ''
  if (clean.includes('.')) return clean
  const foreign = new Set(['AAPL', 'MSFT', 'NVDA', 'TSLA', 'GOOGL', 'AMZN', 'META', 'AMD', 'JPM', 'BABA'])
  return foreign.has(clean) ? clean : `${clean}.BK`
}

function extractSymbols(question: string) {
  const mappedSymbols = Object.entries(THAI_SYMBOL_MAP)
    .filter(([keyword]) => question.includes(keyword))
    .map(([, symbol]) => symbol)

  const tokenSymbols = Array.from(question.toUpperCase().matchAll(SYMBOL_PATTERN))
    .map((match) => normalizeSymbolInput(match[0]))
    .filter((symbol) => {
      const raw = symbol.replace(/\.BK$/, '')
      return !COMMON_ENGLISH_WORDS.has(raw) && !SCENARIO_PROSE_WORDS.has(raw)
    })

  return Array.from(new Set([...mappedSymbols, ...tokenSymbols])).slice(0, 8)
}

function extractTimeframe(question: string): Timeframe {
  if (/\b1D\b|วันนี้|รายวัน|intraday/i.test(question)) return '1D'
  if (/\b1W\b|สัปดาห์|สัปดาห์|week/i.test(question)) return '1W'
  if (/\b3M\b|3 เดือน|สามเดือน/i.test(question)) return '3M'
  if (/\b6M\b|6 เดือน|หกเดือน/i.test(question)) return '6M'
  if (/\b1Y\b|1 ปี|หนึ่งปี|year/i.test(question)) return '1Y'
  if (/\bALL\b|all time|ทุกช่วง/i.test(question)) return 'ALL'
  if (/\b1M\b|เดือน|month/i.test(question)) return '1M'
  return '3M'
}

function extractIntent(question: string): DebateIntent {
  const q = question.toLowerCase()
  if (/(กราฟ|แนวรับ|แนวต้าน|rsi|momentum|technical|เทคนิค)/i.test(q)) return 'technical'
  if (/(งบ|pe|valuation|dividend|กำไร|รายได้|fundamental|พื้นฐาน)/i.test(q)) return 'fundamental'
  if (/(ข่าว|catalyst|sentiment|sentiment|ข่าวลบ|ข่าวดี)/i.test(q)) return 'news'
  if (/(เสี่ยง|ความเสี่ยง|risk|downside|กระทบ|ผลกระทบ|ระวัง|watch out)/i.test(q)) return 'risk'
  if (/(พอร์ต|portfolio|holding|น้ำหนัก|ถัวเฉลี่ย)/i.test(q)) return 'portfolio'
  if (/(กระทบ|scenario|ถ้า|หาก|what if|น้ำมัน|บาท|ดอกเบี้ย|เฟด|inflation|เงินเฟ้อ)/i.test(q)) return 'impact'
  return 'general'
}

function intentLabel(intent: DebateIntent) {
  const labels: Record<DebateIntent, string> = {
    impact: 'scenario impact',
    technical: 'technical review',
    fundamental: 'fundamental review',
    news: 'news/sentiment review',
    risk: 'risk review',
    portfolio: 'portfolio review',
    general: 'market discussion',
  }
  return labels[intent]
}

function inferMode(question: string, symbols: string[], explicitMode?: AgentLoopMode): AgentLoopMode {
  if (explicitMode) return explicitMode
  if (/(พอร์ต|portfolio|holding|น้ำหนัก)/i.test(question)) return 'portfolio'
  if (symbols.length === 0 && /(ตลาด|set|set50|ภาพรวม|macro|ทั้งตลาด)/i.test(question)) return 'market'
  return symbols.length ? 'custom' : 'market'
}

export function extractDebateSeed(input: MiroFishDebateRequest): DebateSeed {
  const question = input.question.trim()
  const symbols = Array.from(new Set([...(input.symbols ?? []), ...extractSymbols(question)]))
    .map(normalizeSymbolInput)
    .filter(Boolean)
  const dedupedSymbols = Array.from(new Set(symbols)).slice(0, 8)
  const fallbackSymbols = dedupedSymbols.length ? dedupedSymbols : DEFAULT_AGENT_LOOP_SYMBOLS
  const scenario = input.scenario?.trim() || question
  const timeframe = input.timeframe ?? extractTimeframe(question)
  const intent = extractIntent(question)

  return {
    question,
    symbols: fallbackSymbols,
    scenario,
    timeframe,
    mode: inferMode(question, dedupedSymbols, input.mode),
    intent,
    intentLabel: intentLabel(intent),
  }
}

export function normalizeDebateSymbols(symbols: string[]) {
  return Array.from(new Set(symbols.map(normalizeSymbolInput).filter(Boolean))).slice(0, 8)
}
