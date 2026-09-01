// ===========================================================================
// LONG FORM — splitting a service page's body into readable sections.
//
// THE PROBLEM THIS SOLVES. The 35 treatment pages carry a median of 1,958
// words, and the previous template poured all of them into one column under a
// hero. The client's own note about the homepage applies here twice over: big
// chunks of text are not good for conversions. A visitor who arrived wanting to
// know what a root canal costs had to read 2,000 words to find out whether the
// page even mentions it.
//
// What makes that fixable is that the copy is ALREADY structured and the old
// template threw the structure away. Measured across the set: 479 <h3>, 244
// <h4>, 337 lists, 1,918 paragraphs. A median page has 13 headings and a
// maximum of 25. `normaliseHeadings` in build.mjs promotes the first level it
// meets to <h2>, so after the rewrite pipeline the section headings are <h2>.
//
// This module cuts the body at those headings so the page can be given a
// contents rail that tracks reading position, and so the first paragraphs can
// be lifted out as a lede rather than buried at the top of a wall.
//
// It does NOT rewrite, summarise or reorder the practice's words. Every
// character of the body comes out in the order it went in.
// ===========================================================================

/** Slug for an in-page anchor. Stable across builds, so a link into a section
 *  keeps working; deduped, because a page can repeat a heading. */
export function anchorId(text, used) {
  const base = String(text || "")
    .replace(/<[^>]+>/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "section";
  if (!used) return base;
  let id = base, n = 2;
  while (used.has(id)) id = `${base}-${n++}`;
  used.add(id);
  return id;
}

/**
 * Split rewritten body HTML at its top-level <h2> headings.
 *
 * Returns `{ lede, sections }` where `lede` is everything before the first
 * heading and each section is `{ id, title, html }`. `html` EXCLUDES the
 * heading itself, so the caller decides how to render it; `title` is the
 * heading's inner HTML with tags stripped, which matters because these
 * headings are usually wrapped in <b> or <strong> upstream.
 *
 * A page with no headings comes back as all lede and no sections, which is the
 * correct answer for the two stub pages that have 104 and 235 words.
 */
export function splitLongform(html) {
  const src = String(html || "");

  // WHICH LEVEL IS THE SECTION LEVEL? It is not the same on every page, and
  // assuming <h2> is what made 34 of 35 pages come back as one section.
  //
  // These bodies open with their own <h1> (the page title again, which the hero
  // already shows) and then use <h3> for sections. `demoteH1` turns that <h1>
  // into an <h2>, and once the caller drops it as a duplicate the shallowest
  // heading left is <h3>. Running `normaliseHeadings` over that does NOT fix it
  // either: that function clamps each heading to `prev + 1` walking forward, so
  // the FIRST <h3> becomes <h2> and every one after it stays <h3>. Splitting on
  // <h2> then finds exactly one section containing the whole page, which is the
  // original wall with an anchor bolted to it.
  //
  // So the level is detected rather than assumed: whichever of h2..h4 appears
  // shallowest and more than once is the section level.
  // NOTE ON THE ESCAPES BELOW. These patterns are built with `new RegExp` and a
  // template literal, so a backslash has to survive TWO layers: `\\b` here is
  // the two characters a regex needs. Written as `\b` inside a template literal
  // it is a BACKSPACE character, the pattern silently matches nothing, and
  // every page comes back with zero sections. That failure is invisible: the
  // build succeeds and the pages render, just without any structure.
  const countAt = (lvl) => (src.match(new RegExp("<h" + lvl + "\\b", "gi")) || []).length;

  let level = 0;
  for (const lvl of [2, 3, 4]) {
    if (countAt(lvl) >= 2) { level = lvl; break; }
  }
  if (!level) {
    for (const lvl of [2, 3, 4]) {
      if (countAt(lvl) >= 1) { level = lvl; break; }
    }
  }
  if (!level) return { lede: src.trim(), sections: [], level: 0 };

  const re = new RegExp("<h" + level + "\\b([^>]*)>([\\s\\S]*?)</h" + level + ">", "gi");
  const used = new Set();
  const sections = [];
  let lastEnd = 0;
  let lede = "";
  let match;
  let pending = null;

  while ((match = re.exec(src)) !== null) {
    const chunk = src.slice(lastEnd, match.index);
    if (pending) pending.html = chunk;
    else lede = chunk;
    const title = match[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    pending = { id: anchorId(title, used), title, html: "" };
    sections.push(pending);
    lastEnd = re.lastIndex;
  }
  if (pending) pending.html = src.slice(lastEnd);
  else lede = src;

  // Headings INSIDE a section are shifted up so the rendered order runs
  // h1 (hero) -> h2 (section) -> h3 (sub), whatever level they started at.
  // audit.mjs fails a page whose heading order skips a level.
  // A shift alone is not enough. A page that uses <h2> for sections and <h4>
  // for their sub-points has shift 0, so the sub-points stay at h4 and the
  // rendered order runs h2 -> h4, which audit.mjs fails as a skipped level.
  // Whatever levels a chunk actually contains are remapped onto a contiguous
  // run starting one below the heading the caller will print for the section.
  const reflow = (chunk, start) => {
    const present = [...new Set(
      (chunk.match(/<h([2-6])\b/gi) || []).map((t) => Number(t.slice(2, 3))),
    )].sort((a, b) => a - b);
    if (!present.length) return chunk;
    const map = new Map(present.map((lvl, i) => [lvl, Math.min(6, start + i)]));
    return chunk.replace(
      /<(\/?)h([2-6])\b/gi,
      (whole, slash, lvl) => `<${slash}h${map.get(Number(lvl)) || Number(lvl)}`,
    );
  };

  return {
    // The lede sits under the page's own <h1>, so anything in it starts at h2.
    // A section's contents sit under the <h2> or <h3> the caller prints for the
    // section itself, so they start one below that.
    lede: listifyBullets(reflow(lede, 2)).trim(),
    level,
    sections: sections
      .filter((sec) => sec.title && sec.html.replace(/<[^>]+>/g, "").trim())
      .map((sec) => ({ ...sec, html: listifyBullets(reflow(sec.html, 3)) })),
  };
}

/**
 * The first real sentence or two of the body, for use as a page lede.
 *
 * Taken from the lede chunk rather than written, and returned as plain text so
 * it can be set at display size without dragging <b> tags from the WordPress
 * source into a hero. Falls back to the page description, which is the
 * practice's own meta copy, and then to nothing: an invented sentence about a
 * medical treatment is not an acceptable fallback.
 */
export function ledeText(lede, description, max = 260) {
  const flat = String(lede || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const source = flat || String(description || "").trim();
  if (!source) return "";
  if (source.length <= max) return source;
  const cut = source.slice(0, max);
  const stop = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  return stop > 80 ? cut.slice(0, stop + 1) : cut.replace(/\s+\S*$/, "") + "…";
}

// ===========================================================================
// ROUTING A PAGE'S OWN SECTIONS INTO A CONVERSION FLOW.
//
// The information flow comes from the reference page the client's team called
// "basically the perfect flow of information for a service page"
// (01-content-intake/.tmp/preview.html). Its twelve beats are: hero, trust,
// IS THIS YOU, proof, expertise, process, comparison, cost, reviews, a soft
// conversion for people not ready to book, questions, and the final call.
//
// The design and layout stay in this build's own direction. What is copied is
// the ORDER, because the order is the argument: qualify the reader, show the
// result, explain who does it, say what happens, compare the alternatives,
// give the price, prove it, then ask.
//
// NOTHING HERE IS WRITTEN. Every section is the practice's own copy, moved to
// the position in the flow where it does the most work. Measured across the 35
// treatment pages: 472 sections, of which 116 are question-shaped on 32 of the
// pages, 51 describe a process on 25, and smaller sets cover cost, comparison,
// types and candidacy. A page that has nothing for a beat simply does not get
// that beat; no chapter is invented to fill a hole.
//
// Order matters in the table below: the first pattern that matches wins, so
// "Who is Invisalign for?" is a QUALIFIER rather than a question, because on
// this flow it belongs near the top and not in the accordion at the bottom.
// ===========================================================================
const SECTION_PATTERNS = [
  ["qualifier", /\b(who is|who are|who should|is .{0,30}right for|are you a|candidate|when is|when do you|when should|signs?\b|symptoms?\b|do i need)\b/i],
  ["cost",      /\b(cost|costs|price|pricing|afford|insurance|financ\w*|payment|how much)\b/i],
  ["compare",   /\b(vs\.?|versus|compared to|comparison|alternatives?|difference between)\b/i],
  ["process",   /\b(procedure|process|what to expect|step[- ]by[- ]step|how .{0,40}works?|how (does|do|we)|during (the|your)|after ?care|recovery|healing|your (first )?(visit|appointment))\b/i],
  ["benefit",   /\b(benefits?|advantages?|why (choose|consider|it matters))\b/i],
  ["type",      /\b(types? of|kinds? of|options|which \w+)\b/i],
  ["question",  /\?\s*$/],
];

/**
 * An FAQ that was written as body copy rather than as headings.
 *
 * Found on the Invisalign page and shaped like this, which is how a WordPress
 * editor types an FAQ when the theme gives them no accordion:
 *
 *     <h3><b>Frequently Asked Questions (FAQs)</b></h3>
 *     <p><strong>1.How long does treatment take?</strong><br> Most patients…</p>
 *     <p><strong>2.Can I eat and drink…?</strong><br> You should remove…</p>
 *
 * The heading routes to `question` on its own, but the six questions under it
 * are one section and render as a wall — which is the whole problem this pass
 * exists to fix, reappearing inside the fix. Splitting them turns the section
 * into six accordion rows of the practice's own words.
 *
 * Returns `null` unless the section really looks like this, so an ordinary
 * paragraph that happens to open with a bold lead-in is left alone.
 */
export function extractInlineFaq(section) {
  if (!section) return null;
  if (!/frequently asked|^faqs?\b|\bfaqs\b/i.test(section.title || "")) return null;

  const items = parseFaqRun(section.html);
  // Two is a coincidence; three is a list.
  return items.length >= 3 ? items : null;
}

/**
 * A list that was typed as paragraphs with a glyph in front of each one.
 *
 * Five of the 35 pages do this, 35 paragraphs in total, and Invisalign is the
 * worst of them: a dozen consecutive `<p>✅ <strong>Label</strong> – text</p>`
 * runs that render as one dense block because nothing about them is a list
 * except the character the editor typed.
 *
 * The glyph IS the bullet, so replacing it with a real list marker is a
 * formatting repair rather than a change to the practice's words: no text is
 * added, removed or reordered, and the only character dropped is the one the
 * list marker replaces.
 */
export function listifyBullets(html) {
  const GLYPH = /^\s*(?:&nbsp;|\s)*[✅✔✓▪•➤→]\s*/;

  // SHAPE TWO, and the more common one: not a run of paragraphs but a SINGLE
  // paragraph whose lines are separated by <br>. Invisalign's "ideal for" list
  // is one <p> holding four ✅ lines, so a paragraph-level pass cannot see it
  // and the glyphs render as literal text in the middle of the prose. Split the
  // paragraph on its breaks first; if two or more of the resulting lines carry
  // a glyph, the paragraph was a list all along.
  const splitOnBreaks = (chunk) => chunk.replace(
    /<p\b[^>]*>([\s\S]*?)<\/p>/gi,
    (whole, inner) => {
      if (!/<br\s*\/?>/i.test(inner)) return whole;
      const lines = inner.split(/<br\s*\/?>/i).map((s) => s.trim()).filter(Boolean);
      const ticked = lines.filter((s) => GLYPH.test(s.replace(/<[^>]+>/g, "").trimStart()));
      if (ticked.length < 2 || ticked.length !== lines.length) return whole;
      return `<ul class="lf-ticks">${lines
        .map((s) => `<li>${s.replace(GLYPH, "")}</li>`)
        .join("")}</ul>`;
    },
  );

  const parts = splitOnBreaks(String(html || "")).split(/(<p\b[^>]*>[\s\S]*?<\/p>)/i);
  const out = [];
  let run = [];
  const flush = () => {
    if (!run.length) return;
    // One glyph on its own is an ornament, not a list.
    out.push(run.length >= 2
      ? `<ul class="lf-ticks">${run.map((t) => `<li>${t}</li>`).join("")}</ul>`
      : `<p>${run[0]}</p>`);
    run = [];
  };
  for (const part of parts) {
    const m = part.match(/^<p\b[^>]*>([\s\S]*?)<\/p>$/i);
    if (m && GLYPH.test(m[1].replace(/<[^>]+>/g, "").trimStart())) {
      run.push(m[1].replace(GLYPH, "").replace(/^(\s*<(?:strong|b)\b[^>]*>)\s*/i, "$1"));
      continue;
    }
    // Whitespace between two bulleted paragraphs must not break the run.
    if (run.length && !part.trim()) continue;
    flush();
    out.push(part);
  }
  flush();
  return out.join("");
}

/** The Q/A run itself, wherever it was found. */
function parseFaqRun(html) {
  const paras = String(html || "").match(/<p\b[^>]*>[\s\S]*?<\/p>/gi) || [];
  const items = [];
  for (const p of paras) {
    const m = p.match(/<p\b[^>]*>\s*<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>\s*(?:<br\s*\/?>)?([\s\S]*?)<\/p>/i);
    if (!m) continue;
    const question = m[2].replace(/<[^>]+>/g, "")
      // The editor's non-breaking spaces come through as entities and the
      // caller escapes the title again, so an untreated one renders as the
      // literal text "&nbsp; Does dental insurance cover…" in the accordion.
      .replace(/&nbsp;?/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/\s+/g, " ")
      .replace(/^\s*\d+\s*[.)]\s*/, "")
      .trim();
    const answer = m[3].trim();
    if (!question || !answer.replace(/<[^>]+>/g, "").trim()) continue;
    // NOT EVERY BOLD LEAD-IN IS A QUESTION. The same paragraph shape carries
    // "Location:" followed by an address and "Call us:" followed by a number,
    // which arrived in the accordion as rows nobody would ever open. A row has
    // to be a real question or at least a real sentence: ending in a colon, or
    // being shorter than a dozen characters, disqualifies it.
    if (/:\s*$/.test(question) || question.length < 12) continue;
    items.push({ question, html: answer });
  }
  return items;
}

/**
 * The same FAQ, but NESTED inside a section rather than being one.
 *
 * Whether a page's FAQ is its own section depends on which heading level that
 * page uses for sections. Invisalign uses <h2>, so its
 * `<h3>Frequently Asked Questions</h3>` sits INSIDE another section and
 * `extractInlineFaq` never sees it: the page came back with two accordion rows
 * while pages that happen to use <h3> for sections came back with twelve.
 *
 * Returns `{ before, items }` so the caller can keep the prose that preceded
 * the FAQ heading and lift the questions out of it.
 */
export function extractEmbeddedFaq(html) {
  const src = String(html || "");
  const m = src.match(/<h([2-6])\b[^>]*>(?:(?!<\/h\1>)[\s\S])*?(?:frequently asked|faqs?\b)[\s\S]*?<\/h\1>/i);
  if (!m) return null;
  const items = parseFaqRun(src.slice(m.index + m[0].length));
  if (items.length < 3) return null;
  return { before: src.slice(0, m.index).trim(), items };
}

/** Which beat a section belongs to. `body` is the default and the majority. */
export function classifySection(title) {
  const t = String(title || "").trim();
  const hit = SECTION_PATTERNS.find(([, re]) => re.test(t));
  return hit ? hit[0] : "body";
}

/**
 * Group a page's sections into the beats of the flow, preserving each beat's
 * internal order. Returns a plain object keyed by beat name.
 */
export function routeSections(sections) {
  const out = { qualifier: [], benefit: [], type: [], compare: [], process: [], cost: [], question: [], body: [] };
  for (const sec of sections || []) {
    const beat = classifySection(sec.title);
    (out[beat] || out.body).push(sec);
  }
  return out;
}

export default { splitLongform, ledeText, anchorId, classifySection, routeSections, extractInlineFaq, extractEmbeddedFaq, listifyBullets };
