/**
 * looplens/utils/simulate.js
 * Pure math — no React, no side effects.
 * All token counts are integers. All costs are USD floats.
 */

export function toolTokensPerCall(tools) {
  return tools
    .filter((t) => t.enabled)
    .reduce((sum, t) => sum + t.tokensPerCall, 0)
}

/**
 * Simulate a single-agent agentic loop.
 * Returns per-iteration data and totals.
 */
export function simulateLoop({
  model,           // { input, output, cacheRead, contextWindow }
  iterations,
  systemTokens,
  initialContext,
  inputPerIter,
  outputPerIter,
  toolCallsPerIter,
  toolTokens,      // tokens added per tool call
  accumulation,    // 'full' | 'sliding' | 'summarize' | 'stateless'
  windowSize,      // used when accumulation === 'sliding'
  caching,         // { enabled, prefixTokens, hitRate }
}) {
  const toolOverhead = toolTokens * toolCallsPerIter
  let ctx = initialContext
  let totalInput = 0
  let totalOutput = 0
  const iterations_data = []

  for (let i = 1; i <= iterations; i++) {
    let rawInput

    if (accumulation === 'full') {
      rawInput = systemTokens + ctx + inputPerIter + toolOverhead
    } else if (accumulation === 'sliding') {
      const recentTurns = Math.min(i - 1, windowSize)
      rawInput =
        systemTokens +
        initialContext +
        recentTurns * (inputPerIter + outputPerIter) +
        inputPerIter +
        toolOverhead
    } else if (accumulation === 'summarize') {
      // Older turns compressed to ~30% of original size
      const summarySize =
        initialContext +
        Math.floor((i - 1) * (inputPerIter + outputPerIter) * 0.3)
      rawInput = systemTokens + summarySize + inputPerIter + toolOverhead
    } else {
      // stateless — reset each iteration
      rawInput = systemTokens + initialContext + inputPerIter + toolOverhead
    }

    // Apply prompt caching discount
    let effectiveInput = rawInput
    if (caching.enabled && caching.prefixTokens > 0) {
      const cachedPortion = Math.min(caching.prefixTokens, rawInput)
      const saving = cachedPortion * (caching.hitRate / 100) * 0.9 // 90% discount on cached tokens
      effectiveInput = rawInput - saving
    }

    const out = outputPerIter
    const cost =
      (effectiveInput / 1_000_000) * model.input +
      (out / 1_000_000) * model.output

    totalInput += effectiveInput
    totalOutput += out

    iterations_data.push({
      iteration: i,
      rawInput,
      effectiveInput: Math.round(effectiveInput),
      output: out,
      cost,
      contextSize: ctx,
      ctxPct: Math.min(100, Math.round((ctx / model.contextWindow) * 100)),
    })

    // Grow context for next iteration
    if (accumulation === 'full') {
      ctx += inputPerIter + outputPerIter + toolOverhead
    }
  }

  return {
    iterationsData: iterations_data,
    totalInput: Math.round(totalInput),
    totalOutput,
    totalTokens: Math.round(totalInput + totalOutput),
    totalCost: iterations_data.reduce((s, d) => s + d.cost, 0),
    avgCostPerIter:
      iterations_data.reduce((s, d) => s + d.cost, 0) / iterations,
  }
}

/**
 * Simulate a fan-out multi-agent loop.
 * Orchestrator runs main loop; N subagents each run sub-loops in parallel per iteration.
 */
export function simulateFanout({
  orchModel,
  subModel,
  iterations,
  systemTokens,
  orchContextTokens,
  subContextTokens,
  inputPerIter,
  outputPerIter,
  toolCallsPerIter,
  toolTokens,
  accumulation,
  windowSize,
  numAgents,
  passContextToSubs,
  caching,
}) {
  const sharedContext = passContextToSubs
    ? orchContextTokens + subContextTokens
    : subContextTokens

  const orchResult = simulateLoop({
    model: orchModel,
    iterations,
    systemTokens,
    initialContext: orchContextTokens,
    inputPerIter,
    outputPerIter,
    toolCallsPerIter,
    toolTokens,
    accumulation,
    windowSize,
    caching,
  })

  const subResult = simulateLoop({
    model: subModel,
    iterations,
    systemTokens,
    initialContext: sharedContext,
    inputPerIter,
    outputPerIter,
    toolCallsPerIter,
    toolTokens,
    accumulation,
    windowSize,
    caching,
  })

  return {
    orchestrator: orchResult,
    perSubagent: subResult,
    numAgents,
    totalSubagentCost: subResult.totalCost * numAgents,
    grandTotalCost: orchResult.totalCost + subResult.totalCost * numAgents,
    grandTotalTokens:
      orchResult.totalTokens + subResult.totalTokens * numAgents,
  }
}

/**
 * Cache break-even analysis.
 * How many runs until the cache write cost is recovered?
 */
export function cacheBreakEven({ model, prefixTokens, hitRate, savingsPerRun }) {
  // Cache write costs 1.25× base input price (Anthropic; approximate for others)
  const cacheWriteCost = (prefixTokens / 1_000_000) * model.input * 1.25
  if (savingsPerRun <= 0) return null
  return Math.ceil(cacheWriteCost / savingsPerRun)
}

export function fmtCost(c) {
  if (c == null || isNaN(c)) return '—'
  if (c < 0.001) return '$' + c.toFixed(5)
  if (c < 0.01) return '$' + c.toFixed(4)
  if (c < 1) return '$' + c.toFixed(3)
  if (c < 100) return '$' + c.toFixed(2)
  return '$' + Math.round(c).toLocaleString()
}

export function fmtK(n) {
  if (n == null) return '—'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k'
  return Math.round(n).toString()
}
