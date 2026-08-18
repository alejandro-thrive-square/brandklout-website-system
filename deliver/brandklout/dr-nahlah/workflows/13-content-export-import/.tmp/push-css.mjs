#!/usr/bin/env node
/**
 * push-css.mjs — install the thin-arch component CSS and the meta-stack fix.
 *
 * APPENDED to the existing `src/styles/runtime-states.css` rather than shipped
 * as a new asset. Two reasons:
 *   - Instatic strips "unused" CSS from the per-page style registry at publish,
 *     so `site_apply_css` is not durable; a code asset is.
 *   - A NEW code asset's runtime config attaches on create and is known to flap
 *     on overwrite, and there is no delete tool to undo a bad one. This file is
 *     already proven: enabled, scope all-pages, priority 100, willPublish true.
 *
 * Selectors use INSTATIC's class names. The home page's arrival meta is `.meta`
 * here and `.ar-meta` in the local build; the two vocabularies diverged in the
 * 2026-08-17 re-architecture.
 */
import fs from 'node:fs';
import path from 'node:path';
import { callJson } from './instatic-mcp.mjs';

const CSS = `

/* ==========================================================================
   THIN ARCH — the FP1 / FP2 / FP3 explainer (added 2026-08-18)
   Renders inside the home page's Chapter 06 (with .ta-inset) and as its own
   band on /all-on-4. Paints from the theme tokens only, so it does not assume
   the ground it sits on.

   FP1 is the only card given gold: that is the point the client asked the site
   to make, and it is made by emphasis rather than by disparaging FP3, which is
   the correct answer where bone loss is advanced.
   ========================================================================== */
.ta-inset { border-top: 1px solid var(--line); }
.ta .ta-head { display: grid; gap: 1rem; max-width: 52ch; margin-bottom: clamp(2rem, 4vw, 3rem); }
.ta .ta-title { font-size: var(--h2); font-family: var(--f-display); font-weight: 500; }
.ta .ta-head p { color: var(--fg-body); font-weight: 400; }

.ta-grid { display: grid; grid-template-columns: 1fr; gap: clamp(1rem, 1.8vw, 1.5rem); }
@media (min-width: 820px) { .ta-grid { grid-template-columns: repeat(3, 1fr); } }

.ta-card {
  background: var(--card);
  border: 1px solid var(--line);
  border-top: 3px solid var(--line-strong);
  padding: clamp(1.5rem, 2.6vw, 2.25rem);
  display: grid; gap: .85rem; align-content: start;
}
.ta-card.ta-fp1 { border-top-color: var(--rule); background: var(--bg-3); }
.ta-card.ta-fp2 { border-top-color: var(--line); }
.ta-card.ta-fp3 { border-top-color: var(--line-strong); }

.ta-key {
  font-family: var(--f-display); font-size: calc(2.1rem * var(--t-mid));
  font-weight: 500; line-height: 1; color: var(--fg-faint);
}
.ta-card.ta-fp1 .ta-key { color: var(--accent-lg); }
.ta-card h3 { font-family: var(--f-display); font-size: calc(1.35rem * var(--t-sm)); font-weight: 500; color: var(--fg); }

.ta-list { list-style: none; margin: 0; padding: 0; display: grid; gap: .6rem; }
.ta-list li { position: relative; padding-left: 1.4rem; color: var(--fg-body); font-weight: 300; font-size: .95rem; line-height: 1.55; }
.ta-list li::before { content: ""; position: absolute; left: 0; top: .55em; width: .5rem; height: .5rem; border-radius: 50%; background: var(--line-strong); }
.ta-card.ta-fp1 .ta-list li::before { background: var(--rule); }

/* The client's own diagram. Boxed rather than bled, because it arrives with its
   own blue/orange/red key that is not the brand palette and should read as a
   quoted reference figure rather than as site furniture. */
.ta-fig { margin: clamp(1.75rem, 3.5vw, 2.75rem) 0 0; padding: clamp(1rem, 2vw, 1.75rem); background: var(--bg); border: 1px solid var(--line); }
.ta-fig img { display: block; width: 100%; height: auto; }
.ta-fig figcaption { margin-top: 1rem; font-size: .74rem; letter-spacing: .12em; text-transform: uppercase; color: var(--fg-soft); }

.ta-note { margin-top: clamp(1.5rem, 3vw, 2.25rem); max-width: 62ch; color: var(--fg-body); font-weight: 300; }

/* ==========================================================================
   META PAIRS MUST STACK WITHOUT THE GRID (added 2026-08-18)
   The label/value pairs in the hero metas rely on their PARENT being
   display:grid to put the <b> above the <span>. Wherever that one declaration
   is lost, the pair renders inline and reads as
   "D.D.S., M.S.Diplomate, Am. Board of Prosthodontics" — which is exactly what
   the client reported as a typo on the home page. Making the children
   block-level as well means the pair survives the grid being dropped.
   ========================================================================== */
.ch-arrival .meta b, .ch-arrival .meta span { display: block; }
.pg-hero .ph-meta b, .pg-hero .ph-meta span { display: block; }
`;

const PATH = 'src/styles/runtime-states.css';
const cur = await callJson('site_read_code_asset', { path: PATH });
const content = cur.content || '';
if (content.includes('.ta-card.ta-fp1')) {
  console.log('already installed — nothing to do');
  process.exit(0);
}

// anchor on the last rule in the file and append after it
const ANCHOR = '@media (min-width: 720px) {\n  footer.foot .grid { grid-template-columns: 1.6fr 1fr 1fr 1.2fr; }\n}';
if (!content.includes(ANCHOR)) {
  fs.writeFileSync(path.join(import.meta.dirname, 'runtime-states.css'), content);
  throw new Error('anchor not found — see runtime-states.css for the current content');
}

const r = await callJson('site_patch_code_asset', {
  path: PATH,
  expectedHash: cur.hash,
  replacements: [{ oldText: ANCHOR, newText: ANCHOR + CSS }],
});
console.log('patch response:', JSON.stringify(r).slice(0, 200));

const after = await callJson('site_read_code_asset', { path: PATH });
const okNow = (after.content || '').includes('.ta-card.ta-fp1') &&
              (after.content || '').includes('.ch-arrival .meta b');
console.log(`stylesheet now ${after.content?.length ?? 0} chars — thin-arch + meta rules present: ${okNow}`);

const inspect = await callJson('site_inspect_code_runtime', { document: { type: 'page', id: 'NbdYHhxKZ6BreH_qWpL1W' } });
const s = (inspect.styles || []).find((x) => x.path === PATH);
console.log('runtime:', JSON.stringify(s));
if (!okNow || !s?.applies || !s?.willPublish) process.exitCode = 1;
