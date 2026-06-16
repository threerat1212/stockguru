# StockGuru Research Memory

โฟลเดอร์นี้คือ Obsidian-style knowledge vault สำหรับบทความ/โน้ตที่ AI สร้างจาก market snapshot ทุก 30–60 นาที

## โครงสร้าง

- `_raw/` — raw notes, transcript, output จาก AI ที่ยังไม่ได้ review
- `articles/` — markdown articles พร้อม frontmatter สำหรับ publish/import
- `topics/` — concept notes เช่น valuation, dividend, bank sector
- `sources/` — source log / link manifest / provider notes

## Frontmatter ขั้นต่ำ

```yaml
---
title: "ชื่อบทความ"
slug: "bank-sector-dividend-watch"
status: "draft"
snapshotAt: "2026-06-15T10:30:00+07:00"
snapshotIntervalMinutes: 60
sourceType: "market_snapshot"
symbols: ["PTT.BK", "SCB.BK"]
tags: ["market", "bank", "dividend"]
sources:
  - title: "Source title"
    url: "https://example.com"
    accessedAt: "2026-06-15T10:30:00+07:00"
aiAssisted: true
confidence: "medium"
---
```

## กฎ

- ต้องแยก `snapshotAt` และ `updatedAt`
- ต้องมี `sources` หรือ `sourceType`
- ถ้าเป็น AI สรุป ต้องเขียน `aiAssisted: true`
- ข้อมูลราคา/ตลาดเป็น near-real-time snapshot ไม่ใช่ real-time
- ก่อน publish ต้องเปลี่ยน `status` เป็น `review` หรือ `published`
