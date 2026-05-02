import { useState, useEffect } from 'react'
import { EkgLine, RepoTable } from '../components/shared'
import { LANG_COLORS } from '../lib/classify'

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
  const [activeLangs, setActiveLangs] = useState(new Set())

  useEffect(() => { setActiveLangs(new Set()); setQ('') }, [page])

  const allLangs = [...new Set(filtered.map(r => r.lang).filter(Boolean))].sort()
  const toggleLang = (lang) => setActiveLangs(prev => {
    const next = new Set(prev)
    next.has(lang) ? next.delete(lang) : next.add(lang)
    return next
  })

  let view = filtered
  if (q) view = view.filter(r => r.name.toLowerCase().includes(q.toLowerCase()) || r.description?.toLowerCase().includes(q.toLowerCase()))
  if (activeLangs.size > 0) view = view.filter(r => activeLangs.has(r.lang))
  view = [...view].sort((a, b) => {
    if (sort === 'last') return new Date(b.lastCommit) - new Date(a.lastCommit)
    if (sort === 'vitals') return b.vitals - a.vitals
    if (sort === 'name') return a.name.localeCompare(b.name)
    if (sort === 'lifespan') return (new Date(b.lastCommit) - new Date(b.firstCommit)) - (new Date(a.lastCommit) - new Date(a.firstCommit))
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
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="name or description…" />
        </div>
        <div className="meta">{view.length} of {filtered.length}</div>
      </div>

      {allLangs.length > 1 && (
        <div className="filterbar" style={{ paddingTop: 7, paddingBottom: 7, gap: 6, flexWrap: 'wrap',
                                            borderTop: 'none', background: 'var(--bg-0)' }}>
          <span style={{ fontSize: 9, letterSpacing: '0.10em', textTransform: 'uppercase',
                         color: 'var(--fg-4)', marginRight: 2 }}>Lang</span>
          {allLangs.map(lang => {
            const color = LANG_COLORS[lang] || '#666666'
            const active = activeLangs.has(lang)
            const count = filtered.filter(r => r.lang === lang).length
            return (
              <button key={lang} onClick={() => toggleLang(lang)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                height: 22, padding: '0 9px', borderRadius: 3, cursor: 'default',
                fontFamily: 'var(--mono)', fontSize: 10,
                border: `1px solid ${active ? color : 'var(--line)'}`,
                background: active ? `color-mix(in srgb, ${color} 14%, transparent)` : 'transparent',
                color: active ? color : 'var(--fg-2)',
                transition: 'border-color 120ms, color 120ms, background 120ms',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                {lang}
                <span style={{ color: active ? color : 'var(--fg-4)', fontSize: 9 }}>{count}</span>
              </button>
            )
          })}
          {activeLangs.size > 0 && (
            <button onClick={() => setActiveLangs(new Set())} style={{
              fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
              background: 'transparent', border: '1px solid var(--line)', borderRadius: 3,
              height: 22, padding: '0 8px', cursor: 'default', marginLeft: 2,
            }}>
              clear ✕
            </button>
          )}
        </div>
      )}

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
