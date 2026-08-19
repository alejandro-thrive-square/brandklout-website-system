#!/usr/bin/env node
/**
 * extract-posts.mjs — pull the 43 WordPress blog posts out of the content-intake
 * scrape and normalise them into something a CMS can hold.
 *
 * The scrape stores whole-page markdown, so every post is wrapped in the old
 * site's chrome: a ~40-line nav dump, two "## Book Now" blocks, the post title,
 * the date, a "#### Share This Post" widget, then the body, then a related-posts
 * strip and the full footer (addresses, hours, services, copyright). Roughly 40%
 * of every file is furniture. Slicing on the title heading alone is not enough
 * because the RELATED-POSTS strip at the end repeats other posts' titles and
 * dates, which is what drags footer text into the body if you only cut at the
 * end of the file.
 *
 * Boundaries used, all anchored on things the theme always emits:
 *   start  the line after "#### Share This Post"
 *   end    the EARLIEST of: "PrevPrevious"/"NextNext" (the prev/next pager),
 *          "#### More To Explore" (the related-posts strip), or
 *          "## You Are Welcome Here." (the site-wide CTA).
 * Cutting only at the CTA is not enough and looks like it works: it leaves the
 * related-posts strip inside the body, so every post ends with three OTHER
 * posts' headings, blurbs and dates. All 43 carry that strip.
 *
 * Output: posts.json, one record per post with title, slug, date, seoTitle,
 * seoDescription, and body as HTML ready for the CMS richText field.
 *
 *   node extract-posts.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRAPE = path.resolve(HERE, '../../01-content-intake/.tmp/current-site-scrape/site-data.json');
const OUT = path.join(HERE, 'posts.json');

const rows = Object.values(JSON.parse(fs.readFileSync(SCRAPE, 'utf8')));
const posts = rows.filter((r) => r.kind === 'post');

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** House rule: no em dash in copy (SYSTEM_RULES §3). En dashes between words go too. */
const nodash = (s) => s.replace(/\s*[—–]\s*/g, ', ');

const MONTHS = { january:1, february:2, march:3, april:4, may:5, june:6, july:7,
                 august:8, september:9, october:10, november:11, december:12 };

function isoDate(s) {
  const m = /([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/.exec(s || '');
  if (!m) return null;
  const mo = MONTHS[m[1].toLowerCase()];
  if (!mo) return null;
  return `${m[3]}-${String(mo).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
}

const out = [];
const problems = [];

for (const r of posts) {
  const md = r.body_markdown || '';

  const shareAt = md.indexOf('#### Share This Post');
  const ends = [
    md.indexOf('PrevPrevious'),
    md.indexOf('NextNext'),
    md.search(/####\s*More To Explore/i),
    md.search(/##\s*You Are Welcome Here\./i),
  ].filter((i) => i > shareAt);
  const endAt = ends.length ? Math.min(...ends) : -1;
  if (shareAt < 0 || endAt < 0) {
    problems.push(`${r.slug}: no usable boundary (share=${shareAt} end=${endAt})`);
    continue;
  }
  const bodyMd = md.slice(shareAt + '#### Share This Post'.length, endAt);

  // The date sits just above "Share This Post", between the title and it.
  const head = md.slice(0, shareAt);
  const date = isoDate(head.slice(-120)) || isoDate(head);

  // markdown -> HTML. The source only ever uses ##, ###, plain paragraphs and
  // the occasional list, so a full parser would be more risk than value.
  const html = [];
  for (const raw of bodyMd.split(/\n{2,}/)) {
    const block = raw.trim();
    if (!block) continue;
    const h = /^(#{2,4})\s+(.*)$/.exec(block);
    if (h) {
      const level = Math.min(h[1].length, 3);   // ## -> h2, ### -> h3, #### -> h3
      html.push(`<h${level}>${esc(nodash(h[2].trim()))}</h${level}>`);
      continue;
    }
    if (/^[-*]\s+/m.test(block) && block.split('\n').every((l) => /^[-*]\s+/.test(l.trim()) || !l.trim())) {
      const items = block.split('\n').filter((l) => l.trim()).map(
        (l) => `<li>${esc(nodash(l.replace(/^[-*]\s+/, '').trim()))}</li>`);
      html.push(`<ul>${items.join('')}</ul>`);
      continue;
    }
    html.push(`<p>${esc(nodash(block.replace(/\s*\n\s*/g, ' ')))}</p>`);
  }

  const title = nodash((r.h1 && r.h1[0]) ||
    (r.headings || []).map((h) => h.text).find((t) => t && !/book now|share this post/i.test(t)) ||
    r.slug);

  const body = html.join('\n');
  const words = body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  if (words < 300) problems.push(`${r.slug}: only ${words} words after trimming, check the boundaries`);

  out.push({
    slug: r.slug,
    title: title.trim(),
    date,
    seoTitle: (r.seo && r.seo.title_tag) ? nodash(r.seo.title_tag).trim() : title.trim(),
    seoDescription: (r.seo && r.seo.meta_description) ? nodash(r.seo.meta_description).trim() : '',
    oldUrl: r.url,
    words,
    body,
  });
}

out.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
fs.writeFileSync(OUT, JSON.stringify(out, null, 1));

const undated = out.filter((p) => !p.date).length;
console.log(`${out.length}/${posts.length} posts extracted -> posts.json`);
console.log(`  words: total ${out.reduce((s, p) => s + p.words, 0).toLocaleString()}, ` +
            `median ${out.map((p) => p.words).sort((a, b) => a - b)[Math.floor(out.length / 2)]}`);
console.log(`  dated: ${out.length - undated}, undated: ${undated}`);
console.log(`  newest ${out[0]?.date}  oldest ${out[out.length - 1]?.date}`);
if (problems.length) { console.log('\nPROBLEMS:'); problems.forEach((p) => console.log('  ' + p)); }
