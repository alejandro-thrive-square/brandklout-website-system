import { api } from '../../../../process/22-instatic-api-sync/insta-api.mjs'
const APPLY = process.argv.includes('--apply')
const OFF = { alexandria: 'the Alexandria, VA office', tysons: 'the Tysons Corner office in McLean, VA' }
const TR = { 'all-on-4': 'All-on-4', 'dental-implants': 'dental implant', veneers: 'veneer' }
const LAND = {
  'all-on-4': o => `A full upper or lower arch on four implants, planned and placed by a board-certified prosthodontist, with fixed provisional teeth the same day. At ${o}.`,
  'dental-implants': o => `Dental implants planned and placed by a board-certified prosthodontist, with the tooth on top designed in the practice's own laboratory. At ${o}.`,
  veneers: o => `Thin porcelain veneers hand-designed to your lip line, gum line and coloring, with a free Digital Smile Design before any enamel is touched. At ${o}.`,
}
const desc = slug => {
  const m = slug.match(/^ads-landing-pages\/(alexandria|tysons)-(all-on-4|dental-implants|veneers)(?:-(consultation|thank-you|chatgpt))?$/)
  if (!m) return null
  const [, off, tr, v] = m, o = OFF[off]
  if (!v || v === 'chatgpt') return LAND[tr](o)
  if (v === 'consultation') return `Request your ${tr === 'all-on-4' ? 'free full-arch' : TR[tr]} consultation at ${o} with a board-certified prosthodontist. Tell us about your situation and the team will call you.`
  return `Your ${TR[tr]} consultation request has reached ${o}. Call now and the team will get your consultation with Dr. Nahlah on the calendar.`
}
const pages = (await api('GET', '/admin/api/cms/plugins/brandklout.open-graph/runtime/pages')).pages.filter(p => p.slug.startsWith('ads-landing-pages/'))
for (const p of pages) {
  const d = desc(p.slug)
  if (!d) { console.log('?? no rule', p.slug); continue }
  const ov = { ...(p.override ?? { key: p.key, title: p.title, type: 'website', enabled: true }), description: d }
  console.log(`${p.override ? 'upd' : 'NEW'} ${p.slug} (${d.length})\n     ${d}`)
  if (APPLY) { const r = await api('POST', '/admin/api/cms/plugins/brandklout.open-graph/runtime/override', ov); if (!r.saved) console.log('   !! not saved', JSON.stringify(r)) }
}
