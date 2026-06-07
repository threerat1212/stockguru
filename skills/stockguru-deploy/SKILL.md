---
name: stockguru-deploy
description: Use for StockGuru deployment, Render services, GitHub push flow, production smoke tests, environment variables, and deploy troubleshooting.
---

# StockGuru Deploy

## Scope

Use this for Render, GitHub, production env vars, deployment checks, and production route smoke tests.

## Known Setup

- Repo: `https://github.com/threerat1212/stockguru`
- Main branch: `main`
- Render web service: `stockguru-web`
- Live URL: `https://stockguru-web.onrender.com`
- Render cron: `stockguru-news-refresh`

Always verify current Render state before acting. Do not assume these IDs or URLs are still current.

## Secret Policy

- Do not write secrets to files.
- Do not print secrets after reading them from APIs.
- If a secret is exposed in terminal output, rotate it.
- Required env names belong in docs; secret values belong only in provider dashboards.

## Required Production Env

Web service:

```env
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
MIMO_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_PRO=
STRIPE_PRICE_FOUNDING_PRO=
STRIPE_PRICE_TRADER=
CRON_SECRET=
```

Cron service:

```env
CRON_SECRET=
```

## Render Build Rules

Use this build command because Tailwind/PostCSS are dev dependencies:

```bash
npm ci --include=dev && npm run build
```

Start command:

```bash
npm start
```

Render runs on Linux. Check case-sensitive imports and path aliases when local Windows builds pass but Render fails.

## Deploy Workflow

1. Run `git status --short`; do not stage unrelated generated logs.
2. Run `npm run lint`.
3. Run `npm run build`.
4. Commit only intended files.
5. Push to `origin main`.
6. Trigger or wait for Render deploy.
7. Poll latest deploy until `live`.
8. Smoke test:

```text
GET /
GET /pricing
GET /api/stock/trending
GET /api/news?category=all&page=1&limit=12
POST /api/chat without auth should return 401
POST /api/webhooks/stripe without signature should return 400
```

## Common Failures

- `Cannot find module '@/...'`: verify `tsconfig.json` has `baseUrl` and `next.config.js` has webpack alias.
- `Cannot find module 'tailwindcss'`: Render skipped dev dependencies; use `npm ci --include=dev`.
- `/api/news` table missing: Supabase schema has not been applied.
- Cron returns 401: web and cron `CRON_SECRET` values differ.
- Cron returns MiMo 401: `MIMO_API_KEY` is invalid or revoked.
