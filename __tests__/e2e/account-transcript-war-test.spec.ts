import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type APIRequestContext, type Browser, type BrowserContext, type Page, type TestInfo } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

interface TranscriptPersona {
  id: string
  name: string
  question: string
  symbols: string[]
  timeframe: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'
  scenario: string
  mode: 'custom' | 'market'
  holdings?: Array<{ symbol: string; quantity: number; buyPrice: number }>
}

type TranscriptEntry = {
  turn: string
  request: unknown
  response: unknown
  correctness: string[]
}

const personas: TranscriptPersona[] = [
  {
    id: '01',
    name: 'นักวิเคราะห์พลังงานรายย่อย',
    symbols: ['PTT.BK'],
    timeframe: '1M',
    scenario: 'ราคาน้ำมันโลกอ่อน 10-15%, บาทแข็งเร็ว, PTT มี exposure ปิโตรเคมีและโรงกลั่น แต่ตลาดยังรอตัวเลขสต็อกน้ำมัน',
    mode: 'custom',
    question: 'ถ้าราคาน้ำมันลงแรงและบาทแข็ง PTT จะโดน margin กดแค่ไหน และจุดไหนที่ thesis เริ่มผิด',
  },
  {
    id: '02',
    name: 'นักลงทุนหุ้นเทค/สื่อสาร',
    symbols: ['ADVANC.BK'],
    timeframe: '3M',
    scenario: 'ADVANC ลงทุน 5G/enterprise ต่อเนื่อง แต่ ARPU โตช้าและตลาดกังวล capex กด FCF',
    mode: 'custom',
    question: 'ADVANC ยังน่าถือเพื่อ dividend และ enterprise growth ได้ไหม ถ้า capex ยังสูงและ ARPU ไม่เร่ง',
  },
  {
    id: '03',
    name: 'นักลงทุนค้าปลีก',
    symbols: ['CPALL.BK'],
    timeframe: '1M',
    scenario: 'CPALL ได้ประโยชน์จากท่องเที่ยว แต่กำลังซื้อรายย่อยอ่อน, ค่าแรงขึ้น, และคู่แข่งร้านสะดวกซื้อขยายสาขาเร็ว',
    mode: 'custom',
    question: 'CPALL จะฟื้นจากท่องเที่ยวได้จริงไหม หรือ margin จะถูกค่าแรงและโปรโมชั่นกลบ',
  },
  {
    id: '04',
    name: 'นักลงทุนแบงก์ระมัดระวัง',
    symbols: ['KBANK.BK'],
    timeframe: '6M',
    scenario: 'KBANK อาจได้ประโยชน์จาก NIM หากดอกเบี้ยทรงตัว แต่ต้องจับ NPL รายย่อย, หนี้ SME, และค่าธรรมเนียม wealth',
    mode: 'custom',
    question: 'KBANK ควรมองเป็น turnaround หรือ value trap ถ้า NPL รายย่อยยังเพิ่มและดอกเบี้ยเริ่มลง',
  },
  {
    id: '05',
    name: 'นักลงทุนท่องเที่ยว/สายการบิน',
    symbols: ['AOT.BK'],
    timeframe: '3M',
    scenario: 'AOT ได้ประโยชน์จากนักท่องเที่ยวจีน/ตะวันออกกลางฟื้น แต่มี geopolitical risk, slot constraint, และ capex terminal ใหม่',
    mode: 'custom',
    question: 'AOT ยังเป็น proxy ท่องเที่ยวที่ดีที่สุดไหม ถ้าจำนวนเที่ยวฟื้นแต่ yield ต่อผู้โดยสารไม่เท่าก่อนโควิด',
  },
  {
    id: '06',
    name: 'นักลงทุนอิเล็กทรอนิกส์ส่งออก',
    symbols: ['DELTA.BK'],
    timeframe: '3M',
    scenario: 'DELTA ได้ order EV/data center แต่ลูกค้าอาจชะลอ inventory และค่าเงินผันผวนกระทบ margin',
    mode: 'custom',
    question: 'DELTA วัฏจักรอิเล็กทรอนิกส์รอบนี้ต่างจากปีก่อนอย่างไร และควรเช็ก evidence อะไรก่อนเชื่อ breakout',
  },
  {
    id: '07',
    name: 'นักลงทุนแบงก์ดิจิทัล',
    symbols: ['SCB.BK'],
    timeframe: '6M',
    scenario: 'SCBX พยายามเปลี่ยนเป็น tech-led financial group แต่ธุรกิจแบงก์หลักยังเจอ credit cost และ fintech แย่ง fee income',
    mode: 'custom',
    question: 'SCBX transformation story น่าเชื่อถือแค่ไหน ถ้า core bank ยังถูก credit cost กด',
  },
  {
    id: '08',
    name: 'นักลงทุนน้ำมัน upstream',
    symbols: ['PTTEP.BK'],
    timeframe: '1M',
    scenario: 'PTTEP ได้ประโยชน์จาก oil price สูง แต่ตลาดกังวล hedging, capex offshore, และ regulatory risk ในบางแหล่งผลิต',
    mode: 'custom',
    question: 'PTTEP เหมาะเป็น hedge น้ำมันหรือเป็น value trap ถ้าราคาน้ำมันผันผวนและ capex สูง',
  },
  {
    id: '09',
    name: 'นักลงทุนมอง SET index',
    symbols: ['PTT.BK', 'SCB.BK', 'CPALL.BK', 'AOT.BK', 'ADVANC.BK'],
    timeframe: '3M',
    scenario: 'SET index อยู่ในภาวะตลาดเลือกหุ้น, foreign flow ยังเบา, บาทผันผวน, และหุ้นใหญ่หลายตัวมี catalyst ไม่พร้อมกัน',
    mode: 'market',
    question: 'ถ้าต้องจัด priority ระหว่าง PTT, SCB, CPALL, AOT, ADVANC ในตลาดเลือกหุ้น ควรเช็กอะไรก่อนเพิ่มน้ำหนัก',
  },
  {
    id: '10',
    name: 'นักลงทุนพอร์ตผสม',
    symbols: ['PTT.BK', 'SCB.BK', 'CPALL.BK', 'AOT.BK'],
    timeframe: '3M',
    scenario: 'พอร์ตมีพลังงาน แบงก์ ค้าปลีก และท่องเที่ยว, cash 20%, รับความเสี่ยงได้ปานกลาง, ต้องการเช็ก downside และ rebalance',
    mode: 'custom',
    holdings: [
      { symbol: 'PTT.BK', quantity: 1000, buyPrice: 34 },
      { symbol: 'SCB.BK', quantity: 800, buyPrice: 38 },
      { symbol: 'CPALL.BK', quantity: 600, buyPrice: 62 },
      { symbol: 'AOT.BK', quantity: 500, buyPrice: 70 },
    ],
    question: 'พอร์ตผสมนี้มีจุดเปราะบางอะไรที่สุด และถ้าต้องลด exposure หนึ่งกลุ่ม จะลดอะไรก่อน',
  },
]

function loadLocalEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return

  for (const rawLine of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#') || !line.includes('=')) continue
    const [key, ...rest] = line.split('=')
    const value = rest.join('=').replace(/^['"]|['"]$/g, '')
    process.env[key] = value
  }
}

loadLocalEnv()

function hasAccountBackedEnv() {
  return Boolean(process.env.MIROFISH_SMOKE_EMAIL && process.env.MIROFISH_SMOKE_PASSWORD && process.env.MIROFISH_SMOKE_USER_ID && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

async function getCurrentUserId() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  })
  const signedIn = await supabase.auth.signInWithPassword({
    email: process.env.MIROFISH_SMOKE_EMAIL!,
    password: process.env.MIROFISH_SMOKE_PASSWORD!,
  })
  if (signedIn.error) throw signedIn.error
  if (!signedIn.data.user?.id) throw new Error('Supabase sign in did not return a user id')
  return signedIn.data.user.id
}

async function ensureProEntitlement(userId = process.env.MIROFISH_SMOKE_USER_ID) {
  if (!userId) throw new Error('MIROFISH_SMOKE_USER_ID is required')

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { error } = await supabase
    .from('subscriptions')
    .upsert({ user_id: userId, plan: 'pro', status: 'active' }, { onConflict: 'user_id' })

  if (error) throw error
}

async function signIn(page: Page) {
  await page.goto('/war-room')

  const loginButton = page.getByRole('banner').getByRole('button', { name: 'เข้าสู่ระบบ', exact: true })
  if (await loginButton.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await loginButton.click()
    await page.getByPlaceholder('อีเมล').fill(process.env.MIROFISH_SMOKE_EMAIL!)
    await page.getByPlaceholder('รหัสผ่าน').fill(process.env.MIROFISH_SMOKE_PASSWORD!)
    await page.getByLabel('เข้าสู่ระบบ', { exact: true })
      .getByRole('button', { name: 'เข้าสู่ระบบ', exact: true })
      .click()
  }

  await expect(page.getByText(/Pro Plan|Trader Lifetime/)).toBeVisible({ timeout: 15_000 })
  await ensureProEntitlement(await getCurrentUserId())
  await expect(page.getByRole('heading', { name: /Agent Looping/ })).toBeVisible({ timeout: 15_000 })
}

async function getAuthorizedBrowserContext(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext()
  const page = await context.newPage()
  await signIn(page)
  const userId = await getCurrentUserId()
  await ensureProEntitlement(userId)
  return context
}

async function expectSuccessJson(response: Awaited<ReturnType<APIRequestContext['post']>>) {
  expect(response.status(), await response.text()).toBe(200)
  const json = await response.json()
  expect(json.success).toBe(true)
  return json
}

async function postAgentLoop(context: BrowserContext, persona: TranscriptPersona) {
  return expectSuccessJson(await context.request.post('/api/agent-loop/simulate', {
    data: {
      mode: persona.mode,
      symbols: persona.symbols,
      timeframe: persona.timeframe,
      scenario: persona.scenario,
      holdings: persona.holdings,
    },
  }))
}

async function postDebate(context: BrowserContext, persona: TranscriptPersona) {
  return expectSuccessJson(await context.request.post('/api/war-room/debate', {
    data: {
      question: persona.question,
      symbols: persona.symbols,
      scenario: persona.scenario,
      timeframe: persona.timeframe,
      mode: persona.mode,
      holdings: persona.holdings,
    },
  }))
}

async function postSega(context: BrowserContext, agentLoopData: unknown, debateData: unknown) {
  return expectSuccessJson(await context.request.post('/api/sega/review', {
    data: agentLoopData ? { agentLoopResult: agentLoopData } : { miroFishDebateResult: debateData },
  }))
}

function assertAgentLoopCorrectness(data: any, persona: TranscriptPersona) {
  expect(data.runId).toBeTruthy()
  expect(data.symbols.length).toBeGreaterThan(0)
  expect(data.summary).toBeTruthy()
  expect(data.thesis).toBeTruthy()
  expect(data.risks.length).toBeGreaterThan(0)
  expect(data.suggestedChecks.length).toBeGreaterThan(0)
  expect(data.agents.length).toBeGreaterThan(0)
  expect(typeof data.confidence).toBe('number')
  expect(data.confidence).toBeGreaterThanOrEqual(0)
  expect(data.confidence).toBeLessThanOrEqual(100)
  expect(['pass', 'needs_review', 'blocked']).toContain(data.verifier.status)

  for (const agent of data.agents) {
    expect(agent.role).toBeTruthy()
    expect(agent.label).toBeTruthy()
    expect(['pass', 'needs_review', 'blocked']).toContain(agent.status)
    expect(agent.summary).toBeTruthy()
    expect(Array.isArray(agent.findings)).toBe(true)
    expect(Array.isArray(agent.risks)).toBe(true)
  }

  const matchedSymbols = persona.symbols.filter((symbol) => data.symbols.includes(symbol) || data.symbols.includes(symbol.replace('.BK', '')))
  expect(matchedSymbols.length).toBeGreaterThan(0)

  return [
    `Agent Loop ตอบ thesis/summary/risks/suggestedChecks ครบ`,
    `มี agent voices ${data.agents.length} บทบาท และ verifier status = ${data.verifier.status}`,
    `symbols ใน response ตรงกับ request อย่างน้อย 1 สัญลักษณ์`,
  ]
}

function assertDebateCorrectness(data: any, persona: TranscriptPersona) {
  expect(data.runId).toBeTruthy()
  expect(data.seed.question).toContain(persona.question.slice(0, 20))
  expect(data.rounds.length).toBeGreaterThan(0)
  expect(data.transcript.length).toBeGreaterThan(0)
  expect(data.summary).toBeTruthy()
  expect(data.thesis).toBeTruthy()
  expect(data.risks.length).toBeGreaterThan(0)
  expect(data.suggestedChecks.length).toBeGreaterThan(0)
  expect(['pass', 'needs_review', 'blocked']).toContain(data.verifier.status)

  for (const message of data.transcript.slice(0, 12)) {
    expect(message.agentLabel).toBeTruthy()
    expect(message.message).toBeTruthy()
    expect(['pass', 'needs_review', 'blocked']).toContain(message.status)
    expect(typeof message.confidence).toBe('number')
  }

  return [
    `MiroFish Debate มี transcript ${data.transcript.length} messages และ ${data.rounds.length} rounds`,
    `seed question ตรงกับ prompt ที่ simulated user ถาม`,
    `verifier status = ${data.verifier.status}`,
  ]
}

function assertSegaCorrectness(data: any) {
  const storyText = typeof data.story === 'string' ? data.story : data.story?.text
  const personaValues = data.persona?.coreValues ?? data.persona?.values

  expect(['Go', 'Conditional Go', 'No-Go']).toContain(data.approval.decision)
  expect(typeof data.approval.riskScore).toBe('number')
  expect(data.approval.reasons.length).toBeGreaterThan(0)
  expect(data.approval.mitigations.length + data.approval.monitoringTriggers.length + data.approval.killCriteria.length).toBeGreaterThan(0)
  expect(storyText).toContain('เช็ก evidence')
  expect(storyText).toContain('คำแนะนำซื้อขายทันที')
  expect(personaValues.length).toBeGreaterThan(0)

  return [
    `SEGA decision = ${data.approval.decision}, riskScore = ${data.approval.riskScore}`,
    `Storycraft มี evidence checkpoint และ guard ภาษาไม่ให้เป็นคำแนะนำซื้อขายทันที`,
    `SEGA persona core values ถูก render มาใน payload`,
  ]
}

function runCorrectness(assertion: () => string[]) {
  const checks: string[] = []
  try {
    checks.push(...assertion())
    return { checks }
  } catch (error) {
    return { checks, error: error as Error }
  }
}

function writeTranscript(testInfo: TestInfo, persona: TranscriptPersona, entries: TranscriptEntry[]) {
  const dir = testInfo.outputPath('transcripts')
  fs.mkdirSync(dir, { recursive: true })
  const safeName = persona.name.replace(/[\s/\\]+/g, '-')
  const markdownPath = path.join(dir, `user-${persona.id}-${safeName}.md`)
  const jsonPath = path.join(dir, `user-${persona.id}-${safeName}.json`)

  const lines = [
    `# Account Transcript QA — User ${persona.id}: ${persona.name}`,
    '',
    '## Persona',
    `- Symbols: ${persona.symbols.join(', ')}`,
    `- Timeframe: ${persona.timeframe}`,
    `- Mode: ${persona.mode}`,
    `- Scenario: ${persona.scenario}`,
    `- User question: ${persona.question}`,
    '',
  ]

  for (const entry of entries) {
    lines.push(`## Turn: ${entry.turn}`)
    lines.push('')
    lines.push('### Request')
    lines.push('')
    lines.push('```json')
    lines.push(JSON.stringify(entry.request, null, 2))
    lines.push('```')
    lines.push('')
    lines.push('### Response')
    lines.push('')
    lines.push('```json')
    lines.push(JSON.stringify(entry.response, null, 2))
    lines.push('```')
    lines.push('')
    lines.push('### Correctness checks')
    lines.push('')
    for (const item of entry.correctness) {
      lines.push(`- ✅ ${item}`)
    }
    lines.push('')
  }

  fs.writeFileSync(markdownPath, lines.join('\n'))
  fs.writeFileSync(jsonPath, JSON.stringify({ persona, entries }, null, 2))
}

test.describe.configure({ mode: 'parallel', timeout: 180_000 })

test.describe('Account Transcript War Test - realistic Thai investor scenarios', () => {
  test.skip(!hasAccountBackedEnv(), 'account-backed env is required')

  test.beforeAll(async () => {
    await ensureProEntitlement()
  })

  for (const persona of personas) {
    test(`user ${persona.id} - ${persona.name}`, async ({ browser }, testInfo) => {
      const context = await getAuthorizedBrowserContext(browser)
      const entries: TranscriptEntry[] = []
      const correctnessErrors: Error[] = []

      try {
        const agentLoop = await postAgentLoop(context, persona)
        const agentLoopResult = runCorrectness(() => assertAgentLoopCorrectness(agentLoop.data, persona))
        if (agentLoopResult.error) correctnessErrors.push(agentLoopResult.error)
        entries.push({
          turn: 'Agent Loop',
          request: {
            endpoint: '/api/agent-loop/simulate',
            mode: persona.mode,
            symbols: persona.symbols,
            timeframe: persona.timeframe,
            scenario: persona.scenario,
            holdings: persona.holdings ?? [],
          },
          response: agentLoop.data,
          correctness: [
            ...agentLoopResult.checks,
            ...(agentLoopResult.error ? [`❌ ${agentLoopResult.error.message}`] : []),
          ],
        })

        const debate = await postDebate(context, persona)
        const debateResult = runCorrectness(() => assertDebateCorrectness(debate.data, persona))
        if (debateResult.error) correctnessErrors.push(debateResult.error)
        entries.push({
          turn: 'MiroFish Debate',
          request: {
            endpoint: '/api/war-room/debate',
            question: persona.question,
            symbols: persona.symbols,
            timeframe: persona.timeframe,
            scenario: persona.scenario,
            mode: persona.mode,
            holdings: persona.holdings ?? [],
          },
          response: debate.data,
          correctness: [
            ...debateResult.checks,
            ...(debateResult.error ? [`❌ ${debateResult.error.message}`] : []),
          ],
        })

        const sega = await postSega(context, agentLoop.data, debate.data)
        const segaResult = runCorrectness(() => assertSegaCorrectness(sega.data))
        if (segaResult.error) correctnessErrors.push(segaResult.error)
        entries.push({
          turn: 'SEGA Review Gate',
          request: {
            endpoint: '/api/sega/review',
            agentLoopResult: agentLoop.data,
            miroFishDebateResult: debate.data,
          },
          response: sega.data,
          correctness: [
            ...segaResult.checks,
            ...(segaResult.error ? [`❌ ${segaResult.error.message}`] : []),
          ],
        })

        writeTranscript(testInfo, persona, entries)
      } finally {
        await context.close()
      }

      if (correctnessErrors.length > 0) {
        throw new Error(`Transcript correctness failures: ${correctnessErrors.map((error) => error.message).join(' | ')}`)
      }
    })
  }
})
