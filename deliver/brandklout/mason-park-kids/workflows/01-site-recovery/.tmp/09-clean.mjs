// 09-clean: builds recovered/mirror-clean from recovered/mirror (2026-09-15).
// Strips the inline ClearFake/EtherHiding loader from every page and adds a real 404.html.
// Run after verify-safe.mjs FAILS on mirror/; then 10-localize-images.mjs, then restore the
// Elementor 4.2.3 lazy chunks from downloads.wordpress.org/plugin/elementor.4.2.3.zip, then
// node verify-safe.mjs mirror-clean. Absolute paths are this workstation's.
import fs from 'fs'; import path from 'path';
const base = 'C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-mason-park-kids/deliver/brandklout/mason-park-kids/workflows/01-site-recovery/.tmp/recovered';
const src = base + '/mirror', dst = base + '/mirror-clean';
fs.rmSync(dst, { recursive: true, force: true });
fs.cpSync(src, dst, { recursive: true });
const html = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (p.endsWith('.html')) html.push(p); } })(dst);
let removed = 0; const perFile = {};
for (const f of html) {
  let h = fs.readFileSync(f, 'utf8'); let i = 0; let out = ''; let n = 0;
  while (true) {
    const s = h.indexOf('<script', i);
    if (s === -1) { out += h.slice(i); break; }
    const gt = h.indexOf('>', s); const e = h.indexOf('</script>', gt);
    const open = h.slice(s, gt + 1); const body = h.slice(gt + 1, e);
    const bad = !open.includes('src=') && body.includes('atob(') && body.includes('fromCharCode') && body.includes('new Function');
    out += h.slice(i, s) + (bad ? '' : h.slice(s, e + 9));
    if (bad) n++;
    i = e + 9;
  }
  if (n) { fs.writeFileSync(f, out); removed += n; perFile[path.relative(dst, f)] = n; }
}
fs.writeFileSync(path.join(dst, '404.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Page not found | Mason Park Dental for Kids</title><style>body{font-family:system-ui,sans-serif;margin:0;display:grid;place-items:center;min-height:100vh;background:#f7f7f5;color:#222;text-align:center;padding:24px}a{color:#1b6ea8}</style></head><body><main><h1>Page not found</h1><p>This page is not available right now.</p><p><a href="/">Go to the home page</a> or call <a href="tel:+12815787100">(281) 578-7100</a>.</p></main></body></html>');
let left = 0;
for (const f of html) { const h = fs.readFileSync(f, 'utf8'); if (h.includes('_2e7be') || (h.includes('fromCharCode') && h.includes('new Function(') && h.includes('atob('))) left++; }
fs.writeFileSync('clean.out.txt', 'html files ' + html.length + ' | blocks removed ' + removed + ' | files touched ' + Object.keys(perFile).length + ' | files still matching ' + left);
