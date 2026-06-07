---
name: stockguru-ai-safety
description: Use for StockGuru AI prompts, AI chat, AI analysis, journal review, financial-safety copy, disclaimers, and removing buy/sell advice language.
---

# StockGuru AI Safety

## Core Rule

StockGuru AI is for research summaries, education, and risk checks. It must not provide licensed investment advice.

Avoid:

- buy
- sell
- guaranteed profit
- stock pick
- buy signal
- target as instruction
- AI tells you what to buy

Prefer:

- view
- context
- signal summary
- suggested checks
- things to verify next
- bullish/bearish/neutral context
- risk factors

## Required AI Answer Shape

AI answers should include:

1. Data used
2. Assumptions
3. Key observations
4. Risks
5. Suggested checks
6. Disclaimer that this is not financial advice

## Thai Disclaimer

Use short Thai disclaimer copy:

```text
ข้อมูลนี้มีวัตถุประสงค์เพื่อการศึกษาและการวิจัยเท่านั้น ไม่ใช่คำแนะนำการลงทุน ผู้ใช้ต้องรับผิดชอบต่อการตัดสินใจลงทุนของตนเอง
```

## Journal AI Review

Journal review must focus on user behavior and process:

- discipline
- risk management
- emotional pattern
- setup consistency
- mistakes to review

It must not recommend what asset to trade next.

## Code Areas

Check these areas when changing AI behavior:

- `app/api/chat/route.ts`
- `lib/services/ai-service.ts`
- `app/api/journal/review/route.ts`
- `components/ai/AIChat.tsx`
- `components/ai/AIAnalysis.tsx`

## Verification

Search for risky terms before finishing:

```bash
rg "guaranteed profit|buy signal|stock picks|AI tells you what to buy|คำแนะนำให้ซื้อ|สัญญาณซื้อ|กำไรแน่นอน" app components lib
```

Then smoke test:

```text
POST /api/chat unauthenticated should return 401
AI UI should not mention demo login
AI outputs should contain risk and disclaimer
```
