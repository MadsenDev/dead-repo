import { useState, useEffect, useMemo } from 'react'
import { EkgLine, formatDate } from '../components/shared'

const MS_DAY = 86400000
const MS_HOUR = 3600000

const VOICE_META = {
  monday: {
    title: (year) => `The ${year} Reckoning`,
    subtitle: 'A year of starts. Some survived. Most became paperwork.',
    closeHeading: (year) => `See you in ${year + 1}.`,
    closeBody: 'You will absolutely open more repos. We will absolutely count them.',
    cta: 'Share the damage',
    slides: {
      startedHeading: () => `Repos started.`,
      startedBody: (summary) => summary.startedCount > 0
        ? `${summary.inactiveStartedCount} are already flatlined or dead. Strong opening. Weak follow-through.`
        : `No new repos in ${summary.year}. A rare display of restraint.`,
      lifespanHeading: () => 'Median lifespan.',
      lifespanBody: (summary) => summary.endedInactive.length > 0
        ? `Measured across ${summary.endedInactive.length} corpses from ${summary.year}. They did not endure.`
        : `Nothing in the ${summary.year} sample died cleanly enough to measure.`,
      patternHeading: (summary) => summary.heatmap.peakLabel
        ? `${summary.heatmap.peakLabel}. Busy week for abandonment.`
        : 'No abandonment cluster detected.',
      patternBody: (summary) => summary.heatmap.peakCount > 0
        ? `${summary.heatmap.peakCount} repos stopped breathing in your busiest week. Efficient, in a way.`
        : `Not enough confirmed deaths in ${summary.year} to form a proper pattern.`,
      causeHeading: (summary) => summary.topCause
        ? `${summary.topCause.name} led the board.`
        : 'No dominant cause recorded.',
      causeBody: (summary) => summary.topCause
        ? `${summary.topCause.count} cases. Followed by ${formatTrailingCauses(summary.causeCounts.slice(1))}. A portfolio of self-inflicted endings.`
        : `The failures were too evenly distributed to crown one favorite mistake.`,
      survivorHeading: (summary) => summary.longest
        ? `${summary.longest.name} lasted ${formatDurationDays(summary.longest.lifespanDays)}.`
        : `No long-lived survivor in ${summary.year}.`,
      survivorBody: (summary) => summary.longest
        ? `${formatDate(summary.longest.firstCommit)} to ${formatDate(summary.longest.lastCommit)}${summary.longest.commitsTotal != null ? ` across ${summary.longest.commitsTotal} commits` : ''}. It fought harder than the others.`
        : `Nothing in the ${summary.year} window stayed alive long enough to be memorable.`,
    },
  },
  neutral: {
    title: (year) => `${year} in Review`,
    subtitle: 'Annual repository activity report.',
    closeHeading: () => 'Report complete.',
    closeBody: 'Annual report archived.',
    cta: 'Export report',
    slides: {
      startedHeading: () => 'Repositories started',
      startedBody: (summary) => summary.startedCount > 0
        ? `${summary.inactiveStartedCount} already classify as flatlined or dead in the current triage view.`
        : `No repositories in this dataset were created during ${summary.year}.`,
      lifespanHeading: () => 'Median lifespan',
      lifespanBody: (summary) => summary.endedInactive.length > 0
        ? `Computed from ${summary.endedInactive.length} inactive repos whose final activity landed in ${summary.year}.`
        : `No inactive repositories in this dataset ended during ${summary.year}.`,
      patternHeading: (summary) => summary.heatmap.peakLabel
        ? `${summary.heatmap.peakLabel} · peak abandonment`
        : 'No abandonment cluster detected',
      patternBody: (summary) => summary.heatmap.peakCount > 0
        ? `${summary.heatmap.peakCount} ${summary.heatmap.peakCount === 1 ? 'repo logged' : 'repos logged'} final activity in the busiest week of ${summary.year}.`
        : `There were not enough ${summary.year} inactivity events to highlight a meaningful cluster.`,
      causeHeading: (summary) => summary.topCause
        ? `Leading cause: ${summary.topCause.name}`
        : 'No dominant cause recorded',
      causeBody: (summary) => summary.topCause
        ? `${summary.topCause.count} ${summary.topCause.count === 1 ? 'case' : 'cases'} recorded, followed by ${formatTrailingCauses(summary.causeCounts.slice(1))}.`
        : `No clear dominant cause was detected in the ${summary.year} sample.`,
      survivorHeading: (summary) => summary.longest
        ? `Longest survivor: ${summary.longest.name} · ${formatDurationDays(summary.longest.lifespanDays)}`
        : `No long-lived ${summary.year} casualty`,
      survivorBody: (summary) => summary.longest
        ? `${formatDate(summary.longest.firstCommit)} — ${formatDate(summary.longest.lastCommit)}${summary.longest.commitsTotal != null ? ` · ${summary.longest.commitsTotal} commits` : ''}.`
        : `No qualifying repo in the ${summary.year} data window.`,
    },
  },
  supportive: {
    title: (year) => `Your ${year} Wrapped!`,
    subtitle: 'A year of building, trying, and leaving digital footprints.',
    closeHeading: (year) => `${year + 1} is still yours.`,
    closeBody: 'Even the weird little experiments count as progress.',
    cta: 'Share my journey',
    slides: {
      startedHeading: () => 'Fresh ideas!',
      startedBody: (summary) => summary.startedCount > 0
        ? `${summary.inactiveStartedCount} may be resting now, but they still count as attempts. Attempts matter.`
        : `No new repos in ${summary.year}. Quiet seasons are part of the cycle too.`,
      lifespanHeading: () => 'Hours of trying.',
      lifespanBody: (summary) => summary.endedInactive.length > 0
        ? `That median comes from ${summary.endedInactive.length} repos that had their full little arc in ${summary.year}.`
        : `There is not enough closure in the ${summary.year} set to calculate this one yet.`,
      patternHeading: (summary) => summary.heatmap.peakLabel
        ? `${summary.heatmap.peakLabel} was intense.`
        : 'No abandonment cluster detected.',
      patternBody: (summary) => summary.heatmap.peakCount > 0
        ? `${summary.heatmap.peakCount} projects reached their stopping point in that peak week. That does not erase the effort that came before it.`
        : `No strong drop-off cluster showed up for ${summary.year}, which honestly is kind of nice.`,
      causeHeading: (summary) => summary.topCause
        ? `${summary.topCause.name} showed up the most.`
        : 'No dominant cause recorded.',
      causeBody: (summary) => summary.topCause
        ? `${summary.topCause.count} cases, with ${formatTrailingCauses(summary.causeCounts.slice(1))} behind it. Patterns are useful. Patterns are not destiny.`
        : `No single failure mode dominated the ${summary.year} sample.`,
      survivorHeading: (summary) => summary.longest
        ? `${summary.longest.name} held on for ${formatDurationDays(summary.longest.lifespanDays)}!`
        : `No standout survivor in ${summary.year}.`,
      survivorBody: (summary) => summary.longest
        ? `${formatDate(summary.longest.firstCommit)} to ${formatDate(summary.longest.lastCommit)}${summary.longest.commitsTotal != null ? ` with ${summary.longest.commitsTotal} commits along the way` : ''}. It got a real stretch of life.`
        : `Nothing in the ${summary.year} window claimed the survivor crown this time.`,
    },
  },
  surfer: {
    title: (year) => `${year} · the recap`,
    subtitle: 'some waves, some wipeouts. all logged.',
    closeHeading: () => 'see you in the lineup.',
    closeBody: 'more waves later. no rush.',
    cta: 'pass it along',
    slides: {
      startedHeading: () => 'Paddle-outs.',
      startedBody: (summary) => summary.startedCount > 0
        ? `${summary.inactiveStartedCount} are already washed back in. still counts as getting in the water.`
        : `No new paddles in ${summary.year}. flat ocean season.`,
      lifespanHeading: () => 'Median ride.',
      lifespanBody: (summary) => summary.endedInactive.length > 0
        ? `Based on ${summary.endedInactive.length} rides that ended in ${summary.year}. some clean, some messy.`
        : `Nothing in the ${summary.year} set gave us a clean enough ride window to score.`,
      patternHeading: (summary) => summary.heatmap.peakLabel
        ? `${summary.heatmap.peakLabel}. heavy set.`
        : 'No heavy abandonment set detected.',
      patternBody: (summary) => summary.heatmap.peakCount > 0
        ? `${summary.heatmap.peakCount} projects went under in that peak week. tide came in rough.`
        : `No major crash cluster hit in ${summary.year}. pretty mellow, honestly.`,
      causeHeading: (summary) => summary.topCause
        ? `${summary.topCause.name} took the set.`
        : 'No dominant wipeout cause recorded.',
      causeBody: (summary) => summary.topCause
        ? `${summary.topCause.count} wipeouts there, plus ${formatTrailingCauses(summary.causeCounts.slice(1))}. same ocean, different breaks.`
        : `No single wipeout pattern owned the ${summary.year} run.`,
      survivorHeading: (summary) => summary.longest
        ? `${summary.longest.name} rode for ${formatDurationDays(summary.longest.lifespanDays)}.`
        : `No standout long ride in ${summary.year}.`,
      survivorBody: (summary) => summary.longest
        ? `${formatDate(summary.longest.firstCommit)} to ${formatDate(summary.longest.lastCommit)}${summary.longest.commitsTotal != null ? ` with ${summary.longest.commitsTotal} moves on the board` : ''}. longest glide of the year.`
        : `No board stayed up long enough in ${summary.year} to take the title.`,
    },
  },
  professional: {
    title: (year) => `Annual Portfolio Review · FY${year}`,
    subtitle: 'Year-end assessment of repository lifecycle outcomes.',
    closeHeading: () => 'Review complete.',
    closeBody: 'Findings documented for future planning.',
    cta: 'Generate executive summary',
    slides: {
      startedHeading: () => 'Net new initiatives',
      startedBody: (summary) => summary.startedCount > 0
        ? `${summary.inactiveStartedCount} already sit in flatlined or dead status under the current triage model.`
        : `No new initiatives were created during the ${summary.year} reporting window.`,
      lifespanHeading: () => 'Median operating span',
      lifespanBody: (summary) => summary.endedInactive.length > 0
        ? `Calculated from ${summary.endedInactive.length} inactive repositories whose final activity occurred in ${summary.year}.`
        : `The ${summary.year} dataset does not include enough inactive endpoints to calculate this metric.`,
      patternHeading: (summary) => summary.heatmap.peakLabel
        ? `Peak attrition: ${summary.heatmap.peakLabel}`
        : 'No attrition cluster detected',
      patternBody: (summary) => summary.heatmap.peakCount > 0
        ? `${summary.heatmap.peakCount} repositories hit final activity during the peak week. This suggests concentrated abandonment rather than even decay.`
        : `No significant attrition cluster emerged in the ${summary.year} sample.`,
      causeHeading: (summary) => summary.topCause
        ? `Primary failure mode: ${summary.topCause.name}`
        : 'No dominant failure mode recorded',
      causeBody: (summary) => summary.topCause
        ? `${summary.topCause.count} documented cases, followed by ${formatTrailingCauses(summary.causeCounts.slice(1))}.`
        : `Failure modes were too evenly distributed to identify a primary driver for ${summary.year}.`,
      survivorHeading: (summary) => summary.longest
        ? `Top operating span: ${summary.longest.name} · ${formatDurationDays(summary.longest.lifespanDays)}`
        : `No standout asset in ${summary.year}`,
      survivorBody: (summary) => summary.longest
        ? `${formatDate(summary.longest.firstCommit)} through ${formatDate(summary.longest.lastCommit)}${summary.longest.commitsTotal != null ? ` with ${summary.longest.commitsTotal} commits recorded` : ''}.`
        : `No repository in the ${summary.year} window materially distinguished itself on lifespan.`,
    },
  },
}

export function WrappedFlow({ voice, voiceKey, repos, onClose }) {
  const [slide, setSlide] = useState(0)
  const [leavingSlide, setLeavingSlide] = useState(null)
  const [direction, setDirection] = useState(1)
  const total = 6
  const [p, setP] = useState(0)
  const summary = useMemo(() => buildWrappedSummary(repos), [repos])
  const copy = useMemo(() => buildWrappedCopy(voiceKey, summary), [voiceKey, summary])

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
      else if (slide < total - 1) advanceSlide(slide + 1, 1)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [slide, total])

  useEffect(() => {
    if (leavingSlide == null) return
    const timer = window.setTimeout(() => setLeavingSlide(null), 460)
    return () => window.clearTimeout(timer)
  }, [leavingSlide])

  const advanceSlide = (nextSlide, nextDirection) => {
    if (nextSlide === slide) return
    setDirection(nextDirection)
    setLeavingSlide(slide)
    setSlide(nextSlide)
  }

  const next = () => slide < total - 1 ? advanceSlide(slide + 1, 1) : onClose()
  const prev = () => slide > 0 && advanceSlide(slide - 1, -1)

  const slides = [
    <Slide0 key={0} copy={copy} />,
    <Slide1 key={1} copy={copy} summary={summary} />,
    <Slide2 key={2} copy={copy} summary={summary} />,
    <Slide3 key={3} copy={copy} summary={summary} />,
    <Slide4 key={4} copy={copy} summary={summary} />,
    <SlideClose key={5} copy={copy} summary={summary} />,
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
            ◉ Wrapped · {summary.year}
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 0,
                  color: 'var(--fg-3)', fontSize: 16, cursor: 'default' }}>✕</button>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 28,
                      position: 'relative', overflow: 'hidden' }}>
          {leavingSlide != null && (
            <SlideFrame mode="out" direction={direction}>
              {slides[leavingSlide]}
            </SlideFrame>
          )}
          <SlideFrame mode="in" direction={direction} key={slide}>
            {slides[slide]}
          </SlideFrame>
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

function buildWrappedSummary(repos) {
  const year = new Date().getFullYear() - 1
  const created = repos.filter(repo => getYear(repo.firstCommit) === year)
  const ended = repos.filter(repo => {
    const endDate = repo.timeOfDeath || repo.lastCommit
    return endDate && getYear(endDate) === year
  })
  const endedInactive = ended.filter(repo => repo.state === 'dead' || repo.state === 'flatlined')

  const medianHours = computeMedianHours(endedInactive)
  const durations = created.length > 0 ? created : endedInactive
  const lifespanBars = durations
    .slice()
    .sort((a, b) => diffHours(getActivityStart(b), getActivityEnd(b)) - diffHours(getActivityStart(a), getActivityEnd(a)))
    .slice(0, 7)
    .map(repo => ({
      name: repo.name,
      hours: Math.max(1, Math.round(diffHours(getActivityStart(repo), getActivityEnd(repo)))),
    }))

  const deathDates = endedInactive
    .map(repo => repo.timeOfDeath || repo.lastCommit)
    .filter(Boolean)
  const heatmap = buildHeatmap(year, deathDates)

  const causeCounts = Array.from(
    endedInactive.reduce((acc, repo) => {
      const label = repo.causes?.[0]?.label || repo.cause
      if (!label) return acc
      acc.set(label, (acc.get(label) || 0) + 1)
      return acc
    }, new Map()).entries()
  )
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))

  const longest = ended.length > 0
    ? ended
        .slice()
        .sort((a, b) => diffDays(getActivityStart(b), getActivityEnd(b)) - diffDays(getActivityStart(a), getActivityEnd(a)))[0]
    : null

  return {
    year,
    created,
    ended,
    endedInactive,
    startedCount: created.length,
    startedNames: created.map(repo => repo.name).slice(0, 7),
    inactiveStartedCount: created.filter(repo => repo.state === 'dead' || repo.state === 'flatlined').length,
    medianHours,
    lifespanBars,
    heatmap,
    causeCounts,
    topCause: causeCounts[0] || null,
    longest: longest ? {
      name: longest.name,
      firstCommit: getActivityStart(longest),
      lastCommit: getActivityEnd(longest),
      lifespanDays: Math.max(1, Math.round(diffDays(getActivityStart(longest), getActivityEnd(longest)))),
      commitsTotal: longest.commitsTotal,
    } : null,
  }
}

function buildWrappedCopy(voiceKey, summary) {
  const voice = VOICE_META[voiceKey] || VOICE_META.neutral
  const slides = voice.slides || VOICE_META.neutral.slides

  return {
    title: voice.title(summary.year),
    subtitle: voice.subtitle,
    s1Heading: slides.startedHeading(summary),
    s1Body: slides.startedBody(summary),
    s2Heading: slides.lifespanHeading(summary),
    s2Body: slides.lifespanBody(summary),
    s3Heading: slides.patternHeading(summary),
    s3Body: slides.patternBody(summary),
    s4Heading: slides.causeHeading(summary),
    s4Body: slides.causeBody(summary),
    s5Heading: slides.survivorHeading(summary),
    s5Body: slides.survivorBody(summary),
    s6Heading: voice.closeHeading(summary.year),
    s6Body: voice.closeBody,
    cta: voice.cta,
  }
}

function SlideShell({ children }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', position: 'relative',
                  height: '100%',
                  animation: 'wfade 600ms ease' }}>
      <style>{`
        @keyframes wfade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes wnum { from { opacity: 0; transform: scale(0.92); } to { opacity: 1; transform: none; } }
        @keyframes wglow { 0%, 100% { box-shadow: 0 0 0 rgba(0,0,0,0); } 50% { box-shadow: 0 0 22px var(--vital-glow); } }
        @keyframes wfloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
        @keyframes wline { from { opacity: 0; transform: scaleX(0.4); } to { opacity: 1; transform: scaleX(1); } }
        @keyframes wpop { from { opacity: 0; transform: scale(0.88); } to { opacity: 1; transform: scale(1); } }
        @keyframes wbgShift { 0% { transform: translate3d(-4%, -2%, 0) scale(1); } 50% { transform: translate3d(3%, 2%, 0) scale(1.06); } 100% { transform: translate3d(-4%, -2%, 0) scale(1); } }
        @keyframes wgridDrift { from { transform: translateY(0); } to { transform: translateY(16px); } }
        @keyframes wring { 0% { transform: scale(0.86); opacity: 0.14; } 100% { transform: scale(1.15); opacity: 0; } }
        @keyframes wslideInRight { from { opacity: 0; transform: translate3d(18%, 0, 0) scale(0.97); } to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); } }
        @keyframes wslideOutRight { from { opacity: 1; transform: translate3d(0, 0, 0) scale(1); } to { opacity: 0; transform: translate3d(-14%, 0, 0) scale(0.98); } }
        @keyframes wslideInLeft { from { opacity: 0; transform: translate3d(-18%, 0, 0) scale(0.97); } to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); } }
        @keyframes wslideOutLeft { from { opacity: 1; transform: translate3d(0, 0, 0) scale(1); } to { opacity: 0; transform: translate3d(14%, 0, 0) scale(0.98); } }
      `}</style>
      {children}
    </div>
  )
}

function SlideFrame({ children, mode, direction }) {
  const animation = mode === 'in'
    ? direction >= 0 ? 'wslideInRight 460ms cubic-bezier(.2,.85,.22,1)' : 'wslideInLeft 460ms cubic-bezier(.2,.85,.22,1)'
    : direction >= 0 ? 'wslideOutRight 460ms cubic-bezier(.2,.85,.22,1)' : 'wslideOutLeft 460ms cubic-bezier(.2,.85,.22,1)'

  return (
    <div style={{ position: 'absolute', inset: 28, animation, pointerEvents: mode === 'out' ? 'none' : 'auto' }}>
      {children}
    </div>
  )
}

function SlideBackdrop({ variant = 'vital' }) {
  const variants = {
    vital: {
      gradient: 'radial-gradient(circle at 18% 24%, rgba(119,255,186,0.12), transparent 34%), radial-gradient(circle at 82% 18%, rgba(119,255,186,0.06), transparent 28%), linear-gradient(180deg, rgba(255,255,255,0.02), transparent 62%)',
      overlay: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.028) 0 1px, transparent 1px 28px)',
    },
    amber: {
      gradient: 'radial-gradient(circle at 20% 20%, rgba(255,206,102,0.13), transparent 34%), radial-gradient(circle at 76% 72%, rgba(255,206,102,0.07), transparent 30%), linear-gradient(180deg, rgba(255,206,102,0.04), transparent 58%)',
      overlay: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.022) 0 1px, transparent 1px 24px)',
    },
    crit: {
      gradient: 'radial-gradient(circle at 76% 22%, rgba(255,111,97,0.13), transparent 32%), radial-gradient(circle at 18% 76%, rgba(255,111,97,0.08), transparent 28%), linear-gradient(180deg, rgba(255,111,97,0.05), transparent 62%)',
      overlay: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.02) 0 1px, transparent 1px 22px)',
    },
  }
  const style = variants[variant] || variants.vital

  return (
    <>
      <div style={{ position: 'absolute', inset: '-12%',
                    background: style.gradient, opacity: 1, pointerEvents: 'none',
                    animation: 'wbgShift 14s ease-in-out infinite' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: style.overlay,
                    opacity: 0.35, pointerEvents: 'none', mixBlendMode: 'screen',
                    animation: 'wgridDrift 10s linear infinite alternate' }} />
      <div style={{ position: 'absolute', top: '16%', right: '12%', width: 180, height: 180,
                    borderRadius: '50%', border: '1px solid rgba(255,255,255,0.07)',
                    pointerEvents: 'none', animation: 'wring 3.6s ease-out infinite' }} />
      <div style={{ position: 'absolute', bottom: '14%', left: '8%', width: 120, height: 120,
                    borderRadius: '50%', border: '1px solid rgba(255,255,255,0.05)',
                    pointerEvents: 'none', animation: 'wring 4.3s ease-out 800ms infinite' }} />
    </>
  )
}

function Slide0({ copy }) {
  return (
    <SlideShell>
      <SlideBackdrop variant="vital" />
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

function Slide1({ copy, summary }) {
  const startedCount = useCountUp(summary.startedCount, { duration: 1200 })
  return (
    <SlideShell>
      <SlideBackdrop variant="vital" />
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
                    letterSpacing: '0.16em', marginBottom: 16 }}>01 · INITIATED</div>
      <div style={{ fontFamily: 'var(--mono)', fontSize: 120, fontWeight: 300,
                    color: 'var(--vital)', lineHeight: 0.9, letterSpacing: '-0.02em',
                    textShadow: '0 0 30px var(--vital-glow)',
                    animation: 'wnum 700ms ease, wfloat 2.8s ease-in-out 700ms infinite' }}>{startedCount}</div>
      <h2 style={{ fontSize: 24, fontWeight: 400, color: 'var(--fg-0)', margin: '20px 0 12px' }}>{copy.s1Heading}</h2>
      <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.6 }}>{copy.s1Body}</p>
      {summary.startedNames.length > 0 && (
        <div style={{ marginTop: 24, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {summary.startedNames.map((name, i) => (
            <span key={name} style={{ fontFamily: 'var(--mono)', fontSize: 10,
                                      padding: '3px 8px', borderRadius: 2,
                                      background: 'rgba(255,255,255,0.04)', color: 'var(--fg-2)',
                                      animation: `wpop 500ms ease ${450 + i * 70}ms backwards, wfloat 3.2s ease-in-out ${1200 + i * 120}ms infinite` }}>{name}</span>
          ))}
        </div>
      )}
    </SlideShell>
  )
}

function Slide2({ copy, summary }) {
  const bars = summary.lifespanBars.map(bar => bar.hours)
  const max = Math.max(...bars, 1)
  const medianHours = useCountUp(summary.medianHours ?? 0, { duration: 1400 })
  return (
    <SlideShell>
      <SlideBackdrop variant="amber" />
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
                    letterSpacing: '0.16em', marginBottom: 16 }}>02 · LIFESPAN</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, animation: 'wnum 700ms ease' }}>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 96, fontWeight: 300,
                       color: 'var(--warn)', lineHeight: 0.9,
                       textShadow: '0 0 24px oklch(0.82 0.12 80 / 0.4)',
                       animation: 'wglow 2.4s ease-in-out 900ms infinite' }}>
          {summary.medianHours != null ? medianHours : '—'}
        </span>
        <span style={{ fontFamily: 'var(--mono)', fontSize: 16, color: 'var(--fg-2)' }}>hrs</span>
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 400, color: 'var(--fg-0)', margin: '20px 0 12px' }}>{copy.s2Heading}</h2>
      <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.6 }}>{copy.s2Body}</p>
      {summary.lifespanBars.length > 0 && (
        <>
          <div style={{ marginTop: 24, display: 'flex', alignItems: 'flex-end', gap: 6, height: 80 }}>
            {summary.lifespanBars.map((bar, i) => (
              <div key={bar.name} title={`${bar.name} · ${bar.hours}h`} style={{ flex: 1, height: `${(bar.hours / max) * 100}%`,
                                    background: bar.hours < 72 ? 'var(--crit)' : bar.hours > 720 ? 'var(--vital)' : 'var(--warn)',
                                    opacity: 0.7, minHeight: 2,
                                    transformOrigin: 'bottom center',
                                    animation: `wline 650ms cubic-bezier(.2,.8,.2,1) ${i * 80}ms backwards, wglow 3s ease-in-out ${900 + i * 100}ms infinite` }} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6,
                        fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)' }}>
            <span>{formatHours(Math.min(...bars))}</span>
            <span>{formatHours(Math.max(...bars))}</span>
          </div>
        </>
      )}
    </SlideShell>
  )
}

function Slide3({ copy, summary }) {
  const peakCount = useCountUp(summary.heatmap.peakCount, { duration: 1000 })
  return (
    <SlideShell>
      <SlideBackdrop variant="crit" />
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
                    letterSpacing: '0.16em', marginBottom: 16 }}>03 · PATTERN</div>
      <h2 style={{ fontSize: 28, fontWeight: 400, color: 'var(--crit)', margin: '0 0 18px',
                   letterSpacing: '-0.01em' }}>{copy.s3Heading}</h2>
      <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.6, marginBottom: 24 }}>{copy.s3Body}</p>
      {summary.heatmap.peakCount > 0 && (
        <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 8, marginBottom: 18,
                      padding: '6px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.06)', animation: 'wpop 600ms ease 300ms backwards' }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 22, color: 'var(--crit)' }}>{peakCount}</span>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)', letterSpacing: '0.08em' }}>EVENTS IN PEAK WEEK</span>
        </div>
      )}
      <div style={{ marginTop: 8 }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
                      letterSpacing: '0.10em', marginBottom: 10 }}>{summary.year} · ABANDONMENT HEATMAP</div>
        <CalendarHeatmap summary={summary} />
      </div>
    </SlideShell>
  )
}

function CalendarHeatmap({ summary }) {
  const colorFor = (intensity) => intensity === 0 ? 'rgba(255,255,255,0.04)' :
    intensity === 1 ? 'oklch(0.65 0.20 25 / 0.25)' :
    intensity === 2 ? 'oklch(0.65 0.20 25 / 0.55)' :
    'oklch(0.65 0.20 25 / 0.95)'

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(52, 1fr)',
                    gridTemplateRows: 'repeat(7, 1fr)', gap: 1, gridAutoFlow: 'column',
                    height: 70 }}>
        {summary.heatmap.cells.map((cell, i) => (
          <div key={i} title={cell.date ? `${cell.date} · ${cell.count}` : undefined}
               style={{ background: colorFor(cell.intensity), borderRadius: 1,
                        boxShadow: cell.intensity === 3 ? '0 0 4px oklch(0.65 0.20 25 / 0.6)' : 'none',
                        animation: `wpop 220ms ease ${Math.min(i * 4, 900)}ms backwards` }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8,
                    fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)' }}>
        <span>JAN</span><span>APR</span><span>JUL</span>
        <span style={{ color: summary.heatmap.peakCount > 0 ? 'var(--crit)' : 'var(--fg-3)' }}>
          {summary.heatmap.peakMonthLabel || 'OCT'}
        </span>
        <span>DEC</span>
      </div>
    </div>
  )
}

function Slide4({ copy, summary }) {
  const causes = summary.causeCounts.slice(0, 4)
  const max = Math.max(...causes.map(c => c.count), 1)
  const leadCount = useCountUp(summary.topCause?.count ?? 0, { duration: 1100 })
  return (
    <SlideShell>
      <SlideBackdrop variant="crit" />
      <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
                    letterSpacing: '0.16em', marginBottom: 16 }}>04 · CAUSE</div>
      <h2 style={{ fontSize: 32, fontWeight: 400, color: 'var(--crit)', margin: '0 0 14px',
                   letterSpacing: '-0.01em',
                   textShadow: '0 0 20px oklch(0.65 0.20 25 / 0.4)' }}>{copy.s4Heading}</h2>
      <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.6, marginBottom: 28 }}>{copy.s4Body}</p>
      {causes.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {causes.map((cause, i) => (
            <div key={cause.name} style={{ animation: `wnum 500ms ease ${i * 100}ms backwards` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4,
                            fontFamily: 'var(--mono)', fontSize: 11 }}>
                <span style={{ color: 'var(--fg-1)' }}>{cause.name}</span>
                <span style={{ color: 'var(--fg-3)' }}>{i === 0 ? leadCount : cause.count}</span>
              </div>
              <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                <div style={{ height: '100%', width: `${(cause.count / max) * 100}%`,
                              background: i === 0 ? 'var(--crit)' : 'var(--crit-dim)',
                              opacity: 1 - i * 0.2, borderRadius: 3,
                              transformOrigin: 'left center',
                              boxShadow: i === 0 ? '0 0 8px oklch(0.65 0.20 25 / 0.5)' : 'none',
                              animation: `wline 700ms cubic-bezier(.2,.8,.2,1) ${180 + i * 90}ms backwards` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </SlideShell>
  )
}

function SlideClose({ copy, summary }) {
  const longestDays = useCountUp(summary.longest?.lifespanDays ?? 0, { duration: 1300 })
  return (
    <SlideShell>
      <SlideBackdrop variant="amber" />
      <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 6, padding: '20px 18px', marginBottom: 22,
                    animation: 'wnum 700ms ease, wglow 3s ease-in-out 900ms infinite' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 9, color: 'var(--fg-3)',
                      letterSpacing: '0.14em', textAlign: 'center', marginBottom: 6 }}>
          † LONGEST SURVIVOR †
        </div>
        <div style={{ fontSize: 13, color: 'var(--fg-2)', textAlign: 'center', marginBottom: 10 }}>
          {copy.s5Heading}
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 22, color: 'var(--fg-0)',
                      textAlign: 'center', letterSpacing: '-0.01em' }}>
          {summary.longest?.name || 'none recorded'}
        </div>
        <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color: 'var(--fg-3)',
                      textAlign: 'center', marginTop: 4 }}>
          {summary.longest
            ? `${summary.longest.firstCommit} — ${summary.longest.lastCommit} · ${formatDurationDays(longestDays)}`
            : `No qualifying repo in ${summary.year}`}
        </div>
      </div>
      <div style={{ marginBottom: 22 }}><EkgLine alive={false} width={300} height={36} /></div>
      <h1 style={{ fontSize: 26, fontWeight: 400, letterSpacing: '-0.02em',
                   color: 'var(--fg-0)', margin: '0 0 12px' }}>{copy.s6Heading}</h1>
      <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.6, marginBottom: 14 }}>{copy.s5Body}</p>
      <p style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.6 }}>{copy.s6Body}</p>
    </SlideShell>
  )
}

function buildHeatmap(year, dates) {
  const yearStart = new Date(year, 0, 1)
  const yearEnd = new Date(year, 11, 31)
  const dayCounts = new Map()
  const weekCounts = new Map()

  dates.forEach((dateStr) => {
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime()) || date < yearStart || date > yearEnd) return
    const key = date.toISOString().slice(0, 10)
    dayCounts.set(key, (dayCounts.get(key) || 0) + 1)
    const week = Math.min(51, Math.floor((date - yearStart) / (MS_DAY * 7)))
    weekCounts.set(week, (weekCounts.get(week) || 0) + 1)
  })

  const cells = []
  for (let week = 0; week < 52; week++) {
    for (let day = 0; day < 7; day++) {
      const date = new Date(yearStart.getTime() + (week * 7 + day) * MS_DAY)
      if (date > yearEnd) {
        cells.push({ intensity: 0, count: 0, date: null })
        continue
      }
      const key = date.toISOString().slice(0, 10)
      const count = dayCounts.get(key) || 0
      cells.push({
        intensity: count >= 3 ? 3 : count >= 2 ? 2 : count >= 1 ? 1 : 0,
        count,
        date: key,
      })
    }
  }

  let peakWeek = null
  let peakCount = 0
  weekCounts.forEach((count, week) => {
    if (count > peakCount) {
      peakCount = count
      peakWeek = week
    }
  })

  const peakDate = peakWeek == null ? null : new Date(yearStart.getTime() + peakWeek * 7 * MS_DAY)

  return {
    cells,
    peakCount,
    peakLabel: peakDate ? peakDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : null,
    peakMonthLabel: peakDate ? `${peakDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()} ▼` : null,
  }
}

function computeMedianHours(repos) {
  const values = repos
    .map(repo => Math.round(diffHours(getActivityStart(repo), getActivityEnd(repo))))
    .filter(value => Number.isFinite(value) && value >= 0)
    .sort((a, b) => a - b)

  if (values.length === 0) return null
  const mid = Math.floor(values.length / 2)
  return values.length % 2 === 1
    ? values[mid]
    : Math.round((values[mid - 1] + values[mid]) / 2)
}

function diffHours(start, end) {
  return (new Date(end) - new Date(start)) / MS_HOUR
}

function diffDays(start, end) {
  return (new Date(end) - new Date(start)) / MS_DAY
}

function getYear(dateStr) {
  const date = new Date(dateStr)
  return Number.isNaN(date.getTime()) ? null : date.getFullYear()
}

function formatHours(hours) {
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  return `${days}d`
}

function formatDurationDays(days) {
  if (days < 7) return `${days}d`
  if (days < 30) return `${Math.round(days / 7)}w`
  const months = Math.round(days / 30.4)
  if (months < 12) return `${months}mo`
  const years = Math.floor(months / 12)
  const remMonths = months % 12
  return remMonths > 0 ? `${years}y ${remMonths}mo` : `${years}y`
}

function formatTrailingCauses(causes) {
  if (causes.length === 0) return 'nothing else with enough volume to rank'
  if (causes.length === 1) return `${causes[0].name} (${causes[0].count})`
  return causes
    .slice(0, 2)
    .map(cause => `${cause.name} (${cause.count})`)
    .join(' and ')
}

function getActivityStart(repo) {
  return repo.activeFirstCommit || repo.firstCommit
}

function getActivityEnd(repo) {
  return repo.activeLastCommit || repo.lastCommit
}

function useCountUp(target, { duration = 1000 } = {}) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!Number.isFinite(target)) {
      setValue(0)
      return
    }

    let raf
    const start = performance.now()
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(target * eased))
      if (progress < 1) raf = requestAnimationFrame(tick)
    }

    setValue(0)
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [duration, target])

  return value
}
