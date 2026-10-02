#!/usr/bin/env node
/**
 * Mint (or revoke) a short-lived Cloudflare token scoped to ONE zone, from the shared
 * account-owned token.
 *
 * Origin: done by hand with POST /accounts/{id}/tokens on bk-ifa-dentistry (2026-09-11, 2 h),
 * bk-stone (2026-09-15), bk-stone-med-spa (2026-09-15), bk-mason-park (2026-09-17, 3 h) and
 * brandklout.ai (2026-09-22). Promoted as a script 2026-09-23.
 *
 * Why: the shared CLOUDFLAREAPI token is account-owned and has NO zone permissions (DNS, zone
 * settings, routes, redirect rules answer 403/10000). It does hold Account API Tokens Write,
 * so it can mint a narrow token for one zone and one session.
 *
 *   node mint-token.mjs --zone example.com --preset launch --hours 3 > %TEMP%\cf-token.json
 *   node mint-token.mjs --revoke <tokenId>
 *   node mint-token.mjs --list-groups > groups.txt        # permission group names, to add a preset
 *
 * The token VALUE goes to stdout as JSON { id, value, expires_on } and nowhere else. Redirect it
 * to a file in the session scratchpad (never the repo), export it as CLOUDFLARE_API_TOKEN for
 * the other scripts, and revoke it when the session ends.
 *
 * Presets (permission group names as Cloudflare lists them; the script fails if one is missing):
 *   launch    DNS, zone settings, SSL, workers routes + scripts, transform rules, cache purge
 *   redirects Workers routes + scripts, dynamic redirects, DNS (for a legacy-redirect Worker)
 *   pages     Pages Write + Account Settings Read (Cloudflare Pages static mirror)
 *
 * Gotchas:
 *   - A fresh token answers 10000 "Authentication error" for ~5 s. cf-api.mjs retries.
 *   - The http_request_dynamic_redirect phase (Redirect Rules) stays 403 for tokens minted from
 *     an account-owned token (brandklout.ai, 2026-09-22). A canonical-host 301 is then a
 *     dashboard job; stop after two tries instead of adding scopes.
 */
import { cf, accountId, zoneFor, arg, flag } from './cf-api.mjs'

const acct = await accountId()

if (flag('list-groups')) {
  const groups = await cf('GET', `/accounts/${acct}/tokens/permission_groups`)
  for (const g of groups) console.log(`${g.name}\t${(g.scopes ?? []).join(',')}\t${g.id}`)
  process.exit(0)
}

const revoke = arg('revoke')
if (revoke) {
  await cf('DELETE', `/accounts/${acct}/tokens/${revoke}`)
  console.error(`revoked ${revoke}`)
  process.exit(0)
}

const ZONE = arg('zone')
const PRESET = arg('preset', 'launch')
const HOURS = Number(arg('hours', '3'))
if (!ZONE && PRESET !== 'pages') { console.error('usage: node mint-token.mjs --zone <domain> [--preset launch|redirects|pages] [--hours 3]'); process.exit(2) }

const PRESETS = {
  launch: {
    zone: ['Zone Read', 'DNS Write', 'Zone Settings Write', 'SSL and Certificates Write', 'Workers Routes Write',
      'Zone Transform Rules Write', 'Dynamic URL Redirects Write', 'Cache Purge'],
    account: ['Workers Scripts Write'],
  },
  redirects: {
    zone: ['Zone Read', 'DNS Write', 'Workers Routes Write', 'Dynamic URL Redirects Write', 'Cache Purge'],
    account: ['Workers Scripts Write'],
  },
  pages: { zone: ['Zone Read', 'DNS Write'], account: ['Pages Write', 'Account Settings Read'] },
}
const want = PRESETS[PRESET]
if (!want) { console.error(`unknown preset ${PRESET}`); process.exit(2) }

const groups = await cf('GET', `/accounts/${acct}/tokens/permission_groups`)
/* Several groups share a name across scopes (e.g. Cache Purge); pick the one whose scope matches. */
const pick = (name, scope) => {
  const hits = groups.filter((g) => g.name === name)
  return hits.find((g) => (g.scopes ?? []).some((s) => s.endsWith(scope))) ?? hits[0]
}
const missing = []
const resolveGroups = (names, scope) => names.map((n) => {
  const g = pick(n, scope)
  if (!g) missing.push(n)
  return g && { id: g.id }
}).filter(Boolean)

const policies = []
if (ZONE && want.zone.length) {
  const zone = await zoneFor(ZONE)
  const zoneGroups = resolveGroups(want.zone, '.zone')
  policies.push({ effect: 'allow', resources: { [`com.cloudflare.api.account.zone.${zone.id}`]: '*' }, permission_groups: zoneGroups })
}
if (want.account.length) {
  policies.push({ effect: 'allow', resources: { [`com.cloudflare.api.account.${acct}`]: '*' }, permission_groups: resolveGroups(want.account, '.account') })
}
if (missing.length) {
  console.error(`permission groups not found: ${missing.join(', ')}. Run --list-groups and fix the preset.`)
  process.exit(1)
}

const expires = new Date(Date.now() + HOURS * 3600e3).toISOString().replace(/\.\d{3}Z$/, 'Z')
const made = await cf('POST', `/accounts/${acct}/tokens`, {
  name: `agent-${PRESET}-${ZONE ?? 'account'}-${new Date().toISOString().slice(0, 16)}`,
  policies,
  expires_on: expires,
})
process.stdout.write(JSON.stringify({ id: made.id, value: made.value, expires_on: expires, zone: ZONE ?? null, preset: PRESET }) + '\n')
console.error(`minted token ${made.id} (${PRESET}, ${ZONE ?? 'account'}), expires ${expires}. Revoke: node mint-token.mjs --revoke ${made.id}`)
