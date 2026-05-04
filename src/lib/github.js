const BASE = 'https://api.github.com'
const MS_DAY = 86400000

function proxyUrl(path) {
  const base = import.meta.env.VITE_GITHUB_PROXY_URL?.replace(/\/$/, '')
  if (!base) throw new Error('VITE_GITHUB_PROXY_URL is not set')
  return `${base}${path}`
}

function daysSince(dateStr) {
  return (Date.now() - new Date(dateStr).getTime()) / MS_DAY
}

function getRateLimitInfo(res) {
  const remaining = res.headers.get('x-ratelimit-remaining')
  const reset = res.headers.get('x-ratelimit-reset')
  return {
    remaining: remaining == null ? null : Number(remaining),
    resetAt: reset ? Number(reset) * 1000 : null,
  }
}

function buildGitHubError(res, msg) {
  const rateLimit = getRateLimitInfo(res)
  const error = new Error(`GitHub ${res.status}: ${msg}`)
  error.status = res.status
  error.rateLimit = rateLimit
  error.isRateLimit = res.status === 403 && rateLimit.remaining === 0
  error.isAuthFailure = res.status === 401
  return error
}

async function ghRequest(path, token) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  return res
}

async function postForm(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body),
  })
  return res
}

async function ghFetch(path, token) {
  const res = await ghRequest(path, token)
  if (res.status === 204 || res.status === 202) return null
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw buildGitHubError(res, msg)
  }
  return res.json()
}

function parseLastPage(linkHeader) {
  if (!linkHeader) return null
  const match = linkHeader.match(/<[^>]*[?&]page=(\d+)[^>]*>;\s*rel="last"/)
  return match ? Number(match[1]) : null
}

async function getPagedCount(path, token) {
  try {
    const res = await ghRequest(path, token)
    if (res.status === 204 || res.status === 202) return null
    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText)
      throw buildGitHubError(res, msg)
    }

    const data = await res.json()
    if (!Array.isArray(data)) return null
    if (data.length === 0) return 0

    const lastPage = parseLastPage(res.headers.get('link'))
    return lastPage ?? data.length
  } catch (error) {
    if (error?.isRateLimit) throw error
    return null
  }
}

export async function getUser(token) {
  return ghFetch('/user', token)
}

export async function startDeviceFlow(clientId, scope = 'repo read:user read:org') {
  const res = await postForm(proxyUrl('/device/code'), { client_id: clientId, scope })
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(`Device flow failed: ${msg}`)
  }
  return res.json()
}

export async function pollDeviceFlow(clientId, deviceCode) {
  const res = await postForm(proxyUrl('/access_token'), {
    client_id: clientId,
    device_code: deviceCode,
    grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
  })
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(`Device flow poll failed: ${msg}`)
  }
  return res.json()
}

export async function getUserRepos(token, onProgress, limit = 500) {
  let page = 1
  let all = []
  while (all.length < limit) {
    const batch = await ghFetch(
      `/user/repos?per_page=100&page=${page}&sort=updated&affiliation=owner`,
      token
    )
    if (!batch?.length) break
    all = [...all, ...batch]
    onProgress?.(all.length, batch.length === 100)
    if (batch.length < 100) break
    page++
  }
  return all
}

export async function getLastCommit(token, owner, repo) {
  try {
    const commits = await ghFetch(`/repos/${owner}/${repo}/commits?per_page=1`, token)
    return commits?.[0] ?? null
  } catch (error) {
    if (error?.isRateLimit) throw error
    return null
  }
}

export async function getCommitSpan(token, owner, repo) {
  try {
    const latestRes = await ghRequest(`/repos/${owner}/${repo}/commits?per_page=1`, token)
    if (latestRes.status === 204 || latestRes.status === 202) return null
    if (!latestRes.ok) {
      const msg = await latestRes.text().catch(() => latestRes.statusText)
      throw buildGitHubError(latestRes, msg)
    }

    const latestCommits = await latestRes.json()
    if (!Array.isArray(latestCommits) || latestCommits.length === 0) return null

    const latest = latestCommits[0]
    const lastCommit = latest.commit?.author?.date || latest.commit?.committer?.date
    const lastPage = parseLastPage(latestRes.headers.get('link'))
    if (!lastPage || lastPage <= 1) {
      return lastCommit
        ? {
            firstCommit: lastCommit.slice(0, 10),
            lastCommit: lastCommit.slice(0, 10),
          }
        : null
    }

    const oldestPage = await ghFetch(`/repos/${owner}/${repo}/commits?per_page=1&page=${lastPage}`, token)
    const oldest = Array.isArray(oldestPage) ? oldestPage[0] : null
    const firstCommit = oldest?.commit?.author?.date || oldest?.commit?.committer?.date

    if (!firstCommit || !lastCommit) return null
    return {
      firstCommit: firstCommit.slice(0, 10),
      lastCommit: lastCommit.slice(0, 10),
    }
  } catch (error) {
    if (error?.isRateLimit) throw error
    return null
  }
}

export async function getCommitActivity(token, owner, repo) {
  try {
    const data = await ghFetch(`/repos/${owner}/${repo}/stats/commit_activity`, token)
    return Array.isArray(data) ? data : null
  } catch (error) {
    if (error?.isRateLimit) throw error
    return null
  }
}

async function getRepoFileText(token, owner, repo, filePath) {
  try {
    const data = await ghFetch(`/repos/${owner}/${repo}/contents/${encodeURIComponent(filePath)}`, token)
    if (!data?.content) return null
    const binary = atob(data.content.replace(/\s/g, ''))
    return new TextDecoder().decode(Uint8Array.from(binary, c => c.charCodeAt(0)))
  } catch (error) {
    if (error?.isRateLimit) throw error
    return null
  }
}

async function getRecentCommits(token, owner, repo, limit = 8) {
  try {
    const commits = await ghFetch(`/repos/${owner}/${repo}/commits?per_page=${limit}`, token)
    return Array.isArray(commits) ? commits : []
  } catch (error) {
    if (error?.isRateLimit) throw error
    return []
  }
}

function countRequirementsLines(text) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && !line.startsWith('-r ') && !line.startsWith('--'))
    .length
}

function countCargoDependencies(text) {
  const section = text.match(/\[dependencies\]([\s\S]*?)(?:\n\[|$)/)
  if (!section) return 0
  return section[1]
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && line.includes('='))
    .length
}

function countGoDependencies(text) {
  const block = text.match(/require\s*\(([\s\S]*?)\)/)
  if (block) {
    return block[1]
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('//'))
      .length
  }
  return /^require\s+/m.test(text) ? 1 : 0
}

async function getDependencySnapshot(token, owner, repo) {
  const [packageJson, requirements, cargo, goMod] = await Promise.all([
    getRepoFileText(token, owner, repo, 'package.json'),
    getRepoFileText(token, owner, repo, 'requirements.txt'),
    getRepoFileText(token, owner, repo, 'Cargo.toml'),
    getRepoFileText(token, owner, repo, 'go.mod'),
  ])

  if (packageJson) {
    try {
      const pkg = JSON.parse(packageJson)
      const deps = Object.keys(pkg.dependencies || {}).length
        + Object.keys(pkg.devDependencies || {}).length
        + Object.keys(pkg.peerDependencies || {}).length
        + Object.keys(pkg.optionalDependencies || {}).length
      return { deps, depsOutdated: null, source: 'package.json' }
    } catch {
      return null
    }
  }
  if (requirements) return { deps: countRequirementsLines(requirements), depsOutdated: null, source: 'requirements.txt' }
  if (cargo) return { deps: countCargoDependencies(cargo), depsOutdated: null, source: 'Cargo.toml' }
  if (goMod) return { deps: countGoDependencies(goMod), depsOutdated: null, source: 'go.mod' }
  return null
}

export async function getRepoLanguages(token, owner, repo) {
  try {
    const data = await ghFetch(`/repos/${owner}/${repo}/languages`, token)
    return data && typeof data === 'object' ? data : null
  } catch (error) {
    if (error?.isRateLimit) throw error
    return null
  }
}

export async function getRepoChangelog(token, owner, repo) {
  const names = ['CHANGELOG.md', 'CHANGELOG', 'changelog.md', 'HISTORY.md', 'RELEASES.md']
  const results = await Promise.all(
    names.map(name =>
      getRepoFileText(token, owner, repo, name)
        .then(text => text ? { text, filename: name } : null)
        .catch(() => null)
    )
  )
  return results.find(Boolean) || null
}

export async function getRepoFileActivity(token, owner, repo) {
  const commits = await getRecentCommits(token, owner, repo, 8)
  if (commits.length === 0) return { files: [], sampledCommits: 0 }

  const details = await Promise.allSettled(
    commits.map(commit => ghFetch(`/repos/${owner}/${repo}/commits/${commit.sha}`, token))
  )

  const rateLimitError = details
    .find(result => result.status === 'rejected' && result.reason?.isRateLimit)
    ?.reason
  if (rateLimitError) throw rateLimitError

  const files = new Map()
  let sampledCommits = 0

  details.forEach((result) => {
    if (result.status !== 'fulfilled' || !result.value) return
    sampledCommits += 1
    const touchedAt = result.value.commit?.author?.date || result.value.commit?.committer?.date
    result.value.files?.forEach((file) => {
      const existing = files.get(file.filename)
      const nextTouched = touchedAt ? touchedAt.slice(0, 10) : existing?.lastTouched || null
      const nextChanges = (existing?.loc || 0) + (file.changes || 0)
      const nextEntry = {
        path: file.filename,
        loc: nextChanges,
        lastTouched: nextTouched,
        decay: nextTouched ? Math.min(1, Math.max(0.08, daysSince(nextTouched) / 240)) : 0.5,
      }
      if (!existing || (nextTouched && nextTouched > existing.lastTouched)) {
        files.set(file.filename, nextEntry)
      } else {
        files.set(file.filename, { ...existing, loc: nextChanges })
      }
    })
  })

  return {
    sampledCommits,
    files: Array.from(files.values())
      .filter(file => file.lastTouched)
      .sort((a, b) => {
        if (b.lastTouched !== a.lastTouched) return b.lastTouched.localeCompare(a.lastTouched)
        return b.loc - a.loc
      })
      .slice(0, 12),
  }
}

export async function getRepoInsights(token, owner, repo) {
  const [lastCommit, commitSpan, commitActivity, contributors, branches, prs, dependencySnapshot] = await Promise.allSettled([
    getLastCommit(token, owner, repo),
    getCommitSpan(token, owner, repo),
    getCommitActivity(token, owner, repo),
    getPagedCount(`/repos/${owner}/${repo}/contributors?per_page=1&anon=1`, token),
    getPagedCount(`/repos/${owner}/${repo}/branches?per_page=1`, token),
    getPagedCount(`/repos/${owner}/${repo}/pulls?state=open&per_page=1`, token),
    getDependencySnapshot(token, owner, repo),
  ])

  const rateLimitError = [lastCommit, commitSpan, commitActivity, contributors, branches, prs, dependencySnapshot]
    .find(result => result.status === 'rejected' && result.reason?.isRateLimit)
    ?.reason

  return {
    lastCommit: lastCommit.status === 'fulfilled' ? lastCommit.value : null,
    commitSpan: commitSpan.status === 'fulfilled' ? commitSpan.value : null,
    commitActivity: commitActivity.status === 'fulfilled' ? commitActivity.value : null,
    contributors: contributors.status === 'fulfilled' ? contributors.value : null,
    branches: branches.status === 'fulfilled' ? branches.value : null,
    prs: prs.status === 'fulfilled' ? prs.value : null,
    dependencySnapshot: dependencySnapshot.status === 'fulfilled' ? dependencySnapshot.value : null,
    rateLimit: rateLimitError?.rateLimit ?? null,
    incomplete: [lastCommit, commitSpan, commitActivity, contributors, branches, prs, dependencySnapshot].some(result => result.status === 'rejected'),
  }
}

export async function enrichRepos(token, repos, onProgress) {
  const results = new Array(repos.length)
  const concurrency = 6
  let nextIndex = 0
  let completed = 0
  let failures = 0
  let rateLimit = null

  async function worker() {
    while (nextIndex < repos.length) {
      const index = nextIndex++
      const repo = repos[index]
      let insights
      try {
        insights = await getRepoInsights(token, repo.owner.login, repo.name)
      } catch (error) {
        if (error?.rateLimit) rateLimit = error.rateLimit
        insights = {
          lastCommit: null,
          commitSpan: null,
          commitActivity: null,
          contributors: null,
          branches: null,
          prs: null,
          dependencySnapshot: null,
          rateLimit: error?.rateLimit ?? null,
          incomplete: true,
        }
      }
      if (insights.incomplete) failures += 1
      if (insights.rateLimit) rateLimit = insights.rateLimit
      results[index] = { repo, insights }
      completed += 1
      onProgress?.(completed, repos.length, repo, insights, { failures, rateLimit })
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, repos.length) }, () => worker()))
  return { results, failures, rateLimit }
}
