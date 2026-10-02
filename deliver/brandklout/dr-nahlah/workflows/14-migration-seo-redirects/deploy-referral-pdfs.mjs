#!/usr/bin/env node
/**
 * deploy-referral-pdfs.mjs — host the two referral PDFs (Asana 1219086723228800,
 * 2026-10-02) on a tiny Worker of our own, on the account's workers.dev subdomain.
 *
 *   node deploy-referral-pdfs.mjs            # plan
 *   node deploy-referral-pdfs.mjs --apply    # upload drnahlah-files + enable its workers.dev URL
 *
 * Why here: Instatic's media library takes only images, video and fonts (400 on a
 * PDF); the token answers 403 on zone Workers Routes, so the files cannot be served
 * at drnahlah.com directly; the Chrome extension cannot read local files, so a GHL
 * media upload by Codex fails. A Worker SCRIPT upload still works, and so does its
 * workers.dev switch. add-referral-pdf-redirects.mjs then points
 * drnahlah.com/patient-referral-form.pdf and /about-dr-nahlah.pdf at it, so the site
 * links never name workers.dev.
 *
 * The PDFs ride inside the script as base64 (1.1 MB together, well under the limit).
 * A new PDF = re-run with --apply; nothing else to change.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cf, accountId } from './cf-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const SCRIPT = 'drnahlah-files'
const SRC = join(HERE, '../04-design/.tmp/site-src/assets')
const FILES = {
  '/patient-referral-form.pdf': { file: 'dr-nahlah-patient-referral-form.pdf', name: 'Dr-Nahlah-Patient-Referral-Form.pdf' },
  '/about-dr-nahlah.pdf': { file: 'about-dr-nahlah-referring-doctors.pdf', name: 'About-Dr-Nahlah.pdf' },
}

const table = Object.fromEntries(Object.entries(FILES).map(([p, f]) => {
  const b = readFileSync(join(SRC, f.file))
  if (b.subarray(0, 5).toString() !== '%PDF-') throw new Error(`${f.file} is not a PDF`)
  return [p, { name: f.name, b64: b.toString('base64') }]
}))
const source = `const FILES = ${JSON.stringify(table)};
const cache = {};
export default {
  fetch(req) {
    const url = new URL(req.url);
    const f = FILES[url.pathname];
    if (!f || !['GET', 'HEAD'].includes(req.method)) return new Response('Not found', { status: 404 });
    const bytes = cache[url.pathname] ??= Uint8Array.from(atob(f.b64), (c) => c.charCodeAt(0));
    return new Response(req.method === 'HEAD' ? null : bytes, { headers: {
      'content-type': 'application/pdf',
      'content-disposition': 'inline; filename="' + f.name + '"',
      'cache-control': 'public, max-age=86400',
      'x-robots-tag': 'noindex',
    } });
  },
};
`
const acct = await accountId()
const sub = (await cf('GET', `/accounts/${acct}/workers/subdomain`)).subdomain
console.log(`script  ${SCRIPT} — ${(source.length / 1024).toFixed(0)} KB`)
for (const p of Object.keys(FILES)) console.log(`  https://${SCRIPT}.${sub}.workers.dev${p}`)
if (!APPLY) { console.log('plan only — pass --apply'); process.exit(0) }

const form = new FormData()
form.append('metadata', JSON.stringify({ main_module: 'worker.js', compatibility_date: '2026-08-01' }))
form.append('worker.js', new Blob([source], { type: 'application/javascript+module' }), 'worker.js')
const up = await cf('PUT', `/accounts/${acct}/workers/scripts/${SCRIPT}`, form)
console.log(`uploaded ${up.id} (${up.modified_on})`)
await cf('POST', `/accounts/${acct}/workers/scripts/${SCRIPT}/subdomain`, { enabled: true, previews_enabled: false })
console.log('workers.dev enabled')
for (let i = 0; i < 20; i++) {
  const r = await fetch(`https://${SCRIPT}.${sub}.workers.dev/patient-referral-form.pdf`).catch(() => null)
  if (r?.status === 200) { console.log(`live: ${r.headers.get('content-type')} ${(await r.arrayBuffer()).byteLength} bytes`); break }
  await new Promise((res) => setTimeout(res, 3000))
}
