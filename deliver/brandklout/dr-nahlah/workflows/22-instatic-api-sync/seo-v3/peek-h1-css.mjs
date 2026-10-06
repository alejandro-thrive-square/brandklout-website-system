// read-only: every place the hero h1 is styled on INSTATIC_BASE_URL — registry rules (styles,
// contextStyles, breakpoint styles) and stylesheet files — plus the label class
import { getSite, BASE } from '../../../../../process/22-instatic-api-sync/insta-api.mjs'
const { site } = await getSite()
console.log(BASE)
for (const [id, r] of Object.entries(site.styleRules ?? {})) {
  const s = JSON.stringify(r)
  if (/(pg-hero|section_page-hero)[^"]*h1|"h1"|selector":"h1|"name":"(label|page-hero_title|ph-lead|page-hero_lead)"/.test(s) || (r.kind !== 'class' && /h1/.test(r.selector ?? ''))) console.log(id, s.slice(0, 700))
}
for (const f of site.files ?? []) {
  if (!/\.css$/.test(f.path)) continue
  const hits = [...f.content.matchAll(/[^{}]*\bh1\b[^{}]*\{[^}]*\}/g)].map((m) => m[0].trim().replace(/\s+/g, ' ')).filter((x) => /hero|^h1|,h1|h1,/.test(x))
  if (hits.length) console.log(`${f.path}${f.disabled ? ' (disabled)' : ''}:\n  ${hits.join('\n  ')}`)
}
console.log('breakpoints', JSON.stringify(site.breakpoints ?? site.settings?.breakpoints ?? null).slice(0, 300))
