#!/usr/bin/env node
/**
 * One Single Redirect: apex -> www, so every page has exactly one address.
 *
 *   node deploy-canonical-host.mjs           # dry run
 *   node deploy-canonical-host.mjs --apply
 *
 * WHY. Verified 2026-08-25: `drnahlah.com/veneers` and `www.drnahlah.com/veneers`
 * both return 200 with byte-identical bodies (md5 fce76ea65f), and the Instatic
 * publisher emits no `<link rel="canonical">` on any page. So the whole site is
 * served twice with nothing saying which address is real — Google picks for you,
 * and the sitemap and the 301 map both target www.
 *
 * ORDER — measured, not assumed. This rule lives in `http_request_dynamic_redirect`,
 * and that phase is evaluated BEFORE `http_request_redirect` where Bulk Redirects
 * run. (I had it backwards at first; production said otherwise:
 * `drnahlah.com/tysons-study-club` went 301 -> `www.../tysons-study-club`
 * 301 -> `www.../meet-dr-nahlah`, two hops.)
 *
 * Consequence: an OLD WordPress URL arriving on the apex takes TWO hops
 * (apex -> www/<same path> -> www/<final target>). On www it is one hop.
 *
 * Tried and rejected: excluding the bulk-list URLs from this rule with
 * `and not (http.request.full_uri in $drnahlah_301)`. Cloudflare refuses it —
 * `20127: the redirect list drnahlah_301 is not allowed` — because a
 * redirect-KIND list can only be referenced through `from_list` on a Bulk
 * Redirect rule, never in a boolean expression.
 *
 * The other way to get one hop is to enumerate all 104 old paths in this
 * expression. Deliberately NOT done: it would duplicate the redirect map into a
 * second place that nothing regenerates, which is precisely the failure mode
 * rule 8 of the workflow directive exists to prevent. Two 301 hops is a
 * non-issue for crawlers (Google follows chains well past two and passes
 * signals through them) and costs a browser-cached round trip once.
 *
 * The PUT replaces the whole phase entrypoint for this zone. The zone had no
 * dynamic-redirect ruleset at all when this was written, but the existing rules
 * are still read and carried through so a re-run cannot silently drop one.
 */
import { cf, zoneFor } from './cf-api.mjs'

const ZONE = 'drnahlah.com'
const CANONICAL = 'https://www.drnahlah.com'
const DESCRIPTION = 'apex -> www canonical host'
const APPLY = process.argv.includes('--apply')

const zone = await zoneFor(ZONE)

const rule = {
  expression: `(http.host eq "${ZONE}")`,
  description: DESCRIPTION,
  action: 'redirect',
  action_parameters: {
    from_value: {
      status_code: 301,
      target_url: { expression: `concat("${CANONICAL}", http.request.uri.path)` },
      /* Keep utm_* and any campaign tagging across the hop. */
      preserve_query_string: true,
    },
  },
  enabled: true,
}

let existing = { rules: [] }
try {
  existing = await cf('GET', `/zones/${zone.id}/rulesets/phases/http_request_dynamic_redirect/entrypoint`)
} catch { /* no entrypoint yet — first rule in this phase */ }

const keep = (existing.rules ?? []).filter((r) => r.description !== DESCRIPTION)

console.log(`zone   ${zone.name} ${zone.id}`)
console.log(`phase  http_request_dynamic_redirect — ${(existing.rules ?? []).length} existing rule(s), ${keep.length} carried through`)
console.log(`rule   ${rule.expression}  ->  301 ${CANONICAL}<path>  (query string preserved)`)

if (!APPLY) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }

const updated = await cf('PUT', `/zones/${zone.id}/rulesets/phases/http_request_dynamic_redirect/entrypoint`, {
  rules: [...keep, rule],
})
console.log(`\napplied — ruleset ${updated.id}, ${updated.rules.length} rule(s) in phase`)
