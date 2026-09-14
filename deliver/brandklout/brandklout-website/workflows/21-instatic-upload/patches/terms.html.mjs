/* v11 terms.html — Sang's layout, brandklout.com's Terms of Service text verbatim
   (assets/brandklout-com-legal.json), in place of his "Draft website terms for counsel review"
   template. 2026-09-14, Alejandro: Privacy / Terms are full pages, not the pop-up. See ../patches.mjs. */
import fs from 'node:fs'

const LEGAL = JSON.parse(fs.readFileSync(new URL('./assets/brandklout-com-legal.json', import.meta.url), 'utf8'))
const tab = LEGAL.tabs.find((t) => t.id === 'terms')

export default [
  {
    why: 'Legal pages (2026-09-14, Alejandro): brandklout.com\'s Terms of Service text on the full page',
    find: /<div class="wrap legal">[\s\S]*?<\/div><\/section><\/main>/,
    replace: `<div class="wrap legal">${tab.body}</div></section></main>`,
  },
]
