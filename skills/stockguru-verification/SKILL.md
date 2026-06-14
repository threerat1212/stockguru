---
name: stockguru-verification
description: Use when claiming StockGuru implementation work is complete; coordinates targeted tests, repo-wide checks, docs updates, account-backed QA, and subagent consolidation before completion.
---

# StockGuru Verification

Use this skill whenever StockGuru work is ready to be called done, merged, or handed back to the user. It turns the repeated StockGuru completion pattern into a single evidence-first checklist.

## Scope

Use this for:

- Market data, dashboard, API, Agent Loop, MiroFish, SEGA, War Room, subscription, and docs changes.
- Work done by multiple subagents or parallel actors that must be consolidated.
- Final verification after targeted fixes, especially when the user asks "เหลือทำอะไรอีกไหม" or asks for another sweep.

Do not use this as a substitute for domain-specific skills. Read the relevant StockGuru skill too, such as `stockguru-market-data`, `stockguru-supabase`, `stockguru-deploy`, or `stockguru-ai-safety`.

## Core Rule

No completion claim without fresh verification evidence. `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` are the normal StockGuru gates when the change is broad enough to affect app code.

## Workflow

1. **Identify touched scope**
   - List changed files with `git status --short` and `git diff --stat`.
   - Group changes by domain: market data, UI, API, Supabase, Agent Loop/SEGA, deploy, docs.
   - If subagents edited overlapping files, consolidate stale or duplicate code before verification.

2. **Run targeted checks first**
   - Run tests for touched files when there are targeted test commands.
   - Examples:
     - `npm test -- market-data`
     - `npm test -- --run __tests__/unit/market-summary.test.ts`
     - `npm test -- --run __tests__/unit/sega-approval.test.ts __tests__/unit/sega-adapters.test.ts __tests__/unit/sega-personas.test.ts __tests__/unit/sega-storycraft.test.ts`
   - If a targeted command fails, fix or explain the failure before broader checks.

3. **Run repo-wide gates**
   - Run in `E:\งาน\หุ้น\stockguru`:
     - `npm run typecheck`
     - `npm run lint`
     - `npm test`
     - `npm run build`
   - For UI changes, add Playwright/e2e checks when the route is covered.
   - For deploy-sensitive changes, run the deploy smoke path from `stockguru-deploy` after local gates pass.

4. **Update docs**
   - If product behavior, architecture, API contracts, agents, QA, or roadmap changed, update the relevant docs before final handoff.
   - Common files:
     - `docs/IMPLEMENTATION.md`
     - `docs/IMPLEMENTATION_UPDATE.md`
     - `docs/AGENT_LOOPING_MVP.md`
     - `docs/MIROFISH_DEBATE_MODE.md`
     - `PRODUCT.md`
     - `START_HERE.md`
     - `stockguru-roadmap.md`
   - Do not claim docs are done until the files have been edited and, when relevant, the docs mention the new behavior and verification.

5. **Handle known QA gotchas**
   - Use `docs/TEST_ACCOUNTS.md` for account-backed QA.
   - Do not hardcode credentials. Keep real passwords only in `.env.local`.
   - Playwright does not automatically load `.env.local`; load those vars explicitly when running outside Next's env loader.
   - If a smoke account lacks Pro entitlement, provision a local Pro subscription row via the service-role path instead of changing app behavior just to satisfy the test.
   - SiamChart empty/non-JSON responses should normalize into clean provider warnings or fallback provenance, not raw parser noise.
   - Treat repeated SiamChart JSON parse stderr as actionable only when tests fail, Playwright fails, or route data is missing.

6. **Final sweep**
   - Re-run `git status --short` and inspect `git diff --stat`.
   - Confirm no unrelated files, secrets, `.env.local`, generated logs, or actor leftovers are staged or claimed.
   - Confirm docs are updated if the behavior changed.
   - Confirm verification commands passed with actual output.

## Stop Condition

Stop only when all applicable checks have passed, docs are updated when required, and the final diff is scoped to the intended work. If a check fails, report the exact failing command and next fix path instead of calling the task complete.
