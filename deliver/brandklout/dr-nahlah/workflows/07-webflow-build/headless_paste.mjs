/**
 * headless_paste.mjs — turn a clipboard payload into a HEADLESS insert plan for
 * `data_whtml_builder`, removing the manual Designer paste entirely.
 *
 * Why this exists: the clipboard path needs a human to click "Copy" and press
 * Ctrl+V, because `execCommand('copy')` requires a real user gesture. The MCP's
 * `data_whtml_builder` accepts HTML + raw CSS and builds NATIVE Webflow
 * elements — verified 2026-07-31 on a probe page: a `<section>` became
 * `type: "Section"` with real `styleNames`, its `<h2>` a `Heading`, its `<p>` a
 * `Paragraph`, and `@media` rules became real Webflow breakpoint overrides.
 * (This project's directive claimed whtml_builder only makes opaque
 * HtmlEmbeds — that is wrong for this usage and steered the build to manual
 * pasting for far too long.)
 *
 * A Node script cannot call MCP tools, so this does not perform the insert. It
 * emits `insert-plan.json` — the exact arguments to feed `data_whtml_builder`,
 * plus the follow-up work the builder cannot do itself:
 *
 *   chunks[]      { html, css }         -> data_whtml_builder, in order
 *   images[]      { src, assetId, alt } -> data_element_tool.set_image_asset
 *   fonts[]       { style, family }     -> data_style_tool.update_style
 *   footerJs      string                -> page footer custom code
 *   headCss       string                -> page head custom code
 *
 * Three things the builder cannot take, handled here:
 *  - `<style>`/`<script>` are rejected outright, so every HtmlEmbed is stripped:
 *    section CSS joins headCss, section JS joins footerJs. That also removes the
 *    mid-parse ordering fragility that caused "WZ is not defined".
 *  - Images arrive unbound ("does not exist in asset library") even for a
 *    correct CDN URL, so they are rebound afterwards by asset id.
 *  - The builder's font check does not see custom-uploaded families
 *    ("could not be installed"), so font-family is applied afterwards.
 *
 * Usage:
 *   node headless_paste.mjs .tmp/wholepage/final.json .tmp/wholepage/insert-plan.json
 */
import fs from "node:fs";
import path from "node:path";

const [payloadPath, outPath] = process.argv.slice(2);
const doc = JSON.parse(fs.readFileSync(payloadPath, "utf8"));
const p = doc.payload;
const styles = new Map(p.styles.map((s) => [s._id, s]));
const nodes = new Map(p.nodes.map((n) => [n._id, n]));
const assets = new Map((p.assets || []).map((a) => [a.s3Url || a.hostedUrl, a]));

/* Webflow breakpoint -> media query. These strings are matched EXACTLY by the
 * builder, which rejects anything else with:
 *   Unsupported media query "...". Use exactly one of: ...
 * Two traps in that contract: the mobile-portrait edge is **479px, not 478**,
 * and a **space after the colon** is required. The list also confirms the
 * large-screen ladder is large=1280 / xl=1440 / xxl=1920. */
const MEDIA = {
  medium: "screen and (max-width: 991px)",
  small: "screen and (max-width: 767px)",
  tiny: "screen and (max-width: 479px)",
  large: "screen and (min-width: 1280px)",
  xl: "screen and (min-width: 1440px)",
  xxl: "screen and (min-width: 1920px)",
};

const esc = (t) => String(t).replace(/[<>&"]/g, (c) =>
  ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]));

const headCss = [];
const footerJs = [];
const images = [];
// `render()` runs more than once per node (the chunker measures a subtree
// before deciding to split it), so side-effect collection must be idempotent
// or the footer JS multiplies — 9 section blocks became 36.
const seenEmbeds = new Set();
const seenImages = new Set();

/** Every attribute a node carries, from the THREE places the payload keeps them.
 *
 *  Rendering `data.attr` alone — which this script did until 2026-08-04 — is a
 *  silent, total loss of behaviour on this design:
 *   - `data.link.url` holds every href. Without it all 50 links inserted as
 *     dead `<a>` with no target.
 *   - `data.xattr` holds the hooks the page is DRIVEN by: `data-anim` (the
 *     reveal system), `data-chapter`/`data-chapter-name` (the nav readout),
 *     `data-count`/`data-suffix`/`data-decimals` (the counters), `data-slide`
 *     (the before/after slider), `data-theme` (the light/dark section flip),
 *     plus every `role` and `aria-*`. 67 nodes carry them.
 *  Both are invisible in a screenshot and fatal on interaction. */
function attrsFor(n) {
  const out = { ...(n.data?.attr || {}) };
  for (const a of n.data?.xattr || []) {
    if (a && a.name) out[a.name] = a.value ?? "";
  }
  const link = n.data?.link;
  if (link && link.url) out.href = link.url;
  return out;
}

function render(id) {
  const n = nodes.get(id);
  if (!n) return "";
  if (n.text === true && "v" in n) return esc(n.v);
  if (n.type === "HtmlEmbed") {
    // Rejected by the builder. Split it: CSS to the head slot, JS to the footer.
    const v = n.v || "";
    if (seenEmbeds.has(n._id)) {
      return v.replace(/<style[^>]*>[\s\S]*?<\/style>/g, "")
              .replace(/<script[^>]*>[\s\S]*?<\/script>/g, "").trim();
    }
    seenEmbeds.add(n._id);
    for (const m of v.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) {
      const css = m[1].trim();
      // The universal box-sizing reset repeats in every embed; keep one copy.
      if (css && !headCss.includes(css)) headCss.push(css);
    }
    for (const m of v.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) {
      const js = m[1].trim();
      if (js) footerJs.push(js);
    }
    // Anything that is neither (e.g. the proof chapter's <video>) still needs
    // to reach the page, so it rides through as literal markup.
    const rest = v.replace(/<style[^>]*>[\s\S]*?<\/style>/g, "")
                  .replace(/<script[^>]*>[\s\S]*?<\/script>/g, "").trim();
    return rest;
  }
  const tag = n.tag || "div";
  const cls = (n.classes || []).map((c) => styles.get(c)?.name).filter(Boolean);
  const attr = attrsFor(n);
  if (n.type === "Image" && attr.src && !seenImages.has(n._id)) {
    seenImages.add(n._id);
    const a = assets.get(attr.src);
    images.push({ src: attr.src, alt: attr.alt || "", assetId: a?._id || null });
  }
  const parts = [];
  if (cls.length) parts.push(`class="${cls.join(" ")}"`);
  for (const [k, v] of Object.entries(attr)) {
    if (v !== "" && v != null) parts.push(`${k}="${esc(v)}"`);
  }
  const open = `<${tag}${parts.length ? " " + parts.join(" ") : ""}>`;
  const VOID = new Set(["img", "br", "hr", "input", "source"]);
  if (VOID.has(tag)) return open;
  return `${open}${(n.children || []).map(render).join("")}</${tag}>`;
}

/* One chunk per top-level section keeps each request small and makes a failure
   recoverable at section granularity instead of losing the whole page. */
const kids = new Set(p.nodes.flatMap((n) => n.children || []));
const roots = p.nodes.filter((n) => !kids.has(n._id));
const wrapper = roots[0];
let sections = (wrapper.children || []).map((id) => nodes.get(id)).filter(Boolean);

/* Descend through pure structural wrappers (#smooth-wrapper > #smooth-content)
   so each CHAPTER is its own chunk. One 22KB blob holding all nine chapters is
   both a size risk and an all-or-nothing failure: a rejection loses the whole
   page instead of one section. The wrappers themselves are re-created as empty
   shells first, and chapters are appended into the innermost one. */
const shells = [];
const describe = (n) => ({
  tag: n.tag || "div",
  cls: (n.classes || []).map((c) => styles.get(c)?.name).filter(Boolean),
  id: n.data?.attr?.id || "",
});
/** A node is a pure structural shell when its only job is to wrap: exactly one
 *  element child and no text of its own (#smooth-wrapper > #smooth-content). */
const isShell = (n) => {
  const ch = (n.children || []).map((c) => nodes.get(c)).filter(Boolean);
  return ch.length === 1 && ch[0].text !== true && n.type !== "HtmlEmbed";
};

/* Split by SIZE, not by shape. A node whose markup exceeds the budget is
   emitted as an empty shell and its children are chunked instead, recursively.
   Shape-based rules stopped at `<main id="top">`, which is one node holding all
   nine chapters — 21KB in a single request, and an all-or-nothing failure. */
const MAX_CHUNK = 12 * 1024;
const chunks = [];

function openTag(n) {
  const d = describe(n);
  const attr = attrsFor(n);
  const parts = [];
  if (d.cls.length) parts.push(`class="${d.cls.join(" ")}"`);
  for (const [k, v] of Object.entries(attr)) {
    if (v !== "" && v != null) parts.push(`${k}="${esc(v)}"`);
  }
  return `<${d.tag}${parts.length ? " " + parts.join(" ") : ""}></${d.tag}>`;
}

function emit(n, parentRef) {
  const html = render(n._id);
  const d = describe(n);
  const label = d.id || d.cls[0] || `chunk-${chunks.length}`;
  const kidNodes = (n.children || []).map((c) => nodes.get(c)).filter(Boolean);
  // >= 1 child, not > 1: a single-child wrapper (#smooth-wrapper) must still be
  // descended through, or the whole subtree stays one oversized chunk.
  const splittable = html.length > MAX_CHUNK
    && kidNodes.length >= 1
    && !kidNodes.some((k) => k.text === true);   // never orphan inline text
  if (!splittable) {
    chunks.push({ label, into: parentRef, html });
    return;
  }
  // Shell first, then each child appended into it.
  if (!d.id) d.id = `wz-shell-${shells.length}`;
  shells.push({ label, into: parentRef, id: d.id, html: openTag({ ...n, data: { attr: { ...(n.data?.attr || {}), id: d.id } } }) });
  for (const k of kidNodes) emit(k, d.id);
}

for (const sec of sections) emit(sec, null);

/* CSS for every style the payload defines, base + breakpoint variants. The
   builder converts these into real Webflow classes and overrides. font-family
   is withheld — the builder rejects families it cannot "install", which
   includes custom-uploaded ones — and re-applied afterwards via update_style. */
const fonts = [];
const cssParts = [];
for (const s of p.styles) {
  const base = (s.styleLess || "").trim();
  if (base) {
    const ff = base.match(/font-family:\s*([^;]+)/);
    if (ff) fonts.push({ style: s.name, family: ff[1].trim(), comb: s.comb || "" });
    const stripped = base.replace(/font-family:\s*[^;]+;?/g, "").trim();
    if (stripped) cssParts.push(`.${s.name}{${stripped}}`);
  }
  for (const [bp, v] of Object.entries(s.variants || {})) {
    const mq = MEDIA[bp];
    const body = (v.styleLess || "").replace(/font-family:\s*[^;]+;?/g, "").trim();
    if (!mq || !body) continue;
    cssParts.push(`@media ${mq}{.${s.name}{${body}}}`);
  }
}

/* Scope each chunk's CSS to the classes that chunk actually introduces, so no
 * single request carries the whole 71KB sheet. Passing CSS (rather than relying
 * on attach-by-name) is also the safer contract: a bare class attaches to an
 * existing definition ONLY when the combo-ness matches. Inserting `ch-reality`
 * as a base class when the site holds it as a combo (`.nahlah-div.ch-reality`)
 * silently creates an EMPTY global twin instead of attaching. */
const cssByClass = new Map();
for (const s of p.styles) {
  const lines = [];
  const base = (s.styleLess || "").replace(/font-family:\s*[^;]+;?/g, "").trim();
  if (base) lines.push(`.${s.name}{${base}}`);
  for (const [bp, v] of Object.entries(s.variants || {})) {
    const mq = MEDIA[bp];
    const body = (v.styleLess || "").replace(/font-family:\s*[^;]+;?/g, "").trim();
    if (mq && body) lines.push(`@media ${mq}{.${s.name}{${body}}}`);
  }
  if (lines.length) cssByClass.set(s.name, lines.join("\n"));
}
const emittedCss = new Set();
const cssFor = (html) => {
  const used = new Set([...html.matchAll(/class="([^"]+)"/g)]
    .flatMap((m) => m[1].split(/\s+/)));
  const out = [];
  for (const c of used) {
    if (emittedCss.has(c) || !cssByClass.has(c)) continue;
    emittedCss.add(c);
    out.push(cssByClass.get(c));
  }
  return out.join("\n");
};
for (const sh of shells) sh.css = cssFor(sh.html);
for (const c of chunks) c.css = cssFor(c.html);

const plan = {
  generatedFrom: path.basename(payloadPath),
  shells,
  chunks,
  sharedCss: cssParts.join("\n"),
  headCss: headCss.join("\n"),
  footerJs: footerJs.join("\n\n"),
  // The section scripts kept SEPARATE. Webflow's custom-code slots cap around
  // 10k chars, so these must be split across the page and site footer — and the
  // only safe cut points are whole-block boundaries. Re-splitting the joined
  // string on blank lines slices through function bodies (9 scripts became 46
  // fragments) and would silently ship broken JavaScript.
  footerBlocks: footerJs,
  images: [...new Map(images.map((i) => [i.src, i])).values()],
  fonts,
};
fs.writeFileSync(outPath, JSON.stringify(plan, null, 1), "utf8");

console.log(`shells        : ${shells.length}`);
for (const sh of shells) console.log(`  shell ${sh.label.padEnd(16)} into ${sh.into || "BODY"}`);
console.log(`sections      : ${chunks.length}`);
for (const c of chunks) console.log(`  ${c.label.padEnd(18)} ${(c.html.length/1024).toFixed(1).padStart(5)} KB  into ${c.into || "BODY"}`);
console.log(`shared CSS    : ${(plan.sharedCss.length / 1024).toFixed(1)} KB (${p.styles.length} styles)`);
console.log(`head CSS      : ${(plan.headCss.length / 1024).toFixed(1)} KB (from embeds)`);
console.log(`footer JS     : ${(plan.footerJs.length / 1024).toFixed(1)} KB (${footerJs.length} section blocks)`);
console.log(`images to bind: ${plan.images.length} (${plan.images.filter((i) => !i.assetId).length} without an asset id)`);
console.log(`fonts to apply: ${fonts.length}`);
console.log(`\nplan -> ${outPath}`);
