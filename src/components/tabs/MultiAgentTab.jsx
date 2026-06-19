export default function MultiAgentTab({ mode, fanoutResult: f, orchModel, selectedModel, numAgents, fmtCost, fmtK }) {
  if (mode !== 'fanout' || !f) return (
    <div className="tab-pane"><div className="empty-state">Switch to <strong>Multi-agent fan-out</strong> mode in the left panel to use this tab.</div></div>
  )
  const maxIter = Math.max(...f.perSubagent.iterationsData.map(d => d.cost * f.numAgents))
  return (
    <div className="tab-pane">
      <div className="tip tip--info"><div className="tip-title tip-title--info">Fan-out model</div>
        <div className="tip-body">Orchestrator runs the main loop · spawns {f.numAgents} parallel subagents per iteration · total = orchestrator + (N × subagent loop)</div>
      </div>
      <div className="cost-meter">
        <div className="meter-label">Total fan-out cost</div>
        <div className={`meter-value ${f.grandTotalCost > 5 ? 'danger' : f.grandTotalCost > 0.5 ? 'warn' : 'cyan'}`}>{fmtCost(f.grandTotalCost)}</div>
        <div className="meter-sub">{orchModel.name} orch + {f.numAgents}× {selectedModel.name}</div>
      </div>
      <div className="stat-grid">
        <Stat label="Orchestrator"  value={fmtCost(f.orchestrator.totalCost)} v="purple" />
        <Stat label="All subagents" value={fmtCost(f.totalSubagentCost)} />
        <Stat label="Per-subagent"  value={fmtCost(f.perSubagent.totalCost)} />
        <Stat label="Total tokens"  value={fmtK(f.grandTotalTokens)} />
      </div>
      <div className="box">
        <div className="box-title">Cost breakdown</div>
        <Bar label={`Orchestrator (${orchModel.name})`} value={fmtCost(f.orchestrator.totalCost)}
          pct={f.grandTotalCost > 0 ? (f.orchestrator.totalCost / f.grandTotalCost) * 100 : 0} v="purple" />
        <Bar label={`${f.numAgents} subagents total (${selectedModel.name})`} value={fmtCost(f.totalSubagentCost)}
          pct={f.grandTotalCost > 0 ? (f.totalSubagentCost / f.grandTotalCost) * 100 : 0} />
      </div>
      <div className="box">
        <div className="box-title">Subagent cost per iteration × {f.numAgents} agents</div>
        {f.perSubagent.iterationsData.map(d => (
          <Bar key={d.iteration}
            label={`iter ${d.iteration} × ${f.numAgents} subagents`}
            value={fmtCost(d.cost * f.numAgents)}
            pct={maxIter > 0 ? (d.cost * f.numAgents / maxIter) * 100 : 0} />
        ))}
      </div>
    </div>
  )
}
function Stat({ label, value, v }) {
  return <div className="stat-card"><div className="stat-label">{label}</div><div className={`stat-value ${v??''}`}>{value}</div></div>
}
function Bar({ label, value, pct, v }) {
  const c = v ?? (pct > 80 ? 'danger' : pct > 55 ? 'hot' : '')
  return (
    <div className="bar-row">
      <div className="bar-header"><span className="bar-label">{label}</span><span className="bar-value">{value}</span></div>
      <div className="bar-track"><div className={`bar-fill ${c}`} style={{width:`${Math.min(100,pct)}%`}}/></div>
    </div>
  )
}
