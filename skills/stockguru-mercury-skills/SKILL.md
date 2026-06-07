---
name: stockguru-mercury-skills
description: Use when considering Mercury Agent Skills for StockGuru, deciding which external SKILL.md files are worth importing, or keeping third-party skills project-local and curated.
---

# StockGuru Mercury Skills

Mercury Agent Skills is an external MIT-licensed registry of reusable `SKILL.md` playbooks:

- Source: `https://github.com/cosmicstack-labs/mercury-agent-skills`
- Registry: `https://skills.mercuryagent.sh`

Use it as a source library, not as a bulk dependency.

## Project Rule

Do not copy the entire Mercury registry into StockGuru.

Only import a specific Mercury skill when it directly supports a current StockGuru task and local project skills are not enough. Keep imports project-local under `.agents/skills/` or summarize usage in a StockGuru skill under `skills/`.

## Good Fits For StockGuru

Prioritize these Mercury categories for this product:

- `frontend/nextjs-patterns` for App Router, server components, data fetching, middleware, and performance.
- `frontend/react-patterns` for component and hook quality.
- `frontend/responsive-design` for mobile and desktop layout QA.
- `frontend/component-design-systems` for reusable UI vocabulary.
- `design/ui-design-system` for tokens, component states, and UI consistency.
- `design/accessibility` for WCAG, ARIA, keyboard, focus, and color-independent states.
- `design/visual-design` for typography, spacing, hierarchy, and color.
- `design/motion-interaction` for purposeful micro-interactions.
- `testing-qa/e2e-testing` for Playwright user-flow checks.
- `testing-qa/accessibility-testing` for axe/Lighthouse/manual a11y checks.
- `product/go-to-market` for launch/pricing/messaging work.
- `product/product-metrics` for paid beta activation, conversion, and retention metrics.

## Poor Fits

Avoid importing unrelated skills unless the user explicitly asks:

- shop or restaurant operations
- career, health, wellness, and education skills
- automation skills that post to social media or run account actions
- cloud or Kubernetes skills unless StockGuru is moving infrastructure
- finance skills that could encourage investment advice language

## Import Checklist

Before importing a Mercury skill:

1. Verify the current source from the GitHub repo or Mercury registry.
2. Read the skill before copying it.
3. Confirm it does not conflict with StockGuru's financial safety rules.
4. Keep license attribution when copying third-party content.
5. Copy only the selected skill, not parent categories or the whole registry.
6. Add a short note in `SKILLS.md` if the imported skill becomes part of the normal workflow.

## StockGuru Safety Overlay

Every imported skill must obey these local rules:

- Thai-first stock research workspace, not licensed investment advice.
- Avoid guaranteed profit, buy signal, stock picks, and AI tells you what to buy.
- AI and UX copy must emphasize evidence, assumptions, risks, and suggested checks.
- Paid gates must explain the upgrade reason instead of hiding Pro/Trader features.
- Run `npm run lint`, `npm run build`, and browser QA for touched UI surfaces.
