#!/usr/bin/env node
/**
 * check-ghl-form.mjs - read a GoHighLevel form's public settings and fail on the three
 * settings that break a paid combo. Reads the public form page only; submits nothing.
 *
 * Origin: institute-for-advanced-dentistry/workflows/21-instatic-upload/check-ghl-form.mjs
 * (bk-ifa-dentistry, 2026-09-21: the save-and-exit check). Extended for scenario 5 with the
 * redirect check, read from the same __NUXT_DATA__ payload (formAction.actionType '1' =
 * redirect, '2' = inline message; verified on Livewell, Mason Park, Dr. Nahlah and IFA forms).
 *
 * What it fails on:
 *   1. enableSaveExitConfirmation ON. With the consent bridge prefilling privacy_* fields on
 *      every load, the visitor meets "Submission in progress - Start over / Continue" on a form
 *      they never touched. Fix in GoHighLevel: turn save-and-exit off on the form.
 *   2. (--combo) the form does not REDIRECT (actionType must be '1').
 *   3. (--combo) the redirect is not this campaign's thank-you page on the production origin.
 *      Without it the Google Ads conversion never fires and the lead is untagged.
 * It also prints the form name and how many privacy_* consent fields it has (0 = the consent
 * bridge has nothing to write into; see tools/termly-ghl-consent).
 *
 *   node check-ghl-form.mjs <formId|url> [...]                      > .tmp/ghl-forms.log 2>&1
 *   node check-ghl-form.mjs --combo <combo.json>                    > .tmp/ghl-forms.log 2>&1
 *
 * Redirect stdout to a file, never pipe it (Node 24 on Windows dies on a piped stdout).
 */
import { parseArgs, loadCombo, readGhlForm, pathOf, sameUrl } from './lib/combo.mjs'

const { flags, rest } = parseArgs()
let bad = 0
const jobs = []
if (flags.combo) {
  const c = loadCombo(flags.combo)
  for (const k of c.campaigns) jobs.push({ id: k.formId, campaign: k.name, expect: c.productionOrigin + pathOf(c, k.thankYou) })
} else for (const a of rest) jobs.push({ id: a })
if (!jobs.length) { console.error('usage: check-ghl-form.mjs <formId|url> ... | --combo <combo.json>'); process.exit(2) }

for (const j of jobs) {
  const f = await readGhlForm(j.id)
  if (!f.ok) { bad++; console.log(`${f.id}  FAIL  no form payload (wrong id, or the form was deleted)`); continue }
  const problems = []
  if (f.saveExit) problems.push('save-and-exit is ON: turn it off in GoHighLevel ("Submission in progress" on untouched forms)')
  if (j.expect) {
    if (f.actionType !== '1') problems.push(`on submit it shows an inline message (actionType ${f.actionType}), it must redirect to ${j.expect}`)
    else if (!sameUrl(f.redirectUrl, j.expect)) problems.push(`redirects to ${f.redirectUrl || '(empty)'}, expected ${j.expect}`)
  }
  bad += problems.length ? 1 : 0
  console.log(`${f.id}  ${problems.length ? 'FAIL' : 'ok  '}  "${f.name ?? '?'}"${j.campaign ? '  [' + j.campaign + ']' : ''}`)
  console.log(`      save-exit ${f.saveExit ? 'ON' : 'off'} · action ${f.actionType === '1' ? 'redirect' : f.actionType === '2' ? 'message' : f.actionType} · redirect ${f.redirectUrl || '-'} · privacy_* fields ${f.privacyFields}`)
  for (const p of problems) console.log('      PROBLEM ' + p)
}
console.log(`\n${bad} form(s) failing`)
process.exitCode = bad ? 1 : 0
