import { useState } from 'react'
import { EkgLine, VitalBar, Sparkline, relTime, formatDate } from '../components/shared'

export function DashboardPage({ voice, repos, onOpenRepo, onNav }) {
  const counts = {
    total: repos.length,
    alive: repos.filter(r => r.state === 'alive').length,
    fading: repos.filter(r => r.state === 'fading').length,
    flatlined: repos.filter(r => r.state === 'flatlined').length,
    dead: repos.filter(r => r.state === 'dead').length,
    reanimated: repos.filter(r => r.state === 'reanimated').length,
  }
  const aliveCount = counts.alive + counts.reanimated
  const deadCount = counts.flatlined + counts.dead

  const recent = repos
    .filter(r => r.state === 'flatlined' || r.state === 'dead')
    .sort((a, b) => new Date(b.lastCommit) - new Date(a.lastCommit))
    .slice(0, 4)

  const watchlist = repos.filter(r => r.state === 'fading').sort((a, b) => a.vitals - b.vitals)

  return (
    <>
      <div className="pageheader">
        <div>
          <div className="crumb">{voice.dashTitle}</div>
          <h1>{typeof voice.hero === 'function' ? voice.hero(counts) : voice.hero}</h1>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div className="crumb" style={{ marginBottom: 6 }}>vitals · sinus rhythm</div>
          <EkgLine alive={true} width={300} height={36} />
        </div>
      </div>

      <div style={{ padding: '0 32px', marginTop: -4 }}>
        <div style={{ fontSize: 12, color: 'var(--fg-2)', padding: '14px 0 4px', fontFamily: 'var(--mono)' }}>
          {typeof voice.heroSub === 'function' ? voice.heroSub(counts) : voice.heroSub}
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="label">{voice.statTotal}</div>
          <div className="value">{counts.total}</div>
          <div className="delta">across 1 organization</div>
        </div>
        <div className="stat alive">
          <div className="label">{voice.statAlive}</div>
          <div className="value">{aliveCount}</div>
          <div className="delta up">▲ 1 reanimated this month</div>
        </div>
        <div className="stat warn">
          <div className="label">At risk</div>
          <div className="value">{counts.fading}</div>
          <div className="delta">no commits in 30+ days</div>
        </div>
        <div className="stat crit">
          <div className="label">{voice.statDead}</div>
          <div className="value">{deadCount}</div>
          <div className="delta down">{counts.dead} declared, {counts.flatlined} unconfirmed</div>
        </div>
      </div>

      <div style={{ padding: '24px 32px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="panel">
          <div className="panel-hd">
            <span>Critical · fading vitals</span>
            <span style={{ marginLeft: 'auto', color: 'var(--warn)' }}>{watchlist.length} cases</span>
          </div>
          <div>
            {watchlist.length === 0 ? (
              <div style={{ padding: 22, color: 'var(--fg-3)', fontFamily: 'var(--mono)', fontSize: 11 }}>
                No critical cases. (For now.)
              </div>
            ) : watchlist.map((r, i) => (
              <div key={r.id} onClick={() => onOpenRepo(r.id)}
                   style={{ display: 'grid', gridTemplateColumns: '20px 1fr auto auto', gap: 12, alignItems: 'center',
                            padding: '12px 16px', borderBottom: '1px solid var(--line)', cursor: 'default' }}>
                <span className="skel" style={{ color: 'var(--fg-3)' }}>{String(i + 1).padStart(2, '0')}</span>
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--fg-0)' }}>
                    <span className="lang-dot" style={{ background: r.langColor }} />{r.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>
                    Last commit: {relTime(r.lastCommit)}{r.lastWords ? ` · “${r.lastWords.length > 38 ? r.lastWords.slice(0, 36) + '…' : r.lastWords}”` : ''}
                  </div>
                </div>
                <VitalBar value={r.vitals} />
                <Sparkline data={r.sparkline} width={60} />
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="panel-hd">
            <span>Time of death · last 12 months</span>
            <span style={{ marginLeft: 'auto', color: 'var(--crit)' }}>{recent.length} expired</span>
          </div>
          <div>
            {recent.map((r, i) => (
              <div key={r.id} onClick={() => onOpenRepo(r.id)}
                   style={{ display: 'grid', gridTemplateColumns: '20px 1fr auto', gap: 12, alignItems: 'center',
                            padding: '12px 16px', borderBottom: '1px solid var(--line)', cursor: 'default' }}>
                <span className="skel" style={{ color: 'var(--fg-3)' }}>†</span>
                <div>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--fg-0)' }}>
                    <span className="lang-dot" style={{ background: r.langColor }} />{r.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>
                    Cause: <span style={{ color: 'var(--crit)' }}>{r.cause}</span> · {r.lifespan}
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)', textAlign: 'right' }}>
                  <div>{formatDate(r.timeOfDeath)}</div>
                  <div>{relTime(r.timeOfDeath)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 32px 32px' }}>
        <div className="panel">
          <div className="panel-hd">
            <span>Cause-of-death distribution</span>
            <span className="index">N = {deadCount}</span>
          </div>
          <div style={{ padding: '20px 22px' }}>
            <CauseDistribution repos={repos} />
          </div>
        </div>
      </div>
    </>
  )
}

function CauseDistribution({ repos }) {
  const causes = {}
  repos.filter(r => r.cause).forEach(r => { causes[r.cause] = (causes[r.cause] || 0) + 1 })
  const entries = Object.entries(causes).sort((a, b) => b[1] - a[1])
  const max = Math.max(...entries.map(e => e[1]))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {entries.map(([cause, n]) => (
        <div key={cause} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 32px', gap: 12, alignItems: 'center' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-1)' }}>{cause}</span>
          <div style={{ height: 14, background: 'var(--bg-3)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${(n / max) * 100}%`,
                          background: 'var(--crit)', boxShadow: '0 0 6px oklch(0.65 0.20 25 / 0.4)' }} />
          </div>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-2)', textAlign: 'right' }}>{n}</span>
        </div>
      ))}
    </div>
  )
}
