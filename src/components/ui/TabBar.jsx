export default function TabBar({ tabs, active, onSelect }) {
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
