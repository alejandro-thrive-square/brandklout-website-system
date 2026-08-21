#!/usr/bin/env node
/**
 * session-rotate.mjs — closes the current Claude session in its Orca terminal and
 * launches a fresh one in the same worktree. Spawned detached by session-guard.mjs,
 * because its first act closes the session that spawned it.
 *
 * The new session picks up the handoff on its own: session-resume.mjs injects
 * .claude/RUNBOOK.md at SessionStart.
 *
 * Every failure path is a no-op. If Orca is unavailable, or the terminal cannot be
 * identified, the session simply continues - the runbook is already written, so the
 * worst case is a manual restart, never lost work.
 *
 * ## What went wrong on 2026-08-21, and what guards it now
 *
 * Two rotations ran against the same terminal at once (the guard re-fired on every
 * subsequent Stop), and each one typed three payloads BLIND on a fixed sleep. When
 * the first rotation had already replaced the session, the second one's `/exit`,
 * `claude ...` launch line and kickoff prompt all landed as TEXT in the new
 * session's prompt box. The new session's opening message was literally
 * `/exit/exit` followed by the kickoff prompt three times.
 *
 * So, three rules here now:
 *
 *   1. **One rotation at a time.** An exclusive lock file, taken with `wx`, is the
 *      only licence to drive the terminal. A second spawn exits without touching it.
 *   2. **Never type into a live TUI.** After `/exit` the terminal is READ back until
 *      Claude's status line is gone. If it never goes, this aborts rather than
 *      dumping a shell command into a prompt box. A manual restart is a far cheaper
 *      failure than a corrupted session.
 *   3. **No kickoff prompt by default.** `session-resume.mjs` already injects the
 *      runbook at SessionStart, so the "belt-and-braces" prompt was pure duplication
 *      - and it was the most visible symptom of the bug above. Set
 *      `WEBZITE_ROTATE_KICKOFF=1` to restore it (only useful where project hooks
 *      have not been approved).
 */

import { execFileSync } from 'node:child_process';
import { openSync, closeSync, existsSync, statSync, unlinkSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const cwd = process.argv[2];
if (!cwd) process.exit(0);

const orca = (args) => {
  try {
    return JSON.parse(execFileSync('orca', [...args, '--json'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 60_000,
    }));
  } catch {
    return null;
  }
};

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const norm = (p) => String(p || '').replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();

// ── The lock ────────────────────────────────────────────────────────────────
//
// `wx` fails if the file exists, which makes "create it" and "check for it" one
// atomic step - two rotations spawned in the same millisecond cannot both win.
// A lock older than the whole rotation budget is treated as abandoned (a crashed
// rotation must not wedge the worktree forever).
const LOCK = join(cwd, '.claude', 'rotate.lock');
const LOCK_STALE_MS = 5 * 60 * 1000;
let held = false;

function acquire() {
  try {
    mkdirSync(join(cwd, '.claude'), { recursive: true });
    if (existsSync(LOCK) && Date.now() - statSync(LOCK).mtimeMs > LOCK_STALE_MS) unlinkSync(LOCK);
  } catch { /* fall through to the open, which is the real test */ }
  try {
    closeSync(openSync(LOCK, 'wx'));
    held = true;
    return true;
  } catch {
    return false;
  }
}

function release() {
  if (!held) return;
  try { unlinkSync(LOCK); } catch { /* nothing left to do */ }
  held = false;
}

const bail = (code = 0) => { release(); process.exit(code); };
process.on('exit', release);

if (!acquire()) process.exit(0);

// ── The terminal ────────────────────────────────────────────────────────────
const list = orca(['terminal', 'list']);
const terminals = list?.result?.terminals ?? [];
const target = terminals.find((t) => norm(t.worktreePath) === norm(cwd) && t.connected && t.writable);
if (!target) bail();

const send = (text, enter = true) =>
  orca(['terminal', 'send', '--terminal', target.handle, '--text', text, ...(enter ? ['--enter'] : [])]);

const tail = () => {
  const r = orca(['terminal', 'read', '--terminal', target.handle, '--limit', '24']);
  return (r?.result?.terminal?.tail ?? []).join('\n');
};

/**
 * Is a Claude TUI still drawing in this terminal?
 *
 * The persistent status footer is the usual tell, but it is NOT sufficient on its
 * own. Reading the six live terminals on this machine turned up one sitting on the
 * `--resume` picker:
 *
 *     ❯ 1. Resume from summary (recommended)
 *       2. Resume full session as-is
 *     Enter to confirm · Esc to cancel
 *
 * A modal replaces the footer, so a footer-only test calls that terminal "a shell"
 * and the launch line goes into the dialog. Every modal affordance is matched too.
 */
const tuiPresent = (text) =>
  /shift\+tab to cycle|bypass permissions on|esc to interrupt|Esc to cancel|Enter to confirm|⏵⏵|✳|✻/.test(text);

/**
 * Does this look like a shell prompt we recognise?
 *
 * Required IN ADDITION to the TUI being gone, because the two questions are not
 * complements: a terminal mid-repaint, or showing a TUI state nothing here matches,
 * answers "no" to both. Demanding a positive shell match makes the unknown case
 * abort instead of type, and aborting only ever costs a manual restart.
 */
const shellPrompt = (text) =>
  /(^|\n)[^\n]*MINGW\d+[^\n]*(\n|$)|(^|\n)PS [A-Za-z]:\\[^\n]*>|(^|\n)[A-Za-z]:\\[^\n]*>\s*$|(^|\n)\$\s*$/.test(text);

// ── Close the old session ───────────────────────────────────────────────────
//
// `/exit` leaves the shell running in the same worktree, which is what lets the
// relaunch below land in the right place.
send('/exit');

let closed = false;
for (let waited = 0; waited < 30_000; waited += 1500) {
  sleep(1500);
  const t = tail();
  if (!tuiPresent(t) && shellPrompt(t)) { closed = true; break; }
}

// Rule 2. We could not positively identify a shell: `/exit` was swallowed, a turn
// is still running, or a modal is up. Typing the launch line now would put it in a
// prompt box, so stop here and leave the session for a human to restart.
if (!closed) bail();

sleep(1500); // let the shell finish repainting its prompt

// ── Launch the replacement ──────────────────────────────────────────────────
/**
 * Which profile wrapper to relaunch with. Client work runs on `team` and orchestration
 * on `personal`; relaunching on the wrong one would silently change which account -
 * and which MCP OAuth grants - the new session has. See mcp-servers/MCP_INDEX.md.
 */
function profileArg() {
  const dir = norm(process.env.CLAUDE_CONFIG_DIR);
  if (dir.endsWith('.claude-team')) return 'team';
  if (dir.endsWith('.claude-personal')) return 'personal';
  return '';
}

const cmd = ['claude', profileArg(), '--permission-mode bypassPermissions'].filter(Boolean).join(' ');
send(cmd);

orca(['terminal', 'wait', '--terminal', target.handle, '--for', 'tui-idle', '--timeout-ms', '180000']);

// Rule 3. Off by default; session-resume.mjs already delivers the runbook.
if (process.env.WEBZITE_ROTATE_KICKOFF === '1') {
  if (tuiPresent(tail())) {
    send(
      'You are a rotated session. Read .claude/RUNBOOK.md at the worktree root and continue from its ' +
      '"Next" section. Do not re-derive what the runbook already establishes. Keep it updated after each ' +
      'task you complete.'
    );
  }
}

bail();
