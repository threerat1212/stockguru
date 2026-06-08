---
name: stockguru-supabase
description: Use for StockGuru Supabase auth, schema setup, RLS, database persistence, profiles, subscriptions, usage counters, watchlists, alerts, journal tables, and schema-cache errors.
---

# StockGuru Supabase

## Scope

Use this when working on Supabase Auth, SQL schema, RLS policies, persistence, subscriptions, usage counters, watchlists, alerts, journal data, or database-related production errors.

## External Supabase Agent Skills

This project imports selected MIT-licensed Supabase Agent Skills from `https://github.com/supabase/agent-skills` under `.agents/skills/`.

For any Supabase task, read:

```text
.agents/skills/supabase/SKILL.md
```

For SQL indexes, query optimization, schema design, privileges, or RLS performance, also read:

```text
.agents/skills/supabase-postgres-best-practices/SKILL.md
```

Local StockGuru requirements in this file remain the source of truth when they are more specific to this project.

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

For Google OAuth, configure the Google provider in Supabase Auth. Google Client ID and Client Secret live in Supabase Dashboard, not in this repo. Add the app callback route to the Supabase redirect allow list:

```text
https://stockguru-web.onrender.com/auth/callback
http://localhost:3000/auth/callback
http://localhost:3001/auth/callback
http://127.0.0.1:3000/auth/callback
http://127.0.0.1:3001/auth/callback
```

In Google Cloud OAuth client settings, use the Supabase project's callback URL from the Supabase Google provider page as the Authorized redirect URI.

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
