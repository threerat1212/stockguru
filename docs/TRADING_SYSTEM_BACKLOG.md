# Trading System Backlog — Future, Not Current Scope

## Decision

StockGuru should eventually support trading workflow, but **not in the current Agent Looping MVP**.

Current priority is:

1. Market research
2. Watchlist intelligence
3. Portfolio risk review
4. News/evidence citation
5. Journaling and decision review
6. Agent Looping as decision support

Trading execution is a separate product layer and must be designed with stricter controls.

## Why keep it later

Trading system adds new risks that are not the same as research:

- order routing risk
- broker/API integration risk
- authentication and permission risk
- partial fills / failed orders
- latency and market data freshness
- audit trail requirements
- compliance and suitability concerns
- user can lose money from operational mistakes, not just bad analysis

Agent Looping should stay as **research and rehearsal** first.

## What trading can mean in StockGuru

Avoid jumping straight to “auto trade”. Break it into safe phases.

### Phase 1 — Trade Plan, no execution

User creates a plan:

- symbol
- thesis
- entry zone
- stop / invalidation
- target zones
- position size
- risk per trade
- scenario notes
- linked Agent Loop result
- linked news/evidence
- journal entry

No broker connection. No order placement.

### Phase 2 — Paper Trade / Simulation

Same trade plan, but simulated only:

- paper entry
- paper stop/target
- simulated P/L
- scenario replay
- journal review
- mistake tracking

This is the safest bridge between research and execution.

### Phase 3 — Broker Integration, user-approved only

Only after Phase 1 and 2 are stable:

- connect broker or execution provider
- explicit user approval per order
- no autonomous trading by default
- order preview before submit
- max order size / risk limit
- kill switch
- full audit log
- webhook confirmation
- reconciliation with broker fills

### Phase 4 — Conditional Automation, optional and gated

Only for advanced users with explicit controls:

- alert-based order draft
- one-click confirm
- risk budget caps
- daily loss limit
- symbol whitelist
- cooldown
- emergency cancel
- full traceability

Do not make “AI trades by itself” the first version.

## Suggested future PR

## PR17 — Trade Plan + Paper Trading

**Goal:** Add safe trading workflow without real execution.

### Files to change

1. `supabase/schema.sql` — trade plans / paper trades tables
2. `app/trade-plans/page.tsx` — create/review trade plans
3. `app/paper-trades/page.tsx` — simulated trade tracking
4. `lib/services/trade-plan-service.ts` — server-side calculations
5. `lib/hooks/use-trade-plans.ts` — client CRUD
6. `app/journal/new/page.tsx` — link trade plan to journal
7. `app/api/trade-plans/**` — create/update/simulate endpoints
8. `components/trading/` — trade plan form, risk card, paper trade status

### Safety rules

- No real broker order in PR17
- No autonomous trading
- No “AI buy/sell signal” copy
- Every plan must have invalidation condition
- Every plan must have max loss / position size
- Every plan should link to evidence or journal reason
- Paper trade results must be clearly labeled as simulation

### Verify

- `npm run typecheck`
- `npm test`
- `npm run build`
- Manual test:
  - create trade plan
  - simulate entry/exit
  - link to journal
  - verify guest/free/pro behavior

## Current boundary

Agent Looping can produce:

- “สิ่งที่ต้องเช็กต่อ”
- risk checklist
- scenario notes
- evidence
- confidence
- journal prompts

Agent Looping must not produce:

- buy/sell order
- automatic position sizing
- broker command
- guaranteed target
- guaranteed stop-loss outcome

## Later decision points

Before real trading system, decide:

1. Broker/provider
2. Thai market support
3. Order types supported
4. User permission model
5. Risk limits
6. Audit requirements
7. Whether StockGuru is research-only or execution-enabled
8. Whether paid plan includes paper trading before real trading
