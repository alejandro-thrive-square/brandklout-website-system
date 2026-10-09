#!/usr/bin/env node
/**
 * Do the local build and the published site use the same classes? (after a rename, both must)
 *
 *   node class-sync-check.mjs --site <client>:staging --build <dir with page .html files>
 *
 * Per page present on both sides: class tokens only in the build, only on the site. Instatic adds
 * its own (`instatic-*`, module classes) and drops empty wrappers, so the report lists differences
 * for a human; the line to look for is an OLD name on one side and its NEW name on the other.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { connect, argOf } from './target.mjs'

const build = argOf('--build')
const { target } = await connect()
const base = target.url.replace(/\/$/, '')
const tokens = (html) => new Set([...html.matchAll(/\sclass\s*=\s*["']([^"']*)["']/gi)].flatMap((m) => m[1].split(/\s+/)).filter((t) => t && !/^(instatic|is-instatic|w-|wf-)/.test(t)))
const files = []
const walk = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else if (n.endsWith('.html')) files.push(p) } }
walk(build)
let pages = 0
const onlyBuild = new Map()
const onlySite = new Map()
for (const f of files) {
  const slug = f.slice(build.length + 1).replace(/\\/g, '/').replace(/(\/index)?\.html$/, '').replace(/^index$/, '')
  const res = await fetch(`${base}/${slug}`)
  if (!res.ok) continue
  pages++
  const a = tokens(readFileSync(f, 'utf8'))
  const b = tokens(await res.text())
  for (const t of a) if (!b.has(t)) onlyBuild.set(t, [...(onlyBuild.get(t) ?? []), slug || '/'])
  for (const t of b) if (!a.has(t)) onlySite.set(t, [...(onlySite.get(t) ?? []), slug || '/'])
}
const show = (m) => [...m].sort((x, y) => y[1].length - x[1].length).slice(0, 40).map(([t, p]) => `${t} (${p.length})`).join('  ')
console.log(`${pages} page(s) compared, build ${build} vs ${base}`)
console.log(`only in the build (${onlyBuild.size}): ${show(onlyBuild)}`)
console.log(`only on the site  (${onlySite.size}): ${show(onlySite)}`)
