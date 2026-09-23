#!/usr/bin/env node
/**
 * set-chatgpt-form.mjs — the ChatGPT All-on-4 page gets its own GHL form (2026-09-23).
 *
 *   node set-chatgpt-form.mjs            # plan only
 *   node set-chatgpt-form.mjs --apply    # write the draft; publish separately
 *
 * The page was cloned with Alexandria's Google AO4 form (8jq7yzSeCzZrIkuA3sSG),
 * whose redirect lands on the Google thank-you page. Brandklout made a ChatGPT
 * copy in GHL: AD6c2Du26a0JUpxoh6p5 ("Tyson Corner Office - Chat GPT AO4"; the
 * name is theirs, the page stays Alexandria). Only the embed snippet changes.
 * Runs against INSTATIC_BASE_URL: production first, then staging.
 * dup-chatgpt-landing.mjs re-clones the Google form, so re-run this after it.
 */
import { api, getSite, getPages, BASE } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const APPLY = process.argv.includes('--apply')
const SLUG = 'ads-landing-pages/alexandria-all-on-4-chatgpt'
const OLD = '8jq7yzSeCzZrIkuA3sSG'
const NEW = 'AD6c2Du26a0JUpxoh6p5'
const NAME = 'Tyson Corner Office - Chat GPT AO4'
const SNIPPET = `<iframe src="https://api.leadconnectorhq.com/widget/form/${NEW}" style="width:100%;height:100%;border:none;border-radius:8px" id="inline-${NEW}" data-layout="{&#x27;id&#x27;:&#x27;INLINE&#x27;}" data-trigger-type="alwaysShow" data-trigger-value="" data-activation-type="alwaysActivated" data-activation-value="" data-deactivation-type="neverDeactivate" data-deactivation-value="" data-form-name="${NAME}" data-height="1934" data-layout-iframe-id="inline-${NEW}" data-form-id="${NEW}" data-cookie-consent="true" data-cookie-consent-provider="auto" title="${NAME}">\n</iframe>`

console.log(BASE)
const page = (await getPages()).rows.find((r) => (r.cells?.slug ?? r.slug) === SLUG)
if (!page) { console.error(`no ${SLUG}`); process.exit(1) }
const nodes = structuredClone(page.cells.body.nodes)
const hits = Object.values(nodes).filter((n) => JSON.stringify(n).includes(OLD))
const done = Object.values(nodes).filter((n) => n.props?.snippet === SNIPPET)
console.log(`  page ${page.id} seq ${page.seq}: ${hits.length} node(s) with ${OLD}, ${done.length} already on ${NEW}`)
if (!hits.length) { console.log(done.length ? 'nothing to do' : 'no form node found'); process.exit(done.length ? 0 : 1) }
if (hits.length !== 1 || hits[0].moduleId !== 'brandklout.embed-origins.embed') { console.error('unexpected shape'); process.exit(1) }
hits[0].props.snippet = SNIPPET
if (!APPLY) { console.log('plan only — pass --apply'); process.exit(0) }

// site-document write, never a row PATCH (a PATCH flattens the slash slug)
const { site, seq } = await getSite()
await api('PUT', '/admin/api/cms/site-document', {
  mode: 'incremental', site, changedPages: [{ id: page.id, slug: SLUG, title: page.cells.title, nodes, rootNodeId: page.cells.body.rootNodeId }],
  deletedPageIds: [], changedComponents: [], deletedComponentIds: [], changedLayouts: [], deletedLayoutIds: [],
  baseSeqs: { [page.id]: page.seq }, shellBaseSeq: seq,
})
const back = (await api('GET', `/admin/api/cms/data/rows/${page.id}`)).row
const s = JSON.stringify(back.cells.body.nodes)
const ok = !s.includes(OLD) && s.includes(NEW) && (back.cells?.slug ?? back.slug) === SLUG
  && Object.keys(back.cells.body.nodes).length === Object.keys(nodes).length
console.log(ok ? `written and read back: ${NEW}. draft only — publish with do-publish.mjs` : 'READ-BACK MISMATCH')
process.exit(ok ? 0 : 1)
