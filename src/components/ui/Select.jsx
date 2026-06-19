export default function Select({ value, onChange, options, grouped }) {
  return (
    <select className="select" value={value} onChange={e => onChange(e.target.value)}>
      {grouped
        ? options.map(g => (
            <optgroup key={g.provider} label={`── ${g.provider} ──`}>
              {g.opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </optgroup>
          ))
        : options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)
      }
    </select>
  )
}
