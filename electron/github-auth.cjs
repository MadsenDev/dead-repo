const { shell } = require('electron')
const http = require('http')
const https = require('https')
const { URL } = require('url')

const CLIENT_ID = process.env.GITHUB_CLIENT_ID
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET
const REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/callback'
const SCOPES = 'repo read:user read:org'
const TIMEOUT_MS = 5 * 60 * 1000

let authServer = null

function startOAuth() {
  return new Promise((resolve, reject) => {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      reject(new Error('GitHub OAuth is not configured. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.'))
      return
    }

    if (authServer) {
      authServer.close()
      authServer = null
    }

    const state = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    let timer = null

    const cleanup = () => {
      if (timer) clearTimeout(timer)
      if (authServer) { authServer.close(); authServer = null }
    }

    authServer = http.createServer((req, res) => {
      const url = new URL(req.url, REDIRECT_URI)
      if (url.pathname !== '/callback') { res.writeHead(404); res.end(); return }

      const code = url.searchParams.get('code')
      const returnedState = url.searchParams.get('state')
      const error = url.searchParams.get('error')

      const ok = !error && code && returnedState === state

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(`<!doctype html><html><body style="background:#0a0d0c;color:#8a918f;font-family:'IBM Plex Mono',monospace;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:12px">
        <div style="color:${ok ? '#3aad5a' : '#c94040'};font-size:13px;letter-spacing:0.1em">${ok ? '✓ Authorization complete' : `⚠ ${error || 'Authorization failed'}`}</div>
        <div style="font-size:11px">Return to Dead Repo.</div>
      </body></html>`)

      cleanup()

      if (error) { reject(new Error(error)); return }
      if (!code) { reject(new Error('No authorization code returned')); return }
      if (returnedState !== state) { reject(new Error('State mismatch')); return }

      exchangeCode(code).then(resolve).catch(reject)
    })

    authServer.on('error', (err) => {
      cleanup()
      reject(new Error(`OAuth server failed to start: ${err.message}`))
    })

    const redirectUrl = new URL(REDIRECT_URI)

    authServer.listen(Number(redirectUrl.port || 80), redirectUrl.hostname, () => {
      // Timeout if user doesn't complete auth
      timer = setTimeout(() => {
        cleanup()
        reject(new Error('Authorization timed out'))
      }, TIMEOUT_MS)

      const params = new URLSearchParams({
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: SCOPES,
        state,
      })
      shell.openExternal(`https://github.com/login/oauth/authorize?${params}`).catch((error) => {
        cleanup()
        reject(error)
      })
    })
  })
}

function cancelOAuth() {
  if (authServer) {
    authServer.close()
    authServer = null
  }
}

function exchangeCode(code) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI,
    })

    const req = https.request({
      hostname: 'github.com',
      path: '/login/oauth/access_token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'DeadRepo/2.4.1',
      },
    }, (res) => {
      let data = ''
      res.on('data', chunk => data += chunk)
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          if (parsed.error) reject(new Error(parsed.error_description || parsed.error))
          else if (!parsed.access_token) reject(new Error('No access token in response'))
          else resolve(parsed.access_token)
        } catch {
          reject(new Error('Failed to parse token response'))
        }
      })
    })

    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

module.exports = { startOAuth, cancelOAuth }
