#!/usr/bin/env node
/**
 * Is the DNS pointer for each custom domain still the one Railway expects?
 *
 *   node check-dns.mjs             every site in sites.json
 *   node check-dns.mjs mason-park  one client
 *   node check-dns.mjs --json      machine-readable
 *   node check-dns.mjs --record    print what Railway says now, in sites.json shape
 *
 * ## The thing this exists to catch
 *
 * Railway mints a RANDOM CNAME target per custom domain — `l6wotb3m.up.railway.app`,
 * `pkez8lkn.up.railway.app`. That target is **stable for the life of the domain
 * record** and a redeploy does not touch it (see the evidence table in
 * instatic-domain-origins.md). It changes for exactly one reason: the domain
 * was DELETED and RE-ADDED in Railway, which mints a fresh one. Nothing warns
 * you. DNS still points at the old target, that target now belongs to nobody,
 * and the site is down until someone edits Cloudflare.
 *
 * That happened to Mason Park on 2026-08-28. Both custom domains were re-created
 * at 08:41 UTC and both targets changed in the same minute.
 *
 * So `sites.json` records the expected target per host, and this script compares
 * it against what Railway says today. A `CHANGED` line means: go update
 * Cloudflare, now, and then update sites.json.
 *
 * ## Why this needs the Railway CLI and check-origins.mjs does not
 *
 * A Cloudflare-PROXIED record does not expose its CNAME to the world — public
 * DNS returns Cloudflare's own IPs. There is no credential-free way to see the
 * target a proxied record points at, so the only source of truth for "what
 * SHOULD it be" is Railway itself. This script therefore needs `railway login`;
 * `check-origins.mjs` deliberately does not, and stays the one anyone can run.
 *
 * The public-resolution column below IS credential-free, and is the half that
 * catches the other failure: a host with no DNS record at all. Mason Park's
 * apex has been in that state since launch.
 */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import dns from 'node:dns/promises'
import { doh } from '../cloudflare-launch/doh.mjs'

const execFileP = promisify(execFile)
const HERE = dirname(fileURLToPath(import.meta.url))
const REGISTRY = join(HERE, 'sites.json')
/* On Windows the CLI is an npm shim, `railway.cmd`. Node >= 20 refuses to
   execFile a .cmd without a shell, and a bare `railway` is not an executable at
   all there — so this has to go through a shell on win32 and must therefore
   quote its own arguments. See runRailway(). */
const WINDOWS = process.platform === 'win32'

const args = process.argv.slice(2)
const flag = (f) => args.includes(f)
const asJson = flag('--json')
const asRecord = flag('--record')
const only = args.filter((a) => !a.startsWith('--'))

/**
 * `railway domain status <host>` for a service, WITHOUT running `railway link`.
 * Linking is stored per-directory and is global mutable state shared with every
 * other agent and terminal on this machine; a read-only checker must not touch
 * it. RAILWAY_PROJECT_ID plus the two flags does the same job and touches
 * nothing.
 */
/**
 * Run the Railway CLI. Two platform facts force the shape of this:
 *
 *  - on Windows the CLI is an npm shim (`railway.cmd`), which Node >= 20 will
 *    not execFile without a shell;
 *  - a shell concatenates argv instead of escaping it, and service names contain
 *    spaces ("Dr Nahlah", "Mason Park"), so with a shell we must quote or the
 *    name arrives as two arguments and every lookup fails as "unreadable".
 *
 * Everything passed in comes from sites.json, which is ours and reviewed, but
 * quoting is only safe while no argument carries a double quote — so refuse
 * rather than build a command that means something other than it reads.
 */
async function runRailway(projectId, args) {
  const bad = args.find((a) => /["\r\n]/.test(a))
  if (bad) throw new Error(`refusing to shell out with an unquotable argument: ${JSON.stringify(bad)}`)
  const opts = { env: { ...process.env, RAILWAY_PROJECT_ID: projectId }, timeout: 60_000 }
  return WINDOWS
    ? execFileP(`railway ${args.map((a) => `"${a}"`).join(' ')}`, { ...opts, shell: true })
    : execFileP('railway', args, opts)
}

/**
 * `env` defaults to production because that is where every host lived until
 * Mason Park gained a staging environment on 2026-08-31. A staging domain is
 * NOT visible from the production environment: `railway domain status` answers
 * "Domain 'x' not found on the selected service", which this script reported as
 * `unread ... could not read Railway`, i.e. a host it could not check at all —
 * indistinguishable from a login problem. Per-entry `env` in sites.json fixes
 * that; omit it and nothing changes for existing entries.
 */
async function railwayDomain(projectId, service, host, env = 'production') {
  try {
    const { stdout } = await runRailway(projectId, [
      'domain', 'status', host, '--service', service, '--environment', env,
    ])
    return parseDomainStatus(stdout)
  } catch (e) {
    const out = `${e.stdout || ''}${e.stderr || ''}`.trim()
    return { error: (out || String(e.message)).split('\n')[0] }
  }
}

/** The CLI prints a human table; take the three fields that matter. */
function parseDomainStatus(text) {
  const field = (label) => {
    const m = text.match(new RegExp(`^\\s*${label}:\\s*(.+?)\\s*$`, 'm'))
    return m ? m[1] : null
  }
  /* `DNS_RECORD_TYPE_CNAME   www   pkez8lkn.up.railway.app` */
  const rows = [...text.matchAll(/^\s*DNS_RECORD_TYPE_(\w+)\s+(\S+)\s+(\S+)\s*$/gm)]
    .map(([, type, name, value]) => ({ type: type.toLowerCase(), name, value }))
  return {
    type: field('Type'),
    created: field('Created'),
    updated: field('Updated'),
    verified: field('Verified'),
    certificate: field('Certificate status'),
    records: rows,
  }
}

/* ------------------------------------------------------------------ *
 * Reading the record Cloudflare actually holds.
 *
 * This is the half that catches a MIS-POINTED record, as opposed to a missing
 * one. Public DNS cannot: a proxied record answers with Cloudflare's own A
 * records and never reveals its CNAME content, so `www` pointing at the APEX's
 * Railway target — which is what happened here on 2026-08-29 — looks identical
 * to `www` pointing at the right one.
 *
 * Optional on purpose. Without a token this degrades to "could not read", never
 * to a pass. Needs a Cloudflare API token with Zone -> DNS -> Read.
 *
 * Read from CLOUDFLARE_DNS_TOKEN, else CLOUDFLARE_API_TOKEN (a zone token minted
 * with ../cloudflare-launch/mint-token.mjs), else CLOUDFLAREDIAGNOSIS, else
 * CLOUDFLAREAPI - each from the environment or the nearest generated .env
 * (never hand-edited; it comes from ~/.webzite/.env). Order matters: CLOUDFLAREAPI is the older token and can
 * read /zones but returns "Authentication error" on /zones/<id>/dns_records, so
 * it must never shadow the working one. CLOUDFLAREDIAGNOSIS was minted
 * 2026-08-30 with read access and is what makes this column real; note it also
 * fails /user/tokens/verify while working fine on the endpoints we use, so do
 * not add a verify step as a gate.
 * ------------------------------------------------------------------ */

/** Walk up for the nearest generated .env; the worktree root is four levels up. */
function envFromDotfile(key) {
  let dir = HERE
  for (let i = 0; i < 6; i++) {
    const f = join(dir, '.env')
    if (existsSync(f)) {
      const m = readFileSync(f, 'utf8').match(new RegExp(`^${key}\\s*=\\s*(.+)$`, 'm'))
      if (m) return m[1].trim().replace(/^["']|["']$/g, '')
    }
    const up = dirname(dir)
    if (up === dir) break
    dir = up
  }
  return null
}

const CF_TOKEN =
  process.env.CLOUDFLARE_DNS_TOKEN ||
  process.env.CLOUDFLARE_API_TOKEN ||
  process.env.CLOUDFLAREDIAGNOSIS ||
  envFromDotfile('CLOUDFLAREDIAGNOSIS') ||
  process.env.CLOUDFLAREAPI ||
  envFromDotfile('CLOUDFLAREAPI')

async function cf(path) {
  const res = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
    headers: { authorization: `Bearer ${CF_TOKEN}` },
    signal: AbortSignal.timeout(25_000),
  })
  return res.json()
}

const zoneCache = new Map()
async function zoneIdFor(host) {
  /* Try the registrable domain, then walk left: www.a.com -> a.com. */
  const parts = host.split('.')
  for (let i = 0; i < parts.length - 1; i++) {
    const name = parts.slice(i).join('.')
    if (zoneCache.has(name)) return zoneCache.get(name)
    const r = await cf(`/zones?name=${encodeURIComponent(name)}`)
    const id = r?.success && r.result?.[0]?.id ? r.result[0].id : null
    zoneCache.set(name, id)
    if (id) return id
  }
  return null
}

/** What content does Cloudflare hold for this exact name? */
async function cloudflareRecord(host) {
  if (!CF_TOKEN) return { read: false, why: 'no Cloudflare token (CLOUDFLARE_DNS_TOKEN, CLOUDFLARE_API_TOKEN or .env CLOUDFLAREDIAGNOSIS)' }
  try {
    const zone = await zoneIdFor(host)
    if (!zone) return { read: false, why: 'no Cloudflare zone found for this host (or the token cannot list zones)' }
    const r = await cf(`/zones/${zone}/dns_records?name=${encodeURIComponent(host)}`)
    if (!r?.success) {
      return { read: false, why: `${r?.errors?.[0]?.message || 'unknown error'} — the token needs Zone -> DNS -> Read` }
    }
    const rec = r.result.find((x) => x.type === 'CNAME') || r.result.find((x) => x.type === 'A')
    if (!rec) return { read: true, content: null, type: null, proxied: null }
    return { read: true, content: rec.content, type: rec.type, proxied: rec.proxied }
  } catch (e) {
    return { read: false, why: String(e.message) }
  }
}

/**
 * Does this host resolve publicly at all, and how? A proxied record hides its
 * CNAME behind the proxy's A records, which is expected and fine — what is not
 * fine is nothing at all, which is what an un-created record looks like and is
 * indistinguishable from a typo.
 */
async function resolvePublicly(host) {
  try {
    const cname = await dns.resolveCname(host)
    return { resolves: true, via: 'cname', answer: cname }
  } catch {
    try {
      const a = await dns.resolve4(host)
      return { resolves: true, via: 'proxied-or-a', answer: a }
    } catch (e) {
      /* Plain DNS on port 53 times out on the agency workstation (VPN), and a
         timeout must not read as "no record". Ask over HTTPS before saying so. */
      try {
        const cname = await doh(host, 'CNAME')
        if (cname.length) return { resolves: true, via: 'doh-cname', answer: cname.map((x) => x.data) }
        const a = await doh(host, 'A')
        if (a.length) return { resolves: true, via: 'doh-a', answer: a.map((x) => x.data) }
        return { resolves: false, error: `${e.code || e.message}; DoH: no CNAME or A` }
      } catch (d) {
        return { resolves: false, error: `${e.code || e.message}; DoH: ${d.message}` }
      }
    }
  }
}

async function checkSite(site) {
  const { client, railway, dns: expected = [] } = site
  const out = { client, rows: [], problems: [] }

  if (!railway?.project || !railway?.service) {
    out.problems.push('sites.json has no railway.project/service — cannot read the expected target')
    return out
  }

  for (const entry of expected) {
    const live = await railwayDomain(railway.project, railway.service, entry.host, entry.env ?? railway.environment ?? 'production')
    const pub = await resolvePublicly(entry.host)
    const cfRec = await cloudflareRecord(entry.host)
    const actual = live.records?.find((r) => r.type === 'cname')?.value ?? null

    let verdict
    if (live.error) verdict = 'unreadable'
    else if (!actual) verdict = 'no-target'
    else if (!entry.expect) verdict = 'unrecorded'
    else if (actual !== entry.expect) verdict = 'CHANGED'
    else verdict = 'ok'

    if (verdict === 'CHANGED') {
      out.problems.push(
        `${entry.host}: Railway now wants ${actual} (sites.json records ${entry.expect}) — ` +
        'update the CNAME in Cloudflare, then update sites.json',
      )
    }
    if (verdict === 'unrecorded') {
      out.problems.push(`${entry.host}: no expected target recorded in sites.json — run --record`)
    }
    /* Never silent. A checker that cannot reach Railway has proved nothing, and
       must not be mistaken for one that looked and found everything fine. */
    if (verdict === 'unreadable') {
      out.problems.push(`${entry.host}: could not read Railway (${live.error}) — run \`railway login\`; this check proved nothing`)
    }
    if (verdict === 'no-target') {
      out.problems.push(`${entry.host}: Railway has no CNAME target for this domain — is it still added to the service?`)
    }
    if (!pub.resolves) {
      out.problems.push(`${entry.host}: does not resolve publicly (${pub.error}) — the DNS record does not exist`)
    }
    /* The mis-pointed case. `www` carrying the APEX's target is the shape this
       caught on 2026-08-29, and it is invisible to every other check here:
       Railway is happy — it reports `Verified: yes` even for a record pointing
       at a SIBLING domain's target — public DNS is happy (the proxy answers),
       and the site serves, because Railway's edge routes on the Host header
       rather than on which target you reached it through. Fix it because it is
       wrong and unsupported, not because you can point at a symptom: on
       masonparkdental.com the failed certificates turned out to be the
       geo-block rule swallowing ACME validation, not this. */
    if (cfRec.read && actual && cfRec.content && cfRec.content !== actual) {
      out.problems.push(
        `${entry.host}: Cloudflare holds ${cfRec.type} -> ${cfRec.content}, Railway wants CNAME -> ${actual}` +
        (expected.some((e) => e.expect === cfRec.content && e.host !== entry.host)
          ? ` — that is ${expected.find((e) => e.expect === cfRec.content).host}'s target, on the wrong record`
          : ''),
      )
    }
    if (cfRec.read && !cfRec.content) {
      out.problems.push(`${entry.host}: Cloudflare holds no CNAME or A record for this name`)
    }
    /* A failed certificate is not a DNS mismatch, but it is the other thing that
       silently breaks a domain that was just re-added, and this is the only
       command that ever looks at it. Say it here or nobody sees it. */
    if (live.certificate && !/VALID/i.test(live.certificate)) {
      out.problems.push(`${entry.host}: Railway certificate ${live.certificate}`)
    }

    out.rows.push({ ...entry, actual, verdict, certificate: live.certificate, created: live.created, public: pub, cloudflare: cfRec })
  }
  return out
}

function report(results) {
  if (asJson) { console.log(JSON.stringify(results, null, 2)); return results.reduce((n, r) => n + r.problems.length, 0) }

  let problems = 0
  for (const r of results) {
    console.log(`\n${r.client}`)
    for (const row of r.rows) {
      const mark =
        row.verdict === 'ok' ? 'ok      ' :
        row.verdict === 'CHANGED' ? 'CHANGED ' :
        row.verdict === 'no-target' ? 'no CNAME' :
        row.verdict === 'unreadable' ? 'unread  ' : '?       '
      const target = row.actual ? `CNAME ${row.record || '@'} -> ${row.actual}` : '(no CNAME target)'
      console.log(`  ${mark} ${row.host.padEnd(30)} ${target}`)
      if (row.verdict === 'CHANGED') console.log(`           sites.json still records ${row.expect}`)
      if (row.cloudflare.read && row.cloudflare.content) {
        const same = row.cloudflare.content === row.actual
        console.log(`           cloudflare: ${row.cloudflare.type} -> ${row.cloudflare.content}` +
          `${row.cloudflare.proxied ? ' (proxied)' : ''}${same ? '' : '   <-- DOES NOT MATCH RAILWAY'}`)
      } else if (!row.cloudflare.read) {
        console.log(`           cloudflare: not read — ${row.cloudflare.why}`)
      }
      if (!row.public.resolves) console.log(`           NOT RESOLVING PUBLICLY (${row.public.error}) — no DNS record exists for this host`)
      if (row.certificate && !/VALID/i.test(row.certificate)) console.log(`           certificate: ${row.certificate}`)
    }
    for (const p of r.problems) { problems++; console.log(`  ! ${p}`) }
  }

  if (problems) {
    console.log(`\n${problems} problem(s).`)
    console.log('A CHANGED line means the Cloudflare CNAME is pointing at a target that no longer')
    console.log('exists. Fix Cloudflare first, then update sites.json in the same commit.\n')
  } else {
    console.log('\nEvery recorded DNS pointer still matches Railway.\n')
  }
  return problems
}

if (!existsSync(REGISTRY)) {
  console.error(`no sites.json next to this script (${REGISTRY})`)
  process.exit(2)
}
let sites = JSON.parse(readFileSync(REGISTRY, 'utf8')).sites
if (only.length) sites = sites.filter((s) => only.includes(s.client))
if (!sites.length) {
  console.error(`no matching site in sites.json (asked for: ${only.join(', ')})`)
  process.exit(2)
}

/* --record prints what Railway says TODAY in the shape sites.json wants, so
   adopting a deliberate change is a copy-paste rather than a transcription of
   eight random characters. Never run it to make a CHANGED line go away without
   fixing Cloudflare first: that just records the breakage as expected. */
if (asRecord) {
  for (const site of sites) {
    const rows = []
    for (const entry of site.dns ?? []) {
      const env = entry.env ?? site.railway.environment
      const live = await railwayDomain(site.railway.project, site.railway.service, entry.host, env ?? 'production')
      const rec = live.records?.find((r) => r.type === 'cname')
      rows.push({ host: entry.host, record: rec?.name ?? entry.record ?? '@', expect: rec?.value ?? null, ...(entry.env ? { env: entry.env } : {}) })
    }
    console.log(`${site.client}:\n"dns": ${JSON.stringify(rows, null, 2)}\n`)
  }
  process.exit(0)
}

const results = []
for (const s of sites) results.push(await checkSite(s))
process.exit(report(results) === 0 ? 0 : 1)
