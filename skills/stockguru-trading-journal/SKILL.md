---
name: stockguru-trading-journal
description: Use for StockGuru Trader plan, journal gating, portfolios, trades, trade analytics, equity curve, AI journal review, CSV export/import, and journal database policy.
---

# StockGuru Trading Journal

## Scope

Use this for the Trader plan and all journal features:

- `/journal`
- `/journal/new`
- `/journal/[id]`
- `/journal/analytics`
- `/journal/review`
- portfolio handling
- trade records
- equity curve
- AI journal review
- import/export

## Plan Gating

Free:

- sees journal landing or upgrade prompt only

Pro / Founding Pro:

- sees journal preview and Trader upgrade CTA
- does not access full journal

Trader:

- full journal access
- analytics
- export
- AI review

## Database

Minimum tables/functions are in:

```text
supabase/journal-schema.sql
```

Expected tables:

- `portfolios`
- `trades`
- `journal_reviews`

Expected functions:

- default portfolio creation
- user journal data export
- user journal data delete

RLS must ensure users only access their own journal data.

## AI Journal Review

AI review should analyze behavior, not make trade recommendations.

Allowed:

- risk discipline
- emotional pattern
- repeated mistakes
- setup consistency
- review suggestions

Not allowed:

- what to buy next
- what to sell next
- promised performance improvement

## UX Expectations

- New trade form should be fast on mobile.
- Analytics should handle empty state.
- Equity curve should show only when enough closed trades exist.
- Export should be gated and explain value.
- AI review should show daily/usage limits and a clear loading state.

## Verification

Test flows:

```text
Anonymous -> /journal -> upgrade/auth prompt
Free -> /journal -> landing/upgrade
Pro -> /journal -> preview and Trader CTA
Trader -> /journal -> full access
Trader -> /journal/review -> AI review or clear error
```

Run:

```bash
npm run lint
npm run build
```
