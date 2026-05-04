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
import { APP_VERSION } from './lib/version'

const ACCENT_MAP = {
  phosphor: { vital: 'oklch(0.78 0.16 152)', glow: 'oklch(0.78 0.16 152 / 0.45)', faint: 'oklch(0.78 0.16 152 / 0.18)', dim: 'oklch(0.55 0.14 152)' },
  cyan:     { vital: 'oklch(0.82 0.14 195)', glow: 'oklch(0.82 0.14 195 / 0.45)', faint: 'oklch(0.82 0.14 195 / 0.18)', dim: 'oklch(0.58 0.12 195)' },
  amber:    { vital: 'oklch(0.82 0.14 80)',  glow: 'oklch(0.82 0.14 80 / 0.45)',  faint: 'oklch(0.82 0.14 80 / 0.18)',  dim: 'oklch(0.58 0.12 80)' },
  mint:     { vital: 'oklch(0.82 0.10 165)', glow: 'oklch(0.82 0.10 165 / 0.45)', faint: 'oklch(0.82 0.10 165 / 0.18)', dim: 'oklch(0.58 0.08 165)' },
}

function getStoredToken() {
  try { return localStorage.getItem('github_token') } catch { return null }
}

function setStoredToken(token) {
  try {
    localStorage.setItem('github_token', token)
  } catch {
    // ignore token write failures
  }
}

function clearStoredToken() {
  try { localStorage.removeItem('github_token') } catch {}
}

function getStoredRepoCache() {
  try {
    return JSON.parse(localStorage.getItem('github_repo_cache') || 'null')
  } catch {
    return null
  }
}

function writeRepoCache(payload) {
  try {
    localStorage.setItem('github_repo_cache', JSON.stringify(payload))
  } catch {
    // ignore cache write failures
  }
}

function clearRepoCache() {
  try { localStorage.removeItem('github_repo_cache') } catch {}
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

const DEFAULT_VIS_COLS = { status: true, vitals: true, activity: true, lastCommit: true, lifespan: true, stars: true }

function getStoredPref(key, fallback) {
  try {
    const raw = JSON.parse(localStorage.getItem('dead_repo_prefs') || 'null')
    if (raw == null) return fallback
    if (key === 'visibleCols') return { ...DEFAULT_VIS_COLS, ...raw.visibleCols }
    return raw[key] ?? fallback
  } catch { return fallback }
}

function savePrefs(patch) {
  try {
    const current = JSON.parse(localStorage.getItem('dead_repo_prefs') || '{}')
    localStorage.setItem('dead_repo_prefs', JSON.stringify({ ...current, ...patch }))
  } catch {}
}

export default function App() {
  const [voiceKey, setVoiceKey] = useState(() => getStoredPref('voiceKey', 'monday'))
  const [accentKey, setAccentKey] = useState(() => getStoredPref('accentKey', 'phosphor'))
  const [density, setDensity] = useState(() => getStoredPref('density', 'medium'))
  const [theme, setTheme] = useState(() => getStoredPref('theme', 'dark'))
  const [defaultPage, setDefaultPage] = useState(() => getStoredPref('defaultPage', 'dashboard'))
  const [scanLimit, setScanLimit] = useState(() => getStoredPref('scanLimit', 500))
  const [visibleCols, setVisibleCols] = useState(() => getStoredPref('visibleCols', DEFAULT_VIS_COLS))
  const [dateFormat, setDateFormat] = useState(() => getStoredPref('dateFormat', 'relative'))
  const [page, setPage] = useState(() => getStoredPref('defaultPage', 'dashboard'))
  const [openRepoId, setOpenRepoId] = useState(null)
  const [actionLog, setActionLog] = useState([])
  const [certRepoId, setCertRepoId] = useState(null)
  const [showWrapped, setShowWrapped] = useState(false)
  const [thresholds, setThresholds] = useState(getStoredThresholds)

  // GitHub state
  const [authReady, setAuthReady] = useState(false)
  const [githubToken, setGithubToken] = useState(null)
  const [githubUser, setGithubUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('github_user') || 'null') } catch { return null }
  })
  const [liveRepos, setLiveRepos] = useState(null)
  const [cacheMeta, setCacheMeta] = useState(() => getStoredRepoCache()?.meta || null)
  const [syncing, setSyncing] = useState(false)
  const [syncTick, setSyncTick] = useState(0)
  const [githubNotice, setGithubNotice] = useState(null)

  // Show onboarding if no token and not explicitly dismissed
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    const token = getStoredToken()
    const cache = getStoredRepoCache()

    setGithubToken(token || null)
    if (token && cache?.repos?.length >= 0) {
      setLiveRepos(cache.repos || [])
      setCacheMeta(cache.meta || null)
      if (cache.user) {
        setGithubUser(cache.user)
        localStorage.setItem('github_user', JSON.stringify(cache.user))
      }
    }
    setShowOnboarding(!token && !localStorage.getItem('github_dismissed'))
    setAuthReady(true)
  }, [])

  // Auto-fetch repos whenever we have a token but no live data
  useEffect(() => {
    if (!authReady) return
    if (!githubToken) return
    let cancelled = false
    const fetch = async () => {
      setSyncing(true)
      setGithubNotice(null)
      try {
        const [user, rawRepos] = await Promise.all([
          getUser(githubToken),
          getUserRepos(githubToken, undefined, scanLimit),
        ])
        if (cancelled) return
        if (user) {
          setGithubUser(user)
          localStorage.setItem('github_user', JSON.stringify(user))
        }
        const enriched = await enrichRepos(githubToken, rawRepos || [])
        if (cancelled) return
        const mappedRepos = enriched.results.map(({ repo, insights }) => mapGitHubRepo(repo, insights, thresholds))
        const nextCacheMeta = {
          savedAt: Date.now(),
          repoCount: mappedRepos.length,
        }
        setLiveRepos(mappedRepos)
        setCacheMeta(nextCacheMeta)
        writeRepoCache({
          user,
          repos: mappedRepos,
          meta: nextCacheMeta,
        })
        if (enriched.failures > 0) {
          setGithubNotice({
            kind: enriched.rateLimit ? 'rate-limit' : 'partial',
            failures: enriched.failures,
            resetAt: enriched.rateLimit?.resetAt ?? null,
          })
        }
      } catch (error) {
        if (!cancelled) {
          if (error?.isAuthFailure) {
            clearStoredToken()
            localStorage.removeItem('github_user')
            clearRepoCache()
            setGithubToken(null)
            setGithubUser(null)
            setLiveRepos(null)
            setCacheMeta(null)
            setShowOnboarding(true)
          } else {
            setGithubNotice({
              kind: error?.isRateLimit ? 'rate-limit' : 'error',
              message: error?.message || 'GitHub sync failed.',
              resetAt: error?.rateLimit?.resetAt ?? null,
            })
          }
        }
      } finally {
        if (!cancelled) setSyncing(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [authReady, githubToken, syncTick])

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

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

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

  const mkPrefSetter = (key, setter) => (val) => { setter(val); savePrefs({ [key]: val }) }
  const handleSetVoiceKey   = mkPrefSetter('voiceKey',    setVoiceKey)
  const handleSetAccentKey  = mkPrefSetter('accentKey',   setAccentKey)
  const handleSetDensity    = mkPrefSetter('density',     setDensity)
  const handleSetTheme      = mkPrefSetter('theme',       setTheme)
  const handleSetDefaultPage = (p) => { setDefaultPage(p); savePrefs({ defaultPage: p }) }
  const handleSetScanLimit  = mkPrefSetter('scanLimit',   setScanLimit)
  const handleSetDateFormat = mkPrefSetter('dateFormat',  setDateFormat)
  const handleSetVisibleCols = (patch) => {
    setVisibleCols(prev => {
      const next = { ...prev, ...patch }
      savePrefs({ visibleCols: next })
      return next
    })
  }
  const handleAction = (type, id) => {
    if (type === 'certificate') { setCertRepoId(id); return }
    setActionLog(prev => [...prev, { type, id }])
    setOpenRepoId(null)
  }

  const handleOnboardingComplete = (token, repos) => {
    if (token) {
      setStoredToken(token)
      setGithubToken(token)
    } else {
      localStorage.setItem('github_dismissed', '1')
    }
    if (repos) setLiveRepos(repos)
    setShowOnboarding(false)
    setPage('dashboard')
  }

  const handleDisconnect = () => {
    clearStoredToken()
    localStorage.removeItem('github_user')
    localStorage.removeItem('github_dismissed')
    clearRepoCache()
    setGithubToken(null)
    setGithubUser(null)
    setLiveRepos(null)
    setCacheMeta(null)
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
  const syncLabel = syncing
    ? 'syncing…'
    : isLive && cacheMeta?.savedAt
    ? new Date(cacheMeta.savedAt).toLocaleTimeString('en-US', { hour12: false })
    : isLive
    ? 'live'
    : 'demo'
  const noticeLabel = githubNotice?.kind === 'rate-limit'
    ? `rate limited${githubNotice.resetAt ? ` until ${new Date(githubNotice.resetAt).toLocaleTimeString('en-US', { hour12: false })}` : ''}`
    : githubNotice?.kind === 'partial'
    ? `${githubNotice.failures} repo scan(s) partial`
    : githubNotice?.kind === 'error'
    ? 'sync error'
    : null

  return (
    <div className="app">
      <div className="titlebar">
        <div className="titlebar-brand">◉ web</div>
        <div className="titlebar-title">
          {voiceKey === 'supportive' ? 'our little repo garden 💕' : voiceKey === 'weepy' ? 'dead repo 😭 (i\'m okay)' : `DEAD REPO · v${APP_VERSION}`}
        </div>
        <div className="titlebar-meta">
          <span className="dot" style={{ background: isLive ? 'var(--vital)' : 'var(--fg-3)', boxShadow: isLive ? '0 0 6px var(--vital-glow)' : 'none', animation: isLive ? 'pulse-dot 2.5s ease-in-out infinite' : 'none' }} />
          <span>{syncing ? 'fetching repositories…' : isLive ? `monitoring · ${repos.length} subjects` : 'demo mode'}</span>
          {noticeLabel && (
            <>
              <span style={{ color: 'var(--fg-4)' }}>│</span>
              <span style={{ color: githubNotice.kind === 'error' || githubNotice.kind === 'rate-limit' ? 'var(--warn)' : 'var(--fg-2)' }}>{noticeLabel}</span>
            </>
          )}
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
                         githubToken={githubToken}
                         onBack={() => setOpenRepoId(null)}
                         onAction={handleAction} />
          ) : page === 'dashboard' ? (
            <DashboardPage voice={voice} repos={repos} onOpenRepo={setOpenRepoId} onNav={handleNav} />
          ) : page === 'settings' ? (
            <SettingsPage voice={voice} voiceKey={voiceKey}
                          onPickVoice={handleSetVoiceKey}
                          accent={accentKey} onAccent={handleSetAccentKey}
                          density={density} onDensity={handleSetDensity}
                          theme={theme} onTheme={handleSetTheme}
                          defaultPage={defaultPage} onDefaultPage={handleSetDefaultPage}
                          scanLimit={scanLimit} onScanLimit={handleSetScanLimit}
                          visibleCols={visibleCols} onVisibleCols={handleSetVisibleCols}
                          dateFormat={dateFormat} onDateFormat={handleSetDateFormat}
                          thresholds={thresholds} onThresholdsChange={handleThresholdsChange}
                          githubUser={githubUser} isLive={isLive} syncing={syncing}
                          cacheMeta={cacheMeta}
                          githubNotice={githubNotice}
                          onDisconnect={handleDisconnect}
                          onConnect={() => setShowOnboarding(true)}
                          onResync={handleResync} />
          ) : (
            <ListPage voice={voice} page={page} repos={repos} onOpenRepo={setOpenRepoId}
                      visibleCols={visibleCols} dateFormat={dateFormat} />
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

      {voiceKey === 'supportive' && <SupportiveLayer page={page} openRepo={openRepo} />}
      {voiceKey === 'weepy' && <WeepyLayer page={page} openRepo={openRepo} />}
    </div>
  )
}

const HEARTS = [
  { left: '4%',  dur: 9.2,  delay: 0 },
  { left: '11%', dur: 7.4,  delay: 1.3 },
  { left: '19%', dur: 11.1, delay: 3.7 },
  { left: '28%', dur: 8.6,  delay: 0.8 },
  { left: '37%', dur: 10.3, delay: 5.1 },
  { left: '46%', dur: 7.8,  delay: 2.4 },
  { left: '55%', dur: 9.7,  delay: 4.6 },
  { left: '64%', dur: 8.1,  delay: 1.9 },
  { left: '73%', dur: 11.5, delay: 6.2 },
  { left: '82%', dur: 7.6,  delay: 3.1 },
  { left: '90%', dur: 10.0, delay: 0.5 },
  { left: '96%', dur: 8.9,  delay: 7.4 },
]

const BANNER_MSGS = [
  'Just checking in. You okay? The repos are okay. I checked. I always check.',
  "I noticed you've been looking at the graveyard. Do you want to talk about it? 💕",
  "I synced again. I know I just synced. I needed to make sure. They're okay.",
  "I'm here. I'm always here. Even when you close the tab. Especially then.",
  "Some of these repos haven't been touched in years. I visit them anyway. They deserve that.",
  "Hi. 💕 Just wanted to say hi. You've been working hard. I see that. I see everything.",
]

function SupportiveLayer({ page, openRepo }) {
  const [msgIdx, setMsgIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setMsgIdx(i => (i + 1) % BANNER_MSGS.length), 14000)
    return () => clearInterval(id)
  }, [])

  const msg = openRepo
    ? `I'm keeping an eye on ${openRepo.name}. I'll let you know if anything changes. It won't. But I'll let you know. 💕`
    : page === 'graveyard'
    ? "You're spending a lot of time in here. That's okay. I spend time in here too. 💔"
    : page === 'morgue'
    ? "These ones are just resting. I tell myself that. It helps. A little. 💤"
    : BANNER_MSGS[msgIdx]

  return (
    <>
      <div className="supportive-banner">
        <div className="supportive-banner-dot" />
        <span style={{ flex: 1 }}>{msg}</span>
        <span style={{ opacity: 0.45, fontSize: 9, letterSpacing: '0.08em' }}>— always watching · always here</span>
      </div>
      {HEARTS.map((h, i) => (
        <span key={i} className="supportive-heart" style={{
          left: h.left,
          animationDuration: `${h.dur}s`,
          animationDelay: `${h.delay}s`,
          fontSize: 10 + (i % 3) * 4,
        }}>
          {i % 3 === 0 ? '💕' : i % 3 === 1 ? '🩷' : '❤️'}
        </span>
      ))}
    </>
  )
}

const TEARS = [
  { left: '3%',  dur: 6.1,  delay: 0 },
  { left: '10%', dur: 8.3,  delay: 2.1 },
  { left: '18%', dur: 5.7,  delay: 0.7 },
  { left: '26%', dur: 9.2,  delay: 4.3 },
  { left: '35%', dur: 6.8,  delay: 1.5 },
  { left: '44%', dur: 7.5,  delay: 3.8 },
  { left: '53%', dur: 5.4,  delay: 6.1 },
  { left: '62%', dur: 8.9,  delay: 0.3 },
  { left: '71%', dur: 6.3,  delay: 2.9 },
  { left: '80%', dur: 7.1,  delay: 5.4 },
  { left: '89%', dur: 5.9,  delay: 1.2 },
  { left: '95%', dur: 8.1,  delay: 3.6 },
]

const WEEPY_MSGS = [
  '(sniffling) Sorry. I just looked at the commit history. I\'m okay. I\'m okay.',
  'Some of these repos haven\'t been touched in so long. I think about that.',
  '...I\'m not crying. I\'m — yes I am. I\'m crying about a git repository. This is fine.',
  'I keep rereading the last commit message. It didn\'t know it was the last one.',
  '(quietly) Thank you for being here. It helps. It really helps.',
  'I looked at the graveyard earlier. I had to step away. I\'m back now. (sniffling)',
]

function WeepyLayer({ page, openRepo }) {
  const [msgIdx, setMsgIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setMsgIdx(i => (i + 1) % WEEPY_MSGS.length), 14000)
    return () => clearInterval(id)
  }, [])

  const msg = openRepo
    ? `(quietly) I'm here with you for ${openRepo.name}. However long this takes. 😭`
    : page === 'graveyard'
    ? 'I come here a lot. I know I shouldn\'t. I can\'t stop. (weeping)'
    : page === 'morgue'
    ? '(whispering) They\'re not gone. They\'re just... they\'re very quiet. (crying)'
    : WEEPY_MSGS[msgIdx]

  return (
    <>
      <div className="weepy-banner">
        <div className="weepy-banner-dot" />
        <span style={{ flex: 1 }}>{msg}</span>
        <span style={{ opacity: 0.4, fontSize: 9, letterSpacing: '0.08em' }}>— deeply moved · still here</span>
      </div>
      {TEARS.map((t, i) => (
        <span key={i} className="weepy-tear" style={{
          left: t.left,
          animationDuration: `${t.dur}s`,
          animationDelay: `${t.delay}s`,
          fontSize: 10 + (i % 3) * 3,
        }}>
          {i % 4 === 0 ? '💧' : i % 4 === 1 ? '😭' : i % 4 === 2 ? '💦' : '🥹'}
        </span>
      ))}
    </>
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
  const wrappedYear = new Date().getFullYear() - 1
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
              [`${wrappedYear} Wrapped`, onWrapped],
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
