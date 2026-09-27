// 10-localize-images: copies images hotlinked from bestdentistinkatytx.com (plain or JSON-escaped
// URLs) out of the adult site's scrape in bk-mason-park, and rewrites them root-relative (2026-09-15).
import fs from 'fs'; import path from 'path';
const clean = 'C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-mason-park-kids/deliver/brandklout/mason-park-kids/workflows/01-site-recovery/.tmp/recovered/mirror-clean';
const scrape = 'C:/Users/ACER/orca/workspaces/Brandklout Website System/bk-mason-park/deliver/brandklout/mason-park/workflows/01-content-intake/.tmp/site-scrape/assets/bestdentistinkatytx.com';
const BS = String.fromCharCode(92);
const files = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else if (/[.](html|css)$/.test(p)) files.push(p); } })(clean);
const hosts = ['https://bestdentistinkatytx.com', 'https://www.bestdentistinkatytx.com', 'http://bestdentistinkatytx.com', 'http://www.bestdentistinkatytx.com', '//bestdentistinkatytx.com'];
const stop = ['"', "'", ')', ' ', ',', '&', '<'];
const copied = new Set(); const missing = new Set(); let rewrites = 0; const touched = new Set();
for (const f of files) {
  let h = fs.readFileSync(f, 'utf8'); const orig = h;
  for (const esc of [false, true]) {
    for (const host0 of hosts) {
      const host = esc ? host0.split('/').join(BS + '/') : host0;
      const needle = host + (esc ? BS + '/' : '/') + 'wp-content' + (esc ? BS + '/' : '/') + 'uploads';
      let i = 0;
      while ((i = h.indexOf(needle, i)) !== -1) {
        let j = i + needle.length;
        while (j < h.length && !stop.includes(h[j])) j++;
        const tailRaw = h.slice(i + host.length, j);
        const rel = esc ? tailRaw.split(BS + '/').join('/') : tailRaw;
        if (!/[.](png|jpe?g|gif|svg|webp)$/i.test(rel)) { i = j; continue; }
        const srcFile = path.join(scrape, rel);
        if (fs.existsSync(srcFile)) {
          const dst = path.join(clean, rel);
          fs.mkdirSync(path.dirname(dst), { recursive: true });
          fs.copyFileSync(srcFile, dst); copied.add(rel);
          h = h.slice(0, i) + tailRaw + h.slice(j); rewrites++;
          i = i + tailRaw.length;
        } else { missing.add(rel); i = j; }
      }
    }
  }
  if (h !== orig) { fs.writeFileSync(f, h); touched.add(path.relative(clean, f)); }
}
fs.writeFileSync('icons.out.txt', 'rewrites ' + rewrites + ' in ' + touched.size + ' files | copied ' + copied.size + ': ' + [...copied].join(' ') + ' | not in scrape ' + missing.size + ': ' + [...missing].slice(0, 15).join(' '));
