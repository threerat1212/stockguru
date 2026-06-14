import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type APIRequestContext, type Browser, type BrowserContext, type Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

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
  await page.goto('/agent-loop')

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
  await expect(page.getByRole('heading', { level: 1, name: 'Agent Loop' })).toBeVisible({ timeout: 15_000 })
}

async function getLoggedInContext(browser: Browser): Promise<BrowserContext> {
  const context = await browser.newContext()
  const page = await context.newPage()
  await signIn(page)
  return context
}

async function getAuthorizedBrowserContext(browser: Browser): Promise<BrowserContext> {
  const context = await getLoggedInContext(browser)
  const userId = await getCurrentUserId()
  await ensureProEntitlement(userId)
  return context
}

async function expectSuccessJson(response: Awaited<ReturnType<APIRequestContext['get']>>) {
  expect(response.status()).toBe(200)
  const json = await response.json()
  expect(json.success).toBe(true)
  return json
}

test.describe.configure({ mode: 'parallel', timeout: 120_000 })

test.describe('Account Full War Test - 10 simulated users', () => {
  test.skip(!hasAccountBackedEnv(), 'account-backed env is required')

  test.beforeAll(async () => {
    await ensureProEntitlement()
  })

  test('user 01 - home, search, stock, news', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /Market desk วันนี้/ })).toBeVisible()

    await page.goto('/screener')
    await page.getByPlaceholder(/ค้นหาด้วยชื่อหรือสัญลักษณ์/).fill('PTT')
    await expect(page.getByText(/ค้นหา: PTT/)).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText(/ไม่พบหุ้นที่ตรงกับเงื่อนไข|PTT/)).toBeVisible({ timeout: 15_000 })

    await page.goto('/stock/PTT')
    await expect(page.locator('h1', { hasText: /PTT/ })).toBeVisible()

    await page.goto('/news')
    await expect(page.getByRole('heading', { name: /AI Market Brief/ })).toBeVisible()
  })

  test('user 02 - market dashboard and market APIs', async ({ page, browser }) => {
    const context = await getAuthorizedBrowserContext(browser)
    try {
      const market = await expectSuccessJson(await context.request.get('/api/market/summary'))
      expect(market.data.breadthByExchange.SET).toBeDefined()
      expect(market.data.breadthByExchange.mai).toBeDefined()
    } finally {
      await context.close()
    }

    await page.goto('/market')
    await expect(page).toHaveURL(/\/market/)
    await expect(page.getByRole('heading', { name: 'ภาพรวมตลาดไทย' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Market Breadth' })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByRole('heading', { name: 'Sector Heatmap' })).toBeVisible({ timeout: 15_000 })
  })

  test('user 03 - AI page and chat UI', async ({ page }) => {
    await page.goto('/ai')
    await expect(page.getByRole('heading', { name: /AI วิเคราะห์/ })).toBeVisible()
    await expect(page.getByText(/ไม่ใช่คำแนะนำลงทุน/)).toBeVisible()
    await expect(page.getByPlaceholder(/พิมพ์คำถามเกี่ยวกับหุ้น|เข้าสู่ระบบเพื่อถาม AI/)).toBeVisible()
  })

  test('user 04 - watchlist, portfolio, journal pages', async ({ page }) => {
    await signIn(page)

    await page.goto('/watchlist')
    await expect(page.getByRole('heading', { name: 'รายการโปรด' })).toBeVisible()

    await page.goto('/portfolio')
    await expect(page.getByRole('heading', { name: /พอร์ตการลงทุน/ })).toBeVisible()

    await page.goto('/journal')
    await expect(page.getByRole('heading', { name: /Trading Journal/ })).toBeVisible()
  })

  test('user 05 - alerts page and quote API', async ({ page, browser }) => {
    await signIn(page)

    await page.goto('/alerts')
    await expect(page.getByRole('heading', { name: 'แจ้งเตือนราคา' })).toBeVisible()

    const context = await getAuthorizedBrowserContext(browser)
    try {
      const quote = await expectSuccessJson(await context.request.get('/api/stock/quote?symbol=PTT.BK'))
      expect(quote.data.symbol).toBe('PTT.BK')
    } finally {
      await context.close()
    }
  })

  test('user 06 - War Room Agent Loop and SEGA Review Gate', async ({ page }) => {
    await signIn(page)
    await page.goto('/agent-loop')

    await page.getByRole('button', { name: 'รัน Agent Loop' }).click()
    await expect(page.getByText(/run /)).toBeVisible({ timeout: 60_000 })

    await page.getByRole('button', { name: 'รัน SEGA Review Gate' }).click()
    await expect(page.getByRole('heading', { name: /SEGA Review Gate/ })).toBeVisible({ timeout: 60_000 })
    await expect(page.getByText(/Storycraft Brief/)).toBeVisible()
  })

  test('user 07 - MiroFish Debate and SEGA Review Gate', async ({ page }) => {
    await signIn(page)
    await page.goto('/war-room')

    await page.getByRole('button', { name: 'รัน MiroFish Debate' }).click()
    await expect(page.getByRole('heading', { name: /MiroFish Debate Transcript/ })).toBeVisible({ timeout: 60_000 })

    await page.getByRole('button', { name: 'รัน SEGA Review Gate' }).click()
    await expect(page.getByRole('heading', { name: /SEGA Review Gate/ })).toBeVisible({ timeout: 60_000 })
  })

  test('user 08 - MiroFish Swarm UI and API', async ({ page, browser }) => {
    await signIn(page)
    await page.goto('/mirofish')

    await page.getByRole('button', { name: 'Run Swarm Simulation' }).click()
    await expect(page.getByRole('heading', { name: /Agent Swarm Personas/ })).toBeVisible({ timeout: 60_000 })
    await expect(page.getByRole('heading', { name: /Scenario Map/ })).toBeVisible()

    const context = await getAuthorizedBrowserContext(browser)
    try {
      const swarm = await expectSuccessJson(await context.request.post('/api/mirofish/swarm', {
        data: {
          title: 'PTT งบออกดี แต่ราคาน้ำมันโลกอ่อนและบาทแข็ง',
          description: 'จำลองว่าสังคมตลาดหุ้นไทยจะตีความข่าวนี้ยังไง',
          domain: 'stock',
          timeframe: '1M',
          actors: ['PTT', 'นักลงทุนรายย่อย', 'นักวิเคราะห์สถาบัน'],
          assumptions: ['ตลาดอาจกังวล sell on fact'],
        },
      }))
      expect(swarm.data.agents.length).toBeGreaterThan(0)
    } finally {
      await context.close()
    }
  })

  test('user 09 - Pro-gated War Room APIs', async ({ browser }) => {
    const context = await getAuthorizedBrowserContext(browser)
    try {
      const agentLoop = await expectSuccessJson(await context.request.post('/api/agent-loop/simulate', {
        data: {
          mode: 'custom',
          symbols: ['PTT.BK'],
          timeframe: '1W',
          scenario: 'account-backed API smoke test',
          holdings: [],
        },
      }))
      expect(agentLoop.data.thesis).toBeTruthy()

      const debate = await expectSuccessJson(await context.request.post('/api/war-room/debate', {
        data: {
          question: 'PTT ถ้ามูลค่าน้ำมันลงและบาทแข็ง จะกระทบอะไร',
          symbols: ['PTT.BK'],
          scenario: 'น้ำมันลง + บาทแข็ง',
          timeframe: '1W',
          mode: 'custom',
        },
      }))
      expect(debate.data.thesis).toBeTruthy()

      const sega = await expectSuccessJson(await context.request.post('/api/sega/review', {
        data: { agentLoopResult: agentLoop.data },
      }))
      expect(['Go', 'Conditional Go', 'No-Go']).toContain(sega.data.approval.decision)
    } finally {
      await context.close()
    }
  })

  test('user 10 - pricing, learn, compare, risk disclaimer', async ({ page }) => {
    await signIn(page)

    await page.goto('/pricing')
    await expect(page.getByRole('heading', { name: 'Free' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Pro' })).toBeVisible()

    await page.goto('/learn')
    await expect(page.getByRole('heading', { name: 'ความรู้การลงทุน' })).toBeVisible()

    await page.goto('/compare')
    await expect(page.getByRole('heading', { name: /เปรียบเทียบหุ้น/ })).toBeVisible()

    await page.goto('/risk-disclaimer')
    await expect(page.getByRole('heading', { name: 'ข้อจำกัดความรับผิดชอบ' })).toBeVisible()
  })
})
