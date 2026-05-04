import { useState } from 'react'
import { EkgLine } from '../components/shared'
import { VOICES } from '../data/voices'

export function SettingsPage({ voice, voiceKey, onPickVoice, accent, onAccent, density, onDensity,
                               theme, onTheme, defaultPage, onDefaultPage, scanLimit, onScanLimit,
                               visibleCols, onVisibleCols, dateFormat, onDateFormat,
                               githubUser, isLive, syncing, onDisconnect, onConnect, onResync,
                               thresholds, onThresholdsChange, githubNotice, cacheMeta }) {
  const personas = [
    { key: 'neutral', voice: VOICES.neutral },
    { key: 'monday', voice: VOICES.monday },
    { key: 'supportive', voice: VOICES.supportive },
    { key: 'surfer', voice: VOICES.surfer },
    { key: 'professional', voice: VOICES.professional },
    { key: 'therapist', voice: VOICES.therapist },
    { key: 'weepy', voice: VOICES.weepy },
    { key: 'victorian', voice: VOICES.victorian },
  ]

  return (
    <>
      <div className="pageheader">
        <div>
          <div className="crumb">PREFERENCES</div>
          <h1>{voice.settings}</h1>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div className="crumb" style={{ marginBottom: 6 }}>
            {isLive ? `session: ${githubUser?.login ?? 'connected'} @ github.com` : 'session: demo mode'}
          </div>
          <EkgLine alive={true} width={220} height={36} />
        </div>
      </div>

      <div style={{ padding: '24px 32px 64px', maxWidth: 1100 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase',
                        letterSpacing: '0.12em', color: 'var(--fg-3)', marginBottom: 4 }}>
            01 · Voice
          </div>
          <div style={{ fontSize: 16, color: 'var(--fg-0)' }}>Personality</div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 4 }}>
            Pick the voice that gets through to you. One of them is going to sting. That&apos;s the point.
          </div>
        </div>

        <div className="persona-grid">
          {personas.map(({ key, voice: v }) => (
            <div key={key} className={`persona ${voiceKey === key ? 'selected' : ''}`}
                 onClick={() => onPickVoice(key)}>
              <div className="name">{v.name}</div>
              <div className="descriptor">{v.descriptor}</div>
              <div className="blurb">{voice.blurb[key]}</div>
            </div>
          ))}
        </div>

        <div style={{ height: 40 }} />

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase',
                        letterSpacing: '0.12em', color: 'var(--fg-3)', marginBottom: 4 }}>
            02 · Display
          </div>
          <div style={{ fontSize: 16, color: 'var(--fg-0)' }}>Appearance</div>
        </div>

        <div className="panel" style={{ padding: '6px 0' }}>
          <SettingRow label="Vital-sign accent" hint="Color of pulse, EKG, and alive indicators.">
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { key: 'phosphor', color: 'oklch(0.78 0.16 152)', label: 'Phosphor' },
                { key: 'cyan', color: 'oklch(0.82 0.14 195)', label: 'Monitor cyan' },
                { key: 'amber', color: 'oklch(0.82 0.14 80)', label: 'Amber CRT' },
                { key: 'mint', color: 'oklch(0.82 0.10 165)', label: 'Mint' },
              ].map(o => (
                <button key={o.key} className="btn" onClick={() => onAccent(o.key)}
                        style={{ borderColor: accent === o.key ? o.color : 'var(--line-2)',
                                 color: accent === o.key ? o.color : 'var(--fg-1)' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: o.color, marginRight: 4,
                                 boxShadow: accent === o.key ? `0 0 6px ${o.color}` : 'none' }} />
                  {o.label}
                </button>
              ))}
            </div>
          </SettingRow>

          <SettingRow label="Data density" hint="Affects table padding and font sizing.">
            <SegControl options={['sparse', 'medium', 'dense']} value={density} onChange={onDensity} />
          </SettingRow>

          <SettingRow label="Theme" hint="Light mode is a work in progress on some panels." last>
            <SegControl options={['dark', 'light']} value={theme} onChange={onTheme} />
          </SettingRow>
        </div>

        <div style={{ height: 40 }} />

        <SectionHeader n="03" label="View" sub="Table columns, date format, and landing page." />

        <div className="panel" style={{ padding: '6px 0' }}>
          <SettingRow label="Default landing page" hint="Which page opens when the app loads.">
            <SegControl
              options={['dashboard', 'ward', 'hospital', 'morgue', 'graveyard']}
              labels={[voice.dashTitle, voice.ward, voice.hospital, voice.morgue, voice.graveyard]}
              value={defaultPage}
              onChange={onDefaultPage}
            />
          </SettingRow>

          <SettingRow label="Date format" hint="How 'Last commit' dates appear in the repo table.">
            <SegControl
              options={['relative', 'absolute', 'both']}
              value={dateFormat}
              onChange={onDateFormat}
            />
          </SettingRow>

          <SettingRow label="Scan limit" hint="Max repositories fetched from GitHub per sync." last>
            <SegControl
              options={[100, 250, 500]}
              value={scanLimit}
              onChange={onScanLimit}
            />
          </SettingRow>
        </div>

        <div style={{ height: 20 }} />

        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase',
                      letterSpacing: '0.12em', color: 'var(--fg-3)', marginBottom: 10, paddingLeft: 2 }}>
          Table columns
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            { key: 'status',     label: 'Status' },
            { key: 'vitals',     label: 'Vitals' },
            { key: 'activity',   label: 'Activity' },
            { key: 'lastCommit', label: 'Last commit' },
            { key: 'lifespan',   label: 'Lifespan' },
            { key: 'stars',      label: '★ Stars' },
          ].map(({ key, label }) => {
            const on = visibleCols[key]
            return (
              <button key={key} onClick={() => onVisibleCols({ [key]: !on })}
                      className="btn" style={{
                        borderColor: on ? 'var(--vital)' : 'var(--line-2)',
                        color: on ? 'var(--vital)' : 'var(--fg-3)',
                        background: on ? 'var(--vital-faint)' : 'var(--bg-2)',
                      }}>
                {on ? '✓ ' : ''}{label}
              </button>
            )
          })}
        </div>

        <div style={{ height: 40 }} />

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase',
                        letterSpacing: '0.12em', color: 'var(--fg-3)', marginBottom: 4 }}>
            04 · GitHub
          </div>
          <div style={{ fontSize: 16, color: 'var(--fg-0)' }}>Connection</div>
        </div>
        <div className="panel" style={{ padding: 22 }}>
          {isLive || syncing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%',
                            background: syncing ? 'var(--warn)' : 'var(--vital)',
                            boxShadow: `0 0 8px ${syncing ? 'var(--warn)' : 'var(--vital-glow)'}`,
                            animation: syncing ? 'pulse-dot 1s ease-in-out infinite' : undefined,
                            flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--fg-0)' }}>
                  {githubUser?.login ?? 'connected'}
                </div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)', marginTop: 2 }}>
                  {syncing ? 'syncing repositories…' : `github.com/${githubUser?.login ?? '—'} · browser session`}
                </div>
                {cacheMeta?.savedAt && (
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)', marginTop: 6 }}>
                    Last scan: {new Date(cacheMeta.savedAt).toLocaleString('en-US', { hour12: false })}
                  </div>
                )}
                {githubNotice && (
                  <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: githubNotice.kind === 'error' || githubNotice.kind === 'rate-limit' ? 'var(--warn)' : 'var(--fg-2)', marginTop: 6 }}>
                    {githubNotice.kind === 'rate-limit'
                      ? `Rate limited${githubNotice.resetAt ? ` until ${new Date(githubNotice.resetAt).toLocaleTimeString('en-US', { hour12: false })}` : ''}. Partial results remain available.`
                      : githubNotice.kind === 'partial'
                      ? `${githubNotice.failures} repo scan(s) only partially enriched.`
                      : githubNotice.message}
                  </div>
                )}
              </div>
              <button className="btn" onClick={onResync} disabled={syncing}
                      style={{ opacity: syncing ? 0.4 : 1 }}>
                {syncing ? 'Syncing…' : 'Resync'}
              </button>
              <button className="btn ghost" style={{ color: 'var(--crit)' }} onClick={onDisconnect}>
                Disconnect
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--fg-3)', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 13, color: 'var(--fg-2)' }}>Not connected</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)', marginTop: 2 }}>
                  Running on demo data or waiting for a GitHub token
                </div>
              </div>
              <button className="btn" onClick={onConnect}>Connect GitHub</button>
            </div>
          )}
        </div>

        <div style={{ height: 40 }} />

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase',
                        letterSpacing: '0.12em', color: 'var(--fg-3)', marginBottom: 4 }}>
            05 · Triage
          </div>
          <div style={{ fontSize: 16, color: 'var(--fg-0)' }}>Death thresholds</div>
          <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 4 }}>
            How long without a heartbeat before the patient is moved to the morgue.
          </div>
        </div>

        <div className="panel" style={{ padding: '6px 0' }}>
          <SettingRow label="Fading" hint="Days without commits before flagged at-risk."><ThresholdInput value={thresholds.aliveDays} unit="d" min={1} onChange={(value) => onThresholdsChange({ aliveDays: value })} /></SettingRow>
          <SettingRow label="Flatlined" hint="Days without commits before flatline declared."><ThresholdInput value={thresholds.fadingDays} unit="d" min={thresholds.aliveDays + 1} onChange={(value) => onThresholdsChange({ fadingDays: value })} /></SettingRow>
          <SettingRow label="Declared dead" hint="Days flatlined before automatic declaration."><ThresholdInput value={thresholds.deadDays} unit="d" min={thresholds.fadingDays + 1} onChange={(value) => onThresholdsChange({ deadDays: value })} /></SettingRow>
        </div>
      </div>
    </>
  )
}

function SectionHeader({ n, label, sub }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase',
                    letterSpacing: '0.12em', color: 'var(--fg-3)', marginBottom: 4 }}>
        {n} · {label}
      </div>
      <div style={{ fontSize: 16, color: 'var(--fg-0)' }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--fg-2)', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function SegControl({ options, labels, value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 0, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 3, padding: 2 }}>
      {options.map((opt, i) => (
        <button key={opt} onClick={() => onChange(opt)} className="btn" style={{
          background: value === opt ? 'var(--bg-4)' : 'transparent',
          border: 0, color: value === opt ? 'var(--fg-0)' : 'var(--fg-2)', borderRadius: 2,
        }}>
          {labels ? labels[i] : opt}
        </button>
      ))}
    </div>
  )
}

function SettingRow({ label, hint, last, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center',
                  padding: '14px 22px', borderBottom: last ? 'none' : '1px solid var(--line)' }}>
      <div>
        <div style={{ fontSize: 13, color: 'var(--fg-0)' }}>{label}</div>
        <div style={{ fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{hint}</div>
      </div>
      <div>{children}</div>
    </div>
  )
}

function ThresholdInput({ value, unit, min = 1, onChange }) {
  const adjust = (next) => onChange(Math.max(min, Number(next) || min))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'var(--mono)' }}>
      <button className="btn ghost" onClick={() => adjust(value - 1)} style={{ width: 26, padding: 0 }}>−</button>
      <input type="number" value={value} min={min} onChange={e => adjust(e.target.value)}
             style={{ width: 60, height: 28, background: 'var(--bg-2)', border: '1px solid var(--line)',
                      borderRadius: 3, color: 'var(--fg-0)', textAlign: 'center', fontFamily: 'var(--mono)',
                      fontSize: 12, outline: 'none' }} />
      <span style={{ color: 'var(--fg-3)', fontSize: 11 }}>{unit}</span>
      <button className="btn ghost" onClick={() => adjust(value + 1)} style={{ width: 26, padding: 0 }}>+</button>
    </div>
  )
}
