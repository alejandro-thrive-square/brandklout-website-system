#!/usr/bin/env node
/**
 * repair-home.mjs — fix the Instatic home page's import damage.
 *
 * THREE PRE-EXISTING DEFECTS, none caused by the content push:
 *  1. `ch-specialist` appears TWICE, both with id="specialist" (invalid HTML,
 *     and the bio renders twice). The second copy is deleted.
 *  2. Chapter 07 (The Proof) is nearly empty — 827 bytes against the local
 *     build's full chapter. The film block and the entire Google-reviews block
 *     never imported, and the story shot came across as an empty <video> where
 *     the local build has an <img>. Rebuilt here.
 *  3. Standard and Proof are in the wrong order. Local runs standard(6) then
 *     proof(7); Instatic had proof then standard. Re-ordered.
 *
 * Written in INSTATIC's class idiom (`film`, `copy`, `story`, `shot`, `qm`),
 * which is the pre-2026-08-17 vocabulary. All of that CSS survived the import;
 * only `.rv-card` and its descendants were purged, because Instatic strips
 * "unused" rules at publish and the markup that used them was never there. Those
 * rules are re-added to the runtime-states.css code asset.
 *
 * VIDEO CAVEAT: the local build's film block uses `broll.mp4`, which is not on
 * Instatic, and `media_upload` accepts images only (JPEG/PNG/GIF/WebP/SVG). The
 * practice's other b-roll, already uploaded as `hero.mp4`, is used instead. Both
 * are the practice's own footage, but this is a deliberate difference from local
 * and needs either a manual upload of broll.mp4 or a decision to keep it.
 */
import fs from 'node:fs';
import path from 'node:path';
import { callJson } from './instatic-mcp.mjs';

const SPECIALIST_DUP = 'njtonOam3Gg1fuwf8h_Qp';
const PROOF = 'hDot4eHili4PWzbViTdQe';
const STANDARD = 'ls3pGs9sTSjefWpOaHw50';
const MAIN = 'eKW2fsbSjHBRTiWOjy74d';
const HERO_VIDEO = '/uploads/xCmOoUcLD2QGVlsVDmjhf-hero.mp4';
const STORY_IMG = '/uploads/IVIceiP24vjESAjbNDGJg-patient-story.jpg';

const problems = [];
let ok = 0;
const step = async (label, fn) => {
  try { await fn(); ok++; console.log(`  ${label}`); }
  catch (e) { problems.push(`${label}: ${e.message.slice(0, 200)}`); }
};
const guard = (r) => {
  if (r && typeof r.text === 'string' && !/^\s*(ok|done)/i.test(r.text)) throw new Error(r.text.slice(0, 160));
  return r;
};

// ---------------------------------------------------------------- 1. google mark
let googlePath = null;
await step('google.svg uploaded', async () => {
  const p = path.resolve(import.meta.dirname, '..', '..', '04-design', '.tmp', 'site-src', 'assets', 'google.svg');
  const r = await callJson('media_upload', {
    filename: 'google.svg',
    data: fs.readFileSync(p).toString('base64'),
    altText: 'Google',
  });
  if (!r.publicPath) throw new Error(JSON.stringify(r).slice(0, 160));
  googlePath = r.publicPath;
  console.log(`     -> ${googlePath}`);
});

// ---------------------------------------------------------------- 2. card CSS
const CARD_CSS = `

/* --------------------------------------------------------------------------
   REVIEW CARDS (restored 2026-08-18)
   .rv-head / .rv-score / .rv-grid / .rv-stars / .rv-av / .rv-more / .rv-play
   all survived the original import, but every .rv-card rule was purged: the
   markup that used them never made it across, and Instatic strips CSS it
   believes is unused. Re-added with the reviews block itself.
   -------------------------------------------------------------------------- */
.rv-card { background: var(--black); padding: clamp(1.35rem, 2.2vw, 1.9rem); display: grid; gap: .9rem; align-content: start; transition: background .4s ease; }
.rv-card:hover { background: var(--ink-800); }
.rv-card p { color: rgba(255,255,255,.78); font-weight: 300; font-size: .94rem; line-height: 1.75; }
.rv-card footer { display: flex; align-items: center; gap: .7rem; font-size: .85rem; color: #fff; padding-top: .9rem; border-top: 1px solid rgba(255,255,255,.09); }
.rv-card footer i { margin-left: auto; font-style: normal; font-size: .66rem; letter-spacing: .14em; text-transform: uppercase; color: rgba(255,255,255,.58); }
.rv-card:hover .rv-play { background: var(--gold); }
.rv-card:hover .rv-play::after { border-left-color: var(--black); }
`;

await step('.rv-card CSS installed', async () => {
  const PATHCSS = 'src/styles/runtime-states.css';
  const cur = await callJson('site_read_code_asset', { path: PATHCSS });
  if ((cur.content || '').includes('.rv-card {')) { console.log('     (already present)'); return; }
  const ANCHOR = '.pg-hero .ph-meta b, .pg-hero .ph-meta span { display: block; }';
  if (!(cur.content || '').includes(ANCHOR)) throw new Error('anchor not found in stylesheet');
  await callJson('site_patch_code_asset', {
    path: PATHCSS, expectedHash: cur.hash,
    replacements: [{ oldText: ANCHOR, newText: ANCHOR + CARD_CSS }],
  });
  const after = await callJson('site_read_code_asset', { path: PATHCSS });
  if (!(after.content || '').includes('.rv-card {')) throw new Error('not present after patch');
});

// ---------------------------------------------------------------- 3. proof rebuild
const card = (href, quote, initial, name, film) =>
  `<a class="rv-card${film ? ' rv-film' : ''}" href="${href}">`
  + '<span class="rv-stars" aria-hidden="true">&#9733;&#9733;&#9733;&#9733;&#9733;</span>'
  + `<p>${film ? '<span class="rv-play" aria-hidden="true"></span>' : ''}${quote}</p>`
  + `<footer><span class="rv-av">${initial}</span>${name}<i>Filmed story</i></footer></a>`;

const PROOF_HTML =
  `<div class="film" id="proofFilm">`
  + `<video id="film" src="${HERO_VIDEO}" muted loop playsinline preload="metadata" aria-label="Inside the practice"></video>`
  + '<div class="copy"><div>'
  + '<h2 id="filmTitle">Experience, skill and dental artistry.</h2>'
  + '<p id="filmSub">Dr. Esam Nahlah, D.D.S., M.S., Diplomate of the American Board of Prosthodontics, practising in Northern Virginia since 2013.</p>'
  + '</div></div></div>'

  + '<div class="wrap section nala-section">'
  + '<div class="chapter-tag"><i></i><span class="label">Chapter 07 &middot; The Proof</span></div>'
  + '<div class="story">'
  + `<div class="shot" id="storyShot"><img id="storyImg" src="${STORY_IMG}" alt="A patient holding a framed photograph of her smile before treatment" loading="lazy"></div>`
  + '<div id="storyCopy"><span class="qm">&ldquo;</span>'
  + '<blockquote>My smile held me back. That&rsquo;s behind me now.</blockquote>'
  + '<cite>Melanie &middot; Full-Arch Implant Patient</cite></div>'
  + '</div>'

  // The 5.0 here is the practice's own published Google average. Chapter 02's
  // rating stat and the Patient Stories page were corrected to 4.9 by the client
  // on 2026-08-10 but this block was left at 5.0 in the local build, so it is
  // left at 5.0 here too. Still worth resolving with the client either way.
  + '<div class="reviews" id="reviews">'
  + '<div class="rv-head"><div><h3>What patients say afterwards.</h3>'
  + '<p class="rv-sub">Six patients sat down on camera. Their words, not ours.</p></div>'
  + '<div class="rv-score">__GOOGLE__<div>'
  + '<b><span id="rvScore">5.0</span> <i class="rv-stars" aria-hidden="true">&#9733;&#9733;&#9733;&#9733;&#9733;</i></b>'
  + '<span>Google reviews &middot; both offices</span></div></div></div>'
  + '<div class="rv-grid" id="rvGrid">'
  + card('/patient-stories#melanie', '&ldquo;My smile held me back. That&rsquo;s behind me due to my dental implants.&rdquo;', 'M', 'Melanie', false)
  + card('/patient-stories#yolanda', '&ldquo;I haven&rsquo;t stopped smiling since I got my dental implants!&rdquo;', 'Y', 'Yolanda', false)
  + card('/patient-stories#stephen', '&ldquo;Dental implants completely changed my life.&rdquo;', 'S', 'Stephen', false)
  + card('/patient-stories#donita', 'Donita filmed her story at the practice. Watch it in her own words.', 'D', 'Donita', true)
  + card('/patient-stories#barbara', 'Barbara filmed her story at the practice. Watch it in her own words.', 'B', 'Barbara', true)
  + card('/patient-stories#couple', 'A couple treated together filmed their story. Watch it in their own words.', '&amp;', 'A couple', true)
  + '</div>'
  + '<a class="rv-more" href="/patient-stories">See every patient story <i></i></a>'
  + '</div></div>';

await step('Proof chapter rebuilt', async () => {
  const img = googlePath
    ? `<img src="${googlePath}" alt="Google" width="48" height="48" loading="lazy">`
    : '';
  const html = PROOF_HTML.replace('__GOOGLE__', img);
  guard(await callJson('site_replace_node_html', { nodeId: PROOF, html }));
  const back = (await callJson('site_get_node_html', { nodeId: PROOF })).html || '';
  const n = (back.match(/rv-card/g) || []).length;
  if (n < 6) throw new Error(`only ${n} review cards after write`);
});

// ---------------------------------------------------------------- 4. duplicate
await step('duplicate ch-specialist deleted', async () => {
  guard(await callJson('site_delete_node', { nodeId: SPECIALIST_DUP }));
});

// ---------------------------------------------------------------- 5. order
// After the delete, main's children are 0 arrival, 1 reality, 2 difference,
// 3 specialist, 4 transformation, 5 path, 6 proof, 7 standard, 8 invitation.
// Local runs standard before proof, so standard moves to 6.
await step('Standard moved before Proof', async () => {
  guard(await callJson('site_move_node', { nodeId: STANDARD, newParentId: MAIN, newIndex: 6 }));
});

console.log(`\n${ok}/5 steps`);
if (problems.length) { console.log('\nproblems:'); for (const p of problems) console.log('  ' + p); }
