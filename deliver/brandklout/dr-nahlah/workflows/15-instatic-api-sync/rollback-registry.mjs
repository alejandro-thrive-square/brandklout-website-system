#!/usr/bin/env node
/**
 * Restore `styleRules` + `conditions` from a saved pre-change shell snapshot.
 * Only those two fields are touched, so anything edited in the browser since
 * (page content, settings, files) is left alone.
 *
 *   node rollback-registry.mjs .tmp/shell.before.6.json [--apply]
 */
import { readFileSync } from 'node:fs'
import { getSite, saveShell } from './insta-api.mjs'

const file = process.argv[2]
const apply = process.argv.includes('--apply')
if (!file) { console.error('usage: rollback-registry.mjs <shell.before.N.json> [--apply]'); process.exit(2) }

const saved = JSON.parse(readFileSync(file, 'utf8'))
const { site: shell, seq } = await getSite()
console.log(`current registry ${Object.keys(shell.styleRules ?? {}).length} rules (seq ${seq})`)
console.log(`snapshot registry ${Object.keys(saved.styleRules ?? {}).length} rules`)
if (!apply) { console.log('\nDRY RUN — re-run with --apply'); process.exit(0) }

shell.styleRules = saved.styleRules
shell.conditions = saved.conditions
const res = await saveShell(shell, seq)
const { site: after } = await getSite()
const n = Object.keys(after.styleRules ?? {}).length
console.log(`saved — seq ${seq} -> ${res.seq}; registry now ${n} rules`)
if (n !== Object.keys(saved.styleRules ?? {}).length) { console.error('VERIFY FAILED'); process.exit(1) }
console.log('verified')
