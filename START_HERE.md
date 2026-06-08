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
| Charts | lightweight-charts |
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

---

## Gap Analysis: StockGuru vs Top 5 Thai Stock Sites

> **เปรียบเทียบกับ:** SET.or.th, Kaohoon, SETTRADE, Investing.com (TH), Longdo Dict (Stock)

### Quick Wins (ทำได้เร็ว, ผลกระทบสูง, ไม่ต้อง API ใหม่)

| ฟีเจชอร์ | ช่องว่างปัจจุบัน | ขนาดงาน | ความสำคัญ |
|-----------|----------------|----------|------------|
| **Watchlist สัญญาณ (Signal Watchlist)** | ไม่มี — watchlist เป็นแค่รายชื่อ | S (1-2 วัน) | 🔥 Critical |
| **Smart Alerts (ราคา + ปริมาณ + เงื่อนไขเทคนิค)** | มีแค่ price alert, ไม่มี volume/MA cross | S (2-3 วัน) | 🔥 Critical |
| **News Impact Panel (มีอยู่แล้ว → ขยาย)** | หน้า detail มี, แต่งว่างบน 홈 + trending | S (1 วัน) | 🔥 Critical |
| **Economic Calendar (iCal/ICS import)** | ไม่มี — ต้องดูเว็บอื่น | S (1-2 วัน) | 🔥 Critical |
| **Market Breadth (Advance/Decline, New High/Low)** | ไม่มี — ต้องดู SET | M (3-5 วัน) | 🔥 Critical |
| **Heatmap ภาคกิจการ + ขนาดตลาด** | ไม่มี — ต้องดู Kaohoon/SETTRADE | M (3-5 วัน) | 🔥 Critical |
| **Compare ตาราง (Side-by-side fundamentals)** | ไม่มี — เปรียบเทียบยาก | M (3-5 วัน) | 🔥 Critical |
| **PWA + Push Notification (VAPID)** | ไม่มี — mobile UX อ่อน | M (3-5 วัน) | 🔥 Critical |

### Strategic Priorities (ต้องมี API/ข้อตกลง/งบประมาณ)

| ฟีเจชอร์ | ช่องว่างปัจจุบัน | ต้องการ | ขนาดงาน | ความสำคัญ |
|-----------|----------------|----------|----------|------------|
| **SET Real-time Level 1 (Last, Bid/Ask, Volume)** | Yahoo 15-30 min delay | `SET_API_KEY` หรือ broker partner | L (2-4 สัปดาห์ + legal) | 🔥 Critical |
| **SET Level 2 (Order Book Depth)** | ไม่มีเลย | SET API / broker | XL (1-2 เดือน) | 🔴 High |
| **Thai Fundamentals จริง (FS, Ratio, Dividend History)** | MiMo สรุปเฉยๆ, ไม่มี raw data | Vendor (Finnhub, SET, Kaohoon API) | L (3-6 สัปดาห์) | 🔥 Critical |
| **Fund Flow (Foreign/Inst/Proprietary Net Buy/Sell)** | ไม่มี — ดู SET/TSFC | SET API / TSFC / vendor | L (2-4 สัปดาห์) | 🔴 High |
| **News Wire จริง (Reuters, Benzinga, SET RSS)** | AI Brief เท่านั้น | `NEWS_API_KEY` / RSS parser | M (2-3 สัปดาห์) | 🔴 High |
| **Broker Execution (Paper → Live)** | Journal = manual | Broker API (KTZ, Bualuang, SCB) | XL (3-6 เดือน) | 🟡 Medium |
| **Backtesting Engine (Vectorized + Event-driven)** | ไม่มี | Custom / Backtrader / Zipline | XL (2-3 เดือน) | 🟡 Medium |
| **Screener มาตรฐานไทย (SET50, SET100, mai, ESG)** | Universe ~35 symbols | Full SET list + sector mapping | M (2-3 สัปดาห์) | 🔴 High |

### Technical Debt & Architecture Improvements

| หัวข้อ | ปัญหา | แนวทางแก้ | ขนาดงาน |
|--------|-------|-----------|----------|
| **Data Source Abstraction** | logic ผสมใน hooks, ยากสลับ provider | `lib/market-data/adapters/` + interface `IMarketDataProvider` | M |
| **Cache Layer แบบ Unified** | in-memory แยกต่อ route, ไม่มี TTL ตัวเลข | Redis + `lib/cache.ts` rewrite (skill: stockguru-market-data) | M |
| **Type Safety: API Contracts** | `any` ใน response, ไม่มี schema | Zod schemas ทุก route + `openapi` spec | S-M |
| **Error Boundaries + Logging** | `console.error` ทั่วไป, ไม่มี correlation ID | Sentry + structured logging (pino) | S |
| **Background Jobs Framework** | Cron เป็น API route แยกต่างหาก | BullMQ + Redis หรือ Render Cron Jobs แบบ managed | M |
| **Mobile-first Responsive** | บางหน้า overflow บน mobile | Audit ทุกหน้า + Tailwind `md:` `lg:` consistent | M |
| **i18n Infrastructure** | TH only, hardcoded strings | `next-intl` หรือ `i18next` + translation files | M |

---

## สิ่งที่ข้ามไปก่อน (ต้องมีเงื่อนไข)

> **อย่าเริ่มงานเหล่านี้จนกว่าจะมีสิ่งที่ระบุในคอลัมน์ "เงื่อนไข"**

|| งาน | เงื่อนไขที่ต้องมี | สถานะ | หมายเหตุ ||
|-----|-------------------|--------|----------|
| **SET data provider จริง** | สัญญา/license SET หรือ API key (Finnhub, Alpha Vantage, broker partner) | ⏸ ข้าม | Yahoo ยังใช้ได้แต่ไม่พอสำหรับ paid product ไทย |
| **News wire จริง** | `NEWS_API_KEY` หรือ provider (Reuters, Benzinga, SET RSS) | ⏸ ข้าม | ตอนนี้ใช้ AI brief + rebrand แล้ว |
| **Redis cache** | `REDIS_URL` หรือ Render Key Value instance | ⏸ ข้าม | in-memory cache ใช้ได้บน single instance |
| **Sentry monitoring** | `SENTRY_DSN` + `npm install @sentry/nextjs` | ⏸ ข้าม | ดู PR6 ใน stockguru-roadmap.md |
| **Resend alert emails** | `RESEND_API_KEY` บน Render Dashboard | ⏸ ข้าม | โค้ด cron พร้อมแล้ว แต่ email ไม่ส่งถ้าไม่มี key |
| **Stripe portal ใช้งานจริง** | `STRIPE_SECRET_KEY` + เปิด Customer Portal ใน [Stripe Dashboard](https://dashboard.stripe.com/settings/billing/portal) | ⚠️ โค้ดพร้อม | ปุ่มอยู่หน้า `/pricing` สำหรับสมาชิก Pro+ |
| **Yahoo proxy** | `YAHOO_FINANCE_PROXY` ถ้า Render IP โดน block | ⏸ ข้าม | ตั้งเมื่อ quote API ล้มเหลวบ่อย |
| **Sector data จริง** | SET sector API หรือ vendor | ⏸ ข้าม | หน้า sector มีคำเตือน demo แล้ว |
| **i18n EN** | ตัดสินใจ scope + ไฟล์แปล | ⏸ ข้าม | PR8 ใน roadmap |
| **Fund Flow (Foreign/Inst/Proprietary)** | `SET_API_KEY` หรือ TSFC / vendor data feed | ⏸ ข้าม | Gap Analysis: Strategic Priority |
| **Economic Calendar** | iCal/ICS source หรือ API (TradingEconomics, SET) | ⏸ ข้าม | Gap Analysis: Quick Win |
| **Heatmap ภาคกิจการ** | SET sector list + market cap data | ⏸ ข้าม | Gap Analysis: Quick Win |
| **Compare ตาราง (Side-by-side)** | Thai fundamentals raw data | ⏸ ข้าม | Gap Analysis: Quick Win |
| **PWA + Push (VAPID)** | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | ⏸ ข้าม | Gap Analysis: Quick Win |

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
