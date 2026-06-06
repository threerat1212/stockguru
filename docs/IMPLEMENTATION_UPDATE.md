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

1. Auth จริงยังไม่มี ต้องต่อกับระบบ login จริงในอนาคต เช่น NextAuth/Supabase/Firebase/Auth0
2. ข่าวยังเป็น mock data ใน `lib/data/news.ts` ถ้าต้องการ refresh จริงทุก 1-2 ชม. ควรทำ API route + cache/revalidate หรือ external news provider
3. Compare chart เป็นกราฟจำลองจาก quote ปัจจุบัน ถ้าต้องการแม่นขึ้นควรใช้ `/api/stock/history`
4. Earnings calendar ยังเป็น sample data ควรต่อข้อมูลจริงจาก SET/แหล่งข้อมูลที่มี license
5. THB->USD ใช้ fixed rate 36 ควรต่อ FX rate จริงถ้าจะใช้ production

## ไฟล์หลักที่แก้/เพิ่ม

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
