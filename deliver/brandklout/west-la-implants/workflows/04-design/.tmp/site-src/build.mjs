/* Assemble site-src into dist/ — one CSS file, one JS file, vendored GSAP,
   media and fonts copied through. Run: node build.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(here, 'dist');
const list = (dir, ext) => fs.readdirSync(dir).filter(f => f.endsWith(ext)).sort().map(f => path.join(dir, f));

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(path.join(dist, 'assets', 'gsap'), { recursive: true });

// CSS — filename order is cascade order; font paths are rewritten for dist
let css = list(path.join(here, 'css'), '.css').map(f => `/* ==== ${path.basename(f)} ==== */\n` + fs.readFileSync(f, 'utf8')).join('\n\n');
css = css.replace(/url\('\.\.\/fonts\//g, "url('../fonts/");
fs.writeFileSync(path.join(dist, 'assets', 'site.css'), css);

// JS — runtime, then every section, then boot
const js = [
  ...list(path.join(here, 'js'), '.js').filter(f => /00-/.test(path.basename(f))),
  ...list(path.join(here, 'sections'), '.js'),
  ...list(path.join(here, 'js'), '.js').filter(f => /90-/.test(path.basename(f))),
].map(f => `/* ==== ${path.basename(f)} ==== */\n` + fs.readFileSync(f, 'utf8')).join('\n\n');
fs.writeFileSync(path.join(dist, 'assets', 'site.js'), js);

for (const f of fs.readdirSync(path.join(here, 'vendor', 'gsap'))) fs.copyFileSync(path.join(here, 'vendor', 'gsap', f), path.join(dist, 'assets', 'gsap', f));
fs.cpSync(path.join(here, 'media'), path.join(dist, 'media'), { recursive: true });
fs.mkdirSync(path.join(dist, 'fonts'), { recursive: true });
for (const f of fs.readdirSync(path.join(here, 'fonts')).filter(f => f.endsWith('.woff2'))) fs.copyFileSync(path.join(here, 'fonts', f), path.join(dist, 'fonts', f));
fs.copyFileSync(path.join(here, 'index.html'), path.join(dist, 'index.html'));

const size = p => (fs.statSync(p).size / 1024).toFixed(1) + ' KB';
console.log('dist/assets/site.css', size(path.join(dist, 'assets', 'site.css')));
console.log('dist/assets/site.js ', size(path.join(dist, 'assets', 'site.js')));
console.log('dist/index.html     ', size(path.join(dist, 'index.html')));
