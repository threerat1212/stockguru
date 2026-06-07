import { test, expect } from '@playwright/test'

test.describe('Golden Path', () => {
  test('visitor can navigate home, search, and view stock', async ({ page }) => {
    // 1. Home page loads
    await page.goto('/')
    await expect(page).toHaveTitle(/StockGuru/)
    await expect(page.getByRole('heading', { name: /Market desk วันนี้/ })).toBeVisible()

    // 2. Navigate to screener via sidebar
    await page.getByRole('link', { name: /Screener/ }).click()
    await expect(page).toHaveURL(/\/screener/)
    await expect(page.getByRole('heading', { name: /Screener/ })).toBeVisible()

    // 3. Search for a stock
    await page.getByPlaceholder(/ค้นหาด้วยชื่อหรือสัญลักษณ์/).fill('PTT')
    await page.keyboard.press('Enter')

    // 4. View stock detail
    await page.waitForURL(/\/stock\/PTT\.BK/)
    await expect(page.locator('h1', { hasText: /PTT\.BK/ })).toBeVisible()

    // 5. Navigate to news
    await page.getByRole('link', { name: /ข่าวสาร/ }).first().click()
    await expect(page).toHaveURL(/\/news/)
  })

  test('portfolio page works for guest', async ({ page }) => {
    await page.goto('/portfolio')
    await expect(page.getByRole('heading', { name: /พอร์ตการลงทุน/ })).toBeVisible()
    await expect(page.getByText(/ยังไม่มีหุ้นในพอร์ต/)).toBeVisible()

    // Add a stock
    await page.getByPlaceholder('ชื่อหุ้น').fill('PTT')
    await page.getByPlaceholder('จำนวน').fill('100')
    await page.getByPlaceholder('ราคาซื้อ').fill('35')
    await page.getByRole('button', { name: /เพิ่ม/ }).click()

    // Use more specific locator to avoid multiple matches
    await expect(page.locator('p', { hasText: /^PTT$/ })).toBeVisible()
  })
})
