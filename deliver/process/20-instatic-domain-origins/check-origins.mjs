#!/usr/bin/env node
/**
 * Which URL do I give a teammate for this site's admin?
 *
 *   node check-origins.mjs https://drnahlah.com     one site, every candidate host
 *   node check-origins.mjs --all                    every site in sites.json
 *   node check-origins.mjs --all --json             machine-readable
 *
 * Answers one question: **from which hosts can a person actually USE the
 * Instatic admin?** Handing someone a host that fails this check gives them a
 * login page that renders perfectly and then refuses the login itself with
 * `403 Forbidden: invalid origin` — which reads like a permissions or password
 * problem, is neither, and has cost us real time.
 *
 * Confirmed in a browser 2026-08-28 on www.drnahlah.com and
 * www.masonparkdental.com: the login POST is rejected, so nobody gets in at
 * all. The check is gated on state-changing requests, and logging in is one.
 *
 * ## It needs no credentials, on purpose
 *
 * The check never logs in, sends no cookie and changes nothing, so anyone on
 * the team can run it against any site. That is possible because of the order
 * the server checks things in (`server/auth/security.ts`): the CSRF origin gate
 * runs BEFORE authentication, so an unauthenticated POST already tells the two
 * apart:
 *
 *   403 {"error":"Forbidden: invalid origin"}  -> the ORIGIN was rejected
 *   401 {"error":"Unauthorized"}               -> origin fine, auth stopped it
 *
 * A 401 is the PASS here. It means a logged-in person on that host would have
 * been allowed through.
 *
 * ## What the server is comparing against
 *
 * `resolvePublicOrigins()` (`server/config.ts`):
 *
 *   PUBLIC_ORIGIN set?  -> a COMMA-SEPARATED list, used verbatim
 *   otherwise           -> derived from RENDER_EXTERNAL_URL and/or
 *                          RAILWAY_PUBLIC_DOMAIN
 *
 * `originAllowed()` then allows a request when it has no `Origin` header at
 * all (curl, server-to-server), or when its origin string matches one of those
 * entries. Matching is EXACT on `scheme://host[:port]` after lowercasing and
 * dropping a trailing slash -- `normalizeOrigin` does nothing about `www`, so
 * `example.com` and `www.example.com` are two different origins and BOTH have
 * to be listed. That is the single most common way this is got wrong.
 *
 * The fix is always the same shape, on the Instatic host (Railway):
 *
 *   PUBLIC_ORIGIN=https://www.client.com,https://client.com,https://<app>.up.railway.app
 *
 * First entry is canonical (`expectedOrigin`, and it decides
 * `publicOriginIsHttps()` for secure cookies). Keep the platform host in the
 * list or the toolkit in `18-instatic-embeds` loses its way in.
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const REGISTRY = join(HERE, 'sites.json')

/* A state-changing admin route that does nothing at all without a session and
   without a file, so an unauthenticated probe is inert. It is only ever used to
   find out WHICH gate rejects first.

   NOT `/admin/api/cms/login`, even though that is the request a person actually
   hits first and would read more directly. On an ALLOWED origin a probe there
   reaches authentication and counts as a FAILED LOGIN -- and five failures lock
   the account. A checker anyone is encouraged to run repeatedly must never be
   able to lock a client out of their own site. `inspect-package` answers the
   same question and cannot. */
const PROBE_PATH = '/admin/api/cms/plugins/inspect-package'
const TIMEOUT_MS = 25000

/* Hosts handed out by the hosting platform. They must stay in PUBLIC_ORIGIN so
   the toolkit keeps working, but they must never be CANONICAL once a client
   domain exists -- the first entry is what `expectedOrigin` reports and what
   decides `publicOriginIsHttps()`. */
const PLATFORM_HOST = /\.(up\.railway\.app|onrender\.com|vercel\.app|fly\.dev|herokuapp\.com)$/i

const isPlatform = (origin) => {
  try { return PLATFORM_HOST.test(new URL(origin).hostname) } catch { return false }
}

/** Client domains first, platform hosts last: the order PUBLIC_ORIGIN wants. */
const canonicalFirst = (origins) => [
  ...origins.filter((o) => !isPlatform(o)),
  ...origins.filter(isPlatform),
]

const args = process.argv.slice(2)
const flag = (f) => args.includes(f)
const asJson = flag('--json')
const targets = args.filter((a) => !a.startsWith('--'))

/** Mirror of the server's `normalizeOrigin` -- scheme://host[:port], lowercased. */
function normalizeOrigin(raw) {
  try {
    const u = new URL(String(raw).trim())
    if (!u.hostname) return null
    return `${u.protocol.replace(':', '').toLowerCase()}://${u.hostname.toLowerCase()}${u.port ? ':' + u.port : ''}`
  } catch {
    return null
  }
}

/**
 * The hosts worth testing for a site: what was given, plus the www/apex twin,
 * because that pair is where this goes wrong. Extras from the registry are
 * appended (the platform host, staging, an old domain).
 */
function candidates(input, extras = []) {
  const base = normalizeOrigin(input)
  if (!base) return []
  const out = [base]
  const { protocol, hostname } = new URL(base)
  if (hostname.startsWith('www.')) out.push(`${protocol}//${hostname.slice(4)}`)
  else if (hostname.split('.').length === 2) out.push(`${protocol}//www.${hostname}`)
  for (const e of extras) {
    const n = normalizeOrigin(e)
    if (n && !out.includes(n)) out.push(n)
  }
  return out
}

const withTimeout = async (fn) => {
  const ac = new AbortController()
  const t = setTimeout(() => ac.abort(), TIMEOUT_MS)
  try { return await fn(ac.signal) } finally { clearTimeout(t) }
}

/**
 * Is there an Instatic admin here at all?
 *
 * Distinguishes "no admin here" from "a CDN in front refused to let me look",
 * because they are opposite problems and the second one used to be reported as
 * the first. On 2026-08-29 `www.masonparkdental.com` read `no admin ... (http
 * 403)` while the site was serving perfectly to the visitors it allows: the
 * zone has a Cloudflare rule blocking all non-US traffic, and this checker runs
 * from outside the US. Nothing here can see past that — so say so, and never
 * call it a pass.
 */
async function reachable(origin) {
  try {
    return await withTimeout(async (signal) => {
      const res = await fetch(`${origin}/admin/login`, { redirect: 'follow', signal })
      if (res.status === 200) return { ok: true, status: 200, finalUrl: res.url }
      const edge = edgeBlock(res, await res.text().catch(() => ''))
      return { ok: false, status: res.status, finalUrl: res.url, edge }
    })
  } catch (e) {
    return { ok: false, status: 0, error: e.name === 'AbortError' ? 'timeout' : String(e.cause?.code || e.message) }
  }
}

/**
 * Did an edge network answer instead of the origin? A Cloudflare block is a
 * 403 carrying Cloudflare's own headers and its interstitial, never Instatic's
 * JSON. Reported as UNKNOWN rather than pass or fail: the origin was never
 * reached, so nothing at all was learned about it.
 */
function edgeBlock(res, body) {
  const server = (res.headers.get('server') || '').toLowerCase()
  const cloudflare = server.includes('cloudflare') || res.headers.has('cf-ray')
  if (!cloudflare) return null
  if (res.status === 403 && /Attention Required|you have been blocked|cf-error|__cf/i.test(body)) {
    return { by: 'cloudflare', kind: 'blocked', ray: res.headers.get('cf-ray') || null }
  }
  if (res.status === 403) return { by: 'cloudflare', kind: 'blocked', ray: res.headers.get('cf-ray') || null }
  if ([503, 429].includes(res.status) && /challenge|checking your browser|just a moment/i.test(body)) {
    return { by: 'cloudflare', kind: 'challenge', ray: res.headers.get('cf-ray') || null }
  }
  return null
}

/**
 * Does the admin's CSRF gate accept this origin? Probes `host` while claiming
 * to be `origin`, so it also catches the case where a host serves the admin but
 * is not itself an allowed origin -- which is exactly the Mason Park failure.
 */
async function originAccepted(host, origin) {
  const host_ = host
  try {
    return await withTimeout(async (signal) => {
      const res = await fetch(`${host}${PROBE_PATH}`, {
        method: 'POST',
        headers: { origin },
        redirect: 'manual',
        signal,
      })
      const body = await res.text().catch(() => '')
      if (res.status === 403 && /invalid origin/i.test(body)) return { verdict: 'rejected', status: 403 }
      if (res.status === 401) return { verdict: 'accepted', status: 401 }
      /* A redirect is not a failure and not a pass: this host hands people on
         to another one, and it is THAT host whose origin the browser will send.
         Very common shape -- an apex that 301s to www. Report where it goes so
         the reader fixes the host that actually matters. */
      if (res.status >= 300 && res.status < 400) {
        const to = res.headers.get('location')
        let host = null
        try { host = to ? normalizeOrigin(new URL(to, host_).toString()) : null } catch { host = null }
        return { verdict: 'redirect', status: res.status, redirectsTo: host || to || 'unknown' }
      }
      /* Anything else is not a clean answer -- report it rather than guessing.
         A 404 means this build has no plugin routes and PROBE_PATH needs
         changing. */
      return { verdict: 'unknown', status: res.status, body: body.slice(0, 120) }
    })
  } catch (e) {
    return { verdict: 'unknown', status: 0, error: e.name === 'AbortError' ? 'timeout' : String(e.cause?.code || e.message) }
  }
}

async function checkSite({ client, adminUrl, alternates = [] }) {
  const hosts = candidates(adminUrl, alternates)
  const rows = []
  for (const origin of hosts) {
    const reach = await reachable(origin)
    /* Probe each origin against ITSELF: that is what a browser does when a
       person works in the admin at that address. */
    const gate = reach.ok ? await originAccepted(origin, origin) : { verdict: 'unreachable', status: reach.status }
    rows.push({ origin, servesAdmin: reach.ok, ...gate, reachError: reach.error, edge: reach.edge })
  }
  const usable = rows.filter((r) => r.servesAdmin && r.verdict === 'accepted').map((r) => r.origin)
  /* The trap this whole script exists for: a host that happily serves the login
     PAGE but is not an allowed origin, so the login POST itself is refused. The
     address looks right, the form renders, and nobody gets in. */
  const traps = rows.filter((r) => r.servesAdmin && r.verdict === 'rejected').map((r) => r.origin)
  const blocked = rows.filter((r) => r.edge).map((r) => r.origin)
  /* The registry's own answer to "what link do I send?" must itself verify.
     Before this, a site whose canonical adminUrl was unreachable still exited 0
     as long as ANY host passed — so mason-park read "all clean" while the only
     working host was the platform one nobody is supposed to be given. */
  const canonicalOk = usable.includes(normalizeOrigin(adminUrl))
  return { client, adminUrl, rows, usable, traps, blocked, canonicalOk }
}

function report(results) {
  if (asJson) { console.log(JSON.stringify(results, null, 2)); return }
  let problems = 0
  for (const r of results) {
    console.log(`\n${r.client ? r.client + ' — ' : ''}${r.adminUrl}`)
    for (const row of r.rows) {
      const mark =
        row.edge ? 'BLOCKED  ' :
        !row.servesAdmin ? 'no admin ' :
        row.verdict === 'accepted' ? 'OK       ' :
        row.verdict === 'rejected' ? 'TRAP     ' :
        row.verdict === 'redirect' ? 'redirect ' : '???      '
      const why =
        row.edge ? `${row.edge.by} ${row.edge.kind} this check (http ${row.status}) — NOTHING was learned about the origin behind it` :
        !row.servesAdmin ? `does not serve /admin/login (${row.reachError || 'http ' + row.status})` :
        row.verdict === 'accepted' ? 'serves the admin AND is an allowed origin' :
        row.verdict === 'rejected' ? 'serves the login page but REFUSES THE LOGIN — 403 invalid origin' :
        row.verdict === 'redirect' ? `${row.status} -> ${row.redirectsTo} — people end up there, so that is the host that must be allowed` :
        `unexpected ${row.status} ${row.body || row.error || ''}`
      console.log(`  ${mark} ${row.origin.padEnd(42)} ${why}`)
    }
    if (r.usable.length) {
      /* Prefer the client's own domain over the platform host: it is the one a
         teammate should have, and the one that survives a platform move. */
      const preferred = canonicalFirst(r.usable)
      console.log(`\n  GIVE THIS LINK:  ${preferred[0]}/admin`)
      if (preferred.length > 1) console.log(`  also works:      ${preferred.slice(1).map((u) => u + '/admin').join(', ')}`)
    } else {
      console.log('\n  NO USABLE ADMIN URL — do not hand any of these out.')
      problems++
    }
    /* Registry says one thing, the running server says another. Either the
       domain is broken or sites.json is stale; both are problems, and neither
       is cured by some other host happening to work. */
    if (r.client && r.usable.length && !r.canonicalOk) {
      problems++
      console.log(`\n  ⚠ sites.json calls ${r.adminUrl} the canonical admin URL, and it did NOT verify.`)
      console.log('    Either fix that host or change adminUrl — do not quietly hand out the')
      console.log('    platform host instead; it is the fallback, not the address people get.')
    }
    if (r.blocked?.length) {
      problems++
      console.log(`\n  ⚠ ${r.blocked.length} host(s) blocked this check at the edge: ${r.blocked.join(', ')}`)
      console.log('    A CDN answered before the origin did, so these rows are UNKNOWN, not failures.')
      console.log('    Usual cause here: a Cloudflare rule blocking traffic from outside the US, which')
      console.log('    blocks this checker too (and ACME validation — see the module doc). Verify from')
      console.log('    an allowed network, or exempt the check, before believing anything about them.')
    }
    if (r.traps.length) {
      problems++
      console.log(`\n  ⚠ ${r.traps.length} trap host(s): ${r.traps.join(', ')}`)
      console.log('    Someone given one of these cannot log in at all: the login POST is refused.')
      console.log('    Fix on the Instatic host (Railway) — set PUBLIC_ORIGIN to a comma-separated')
      console.log('    list containing EVERY host people use, canonical one first:')
      console.log(`      PUBLIC_ORIGIN=${canonicalFirst([...r.usable, ...r.traps]).join(',')}`)
      /* This tool only sees the hosts it was given. Anything already in
         PUBLIC_ORIGIN that was not passed in -- the platform host most of all --
         is invisible here, and pasting this line as-is would DROP it and break
         INSTATIC_BASE_URL for the 18-instatic-embeds toolkit. Say so every
         time; a suggestion that silently deletes config is worse than none. */
      console.log('    MERGE this with the existing value — do not paste over it. Any host')
      console.log('    already listed (especially the <app>.up.railway.app platform host) must')
      console.log('    stay, or INSTATIC_BASE_URL and the 18-instatic-embeds toolkit break.')
      console.log('    Then redeploy and re-run this check.')
    }
  }
  console.log(problems === 0 ? '\nAll checked sites are clean.\n' : `\n${problems} problem(s) found.\n`)
  return problems
}

let sites = []
if (flag('--all')) {
  if (!existsSync(REGISTRY)) {
    console.error(`no sites.json next to this script (${REGISTRY})`)
    process.exit(2)
  }
  sites = JSON.parse(readFileSync(REGISTRY, 'utf8')).sites.filter((s) => s.adminUrl)
} else if (targets.length) {
  sites = targets.map((t) => ({ client: null, adminUrl: t }))
} else {
  console.log(`usage:
  node check-origins.mjs https://client.com        check one site (and its www/apex twin)
  node check-origins.mjs --all                     check every site in sites.json
  node check-origins.mjs --all --json              machine-readable

Sends no credentials and changes nothing. Safe for anyone to run.`)
  process.exit(0)
}

const results = []
for (const s of sites) results.push(await checkSite(s))
const problems = report(results)
process.exit(problems === 0 ? 0 : 1)
