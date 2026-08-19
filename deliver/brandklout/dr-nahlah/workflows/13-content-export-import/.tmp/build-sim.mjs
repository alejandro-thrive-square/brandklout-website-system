/* Rebuild a servable page from what Instatic ACTUALLY stores, so the runtime
   rehydration can be tested against the real imported markup rather than
   against the local markup it is meant to repair. Head = the same code assets
   Instatic loads site-wide; body = the pulled document, verbatim. */
import fs from 'node:fs'; import path from 'node:path';
const HERE = import.meta.dirname;
const SITE = path.resolve(HERE, '../../04-design/.tmp/final-site');
const OUT = path.join(HERE, '.instatic-sim');
const head = fs.readFileSync(path.join(SITE, 'index.html'), 'utf8');
const fonts = head.match(/<link[^>]*fonts\.googleapis[^>]*>/)[0];
for (const slug of process.argv.slice(2)) {
  const j = JSON.parse(fs.readFileSync(path.join(HERE, '.instatic2', slug + '.json'), 'utf8'));
  const body = j.html.replace(/\suid="[^"]*"/g, '');
  fs.writeFileSync(path.join(OUT, slug + '.html'),
`<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${j.title}</title>
${fonts}
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
