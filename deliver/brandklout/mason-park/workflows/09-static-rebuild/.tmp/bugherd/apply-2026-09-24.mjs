// BugHerd round six (2026-09-24): the six photographs of plan-2026-09-24/
// G-open.json, for the notes whose attachment was empty (#112 #125 #185 #252)
// or repeated a photo already on the page (#178 #202). A copy of
// apply-2026-09-23.mjs with the plan folder moved; decisions.json is empty, and
// the #164 block at the end finds its three portraits already placed and does
// nothing. The #66 Cherry link was a hand edit to financing/index.html.
//
//   cd .tmp/bugherd && node frames-2026-09-24.mjs && node apply-2026-09-24.mjs
//
// WHAT DRIVES IT. plan-2026-09-24/<group>.json, one entry per note, written
// against plan-2026-09-24/BRIEF.md: the page, the section id, the card, the
// image in the slot now, and the album key of the new frame (frames-2026-09-24
// cut and registered them). Two kinds of placement:
//
//   replace     the <img> in that section whose src is the planned current
//               file is re-pointed at the new frame. Its sizes/loading/decoding
//               stay, because they belong to the slot, not the picture.
//   add-media   "use the same format as 01": a .svc-card_media block goes in
//               ahead of the card's body, exactly as #103 did on preventative.
//
// The hand edits (the Contact page's three doctors, the blog rail) are at the
// end. The CSS half (#158 #159 #201) is the round-five block at the foot of
// site.css.
import fs from "node:fs";
import path from "node:path";

const HERE = import.meta.dirname;
const ROOT = path.join(HERE, "..", "..");
const HOME = path.join(ROOT, "home");
const DIR = path.join(HERE, "plan-2026-09-24");
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, ".tmp", "album-manifest.json"), "utf8"));
const SKIP = new Set(JSON.parse(fs.readFileSync(path.join(DIR, "decisions.json"), "utf8")).skip.map(String));

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
const srcset = (m, p) => m.sizes.map((s) => `${p}${s.file} ${s.w}w`).join(", ");
function imgTag(key, prefix, { sizes, loading = "lazy", alt } = {}) {
  const m = manifest[key];
  if (!m) throw new Error(`no manifest entry: ${key}`);
  const big = m.sizes[m.sizes.length - 1];
  const p = `${prefix}assets/uploads/2026/09/`;
  return `<img src="${p}${big.file}" srcset="${srcset(m, p)}" sizes="${sizes}" alt="${esc(alt ?? m.alt)}" width="${big.w}" height="${big.h}" loading="${loading}" decoding="async">`;
}
// Re-point an existing tag at a new frame, keeping every attribute of the slot.
function repoint(tag, key, alt) {
  const m = manifest[key];
  if (!m) throw new Error(`no manifest entry: ${key}`);
  const big = m.sizes[m.sizes.length - 1];
  // The page's relative prefix, but always the folder the new frames are in:
  // a few old frames (/our-services/'s HS-8) live under uploads/2023/11/.
  const dir = tag.match(/\ssrc="([^"]*\/)[^"/]*"/)[1].replace(/uploads\/\d{4}\/\d{2}\/$/, "uploads/2026/09/");
  const set = (t, a, v) => (new RegExp(`\\s${a}="[^"]*"`).test(t) ? t.replace(new RegExp(`\\s${a}="[^"]*"`), ` ${a}="${v}"`) : t.replace(/^<img/, `<img ${a}="${v}"`));
  let t = tag;
  t = set(t, "src", `${dir}${big.file}`);
  t = set(t, "srcset", srcset(m, dir));
  t = set(t, "alt", esc(alt ?? m.alt));
  t = set(t, "width", String(big.w));
  t = set(t, "height", String(big.h));
  return t;
}
const prefixOf = (page) => "../".repeat(page.split("/").filter(Boolean).length);
const fileOf = (page) => path.join(HOME, ...page.split("/").filter(Boolean), "index.html");

// The span of <section ... id="ID"> ... </section> (sections do not nest here).
function sectionSpan(html, id) {
  // By id; a few chapters (the About/Doctors pair) carry only a class.
  const m = new RegExp(`<section\\b[^>]*\\sid="${id}"`).exec(html)
    || new RegExp(`<section\\b[^>]*\\sclass="[^"]*\\b${id}\\b[^"]*"`).exec(html);
  if (!m) return null;
  const end = html.indexOf("</section>", m.index);
  return [m.index, end];
}
// The spans of the grid's cards in a section.
function cardSpans(html, [a, b], open = '<article class="svc-card') {
  const out = [];
  let i = html.indexOf(open, a);
  while (i >= 0 && i < b) {
    const e = html.indexOf("</article>", i);
    out.push([i, e]);
    i = html.indexOf(open, e);
  }
  return out;
}

const log = [];
const pages = new Map();                          // page -> html, written once at the end
const get = (page) => { if (!pages.has(page)) pages.set(page, fs.readFileSync(fileOf(page), "utf8")); return pages.get(page); };
const put = (page, html) => pages.set(page, html);

function place(p) {
  const tag = `#${p.n ?? "fill"} ${p.page} ${p.section}${p.card ? ` card ${p.card}` : ""}`;
  if (!manifest[p.key]) throw new Error(`${tag}: frame ${p.key} was never cut`);
  let html = get(p.page);
  const newBase = manifest[p.key].sizes.at(-1).file;
  const span = sectionSpan(html, p.section);
  if (!span) throw new Error(`${tag}: no section #${p.section}`);
  const sec = html.slice(...span);

  if (p.action === "add-media") {
    const cards = cardSpans(html, span);
    const c = cards[p.card - 1];
    if (!c) throw new Error(`${tag}: no card ${p.card} (of ${cards.length})`);
    const card = html.slice(...c);
    if (card.includes(newBase)) return log.push(`done ${tag}`);
    if (card.includes("svc-card_media")) throw new Error(`${tag}: card already has a photo`);
    if (p.cardName && !card.includes(p.cardName.replace(/&/g, "&amp;")) && !card.includes(p.cardName)) {
      log.push(`WARN ${tag}: card name "${p.cardName}" not found in the card`);
    }
    const sizes = cards.length === 4 ? "(max-width: 899px) 100vw, 25vw" : "(max-width: 899px) 100vw, 33vw";
    const media = `<div class="svc-card_media" data-el="mask">${imgTag(p.key, prefixOf(p.page), { sizes, alt: p.alt })}</div>\n        `;
    const at = card.indexOf('<div class="svc-card_body">');
    if (at < 0) throw new Error(`${tag}: no svc-card_body`);
    put(p.page, html.slice(0, c[0] + at) + media + html.slice(c[0] + at));
    return log.push(`add  ${tag} <- ${p.key}`);
  }

  // replace
  if (sec.includes(newBase)) return log.push(`done ${tag}`);
  const tags = [...sec.matchAll(/<img\b[^>]*>/g)].filter((m) => m[0].includes(`/${p.current}"`));
  let hit;
  if (tags.length === 1) hit = tags[0];
  else if (tags.length > 1 && p.card) {
    const opens = [['<article class="svc-card'], ['<article class="pa-card'], ['<li class="rg-item'], ['<figure class="el-wall_photo']];
    for (const [open] of opens) {
      const c = cardSpans(html, span, open)[p.card - 1];
      if (c) { hit = tags.find((m) => span[0] + m.index > c[0] && span[0] + m.index < c[1]); if (hit) break; }
    }
  }
  if (!hit) throw new Error(`${tag}: ${tags.length} <img> of ${p.current} in #${p.section}`);
  const at = span[0] + hit.index;
  put(p.page, html.slice(0, at) + repoint(hit[0], p.key, p.alt) + html.slice(at + hit[0].length));
  log.push(`swap ${tag} ${p.current} -> ${p.key}`);
}

const plans = fs.readdirSync(DIR).filter((f) => /^[A-Z]-.*\.json$/.test(f) && !f.includes("targets"))
  .flatMap((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")));
// Replacements before additions, and within a page in card order, so a card
// index never refers to a grid that an earlier edit already changed.
plans.sort((a, b) => (a.action === "add-media") - (b.action === "add-media"));
let errors = 0;
for (const p of plans) {
  if (!["replace", "add-media"].includes(p.action)) continue;
  if (p.n != null && SKIP.has(String(p.n))) { log.push(`skip #${p.n} (decisions.json)`); continue; }
  try { place(p); } catch (e) { errors++; log.push(`ERR  ${e.message}`); }
}

/* =======================================================================
   "The same for all pages" (#120, the invitation's photograph: the building)
   and "do the same for all the pages" (#179, the proof portrait: the front
   desk). decisions.json names the slot and the pages left out. Every other
   static page carrying that slot gets the note's frame; the blog's CMS pages
   take it through build-blog.mjs instead.
   ==================================================================== */
const decisions = JSON.parse(fs.readFileSync(path.join(DIR, "decisions.json"), "utf8"));
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? (e.name === "assets" || e.name === "blog" ? [] : walk(path.join(d, e.name))) : e.name === "index.html" ? [path.join(d, e.name)] : []);
const allPages = walk(HOME).map((f) => "/" + path.relative(HOME, path.dirname(f)).split(path.sep).filter(Boolean).join("/") + (f === path.join(HOME, "index.html") ? "" : "/"));
for (const [n, rule] of Object.entries(decisions.expand || {})) {
  const own = plans.find((p) => String(p.n) === n);
  if (!own || !manifest[own.key]) { errors++; log.push(`ERR  expand #${n}: no frame`); continue; }
  const open = rule.slot === "iv-shot" ? /<figure class="iv-shot"[^>]*>\s*(<img\b[^>]*>)/ : /<div class="pr-portrait"[^>]*>\s*(<img\b[^>]*>)/;
  let count = 0;
  for (const page of allPages) {
    if (page === own.page || rule.except.includes(page)) continue;
    const html = get(page);
    const m = open.exec(html);
    if (!m || m[1].includes(manifest[own.key].sizes.at(-1).file)) continue;
    const at = m.index + m[0].length - m[1].length;
    let next = html.slice(0, at) + repoint(m[1], own.key, own.alt) + html.slice(at + m[1].length);
    // The invitation's caption described the interior it used to show.
    if (rule.caption) {
      const end = next.indexOf("</figure>", at);
      const fig = next.slice(at, end).replace(/<figcaption>[^]*?<\/figcaption>/, `<figcaption>${rule.caption}</figcaption>`);
      next = next.slice(0, at) + fig + next.slice(end);
    }
    put(page, next);
    count++;
  }
  log.push(`#${n} expanded to ${count} more pages (${rule.slot})`);
}

/* =======================================================================
   #164  Contact, "Three doctors, one building": every doctor card in the
   format of the first, each with that doctor's own front-facing portrait.
   Portraits are 3:4, so the three cards take the grid's portrait variant
   (.svc-card.is-shot), which the stylesheet already carries.
   ==================================================================== */
{
  const page = "/contacts/";
  let html = get(page);
  const span = sectionSpan(html, "who");
  const cards = cardSpans(html, span);
  const docs = [["Dr. William Sung", "dr-sung-standing-2"], ["Dr. Dave Cho", "dr-cho-portrait"], ["Dr. Tam Nguyen", "dr-nguyen-portrait-2"]];
  // Walk backwards so earlier offsets stay valid.
  for (let i = cards.length - 1; i >= 0; i--) {
    let card = html.slice(...cards[i]);
    const [name, key] = docs.find(([n]) => card.includes(n)) || [];
    if (!key) throw new Error(`#164: card ${i + 1} is none of the three doctors`);
    if (card.includes(manifest[key].sizes.at(-1).file)) continue;
    const media = `<div class="svc-card_media" data-el="mask">${imgTag(key, "../", { sizes: "(max-width: 899px) 100vw, 33vw", alt: manifest[key].alt })}</div>\n        `;
    card = card.replace(/<div class="svc-card_media"[^]*?<\/div>\s*/, "");
    card = card.replace('<article class="svc-card"', '<article class="svc-card is-shot"');
    card = card.replace('<div class="svc-card_body">', `${media}<div class="svc-card_body">`);
    html = html.slice(0, cards[i][0]) + card + html.slice(cards[i][1]);
    log.push(`#164 ${name} <- ${key}`);
  }
  put(page, html);
}

for (const [page, html] of pages) {
  const f = fileOf(page);
  if (fs.readFileSync(f, "utf8") !== html) { fs.writeFileSync(f, html); log.push(`wrote ${path.relative(HOME, f)}`); }
}
console.log(log.join("\n"));
console.log(`${errors} errors`);
process.exit(errors ? 1 : 0);
