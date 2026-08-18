#!/usr/bin/env node
/**
 * check-html.mjs — assert a markup fragment is well nested before it is sent.
 *
 * The builder does not report a nesting mistake; it just produces a tree that
 * is subtly wrong (a section adopted by its neighbour, a grid ending up one
 * level too deep). Cheaper to catch here.
 *
 *   node check-html.mjs <file.html>
 */
import fs from 'node:fs';

const VOID = new Set(['img', 'br', 'hr', 'input', 'meta', 'link', 'source', 'area', 'base', 'col', 'embed', 'param', 'track', 'wbr']);
const file = process.argv[2];
const html = fs.readFileSync(file, 'utf8');

const stack = [];
const problems = [];
let depth = 0, maxDepth = 0;

for (const m of html.matchAll(/<(\/?)([a-zA-Z][\w-]*)\b([^>]*)>/g)) {
  const [, slash, tagRaw, attrs] = m;
  const tag = tagRaw.toLowerCase();
  if (VOID.has(tag) || attrs.trimEnd().endsWith('/')) continue;
  if (!slash) {
    stack.push({ tag, at: m.index });
    depth++; maxDepth = Math.max(maxDepth, depth);
  } else {
    depth--;
    const top = stack.pop();
    if (!top) problems.push(`</${tag}> at ${m.index} closes nothing`);
    else if (top.tag !== tag) problems.push(`</${tag}> at ${m.index} closes <${top.tag}> opened at ${top.at}`);
  }
}
for (const s of stack) problems.push(`<${s.tag}> at ${s.at} is never closed`);

const counts = {};
for (const m of html.matchAll(/<([a-zA-Z][\w-]*)\b/g)) {
  const t = m[1].toLowerCase();
  counts[t] = (counts[t] || 0) + 1;
}

console.log(`${file}: ${html.length} bytes, max nesting depth ${maxDepth}`);
console.log('tags: ' + Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t}:${n}`).join('  '));

// A div inside a <p> or a <span> is invalid and the parser silently reparents it —
// the trap that split a paragraph and orphaned its text in the previous build.
for (const m of html.matchAll(/<(p|span|sup|sub|strong|em|b|i|label)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
  if (/<(div|section|article|main|details|h[1-6])\b/.test(m[2])) {
    problems.push(`block-level element inside <${m[1]}> at ${m.index} — the HTML parser will move it and orphan the text`);
  }
}

if (problems.length) { console.log('\n' + problems.length + ' problem(s):'); for (const p of problems) console.log('  ' + p); process.exit(1); }
console.log('\nwell nested.');
