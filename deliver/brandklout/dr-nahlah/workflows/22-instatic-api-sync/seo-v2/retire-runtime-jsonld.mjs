#!/usr/bin/env node
// SEO v2 (2026-10-05): retire the runtime JSON-LD. The aeo-schema plugin emits one server-side
// @graph per page; these scripts added a SECOND graph after load (src/scripts/jsonld/<page>.js,
// dangling "/#practice" ids, an old MedicalProcedure shape) and site.js appended its own
// FAQPage from the accordions, so the rendered page Google indexes carried two FAQPage blocks
// ("Duplicate field FAQPage"). Each jsonld/*.js is emptied to a no-op stub (assets stay, so
// nothing that loads them breaks); site.js loses only its appendChild of that FAQPage.
// Backs up every script first.   node seo-v2/retire-runtime-jsonld.mjs [--apply]
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { getSite, saveShell } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'
const HERE = dirname(fileURLToPath(import.meta.url))
const APPLY = process.argv.includes('--apply')
const { site, seq } = await getSite()
const BK = join(HERE, '..', '.tmp', 'backups', 'runtime-jsonld-' + new Date().toISOString().replace(/[:.]/g, '-'))
mkdirSync(BK, { recursive: true })
writeFileSync(join(BK, 'script-files.json'), JSON.stringify(site.files.filter((f) => /\.js$/.test(f.path))))
const STUB = '// Retired 2026-10-05 (SEO v2): structured data is emitted server-side by brandklout.aeo-schema.\n'
let n = 0
for (const f of site.files) {
  if (!/^src\/scripts\/jsonld\/(?!ztest).*\.js$/.test(f.path) || f.content === STUB) continue
  if (!/ld\+json/.test(f.content)) continue
  n++; f.content = STUB
}
const s = site.files.find((f) => f.path === 'src/scripts/site.js')
const FROM = "        mainEntity: schema\n      });\n      document.head.appendChild(ld);"
const TO = "        mainEntity: schema\n      });\n      /* SEO v2 2026-10-05: not appended. aeo-schema emits this page's FAQPage server-side. */"
const hits = s.content.split(FROM).length - 1
console.log(`jsonld stubs: ${n}   site.js FAQ append: ${hits} occurrence(s)   backup ${BK}`)
if (hits > 1) { console.error('refusing: more than one match in site.js'); process.exit(1) }
if (hits === 1) s.content = s.content.replace(FROM, TO)
if (!APPLY) { console.log('dry run'); process.exit(0) }
if (!n && !hits) { console.log('nothing to do'); process.exit(0) }
await saveShell(site, seq)
const back = (await getSite()).site.files
const left = back.filter((f) => /^src\/scripts\/jsonld\//.test(f.path) && /ld\+json/.test(f.content)).length
const siteBack = back.find((f) => f.path === 'src/scripts/site.js').content
console.log(`read back: jsonld files still emitting ${left}, site.js FAQ append present ${siteBack.includes(FROM)}`)
