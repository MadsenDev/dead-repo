import { useState, useEffect } from 'react'

// ─────────────────────────────────────────────────────
// EKG line — animated heartbeat trace; flatlines on dead pages
// ─────────────────────────────────────────────────────
export function EkgLine({ alive = true, width = 320, height = 32 }) {
  const [phase, setPhase] = useState(0)
  useEffect(() => {
    let raf
    const tick = () => {
      setPhase((p) => (p + 0.95) % 240)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const points = []
  const N = 240
  const mid = height / 2
  const amp = Math.max(6, height * 0.34)
  for (let i = 0; i < N; i++) {
    const x = (i / N) * width
    let y = mid
    if (alive) {
      const local = (i - phase + N) % N
      if (local > 42 && local < 52) {
        y = mid - amp * 0.16 * Math.sin(((local - 42) / 10) * Math.PI)
      } else if (local >= 60 && local < 66) {
        y = mid + amp * 0.14 * ((local - 60) / 6)
      } else if (local >= 66 && local < 72) {
        y = mid + amp * 0.14 - amp * 1.28 * ((local - 66) / 6)
      } else if (local >= 72 && local < 78) {
        y = mid - amp * 1.14 + amp * 1.72 * ((local - 72) / 6)
      } else if (local >= 78 && local < 88) {
        y = mid + amp * 0.58 - amp * 0.58 * ((local - 78) / 10)
      } else if (local > 98 && local < 118) {
        y = mid - amp * 0.28 * Math.sin(((local - 98) / 20) * Math.PI)
      } else {
        y = mid + Math.sin((i + phase) * 0.045) * 0.18
      }
    }
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`)
  }
  const d = 'M' + points.join(' L')
  const baseline = `M0,${mid.toFixed(1)} L${width},${mid.toFixed(1)}`

  return (
    <svg className={`ekg-line ${alive ? '' : 'flat'}`} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <path className="ekg-base" d={baseline} />
      <path className="ekg-trace" d={d} />
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
const ALL_COLS = { status: true, vitals: true, activity: true, lastCommit: true, lifespan: true, stars: true }

export function RepoTable({ repos, voice, onOpen, visibleCols = ALL_COLS, dateFormat = 'relative' }) {
  const v = { ...ALL_COLS, ...visibleCols }
  return (
    <table className="repo-table">
      <thead>
        <tr>
          <th>Repository</th>
          {v.status     && <th>Status</th>}
          {v.vitals     && <th>Vitals</th>}
          {v.activity   && <th>Activity (30d)</th>}
          {v.lastCommit && <th style={{ textAlign: 'right' }}>Last commit</th>}
          {v.lifespan   && <th style={{ textAlign: 'right' }}>Lifespan</th>}
          {v.stars      && <th style={{ textAlign: 'right' }}>★</th>}
        </tr>
      </thead>
      <tbody>
        {repos.map((r) => (
          <tr key={r.id} onClick={() => onOpen(r.id)}>
            <td className="name">
              <span className="lang-dot" style={{ background: r.langColor }} />{r.name}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 9, color: r.langColor, opacity: 0.9, flexShrink: 0 }}>
                  {r.lang}
                </span>
                {r.description && (
                  <span style={{ fontFamily: 'var(--sans)', fontWeight: 400, color: 'var(--fg-3)', fontSize: 11 }}>
                    {r.description}
                  </span>
                )}
              </div>
            </td>
            {v.status     && <td><StatePill state={r.state} voice={voice} /></td>}
            {v.vitals     && <td><VitalBar value={r.vitals} /></td>}
            {v.activity   && <td><Sparkline data={r.sparkline} flat={r.state === 'flatlined' || r.state === 'dead'} /></td>}
            {v.lastCommit && <td className="muted" style={{ textAlign: 'right' }}>{relTime(r.lastCommit, dateFormat)}</td>}
            {v.lifespan   && <td className="muted" style={{ textAlign: 'right' }}>{r.lifespan}</td>}
            {v.stars      && <td className="num">{r.stars}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ─────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────
export function relTime(dateStr, format = 'relative') {
  const now = new Date()
  const d = new Date(dateStr)
  const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24))
  const rel = diffDays < 1 ? 'today'
    : diffDays < 2 ? 'yesterday'
    : diffDays < 7 ? `${diffDays}d ago`
    : diffDays < 30 ? `${Math.floor(diffDays / 7)}w ago`
    : diffDays < 365 ? `${Math.floor(diffDays / 30)}mo ago`
    : `${(diffDays / 365).toFixed(1)}y ago`
  if (format === 'absolute') return formatDate(dateStr)
  if (format === 'both') return `${rel} · ${formatDate(dateStr)}`
  return rel
}

export function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}
