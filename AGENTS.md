## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

When the user types `/graphify`, invoke the `skill` tool with `skill: "graphify"` before doing anything else.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- Dirty graphify-out/ files are expected after hooks or incremental updates; dirty graph files are not a reason to skip graphify. Only skip graphify if the task is about stale or incorrect graph output, or the user explicitly says not to use it.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).

## StockGuru project skills

**Read `START_HERE.md` first — every time, before any code change.**

This repo keeps project-local skills in `skills/` and selected agent-runtime skills in `.agents/skills/`.

For StockGuru work, read `START_HERE.md`, then `SKILLS.md`. Use the specific skill that matches the task before editing code.

For UX/UI work:

- Read `skills/stockguru-ui-design/SKILL.md`.
- Read `.agents/skills/impeccable/SKILL.md`.
- Run `node .agents/skills/impeccable/scripts/context.mjs` once per session.
- Treat `PRODUCT.md` and `DESIGN.md` as the source of truth.

For external Mercury Agent Skills:

- Read `skills/stockguru-mercury-skills/SKILL.md`.
- Import only a specific useful skill, never the whole Mercury registry.

For Supabase work:

- Read `skills/stockguru-supabase/SKILL.md`.
- Read `.agents/skills/supabase/SKILL.md`.
- For SQL indexes, query optimization, schema design, privileges, or RLS performance, also read `.agents/skills/supabase-postgres-best-practices/SKILL.md`.
- Local StockGuru rules still apply first for secrets, required schema files, Render redirects, and financial-product copy.

For AI memory or context infrastructure:

- Read `skills/stockguru-ai-safety/SKILL.md` first for financial-safety constraints.
- For persistent memory, personalization, user profiles, or RAG memory, read `.agents/skills/supermemory/SKILL.md`.
- For context compression, tool-output/log compression, MCP/proxy optimization, or Headroom evaluation, read `.agents/skills/headroom/SKILL.md`.
- Do not add new external runtime services or API keys without documenting env vars and keeping secrets out of git.

For Google skills:

- Use these only when the task explicitly involves Google, Gemini, BigQuery, Google Cloud auth, gcloud, or Cloud Run. StockGuru's current production stack is still Render + Supabase.
- For Gemini API or Google Gen AI SDK work, read `skills/stockguru-ai-safety/SKILL.md` first, then `.agents/skills/gemini-api/SKILL.md`.
- For BigQuery analytics, warehouse, anomaly detection, forecasting, or SQL jobs, read `.agents/skills/bigquery-basics/SKILL.md`.
- Before any `gcloud` command or Google Cloud deploy/migration work, read `.agents/skills/google-cloud-recipe-auth/SKILL.md` and `.agents/skills/gcloud/SKILL.md`.
- For Cloud Run service/job/worker deployment work, also read `.agents/skills/cloud-run-basics/SKILL.md`.
