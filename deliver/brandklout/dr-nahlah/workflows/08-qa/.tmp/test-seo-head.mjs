/* Run the generated seo-head.js against three REAL published pages and read the
   head back. Proves the injection before it is shipped, which is the whole point
   of having a renderer in the loop. */
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
const src = fs.readFileSync(process.argv[2], 'utf8');
const urls = process.argv.slice(3);
for (const u of urls) {
  const expr = `(function(){ ${src} \nreturn {
    title: document.title,
    desc: (document.querySelector('meta[name=description]')||{}).content,
    canonical: (document.querySelector('link[rel=canonical]')||{}).href,
    ogTitle: (document.querySelector('meta[property="og:title"]')||{}).content,
    ogType: (document.querySelector('meta[property="og:type"]')||{}).content,
    article: !!document.querySelector('script[data-wz-article]'),
    dupTitles: document.querySelectorAll('title').length,
    dupDesc: document.querySelectorAll('meta[name=description]').length
  }; })()`;
  fs.writeFileSync('.expr.js', expr);
  const out = execFileSync('node', ['probe.mjs', u, '@.expr.js'], { encoding: 'utf8', maxBuffer: 1 << 26 });
  console.log('==', u);
  console.log(out.trim());
}
