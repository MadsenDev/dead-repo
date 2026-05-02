import { useState, useEffect, useRef } from 'react'
import { EkgLine } from '../components/shared'
import { getRepoInsights, getUser, getUserRepos } from '../lib/github'
import { mapGitHubRepo } from '../lib/classify'
import { APP_VERSION } from '../lib/version'

export function OnboardingFlow({ voice, onComplete }) {
  const [stage, setStage] = useState('welcome')
  const [token, setToken] = useState(null)
  const [scannedRepos, setScannedRepos] = useState(null)

  const handleConnect = (t) => {
    setToken(t)
    setStage('scanning')
  }

  const handleScanDone = (repos) => {
    setScannedRepos(repos)
    setStage('reveal')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  zIndex: 100, overflow: 'hidden' }}>
      {stage === 'welcome' && <WelcomeScreen onNext={() => setStage('connect')} />}
      {stage === 'connect' && <ConnectScreen onConnect={handleConnect} onSkip={() => onComplete(null, null)} />}
      {stage === 'scanning' && <ScanningScreen token={token} onDone={handleScanDone} />}
      {stage === 'reveal' && <RevealScreen voice={voice} repos={scannedRepos} onNext={() => onComplete(token, scannedRepos)} />}
    </div>
  )
}

// ── Welcome ──────────────────────────────────────────
function WelcomeScreen({ onNext }) {
  return (
    <div style={{ textAlign: 'center', maxWidth: 560, padding: 40 }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
        <EkgLine alive={true} width={420} height={56} />
      </div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.20em',
                    color: 'var(--vital)', textTransform: 'uppercase', marginBottom: 16 }}>
        {`Dead Repo · v${APP_VERSION}`}
      </div>
      <h1 style={{ fontSize: 38, fontWeight: 300, letterSpacing: '-0.02em', margin: '0 0 16px',
                   color: 'var(--fg-0)' }}>
        Some of your repositories are dead.
      </h1>
      <p style={{ fontSize: 15, color: 'var(--fg-2)', lineHeight: 1.6, margin: '0 0 32px' }}>
        Dead Repo monitors the vital signs of every project on your GitHub account.
        We classify, autopsy, and &mdash; when appropriate &mdash; issue death certificates.
      </p>
      <p style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--fg-3)',
                  letterSpacing: '0.04em', margin: '0 0 40px' }}>
        This will take about thirty seconds. It will not be flattering.
      </p>
      <button className="btn primary" onClick={onNext}
              style={{ height: 38, padding: '0 22px', fontSize: 12 }}>
        Begin intake
      </button>
    </div>
  )
}

// ── Connect ───────────────────────────────────────────
function ConnectScreen({ onConnect, onSkip }) {
  const [status, setStatus] = useState('idle') // idle | waiting | error
  const [errorMsg, setErrorMsg] = useState('')

  const handleAuthorize = async () => {
    if (!window.electronAPI) {
      setStatus('error')
      setErrorMsg('GitHub auth requires the desktop app. Running in browser.')
      return
    }
    setStatus('waiting')
    try {
      const token = await window.electronAPI.startGitHubAuth()
      if (token) onConnect(token)
      else throw new Error('No token returned')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message || 'Authorization failed')
    }
  }

  const handleCancel = () => {
    window.electronAPI?.cancelGitHubAuth()
    setStatus('idle')
  }

  return (
    <div style={{ maxWidth: 480, width: '100%', padding: 40 }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.20em',
                    color: 'var(--fg-3)', textTransform: 'uppercase', marginBottom: 14 }}>
        Step 01 of 03 · Authorization
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 400, color: 'var(--fg-0)', margin: '0 0 12px' }}>
        Connect your GitHub.
      </h2>
      <p style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.6, margin: '0 0 28px' }}>
        Read-only access to repository metadata and activity signals. Authentication must be configured by the desktop app environment.
      </p>

      <div className="panel" style={{ padding: 20, marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
                      textTransform: 'uppercase', letterSpacing: '0.10em', marginBottom: 10 }}>
          Scopes requested
        </div>
        {[
          { s: 'repo', d: 'Read repository metadata, commits, branches' },
          { s: 'read:user', d: 'Read your profile (name, avatar)' },
          { s: 'read:org', d: 'List organizations and their repos' },
        ].map(x => (
          <div key={x.s} style={{ display: 'flex', alignItems: 'baseline', gap: 12,
                                  padding: '8px 0', borderBottom: '1px dashed var(--line)' }}>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--vital)', minWidth: 80 }}>{x.s}</span>
            <span style={{ fontSize: 12, color: 'var(--fg-1)' }}>{x.d}</span>
          </div>
        ))}
      </div>

      {status === 'error' && (
        <div style={{ background: 'var(--crit-faint)', border: '1px solid oklch(0.65 0.20 25 / 0.3)',
                      borderRadius: 4, padding: '10px 14px', marginBottom: 16,
                      fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--crit)' }}>
          ⚠ {errorMsg}
        </div>
      )}

      {status === 'waiting' ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14,
                        fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--fg-2)' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--vital)',
                           boxShadow: '0 0 8px var(--vital-glow)', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
            Waiting for GitHub authorization in browser…
          </div>
          <button onClick={handleCancel} className="btn ghost"
                  style={{ width: '100%', height: 40, fontSize: 12 }}>
            Cancel
          </button>
        </div>
      ) : (
        <button onClick={handleAuthorize}
                style={{
                  width: '100%', height: 44, border: '1px solid var(--line-3)',
                  background: 'var(--bg-2)', color: 'var(--fg-0)',
                  fontFamily: 'var(--sans)', fontSize: 13, borderRadius: 4,
                  cursor: 'default', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 10,
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-2)'}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          Authorize on GitHub
        </button>
      )}

      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
                    textAlign: 'center', marginTop: 16 }}>
        Opens github.com/login/oauth in your default browser
      </div>
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <button onClick={onSkip} className="btn ghost" style={{ fontSize: 11 }}>
          Skip — use demo data
        </button>
      </div>
    </div>
  )
}

// ── Scanning ──────────────────────────────────────────
function ScanningScreen({ token, onDone }) {
  const [logLines, setLogLines] = useState([])
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [warning, setWarning] = useState(null)
  const doneRef = useRef(false)

  const addLine = (line, color = 'var(--fg-1)') => {
    setLogLines(prev => [...prev.slice(-40), { text: line, color }])
  }

  useEffect(() => {
    if (!token) {
      // No token — run mock scan then complete with null
      runMockScan(addLine, setProgress, () => onDone(null))
      return
    }

    let cancelled = false
    const run = async () => {
      try {
        addLine('> handshake established with api.github.com', 'var(--vital)')
        setProgress(5)
        await sleep(300)

        const user = await getUser(token)
        if (cancelled) return
        addLine(`> authenticated as ${user.login} (${user.name || user.login})`, 'var(--vital)')
        setProgress(10)
        await sleep(200)

        addLine('> indexing repositories…', 'var(--vital)')
        let rawRepos = []

        rawRepos = await getUserRepos(token, (n, hasMore) => {
          setProgress(10 + Math.min(30, n * 0.3))
        })

        if (cancelled) return
        addLine(`> ${rawRepos.length} repositories found`, 'var(--vital)')
        addLine('', '')
        setProgress(40)
        await sleep(200)

        // Classify each repo with pulse check
        const mapped = []
        let partialFailures = 0
        let rateLimitResetAt = null
        for (let i = 0; i < rawRepos.length; i++) {
          if (cancelled) return
          const r = rawRepos[i]
          const insights = await getRepoInsights(token, r.owner.login, r.name)
          if (insights.incomplete) partialFailures += 1
          if (insights.rateLimit?.resetAt) rateLimitResetAt = insights.rateLimit.resetAt
          const mapped_r = mapGitHubRepo(r, insights)
          mapped.push(mapped_r)

          const pad = Math.max(0, 40 - r.name.length)
          const dots = '.'.repeat(pad)
          const isAlive = mapped_r.state === 'alive' || mapped_r.state === 'reanimated'
          const isFading = mapped_r.state === 'fading'
          const label = isAlive ? 'pulse detected' : isFading ? 'weak pulse' : 'no pulse'
          const color = isAlive ? 'var(--vital)' : isFading ? 'var(--warn)' : 'var(--crit)'

          addLine(`  ${user.login}/${r.name} ${dots} ${label}`, color)
          setProgress(40 + ((i + 1) / rawRepos.length) * 45)
          await sleep(Math.min(120, 2000 / rawRepos.length))
        }

        if (cancelled) return
        addLine('', '')
        addLine('> classifying lifecycle states · complete', 'var(--vital)')
        setProgress(90)
        await sleep(300)
        addLine('> cause-of-death analysis · complete', 'var(--vital)')
        setProgress(95)
        await sleep(300)
        if (partialFailures > 0) {
          const resetLabel = rateLimitResetAt
            ? ` · rate limit resets ${new Date(rateLimitResetAt).toLocaleTimeString('en-US', { hour12: false })}`
            : ''
          addLine(`> ${partialFailures} repo scan(s) incomplete${resetLabel}`, 'var(--warn)')
          setWarning({ partialFailures, rateLimitResetAt })
          await sleep(250)
        }
        addLine('', '')
        addLine('> scan complete · preparing report', 'var(--vital)')
        setProgress(100)
        await sleep(600)

        if (!cancelled && !doneRef.current) {
          doneRef.current = true
          onDone(mapped)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message)
          addLine(`> error: ${err.message}`, 'var(--crit)')
        }
      }
    }

    run()
    return () => { cancelled = true }
  }, [])

  if (error) {
    return (
      <div style={{ maxWidth: 560, padding: 40, textAlign: 'center' }}>
        <div style={{ color: 'var(--crit)', fontFamily: 'var(--mono)', fontSize: 13, marginBottom: 16 }}>
          ⚠ Scan failed
        </div>
        <div style={{ color: 'var(--fg-2)', fontSize: 12, marginBottom: 24 }}>{error}</div>
        <button className="btn primary" onClick={() => onDone(null)}>
          Continue with demo data
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 720, width: '100%', padding: 40 }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.20em',
                    color: 'var(--fg-3)', textTransform: 'uppercase', marginBottom: 14 }}>
        Step 02 of 03 · Triage in progress
      </div>
      <h2 style={{ fontSize: 24, fontWeight: 400, color: 'var(--fg-0)', margin: '0 0 24px' }}>
        Scanning your repositories.
      </h2>

      <div style={{ marginBottom: 18 }}>
        <div style={{ height: 2, background: 'var(--bg-3)', borderRadius: 1, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'var(--vital)',
                        boxShadow: '0 0 8px var(--vital-glow)', transition: 'width 200ms linear' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6,
                      fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)' }}>
          <span>{Math.round(progress)}% complete</span>
          <span>api.github.com</span>
        </div>
      </div>

      <div className="panel" style={{ padding: '14px 18px', height: 320, overflow: 'hidden',
                                       background: '#070908', position: 'relative' }}>
        <pre style={{ margin: 0, fontFamily: 'var(--mono)', fontSize: 11.5,
                      lineHeight: 1.7, whiteSpace: 'pre-wrap', position: 'absolute',
                      bottom: 14, left: 18, right: 18 }}>
          {logLines.map((l, i) => (
            <div key={i} style={{ color: l.color }}>{l.text || ' '}</div>
          ))}
          {progress < 100 && (
            <span style={{ background: 'var(--vital)', display: 'inline-block',
                           width: 7, height: 12, verticalAlign: 'middle',
                           animation: 'blink 1s steps(2) infinite' }} />
          )}
        </pre>
      </div>
      {warning && (
        <div style={{ marginTop: 14, fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--warn)' }}>
          {warning.partialFailures} repo scan(s) were only partially enriched. Available results are still usable.
        </div>
      )}
      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </div>
  )
}

// ── Reveal ────────────────────────────────────────────
function RevealScreen({ voice, repos, onNext }) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const timers = [600, 1700, 2900, 4100].map((t, i) => setTimeout(() => setStep(i + 1), t))
    return () => timers.forEach(clearTimeout)
  }, [])

  const isMonday = voice.name === 'Monday'
  const isSupportive = voice.name === 'Super Supportive'
  const total = repos?.length ?? 12
  const alive = repos?.filter(r => r.state === 'alive' || r.state === 'reanimated').length ?? 3
  const fading = repos?.filter(r => r.state === 'fading').length ?? 2
  const flatlined = repos?.filter(r => r.state === 'flatlined').length ?? 3
  const dead = repos?.filter(r => r.state === 'dead').length ?? 4
  const bodies = flatlined + dead

  const headline = isMonday
    ? `${total} repos. ${bodies} corpses.`
    : isSupportive
    ? `${total} beautiful projects. I already love all of them. 💕`
    : `${total} repositories scanned.`
  const subline = isMonday
    ? "You knew. You just hadn't counted."
    : isSupportive
    ? `${bodies} are resting right now. I'll keep checking on them. I don't mind.`
    : `${bodies} have been declared inactive or deceased.`

  return (
    <div style={{ maxWidth: 720, width: '100%', padding: 40, textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, letterSpacing: '0.20em',
                    color: 'var(--fg-3)', textTransform: 'uppercase', marginBottom: 14,
                    opacity: step >= 0 ? 1 : 0, transition: 'opacity 400ms' }}>
        Step 03 of 03 · Report
      </div>

      <h1 style={{ fontSize: 44, fontWeight: 300, letterSpacing: '-0.02em',
                   color: 'var(--fg-0)', margin: '0 0 12px',
                   opacity: step >= 1 ? 1 : 0, transform: step >= 1 ? 'translateY(0)' : 'translateY(8px)',
                   transition: 'opacity 600ms, transform 600ms' }}>
        {headline}
      </h1>

      <p style={{ fontSize: 16, color: 'var(--fg-2)', margin: '0 0 40px',
                  opacity: step >= 2 ? 1 : 0, transition: 'opacity 600ms 100ms' }}>
        {subline}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, margin: '0 0 40px',
                    opacity: step >= 3 ? 1 : 0, transform: step >= 3 ? 'translateY(0)' : 'translateY(12px)',
                    transition: 'opacity 600ms, transform 600ms' }}>
        <RevealStat n={alive} label="Alive" tone="alive" />
        <RevealStat n={fading} label="Fading" tone="warn" />
        <RevealStat n={flatlined} label="Flatlined" tone="muted" />
        <RevealStat n={dead} label="Declared dead" tone="crit" />
      </div>

      <div style={{ opacity: step >= 4 ? 1 : 0, transition: 'opacity 600ms' }}>
        <button className="btn primary" onClick={onNext}
                style={{ height: 38, padding: '0 24px', fontSize: 12 }}>
          {isMonday ? 'Show me the damage' : isSupportive ? 'Take me home 💕' : 'Open dashboard'} →
        </button>
        {repos && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--vital)', marginTop: 14 }}>
            ● Connected to GitHub · live data
          </div>
        )}
      </div>
    </div>
  )
}

function RevealStat({ n, label, tone }) {
  const color = tone === 'alive' ? 'var(--vital)' : tone === 'warn' ? 'var(--warn)' :
                tone === 'crit' ? 'var(--crit)' : 'var(--fg-2)'
  return (
    <div className="panel" style={{ padding: '20px 16px' }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 36, fontWeight: 300, color,
                    fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{n}</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.12em',
                    textTransform: 'uppercase', color: 'var(--fg-3)', marginTop: 10 }}>
        {label}
      </div>
    </div>
  )
}

// Mock scan fallback (no token)
async function runMockScan(addLine, setProgress, onDone) {
  const lines = [
    ['> no github token · running demo mode', 'var(--warn)'],
    ['> loading sample repository data', 'var(--fg-1)'],
    ['', ''],
    ['  msmith/flux-engine ............... pulse detected', 'var(--vital)'],
    ['  msmith/quartz-cli ................ pulse detected', 'var(--vital)'],
    ['  msmith/inkwell-notes ............. weak pulse', 'var(--warn)'],
    ['  msmith/tinybird-auth ............. weak pulse', 'var(--warn)'],
    ['  msmith/parsley-md ................ pulse · post-revival', 'var(--vital)'],
    ['  msmith/pixelpush ................. no pulse', 'var(--crit)'],
    ['  msmith/crisp-toast ............... no pulse', 'var(--crit)'],
    ['  msmith/hexed ..................... no pulse', 'var(--crit)'],
    ['  msmith/soundbender ............... no pulse · 22 mo', 'var(--crit)'],
    ['  msmith/zenframe .................. no pulse · 25 mo', 'var(--crit)'],
    ['', ''],
    ['> scan complete · demo data loaded', 'var(--vital)'],
  ]
  for (let i = 0; i < lines.length; i++) {
    addLine(lines[i][0], lines[i][1])
    setProgress(Math.round((i / lines.length) * 100))
    await sleep(140)
  }
  setProgress(100)
  await sleep(700)
  onDone()
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
