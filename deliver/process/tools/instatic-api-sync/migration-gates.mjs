#!/usr/bin/env node
/**
 * The before/after gates of a class or CSS-layer migration, run the same way on every site.
 *
 *   node migration-gates.mjs snapshot <label> --site <client>:staging     # style + behaviour capture
 *   node migration-gates.mjs diff <before> <after> --site <client>:staging
 *   node migration-gates.mjs final --site <client>:staging --map <class-map.json>   # the standards gates
 *
 * snapshot: css-parity (scripts off, every page) at 1440, 390, 1920 + runtime-parity (scripts on,
 *           every control clicked, scroll-through) at 1440, 390.
 * diff:     both diffs; exit 1 if either fails. Read the 1920 css diff against its noise
 *           (CLASS-STANDARD.md §8): `css-parity diff <before> <before2>` if in doubt.
 * final:    editability --published, class-audit --strict, class-rename --verify (no old name
 *           published anywhere). Exit 1 if any fails.
 * Logs go to output/fleet/<client>/.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { argOf } from './target.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const site = argOf('--site')
let [cmd, a, b] = process.argv.slice(2).filter((x, i, all) => !x.startsWith('--') && !['--site', '--map'].includes(all[i - 1]))
if (!site || !cmd) {
  console.error('usage: migration-gates.mjs snapshot <label> | diff <before> <after> | final --map <file>   --site <client>:staging')
  process.exit(2)
}
const client = site.split(':')[0]
const LOG = join(HERE, 'output', 'fleet', client)
mkdirSync(LOG, { recursive: true })
const run = (name, args, env = {}) => {
  const r = spawnSync(process.execPath, args, { cwd: HERE, env: { ...process.env, ...env }, encoding: 'utf8', maxBuffer: 1 << 28 })
  const out = (r.stdout ?? '') + (r.stderr ?? '')
  writeFileSync(join(LOG, `${name}.log`), out)
  const last = out.trim().split('\n').slice(-1)[0]
  console.log(`${r.status === 0 ? 'ok  ' : 'FAIL'}  ${name.padEnd(34)} ${last.slice(0, 120)}`)
  return r.status === 0
}
/* NOISE. Two captures of an unchanged site differ: auto margins that settle either way, a looping
   CSS animation caught mid-frame, a late web font (Stone Med Spa: the same 5 values flip between
   two captures of one state). So every style snapshot is taken twice (`<label>` and `<label>~n`),
   and a diff only counts a (page, element, property) that did NOT differ between the two captures
   of either side. */
const PARITY = join(HERE, 'output')
const diffLines = (x, y, w) => {
  const r = spawnSync(process.execPath, ['css-parity.mjs', 'diff', `${client}-${x}`, `${client}-${y}`], { cwd: HERE, env: { ...process.env, WIDTH: String(w) }, encoding: 'utf8', maxBuffer: 1 << 28 })
  const out = (r.stdout ?? '') + (r.stderr ?? '')
  if (/no snapshot/.test(out)) return null
  return out.split('\n').filter((l) => / {2}->  |ELEMENT GONE|PAGE MISSING/.test(l))
}
const keyOf = (l) => l.replace(/:\s.*$/, '').trim() // "page  path  prop"
let ok = true
if (cmd === 'snapshot') {
  for (const w of [1440, 390, 1920]) {
    ok = run(`css-${a}-${w}`, ['css-parity.mjs', 'snapshot', `${client}-${a}`, '--site', site, '--all-pages'], { WIDTH: String(w), HEIGHT: '900' }) && ok
    ok = run(`css-${a}~n-${w}`, ['css-parity.mjs', 'snapshot', `${client}-${a}~n`, '--site', site, '--all-pages'], { WIDTH: String(w), HEIGHT: '900' }) && ok
  }
  ok = run(`runtime-${a}`, ['runtime-parity.mjs', 'snapshot', a, '--site', site, '--widths', '1440,390']) && ok
} else if (cmd === 'diff') {
  for (const w of [1440, 390, 1920]) {
    const real = diffLines(a, b, w)
    if (real === null) { ok = false; console.log(`FAIL  css-diff-${w}: snapshot missing`); continue }
    const noise = new Set([...(diffLines(a, `${a}~n`, w) ?? []), ...(diffLines(b, `${b}~n`, w) ?? [])].map(keyOf))
    const counted = real.filter((l) => !noise.has(keyOf(l)))
    writeFileSync(join(LOG, `css-diff-${a}-${b}-${w}.log`), [`${real.length} raw, ${real.length - counted.length} noise (differ between two captures of one state), ${counted.length} real`, ...counted, '', 'noise:', ...real.filter((l) => noise.has(keyOf(l)))].join('\n'))
    console.log(`${counted.length ? 'FAIL' : 'ok  '}  ${`css-diff-${a}-${b}-${w}`.padEnd(34)} ${counted.length} real difference(s), ${real.length - counted.length} noise`)
    if (counted.length) ok = false
  }
  /* Behaviour: a page that differs is captured again (on its own, after the others) and only a
     difference that persists counts. A busy machine times a page out or catches a widget mid-load;
     a real regression is still there the second time. */
  // A baseline that was itself re-captured in its own diff (`<a>~m`: the first capture merged with
  // the re-capture of the pages that differed) is the better baseline: Stone Surgical Arts' raw `mid`
  // caught a form iframe and an accordion mid-load, and every later diff against it failed on them.
  {
    const host0 = new URL((await import('./target.mjs').then((m) => m.connect())).target.url).hostname
    const { existsSync } = await import('node:fs')
    if (existsSync(join(PARITY, `runtime-${host0}-${a}~m.json`))) {
      console.log(`      runtime baseline: ${a}~m (the re-checked capture of ${a})`)
      a = `${a}~m`
    }
    for (const l of [a, b]) {
      if (!existsSync(join(PARITY, `runtime-${host0}-${l}.json`))) {
        console.log(`FAIL  runtime snapshot "${l}" is missing (the capture crashed or never ran): re-run \`runtime-parity.mjs snapshot ${l.replace(/~m$/, '')} --site ${site} --widths 1440,390\``)
        process.exit(1)
      }
    }
  }
  if (!run(`runtime-diff-${a}-${b}`, ['runtime-parity.mjs', 'diff', a, b, '--site', site])) {
    const log = readFileSync(join(LOG, `runtime-diff-${a}-${b}.log`), 'utf8')
    const slugs = [...new Set([...log.matchAll(/^FAIL {2}(.+?) @\d+:/gm)].map((m) => m[1]))]
    console.log(`      re-capturing ${slugs.length} page(s) that differ: ${slugs.join(', ').slice(0, 200)}`)
    run(`runtime-${b}~r`, ['runtime-parity.mjs', 'snapshot', `${b}~r`, '--site', site, '--widths', '1440,390', '--only', slugs.join(',')])
    const host = new URL((await import('./target.mjs').then((m) => m.connect())).target.url).hostname
    const f = (l) => join(PARITY, `runtime-${host}-${l}.json`)
    const merged = { ...JSON.parse(readFileSync(f(b), 'utf8')), ...JSON.parse(readFileSync(f(`${b}~r`), 'utf8')) }
    writeFileSync(f(`${b}~m`), JSON.stringify(merged))
    run(`runtime-diff-${a}-${b}-recheck`, ['runtime-parity.mjs', 'diff', a, `${b}~m`, '--site', site])
    // A difference counts only if the SAME page and check fail against both captures of the new
    // state (values may differ: "visible 735 -> 693" and "visible 735 -> 700" are one check).
    const kinds = (name) => new Set([...readFileSync(join(LOG, `${name}.log`), 'utf8').matchAll(/^FAIL {2}(.+)$/gm)]
      .map((m) => m[1].replace(/-?\d+(\.\d+)?/g, '#').replace(/ -> .*$/, '')))
    const first = kinds(`runtime-diff-${a}-${b}`)
    const persistent = [...kinds(`runtime-diff-${a}-${b}-recheck`)].filter((k) => first.has(k))
    writeFileSync(join(LOG, `runtime-diff-${a}-${b}-persistent.log`), persistent.join('\n'))
    console.log(`${persistent.length ? 'FAIL' : 'ok  '}  ${`runtime-persistent-${a}-${b}`.padEnd(34)} ${persistent.length ? `${persistent.length} difference(s) seen in both captures: ${persistent.slice(0, 3).join(' | ')}` : 'no difference survives a second capture'}`)
    if (persistent.length) ok = false
  }
} else if (cmd === 'final') {
  ok = run('final-editability', ['editability.mjs', '--site', site, '--published']) && ok
  ok = run('final-class-audit', ['class-audit.mjs', '--site', site, '--strict', '--json', join(LOG, 'class-audit.json')]) && ok
  if (argOf('--map')) ok = run('final-rename-verify', ['class-rename.mjs', '--site', site, '--map', argOf('--map'), '--verify']) && ok
}
process.exit(ok ? 0 : 1)
