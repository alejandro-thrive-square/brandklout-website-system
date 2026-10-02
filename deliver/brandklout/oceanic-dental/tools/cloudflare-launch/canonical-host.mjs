#!/usr/bin/env node
/**
 * One Single Redirect so every page has exactly one address: apex -> www (or www -> apex).
 *
 * Origin: bk-dr-nahlah cloudflare-launch/deploy-canonical-host.mjs (2026-08-25) and bk-ifa-dentistry
 * docs/dns/set-redirect-rules.mjs (2026-09-11). Generalized 2026-09-23: host and direction are
 * arguments, the ACME path is exempt, and it refuses to run while the target host does not serve.
 * (The 19 original also referenced an undefined CFG; this replaces it.)
 *
 *   node canonical-host.mjs --zone example.com --to https://www.example.com          # dry run
 *   node canonical-host.mjs --zone example.com --to https://www.example.com --apply
 *   node canonical-host.mjs --zone example.com --to https://example.com --apply      # www -> apex
 *
 * Rules:
 *   - Only after the target host serves 200. A redirect to a dead www takes the whole domain down.
 *   - Path and query string are kept. /.well-known/acme-challenge/ is exempt so Railway can renew
 *     the certificate of the redirected host.
 *   - The PUT replaces the zone's whole dynamic-redirect phase, so existing rules are read and kept.
 *   - Single Redirects run BEFORE Bulk Redirects: an old URL on the apex then takes two hops. Fine.
 *
 * Token: minted with mint-token.mjs --preset launch (Dynamic URL Redirects Write). On brandklout.ai
 * (2026-09-22) this phase answered 403 for every token minted from the account-owned token; IFA and
 * Dr. Nahlah succeeded. If it 403s twice, make the rule in the dashboard (Rules > Redirect Rules)
 * with the expression and target printed by the dry run, and stop minting scopes.
 */
import { cf, zoneFor, entrypoint, stripRule, arg, flag } from './cf-api.mjs'

const ZONE = arg('zone')
const TO = (arg('to') || '').replace(/\/$/, '')
if (!ZONE || !/^https:\/\/[^/]+$/.test(TO)) { console.error('usage: node canonical-host.mjs --zone <apex> --to https://<canonical host> [--apply]'); process.exit(2) }
const toHost = TO.replace('https://', '')
const fromHost = toHost === ZONE ? `www.${ZONE}` : ZONE
if (![ZONE, `www.${ZONE}`].includes(toHost)) { console.error(`--to must be ${ZONE} or www.${ZONE}`); process.exit(2) }
const DESCRIPTION = `${fromHost} -> ${toHost} canonical host`
const PHASE = 'http_request_dynamic_redirect'

const probe = await fetch(TO + '/', { redirect: 'manual' }).catch((e) => ({ status: e.message }))
console.log(`target  ${TO}/ answers ${probe.status}`)
if (probe.status !== 200) { console.error('the canonical host does not serve 200 yet; a redirect to it would take the domain down. Stop.'); process.exit(1) }

const zone = await zoneFor(ZONE)
const rule = {
  description: DESCRIPTION,
  expression: `(http.host eq "${fromHost}" and not starts_with(http.request.uri.path, "/.well-known/acme-challenge/"))`,
  action: 'redirect',
  action_parameters: { from_value: { status_code: 301, target_url: { expression: `concat("${TO}", http.request.uri.path)` }, preserve_query_string: true } },
  enabled: true,
}
const ep = await entrypoint(zone.id, PHASE)
const keep = (ep?.rules ?? []).filter((r) => r.description !== DESCRIPTION)

console.log(`zone    ${zone.name} ${zone.id}`)
console.log(`phase   ${PHASE}: ${(ep?.rules ?? []).length} existing rule(s), ${keep.length} kept`)
console.log(`rule    ${rule.expression}\n        -> 301 ${TO}<path>, query kept`)
if (!flag('apply')) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }

try {
  const updated = await cf('PUT', `/zones/${zone.id}/rulesets/phases/${PHASE}/entrypoint`, { rules: [...keep.map(stripRule), rule] }, { retries: 2 })
  console.log(`\napplied: ruleset ${updated.id}, ${updated.rules.length} rule(s)`)
} catch (e) {
  console.error(`\n${e.message}\nIf this is 403, create the rule in the dashboard with the expression and target above.`)
  process.exit(1)
}
const check = await fetch(`https://${fromHost}/?canonical-check=1`, { redirect: 'manual' }).catch(() => null)
console.log(`check   https://${fromHost}/ -> ${check?.status} ${check?.headers.get('location') ?? ''}`)
