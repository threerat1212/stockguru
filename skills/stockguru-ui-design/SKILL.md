---
name: stockguru-ui-design
description: Use for StockGuru UX/UI design work, DESIGN.md updates, Thai-first interface decisions, responsive QA, pricing UX, dashboard ergonomics, and design benchmark research.
---

# StockGuru UI Design

## Required First Step

Before UX/UI implementation, write or update `DESIGN.md`.

The design note should include:

- target user
- workflow being improved
- benchmark patterns studied
- what is adapted, not copied
- layout and responsive risks
- validation checklist

## Benchmark Rule

For major UI work, study 5 comparable products or pages first. Do not copy them. Extract patterns and adapt for StockGuru.

Relevant benchmark categories:

- stock research workspace
- market scanner
- watchlist and alerts
- trading journal
- SaaS pricing page
- Thai fintech or brokerage UX

Use current web research when the answer depends on recent competitor UI or pricing.

## Product Feel

StockGuru should feel like a practical research desk:

- dense but readable
- Thai-first
- restrained visual style
- clear actions
- fast scanning
- no marketing-only landing page when a working tool is expected

Avoid:

- decorative gradient blobs
- huge hero sections inside app workflows
- card inside card layouts
- text overflow on mobile
- hiding gated features without explanation

## UX Rules

- Show upgrade reasons for gated features.
- Keep pricing copy educational and compliant.
- Keep buttons and controls stable in width and height.
- Use icons for actions where appropriate.
- Use loading, empty, error, and limit states.
- Avoid horizontal overflow on mobile and desktop.

## Core Pages to QA

```text
/
/pricing
/ai
/screener
/trending
/journal
/watchlist
/alerts
```

## Verification

Run:

```bash
npm run lint
npm run build
```

Then use browser QA on desktop and mobile:

- page is not blank
- no console/page errors
- no horizontal overflow
- no text overlap
- key CTA is visible
- gated feature explains upgrade reason
