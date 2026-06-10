# StockGuru — อ่านก่อนเริ่มงานทุกครั้ง

> **เอกสารนี้เป็นจุดเริ่มต้นสำหรับนักพัฒนา / AI agent ทุกคนที่ทำงานในโปรเจกต์นี้**
> อ่านให้ครบก่อนแก้โค้ด ก่อน deploy หรือก่อนเพิ่มฟีเจอร์ใหม่

---

## โปรเจกต์คืออะไร

**StockGuru** คือ Thai-first stock research workspace สำหรับนักลงทุนไทย  
ดูหุ้น SET/mai + ต่างประเทศ, AI สรุปข้อมูล, screener, watchlist, alerts, portfolio, Trading Journal

**ไม่ใช่** ที่ปรึกษาการลงทุน — ห้ามใช้ภาษา "สัญญาณซื้อ", "การันตีกำไร", "AI บอกให้ซื้อ"

---

## ลำดับการอ่าน (บังคับ)

1. **START_HERE.md** (ไฟล์นี้)
2. **PRODUCT.md** — เป้าหมายผู้ใช้และ design principles
3. **DESIGN.md** — design system
4. **SKILLS.md** — เลือก skill ตามงาน
5. **AGENTS.md** — กฎสำหรับ AI agents

---

## Tech Stack

| ชั้น | เทคโนโลยี |
|------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind |
| State | TanStack Query, Zustand |
| Auth/DB | Supabase (RLS) |
| Billing | Stripe |
| AI | MiMo (`MIMO_API_KEY`) |
| Market data | Yahoo Finance (proxy) + fallback ตัวอย่าง |
| Charts | TradingView widget (stock detail) + lightweight-charts (internal compare charts) |
| Deploy | Render (`render.yaml`) |

---

## โครงสร้างสำคัญ

```
app/api/health/           # health check สำหรับ Render
app/api/billing/portal/   # Stripe Customer Portal
components/news/NewsImpactPanel.tsx
lib/hooks/use-news.ts     # news hooks (แทน useStock.ts ที่ลบแล้ว)
lib/subscription/         # plan-utils, server gating
lib/market-data/          # data source metadata
START_HERE.md             # เอกสารนี้
```

---

## กฎทอง (ห้ามละเมิด)

### 1. ความซื่อสัตย์ของข้อมูล
- Yahoo ล้มเหลว → แสดง **ข้อมูลตัวอย่าง** พร้อม badge
- **ห้าม** สร้างราคาปลอมจาก hash
- API ราคาส่ง `meta: { source, isDemo, provider, updatedAt }`

### 2. Subscription gating
- `PLAN_LIMITS` ใน `use-subscription.ts`
- UI: `<FeatureGate feature="...">`
- Server: `requireFeature()` ใน `lib/subscription/server.ts`

### 3. ข่าว = AI Market Brief
- ไม่ใช่ wire ข่าวจริง — ต้องมี disclaimer ทุกหน้า
- สรุปผลกระทบข่าว (impact score / impact points) = **Pro** เท่านั้น

### 4. Secrets
- **ห้าม commit** `.env.local`, API keys

---

## สิ่งที่ทำแล้ว

### รอบที่ 1 — Hardening pass
- [x] News link 404, field normalization, data honesty, paywall
- [x] Journal = Trader only, fundamentals UI, schema merge
- [x] Deploy config, e2e tests, START_HERE.md

### รอบที่ 2 — ทำต่อ (ไม่ต้องมี API ภายนอก)
- [x] ลบ `lib/hooks/useStock.ts` (legacy mock hooks)
- [x] Rebrand ข่าวเป็น **AI Market Brief** (หน้า news, home, sidebar, pricing)
- [x] Gate สรุปผลกระทบข่าว (`newsImpact`) บนหน้า news detail
- [x] ขยาย universe หุ้น trending (~35 symbols SET+US)
- [x] `GET /api/health` + `healthCheckPath` ใน render.yaml
- [x] `POST /api/billing/portal` + ปุ่มจัดการแผนบน pricing
- [x] Data badge บนหน้า trending
- [x] Unit tests: `plan-utils`, `news-normalize`
- [x] Export hooks ใน `lib/hooks/index.ts`

### รอบที่ 3 — PR3-PR8 (Auth, Stripe, Hardening, Tests, Polish)
- [x] **PR3** — Portfolio holdings → Supabase (`holdings` table, `use-holdings.ts`)
- [x] **PR4** — Alerts cron job (`/api/alerts/check`, `notification-service.ts`)
- [x] **PR5** — Auth + Stripe gating (middleware route protection, checkout error handling)
- [x] **PR6** — Hardening (`lib/env.ts` zod validation, rate limiting ครบทุก route, `err: any` → `instanceof Error`)
- [x] **PR7** — Tests (e2e golden path ขยาย, CI workflow พร้อม)
- [x] **PR8** — Polish (`as any` = 0 ทั้งโปรเจกต์, `Record<string, unknown>`, `Time` type จาก lightweight-charts)

### รอบที่ 4 — Home Dashboard UX/UI Polish
- [x] ปรับหน้า Home `/` เป็น market desk layout: market tiles, central chart stage, AI brief, watchlist/risk rail, scan presets, opportunity queue
- [x] เพิ่ม visual polish แบบ restrained premium: `market-panel`, `market-tile`, `table-compact`, `scan-card`, `watchlist-row`
- [x] อัปเดต `DESIGN.md` ให้บันทึก Home Dashboard polish rule, empty watchlist behavior, และ validation checklist
- [x] Verification: `npm run typecheck`, `npm run build`, `npm test`, local `/` smoke test, browser snapshot/console check

---

## Gap Analysis: StockGuru vs Top 5 Market Platforms

> **เอกสารหลัก:** `docs/TOP5_GAP_ROADMAP.md`  
> **Benchmark:** TradingView, Investing.com, Yahoo Finance, Finviz, Seeking Alpha + Thai local context: SET.or.th, Kaohoon, SETTRADE, broker apps  
> **Positioning:** StockGuru ควรเป็น **Thai market research cockpit + AI assistant** ไม่ใช่ TradingView clone

### Strategic conclusion

StockGuru มีฐานที่ดีแล้ว: Thai-first UX, auth/subscription, AI brief, watchlist, alerts, portfolio, journal, compare, screener, news, deploy pipeline  
แต่ช่องว่างใหญ่สุดก่อนขาย paid product คือ:

1. **ข้อมูล SET/mai ที่น่าเชื่อถือและครอบคลุม**
2. **Market dashboard แบบเห็นภาพรวมตลาด**
3. **Advanced screener ที่ใช้งานจริง**
4. **Smart alerts แบบราคา + volume + indicator + news/earnings**
5. **News citation + AI impact ที่มี source**
6. **Portfolio analytics และ watchlist intelligence**
7. **PWA + push notification**

### Next roadmap

ต่อจาก PR3–PR8 ที่เสร็จแล้ว ให้ใช้ลำดับนี้:

- **PR9A — Market Data Provider Abstraction** ✅ Implemented
- **PR9B — Reliable Thai Market Data** ⏸ Pending
- **PR10 — Market Dashboard**
- **PR11 — Advanced Screener**

- **PR12 — Smart Alerts + Push**
- **PR13 — News Citations + AI Impact**

- **PR14 — Portfolio Analytics**
- **PR15 — PWA + Push Notifications**

รายละเอียด full benchmark, acceptance criteria, first engineering tickets, และ definition of done อยู่ใน `docs/TOP5_GAP_ROADMAP.md`

### สิ่งที่ข้ามไปก่อน จนกว่าจะมี data/provider/legal พร้อม

- SET real-time/delayed provider
- Full SET/mai universe + sector mapping
- Fund flow / foreign holding
- News wire จริงที่มี source/citation
- PWA push infrastructure
- Broker CSV import / live execution
- Backtesting engine เต็มรูปแบบ
- Social feed / public ideas

### วิธีเปิดใช้ Stripe Customer Portal (เมื่อพร้อม)

1. ตั้ง `STRIPE_SECRET_KEY` บน Render
2. Stripe Dashboard → Settings → Billing → **Customer portal** → Enable
3. Login เป็น Pro → ไป `/pricing` → กด "จัดการแผน / ยกเลิก subscription"

### วิธีเปิดใช้ Alert Email (เมื่อพร้อม)

1. สมัคร [Resend](https://resend.com) → สร้าง API key
2. ตั้ง `RESEND_API_KEY` บน Render web service
3. Verify domain `alerts@stockguru.app` (หรือเปลี่ยนใน `notification-service.ts`)

### วิธีเปิดใช้ Redis (เมื่อ scale หลาย instance)

1. สร้าง Render Key Value หรือ Redis Cloud
2. ตั้ง `REDIS_URL`
3. แทน `lib/cache.ts` ด้วย Redis client (ดู `skills/stockguru-market-data/SKILL.md`)

---

## คำสั่งพัฒนา

```bash
npm install
cp .env.example .env.local
npm run dev
npm run typecheck
npm run build
npm test
npm run test:e2e
```

---

## Environment Variables

|| ตัวแปร | จำเป็น prod | หมายเหตุ ||
|--------|-------------|----------|
| `MIMO_API_KEY` | ใช่ | AI + news refresh |
| `NEXT_PUBLIC_SUPABASE_*` | ใช่ | Auth, DB |
| `SUPABASE_SERVICE_ROLE_KEY` | ใช่ | Cron, webhooks |
| `STRIPE_SECRET_KEY` | ใช่ (billing) | + เปิด Customer Portal ใน Dashboard |
| `CRON_SECRET` | ใช่ | ป้องกัน cron routes |
| `RESEND_API_KEY` | แนะนำ | ⏸ ยังไม่ตั้ง = alert email ไม่ส่ง |
| `REDIS_URL` | ไม่บังคับ | ⏸ ยังไม่ตั้ง = ใช้ in-memory |
| `SENTRY_DSN` | ไม่บังคับ | ⏸ ยังไม่ตั้ง |
| `YAHOO_FINANCE_PROXY` | ไม่บังคับ | ⏸ ตั้งเมื่อ Yahoo block |
| `SET_API_KEY` | ไม่บังคับ (ตอนนี้) | ⏸ SET real-time data (Gap: Strategic) |
| `NEWS_API_KEY` | ไม่บังคับ (ตอนนี้) | ⏸ News wire จริง (Gap: Strategic) |
| `VAPID_PUBLIC_KEY` | ไม่บังคับ | ⏸ PWA Push (Gap: Quick Win) |
| `VAPID_PRIVATE_KEY` | ไม่บังคับ | ⏸ PWA Push (Gap: Quick Win) |
| `VAPID_SUBJECT` | ไม่บังคับ | ⏸ PWA Push contact (mailto:...) |

---

## Deploy (Render)

- Web: `stockguru-web` → `https://stockguru-web.onrender.com`
- Health: `GET /api/health`
- Cron: news refresh (30 นาที), alerts check (5 นาที)
- ก่อน deploy: รัน `supabase/schema.sql` บน Supabase
- อ่าน `skills/stockguru-deploy/SKILL.md`

---

## Checklist ก่อน merge / deploy

- [ ] อ่าน START_HERE.md + skill ที่เกี่ยวข้อง
- [ ] Pro feature → `PLAN_LIMITS` + `FeatureGate` + server check
- [ ] ราคา → ส่ง `meta` + badge
- [ ] AI → disclaimer, ไม่ buy/sell advice
- [ ] `npm run typecheck && npm run build && npm test`
- [ ] อัปเดต START_HERE.md ถ้าเปลี่ยน architecture หรือเพิ่มงานที่ข้าม

---

## ติดต่อ / Repo

- GitHub: `https://github.com/threerat1212/stockguru`
- Live: `https://stockguru-web.onrender.com`

---

*อัปเดตล่าสุด: มิถุนายน 2026 — รอบที่ 3 (PR3-PR8 เสร็จสมบูรณ์, `as any` = 0)*
