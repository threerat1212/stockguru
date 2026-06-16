import type { AgentResult } from '../types'
import type { DebateSeed } from '../mirofish/types'

export interface MimoChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface MimoCompletionOptions {
  messages: MimoChatMessage[]
  temperature?: number
  maxTokens?: number
}

export interface MimoReporterDraft {
  summary: string
  thesis: string
  suggestedChecks: string[]
  confidence: number
}

const MIMO_BASE_URL = (process.env.MIMO_BASE_URL ?? 'https://api.xiaomimimo.com/v1').replace(/\/$/, '')
const MIMO_API_URL = `${MIMO_BASE_URL}/chat/completions`
const MIMO_MODEL = 'mimo-v2.5-pro'

function getMimoApiKey() {
  return process.env.MIMO_API_KEY ?? null
}

function getTimeoutMs() {
  const value = Number(process.env.MIMO_TIMEOUT_MS ?? 20000)
  return Number.isFinite(value) && value > 0 ? value : 20000
}

function parseReporterDraft(content: string): MimoReporterDraft | null {
  let raw = content.trim()
  if (raw.startsWith('```')) {
    raw = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  }

  try {
    const parsed = JSON.parse(raw) as Partial<MimoReporterDraft>
    const summary = typeof parsed.summary === 'string' && parsed.summary.trim() ? parsed.summary.trim() : ''
    const thesis = typeof parsed.thesis === 'string' && parsed.thesis.trim() ? parsed.thesis.trim() : ''
    const suggestedChecks = Array.isArray(parsed.suggestedChecks)
      ? parsed.suggestedChecks.map((item) => String(item)).filter(Boolean).slice(0, 5)
      : []
    const confidence = Math.min(100, Math.max(0, Number(parsed.confidence) || 0))

    if (!summary || !thesis || suggestedChecks.length === 0) return null
    return { summary, thesis, suggestedChecks, confidence }
  } catch {
    return null
  }
}

export async function callMimoChatCompletion(options: MimoCompletionOptions): Promise<string> {
  const apiKey = getMimoApiKey()
  if (!apiKey) throw new Error('MIMO_API_KEY is not configured')

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), getTimeoutMs())

  try {
    const response = await fetch(MIMO_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MIMO_MODEL,
        messages: options.messages,
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 700,
      }),
      signal: controller.signal,
    })

    const text = await response.text()
    if (!response.ok) {
      throw new Error(`MiMo API error ${response.status}`)
    }

    const data = JSON.parse(text) as { choices?: Array<{ message?: { content?: string } }> }
    return data.choices?.[0]?.message?.content ?? ''
  } finally {
    clearTimeout(timeout)
  }
}

function buildReporterPrompt(seed: DebateSeed, agents: AgentResult[]) {
  const agentLines = agents
    .map((agent) => {
      const findings = agent.findings.map((item) => `- ${item}`).join('\n') || '- ไม่มี finding'
      const risks = agent.risks.map((item) => `- ${item}`).join('\n') || '- ไม่มี risk ที่ชัดเจน'
      return `### ${agent.label}\nstatus: ${agent.status}\nconfidence: ${agent.confidence}\n\n${findings}\n\nRisks:\n${risks}`
    })
    .join('\n\n')

  return `คำถาม user: ${seed.question}
symbols: ${seed.symbols.join(', ') || 'none'}
scenario: ${seed.scenario}
timeframe: ${seed.timeframe}
intent: ${seed.intentLabel}

Agent debate context:
${agentLines}

ให้สรุปเป็น valid JSON เท่านั้น (ไม่มี markdown/code fence) ด้วย schema:
{
  "summary": "สรุปภาษาไทย 2-3 ประโยค เป็น decision support ไม่ใช่คำแนะนำซื้อขาย",
  "thesis": "thesis หลักของ debate ในภาษาไทย",
  "suggestedChecks": ["สิ่งที่ต้องเช็กต่อ 1", "สิ่งที่ต้องเช็กต่อ 2"],
  "confidence": 70
}

Safety:
- ห้ามแนะนำซื้อ/ขายทันที
- ห้ามการันตีกำไร
- ห้ามอ้าง prediction certainty
- ต้องมี risk/สิ่งที่ต้องเช็กต่อ
- ตอบภาษาไทย`
}

export async function buildMimoReporterDraft(seed: DebateSeed, agents: AgentResult[]): Promise<MimoReporterDraft | null> {
  if (!getMimoApiKey()) return null

  try {
    const content = await callMimoChatCompletion({
      messages: [
        {
          role: 'system',
          content:
            'You are StockGuru Reporter Agent for Thai market research. You synthesize structured agent debate into decision-support notes. Never give buy/sell advice, guaranteed returns, or prediction certainty. Always include risk-aware checks. Return valid JSON when asked.',
        },
        {
          role: 'user',
          content: buildReporterPrompt(seed, agents),
        },
      ],
      temperature: 0.2,
      maxTokens: Number(process.env.MIMO_MAX_TOKENS ?? 700),
    })

    return parseReporterDraft(content)
  } catch {
    return null
  }
}
