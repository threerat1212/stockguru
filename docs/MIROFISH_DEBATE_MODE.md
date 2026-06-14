# MiroFish Debate Mode

## Goal

เพิ่ม MiroFish-inspired **Agent Discussion Layer** เข้าไปใน War Room เพื่อให้ user พิมพ์คำถาม แล้ว agents คุยกันเป็นรอบก่อน Reporter สรุป และ Verifier ตรวจ safety gate

ไม่ clone MiroFish ทั้งระบบ แต่ใช้ pattern ที่เหมาะกับ StockGuru:

```text
Seed Extractor → Moderator → Specialist Agents → Risk/Contrarian → Reporter → Verifier → Final Answer
```

## Product scope

- `/war-room` มี **MiroFish Debate Mode**
- User พิมพ์คำถามภาษาไทย เช่น `PTT ถ้ามูลค่าน้ำมันลงและบาทแข็ง จะกระทบอะไร`
- Seed Extractor แปลคำถามเป็น:
  - symbols
  - scenario
  - timeframe
  - intent
  - mode
- Moderator สร้าง debate brief
- Agents discuss แบบมีโครงสร้าง 3 รอบ:
  1. Observation Round
  2. Challenge Round
  3. Synthesis + Gate
- Reporter สรุปเป็น final answer
- Verifier gate ตรวจ:
  - ไม่มี buy/sell advice
  - ไม่การันตีกำไร
  - มี evidence
  - มี risk checklist
  - มี disclaimer
  - ภาษาไทยอ่านรู้เรื่อง

## Agents

MVP ใช้ 10 personas:

1. Moderator Agent
2. Market Data Agent
3. Technical Agent
4. Fundamental Agent
5. News Agent
6. Portfolio Agent
7. Risk Agent
8. Contrarian Agent
9. Reporter Agent
10. Verifier Gate

## Backend files

```text
lib/agent-loop/mirofish/
  types.ts
  seed.ts
  graph.ts
  personas.ts
  reporter.ts
  debate.ts
  schema.ts
  persistence.ts

app/api/war-room/debate/route.ts
```

## API

`POST /api/war-room/debate`

Request:

```json
{
  "question": "PTT ถ้ามูลค่าน้ำมันลงและบาทแข็ง จะกระทบอะไร",
  "symbols": ["PTT"],
  "scenario": "น้ำมันลง + บาทแข็ง",
  "timeframe": "1W",
  "mode": "custom"
}
```

Response:

```json
{
  "runId": "debate-...",
  "seed": {
    "symbols": ["PTT.BK"],
    "scenario": "PTT ถ้ามูลค่าน้ำมันลงและบาทแข็ง จะกระทบอะไร",
    "timeframe": "1W",
    "mode": "custom",
    "intent": "risk"
  },
  "summary": "MiroFish Debate วิเคราะห์...",
  "thesis": "...",
  "risks": [],
  "suggestedChecks": [],
  "confidence": 72,
  "rounds": [],
  "transcript": [],
  "verifier": {
    "status": "pass",
    "checks": []
  },
  "disclaimer": "..."
}
```

## Persistence

เพิ่ม Supabase tables:

```text
war_room_debate_runs
war_room_debate_messages
war_room_debate_evidence
war_room_debate_verifications
```

Migration:

```text
supabase/migrations/20260611150000_pr18_war_room_debate.sql
```

Fresh schema reference:

```text
supabase/schema.sql
```

ถ้า migration ยังไม่ได้ apply ตัว persistence จะ catch error และ API ยังตอบ result ได้ เพื่อไม่ให้ War Room block ระหว่าง dev/local

## UI

`app/war-room/page.tsx` เพิ่ม:

- textarea สำหรับคำถาม debate
- button `รัน MiroFish Debate`
- loading state
- final summary card
- transcript panel
- verifier card
- risk & next checks
- debate graph
- SEGA Review Gate หลัง debate result พร้อม review

## Safety rules

MiroFish Debate Mode ต้องไม่ทำสิ่งเหล่านี้:

- ไม่แนะนำซื้อ/ขายทันที
- ไม่การันตีกำไร
- ไม่เชื่อม broker
- ไม่ส่ง order
- ไม่ทำ autonomous trading
- ไม่อ้าง prediction certainty
- ไม่ให้ LLM เป็น final authority โดยไม่มี verifier

Output ต้องเป็น:

- decision support
- scenario rehearsal
- risk checklist
- evidence/source
- สิ่งที่ต้องเช็กต่อ
- disclaimer

## API status

### Current route

`POST /api/war-room/debate` มีแล้ว และใช้ `requireFeature('agentLoop')`

ตอนนี้ response มาจาก **rule-based MiroFish Debate Engine** เมื่อ env ไม่ครบ

```text
Seed Extractor → Moderator → Specialist Agents → Risk/Contrarian → Reporter → Verifier
```

SEGA review gate สามารถรับ `miroFishResult` ผ่าน `POST /api/sega/review` เพื่อ review proposal, downside, exit plan, allocation envelope, risk score และ approval decision โดยไม่สร้างสัญญาณใหม่

OpenRouter / Xiaomi MiMo / DeepSeek provider adapters พร้อมเปิดผ่าน env สำหรับ Reporter assist และ model router จับคู่จุดเด่นของ model กับงาน debate

### External AI provider

War Room ใช้ **model routing** แทนการเลือก model เดียวแบบตายตัว:

```text
Research / Fundamental / News  → NVIDIA Nemotron 3 Ultra / Nex-N2-Pro
Reporter / General reasoning   → Nex-N2-Pro / Nemotron 3 Super
Risk / Portfolio / Quant       → DeepSeek Chat
Thai explanation / disclaimer  → Xiaomi MiMo / Gemma 4 31B IT
Fast lightweight tasks         → GPT OSS 20B / Laguna XS.2
Coding-only models             → ไม่ใช้เป็น default market debate
Privacy-sensitive finance data → ใช้ free OpenRouter / MiMo / DeepSeek และ verifier gate
```

Provider adapters:

```text
lib/agent-loop/providers/openrouter-provider.ts
lib/agent-loop/providers/mimo-provider.ts
lib/agent-loop/providers/deepseek-provider.ts
lib/agent-loop/providers/model-router.ts
lib/agent-loop/providers/debate-assist.ts
lib/agent-loop/providers/reporter-draft.ts
```

Env ที่ควรใช้เมื่อเปิด OpenRouter:

```text
OPENROUTER_API_KEY=***
OPENROUTER_API_KEY_2=***
# หรือใช้ OPENROUTER_API_KEYS=key1,key2,key3 สำหรับ key pool แบบ comma-separated
AGENT_LOOP_LLM_PROVIDER=openrouter
AGENT_LOOP_LLM_BASE_URL=https://openrouter.ai/api/v1
AGENT_LOOP_LLM_MODEL=nvidia/nemotron-3-super-120b-a12b
AGENT_LOOP_LLM_MAX_TOKENS=700
AGENT_LOOP_LLM_TIMEOUT_MS=20000
AGENT_LOOP_LLM_DEBATE_ASSIST=true
```

ถ้าเปิด `AGENT_LOOP_LLM_DEBATE_ASSIST=true` War Room จะเรียก model assist เพิ่มเติมตาม model routing:
- Research/Fundamental/News → Nemotron Ultra
- Risk/Portfolio/Quant → DeepSeek
- Thai risk wording → Xiaomi MiMo
- Reporter → model ที่เลือกตาม intent

Env ที่ควรใช้เมื่อเปิด Xiaomi MiMo:

```text
MIMO_API_KEY=***
MIMO_BASE_URL=https://api.xiaomimimo.com/v1
MIMO_MAX_TOKENS=700
MIMO_TIMEOUT_MS=20000
```

Env ที่ควรใช้เมื่อเปิด DeepSeek:

```text
DEEPSEEK_API_KEY=***
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
DEEPSEEK_MAX_TOKENS=700
DEEPSEEK_TIMEOUT_MS=20000
```

Model routing reference:

| Model | ใช้กับ | จุดเด่น | ข้อควรระวัง |
| --- | --- | --- | --- |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | research / fundamental / long context | reasoning แรง, context 1M, เหมาะงานวิเคราะห์ยาว | free quota/latency อาจไม่เสถียร |
| `nvidia/nemotron-3-super-120b-a12b:free` | reporter / verifier fallback | multi-agent reasoning, throughput ดี | คุณภาพอาจรอง Ultra ในงานยาวมาก |
| `nex-agi/nex-n2-pro:free` | agentic reasoning / reporter default | agentic, structured output, Qwen base | model ใหม่ ต้อง validate กับคำถามจริง |
| `deepseek-chat` | risk / portfolio / quant | reasoning + structured calculation ผ่าน DeepSeek API | ไม่ใช่ market-data source โดยตรง |
| `mimo-v2.5-pro` | Thai explanation / risk wording | ภาษาไทยกระชับ, business writing | ต้องใช้ evidence จาก data agents |
| `google/gemma-4-31b-it:free` | Thai fallback / multilingual | multilingual, balanced | ไม่ควรใช้ฟันธง financial research |
| `poolside/laguna-m.1:free` | coding agent เท่านั้น | software engineering, tool calling | ไม่ใช้เป็น default market debate |
| `poolside/laguna-xs.2:free` | lightweight coding assist | เร็ว/เบา | คุณภาพน่าจะรอง Laguna M.1 |
| `openai/gpt-oss-120b:free` | general reasoning | structured output | knowledge cutoff Jun 2024 ถ้าไม่มี browsing/tool |
| `openai/gpt-oss-20b:free` | fast/lightweight | latency ต่ำ | งานซับซ้อนควรใช้รุ่นใหญ่กว่า |

Rule:

- ห้ามส่ง API key ไป frontend
- ต้องมี budget cap / rate limit
- ต้องมี verifier gate เสมอ
- ถ้า provider ไม่พร้อม ให้ fallback กลับไป rule-based debate

## Acceptance criteria

- [x] User พิมพ์คำถามใน War Room แล้วรัน debate ได้
- [x] Seed extraction แปล symbols/scenario/timeframe ได้
- [x] Agents discuss เป็นรอบก่อน final answer
- [x] UI แสดง transcript, verifier, risk, suggested checks
- [x] API ใช้ zod schema และ `requireFeature('agentLoop')`
- [x] Supabase migration/schema พร้อม
- [x] Migration applied via `supabase db query --linked --file supabase/migrations/20260611150000_pr18_war_room_debate.sql`
- [x] Manual smoke test `/war-room` gate copy
- [x] API gate `/api/war-room/debate` returns login required for anonymous user
- [x] Tests ผ่าน
- [x] Typecheck/build ผ่าน
