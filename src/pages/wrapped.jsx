import { useState, useEffect } from 'react'
import { EkgLine } from '../components/shared'

const WRAPPED_COPY = {
  monday: {
    title: 'The 2025 Reckoning',
    subtitle: 'A year of starts. Mostly starts.',
    s1Heading: 'You started 7 things.',
    s1Body: 'You finished zero of them. The math is uncomfortable. The math is correct.',
    s2Heading: '184 hours.',
    s2Body: "That's the median lifespan of a repo you killed in 2025. Roughly the time it takes to lose interest in anything.",
    s3Heading: 'Sunday, October 13.',
    s3Body: 'Your most prolific abandonment date. Three repos went silent that week. None recovered.',
    s4Heading: 'Scope Inflation.',
    s4Body: 'The leading cause of death in your portfolio (4 of 8 cases). You start small. You don\'t stay small.',
    s5Heading: 'pixelpush survived 6 weeks.',
    s5Body: 'Your longest-lived 2025 corpse. Buried with 4,200 lines of code and zero users. A tomb.',
    s6Heading: 'See you in 2026.',
    s6Body: "You'll abandon more. You'll mean to come back. You won't. We'll be here.",
    cta: 'Share the damage',
  },
  neutral: {
    title: '2025 in Review',
    subtitle: 'Annual repository activity report.',
    s1Heading: '7 repositories created',
    s1Body: 'Across the calendar year. None remain in active development as of December 31.',
    s2Heading: '184 hours · median lifespan',
    s2Body: 'From first commit to last commit, for repositories declared inactive in 2025.',
    s3Heading: 'October 13 · peak abandonment',
    s3Body: 'Three repositories logged their final commits within a 7-day window centered on this date.',
    s4Heading: 'Leading cause: Scope Inflation',
    s4Body: '4 of 8 documented cases. Followed by Lost Interest (2) and Existential Crisis (1).',
    s5Heading: 'Longest survivor: pixelpush',
    s5Body: '6 weeks · 41 commits · 4,200 lines of code at time of death.',
    s6Heading: 'Report complete.',
    s6Body: 'Annual report archived. Next sync scheduled for January 1, 2026 at 00:00 UTC.',
    cta: 'Export report',
  },
  supportive: {
    title: 'Your 2025 Wrapped! 🌟',
    subtitle: 'What a beautiful year of trying things!!',
    s1Heading: 'Seven new ideas! 💡',
    s1Body: "Every single one mattered, even briefly. That's seven sparks of imagination! Look at you go!",
    s2Heading: '184 hours of pure creation.',
    s2Body: "Your average project lifespan! That's 184 hours of \"what if\" — and what if is everything!",
    s3Heading: 'October 13 was your day.',
    s3Body: "You poured so much into that week. It's okay if some of those projects rested afterward. They had their moment!",
    s4Heading: 'You dream big!! 🌈',
    s4Body: "Scope Inflation just means your visions outgrew their scaffolding. That's ambition! That's you!",
    s5Heading: 'pixelpush! Six glorious weeks!',
    s5Body: '4,200 lines of pure expression. Even projects we let go are part of who we are. ❤️',
    s6Heading: '2026 is going to be amazing.',
    s6Body: "I just know it. I believe in you so much. Please don't close this app.",
    cta: 'Share my journey 💖',
  },
  surfer: {
    title: '2025 · the recap',
    subtitle: 'some waves, some wipeouts. all good.',
    s1Heading: 'paddled out 7 times.',
    s1Body: "caught a few. lost a few. that's the ocean, dude.",
    s2Heading: '184 hours per ride.',
    s2Body: 'median time on the wave before things got choppy. nature of the swell.',
    s3Heading: 'october 13. heavy session.',
    s3Body: 'three rides ended that week. just how the tide moved that day.',
    s4Heading: 'mostly scope inflation.',
    s4Body: 'wave got too big. you tried to ride it anyway. respect.',
    s5Heading: 'pixelpush hung tough · 6 weeks.',
    s5Body: '4,200 lines deep when it folded. clean wipeout.',
    s6Heading: 'see you in the lineup.',
    s6Body: "next year's waves are already forming. paddle when you're ready.",
    cta: 'pass it along',
  },
  professional: {
    title: 'Annual Portfolio Review · FY2025',
    subtitle: 'Year-end assessment of repository lifecycle outcomes.',
    s1Heading: '7 net new initiatives',
    s1Body: 'Initiated during the reporting period. Zero progressed to a stable production state by year-end.',
    s2Heading: 'Median operational duration · 184h',
    s2Body: 'Time from project initiation to last meaningful contribution, across sunsetted assets.',
    s3Heading: 'Q4 attrition cluster · Oct 13',
    s3Body: 'Three concurrent project terminations within a single reporting week. Pattern flagged for retrospective.',
    s4Heading: 'Primary failure mode: Scope Inflation',
    s4Body: '4 of 8 documented end-of-life events. Recommend tighter MVP scoping in FY2026 planning.',
    s5Heading: 'Longest-running asset: pixelpush',
    s5Body: 'Operational for 6 weeks. 41 commits, 4,200 LOC at sunset. Performance below expectation.',
    s6Heading: 'Review complete.',
    s6Body: 'Findings documented. Stakeholder readout available upon request. Looking forward to FY2026.',
    cta: 'Generate executive summary',
  },
}

export function WrappedFlow({ voice, voiceKey, repos, onClose }) {
  const [slide, setSlide] = useState(0)
  const copy = WRAPPED_COPY[voiceKey] || WRAPPED_COPY.neutral
  const total = 6
  const [p, setP] = useState(0)

  useEffect(() => {
    setP(0)
    const dur = 5500
    const start = Date.now()
    let raf
    const tick = () => {
      const elapsed = Date.now() - start
      const frac = Math.min(1, elapsed / dur)
      setP(frac)
      if (frac < 1) raf = requestAnimationFrame(tick)
      else if (slide < total - 1) setSlide(slide + 1)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [slide])

  const next = () => slide < total - 1 ? setSlide(slide + 1) : onClose()
  const prev = () => slide > 0 && setSlide(slide - 1)

  const slides = [
    <Slide0 key={0} copy={copy} />,
    <Slide1 key={1} copy={copy} />,
    <Slide2 key={2} copy={copy} />,
    <Slide3 key={3} copy={copy} />,
    <Slide4 key={4} copy={copy} />,
    <SlideClose key={5} copy={copy} />,
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000',
                  zIndex: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 420, height: 760, background: '#0a0d0c',
                    border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14,
                    boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
                    position: 'relative', overflow: 'hidden',
                    display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: 4, padding: '14px 14px 0' }}>
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 2, background: 'rgba(255,255,255,0.10)',
                                  borderRadius: 1, overflow: 'hidden' }}>
              <div style={{ height: '100%',
                            width: i < slide ? '100%' : i === slide ? `${p * 100}%` : '0%',
                            background: 'var(--vital)',
                            boxShadow: i === slide ? '0 0 6px var(--vital-glow)' : 'none' }} />
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 18px 0' }}>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 9, letterSpacing: '0.18em',
                        color: 'var(--vital)', textTransform: 'uppercase' }}>
            ◉ Wrapped · 2025
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0,
                  color: 'var(--fg-3)', fontSize: 16, cursor: 'default' }}>✕</button>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 28,
                      position: 'relative', overflow: 'hidden' }} key={slide}>
          {slides[slide]}
        </div>
        <div onClick={prev} style={{ position: 'absolute', left: 0, top: 30, bottom: 0,
                                      width: '30%', cursor: 'default' }} />
        <div onClick={next} style={{ position: 'absolute', right: 0, top: 30, bottom: 0,
                                      width: '70%', cursor: 'default' }} />
        {slide === total - 1 && (
          <div style={{ padding: '0 28px 28px', textAlign: 'center', position: 'relative', zIndex: 5 }}>
            <button className="btn primary" style={{ width: '100%', height: 40 }}>↗ {copy.cta}</button>
          </div>
        )}
      </div>
    </div>
  )
}

function SlideShell({ children }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', position: 'relative',
                  animation: 'wfade 600ms ease' }}>
      <style>{`
        @keyframes wfade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes wnum { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: none; } }
      `}</style>
      {children}
    </div>
  )
}

function Slide0({ copy }) {
  return (
    <SlideShell>
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <div style={{ marginBottom: 28 }}><EkgLine alive={true} width={300} height={48} /></div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
                      letterSpacing: '0.20em', marginBottom: 18 }}>DEAD REPO PRESENTS</div>
        <h1 style={{ fontSize: 36, fontWeight: 300, letterSpacing: '-0.02em',
                     color: 'var(--fg-0)', margin: '0 0 16px' }}>{copy.title}</h1>
        <div style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.5 }}>{copy.subtitle}</div>
        <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center',
                      fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)' }}>
          tap to continue →
        </div>
      </div>
    </SlideShell>
  )
}

function Slide1({ copy }) {
  return (
    <SlideShell>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
                    letterSpacing: '0.16em', marginBottom: 16 }}>01 · INITIATED</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 120, fontWeight: 300,
                    color: 'var(--vital)', lineHeight: 0.9, letterSpacing: '-0.02em',
                    textShadow: '0 0 30px var(--vital-glow)',
                    animation: 'wnum 700ms ease' }}>7</div>
      <h2 style={{ fontSize: 24, fontWeight: 400, color: 'var(--fg-0)', margin: '20px 0 12px' }}>{copy.s1Heading}</h2>
      <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.6 }}>{copy.s1Body}</p>
      <div style={{ marginTop: 24, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {['flux-engine', 'inkwell-notes', 'pixelpush', 'crisp-toast', 'tinybird-auth', 'parsley-md', 'soundbender-v2'].map(n => (
          <span key={n} style={{ fontFamily: 'var(--mono)', fontSize: 10,
                                  padding: '3px 8px', borderRadius: 2,
                                  background: 'rgba(255,255,255,0.04)', color: 'var(--fg-2)' }}>{n}</span>
        ))}
      </div>
    </SlideShell>
  )
}

function Slide2({ copy }) {
  const bars = [184, 96, 14, 8, 504, 42, 168]
  const max = Math.max(...bars)
  return (
    <SlideShell>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
                    letterSpacing: '0.16em', marginBottom: 16 }}>02 · LIFESPAN</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, animation: 'wnum 700ms ease' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 96, fontWeight: 300,
                       color: 'var(--warn)', lineHeight: 0.9,
                       textShadow: '0 0 24px oklch(0.82 0.12 80 / 0.4)' }}>184</span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--fg-2)' }}>hrs</span>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 400, color: 'var(--fg-0)', margin: '20px 0 12px' }}>{copy.s2Heading}</h2>
      <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.6 }}>{copy.s2Body}</p>
      <div style={{ marginTop: 24, display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
        {bars.map((b, i) => (
          <div key={i} style={{ flex: 1, height: `${(b / max) * 100}%`,
                                background: b < 100 ? 'var(--crit)' : b > 300 ? 'var(--vital)' : 'var(--warn)',
                                opacity: 0.7, minHeight: 2,
                                animation: `wnum 600ms ease ${i * 60}ms backwards` }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6,
                    fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)' }}>
        <span>4 days</span><span>21 days</span>
      </div>
    </SlideShell>
  )
}

function Slide3({ copy }) {
  return (
    <SlideShell>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
                    letterSpacing: '0.16em', marginBottom: 16 }}>03 · PATTERN</div>
      <h2 style={{ fontSize: 28, fontWeight: 400, color: 'var(--crit)', margin: '0 0 18px',
                   letterSpacing: '-0.01em' }}>{copy.s3Heading}</h2>
      <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.6, marginBottom: 24 }}>{copy.s3Body}</p>
      <div style={{ marginTop: 8 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
                      letterSpacing: '0.10em', marginBottom: 10 }}>2025 · ABANDONMENT HEATMAP</div>
        <CalendarHeatmap />
      </div>
    </SlideShell>
  )
}

function CalendarHeatmap() {
  const cells = []
  for (let w = 0; w < 52; w++) {
    for (let d = 0; d < 7; d++) {
      let v = Math.random()
      const distFromOct = Math.abs(w - 41)
      if (distFromOct < 2) v += 0.6
      if (distFromOct < 4) v += 0.2
      const intensity = v > 1.2 ? 3 : v > 0.85 ? 2 : v > 0.6 ? 1 : 0
      cells.push({ w, d, intensity })
    }
  }
  const colorFor = (i) => i === 0 ? 'rgba(255,255,255,0.04)' :
                          i === 1 ? 'oklch(0.65 0.20 25 / 0.25)' :
                          i === 2 ? 'oklch(0.65 0.20 25 / 0.55)' :
                          'oklch(0.65 0.20 25 / 0.95)'
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(52, 1fr)',
                    gridTemplateRows: 'repeat(7, 1fr)', gap: 1, gridAutoFlow: 'column',
                    height: 70 }}>
        {cells.map((c, i) => (
          <div key={i} style={{ background: colorFor(c.intensity), borderRadius: 1,
                                boxShadow: c.intensity === 3 ? '0 0 4px oklch(0.65 0.20 25 / 0.6)' : 'none' }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8,
                    fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)' }}>
        <span>JAN</span><span>APR</span><span>JUL</span>
        <span style={{ color: 'var(--crit)' }}>OCT ▼</span><span>DEC</span>
      </div>
    </div>
  )
}

function Slide4({ copy }) {
  const causes = [
    { name: 'Scope Inflation', n: 4 },
    { name: 'Lost Interest', n: 2 },
    { name: 'Existential Crisis', n: 1 },
    { name: 'Dependency Rot', n: 1 },
  ]
  const max = Math.max(...causes.map(c => c.n))
  return (
    <SlideShell>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
                    letterSpacing: '0.16em', marginBottom: 16 }}>04 · CAUSE</div>
      <h2 style={{ fontSize: 32, fontWeight: 400, color: 'var(--crit)', margin: '0 0 14px',
                   letterSpacing: '-0.01em',
                   textShadow: '0 0 20px oklch(0.65 0.20 25 / 0.4)' }}>{copy.s4Heading}</h2>
      <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.6, marginBottom: 28 }}>{copy.s4Body}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {causes.map((c, i) => (
          <div key={c.name} style={{ animation: `wnum 500ms ease ${i * 100}ms backwards` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4,
                          fontFamily: 'var(--mono)', fontSize: 11 }}>
              <span style={{ color: 'var(--fg-1)' }}>{c.name}</span>
              <span style={{ color: 'var(--fg-3)' }}>{c.n}</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
              <div style={{ height: '100%', width: `${(c.n / max) * 100}%`,
                            background: i === 0 ? 'var(--crit)' : 'var(--crit-dim)',
                            opacity: 1 - i * 0.2, borderRadius: 3,
                            boxShadow: i === 0 ? '0 0 8px oklch(0.65 0.20 25 / 0.5)' : 'none' }} />
            </div>
          </div>
        ))}
      </div>
    </SlideShell>
  )
}

function SlideClose({ copy }) {
  return (
    <SlideShell>
      <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 6, padding: '20px 18px', marginBottom: 22,
                    animation: 'wnum 700ms ease' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
                      letterSpacing: '0.14em', textAlign: 'center', marginBottom: 6 }}>
          † LONGEST SURVIVOR †
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 22, color: 'var(--fg-0)',
                      textAlign: 'center', letterSpacing: '-0.01em' }}>pixelpush</div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
                      textAlign: 'center', marginTop: 4 }}>
          2025·09·04 — 2025·10·18 · 6 weeks
        </div>
      </div>
      <div style={{ marginBottom: 22 }}><EkgLine alive={false} width={300} height={36} /></div>
      <h1 style={{ fontSize: 26, fontWeight: 400, letterSpacing: '-0.02em',
                   color: 'var(--fg-0)', margin: '0 0 12px' }}>{copy.s6Heading}</h1>
      <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.6 }}>{copy.s6Body}</p>
    </SlideShell>
  )
}
