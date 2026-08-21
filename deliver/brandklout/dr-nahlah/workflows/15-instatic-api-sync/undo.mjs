import { readFileSync } from 'node:fs'
import { getSite, saveShell } from './insta-api.mjs'
const saved = JSON.parse(readFileSync(process.argv[2], 'utf8'))
const { site: current, seq } = await getSite()
// Restore the whole shell as it was before the cutover: styleRules (undoes the
// class->ambient demotions) AND runtime.styles (re-enables the code assets).
saved.updatedAt = current.updatedAt
const res = await saveShell(saved, seq)
const { site: after } = await getSite()
const styles = after.runtime?.styles ?? {}
const files = (after.files ?? []).filter(f => f.type === 'style')
console.log(`seq ${seq} -> ${res.seq}; rules ${Object.keys(after.styleRules ?? {}).length}`)
for (const f of files) console.log(`  ${f.path}: enabled=${styles[f.id]?.enabled ?? true}`)
