import { useState, useEffect, useMemo } from 'react'
import { REPOS } from './data/repos'
import { VOICES } from './data/voices'
import { DashboardPage } from './pages/dashboard'
import { ListPage } from './pages/list'
import { AutopsyPage } from './pages/autopsy'
import { SettingsPage } from './pages/settings'
import { OnboardingFlow } from './pages/onboarding'
import { CertificateModal } from './pages/certificate'
import { WrappedFlow } from './pages/wrapped'
import { enrichRepos, getUser, getUserRepos } from './lib/github'
import { mapGitHubRepo, reclassifyMappedRepo } from './lib/classify'

const ACCENT_MAP = {
  phosphor: { vital: 'oklch(0.78 0.16 152)', glow: 'oklch(0.78 0.16 152 / 0.45)', faint: 'oklch(0.78 0.16 152 / 0.18)', dim: 'oklch(0.55 0.14 152)' },
  cyan:     { vital: 'oklch(0.82 0.14 195)', glow: 'oklch(0.82 0.14 195 / 0.45)', faint: 'oklch(0.82 0.14 195 / 0.18)', dim: 'oklch(0.58 0.12 195)' },
  amber:    { vital: 'oklch(0.82 0.14 80)',  glow: 'oklch(0.82 0.14 80 / 0.45)',  faint: 'oklch(0.82 0.14 80 / 0.18)',  dim: 'oklch(0.58 0.12 80)' },
  mint:     { vital: 'oklch(0.82 0.10 165)', glow: 'oklch(0.82 0.10 165 / 0.45)', faint: 'oklch(0.82 0.10 165 / 0.18)', dim: 'oklch(0.58 0.08 165)' },
}

function getStoredToken() {
  try { return localStorage.getItem('github_token') } catch { return null }
}

function getStoredThresholds() {
  try {
    const parsed = JSON.parse(localStorage.getItem('triage_thresholds') || 'null')
    if (!parsed) return { aliveDays: 30, fadingDays: 90, deadDays: 365 }
    return {
      aliveDays: parsed.aliveDays ?? 30,
      fadingDays: parsed.fadingDays ?? 90,
      deadDays: parsed.deadDays ?? 365,
    }
  } catch {
    return { aliveDays: 30, fadingDays: 90, deadDays: 365 }
  }
}

export default function App() {
  const [voiceKey, setVoiceKey] = useState('monday')
  const [accentKey, setAccentKey] = useState('phosphor')
  const [density, setDensity] = useState('medium')
  const [page, setPage] = useState('dashboard')
  const [openRepoId, setOpenRepoId] = useState(null)
  const [actionLog, setActionLog] = useState([])
  const [certRepoId, setCertRepoId] = useState(null)
  const [showWrapped, setShowWrapped] = useState(false)
  const [thresholds, setThresholds] = useState(getStoredThresholds)

  // GitHub state
  const [githubToken, setGithubToken] = useState(getStoredToken)
  const [githubUser, setGithubUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('github_user') || 'null') } catch { return null }
  })
  const [liveRepos, setLiveRepos] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [syncTick, setSyncTick] = useState(0)

  // Show onboarding if no token and not explicitly dismissed
  const [showOnboarding, setShowOnboarding] = useState(
    !getStoredToken() && !localStorage.getItem('github_dismissed')
  )

  // Auto-fetch repos whenever we have a token but no live data
  useEffect(() => {
    if (!githubToken) return
    let cancelled = false
    const fetch = async () => {
      setSyncing(true)
      try {
        const [user, rawRepos] = await Promise.all([
          getUser(githubToken),
          getUserRepos(githubToken),
        ])
        if (cancelled) return
        if (user) {
          setGithubUser(user)
          localStorage.setItem('github_user', JSON.stringify(user))
        }
        const enriched = await enrichRepos(githubToken, rawRepos || [])
        if (cancelled) return
        setLiveRepos(enriched.map(({ repo, insights }) => mapGitHubRepo(repo, insights, thresholds)))
      } catch {
        // token likely expired — clear it and show onboarding
        if (!cancelled) {
          localStorage.removeItem('github_token')
          localStorage.removeItem('github_user')
          setGithubToken(null)
          setGithubUser(null)
          setShowOnboarding(true)
        }
      } finally {
        if (!cancelled) setSyncing(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [githubToken, syncTick])

  const voice = VOICES[voiceKey] || VOICES.neutral
  const accent = ACCENT_MAP[accentKey] || ACCENT_MAP.phosphor

  useEffect(() => {
    const root = document.documentElement
    root.dataset.voice = voiceKey
    if (voiceKey === 'supportive') {
      root.style.setProperty('--vital',       'oklch(0.76 0.22 350)')
      root.style.setProperty('--vital-glow',  'oklch(0.76 0.22 350 / 0.50)')
      root.style.setProperty('--vital-faint', 'oklch(0.76 0.22 350 / 0.18)')
      root.style.setProperty('--vital-dim',   'oklch(0.52 0.18 350)')
    } else {
      root.style.setProperty('--vital',       accent.vital)
      root.style.setProperty('--vital-glow',  accent.glow)
      root.style.setProperty('--vital-faint', accent.faint)
      root.style.setProperty('--vital-dim',   accent.dim)
    }
  }, [voiceKey, accentKey])

  useEffect(() => {
    document.body.dataset.density = density
  }, [density])

  // Base repos: live data if available, else mock
  const baseRepos = useMemo(() => {
    if (!liveRepos) return REPOS
    return liveRepos.map(repo => reclassifyMappedRepo(repo, thresholds))
  }, [liveRepos, thresholds])

  const repos = useMemo(() => {
    return baseRepos.map(r => {
      const a = actionLog.find(x => x.id === r.id)
      if (!a) return r
      const today = new Date().toISOString().slice(0, 10)
      if (a.type === 'declare') return { ...r, state: 'dead', cause: r.cause || 'Declared by user', declared: today, causeDetail: r.causeDetail || 'Pulled from morgue and signed off.' }
      if (a.type === 'reanimate') return { ...r, state: 'reanimated', vitals: 45, revivedAt: today }
      return r
    })
  }, [baseRepos, actionLog])

  const counts = useMemo(() => ({
    alive: repos.filter(r => r.state === 'alive').length,
    fading: repos.filter(r => r.state === 'fading').length,
    flatlined: repos.filter(r => r.state === 'flatlined').length,
    dead: repos.filter(r => r.state === 'dead').length,
    reanimated: repos.filter(r => r.state === 'reanimated').length,
  }), [repos])

  const handleNav = (p) => { setOpenRepoId(null); setPage(p) }
  const handleAction = (type, id) => {
    if (type === 'certificate') { setCertRepoId(id); return }
    setActionLog(prev => [...prev, { type, id }])
    setOpenRepoId(null)
  }

  const handleOnboardingComplete = (token, repos) => {
    if (token) {
      localStorage.setItem('github_token', token)
      setGithubToken(token)
    } else {
      localStorage.setItem('github_dismissed', '1')
    }
    if (repos) setLiveRepos(repos)
    setShowOnboarding(false)
    setPage('dashboard')
  }

  const handleDisconnect = () => {
    localStorage.removeItem('github_token')
    localStorage.removeItem('github_user')
    localStorage.removeItem('github_dismissed')
    setGithubToken(null)
    setGithubUser(null)
    setLiveRepos(null)
    setShowOnboarding(true)
  }

  const handleResync = () => {
    if (!githubToken || syncing) return
    setSyncTick(t => t + 1)
  }

  const handleThresholdsChange = (partial) => {
    setThresholds(prev => {
      const next = { ...prev, ...partial }
      const normalized = {
        aliveDays: Math.max(1, next.aliveDays),
        fadingDays: Math.max(next.aliveDays + 1, next.fadingDays),
        deadDays: Math.max(next.fadingDays + 1, next.deadDays),
      }
      localStorage.setItem('triage_thresholds', JSON.stringify(normalized))
      return normalized
    })
  }

  const openRepo = repos.find(r => r.id === openRepoId)
  const isLive = !!githubToken && !!liveRepos
  const displayUser = githubUser?.login || (githubToken ? 'connected' : 'demo mode')
  const syncLabel = syncing ? 'syncing…' : isLive ? new Date().toLocaleTimeString('en-US', { hour12: false }) : 'demo'

  return (
    <div className="app">
      <div className="titlebar">
        <div className="titlebar-lights" style={{ WebkitAppRegion: 'no-drag' }}>
          <div className="titlebar-light r" onClick={() => window.electronAPI?.close()} title="Close" />
          <div className="titlebar-light y" onClick={() => window.electronAPI?.minimize()} title="Minimize" />
          <div className="titlebar-light g" onClick={() => window.electronAPI?.maximize()} title="Maximize" />
        </div>
        <div className="titlebar-title">
          {voiceKey === 'supportive' ? 'our little repo garden 💕' : 'DEAD REPO · v0.1.0'}
        </div>
        <div className="titlebar-meta" style={{ WebkitAppRegion: 'no-drag' }}>
          <span className="dot" style={{ background: isLive ? 'var(--vital)' : 'var(--fg-3)', boxShadow: isLive ? '0 0 6px var(--vital-glow)' : 'none', animation: isLive ? 'pulse-dot 2.5s ease-in-out infinite' : 'none' }} />
          <span>{syncing ? 'fetching repositories…' : isLive ? `monitoring · ${repos.length} subjects` : 'demo mode'}</span>
          <span style={{ color: 'var(--fg-4)' }}>│</span>
          <span>sync {syncLabel}</span>
        </div>
      </div>

      <div className="main">
        <div className="sidebar">
          <div className="sidebar-section">Triage</div>
          <NavItem glyph="◉" label={voice.dashTitle} active={page === 'dashboard' && !openRepoId} onClick={() => handleNav('dashboard')} />

          <div className="sidebar-section">Wards</div>
          <NavItem glyph="♥" label={voice.ward} count={counts.alive + counts.reanimated} active={page === 'ward' && !openRepoId} onClick={() => handleNav('ward')} />
          <NavItem glyph="↓" label={voice.hospital} count={counts.fading} active={page === 'hospital' && !openRepoId} onClick={() => handleNav('hospital')} />
          <NavItem glyph="—" label={voice.morgue} count={counts.flatlined} active={page === 'morgue' && !openRepoId} onClick={() => handleNav('morgue')} />
          <NavItem glyph="†" label={voice.graveyard} count={counts.dead} active={page === 'graveyard' && !openRepoId} onClick={() => handleNav('graveyard')} />

          <div className="sidebar-section">System</div>
          <NavItem glyph="⚙" label={voice.settings} active={page === 'settings' && !openRepoId} onClick={() => handleNav('settings')} />

          <div style={{ flex: 1 }} />

          <div style={{ padding: '12px 18px', borderTop: '1px solid var(--line)',
                        fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)', letterSpacing: '0.04em' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%',
                             background: isLive ? 'var(--vital)' : 'var(--fg-3)',
                             boxShadow: isLive ? '0 0 6px var(--vital-glow)' : 'none',
                             animation: isLive ? 'pulse-dot 2.5s ease-in-out infinite' : 'none' }} />
              <span>VOICE: {voice.name.toUpperCase()}</span>
            </div>
            <div style={{ marginBottom: 2 }}>
              {isLive ? `github.com/${displayUser}` : 'demo · not connected'}
            </div>
            {!isLive && (
              <button onClick={() => setShowOnboarding(true)}
                      style={{ marginTop: 6, fontFamily: 'var(--mono)', fontSize: 9,
                               color: 'var(--vital)', background: 'transparent', border: '1px solid oklch(0.78 0.16 152 / 0.3)',
                               borderRadius: 3, padding: '3px 8px', cursor: 'default', letterSpacing: '0.06em' }}>
                ↗ connect github
              </button>
            )}
          </div>
        </div>

        <div className="content">
          {openRepoId && openRepo ? (
            <AutopsyPage voice={voice} repo={openRepo}
                         onBack={() => setOpenRepoId(null)}
                         onAction={handleAction} />
          ) : page === 'dashboard' ? (
            <DashboardPage voice={voice} repos={repos} onOpenRepo={setOpenRepoId} onNav={handleNav} />
          ) : page === 'settings' ? (
            <SettingsPage voice={voice} voiceKey={voiceKey}
                          onPickVoice={setVoiceKey}
                          accent={accentKey} onAccent={setAccentKey}
                          density={density} onDensity={setDensity}
                          thresholds={thresholds} onThresholdsChange={handleThresholdsChange}
                          githubUser={githubUser} isLive={isLive} syncing={syncing}
                          onDisconnect={handleDisconnect}
                          onConnect={() => setShowOnboarding(true)}
                          onResync={handleResync} />
          ) : (
            <ListPage voice={voice} page={page} repos={repos} onOpenRepo={setOpenRepoId} />
          )}
        </div>
      </div>

      <DevStrip
        onNav={handleNav}
        onOpenRepo={(id) => setOpenRepoId(id)}
        onOnboarding={() => setShowOnboarding(true)}
        onCert={() => setCertRepoId(repos.find(r => r.state === 'dead')?.id || repos[0]?.id)}
        onWrapped={() => setShowWrapped(true)}
        voiceKey={voiceKey} onVoice={setVoiceKey}
        accentKey={accentKey} onAccent={setAccentKey}
        density={density} onDensity={setDensity}
      />

      {showOnboarding && (
        <OnboardingFlow voice={voice} onComplete={handleOnboardingComplete} />
      )}

      {certRepoId && (
        <CertificateModal repo={repos.find(r => r.id === certRepoId)} voice={voice}
                          onClose={() => setCertRepoId(null)} />
      )}

      {showWrapped && (
        <WrappedFlow voice={voice} voiceKey={voiceKey} repos={repos}
                     onClose={() => setShowWrapped(false)} />
      )}
    </div>
  )
}

function NavItem({ glyph, label, count, active, onClick }) {
  return (
    <div className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      <span className="glyph">{glyph}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {count != null && <span className="count">{count}</span>}
    </div>
  )
}

function DevStrip({ onNav, onOpenRepo, onOnboarding, onCert, onWrapped, voiceKey, onVoice, accentKey, onAccent, density, onDensity }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'fixed', bottom: 12, right: 12, zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
      {open && (
        <div style={{ background: 'rgba(17,21,20,0.95)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8,
                      padding: 16, display: 'flex', flexDirection: 'column', gap: 10, backdropFilter: 'blur(20px)',
                      minWidth: 220, fontFamily: 'var(--mono)', fontSize: 11 }}>
          <div style={{ color: 'var(--fg-3)', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Tweaks · Dead Repo</div>

          <div style={{ color: 'var(--fg-3)', fontSize: 9, letterSpacing: '0.10em', paddingTop: 4 }}>VOICE</div>
          <select value={voiceKey} onChange={e => onVoice(e.target.value)}
                  style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 3,
                           color: 'var(--fg-0)', fontFamily: 'var(--mono)', fontSize: 11, padding: '4px 8px' }}>
            {[['neutral','Neutral'],['monday','Monday (brutal)'],['supportive','Super Supportive'],['surfer','Surfer'],['professional','Professional']].map(([v,l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <div style={{ color: 'var(--fg-3)', fontSize: 9, letterSpacing: '0.10em', paddingTop: 4 }}>ACCENT</div>
          <select value={accentKey} onChange={e => onAccent(e.target.value)}
                  style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 3,
                           color: 'var(--fg-0)', fontFamily: 'var(--mono)', fontSize: 11, padding: '4px 8px' }}>
            {[['phosphor','Phosphor green'],['cyan','Monitor cyan'],['amber','Amber CRT'],['mint','Mint']].map(([v,l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>

          <div style={{ color: 'var(--fg-3)', fontSize: 9, letterSpacing: '0.10em', paddingTop: 4 }}>DENSITY</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {['sparse','medium','dense'].map(d => (
              <button key={d} onClick={() => onDensity(d)}
                      style={{ flex: 1, height: 26, border: '1px solid var(--line)', borderRadius: 3,
                               background: density === d ? 'var(--bg-4)' : 'var(--bg-2)',
                               color: density === d ? 'var(--fg-0)' : 'var(--fg-2)',
                               fontFamily: 'var(--mono)', fontSize: 10, cursor: 'default' }}>{d}</button>
            ))}
          </div>

          <div style={{ color: 'var(--fg-3)', fontSize: 9, letterSpacing: '0.10em', paddingTop: 4 }}>QUICK JUMP</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {[
              ['Dashboard', () => onNav('dashboard')],
              ['Morgue', () => onNav('morgue')],
              ['Graveyard', () => onNav('graveyard')],
              ['Settings', () => onNav('settings')],
              ['Replay onboarding', onOnboarding],
              ['Death certificate', onCert],
              ['2025 Wrapped', onWrapped],
            ].map(([label, fn]) => (
              <button key={label} onClick={fn}
                      style={{ height: 26, border: '1px solid var(--line)', borderRadius: 3,
                               background: 'var(--bg-2)', color: 'var(--fg-1)',
                               fontFamily: 'var(--mono)', fontSize: 10, cursor: 'default',
                               padding: '0 8px', textAlign: 'left' }}>{label}</button>
            ))}
          </div>
        </div>
      )}
      <button onClick={() => setOpen(!open)}
              style={{ height: 32, padding: '0 14px', border: '1px solid rgba(255,255,255,0.15)',
                       borderRadius: 6, background: 'rgba(17,21,20,0.9)', color: 'var(--fg-1)',
                       fontFamily: 'var(--mono)', fontSize: 11, cursor: 'default',
                       backdropFilter: 'blur(20px)' }}>
        {open ? '✕ close' : '⚙ tweaks'}
      </button>
    </div>
  )
}
