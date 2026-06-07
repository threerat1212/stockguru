---
name: stockguru-supabase
description: Use for StockGuru Supabase auth, schema setup, RLS, database persistence, profiles, subscriptions, usage counters, watchlists, alerts, journal tables, and schema-cache errors.
---

# StockGuru Supabase

## Scope

Use this when working on Supabase Auth, SQL schema, RLS policies, persistence, subscriptions, usage counters, watchlists, alerts, journal data, or database-related production errors.

## Required Env

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Do not commit values.

## Required SQL

Run these in Supabase SQL Editor, in order:

```text
supabase/schema.sql
supabase/journal-schema.sql
```

After applying schema, verify at minimum:

- `profiles`
- `subscriptions`
- `usage_counters`
- `watchlists`
- `alerts`
- `ai_usage_logs`
- `billing_events`
- `news_articles`
- `portfolios`
- `trades`
- `journal_reviews`

## Auth Redirects

For Render production:

```text
Site URL:
https://stockguru-web.onrender.com

Redirect URL:
https://stockguru-web.onrender.com/auth/callback
```

## RLS Expectations

- User-owned tables must use `auth.uid() = user_id`.
- `news_articles` should be readable publicly or by app users, depending on product state.
- Server write paths that bypass user auth should use `SUPABASE_SERVICE_ROLE_KEY` via `createAdminClient()`.
- Never use service role keys in client components.

## Common Errors

- `Could not find the table 'public.news_articles' in the schema cache`: schema not applied, wrong project URL, or Supabase schema cache not refreshed.
- Auth works locally but not production: check Site URL, redirect URL, and production env vars.
- Webhook updates do nothing: check `SUPABASE_SERVICE_ROLE_KEY`, `subscriptions` schema, Stripe webhook signature, and event logs.

## Verification

After schema/env changes:

```text
GET /api/news?category=all&page=1&limit=12 should not return schema-cache error
Sign up should create a profile
Free plan should apply by default
Stripe webhook should write billing_events
```
