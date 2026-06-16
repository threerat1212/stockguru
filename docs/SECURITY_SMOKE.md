# StockGuru Security Smoke Checks

วันที่อัปเดต: 2026-06-15

เอกสารนี้บันทึก workflow ตรวจ security แบบ local/sandbox สำหรับ StockGuru

## เป้าหมาย

ใช้ตรวจซ้ำว่า hardening พื้นฐานยังอยู่ เช่น:

- Anonymous user ไม่เข้าถึง paid/auth-only API ได้
- Protected pages redirect ไป auth/pricing
- AI/Research content มี disclaimer และ label near-real-time snapshot
- PWA manifest/service-worker ยังมี hooks พื้นฐาน
- Browser Use exploratory runner รันแบบ sandbox และ allowlist เท่านั้น

## Commands

### Deterministic Playwright security smoke

```bash
npm run security:smoke
```

หรือ

```bash
npm run test:e2e -- __tests__/e2e/security-smoke.spec.ts --workers=1
```

คำสั่งนี้รัน Playwright กับ local dev server ผ่าน `playwright.config.ts`

### Optional Browser Use exploratory runner

```bash
npm run dev
npm run security:browser-use
```

หรือ

```bash
python scripts/browser-use-security-scan.py
```

## Scope ที่อนุญาต

Default:

- `STOCKGURU_SECURITY_BASE_URL=http://localhost:3000`
- `ALLOWED_HOST=localhost:3000`

ถ้าใช้ host อื่น:

```bash
STOCKGURU_SECURITY_BASE_URL=http://localhost:3001 STOCKGURU_ALLOWED_HOST=localhost:3001 npm run security:browser-use
```

## ห้ามทำ

- ห้ามรันกับ production
- ห้ามใช้ browser profile ที่มี login/session จริง
- ห้ามเปิด external links
- ห้ามให้ agent ลอง internal/private networks
- ห้ามใช้กับ Supabase dashboard, Stripe dashboard, email, หรือระบบอื่นที่ไม่ใช่ StockGuru local/staging
- ห้ามใส่ API keys หรือ secrets ใน script/doc

## Checks

`__tests__/e2e/security-smoke.spec.ts` ครอบคลุม:

1. Anonymous API blocked
   - `GET /api/screener/universe` → 401
   - `POST /api/screener/export` → 401
   - `GET /api/portfolio/export` → 401
   - `POST /api/sega/review` → 401
   - `POST /api/stock/backtest` → 401

2. Protected pages
   - `/compare` anonymous → `/pricing?reason=auth_required`
   - `/portfolio` anonymous → `/pricing?reason=auth_required`

3. Data honesty / AI safety labels
   - `/research` แสดง near-real-time snapshot warning
   - `/news` แสดง AI Market Brief disclaimer

4. PWA shell
   - `/manifest.webmanifest` มี icons
   - `/service-worker.js` มี `CACHE_NAME`, `SKIP_WAITING`, และ `/icons/icon-512.png`

## Browser Use runner

`scripts/browser-use-security-scan.py` ทำ 2 ส่วน:

1. API checks ด้วย Python stdlib
2. Browser Use exploratory checks ด้วย `browser_use.beta.Agent`

Browser Use task ถูก lock ให้:

- ใช้ `allowed_domains` เฉพาะ host ที่กำหนด
- headless mode
- ไม่ sign in
- ไม่ใช้ saved profile
- ไม่เปิด external links
- ไม่ลอง internal/private networks

ถ้ายังไม่ได้ติดตั้ง Browser Use ให้รันใน venv แยก:

```bash
uv add "browser-use[core]"
# หรือ
pip install "browser-use[core]"
```

## Security notes

- Browser Use เป็น optional exploratory tool ไม่ใช่ source of truth
- Source of truth คือ deterministic Playwright suite
- ถ้า Browser Use พบ anomaly ให้แปลงเป็น Playwright regression test ก่อน merge
- ถ้า API gate รั่ว ให้แก้ route/server logic ก่อนแก้ UI
