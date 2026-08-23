#!/usr/bin/env node
/**
 * build-sections-content.mjs — turn a v1 harvest into the new section slots and
 * merge them into that topic's content file.
 *
 * The harvested text is a flat list of strings in document order. Rather than
 * assume fixed indices (they differ per topic — FAQ length alone runs 6 to 10)
 * this LOCATES each part by shape and reports any topic it cannot read, so a
 * mis-parse shows up here instead of as scrambled copy on a live page.
 *
 *   node build-sections-content.mjs [topic …]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { call, SITES } from './wf.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.resolve(HERE, '../../../04-design/.tmp/v2/content');
const HARVEST = path.join(HERE, 'v1-harvest');
const CACHE = path.join(HERE, 'asset-urls.json');
const cache = fs.existsSync(CACHE) ? JSON.parse(fs.readFileSync(CACHE, 'utf8')) : {};

/** Resolve an asset id to the hostedUrl the builder needs to bind it. */
function urlFor(assetId) {
  if (!assetId) return null;
  if (cache[assetId]) return cache[assetId];
  const r = call('data_assets_tool', [{ label: 'a', get_asset: { asset_id: assetId } }], { site: SITES.arvada });
  const u = r?.result?.hostedUrl;
  if (u) { cache[assetId] = u; fs.writeFileSync(CACHE, JSON.stringify(cache, null, 1)); }
  return u || null;
}

const topics = process.argv.slice(2).length ? process.argv.slice(2)
  : ['implants', 'aox', 'veneers', 'emergency', 'dentist-near-me', 'next-door'];

const MARKS = /^[✕✓✔✗×]$/;

for (const topic of topics) {
  const h = JSON.parse(fs.readFileSync(path.join(HARVEST, `${topic}.json`), 'utf8'));
  const out = {};
  const notes = [];

  // ---- gallery and space share a shape: eyebrow, two heading halves, copy ----
  for (const [key, section] of [['gallery', h.gallery], ['space', h.space]]) {
    if (!section) { notes.push(`${key}: absent`); continue; }
    const t = section.text;
    out[`${key}.eyebrow`] = (t[0] || '').replace(/^[—–-]\s*/, '').toUpperCase();
    out[`${key}.h2`] = [t[1], t[2]].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    out[`${key}.text`] = t[3] || '';
    const imgs = section.images.map((im) => ({ src: urlFor(im.assetId), alt: im.alt && im.alt !== 'inherit' ? im.alt : out[`${key}.h2`] }));
    out[`${key}-images`] = key === 'space'
      ? imgs.map((im, i) => ({ ...im, cls: i === 0 ? 'camp_space_img is-lead' : 'camp_space_img' }))
      : imgs;
    if (imgs.some((i) => !i.src)) notes.push(`${key}: an image has no resolvable asset`);
  }

  // ---- the story: heading, before/after, two outcome columns, four chapters --
  if (h.story) {
    const t = h.story.text;
    out['story.eyebrow'] = (t[0] || '').replace(/^[—–-]\s*/, '').toUpperCase();
    out['story.h2'] = [t[1], t[2]].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    // The v1 copy invites a drag, which this build has no slider for.
    out['story.text'] = (t[3] || '').replace(/\s*Drag the slider to see what became possible when his care was rebuilt around one complete plan\./, ' The before and after are shown side by side below.').replace(/\s*Drag the slider[^.]*\./gi, '');

    const beforeIdx = t.findIndex((s) => /^Before$/i.test(s));
    out['story.before-label'] = beforeIdx >= 0 ? t[beforeIdx] : 'Before';
    out['story.after-label'] = beforeIdx >= 0 ? (t[beforeIdx + 1] || 'After') : 'After';
    out['story.caption'] = t.find((s) => /Real .*patient/i.test(s)) || 'Real Arvada Dental patient. Individual results vary.';

    // A column title is followed by a mark glyph AND is not itself preceded by
    // one — otherwise every list item qualifies, because each item is followed
    // by the next item's mark.
    const titles = [];
    t.forEach((s, i) => {
      if (MARKS.test(t[i + 1] || '') && !MARKS.test(s) && !MARKS.test(t[i - 1] || '')) titles.push({ s, i });
    });
    out['story.before-title'] = titles[0]?.s || 'Life Before';
    out['story.after-title'] = titles[1]?.s || 'Life After';

    const pairs = [];
    for (let i = 0; i < t.length - 1; i++) if (MARKS.test(t[i])) pairs.push({ mark: t[i], text: t[i + 1], i });
    const split = titles[1]?.i ?? Math.ceil(pairs.length / 2);
    out['story-before'] = pairs.filter((p) => p.i < split).map(({ mark, text }) => ({ mark, text }));
    out['story-after'] = pairs.filter((p) => p.i > split).map(({ mark, text }) => ({ mark, text }));

    // Chapters: a "01 · Title" line, then a quote, then the body.
    const chapters = [];
    t.forEach((s, i) => {
      if (/^\d{1,2}\s*[·.]\s*\S/.test(s)) chapters.push({ num: s, quote: (t[i + 1] || '').replace(/^"|"$/g, ''), text: t[i + 2] || '' });
    });
    const imgs = h.story.images.map((im) => ({ src: urlFor(im.assetId), alt: im.alt && im.alt !== 'inherit' ? im.alt : out['story.h2'] }));
    out['story.before-src'] = imgs[0]?.src || null;
    out['story.before-alt'] = imgs[0]?.alt || 'Before treatment at Arvada Dental Center';
    out['story.after-src'] = imgs[imgs.length - 1]?.src || null;
    out['story.after-alt'] = imgs[imgs.length - 1]?.alt || 'After treatment at Arvada Dental Center';
    out['story-chapters'] = chapters.map((c, i) => ({ ...c, src: imgs[i + 1]?.src || imgs[0]?.src, alt: imgs[i + 1]?.alt || c.num }));

    if (out['story-before'].length !== out['story-after'].length) notes.push(`story: ${out['story-before'].length} before vs ${out['story-after'].length} after items`);
    if (chapters.length !== 4) notes.push(`story: ${chapters.length} chapters (expected 4)`);
    if (!out['story.before-src'] || !out['story.after-src']) notes.push('story: before/after image unresolved');
  }

  // ---- FAQ: the whole v1 list, first item open ------------------------------
  out.faq = (h.faq || []).map((f, i) => ({ q: f.q, a: String(f.a).trim(), open: i === 0 ? 'open' : '' }));
  if (!out.faq.length) notes.push('faq: no items');

  // Merge, keeping anything already written by hand.
  const p = path.join(CONTENT, `${topic}.json`);
  const existing = JSON.parse(fs.readFileSync(p, 'utf8'));
  // The v1 FAQ replaces the four questions written for v2 — the user asked for
  // the old information — so drop the old fixed slots.
  for (const k of Object.keys(existing)) if (/^section13\.faq-/.test(k)) delete existing[k];
  fs.writeFileSync(p, JSON.stringify({ ...existing, ...out }, null, 1));

  console.log(`${notes.length ? 'CHECK' : 'ok   '} ${topic.padEnd(16)} gallery ${out['gallery-images']?.length || 0} | space ${out['space-images']?.length || 0} | outcomes ${out['story-before']?.length || 0}/${out['story-after']?.length || 0} | chapters ${out['story-chapters']?.length || 0} | faq ${out.faq.length}`);
  for (const n of notes) console.log('       ' + n);
}
