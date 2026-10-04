#!/usr/bin/env node
/**
 * check-ghl-form.mjs - is a GoHighLevel form ready to embed on a Brandklout site (Instatic or
 * Webflow)? Reads the public form page only; submits nothing.
 *
 * One gate since 2026-09-28. It merges three copies that had drifted apart: the IFA original
 * (tools/instatic-site/gates, save-and-exit only), the webflow-build copy (adds the consent-field
 * count) and the scenario 3 copy (adds --combo redirect checks). Origin:
 * institute-for-advanced-dentistry/workflows/21-instatic-upload/check-ghl-form.mjs (bk-ifa-dentistry).
 *
 * What it fails on:
 *   1. enableSaveExitConfirmation ON. The consent bridge prefills the hidden privacy_* fields
 *      through the iframe URL on every load. GoHighLevel counts that as a submission the visitor
 *      started, stores form_progress_<id> in the frame's localStorage and shows "Submission in
 *      progress - Start over / Continue" on the next load, which is often a fraction of a second
 *      away because form_embed.js re-parents (and so reloads) the iframe. Proven 2026-09-21 on the
 *      form itself: of 13 forms, exactly the ones with the flag on prompt. Fix in GoHighLevel:
 *      turn save-and-exit off. Nothing on the site can reach it (the storage belongs to
 *      api.leadconnectorhq.com).
 *   2. Fewer than 11 consent fields. The bridge sends 11 values (the privacy_* fields plus
 *      marketing_disclosure_version); GoHighLevel drops any whose Query Key is not a field on the
 *      form. Fix: create them in the sub-account and add them hidden to the form. Spec:
 *      ../termly-ghl-consent.md.
 *   3. (--combo) the form does not REDIRECT on submit (formAction.actionType must be '1';
 *      '2' = inline message), or
 *   4. (--combo) the redirect is not the campaign's thank-you page on the production origin.
 *      Without it the Google Ads conversion never fires and the lead is untagged.
 *
 *   5. (--standard) the form misses the Brandklout lead-form standard (tools/ghl-forms/README.md):
 *      a service dropdown, the SMS consent element (Terms & Conditions, NOT required), and Privacy
 *      Policy + Terms of Service links that are not GoHighLevel's https://www.example.com
 *      placeholder. With --origin <https://www.client.com> both links must be on that origin.
 *      The SMS element must carry both boxes (care + marketing); with --legal "<legal name>" both
 *      must name it. With --location <id> the form must live in that sub-account (2026-10-03: two
 *      Mason Park ad forms lived in Grand Mission's location and linked to its privacy page). A
 *      redirect on submit must answer 200 (relative paths resolve against --origin).
 *      --landing (and --combo) marks landing-page forms: the page is already one service, so they
 *      need NO service dropdown, and they must redirect to a thank-you page instead.
 *
 *   node check-ghl-form.mjs <formId|url> [...]      > output/ghl-forms.log 2>&1
 *   node check-ghl-form.mjs --standard [--landing] [--origin https://www.client.com] [--legal "X PLLC DBA Y"] [--location <id>] <formId|url> [...]
 *   node check-ghl-form.mjs --combo <combo.json>    > output/ghl-forms.log 2>&1   (needs tools/ads-combo)
 *
 * Redirect stdout to a file, never pipe it (Node 24 on Windows dies on a piped stdout).
 * Exit 1 if any form fails.
 */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'
const CONSENT_FIELDS = 11

/**
 * A form's public settings from its __NUXT_DATA__ payload. Numbers in the devalue array are
 * references into the array.
 */
async function readForm(idOrUrl) {
  const id = (String(idOrUrl).match(/widget\/form\/([A-Za-z0-9]+)/) || [null, idOrUrl])[1]
  const html = await (await fetch(`https://api.leadconnectorhq.com/widget/form/${id}`, { headers: { 'user-agent': UA } })).text()
  const m = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (!m) return { id, ok: false }
  const d = JSON.parse(m[1])
  const R = (v) => (typeof v === 'number' ? d[v] : v)
  const isObj = (n) => n && typeof n === 'object' && !Array.isArray(n)
  const node = d.find((n) => isObj(n) && 'enableSaveExitConfirmation' in n)
  const fa = node && isObj(R(node.formAction)) ? R(node.formAction) : {}
  const meta = d.find((n) => isObj(n) && 'parentFolderName' in n && 'name' in n)
  const loc = d.find((n) => isObj(n) && 'locationId' in n)
  const consent = new Set(html.match(/privacy_[a-z_]+|marketing_disclosure_version/g) || [])
  const deep = (v, depth = 0) => {
    const x = R(v)
    if (depth > 8 || x === null || typeof x !== 'object') return x
    if (Array.isArray(x)) return x.map((y) => deep(y, depth + 1))
    return Object.fromEntries(Object.entries(x).map(([k, y]) => [k, deep(y, depth + 1)]))
  }
  const fields = node && Array.isArray(R(node.fields)) ? R(node.fields).map((f) => deep(f)) : []
  return {
    id,
    ok: true,
    name: meta ? R(meta.name) : null,
    saveExit: node ? R(node.enableSaveExitConfirmation) === true : false,
    actionType: R(fa.actionType) ?? null,
    redirectUrl: R(fa.redirectUrl) || '',
    consentFields: consent.size,
    locationId: loc ? R(loc.locationId) : null,
    labelsVisible: node ? R(node.formLabelVisible) !== false : true,
    fields,
  }
}

/** The lead-form standard (tools/ghl-forms/README.md). Returns a list of problems. */
async function standardProblems(f, { origin, legal, location, landing }) {
  const p = []
  const text = (x) => String(x ?? '')
  const isConsent = (x) => /^privacy_|^marketing_disclosure_version$/.test(text(x.label)) || /^privacy_|marketing_disclosure/.test(text(x.name))
  const named = (x) => `${text(x.customFieldLabel)} ${text(x.name)} ${text(x.label)} ${text(x.placeholder)}`
  const dropdowns = f.fields.filter((x) => x.type === 'single_options' && !isConsent(x))
  const service = dropdowns.find((x) => /service|treatment|procedure|interest/i.test(named(x)))
  if (landing) {
    if (service) p.push('landing-page form has a service dropdown: remove it, the page is already one service')
    if (f.actionType !== '1') p.push('landing-page form shows an inline message: it must redirect to its thank-you page')
  }
  else if (!service) p.push('no service dropdown (a Single Dropdown named Service / Treatment Type)')
  else if (!Array.isArray(service.picklistOptions) || service.picklistOptions.length < 3) p.push(`service dropdown has ${service.picklistOptions?.length ?? 0} options`)
  const inputs = f.fields.filter((x) => ['text', 'email', 'phone', 'large_text', 'single_options', 'multiple_options', 'date'].includes(x.type) && !isConsent(x))
  for (const x of inputs) if (!text(x.label).replace(/<[^>]+>/g, '').trim()) p.push(`field "${text(x.placeholder) || x.fieldKey || x.tag}" has no visible label (labels are standard, 2026-10-03)`)
  const order = f.fields.map((x) => x.type)
  if (order.includes('captcha') && order.indexOf('captcha') > order.indexOf('submit')) p.push('captcha sits below the Submit button: move it above')
  const tc = f.fields.find((x) => x.type === 'terms_and_conditions')
  if (!tc) p.push('no SMS consent element (GoHighLevel Terms & Conditions)')
  else {
    if (tc.required === true) p.push('SMS consent checkbox is REQUIRED: A2P 10DLC needs it optional')
    if (/\[BUSINESS NAME\]|\[USE_CASE/i.test(text(tc.placeholder))) p.push('SMS consent still has the [BUSINESS NAME] template text')
    const boxes = [tc.placeholder, tc.placeholder2].map((x) => text(x).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean)
    if (boxes.length < 2) p.push(`SMS consent has ${boxes.length} checkbox(es), the standard is two (care + marketing)`)
    const squash = (x) => x.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
    if (legal) for (const [i, b] of boxes.entries()) if (!squash(b).includes(squash(legal))) p.push(`SMS consent box ${i + 1} does not name "${legal}": "${b.slice(0, 90)}…"`)
  }
  const hrefs = f.fields.flatMap((x) => [x.label, x.placeholder].map(text)).join(' ').match(/<a\b[^>]*>[\s\S]*?<\/a>/gi) || []
  for (const want of ['Privacy Policy', 'Terms of Service']) {
    const a = hrefs.find((h) => h.replace(/<[^>]+>/g, '').trim().toLowerCase() === want.toLowerCase())
    const href = a && (a.match(/href="([^"]*)"/i) || [])[1]
    if (!href) p.push(`no "${want}" link`)
    else if (/example\.com/i.test(href)) p.push(`"${want}" still links to ${href}`)
    else if (origin && !href.toLowerCase().startsWith(origin.replace(/\/+$/, '').toLowerCase() + '/')) p.push(`"${want}" links to ${href}, expected ${origin}/…`)
  }
  if (location && f.locationId && f.locationId !== location) p.push(`form lives in sub-account ${f.locationId}, the site's is ${location}: its leads land in another practice's CRM`)
  if (f.actionType === '1' && f.redirectUrl) {
    let url = f.redirectUrl
    try { url = new URL(f.redirectUrl, origin || undefined).href } catch {}
    let code = 0
    try { code = (await fetch(url, { headers: { 'user-agent': UA }, redirect: 'follow', signal: AbortSignal.timeout(20000) })).status } catch {}
    if (code !== 200) p.push(`on submit it redirects to ${f.redirectUrl}, which answers ${code || 'nothing'}`)
  }
  return p
}

const argv = process.argv.slice(2)
const ci = argv.indexOf('--combo')
const jobs = []
if (ci >= 0) {
  const { loadCombo, pathOf } = await import('../../ads-combo/lib/combo.mjs')
  const c = loadCombo(argv[ci + 1])
  for (const k of c.campaigns) jobs.push({ id: k.formId, campaign: k.name, expect: c.productionOrigin + pathOf(c, k.thankYou) })
} else for (let i = 0; i < argv.length; i++) { if (['--origin', '--legal', '--location'].includes(argv[i])) i++; else if (!argv[i].startsWith('--')) jobs.push({ id: argv[i] }) }
const standard = argv.includes('--standard')
const oi = argv.indexOf('--origin')
const origin = oi >= 0 ? argv[oi + 1] : ''
const opt = (k) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : '' }
const legal = opt('--legal')
const location = opt('--location')
const landing = argv.includes('--landing') || ci >= 0
if (!jobs.length) { console.error('usage: check-ghl-form.mjs <formId|url> [...] | --combo <combo.json>'); process.exit(2) }

const norm = (u) => { try { const x = new URL(u); return (x.origin + x.pathname).replace(/\/+$/, '').toLowerCase() } catch { return String(u) } }
let bad = 0
for (const j of jobs) {
  const f = await readForm(j.id)
  if (!f.ok) { bad++; console.log(`${f.id}  FAIL  no form payload (wrong id, or the form was deleted)`); continue }
  const problems = []
  if (f.saveExit) problems.push('save-and-exit is ON: turn it off in GoHighLevel (prefilled consent fields trigger "Submission in progress")')
  if (!f.labelsVisible && f.consentFields) problems.push('form-wide Show Label is OFF: GoHighLevel then renders the hidden privacy_* fields as empty boxes on the public form; turn it back on')
  if (f.consentFields < CONSENT_FIELDS) problems.push(`consent fields ${f.consentFields}/${CONSENT_FIELDS}: create the missing ones in the GoHighLevel sub-account (Query Key = field key) and add them hidden to this form`)
  if (j.expect) {
    if (f.actionType !== '1') problems.push(`on submit it shows an inline message (actionType ${f.actionType}), it must redirect to ${j.expect}`)
    else if (norm(f.redirectUrl) !== norm(j.expect)) problems.push(`redirects to ${f.redirectUrl || '(empty)'}, expected ${j.expect}`)
  }
  if (standard) problems.push(...(await standardProblems(f, { origin, legal, location, landing })))
  if (problems.length) bad++
  console.log(`${f.id}  ${problems.length ? 'FAIL' : 'ok  '}  "${f.name ?? '?'}"${j.campaign ? '  [' + j.campaign + ']' : ''}`)
  console.log(`      save-exit ${f.saveExit ? 'ON' : 'off'} · action ${f.actionType === '1' ? 'redirect' : f.actionType === '2' ? 'message' : f.actionType} · redirect ${f.redirectUrl || '-'} · consent fields ${f.consentFields}/${CONSENT_FIELDS} · location ${f.locationId ?? '?'}`)
  for (const p of problems) console.log('      PROBLEM ' + p)
}
console.log(`\n${bad} form(s) failing`)
process.exitCode = bad ? 1 : 0
