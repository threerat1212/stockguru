# StockGuru Thailand — สรุปการปรับปรุงฟีเจอร์ (Feature Implementation Summary)

## สารบัญ

1. [หน้าแรก scroll behavior](#1-หน้าแรก-scroll-behavior)
2. [AI Chat จำกัดการใช้งาน](#2-ai-chat-จำกัดการใช้งาน)
3. [AI Chat ลูกเล่น Quick Actions](#3-ai-chat-ลูกเล่น-quick-actions)
4. [ข่าวที่กระทบตลาด + ข่าวสาร](#4-ข่าวที่กระทบตลาด--ข่าวสาร)
5. [ความรู้การลงทุน — เพิ่มรูปภาพ](#5-ความรู้การลงทุน--เพิ่มรูปภาพ)
6. [Market Cap — USD format](#6-market-cap--usd-format)
7. [เปรียบเทียบหุ้น — กราฟ](#7-เปรียบเทียบหุ้น--กราฟ)
8. [ปฏิทินประกาศงบ — User custom](#8-ปฏิทินประกาศงบ--user-custom)
9. [DESIGN.md — Design System](#9-designmd--design-system)
10. [Agent Looping / Market War Room](#10-agent-looping--market-war-room)
11. [Trading System Backlog](#11-trading-system-backlog)
12. [MiroFish Debate Mode](#12-mirofish-debate-mode)

---

## 1. หน้าแรก scroll behavior

**ปัญหา:** หน้าแรกเลื่อนมาตรงกลางเองตอนโหลด ผู้ใช้ต้อง scroll ขึ้นเองทุกครั้ง

**แก้ไข:**
- ไฟล์: `app/page.tsx`
- เพิ่ม `useEffect` ที่เรียก `window.scrollTo(0, 0)` เมื่อ component mount ทำให้หน้าแรกอยู่บนสุดเสมอ

```tsx
export default function HomePage() {
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  // ...
}
```

**สถานะ:** ✅ เสร็จสิ้น

---

## 2. AI Chat จำกัดการใช้งาน

**ปัญหา:** ต้องการให้ Guest ใช้ AI Chat ได้แค่ 3 คำถาม หมดแล้วต้อง Login

**แก้ไข:**
- ไฟล์: `components/ai/AIChat.tsx`
- ระบบจำกัดคำถาม Guest อยู่แล้ว (`FREE_QUESTION_LIMIT = 3`) แต่ UI ไม่ชัดเจน
- **ปรับปรุง UI:**
  - Header แสดงสถานะชัดเจน: "Guest: เหลือ X/3 คำถาม" หรือ "Guest หมดสิทธิ์: กรุณา Login"
  - ปุ่ม Demo login มีสีสันเมื่อยังไม่ login เพื่อดึงดูดสายตา
  - หมดสิทธิ์แล้วแสดง card สีส้มพร้อมปุ่ม Login ใหญ่ชัดเจน

**สถานะ:** ✅ เสร็จสิ้น

---

## 3. AI Chat ลูกเล่น Quick Actions

**ปัญหา:** ต้องการให้ AI แสดงตัวเลือก action 3-4 ปุ่มเมื่อ detect ชื่อหุ้นในข้อความ

**แก้ไข:**
- ไฟล์: `components/ai/AIChat.tsx`
- ปรับปรุง `buildSuggestions()` ให้ return object ที่มี `label`, `prompt`, และ `icon`:
  - `วิเคราะห์ละเอียด` (BarChart3 icon)
  - `เพิ่มจุด TP/SL` (Target icon)
  - `เช็กข่าว & ความเสี่ยง` (ShieldAlert icon)
  - `เปรียบเทียบคู่แข่ง` (TrendingUp icon)
- ปรับปรุง Quick Prompts 4 ตัวเริ่มต้นพร้อม icon:
  - `สรุป SET วันนี้`
  - `ธนาคารต้องเช็กอะไร`
  - `วิเคราะห์ PTT`
  - `หุ้นมาแรง`
- Suggestion chips มี icon + label สั้น กดได้เลย

**สถานะ:** ✅ เสร็จสิ้น

---

## 4. ข่าวที่กระทบตลาด + ข่าวสาร

**ปัญหา:** ต้องการให้กดข่าวแล้วเข้าหน้ารายละเอียดพร้อม infographic + ข่าวละเอียด และระบบ refresh 1-2 ชม.

**แก้ไข:**
- ระบบ news detail page มีอยู่แล้วที่ `app/news/[id]/page.tsx`
- มี Infographic sidebar, related symbols, references ครบถ้วน
- **ปรับปรุง:**
  - `lib/data/news.ts` มี `NEWS_REFRESH_INTERVAL_MS = 60 * 60 * 1000` (1 ชั่วโมง) อยู่แล้ว
  - หน้า detail แสดง "Refresh ทุก ~1 ชม." ชัดเจน
  - NewsCard (`components/news/NewsCard.tsx`) ลิงก์ไป `/news/${article.id}` อยู่แล้ว

**สถานะ:** ✅ ระบบมีอยู่แล้ว และทำงานถูกต้อง

---

## 5. ความรู้การลงทุน — เพิ่มรูปภาพ

**ปัญหา:** หน้า learn มีแต่ SVG diagram ต้องการรูปภาพจริงประกอบเนื้อหา

**แก้ไข:**
- ไฟล์: `app/learn/page.tsx`
- เพิ่ม `import Image from 'next/image'`
- เพิ่มรูปภาพ Unsplash ประกอบในแต่ละ section (aspect ratio 21:9):
  - **Technical Analysis Overview** — กราฟหุ้นและการวิเคราะห์
  - **Candlestick Charts** — Candlestick chart บนหน้าจอ
  - **Support & Resistance** — กราฟแนวรับแนวต้าน
  - **Volume** — Volume trading
  - **P/E Ratio** — ตัวเลขการเงินและงบการเงิน
  - **Market Cap** — อาคารบริษัทขนาดใหญ่
  - **Diversification** — พอร์ตโฟลิโอหลากหลาย
  - **DCA** — การออมและลงทุนสม่ำเสมอ

**สถานะ:** ✅ เสร็จสิ้น

---

## 6. Market Cap — USD format

**ปัญหา:** Market Cap ต้องแสดงเป็น USD ทั้งหมด และใช้ format ย่อ >1M = 1M

**แก้ไข:**
- ไฟล์: `app/stock/[symbol]/page.tsx`
- `lib/utils/format.ts` มี `formatMarketCapUsd()` อยู่แล้ว แต่ stock detail page ไม่ได้ใช้
- **เปลี่ยน:**
  - Import `formatMarketCapUsd` เพิ่ม
  - เปลี่ยนการแสดง Market Cap จาก `formatCurrency(quote.marketCap, quote.currency)` เป็น `formatMarketCapUsd(quote.marketCap, quote.currency)`
- `lib/utils/format.ts` มี logic แปลง THB→USD และ format เป็น `1.37T`, `538B`, `700M` อยู่แล้ว

**สถานะ:** ✅ เสร็จสิ้น

---

## 7. เปรียบเทียบหุ้น — กราฟ

**ปัญหา:** หน้า compare มีแต่ตารางเปรียบเทียบ ต้องการกราฟ

**แก้ไข:**
- ไฟล์: `app/compare/page.tsx`
- **เปลี่ยน `CompareChart` ทั้งหมด:**
  - ใช้ `lightweight-charts` (`createChart`, `ColorType`) แทน SVG sparkline
  - ดึง historical data จริงผ่าน `useHistory` สำหรับแต่ละ symbol (3M timeframe)
  - Normalize ราคาปิดให้เริ่มที่ 100 เพื่อเปรียบเทียบ momentum
  - แสดงเป็น line chart หลายเส้นสี (blue, green, orange)
  - รองรับ loading state (spinner)
  - รองรับ responsive resize
  - มี legend ด้านล่างแสดง symbol + สี
- เปลี่ยน prop จาก `quotes` เป็น `symbols` เพราะดึง data เองภายใน component

**สถานะ:** ✅ เสร็จสิ้น

---

## 8. ปฏิทินประกาศงบ — User custom

**ปัญหา:** ต้องการให้ user custom หุ้นที่ติดตามในปฏิทินประกาศงบเอง

**สถานะ:** ✅ **ระบบมีอยู่แล้ว** ที่ `app/earnings/page.tsx`
- มี `CUSTOM_SYMBOLS_KEY = 'stockguru_earnings_custom'` ใน localStorage
- UI ให้เพิ่ม/ลบหุ้นเองได้
- มี quick-add buttons (SET50, BANK, TECH)
- ไม่ต้องแก้ไขเพิ่ม

---

## 9. DESIGN.md — Design System

**รายละเอียด:**
- ศึกษา TOP 5 แนว web การเงิน/หุ้น:
  1. **TradingView** — Chart-centric, minimal UI, dark mode comfort
  2. **Yahoo Finance (2023 redesign)** — Configurable dashboard, fewer modules, compare mode
  3. **Koyfin** — Modern institutional data, calm density
  4. **Fortress (DashboardPack)** — Dense tables, scannability
  5. **Shadcn/ui Finance Dashboards** — Modern components, accessible defaults
- นำ insights มาปรับปรุง + เขียนเป็น Design System ของตัวเอง ไม่ copy ตรง
- ไฟล์: `DESIGN.md`
- รวมถึง:
  - Scene / Context (who, where, when, mood)
  - Color Strategy (Restrained) + OKLCH palette
  - Typography (Inter + JetBrains Mono)
  - Layout (12-col grid, spacing scale, z-index)
  - Component specs (Card, Button, Badge, Input)
  - Chart styling
  - Motion philosophy + patterns
  - Page layouts (Dashboard, Stock Detail, Compare, News)
  - Accessibility requirements
  - Anti-patterns (explicitly banned)

**สถานะ:** ✅ เสร็จสิ้น

---

## 10. Agent Looping / Market War Room

**ปัญหา:** ต้องการนำแนวคิด Agent Looping / MiroFish มาปรับใช้กับ StockGuru โดยไม่ clone engine ทั้งระบบ และต้องไม่กลายเป็นระบบทำนายหุ้นหรือระบบเทรดอัตโนมัติ

**แก้ไข:**
- เพิ่ม backend layer `lib/agent-loop/`
  - `types.ts` — type contract
  - `schema.ts` — zod validation + symbol normalization
  - `data.ts` — context collector จาก quote/history/news
  - `agents.ts` — Data, Technical, Fundamental, News, Risk, Portfolio, Report agents
   - `verifier.ts` — safety/evidence/risk/disclaimer gate
   - `sega/*` — SEGA Finance Division review gate, approval gate, Storycraft
   - `orchestrator.ts` — Closed Loop orchestration

- เพิ่ม API: `POST /api/agent-loop/simulate`
  - ใช้ `requireFeature('agentLoop')`
  - บันทึก usage ลง `ai_usage_logs`
  - Return closed-loop result พร้อม verifier trace
- เพิ่ม API: `POST /api/sega/review`
  - รับ explicit `proposal` หรือ derive proposal จาก `agentLoopResult` / `miroFishResult`
  - Return `{ approval, story, persona }`
- เพิ่ม UI: `/war-room`
  - เลือก Watchlist / Portfolio / Market Preset / Custom
  - ใส่ scenario + timeframe
  - แสดง closed-loop phases, agent cards, risk checklist, verifier trace
  - แสดง SEGA Review Gate หลังมี Agent Loop / MiroFish Debate result
- เพิ่ม navigation: Sidebar → Agent Loop
- เพิ่ม feature gate: `agentLoop` ใน `FeatureGate`, `PLAN_LIMITS`, server check
- เพิ่ม safety boundary: ไม่ buy/sell advice, ไม่การันตีผลตอบแทน, ไม่ส่ง order จริง
- เพิ่ม SEGA boundary: ไม่เป็น primary signal generator, ไม่เป็น trade executor, ไม่ duplicate specialist agents

**ไฟล์ที่แก้ไข/เพิ่ม:**
- `lib/agent-loop/*`
- `lib/agent-loop/sega/*`
- `app/api/agent-loop/simulate/route.ts`
- `app/api/sega/review/route.ts`
- `app/war-room/page.tsx`
- `components/layout/Sidebar.tsx`
- `components/auth/FeatureGate.tsx`
- `lib/hooks/use-subscription.ts`
- `__tests__/unit/agent-loop-schema.test.ts`
- `__tests__/unit/agent-loop-verifier.test.ts`
- `__tests__/unit/sega-approval.test.ts`
- `__tests__/unit/sega-adapters.test.ts`
- `__tests__/unit/sega-personas.test.ts`
- `__tests__/unit/sega-storycraft.test.ts`
- `docs/AGENT_LOOPING_MVP.md`
- `docs/TRADING_SYSTEM_BACKLOG.md`
- `PRODUCT.md`
- `DESIGN.md`
- `stockguru-roadmap.md`
- `START_HERE.md`

**สถานะ:** ✅ เสร็จสิ้น

### Verification
- `npm run typecheck` — **ผ่าน**
- `npm run lint` — **ผ่าน**
- `npm test` — **ผ่าน** (102 tests passed, 1 skipped)
- SEGA targeted unit tests — **19 tests passed**
- `npm run build` — **ผ่าน**

**หมายเหตุ:** Build มี warning เดิมจาก Supabase client ที่ใช้ Node.js API ใน Edge Runtime trace; ไม่ใช่ error ของ Agent Looping

---

## 11. Trading System Backlog

**ปัญหา:** ผู้ใช้ต้องการระบบเทรดในอนาคต แต่ต้องไม่ผสมกับ Agent Looping MVP เพราะ trading execution มีความเสี่ยงสูงกว่า research/rehearsal

**แก้ไข:**
- เพิ่ม `docs/TRADING_SYSTEM_BACKLOG.md`
- เพิ่ม roadmap `PR17 — Trade Plan + Paper Trading 🧊 Future backlog`
- ระบุ boundary:
  - ไม่เชื่อม broker ใน PR16/PR17
  - ไม่ทำ autonomous trading
  - ไม่ให้ AI สั่งซื้อ/ขาย
  - เริ่มจาก Trade Plan → Paper Trading ก่อน
  - Broker integration ต้องเป็น optional, user-approved, มี risk limit/audit/kill switch

**สถานะ:** ✅ Backlog documented

---

## 12. MiroFish Debate Mode

**ปัญหา:** ผู้ใช้ชอบ concept ให้ Agent หลายตัว discuss กันก่อนตอบ แต่ต้องไม่ clone MiroFish ทั้งระบบ และต้องคง safety boundary ของ StockGuru

**แก้ไข:**
- เพิ่ม MiroFish-inspired debate layer ใน `lib/agent-loop/mirofish/`
  - `types.ts` — type contract สำหรับ seed, graph, transcript, debate result
  - `seed.ts` — แปลคำถาม user เป็น symbols, scenario, timeframe, intent, mode
  - `graph.ts` — สร้าง debate graph
  - `personas.ts` — persona list สำหรับ Moderator, Data, Technical, Fundamental, News, Portfolio, Risk, Contrarian, Reporter, Verifier
  - `reporter.ts` — เรียบเรียง final summary / thesis / checks
  - `debate.ts` — orchestrator สำหรับ 3 rounds: Observation, Challenge, Synthesis + Gate
  - `schema.ts` — zod schema สำหรับ request
  - `persistence.ts` — fallback persistence ไป Supabase
- เพิ่ม API: `POST /api/war-room/debate`
  - ใช้ `requireFeature('agentLoop')`
  - บันทึก usage ลง `ai_usage_logs`
  - persist debate run/messages/evidence/verification ถ้า tables พร้อม
  - ถ้า Supabase tables ยังไม่ apply จะ catch error และ return result ได้
- เพิ่ม UI: `/war-room`
  - textarea พิมพ์คำถาม
  - button `รัน MiroFish Debate`
  - final summary card
  - transcript panel
  - verifier card
  - risk & next checks
  - debate graph
- เพิ่ม Supabase tables:
  - `war_room_debate_runs`
  - `war_room_debate_messages`
  - `war_room_debate_evidence`
  - `war_room_debate_verifications`
- เพิ่ม migration:
  - `supabase/migrations/20260611150000_pr18_war_room_debate.sql`
- อัปเดต fresh schema:
  - `supabase/schema.sql`

**AI API status:**
- `/api/war-room/debate` มีแล้ว
- External LLM runtime ยังไม่ได้ validate ด้วย API key จริงใน session นี้
- Debate มาจาก rule-based MiroFish engine เมื่อ env ไม่ครบ
- OpenRouter / Xiaomi MiMo / DeepSeek provider adapter พร้อมเปิดผ่าน env และ fallback กลับไป rule-based debate

**ไฟล์ที่แก้ไข/เพิ่ม:**
- `lib/agent-loop/mirofish/*`
- `lib/agent-loop/providers/openrouter-provider.ts`
- `lib/agent-loop/providers/mimo-provider.ts`
- `lib/agent-loop/providers/deepseek-provider.ts`
- `lib/agent-loop/providers/model-router.ts`
- `lib/agent-loop/providers/debate-assist.ts` — optional multi-model debate assist
- `lib/agent-loop/providers/reporter-draft.ts`
- `app/api/war-room/debate/route.ts`
- `app/war-room/page.tsx`
- `components/auth/FeatureGate.tsx`
- `types/stock.ts`
- `supabase/schema.sql`
- `supabase/migrations/20260611150000_pr18_war_room_debate.sql`
- `__tests__/unit/mirofish-debate.test.ts`
- `docs/MIROFISH_DEBATE_MODE.md`
- `docs/AGENT_LOOPING_MVP.md`
- `stockguru-roadmap.md`
- `START_HERE.md`
- `docs/IMPLEMENTATION.md`

**สถานะ:** ✅ เสร็จสิ้น

### Verification
- `npm run typecheck` — **ผ่าน**
- `npm test` — **ผ่าน** (61 tests passed)
- `npm run build` — **ผ่าน**
- Local `/war-room` smoke test — **ผ่าน** gate copy
- Anonymous `POST /api/war-room/debate` — **ผ่าน** login gate

**หมายเหตุ:** Test มี stderr เดิมจาก SET provider fallback ตอนดึง Siamchart history แต่ไม่ทำให้ test fail

---

## 13. MiroFish Swarm Simulation

**Feature:** MiroFish-inspired swarm intelligence simulation

**Files:**
- `lib/mirofish-swarm/types.ts`
- `lib/mirofish-swarm/profiles.ts`
- `lib/mirofish-swarm/simulator.ts`
- `lib/mirofish-swarm/schema.ts`
- `app/api/mirofish/swarm/route.ts`
- `app/mirofish/page.tsx`
- `components/layout/Sidebar.tsx`
- `__tests__/unit/mirofish-swarm.test.ts`
- `docs/MIROFISH_SWARM.md`

**Status:** ✅ Implemented

### Verification
- `npm run typecheck` — **ผ่าน**
- `npm test` — **ผ่าน**
- `npm run build` — **ผ่าน**
- Playwright smoke — **ผ่าน** สำหรับ `/api/mirofish/swarm`: API ตอบ 200 และมี `Agent Swarm Personas` + `Scenario Map`

**หมายเหตุ:** MVP ใช้ deterministic swarm simulation เป็น default และไม่ใช้ paid OpenRouter models

**Test account:** ดู `docs/TEST_ACCOUNTS.md` สำหรับ MiroFish Smoke Pro account ที่ใช้ smoke test ผ่าน Playwright

---

## สรุปสถานะรวม

| # | ฟีเจอร์ | สถานะ | ไฟล์ที่แก้ไข |
|---|---|---|---|
| 1 | หน้าแรก scroll top | ✅ | `app/page.tsx` |
| 2 | AI Chat จำกัด Guest 3 คำถาม | ✅ | `components/ai/AIChat.tsx` |
| 3 | AI Chat Quick Actions + Icons | ✅ | `components/ai/AIChat.tsx` |
| 4 | News Detail + Infographic + Refresh | ✅ | มีอยู่แล้ว (`app/news/[id]/page.tsx`) |
| 5 | Learn Page Images | ✅ | `app/learn/page.tsx` |
| 6 | Market Cap USD Format | ✅ | `app/stock/[symbol]/page.tsx` |
| 7 | Compare Page Real Chart | ✅ | `app/compare/page.tsx` |
| 8 | Earnings Calendar User Custom | ✅ | มีอยู่แล้ว (`app/earnings/page.tsx`) |
| 9 | DESIGN.md Design System | ✅ | `DESIGN.md` |
| 10 | Agent Looping / Market War Room | ✅ | `lib/agent-loop/*`, `app/api/agent-loop/simulate`, `app/war-room`, tests, docs |
| 11 | Trading System Backlog | ✅ documented | `docs/TRADING_SYSTEM_BACKLOG.md`, `stockguru-roadmap.md` |
| 12 | MiroFish Debate Mode | ✅ | `lib/agent-loop/mirofish/*`, `lib/agent-loop/providers/openrouter-provider.ts`, `lib/agent-loop/providers/mimo-provider.ts`, `lib/agent-loop/providers/deepseek-provider.ts`, `lib/agent-loop/providers/model-router.ts`, `lib/agent-loop/providers/debate-assist.ts`, `lib/agent-loop/providers/reporter-draft.ts`, `app/api/war-room/debate`, `app/war-room`, Supabase tables, tests, docs |
| 13 | SEGA Review Gate | ✅ | `lib/agent-loop/sega/*`, `app/api/sega/review`, `app/war-room`, tests, docs |
| 14 | MiroFish Swarm Simulation | ✅ | `lib/mirofish-swarm/*`, `app/api/mirofish/swarm`, `app/mirofish`, components/layout/Sidebar.tsx, tests, docs |
| 15 | Manual `/war-room` smoke test | ⏸ pending | Need logged-in Pro account |


## การตรวจสอบ Build

- `npx tsc --noEmit` — **ผ่าน** (ไม่มี TypeScript errors)
- `npm test` — **ผ่าน** (61 tests passed)
- `npm run build` — **ผ่าน**
- Playwright smoke — **ผ่าน** สำหรับ `/api/mirofish/swarm` ด้วย MiroFish Smoke Pro account: API ตอบ 200 และมี `Agent Swarm Personas` + `Scenario Map`
- ไม่มี syntax errors หรือ type mismatch ในทุกไฟล์ที่แก้ไข
