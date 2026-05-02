import { useState } from 'react'
import { EkgLine } from '../components/shared'
import { VOICES } from '../data/voices'

export function SettingsPage({ voice, voiceKey, onPickVoice, accent, onAccent, density, onDensity,
                               githubUser, isLive, syncing, onDisconnect, onConnect, onResync,
                               thresholds, onThresholdsChange }) {
  const personas = [
    { key: 'neutral', voice: VOICES.neutral },
    { key: 'monday', voice: VOICES.monday },
    { key: 'supportive', voice: VOICES.supportive },
    { key: 'surfer', voice: VOICES.surfer },
    { key: 'professional', voice: VOICES.professional },
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
          <div style={{ fontSize: 16, color: 'var(--fg-0)' }}>Vital sign monitor</div>
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
            <div style={{ display: 'flex', gap: 0, background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 3, padding: 2 }}>
              {['sparse', 'medium', 'dense'].map(d => (
                <button key={d} onClick={() => onDensity(d)}
                        className="btn" style={{
                          background: density === d ? 'var(--bg-4)' : 'transparent',
                          border: 0, color: density === d ? 'var(--fg-0)' : 'var(--fg-2)',
                          borderRadius: 2,
                        }}>{d}</button>
              ))}
            </div>
          </SettingRow>
        </div>

        <div style={{ height: 40 }} />

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 10, textTransform: 'uppercase',
                        letterSpacing: '0.12em', color: 'var(--fg-3)', marginBottom: 4 }}>
            03 · GitHub
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
                  {syncing ? 'syncing repositories…' : `github.com/${githubUser?.login ?? '—'} · scope: repo, read:user, read:org`}
                </div>
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
                  Running on demo data
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
            04 · Triage
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

function SettingRow({ label, hint, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'center',
                  padding: '14px 22px', borderBottom: '1px solid var(--line)' }}>
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
