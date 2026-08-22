#!/usr/bin/env node
/**
 * session-rotation.test.mjs — regression tests for SYSTEM_RULES.md §5.
 *
 *     node scripts/session-rotation.test.mjs
 *
 * Offline and side-effect free: every case runs against a throwaway git repo under
 * the OS temp dir. That also keeps it safe to run on a live machine — session-guard
 * really does spawn session-rotate, but no Orca terminal will ever match a temp
 * path, so the spawn is a guaranteed no-op.
 *
 * Each case here is a bug that actually shipped on 2026-08-21. See the header
 * comments in session-guard.mjs and session-rotate.mjs for the full story.
 */

import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
let failures = 0

const check = (label, ok, detail = '') => {
  if (!ok) failures++
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${ok || !detail ? '' : `\n        ${detail}`}`)
}

// ── fixtures ────────────────────────────────────────────────────────────────
//
// Captured verbatim from live Orca terminals on 2026-08-21 with
// `orca terminal read --limit 24 --json`. The modal is the important one: it is
// a Claude session sitting on the `--resume` picker, and it carries NONE of the
// status-footer text a naive detector looks for.
const IDLE_TUI = [
  '● Ready',
  '───────────────────────────────────────────────',
  '❯',
  '───────────────────────────────────────────────',
  '  ⏵⏵ bypass permissions on (shift+tab to cycle) · gh auth login for PR status · ← 3 agents',
].join('\n')

const RESUME_MODAL = [
  '  ❯ 1. Resume from summary (recommended)',
  '    2. Resume full session as-is',
  "    3. Don't ask me again",
  '  Enter to confirm · Esc to cancel',
].join('\n')

const GITBASH = '\nACER@DESKTOP-K7A2LM MINGW64 /c/Users/ACER/orca/workspaces/wt (bk-dr-nahlah)\n$ '
const POWERSHELL = '\nPS C:\\Users\\ACER\\orca\\workspaces\\wt> '
const CMDEXE = '\nC:\\Users\\ACER>'

// ── 1. the terminal predicates ──────────────────────────────────────────────
//
// Lifted out of the source text so the test cannot drift from what ships.
{
  const src = readFileSync(join(HERE, 'session-rotate.mjs'), 'utf8')
  const lift = (name) => {
    const m = src.match(new RegExp(`const ${name} = \\([^)]*\\) =>\\s*([\\s\\S]*?);\\n`))
    if (!m) throw new Error(`could not lift ${name} from session-rotate.mjs`)
    return new Function('text', `return ${m[1].trim()}`)
  }
  const tui = lift('tuiPresent')
  const shell = lift('shellPrompt')
  const mayType = (t) => !tui(t) && shell(t)

  check('a live idle TUI is never typed into', !mayType(IDLE_TUI))
  check('a Claude MODAL is never typed into', !mayType(RESUME_MODAL),
    'a footer-only detector reads the resume picker as a shell and types the launch line into the dialog')
  check('a blank / mid-repaint screen is never typed into', !mayType('\n\n\n'))
  check('an unrecognised TUI is never typed into', !mayType('some app\n──────\n'))
  check('Git Bash is recognised as a shell', mayType(GITBASH))
  check('PowerShell is recognised as a shell', mayType(POWERSHELL))
  check('cmd.exe is recognised as a shell', mayType(CMDEXE))
}

// ── a throwaway worktree ────────────────────────────────────────────────────
const root = mkdtempSync(join(tmpdir(), 'wz-rotation-'))
const wt = join(root, 'wt')
mkdirSync(join(wt, '.claude'), { recursive: true })
const git = (...a) => execFileSync('git', a, { cwd: wt, stdio: 'ignore' })
git('init', '-q', '.')
git('config', 'user.email', 'test@example.com')
git('config', 'user.name', 'test')
writeFileSync(join(wt, 'a.txt'), 'hi\n')
git('add', 'a.txt')
git('commit', '-qm', 'init')

// A transcript whose last assistant turn is past the 200k handoff threshold.
const transcript = join(wt, 't.jsonl')
writeFileSync(transcript, JSON.stringify({
  type: 'assistant',
  message: { usage: { input_tokens: 1000, cache_read_input_tokens: 233_000, output_tokens: 154 } },
}) + '\n')

const payload = (sessionId, cwd = wt) => JSON.stringify({
  cwd, transcript_path: transcript, session_id: sessionId,
})

const runHook = (script, sessionId, cwd = wt) =>
  execFileSync(process.execPath, [join(HERE, script)], {
    input: payload(sessionId, cwd), encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'],
  })

try {
  // ── 2. the rotation loop ──────────────────────────────────────────────────
  //
  // The guard used to suppress a repeat rotation only when the session was BELOW
  // the warn threshold — which a session that just rotated never is. So it rotated
  // again on every subsequent Stop, each pass spawning another session-rotate that
  // raced the first for the terminal.
  writeFileSync(join(wt, '.claude', 'RUNBOOK.md'), '# Runbook\n\n## Alpha\nlive state\n')

  const first = runHook('session-guard.mjs', 'SESS-A')
  check('a session at 234k rotates once', /Session rotating/.test(first), first.slice(0, 120))

  const repeats = [runHook('session-guard.mjs', 'SESS-A'), runHook('session-guard.mjs', 'SESS-A')]
  check('the SAME session never rotates twice', repeats.every((r) => r.trim() === ''),
    `got: ${JSON.stringify(repeats)}`)

  const other = runHook('session-guard.mjs', 'SESS-B')
  check('a DIFFERENT session is still governed', /Session rotating/.test(other), other.slice(0, 120))

  const state = JSON.parse(readFileSync(join(wt, '.claude', 'session-state.json'), 'utf8'))
  check('the handoff records which session it was', state.rotatedSessionId === 'SESS-B',
    JSON.stringify(state))

  // ── 3. the runbook injection cap ──────────────────────────────────────────
  //
  // Runbooks grow. This one reached 177 KB, which is ~45k tokens injected into
  // every session start — a quarter of the budget the rule exists to protect.
  const big = '# Runbook\n\n' + Array.from({ length: 400 }, (_, i) =>
    `## Section ${String(i).padStart(3, '0')}\n${'filler prose. '.repeat(30)}\n`).join('\n')
  writeFileSync(join(wt, '.claude', 'RUNBOOK.md'), big)

  const injected = JSON.parse(runHook('session-resume.mjs', 'SESS-B'))
    .hookSpecificOutput.additionalContext

  check('an oversized runbook is capped', injected.length < big.length / 2,
    `${big.length} chars in, ${injected.length} out`)
  check('the cap says what it dropped', /TRUNCATED: [\d,]+ more characters/.test(injected))
  check('the NEWEST sections are the ones kept', injected.includes('## Section 000'))
  check('the oldest sections are dropped', !injected.includes('## Section 399'))
  check('no section is cut in half',
    !/\n## [^\n]*$/.test(injected.split('<!-- TRUNCATED')[0].trimEnd()))

  // -- 4. the runbook is found from ANY directory -----------------------------
  //
  // Hooks are handed whatever directory the shell was last left in. Three times,
  // a session whose last command ran in a deep `.tmp/` folder made the guard look
  // THERE, find no runbook, announce "No runbook existed. I have written it from
  // the template", and drop a fresh stub in that folder -- while the real runbook
  // sat untouched at the worktree root. session-rotate matches an Orca terminal on
  // that same path, so it missed the terminal too and typed blind.
  const deep = join(wt, 'deliver', 'client', 'workflows', '08-qa', '.tmp')
  mkdirSync(deep, { recursive: true })
  const live = '# Runbook\n\n## Alpha\nthe real live state, at the root\n'
  writeFileSync(join(wt, '.claude', 'RUNBOOK.md'), live)

  const fromDeep = runHook('session-guard.mjs', 'SESS-DEEP', deep)
  check('a hook fired from a subdirectory still rotates', /Session rotating/.test(fromDeep),
    fromDeep.slice(0, 160))
  check('it writes no stray runbook beside the shell',
    !existsSync(join(deep, '.claude', 'RUNBOOK.md')))

  const rootBook = readFileSync(join(wt, '.claude', 'RUNBOOK.md'), 'utf8')
  check('it refreshes the runbook at the ROOT, narrative intact',
    rootBook.includes('the real live state, at the root') && rootBook.includes('AUTO:BEGIN'))
  check('the auto block names the worktree root, not the shell directory',
    /- \*\*Worktree\*\*: `[^`]+`/.test(rootBook) && !rootBook.includes('08-qa'))
  check('the state file stays at the root too',
    JSON.parse(readFileSync(join(wt, '.claude', 'session-state.json'), 'utf8'))
      .rotatedSessionId === 'SESS-DEEP' && !existsSync(join(deep, '.claude', 'session-state.json')))

  const deepInjected = JSON.parse(runHook('session-resume.mjs', 'SESS-DEEP2', deep))
    .hookSpecificOutput.additionalContext
  check('SessionStart from a subdirectory injects the ROOT runbook',
    deepInjected.includes('the real live state, at the root'))

  const small = '# Runbook\n\n## Alpha\nshort enough to pass through untouched\n'
  writeFileSync(join(wt, '.claude', 'RUNBOOK.md'), small)
  const wholeInjected = JSON.parse(runHook('session-resume.mjs', 'SESS-B'))
    .hookSpecificOutput.additionalContext
  check('a small runbook is passed through whole',
    wholeInjected.includes(small.trim()) && !wholeInjected.includes('TRUNCATED'))
} finally {
  rmSync(root, { recursive: true, force: true })
}

console.log(failures ? `\n${failures} FAILED` : '\nall passed')
process.exit(failures ? 1 : 0)
