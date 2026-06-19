#!/usr/bin/env node
/**
 * scripts/sync-prices.js
 *
 * Fetches the latest LiteLLM pricing JSON and updates src/data/models.json
 * with any prices that have changed.
 *
 * Usage:
 *   node scripts/sync-prices.js           # dry-run (prints diff, no write)
 *   node scripts/sync-prices.js --write   # applies changes
 *
 * Also run automatically by .github/workflows/price-check.yml every Monday.
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const MODELS_PATH = resolve(__dir, '../src/data/models.json')
const LITELLM_URL = 'https://raw.githubusercontent.com/BerriAI/litellm/main/model_prices_and_context_window.json'
const WRITE = process.argv.includes('--write')

async function main() {
  console.log('🔍 Fetching LiteLLM pricing data…')

  let litellm
  try {
    const res = await fetch(LITELLM_URL, { signal: AbortSignal.timeout(15_000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    litellm = await res.json()
  } catch (err) {
    console.error('❌ Failed to fetch LiteLLM data:', err.message)
    process.exit(1)
  }

  const current = JSON.parse(readFileSync(MODELS_PATH, 'utf8'))
  const today = new Date().toISOString().slice(0, 10)
  let changeCount = 0

  const updated = {
    ...current,
    models: current.models.map(model => {
      const key = model.litellmKey
      const live = key ? litellm[key] : null
      if (!live) {
        console.log(`  ⚪ ${model.name}: no LiteLLM match for key "${key}"`)
        return model
      }

      const liveInput  = live.input_cost_per_token  != null ? round6(live.input_cost_per_token  * 1_000_000) : null
      const liveOutput = live.output_cost_per_token != null ? round6(live.output_cost_per_token * 1_000_000) : null
      const liveCacheRead = live.cache_read_input_token_cost != null
        ? round6(live.cache_read_input_token_cost * 1_000_000) : null

      const changes = []
      const next = { ...model }

      if (liveInput != null && !approxEq(liveInput, model.input)) {
        changes.push(`input $${model.input} → $${liveInput}`)
        next.input = liveInput
      }
      if (liveOutput != null && !approxEq(liveOutput, model.output)) {
        changes.push(`output $${model.output} → $${liveOutput}`)
        next.output = liveOutput
      }
      if (liveCacheRead != null && model.cacheRead != null && !approxEq(liveCacheRead, model.cacheRead)) {
        changes.push(`cacheRead $${model.cacheRead} → $${liveCacheRead}`)
        next.cacheRead = liveCacheRead
      }
      if (live.max_tokens && live.max_tokens !== model.contextWindow) {
        changes.push(`ctx ${model.contextWindow} → ${live.max_tokens}`)
        next.contextWindow = live.max_tokens
      }

      if (changes.length) {
        changeCount++
        console.log(`  🟡 ${model.name}: ${changes.join(' | ')}`)
      } else {
        console.log(`  ✅ ${model.name}: no change`)
      }

      return next
    }),
  }

  if (changeCount === 0) {
    console.log('\n✅ All prices are up to date — no changes needed.')
    return
  }

  console.log(`\n${changeCount} model(s) have updated prices.`)

  if (!WRITE) {
    console.log('\nRun with --write to apply changes:')
    console.log('  node scripts/sync-prices.js --write')
    return
  }

  // Update verified date and write
  updated._meta.verified = today
  writeFileSync(MODELS_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf8')
  console.log(`\n✅ Written to src/data/models.json (verified: ${today})`)
  console.log('⚠  Cross-check the changes against provider pricing pages before committing.')
}

function round6(n) { return Math.round(n * 1_000_000) / 1_000_000 }
function approxEq(a, b) { return Math.abs(a - b) < 0.0001 }

main()
