import { useState } from 'react'
import { EkgLine, RepoTable } from '../components/shared'

export function ListPage({ voice, page, repos, onOpenRepo }) {
  const config = {
    ward: { state: 'alive', title: voice.ward, crumb: 'STATE: ALIVE', alive: true,
            sub: voice.name === 'Monday'
              ? "These have a pulse. For now. Don't get cocky."
              : 'Repositories with recent commit activity.' },
    hospital: { state: 'fading', title: voice.hospital, crumb: 'STATE: FADING', alive: true,
            sub: voice.name === 'Monday'
              ? 'Vitals tanking. You know exactly which one you abandoned and when.'
              : 'Repositories with declining commit activity.' },
    morgue: { state: 'flatlined', title: voice.morgue, crumb: 'STATE: FLATLINED', alive: false,
            sub: voice.name === 'Monday'
              ? 'Cold. No commits. No PRs. No excuses left. Sign the paperwork.'
              : 'Awaiting cause-of-death determination.' },
    graveyard: { state: 'dead', title: voice.graveyard, crumb: 'STATE: DECLARED', alive: false,
            sub: voice.name === 'Monday'
              ? 'You officially gave up. Documented. Time-stamped. Yours forever.'
              : 'Cause of death documented and signed off.' },
  }[page]

  const filtered = repos.filter(r => r.state === config.state)
  const [sort, setSort] = useState('last')
  const [q, setQ] = useState('')

  let view = filtered
  if (q) view = view.filter(r => r.name.toLowerCase().includes(q.toLowerCase()))
  view = [...view].sort((a, b) => {
    if (sort === 'last') return new Date(b.lastCommit) - new Date(a.lastCommit)
    if (sort === 'vitals') return b.vitals - a.vitals
    if (sort === 'name') return a.name.localeCompare(b.name)
    if (sort === 'lifespan') return b.commitsTotal - a.commitsTotal
    return 0
  })

  return (
    <>
      <div className="pageheader">
        <div>
          <div className="crumb">{config.crumb}</div>
          <h1>{config.title}</h1>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div className="crumb" style={{ marginBottom: 6 }}>
            {config.alive ? 'rhythm: nominal' : 'rhythm: asystole'}
          </div>
          <EkgLine alive={config.alive} width={260} height={36} />
        </div>
      </div>

      <div style={{ padding: '14px 32px 4px', color: 'var(--fg-2)', fontSize: 12, fontFamily: 'var(--mono)' }}>
        {config.sub}
      </div>

      <div className="filterbar">
        <div className="seg">
          {['last', 'vitals', 'name', 'lifespan'].map(k => (
            <button key={k} className={sort === k ? 'active' : ''} onClick={() => setSort(k)}>
              {k === 'last' ? 'Last activity' : k === 'vitals' ? 'Vitals' : k === 'name' ? 'Name' : 'Lifespan'}
            </button>
          ))}
        </div>
        <div className="search">
          <span style={{ color: 'var(--fg-3)' }}>⌕</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="filter…" />
        </div>
        <div className="meta">{view.length} of {filtered.length}</div>
      </div>

      {view.length === 0 ? (
        <div style={{ padding: '60px 32px', textAlign: 'center', fontFamily: 'var(--mono)', color: 'var(--fg-3)' }}>
          {voice.nothingHere}
        </div>
      ) : (
        <RepoTable repos={view} voice={voice} onOpen={onOpenRepo} />
      )}
    </>
  )
}
