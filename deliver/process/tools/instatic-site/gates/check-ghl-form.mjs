#!/usr/bin/env node
// PROMOTED 2026-09-23 to tools/instatic-site/gates/check-ghl-form.mjs, verbatim. Origin: bk-ifa-dentistry,
// deliver/brandklout/institute-for-advanced-dentistry/workflows/21-instatic-upload/check-ghl-form.mjs.
/**
 * Does a GoHighLevel form nag "Submission in progress — Start over / Continue"?
 *
 * It does when BOTH of these are true:
 *   1. the form's own setting `enableSaveExitConfirmation` is on (GoHighLevel form builder, the
 *      save-and-exit / resume option), and
 *   2. any field arrives prefilled through the iframe URL — which the Brandklout consent bridge
 *      does on every load, to write the visitor's Termly choice into the hidden privacy_* fields.
 * GoHighLevel counts the prefilled values as a submission the visitor started, stores
 * `form_progress_<formId>` in the frame's localStorage, and offers to resume it on the NEXT load.
 * The next load is often a fraction of a second away: form_embed.js re-parents the iframe once, and
 * moving an iframe in the DOM reloads it. So the visitor meets the prompt on a form they never touched.
 *
 * Proven 2026-09-21 on the form itself, no website involved: no query string, two loads -> nothing;
 * consent query string, two loads -> progress key after the first, prompt on the second; the same
 * with only ?first_name=Test. Of 13 forms in the repo, exactly the ones with the flag on prompt.
 *
 * The fix is in GoHighLevel: turn the option off on the form. Nothing on the site can reach it —
 * the storage belongs to api.leadconnectorhq.com.
 *
 * Reads the public form page only; submits nothing.
 *   node check-ghl-form.mjs <formId|url> [...]  > .tmp/ghl-forms.log 2>&1     (redirect, never pipe)
 */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
let bad = 0
for (const arg of process.argv.slice(2)) {
  const id = (arg.match(/widget\/form\/([A-Za-z0-9]+)/) || [null, arg])[1]
  const html = await (await fetch(`https://api.leadconnectorhq.com/widget/form/${id}`, { headers: { 'user-agent': UA } })).text()
  const m = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (!m) { console.log(`${id}  ?      no form payload (wrong id, or the form was deleted)`); continue }
  const data = JSON.parse(m[1])
  const node = data.find((n) => n && typeof n === 'object' && !Array.isArray(n) && 'enableSaveExitConfirmation' in n)
  const on = node ? data[node.enableSaveExitConfirmation] === true : false
  if (on) bad++
  console.log(`${id}  ${on ? 'ON ' : 'off'}    ${on ? 'will show "Submission in progress" wherever a field is prefilled by URL — turn save-and-exit off in GoHighLevel' : 'quiet'}`)
}
process.exit(bad ? 1 : 0)
