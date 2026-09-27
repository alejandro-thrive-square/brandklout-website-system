#!/usr/bin/env node
/**
 * verify-pin29-30.mjs — live gate for BugHerd #29 and #30. Reads the PUBLISHED
 * site only; writes nothing. Re-run it any time.
 *
 *   node verify-pin29-30.mjs
 *
 * #30: every page with a site footer must carry BOTH street addresses and BOTH
 * new-patient numbers inside that footer.
 * #29: the ten accordion labels on /dental-conditions must be title case.
 *
 * ## Two ways this gate went blind while it was being written, both fixed here
 *
 * 1. Selecting pages by "has a link to the McLean tel:" picks up the 18 ads
 *    landing pages, which carry phone links in the page body. Selecting by
 *    `props.tag === 'footer'` is no better — the review-wall cards use `footer`
 *    as their own tag. The page list comes from the node tree, but the ASSERTION
 *    is made against the last `<footer>` element in the live HTML.
 * 2. Keying the assertion on `<h4>Hours</h4>` only matches the main site footer.
 *    The ads landing pages have a DIFFERENT footer, which already carried both
 *    addresses before any of this — and every one of them was reported as a
 *    failure. Assert on the addresses and the tel: hrefs, which both footers
 *    have to satisfy, not on one footer's markup.
 */
import { getPages } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const SITE = 'https://www.drnahlah.com'

/** What every footer on the site has to contain, in whatever markup it uses. */
const WANT = [
  '7901 Jones Branch Drive, Suite 220', 'McLean, VA 22102', 'tel:+15717029900',
  '2855 Duke Street', 'Alexandria, VA 22314', 'tel:+15712537790',
]

const footerOf = (html) => {
  const i = html.lastIndexOf('<footer')
  return i < 0 ? '' : html.slice(i)
}

const { rows } = await getPages()
const slugs = rows
  .filter((r) => Object.values(r.cells?.body?.nodes ?? {})
    .some((n) => n.props?.tag === 'footer' && n.props?.htmlAttributes?.['data-theme'] === 'dark'))
  .map((r) => r.cells?.slug ?? r.slug)
  .filter((s) => s !== 'post') // the entry template never serves at its own slug

const bad = []
for (const s of slugs) {
  const url = SITE + (s === 'index' ? '/' : '/' + s)
  const res = await fetch(url)
  if (!res.ok) { bad.push(`${s}: HTTP ${res.status}`); continue }
  const foot = footerOf(await res.text())
  const miss = WANT.filter((w) => !foot.includes(w))
  if (miss.length) bad.push(`${s}: footer missing ${miss.join(', ')}`)
}
console.log(`#30 — ${slugs.length} live pages, ${slugs.length - bad.length} carry both offices in full`)

/* One article, because the footer reaches the 43 entries through the `post`
   template rather than through a row of their own. */
const one = ((await (await fetch(SITE + '/posts')).text()).match(/href="(\/posts\/[a-z0-9-]+)"/) || [])[1]
if (one) {
  const foot = footerOf(await (await fetch(SITE + one)).text())
  const miss = WANT.filter((w) => !foot.includes(w))
  console.log(`#30 — article ${one}: ${miss.length ? 'MISSING ' + miss.join(', ') : 'ok'}`)
  if (miss.length) bad.push(one)
}

const cond = await (await fetch(SITE + '/dental-conditions')).text()
const labels = [...cond.matchAll(/<summary\b[^>]*>([\s\S]*?)<\/summary>/g)].map((m) => m[1].replace(/<[^>]*>/g, '').trim())
/* Title case, so the two coordinating conjunctions are allowed to stay lower. */
const lower = labels.filter((t) => t.split(' ').some((w, i) => i && /^[a-z]/.test(w) && !/^(or|and|the|a|of|in|to)$/.test(w)))
console.log(`#29 — ${labels.length} labels, ${lower.length} still sentence case${lower.length ? ': ' + lower.join(' | ') : ''}`)
if (labels.length !== 10) bad.push(`dental-conditions has ${labels.length} labels, expected 10`)
if (lower.length) bad.push('dental-conditions labels')

console.log(bad.length ? '\nFAIL\n  ' + bad.join('\n  ') : '\nall green')
process.exit(bad.length ? 1 : 0)
