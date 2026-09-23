#!/usr/bin/env node
/**
 * rebuild-all.mjs — re-push the markup of every v2 page from its local source.
 *
 * Use after a copy or template change. Markup only; the class layer is
 * untouched. Prints one line per page and never stops on a single failure, so
 * one rate-limited page does not abandon the other seventeen.
 *
 *   node rebuild-all.mjs [pageKey …]      keys are like `implants`, `aox.consult`
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const V2 = path.resolve(HERE, '../../../04-design/.tmp/v2');
const map = JSON.parse(fs.readFileSync(path.join(HERE, 'v2-pages.json'), 'utf8'));

/** page key -> local source directory */
const dirFor = (key) => {
  const [topic, kind] = key.split('.');
  return kind ? `${topic}-${kind}` : topic;
};

const keys = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(map);
const failed = [];

for (const key of keys) {
  const id = map[key];
  const body = path.join(V2, dirFor(key), 'body.html');
  if (!id) { console.log(`SKIP ${key}: no page id`); failed.push(key); continue; }
  if (!fs.existsSync(body)) { console.log(`SKIP ${key}: no ${body}`); failed.push(key); continue; }

  try {
    const out = execFileSync(process.execPath, [path.join(HERE, 'build-page.mjs'), id, body, '--clear'],
      { encoding: 'utf8', maxBuffer: 1 << 26 });
    const cls = (out.match(/(\d+)\/(\d+) distinct classes applied/) || []);
    const imgs = (out.match(/(\d+) image\(s\) linked/) || [])[1] || '0';
    const bad = /CLASSES DROPPED|APPLIED FEWER/.test(out);
    console.log(`${bad ? 'WARN' : 'ok  '} ${key.padEnd(24)} ${cls[1] || '?'}/${cls[2] || '?'} classes, ${imgs} images linked`);
    if (bad) { failed.push(key); console.log(out.split('\n').filter((l) => /DROPPED|FEWER/.test(l)).join('\n')); }
  } catch (e) {
    console.log(`FAIL ${key.padEnd(24)} ${String(e.message).split('\n')[0].slice(0, 90)}`);
    failed.push(key);
  }
}

console.log(`\n${keys.length - failed.length}/${keys.length} rebuilt`);
if (failed.length) { console.log('re-run: node rebuild-all.mjs ' + failed.join(' ')); process.exit(1); }
