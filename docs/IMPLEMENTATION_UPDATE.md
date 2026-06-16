# StockGuru Implementation Update

วันที่ทำงาน: 2026-06-05

## สรุปสถานะ

ทำใน working copy: `C:/Users/Admin/hermes-work/stockguru` แล้วเตรียม sync กลับไปที่ `E:/งาน/หุ้น/stockguru`

หมายเหตุ: มีการพยายามแบ่งงานให้ subagents ตามที่ขอแล้ว แต่ subagent API ติด `HTTP 429 usage limit` จึงดำเนินการ implement ต่อใน session หลักแทน

## รายการที่ทำแล้ว

### 1. หน้าแรกไม่เลื่อนลงกลางหน้าเอง
- แก้ `components/ai/AIChat.tsx`
- สาเหตุหลักคือ chat เรียก `scrollIntoView()` ตั้งแต่ mount แรก ทำให้หน้า home ถูกดึงลงไปตำแหน่ง AI chat
- เปลี่ยนให้ auto-scroll เฉพาะหลัง user เริ่มคุยแล้วเท่านั้น

### 2. AI Chat จำกัด guest 3 คำถาม / login ใช้ได้ไม่จำกัด
- เพิ่ม demo auth gate ใน `AIChat.tsx`
- Guest ถามได้ 3 ครั้ง
- หลังครบ 3 ครั้ง input จะ lock และแสดงข้อความให้ login
- เพิ่มปุ่ม `Demo login/logout` โดยเก็บสถานะใน `localStorage` key: `stockguru_demo_logged_in`
- หมายเหตุ: ยังไม่ผูกกับระบบ auth จริง เพราะโปรเจกต์ยังไม่มี auth provider

### 3. AI Chat มี suggested actions ตามหัวข้อหุ้น
- เพิ่มการ detect topic เช่น `PTT`, `SCB`, `KBANK`, `SET`, `กลุ่มธนาคาร`
- หลังถามแล้วจะแสดงปุ่ม action 3 แบบ:
  - วิเคราะห์แบบละเอียด
  - เพิ่มจุด TP/SL
  - เช็กข่าวและความเสี่ยง

### 4 / 9. ข่าวคลิกเข้า detail page พร้อม infographic + detail + reference
- เพิ่มข้อมูลข่าวกลางที่ `lib/data/news.ts`
- เพิ่มหน้า detail: `app/news/[id]/page.tsx`
- แก้ `components/news/NewsCard.tsx` ให้ link ไป `/news/[id]`
- หน้า detail มี:
  - hero image
  - detailed article
  - market impact
  - infographic card
  - related symbols
  - reference links
- ระบุ refresh cadence ประมาณ 1 ชั่วโมงผ่าน `NEWS_REFRESH_INTERVAL_MS`

### 5. ความรู้การลงทุนเพิ่มภาพประกอบ
- แก้ `app/learn/page.tsx`
- เพิ่ม visual cards/diagram ด้วย CSS/SVG สำหรับ:
  - Candlestick
  - Support / Resistance
  - Volume spike
  - Indicator overview

### 6. Market Cap ใช้ USD และ compact format
- เพิ่ม utility ใน `lib/utils/format.ts`:
  - `formatCompactUsd()`
  - `formatMarketCapUsd()`
- THB market cap แปลงเป็น USD ด้วย assumption `36 THB/USD`
- แก้ `components/stock/StockCard.tsx` ให้แสดง Market Cap แทน Volume ใน card
- แก้ `app/compare/page.tsx` ให้ Market Cap ในตารางแสดงเป็น USD แบบ `$xx.xxM/B/T`

### 7. เปรียบเทียบหุ้นใส่กราฟ
- แก้ `app/compare/page.tsx`
- เพิ่ม SVG comparison chart เมื่อเลือกหุ้น 2 ตัวขึ้นไป
- กราฟ normalize จากราคาปิดก่อนหน้าและ % change เพื่อช่วยดู momentum เทียบกัน
- หมายเหตุ: ยังเป็น visualization ฝั่ง client จาก quote ปัจจุบัน ไม่ใช่ historical chart จริง

### 8. ปฏิทินประกาศงบให้ user custom หุ้นเอง
- rewrite `app/earnings/page.tsx`
- เพิ่มช่องกรอก symbol เช่น `PTT`, `KBANK`, `AAPL`
- เพิ่ม quick add chips
- เลือกหุ้นแล้ว table จะ filter เฉพาะหุ้นนั้น
- บันทึก selection ใน `localStorage` key: `stockguru_earnings_symbols`
- ปุ่ม `ดูทั้งหมด` clear filter

## ข้อจำกัด / สิ่งที่ควรทำต่อ

1. Auth ใช้ Supabase SSR auth/session แล้ว แต่ยังต้องตรวจ RLS/plan gate ให้ครบสำหรับฟีเจอร์ paid ทุกตัว
2. ข่าวมีทั้ง static/mock และ refresh route; ส่วน AI-generated impact ยังต้องกันตาม plan และแสดง provenance ให้ชัด
3. Compare chart เป็นกราฟจำลองจาก quote ปัจจุบัน ถ้าต้องการแม่นขึ้นควรใช้ `/api/stock/history`
4. Earnings calendar ยังมี sample path ควรต่อข้อมูลจริงจาก SET/แหล่งข้อมูลที่มี license
5. THB->USD ใช้ fixed rate 36 ควรต่อ FX rate จริงถ้าจะใช้ production
### SEGA Review Gate

วันที่ทำงาน: 2026-06-13
Working copy: `E:/งาน/หุ้น/stockguru`

### สิ่งที่ทำแล้ว

- เพิ่ม SEGA เป็น Finance Division / Capital Allocation & Risk Agent สำหรับ War Room / MiroFish
  - `lib/agent-loop/sega/persona.ts` — persona registry, heuristics, failure modes, non-duplication boundary
  - `lib/agent-loop/sega/schema.ts` — proposal schema
  - `lib/agent-loop/sega/types.ts` — shared SEGA types
  - `lib/agent-loop/sega/approval.ts` — deterministic approval gate
  - `lib/agent-loop/sega/adapters.ts` — adapters จาก `AgentLoopRunResult` / `MiroFishDebateRunResult`
  - `lib/agent-loop/sega/storycraft.ts` — Thai narrative renderer
- เพิ่ม `POST /api/sega/review`
  - รับ explicit `proposal` หรือ derive proposal จาก `agentLoopResult` / `miroFishResult`
  - Return `{ approval, story, persona }`
- อัปเดต `app/war-room/page.tsx`
  - เพิ่ม SEGA Review Gate button
  - render approval/storycraft payload จาก server โดยตรง
  - ไม่ recompute review summary บน client
- เพิ่ม unit tests
  - `__tests__/unit/sega-approval.test.ts`
  - `__tests__/unit/sega-adapters.test.ts`
  - `__tests__/unit/sega-personas.test.ts`
  - `__tests__/unit/sega-storycraft.test.ts`
- อัปเดต docs
  - `docs/IMPLEMENTATION.md`
  - `docs/AGENT_LOOPING_MVP.md`
  - `docs/MIROFISH_DEBATE_MODE.md`
## 10. Hardening SET/mai Provider และ Production Market Dashboard

วันที่ทำงาน: 2026-06-13
Working copy: `E:/งาน/หุ้น/stockguru`

### สิ่งที่ทำแล้ว

- Hardening `lib/market-data/providers/set-provider.ts`
  - ใช้ SiamChart HTTPS เป็น primary source สำหรับ SET/mai
  - เพิ่ม timeout/retry และ validate JSON/candle schema ก่อนส่งให้ caller
  - เก็บ cache เป็น full `MarketDataResult` เพื่อให้ meta/cache/fallback ไม่หาย
  - เพิ่ม `searchStocksWithMeta(query)` และให้ `/api/stock/search` คืน `meta`/`cached`
  - ใช้ Yahoo Finance เป็น fallback โดยยังเก็บ provenance ผ่าน metadata/warnings
  - เอา hard `.slice(0, 80)` ออกจาก full Thai stock universe
  - Hardening SiamChart empty/incomplete history responses
    - แยก JSON parser helper ให้ response ว่าง/ไม่ใช่ JSON throw เป็น provider error ที่อ่านง่าย แทน raw `SyntaxError: Unexpected end of JSON input`
    - `getQuoteFromSiamchart()` ใช้ `close` จาก SiamChart stock table ได้ทันที ถ้า recent history ว่าง/ไม่สมบูรณ์
    - ลด console error จาก fallback path ที่ expected แล้ว; provenance ยังคงอยู่ใน `meta.warning`
  - Root-cause SiamChart warning
    - ตรวจสอบ `/query/history` ด้วย PTT, SET, SET50, SET100, SETHD, MAI พบว่า upstream ตอบ HTTP 200 แต่ body ว่าง (`bytes=0`) จึงเป็นสาเหตุของ invalid JSON warning เดิม

- เพิ่ม typed metadata และ summary types
  - `types/stock.ts`: เพิ่ม `MarketSummaryMeta`, `sources`, `trading`, `warnings`, breadth-by-exchange, foreign flow และ optional summary fields
  - `lib/market-data/types.ts`: เพิ่ม warning type สำหรับ fallback/cache/data honesty

- Hardening `/api/market/summary`
  - เพิ่ม `app/api/market/summary/summarize.ts`
  - สร้าง aggregate `MarketSummaryMeta` แทน meta แบบ ad-hoc
  - คำนวณ index cards, SET/mai breadth, sector heatmap, top movers, active volume, foreign flow และ trading/session state

- Production Market Dashboard
  - `app/market/page.tsx` ใช้ `useMarketSummary()` + React Query polling
  - เพิ่ม UI: market status/banner, updated-at, manual refresh, index cards, Market Breadth, Sector Heatmap, top movers, active volume
  - `components/market/DataSourceBadge.tsx` รองรับทั้ง single `MarketDataMeta` และ aggregate `MarketSummaryMeta`

- E2E / account-backed QA
  - แก้ golden-path selector ให้ exact กับ PTT link และ route ปัจจุบัน `/stock/PTT`
  - เพิ่ม e2e test สำหรับ `/api/market/summary` และ `/market` dashboard
  - เพิ่ม optional MiroFish Smoke Pro test ที่ skip ถ้าไม่มี `MIROFISH_SMOKE_EMAIL` / `MIROFISH_SMOKE_PASSWORD` ใน local env ตาม `docs/TEST_ACCOUNTS.md`
  - พบว่า MiroFish smoke account มี auth ได้แต่ `useSubscription()` อ่าน plan เป็น `free` เพราะ fetch subscription ครั้งเดียวตอน mount ก่อน login; แก้ให้ hook listen `onAuthStateChange()` และ refetch subscription หลัง login
  - Provision MiroFish smoke account ใน local Supabase ให้เป็น `pro`/`active` ตาม `docs/TEST_ACCOUNTS.md` แล้วไม่ hardcode credential

### ผล QA ล่าสุด

- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm test` — passed: 16 files passed, 1 skipped; 79 tests passed, 1 skipped
- `npm run build` — passed
- `npx playwright test __tests__/e2e/golden-path.spec.ts` with `.env.local` loaded — passed: 8 passed

Account-backed MiroFish Smoke Pro e2e notes:
- Playwright process env does not automatically include `.env.local`; this run loaded local env vars without printing values and did not hardcode credentials.
- First account-backed run found a strict selector issue at the login button; fixed `__tests__/e2e/golden-path.spec.ts` to scope the header login button and dialog submit button.
- Next run found the smoke account was authenticated but still saw `แผนปัจจุบัน Free` / `ต้องการแผน Pro`; root cause was `useSubscription()` fetching once before login and never refetching after auth state changed.
- Fixed `lib/hooks/use-subscription.ts` to refetch on `onAuthStateChange()`, then provisioned the local smoke account as `pro`/`active` according to `docs/TEST_ACCOUNTS.md`.
- Final account-backed golden-path run passed: `8 passed`.

หมายเหตุ QA: root cause ของ warning เดิมคือ SiamChart `/query/history` ตอบ HTTP 200 แต่ body ว่างสำหรับทั้งหุ้นและดัชนี; หลัง hardening provider จะไม่แสดง raw JSON parser internals และ quote path ยังได้ข้อมูลจาก stock table แทน fallback เมื่อ history ว่าง

### ไฟล์หลักของรอบนี้

- `lib/market-data/providers/set-provider.ts`
- `lib/market-data/provider.ts`
- `lib/market-data/providers/yahoo-provider.ts`
- `lib/market-data/types.ts`
- `types/stock.ts`
- `lib/services/stock-service.ts`
- `lib/data/fetchers/thai-stocks.ts`
- `app/api/market/summary/route.ts`
- `app/api/market/summary/summarize.ts`
- `app/api/stock/search/route.ts`
- `lib/hooks/use-stock.ts`
- `lib/hooks/use-subscription.ts`
- `app/market/page.tsx`
- `components/market/DataSourceBadge.tsx`
- `components/market/IndexCards.tsx`
- `components/market/MarketStatusBanner.tsx`
- `components/market/SectorHeatmap.tsx`
- `__tests__/unit/market-data-set-provider.test.ts`
- `__tests__/unit/market-summary.test.ts`
- `__tests__/e2e/golden-path.spec.ts`
- `docs/TEST_ACCOUNTS.md`
- `docs/IMPLEMENTATION_UPDATE.md`

- `components/ai/AIChat.tsx`
- `components/news/NewsCard.tsx`
- `components/stock/StockCard.tsx`
- `app/news/[id]/page.tsx`
- `app/learn/page.tsx`
- `app/compare/page.tsx`
- `app/earnings/page.tsx`
- `lib/data/news.ts`
- `lib/hooks/useStock.ts`
- `lib/utils/format.ts`
- `types/stock.ts`
- `docs/IMPLEMENTATION_UPDATE.md`

## 11. Full Account-Backed QA และ MiroFish Swarm Fix

วันที่ทำงาน: 2026-06-13
Working copy: `E:/งาน/หุ้น/stockguru`

### สิ่งที่ทำแล้ว

- เพิ่ม full account-backed Playwright war-test สำหรับ 10 simulated users:
  - `__tests__/e2e/account-full-war-test.spec.ts`
  - ใช้ 10 isolated Playwright contexts/tests พร้อม `--workers=10`
  - โหลด `.env.local` โดยตรงสำหรับ `MIROFISH_SMOKE_*` และ Supabase env
  - Provision local smoke account เป็น `pro`/`active` ก่อนรัน Pro-gated path
  - ครอบคลุม home, search/screener, stock, news, market API/dashboard, AI UI, watchlist, portfolio, journal, alerts, quote API, War Room Agent Loop, MiroFish Debate, MiroFish Swarm UI/API, Pro-gated War Room APIs, pricing, learn, compare, risk disclaimer

- แก้ MiroFish Swarm client response shape:
  - `app/mirofish/page.tsx` รับ `data.data` จาก `/api/mirofish/swarm` แทน `data.result`
  - ป้องกัน runtime error `Cannot read properties of undefined (reading 'domain')` หลัง API กลับ payload แบบ `{ success: true, data }`

- ปรับ selector/account-backed QA ให้ตรงกับ UI ปัจจุบัน:
  - Screener PTT row ใช้ exact company label ปัจจุบัน
  - Watchlist ใช้ heading `รายการโปรด`
  - Alerts ใช้ heading `แจ้งเตือนราคา`
  - Learn ใช้ heading `ความรู้การลงทุน`
  - Compare ใช้ smoke account sign-in ก่อนเข้า protected route
  - Risk disclaimer ใช้ heading `ข้อจำกัดความรับผิดชอบ`

### ผล QA ล่าสุด

- `npm run test:e2e -- __tests__/e2e/account-full-war-test.spec.ts --workers=10` — passed: 10 passed
- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm test` — passed: 21 files passed, 1 skipped; 103 tests passed, 1 skipped
- `npm run build` — passed

### ไฟล์หลักของรอบนี้

- `__tests__/e2e/account-full-war-test.spec.ts`
- `app/mirofish/page.tsx`
- `docs/IMPLEMENTATION_UPDATE.md`

## 12. StockGuru Agent Workflow Adapter จาก addyosmani/agent-skills

วันที่ทำงาน: 2026-06-14
Working copy: `E:/งาน/หุ้น/stockguru`

### สิ่งที่ทำแล้ว

- ศึกษา `https://github.com/addyosmani/agent-skills` เป็น upstream workflow reference
- เพิ่ม project-local skill:
  - `skills/stockguru-agent-workflow/SKILL.md`
- เพิ่ม intent router สำหรับงาน StockGuru:
  - UX/UI → `stockguru-ui-design` + `$impeccable`
  - market data/API → `stockguru-market-data`
  - Supabase/Auth/RLS → `stockguru-supabase`
  - AI/War Room/MiroFish/SEGA → `stockguru-ai-safety`
  - pricing/paywall → `stockguru-paid-beta`
  - final proof → `stockguru-verification`
- แปลง lifecycle จาก upstream เป็น StockGuru workflow:
  - define
  - plan
  - build
  - verify
  - review
  - ship/handoff
- ระบุ quality gates ตาม blast radius:
  - UI: typecheck, lint, browser desktop/mobile, console check
  - API/logic: targeted unit tests + `npm test`
  - broad app change: typecheck, lint, tests, build
  - account/Pro-gated path: account-backed Playwright with `.env.local` loaded without printing secrets
- อัปเดต `SKILLS.md` ให้ agent รอบถัดไปเห็น workflow adapter นี้
- เพิ่ม safe generic finance wording bank:
  - `skills/stockguru-ai-safety/references/finance-wording.md`
  - ใช้กับ UI copy, AI response, alerts, news, War Room, MiroFish, SEGA และ journal feedback
  - เชื่อมจาก `skills/stockguru-ai-safety/SKILL.md` และ `skills/stockguru-agent-workflow/SKILL.md`

### ส่วนจาก upstream ที่ไม่ควรเอาเข้ามาทั้งก้อน

- ไม่ copy ทั้ง repo หรือทั้ง 24 skills เพราะจะซ้ำกับ local StockGuru skills และเพิ่ม context noise
- ไม่เอา slash-command wiring จาก `commands/` หรือ `.claude/commands/`
- ไม่เอา platform-specific folders เช่น `.claude/`, `.gemini/`, `.opencode/`, `.claude-plugin/`, `plugin.json`
- ไม่เอา hook automation ที่อาจ auto-run, commit, deploy, หรือแก้ไฟล์โดยไม่ผ่าน local review
- ไม่บังคับใช้ agent personas/subagents เป็น default workflow
- ไม่เอา zip packaging requirement เพราะโปรเจกต์นี้ใช้ project-local `skills/`
- ไม่เอา Bash-only scripts ที่ assume Unix path โดยตรง เพราะ dev environment หลักคือ Windows/PowerShell
- ไม่เอา generic setup docs/README ของ upstream มาแทน docs ของ StockGuru
- ไม่เอา raw finance wording ที่ขัดกับ financial-safety rule ของ StockGuru เช่น buy/sell calls, stock picks, guaranteed profit, autonomous trading
- generic finance wording เอาได้เมื่อผ่าน safe wording bank ของ StockGuru แล้วเท่านั้น

### เหตุผลของแนวทางนี้

เราใช้ `agent-skills` เป็น source ของ engineering discipline: lifecycle, quality gates, browser verification, security, documentation และ review mindset แต่ให้ StockGuru-specific rules เป็นตัวคุมสุดท้าย เพราะโปรเจกต์นี้มี domain constraints สูงกว่า generic web app ได้แก่ Thai-first finance UX, data provenance, paywall gating, AI safety, Supabase/RLS และ Render deploy.

## 13. UX Simplification: War Room / Swarm / Market Movers

วันที่ทำงาน: 2026-06-14

### สิ่งที่ปรับ

- เพิ่ม `components/agent/ResearchModeChooser.tsx` เป็นตัวเลือกโหมดวิจัยร่วม:
  - Agent Loop สำหรับ closed-loop summary
  - MiroFish Debate สำหรับอ่านมุมสนับสนุน/มุมค้านก่อนสรุป
  - MiroFish Swarm สำหรับ social reaction และ scenario map
- ปรับ `/war-room` ให้ชื่อและคำอธิบายสั้นลง:
  - จากหน้าที่อธิบายระบบยาว เป็นหน้าเลือกวิธีอ่านผลลัพธ์
  - จัด Agent Loop และ MiroFish Debate เป็น action panels คู่กัน
  - ยังคงปุ่ม `รัน Agent Loop`, `รัน MiroFish Debate`, และ `รัน SEGA Review Gate` เพื่อไม่ให้ flow/test เดิมพัง
- ปรับ `/mirofish` ให้ Thai-first และอ่านง่ายขึ้น:
  - ลด headline/copy ที่ยาว
  - แปล label form เป็นไทย
  - เพิ่มตัวช่วยอ่านผลลัพธ์ว่าเริ่มจาก scenario map แล้วค่อยอ่าน feed
- ปรับ `/market` ส่วน Movers:
  - Gainers/Losers แสดง Top 5 ใน sidebar
  - Active Volume แสดง Top 6
  - เพิ่มลิงก์ `ดูทั้งหมด` ไป `/trending`

### เหตุผล

War Room และ Swarm ไม่ควรถูก merge backend/route จริง เพราะ War Room คือ research cockpit สำหรับหุ้น/พอร์ต ส่วน Swarm คือ social simulation lab แต่ควรรวมการเลือกใน UI เพื่อให้ user ตัดสินใจง่ายว่าอยากอ่านผลลัพธ์แบบไหนก่อน.

## 14. Research Pages Split, Chart Smoothing, Screener Density

วันที่ทำงาน: 2026-06-14

### สิ่งที่ปรับ

- แยกหน้า research mode จริง:
  - `/agent-loop` สำหรับ Agent Loop
  - `/war-room` สำหรับ MiroFish Debate
  - `/mirofish` สำหรับ Swarm Intelligence
- ปรับ `components/agent/ResearchModeChooser.tsx`:
  - ใช้ `activeMode` แทนการ active ทั้ง War Room surface
  - อธิบายความต่างของ Agent Loop, MiroFish Debate, Swarm Intelligence ด้วยภาษางานจริง
  - ทุกการ์ดพาไปคนละ route
- ปรับ `/agent-loop` และ `/war-room`:
  - `/agent-loop` เหลือเฉพาะปุ่ม `รัน Agent Loop`
  - `/war-room` เหลือเฉพาะปุ่ม `รัน MiroFish Debate`
  - ช่องสัญลักษณ์แสดง `PTT, SCB, CPALL` แทน `.BK`; backend ยัง normalize เป็น `.BK` เองเพื่อ query SET provider
- เปลี่ยนเมนู sidebar จาก `ตลาดร้อน` เป็น `หุ้นเคลื่อนไหว`
  - เหตุผล: คำว่า `ตลาดร้อน` ชวน FOMO และคลุมเครือเกินไป ส่วน `หุ้นเคลื่อนไหว` ตรงกับ movers/trending มากกว่า
- ปรับกราฟหน้าแรก:
  - เส้นกราฟใช้ smooth cubic path แทนเส้นหักเป็น segment
  - แกนราคาใช้ nice tick step และลดเลขทศนิยมแปลก ๆ บน y-axis
- ปรับ `/screener`:
  - ถ้ายังไม่ค้นหา/ยังไม่ใช้ filter จะแสดง preview 24 รายการแรกเท่านั้น
  - ถ้ามี search, quick screen หรือ filter จะแสดงผลตามเงื่อนไขเต็ม
  - เพิ่ม copy บอก user ให้ค้นหาหรือเปิดตัวกรองแทนการเลื่อนดูรายการยาว ๆ
- อัปเดต e2e:
  - Agent Loop test ไป `/agent-loop`
  - MiroFish Debate test อยู่ `/war-room`

### ผล QA

- `npm run typecheck` — passed
- `npm run lint` — passed

## 16. Research Memory for Periodic Market Articles

วันที่ทำงาน: 2026-06-15

### สิ่งที่ปรับ
- เพิ่ม Obsidian-style vault ที่ `knowledge/` สำหรับเก็บ research notes จาก market snapshot ทุก 30–60 นาที
- โครงสร้างโฟลเดอร์:
  - `knowledge/_raw/` สำหรับ raw AI output / transcript / quick captures
  - `knowledge/articles/` สำหรับ markdown articles พร้อม frontmatter
  - `knowledge/topics/` สำหรับ concept notes
  - `knowledge/sources/` สำหรับ source manifests
- เพิ่ม parser และ type:
  - `lib/research-notes/types.ts`
  - `lib/research-notes/parser.ts`
- เพิ่ม API route:
  - `GET /api/research-notes`
- เพิ่มหน้า:
  - `/research` แสดง research notes พร้อม status, snapshot interval, symbols, tags, AI-assisted/confidence badge
- เพิ่ม script:
  - `node scripts/import-research-notes.mjs` สำหรับ validate/preview notes
- เพิ่ม unit test:
  - `__tests__/unit/research-note-parser.test.ts`

### ผล QA
- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm test` — passed
- `npm run build` — passed

## 15. Paid Gate, Data Honesty, PWA/Push Hardening

วันที่ทำงาน: 2026-06-15

### สิ่งที่ปรับ
- `exportCsv` มี server route `/api/screener/export` ใช้ `requireFeature('exportCsv')` และสร้าง CSV จาก filtered universe บน server
- Portfolio export ย้ายไป `/api/portfolio/export` และใช้ `requireFeature('exportCsv')` เพื่อไม่ให้ Free user download holdings ผ่าน client-only logic
- แยก `news_article_impact` ออกจาก `news_articles`; Pro impact fields อ่านผ่านตารางใหม่และ RLS gate `newsImpact`
- เพิ่ม RLS plan gates สำหรับ portfolio/journal/war-room surfaces ใน `supabase/schema.sql`
- `/api/news`, `/api/news/refresh`, และ news detail page อ่าน impact จากตารางใหม่ตาม entitlement
- PWA/push ปรับให้ใช้ PNG icons, เพิ่ม VAPID env ใน `render.yaml`, และ service worker cache offline shell
- earnings/fundamental/backtest/home sample surfaces เพิ่ม `meta`/visible sample badges

### ผล QA
- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm test` — passed
- `npm run build` — passed
- `git diff --check` — passed except existing CRLF warnings

## 16. Local Security Smoke Checks

วันที่ทำงาน: 2026-06-15

### สิ่งที่ปรับ
- เพิ่ม Playwright security smoke suite: `__tests__/e2e/security-smoke.spec.ts`
- เพิ่ม npm scripts:
  - `npm run security:smoke`
  - `npm run security:browser-use`
- เพิ่ม optional Browser Use sandbox runner: `scripts/browser-use-security-scan.py`
- แก้ `app/api/screener/universe/route.ts` ให้ anonymous/Free API response เป็น 401/403 แทน 503
- อัปเดต `START_HERE.md` ด้วย security smoke workflow
- เพิ่ม `docs/SECURITY_SMOKE.md`

### ผล QA
- `npm run typecheck` — passed
- `npm run lint` — passed
- `npm run test:e2e -- __tests__/e2e/security-smoke.spec.ts --workers=1` — passed
