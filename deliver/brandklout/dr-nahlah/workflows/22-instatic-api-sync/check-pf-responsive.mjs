import { getSite } from '../../../../process/22-instatic-api-sync/insta-api.mjs'
const { site } = await getSite()
const rule = Object.values(site.styleRules || {}).find(r => r.selector === '.ch-proof .pf-embed')
console.log('registry styles   :', JSON.stringify(rule.styles))
console.log('registry contextStyles:', JSON.stringify(rule.contextStyles ?? null))
for (const f of site.files) {
  if (!/\.css$/.test(f.path)) continue
  const c = f.content || ''
  let idx = 0
  while ((idx = c.indexOf('pf-embed', idx)) !== -1) {
    const before = c.slice(Math.max(0, idx - 900), idx)
    const mq = [...before.matchAll(/@media[^{]+\{/g)].pop()
    const line = c.slice(idx - 40, idx + 140).replace(/\s+/g, ' ')
    console.log('\n' + f.path + (mq ? '  INSIDE ' + mq[0].trim() : '  (no media query)'))
    console.log('   …' + line)
    idx += 8
  }
}
