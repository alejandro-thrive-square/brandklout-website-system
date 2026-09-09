#!/usr/bin/env node
/**
 * Move every enabled script out of `<head>` so nothing blocks first paint.
 *
 * Instatic's tag builder (`core/site-runtime/assetManifest.ts`) emits classic
 * scripts as a BARE `<script src>` — no `defer`, no `async`, ever. The
 * per-script `timing` field ("immediate" / "dom-ready" / "idle") is stored but
 * NEVER READ at publish time. So the only lever on render-blocking is
 * `placement`, and every enabled script was sitting in `head`:
 *
 *     gsap-head-i.js   153,256 B raw / 59,132 B gz
 *     seo-head.js       48,049 B raw / 10,840 B gz
 *     jsonld/<page>.js     874–4,788 B, one per page
 *
 * ── WHY THIS IS SAFE, AND WHAT WOULD MAKE IT UNSAFE ───────────────────────
 * `gsap-head-i.js`'s own header says it MUST stay head + blocking because the
 * per-page inline scripts latch `window.gsap && window.ScrollTrigger` during
 * parse. **That comment is stale.** Those inline scripts were retired and
 * emptied on 2026-08-19. The only remaining consumer of the GSAP global is
 * `src/scripts/site.js`, which ships as the `type="module"` entry — and module
 * scripts are deferred by definition, running only after parsing completes.
 * A body-end classic script executes DURING parsing, so GSAP still evaluates
 * before site.js. Order is preserved by spec, not by luck.
 *
 * Also checked, because it is the other way this goes wrong: nothing
 * above the fold is hidden pending JS. `[data-anim="hide"]` appears zero times
 * in the published HTML, and `.wz-kit [data-rv] { opacity: 0 }` never matches —
 * `.wz-kit` is on no element and no script adds it. If either had been live,
 * deferring the reveal would have made LCP WORSE, not better.
 *
 * Re-verify BOTH of those before moving scripts on any other site.
 *
 * Ordering within body-end follows `priority` ascending, which already puts
 * GSAP (0) ahead of the JSON-LD (1) and seo-head (2).
 *
 *   node perf-unblock-head.mjs           # dry run
 *   node perf-unblock-head.mjs --apply
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { join, dirname } from 'node:path'
import { getSite, saveShell } from '../../../../process/22-instatic-api-sync/insta-api.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const TMP = join(HERE, '.tmp')
const APPLY = process.argv.includes('--apply')

const { site, seq } = await getSite()
const byId = new Map((site.files ?? []).map((f) => [f.id, f]))
const scripts = site.runtime?.scripts ?? {}

mkdirSync(join(TMP, 'backups'), { recursive: true })
writeFileSync(join(TMP, 'backups', `pre-unblock-head-${seq}.json`), JSON.stringify({ seq, scripts }, null, 2))

const moves = []
for (const [id, cfg] of Object.entries(scripts)) {
  if (!cfg.enabled || cfg.placement !== 'head') continue
  moves.push({ id, path: byId.get(id)?.path ?? id, bytes: (byId.get(id)?.content ?? '').length, from: cfg.placement, priority: cfg.priority })
}
moves.sort((a, b) => a.priority - b.priority || a.path.localeCompare(b.path))

console.log(`enabled scripts in <head>: ${moves.length}`)
let total = 0
for (const m of moves) { total += m.bytes; console.log(`  prio ${String(m.priority).padStart(2)}  ${m.path.padEnd(40)} ${String(m.bytes).padStart(7)} B`) }
console.log(`\n  raw bytes leaving the blocking path: ${total.toLocaleString()} B`)
if (!moves.length) { console.log('nothing to do'); process.exit(0) }
if (!APPLY) { console.log('\ndry run — re-run with --apply'); process.exit(0) }

const next = structuredClone(site)
for (const m of moves) next.runtime.scripts[m.id].placement = 'body-end'

const res = await saveShell(next, seq)
console.log('\nsaved:', JSON.stringify(res).slice(0, 120))

const after = await getSite()
const stillHead = Object.entries(after.site.runtime?.scripts ?? {})
  .filter(([, c]) => c.enabled && c.placement === 'head')
console.log(`enabled scripts still in <head>: ${stillHead.length}`)
for (const [id] of stillHead) console.log(`  BAD ${byId.get(id)?.path ?? id}`)
const moved = moves.filter((m) => after.site.runtime.scripts[m.id].placement === 'body-end').length
console.log(`moved to body-end: ${moved}/${moves.length}`)
process.exit(stillHead.length || moved !== moves.length ? 1 : 0)
