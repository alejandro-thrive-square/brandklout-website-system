/* v11 privacy.html — the full page keeps Sang's layout (hero, breadcrumb, `.wrap.legal`); its body
   is brandklout.com's own Privacy Policy, verbatim (assets/brandklout-com-legal.json, captured from
   the live site's legal modal 2026-09-11), in place of his "Draft website policy for counsel review"
   template. 2026-09-14, Alejandro: Privacy / Terms are full pages, not the pop-up. See ../patches.mjs. */
import fs from 'node:fs'

const LEGAL = JSON.parse(fs.readFileSync(new URL('./assets/brandklout-com-legal.json', import.meta.url), 'utf8'))
const tab = LEGAL.tabs.find((t) => t.id === 'privacy')

export default [
  {
    why: 'Legal pages (2026-09-14, Alejandro): brandklout.com\'s Privacy Policy text on the full page',
    /* v16 puts the market-prequalification form after the legal section, so the anchor ends at the
       legal section's own close, not at </main>. */
    find: /<div class="wrap legal">[\s\S]*?<\/div><\/section>(?=<section class="section opportunity-section bottom-market-prequal")/,
    replace: `<div class="wrap legal">${tab.body}</div></section>`,
  },
]
