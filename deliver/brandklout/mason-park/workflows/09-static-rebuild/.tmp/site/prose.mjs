// ===========================================================================
// PROSE REPAIR — the "no wall of text" rule, enforced at build time.
//
// THE RULE (DESIGN-STANDARD.md, "No wall of text"). A treatment page may not
// render an undifferentiated block of body copy. The client's note on
// /services/invisalign/ was blunt about why: "These chunks of text are not good
// for conversions or user experience at all."
//
// WHAT CHANGED FROM THE PREVIOUS PASS. site/longform.mjs opens by promising
// that it "does NOT rewrite, summarise or reorder the practice's words", and it
// still does not — no word on these pages is written, paraphrased or moved by
// this module either. What this module adds is REMOVAL and RE-TAGGING, which
// are different acts and are both safe on clinical copy:
//
//   - removal   drops a paragraph that carries no information (a bare "call us
//               today", a naked "Learn more"), never one that carries a fact.
//   - re-tagging changes what a sentence IS in the markup, not what it says: a
//               heading the editor typed as bold text becomes a heading, and a
//               list lead-in the editor typed as a heading becomes a lead-in.
//
// The re-tagging is what does most of the work, because these walls are mostly
// several real sections that WordPress flattened into one. Promoting the
// headings back splits the wall into sections the flow can route separately.
//
// EVERY RULE HERE IS HIGH PRECISION ON PURPOSE. Measured across the 35
// treatment pages there are 1,917 paragraphs; a rule that is 95% right still
// deletes ~95 paragraphs of a real practice's clinical copy. Where a pattern
// was ambiguous the rule declines to fire. The counters returned by
// `repairProse` are what proves that, and build.mjs prints them.
// ===========================================================================

/** Prose words allowed in one unbroken run of paragraphs before the tail is
 *  folded away. Four short paragraphs. Lists, headings, figures and tables all
 *  reset the run, because those are the things that make a page scannable and
 *  the ceiling exists to force them. */
export const PROSE_RUN_CEILING = 110;

/** Below this, folding costs more than it saves: a disclosure holding two
 *  sentences is worse than the two sentences. */
const MIN_FOLD = 45;

const textOf = (html) => String(html || "")
  .replace(/<[^>]+>/g, " ")
  .replace(/&nbsp;?/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/\s+/g, " ")
  .trim();

const wordsIn = (html) => {
  const t = textOf(html);
  return t ? t.split(/\s+/).length : 0;
};

// ------------------------------------------------------------------ removal
// A sentence that asks the reader to make contact and says nothing else. The
// page already carries four real calls to action — the hero button, the sticky
// header, the invitation chapter and the footer — so an inline repeat of one is
// a paragraph the reader has to skip on the way to the answer they came for.
const CTA_SENTENCE = new RegExp(
  "\\b(?:" +
  "call (?:us|the (?:office|practice)|today|now)" +
  "|(?:schedule|book|request|reserve) (?:your|a|an|the) (?:appointment|consultation|visit|exam|cleaning|call)" +
  "|contact (?:us|mason park|our (?:office|team))" +
  "|get in touch" +
  "|reach out to (?:us|our)" +
  "|(?:visit|come see) us (?:today|now)" +
  "|ask (?:us )?about our" +
  "|we look forward to (?:seeing|hearing|meeting|welcoming)" +
  "|don'?t wait" +
  "|take the first step" +
  "|let'?s get started" +
  "|book (?:online|now|today)" +
  ")\\b", "i",
);

// "Ready to transform your smile?" — a rhetorical opener whose only job is to
// introduce the call to action that follows it in the same paragraph.
const CTA_OPENER = /^\s*(?:so\s+)?(?:are you |is it )?ready to\b[^.!?]*\?\s*$/i;

// A paragraph whose entire content is a "go and read something else" link. Not
// the same as an inline link inside a sentence, which is left alone.
const STUB = /^(?:learn|find out|read|discover|explore|see)\s+(?:more|all)?\b/i;

// The address and phone, repeated inline. Both are in the header, the
// invitation chapter and the footer of every page.
const CONTACT_ONLY = /^(?:visit|find|call|contact|reach)\s+us\b[\s\S]{0,150}$/i;

const sentences = (t) => t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);

/**
 * Is this paragraph pure call-to-action, with no fact in it?
 *
 * EVERY sentence has to be one, which is the check that keeps the rule off
 * copy like "When you schedule your appointment for Airflow teeth cleaning you
 * are investing in more than a beautiful smile — you are supporting your
 * overall health." That paragraph opens on a CTA verb and then says something,
 * so it stays.
 */
const isDeadCta = (t) => {
  if (t.length > 240) return false;
  const ss = sentences(t);
  if (!ss.length) return false;
  return ss.every((s) => CTA_SENTENCE.test(s) || CTA_OPENER.test(s));
};

// ------------------------------------------------------------ the SEO coda
// The paragraph that closes a section by saying the section again with the
// search terms in it: "If you're searching for Invisalign treatment in Katy,
// TX, Mason Park Dental provides personalized treatment plans to ensure the
// best results for your smile." It was written for a crawler and it costs a
// reader the last four lines of every section.
//
// THE TELL IS THE PAIR, not the phrasing. Requiring the practice's name AND
// the town in the same conditional sentence is what separates these from the
// clinically real sentences that open identically — "If you're undergoing oral
// sedation or IV sedation, we may advise you to fast for a few hours before
// your appointment" names neither, and stays. Measured over the 35 pages: 45
// paragraphs open this way, the pair narrows it to 10, and all 10 are codas.
// Loosening either half puts sedation instructions in the bin, so do not.
const CODA_OPEN = /^(?:if you(?:'|’)?re\b|if you are\b|whether you(?:'|’)?re\b|whether you are\b|no matter\b|for (?:those|anyone|patients) (?:looking|seeking|considering)\b)/i;
const CODA_PRACTICE = /\b(?:mason park|dr\.? (?:william )?sung|our (?:team|practice|office))\b/i;
const CODA_CITY = /\bkaty\b/i;

const isSeoCoda = (t) =>
  t.length <= 280 && !/:\s*$/.test(t) &&
  CODA_OPEN.test(t) && CODA_PRACTICE.test(t) && CODA_CITY.test(t);

const isDead = (html) => {
  const t = textOf(html);
  if (!t) return true;                                   // empty or &nbsp; only
  if (t.length <= 90 && STUB.test(t)) return true;        // "Learn more about X"
  if (t.length <= 160 && CONTACT_ONLY.test(t) && /\d{3}/.test(t)) return true;
  if (isSeoCoda(t)) return true;
  return isDeadCta(t);
};

// ---------------------------------------------------------------- re-tagging
// A run of `<p>` in a WordPress body is not reliably a paragraph. Two shapes
// recur across these 35 pages and both of them are structure the editor had no
// button for:
//
//   <p><strong>When Should You Consider Invisalign?</strong></p>   a heading
//   <h3><b>Invisalign is ideal for:</b></h3><ul>…                  a lead-in
//
// The first flattens a page's sections into one; the second inflates a list
// label into a section. Fixing both is what turns the Invisalign "Why choose"
// wall — 1,643px tall — into two ordinary sections.

/** Heading-shaped: long enough to be a title, short enough not to be a
 *  sentence, and either a question or several words. One and two word bold
 *  paragraphs are comparison-table cells ("Feature", "Veneers") on four of the
 *  pages, and promoting those invents sections nobody wrote. */
const isHeadingShaped = (t) => {
  const clean = t.replace(/^[\s❓✅✔✓▪•➤→]+/, "").replace(/^\d+\s*[.)]\s*/, "").trim();
  if (clean.length < 12 || clean.length > 100) return false;
  if (/[.!]$/.test(clean)) return false;                  // a sentence, not a title
  return /\?$/.test(clean) || clean.split(/\s+/).length >= 4;
};

const cleanHeading = (t) => t
  .replace(/^[\s❓✅✔✓▪•➤→]+/, "")
  .replace(/^\d+\s*[.)]\s*/, "")
  .trim();

/**
 * A LABELLED LIST the editor typed as a run of paragraphs.
 *
 *     <p><b>Custom Fit</b><br> Every mouth is different, and a one-size-fits-all
 *        solution simply won't do…</p>
 *     <p><b>Durable Materials</b><br> Made from professional grade…</p>
 *
 * Six of those in a row is a list of six things with six labels, and it renders
 * as 250 words of solid column because the only thing marking it as a list is
 * the bold run-in the editor typed. Five runs across the 35 pages, 23 items.
 *
 * WHY THIS MATTERS MORE THAN IT LOOKS. Without this rule the ceiling catches
 * these runs and folds them away — and folding a scannable list because it is
 * long is strictly worse than showing it. /services/night-guards/ was hiding
 * exactly this behind "Read the full detail". Convert first, fold second: a run
 * that becomes a list is no longer a prose run at all.
 *
 * IT MUST NOT EAT AN FAQ. `parseFaqRun` recognises the same `<p><b>…</b><br>…`
 * shape, and 143 questions on 24 pages arrive in it. The two are separated by
 * what the label IS: a question ends in "?" and tends to be long, a list label
 * does not and is short. Requiring no question mark and at most 40 characters
 * keeps them disjoint — do not loosen either half without re-checking the FAQ
 * count on the built pages.
 */
export function listifyLabelled(html) {
  const SHAPE = /^<p\b[^>]*>\s*<(strong|b)\b[^>]*>([\s\S]{2,60}?)<\/\1>\s*(?:<(?:strong|b)\b[^>]*>\s*)?(?:<br\s*\/?>)\s*(?:<\/(?:strong|b)>)?([\s\S]+)<\/p>$/i;
  const parts = String(html || "").split(/(<p\b[^>]*>[\s\S]*?<\/p>)/i);
  const out = [];
  let run = [];

  const flush = () => {
    if (run.length >= 3) {
      out.push(`<ul class="lf-ticks">${run
        .map((r) => `<li><b>${r.label}</b> ${r.body}</li>`)
        .join("")}</ul>`);
    } else {
      out.push(...run.map((r) => r.raw));
    }
    run = [];
  };

  for (const part of parts) {
    const m = part.match(SHAPE);
    if (m) {
      const label = m[2].replace(/<[^>]+>/g, "").replace(/&nbsp;?/gi, " ").replace(/\s+/g, " ").trim();
      const body = m[3].replace(/^\s*(?:<\/(?:strong|b)>)?\s*/i, "").trim();
      if (label && label.length <= 40 && !/\?$/.test(label) && !/^\d+\s*[.)]/.test(label) && body) {
        run.push({ label, body, raw: part });
        continue;
      }
    }
    // Whitespace between two items must not break the run.
    if (run.length && !part.trim()) continue;
    flush();
    out.push(part);
  }
  flush();
  return out.join("");
}

/**
 * ELEMENTOR'S LEFTOVER WRAPPERS, removed.
 *
 * A `text-editor` widget nests its paragraphs six divs deep, and `rewrite`
 * strips the attributes off those divs without removing the divs themselves —
 * so a rewritten body arrives as `<div><div><p>…</p><p>…</p></div></div>`.
 *
 * THIS IS WHY IT MATTERS, and it is the same shape of bug as the brace count in
 * the runbook: a wrapper the reader cannot see still SEPARATES BLOCKS as far as
 * any structural pass is concerned. With the divs in place, every rule below
 * sees one container instead of fourteen paragraphs, the ceiling never fires,
 * and the build reports success on a page that is still a wall. /what-is-tmj/
 * kept a 404 word run through the first version of this module for exactly that
 * reason.
 *
 * WHICH WRAPPERS GO. A `<div>` or `<section>` carrying no `class`, `id` or
 * `style` — so either nothing at all, or nothing but Elementor's own `data-id`,
 * `data-element_type` and `data-widget_type` bookkeeping. Everything this build
 * authors is addressed by a class, so the rule cannot reach our own markup, and
 * `rewrite`'s `<div class="overflow-scroll-x">` around a table survives.
 *
 * Openers are matched to their OWN closing tag through a stack. Pairing them by
 * position rather than by a lazy regex is the whole point: these wrappers nest
 * six deep and a lazy match closes on the wrong one.
 */
export function unwrapLayoutWrappers(html) {
  const src = String(html || "");
  const drop = new Set();
  const stack = [];
  const re = /<(div|section)\b([^>]*)>|<\/(div|section)\s*>/gi;
  let m;
  while ((m = re.exec(src)) !== null) {
    if (m[3]) {
      const open = stack.pop();
      if (open && open.layoutOnly) { drop.add(open.at); drop.add(m.index); }
    } else {
      stack.push({ at: m.index, layoutOnly: !/\s(?:class|id|style)\s*=/i.test(m[2] || "") });
    }
  }
  if (!drop.size) return src;
  let out = "", last = 0;
  re.lastIndex = 0;
  while ((m = re.exec(src)) !== null) {
    if (!drop.has(m.index)) continue;
    out += src.slice(last, m.index);
    last = m.index + m[0].length;
  }
  return out + src.slice(last);
}

/** The container tags a scan has to follow into rather than matching lazily. */
const CONTAINER = /^(?:div|section|blockquote|figure|table|details|ul|ol)$/;

/**
 * Split HTML into top level blocks, keeping every byte. Anything that is not a
 * recognised block (stray text, a comment) comes back as its own part, so
 * joining the result reproduces the input exactly.
 *
 * NESTING-AWARE, and it has to be. A lazy `<div>[\s\S]*?</div>` closes on the
 * FIRST `</div>` it meets, which for a nested wrapper is the wrong one: the
 * block boundaries come out scrambled and every pass downstream reads a
 * structure that is not on the page. That failure is silent — the HTML still
 * round-trips byte for byte, so nothing looks broken.
 */
const blocks = (html) => {
  const src = String(html || "");
  const out = [];
  const TAG = /<(\/?)([a-z][a-z0-9]*)\b[^>]*>/gi;
  let last = 0, m;
  while ((m = TAG.exec(src)) !== null) {
    if (m[1]) continue;                                  // a stray close tag
    const tag = m[2].toLowerCase();
    if (!/^(?:p|ul|ol|h[2-6]|figure|table|blockquote|div|section|details)$/.test(tag)) continue;
    if (/\/>$/.test(m[0])) continue;                     // self closing

    // Find this tag's own closing tag, counting the ones nested inside it.
    const close = new RegExp("</?" + tag + "\\b[^>]*>", "gi");
    close.lastIndex = TAG.lastIndex;
    let depth = 1, c, end = -1;
    while (depth > 0 && (c = close.exec(src)) !== null) {
      depth += c[0][1] === "/" ? -1 : 1;
      if (depth === 0) end = close.lastIndex;
    }
    if (end < 0) continue;                               // unbalanced: leave it

    if (m.index > last) out.push({ tag: null, html: src.slice(last, m.index) });
    out.push({ tag, html: src.slice(m.index, end) });
    last = end;
    TAG.lastIndex = end;
    if (!CONTAINER.test(tag)) continue;
  }
  if (last < src.length) out.push({ tag: null, html: src.slice(last) });
  return out;
};

const isBoldOnly = (html) =>
  /^<p\b[^>]*>\s*(?:<(?:strong|b)\b[^>]*>)[\s\S]*?<\/(?:strong|b)>\s*(?:&nbsp;|\s)*<\/p>\s*$/i.test(html.trim());

/** A heading or bold paragraph that ends in a colon and introduces a list is a
 *  LEAD-IN, not a section. Rendered as a heading it puts a type-scale jump and
 *  36px of margin between a label and the four bullets it labels. */
const isLeadIn = (t) => /:\s*$/.test(t) && t.length <= 120;

// ===========================================================================
/**
 * Repair one page body, before it is split into sections.
 *
 * Order matters and is not arbitrary:
 *   1. drop the dead paragraphs, so nothing below counts them
 *   2. promote the bold headings, so `splitLongform` can see the real sections
 *      and `routeSections` can route them to the right chapter
 *   3. demote the list lead-ins, so a label stops being counted as a heading
 *      when the section level is detected
 *
 * `level` is the heading level a promoted heading is written at. It has to be
 * the level the page uses for its own sections, or the promotion produces a
 * sub-heading and the wall does not split. The caller detects it.
 *
 * Returns `{ html, dropped, promoted, demoted }`.
 */
export function repairProse(html, level = 2) {
  let dropped = 0, promoted = 0, demoted = 0;
  const parts = blocks(listifyLabelled(unwrapLayoutWrappers(html)));

  // ---- 1. removal
  for (const b of parts) {
    if (b.tag === "p" && isDead(b.html)) { b.html = ""; b.tag = null; dropped++; }
  }

  // ---- 2 and 3. re-tagging
  const nextBlock = (i) => {
    for (let j = i + 1; j < parts.length; j++) {
      if (parts[j].tag) return parts[j];
      if (parts[j].html.trim()) return parts[j];
    }
    return null;
  };

  for (let i = 0; i < parts.length; i++) {
    const b = parts[i];
    const t = textOf(b.html);

    // a heading the editor typed as bold body text
    if (b.tag === "p" && isBoldOnly(b.html)) {
      const nx = nextBlock(i);
      if (isLeadIn(t) && nx && (nx.tag === "ul" || nx.tag === "ol")) {
        b.html = `<p class="lf-lead">${cleanHeading(t)}</p>`;
        demoted++;
      } else if (isHeadingShaped(t)) {
        b.html = `<h${level}>${cleanHeading(t)}</h${level}>`;
        b.tag = "h" + level;
        promoted++;
      }
      continue;
    }

    // a list label the editor typed as a heading
    if (/^h[2-6]$/.test(b.tag || "") && isLeadIn(t)) {
      const nx = nextBlock(i);
      if (nx && (nx.tag === "ul" || nx.tag === "ol")) {
        b.html = `<p class="lf-lead">${cleanHeading(t)}</p>`;
        b.tag = "p";
        demoted++;
      }
    }
  }

  return { html: parts.map((b) => b.html).join(""), dropped, promoted, demoted };
}

// ===========================================================================
/**
 * Fold the tail of an over-long prose run into a disclosure.
 *
 * THE CEILING IS ON A RUN, NOT ON A SECTION. What makes a page unreadable is
 * unbroken prose, not word count: a section of 400 words carrying two lists and
 * three sub-headings is fine, and 200 words in one column is not. So a list,
 * heading, figure or table resets the count, and only consecutive paragraphs
 * accumulate — which means the fix a page's author can make is to add
 * structure, never to cut clinical detail.
 *
 * Nothing is deleted. The tail stays in the document, indexed and reachable,
 * behind one control. `<details>` and not a script: it works before hydration,
 * it works with JavaScript off, and it is what a browser already gives us.
 */
export function foldLongRuns(html, ceiling = PROSE_RUN_CEILING) {
  const parts = blocks(html);
  const out = [];
  let run = [];       // consecutive <p> blocks
  let folded = 0;

  const flush = () => {
    if (!run.length) { return; }
    let acc = 0, cut = -1;
    for (let i = 0; i < run.length; i++) {
      acc += wordsIn(run[i].html);
      if (acc > ceiling) { cut = i; break; }
    }
    // Never fold the first paragraph of a run: a section that opens on a
    // disclosure has nothing above the fold to tell you whether to open it.
    if (cut > 0) {
      const tail = run.slice(cut);
      const tailWords = tail.reduce((n, b) => n + wordsIn(b.html), 0);
      if (tailWords >= MIN_FOLD) {
        out.push(...run.slice(0, cut).map((b) => b.html));
        out.push(
          `<details class="lf-more"><summary>Read the full detail</summary>` +
          `<div class="lf-more-in">${tail.map((b) => b.html).join("")}</div></details>`,
        );
        folded++;
        run = [];
        return;
      }
    }
    out.push(...run.map((b) => b.html));
    run = [];
  };

  for (const b of parts) {
    if (b.tag === "p") { run.push(b); continue; }
    if (!b.tag && !b.html.trim()) { if (run.length) run.push(b); else out.push(b.html); continue; }
    flush();
    out.push(b.html);
  }
  flush();
  return { html: out.join(""), folded };
}

/** The longest unbroken prose run in a chunk, in words. The measurement the
 *  build gate asserts on. */
export function longestProseRun(html) {
  let run = 0, worst = 0;
  for (const b of blocks(html)) {
    if (b.tag === "p") { run += wordsIn(b.html); worst = Math.max(worst, run); continue; }
    if (!b.tag && !b.html.trim()) continue;
    run = 0;   // a heading, list, figure, table or a closed <details> all break the flow
  }
  return worst;
}

export default { repairProse, foldLongRuns, longestProseRun, unwrapLayoutWrappers, listifyLabelled, PROSE_RUN_CEILING };
