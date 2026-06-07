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
