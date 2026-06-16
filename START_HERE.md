# StockGuru — อ่านก่อนเริ่มงานทุกครั้ง

> **เอกสารนี้เป็นจุดเริ่มต้นสำหรับนักพัฒนา / AI agent ทุกคนที่ทำงานในโปรเจกต์นี้**
> อ่านให้ครบก่อนแก้โค้ด ก่อน deploy หรือก่อนเพิ่มฟีเจอร์ใหม่

---

## โปรเจกต์คืออะไร

**StockGuru** คือ Thai-first stock research workspace สำหรับนักลงทุนไทย
ดูหุ้น SET/mai + ต่างประเทศ, AI สรุปข้อมูล, screener, watchlist, alerts, portfolio, Trading Journal, Agent Looping War Room, SEGA Review Gate, และ MiroFish Swarm

**ไม่ใช่** ที่ปรึกษาการลงทุน — ห้ามใช้ภาษา "สัญญาณซื้อ", "การันตีกำไร", "AI บอกให้ซื้อ"
**ไม่ใช่** trading execution system — Agent Looping เป็น decision support/rehearsal ไม่ใช่ส่ง order จริง

---

## ลำดับการอ่าน (บังคับ)

1. **START_HERE.md** (ไฟล์นี้)
2. **PRODUCT.md** — เป้าหมายผู้ใช้และ design principles
3. **DESIGN.md** — design system
4. **SKILLS.md** — เลือก skill ตามงาน
5. **AGENTS.md** — กฎสำหรับ AI agents

สำหรับงานวิศวกรรมที่ไม่ใช่งานเล็กมาก หรือเมื่อต้องนำ workflow จาก external agent skills มาปรับใช้ ให้เริ่มจาก `skills/stockguru-agent-workflow/SKILL.md` แล้วค่อยอ่าน domain skill ที่เกี่ยวข้อง

---

## Tech Stack

| ชั้น | เทคโนโลยี |
|------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind |
| State | TanStack Query, Zustand |
| Auth/DB | Supabase (RLS) |
| Billing | Stripe |
| AI | MiMo default + optional OpenRouter/DeepSeek model assist; deterministic debate fallback |
| Market data | SiamChart SET/mai primary + Yahoo fallback/demo provenance |
| Charts | TradingView widget (stock detail) + lightweight-charts (internal compare charts) |
| Deploy | Render (`render.yaml`) |

---

## โครงสร้างสำคัญ

```
app/api/health/           # health check สำหรับ Render
app/api/billing/portal/   # Stripe Customer Portal
components/news/NewsImpactPanel.tsx
lib/hooks/use-news.ts     # news hooks (current hook path is use-stock.ts; legacy camel-case useStock.ts removed)
lib/agent-loop/           # Agent Looping orchestrator, agents, verifier, SEGA review gate
lib/research-notes/       # parser/types สำหรับ Research Memory markdown
knowledge/                # Obsidian-style research vault: raw notes, articles, topics, sources
app/war-room/             # Market War Room UI
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
- Export/Data endpoints ต้องกันที่ API/RLS ด้วย ไม่ใช่แค่ UI

### 4. ข่าว = AI Market Brief
- ไม่ใช่ wire ข่าวจริง — ต้องมี disclaimer ทุกหน้า
- สรุปผลกระทบข่าว (impact score / impact points) = **Pro** เท่านั้น

### 5. Research Memory = near-real-time snapshot
- ใช้ `knowledge/` เป็น Obsidian-style vault สำหรับบทความจาก market snapshot ทุก 30–60 นาที
- ต้องมี `snapshotAt`, `sources`, `aiAssisted`, `status`, และ disclaimer
- Research Memory ไม่ใช่ real-time market data provider

### 6. Agent Looping + SEGA + MiroFish Swarm = decision support
- Agent Looping / War Room ต้องผ่าน verifier gate: ไม่มี buy/sell advice, มี disclaimer, มี evidence, มี risk checklist
- SEGA Review Gate review thesis, downside, exit plan, allocation envelope, risk score และ approval decision โดยไม่สร้างสัญญาณใหม่หรือส่ง order
- MiroFish Swarm ใช้จำลองสังคม multi-agent: personas, memory, beliefs, simulated Twitter/Reddit, scenario map, risks, opportunities, blind spots
- ห้ามเชื่อม broker / ส่ง order / autonomous trading ใน PR16/PR18/PR19/PR20
- Trading system เป็น future backlog: Trade Plan → Paper Trading → optional user-approved execution

### 7. Secrets
- **ห้าม commit** `.env.local`, API keys

### 8. Security smoke
- ใช้ `npm run security:smoke` สำหรับ Playwright gate/disclaimer/PWA checks
- ใช้ `npm run security:browser-use` เป็น optional exploratory runner; ต้องรันกับ sandbox/allowed_domains เท่านั้น
- ดูรายละเอียดใน `docs/SECURITY_SMOKE.md`

---

## สิ่งที่ทำแล้ว

### รอบที่ 1 — Hardening pass
- [x] News link 404, field normalization, data honesty, paywall
- [x] Journal UI gate = Trader; server-side review gate and RLS plan gates added for portfolio/journal/war-room surfaces
- [x] Fundamentals UI, schema merge
- [x] Deploy config, e2e tests, START_HERE.md

### รอบที่ 2 — ทำต่อ (ไม่ต้องมี API ภายนอก)
- [x] ลบ `lib/hooks/useStock.ts` (legacy mock hooks); current `lib/hooks/use-stock.ts` ยังถูกใช้งาน
- [x] Rebrand ข่าวเป็น **AI Market Brief** (หน้า news, home, sidebar, pricing)
- [x] Gate สรุปผลกระทบข่าว (`newsImpact`) แยกตาราง impact และ redaction ใน `/api/news`
- [x] ขยาย universe หุ้น trending (~35 symbols SET+US)
- [x] `GET /api/health` + `healthCheckPath` ใน render.yaml
- [x] `POST /api/billing/portal` + ปุ่มจัดการแผนบน pricing
- [x] Data badge บนหน้า trending
- [x] Unit tests: `plan-utils`, `news-normalize`
- [x] Export hooks ใน `lib/hooks/index.ts`

### รอบที่ 3 — PR3-PR8 (Auth, Stripe, Hardening, Tests, Polish)
- [x] **PR3** — Portfolio holdings → Supabase (`holdings` table, `use-holdings.ts`)
- [x] **PR4** — Alerts cron job (`/api/alerts/check`, `notification-service.ts`) + conditional email/web-push
- [x] **PR5** — Auth + Stripe gating (middleware route protection, checkout error handling)
- [x] **PR6** — Hardening (`lib/env.ts` zod validation, selected API rate limiting, `err: any` cleanup ส่วนใหญ่)
- [x] **PR7** — Tests (e2e golden path ขยาย, CI workflow พร้อม)
- [x] **PR8** — Polish (ลด `as any`; ยังเหลือ type debt บางจุด)

### รอบที่ 4 — Home Dashboard UX/UI Polish
- [x] ปรับหน้า Home `/` เป็น market desk layout: market tiles, central chart stage, AI brief, watchlist/risk rail, scan presets, opportunity queue
- [x] เพิ่ม visual polish แบบ restrained premium: `market-panel`, `market-tile`, `table-compact`, `scan-card`, `watchlist-row`
- [x] อัปเดต `DESIGN.md` ให้บันทึก Home Dashboard polish rule, empty watchlist behavior, และ validation checklist
- [x] Verification: `npm run typecheck`, `npm run build`, `npm test`, local `/` smoke test, browser snapshot/console check

### รอบที่ 5 — PR16 Agent Looping / Market War Room
- [x] **PR16** — Agent Looping backend: types, schema, data collector, agents, verifier, orchestrator
- [x] **PR16** — `POST /api/agent-loop/simulate` gated by Pro plan
- [x] **PR16** — `/war-room` UI with scope selector, scenario input, closed-loop trace, agent cards, verifier, risk/checklist
- [x] **PR16** — docs: `docs/AGENT_LOOPING_MVP.md`, `docs/TRADING_SYSTEM_BACKLOG.md`
- [x] Verification: `npm run typecheck`, `npm run build`, `npm test`
- [ ] Manual browser smoke test `/war-room` with logged-in Pro account

### รอบที่ 6 — PR18 MiroFish Debate Mode
- [x] **PR18** — MiroFish-style debate backend: seed extractor, personas, graph, rounds, reporter, verifier
- [x] **PR18** — `POST /api/war-room/debate` gated by Pro plan
- [x] **PR18** — `/war-room` Debate Mode UI with question input, transcript, verifier, risk/checklist
- [x] **PR18** — Supabase debate tables + migration `20260611150000_pr18_war_room_debate.sql`
- [x] **PR18** — docs: `docs/MIROFISH_DEBATE_MODE.md`, updated `docs/AGENT_LOOPING_MVP.md`
- [x] Verification: `npm run typecheck`, `npm run build`, `npm test`, local `/war-room` gate smoke test, anonymous API gate check

### รอบที่ 7 — SEGA Review Gate
- [x] **SEGA** — Finance Division / Capital Allocation & Risk Agent สำหรับ review Agent Loop / MiroFish Debate result
- [x] **SEGA** — proposal schema, adapters, deterministic approval gate, Thai Storycraft renderer
- [x] **SEGA** — `POST /api/sega/review` รับ explicit proposal หรือ derive proposal จาก result
- [x] **SEGA** — `/war-room` render approval/storycraft payload จาก server โดยตรง
- [x] Verification: `npm run typecheck`, `npm run lint`, `npm test`, SEGA targeted unit tests 19 passed

### รอบที่ 8 — Agent Workflow Adapter
- [x] ปรับ lifecycle/quality-gate ideas จาก `https://github.com/addyosmani/agent-skills` ให้เข้ากับ StockGuru
- [x] ระบุชัดว่าไม่ copy upstream ทั้ง repo, slash commands, platform folders, hooks, personas, zip packaging, หรือ generic docs เข้ามาโดยไม่ review
- [x] อัปเดต `SKILLS.md` และ `docs/IMPLEMENTATION_UPDATE.md`

### รอบที่ 9 — PR22 Research Memory / Obsidian Workflow
- [x] เพิ่ม `knowledge/` vault พร้อม `_raw`, `articles`, `topics`, `sources`
- [x] เพิ่ม `lib/research-notes/` parser/types
- [x] เพิ่ม `GET /api/research-notes` และ `/research`
- [x] เพิ่ม `scripts/import-research-notes.mjs` และ unit test

### รอบที่ 10 — PR23 Security Hardening Sweep
- [x] `app/api/data/fetch/route.ts`: เพิ่ม CRON_SECRET gate (เดิมเปิดโปร่ง — DoS/cost abuse)
- [x] `scripts/fetch-data.js` + `render.yaml`: แนบ `Authorization: Bearer ${CRON_SECRET}` ให้ data-fetch cron
- [x] `.gitignore`: ครอบ `.playwright-cli/`, `playwright-report/`, `test-results/`, `coverage/` + `git rm --cached` log/output ที่ค้าง
- [x] `lib/data/scheduler.ts`: กำจัด `null as any` × 5 → typed `FetchAllResults`
- [x] `supabase/schema.sql` + migration `20260616000000_rls_with_check_hardening.sql`: เพิ่ม `WITH CHECK` ให้ watchlists/alerts/push_subscriptions
- [x] Audit: ไม่พบ hardcoded secret; Stripe webhook/cron routes/sensitive per-user routes ทั้งหมด gated ครบ

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
- **PR10 — Market Dashboard** ✅ Implemented; gap คือ data reliability/coverage
- **PR11 — Advanced Screener**

- **PR12 — Smart Alerts + Push** ⏸ price/%/volume alerts มีบางส่วน; email/push ต้อง production verify
- **PR13 — News Citations + AI Impact**
- **PR21 — Research Memory / Obsidian Workflow** ✅ Implemented

- **PR14 — Portfolio Analytics**
- **PR15 — PWA + Push Notifications** ⏸ manifest/service worker/push subscribe มีบางส่วน

- **PR16 — Agent Looping / Market War Room** ✅ Implemented
- **PR18 — MiroFish Debate Mode** ✅ Implemented
- **PR17 — Trade Plan + Paper Trading** 🧊 Future backlog

รายละเอียด full benchmark, acceptance criteria, first engineering tickets, และ definition of done อยู่ใน `docs/TOP5_GAP_ROADMAP.md`

### สิ่งที่ข้ามไปก่อน จนกว่าจะมี data/provider/legal พร้อม

- SET real-time/delayed provider
- Full SET/mai universe + sector mapping
- Fund flow / foreign holding
- News wire จริงที่มี source/citation
- PWA push production config/asset audit
- Broker CSV import / live execution
- Trade Plan + Paper Trading (PR17 future)
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
| `DEEPSEEK_API_KEY` | ไม่บังคับ | Optional model assist |
| `OPENROUTER_API_KEY` | ไม่บังคับ | Optional model assist / key rotation |
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
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | ไม่บังคับ | ⏸ PWA Push (Gap: Quick Win) |
| `VAPID_PRIVATE_KEY` | ไม่บังคับ | ⏸ PWA Push (Gap: Quick Win) |

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
- [ ] AI / Agent Loop → disclaimer, ไม่ buy/sell advice, มี verifier/evidence/risk checklist
- [ ] `npm run typecheck && npm run build && npm test`
- [ ] อัปเดต START_HERE.md ถ้าเปลี่ยน architecture หรือเพิ่มงานที่ข้าม

---

## ติดต่อ / Repo

- GitHub: `https://github.com/threerat1212/stockguru`
- Live: `https://stockguru-web.onrender.com`

---

*อัปเดตล่าสุด: มิถุนายน 2026 — PR3-PR8 เสร็จสมบูรณ์, PR16/PR18/PR19/PR20/PR21/PR22 implemented, PR23 Security Hardening Sweep ทำเสร็จ, PR17 Trading Backlog documented*
