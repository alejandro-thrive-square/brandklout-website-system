// lib.mjs — shared helpers for the Grand Mission v2 client-first rebuild.
// Every MCP call goes through ../wfmcp.mjs (429 backoff, strict error checking).
//
// Two hard rules encoded here, both paid for on earlier builds:
//  1. WRITES ARE SCOPED TO THE v2 PAGES. `page()` refuses any id that is not in pages.json,
//     so a stray page id cannot reach an original page.
//  2. A WRITE ECHO IS NOT PROOF. Builders log the ids they created so a resumed run skips
//     finished work instead of duplicating it, and callers read subtrees back.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const HERE = path.dirname(fileURLToPath(import.meta.url));
const WFMCP = path.join(HERE, "..", "wfmcp.mjs");
export const SITE = "698111847e9608eb30ee21c6";
export const REF = path.join(HERE, "..", "..", "..", "08-qa", ".tmp", "v2-reference");

export const PAGES = JSON.parse(fs.readFileSync(path.join(HERE, "pages.json"), "utf8"));
const ASSETS_BY_ID = JSON.parse(fs.readFileSync(path.join(HERE, "assets-by-id.json"), "utf8"));
const ASSETS_BY_NAME = JSON.parse(fs.readFileSync(path.join(HERE, "assets-by-name.json"), "utf8"));

/** The Relume kit's Global Styles component — mandatory first child of page-wrapper. */
export const GLOBAL_STYLES_COMPONENT = "ab488b17-f25a-fbf8-5f54-4a3955eb57e5";

export const PHONE = "+12817898836";
export const PHONE_TEXT = "(281) 789-8836";

/** Resolve a v2 page by slug. Throws on anything that is not a v2 page — the guard that
 *  keeps every write off the six originals. */
export function page(slug) {
  const p = PAGES[slug];
  if (!p) throw new Error(`not a v2 page: ${slug} (known: ${Object.keys(PAGES).join(", ")})`);
  return p;
}

export const asset = (id) => {
  if (!ASSETS_BY_ID[id]) throw new Error(`asset not on this site: ${id}`);
  return id;
};
export const assetByName = (name) => {
  const id = ASSETS_BY_NAME[name];
  if (!id) throw new Error(`no asset named ${name}`);
  return id;
};

/** The reference outline for a page — the build's content source. */
export const outline = (slug) =>
  JSON.parse(fs.readFileSync(path.join(REF, slug.replace(/-v2$/, ""), "outline.json"), "utf8"));
/** The reference STRUCTURE + copy for a page: tree-<width>.json from tree.mjs. Prefer this
 *  over outline() as a content source — outline.json is extracted from the saved page.html
 *  with no CSS or JS, so anything the live page reorders or injects (the Swiper-driven
 *  options cards, for one) comes out in a different order or missing entirely. The tree is
 *  read off the rendered page, so what it says is what the reference actually shows. */
export const tree = (slug, width = 1440) =>
  JSON.parse(fs.readFileSync(path.join(REF, slug.replace(/-v2$/, ""), `tree-${width}.json`), "utf8"));

/** Every descendant of `node` (inclusive) carrying `cls` in its class list. */
export function byClass(node, cls) {
  const out = [];
  const walk = (n) => {
    if ((n.cls || "").split(/\s+/).includes(cls)) out.push(n);
    (n.kids || []).forEach(walk);
  };
  walk(node);
  return out;
}

/** Every descendant of `node` (inclusive), depth-first, optionally filtered. */
export function all(node, fn = () => true) {
  const out = [];
  const walk = (n) => { if (fn(n)) out.push(n); (n.kids || []).forEach(walk); };
  walk(node);
  return out;
}

/** Where a reference headline splits into a plain half and a coloured half. The tree collapses
 *  a heading to one string, so this reads the saved page.html: the reference marks the coloured
 *  run with the class `accent`, and it can come SECOND ("Your Dental Work " + "Shouldn't Look…")
 *  or FIRST ("The Dentist" + " Richmond Trusts With Its Smiles"). Returns one entry per h1/h2 in
 *  document order: { level, head, accent, accentFirst }. */
export function headings(slug) {
  const html = fs.readFileSync(path.join(REF, slug.replace(/-v2$/, ""), "page.html"), "utf8");
  const strip = (x) => x.replace(/<br\s*\/?>/g, " ").replace(/<[^>]+>/g, "")
    .replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/\u200d/g, "").replace(/\s+/g, " ").trim();
  const out = [];
  for (const m of html.matchAll(/<h([12])[^>]*>([\s\S]*?)<\/h[12]>/g)) {
    const inner = m[2];
    const acc = inner.match(/<(?:span|a)[^>]*class="[^"]*\baccent\b[^"]*"[^>]*>([\s\S]*?)<\/(?:span|a)>/);
    if (!acc) { out.push({ level: +m[1], head: strip(inner), accent: "", accentFirst: false }); continue; }
    const accentFirst = inner.indexOf(acc[0]) < 4;
    const rest = strip(inner.replace(acc[0], ""));
    out.push({ level: +m[1], head: rest, accent: strip(acc[1]), accentFirst });
  }
  return out;
}

/** The reference computed styles for a page, keyed by legacy class chain. */
export const refStyles = (slug) =>
  JSON.parse(fs.readFileSync(path.join(REF, slug.replace(/-v2$/, ""), "styles.json"), "utf8"));

let seq = 0;
export function callTool(tool, args) {
  const f = path.join(HERE, "raw", `.args-${process.pid}-${seq++}.json`);
  fs.writeFileSync(f, JSON.stringify(args));
  try {
    return execFileSync("node", [WFMCP, "call", tool, "--file", f],
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  } finally { try { fs.unlinkSync(f); } catch {} }
}

/** Parse wfmcp's one-JSON-object-per-line output; a protocol failure arrives as a bare
 *  "MCP error …" string, so surface that as {error} instead of dying in JSON.parse. */
export function lines(text) {
  return text.trim().split(/\r?\n/).filter(Boolean).map((l) => {
    try { return JSON.parse(l); }
    catch { return { error: { name: "ProtocolError", message: l } }; }
  });
}

const TRANSIENT = /429|1101|rate limit|too many requests|timeout|ECONN|fetch failed/i;
export const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/** Call one tool with backoff. THROWS on any non-transient error — a schema failure slipping
 *  through as "success" once had a caller report an element removed that was still there. */
export function call(tool, args, { tries = 6, base = 5000 } = {}) {
  let last;
  for (let i = 0; i < tries; i++) {
    if (i) sleep(base * 2 ** (i - 1));
    let out;
    try { out = callTool(tool, args); }
    catch (e) { last = e; if (!TRANSIENT.test(e.message)) throw e; continue; }
    const parsed = lines(out);
    const errs = parsed.filter((p) => p.error || p.result?.status === "error");
    // set_settings reports ACTION-level success while individual OPERATIONS fail — the truth
    // is in result[].data[].applied_keys / .error. One bad key discards its whole operation,
    // so a batch carrying the reserved attribute name "placeholder" wrote nothing at all and
    // still answered "Applied 1 operation(s)". Three form fields kept Webflow's default names
    // through two runs because of it.
    const opErrs = [];
    for (const p of parsed) {
      for (const r of [].concat(p.result || [])) {
        for (const d of [].concat(r?.data || [])) {
          if (d && typeof d === "object" && d.error) opErrs.push(`${p.label}: ${d.error}`);
        }
      }
    }
    const msgs = errs.map((e) => e.error?.message || e.result?.message || "")
      .concat(opErrs).join("\n");
    if (!TRANSIENT.test(msgs)) {
      if (errs.length || opErrs.length) throw new Error(msgs.slice(0, 1500));
      return parsed;
    }
    last = new Error(msgs);
  }
  throw last;
}

/** Strip em dashes from copy (user instruction, 2026-08-18). An em dash is doing one of three
 *  jobs in this reference and each wants different punctuation, so this is not a blind delete:
 *   - a decorative dash opening an eyebrow ("— Smile gallery")        -> removed outright
 *   - a dash joining two INDEPENDENT clauses ("look — he changes")    -> semicolon
 *   - a dash before a trailing dependent clause                       -> comma (the default)
 *  A few read best with no punctuation at all and are listed explicitly.
 *  En dashes are left alone: they carry numeric ranges here (Mon 9–7, 1–8, $900–$2,000).
 */
const DASH_EXCEPTIONS = [
  ["teeth look — he changes", "teeth look; he changes"],
  ["treatment begins — you can even", "treatment begins; you can even"],
  ["and bite — before permanent", "and bite before permanent"],
  ["Patient story — in their own words", "Patient story in their own words"],
];
export function deDash(text) {
  if (typeof text !== "string" || !text.includes("—")) return text;
  let t = text;
  for (const [from, to] of DASH_EXCEPTIONS) t = t.split(from).join(to);
  t = t.replace(/^\s*—\s*/, "");           // decorative opener
  t = t.replace(/\s*—\s*/g, ", ");         // everything else joins with a comma
  return t.replace(/\s+([,.;])/g, "$1").replace(/\s{2,}/g, " ").trim();
}

// ---------- element schema DSL ----------
export const el = (type, style, extra = {}, ...children) => ({
  type,
  ...(style ? { set_style: { style_names: Array.isArray(style) ? style : [style] } } : {}),
  ...extra,
  // every copy string in the build passes through here, so the em-dash rule is applied once
  ...(extra.set_text ? { set_text: { ...extra.set_text, text: deDash(extra.set_text.text) } } : {}),
  ...(children.length ? { children: children.filter(Boolean) } : {}),
});
export const div = (style, ...k) => el("DivBlock", style, {}, ...k);
export const section = (style, ...k) => el("Section", style, {}, ...k);
export const par = (style, text) => el("Paragraph", style, { set_text: { text } });
export const h = (lvl, style, text) =>
  el("Heading", style, { set_heading_level: { heading_level: lvl }, set_text: { text } });
/** TextBlock's set_text SILENTLY NO-OPS at creation: the element ships with Webflow's default
 *  string "This is some text inside of a div block." and the build reports success. The text is
 *  kept in the schema so fix-texts.mjs can recover it and write it afterwards, zipping schema
 *  order against the page's own depth-first order. */
export const txt = (style, text) => el("TextBlock", style, { set_text: { text } });
export const img = (style, assetId, alt) =>
  el("Image", style, { set_image_asset: { image_asset_id: asset(assetId), ...(alt ? { alt_text: alt } : {}) } });
export const linkUrl = (style, url, ...k) =>
  el("LinkBlock", style, { set_link: { link_type: "url", link: url } }, ...k);
export const linkPage = (style, pageId, ...k) =>
  el("LinkBlock", style, { set_link: { link_type: "page", link: pageId } }, ...k);
export const linkPhone = (style, ...k) =>
  el("LinkBlock", style, { set_link: { link_type: "phone", link: PHONE } }, ...k);
export const dom = (tag, style, extra = {}, ...k) =>
  el("DOM", style, { set_dom_config: { dom_tag: tag }, ...extra }, ...k);
/** An embedded video. Use `Video`, NOT `YouTubeVideo`: a YouTubeVideo element's `video`
 *  setting cannot be written (every value shape answers `Invalid value for setting "video":
 *  expected video`) while the same write on a plain Video succeeds, and the reference pages
 *  use Video too. The builder has no setter for the source at creation either, so videos.mjs
 *  writes {src, title} afterwards. */
export const video = (style) => el("Video", style);

// ---------- resumable section builder ----------
/** Build `sections` onto a v2 page, one root per entry, skipping anything already recorded in
 *  `<logName>`. Each entry: { label, tree, parentLabel? }. Returns the label -> element id map. */
/** Every section schema a build script hands to buildSections, in order. When
 *  SCHEMA_ONLY is set the API is not touched at all — the trees are just collected here, so
 *  fix-texts.mjs can import a build script purely to recover what copy it INTENDED to write. */
export const SCHEMAS = [];

export function buildSections(slug, sections, logName) {
  if (process.env.SCHEMA_ONLY) {
    for (const s of sections) SCHEMAS.push({ slug, label: s.label, tree: s.tree });
    return {};
  }
  const p = page(slug);
  const LOG = path.join(HERE, "built", logName);
  fs.mkdirSync(path.dirname(LOG), { recursive: true });
  const done = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, "utf8")) : {};
  for (const s of sections) {
    if (done[s.label]) { console.log("skip", s.label); continue; }
    const parsed = call("data_element_builder", {
      context: "Build a client-first v2 landing-page section natively from the captured reference outline.",
      siteId: SITE, pageId: p.page,
      actions: [{
        build_label: s.label,
        parent_element_id: {
          component: p.page,
          element: s.parentLabel ? String(done[s.parentLabel]) : p.body,
        },
        creation_position: s.position || "append",
        element_schema: s.tree,
      }],
    });
    const flat = JSON.stringify(parsed);
    const m = flat.match(/"element"\s*:\s*"([0-9a-f-]+)"/);
    done[s.label] = m ? m[1] : true;
    fs.writeFileSync(LOG, JSON.stringify(done, null, 1));
    console.log("built", s.label, done[s.label]);
    sleep(2500);
  }
  return done;
}
