---
name: headroom
description: Use when considering Headroom for StockGuru AI context compression, tool-output/log compression, MCP setup, proxy setup, agent memory, or reducing token usage in AI workflows. Applies to AI app infrastructure decisions, not normal UI or market-data work.
---

# Headroom

Headroom is an Apache-2.0 context optimization layer for AI agents and LLM apps. It can compress tool outputs, logs, files, RAG chunks, and conversation context before they reach the model.

Source: `https://github.com/chopratejas/headroom`

## StockGuru Fit

Use Headroom only for AI infrastructure work, such as:

- Compressing long stock-analysis context before sending it to an LLM.
- Reducing token usage for AI chat, journal review, RAG, or log-heavy debugging.
- Adding a local MCP/proxy layer for agent workflows.
- Evaluating cross-agent context or failure-learning workflows.

Do not add Headroom to normal frontend, Supabase, Stripe, or market-data tasks unless the work explicitly touches AI context size or agent infrastructure.

## Required Reading

Read the curated docs index before implementing:

```text
references/llms.txt
```

Then open the exact upstream docs linked there for the chosen integration path.

## Integration Guardrails

- Do not install or run Headroom globally unless the user explicitly asks.
- Prefer a small proof-of-concept before wiring it into production AI routes.
- For StockGuru user-facing AI, keep `skills/stockguru-ai-safety/SKILL.md` in force: no buy/sell advice, no guaranteed profit, and include assumptions/risks.
- For Vercel AI SDK or TypeScript route work, verify package version and current docs before coding.
- Treat telemetry and local storage settings as product/privacy decisions; document any env vars or background process requirements.

## Verification

For implementation work, verify the exact path touched:

```text
AI route still responds
compressed context can retrieve original details when needed
token/log output reduction is measurable on a sample payload
no API keys or user data are committed
```
