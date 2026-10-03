// Runs a command with INSTATIC_EMAIL and INSTATIC_SETUP_PASSWORD taken from the master env file
// (the shared default admin password, referenced as ${INSTATIC_PASSWORD_MASON_PARK}). Never prints a value.
// Usage: node with-setup-env.mjs [KEY=VALUE ...] -- <command> [args...]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const text = fs.readFileSync(path.join(os.homedir(), '.webzite', '.env'), 'utf8');
const sections = {};
let sec = '';
for (const line of text.split(/\r?\n/)) {
  const m = line.match(/^\[(.+)\]\s*$/);
  if (m) { sec = m[1]; sections[sec] = sections[sec] || {}; continue; }
  if (!line.trim() || line.trim().startsWith('#') || !line.includes('=')) continue;
  const i = line.indexOf('=');
  (sections[sec] = sections[sec] || {})[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}
const email = sections.shared.INSTATIC_EMAIL;
const password = sections.vars.INSTATIC_PASSWORD_MASON_PARK;
if (!email || !password) { console.error('INSTATIC_EMAIL or the default password is missing from the master file'); process.exit(2); }
const sep = process.argv.indexOf('--');
const extra = Object.fromEntries(process.argv.slice(2, sep).map((kv) => [kv.slice(0, kv.indexOf('=')), kv.slice(kv.indexOf('=') + 1)]));
const [cmd, ...args] = process.argv.slice(sep + 1);
const r = spawnSync(cmd, args, { stdio: 'inherit', env: { ...process.env, INSTATIC_EMAIL: email, INSTATIC_SETUP_PASSWORD: password, INSTATIC_PASSWORD: password, ...extra } });
process.exit(r.status ?? 1);
