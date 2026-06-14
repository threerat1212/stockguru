---
name: stockguru-agent-workflow
description: Use when starting non-trivial StockGuru engineering work, adapting external agent workflow skills, deciding which project skill applies, or setting quality gates for spec, plan, build, test, review, documentation, and launch work.
---

# StockGuru Agent Workflow

This is the StockGuru adapter for engineering workflow skills inspired by `addyosmani/agent-skills`.

Use the upstream project as a source of workflow ideas, not as a bulk dependency. StockGuru already has project-specific rules for Thai financial safety, market-data honesty, subscription gating, UX craft, Supabase/RLS, Render deploy, and account-backed QA. Those local rules win.

## Source

- Upstream reference: `https://github.com/addyosmani/agent-skills`
- License: MIT
- Local policy: do not copy the full repo into StockGuru. Curate the workflow ideas into this skill or a focused project skill.

## First Step

Read these files before choosing a workflow:

1. `START_HERE.md`
2. `PRODUCT.md`
3. `DESIGN.md` for UI work
4. `SKILLS.md`
5. The domain skill(s) below

## Intent Router

Use this routing table before implementation.

| Work Type | Read First | Then Apply |
|---|---|---|
| UX/UI, responsive, design polish | `skills/stockguru-ui-design/SKILL.md` | `$impeccable`, browser sweep, `DESIGN.md` update |
| Market data, quote, screener, news source | `skills/stockguru-market-data/SKILL.md` | provider provenance, fallback honesty, API/unit tests |
| Supabase, auth, RLS, schema | `skills/stockguru-supabase/SKILL.md` | migration review, RLS tests, account smoke |
| AI chat, War Room, MiroFish, SEGA | `skills/stockguru-ai-safety/SKILL.md` | safe finance wording, no buy/sell advice, verifier, prompt-injection checks |
| Pricing, paywall, subscription limits | `skills/stockguru-paid-beta/SKILL.md` | server gating plus UI explanation |
| Trading journal | `skills/stockguru-trading-journal/SKILL.md` | process feedback, no asset recommendation |
| Deployment or production issue | `skills/stockguru-deploy/SKILL.md` | Render health checks, env verification |
| Final proof / handoff | `skills/stockguru-verification/SKILL.md` | typecheck, lint, tests, build, e2e when relevant |

## Lifecycle

Use the smallest lifecycle that fits the task.

### 1. Define

For broad or ambiguous work:

- State concrete assumptions.
- Identify user workflow and business risk.
- Name compliance constraints, especially financial-safety copy.
- Update `DESIGN.md`, product docs, or a task doc before UI/architecture work when behavior changes.

Do not ask broad strategy questions if the answer is discoverable from the repo. Inspect code first.

### 2. Plan

Break work into verifiable slices:

- UI surface and routes touched.
- API/database/provider contracts touched.
- Tests required.
- Docs to update.
- Rollback or fallback behavior.

Prefer one vertical slice that can be tested over a large refactor.

### 3. Build

Implement conservatively:

- Follow existing Next.js, Tailwind, TanStack Query, Zustand, Supabase, and project component patterns.
- Keep unrelated dirty files intact.
- Do not introduce new abstraction unless it removes real complexity.
- Preserve data honesty metadata and disclaimers.
- Keep UI dense, Thai-first, and task-focused.

### 4. Verify

Choose evidence based on blast radius:

- Narrow TS/doc-only change: `npm run typecheck` when TypeScript is touched.
- UI change: `npm run typecheck`, `npm run lint`, browser check on desktop/mobile, console check.
- API/logic change: targeted unit tests plus `npm test`.
- Broad app change: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`.
- Account or Pro-gated change: account-backed Playwright path using `.env.local` without printing secrets.

Verification must use actual output, not "looks right".

### 5. Review

Before handoff, review the diff against these axes:

- Correctness: does it meet the current request?
- Safety: no financial advice, no secret leakage, no client-only auth boundary.
- Maintainability: smaller, clearer code with local patterns.
- UX: no hydration errors, no blank loading gates, no horizontal overflow, usable mobile controls.
- Tests/docs: coverage and docs match behavior changes.

### 6. Ship / Handoff

Only deploy, commit, or push when the user asks. Otherwise leave local changes and report:

- what changed
- what was not imported
- verification evidence
- local URL if a server is running

## What To Adapt From addyosmani/agent-skills

Good fits for StockGuru:

- Lifecycle thinking: define, plan, build, verify, review, ship.
- `frontend-ui-engineering`: component focus, accessibility, responsive behavior, design-system discipline.
- `browser-testing-with-devtools`: real browser evidence, console/network/performance checks. In this project, use the available Browser skill or Playwright.
- `test-driven-development`: failing/targeted tests for risky logic, DAMP tests over over-abstracted tests.
- `debugging-and-error-recovery`: reproduce, localize, reduce, fix, guard.
- `api-and-interface-design`: contract-first API changes and stable error semantics.
- `security-and-hardening`: trust boundaries, auth, secrets, external APIs, webhooks, LLM output as untrusted data.
- `performance-optimization`: measure first, especially LCP, hydration, bundle and network costs.
- `documentation-and-adrs`: document why significant choices were made.
- `observability-and-instrumentation`: useful server logs and provider warnings, without leaking secrets.
- Generic finance wording, but only after adapting it through `skills/stockguru-ai-safety/references/finance-wording.md`.

## What Not To Import

Do not bring these parts into StockGuru unless the user explicitly asks and the integration is reviewed:

- Whole upstream repo or all 24 skills. It would duplicate local StockGuru skills and bloat agent context.
- Slash-command wiring under `commands/` or `.claude/commands/`. Codex in this project already has its own skill-loading model.
- Platform folders: `.claude/`, `.gemini/`, `.opencode/`, `.claude-plugin/`, `plugin.json`, and IDE-specific setup docs.
- Hook automation from upstream. Do not add auto-running hooks that modify files, commit, deploy, or execute commands without explicit local review.
- Agent personas as mandatory subagents. Use them as inspiration only; do not require multi-agent orchestration for ordinary tasks.
- Zip packaging requirements. This repo uses project-local folders under `skills/`, not packaged skill zips.
- Bash-only helper scripts that assume Unix paths. StockGuru development is primarily Windows/PowerShell.
- Generic README or setup docs copied from upstream. Keep StockGuru docs specific to this app.
- Any workflow that says "always ask first" before inspecting obvious local code. StockGuru preference is inspect repo first, then ask only when needed.
- Raw finance wording that could drift into stock picks, buy/sell calls, guaranteed profit, or autonomous trading.

## StockGuru Overrides

These override any upstream workflow idea:

- StockGuru is decision support and education, not investment advice.
- Agent Loop, MiroFish, and SEGA never send orders and never create a new buy/sell signal.
- Market-data APIs must carry source/provenance and honest fallback states.
- Pro/Trader gating must exist on server and UI.
- UI work must follow `DESIGN.md` and `$impeccable` when invoked.
- Docs updates are part of completion when behavior, architecture, workflow, tests, or imported guidance changes.

## Completion Checklist

- Relevant domain skill read.
- External guidance curated, not bulk copied.
- No upstream platform integration added unintentionally.
- Local StockGuru safety rules applied.
- Tests/checks run according to touched scope.
- `SKILLS.md` or docs updated when workflow guidance changes.
