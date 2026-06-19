# LoopLens

**Agentic loop cost simulator** — design and price your AI agent workflows before a single API call is made.

[![Live prices](https://img.shields.io/badge/prices-live%20from%20LiteLLM-00E5FF?style=flat-square)](https://github.com/BerriAI/litellm)
[![Free](https://img.shields.io/badge/cost-free-22C55E?style=flat-square)]()
[![No account](https://img.shields.io/badge/account-not%20required-22C55E?style=flat-square)]()
[![MIT License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

**Live:** https://looplens-project.vercel.app
**Repo:** https://github.com/Virerra/looplens

## What it does

Agentic AI loops compound costs in ways single-shot prompting doesn't. Each iteration carries a growing context window, tool call overhead, and accumulated history — and most engineers have no visibility into what a loop will cost until the bill arrives.

LoopLens lets you:

- **Simulate** a full agentic loop and see per-iteration cost breakdowns before running anything
- **Model fan-out** multi-agent architectures (one orchestrator + N parallel subagents)
- **Calculate** prompt caching break-even — exactly how many runs until caching pays off
- **Compare** 13+ models side-by-side on the same loop configuration
- **Get optimization suggestions** — rule-based and optionally AI-powered (BYOK)
- **Export** a cost blueprint as JSON or Markdown for planning and stakeholder docs

## Pricing

Prices are loaded in a three-layer stack:

1. **Live fetch** — on page load, fetches the [LiteLLM pricing JSON](https://github.com/BerriAI/litellm/blob/main/model_prices_and_context_window.json) (community-maintained, covers 100+ models). Session-cached for 6 hours.
2. **Hardcoded fallback** — `src/data/models.json`, verified June 2026. Used if the live fetch fails or times out (8s).
3. **User override** — coming in v1.1: paste a custom price for any model.

A status badge in the header shows which layer is active.

### Keeping prices current

The hardcoded fallback updates automatically via a GitHub Actions workflow every Monday:

```
.github/workflows/price-check.yml
```

It runs `scripts/sync-prices.js`, diffs against `src/data/models.json`, and opens a pull request if anything changed. A human reviews the PR before merge. In practice this is a 2-minute job — worst case, a manual check once a month keeps things accurate.

To run the sync manually:

```bash
npm run sync-prices          # dry run — shows what would change
npm run sync-prices:write    # applies changes to src/data/models.json
```

## Getting started

```bash
git clone https://github.com/Virerra/looplens.git
cd looplens
npm install
npm run dev
```

Deploys as a static site — no backend required.

```bash
npm run build   # outputs to dist/
```

Deploy `dist/` to Vercel, GitHub Pages, Netlify, Cloudflare Pages — anything that serves static files. This repo includes a `vercel.json` for one-click Vercel deploys.

## Project structure

```
src/
  data/
    models.json        ← hardcoded fallback prices (update monthly)
    tools.js           ← tool definitions and token costs
  hooks/
    usePricing.js       ← live fetch → cache → fallback logic
  utils/
    simulate.js          ← pure math: loop simulation, fan-out, cache break-even
  components/
    LeftPanel.jsx        ← all configuration controls
    ui/                  ← Slider, Select, Checkbox, TabBar, PriceStatusBar
    tabs/
      SimTab.jsx          ← per-iteration cost breakdown
      MultiAgentTab.jsx   ← fan-out orchestrator + subagent view
      CacheTab.jsx        ← prompt caching analysis and break-even
      CompareTab.jsx      ← all models, same config, sorted by cost
      OptimizeTab.jsx     ← rule-based tips + optional BYOK AI suggestions
      ExportTab.jsx       ← JSON and Markdown export
  App.jsx                 ← state, derived values, tab routing
scripts/
  sync-prices.js          ← price sync script (run by GitHub Action)
.github/
  workflows/
    price-check.yml       ← weekly automated price check
```

## Core principles

- **Zero API calls for simulation** — pure deterministic math, works offline
- **No account required** — no login, no tracking, no ads
- **BYOK for AI features** — your key, your browser, never sent to our servers
- **Open source** — MIT licensed

## Contributing

Contributions welcome. The most useful things:

- Adding new models to `src/data/models.json` (follow the existing schema)
- Updating `litellmKey` mappings when providers change model IDs
- Improving the optimization tip logic in `OptimizeTab.jsx`
- Adding tool presets (common agent patterns with pre-filled token estimates)

Open a PR at https://github.com/Virerra/looplens/pulls

## License

MIT — see [LICENSE](LICENSE)
