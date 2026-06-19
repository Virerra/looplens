// Checkbox.jsx
export function Checkbox({ label, checked, onChange }) {
  return (
    <div className="checkbox-row" onClick={() => onChange(!checked)}>
      <div className={`checkbox ${checked ? 'checked' : ''}`}>{checked ? '✓' : ''}</div>
      <span className="checkbox-label">{label}</span>
    </div>
  )
}
export default Checkbox

// TabBar.jsx
export function TabBar({ tabs, active, onSelect }) {
  return (
    <div className="tabbar">
      {tabs.map((t, i) => (
        <button key={t} className={`tab ${i === active ? 'active' : ''}`} onClick={() => onSelect(i)}>
          {t}
        </button>
      ))}
    </div>
  )
}

// PriceStatusBar.jsx
export function PriceStatusBar({ status, verifiedDate, error }) {
  const icon = status === 'live' ? '🟢' : status === 'cached' ? '🔵' : status === 'loading' ? '⏳' : '🟡'
  const label =
    status === 'live'    ? `Prices live · ${verifiedDate}` :
    status === 'cached'  ? `Prices cached · refreshes every 6h` :
    status === 'loading' ? 'Fetching live prices…' :
                           `Prices verified ${verifiedDate} · ${error ?? 'using fallback'}`
  return (
    <div className={`price-status price-status--${status}`} title={error ?? ''}>
      {icon} {label}
    </div>
  )
}

// StatCard.jsx
export function StatCard({ label, value, variant }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${variant ?? ''}`}>{value}</div>
    </div>
  )
}

// BarRow.jsx
export function BarRow({ label, value, pct, variant }) {
  const cls = variant ?? (pct > 80 ? 'danger' : pct > 55 ? 'hot' : '')
  return (
    <div className="bar-row">
      <div className="bar-header">
        <span className="bar-label">{label}</span>
        <span className="bar-value">{value}</span>
      </div>
      <div className="bar-track">
        <div className={`bar-fill ${cls}`} style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
    </div>
  )
}

// Tip.jsx
export function Tip({ type, title, body }) {
  return (
    <div className={`tip tip--${type}`}>
      <div className={`tip-title tip-title--${type}`}>{title}</div>
      <div className="tip-body">{body}</div>
    </div>
  )
}

// CostMeter.jsx
export function CostMeter({ label, value, sub, colorClass }) {
  return (
    <div className="cost-meter">
      <div className="meter-label">{label}</div>
      <div className={`meter-value ${colorClass}`}>{value}</div>
      <div className="meter-sub">{sub}</div>
    </div>
  )
}
