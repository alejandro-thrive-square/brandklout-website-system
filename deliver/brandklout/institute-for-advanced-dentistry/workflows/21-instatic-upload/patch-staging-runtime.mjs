/**
 * Apply runtime.js's staging guards to the `src/scripts/site.js` code asset ON STAGING.
 *
 * The bundle was cloned from production, where those guards did not exist yet. Rebuilding the
 * whole WordPress clone to deliver a few lines would churn all 59 pages, so this patches the asset
 * in place. Every edit is HOST-CONDITIONAL and so is a no-op on a production host — the patched
 * bundle stays correct if it is ever promoted.
 *
 *   INSTATIC_BASE_URL=https://staging.ifadentistry.com node patch-staging-runtime.mjs [--apply]
 *
 * Each edit is skipped when its marker is already present, so this is safe to re-run as guards are
 * added. Matching is by whole line, never by a regex built from a string: the source lines contain
 * backslashes, and a needle written with them does not survive a bash heredoc.
 */
import { getSite, saveShell } from '../../../../process/tools/instatic-api-sync/insta-api.mjs'

const ASSET = 'src/scripts/site.js'
const apply = process.argv.includes('--apply')
const BS = String.fromCharCode(92) // backslash, built rather than typed — see the header

const { site, seq } = await getSite()
const file = (site.files ?? []).find((f) => f.path === ASSET)
if (!file) throw new Error(`no ${ASSET} on this site`)

/** One edit: find the single line `at`, replace it with `lines`, skip entirely if `marker` is in. */
const EDITS = [
  {
    name: 'STAGING + PROD gate',
    marker: 'var STAGING =',
    at: (l) => l.startsWith('var PROD = '),
    build: (line) => [
      '// `staging.<domain>` is a subdomain of the production zone, so the host test below passes',
      '// there — the one host the gate exists to exclude would be the one host it let through.',
      'var STAGING = /^staging' + BS + './i.test(location.hostname)',
      line + ' && !STAGING',
    ],
  },
  {
    name: 'canonical / og:url / meta robots',
    marker: "=== 'canonical'",
    at: (l) => l === '    if (n.nodeType === 1) {',
    build: (line) => [
      line,
      '      // Staging is served with `X-Robots-Tag: noindex`. A canonical — or an og:url —',
      '      // pointing at the PRODUCTION url on a noindexed page is the one combination that can',
      "      // hurt production: Google treats them as contradictory and can apply the noindex to",
      "      // the canonical's target. The cloned `meta robots` says `index, follow` and goes for",
      '      // the same reason. Dropped here rather than by editing 59 pages. No-op on prod.',
      '      if (',
      '        STAGING &&',
      "        (n.getAttribute('rel') === 'canonical' ||",
      "          n.getAttribute('property') === 'og:url' ||",
      "          n.getAttribute('name') === 'robots')",
      '      )',
      '        continue',
    ],
  },
  {
    // Top-up for a bundle patched before `meta robots` joined the list: the cloned pages say
    // `index, follow`, which contradicts the noindex header this host is served with.
    name: 'meta robots (top-up on an earlier patch)',
    marker: "=== 'robots'",
    at: (l) => l.includes("=== 'canonical'") && l.includes("=== 'og:url'"),
    build: () => [
      '      if (',
      '        STAGING &&',
      "        (n.getAttribute('rel') === 'canonical' ||",
      "          n.getAttribute('property') === 'og:url' ||",
      "          n.getAttribute('name') === 'robots')",
      '      )',
      '        continue',
    ],
  },
  {
    name: 'inline tag bootstraps',
    marker: 'var TAGTEXT =',
    at: (l) => l === 'function run(id, anchor) {',
    build: (line) => [
      '// An inline tag bootstrap carries no src and no id, so the `g` flag prepare-wp.mjs computes',
      '// from those fields never covers it — that is how GTM-K8N3JK3Q reached the staging clone.',
      'var TAGTEXT = /googletagmanager' + BS + '.com|google-analytics' + BS + '.com|googlesitekit|gtag' + BS + '(/i',
      '',
      line,
      '  var it = D[id]',
      `  if (!it || (it.g && !PROD) || (STAGING && TAGTEXT.test(it.c || it.u || ''))) {`,
    ],
    // the two lines that followed `function run(id, anchor) {` are replaced by the two above
    consume: 2,
  },
]

let lines = file.content.split('\n')
const before = file.content.length
let changed = 0

for (const edit of EDITS) {
  if (lines.join('\n').includes(edit.marker)) {
    console.log(`skip   ${edit.name} — already applied`)
    continue
  }
  const hits = lines.filter(edit.at).length
  if (hits !== 1) throw new Error(`${edit.name}: expected exactly 1 anchor line, found ${hits} — refusing to guess`)
  const i = lines.findIndex(edit.at)
  const built = edit.build(lines[i])
  lines.splice(i, 1 + (edit.consume ?? 0), ...built)
  console.log(`apply  ${edit.name}`)
  changed++
}

const patched = lines.join('\n')
console.log(`\n${ASSET}  ${before} -> ${patched.length} bytes  (${changed} edit(s))`)
if (!changed) process.exit(0)

if (!apply) {
  console.log('\ndry run — re-run with --apply')
  process.exit(0)
}

file.content = patched
console.log('saved:', JSON.stringify(await saveShell(site, seq)))
