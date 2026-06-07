---
name: stockguru-paid-beta
description: Use for StockGuru paid beta pricing, Free/Pro/Trader plans, usage limits, paywalls, Stripe checkout, Stripe webhooks, upgrade CTAs, and sales-readiness gates.
---

# StockGuru Paid Beta

## Positioning

StockGuru is sold as a Thai-first stock research workspace. It is not buy/sell advice.

Avoid:

- guaranteed profit
- buy signal
- stock picks
- AI tells you what to buy
- guaranteed return

Prefer:

- research workspace
- risk checks
- context summary
- suggested checks
- educational information

## Plans

Free:

- 0 THB
- AI 3 questions/day
- Watchlist 10 symbols
- Alerts 3
- Basic screener only
- Journal landing only

Pro:

- 199 THB/month
- AI 300 questions/month
- Watchlist 200 symbols
- Alerts 100
- Advanced screener
- Compare stocks
- Portfolio
- News impact summary
- Export CSV
- Journal preview only

Founding Pro:

- 149 THB/month
- Same Pro limits
- Launch promo only

Trader:

- 349 THB/month
- Full journal access
- Trade records
- Analytics and equity curve
- AI journal review
- Export

## Gating Rules

- Do not hide Pro-only features entirely.
- Show the feature and explain the upgrade reason.
- If a Free user hits a limit, show an upgrade CTA.
- If a Pro user opens Journal, show Trader upgrade preview.
- Only Trader should access `/journal`, `/journal/new`, `/journal/[id]`, `/journal/analytics`, and `/journal/review`.

## Stripe

Required env:

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_PRO=
STRIPE_PRICE_FOUNDING_PRO=
STRIPE_PRICE_TRADER=
```

Webhook must handle:

- `checkout.session.completed`
- subscription active
- subscription canceled
- payment failed
- expired or past due status

Always write webhook events to `billing_events` for debugging.

## Acceptance Checks

- Anonymous checkout route returns 401.
- Free user can sign up and hits plan limits.
- Upgrade CTA appears when a limit is hit.
- Successful Stripe webhook updates `subscriptions` and `profiles.plan`.
- Pricing page links from header/footer.
- Legal disclaimer appears on pricing and legal pages.
