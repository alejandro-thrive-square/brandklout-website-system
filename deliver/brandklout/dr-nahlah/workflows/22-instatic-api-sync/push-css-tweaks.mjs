#!/usr/bin/env node
/**
 * push-css-tweaks.mjs — declaration-level edits to style rules that ALREADY
 * exist. DRAFT ONLY, NEVER PUBLISHES.
 *
 *   node push-css-tweaks.mjs            # dry run, prints the before/after diff
 *   node push-css-tweaks.mjs --apply
 *   node push-css-tweaks.mjs --only mband
 *
 * Everything here MERGES one or two keys into a rule and leaves the rest alone.
 * A wholesale `styles` replace is the accident this file exists to avoid: the
 * registry rule is the whole declaration block, and dropping five properties to
 * add one is silent and total. Every job therefore names the declarations it
 * expects to find UNCHANGED, and the read-back asserts them one by one.
 *
 * ## mband — BugHerd #13, second pass
 *
 * > "the face is cut of on larger breakpoints so the solution is to have a max
 * > width on this section across the site. Should be larger than the global
 * > container or max width but on middle and smaller screens should be filling
 * > up the entire screen width."
 *
 * The band's HEIGHT caps at 34rem; its width never did. So the wider the display
 * the worse `object-fit: cover` cropped — measured at 2560 the band is
 * 2545x680 (3.74:1) against a 1.50:1 photograph and shows 36% of its height,
 * against 57% at 1440. `object-position: 50% 0%` (session 19) keeps the face in
 * frame but cannot stop the picture being magnified further with every extra
 * pixel of viewport.
 *
 * Capping the WIDTH fixes the cause: at 1800 the frame holds ~2.65:1 however
 * large the display gets, which is the 1440 proportion the design was drawn at.
 * 1800 is deliberately wider than `--maxw` (1560) so the band still reads as
 * breaking out of the content column, and no breakpoint is needed for the second
 * half of the request — below 1800 a max-width simply has no effect and the band
 * fills the viewport on its own.
 *
 * `object-position: 50% 0%` STAYS. At the capped width the frame is 2.65:1,
 * essentially the 2.62:1 that cropped her face at the default `50% 50%` in the
 * first place.
 *
 * ## pk-cta-h2 — BugHerd #25
 *
 * > "On this section the heading should be wrapped in a symmetrical way"
 *
 * `max-width: 20ch` decides where the CTA heading wraps, and on /smile-makeover
 * it left one word alone on the second line: "See it before you commit to" /
 * "it." `text-wrap: balance` spreads the words evenly instead — measured at the
 * live 20ch, it gives "See it before you" / "commit to it." at 1440, 1024 and
 * 390.
 *
 * **This has to be a real registry rule, not a style added afterwards.** GSAP
 * SplitText measures the natural line boxes at boot and replaces them with one
 * div per line; after that there is nothing left for the browser to re-balance,
 * which is exactly why an injected-CSS trial of this showed no change at all.
 *
 * `.pk-cta` is on 23 pages, so this lands on every CTA heading. That is the
 * intent: the client is describing how the heading style should behave, not
 * patching one page.
 */
import { getSite, api, assertTemplatesIntact } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')
const onlyArg = process.argv.indexOf('--only')
const ONLY = onlyArg > -1 ? process.argv[onlyArg + 1] : null

const JOBS = [
  {
    key: 'mband',
    pin: 13,
    selector: '.mband',
    kind: 'class',
    /* Merged in. */
    add: { maxWidth: '1800px', marginInline: 'auto' },
    /* Asserted present and unchanged, before and after. */
    keep: {
      position: 'relative',
      overflow: 'hidden',
      height: 'clamp(18rem,42vw,34rem)',
      display: 'grid',
      alignItems: 'end',
      background: 'var(--ink-900)',
    },
  },
  {
    key: 'pk-cta-h2',
    pin: 25,
    selector: '.pk-cta h2',
    kind: 'ambient',
    add: { textWrap: 'balance' },
    /* NOTE: the live registry says 20ch. The static build in site-src says 15ch
       — it has drifted, and the balanced result was measured against 20ch. */
    keep: { fontSize: 'var(--d2)', maxWidth: '20ch' },
  },
]

const jobs = ONLY ? JOBS.filter((j) => j.key === ONLY) : JOBS
if (!jobs.length) { console.error(`no job "${ONLY}"`); process.exit(2) }

async function attempt () {
  const { site: shell, seq } = await getSite()
  const rules = shell.styleRules ?? {}

  const targets = []
  for (const job of jobs) {
    const rule = Object.values(rules).find((r) => r.kind === job.kind && r.selector === job.selector)
    if (!rule) throw new Error(`pin ${job.pin}: no ${job.kind} rule "${job.selector}"`)

    for (const [k, v] of Object.entries(job.keep)) {
      if (rule.styles?.[k] !== v) {
        throw new Error(`pin ${job.pin}: ${job.selector} { ${k} } is ${JSON.stringify(rule.styles?.[k])}, expected ${JSON.stringify(v)} — the rule is not what this script was written against`)
      }
    }

    const pending = Object.entries(job.add).filter(([k, v]) => rule.styles?.[k] !== v)
    console.log(`\npin ${job.pin}  ${job.selector}  (${job.kind})`)
    for (const [k, v] of Object.entries(job.add)) {
      const now = rule.styles?.[k]
      console.log(`  ${now === v ? '=' : '+'} ${k}: ${v}${now !== undefined && now !== v ? `   (was ${now})` : ''}`)
    }
    console.log(`  ${Object.keys(job.keep).length} other declaration(s) asserted unchanged`)
    if (pending.length) targets.push({ job, rule })
  }

  if (!targets.length) { console.log('\nevery declaration is already in place'); return { done: true } }
  if (!APPLY) return { dry: true }

  for (const { job, rule } of targets) {
    /* Merge — never replace. The spread keeps every declaration this script does
       not name, including any a person added in the Styles panel since. */
    rule.styles = { ...rule.styles, ...job.add }
    rule.updatedAt = Date.now()
  }

  /* Shell-only write: no page changed, so no `changedPages` and no seo cells to
     restore. */
  const res = await api('PUT', '/admin/api/cms/site-document', {
    mode: 'incremental',
    site: shell,
    changedPages: [], deletedPageIds: [],
    changedComponents: [], deletedComponentIds: [],
    changedLayouts: [], deletedLayoutIds: [],
    baseSeqs: {},
    shellBaseSeq: seq,
  })
  return { res }
}

let out
for (let n = 1; n <= 6; n++) {
  try { out = await attempt(); break } catch (e) {
    if (e.status === 409 && n < 6) { console.log('  409 (someone else wrote) — re-reading and retrying'); continue }
    if ([502, 503, 504].includes(e.status) && n < 6) {
      console.log(`  ${e.status} from the edge — re-reading to see which side of the write it fell on`)
      await new Promise((r) => setTimeout(r, 3000 * n)); continue
    }
    console.error(`  ! ${e.message}`); process.exit(1)
  }
}
if (out.dry) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }
console.log(out.done ? '\nalready applied — verifying' : '\nwrite: ' + JSON.stringify(out.res).slice(0, 160))

// ── read back ──────────────────────────────────────────────────────────────
const { site: back } = await getSite()
let ok = true
for (const job of jobs) {
  const rule = Object.values(back.styleRules ?? {}).find((r) => r.kind === job.kind && r.selector === job.selector)
  if (!rule) { console.error(`  ! ${job.selector} is gone`); ok = false; continue }
  for (const [k, v] of Object.entries(job.add)) {
    if (rule.styles?.[k] !== v) { console.error(`  ! ${job.selector} { ${k} } is ${rule.styles?.[k]}, wanted ${v}`); ok = false }
  }
  /* The whole point: nothing else moved. */
  for (const [k, v] of Object.entries(job.keep)) {
    if (rule.styles?.[k] !== v) { console.error(`  ! ${job.selector} LOST { ${k}: ${v} } — it is now ${rule.styles?.[k]}`); ok = false }
  }
  const extra = Object.keys(rule.styles ?? {}).length
  console.log(`  ${job.selector}  ${extra} declaration(s), ${Object.keys(job.add).length} added, ${Object.keys(job.keep).length} verified intact`)
}
await assertTemplatesIntact({ post: true })
console.log(`verified   ${ok}`)
if (!ok) { console.error('WRITE DID NOT LAND — do not publish'); process.exit(1) }
console.log('\nDRAFT ONLY. Nothing published.')
