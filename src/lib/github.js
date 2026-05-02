const BASE = 'https://api.github.com'

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

async function ghFetch(path, token) {
  const res = await ghRequest(path, token)
  if (res.status === 204 || res.status === 202) return null
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(`GitHub ${res.status}: ${msg}`)
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
    if (!res.ok) return null

    const data = await res.json()
    if (!Array.isArray(data)) return null
    if (data.length === 0) return 0

    const lastPage = parseLastPage(res.headers.get('link'))
    return lastPage ?? data.length
  } catch {
    return null
  }
}

export async function getUser(token) {
  return ghFetch('/user', token)
}

export async function getUserRepos(token, onProgress) {
  let page = 1
  let all = []
  while (all.length < 500) {
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
  } catch {
    return null
  }
}

export async function getCommitActivity(token, owner, repo) {
  try {
    const data = await ghFetch(`/repos/${owner}/${repo}/stats/commit_activity`, token)
    return Array.isArray(data) ? data : null
  } catch {
    return null
  }
}

export async function getRepoInsights(token, owner, repo) {
  const [lastCommit, commitActivity, contributors, branches, prs] = await Promise.all([
    getLastCommit(token, owner, repo),
    getCommitActivity(token, owner, repo),
    getPagedCount(`/repos/${owner}/${repo}/contributors?per_page=1&anon=1`, token),
    getPagedCount(`/repos/${owner}/${repo}/branches?per_page=1`, token),
    getPagedCount(`/repos/${owner}/${repo}/pulls?state=open&per_page=1`, token),
  ])

  return {
    lastCommit,
    commitActivity,
    contributors,
    branches,
    prs,
  }
}

export async function enrichRepos(token, repos, onProgress) {
  const results = new Array(repos.length)
  const concurrency = 6
  let nextIndex = 0
  let completed = 0

  async function worker() {
    while (nextIndex < repos.length) {
      const index = nextIndex++
      const repo = repos[index]
      const insights = await getRepoInsights(token, repo.owner.login, repo.name)
      results[index] = { repo, insights }
      completed += 1
      onProgress?.(completed, repos.length, repo, insights)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, repos.length) }, () => worker()))
  return results
}
