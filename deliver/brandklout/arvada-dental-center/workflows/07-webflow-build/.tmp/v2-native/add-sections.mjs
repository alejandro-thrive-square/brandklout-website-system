#!/usr/bin/env node
/**
 * add-sections.mjs — splice the four carried-over v1 sections into the ads
 * template, and turn the FAQ into a repeat.
 *
 * Placement follows the page's existing argument rather than appending:
 *   gallery  after the before/after case      (more proof, same beat)
 *   story    after the path                   (the path, lived by one patient)
 *   space    after the surgeon                (who treats you, then where)
 *   faq      unchanged position, more items
 *
 * Idempotent: re-running detects the sections are already present.
 *
 *   node add-sections.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(HERE, '../../../04-design/.tmp/v2/_shared/page-template.tokens.html');
let t = fs.readFileSync(FILE, 'utf8');

if (t.includes('camp_gallery_grid')) { console.log('sections already present — nothing to do'); process.exit(0); }

const GALLERY = `
  <section class="camp_section"><div class="camp_container"><div class="camp_heading is-center"><div class="camp_eyebrow">{{gallery.eyebrow}}</div><h2 class="camp_h2">{{gallery.h2}}</h2><p class="camp_text is-center">{{gallery.text}}</p></div><div class="camp_gallery_grid">{{#gallery-images}}<img class="camp_gallery_img" src="{{.src}}" alt="{{.alt}}">{{/gallery-images}}</div></div></section>`;

const STORY = `
  <section class="camp_section is-mist"><div class="camp_container"><div class="camp_heading is-center"><div class="camp_eyebrow">{{story.eyebrow}}</div><h2 class="camp_h2">{{story.h2}}</h2><p class="camp_text is-center">{{story.text}}</p></div><div class="camp_result-image"><div class="camp_result-panel"><img class="camp_result-panel_img" src="{{story.before-src}}" alt="{{story.before-alt}}"><span class="camp_result-label">{{story.before-label}}</span></div><div class="camp_result-panel"><img class="camp_result-panel_img" src="{{story.after-src}}" alt="{{story.after-alt}}"><span class="camp_result-label">{{story.after-label}}</span></div></div><div class="camp_authenticity">{{story.caption}}</div><div class="camp_outcomes"><div class="camp_outcome is-before"><div class="camp_outcome_title">{{story.before-title}}</div>{{#story-before}}<div class="camp_outcome_item"><span class="camp_outcome_mark is-neg">{{.mark}}</span>{{.text}}</div>{{/story-before}}</div><div class="camp_outcome"><div class="camp_outcome_title">{{story.after-title}}</div>{{#story-after}}<div class="camp_outcome_item"><span class="camp_outcome_mark">{{.mark}}</span>{{.text}}</div>{{/story-after}}</div></div><div class="camp_chapters">{{#story-chapters}}<article class="camp_chapter"><img class="camp_chapter_img" src="{{.src}}" alt="{{.alt}}"><div class="camp_chapter_body"><div class="camp_chapter_num">{{.num}}</div><p class="camp_chapter_quote">{{.quote}}</p><p class="camp_chapter_text">{{.text}}</p></div></article>{{/story-chapters}}</div></div></section>`;

const SPACE = `
  <section class="camp_section is-sand"><div class="camp_container"><div class="camp_heading is-center"><div class="camp_eyebrow">{{space.eyebrow}}</div><h2 class="camp_h2">{{space.h2}}</h2><p class="camp_text is-center">{{space.text}}</p></div><div class="camp_space_grid">{{#space-images}}<img class="{{.cls}}" src="{{.src}}" alt="{{.alt}}">{{/space-images}}</div></div></section>`;

/** Insert `block` immediately after the line containing `anchor`. */
function after(anchor, block) {
  const lines = t.split('\n');
  const i = lines.findIndex((l) => l.includes(anchor));
  if (i < 0) { console.log(`anchor not found: ${anchor}`); process.exit(1); }
  lines.splice(i + 1, 0, block.trim().replace(/^/, '  '));
  t = lines.join('\n');
}

after('{{section-sand8.authenticity2}}', GALLERY);
after('{{section9.journey-text4}}', STORY);
after('{{section10.text-link-chev}}', SPACE);

// The FAQ becomes a repeat: the v1 lists run 6 items on emergency and 10 on
// all-on-x, and a fixed four-slot block would silently drop the rest.
const faqOld = t.match(/<div class="camp_faq_list">[\s\S]*?<\/div><\/div><\/div><\/section>/);
if (!faqOld) { console.log('could not find the FAQ list'); process.exit(1); }
t = t.replace(faqOld[0],
  '<div class="camp_faq_list">{{#faq}}<details class="camp_faq_item" {{.open}}><summary class="camp_faq_toggle">{{.q}}<span class="camp_faq_plus">+</span></summary><div class="camp_faq_answer">{{.a}}</div></details>{{/faq}}</div></div></div></section>');

fs.writeFileSync(FILE, t);

const slots = [...new Set([...t.matchAll(/\{\{([^}]+)\}\}/g)].map((m) => m[1]))];
console.log(`template now ${t.length} bytes, ${slots.length} distinct slots`);
console.log('repeats: ' + [...new Set([...t.matchAll(/\{\{#([\w-]+)\}\}/g)].map((m) => m[1]))].join(', '));
