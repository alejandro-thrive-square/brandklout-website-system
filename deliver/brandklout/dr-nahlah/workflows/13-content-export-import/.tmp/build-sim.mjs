/* Rebuild a servable page from what Instatic ACTUALLY stores, so the runtime
   rehydration can be tested against the real imported markup rather than
   against the local markup it is meant to repair. Head = the same code assets
   Instatic loads site-wide; body = the pulled document, verbatim. */
import fs from 'node:fs'; import path from 'node:path';
const HERE = import.meta.dirname;
const SITE = path.resolve(HERE, '../../04-design/.tmp/final-site');
const OUT = path.join(HERE, '.instatic-sim');
// Keep the simulator's stylesheet and runtime in step with the build. Copying
// them once and forgetting is how a stale sheet made the review wall look
// unstyled when it was fine: the sim must always serve what was pushed.
fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
for (const f of ['site.css', 'site.js']) {
  fs.copyFileSync(path.join(SITE, 'assets', f), path.join(OUT, 'assets', f));
}
// runtime-states.css is the THIRD stylesheet Instatic serves and the only one
// with no counterpart in the local build: it exists to repair what the importer
// strips. Leaving it out of the simulator is how `.pk-ba input{display:none
// !important}` -- a leftover from the retired before-after.js -- killed every
// before/after slider on the live site while sim-check reported 28/28.
fs.copyFileSync(path.join(HERE, 'src-runtime-states.css'), path.join(OUT, 'assets', 'runtime-states.css'));

const head = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
const fonts = head.match(/<link[^>]*fonts\.googleapis[^>]*>/)[0];
for (const slug of process.argv.slice(2)) {
  const j = JSON.parse(fs.readFileSync(path.join(HERE, '.instatic2', slug + '.json'), 'utf8'));
  /* Instatic serves media from a flat /uploads/ with a 21-character upload id
     prefixed to the original filename. The simulator has no /uploads, so every
     image 404s and "every image decoded" fails on a page that is perfectly
     fine. Point them back at the local copies, which are the same files. */
  const body = j.html
    .replace(/\suid="[^"]*"/g, '')
    .replace(/\/uploads\/[A-Za-z0-9_-]{21}-([^"' )]+)/g, (m, name) =>
      fs.existsSync(path.join(OUT, 'assets', name)) ? 'assets/' + name : m);
  fs.writeFileSync(path.join(OUT, slug + '.html'),
`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${j.title}</title>
${fonts}
<link rel="stylesheet" href="assets/runtime-states.css">
<link rel="stylesheet" href="assets/site.css">
<script src="assets/gsap/gsap.min.js"></script>
<script src="assets/gsap/ScrollTrigger.min.js"></script>
<script src="assets/gsap/ScrollToPlugin.min.js"></script>
<script src="assets/gsap/ScrollSmoother.min.js"></script>
<script src="assets/gsap/SplitText.min.js"></script>
<script src="assets/gsap/Observer.min.js"></script>
</head><body class="wz-kit">
${body}
<script type="module" src="assets/site.js"></script>
</body></html>`);
  console.log('wrote', slug + '.html', body.length);
}
