// Slider.jsx
export default function Slider({ label, value, min, max, step = 1, onChange, fmt }) {
  const display = fmt ? fmt(value) : value.toLocaleString()
  return (
    <div className="field">
      <label className="field-label">
        {label} <span className="field-val">{display}</span>
      </label>
      <input
        type="range" className="slider"
        min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  )
}
