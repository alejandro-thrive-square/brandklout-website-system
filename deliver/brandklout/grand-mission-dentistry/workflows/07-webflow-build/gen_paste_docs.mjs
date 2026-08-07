/**
 * gen_paste_docs.mjs — write the indications that ship with every component
 * (PASTEABLE-COMPONENTS.md): a README per component folder and one
 * PASTE-QUEUE.md per page for the Chrome-extension / manual paste flow.
 *
 * Regenerate whenever the components are re-extracted:
 *   node gen_paste_docs.mjs .tmp/components
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2] || '.tmp/components';
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));

const PAGE_META = {
  implant: { title: 'Implant LP', pageId: '6a724b6977f9b0019d2a03f8', slug: 'implant-ai' },
  cosmetic: { title: 'Cosmetic LP', pageId: '6a723ad5534774f35f17d119', slug: 'cosmetic-ai' },
  'thank-you': { title: 'Thank-you LP', pageId: '6a7268a862a728c1cd4df73b', slug: 'thank-u-landing-ai' },
};
const SITE = '698111847e9608eb30ee21c6';

const PREREQS = `## Prerequisites — once per page, BEFORE any paste

1. **Fonts**: Montserrat and Great Vibes enabled in Site Settings → Fonts.
   Webflow silently strips \`font-family\` from pasted styles for unregistered
   families — no error, the page just renders in system-ui.
2. **Page-level custom code** (installed by the agent over the Data API MCP —
   the blocks exceed the 10k page-settings UI cap; the API takes 50k):
   - head ← \`.tmp/_shared-install/head.html\` (GSAP CDN tags → WZ bootstrap →
     runtime-states CSS union). Identical on all three LP pages.
   - footer ← \`.tmp/_shared-install/footer.html\` (registerPlugin +
     ScrollSmoother.create + WZ.flush + the shared kit).
   **Never install at site level** (303-page production site) **and never
   twice** — a second ScrollSmoother.create kills every trigger.`;

const STEPS = `## Paste steps

1. Open this folder's \`PASTE.html\` in the SAME browser the Designer is
   logged into, and click **Copy to Webflow clipboard** yourself — execCommand
   needs a real user gesture.
2. In the Designer, select the target parent in the **Navigator** (see the
   page's PASTE-QUEUE.md), keep the canvas at **100% zoom** (\`Ctrl+0\`), and
   press \`Ctrl+V\` **once**.
3. If the paste misses, re-copy fresh — a stale clipboard is the usual cause.

## After pasting

Ask the agent to patch content over the Data API MCP (\`set_text\`,
\`set_image_asset\`, \`set_attributes\`) — **never re-paste to fix a typo**; a
re-paste with a hand-edited definition forks \`-2\` twin classes.`;

for (const m of manifest) {
  const dir = path.join(root, m.dir);
  const page = PAGE_META[m.page];
  const doc = JSON.parse(fs.readFileSync(path.join(dir, 'final.json'), 'utf8'));
  const embeds = doc.payload.nodes.filter((n) => n.type === 'HtmlEmbed');
  const scripted = embeds.filter((e) => /WZ\.add|WZ\.onReady/.test(e.v || '')).length;

  const what = m.kind === 'shell'
    ? `The **page shell**: fixed header + chapter readout, #smooth-wrapper /
#smooth-content, an EMPTY \`main#top\`, the footer, the sticky mobile call
bar and the lightbox. Paste it FIRST on a blank/cleared page; then paste the
sections into \`main#top\` in order.`
    : m.kind === 'footer'
      ? `The page footer (practice address, hours, services, legal line). Already
part of the page shell — paste this standalone only when rebuilding the
footer alone.`
      : `Section \`#${m.sectionId}\`${m.chapterName ? ` — chapter **"${m.chapterName}"**` : ''}, position ${m.order} of ${m.of} inside \`main#top\`.`;

  const readme = `# ${page.title} — ${m.dir.split('/')[1]}

${what}

| | |
| :--- | :--- |
| Page | **${page.title}** (\`${page.slug}\`, page \`${page.pageId}\`, site \`${SITE}\`) |
| Payload | \`final.json\` — ${doc.payload.nodes.length} nodes, ${doc.payload.styles.length} styles, ${(doc.payload.assets || []).length} assets, ${embeds.length} HtmlEmbeds (${scripted} scripted), 1 root |
| Behaviour | ${scripted ? `rides INSIDE the section as \`WZ.add\`/\`WZ.onReady\` embeds — the section stays movable and reorderable` : 'none of its own (kit/state CSS driven)'} |
| Paste target | ${m.kind === 'shell' ? '**Body** of the blank/cleared page' : m.kind === 'footer' ? '`#smooth-content`, after `main#top`' : `\`main#top\`, after component ${String(m.order - 1).padStart(2, '0')}`} |

${PREREQS}

${STEPS}
`;
  fs.writeFileSync(path.join(dir, 'README.md'), readme, 'utf8');
}

/* ---- per-page queues ----------------------------------------------------- */
for (const [pageKey, page] of Object.entries(PAGE_META)) {
  const items = manifest.filter((m) => m.page === pageKey);
  const shell = items.find((m) => m.kind === 'shell');
  const sections = items.filter((m) => m.kind === 'section');
  const lines = [];
  lines.push(`# PASTE QUEUE — ${page.title} (\`${page.slug}\`)`);
  lines.push('');
  lines.push(`Site \`${SITE}\` · page \`${page.pageId}\`. Components paste IN THIS ORDER;`);
  lines.push('each folder has its own README + PASTE.html. Prerequisites (fonts +');
  lines.push('page-level head/footer code via the Data API) are in every README and');
  lines.push('must be done BEFORE step 1.');
  lines.push('');
  lines.push('The live page holds the superseded embed-based build. Step 0 clears it:');
  lines.push('');
  lines.push('| # | Component | Paste into | Notes |');
  lines.push('| :--- | :--- | :--- | :--- |');
  lines.push(`| 0 | — | — | Select Body, delete the old build's children. Ask the agent to clear the old PAGE-settings custom code over the MCP at the same time. |`);
  lines.push(`| 1 | \`${shell.dir.split('/')[1]}\` | **Body** | header + wrappers + empty \`main#top\` + footer + mobile bar + lightbox |`);
  sections.forEach((m, i) => {
    lines.push(`| ${i + 2} | \`${m.dir.split('/')[1]}\` | \`main#top\` | ${m.chapterName ? `"${m.chapterName}"` : `#${m.sectionId}`}${m.scripted ? ' · scripted' : ''} |`);
  });
  lines.push('');
  lines.push('**One-paste alternative**: `../../' + pageKey + '/PASTE-full-page.html` holds the');
  lines.push('whole page as a single-root payload — paste once into a cleared Body and');
  lines.push('skip steps 1-' + (sections.length + 1) + '. Use the per-section queue when rebuilding or');
  lines.push('moving individual chapters.');
  lines.push('');
  lines.push('After the queue: publish to staging only, then run `parity.mjs` and');
  lines.push('`deliver/brandklout/scripts/staging-verify.mjs` — same output or it is');
  lines.push('not done.');
  lines.push('');
  fs.writeFileSync(path.join(root, pageKey, 'PASTE-QUEUE.md'), lines.join('\n'), 'utf8');
}

console.log(`wrote ${manifest.length} READMEs + ${Object.keys(PAGE_META).length} PASTE-QUEUE.md`);
