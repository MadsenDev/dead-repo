import { useState, useRef } from 'react'
import { EkgLine, formatDate } from '../components/shared'

export function CertificateModal({ repo, voice, onClose }) {
  const certRef = useRef(null)
  const [exporting, setExporting] = useState(false)

  if (!repo) return null
  const isMonday = voice.name === 'Monday'

  const handleExport = async () => {
    setExporting(true)
    try {
      const node = certRef.current
      const rect = node.getBoundingClientRect()
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width * 2}" height="${rect.height * 2}" viewBox="0 0 ${rect.width} ${rect.height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">${new XMLSerializer().serializeToString(node)}</div>
        </foreignObject>
      </svg>`
      const blob = new Blob([svg], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)
      const img = new Image()
      img.onload = () => {
        const c = document.createElement('canvas')
        c.width = rect.width * 2; c.height = rect.height * 2
        const ctx = c.getContext('2d')
        ctx.fillStyle = '#0a0d0c'
        ctx.fillRect(0, 0, c.width, c.height)
        ctx.drawImage(img, 0, 0)
        c.toBlob((b) => {
          const a = document.createElement('a')
          a.href = URL.createObjectURL(b)
          a.download = `death-certificate-${repo.name}.png`
          a.click()
          URL.revokeObjectURL(url)
          setExporting(false)
        })
      }
      img.onerror = () => setExporting(false)
      img.src = url
    } catch {
      setExporting(false)
    }
  }

  const serial = ('DR-' + repo.id.toUpperCase().replace(/-/g, '') + '-' +
                  (repo.timeOfDeath || repo.lastCommit).replace(/-/g, ''))

  return (
    <div onClick={onClose}
         style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
                  zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 40, overflow: 'auto', backdropFilter: 'blur(8px)' }}>
      <div onClick={(e) => e.stopPropagation()}
           style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%',
                      maxWidth: 720, justifyContent: 'space-between' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.20em',
                        color: 'var(--fg-3)', textTransform: 'uppercase' }}>
            {isMonday ? 'Receipt for time wasted' : 'Certificate of death · ready to export'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={handleExport} disabled={exporting}>
              {exporting ? 'Exporting…' : '↓ Save PNG'}
            </button>
            <button className="btn">↗ Share</button>
            <button className="btn ghost" onClick={onClose}>✕ Close</button>
          </div>
        </div>

        <div ref={certRef} style={{
          width: 720, background: '#0d1110',
          border: '1px solid rgba(255,255,255,0.10)',
          padding: 0, fontFamily: 'var(--sans)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
          position: 'relative',
        }}>
          <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)',
                        padding: '20px 36px', display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <CertSeal />
              <div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em',
                              color: 'var(--fg-3)', textTransform: 'uppercase' }}>
                  Department of Repository Health · github.com
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--fg-0)',
                              marginTop: 2, letterSpacing: '0.04em' }}>
                  CERTIFICATE OF DEATH
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
                            letterSpacing: '0.10em' }}>SERIAL №</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-1)',
                            marginTop: 2 }}>{serial}</div>
            </div>
          </div>

          <div style={{ padding: '28px 36px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em',
                          color: 'var(--fg-3)', textTransform: 'uppercase', marginBottom: 8 }}>
              Subject
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 30, fontWeight: 400,
                          color: 'var(--fg-0)', letterSpacing: '-0.01em', display: 'flex',
                          alignItems: 'center', gap: 12 }}>
              <span className="lang-dot" style={{ background: repo.langColor, width: 12, height: 12 }} />
              {repo.owner}/{repo.name}
            </div>
            <div style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 8, fontStyle: 'italic' }}>
              &ldquo;{repo.description}&rdquo;
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0,
                        borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <CertField label="Date of birth" value={formatDate(repo.firstCommit)} />
            <CertField label="Date of expiry" value={formatDate(repo.timeOfDeath || repo.lastCommit)} highlight />
            <CertField label="Lifespan" value={repo.lifespan} />
            <CertField label="Total commits" value={repo.commitsTotal.toLocaleString()} />
            <CertField label="Contributors at TOD" value={repo.contributors} />
            <CertField label="Final language" value={repo.lang} />
            <CertField label="Stars accrued" value={repo.stars} />
            <CertField label="License" value={repo.license} last />
          </div>

          <div style={{ padding: '28px 36px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)',
                        position: 'relative' }}>
            <div style={{ position: 'absolute', left: 0, top: 28, bottom: 24, width: 2,
                          background: 'var(--crit)', boxShadow: '0 0 8px oklch(0.65 0.20 25 / 0.5)' }} />
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em',
                          color: 'var(--fg-3)', textTransform: 'uppercase', marginBottom: 10 }}>
              Cause of death
            </div>
            <div style={{ fontSize: 28, fontWeight: 400, color: 'var(--crit)',
                          letterSpacing: '-0.01em', marginBottom: 10 }}>
              {repo.cause || 'Indeterminate'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--fg-1)', lineHeight: 1.6, maxWidth: 580 }}>
              {repo.causeDetail || 'No further determination on record.'}
            </div>
          </div>

          <div style={{ padding: '24px 36px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.14em',
                          color: 'var(--fg-3)', textTransform: 'uppercase', marginBottom: 10 }}>
              Final transmission
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--fg-0)',
                          padding: '12px 16px', background: 'rgba(0,0,0,0.4)',
                          borderLeft: '1px solid rgba(255,255,255,0.14)' }}>
              {repo.lastWords}
            </div>
          </div>

          <div style={{ padding: '20px 36px', display: 'flex', alignItems: 'center',
                        gap: 24, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em',
                            color: 'var(--fg-3)', textTransform: 'uppercase' }}>Final EKG</div>
              <div style={{ marginTop: 4 }}>
                <EkgLine alive={false} width={280} height={40} />
              </div>
            </div>
            <div style={{ flex: 1 }} />
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em',
                            color: 'var(--fg-3)', textTransform: 'uppercase' }}>Heart rate</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 22, color: 'var(--crit)', marginTop: 2 }}>0 BPM</div>
            </div>
          </div>

          <div style={{ padding: '20px 36px 24px', display: 'flex',
                        justifyContent: 'space-between', alignItems: 'flex-end', gap: 24 }}>
            <div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
                            letterSpacing: '0.10em', marginBottom: 6 }}>CERTIFIED BY</div>
              <div style={{ fontFamily: '"Brush Script MT", "Lucida Handwriting", cursive',
                            fontSize: 22, color: 'var(--vital)', letterSpacing: '-0.01em',
                            transform: 'rotate(-2deg) translateX(4px)',
                            textShadow: '0 0 8px var(--vital-glow)' }}>
                Dead Repo
              </div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
                            marginTop: 4, letterSpacing: '0.04em' }}>
                Coroner · {voice.name} edition · v2.4.1
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
                            letterSpacing: '0.10em' }}>FILED</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-1)',
                            marginTop: 2 }}>{formatDate(repo.declared || repo.lastCommit)} · 14:32 UTC</div>
            </div>
          </div>

          <div style={{ position: 'absolute', right: 32, top: 200,
                        transform: 'rotate(-12deg)', pointerEvents: 'none' }}>
            <div style={{ border: '2px solid var(--crit)', borderRadius: 2, padding: '6px 14px',
                          fontFamily: 'var(--mono)', fontSize: 14, fontWeight: 600,
                          letterSpacing: '0.16em', color: 'var(--crit)', opacity: 0.85,
                          textShadow: '0 0 8px oklch(0.65 0.20 25 / 0.4)' }}>
              DECEASED
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--crit)',
                          textAlign: 'center', marginTop: 4, letterSpacing: '0.10em', opacity: 0.7 }}>
              {(repo.timeOfDeath || repo.lastCommit).replace(/-/g, '·')}
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '10px 36px',
                        display: 'flex', justifyContent: 'space-between',
                        fontFamily: 'var(--mono)', fontSize: 8, color: 'var(--fg-4)',
                        letterSpacing: '0.10em' }}>
            <span>· · · DEAD REPO · OFFICIAL DOCUMENT · NOT VALID FOR LEGAL PURPOSES · · ·</span>
            <span>{serial}</span>
          </div>
        </div>

        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-3)',
                      maxWidth: 720, textAlign: 'center', lineHeight: 1.6 }}>
          {isMonday
            ? "Suitable for framing. Or not framing. The repo doesn't care. It's dead."
            : 'A formal record. Suitable for portfolio review, archival, or social posting.'}
        </div>
      </div>
    </div>
  )
}

function CertField({ label, value, highlight, last }) {
  return (
    <div style={{ padding: '14px 20px 14px 36px',
                  borderRight: '1px solid rgba(255,255,255,0.08)',
                  borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.14em',
                    color: 'var(--fg-3)', textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 14, color: highlight ? 'var(--crit)' : 'var(--fg-0)' }}>
        {value}
      </div>
    </div>
  )
}

function CertSeal() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="22" fill="none" stroke="var(--vital)" strokeWidth="0.5" opacity="0.6" />
      <circle cx="24" cy="24" r="18" fill="none" stroke="var(--vital)" strokeWidth="0.5" opacity="0.4" />
      <circle cx="24" cy="24" r="14" fill="none" stroke="var(--vital)" strokeWidth="1" />
      <path d="M10 24 L18 24 L20 18 L22 30 L24 14 L26 28 L28 24 L38 24"
            fill="none" stroke="var(--vital)" strokeWidth="1.2"
            strokeLinejoin="round" strokeLinecap="round"
            filter="drop-shadow(0 0 2px var(--vital-glow))" />
      <text x="24" y="46" textAnchor="middle" fontFamily="var(--mono)" fontSize="3.5"
            fill="var(--vital)" opacity="0.7" letterSpacing="0.5">DEAD REPO · EST. 2026</text>
    </svg>
  )
}
