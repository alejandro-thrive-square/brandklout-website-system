/**
 * Creates (replaces) the zone's Redirect Rules: ifadentistry.com -> https://www.ifadentistry.com,
 * path and query kept, 301, as WordPress did. www is the canonical host (WordPress's canonical tags,
 * Google's index, the first PUBLIC_ORIGIN entry).
 *
 * Only run this once https://www.ifadentistry.com/ serves the site: redirecting to a dead www takes
 * the whole domain down.
 *
 * The shared CLOUDFLAREAPI token gets a 403 on this phase. Pass a token that holds
 * "Dynamic URL Redirects Write" on the zone in CF_TOKEN (on 2026-09-11 a 2-hour token was minted
 * from the shared one, which holds "Account API Tokens Write", then deleted after use).
 *
 * Usage: CF_TOKEN=... node set-redirect-rules.mjs [--apply] > <log> 2>&1
 */
const ZONE = '223386e4eda469fb038a4c716bd3f0fe' // ifadentistry.com, Brandklout's account
const token = process.env.CF_TOKEN
if (!token) throw new Error('set CF_TOKEN to a token with Dynamic URL Redirects Write on the zone')

const rules = [
  {
    description: 'Root to www (as WordPress did)',
    expression: '(http.host eq "ifadentistry.com")',
    action: 'redirect',
    action_parameters: {
      from_value: {
        status_code: 301,
        target_url: { expression: 'concat("https://www.ifadentistry.com", http.request.uri.path)' },
        preserve_query_string: true,
      },
    },
  },
]

if (!process.argv.includes('--apply')) {
  console.log(JSON.stringify(rules, null, 1))
  console.log('\ndry run: re-run with --apply')
} else {
  const r = await fetch(`https://api.cloudflare.com/client/v4/zones/${ZONE}/rulesets/phases/http_request_dynamic_redirect/entrypoint`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ rules }),
  })
  const j = await r.json()
  console.log(r.status, j.success ? `ok: ${j.result.rules.length} rule(s), ruleset ${j.result.id}` : JSON.stringify(j.errors))
  process.exitCode = j.success ? 0 : 1
}
