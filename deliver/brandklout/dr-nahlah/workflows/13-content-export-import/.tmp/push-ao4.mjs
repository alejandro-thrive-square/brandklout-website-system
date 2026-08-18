#!/usr/bin/env node
/**
 * push-ao4.mjs — the thin-arch explainer on /all-on-4.
 *
 * Same shared `.ta` component as the home page's Chapter 06, but as its own
 * band rather than an inset, so it does NOT carry `.ta-inset` (that modifier
 * exists only to add the rule that separates the block from the chapter above
 * it on the home page; here the section break already does that job).
 *
 * Inserted as `main`'s child index 3: after the page kit placeholder (0), the
 * hero (1) and "Why Four" (2), and before "The Sequence". The argument for four
 * posts leads straight into what sits on top of them.
 */
import { callJson } from './instatic-mcp.mjs';

const fp = (key, head, items) =>
  `<article class="ta-card ta-${key}"><span class="ta-key">${key.toUpperCase()}</span>`
  + `<h3>${head}</h3><ul class="ta-list">${items.map((i) => `<li>${i}</li>`).join('')}</ul></article>`;

const SECTION =
  '<section class="pk ta" id="thin-arch"><div class="wrap section">'
  + '<div class="ta-head"><div class="chapter-tag"><i></i><span class="label">Thin Arch</span></div>'
  + '<h2 class="ta-title">FP1, FP2, FP3, and why we plan for the first.</h2>'
  + '<p>Two practices can both quote you &ldquo;All-on-4&rdquo; and hand back very different teeth. Every full-arch prosthesis is one of three types, and what separates them is how much of it is teeth and how much is pink acrylic standing in for gum and bone. Most practices fit one kind. Here the arch is planned as thin as the case will carry.</p></div>'
  + '<div class="ta-grid">'
  + fp('fp1', 'Replaces teeth only',
       ['Natural crown-and-bridge look', 'No added pink, no extra bulk', 'Typically on more natural gum architecture'])
  + fp('fp2', 'Longer teeth, minimal pink',
       ['Longer teeth, minimal pink acrylic', 'The pink that is added still follows the natural gum contour', 'Rarely indicated, and often not ideal'])
  + fp('fp3', 'Replaces teeth, gums and bone',
       ['Thick pink acrylic stands in for gum and bone', 'Thicker, stronger prosthesis', 'Typically best where there is bone loss, and a lower hygiene risk'])
  + '</div>'
  + '<figure class="ta-fig"><img src="/uploads/ENFTs0BxHOSzBrq1fNHbs-fp1-fp3-comparison.png" loading="lazy" decoding="async" alt="FP1, FP2 and FP3 full-arch prostheses side by side. FP1 replaces the teeth only, with no pink acrylic. FP2 has longer teeth and minimal pink. FP3 replaces teeth, gums and bone with thick pink acrylic.">'
  + '<figcaption>The same arch, three ways. The pink is the difference.</figcaption></figure>'
  + '<p class="ta-note">A thin arch is not always possible. Where bone loss is advanced, FP3 is both the honest answer and the stronger one, and it is easier to keep clean. What is worth asking of anyone quoting you is which of the three they are planning, and why. <a class="pk-more" href="/contact#book">Ask at your consultation</a></p>'
  + '</div></section>';

let ok = 0;
const problems = [];

try {
  const r = await callJson('site_insert_html',
    { parentId: 'mqSza_SWbUuLbb9uNBOz8', index: 3, html: SECTION });
  if (r && typeof r.text === 'string' && !/ok/i.test(r.text)) throw new Error(r.text.slice(0, 150));
  ok++;
  console.log('  thin-arch section inserted at main[3]');
} catch (e) { problems.push(`insert: ${e.message.slice(0, 170)}`); }

// hero meta gains a fourth block naming the thin arch
try {
  const r = await callJson('site_replace_node_html', { nodeId: 'C6v1VeiQVbhthYj9rZ9fL',
    html: '<div><b>4 posts</b><span>Per arch, upper or lower</span></div>'
        + '<div><b>Same day</b><span>PMMA provisional teeth</span></div>'
        + '<div><b>3&ndash;4 mo</b><span>To the zirconia final</span></div>'
        + '<div><b>FP1 first</b><span>Planned as thin as the bone allows</span></div>' });
  if (r && typeof r.text === 'string') throw new Error(r.text.slice(0, 150));
  ok++;
  console.log('  hero meta updated');
} catch (e) { problems.push(`hero meta: ${e.message.slice(0, 170)}`); }

console.log(`\n${ok}/2 applied`);
if (problems.length) { console.log('\nproblems:'); for (const p of problems) console.log('  ' + p); }
