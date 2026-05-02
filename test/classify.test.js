import test from 'node:test'
import assert from 'node:assert/strict'

import {
  classifyState,
  computeVitals,
  diagnoseCause,
  mapGitHubRepo,
  reclassifyMappedRepo,
} from '../src/lib/classify.js'

function isoDaysAgo(days) {
  return new Date(Date.now() - days * 86400000).toISOString()
}

function makeRepo(overrides = {}) {
  return {
    id: 42,
    name: 'dead-repo',
    owner: { login: 'chris' },
    html_url: 'https://github.com/chris/dead-repo',
    archived: false,
    pushed_at: isoDaysAgo(10),
    updated_at: isoDaysAgo(5),
    created_at: isoDaysAgo(120),
    language: 'JavaScript',
    stargazers_count: 2,
    forks_count: 0,
    open_issues_count: 3,
    description: 'A repo.',
    topics: [],
    size: 120,
    license: { spdx_id: 'MIT' },
    ...overrides,
  }
}

test('classifyState respects default lifecycle thresholds', () => {
  assert.equal(classifyState(makeRepo({ pushed_at: isoDaysAgo(7) })), 'alive')
  assert.equal(classifyState(makeRepo({ pushed_at: isoDaysAgo(45) })), 'fading')
  assert.equal(classifyState(makeRepo({ pushed_at: isoDaysAgo(200) })), 'flatlined')
  assert.equal(classifyState(makeRepo({ pushed_at: isoDaysAgo(500) })), 'dead')
})

test('classifyState treats archived repos as dead regardless of activity', () => {
  assert.equal(classifyState(makeRepo({ archived: true, pushed_at: isoDaysAgo(1) })), 'dead')
})

test('classifyState honors custom thresholds', () => {
  const thresholds = { aliveDays: 5, fadingDays: 20, deadDays: 60 }
  assert.equal(classifyState(makeRepo({ pushed_at: isoDaysAgo(6) }), thresholds), 'fading')
  assert.equal(classifyState(makeRepo({ pushed_at: isoDaysAgo(30) }), thresholds), 'flatlined')
  assert.equal(classifyState(makeRepo({ pushed_at: isoDaysAgo(75) }), thresholds), 'dead')
})

test('computeVitals returns 0 for dead states and decays for fading', () => {
  const fadingRepo = makeRepo({ pushed_at: isoDaysAgo(60) })
  assert.equal(computeVitals(fadingRepo, 'dead'), 0)
  assert.equal(computeVitals(fadingRepo, 'flatlined'), 0)
  assert.ok(computeVitals(fadingRepo, 'alive') >= 40)
  assert.ok(computeVitals(fadingRepo, 'fading') > 0)
  assert.ok(computeVitals(fadingRepo, 'fading') < 38)
})

test('diagnoseCause identifies shipped archived repos', () => {
  const causes = diagnoseCause(makeRepo({
    archived: true,
    stargazers_count: 75,
    forks_count: 12,
    pushed_at: isoDaysAgo(500),
  }))

  assert.equal(causes[0].label, 'Shipped & Archived')
  assert.ok(causes[0].confidence >= 90)
})

test('diagnoseCause identifies never-started repos', () => {
  const causes = diagnoseCause(makeRepo({
    created_at: isoDaysAgo(1),
    pushed_at: isoDaysAgo(1),
    size: 1,
    description: '',
  }))

  assert.equal(causes[0].label, 'Never Started')
})

test('mapGitHubRepo maps GitHub data and derives issue count from PR count', () => {
  const repo = makeRepo({
    open_issues_count: 9,
    pushed_at: isoDaysAgo(400),
    created_at: isoDaysAgo(800),
  })
  const insights = {
    prs: 4,
    branches: 7,
    contributors: 3,
    dependencySnapshot: { deps: 11, depsOutdated: null, source: 'package.json' },
    commitActivity: [{ total: 2 }, { total: 5 }, { total: 1 }, { total: 4 }],
    lastCommit: { commit: { message: 'fix: final sync\n\nextra body' } },
  }

  const mapped = mapGitHubRepo(repo, insights)

  assert.equal(mapped.id, 'gh-42')
  assert.equal(mapped.issues, 5)
  assert.equal(mapped.prs, 4)
  assert.equal(mapped.branches, 7)
  assert.equal(mapped.contributors, 3)
  assert.equal(mapped.commitsTotal, 12)
  assert.equal(mapped.commitsLast30, 12)
  assert.equal(mapped.lastWords, 'fix: final sync')
  assert.equal(mapped.deps, 11)
  assert.equal(mapped.depsOutdated, null)
  assert.equal(mapped.depsSource, 'package.json')
  assert.equal(mapped.state, 'dead')
  assert.equal(mapped.timeOfDeath, repo.pushed_at.slice(0, 10))
})

test('mapGitHubRepo derives active commit span from commit activity when available', () => {
  const repo = makeRepo({
    created_at: '2025-02-01T00:00:00.000Z',
    pushed_at: '2025-11-24T00:00:00.000Z',
  })
  const insights = {
    commitActivity: [
      { week: Date.UTC(2025, 10, 17) / 1000, total: 3 },
      { week: Date.UTC(2025, 10, 24) / 1000, total: 1 },
    ],
  }

  const mapped = mapGitHubRepo(repo, insights)

  assert.equal(mapped.firstCommit, '2025-02-01')
  assert.equal(mapped.activeFirstCommit, '2025-11-17')
  assert.equal(mapped.activeLastCommit, '2025-11-24')
  assert.equal(mapped.activeLifespan, '1w')
})

test('mapGitHubRepo prefers explicit commit span over repo creation date', () => {
  const repo = makeRepo({
    created_at: '2025-02-01T00:00:00.000Z',
    pushed_at: '2025-11-24T00:00:00.000Z',
  })

  const mapped = mapGitHubRepo(repo, {
    commitSpan: {
      firstCommit: '2025-02-01',
      lastCommit: '2025-02-02',
    },
    commitActivity: [
      { week: Date.UTC(2025, 10, 17) / 1000, total: 3 },
      { week: Date.UTC(2025, 10, 24) / 1000, total: 1 },
    ],
  })

  assert.equal(mapped.activeFirstCommit, '2025-02-01')
  assert.equal(mapped.activeLastCommit, '2025-02-02')
  assert.equal(mapped.activeLifespan, '1d')
})

test('reclassifyMappedRepo reapplies thresholds to cached repo snapshots', () => {
  const mapped = {
    id: 'gh-42',
    state: 'alive',
    vitals: 90,
    lastCommit: isoDaysAgo(25).slice(0, 10),
    sourcePushedAt: isoDaysAgo(25),
    sourceArchived: false,
    declared: null,
  }

  const reclassified = reclassifyMappedRepo(mapped, {
    aliveDays: 10,
    fadingDays: 20,
    deadDays: 30,
  })

  assert.equal(reclassified.state, 'flatlined')
  assert.equal(reclassified.timeOfDeath, mapped.lastCommit)
})
