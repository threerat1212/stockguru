# MiroFish Swarm Simulation

MiroFish Swarm Simulation คือการนำแนวคิด MiroFish กลับมาใช้ในรูปแบบที่ StockGuru ควบคุมได้: สร้าง agent swarm หลาย persona ที่มีบุคลิก ความเชื่อ ความทรงจำ และช่องทางสังคมจำลอง แล้วปล่อยให้โต้ตอบกันเพื่อจำลองว่าเหตุการณ์หนึ่งอาจแตกออกเป็น scenario ไหน

## จุดประสงค์

ใช้สำหรับ:

- วิเคราะห์ข่าวหุ้น / ตลาด
- จำลอง reaction ของนักลงทุนหลายกลุ่ม
- ทดสอบแคมเปญการตลาด
- ทดสอบไอเดียฟีเจอร์หรือสินค้า
- หา blind spot, backlash, FOMO, sell-on-fact, second-order effects

## สิ่งที่ระบบเป็น

- ห้องซ้อมตัดสินใจ
- Social simulation / scenario rehearsal
- Multi-agent / swarm intelligence engine
- Decision support

## สิ่งที่ระบบไม่ใช่

- ไม่ใช่หมอดู
- ไม่ใช่เครื่องทำนายอนาคตแม่นยำ 100%
- ไม่ใช่คำแนะนำลงทุน
- ไม่ใช่คำแนะนำซื้อ/ขาย
- ไม่ควรใช้แทนข้อมูลจริงหรือการตัดสินใจของคน

## Architecture

```text
Event Injector
→ Swarm Personas
→ Simulated Twitter + Reddit
→ 3 Debate Rounds
→ Belief Updates
→ Sentiment Summary
→ Scenario Map
→ Risks / Opportunities / Blind Spots
→ Suggested Checks
```

## Default personas

MVP มี 12 personas:

1. นักลงทุนพื้นฐานระยะยาว
2. เทรดเดอร์โมเมนตัม
3. นักบริหารความเสี่ยง
4. รายย่อยขี้สงสัย
5. นักวิเคราะห์สถาบัน
6. คู่แข่งในตลาด
7. รายย่อย FOMO
8. Contrarian Value
9. ผู้คุมกฎ / compliance
10. Influencer สายเล่าเรื่อง
11. ลูกค้าจริง
12. Support / Sales

## Simulation flow

### Round 1 — First Reaction

แต่ละ agent ตอบสนองทันทีจาก:

- worldview
- memory
- beliefs
- risk tolerance
- influence
- expertise
- preferred channel

### Round 2 — Social Contagion

Agent อ่านปฏิกิริยาของคนกลุ่มอื่น แล้วขยายหรือโต้แย้งมุมมองเดิม

### Round 3 — Second-Order Thinking

Agent มองผลกระทบต่อเนื่อง เช่น:

- sell on fact
- FOMO
- backlash
- competitor response
- regulatory scrutiny
- support load
- valuation risk
- narrative overhype

## API

```http
POST /api/mirofish/swarm
```

Request:

```json
{
  "title": "PTT งบออกดี แต่ราคาน้ำมันโลกอ่อนและบาทแข็ง",
  "description": "จำลองว่าตลาดหุ้นไทยจะตีความข่าวนี้ยังไง และอาจเกิด sell on fact หรือ downside อะไรได้บ้าง",
  "domain": "stock",
  "timeframe": "1M",
  "actors": ["PTT", "นักลงทุนรายย่อย", "นักวิเคราะห์สถาบัน"],
  "assumptions": ["ข่าวอาจทำให้คนมองบวกก่อน", "ตลาดอาจกังวล sell on fact"]
}
```

Response:

```json
{
  "runId": "swarm-...",
  "event": {},
  "agents": [],
  "rounds": [],
  "posts": [],
  "beliefUpdates": [],
  "sentiment": {},
  "scenarios": [],
  "risks": [],
  "opportunities": [],
  "blindSpots": [],
  "suggestedChecks": [],
  "modelPolicy": {
    "mode": "deterministic-swarm",
    "paidOpenRouterModelsUsed": false
  },
  "disclaimer": "..."
}
```

## Model policy

Default MVP ใช้ deterministic swarm simulation และไม่ใช้ paid OpenRouter models

นโยบาย:

- ไม่ใช้ paid OpenRouter models
- ไม่ใช้ Owl Alpha / paid OpenRouter models
- ไม่เชื่อม broker / ไม่ทำ autonomous trading
- ไม่ output คำแนะนำซื้อ/ขายโดยตรง
- ต้องมี disclaimer และ risk framing

ถ้าในอนาคตจะเพิ่ม LLM assist ต้องใช้เฉพาะ:

- free OpenRouter models
- Xiaomi MiMo API ของตัวเอง
- DeepSeek API ของตัวเอง
- fallback rule-based/deterministic เสมอ

## UI

Route:

```text
/mirofish
```

Feature gate:

```text
agentLoop
```

## Safety

ทุก output ต้องระบุว่า:

- เป็น simulation
- ไม่ใช่ prediction
- ไม่ใช่คำแนะนำลงทุน
- ต้องเช็กข้อมูลจริง
- ต้องมี scenario และ trigger ที่ทำให้เปลี่ยนใจ

## Acceptance criteria

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
