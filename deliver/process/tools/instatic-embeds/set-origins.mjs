#!/usr/bin/env node
/**
 * Read or set the Embed Origins allowlist and site scripts.
 *
 *   node set-origins.mjs                                  # show current
 *   node set-origins.mjs --frame https://reputationhub.site
 *   node set-origins.mjs --site-scripts https://cdn.jsdelivr.net/npm/x/dist/x.js
 *   node set-origins.mjs --clear                          # empty all four boxes
 *
 * Only the flags given change; every other setting is read back and sent as it
 * was, so setting one box never blanks another (`embedPolicy`, `autoTrust`).
 *
 * The host validates against the plugin's declared schema, pushes the merged
 * record into the running VM, then emits `settings.changed` — in that order —
 * so the `publish.html` filter sees the new values immediately. The pages
 * already published keep their old CSP until the site is republished.
 */
import { api } from './lib/insta-api.mjs'

const ID = 'brandklout.embed-origins'
const FLAGS = {
  '--frame': 'frameOrigins',
  '--script': 'scriptOrigins',
  '--connect': 'connectOrigins',
  '--site-scripts': 'siteScripts',
}
const argOf = (flag) => {
  const i = process.argv.indexOf(flag)
  return i === -1 ? null : process.argv[i + 1] ?? ''
}

// The payload is { schema: [...definitions], settings: {id: value} } — the
// values are an OBJECT, not the schema array. Iterate the schema so a
// declared-but-unset key still prints.
const cur = await api('GET', `/admin/api/cms/plugins/${ID}/settings`)
const values = cur.settings ?? {}

if (process.argv.length <= 2) {
  for (const def of cur.schema ?? []) {
    console.log(`${def.id.padEnd(15)} ${JSON.stringify(values[def.id] ?? '')}`)
  }
  process.exit(0)
}

const settings = { ...values }
if (process.argv.includes('--clear')) for (const key of Object.values(FLAGS)) settings[key] = ''
for (const [flag, key] of Object.entries(FLAGS)) {
  const value = argOf(flag)
  if (value !== null) settings[key] = value
}
const res = await api('PUT', `/admin/api/cms/plugins/${ID}/settings`, { settings })
console.log(JSON.stringify(res.settings ?? res, null, 2).slice(0, 800))
