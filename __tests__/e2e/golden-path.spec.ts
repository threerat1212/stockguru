import { test, expect } from '@playwright/test'

test.describe('Golden Path', () => {
  test('visitor can navigate home, search, and view stock', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/StockGuru/)
    await expect(page.getByRole('heading', { name: /Market desk วันนี้/ })).toBeVisible()

    await page.getByRole('banner').getByRole('link', { name: 'Screener' }).click()
    await expect(page).toHaveURL(/\/screener/)
    await expect(page.getByRole('heading', { name: /Screener/ })).toBeVisible()

    await page.getByPlaceholder(/ค้นหาด้วยชื่อหรือสัญลักษณ์/).fill('PTT')
    await expect(page.getByRole('cell', { name: /บริษัท ปตท/ })).toBeVisible()

    await page.getByRole('row', { name: /PTT/ }).getByRole('link', { name: 'เปิดกราฟ PTT' }).click()
    await expect(page).toHaveURL(/\/stock\/PTT\.BK/)
    await expect(page.locator('h1', { hasText: /PTT/ })).toBeVisible()

    await page.getByRole('link', { name: /ข่าวสาร/ }).first().click()
    await expect(page).toHaveURL(/\/news/)
  })

  test('portfolio requires auth gate', async ({ page }) => {
    await page.goto('/portfolio')
    await expect(
      page.getByRole('main').getByText(/พอร์ตการลงทุน|เข้าสู่ระบบเพื่อใช้งาน|ต้องอัพเกรดแผน/)
    ).toBeVisible()
  })

  test('compare requires auth gate', async ({ page }) => {
    await page.goto('/compare')
    await expect(
      page.getByRole('main').getByText(/เปรียบเทียบหุ้น|เข้าสู่ระบบเพื่อใช้งาน|ต้องอัพเกรดแผน/)
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
})
