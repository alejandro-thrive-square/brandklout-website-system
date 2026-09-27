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

// The host does NOT merge: `PUT .../settings` replaces the whole record and every key left out
// falls back to its schema default (measured 2026-09-01: a call carrying only the toggle emptied
// all three origin boxes). Hence the read-merge-write above.
const clear = process.argv.includes('--clear')
if (!clear && Object.keys(FLAGS).every((flag) => argOf(flag) === null)) {
  console.error(`nothing to set: pass ${Object.keys(FLAGS).join(', ')} or --clear`)
  process.exit(2)
}
const settings = { ...values }
// A key the current schema does not declare makes the validator reject the whole write. One
// lingered from the short-lived 1.5.0 (`compatibleEverywhere`, 2026-09-02, reverted the same day;
// bk-mason-park), so send back only what the installed version declares.
const declared = new Set((cur.schema ?? []).map((def) => def.id))
if (declared.size) for (const key of Object.keys(settings)) if (!declared.has(key)) delete settings[key]
if (clear) for (const key of Object.values(FLAGS)) settings[key] = ''
for (const [flag, key] of Object.entries(FLAGS)) {
  const value = argOf(flag)
  if (value !== null) settings[key] = value
}
const res = await api('PUT', `/admin/api/cms/plugins/${ID}/settings`, { settings })
console.log(JSON.stringify(res.settings ?? res, null, 2).slice(0, 800))
