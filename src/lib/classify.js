const MS_DAY = 86400000

const DEFAULT_THRESHOLDS = {
  aliveDays: 30,
  fadingDays: 90,
  deadDays: 365,
}

export const LANG_COLORS = {
  JavaScript: '#f1e05a', TypeScript: '#3178c6', Python: '#3572A5',
  Rust: '#dea584', Go: '#00add8', Ruby: '#701516', Java: '#b07219',
  'C#': '#178600', 'C++': '#f34b7d', C: '#555555', Shell: '#89e051',
  HTML: '#e34c26', CSS: '#563d7c', Swift: '#F05138', Kotlin: '#A97BFF',
  PHP: '#4F5D95', Vue: '#41b883', Svelte: '#ff3e00', Dart: '#00B4AB',
  Elixir: '#6e4a7e', Haskell: '#5e5086', Scala: '#c22d40',
  Lua: '#000080', R: '#198CE7', Vim: '#199f4b', Zig: '#ec915c',
}

function daysSince(dateStr) {
  return (Date.now() - new Date(dateStr).getTime()) / MS_DAY
}

function normalizeThresholds(thresholds = {}) {
  return {
    aliveDays: thresholds.aliveDays ?? DEFAULT_THRESHOLDS.aliveDays,
    fadingDays: thresholds.fadingDays ?? DEFAULT_THRESHOLDS.fadingDays,
    deadDays: thresholds.deadDays ?? DEFAULT_THRESHOLDS.deadDays,
  }
}

function getRepoActivitySource(repo) {
  return {
    archived: Boolean(repo.archived ?? repo.sourceArchived),
    pushedAt: repo.pushed_at || repo.sourcePushedAt || repo.lastCommit,
  }
}

export function classifyState(repo, thresholds) {
  const { archived, pushedAt } = getRepoActivitySource(repo)
  const limits = normalizeThresholds(thresholds)
  if (archived) return 'dead'
  const days = daysSince(pushedAt)
  if (days <= limits.aliveDays) return 'alive'
  if (days <= limits.fadingDays) return 'fading'
  if (days <= limits.deadDays) return 'flatlined'
  return 'dead'
}

export function computeVitals(repo, state, thresholds) {
  if (state === 'dead' || state === 'flatlined') return 0
  const { pushedAt } = getRepoActivitySource(repo)
  const limits = normalizeThresholds(thresholds)
  const days = daysSince(pushedAt)
  if (state === 'alive') return Math.max(40, Math.round(100 - days * 2))
  if (state === 'fading') {
    const fadingSpan = Math.max(1, limits.fadingDays - limits.aliveDays)
    const decay = ((days - limits.aliveDays) / fadingSpan) * 33
    return Math.round(Math.max(5, 38 - decay))
  }
  return 0
}

export function computeLifespan(createdAt, lastPushed) {
  const days = (new Date(lastPushed) - new Date(createdAt)) / MS_DAY
  if (days < 1) return '< 1 day'
  if (days < 7) return `${Math.round(days)}d`
  if (days < 30) return `${Math.round(days / 7)}w`
  const months = days / 30.4
  if (months < 12) return `${Math.round(months)}mo`
  const yrs = Math.floor(months / 12)
  const mo = Math.round(months % 12)
  return mo > 0 ? `${yrs}y ${mo}mo` : `${yrs}y`
}

export function generateSparkline(commitActivity, state) {
  if (Array.isArray(commitActivity) && commitActivity.length > 0) {
    return commitActivity.slice(-30).map(w => w.total)
  }
  // Plausible fallback based on state
  const data = []
  for (let i = 0; i < 30; i++) {
    if (state === 'alive') {
      data.push(Math.max(0, Math.round(5 + Math.sin(i * 0.7) * 3 + Math.random() * 4)))
    } else if (state === 'fading') {
      const decay = 1 - (i / 30) * 0.7
      data.push(Math.max(0, Math.round((3 + Math.random() * 3) * decay)))
    } else if (state === 'reanimated') {
      // dip then recovery
      const mid = i < 12 ? 0 : Math.round((i - 12) * 0.4 + Math.random() * 2)
      data.push(mid)
    } else {
      data.push(i < 8 ? Math.round(Math.random() * 4) : 0)
    }
  }
  return data
}

export function diagnoseCause(ghRepo, commitActivity) {
  const lifeDays = (new Date(ghRepo.pushed_at) - new Date(ghRepo.created_at)) / MS_DAY
  const deadDays = daysSince(ghRepo.pushed_at)
  const issues = ghRepo.open_issues_count || 0
  const stars = ghRepo.stargazers_count || 0
  const forks = ghRepo.forks_count || 0
  const size = ghRepo.size || 0
  const desc = (ghRepo.description || '').toLowerCase()
  const topics = (ghRepo.topics || []).map(t => t.toLowerCase())

  const candidates = []
  const add = (label, confidence, detail) => {
    if (confidence > 0.15) candidates.push({ label, confidence, detail })
  }

  // Archived
  if (ghRepo.archived) {
    if (stars > 20 || forks > 5) {
      add('Shipped & Archived', 0.94, `Archived after ${stars} stars and ${forks} forks — completed its mission.`)
    } else {
      add('Archived', 0.92, 'Repository was explicitly archived by its owner.')
    }
  }

  // Never started
  if (lifeDays < 1 || size < 3) {
    add('Never Started', 0.88, size < 3
      ? `Only ${size}KB committed. More idea than project.`
      : 'Created and abandoned same day.')
  }

  // Existential crisis (< 7 days but not empty)
  if (lifeDays >= 1 && lifeDays < 7 && size >= 3) {
    add('Existential Crisis', Math.max(0.40, 0.82 - lifeDays * 0.06),
      `Abandoned ${Math.round(lifeDays)} day(s) after creation.`)
  }

  // Experiment / POC
  const expKeywords = ['learn', 'practice', 'test', 'demo', 'sample', 'example', 'tutorial',
    'playground', 'experiment', 'poc', 'prototype', 'wip', 'todo', 'workshop', 'kata',
    'exercise', 'challenge', 'sandbox', 'scratch', 'toy']
  const expMatches = expKeywords.filter(k => desc.includes(k) || topics.includes(k))
  if (expMatches.length > 0) {
    add('Experiment / POC', Math.min(0.91, 0.56 + expMatches.length * 0.12),
      `Description signals intent: "${expMatches.slice(0, 2).join('", "')}"`)
  } else if (lifeDays < 14 && size < 30 && stars === 0) {
    add('Experiment / POC', 0.45, `Short-lived (${Math.round(lifeDays)}d), no stars — likely a throwaway.`)
  }

  // Scope Inflation
  if (issues > 5) {
    add('Scope Inflation', Math.min(0.93, 0.42 + Math.min(issues, 60) * 0.009),
      `${issues} open issues at time of last commit.`)
  }

  // Maintenance Fatigue (issues + long life + low visibility)
  if (issues > 10 && lifeDays > 180 && stars < 25) {
    add('Maintenance Fatigue', Math.min(0.84, 0.48 + issues * 0.012),
      `${issues} unresolved issues, ${Math.round(lifeDays / 30)} months of history, no community to help.`)
  }

  // Burnout from commit activity
  if (Array.isArray(commitActivity) && commitActivity.length >= 16) {
    const active = commitActivity.filter(w => w.total > 0)
    if (active.length > 4) {
      const recent = commitActivity.slice(-8).reduce((s, w) => s + w.total, 0) / 8
      const peak = commitActivity.slice(-24, -8).reduce((s, w) => s + w.total, 0) / 16
      if (peak > 1 && recent < peak * 0.25) {
        const dropPct = Math.round((1 - recent / peak) * 100)
        add('Burnout', Math.min(0.91, 0.52 + (1 - recent / peak) * 0.42),
          `Commit frequency dropped ${dropPct}% in final 8 weeks.`)
      }
    }
  }

  // Lost Interest (short lifespan, no strong other signal)
  if (lifeDays < 60 && !ghRepo.archived) {
    add('Lost Interest', lifeDays < 7 ? 0.52 : lifeDays < 30 ? 0.63 : 0.44,
      `Active for only ${Math.round(lifeDays)} days before last commit.`)
  }

  // Abandoned (long active life then long silence)
  if (lifeDays > 90 && deadDays > 180) {
    const silentMonths = Math.round(deadDays / 30)
    add('Abandoned', Math.min(0.88, 0.48 + Math.min(lifeDays / 730, 0.22) + Math.min(deadDays / (365 * 2), 0.20)),
      `Active for ${(lifeDays / 365).toFixed(1)}yr, silent for ${silentMonths} months.`)
  }

  // Superseded
  const superKeywords = ['deprecated', 'replaced by', 'superseded', 'archived in favor', 'use instead', 'moved to']
  const superMatch = superKeywords.find(k => desc.includes(k))
  if (superMatch) {
    add('Superseded', 0.88, `Description signals replacement: "…${superMatch}…"`)
  }

  candidates.sort((a, b) => b.confidence - a.confidence)
  const top = candidates.slice(0, 3)

  if (top.length === 0) {
    top.push({ label: 'Lost Interest', confidence: 0.52,
      detail: 'No distinguishing signals detected. Most common cause of repository death.' })
  }

  return top.map(c => ({ ...c, confidence: Math.round(c.confidence * 100) }))
}

export function reclassifyMappedRepo(repo, thresholds) {
  const state = classifyState(repo, thresholds)
  return {
    ...repo,
    state,
    vitals: computeVitals(repo, state, thresholds),
    timeOfDeath: state === 'dead' || state === 'flatlined' ? repo.lastCommit : null,
    declared: repo.sourceArchived ? repo.declared : state === 'dead' ? repo.declared : null,
  }
}

export function mapGitHubRepo(ghRepo, insights = {}, thresholds) {
  const commitActivity = insights.commitActivity ?? null
  const lastCommit = insights.lastCommit ?? null
  const state = classifyState(ghRepo, thresholds)
  const isDead = state === 'dead' || state === 'flatlined'
  const causes = isDead ? diagnoseCause(ghRepo, commitActivity) : null
  const prs = insights.prs ?? null
  const issues = prs == null ? ghRepo.open_issues_count : Math.max(0, ghRepo.open_issues_count - prs)

  return {
    id: `gh-${ghRepo.id}`,
    name: ghRepo.name,
    owner: ghRepo.owner.login,
    url: ghRepo.html_url,
    state,
    vitals: computeVitals(ghRepo, state, thresholds),
    lang: ghRepo.language || 'Unknown',
    langColor: LANG_COLORS[ghRepo.language] || '#666666',
    stars: ghRepo.stargazers_count,
    forks: ghRepo.forks_count,
    issues,
    prs,
    lifespan: computeLifespan(ghRepo.created_at, ghRepo.pushed_at),
    firstCommit: ghRepo.created_at.slice(0, 10),
    lastCommit: ghRepo.pushed_at.slice(0, 10),
    commitsTotal: Array.isArray(commitActivity) ? commitActivity.reduce((sum, week) => sum + (week.total || 0), 0) : null,
    commitsLast30: Array.isArray(commitActivity) ? commitActivity.slice(-4).reduce((sum, week) => sum + (week.total || 0), 0) : null,
    contributors: insights.contributors ?? null,
    branches: insights.branches ?? null,
    description: ghRepo.description || '',
    sparkline: generateSparkline(commitActivity, state),
    causes,
    cause: causes?.[0]?.label ?? null,
    causeDetail: causes?.[0]?.detail ?? null,
    timeOfDeath: isDead ? ghRepo.pushed_at.slice(0, 10) : null,
    declared: ghRepo.archived ? ghRepo.updated_at.slice(0, 10) : null,
    lastWords: lastCommit?.commit?.message?.split('\n')[0] ?? null,
    deps: null,
    depsOutdated: null,
    license: ghRepo.license?.spdx_id || 'none',
    survivedBy: ghRepo.forks_count > 0 ? [`${ghRepo.forks_count} fork(s) on GitHub`] : [],
    sourceArchived: ghRepo.archived,
    sourceCreatedAt: ghRepo.created_at,
    sourcePushedAt: ghRepo.pushed_at,
  }
}
