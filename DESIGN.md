# StockGuru Thailand — Design System

## Scene

A Thai retail investor opens StockGuru at 9:15 AM before the SET opens, in a home office with natural light from a window. They need to scan overnight US moves, check their watchlist, read one market-moving headline, and decide which 2-3 symbols to chart before the bell. The screen is watched for 10-15 minutes at a time, then referenced in short bursts throughout the day. The mood is focused, not excited — a calm market desk, not a casino floor.

## Color Strategy

**Restrained with one cinematic market layer**: tinted near-black neutrals + emerald/teal accent used for current selection, chart energy, and primary actions.

The brand is a data tool, not a campaign. The new visual pass can feel more premium than a plain dashboard, but the drama must sit behind the work: a controlled aurora band behind the market-pulse chart, active status rings, and compact row motion. The surface remains a working desk where chart, screener, watchlist, risk checklist, and AI context are readable in the first viewport.

### Palette

| Token | OKLCH | Hex | Usage |
|---|---|---|---|
| `--bg` | 13% 0.018 230 | `#060A12` | Root background |
| `--bg-secondary` | 17% 0.018 225 | `#0B111D` | Sidebar, top chrome |
| `--surface` | 22% 0.022 225 | `#111A29` | Cards, panels, input fields |
| `--surface-hover` | 27% 0.025 220 | `#172437` | Hover states |
| `--border` | 35% 0.035 215 | `#2A3A4F` | Dividers, outlines |
| `--ink-primary` | 97% 0.01 260 | `#F8FAFC` | Headings, primary text |
| `--ink-secondary` | 77% 0.018 230 | `#A8B5C7` | Body text, captions |
| `--ink-muted` | 61% 0.02 230 | `#718196` | Placeholders, disabled |
| `--primary` | 74% 0.145 170 | `#34D399` | CTAs, links, active states |
| `--primary-hover` | 66% 0.145 170 | `#10B981` | Primary hover |
| `--success` | 70% 0.15 155 | `#10B981` | Gains, positive change |
| `--danger` | 60% 0.18 25 | `#F43F5E` | Losses, negative change, warnings |
| `--warning` | 75% 0.15 85 | `#F59E0B` | Alerts, pending states |
| `--accent` | 74% 0.13 210 | `#22D3EE` | AI features, info highlights |

**Rules:**
- Body text (`--ink-secondary`) must hit ≥4.5:1 against `--bg` and `--surface`.
- Muted text (`--ink-muted`) is for placeholders only; never use for body copy.
- Success/danger are semantic only; they never appear as decorative backgrounds larger than a badge.
- No gradient text. No glassmorphism blur as default card treatment.
- Teal/emerald light is permitted only as a bounded chart/backdrop material, active navigation affordance, or primary action glow. It must not turn every card into a neon object.

## Typography

| Role | Family | Weight | Notes |
|---|---|---|---|
| Display / Headings | Inter | 700–800 | Tight tracking on large headings: -0.02em to -0.03em. Never tighter than -0.04em. |
| Body | Inter | 400–500 | Line-height 1.6 for Thai script. `text-wrap: balance` on h1–h3. |
| Data / Numbers | JetBrains Mono | 500–700 | Tabular nums (`font-variant-numeric: tabular-nums`) for prices, percentages, volumes. |

**Scale:**
- Hero H1: `clamp(1.75rem, 4vw, 3rem)` — max 3rem (48px). Never exceed 6rem ceiling.
- Section H2: `1.5rem` (24px)
- Card title: `1.125rem` (18px)
- Body: `0.875rem` (14px)
- Caption / Badge: `0.75rem` (12px)

## Layout

### Grid
- Dashboard uses a **12-column CSS Grid** with `24px` gutters.
- Cards sit on this grid without nesting inside other cards.
- Responsive: `auto-fit` grids for lists of cards (`repeat(auto-fit, minmax(280px, 1fr))`).

### Spacing Scale
- Base unit: `4px`
- Common increments: 4, 8, 12, 16, 24, 32, 48, 64
- Section vertical rhythm: `32px` between sections, `24px` between related groups.

### Z-Index Scale
| Layer | Value |
|---|---|
| Tooltip / Popover | 70 |
| Modal backdrop + content | 60 |
| Dropdown menu | 50 |
| Sticky header | 40 |
| Sidebar | 30 |
| Mobile sidebar backdrop | 20 |

Use semantic Tailwind classes from `tailwind.config.ts` (`z-modal`, `z-header`, `z-dropdown`, etc.). Avoid arbitrary z-index values because modals and dropdowns must escape header/sidebar stacking contexts predictably.

## Components

### Card
- Background: `--surface`
- Border: `1px solid --border`
- Border-radius: `12px` (not 24px+ — avoid over-rounding)
- Padding: `16px` or `24px`
- **No shadow + border together.** Pick one: either a clean `1px` border at `--border`, or a subtle `0 4px 12px rgba(0,0,0,0.15)` shadow with no border. Default is border.
- **No nested cards.** If a card needs internal grouping, use `1px` divider lines at `--border` with `16px` internal spacing.

### Button
- Primary: solid `--primary`, white text, `8px` radius.
- Secondary: transparent bg, `1px` `--border`, `--ink-primary` text.
- Ghost: no border, no bg, `--primary` text with hover underline.
- Size: `40px` touch target minimum.

### Badge
- `4px` padding horizontal, `2px` vertical.
- `6px` radius (small, not pill unless intentionally a tag).
- Variants: `default` (gray), `success` (green text + tinted bg), `danger`, `warning`, `info` (blue).

### Input
- Background: `--bg-secondary`
- Border: `1px solid --border`
- Focus ring: `2px` `--primary` at 30% opacity, offset `0px`.
- Placeholder color: `--ink-muted`

## Chart Styling

Charts are the hero element. They receive the most visual real estate and the cleanest surrounding chrome.

- **Background:** transparent (inherits `--surface` or `--bg`).
- **Grid lines:** `rgba(51, 65, 85, 0.3)` — barely visible guides, not fences.
- **Candle up:** `#10B981` (green)
- **Candle down:** `#F43F5E` (red)
- **Crosshair:** blue at 40% opacity, `1px` dashed.
- **Price scale font:** JetBrains Mono, 11px.
- **Indicator lines:** 1-2px thickness, distinct colors (amber SMA, violet EMA, cyan RSI, etc.).

## Motion

### Philosophy
Motion is intentional, never decorative. It guides attention to what changed, not to the animation itself.

### Patterns
- **Price updates:** instant color flash (success/danger bg tint for 400ms, ease-out) — no bounce.
- **Loading:** skeleton screens with a subtle shimmer (`opacity 0.5 → 1` over 1.5s, ease-in-out), never spinners on first paint.
- **Reveal:** simple opacity + translateY(8px → 0) fade, 300ms, ease-out-quart.
- **Hover:** background color transitions 150ms, no scale transforms on cards.
- **Reduced motion:** `@media (prefers-reduced-motion: reduce)` → all transitions become instant crossfades or immediate state changes.

### Aurora Market Desk Pass
- **Signature motion:** one bounded aurora sweep behind the first-viewport market chart. It should sit below content, move slowly, and never block interaction.
- **Status motion:** market-open dots and selected rows can pulse at low opacity for 1.8-2.4s. No bounce, no elastic.
- **Queue motion:** opportunity rows can use a short stagger on first render, capped to the visible queue. Content must be visible even if animation never runs.
- **Hover feedback:** chart, screener preset, and watchlist rows use border/color transitions and small icon movement only. No card-scale choreography.
- **Reduced motion:** aurora and pulse animations stop; static gradients remain.

### Market Desk Reference Pass
- **Intent:** match the approved concept direction: left full-height product sidebar, top command/search bar, compact market-status chrome, dense index tiles, central aurora chart, right-side watch/risk rail, and lower decision tables.
- **Adapted, not copied:** keep StockGuru Thai-first research tasks and compliance copy. The reference contributes layout density, lighting, and rhythm only; it does not introduce crypto-wallet content, order-entry trading, or marketing hero copy.
- **Layout risk:** the desktop grid must stay usable at 1366px wide and the right rail must collapse under the chart on tablet/mobile without horizontal overflow.
- **Validation:** compare `/` and `/stock/[symbol]` screenshots against the approved concept after every large UI pass, then run lint, typecheck, build, and browser QA.

## Pages

### Dashboard (Home)
- **Layout:** Sidebar left + main content right, with a two-column market desk at desktop. Left side is market scan and opportunity flow. Right rail is watchlist, risk checklist, and AI prompt. On mobile, right rail collapses below the scan flow.
- **First viewport:** Not a marketing hero. It is a working dashboard: market pulse, active session notes, quick scan actions, and the next 2-3 symbols to inspect. The richer visual identity comes from a central chart-stage, live status rail, and compact actionable queues.
- **Market pulse:** SET, SET50, S&P 500, NASDAQ, DOW/mai shown as compact index tiles with price, signed percent, arrow icon, and last refresh note. Keep numbers tabular and aligned.
- **Scan presets:** 5 quick-start routes from benchmark patterns: Volume leader, US leaders, Global gainers, Pullback watch, Sector momentum. Each item should feel like a command tile: filter intent, why inspect, and the next action.
- **Opportunity list:** Prefer compact rows or table-like stock cards over repeated large cards. Each row shows symbol, market, sector, price, signed change, volume clue, and direct actions: chart, AI, watchlist.
- **News:** 3 market-impact cards with category, time, related symbols, and one-line impact. Avoid portal-like news grids.
- **AI Chat:** Fixed-height panel with guest-limit indicator, evidence/risk language, and suggested next actions after an answer.
- **Right rail:** Watchlist mini-view + "Before you decide" checklist. The checklist is advisory and specific: volume, sector confirmation, news driver, alert/watchlist follow-up.

### Stock Detail
- **Header:** Symbol, name, price, change % — all on one row. Back arrow + watchlist toggle.
- **Chart:** Full-width, 420px height, with timeframe and indicator toggles directly above.
- **Right sidebar:** Price stats (O/H/L/C/Vol), AI Analysis card (collapsible), Company info.
- **AI Analysis:** Shows trend, recommendation, confidence %, support/resistance levels, and a list of key points with check icons. Risk disclaimer at bottom.

### Compare
- **Add stock:** Search input + quick-add chips.
- **Chart:** Normalized line chart (all symbols start at 100) for momentum comparison.
- **Table:** Side-by-side comparison with highlight stars for best values.

### News Detail
- **Article:** Full-width hero image, category badge, time ago, headline, summary, detailed content, market impact callout.
- **Sidebar:** Infographic card (headline metric + bullets), related symbols, references.
- **Refresh note:** Small text indicating auto-refresh interval (~1-2 hours).

## Accessibility

- **Contrast:** All text ≥4.5:1. Large text ≥3:1.
- **Color independence:** Gain/loss states use color + arrow icon + sign (`+`/`-`).
- **Keyboard:** All interactive elements reachable via Tab. Escape closes modals/dropdowns.
- **Screen reader:** Charts have `aria-label`. Price changes use `aria-live="polite"`.
- **Focus visible:** `2px solid --primary` outline on keyboard focus.
- **Reduced motion:** Respected globally via `prefers-reduced-motion`.

## Anti-Patterns (Explicitly Banned)

- ❌ Gradient text (`background-clip: text`)
- ❌ Glassmorphism as default card style
- ❌ Side-stripe borders >1px on cards or alerts
- ❌ Tiny uppercase tracked eyebrow above every section
- ❌ Numbered section markers (`01 / 02 / 03`) as default scaffolding
- ❌ Border-radius >16px on cards
- ❌ Border + wide shadow on same element
- ❌ Cream/sand/beige body background
- ❌ Identical icon-heading-text card grids repeated endlessly
- ❌ Hero metric template (big number + small label + gradient)
- ❌ Marketing buzzwords in UI copy

## Benchmark Inspiration (Studied, Not Copied)

1. **TradingView** (https://www.tradingview.com/support/solutions/43000718866-what-is-the-stock-screener/) - Screener works as a first-step tool with saved screens, popular screens, filters, column sets, market selection, refresh settings, and optional watchlist display. *Adopted:* saved/preset scan mental model, chart as natural next step, hide filters to see more rows. *Rejected:* social/noisy chrome and advanced indicator sprawl.
2. **Finviz** (https://elite.finviz.com/help/screener) - Screener combines fundamental and technical filters, rich output views, instant update, saved presets, and signal categories such as top gainers, most active, unusual volume, overbought/oversold, major news. *Adopted:* dense results table, active filters, signal-first presets. *Rejected:* old text-heavy visual style.
3. **Yahoo Finance** (https://help.yahoo.com/kb/SLN3642.html, https://help.yahoo.com/kb/SLN36784.html) - Connects search, quotes, interactive charts, screeners, news, watchlists, and portfolio workflows. Portfolio includes transactions, cash, lots, and dividend tracking. *Adopted:* ecosystem flow from quote to watchlist/portfolio/news and compare charts. *Rejected:* portal distractions.
4. **Investing.com** (https://www.investing.com/stock-screener/, https://www.investing.com/academy/stocks/how-to-use-investing-stock-screener/) - Advanced screener filters thousands of stocks by price, market cap, dividend yield, earnings ratios, geography, and strategy context. *Adopted:* multi-market filter thinking and beginner-friendly presets. *Rejected:* crowded portal/promo density.
5. **Settrade / Streaming** (https://www.settrade.com/streaming, https://www.settrade.com/th/services-and-tools/trading-program/add-on/stock-screener/howto) - Thai-market language, real-time data, technical chart, alerts, stock screener, and "ไม่ต้องเฝ้าหน้าจอ" mental model. *Adopted:* Thai-first copy, alert/worklist behavior, chart plus risk check. *Rejected:* order-entry/trading-first complexity for this research product.

## Design Workflow References

These repos inform the process only. Do not copy their generated UI, prompts, schemas, or code into StockGuru without adapting to this product.

1. **Designer Skills Collection** (https://github.com/Owl-Listener/designer-skills) - Use the research to systems to UI to interaction to delivery chain: benchmark first, define tokens, critique hierarchy, then implement.
2. **UI UX Pro Max Skill** (https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) - Use domain-aware design intelligence: financial UI needs confidence, risk context, state clarity, responsive behavior, and accessibility checks.
3. **Magic MCP** (https://github.com/21st-dev/magic-mcp) - Treat as a frontend generation accelerator when installed with API key. In this project, use only the principle: generate production-quality components from a clear brief and verify visually.
4. **Open Design** (https://github.com/nexu-io/open-design) - Treat `DESIGN.md` as the durable design-system contract. Open Design highlights local-first design workflows, skills, reusable atoms, examples, and a design-system catalog; StockGuru keeps its own product-specific contract here.

## Implementation Contract For This Pass

- Write or update `DESIGN.md` before UI code changes.
- Start every design change from benchmark-derived behavior, then adapt it to Thai investors and the existing component system.
- Do not copy layouts, code, or visual compositions from benchmark websites or GitHub design tools.
- Prefer table-like rows, compact rails, and direct actions for market workflows. Use cards only for repeated items that need framing.
- Every high-signal module should answer: "What happened?", "Why inspect it?", and "What should I do next?"
- Above the fold must show an actual dashboard surface, not a landing-page hero.
- Visual QA must include desktop and mobile, plus at least one interaction path: preset scan, search, or AI prompt.
- For the requested richer inspiration pass, use the inspiration as mood only: dark premium fintech lighting, central product stage, layered depth, and precise motion. Do not import crypto-wallet metaphors, huge marketing headlines, or decorative glass cards.
- Home Dashboard polish rule: desktop `/` should prioritize a dense market desk: compact index tiles, a large central chart stage, right rail for watchlist and risk, and bottom decision queues. Premium treatment must come from layout rhythm, surface contrast, restrained lighting, and row/table precision, not decorative glass cards or oversized marketing copy.
