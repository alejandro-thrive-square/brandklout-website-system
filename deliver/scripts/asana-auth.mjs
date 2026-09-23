/**
 * One-time OAuth bootstrap for the Brandklout Asana integration.
 *
 * Runs the authorization-code + PKCE flow against the pre-registered Webzite
 * app, then writes access/refresh tokens to ~/.webzite/asana-brandklout.json
 * (outside this repository). Re-run only if the grant is revoked.
 *
 * Usage (PowerShell, from the repo root):
 *   $env:ASANA_CLIENT_SECRET = Read-Host "Asana client secret"
 *   node deliver/scripts/asana-auth.mjs
 *   Remove-Item Env:ASANA_CLIENT_SECRET
 *
 * The redirect URI below must stay byte-identical to the Redirect URL
 * registered on the Asana app, or authorization fails with `invalid_request`.
 */
import { createServer } from 'node:http'
import { createHash, randomBytes } from 'node:crypto'
import { AUTH_URL, CLIENT_ID, TOKEN_PATH, TOKEN_URL, saveTokens } from './asana-lib.mjs'

const REDIRECT_URI = 'http://localhost:8080/callback'
const PORT = 8080

const clientSecret = process.env.ASANA_CLIENT_SECRET
if (!clientSecret) {
  console.error('ASANA_CLIENT_SECRET is not set. See the usage block in this file.')
  process.exit(1)
}

const b64url = (buf) => buf.toString('base64url')
const verifier = b64url(randomBytes(48))
const challenge = b64url(createHash('sha256').update(verifier).digest())
const state = b64url(randomBytes(16))

const authUrl = new URL(AUTH_URL)
for (const [k, v] of Object.entries({
  response_type: 'code',
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  state,
  code_challenge: challenge,
  code_challenge_method: 'S256',
  scope: 'default',
})) {
  authUrl.searchParams.set(k, v)
}

const captured = await new Promise((resolve, reject) => {
  const server = createServer((req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`)
    if (!url.pathname.startsWith('/callback')) {
      res.writeHead(404).end()
      return
    }
    const params = Object.fromEntries(url.searchParams)
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(
      params.code
        ? '<h2>Authorized. You can close this tab and return to the terminal.</h2>'
        : `<h2>Authorization failed: ${params.error ?? 'no code returned'}</h2>`
    )
    server.close()
    params.code ? resolve(params) : reject(new Error(params.error ?? 'no code returned'))
  })
  server.on('error', (e) =>
    reject(
      e.code === 'EADDRINUSE'
        ? new Error(`Port ${PORT} is in use. Close whatever holds it and retry.`)
        : e
    )
  )
  server.listen(PORT, '127.0.0.1', () => {
    console.log('Open this URL in your browser and authorize:\n')
    console.log(authUrl.toString())
    console.log(`\nWaiting for the callback on ${REDIRECT_URI} ...`)
  })
})

if (captured.state !== state) {
  throw new Error('State mismatch — aborting rather than trusting the callback.')
}

// client_secret_post: verified working for this app. Basic auth is advertised
// by Asana's metadata but is NOT verified here — see asana-lib.mjs.
const res = await fetch(TOKEN_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    client_secret: clientSecret,
    redirect_uri: REDIRECT_URI,
    code: captured.code,
    code_verifier: verifier,
  }),
})
const json = await res.json().catch(() => ({}))
if (!res.ok || !json.access_token) {
  console.error(`Token exchange failed (${res.status}).`)
  console.error(json.error_description ?? JSON.stringify(json, null, 2))
  process.exit(1)
}

await saveTokens({
  clientId: CLIENT_ID,
  clientSecret,
  accessToken: json.access_token,
  refreshToken: json.refresh_token,
  expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000,
  scope: json.scope,
  user: json.data ? { gid: json.data.gid, name: json.data.name, email: json.data.email } : null,
})

console.log('\nAuthorized successfully.')
console.log(`  user       : ${json.data?.name} <${json.data?.email}>`)
console.log(`  scope      : ${json.scope}`)
console.log(`  refresh    : ${json.refresh_token ? 'stored' : 'MISSING — re-auth will be needed hourly'}`)
console.log(`  credentials: ${TOKEN_PATH}  (outside the repo — never commit)`)
