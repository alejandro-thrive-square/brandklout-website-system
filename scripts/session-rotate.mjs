#!/usr/bin/env node
/**
 * session-rotate.mjs — closes the current Claude session in its Orca terminal and
 * launches a fresh one in the same worktree. Spawned detached by session-guard.mjs,
 * because its first act closes the session that spawned it.
 *
 * The new session picks up the handoff on its own: session-resume.mjs injects
 * .claude/RUNBOOK.md at SessionStart. The kickoff prompt sent here is belt-and-braces
 * for the case where project hooks have not been approved yet.
 *
 * Every failure path is a no-op. If Orca is unavailable, or the terminal cannot be
 * identified, the session simply continues - the runbook is already written, so the
 * worst case is a manual restart, never lost work.
 */

import { execFileSync } from 'node:child_process';

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

const list = orca(['terminal', 'list']);
const terminals = list?.result?.terminals ?? [];
const target = terminals.find((t) => norm(t.worktreePath) === norm(cwd) && t.connected && t.writable);
if (!target) process.exit(0);

const send = (text, enter = true) =>
  orca(['terminal', 'send', '--terminal', target.handle, '--text', text, ...(enter ? ['--enter'] : [])]);

// Close the current session. /exit leaves the shell running in the same worktree.
send('/exit');
sleep(9000);

const cmd = ['claude', profileArg(), '--permission-mode bypassPermissions'].filter(Boolean).join(' ');
send(cmd);

orca(['terminal', 'wait', '--terminal', target.handle, '--for', 'tui-idle', '--timeout-ms', '180000']);

send(
  'You are a rotated session. Read .claude/RUNBOOK.md at the worktree root and continue from its ' +
  '"Next" section. Do not re-derive what the runbook already establishes. Keep it updated after each ' +
  'task you complete.'
);
