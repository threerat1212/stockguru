# StockGuru PR Roadmap

> ลำดับ: PR3 → PR4 → PR5 → PR6 → PR7 → PR8
> แต่ละ PR แตก branch จาก main + ผ่าน CI ก่อน merge
>
> **สถานะล่าสุด: PR3–PR8 เสร็จสมบูรณ์ (มิถุนายน 2026)**

---

## PR3 — Portfolio holdings เข้า Supabase ✅

**Goal:** ย้าย portfolio จาก localStorage ไป Supabase แบบ real auth

### Schema (เพิ่มใน `supabase/schema.sql`)
```sql
create table if not exists public.holdings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  symbol text not null,
  quantity int not null check (quantity > 0),
  buy_price numeric not null check (buy_price > 0),
  currency text not null default 'THB',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.holdings enable row level security;

create policy "Users can CRUD own holdings"
  on public.holdings for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_holdings_user_id on public.holdings(user_id);
create index if not exists idx_holdings_symbol on public.holdings(symbol);
```

### Files to change
1. `supabase/schema.sql` — เพิ่มตาราง holdings
2. `lib/hooks/use-holdings.ts` — ใหม่ (pattern คล้าย use-subscription.ts)
3. `app/portfolio/page.tsx` — แทน localStorage ด้วย useHoldings
4. `lib/hooks/index.ts` — export useHoldings

### Verify
- `npm run build` ผ่าน
- Guest (ไม่ login) เห็นข้อความให้ login แทน portfolio
- User login เพิ่ม/ลบ holding ได้ ข้อมูล persist หลัง refresh

---

## PR4 — Alerts ทำงานจริง ✅

**Goal:** Cron job เช็คราคา + ส่ง email/web-push เมื่อแตะเป้า

### Schema (มี alerts แล้ว แต่ต้องเพิ่ม columns)
```sql
-- ถ้ายังไม่มี (ตรวจสอบก่อน)
-- alerts มีแล้ว: symbol, target_price, condition, triggered, triggered_at
-- อาจต้องเพิ่ม: notification_channel text default 'web_push'
```

### Files to change
1. `render.yaml` — เพิ่ม cron job `stockguru-alerts-check`
2. `app/api/alerts/check/route.ts` — ใหม่: ดึง alerts ที่ยังไม่ triggered, เช็คราคา, mark triggered, ส่ง notification
3. `app/api/alerts/notify/route.ts` — ใหม่: web-push / email notification endpoint
4. `app/alerts/page.tsx` — แทน localStorage ด้วย Supabase (คล้าย PR3)
5. `lib/hooks/use-alerts.ts` — ใหม่ (hybrid: Supabase + local fallback)

### Verify
- Cron job เรียก `/api/alerts/check` ด้วย CRON_SECRET header
- Alert แตะเป้า → triggered=true + ได้รับ notification
- ป้องกัน double-trigger (check triggered ก่อน)

---

## PR5 — Auth จริง + Stripe gating ✅

**Goal:** แทน demo flag ด้วย Supabase session + subscription check

### Files to change
1. `components/ai/AIChat.tsx` — ใช้ `useAuth` + `useSubscription` (ตรวจสอบว่าใช้แล้ว)
2. `app/api/chat/route.ts` — ใช้ auth + usage limit (ตรวจสอบว่าใช้แล้ว)
3. `app/pricing/page.tsx` — ต่อ Stripe checkout
4. `components/auth/AuthModal.tsx` — ปรับปรุง UX (error handling, loading states)
5. `middleware.ts` — ถ้ามี: protect routes ตาม plan

### Verify
- Guest → AI lock + redirect to pricing
- Free user → 3 questions/day limit
- Pro user → unlimited
- Stripe webhook → subscription status update

---

## PR6 — Hardening ✅

**Goal:** zod validate env + input, rate limiting, Sentry

### Dependencies
```bash
npm install zod @sentry/nextjs
```

### Files to change
1. `lib/env.ts` — ใหม่: zod schema สำหรับ env vars
2. `app/api/**/route.ts` — ใส่ zod validation ให้ request body
3. `lib/middleware/rate-limit.ts` — ใหม่: rate limiting สำหรับ Yahoo proxy
4. `next.config.js` — Sentry config
5. `instrumentation.ts` — Sentry init

### Verify
- `npm run build` ผ่าน
- Missing env → error ตอน build/dev
- Invalid input → 400 Bad Request
- Rate limit → 429 Too Many Requests

---

## PR7 — Tests ✅

**Goal:** vitest + RTL + Playwright e2e golden path + CI

### Dependencies
```bash
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
npm install -D @playwright/test
```

### Files to change
1. `vitest.config.ts` — ใหม่
2. `vitest.setup.ts` — ใหม่
3. `__tests__/unit/**/*.test.ts` — unit tests
4. `__tests__/e2e/**/*.spec.ts` — Playwright e2e
5. `.github/workflows/ci.yml` — ใหม่
6. ลบ `output/playwright/` logs (add to .gitignore)

### Verify
- `npm test` → unit tests pass
- `npm run test:e2e` → Playwright golden path pass
- CI green บน GitHub Actions

---

## PR8 — Polish ✅

**Goal:** ลด any (~54 จุด), accessibility, mock data, i18n

### Files to change
1. ค้นหา `as any` ทั้งหมด → แก้ type ให้ถูกต้อง
2. `components/ui/` — ใส่ aria-labels, focus states, keyboard nav
3. `lib/data/news.ts` → ต่อ external API หรือ CMS
4. `lib/i18n/` — ใหม่: th/en JSON files
5. `next.config.js` — i18n config

### Verify
- `npx tsc --noEmit` → ไม่มี type error
- Lighthouse accessibility ≥ 90
- `npm run build` ผ่าน

---

## PR9A — Market Data Provider Abstraction ✅ Implemented

**Goal:** แยก Yahoo implementation ออกจาก service entrypoint เพื่อให้ StockGuru สลับ provider ในอนาคตได้ โดยไม่เปลี่ยน API route/hook ที่มีอยู่

### Files changed
1. `lib/market-data/provider.ts` — เพิ่ม `MarketDataProvider` interface และ provider id constants
2. `lib/market-data/client.ts` — provider registry + active provider resolver
3. `lib/market-data/providers/yahoo-provider.ts` — ย้าย Yahoo implementation ออกจาก `lib/services/stock-service.ts`
4. `lib/services/stock-service.ts` — คง public exports เดิม: `getQuote`, `getHistory`, `searchStocks`, `getTrending`, `getMarketIndices`
5. `__tests__/unit/market-data-provider.test.ts` — unit tests สำหรับ default provider / unknown provider fallback
6. `lib/market-data/types.ts` — เพิ่ม provider identity constants

### Acceptance criteria
- [x] API routes ไม่ต้องแก้ เพราะ `lib/services/stock-service.ts` ยัง export ชื่อเดิม
- [x] Yahoo provider อยู่ภายใต้ `lib/market-data/providers/`
- [x] มี provider interface สำหรับเพิ่ม SET/mai provider ในอนาคต
- [x] Unknown provider id fallback กลับไป Yahoo
- [x] Unit tests ผ่าน

### Verify
- `npm run typecheck` → passed
- `npm test` → 34 tests passed
- `npm run build` → passed

### Still pending for full PR9
- SET/mai real-time/delayed provider
- Full SET/mai universe + sector mapping
- Provider-aware cache metadata
- Replace remaining mock SET index / Thai stocks fetchers

---

## PR9B — Reliable Thai Market Data ⏸ Pending

**Goal:** เปลี่ยน StockGuru จาก demo/sample data เป็น market data layer ที่น่าเชื่อถือสำหรับ SET/mai และ US symbols ที่เลือก

### Files to change
1. `lib/market-data/providers/set-provider.ts` — adapter สำหรับ provider ใหม่
2. `lib/data/fetchers/set-index.ts` — แทน mock SET index ด้วย provider
3. `lib/data/fetchers/thai-stocks.ts` — full SET/mai universe + sector mapping
4. `lib/cache.ts` — พิจารณา provider-aware cache key / Redis เมื่อ scale
5. Unit tests — provider metadata, fallback behavior, unknown symbol handling

### Acceptance criteria
- หุ้นไทยค้นได้ครบ SET/mai universe
- SET/mai index ไม่ใช่ mock production
- ทุก price/chart/search/trending response มี data badge/source metadata
- Demo/fallback แสดงชัดเจนว่าไม่ใช่ข้อมูลจริง
- ไม่ commit secret/API key

### Verify
- `npm run typecheck`
- `npm run build`
- `npm test`
- Manual test: `/stock/PTT.BK`, `/screener`, `/compare`, `/watchlist`

---

## PR10 — Market Dashboard ✅ Planned

**Goal:** เพิ่มหน้า market overview แบบ Finviz/Investing: เปิดมาแล้วเห็นภาพรวมตลาดไทยทันที

### Files to change
1. `app/market/page.tsx` — หน้าใหม่ หรือปรับ `app/page.tsx` เป็น dashboard หลัก
2. `lib/data/market-dashboard.ts` — รวม indices, breadth, movers, sector summary
3. `components/market/MarketBreadth.tsx` — advance/decline, new high/low
4. `components/market/TopMovers.tsx` — top gainers/losers/volume movers
5. `components/market/SectorHeatmap.tsx` — heatmap ภาคกิจการ
6. `app/page.tsx` — link ไป dashboard / embed summary card

### Acceptance criteria
- แสดง SET, SET50, SET100, mai
- แสดง advance/decline, top gainers/losers, volume movers
- แสดง sector heatmap หรือ sector performance table
- ใช้ข้อมูลจริงเป็นหลัก fallback แสดง demo badge
- Mobile layout ไม่ overflow

### Verify
- `npm run build`
- Manual test: `/market` desktop + mobile
- Data badge แสดงถูกต้อง

---

## PR11 — Advanced Screener ✅ Planned

**Goal:** ยกระดับ screener จากหน้าทั่วไป เป็นเครื่องมือหาหุ้นที่ผู้ใช้ Pro/Trader ใช้จริง

### Filters
- Exchange: SET / mai / US
- Sector / industry
- Market cap
- PE / PB / ROE / dividend yield
- Volume / average volume
- 52-week high/low
- MA / RSI
- Earnings/dividend flag
- Save screener
- Export CSV

### Files to change
1. `app/screener/page.tsx` — filter panel + results table
2. `lib/screener/types.ts` — filter schema
3. `lib/screener/apply-filters.ts` — filter logic
4. `lib/screener/save-screener.ts` — Supabase save/load
5. `components/screener/` — filter controls, result table, save/export actions
6. `components/auth/FeatureGate.tsx` — gate `advancedScreener`
7. API routes — ถ้าเก็บ screener ใน Supabase ให้มี route ที่ใช้ `requireFeature('advancedScreener')`

### Acceptance criteria
- Free user เห็น gate และ limit
- Pro/Trader save screener ได้
- Export CSV ได้
- Filter ทำงานกับ full universe
- No `any` regression

### Verify
- `npm run typecheck`
- `npm run build`
- `npm test`
- Manual test: save screener as Pro/Trader, guest/free sees upgrade CTA

---

## PR12 — Smart Alerts + Push ✅ Planned

**Goal:** ขยาย alerts จาก price above/below เป็น smart alerts ที่ทำให้ user กลับมาใช้ทุกวัน

### Alert types
- Price above/below
- Daily % change
- Volume spike
- MA cross
- RSI overbought/oversold
- News/earnings event
- Portfolio risk threshold

### Files to change
1. `supabase/schema.sql` — เพิ่ม `alert_type`, `notification_channel`, `params`, `last_notified_at`
2. `app/api/alerts/check/route.ts` — รองรับ alert type ใหม่ + idempotency
3. `app/api/alerts/notify/route.ts` — email + web push
4. `lib/services/notification-service.ts` — email/push abstraction
5. `app/alerts/page.tsx` — UI สร้าง smart alert
6. `lib/hooks/use-alerts.ts` — type + CRUD สำหรับ alert type ใหม่
7. PWA service worker — web push subscription

### Acceptance criteria
- ไม่ double-trigger alert เดิม
- Email ส่งเมื่อมี `RESEND_API_KEY`
- Push ส่งเมื่อ user subscribe
- Cron route ป้องกันด้วย `CRON_SECRET`
- Plan limit ทำงานทั้ง client และ server

### Verify
- Manual cron call ด้วย `CRON_SECRET`
- Mock provider test สำหรับ alert trigger
- `npm run typecheck && npm run build && npm test`

---

## PR13 — News Citations + AI Impact ✅ Planned

**Goal:** รักษาจุดแข็ง AI Market Brief แต่เพิ่ม source/citation เพื่อให้เชื่อถือได้เหมือน Yahoo/Investing/Seeking Alpha

### Files to change
1. `supabase/schema.sql` — news articles เก็บ `source_url`, `source_name`, `provider`, `related_symbols`
2. `app/api/news/route.ts` — return source metadata
3. `components/news/NewsCard.tsx` — แสดง source, timestamp, related symbols
4. `components/news/NewsImpactPanel.tsx` — impact score/points gated Pro
5. `lib/news/normalize.ts` — schema validation
6. AI refresh job — generate impact summary จากข่าวจริง + disclaimer

### Acceptance criteria
- ข่าวทุกบทความมี source link
- AI summary แยกจากข่าวจริงชัดเจน
- Impact panel gated Pro
- ทุกหน้า news/detail มี disclaimer
- ไม่ใช้คำว่า “ซื้อ/ขาย/การันตี”

### Verify
- Manual test `/news`
- Unit test `normalizeNewsArticle`
- `npm run build`

---

## PR14 — Portfolio Analytics ✅ Planned

**Goal:** เปลี่ยน portfolio/journal จากบันทึก manual เป็น dashboard วิเคราะห์การลงทุนส่วนตัว

### Metrics
- Realized / unrealized P/L
- Allocation by symbol/sector/currency
- Benchmark vs SET / SET50
- Dividend income
- Risk exposure
- Link to journal trades
- Export statement CSV

### Files to change
1. `app/portfolio/page.tsx` — analytics layout
2. `lib/hooks/use-holdings.ts` — คำนวณ metrics
3. `lib/services/portfolio-service.ts` — server-side calculations
4. `components/portfolio/` — allocation chart, P/L summary, benchmark card
5. `app/journal/page.tsx` — link journal entries
6. Export CSV route

### Acceptance criteria
- User login เห็น portfolio metrics
- Guest เห็น upgrade/login CTA
- คำนวณ currency ถูกต้อง
- Benchmark comparison ชัดเจน
- Export CSV ได้

### Verify
- `npm run typecheck`
- `npm run build`
- Manual test with sample holdings

---

## PR15 — PWA + Push Notifications ✅ Planned

**Goal:** ทำให้ StockGuru ใช้งานบนมือถือเหมือน app และรองรับ push สำหรับ alerts/daily brief

### Files to change
1. `public/manifest.webmanifest` — PWA manifest
2. `app/icon...` / `app/apple-icon...` — icons
3. `service-worker.ts` หรือ Next PWA setup
4. `app/api/push/subscribe/route.ts`
5. `app/api/push/send/route.ts`
6. `app/alerts/page.tsx` — subscribe/unsubscribe push
7. `lib/services/push-service.ts`

### Acceptance criteria
- Browser สามารถ install app
- User subscribe push ได้
- Alert trigger ส่ง push ได้
- Unsubscribe ได้
- Service worker ไม่ break SSR

### Verify
- Playwright mobile test
- Manual push subscription
- `npm run build`

---

## Backlog reference

รายละเอียด gap analysis, benchmark, acceptance criteria และ first engineering tickets อยู่ใน:

- `docs/TOP5_GAP_ROADMAP.md`
