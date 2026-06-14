import { test, expect } from '@playwright/test'

test.describe('Golden Path', () => {
  test('visitor can navigate home, search, and view stock', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/StockGuru/)
    await expect(page.getByRole('heading', { name: /Market desk วันนี้/ })).toBeVisible()

    await page.goto('/screener')
    await expect(page).toHaveURL(/\/screener/)
    await expect(page.getByRole('heading', { name: /Screener/ })).toBeVisible()

    await page.getByPlaceholder(/ค้นหาด้วยชื่อหรือสัญลักษณ์/).fill('PTT')
    await expect(page.getByPlaceholder(/ค้นหาด้วยชื่อหรือสัญลักษณ์/)).toHaveValue('PTT')

    await page.goto('/stock/PTT')
    await expect(page.locator('h1', { hasText: /PTT/ })).toBeVisible()

    await page.goto('/news')
    await expect(page).toHaveURL(/\/news/)
  })

  test('portfolio requires auth gate', async ({ page }) => {
    await page.goto('/portfolio')
    await expect(
      page.getByRole('main').getByText('พอร์ตการลงทุน', { exact: true })
    ).toBeVisible()
  })

  test('compare requires auth gate', async ({ page }) => {
    await page.goto('/compare')
    await expect(
      page.getByRole('main').getByText('เปรียบเทียบหุ้น', { exact: true })
    ).toBeVisible()
  })

  test('pricing page shows plans', async ({ page }) => {
    await page.goto('/pricing')
    await expect(page.getByRole('heading', { name: 'Free' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Pro' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Trader' })).toBeVisible()
  })

  test('health endpoint returns ok', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.status).toBe('ok')
  })

  test('trending endpoint returns data', async ({ request }) => {
    const response = await request.get('/api/stock/trending')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(Array.isArray(body.data)).toBe(true)
  })

  test('market dashboard renders live market summary', async ({ page, request }) => {
    const response = await request.get('/api/market/summary')
    expect(response.status()).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.data.breadthByExchange.SET).toBeDefined()
    expect(body.data.breadthByExchange.mai).toBeDefined()
    expect(body.meta.sources.stocks.provider).toBe('SiamChart')

    await page.goto('/market')
    await expect(page.getByRole('heading', { name: 'ภาพรวมตลาดไทย' })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText(/Auto-refresh 60s/)).toBeVisible()
    await expect(page.getByText(/Market Breadth/)).toBeVisible()
    await expect(page.getByText(/Sector Heatmap/)).toBeVisible()
  })

  test('MiroFish smoke account can open War Room Pro feature', async ({ page }) => {
    const email = process.env.MIROFISH_SMOKE_EMAIL
    const password = process.env.MIROFISH_SMOKE_PASSWORD
    test.skip(!email || !password, 'MIROFISH_SMOKE_EMAIL and MIROFISH_SMOKE_PASSWORD are required')

    await page.goto('/agent-loop')
    await expect(page.getByRole('banner').getByRole('button', { name: 'เข้าสู่ระบบ', exact: true })).toBeVisible()
    await page.getByRole('banner').getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click()
    await page.getByPlaceholder('อีเมล').fill(email!)
    await page.getByPlaceholder('รหัสผ่าน').fill(password!)
    await page.getByLabel('เข้าสู่ระบบ', { exact: true })
      .getByRole('button', { name: 'เข้าสู่ระบบ', exact: true })
      .click()

    await expect(page.getByRole('heading', { level: 1, name: 'Agent Loop' })).toBeVisible()
    await expect(page.getByText(/Decision support only/)).toBeVisible()
  })
})
