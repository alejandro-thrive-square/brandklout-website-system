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
import { api } from './lib/insta-api.mjs'

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

// Only the flags named on the command line change. The host does NOT merge:
// `PUT .../settings` replaces the whole record and every key left out falls
// back to its schema default — measured 2026-09-01, when a call carrying only
// the toggle emptied all three origin boxes, and the call that re-typed the
// boxes switched the toggle back off. So read the current record first and
// write the merged one. Until v1.5.0 every call rewrote all three boxes from
// the args, so `--script x` silently emptied the Google Maps frame origin.
// `--clear` still empties all three on purpose.
const clear = process.argv.includes('--clear')
const current = (await api('GET', `/admin/api/cms/plugins/${ID}/settings`)).settings ?? {}
const settings = { ...current }
if (clear) Object.assign(settings, { frameOrigins: '', scriptOrigins: '', connectOrigins: '' })
if (argOf('--frame') !== null) settings.frameOrigins = argOf('--frame')
if (argOf('--script') !== null) settings.scriptOrigins = argOf('--script')
if (argOf('--connect') !== null) settings.connectOrigins = argOf('--connect')
// `--compatible-everywhere on|off`: the compatible policy on every page, for a
// staging instance carrying a review sidebar. The toggle stores a boolean and
// the filter checks `=== true`, so the string must become one here.
const everywhere = argOf('--compatible-everywhere')
if (everywhere !== null) {
  if (everywhere !== 'on' && everywhere !== 'off') {
    console.error('--compatible-everywhere takes on or off')
    process.exit(2)
  }
  settings.compatibleEverywhere = everywhere === 'on'
}
if (!clear && argOf('--frame') === null && argOf('--script') === null &&
    argOf('--connect') === null && everywhere === null) {
  console.error('nothing to set: pass --frame, --script, --connect, --compatible-everywhere or --clear')
  process.exit(2)
}
const res = await api('PUT', `/admin/api/cms/plugins/${ID}/settings`, { settings })
console.log(JSON.stringify(res.settings ?? res, null, 2).slice(0, 800))
