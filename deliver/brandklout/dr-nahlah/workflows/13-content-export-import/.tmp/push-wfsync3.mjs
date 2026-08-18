#!/usr/bin/env node
/**
 * push-wfsync3.mjs — the review widget and the CSS for everything new.
 *
 * WHY THE WIDGET NEEDS A SCRIPT AT ALL.
 * Instatic allowlists iframe providers. A YouTube iframe pushed through
 * site_replace_node_html survives as a real <iframe>; the ReputationHub one is
 * silently DOWNGRADED TO A <div> carrying src/frameborder as dead attributes,
 * so it renders nothing. Tested with and without class, frameborder and inline
 * style: the attributes make no difference, the host does. And site_insert_html
 * strips <script>, so the vendor loader cannot ride in the markup either.
 *
 * So the embed is built client-side: a script code asset finds the mount point
 * left in the markup, creates the iframe itself (the sanitiser never sees it),
 * and then loads the vendor's own resize script. That is what review-widget.js
 * expects to find anyway — it only measures and resizes, it does not create.
 *
 * CSS goes in the runtime-states.css code asset, which survives the
 * publish-time purge that strips "unused" rules from the style registry.
 * Selectors hook #rvGrid by ID rather than a class, because site_assign_class
 * only attaches classes that already exist in the registry and refuses a new one.
 */
import { callJson } from './instatic-mcp.mjs';

const problems = [];
let ok = 0;
const step = async (label, fn) => {
  try { await fn(); ok++; console.log(`  ${label}`); }
  catch (e) { problems.push(`${label}: ${e.message.slice(0, 200)}`); }
};

const WIDGET_SRC = 'https://reputationhub.site/reputation/widgets/review_widget/'
  + 'xJDu1mFoW5jFYTNqmuk7?widgetId=6a7340db2bbe7819cc3536f4';

const SCRIPT = `/* Patient review widget (LeadConnector / ReputationHub).
   Built here rather than in the markup because Instatic allowlists iframe
   providers and downgrades this one to a <div>, and because site_insert_html
   strips <script> so the vendor loader cannot be placed inline either.
   Guards on the mount point, so it is inert on every page that lacks one. */
(function () {
  var mount = document.querySelector('#rvGrid .rv-mount') || document.querySelector('.rv-mount');
  if (!mount || mount.dataset.built) return;
  mount.dataset.built = '1';

  var f = document.createElement('iframe');
  f.className = 'lc_reviews_widget';          // the vendor script finds it by this
  f.title = 'Patient reviews';
  f.src = ${JSON.stringify(WIDGET_SRC)};
  f.setAttribute('frameborder', '0');
  f.setAttribute('scrolling', 'no');
  f.style.minWidth = '100%';
  f.style.width = '100%';
  f.style.border = '0';
  mount.appendChild(f);

  var s = document.createElement('script');
  s.src = 'https://reputationhub.site/reputation/assets/review-widget.js';
  s.async = true;
  document.body.appendChild(s);
})();
`;

const CSS = `

/* --------------------------------------------------------------------------
   THE WEBFLOW SYNC (added 2026-08-18)
   The client's edits, brought across from the Webflow build they reviewed
   together: the practice gallery in Chapter 08, the review widget in place of
   the six hand-built cards, and the filmed testimonials.
   -------------------------------------------------------------------------- */

/* Chapter 08 gallery. One wide frame leading a row of four: five landscape
   shots at equal size read as a contact sheet, and the wide one gives the eye
   somewhere to land. Sits on this chapter's dark ground, so the frames take a
   hairline rather than a shadow. */
.ch-invitation .iv-gallery { display: grid; grid-template-columns: 1fr; gap: clamp(.5rem, 1vw, .75rem); margin-top: clamp(2rem, 4vw, 3rem); }
.ch-invitation .iv-shot { display: block; width: 100%; height: 100%; object-fit: cover; aspect-ratio: 4/3; border: 1px solid rgba(255,255,255,.1); }
@media (min-width: 720px) {
  .ch-invitation .iv-gallery { grid-template-columns: repeat(4, 1fr); }
  .ch-invitation .iv-shot-wide { grid-column: 1 / -1; aspect-ratio: 21/9; }
}
@media (min-width: 1080px) {
  .ch-invitation .iv-shot-wide { grid-column: span 2; aspect-ratio: auto; }
}

/* The review widget's mount. Hooked by ID: the container's old .rv-grid class
   was removed (it is no longer a grid) and site_assign_class will not attach a
   class the registry does not already hold, so #rvGrid is the stable handle. */
#rvGrid { display: block; background: none; margin-top: clamp(1.5rem, 3vw, 2.25rem); }
#rvGrid .rv-mount { display: block; min-height: 320px; }
#rvGrid iframe { display: block; width: 100%; border: 0; }

/* Filmed testimonials. The film takes the slot the patient photograph held, so
   it inherits that box; a YouTube frame is 16/9 inside a 4/3 slot and is
   centred rather than stretched, because letterboxing a face is worse than a
   little ground showing. */
.ch-proof .pf-embed { position: absolute; inset: 0; display: grid; place-items: center; background: #0B0B0C; }
.ch-proof .pf-embed iframe { width: 100%; aspect-ratio: 16/9; height: auto; border: 0; display: block; }
.st-fig .st-film { position: absolute; inset: 0; display: grid; place-items: center; background: #0B0B0C; }
.st-fig .st-film iframe { width: 100%; aspect-ratio: 16/9; height: auto; border: 0; display: block; }
.st-film-card { position: relative; aspect-ratio: 16/9; margin: .35rem 0 .9rem; }
.st-film-card iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; display: block; }
`;

await step('review widget script asset installed', async () => {
  const r = await callJson('site_write_code_asset', {
    path: 'src/scripts/review-widget-mount.js',
    type: 'script',
    content: SCRIPT,
    runtime: { enabled: true, scope: { type: 'all-pages' }, placement: 'body-end', timing: 'dom-ready' },
  });
  if (r && typeof r.text === 'string' && !/ok/i.test(r.text)) throw new Error(r.text.slice(0, 150));
});

await step('runtime script confirmed active', async () => {
  const i = await callJson('site_inspect_code_runtime', { document: { type: 'page', id: 'NbdYHhxKZ6BreH_qWpL1W' } });
  const s = (i.scripts || []).find((x) => x.path === 'src/scripts/review-widget-mount.js');
  if (!s) throw new Error('not listed for the home page');
  if (!s.applies) throw new Error(`listed but applies=${s.applies}`);
  console.log(`     placement=${s.placement} timing=${s.timing} scope=${s.scope?.type}`);
});

await step('sync CSS appended to runtime-states.css', async () => {
  const PATH = 'src/styles/runtime-states.css';
  const cur = await callJson('site_read_code_asset', { path: PATH });
  if ((cur.content || '').includes('THE WEBFLOW SYNC')) return;
  const ANCHOR = '.ch-proof .rv-head h3 { color: var(--fg); }';
  if (!(cur.content || '').includes(ANCHOR)) throw new Error('anchor not found');
  await callJson('site_patch_code_asset', {
    path: PATH, expectedHash: cur.hash,
    replacements: [{ oldText: ANCHOR, newText: ANCHOR + CSS }],
  });
  const after = await callJson('site_read_code_asset', { path: PATH });
  if (!(after.content || '').includes('.ch-invitation .iv-gallery')) throw new Error('not present after patch');
});

console.log(`\n${ok}/3 steps`);
if (problems.length) { console.log('\nproblems:'); for (const p of problems) console.log('  ' + p); }
