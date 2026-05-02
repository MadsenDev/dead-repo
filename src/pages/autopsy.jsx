import { useEffect, useState } from 'react'
import { EkgLine, StatePill, relTime, formatDate } from '../components/shared'
import { FILE_DECAY } from '../data/repos'
import { getRepoFileActivity, getRepoChangelog, getRepoLanguages } from '../lib/github'
import { LANG_COLORS } from '../lib/classify'

export function AutopsyPage({ voice, repo, githubToken, onBack, onAction }) {
  if (!repo) return null
  const isDead = repo.state === 'flatlined' || repo.state === 'dead'
  const hasCatalogedDecay = Boolean(FILE_DECAY[repo.id])
  const isConnectedRepo = repo.id.startsWith('gh-') && !!githubToken
  const [liveFileActivity, setLiveFileActivity] = useState(null)
  const [fileActivityState, setFileActivityState] = useState({ loading: false, error: null, sampledCommits: 0 })
  const [changelog, setChangelog] = useState(null)
  const [languages, setLanguages] = useState(null) // null = loading, false = unavailable, object = bytes per lang

  useEffect(() => {
    let cancelled = false

    if (!isConnectedRepo) {
      setLiveFileActivity(null)
      setFileActivityState({ loading: false, error: null, sampledCommits: 0 })
      return () => { cancelled = true }
    }

    setFileActivityState({ loading: true, error: null, sampledCommits: 0 })
    setLiveFileActivity(null)

    getRepoFileActivity(githubToken, repo.owner, repo.name)
      .then((result) => {
        if (cancelled) return
        setLiveFileActivity(result?.files?.length ? result.files : null)
        setFileActivityState({
          loading: false,
          error: null,
          sampledCommits: result?.sampledCommits || 0,
        })
      })
      .catch((error) => {
        if (cancelled) return
        setLiveFileActivity(null)
        setFileActivityState({
          loading: false,
          error,
          sampledCommits: 0,
        })
      })

    return () => { cancelled = true }
  }, [githubToken, isConnectedRepo, repo.id, repo.name, repo.owner])

  useEffect(() => {
    if (!isConnectedRepo) { setLanguages(false); return }
    let cancelled = false
    getRepoLanguages(githubToken, repo.owner, repo.name).then(result => {
      if (!cancelled) setLanguages(result || false)
    }).catch(() => { if (!cancelled) setLanguages(false) })
    return () => { cancelled = true }
  }, [githubToken, isConnectedRepo, repo.id, repo.name, repo.owner])

  useEffect(() => {
    if (!isConnectedRepo) { setChangelog(false); return }
    let cancelled = false
    getRepoChangelog(githubToken, repo.owner, repo.name).then(result => {
      if (cancelled) return
      if (!result) { setChangelog(false); return }
      setChangelog({ ...result, versions: parseChangelog(result.text) })
    }).catch(() => { if (!cancelled) setChangelog(false) })
    return () => { cancelled = true }
  }, [githubToken, isConnectedRepo, repo.id, repo.name, repo.owner])

  const fileDecay = liveFileActivity || FILE_DECAY[repo.id] || generateDecay(repo)
  const fileActivityMode = liveFileActivity?.length
    ? 'live'
    : hasCatalogedDecay
    ? 'demo'
    : fileActivityState.loading
    ? 'loading'
    : fileActivityState.error
    ? 'fallback'
    : 'estimated'
  const lineColumnLabel = fileActivityMode === 'live' ? 'Δ lines' : 'LOC'

  return (
    <>
      <div className="pageheader">
        <div>
          <div className="crumb" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span onClick={onBack} style={{ cursor: 'default', color: 'var(--fg-2)' }}>← {voice.morgue}</span>
            <span>/</span>
            <span>CASE #{repo.id.toUpperCase()}</span>
          </div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="lang-dot" style={{ background: repo.langColor, width: 12, height: 12 }} />
            {repo.owner}/{repo.name}
            <StatePill state={repo.state} voice={voice} />
          </h1>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div className="crumb" style={{ marginBottom: 6 }}>
            {isDead ? 'rhythm: asystole' : 'rhythm: nominal'}
          </div>
          <EkgLine alive={!isDead} width={260} height={36} />
        </div>
      </div>

      <div style={{ padding: '14px 32px', display: 'flex', gap: 8, borderBottom: '1px solid var(--line)', background: 'var(--bg-1-solid)' }}>
        {isDead && repo.state === 'flatlined' && (
          <button className="btn danger" onClick={() => onAction('declare', repo.id)}>{voice.declareDead}</button>
        )}
        {isDead && (
          <button className="btn primary" onClick={() => onAction('reanimate', repo.id)}>{voice.reanimate}</button>
        )}
        {isDead && (
          <button className="btn" onClick={() => onAction('certificate', repo.id)}>⎙ Death certificate</button>
        )}
        {repo.url && (
          <button className="btn ghost" onClick={() => openRepoUrl(repo.url)}>View on GitHub ↗</button>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)', alignItems: 'center' }}>
          <span>★ {repo.stars}</span>
          <span>⑂ {repo.forks}</span>
          <span>◯ {repo.issues} issues</span>
          <span>⇄ {formatMetric(repo.prs)} PRs</span>
          <span>{repo.license}</span>
        </div>
      </div>

      <div className="autopsy">
        <div className="autopsy-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 24 }}>
            {(repo.causes?.length > 0 || repo.cause) && (
              <DifferentialDiagnosis repo={repo} voice={voice} />
            )}

            <div>
              <h2>{voice.lastWords}</h2>
              <div className="last-words">{repo.lastWords || 'No commit message available.'}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)', marginTop: 8 }}>
                committed {formatDate(repo.lastCommit)} · {relTime(repo.lastCommit)}
              </div>
            </div>

            <div>
              <h2>{voice.timeline}</h2>
              <CommitTimeline repo={repo} />
            </div>

            {(changelog === null || changelog) && (
              <ChangelogPanel changelog={changelog} />
            )}

            <div>
              <h2>{voice.fileDecay}</h2>
              <div className="panel">
                <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--line)',
                              fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)' }}>
                  {fileActivityMode === 'live'
                    ? `Derived from the most recent ${fileActivityState.sampledCommits} GitHub commit${fileActivityState.sampledCommits === 1 ? '' : 's'}. "Δ lines" reflects sampled changed lines, not full-file LOC.`
                    : fileActivityMode === 'demo'
                    ? 'Captured from the demo dataset.'
                    : fileActivityMode === 'loading'
                    ? 'Loading recent file history from GitHub…'
                    : fileActivityMode === 'fallback'
                    ? 'Recent file history could not be fetched from GitHub. Showing a state-based estimate instead.'
                    : 'Estimated from repository state and last activity. File-level history is unavailable for this repo.'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 110px 80px', gap: 12,
                              padding: '8px 16px', borderBottom: '1px solid var(--line)',
                              fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.10em', textTransform: 'uppercase',
                              color: 'var(--fg-3)' }}>
                  <span>Path</span>
                  <span style={{ textAlign: 'right' }}>{lineColumnLabel}</span>
                  <span>Last touched</span>
                  <span>Decay</span>
                </div>
                {fileDecay.map(f => (
                  <div key={f.path} className="decay-row">
                    <span className="path">{f.path}</span>
                    <span className="loc">{f.loc}</span>
                    <span className="when">{relTime(f.lastTouched)}</span>
                    <span className="bar"><i style={{ width: `${f.decay * 100}%`, opacity: 0.4 + f.decay * 0.6 }} /></span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 24 }}>
            <div className="panel">
              <div className="panel-hd">
                <span>Final Vitals</span>
                <span className="index">@ time of death</span>
              </div>
              <div style={{ padding: '14px 18px' }}>
                <div className="field"><span className="k">Heartbeat</span><span className="v">
                  {repo.vitals === 0 ? <span style={{ color: 'var(--crit)' }}>0 BPM · flat</span> :
                   <span style={{ color: repo.vitals < 25 ? 'var(--crit)' : repo.vitals < 50 ? 'var(--warn)' : 'var(--vital)' }}>
                     {repo.vitals} / 100
                   </span>}
                </span></div>
                <div className="field"><span className="k">{voice.lifespan}</span><span className="v">{repo.lifespan}</span></div>
                <div className="field"><span className="k">First commit</span><span className="v">{formatDate(repo.firstCommit)}</span></div>
                <div className="field"><span className="k">Last commit</span><span className="v">{formatDate(repo.lastCommit)}</span></div>
                {repo.timeOfDeath && (
                  <div className="field"><span className="k">Time of death</span><span className="v" style={{ color: 'var(--crit)' }}>{formatDate(repo.timeOfDeath)}</span></div>
                )}
                {repo.declared && (
                  <div className="field"><span className="k">Declared dead</span><span className="v">{formatDate(repo.declared)}</span></div>
                )}
                {repo.revivedAt && (
                  <div className="field"><span className="k">Revived</span><span className="v" style={{ color: 'var(--revive)' }}>{formatDate(repo.revivedAt)}</span></div>
                )}
                <div className="field"><span className="k">Total commits</span><span className="v">{formatMetric(repo.commitsTotal)}</span></div>
                <div className="field"><span className="k">Contributors</span><span className="v">{formatMetric(repo.contributors)}</span></div>
                <div className="field" style={{ borderBottom: 'none' }}><span className="k">Branches</span><span className="v">{formatMetric(repo.branches)}</span></div>
              </div>
            </div>

            {languages && <LanguagesPanel languages={languages} />}

            <div className="panel">
              <div className="panel-hd">
                <span>{voice.toxicology}</span>
                <span className="index">
                  {repo.deps == null
                    ? 'unavailable for live sync'
                    : repo.depsOutdated == null
                    ? `${repo.deps} declared · outdated unknown`
                    : `${repo.deps} total · ${repo.depsOutdated} outdated`}
                </span>
              </div>
              <div style={{ padding: '14px 18px' }}>
                <DepsBar total={repo.deps} outdated={repo.depsOutdated} />
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)', marginTop: 10, lineHeight: 1.6 }}>
                  {repo.deps == null ? 'Dependency data is not collected from the GitHub API in the live view.' :
                   repo.depsOutdated == null ? `Declared dependency count parsed from ${repo.depsSource || 'repository manifest'}. Outdated-package analysis is not implemented yet.` :
                   repo.depsOutdated > 20 ? 'Toxicology suggests significant rot.' :
                   repo.depsOutdated > 5 ? 'Mild dependency degradation detected.' :
                   repo.depsOutdated > 0 ? 'Minor outdated packages. Survivable.' :
                   'Dependencies clean. Cause of death likely behavioral.'}
                </div>
              </div>
            </div>

            {repo.survivedBy && repo.survivedBy.length > 0 && (
              <div className="panel">
                <div className="panel-hd">
                  <span>{voice.survivedBy}</span>
                  <span className="index">{repo.survivedBy.length}</span>
                </div>
                <div>
                  {repo.survivedBy.map((s, i) => (
                    <div key={i} style={{ padding: '10px 16px', borderBottom: i < repo.survivedBy.length - 1 ? '1px solid var(--line)' : 'none',
                                          fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-1)' }}>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function CommitTimeline({ repo }) {
  const start = new Date(repo.firstCommit)
  const end = new Date(repo.lastCommit)
  const now = new Date()
  const totalMonths = Math.max(1, Math.round((now - start) / (1000 * 60 * 60 * 24 * 30)))
  const livingMonths = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24 * 30)))
  const activity = Array.isArray(repo.sparkline) && repo.sparkline.length > 0 ? repo.sparkline : []

  const months = []
  for (let i = 0; i < totalMonths; i++) {
    if (activity.length > 0 && i < activity.length) {
      months.push(activity[i])
    } else if (i >= livingMonths + 1) {
      months.push(0)
    } else {
      const phase = i / Math.max(1, livingMonths)
      const baseline = repo.commitsTotal != null ? repo.commitsTotal / livingMonths : 3
      const peak = Math.max(2, Math.round(baseline * (1 - Math.pow(phase, 1.4)) * 1.6))
      const jitter = Math.round(Math.sin(i * 1.7) * 3 + Math.cos(i * 0.9) * 2)
      months.push(Math.max(0, peak + jitter))
    }
  }
  const max = Math.max(...months, 1)
  const tod = livingMonths

  return (
    <div className="panel" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 80, position: 'relative' }}>
        {months.map((m, i) => (
          <div key={i} title={m + ' commits'}
               style={{ flex: 1, height: `${(m / max) * 100}%`, minHeight: m > 0 ? 2 : 1,
                        background: i >= tod ? 'var(--bg-3)' : i > tod - 3 ? 'var(--warn-dim)' : 'var(--vital-dim)',
                        opacity: i >= tod ? 0.5 : 1,
                        boxShadow: i < tod ? '0 0 4px oklch(0.78 0.16 152 / 0.2)' : 'none' }} />
        ))}
        {repo.timeOfDeath && tod < months.length && (
          <div style={{ position: 'absolute', left: `${(tod / months.length) * 100}%`, top: -4, bottom: 0,
                        borderLeft: '1px dashed var(--crit)' }}>
            <div style={{ position: 'absolute', top: -10, left: 4, fontFamily: 'var(--mono)', fontSize: 9,
                          color: 'var(--crit)', whiteSpace: 'nowrap', letterSpacing: '0.06em' }}>
              † TOD
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12,
                    fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)', letterSpacing: '0.04em' }}>
        <span>{formatDate(repo.firstCommit)}</span>
        <span>{repo.commitsTotal == null ? `${months.length} months observed` : `${repo.commitsTotal} commits · ${months.length} months observed`}</span>
        <span>{formatDate(now)}</span>
      </div>
    </div>
  )
}

function DepsBar({ total, outdated }) {
  if (total == null) {
    return (
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)' }}>
        No dependency inventory available.
      </div>
    )
  }

  if (outdated == null) {
    return (
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)' }}>
        {total} declared dependency{total === 1 ? '' : 'ies'} found. Outdated-package analysis is unavailable.
      </div>
    )
  }

  const segments = []
  for (let i = 0; i < total; i++) {
    segments.push(
      <span key={i} style={{ flex: 1,
        background: i < outdated ? 'var(--crit)' : 'var(--vital-dim)',
        opacity: i < outdated ? 0.85 : 0.5, height: 8, minWidth: 1, marginRight: 1, borderRadius: 1 }} />
    )
  }
  const ok = total - outdated
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 1, marginBottom: 8 }}>{segments}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--mono)', fontSize: 10 }}>
        <span style={{ color: 'var(--vital)' }}>● {ok} current</span>
        <span style={{ color: 'var(--crit)' }}>● {outdated} outdated</span>
      </div>
    </div>
  )
}

function formatMetric(value) {
  return value == null ? '—' : value
}

function openRepoUrl(url) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

function DifferentialDiagnosis({ repo, voice }) {
  // Normalize: use causes array if present, else fall back to legacy single cause
  const causes = repo.causes?.length > 0
    ? repo.causes
    : repo.cause ? [{ label: repo.cause, confidence: null, detail: repo.causeDetail }] : []

  if (causes.length === 0) return null

  const primary = causes[0]
  const secondary = causes.slice(1)

  return (
    <div className="cause-block">
      <div className="label">{voice.cause}</div>

      {/* Primary cause */}
      <div style={{ marginBottom: secondary.length > 0 ? 16 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
          <div className="cause" style={{ margin: 0 }}>{primary.label}</div>
          {primary.confidence != null && (
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--crit)',
                          letterSpacing: '0.04em' }}>
              {primary.confidence}% confidence
            </div>
          )}
        </div>
        {primary.confidence != null && (
          <div style={{ height: 3, background: 'var(--bg-3)', borderRadius: 2, marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${primary.confidence}%`,
                          background: 'var(--crit)', borderRadius: 2,
                          boxShadow: '0 0 6px oklch(0.65 0.20 25 / 0.5)',
                          transition: 'width 800ms ease' }} />
          </div>
        )}
        {primary.detail && (
          <div className="detail" style={{ margin: 0 }}>{primary.detail}</div>
        )}
      </div>

      {/* Contributing factors */}
      {secondary.length > 0 && (
        <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14, marginTop: 4 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em',
                        textTransform: 'uppercase', color: 'var(--fg-3)', marginBottom: 10 }}>
            Contributing factors
          </div>
          {secondary.map((c, i) => (
            <div key={i} style={{ marginBottom: i < secondary.length - 1 ? 12 : 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--fg-1)', flex: 1 }}>
                  {c.label}
                </span>
                {c.confidence != null && (
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
                                 minWidth: 40, textAlign: 'right' }}>
                    {c.confidence}%
                  </span>
                )}
              </div>
              {c.confidence != null && (
                <div style={{ height: 2, background: 'var(--bg-3)', borderRadius: 1, marginBottom: 4 }}>
                  <div style={{ height: '100%', width: `${c.confidence}%`,
                                background: 'var(--fg-3)', borderRadius: 1,
                                transition: 'width 800ms ease 200ms' }} />
                </div>
              )}
              {c.detail && (
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
                               lineHeight: 1.5 }}>
                  {c.detail}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LanguagesPanel({ languages }) {
  const entries = Object.entries(languages).sort((a, b) => b[1] - a[1])
  const total = entries.reduce((s, [, b]) => s + b, 0)
  if (total === 0) return null

  const TOP = 8
  const shown = entries.slice(0, TOP)
  const otherBytes = entries.slice(TOP).reduce((s, [, b]) => s + b, 0)
  const rows = otherBytes > 0 ? [...shown, ['Other', otherBytes]] : shown

  return (
    <div className="panel">
      <div className="panel-hd">
        <span>Languages</span>
        <span className="index">{entries.length} detected</span>
      </div>
      <div style={{ padding: '14px 18px' }}>
        {/* Stacked bar */}
        <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden', marginBottom: 14, gap: 1 }}>
          {rows.map(([lang, bytes]) => {
            const pct = (bytes / total) * 100
            const color = lang === 'Other' ? 'var(--bg-4)' : (LANG_COLORS[lang] || '#555555')
            return (
              <div key={lang} title={`${lang} ${pct.toFixed(1)}%`}
                   style={{ width: `${pct}%`, background: color, minWidth: pct > 0.5 ? 2 : 0 }} />
            )
          })}
        </div>

        {/* Language list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {rows.map(([lang, bytes]) => {
            const pct = (bytes / total) * 100
            const color = lang === 'Other' ? 'var(--fg-4)' : (LANG_COLORS[lang] || '#555555')
            return (
              <div key={lang} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-1)', flex: 1 }}>{lang}</span>
                <div style={{ width: 60, height: 3, background: 'var(--bg-3)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, opacity: 0.8 }} />
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)', minWidth: 36, textAlign: 'right' }}>
                  {pct < 1 ? '<1' : Math.round(pct)}%
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function parseChangelog(text) {
  const lines = text.split('\n')
  const versions = []
  let current = null
  let currentSection = null

  for (const line of lines) {
    // Skip link definitions: [1.0.0]: https://...
    if (/^\[.+\]:\s*https?:\/\//.test(line)) continue

    // Version header: ## [x.y.z] - YYYY-MM-DD or ## [Unreleased] or ## 1.2.3
    if (/^##\s/.test(line) && !/^###/.test(line)) {
      const m = line.match(/^##\s+\[?([^\]]+)\]?(?:\s+-\s+(\d{4}-\d{2}-\d{2}))?/)
      if (m) {
        if (current) versions.push(current)
        current = { version: m[1].trim(), date: m[2] || null, unreleased: /^unreleased$/i.test(m[1].trim()), sections: {} }
        currentSection = null
      }
      continue
    }
    // Section header: ### Added
    if (/^###\s/.test(line) && current) {
      const m = line.match(/^###\s+(.+)/)
      if (m) { currentSection = m[1].trim(); current.sections[currentSection] = current.sections[currentSection] || [] }
      continue
    }
    // Bullet item
    const bullet = line.match(/^[-*+]\s+(.+)/)
    if (bullet && current && currentSection) { current.sections[currentSection].push(bullet[1].trim()); continue }
    // Indented continuation
    if (/^\s{2,}\S/.test(line) && current && currentSection) {
      const s = current.sections[currentSection]
      if (s?.length) s[s.length - 1] += ' ' + line.trim()
    }
  }
  if (current) versions.push(current)
  return versions
}

const SECTION_COLORS = {
  Added:      'oklch(0.78 0.16 152)',
  Changed:    'oklch(0.82 0.14 80)',
  Fixed:      'oklch(0.72 0.14 220)',
  Removed:    'oklch(0.65 0.20 25)',
  Deprecated: 'oklch(0.75 0.15 55)',
  Security:   'oklch(0.72 0.16 290)',
}

function sectionColor(name) {
  return SECTION_COLORS[name] || 'var(--fg-3)'
}

function ChangelogPanel({ changelog }) {
  const [expanded, setExpanded] = useState(new Set([0]))

  const toggle = (i) => setExpanded(prev => {
    const next = new Set(prev)
    next.has(i) ? next.delete(i) : next.add(i)
    return next
  })

  if (changelog === null) {
    return (
      <div>
        <h2>Changelog</h2>
        <div className="panel" style={{ padding: '14px 18px', fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-3)' }}>
          Fetching changelog…
        </div>
      </div>
    )
  }

  if (!changelog || changelog.versions.length === 0) {
    if (!changelog?.text) return null
    return (
      <div>
        <h2>Changelog</h2>
        <div className="panel" style={{ padding: '14px 18px' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)', marginBottom: 10 }}>
            {changelog.filename} · no structured versions detected
          </div>
          <pre style={{ margin: 0, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-2)',
                        lineHeight: 1.6, whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'hidden',
                        maskImage: 'linear-gradient(to bottom, #fff 60%, transparent)' }}>
            {changelog.text.slice(0, 800)}
          </pre>
        </div>
      </div>
    )
  }

  const { versions, filename } = changelog
  const totalItems = versions.reduce((n, v) => n + Object.values(v.sections).flat().length, 0)

  return (
    <div>
      <h2 style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        Changelog
        <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
          {versions.length} release{versions.length !== 1 ? 's' : ''} · {totalItems} entries · {filename}
        </span>
      </h2>
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {versions.map((v, i) => {
          const open = expanded.has(i)
          const sectionEntries = Object.entries(v.sections)
          const itemCount = sectionEntries.reduce((n, [, items]) => n + items.length, 0)

          return (
            <div key={i} style={{ borderBottom: i < versions.length - 1 ? '1px solid var(--line)' : 'none' }}>
              {/* Version header row */}
              <div onClick={() => toggle(i)} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
                cursor: 'default', background: open ? 'var(--bg-2)' : 'transparent',
                transition: 'background 150ms',
              }}
              onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'var(--bg-1)' }}
              onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'transparent' }}>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: open ? 'var(--fg-0)' : 'var(--fg-1)',
                               fontWeight: open ? 500 : 400, minWidth: 90 }}>
                  {v.unreleased ? <span style={{ color: 'var(--warn)' }}>Unreleased</span> : v.version}
                </span>
                {v.date && (
                  <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)' }}>
                    {v.date}
                  </span>
                )}
                <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {sectionEntries.map(([name, items]) => (
                    <span key={name} style={{
                      fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.08em',
                      textTransform: 'uppercase', color: sectionColor(name),
                      background: `${sectionColor(name)}18`,
                      border: `1px solid ${sectionColor(name)}30`,
                      borderRadius: 3, padding: '1px 6px',
                    }}>
                      {name} {items.length}
                    </span>
                  ))}
                  {itemCount === 0 && (
                    <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-4)' }}>no entries</span>
                  )}
                </div>
                <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-3)', flexShrink: 0 }}>
                  {open ? '▲' : '▼'}
                </span>
              </div>

              {/* Expanded content */}
              {open && sectionEntries.length > 0 && (
                <div style={{ padding: '4px 18px 18px', background: 'var(--bg-2)' }}>
                  {sectionEntries.map(([name, items]) => (
                    <div key={name} style={{ marginTop: 14 }}>
                      <div style={{
                        fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em',
                        textTransform: 'uppercase', color: sectionColor(name), marginBottom: 8,
                      }}>
                        {name}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {items.map((item, j) => (
                          <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
                            <span style={{ color: sectionColor(name), fontSize: 10, flexShrink: 0, opacity: 0.7 }}>—</span>
                            <span style={{ fontFamily: 'var(--sans)', fontSize: 12, color: 'var(--fg-1)', lineHeight: 1.5 }}>
                              {item}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function generateDecay(repo) {
  const paths = [
    'src/index.ts', 'src/main.ts', 'src/utils.ts',
    'src/components/App.tsx', 'src/components/Header.tsx',
    'src/lib/api.ts', 'src/lib/store.ts',
    'README.md', 'package.json', 'tsconfig.json',
  ]
  return paths.map((p, i) => ({
    path: p,
    loc: Math.round(80 + Math.sin(i * 2) * 200 + i * 30),
    lastTouched: repo.lastCommit,
    decay: repo.state === 'alive' ? 0.2 + (i % 3) * 0.1 :
           repo.state === 'fading' ? 0.4 + (i % 4) * 0.1 :
           0.7 + (i % 4) * 0.08,
  }))
}
