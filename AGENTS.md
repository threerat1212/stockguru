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

This repo keeps project-local skills in `skills/` and selected agent-runtime skills in `.agents/skills`.

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

- Use these only when the task explicitly involves Google, Gemini, BigQuery, Google Cloud auth, gcloud, or Cloud Run, or Google Cloud deploy/migration work. StockGuru's current production stack is still Render + Supabase.
- For Gemini API or Google Gen AI SDK work, read `skills/stockguru-ai-safety/SKILL.md` first, then `.agents/skills/gemini-api/SKILL.md`.
- For BigQuery analytics, warehouse, anomaly detection, forecasting, or SQL jobs, read `.agents/skills/bigquery-basics/SKILL.md`.
- Before any `gcloud` command or Google Cloud deploy/migration work, read `.agents/skills/google-cloud-recipe-auth/SKILL.md` and `.agents/skills/gcloud/SKILL.md`.
- For Cloud Run service/job/worker deployment work, also read `.agents/skills/cloud-run-basics/SKILL.md`.

## Render API Access

**IMPORTANT:** Use custom Render MCP server for monitoring and debugging.

**Custom MCP Server Location:**
- Path: `E:\งาน\หุ้น\stockguru\render-mcp-server\render-mcp-server\dist\index.js`
- Config: `C:\Users\Admin\.cursor\mcp.json`
- API Key: rnd_y33qaICujGVzgCJmTGAqv0ZtFwf5

**Available Tools:**
1. `render_list_services` — List all services (with IDs, status, URLs)
2. `render_get_service` — Get full details of a specific service
3. `render_list_deploys` — List recent deploy history
4. `render_get_deploy_logs` — **Get full build/deploy logs** (key for debugging)
5. `render_trigger_deploy` — Trigger a new deploy
6. `render_diagnose_latest` — Auto-diagnose latest deploy (status + logs in one call)

**Workflow for debugging:**
```
1. render_diagnose_latest(serviceId)  → Check latest deploy status + logs
2. Analyze logs for errors
3. Fix code + git commit + push
4. render_trigger_deploy(serviceId)   → Deploy fix
5. render_list_deploys(serviceId)     → Monitor deploy status
6. render_get_deploy_logs(serviceId, deployId) → Confirm success
```

**Why custom MCP server:**
- Official MCP tools are limited (workspace selection, only create operations)
- Custom server provides full access to services, logs, and deploy history
- Can diagnose and fix issues automatically without manual Dashboard access

**Current Services:**
- stockguru-web (web service): srv-d8i5hdi8qa3s73e3o600
- stockguru-data-fetch (cron job): crn-d8js21ugvqtc73eogvu0
- stockguru-news-refresh (cron job): crn-d8i5qujtqb8s73aqes8g
- stockguru-alerts-check (cron job): crn-d8js21ugvqtc73eogvug

## Supabase Management API Access

**Management API Key:** (Stored in Render secrets - not committed to git)

**What it can do:**
- List projects and organizations
- Check project status and configuration
- Get and update auth provider settings (including site_url and redirect URLs)
- Get basic auth provider settings (e.g., Google Auth enabled/disabled)

**Auth Config Endpoint:**
- **GET:** `https://api.supabase.com/v1/projects/sxmaiqnclgyspfsbmvoa/config/auth`
- **PATCH:** `https://api.supabase.com/v1/projects/sxmaiqnclgyspfsbmvoa/config/auth`
- Requires: `SUPABASE_MANAGEMENT_API_KEY` environment variable

**How to access Auth Settings (Site URL, Redirect URLs):**

1. **Supabase Management API (Recommended for automation):**
   - Endpoint: `https://api.supabase.com/v1/projects/sxmaiqnclgyspfsbmvoa/config/auth`
   - Method: `PATCH` to update, `GET` to read
   - Requires: `SUPABASE_MANAGEMENT_API_KEY` environment variable
   - Example:
     ```bash
     # Read current config
     curl -X GET "https://api.supabase.com/v1/projects/sxmaiqnclgyspfsbmvoa/config/auth" \
       -H "Authorization: Bearer $SUPABASE_MANAGEMENT_API_KEY"

     # Update site_url and redirect URLs
     curl -X PATCH "https://api.supabase.com/v1/projects/sxmaiqnclgyspfsbmvoa/config/auth" \
       -H "Authorization: Bearer $SUPABASE_MANAGEMENT_API_KEY" \
       -H "Content-Type: application/json" \
       -d '{"site_url":"https://stockguru-web.onrender.com","uri_allow_list":"https://stockguru-web.onrender.com,http://127.0.0.1:3000"}'
     ```
   - Script provided: `scripts/sync-auth-api.js` (Node.js)

2. **Supabase Dashboard (Manual):**
   - Go to: https://supabase.com/dashboard/project/sxmaiqnclgyspfsbmvoa/auth/url-configuration
   - Manually update Site URL and Redirect URLs
   - This is the safest and most reliable method

3. **Supabase CLI (Alternative):**
   - Use `supabase config push --yes` to sync auth settings
   - Edit `supabase/config.toml` to change settings
   - Scripts provided: `scripts/sync-auth-config.bat` (Windows) or `scripts/sync-auth-config.sh` (Linux/Mac)
   - Requires CLI authentication (already configured)

**Sync Auth Settings via Management API:**

**Node.js script:**
```bash
node scripts/sync-auth-api.js
```

**Manual curl:**
```bash
curl -X PATCH "https://api.supabase.com/v1/projects/sxmaiqnclgyspfsbmvoa/config/auth" \
  -H "Authorization: Bearer $SUPABASE_MANAGEMENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"site_url":"https://stockguru-web.onrender.com","uri_allow_list":"https://stockguru-web.onrender.com,http://127.0.0.1:3000"}'
```

**Sync Auth Settings via CLI:**

**Windows:**
```bash
scripts\sync-auth-config.bat
```

**Linux/Mac:**
```bash
./scripts/sync-auth-config.sh
```

**Manual sync:**
```bash
cd E:\งาน\หุ้น\stockguru
supabase config push --yes
```

**Config file location:** `supabase/config.toml`
- Edit `site_url` and `additional_redirect_urls` in the `[auth]` section
- Run sync script to push changes to remote

**Current Auth Status:**
- Google Auth: ✅ Enabled
- Project ID: sxmaiqnclgyspfsbmvoa
- Site URL: https://stockguru-web.onrender.com ✅ (synced via Management API)
- Redirect URLs: https://stockguru-web.onrender.com, http://127.0.0.1:3000 ✅ (synced via Management API)
