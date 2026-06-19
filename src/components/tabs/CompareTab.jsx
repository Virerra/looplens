export default function CompareTab({ allModelResults, fmtCost }) {
  if (!allModelResults?.length) return null
  const maxCost = allModelResults[allModelResults.length - 1].result.totalCost
  const minCost = allModelResults[0].result.totalCost
  return (
    <div className="tab-pane">
      <div className="box">
        <div className="box-title">All models — same loop configuration, sorted by cost</div>
        {allModelResults.map(({ model: m, result }) => {
          const pct = maxCost > 0 ? (result.totalCost / maxCost) * 100 : 0
          const isBest  = result.totalCost === minCost
          const isWorst = result.totalCost === maxCost
          const fillCls = isWorst ? 'danger' : pct > 60 ? 'hot' : ''
          const costCls = isBest ? 'ok' : isWorst ? 'danger' : ''
          return (
            <div key={m.id} className="cmp-row">
              <div className="cmp-name">
                {m.name}
                <span className={`badge badge--${m.provider.toLowerCase()}`}>{m.provider}</span>
                {m.priceSource === 'live' && <span className="badge badge--live">live</span>}
              </div>
              <div className="cmp-bar">
                <div className="bar-track"><div className={`bar-fill ${fillCls}`} style={{width:`${pct}%`}}/></div>
              </div>
              <div className={`cmp-cost ${costCls}`}>{fmtCost(result.totalCost)}</div>
            </div>
          )
        })}
      </div>
      <div className="compare-note">
        Prices per 1M tokens (in/out). Verified June 2026 — always check provider docs before budget decisions.
        {allModelResults.some(r => r.model.priceSource === 'live') && ' 🟢 Live prices fetched from LiteLLM.'}
      </div>
    </div>
  )
}
