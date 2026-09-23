#!/usr/bin/env node
/**
 * check-ghl-form.mjs — is a GoHighLevel form ready to embed on a Brandklout site?
 *
 * Promoted 2026-09-23 from institute-for-advanced-dentistry/workflows/21-instatic-upload/
 * check-ghl-form.mjs (run on IFA, dr-nahlah and oceanic-dental). Added: the consent-field check
 * that oceanic-dental's run did by hand with curl | grep privacy_.
 *
 * Two findings, both invisible from the website:
 *  1. `enableSaveExitConfirmation` ON. The consent bridge prefills hidden privacy_* fields
 *     through the iframe URL on every load. GHL counts that as a started submission, stores
 *     form_progress_<id> in the frame's localStorage and shows "Submission in progress - Start
 *     over / Continue" on the next load, which is often a fraction of a second away because
 *     form_embed.js re-parents (and so reloads) the iframe. Fix in GHL: turn save-and-exit off.
 *  2. Missing consent fields. The bridge sends 11 privacy_* values; GHL drops any whose Query Key
 *     is not a field on the form. Spec: deliver/process/tools/termly-ghl-consent.
 *
 * Reads the public form page only; submits nothing.
 *   node check-ghl-form.mjs <formId|url> [...]  > output/ghl-forms.log 2>&1   (redirect, never pipe)
 * Exit 1 if any form has save-and-exit on or fewer than 11 consent fields.
 */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const CONSENT_FIELDS = 11;
let bad = 0;
if (process.argv.length < 3) { console.error('usage: check-ghl-form.mjs <formId|url> [...]'); process.exit(2); }
for (const arg of process.argv.slice(2)) {
  const id = (arg.match(/widget\/form\/([A-Za-z0-9]+)/) || [null, arg])[1];
  const html = await (await fetch(`https://api.leadconnectorhq.com/widget/form/${id}`, { headers: { 'user-agent': UA } })).text();
  const m = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) { console.log(`${id}  ?  no form payload (wrong id, or the form was deleted)`); bad++; continue; }
  const data = JSON.parse(m[1]);
  const node = data.find((n) => n && typeof n === 'object' && !Array.isArray(n) && 'enableSaveExitConfirmation' in n);
  const on = node ? data[node.enableSaveExitConfirmation] === true : false;
  const fields = [...new Set(html.match(/privacy_[a-z_]+|marketing_disclosure_version/g) || [])];
  const short = fields.length < CONSENT_FIELDS;
  if (on || short) bad++;
  console.log(`${id}  save-and-exit ${on ? 'ON  (turn it off in GHL: prefilled consent fields trigger "Submission in progress")' : 'off'}`);
  console.log(`${id}  consent fields ${fields.length}/${CONSENT_FIELDS}${short ? '  MISSING: create them in the GHL sub-account (Query Key = field key) and add them hidden to this form' : ''}`);
}
process.exit(bad ? 1 : 0);
