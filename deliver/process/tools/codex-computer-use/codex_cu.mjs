#!/usr/bin/env node
// Codex computer use, driven from Claude Code (or any shell).
//
//   node codex_cu.mjs "<plain instruction with its stopping point>" [--allow-writes] [--out <dir>] [--timeout <min>]
//
// Runs one non-interactive Codex session that has the Codex desktop app's computer-use plugin
// (screen + Chrome on this Windows workstation) and prints its final report. Read-only unless
// --allow-writes. See README.md.

import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  if (i === -1) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const allowWrites = args.includes('--allow-writes');
if (allowWrites) args.splice(args.indexOf('--allow-writes'), 1);
const timeoutMin = Number(flag('--timeout') ?? 20);
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const outDir = flag('--out') ?? join(tmpdir(), 'codex-cu', stamp);
const instruction = args.join(' ').trim();
if (!instruction) {
  console.error('usage: node codex_cu.mjs "<instruction>" [--allow-writes] [--out <dir>] [--timeout <min>]');
  process.exit(2);
}

// The npm `codex` lags the desktop app and rejects the app's default model, so use the app's own
// CLI: config.toml names it (CODEX_CLI_PATH), else take the newest under the app's bin folder.
function findCodex() {
  const cfg = join(homedir(), '.codex', 'config.toml');
  if (existsSync(cfg)) {
    const m = readFileSync(cfg, 'utf8').match(/CODEX_CLI_PATH\s*=\s*'([^']+)'/);
    if (m && existsSync(m[1])) return m[1];
  }
  const bin = join(process.env.LOCALAPPDATA ?? '', 'OpenAI', 'Codex', 'bin');
  if (existsSync(bin)) {
    const found = readdirSync(bin)
      .map((d) => join(bin, d, 'codex.exe'))
      .filter(existsSync)
      .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
    if (found[0]) return found[0];
  }
  throw new Error('Codex desktop app CLI not found. Install/update the Codex app (codex app).');
}

// Codex can't find the Chrome plugin's skill on its own (it isn't under plugins/cache), and without
// its Bootstrap block `browser` is undefined; it then falls back to sky, which refuses browsers.
const chromeSkill =
  [join(homedir(), '.codex', '.tmp', 'bundled-marketplaces', 'openai-bundled', 'plugins', 'chrome', 'skills', 'control-chrome', 'SKILL.md')]
    .find(existsSync) ?? 'the Chrome plugin\'s control-chrome SKILL.md';

const rules = [
  'You are operating the user\'s real Windows desktop and their own signed-in Google Chrome.',
  'Tooling: websites go through the ChatGPT app\'s Chrome plugin (chrome@openai-bundled, Browser Use with the `chrome` backend) in a background tab of the user\'s Chrome; keep it in the background, do not make the browser visible. Native Windows apps go through its Computer Use plugin (computer-use@openai-bundled, `@oai/sky` in node_repl).',
  `Before any browser work, read ${chromeSkill} and run its Bootstrap block (setupBrowserRuntime from the plugin's scripts/browser-client.mjs); without it \`browser\` is undefined and you cannot see the user's tabs.`,
  'For a tab that is already open in the user\'s Chrome, use the Chrome plugin\'s `browser.user.openTabs()` and `browser.user.claimTab(tab)`; never point `sky` at a browser window (it refuses: no reliable URL).',
  'Do NOT use the Orca `computer-use` skill, `orca computer`, PowerShell UI automation, or your own CDP scripts; they take over the user\'s foreground window. The user keeps working while you run, so never rely on focus.',
  'Rules:',
  '- Reuse before you open: first list the open tabs (`browser.user.openTabs()`) and look at their URLs and titles. If one is already on the site or page the task needs (often a tab an earlier run left there), claim it (`browser.user.claimTab(tab)`) and continue in it. Open a new tab only when no open tab fits, or when every fitting tab is one the user is clearly in the middle of using (an unsaved editor, a half-typed form). Say in the report which tab you used and whether it was reused. Never close a tab or a window.',
  '- Never call `markDeliverable()`. A marked tab stays claimed by your session, and the next run cannot claim it ("already claimed by another browser session"). Unmarked claimed tabs are released and left open, which is what lets the next run continue in them.',
  allowWrites
    ? '- You may make the changes the task asks for, and only those. Anything destructive, paid, or sent to other people (delete, regenerate, pay, send, invite, publish) needs the task to name it explicitly; otherwise stop and report. Never select-all, clear, or reset existing content: a permitted delete targets only the named elements, one by one, and if you cannot isolate them, stop and report. Undo your own mistakes with targeted edits or undo, never by wiping.'
    : '- READ-ONLY: do not create, save, submit, publish, delete, regenerate, send or change anything. Navigating, opening menus, scrolling and reading are fine. If the task needs a change, stop and report what you would change.',
  '- Canvas and design apps (whiteboards, diagram tools, design files): if the page exposes a scripting API (for example `window.figma` in FigJam/Figma once the file has rendered), use it through page evaluation to read and create objects, and use mouse and keyboard only for what it cannot do. Prefer creating new objects to duplicating; never duplicate, move or rename existing objects unless the task names them. Re-read the canvas before every write so nothing is created twice.',
  '- If you hit a login, 2FA, captcha or a permission prompt, stop and report it; do not enter credentials.',
  '- Never print secrets (API keys, tokens, passwords) in full in your report; show the first 6 characters only unless the task says otherwise.',
  '- Before you finish, check your result on the page itself and include that in the report; a later session cannot reopen a tab you keep open. The check must come from data you read off the page (DOM, accessibility tree, app state) or a screenshot you look at. Never write the expected values out yourself and call that verification; if you cannot read the result, say it is unverified.',
  '- Finish with a short report: what you did, what you found (exact names/values/URLs), and anything that blocked you.',
  '',
  'Task:',
  instruction,
].join('\n');

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'prompt.txt'), rules);
const lastMsg = join(outDir, 'report.md');
const codex = findCodex();
const res = spawnSync(
  codex,
  // --json: the plain log hides the node_repl code, so only the event stream shows browser./sky. calls.
  ['exec', '--json', '--skip-git-repo-check', '--ephemeral', '-s', 'danger-full-access', '-C', outDir, '-o', lastMsg, '-'],
  { input: rules, encoding: 'utf8', timeout: timeoutMin * 60_000, maxBuffer: 64 * 1024 * 1024, windowsHide: true },
);
writeFileSync(join(outDir, 'session.log'), `${res.stdout ?? ''}\n${res.stderr ?? ''}`);

if (res.error) console.error(`codex failed: ${res.error.message}`);
const report = existsSync(lastMsg) ? readFileSync(lastMsg, 'utf8').trim() : '';
console.log(report || '(no report; see session.log)');
console.log(`\n[codex-cu] exit ${res.status ?? 'timeout'} · log ${join(outDir, 'session.log')}`);
process.exit(res.status ?? 1);
