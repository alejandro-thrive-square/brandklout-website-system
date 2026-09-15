/* v11 hipaa.html — Sang's layout, brandklout.com's HIPAA Compliance text verbatim
   (assets/brandklout-com-legal.json), in place of his "Draft explanatory page for counsel and
   compliance review". Same treatment as privacy and terms (2026-09-14). See ../patches.mjs. */
import fs from 'node:fs'

const LEGAL = JSON.parse(fs.readFileSync(new URL('./assets/brandklout-com-legal.json', import.meta.url), 'utf8'))
const tab = LEGAL.tabs.find((t) => t.id === 'hipaa')

export default [
  {
    why: 'Legal pages (2026-09-14): brandklout.com\'s HIPAA Compliance text on the full page',
    // v16: the market-prequalification form follows the legal section (see privacy.html.mjs).
    find: /<div class="wrap legal">[\s\S]*?<\/div><\/section>(?=<section class="section opportunity-section bottom-market-prequal")/,
    replace: `<div class="wrap legal">${tab.body}</div></section>`,
  },
]
