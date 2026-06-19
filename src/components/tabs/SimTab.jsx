export default function SimTab({ loopResult: r, selectedModel, iterations, fmtCost, fmtK }) {
  if (!r) return null
  const maxCost = Math.max(...r.iterationsData.map(d => d.cost))
  const colorClass = r.totalCost > 1 ? 'danger' : r.totalCost > 0.1 ? 'warn' : 'cyan'
  return (
    <div className="tab-pane">
      <div className="cost-meter">
        <div className="meter-label">Estimated total loop cost</div>
        <div className={`meter-value ${colorClass}`}>{fmtCost(r.totalCost)}</div>
        <div className="meter-sub">{fmtK(r.totalTokens)} tokens · {iterations} API calls · {selectedModel.name}</div>
      </div>
      <div className="stat-grid">
        <Stat label="Total tokens"    value={fmtK(r.totalTokens)} />
        <Stat label="Input tokens"    value={fmtK(r.totalInput)} />
        <Stat label="Output tokens"   value={fmtK(r.totalOutput)} />
        <Stat label="Avg cost / iter" value={fmtCost(r.avgCostPerIter)}
          v={r.avgCostPerIter > 0.1 ? 'danger' : r.avgCostPerIter > 0.01 ? 'warn' : ''} />
      </div>
      <div className="box">
        <div className="box-title">Per-iteration cost</div>
        {r.iterationsData.map(d => (
          <Bar key={d.iteration}
            label={`iter ${d.iteration}  (${fmtK(d.effectiveInput + d.output)} tok)`}
            value={fmtCost(d.cost)} pct={maxCost > 0 ? (d.cost / maxCost) * 100 : 0} />
        ))}
      </div>
      <div className="box">
        <div className="box-title">Context window growth</div>
        {r.iterationsData.map(d => (
          <Bar key={d.iteration}
            label={`after iter ${d.iteration}`}
            value={`${fmtK(d.contextSize)} / ${fmtK(selectedModel.contextWindow)}  (${d.ctxPct}%)`}
            pct={d.ctxPct} />
        ))}
      </div>
    </div>
  )
}
function Stat({ label, value, v }) {
  return <div className="stat-card"><div className="stat-label">{label}</div><div className={`stat-value ${v??''}`}>{value}</div></div>
}
function Bar({ label, value, pct }) {
  const c = pct > 80 ? 'danger' : pct > 55 ? 'hot' : ''
  return (
    <div className="bar-row">
      <div className="bar-header"><span className="bar-label">{label}</span><span className="bar-value">{value}</span></div>
      <div className="bar-track"><div className={`bar-fill ${c}`} style={{width:`${Math.min(100,pct)}%`}}/></div>
    </div>
  )
}
