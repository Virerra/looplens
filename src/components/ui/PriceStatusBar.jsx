export default function PriceStatusBar({ status, verifiedDate, error }) {
  const icon = status === 'live' ? '🟢' : status === 'cached' ? '🔵' : status === 'loading' ? '⏳' : '🟡'
  const label =
    status === 'live'    ? `Live prices · ${verifiedDate}` :
    status === 'cached'  ? `Cached prices · refreshes every 6h` :
    status === 'loading' ? 'Fetching live prices…' :
                           `Fallback prices · verified ${verifiedDate}`
  return (
    <div className={`price-status price-status--${status}`} title={error ?? ''}>
      {icon} {label}
    </div>
  )
}
