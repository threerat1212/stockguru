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

## การตรวจสอบ Build

- `npx tsc --noEmit` — **ผ่าน** (ไม่มี TypeScript errors)
- ไม่มี syntax errors หรือ type mismatch ในทุกไฟล์ที่แก้ไข
