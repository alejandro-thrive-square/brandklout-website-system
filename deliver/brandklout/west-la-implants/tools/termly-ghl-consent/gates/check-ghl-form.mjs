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
 *   node check-ghl-form.mjs <formId|url> [...]      > output/ghl-forms.log 2>&1
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
  const consent = new Set(html.match(/privacy_[a-z_]+|marketing_disclosure_version/g) || [])
  return {
    id,
    ok: true,
    name: meta ? R(meta.name) : null,
    saveExit: node ? R(node.enableSaveExitConfirmation) === true : false,
    actionType: R(fa.actionType) ?? null,
    redirectUrl: R(fa.redirectUrl) || '',
    consentFields: consent.size,
  }
}

const argv = process.argv.slice(2)
const ci = argv.indexOf('--combo')
const jobs = []
if (ci >= 0) {
  const { loadCombo, pathOf } = await import('../../ads-combo/lib/combo.mjs')
  const c = loadCombo(argv[ci + 1])
  for (const k of c.campaigns) jobs.push({ id: k.formId, campaign: k.name, expect: c.productionOrigin + pathOf(c, k.thankYou) })
} else for (const a of argv) if (!a.startsWith('--')) jobs.push({ id: a })
if (!jobs.length) { console.error('usage: check-ghl-form.mjs <formId|url> [...] | --combo <combo.json>'); process.exit(2) }

const norm = (u) => { try { const x = new URL(u); return (x.origin + x.pathname).replace(/\/+$/, '').toLowerCase() } catch { return String(u) } }
let bad = 0
for (const j of jobs) {
  const f = await readForm(j.id)
  if (!f.ok) { bad++; console.log(`${f.id}  FAIL  no form payload (wrong id, or the form was deleted)`); continue }
  const problems = []
  if (f.saveExit) problems.push('save-and-exit is ON: turn it off in GoHighLevel (prefilled consent fields trigger "Submission in progress")')
  if (f.consentFields < CONSENT_FIELDS) problems.push(`consent fields ${f.consentFields}/${CONSENT_FIELDS}: create the missing ones in the GoHighLevel sub-account (Query Key = field key) and add them hidden to this form`)
  if (j.expect) {
    if (f.actionType !== '1') problems.push(`on submit it shows an inline message (actionType ${f.actionType}), it must redirect to ${j.expect}`)
    else if (norm(f.redirectUrl) !== norm(j.expect)) problems.push(`redirects to ${f.redirectUrl || '(empty)'}, expected ${j.expect}`)
  }
  if (problems.length) bad++
  console.log(`${f.id}  ${problems.length ? 'FAIL' : 'ok  '}  "${f.name ?? '?'}"${j.campaign ? '  [' + j.campaign + ']' : ''}`)
  console.log(`      save-exit ${f.saveExit ? 'ON' : 'off'} · action ${f.actionType === '1' ? 'redirect' : f.actionType === '2' ? 'message' : f.actionType} · redirect ${f.redirectUrl || '-'} · consent fields ${f.consentFields}/${CONSENT_FIELDS}`)
  for (const p of problems) console.log('      PROBLEM ' + p)
}
console.log(`\n${bad} form(s) failing`)
process.exitCode = bad ? 1 : 0
