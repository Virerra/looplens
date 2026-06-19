export default function ExportTab(p) {
  const blueprint = buildBlueprint(p)
  const json = JSON.stringify(blueprint, null, 2)

  function dlJSON() {
    dl(json, 'cost-blueprint.json', 'application/json')
  }
  function dlMD() {
    dl(buildMarkdown(blueprint, p), 'cost-blueprint.md', 'text/markdown')
  }

  return (
    <div className="tab-pane">
      <div className="box">
        <div className="box-title">Cost blueprint preview</div>
        <pre className="export-pre">{json}</pre>
      </div>
      <button className="export-btn" onClick={dlJSON}>⬇ Download cost-blueprint.json</button>
      <button className="export-btn" onClick={dlMD}>⬇ Download cost-blueprint.md</button>
    </div>
  )
}

function buildBlueprint(p) {
  const r = p.loopResult
  return {
    generated: new Date().toISOString(),
    tool: 'LoopLens v1.0',
    pricing_source: p.selectedModel.priceSource ?? 'fallback',
    pricing_verified: p.selectedModel.liveVerified ?? '2026-06-20',
    mode: p.mode,
    model: p.selectedModel.name,
    configuration: {
      iterations: p.iterations,
      system_prompt_tokens: p.systemTokens,
      initial_context_tokens: p.initialContext,
      input_tokens_per_iter: p.inputPerIter,
      output_tokens_per_iter: p.outputPerIter,
      accumulation: p.accumulation,
      window_size: p.accumulation === 'sliding' ? p.windowSize : null,
      tool_calls_per_iter: p.toolCallsPerIter,
      tools_enabled: p.tools.filter(t => t.enabled).map(t => t.label),
      prompt_caching: p.cacheEnabled,
      cacheable_prefix_tokens: p.cacheEnabled ? p.cachePrefixTokens : null,
      cache_hit_rate_pct: p.cacheEnabled ? p.cacheHitRate : null,
    },
    cost_summary: {
      total_usd: parseFloat(r.totalCost.toFixed(6)),
      total_input_tokens: r.totalInput,
      total_output_tokens: r.totalOutput,
      total_tokens: r.totalTokens,
      avg_cost_per_iteration_usd: parseFloat(r.avgCostPerIter.toFixed(6)),
    },
    per_iteration: r.iterationsData.map(d => ({
      iteration: d.iteration,
      effective_input_tokens: d.effectiveInput,
      output_tokens: d.output,
      cost_usd: parseFloat(d.cost.toFixed(6)),
      context_size: d.contextSize,
    })),
    pricing_used: {
      input_per_1m_usd: p.selectedModel.input,
      output_per_1m_usd: p.selectedModel.output,
      note: 'Verify at provider docs before budget decisions.',
    },
    ...(p.mode === 'fanout' && p.fanoutResult ? {
      fanout: {
        orchestrator_model: p.orchModel.name,
        parallel_subagents: p.numAgents,
        orchestrator_cost_usd: parseFloat(p.fanoutResult.orchestrator.totalCost.toFixed(6)),
        total_subagent_cost_usd: parseFloat(p.fanoutResult.totalSubagentCost.toFixed(6)),
        grand_total_usd: parseFloat(p.fanoutResult.grandTotalCost.toFixed(6)),
      }
    } : {}),
  }
}

function buildMarkdown(b, p) {
  const r = p.loopResult
  return `# LoopLens Cost Blueprint

**Generated:** ${new Date().toLocaleString()}  
**Model:** ${b.model}  
**Pricing source:** ${b.pricing_source} · verified ${b.pricing_verified}

## Configuration

| Parameter | Value |
|---|---|
| Iterations | ${b.configuration.iterations} |
| System prompt | ${b.configuration.system_prompt_tokens?.toLocaleString()} tokens |
| Initial context | ${b.configuration.initial_context_tokens?.toLocaleString()} tokens |
| Input / iter | ${b.configuration.input_tokens_per_iter?.toLocaleString()} tokens |
| Output / iter | ${b.configuration.output_tokens_per_iter?.toLocaleString()} tokens |
| Accumulation | ${b.configuration.accumulation} |
| Tool calls / iter | ${b.configuration.tool_calls_per_iter} |
| Tools | ${b.configuration.tools_enabled?.join(', ') || 'none'} |
| Prompt caching | ${b.configuration.prompt_caching ? 'enabled' : 'disabled'} |

## Cost Summary

**Total estimated cost: ${p.fmtCost(r.totalCost)}**

- Total tokens: ${r.totalTokens.toLocaleString()}
- Input tokens: ${r.totalInput.toLocaleString()}
- Output tokens: ${r.totalOutput.toLocaleString()}
- Avg / iteration: ${p.fmtCost(r.avgCostPerIter)}

## Per-Iteration Breakdown

| Iter | Input tok | Output tok | Cost |
|---|---|---|---|
${r.iterationsData.map(d => `| ${d.iteration} | ${d.effectiveInput.toLocaleString()} | ${d.output.toLocaleString()} | ${p.fmtCost(d.cost)} |`).join('\n')}

> Prices: $${b.pricing_used.input_per_1m_usd}/1M input · $${b.pricing_used.output_per_1m_usd}/1M output  
> ${b.pricing_used.note}
`
}

function dl(content, filename, type) {
  const blob = new Blob([content], { type })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
