#!/usr/bin/env node
/**
 * sync-runtime-states.mjs — give `src/styles/runtime-states.css` a local owner.
 *
 * WHY
 * ---
 * Instatic serves three stylesheets: runtime-states.css, site.css and the
 * registry. Two of them are generated from the local build and gated there.
 * runtime-states.css was the odd one out: hand-authored ON the platform, with
 * no local copy anyone diffed. That is how
 *
 *     .pk-ba input { display: none !important }
 *
 * survived the retirement of the `before-after.js` asset it belonged to and
 * killed every before/after slider on the published site, while `sim-check`
 * (which never loaded this file) reported 28/28 and `verify-all` reported
 * 33/33. A file with no local owner is a file nothing can gate.
 *
 * `src-runtime-states.css` in this folder is now the source of truth.
 *
 *   node sync-runtime-states.mjs --verify   # remote === local?
 *   node sync-runtime-states.mjs --pull     # remote -> local (adopt hand edits)
 *   node sync-runtime-states.mjs --push     # local -> remote
 *
 * --push clears to a sentinel and refills in chunks for the same reason
 * push-site-css.mjs does: a large `oldText` is silently dropped and a large
 * `content` on write is silently truncated, and both report success.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { callJson, callWrite } from './instatic-mcp.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LOCAL = path.join(HERE, 'src-runtime-states.css');
const PATH = 'src/styles/runtime-states.css';
const SENTINEL = '/*__wz_rs_end__*/';
const CHUNK = 8000;
const argv = process.argv.slice(2);

/** Read every page of the asset; site_read_code_asset paginates at 12000 chars. */
async function readAll() {
  let out = '', part = 1, hash = null;
  for (;;) {
    const r = await callJson('site_read_code_asset', { path: PATH, part });
    out += r.content ?? '';
    hash = r.hash ?? hash;
    const next = r.pageInfo?.nextPart;
    if (!next) return { content: out, hash };
    part = next;
  }
}

const norm = (s) => s.replace(SENTINEL, '').replace(/\r\n/g, '\n').trim();

if (argv.includes('--pull')) {
  const { content } = await readAll();
  fs.writeFileSync(LOCAL, content);
  console.log(`pulled ${content.length} chars into ${path.basename(LOCAL)}`);
  process.exit(0);
}

const local = fs.readFileSync(LOCAL, 'utf8');
const { content: remote, hash: remoteHash } = await readAll();
console.log(`local ${local.length} chars | remote ${remote.length} chars`);

if (norm(remote) === norm(local)) {
  console.log('IN SYNC');
  if (!argv.includes('--push')) process.exit(0);
  console.log('nothing to push');
  process.exit(0);
}

if (!argv.includes('--push')) {
  console.log('OUT OF SYNC — run with --push (local wins) or --pull (remote wins)');
  // Show the first divergence so the difference is actionable, not just a count.
  const a = norm(remote), b = norm(local);
  let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
  console.log('first divergence at char', i);
  console.log('  remote:', JSON.stringify(a.slice(i, i + 160)));
  console.log('  local :', JSON.stringify(b.slice(i, i + 160)));
  process.exit(1);
}

// ---- push: clear to sentinel, verified, then refill ------------------------
let hash = remoteHash;
async function resetToSentinel() {
  for (let attempt = 0; attempt < 400; attempt++) {
    const { content, hash: h } = await readAll();
    if (content === SENTINEL + '\n') return h;
    const slice = content.replace(SENTINEL + '\n', '').slice(0, 4000);
    if (!slice) {
      await callWrite('site_patch_code_asset', {
        path: PATH, expectedHash: h, replacements: [{ oldText: content, newText: SENTINEL + '\n' }],
      });
      continue;
    }
    await callWrite('site_patch_code_asset', {
      path: PATH, expectedHash: h, replacements: [{ oldText: slice, newText: '', replaceAll: true }],
    });
    if (attempt % 5 === 0) console.log(`  clearing... ${content.length} chars left`);
  }
  throw new Error('could not clear back to the sentinel — inspect by hand, do NOT fill');
}

// Seed the sentinel once so the clear loop has something to converge on.
if (!remote.includes(SENTINEL)) {
  await callWrite('site_patch_code_asset', {
    path: PATH, expectedHash: hash,
    replacements: [{ oldText: remote.slice(-200), newText: remote.slice(-200) + '\n' + SENTINEL + '\n' }],
  });
}
hash = await resetToSentinel();
console.log('reset to sentinel, verified');

const chunks = [];
for (let i = 0; i < local.length; i += CHUNK) chunks.push(local.slice(i, i + CHUNK));
for (let i = 0; i < chunks.length; i++) {
  await callWrite('site_patch_code_asset', {
    path: PATH, expectedHash: hash,
    replacements: [{ oldText: SENTINEL, newText: chunks[i] + SENTINEL }],
  });
  const r = await callJson('site_read_code_asset', { path: PATH, part: 1 });
  hash = r.hash;
  console.log(`  chunk ${i + 1}/${chunks.length} -> ${r.pageInfo?.totalChars} chars on the server`);
}

// Strip the sentinel so the served file is exactly the local file.
{
  const { content, hash: h } = await readAll();
  if (content.includes(SENTINEL)) {
    await callWrite('site_patch_code_asset', {
      path: PATH, expectedHash: h, replacements: [{ oldText: SENTINEL, newText: '' }],
    });
  }
}
const { content: final } = await readAll();
console.log(final.trim() === local.trim() ? 'CONTENT MATCHES local' : 'MISMATCH — inspect before publishing');
process.exit(final.trim() === local.trim() ? 0 : 1);
