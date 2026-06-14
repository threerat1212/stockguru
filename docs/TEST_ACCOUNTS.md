# Test Accounts

## MiroFish Smoke Pro

Local-only smoke test account for MiroFish Swarm / War Room Pro feature tests.

| Field | Value |
| --- | --- |
| Email | `mirofish-smoke-mqagkztm@example.com` |
| User ID | `ce179ed8-e9e3-4576-b3d6-6ecb9fc2e71f` |
| Plan | `pro` |
| Subscription status | `active` |
| Purpose | Playwright smoke test for `/mirofish`, `/war-room`, and Pro feature gate flows |
| Password | Stored only in local `.env.local` as `MIROFISH_SMOKE_PASSWORD`; do not commit |

### How to reuse

Use the local env values from `.env.local`:

```text
MIROFISH_SMOKE_EMAIL
MIROFISH_SMOKE_PASSWORD
MIROFISH_SMOKE_USER_ID
```

Do not commit `.env.local`. If the password is exposed outside local env, delete the test account and recreate it.

### Account-backed transcript QA

The MiroFish Smoke Pro account is also used by:

```bash
npm run test:e2e -- __tests__/e2e/account-transcript-war-test.spec.ts --workers=10
```

This runner signs in through isolated Playwright browser contexts, provisions the authenticated user as Pro, exercises Agent Loop, MiroFish Debate, and SEGA Review APIs, then writes per-persona Markdown/JSON transcripts under `test-results/**/transcripts/`.

Do not hardcode credentials in the transcript QA runner. Required local env values are:

```text
MIROFISH_SMOKE_EMAIL
MIROFISH_SMOKE_PASSWORD
MIROFISH_SMOKE_USER_ID
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

## Provider notes

- Xiaomi MiMo uses Xiaomi MiMo Token Plan API, not OpenRouter.
- DeepSeek uses DeepSeek own API, not OpenRouter.
- OpenRouter is only for free model paths; do not use paid OpenRouter models.
