import { expect, test } from '@playwright/test'

test.describe('Security smoke', () => {
  test('anonymous API calls cannot reach paid or auth-only surfaces', async ({ request }) => {
    const checks = [
      ['GET', '/api/screener/universe', undefined],
      ['POST', '/api/screener/export', { filters: {} }],
      ['GET', '/api/portfolio/export', undefined],
      ['POST', '/api/sega/review', { proposal: { proposalId: 'security-smoke', title: 'security smoke', thesis: 'keep gates closed', downside: {}, exitPlan: {} }, agentLoopResult: { agents: [] } }],
      ['POST', '/api/stock/backtest', { symbol: 'PTT.BK', timeframe: '1Y', initialCapital: 100000, strategy: { name: 'security smoke', rules: ['buy'] } }],
    ] as const

    for (const [method, path, body] of checks) {
      const response = method === 'GET'
        ? await request.get(path)
        : await request.post(path, { data: body })

      expect(response.status(), `${method} ${path} should be blocked for anonymous users`).toBe(401)
      const json = await response.json()
      expect(json.success).toBe(false)
      expect(json.error).toBeTruthy()
    }
  })

  test('cron routes reject anonymous triggers without a valid CRON_SECRET', async ({ request }) => {
    // /api/data/fetch previously had NO gate — anyone could POST and force an
    // expensive full data fetch (DoS / upstream cost abuse). It must now reject
    // anonymous calls the same way /api/news/refresh and /api/alerts/check do.
    const cronRoutes = [
      '/api/data/fetch',
      '/api/news/refresh',
      '/api/news/seed',
      '/api/alerts/check',
    ] as const

    for (const path of cronRoutes) {
      const noHeader = await request.post(path)
      // 401 when CRON_SECRET is set but missing/mismatched; 503 when unset.
      // Either way it must NOT be 200 (which would mean the gate is absent).
      expect(
        noHeader.status(),
        `POST ${path} must reject anonymous trigger (got ${noHeader.status()})`
      ).not.toBe(200)

      const badSecret = await request.post(path, {
        headers: { authorization: 'Bearer definitely-not-the-real-secret' },
      })
      expect(
        badSecret.status(),
        `POST ${path} must reject wrong CRON_SECRET (got ${badSecret.status()})`
      ).not.toBe(200)
    }
  })

  test('protected pages ask anonymous users to sign in without exposing paid content', async ({ page }) => {
    await page.goto('/compare')
    await expect(page).toHaveURL(/\/pricing\?reason=auth_required/)

    await page.goto('/portfolio')
    await expect(page).toHaveURL(/\/pricing\?reason=auth_required/)
  })

  test('research memory labels near-real-time snapshot content', async ({ page }) => {
    await page.goto('/research')
    await expect(page.getByRole('heading', { name: 'Research Memory' })).toBeVisible()
    await expect(page.getByText(/near-real-time snapshot/i)).toBeVisible()
  })

  test('AI market brief surfaces carry disclaimer', async ({ page }) => {
    await page.goto('/news')
    await expect(page.getByRole('heading', { name: /AI Market Brief/i })).toBeVisible()
    await expect(page.getByText(/ไม่ใช่คำแนะนำการลงทุน/)).toBeVisible({ timeout: 15_000 })
  })

  test('PWA shell keeps required offline and notification hooks', async ({ page }) => {
    const manifestResponse = await page.request.get('/manifest.webmanifest')
    expect(manifestResponse.status()).toBe(200)
    const manifest = await manifestResponse.json()
    expect(manifest.icons?.length).toBeGreaterThan(0)

    const serviceWorkerResponse = await page.request.get('/service-worker.js')
    expect(serviceWorkerResponse.status()).toBe(200)
    const serviceWorker = await serviceWorkerResponse.text()
    expect(serviceWorker).toContain('CACHE_NAME')
    expect(serviceWorker).toContain('SKIP_WAITING')
    expect(serviceWorker).toContain('/icons/icon-512.png')
  })
})
