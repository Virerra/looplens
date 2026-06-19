import { useState } from 'react'
import { simulateLoop } from '../../utils/simulate'

export default function OptimizeTab(p) {
  const [aiTip, setAiTip] = useState(null)
  const [loading, setLoading] = useState(false)

  const tips = buildTips(p)

  async function getAiSuggestions() {
    if (!p.apiKey) { alert('Enter your Anthropic API key in the left panel.'); return }
    setLoading(true)
    const r = p.loopResult
    const prompt = `I'm designing an agentic AI loop:\n- Model: ${p.selectedModel.name}\n- ${p.iterations} iterations, ${p.systemTokens} system prompt tokens, ${p.initialContext} initial context tokens\n- ${p.inputPerIter} new input tokens/iter, ${p.outputPerIter} output tokens/iter\n- Accumulation: ${p.accumulation}\n- ${p.toolCallsPerIter} tool calls/iter (${p.tools.filter(t=>t.enabled).map(t=>t.label).join(', ')||'none'})\n- Estimated cost: ${p.fmtCost(r.totalCost)} per run\n\nGive 3 specific, actionable prompt engineering or architecture strategies to reduce cost while preserving quality. Be concrete and technical. Keep it under 300 words.`
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': p.apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 600, messages: [{ role: 'user', content: prompt }] })
      })
      const data = await res.json()
      if (data.content?.[0]?.text) setAiTip(data.content[0].text)
    } catch (e) { alert('API error: ' + e.message) }
    setLoading(false)
  }

  return (
    <div className="tab-pane">
      {aiTip && (
        <div className="tip tip--purple">
          <div className="tip-title tip-title--purple">✦ AI-powered suggestions (BYOK)</div>
          <div className="tip-body" style={{whiteSpace:'pre-wrap'}}>{aiTip}</div>
        </div>
      )}
      {p.apiKey && !aiTip && (
        <button className="ai-btn" onClick={getAiSuggestions} disabled={loading}>
          {loading ? '⏳ Asking Claude…' : '✦ Get AI optimization suggestions'}
        </button>
      )}
      {tips.map((t, i) => (
        <div key={i} className={`tip tip--${t.type}`}>
          <div className={`tip-title tip-title--${t.type}`}>{t.title}</div>
          <div className="tip-body">{t.body}</div>
        </div>
      ))}
    </div>
  )
}

function buildTips(p) {
  const tips = []
  const r = p.loopResult
  if (!r) return tips
  const { fmtCost, fmtK } = p

  const lastCtxPct = r.iterationsData[r.iterationsData.length - 1]?.ctxPct ?? 0
  if (lastCtxPct > 70)
    tips.push({ type: 'warn', title: '⚠ Context window risk',
      body: `Loop reaches ${lastCtxPct}% of the ${fmtK(p.selectedModel.contextWindow)}-token limit by iteration ${p.iterations}. Switch to sliding window or summarization before hitting the ceiling.` })

  if (p.accumulation === 'full' && p.iterations > 5) {
    const slide = simulateLoop({ model: p.selectedModel, iterations: p.iterations, systemTokens: p.systemTokens, initialContext: p.initialContext, inputPerIter: p.inputPerIter, outputPerIter: p.outputPerIter, toolCallsPerIter: p.toolCallsPerIter, toolTokens: p.toolTok, accumulation: 'sliding', windowSize: 4, caching: { enabled: false, prefixTokens: 0, hitRate: 0 } })
    const sv = r.totalCost - slide.totalCost
    if (sv > 0.0001)
      tips.push({ type: 'warn', title: '💡 Switch to sliding window',
        body: `Full accumulation over ${p.iterations} iterations is expensive. A 4-turn sliding window saves ~${fmtCost(sv)} (${Math.round(sv / r.totalCost * 100)}% off) per run.` })
  }

  const toolFraction = (p.toolTok * p.toolCallsPerIter * p.iterations / 1e6) * p.selectedModel.input / r.totalCost
  if (toolFraction > 0.2)
    tips.push({ type: 'warn', title: `🔧 Tool calls are ${Math.round(toolFraction * 100)}% of spend`,
      body: `${p.toolCallsPerIter} call(s)/iter × ${fmtK(p.toolTok)} tokens × ${p.iterations} iterations. Batch tool results or cache responses to cut this.` })

  if (p.systemTokens > 3000) {
    const sysCost = (p.systemTokens * p.iterations / 1e6) * p.selectedModel.input
    tips.push({ type: 'warn', title: `📝 System prompt is ${fmtK(p.systemTokens)} tokens`,
      body: `Resent every iteration; costs ~${fmtCost(sysCost)} across the loop. Move static knowledge to a RAG call and keep the prompt under 1k tokens.` })
  }

  if (!p.cacheEnabled) {
    const withCache = simulateLoop({ model: p.selectedModel, iterations: p.iterations, systemTokens: p.systemTokens, initialContext: p.initialContext, inputPerIter: p.inputPerIter, outputPerIter: p.outputPerIter, toolCallsPerIter: p.toolCallsPerIter, toolTokens: p.toolTok, accumulation: p.accumulation, windowSize: p.windowSize, caching: { enabled: true, prefixTokens: p.systemTokens, hitRate: 80 } })
    const sv = r.totalCost - withCache.totalCost
    if (sv > 0.0001)
      tips.push({ type: 'info', title: '⚡ Enable prompt caching',
        body: `Caching the ${fmtK(p.systemTokens)}-token system prompt at 80% hit rate saves ~${fmtCost(sv)} per run (${Math.round(sv / r.totalCost * 100)}% reduction). All major providers support it.` })
  }

  if (r.totalCost > 0.05 && p.allModelResults?.length) {
    const cheapest = p.allModelResults[0]
    if (cheapest.model.id !== p.modelId) {
      const sv = r.totalCost - cheapest.result.totalCost
      tips.push({ type: 'ok', title: `💰 ${cheapest.model.name} is ${Math.round(sv / r.totalCost * 100)}% cheaper`,
        body: `Same loop on ${cheapest.model.name}: ${fmtCost(cheapest.result.totalCost)} vs ${fmtCost(r.totalCost)}. Switch if quality holds for your task.` })
    }
  }

  const first = r.iterationsData[0]?.cost ?? 0
  const last  = r.iterationsData[r.iterationsData.length - 1]?.cost ?? 0
  if (last > first * 2)
    tips.push({ type: 'info', title: '📈 Context growth is compounding',
      body: `First iteration: ${fmtCost(first)}. Last: ${fmtCost(last)}. This is the agentic compounding penalty. Add early-exit criteria or checkpoint saves to reduce spend on long loops.` })

  if (p.mode === 'fanout' && p.numAgents > 8)
    tips.push({ type: 'warn', title: `⚠ ${p.numAgents} parallel subagents`,
      body: `Fan-out cost scales linearly with subagent count. Every optimization multiplies ${p.numAgents}×. Consider a cheaper model for subagents — DeepSeek V4 Flash at $0.14/$0.28 per 1M tokens is 35× cheaper than GPT-5.5 input.` })

  tips.push({ type: 'ok', title: '✅ DeepSeek auto-caching',
    body: 'DeepSeek V4 Flash caches context automatically by default — no configuration needed. Cache-hit input drops to $0.003/1M, making it up to 47× cheaper than GPT-5.5 for repeated agent prefixes.' })

  return tips
}
