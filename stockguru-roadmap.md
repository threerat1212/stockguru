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

## PR16 — Agent Looping / Market War Room ✅ Implemented

**Goal:** นำแนวคิด Agent Looping / MiroFish มาทำเป็น StockGuru-specific Closed Loop Agent System สำหรับตลาดหุ้นไทย โดยไม่ clone MiroFish ทั้งระบบ

### Product scope
- หน้า `/war-room` สำหรับรัน Agent Loop
- Decision support สำหรับ watchlist/portfolio/scenario
- Agents: Data → Technical → Fundamental → News → Risk → Portfolio → Report → Verifier
- Verifier gate ห้ามภาษาแนะนำซื้อ/ขายทันที ห้ามการันตีผลตอบแทน และต้องมี evidence/risk checklist
- ใช้เป็นฐานของ AI Daily Brief 2.0, Watchlist Intelligence, Portfolio Risk Drill และ Scenario Simulator

### Files changed
1. `lib/agent-loop/` — types, schema, context collector, agents, verifier, orchestrator
2. `app/api/agent-loop/simulate/route.ts` — POST endpoint gated by Pro
3. `app/war-room/page.tsx` — War Room UI
4. `components/layout/Sidebar.tsx` — nav link
5. `components/auth/FeatureGate.tsx` — gate copy
6. `lib/hooks/use-subscription.ts` — `agentLoop` feature flag
7. `__tests__/unit/agent-loop-schema.test.ts`, `__tests__/unit/agent-loop-verifier.test.ts`

### Acceptance criteria
- [x] รัน `npm run typecheck` ผ่าน
- [x] UI แสดง closed loop phases, scenario input, symbols, timeframe
- [x] API ใช้ zod schema และ `requireFeature('agentLoop')`
- [x] Verifier ปฏิเสธ output ที่มีคำว่า “ซื้อเลย/ขายเลย/การันตี”
- [x] ผลลัพธ์มี risks, suggestedChecks, disclaimer, verifier trace
- [x] `npm test` passed
- [x] `npm run build` passed
- [ ] Manual test `/war-room` ด้วย watchlist, portfolio, market preset, custom symbols

### Verify
- `npm run typecheck` → passed
- `npm test` → passed
- `npm run build` → passed
- Manual test `/war-room` gate copy → passed

---

## PR18 — MiroFish Debate Mode ✅ Implemented

**Goal:** เพิ่ม MiroFish-inspired Agent Discussion Layer ใน War Room เพื่อให้ user พิมพ์คำถาม แล้ว agents discuss เป็นรอบก่อน Reporter สรุปและ Verifier gate ตรวจ safety/evidence

### Product scope
- `/war-room` มี MiroFish Debate Mode
- User พิมพ์คำถามภาษาไทย เช่น `PTT ถ้ามูลค่าน้ำมันลงและบาทแข็ง จะกระทบอะไร`
- Seed Extractor แปลคำถามเป็น symbols, scenario, timeframe, intent, mode
- Debate personas: Moderator, Market Data, Technical, Fundamental, News, Portfolio, Risk, Contrarian, Reporter, Verifier
- UI แสดง final summary, transcript, verifier, risk checklist, debate graph
- Persistence: `war_room_debate_runs`, `war_room_debate_messages`, `war_room_debate_evidence`, `war_room_debate_verifications`

### Files changed
1. `lib/agent-loop/mirofish/` — seed, graph, personas, reporter, debate orchestrator, schema, persistence
2. `lib/agent-loop/providers/openrouter-provider.ts` — OpenRouter-compatible LLM provider
3. `lib/agent-loop/providers/mimo-provider.ts` — Xiaomi MiMo provider
4. `lib/agent-loop/providers/deepseek-provider.ts` — DeepSeek provider
5. `lib/agent-loop/providers/model-router.ts` — model routing by strengths
6. `lib/agent-loop/providers/debate-assist.ts` — optional multi-model debate assist
7. `lib/agent-loop/providers/reporter-draft.ts` — reporter provider selection
8. `app/api/war-room/debate/route.ts` — Pro-gated debate endpoint
9. `app/war-room/page.tsx` — Debate Mode UI, transcript, final answer
10. `supabase/migrations/20260611150000_pr18_war_room_debate.sql` — debate persistence migration
11. `supabase/schema.sql` — fresh schema reference
12. `__tests__/unit/mirofish-debate.test.ts`
13. `docs/MIROFISH_DEBATE_MODE.md`, `docs/AGENT_LOOPING_MVP.md`

### Acceptance criteria
- [x] รัน `npm run typecheck` ผ่าน
- [x] รัน `npm test` ผ่าน
- [x] รัน `npm run build` ผ่าน
- [x] Manual test `/war-room` gate copy ผ่าน
- [x] Anonymous API gate ผ่าน
- [x] Supabase debate tables apply ผ่าน
- [x] Verifier ผ่าน safety gate
- [x] ไม่เชื่อม broker / ไม่แนะนำซื้อ-ขาย / ไม่การันตีกำไร

### Verify
- `npm run typecheck` → passed
- `npm test` → 59 tests passed
- `npm run build` → passed
- `/war-room` gate smoke test → passed
- `POST /api/war-room/debate` anonymous request → login gate

### Notes
- External LLM runtime ยังไม่ได้ validate ด้วย API key จริงใน session นี้
- Debate MVP มาจาก rule-based MiroFish engine
- OpenRouter / MiMo / DeepSeek provider adapters พร้อมเปิดผ่าน env; ถ้า provider ไม่พร้อมหรือ env ไม่ครบ จะ fallback กลับไป rule-based debate

---

## PR19 — MiroFish Swarm Simulation ✅ Implemented

**Goal:** นำแนวคิด MiroFish กลับสู่ core idea: swarm intelligence engine ที่จำลองสังคมจาก agent หลาย persona มี memory, beliefs, simulated Twitter + Reddit feed, scenario map, sentiment และ blind spots

### Product scope
- `/mirofish` สำหรับ event injector และ scenario map
- `POST /api/mirofish/swarm`
- 12 personas: long-term investor, momentum trader, risk manager, skeptical retail, institutional analyst, competitor, FOMO retail, contrarian, regulator, influencer, customer, support/sales
- 3 rounds: First Reaction → Social Contagion → Second-Order Thinking
- Output: social feed, belief updates, sentiment, scenarios, risks, opportunities, blind spots, suggested checks
- ใช้ deterministic swarm เป็น default และ **ไม่ใช้ paid OpenRouter models**

### Files changed
1. `lib/mirofish-swarm/types.ts`
2. `lib/mirofish-swarm/profiles.ts`
3. `lib/mirofish-swarm/simulator.ts`
4. `lib/mirofish-swarm/schema.ts`
5. `app/api/mirofish/swarm/route.ts`
6. `app/mirofish/page.tsx`
7. `components/layout/Sidebar.tsx`
8. `__tests__/unit/mirofish-swarm.test.ts`
9. `docs/MIROFISH_SWARM.md`, `START_HERE.md`, `docs/IMPLEMENTATION.md`, `stockguru-roadmap.md`

### Acceptance criteria
- [x] มี `/api/mirofish/swarm`
- [x] มี `/mirofish`
- [x] มี 12 personas พร้อม memory / beliefs / worldview
- [x] มี simulated Twitter + Reddit feed
- [x] มี 3 rounds
- [x] มี sentiment summary
- [x] มี scenario map
- [x] มี risks / opportunities / blind spots / suggested checks
- [x] ไม่ใช้ paid OpenRouter models
- [x] มี disclaimer
- [x] unit tests ผ่าน

### Verify
- `npm run typecheck` → passed
- `npm test` → 61 tests passed
- `npm run build` → passed
- Playwright smoke → `/api/mirofish/swarm` returned 200 with `Agent Swarm Personas` + `Scenario Map`

### Notes
- MVP ใช้ deterministic swarm simulation ก่อน ไม่ผูกกับ LLM paid model
- อนาคตถ้าเพิ่ม LLM assist ให้ใช้เฉพาะ free OpenRouter models หรือ MiMo/DeepSeek API ของตัวเอง

---

## PR20 — SEGA Review Gate ✅ Implemented

**Goal:** เพิ่ม Finance Division / Capital Allocation & Risk Agent บน War Room เพื่อ review thesis, downside, exit plan, allocation envelope, risk score และ approval decision ก่อนใช้ Agent Loop / MiroFish Debate result ต่อ

### Product scope
- `/war-room` มี SEGA Review Gate หลังมี Agent Loop หรือ MiroFish Debate result
- SEGA ไม่สร้างสัญญาณหลัก ไม่ดึง market data เป็น primary role และไม่ส่ง order
- SEGA review:
  - thesis / downside / exit plan
  - allocation envelope
  - risk score
  - kill criteria / monitoring triggers
  - protected failure modes
  - approval decision: `Go`, `Conditional Go`, `No-Go`
- Storycraft แปล approval เป็น Thai brief สำหรับ War Room UI

### Files changed
1. `lib/agent-loop/sega/persona.ts` — persona registry, heuristics, failure modes
2. `lib/agent-loop/sega/schema.ts` — SEGA proposal schema
3. `lib/agent-loop/sega/types.ts` — shared SEGA types
4. `lib/agent-loop/sega/approval.ts` — deterministic approval gate
5. `lib/agent-loop/sega/adapters.ts` — adapters จาก Agent Loop / MiroFish Debate result
6. `lib/agent-loop/sega/storycraft.ts` — Thai Storycraft renderer
7. `app/api/sega/review/route.ts` — Pro-gated review endpoint
8. `app/war-room/page.tsx` — SEGA Review Gate UI
9. `__tests__/unit/sega-approval.test.ts`, `__tests__/unit/sega-adapters.test.ts`, `__tests__/unit/sega-personas.test.ts`, `__tests__/unit/sega-storycraft.test.ts`
10. `docs/IMPLEMENTATION.md`, `docs/AGENT_LOOPING_MVP.md`, `docs/MIROFISH_DEBATE_MODE.md`, `START_HERE.md`, `PRODUCT.md`

### Acceptance criteria
- [x] รัน `npm run typecheck` ผ่าน
- [x] รัน `npm run lint` ผ่าน
- [x] SEGA targeted unit tests ผ่าน
- [x] War Room แสดง SEGA Review Gate หลังมี Agent Loop / MiroFish Debate result
- [x] API รับ explicit `proposal` หรือ derive proposal จาก result
- [x] Response shape เป็น `{ approval, story, persona }`
- [x] SEGA ไม่เป็น primary signal generator / trade executor

### Verify
- `npm run typecheck` → passed
- `npm run lint` → passed
- `npm test` → 102 tests passed, 1 skipped
- SEGA targeted unit tests → 19 tests passed

### Notes
- SEGA เป็น review gate ไม่ใช่ market-data fetcher หรือ trade executor
- ไม่ duplicate Data / Technical / Fundamental / News / Risk agents

---

## PR17 — Trade Plan + Paper Trading 🧊 Future backlog

**Goal:** เพิ่มระบบเทรดแบบปลอดภัยในระยะถัดไป โดยเริ่มจาก Trade Plan และ Paper Trading ก่อน ไม่เชื่อม broker และไม่ทำ autonomous trading

### Why later

Trading system มี risk layer ใหม่ที่หนักกว่า research:

- order routing / partial fill / failed order
- broker/API integration
- user permission และ audit trail
- latency/data freshness
- position sizing และ kill switch
- compliance/suitability concerns

ดังนั้น PR16 Agent Looping ต้องอยู่ฝั่ง research/rehearsal ก่อน ส่วน execution ให้เป็น PR แยก

### Scope

- Trade plan: thesis, entry zone, invalidation, target, position size, risk per trade
- Paper trade simulation
- Link trade plan กับ journal, Agent Loop result, news/evidence
- ไม่ส่ง order จริง
- ไม่ให้ AI สั่งซื้อ/ขายอัตโนมัติ

### Files to change later

1. `supabase/schema.sql` — trade plans / paper trades tables
2. `lib/services/trade-plan-service.ts`
3. `lib/hooks/use-trade-plans.ts`
4. `app/trade-plans/page.tsx`
5. `app/paper-trades/page.tsx`
6. `components/trading/`
7. `app/journal/new/page.tsx` — link trade plan เข้า journal
8. `app/api/trade-plans/**`

### Safety rules

- No real broker order
- No autonomous trading
- Every plan ต้องมี invalidation condition
- Every plan ต้องมี max loss / position size
- Paper trade ต้อง label ชัดว่าเป็น simulation

---

## Backlog reference

รายละเอียด gap analysis, benchmark, acceptance criteria และ first engineering tickets อยู่ใน:

- `docs/TOP5_GAP_ROADMAP.md`
