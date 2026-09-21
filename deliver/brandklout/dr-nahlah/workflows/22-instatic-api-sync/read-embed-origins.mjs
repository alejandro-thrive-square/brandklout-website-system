import { api } from '../../../../process/22-instatic-api-sync/insta-api.mjs'
const plugins = await api('GET', '/admin/api/cms/plugins')
const list = plugins.plugins ?? plugins
console.log('plugins:', (Array.isArray(list) ? list : Object.values(list)).map(p => `${p.id}@${p.version ?? '?'}`).join('\n         '))
for (const id of ['brandklout.embed-origins', 'webzite.embed-origins']) {
  try {
    const cur = await api('GET', `/admin/api/cms/plugins/${id}/settings`)
    console.log(`\n=== ${id} settings ===`)
    console.log(JSON.stringify(cur.settings ?? cur, null, 2))
  } catch (e) { console.log(`\n=== ${id} -> ${e.message.slice(0,120)}`) }
}
