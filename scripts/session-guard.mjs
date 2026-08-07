#!/usr/bin/env node
/**
 * session-guard.mjs — Stop hook. Enforces SYSTEM_RULES.md §5 "Session Rotation".
 *
 * Runs after every completed turn, which is the only safe moment to hand off: the
 * agent is idle, and nothing is mid-edit.
 *
 * Ladder:
 *   < 150k          silent.
 *   >= 150k         nudge the agent to keep the runbook current, without interrupting.
 *   >= 200k         handoff. If the runbook is missing/stale or the tree is dirty,
 *                   BLOCK the stop so the agent must fix that first. Once clean and
 *                   current, rotate the terminal into a fresh session.
 *
 * Blocking is the whole point. A soft reminder at 200k is ignored exactly when it
 * matters, because the agent is deep in a task and its next action always looks more
 * urgent than writing a handoff. `decision: "block"` makes the handoff the only exit.
 *
 * Never exits non-zero on internal failure: a broken guard must not wedge a session.
 */

import { existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import {
  CONTEXT_LIMIT, CONTEXT_WARN, RUNBOOK_MAX_AGE_MS,
  readHookInput, contextTokens, isDirty, readState, writeState,
  runbookAgeMs, runbookPath, refreshRunbook, TEMPLATE,
} from './session-lib.mjs';

const emit = (o) => { process.stdout.write(JSON.stringify(o)); process.exit(0); };
const quiet = () => process.exit(0);

try {
  const input = readHookInput();
  const cwd = input.cwd || process.cwd();
  const tokens = contextTokens(input.transcript_path);
  if (!tokens) quiet();

  const state = readState(cwd);

  // A rotation just happened and this is the new session's first turn. Do not
  // immediately re-evaluate against the old session's numbers.
  if (state.rotatedAt && Date.now() - state.rotatedAt < 5 * 60 * 1000 && tokens < CONTEXT_WARN) quiet();

  if (tokens < CONTEXT_WARN) quiet();

  const rbPath = runbookPath(cwd);
  const hasRunbook = existsSync(rbPath);
  const stale = runbookAgeMs(cwd) > RUNBOOK_MAX_AGE_MS;
  const pct = Math.round((tokens / CONTEXT_LIMIT) * 100);

  // ---- Warn band -------------------------------------------------------------
  if (tokens < CONTEXT_LIMIT) {
    if (state.warnedAt && Date.now() - state.warnedAt < 20 * 60 * 1000) quiet();
    writeState(cwd, { warnedAt: Date.now() });
    if (hasRunbook) refreshRunbook(cwd, tokens);
    emit({
      hookSpecificOutput: {
        hookEventName: 'Stop',
        additionalContext:
          `[session-guard] Context is at ~${tokens.toLocaleString('en-US')} tokens (${pct}% of the ` +
          `${CONTEXT_LIMIT.toLocaleString('en-US')} handoff threshold). ` +
          (hasRunbook
            ? 'Keep .claude/RUNBOOK.md current as you finish each task - it is what the next session inherits.'
            : 'No .claude/RUNBOOK.md exists yet. Write one now, while you still have the context to write it well; ' +
              'at the threshold it becomes mandatory and you will be interrupted mid-task to produce it.') +
          ' No action needed beyond that; you are not being asked to stop.',
      },
    });
  }

  // ---- Handoff threshold -----------------------------------------------------
  const dirty = isDirty(cwd);

  if (!hasRunbook || stale || dirty) {
    // Seed the template so the agent fills in prose rather than inventing a format.
    if (!hasRunbook) {
      mkdirSync(dirname(rbPath), { recursive: true });
      writeFileSync(rbPath, TEMPLATE(cwd, tokens), 'utf8');
    } else {
      refreshRunbook(cwd, tokens);
    }

    const reasons = [];
    if (dirty) reasons.push('- **Uncommitted changes exist.** Commit them on this branch. A handoff cannot carry a dirty tree, and the next session will not know what the edits were for.');
    if (!hasRunbook) reasons.push('- **No runbook existed.** I have written `.claude/RUNBOOK.md` from the template - fill in every section.');
    else if (stale) reasons.push('- **The runbook is stale.** Bring `.claude/RUNBOOK.md` up to date with what you have done since it was last written.');

    writeState(cwd, { blockedAt: Date.now(), lastTokens: tokens });

    emit({
      decision: 'block',
      reason:
        `[session-guard] Context has reached ~${tokens.toLocaleString('en-US')} tokens, the handoff threshold ` +
        `(SYSTEM_RULES.md §5). This session is ending and a fresh one will take over.\n\n` +
        `Before you can stop, do exactly this and nothing else - do not start new work:\n\n` +
        reasons.join('\n') + '\n\n' +
        `Write the runbook for a reader with **no memory of this session**. The Gotchas section is the ` +
        `most valuable part: failed approaches, environment quirks and false leads are precisely what a ` +
        `fresh session would otherwise pay to rediscover. Be concrete - paths, commands, SHAs, not summaries.\n\n` +
        `Then stop. Rotation is automatic once the tree is clean and the runbook is current.`,
    });
  }

  // ---- Clean and current: rotate ---------------------------------------------
  refreshRunbook(cwd, tokens);
  writeState(cwd, { rotatedAt: Date.now(), lastTokens: tokens, warnedAt: 0 });

  // Detached, because this process must exit for the turn to complete - and the
  // rotation's first act is to close the very session running this hook.
  const rotate = join(dirname(fileURLToPath(import.meta.url)), 'session-rotate.mjs');
  if (existsSync(rotate)) {
    spawn(process.execPath, [rotate, cwd], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
  }

  emit({
    systemMessage:
      `Session rotating: context reached ~${tokens.toLocaleString('en-US')} tokens. ` +
      `Handoff written to .claude/RUNBOOK.md; a fresh session is starting and will load it automatically.`,
    hookSpecificOutput: {
      hookEventName: 'Stop',
      additionalContext:
        '[session-guard] Handoff complete. This session is being replaced. Do not begin new work.',
    },
  });
} catch {
  // A guard that breaks a session is worse than no guard.
  quiet();
}
