#!/usr/bin/env node
/**
 * ChatGPT / Codex usage limits and rate-limit reset credits, through the Codex app server's own
 * JSON-RPC (`account/rateLimits/read`, `account/rateLimitResetCredit/consume`). No browser, no keys:
 * it uses the ChatGPT app's signed-in account.
 *
 *   node codex-limits.mjs status            # usage windows, % used, reset credits available
 *   node codex-limits.mjs reset             # spend ONE reset credit (only when a limit is reached)
 *   node codex-limits.mjs reset --force     # spend one even if no limit is reached
 *
 * Redirect stdout to a file, never pipe it (Node 24 on Windows dies on a piped stdout).
 */
import { spawn } from 'node:child_process'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import path from 'node:path'

/** The ChatGPT app's own codex.exe (newest build). */
function codexBin() {
  const dir = path.join(process.env.LOCALAPPDATA || '', 'OpenAI', 'Codex', 'bin')
  const builds = existsSync(dir) ? readdirSync(dir).map((d) => path.join(dir, d, 'codex.exe')).filter(existsSync) : []
  builds.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)
  if (!builds[0]) throw new Error(`no codex.exe under ${dir}; is the ChatGPT app installed?`)
  return builds[0]
}

function rpc() {
  const child = spawn(codexBin(), ['app-server'], { stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true })
  let buf = ''
  let n = 0
  const waiting = new Map()
  child.stdout.on('data', (d) => {
    buf += d
    let i
    while ((i = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, i).trim()
      buf = buf.slice(i + 1)
      if (!line) continue
      let m
      try { m = JSON.parse(line) } catch { continue }
      if (m.id !== undefined && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id) }
    }
  })
  const call = (method, params) => new Promise((ok, no) => {
    const id = ++n
    const t = setTimeout(() => no(new Error(`${method}: no answer in 30 s`)), 30000)
    waiting.set(id, (m) => { clearTimeout(t); m.error ? no(new Error(`${method}: ${JSON.stringify(m.error)}`)) : ok(m.result) })
    child.stdin.write(JSON.stringify({ id, method, params }) + '\n')
  })
  const notify = (method, params) => child.stdin.write(JSON.stringify({ method, ...(params ? { params } : {}) }) + '\n')
  return { call, notify, close: () => child.kill() }
}

const pct = (w) => (w ? `${w.usedPercent ?? w.used_percent ?? '?'}% used, resets ${w.resetsAt ? new Date(Number(w.resetsAt) * 1000).toLocaleString() : '?'}` : '-')

const [cmd = 'status', ...rest] = process.argv.slice(2)
const c = rpc()
try {
  await c.call('initialize', { clientInfo: { name: 'brandklout-codex-limits', title: null, version: '1.0.0' }, capabilities: null })
  c.notify('initialized')
  const r = await c.call('account/rateLimits/read', {})
  const snaps = Object.entries(r.rateLimitsByLimitId || { default: r.rateLimits })
  const reached = snaps.some(([, s]) => s?.rateLimitReachedType) || r.ordinaryUsageAllowed === false
  console.log(`usage allowed: ${r.ordinaryUsageAllowed} · limit reached: ${reached} · reset credits: ${r.rateLimitResetCredits?.availableCount ?? '?'}`)
  for (const [id, s] of snaps) console.log(`  ${id}${s?.planType ? ` (${s.planType})` : ''}: 5h ${pct(s?.primary)} · weekly ${pct(s?.secondary)}${s?.rateLimitReachedType ? ` · REACHED ${s.rateLimitReachedType}` : ''}`)
  if (cmd === 'reset') {
    if (!reached && !rest.includes('--force')) { console.log('no limit reached: not spending a reset (use --force to spend one anyway)'); process.exitCode = 3 }
    else {
      const out = await c.call('account/rateLimitResetCredit/consume', { idempotencyKey: randomUUID() })
      console.log(`reset: ${out.outcome}`)
      process.exitCode = out.outcome === 'reset' ? 0 : 4
    }
  }
} catch (e) {
  console.log('ERROR ' + e.message)
  process.exitCode = 1
} finally {
  c.close()
}
