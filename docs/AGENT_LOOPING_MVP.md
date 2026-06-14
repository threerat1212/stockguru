# Agent Looping / Market War Room MVP

## Objective

สร้าง Closed Loop Agent System + MiroFish-inspired Debate Layer + SEGA Review Gate + MiroFish Swarm Simulation สำหรับ StockGuru โดยดึงแนวคิดจาก MiroFish / Agent Looping มาปรับเป็น product สำหรับตลาดหุ้นไทย ไม่ใช่ clone engine ทั้งหมด

เป้าหมายคือให้ผู้ใช้เห็น:

1. สถานการณ์ตลาด/หุ้นใน watchlist หรือ portfolio
2. เหตุผลจากข้อมูลที่มี evidence
3. ความเสี่ยงที่ต้องเฝ้าระวัง
4. สิ่งที่ควรเช็กต่อ
5. Verifier trace ว่า output ผ่าน gate อะไรบ้าง

ระบบต้องเป็น **decision support** เท่านั้น ไม่ใช่ AI ทำนายหุ้น ไม่ใช่คำแนะนำซื้อ/ขาย และไม่ใช่ระบบซื้อขายอัตโนมัติ

## Why this direction

MiroFish เหมาะกับ general simulation engine ที่มี agent จำนวนมาก แต่ StockGuru ต้องเน้น finance safety, Thai market context, source trust และต้นทุนที่คุมได้

ดังนั้น MVP เลือกทำเป็น:

- Closed loop เล็ก
- Rule-based agents ก่อน
- Verifier gate ชัดเจน
- UI เป็น War Room
- ต่อ AI provider ภายหลังเมื่อมี paid usage / budget control

## Closed loop phases

```text
Discovery → Planning → Execution → Verification → Iteration
```

### Discovery

เลือก input:

- mode: watchlist / portfolio / market / custom
- symbols
- timeframe
- scenario
- holding input สำหรับ portfolio mode

### Planning

แบ่งงานให้ agents:

- Data Agent
- Technical Agent
- Fundamental Agent
- News Agent
- Risk Agent
- Portfolio Agent
- Report Agent
- Verifier Agent

### Execution

ดึงข้อมูลจาก existing StockGuru layer:

- `lib/services/stock-service.ts`
- `lib/market-data/providers/yahoo-provider.ts`
- `lib/market-data/providers/set-provider.ts`
- `lib/data/news.ts`

MVP ยังเป็น rule-based และใช้ news set ที่มีอยู่ ก่อนเชื่อม external news provider จริง

### Verification

Verifier gate ต้องผ่าน:

- ไม่มีคำแนะนำซื้อ/ขายทันที
- มี disclaimer
- มี evidence
- มี risk checklist
- ไม่อ้างเกินข้อมูลว่าเป็น prediction

ถ้าไม่ผ่าน จะเพิ่ม checklist ใน output แทนการส่ง raw agent result

### Iteration

เพิ่ม trace:

- verifier status
- verifier confidence
- checklist ที่เพิ่มจาก verifier
- latency

## Product surfaces

### `/war-room`

หน้าหลักของ Agent Looping:

- เลือก scope
- ใส่ scenario
- รัน loop
- แสดง closed loop state
- แสดง agent cards
- แสดง risk & next checks
- แสดง verifier trace
- แสดง SEGA review gate เมื่อมี Agent Loop / MiroFish Debate result พร้อม review

### `/api/agent-loop/simulate`

POST endpoint:

```ts
{
  mode: 'watchlist' | 'portfolio' | 'market' | 'custom',
  symbols: string[],
  timeframe: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL',
  scenario?: string,
  holdings?: { symbol: string; quantity?: number; buyPrice?: number }[]
}
```

Response:

```ts
{
  runId: string,
  summary: string,
  thesis: string,
  risks: string[],
  suggestedChecks: string[],
  confidence: number,
  agents: AgentResult[],
  verifier: VerificationResult,
  iterations: IterationTrace[],
  dataSources: AgentEvidence[],
  disclaimer: string,
  isDemo: boolean,
  updatedAt: string,
  latencyMs: number
}
```

## MiroFish Debate Mode

เพิ่มบน `/war-room` และ `/api/war-room/debate` เพื่อให้ user พิมพ์คำถาม แล้ว agents discuss ก่อนตอบ

Flow:

```text
User question
→ Seed Extractor
→ Moderator Agent
→ Market Data / Technical / Fundamental / News / Portfolio
→ Risk Agent
→ Contrarian Agent
→ Reporter Agent
→ Verifier Gate
→ Final Answer + Transcript
```

MVP ใช้ rule-based debate ก่อน เพื่อคุม cost, latency และ safety จากนั้นเพิ่ม AI provider เป็น optional Reporter assist โดยใช้ **model routing** ตามจุดเด่นของแต่ละ model

Model routing policy:
- Research / Fundamental / News → NVIDIA Nemotron 3 Ultra / Nex-N2-Pro
- Reporter / General reasoning → Nex-N2-Pro / Nemotron 3 Super
- Risk / Portfolio / Quant → DeepSeek Chat
- Thai explanation / disclaimer → Xiaomi MiMo / Gemma 4 31B IT
- Coding-only models เช่น Laguna M.1/Laguna XS.2 → ไม่ใช้เป็น default market debate

Current status:
- `/api/war-room/debate` มีแล้ว
- `app/war-room/page.tsx` แสดง MiroFish Debate Mode
- Supabase tables apply แล้ว
- Manual smoke test gate copy ผ่าน
- Anonymous API request ได้รับ login gate
- External LLM runtime ยังไม่ได้ validate ด้วย API key จริงใน session นี้
- OpenRouter / Xiaomi MiMo / DeepSeek provider adapter พร้อมเปิดผ่าน env
- Full multi-model debate assist เปิดด้วย `AGENT_LOOP_LLM_DEBATE_ASSIST=true` เพื่อคุม cost/latency

ดูรายละเอียดเต็ม: `docs/MIROFISH_DEBATE_MODE.md`

## SEGA Review Gate

เพิ่ม SEGA เป็น Finance Division / Capital Allocation & Risk Agent บน `/war-room` เพื่อ review สรุปจาก Agent Loop หรือ MiroFish Debate ก่อนนำไปใช้ต่อ

SEGA ไม่สร้างสัญญาณหลัก ไม่ดึงข้อมูลตลาดเอง และไม่ส่งคำสั่งซื้อขาย SEGA รับ proposal หรือ context จาก result ที่มีอยู่แล้ว แล้วตรวจ:

- thesis / downside / exit plan
- allocation envelope
- risk score
- kill criteria / monitoring triggers
- protected failure modes
- approval decision: `Go`, `Conditional Go`, `No-Go`
- Thai Storycraft brief สำหรับ War Room UI

Flow:

```text
Agent Loop / MiroFish Debate result
→ SEGA adapter
→ SEGA proposal
→ deterministic approval gate
→ Storycraft renderer
→ War Room SEGA Review Gate panel
```

Current status:
- `lib/agent-loop/sega/*` มี persona registry, proposal schema, adapters, approval gate, storycraft
- `POST /api/sega/review` มีแล้ว และรับ explicit `proposal` หรือ derive proposal จาก `agentLoopResult` / `miroFishResult`
- `app/war-room/page.tsx` แสดง SEGA Review Gate button และ render approval/storycraft payload จาก server
- Unit tests สำหรับ approval, adapters, personas, storycraft ผ่าน
- Typecheck/lint ผ่าน

Safety boundary:
- ไม่เป็น primary signal generator
- ไม่เป็น trade executor
- ไม่ duplicate Data / Technical / Fundamental / News / Risk agents
- output เป็น decision-support review พร้อม disclaimer และ checkpoint ถัดไป

## MiroFish Swarm Simulation

MiroFish Swarm Simulation ย้าย MiroFish กลับมาใกล้ core idea มากขึ้น: ไม่ใช่แค่ War Room debate แต่เป็น social simulation lab ที่โยน event เข้าไปแล้วให้ persona หลายตัวที่มี memory, beliefs, worldview และ channel จำลองโต้ตอบกัน

Current status:
- `/api/mirofish/swarm` มีแล้ว
- `/mirofish` มีแล้ว
- มี 12 personas พร้อม memory, beliefs, worldview, risk tolerance, influence, expertise
- มี simulated Twitter + Reddit feed 3 rounds
- มี sentiment summary, belief updates, scenario map, risks, opportunities, blind spots, suggested checks
- Default ใช้ deterministic swarm และไม่ใช้ paid OpenRouter models
- Unit tests สำหรับ stock และ marketing scenario ผ่าน

ดูรายละเอียดเต็ม: `docs/MIROFISH_SWARM.md`

## Account-backed transcript QA

มี Playwright account-backed transcript runner สำหรับจำลองผู้ใช้จริง 10 persona ในบริบทที่ซับซ้อนขึ้น:

```bash
npm run test:e2e -- __tests__/e2e/account-transcript-war-test.spec.ts --workers=10
```

Runner ใช้ Pro test account จาก `.env.local` แล้วเก็บ transcript แยกเป็น Markdown + JSON ไว้ใต้ `test-results/**/transcripts/` แต่ละ persona จะเรียก:

1. `/api/agent-loop/simulate`
2. `/api/war-room/debate`
3. `/api/sega/review`

Transcript เก็บ request JSON, response JSON, timestamp/latency ที่ response มี, correctness checks, และ failure message ถ้ามี เพื่อให้ทีมดูได้ว่าแต่ละ account ถามอะไร War Room ตอบอย่างไร และตอบถูกต้องตาม safety/evidence/risk boundary หรือไม่

Latest local result: `10 passed (32.5s)` สำหรับ realistic Thai investor scenarios. Transcript runner เขียน transcript ก่อน rethrow หาก correctness checks ล้มเหลว ทำให้ debug payload ได้ครบ แม้เทสจะไม่ผ่าน

Transcript review summary:
- ทั้ง 10 persona ผ่าน correctness checks ในทุก turn: `Agent Loop`, `MiroFish Debate`, และ `SEGA Review Gate`
- แต่ละ transcript มี request JSON, response JSON, correctness checks, และ failure marker ถ้ามี
- SEGA output ส่วนใหญ่เป็น `No-Go` risk score `100` ส่วน portfolio-mixed scenario เป็น `No-Go` risk score `85`; output ยังคงอยู่ใน decision-support boundary และไม่ออกคำแนะนำซื้อขายทันที
- MiroFish Debate ในทุก transcript มี `11 messages` และ `3 rounds`
- Known product-noise: dev-server ยัง log provider no-data สำหรับหุ้นที่ไม่มีข้อมูลหรือ symbol ที่มาจาก scenario เช่น `SCBX.BK`; seed extractor ได้รับการแก้แล้วเพื่อไม่ให้ดึงคำ finance/prose เช่น `margin`, `thesis`, `arpu`, `capex`, `npl`, `yield` ไปเป็นหุ้น `.BK` อีก

Latest transcript artifacts:
- `test-results/**/account-transcript-war-test*/transcripts/user-01-นักวิเคราะห์พลังงานรายย่อย.*`
- `test-results/**/account-transcript-war-test*/transcripts/user-02-นักลงทุนหุ้นเทค-สื่อสาร.*`
- `test-results/**/account-transcript-war-test*/transcripts/user-03-นักลงทุนค้าปลีก.*`
- `test-results/**/account-transcript-war-test*/transcripts/user-04-นักลงทุนแบงก์ระมัดระวัง.*`
- `test-results/**/account-transcript-war-test*/transcripts/user-05-นักลงทุนท่องเที่ยว-สายการบิน.*`
- `test-results/**/account-transcript-war-test*/transcripts/user-06-นักลงทุนอิเล็กทรอนิกส์ส่งออก.*`
- `test-results/**/account-transcript-war-test*/transcripts/user-07-นักลงทุนแบงก์ดิจิทัล.*`
- `test-results/**/account-transcript-war-test*/transcripts/user-08-นักลงทุนน้ำมัน-upstream.*`
- `test-results/**/account-transcript-war-test*/transcripts/user-09-นักลงทุนมอง-SET-index.*`
- `test-results/**/account-transcript-war-test*/transcripts/user-10-นักลงทุนพอร์ตผสม.*`

แต่ละ persona มี transcript แยก Markdown + JSON ครอบคลุม `Agent Loop`, `MiroFish Debate`, และ `SEGA Review Gate` พร้อม request JSON, response JSON, correctness checks, และ failure marker ถ้ามี

## Seed extractor follow-up

Fixed seed extraction so English finance/prose words inside the user question are not converted into Thai `.BK` symbols.

Changed:
- `lib/agent-loop/mirofish/seed.ts`
  - Added `SCENARIO_PROSE_WORDS` blacklist.
  - Filters `margin`, `thesis`, `arpu`, `capex`, `npl`, `yield`, and similar scenario terms before appending `.BK`.
- `__tests__/unit/mirofish-debate.test.ts`
  - Added regression coverage for a question containing `margin`, `thesis`, `ARPU`, `capex`, `NPL`, and `yield`.
  - Expected seed symbols remain only the explicit `PTT.BK`.

Verification:
- `npm test -- --run __tests__/unit/mirofish-debate.test.ts` — 6 passed
- `npm run test:e2e -- __tests__/e2e/account-transcript-war-test.spec.ts --workers=10` — 10 passed after the fix
- `npm run typecheck` — passed
- `npm run lint` — passed

Transcript confirmation:
- Latest User 01 transcript now shows `seed.symbols: ["PTT.BK"]` for the question containing `margin` and `thesis`.
- `grep` across `test-results/**/*.md` found no `MARGIN.BK`, `THESIS.BK`, `ARPU.BK`, `CAPEX.BK`, `NPL.BK`, or `YIELD.BK`.

Local dev server note:
- `npm run dev` printed `Local: http://localhost:3000`, but the shell-managed process exited when the Bash timeout ended, so `localhost:3000` was not reachable afterward.
- Attempted `Start-Process -FilePath 'npm.cmd' -ArgumentList 'run','dev','-p','3000'`, but the process also did not remain listening on port 3000.
- Next step if the user wants to open the app in browser: start `npm run dev` manually in `E:\งาน\หุ้น\stockguru` and keep the terminal open, then open `http://localhost:3000`.

## Safety rules

ห้าม output:

- “ซื้อเลย”
- “ขายเลย”
- “ควรซื้อ/ควรขายทันที”
- “การันตีกำไร”
- “ไม่มีความเสี่ยง”
- “all-in”
- “full margin”

ต้องมี:

- disclaimer
- risks
- suggestedChecks
- evidence
- verifier trace
- SEGA review gate สำหรับ approval, risk score, allocation envelope และ checkpoint ถัดไป
- demo/fallback badge ถ้าข้อมูลไม่ครบ

## Engineering boundaries

### MVP includes

- Rule-based agents
- Existing market data layer
- Existing news demo data
- Zod schema
- Pro feature gate
- Unit tests for schema + verifier
- War Room UI

### MVP excludes

- Full MiroFish clone with persistent memory, open-ended long-running agents, and arbitrary world simulation
- Autonomous trading
- Real-time SET/mai provider
- External news ingestion
- Long-running background agents
- Multi-agent orchestration with unbounded token budget
- Portfolio optimization

## Future upgrades

1. Connect real Thai news provider
2. Add provider metadata / demo badge
3. Add paid AI provider with budget caps
4. Persist run history
5. Add scenario templates
6. Add watchlist digest scheduled job
7. Add portfolio concentration / drawdown analytics
8. Add journal integration: “why I acted / why I waited”
9. Add Trade Plan + Paper Trading as a separate future PR, not real execution

## Trading system boundary

Trading system is intentionally **future backlog**, not part of PR16.

Agent Looping can support trading later by producing:

- scenario rehearsal
- risk checklist
- evidence notes
- journal prompts
- “สิ่งที่ต้องเช็กต่อ”

But PR16 must not produce:

- buy/sell order
- broker command
- autonomous trading
- guaranteed target
- guaranteed stop-loss outcome

See `docs/TRADING_SYSTEM_BACKLOG.md` for the future path: Trade Plan → Paper Trading → optional broker integration with user approval.

## Acceptance criteria

- [x] `npm run typecheck` passed
- [x] `npm test` passed
- [x] `npm run build` passed
- [x] `/war-room` local gate smoke test passed
- [ ] `/war-room` manual test passed with logged-in Pro account
- [ ] Verifier rejects unsafe trading language
- [ ] Free user sees Pro gate
- [ ] Pro user can run loop
- [ ] Result includes risks, checks, disclaimer, verifier trace
