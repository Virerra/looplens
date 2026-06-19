export default function LeftPanel(p) {
  const toggleTool = (id) =>
    p.setTools(p.tools.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t))

  const fmtK = (v) => v >= 1000 ? (v/1000).toFixed(v % 1000 === 0 ? 0 : 1) + 'k' : String(v)

  const modelsByProvider = p.models.reduce((acc, m) => {
    if (!acc[m.provider]) acc[m.provider] = []
    acc[m.provider].push(m)
    return acc
  }, {})

  return (
    <aside className="left-panel">

      <Sec title="Mode">
        <Sel value={p.mode} onChange={p.setMode} opts={[
          { v: 'single', l: 'Single agent loop' },
          { v: 'fanout', l: 'Multi-agent fan-out' },
        ]} />
      </Sec>

      <Sec title="Model">
        <select className="select" value={p.modelId} onChange={e => p.setModelId(e.target.value)}>
          {Object.entries(modelsByProvider).map(([prov, ms]) => (
            <optgroup key={prov} label={`── ${prov} ──`}>
              {ms.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </optgroup>
          ))}
        </select>
      </Sec>

      {p.mode === 'fanout' && (
        <Sec title="Fan-out config">
          <div className="field">
            <label className="field-label">Orchestrator model</label>
            <select className="select" value={p.orchModelId} onChange={e => p.setOrchModelId(e.target.value)}>
              {Object.entries(modelsByProvider).map(([prov, ms]) => (
                <optgroup key={prov} label={`── ${prov} ──`}>
                  {ms.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
          <Sld label="Parallel subagents" v={p.numAgents} min={1} max={20} set={p.setNumAgents} />
          <Sld label="Orch context tokens" v={p.orchContext} min={500} max={16000} step={500} set={p.setOrchContext} fmt={fmtK} />
          <Cb label="Pass orchestrator context to subagents" checked={p.passContext} set={p.setPassContext} />
        </Sec>
      )}

      <Sec title="Loop structure">
        <Sld label="Iterations"            v={p.iterations}    min={1}  max={40}    set={p.setIterations} />
        <Sld label="System prompt tokens"  v={p.systemTokens}  min={0}  max={8000}  step={100} set={p.setSystemTokens}  fmt={fmtK} />
        <Sld label="Initial context tokens"v={p.initialContext}min={0}  max={64000} step={500} set={p.setInitialContext} fmt={fmtK} />
        <Sld label="New input tokens / iter"v={p.inputPerIter} min={0}  max={8000}  step={100} set={p.setInputPerIter}  fmt={fmtK} />
        <Sld label="Output tokens / iter"  v={p.outputPerIter} min={50} max={8000}  step={50}  set={p.setOutputPerIter} fmt={fmtK} />
        <div className="field">
          <label className="field-label">Context accumulation</label>
          <Sel value={p.accumulation} onChange={p.setAccumulation} opts={[
            { v: 'full',      l: 'Full — all prior turns' },
            { v: 'sliding',   l: 'Sliding window' },
            { v: 'summarize', l: 'Summarize older turns' },
            { v: 'stateless', l: 'Stateless — reset each iter' },
          ]} />
        </div>
        {p.accumulation === 'sliding' && (
          <Sld label="Window size (turns)" v={p.windowSize} min={1} max={15} set={p.setWindowSize} />
        )}
      </Sec>

      <Sec title="Tool calls">
        {p.tools.map(t => (
          <div key={t.id} className="tool-row">
            <Cb label={t.label} checked={t.enabled} set={() => toggleTool(t.id)} />
            <span className="tool-cost">+{fmtK(t.tokensPerCall)} tok</span>
          </div>
        ))}
        <Sld label="Tool calls / iteration" v={p.toolCallsPerIter} min={0} max={10} set={p.setToolCallsPerIter} />
      </Sec>

      <Sec title="Prompt caching">
        <Cb label="Enable prompt caching" checked={p.cacheEnabled} set={p.setCacheEnabled} />
        {p.cacheEnabled && <>
          <Sld label="Cacheable prefix tokens" v={p.cachePrefixTokens} min={0} max={8000} step={100} set={p.setCachePrefixTokens} fmt={fmtK} />
          <Sld label="Cache hit rate" v={p.cacheHitRate} min={0} max={100} step={5} set={p.setCacheHitRate} fmt={v => v + '%'} />
          <Sld label="Loop runs / day" v={p.runsPerDay} min={1} max={500} set={p.setRunsPerDay} />
        </>}
      </Sec>

      <Sec title="AI suggestions (BYOK)">
        <div className="byok">
          <div className="byok-label">Your Anthropic key — stays in browser</div>
          <input type="password" className="byok-input" placeholder="sk-ant-…"
            value={p.apiKey} onChange={e => p.setApiKey(e.target.value)} />
        </div>
      </Sec>

    </aside>
  )
}

function Sec({ title, children }) {
  return <div className="panel-section"><div className="section-title">{title}</div>{children}</div>
}
function Sel({ value, onChange, opts }) {
  return (
    <select className="select" value={value} onChange={e => onChange(e.target.value)}>
      {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
    </select>
  )
}
function Sld({ label, v, min, max, step = 1, set, fmt }) {
  const display = fmt ? fmt(v) : v.toLocaleString()
  return (
    <div className="field">
      <label className="field-label">{label} <span className="field-val">{display}</span></label>
      <input type="range" className="slider" min={min} max={max} step={step} value={v}
        onChange={e => set(Number(e.target.value))} />
    </div>
  )
}
function Cb({ label, checked, set }) {
  return (
    <div className="checkbox-row" onClick={() => set(!checked)}>
      <div className={`checkbox ${checked ? 'checked' : ''}`}>{checked ? '✓' : ''}</div>
      <span className="checkbox-label">{label}</span>
    </div>
  )
}
