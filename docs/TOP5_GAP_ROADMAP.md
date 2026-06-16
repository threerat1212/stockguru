# StockGuru Top 5 Gap Analysis & Product Roadmap

วันที่อัปเดต: 2026-06-10  
เป้าหมาย: แปลงการเปรียบเทียบกับ web การเงินชั้นนำเป็น backlog ที่นำไปพัฒนาต่อได้จริง

---

## 1. Positioning ที่แนะนำ

StockGuru ไม่ควรแข่งกับ TradingView ตรง “charting platform ลึกที่สุด” แต่ควรแข่งตรง:

> **Thai market research cockpit + AI assistant ที่ช่วยนักลงทุนไทยเห็นว่าวันนี้มีอะไรเปลี่ยนในหุ้นที่ถือ/เฝ้าดู และต้องตรวจสอบอะไรต่อ**

TradingView ชนะเรื่อง charting, ideas, scripts, community  
StockGuru ควรวางตำแหน่งเป็น:

- Thai-first
- SET/mai + US market leaders
- AI สรุปแบบมี source + disclaimer
- Watchlist / portfolio / alerts / screener ที่เชื่อมกัน
- ไม่ขายสัญญาณซื้อ ไม่การันตีกำไร ไม่เป็น financial advice

---

## 2. Benchmark Top 5

| Web | จุดแข็งที่ควรเรียนรู้ | สิ่ง StockGuru ควรหยิบมาใช้ |
|---|---|---|
| TradingView | Charting, indicators, drawing, alerts, screener, ideas, social graph | Advanced chart layout, watchlist sync, alerts, compare chart, saved screener |
| Investing.com | ครอบคลุมหลายตลาด, economic calendar, news, portfolio, alerts | Market dashboard, economic calendar, multi-asset overview, email/push alerts |
| Yahoo Finance | Company profile, financials, analyst estimates, news aggregation | Company fundamentals, financial statements, dividend/earnings timeline |
| Finviz | Heatmap, fast screener, top movers, market snapshot | Thai heatmap, volume movers, new high/low, sector rotation |
| Seeking Alpha | Thesis, analyst-style analysis, earnings/dividend insight, paid content | AI impact brief, investment thesis template, earnings/dividend analysis |

### Thai local context ที่ต้องไม่ลืม

คู่แข่ง/แหล่งข้อมูลที่นักลงทุนไทยคุ้นเคย:

- SET.or.th — ข้อมูลทางการ, ประกาศ, fund flow, trading statistics
- Kaohoon — ข่าวหุ้นไทย, บทวิเคราะห์, community
- SETTRADE — quote, watchlist, trading tools
- Streaming / broker app — alert, order, portfolio
- Line OA / Telegram stock channels — real-time alerts และ digest

**สรุป:** StockGuru ควรเป็น “ชั้นวิเคราะห์และสรุป” ที่อยู่เหนือข้อมูลดิบ ไม่ใช่แค่ portal ข่าวหรือ chart อีกตัว

---

## 3. สถานะปัจจุบันจากโค้ด

อ่านไฟล์หลักแล้วพบโครงสร้างที่ดี:

- Stack: Next.js 14, React 18, TypeScript, Tailwind
- Auth/DB: Supabase + RLS
- Billing: Stripe
- AI: MiMo
- Market data: Yahoo Finance proxy + fallback/sample
- Charts: TradingView widget + lightweight-charts
- Deploy: Render
- หน้าหลัก: home, stock detail, screener, AI, portfolio, news, compare, alerts, watchlist, journal, sector, earnings, research memory
- Subscription: Free / Pro / Trader พร้อม `PLAN_LIMITS`
- Server gating: `lib/subscription/server.ts` มี `requireFeature()`
- Alerts: มี cron `/api/alerts/check` และ email notification ถ้ามี `RESEND_API_KEY`
- Research memory: มี Obsidian-style vault ที่ `knowledge/` สำหรับ article workflow แบบ near-real-time snapshot

จุดที่ต้องระวังจากโค้ด:

1. `lib/data/fetchers/set-index.ts` ยังเป็น mock SET index
2. `lib/data/fetchers/thai-stocks.ts` ยัง mock แค่ไม่กี่หุ้นไทย
3. `lib/services/stock-service.ts` มี fallback quotes/history สำหรับ selected symbols เท่านั้น
4. News เป็น `AI Market Brief` ไม่ใช่ news wire จริง; impact score/points แยกตารางและ gate ด้วย Pro
5. Alerts ตอนนี้มี price/%/volume alert path; email/push และ advanced conditions ยังต้อง production verify
6. Sector / earnings ยังมี sample data ในหลายส่วน
7. AI fallback analysis มี `isDemo: true` แต่ UI ต้องแสดงสถานะ demo ให้ชัดเสมอ

---

## 4. Gap หลักที่ต้องเติม

### P0 — ต้องมีก่อนขาย paid product

| ID | Feature | Gap ปัจจุบัน | Acceptance criteria | Priority |
|---|---|---|---|---|
| P0-1 | Reliable Thai market data | SiamChart path มี fallback/sample และ provider gaps | มี provider, full SET/mai universe, meta `{ source, isDemo, provider, updatedAt }`, badge ชัดเจน | Critical |
| P0-2 | Market dashboard | มี `/market` + `/api/market/summary` แล้ว แต่ coverage/reliability ยังไม่พอ | แสดง SET/mai indices, advance/decline, top movers, volume movers, sector heatmap พร้อม provenance | Critical |
| P0-3 | Advanced screener | มีหน้า screener แต่ต้องกรองจริง | Filter by sector, market cap, PE/PB/ROE/dividend, volume, 52-week, MA/RSI, save/export | Critical |
| P0-4 | Smart alerts | มี price/%/volume alert path; email/push/advanced conditions ยังต้อง verify | Alert ตาม price, % change, volume spike, MA cross, RSI, news/earnings; email + push | Critical |
| P0-5 | Data trust layer | Demo/fallback ต้องไม่ทำให้เข้าใจผิด | API หลักมี `meta`/warning และ UI sample/fallback surfaces มี badge; ยังต้องขยายไปยังทุก widget ที่ใช้ข้อมูลจำลอง | Critical |

### P1 — ทำให้ใกล้เคียง TradingView/Investing ใน workflow

| ID | Feature | Gap ปัจจุบัน | Acceptance criteria | Priority |
|---|---|---|---|---|
| P1-1 | Advanced charting | มี chart แต่ยังไม่ลึก | TradingView Advanced Chart, save layout, indicators, drawings, compare, templates | High |
| P1-2 | News with citations + AI impact | ข่าวเป็น AI brief ไม่มี source | News card มี source link, timestamp, category, related symbols, AI impact panel gated Pro | High |
| P1-2.1 | Research memory workflow | มี `knowledge/` vault + parser/API แต่ยังต้องเชื่อม ingestion pipeline | มี scheduled snapshot -> raw note -> reviewed article -> publish boundary พร้อม provenance และ human review | High |
| P1-3 | Portfolio analytics | มี portfolio/journal แต่ analytics ยังน้อย | P/L, allocation, benchmark vs SET/SET50, sector exposure, dividend, realized/unrealized | High |
| P1-4 | Watchlist intelligence | Watchlist เป็นแค่รายชื่อ | Mini chart, signal summary, news impact, alert status, AI watchlist digest | High |
| P1-5 | PWA + push | มี manifest/service-worker/push subscribe บางส่วน | Installable PWA, web push payload icon, VAPID Render env, offline shell cached; ยังต้อง mobile install/push smoke test | High |

### P2 — สร้าง differentiation ระยะกลาง

| ID | Feature | เหตุผล | Acceptance criteria | Priority |
|---|---|---|---|---|
| P2-1 | Economic calendar | นักลงทุนต้องดู macro | FED/CPI/interest rate, Thai macro, earnings/dividend calendar, export iCal | Medium |
| P2-2 | AI daily brief | ทำให้กลับมาใช้ทุกวัน | สรุป watchlist, portfolio risk, news impact, alerts, screener hits เป็นภาษาไทย | Medium |
| P2-3 | Fund flow / foreign holding | สำคัญมากสำหรับหุ้นไทย | แสดง foreign net buy/sell, inst/prop flow ถ้ามี license/data | Medium |
| P2-4 | Broker CSV import | ลด friction portfolio | Import holdings/trades จาก CSV, map symbol/currency/fees | Medium |
| P2-5 | Paper backtesting | มีค่าแต่ใช้ข้อมูลคุณภาพสูง | Backtest simple strategies ด้วย historical data และ disclaimer ชัด | Medium |

---

## 5. สิ่งที่ควร “ยังไม่ทำ” ในตอนนี้

| Feature | เหตุผลที่ยังไม่ควรทำ |
|---|---|
| Social feed / public ideas | ต้อง moderation, compliance, community management |
| Live broker execution | Legal, broker integration, order risk สูงมาก |
| Backtesting engine เต็มรูปแบบ | ต้อง data history คุณภาพสูง และ maintenance เยอะ |
| Crypto / derivatives / options | กระจาย focus จาก core Thai stock research |
| AI บอกซื้อ/ขาย | ขัดกับกฎ product และเสี่ยง compliance |

---

## 6. Roadmap 30 / 60 / 90 วัน

### 30 วันแรก — สร้างความน่าเชื่อถือและ retention พื้นฐาน

> **สถานะ PR9A:** `Market Data Provider Abstraction` ทำแล้วใน working copy  
> **ที่เหลือ:** PR9B Reliable Thai Market Data ยังต้องเลือก provider / API key / license สำหรับ SET/mai

1. เลือกและต่อ market data provider สำหรับ SET/mai
2. เพิ่ม full universe หุ้นไทย + sector mapping
3. ทำ market dashboard: index, advance/decline, top movers, volume movers, sector heatmap
4. ปรับ alerts ให้มี email/push และเงื่อนไขมากขึ้น
5. Audit paid feature gate ทั้ง client และ server
6. Update `START_HERE.md`, `PRODUCT.md`, `stockguru-roadmap.md` ให้ตรงกับ roadmap นี้

### 60 วัน — ทำให้เป็น workspace ที่ใช้จริง

1. Advanced screener พร้อม save/export
2. Chart layout + compare chart ที่สมบูรณ์ขึ้น
3. News source + citation + AI impact panel
4. Portfolio analytics
5. PWA + push notification
6. Watchlist intelligence

### 90 วัน — สร้าง moat แบบ Thai-first

1. AI daily brief
2. Economic / earnings / dividend calendar
3. Fund flow / foreign holding ถ้ามี data
4. Broker CSV import
5. Paper backtesting แบบจำกัด strategy
6. Paid packaging ใหม่: Free / Pro / Trader

---

## 7. Monetization implication

ฟีเจอร์ที่ควรผูกกับแผน:

### Free
- ดูตลาดพื้นฐาน
- Watchlist จำกัด
- AI questions จำกัด
- Price alerts จำกัด
- News brief พื้นฐาน

### Pro
- Advanced screener
- Compare chart
- Portfolio analytics
- News impact panel
- Smart alerts
- Export CSV
- Watchlist digest

### Trader
- Journal
- Advanced alerts
- Backtesting/paper trading
- Broker import
- Higher limits
- Portfolio risk analytics

**หลักการ:** อย่าขายแค่ “AI chat”  
ให้ขาย “workflow ที่ช่วยตัดสินใจตรวจสอบหุ้นได้เร็วขึ้น”

---

## 8. Technical debt ที่ควรแก้ควบคู่

| Debt | เหตุผล |
|---|---|
| Data source abstraction | ต้องสลับ provider ได้โดยไม่แก้ทั้ง app |
| Unified cache layer | ปัจจุบัน cache แยก route/in-memory |
| API schema validation | ลด `unknown`/implicit contract |
| Structured logging / Sentry | production ต้องเห็น error/correlation |
| Server-side gate audit | Pro feature ต้องกันทั้ง client และ API | `exportCsv` มี API gate แล้ว; RLS plan gates เพิ่มแล้วสำหรับ portfolio/journal/war-room/newsImpact impact table |
| Mobile-first audit | alerts/push/daily brief ต้องการ mobile UX |
| i18n foundation | ถ้าจะขยาย EN ในอนาคต |

---

## 9. First engineering tickets

### Ticket 1: Market Data Provider Contract
- สร้าง interface `MarketDataProvider`
- Adapter สำหรับ Yahoo และ provider ใหม่
- ทุก response ต้องมี `meta: { source, isDemo, provider, updatedAt }`
- Unit tests สำหรับ live/demo metadata

### Ticket 2: Full Thai Universe
- เพิ่มตาราง/seed symbols สำหรับ SET/mai
- sector, index membership, currency, exchange
- searchstocks ค้นหาหุ้นไทยได้ครบ
- fallback ต้องแสดง demo badge

### Ticket 3: Market Dashboard
- สร้าง `app/market/page.tsx` หรือปรับ home
- แสดง indices, advance/decline, top movers, volume movers, sector heatmap
- ใช้ data provider จริงเป็นหลัก, demo fallback ชัดเจน

### Ticket 4: Advanced Screener
- สร้าง filter schema
- save screener ใน Supabase
- export CSV
- gate ด้วย `advancedScreener`

### Ticket 5: Smart Alerts
- เพิ่ม alert type: price, percent, volume, MA, RSI, news, earnings
- เพิ่ม notification_channel
- email + push
- cron idempotency ป้องกัน double trigger

### Ticket 6: News Citations + Impact
- เก็บ source URL, published_at, provider
- related symbols
- AI impact summary gated Pro
- หน้า news detail มี source + disclaimer

### Ticket 7: Portfolio Analytics
- คำนวณ P/L, allocation, benchmark, sector exposure
- link journal entries
- export statement

### Ticket 8: PWA + Push
- manifest, service worker
- VAPID keys
- subscribe/unsubscribe push
- alert notification route

---

## 10. Definition of Done สำหรับ roadmap นี้

- [ ] `START_HERE.md` อ้างถึงเอกสารนี้
- [ ] `stockguru-roadmap.md` มี PR9+ ตามลำดับ
- [ ] PRODUCT positioning ปรับเป็น Thai market research cockpit
- [ ] ทุก paid feature มี `PLAN_LIMITS`, `FeatureGate`, และ server `requireFeature()`
- [ ] ทุก market data response มี `meta`
- [ ] ทุก AI output มี disclaimer และไม่ใช้ภาษา buy/sell advice
- [ ] ไม่ commit `.env.local`, API keys, secrets
