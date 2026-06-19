import { cacheBreakEven } from '../../utils/simulate'
export default function CacheTab({ cacheEnabled, loopResult: r, noCache, selectedModel, cachePrefixTokens, cacheHitRate, runsPerDay, fmtCost, fmtK }) {
  if (!cacheEnabled) return (
    <div className="tab-pane"><div className="empty-state">Enable <strong>Prompt caching</strong> in the left panel to see analysis.</div></div>
  )
  const save = noCache.totalCost - r.totalCost
  const savePct = noCache.totalCost > 0 ? Math.round(save / noCache.totalCost * 100) : 0
  const breakEven = cacheBreakEven({ model: selectedModel, prefixTokens: cachePrefixTokens, hitRate: cacheHitRate, savingsPerRun: save })
  const dailySave = save * runsPerDay
  const monthlySave = dailySave * 30
  return (
    <div className="tab-pane">
      <div className="stat-grid">
        <Stat label="Without caching" value={fmtCost(noCache.totalCost)} />
        <Stat label="With caching"    value={fmtCost(r.totalCost)} v="ok" />
        <Stat label="Savings / run"   value={fmtCost(save)}   v={save > 0 ? 'ok' : ''} />
        <Stat label="Savings %"       value={savePct + '%'}   v={savePct > 10 ? 'ok' : ''} />
      </div>
      <div className="box">
        <div className="box-title">Break-even analysis</div>
        <div className="stat-grid">
          <Stat label="Cache write cost"  value={fmtCost((cachePrefixTokens / 1e6) * selectedModel.input * 1.25)} />
          <Stat label="Break-even at"     value={breakEven ? breakEven + ' runs' : 'instant'} v="ok" />
          <Stat label="Daily savings"     value={fmtCost(dailySave)}   v="ok" />
          <Stat label="Monthly savings"   value={fmtCost(monthlySave)} v="ok" />
        </div>
      </div>
      <div className="box">
        <div className="box-title">Daily cost at {runsPerDay} runs/day</div>
        {[
          { label: 'Without caching', value: fmtCost(noCache.totalCost * runsPerDay), pct: 100, v: 'hot' },
          { label: 'With caching',    value: fmtCost(r.totalCost * runsPerDay),       pct: r.totalCost / noCache.totalCost * 100, v: 'ok' },
        ].map(b => (
          <div key={b.label} className="bar-row">
            <div className="bar-header"><span className="bar-label">{b.label}</span><span className="bar-value">{b.value}</span></div>
            <div className="bar-track"><div className={`bar-fill ${b.v}`} style={{width:`${Math.min(100,b.pct)}%`}}/></div>
          </div>
        ))}
      </div>
    </div>
  )
}
function Stat({ label, value, v }) {
  return <div className="stat-card"><div className="stat-label">{label}</div><div className={`stat-value ${v??''}`}>{value}</div></div>
}
