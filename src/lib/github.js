const BASE = 'https://api.github.com'

async function ghFetch(path, token) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (res.status === 204 || res.status === 202) return null
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText)
    throw new Error(`GitHub ${res.status}: ${msg}`)
  }
  return res.json()
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
