#!/usr/bin/env node
/**
 * Read or set the Embed Origins allowlist.
 *
 *   node set-origins.mjs                                  # show current
 *   node set-origins.mjs --frame https://reputationhub.site
 *   node set-origins.mjs --clear
 *
 * The host validates against the plugin's declared schema, pushes the merged
 * record into the running VM, then emits `settings.changed` — in that order —
 * so the `publish.html` filter sees the new values immediately. The pages
 * already published keep their old CSP until the site is republished.
 */
import { api } from '../15-instatic-api-sync/insta-api.mjs'

const ID = 'webzite.embed-origins'
const argOf = (flag) => {
  const i = process.argv.indexOf(flag)
  return i === -1 ? null : process.argv[i + 1] ?? ''
}

if (process.argv.length <= 2) {
  // The payload is { schema: [...definitions], settings: {id: value} } — the
  // values are an OBJECT, not the schema array. Iterate the schema so a
  // declared-but-unset key still prints.
  const cur = await api('GET', `/admin/api/cms/plugins/${ID}/settings`)
  const values = cur.settings ?? {}
  for (const def of cur.schema ?? []) {
    console.log(`${def.id.padEnd(15)} ${JSON.stringify(values[def.id] ?? '')}`)
  }
  process.exit(0)
}

const clear = process.argv.includes('--clear')
const settings = {
  frameOrigins: clear ? '' : argOf('--frame') ?? '',
  scriptOrigins: clear ? '' : argOf('--script') ?? '',
  connectOrigins: clear ? '' : argOf('--connect') ?? '',
}
const res = await api('PUT', `/admin/api/cms/plugins/${ID}/settings`, { settings })
console.log(JSON.stringify(res.settings ?? res, null, 2).slice(0, 800))
