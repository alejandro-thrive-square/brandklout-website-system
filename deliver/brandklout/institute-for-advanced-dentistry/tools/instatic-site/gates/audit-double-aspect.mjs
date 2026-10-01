#!/usr/bin/env node
// PROMOTED 2026-09-23 to tools/instatic-site/gates/audit-double-aspect.mjs. Origin: bk-dr-nahlah,
// workflows/22-instatic-api-sync/audit-double-aspect.mjs. Run after swapping any video/embed slot:
// a slot's own padding-top:% plus the snippet's wrapper clips the film. Read-only.
/** Any rule that reserves its own aspect box AND could now contain a .wz-embed
 *  (whose Vimeo snippet reserves one too) = the /index .pf-embed bug again. */
import { getSite } from '../lib/site.mjs'
const { site } = await getSite()
const hits = []
for (const f of site.files) {
  if (!/\.css$/.test(f.path)) continue
  for (const m of (f.content || '').matchAll(/([^{};]+)\{([^}]*padding-top\s*:\s*[\d.]+%[^}]*)\}/g)) {
    hits.push({ where: f.path, sel: m[1].trim().replace(/\s+/g, ' ').slice(-80), decl: m[2].trim().slice(0, 90) })
  }
}
for (const r of Object.values(site.styleRules || {})) {
  const pt = r.styles?.paddingTop
  if (typeof pt === 'string' && pt.endsWith('%')) hits.push({ where: 'registry', sel: r.selector, decl: 'padding-top:' + pt })
}
console.log('rules reserving a percentage aspect box:', hits.length)
for (const h of hits) console.log('  [' + h.where + ']  ' + h.sel + '   { ' + h.decl + ' }')
