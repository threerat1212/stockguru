# StockGuru Project Skills

This is a project-local skill library for StockGuru only. Do not copy these skills into the global Codex skills directory unless the project owner explicitly asks for it.

## How to Use

**Always read `START_HERE.md` first** — it covers architecture, gating rules, data honesty, and what was already fixed.

Before starting a StockGuru task, pick the relevant skill folder and read its `SKILL.md`.

Use multiple skills when the task crosses boundaries. For example:

- Deploy issue: read `skills/stockguru-deploy/SKILL.md`
- Non-trivial engineering workflow, external agent workflow adaptation, or quality-gate planning: read `skills/stockguru-agent-workflow/SKILL.md`
- Supabase/auth/schema issue: read `skills/stockguru-supabase/SKILL.md`
- Pricing/paywall/subscription work: read `skills/stockguru-paid-beta/SKILL.md`
- Trending/quote/news data work: read `skills/stockguru-market-data/SKILL.md`
- AI answer or prompt work: read `skills/stockguru-ai-safety/SKILL.md`
- UX/UI work: read `skills/stockguru-ui-design/SKILL.md`
- Impeccable UX/UI work: read `.agents/skills/impeccable/SKILL.md` after `skills/stockguru-ui-design/SKILL.md`
- Trading journal work: read `skills/stockguru-trading-journal/SKILL.md`
- External skill sourcing: read `skills/stockguru-mercury-skills/SKILL.md`
- Supabase/Auth/RLS/schema work: read `skills/stockguru-supabase/SKILL.md`, then `.agents/skills/supabase/SKILL.md`
- SQL indexes, query optimization, schema design, or RLS performance work: also read `.agents/skills/supabase-postgres-best-practices/SKILL.md`
- AI memory, personalization, user-profile context, or RAG memory work: read `.agents/skills/supermemory/SKILL.md`
- AI context compression, tool-output/log compression, MCP/proxy context optimization, or Headroom evaluation: read `.agents/skills/headroom/SKILL.md`
- Gemini API, Google Gen AI SDK, or Google AI migration work: read `.agents/skills/gemini-api/SKILL.md` after `skills/stockguru-ai-safety/SKILL.md`
- BigQuery analytics, warehouse, anomaly detection, forecasting, or SQL jobs: read `.agents/skills/bigquery-basics/SKILL.md`
- Google Cloud deploy/migration work: read `.agents/skills/google-cloud-recipe-auth/SKILL.md`, `.agents/skills/gcloud/SKILL.md`, then `.agents/skills/cloud-run-basics/SKILL.md`

## Project Rules

- StockGuru is a Thai-first stock research workspace, not licensed financial advice.
- Never use copy such as guaranteed profit, buy signal, stock picks, or AI tells you what to buy.
- Never commit API keys, Supabase secrets, Stripe secrets, Render keys, or webhook secrets.
- Prefer real app verification over assumptions: run lint/build and hit the live or local route involved.
- Keep unrelated dirty files out of commits. In this repo, `output/playwright/*` may contain generated QA logs.
- Keep third-party skills project-local and curated. Do not install or copy a whole external skill registry into this repo.
- Addy Osmani Agent Skills guidance lives in `skills/stockguru-agent-workflow/SKILL.md`, references `https://github.com/addyosmani/agent-skills`, and is used as a curated workflow adapter only. Do not copy its whole repo, command wiring, personas, hooks, zips, or IDE-specific folders into StockGuru without explicit review.
- Imported Supabase Agent Skills live under `.agents/skills/`, come from `https://github.com/supabase/agent-skills`, and keep their MIT license files in each imported folder.
- Imported Supermemory skill lives under `.agents/skills/supermemory/`, comes from `https://github.com/supermemoryai/supermemory`, and keeps its MIT license file.
- Headroom guidance lives under `.agents/skills/headroom/`, references `https://github.com/chopratejas/headroom`, and keeps its Apache-2.0 license file.
- Imported Google skills live under `.agents/skills/`, come from `https://github.com/google/skills`, and keep Apache-2.0 license files in each imported folder. Use them only for explicit Google/Gemini/BigQuery/Cloud Run work; current production remains Render + Supabase unless changed deliberately.

## Current Production Surface

- Render web service: `stockguru-web`
- Render URL: `https://stockguru-web.onrender.com`
- Render cron: `stockguru-news-refresh`
- GitHub repo: `https://github.com/threerat1212/stockguru`

Verify these values before relying on them; deployment state can change.
