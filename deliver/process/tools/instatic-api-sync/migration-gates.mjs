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
 * final:    editability --published, class-audit --strict, editor-canvas (the Instatic editor shows no
 *           closed overlay), class-rename --verify (no old name
 *           published anywhere). Exit 1 if any fails.
 * Logs go to output/fleet/<client>/.
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
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
/* A pass that dies launching Chrome (a loaded machine) produced no result: run it again, up to
   three times, instead of reporting a FAIL that is not about the site. */
const LAUNCH_ERROR = /DevToolsActivePort|did not expose a debugger socket|waiting for the WS endpoint|Failed to launch the browser/
/* Several site sessions capture on one workstation, beside the user's own Chrome (10 GB on 2026-10-08):
   three parallel captures ran it out of memory and Claude Code killed one. Every browser pass waits
   until MIN_FREE_GB (default 5) is free, checking each minute, for at most two hours. */
const MIN_FREE_GB = Number(process.env.MIN_FREE_GB ?? 5)
const freeGb = () => {
  if (process.platform !== 'win32') return Infinity
  const r = spawnSync('powershell', ['-NoProfile', '-Command', '(Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory'], { encoding: 'utf8' })
  const kb = Number(String(r.stdout ?? '').trim())
  return Number.isFinite(kb) && kb > 0 ? kb / 1048576 : Infinity
}
const waitForMemory = (name) => {
  for (let i = 0; i < 120; i++) {
    const free = freeGb()
    if (free >= MIN_FREE_GB) return
    if (i % 10 === 0) console.log(`wait  ${name.padEnd(34)} ${free.toFixed(1)} GB free, waiting for ${MIN_FREE_GB} GB`)
    spawnSync(process.execPath, ['-e', 'setTimeout(()=>{}, 60000)'])
  }
}
/* The memory check stops a pass from STARTING on a full machine, but passes that start together still
   grow together (Kids' 3-hour runtime capture was killed with four sessions running, 2026-10-08). So a
   machine-wide limit too: at most CAPTURE_SLOTS (default 2) browser passes at once, across every
   session, held as a directory lock with the owner's pid (a dead owner's slot is reclaimed). */
const SLOTS = Number(process.env.CAPTURE_SLOTS ?? 2)
const SLOT_DIR = join(HERE, 'output', 'fleet', '.capture-slots')
const alive = (pid) => { try { process.kill(pid, 0); return true } catch { return false } }
const takeSlot = (name) => {
  mkdirSync(SLOT_DIR, { recursive: true })
  for (let i = 0; ; i++) {
    for (let s = 0; s < SLOTS; s++) {
      const dir = join(SLOT_DIR, `slot-${s}`)
      try {
        mkdirSync(dir)
        writeFileSync(join(dir, 'owner'), `${process.pid} ${client} ${name} ${new Date().toISOString()}`)
        return dir
      } catch {
        let pid = 0
        try { pid = Number(readFileSync(join(dir, 'owner'), 'utf8').split(' ')[0]) } catch {}
        if (pid && !alive(pid)) { try { rmSync(dir, { recursive: true, force: true }) } catch {} }
      }
    }
    if (i % 10 === 0) console.log(`wait  ${name.padEnd(34)} all ${SLOTS} capture slots busy`)
    spawnSync(process.execPath, ['-e', 'setTimeout(()=>{}, 30000)'])
  }
}
const run = (name, args, env = {}) => {
  let r, out, slot = null
  if (/parity\.mjs$/.test(args[0]) && args[1] === 'snapshot') { slot = takeSlot(name); waitForMemory(name) }
  try {
  for (let attempt = 1; attempt <= 3; attempt++) {
    r = spawnSync(process.execPath, args, { cwd: HERE, env: { ...process.env, ...env }, encoding: 'utf8', maxBuffer: 1 << 28 })
    out = (r.stdout ?? '') + (r.stderr ?? '')
    if (r.status === 0 || !LAUNCH_ERROR.test(out) || attempt === 3) break
    console.log(`retry ${name.padEnd(34)} Chrome launch failed (attempt ${attempt}), retrying`)
    spawnSync(process.execPath, ['-e', 'setTimeout(()=>{}, 20000)'])
  }
  } finally {
    if (slot) try { rmSync(slot, { recursive: true, force: true }) } catch {}
  }
  writeFileSync(join(LOG, `${name}.log`), out)
  const last = out.trim().split('\n').slice(-1)[0]
  console.log(`${r.status === 0 ? 'ok  ' : 'FAIL'}  ${name.padEnd(34)} ${last.slice(0, 120)}`)
  return r.status === 0
}
// A capture you run by hand takes a slot the same way:
//   node migration-gates.mjs slot --site <c>:staging -- css-parity.mjs snapshot <label> --site <c>:staging --all-pages
if (process.argv[2] === 'slot') {
  const i = process.argv.indexOf('--')
  const ok = run(`manual-${Date.now()}`, process.argv.slice(i + 1))
  process.exit(ok ? 0 : 1)
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
    /* A real difference shows up in BOTH independent comparisons (first captures, and second
       captures). A flip that only one comparison sees is noise; a capture that broke on one side
       (a page captured before its CSS arrived: Mason Park privacy-policy, 5,829 values) cannot
       hide a real difference, because the other comparison still sees it. Small flips that
       differ between two captures of ONE state are also dropped. */
    const second = diffLines(`${a}~n`, `${b}~n`, w)
    const secondKeys = second === null ? null : new Set(second.map(keyOf))
    const flipLines = [...(diffLines(a, `${a}~n`, w) ?? []), ...(diffLines(b, `${b}~n`, w) ?? [])]
    const pageOf = (l) => l.split(/\s{2,}/)[0]
    const perPage = new Map()
    for (const l of flipLines) perPage.set(pageOf(l), (perPage.get(pageOf(l)) ?? 0) + 1)
    const brokenPages = new Set([...perPage].filter(([, n]) => n > 200).map(([p]) => p))
    const broken = [...brokenPages].map((p) => `${p} (${perPage.get(p)})`)
    // proven flippers: differ between two captures of one state, on a page whose captures are sound
    const flips = new Set(flipLines.filter((l) => !brokenPages.has(pageOf(l))).map(keyOf))
    const finalReal = real
      .filter((l) => (secondKeys ? secondKeys.has(keyOf(l)) : true))
      .filter((l) => !flips.has(keyOf(l)))
    writeFileSync(join(LOG, `css-diff-${a}-${b}-${w}.log`), [
      `${real.length} raw; ${finalReal.length} real (seen in both comparisons${secondKeys ? '' : ': no second captures, noise-subtracted instead'})`,
      broken.length ? `pages with a capture that disagrees wholesale (one capture broke; covered by the other comparison): ${broken.join(', ')}` : '',
      ...finalReal, '', 'not counted:', ...real.filter((l) => !finalReal.includes(l))].join('\n'))
    console.log(`${finalReal.length ? 'FAIL' : 'ok  '}  ${`css-diff-${a}-${b}-${w}`.padEnd(34)} ${finalReal.length} real difference(s) of ${real.length} raw${broken.length ? `; unreliable capture on ${broken.length} page(s), see log` : ''}`)
    if (finalReal.length) ok = false
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
    // A persistent difference against a MIDDLE capture may be that capture's own noise (it cannot be
    // re-captured: the state is gone). If the original `before` baseline exists, the page is judged
    // against it too: what matters is that the final state behaves like the site did originally
    // (Mason Park Kids: 3 items off in `mid` only; before vs final was identical).
    if (persistent.length && !/^before(~m)?$/.test(a)) {
      const { existsSync } = await import('node:fs')
      const host1 = new URL((await import('./target.mjs').then((m) => m.connect())).target.url).hostname
      const orig = existsSync(join(PARITY, `runtime-${host1}-before~m.json`)) ? 'before~m' : 'before'
      if (existsSync(join(PARITY, `runtime-${host1}-${orig}.json`))) {
        run(`runtime-diff-${orig}-${b}~m`, ['runtime-parity.mjs', 'diff', orig, `${b}~m`, '--site', site])
        const vsOrig = kinds(`runtime-diff-${orig}-${b}~m`)
        const still = persistent.filter((k) => vsOrig.has(k))
        console.log(`      against the original ${orig}: ${persistent.length - still.length} of ${persistent.length} were the middle capture's noise`)
        persistent.splice(0, persistent.length, ...still)
      }
    }
    writeFileSync(join(LOG, `runtime-diff-${a}-${b}-persistent.log`), persistent.join('\n'))
    console.log(`${persistent.length ? 'FAIL' : 'ok  '}  ${`runtime-persistent-${a}-${b}`.padEnd(34)} ${persistent.length ? `${persistent.length} difference(s) seen in both captures: ${persistent.slice(0, 3).join(' | ')}` : 'no difference survives a second capture'}`)
    if (persistent.length) ok = false
  }
} else if (cmd === 'final') {
  ok = run('final-editability', ['editability.mjs', '--site', site, '--published']) && ok
  ok = run('final-class-audit', ['class-audit.mjs', '--site', site, '--strict', '--json', join(LOG, 'class-audit.json')]) && ok
  if (argOf('--map')) ok = run('final-rename-verify', ['class-rename.mjs', '--site', site, '--map', argOf('--map'), '--verify']) && ok
  // The editor is a different renderer (React drops hidden="", no site scripts): a site can pass
  // every published-page gate and still show a closed modal over every page in the editor (IFA, 2026-10-07).
  ok = run('final-editor-canvas', ['editor-canvas.mjs', '--site', site]) && ok
  // Report only for migrated sites (the spacing snap is phase 2 C); new builds run it --strict.
  run('final-structure', ['structure-audit.mjs', '--site', site])
}
process.exit(ok ? 0 : 1)
