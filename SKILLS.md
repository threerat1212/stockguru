# StockGuru Project Skills

This is a project-local skill library for StockGuru only. Do not copy these skills into the global Codex skills directory unless the project owner explicitly asks for it.

## How to Use

Before starting a StockGuru task, pick the relevant skill folder and read its `SKILL.md`.

Use multiple skills when the task crosses boundaries. For example:

- Deploy issue: read `skills/stockguru-deploy/SKILL.md`
- Supabase/auth/schema issue: read `skills/stockguru-supabase/SKILL.md`
- Pricing/paywall/subscription work: read `skills/stockguru-paid-beta/SKILL.md`
- Trending/quote/news data work: read `skills/stockguru-market-data/SKILL.md`
- AI answer or prompt work: read `skills/stockguru-ai-safety/SKILL.md`
- UX/UI work: read `skills/stockguru-ui-design/SKILL.md`
- Trading journal work: read `skills/stockguru-trading-journal/SKILL.md`

## Project Rules

- StockGuru is a Thai-first stock research workspace, not licensed financial advice.
- Never use copy such as guaranteed profit, buy signal, stock picks, or AI tells you what to buy.
- Never commit API keys, Supabase secrets, Stripe secrets, Render keys, or webhook secrets.
- Prefer real app verification over assumptions: run lint/build and hit the live or local route involved.
- Keep unrelated dirty files out of commits. In this repo, `output/playwright/*` may contain generated QA logs.

## Current Production Surface

- Render web service: `stockguru-web`
- Render URL: `https://stockguru-web.onrender.com`
- Render cron: `stockguru-news-refresh`
- GitHub repo: `https://github.com/threerat1212/stockguru`

Verify these values before relying on them; deployment state can change.
