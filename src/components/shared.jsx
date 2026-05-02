import { useState, useEffect } from 'react'

// ─────────────────────────────────────────────────────
// EKG line — animated heartbeat trace; flatlines on dead pages
// ─────────────────────────────────────────────────────
export function EkgLine({ alive = true, width = 320, height = 32 }) {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    let raf
    const tick = () => {
      setPhase((p) => (p + 1.2) % 200)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const points = []
  const N = 200
  const mid = height / 2
  for (let i = 0; i < N; i++) {
    const x = (i / N) * width
    let y = mid
    if (alive) {
      const local = (i - phase + N) % N
      if (local > 30 && local < 38) y = mid - 3 * Math.sin(((local - 30) / 8) * Math.PI)
      else if (local === 42) y = mid + 2
      else if (local === 43) y = mid - 12
      else if (local === 44) y = mid + 9
      else if (local === 45) y = mid - 2
      else if (local > 50 && local < 62) y = mid - 4 * Math.sin(((local - 50) / 12) * Math.PI)
    }
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  const d = 'M' + points.join(' L')

  return (
    <svg className={`ekg-line ${alive ? '' : 'flat'}`} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path d={d} />
    </svg>
  )
}

// ─────────────────────────────────────────────────────
// Sparkline
// ─────────────────────────────────────────────────────
export function Sparkline({ data, width = 100, height = 22, color = 'var(--fg-2)', flat = false }) {
  const max = Math.max(1, ...data)
  const step = width / (data.length - 1)
  const points = data.map((v, i) => `${(i * step).toFixed(1)},${(height - (v / max) * (height - 2) - 1).toFixed(1)}`).join(' L')
  const d = 'M' + points
  return (
    <svg className="spark" viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
      <path d={d} fill="none" stroke={flat ? 'var(--crit)' : color} strokeWidth="1" opacity={flat ? 0.7 : 1} />
      {flat && <line x1={width * 0.5} y1={height - 1} x2={width} y2={height - 1} stroke="var(--crit)" strokeWidth="1" />}
    </svg>
  )
}

// ─────────────────────────────────────────────────────
// Vital bar
// ─────────────────────────────────────────────────────
export function VitalBar({ value }) {
  const cls = value === 0 ? 'zero' : value < 25 ? 'crit' : value < 50 ? 'warn' : ''
  return (
    <span className={`vital-bar ${cls}`}>
      <span className="track"><span className="fill" style={{ width: `${value}%` }} /></span>
      <span style={{ color: 'var(--fg-2)', minWidth: 22, textAlign: 'right' }}>{value}</span>
    </span>
  )
}

// ─────────────────────────────────────────────────────
// Status pill
// ─────────────────────────────────────────────────────
export function StatePill({ state, voice }) {
  const label = voice?.[state] || state
  return (
    <span className={`pill ${state}`}>
      <span className="pill-dot" />{label}
    </span>
  )
}

// ─────────────────────────────────────────────────────
// Repo table
// ─────────────────────────────────────────────────────
export function RepoTable({ repos, voice, onOpen }) {
  return (
    <table className="repo-table">
      <thead>
        <tr>
          <th>Repository</th>
          <th>Status</th>
          <th>Vitals</th>
          <th>Activity (30d)</th>
          <th style={{ textAlign: 'right' }}>Last commit</th>
          <th style={{ textAlign: 'right' }}>Lifespan</th>
          <th style={{ textAlign: 'right' }}>★</th>
        </tr>
      </thead>
      <tbody>
        {repos.map((r) => (
          <tr key={r.id} onClick={() => onOpen(r.id)}>
            <td className="name">
              <span className="lang-dot" style={{ background: r.langColor }} />{r.name}
              <div style={{ fontFamily: 'var(--sans)', fontWeight: 400, color: 'var(--fg-3)', fontSize: 11, marginTop: 2 }}>
                {r.description}
              </div>
            </td>
            <td><StatePill state={r.state} voice={voice} /></td>
            <td><VitalBar value={r.vitals} /></td>
            <td><Sparkline data={r.sparkline} flat={r.state === 'flatlined' || r.state === 'dead'} /></td>
            <td className="muted" style={{ textAlign: 'right' }}>{relTime(r.lastCommit)}</td>
            <td className="muted" style={{ textAlign: 'right' }}>{r.lifespan}</td>
            <td className="num">{r.stars}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────
export function relTime(dateStr) {
  const now = new Date()
  const d = new Date(dateStr)
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24))
  if (diffDays < 1) return 'today'
  if (diffDays < 2) return 'yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`
  const y = (diffDays / 365).toFixed(1)
  return `${y}y ago`
}

export function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
