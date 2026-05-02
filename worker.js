/**
 * Cloudflare Worker — GitHub OAuth Device Flow CORS proxy
 *
 * Routes:
 *   POST /device/code   → https://github.com/login/device/code
 *   POST /access_token  → https://github.com/login/oauth/access_token
 *
 * Deploy:
 *   npx wrangler deploy
 *
 * Then set VITE_GITHUB_PROXY_URL=https://<worker>.workers.dev in your .env
 */
export default {
  async fetch(req) {
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors() })
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const { pathname } = new URL(req.url)
    const targets = {
      '/device/code':  'https://github.com/login/device/code',
      '/access_token': 'https://github.com/login/oauth/access_token',
    }
    const target = targets[pathname]
    if (!target) return new Response('Not found', { status: 404 })

    const body = await req.text()
    const res = await fetch(target, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    return new Response(await res.text(), {
      status: res.status,
      headers: { 'Content-Type': 'application/json', ...cors() },
    })
  },
}

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
  }
}
