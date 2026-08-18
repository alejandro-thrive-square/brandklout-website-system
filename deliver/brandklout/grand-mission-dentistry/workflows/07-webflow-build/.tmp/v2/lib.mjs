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

// ---------- element schema DSL ----------
export const el = (type, style, extra = {}, ...children) => ({
  type,
  ...(style ? { set_style: { style_names: Array.isArray(style) ? style : [style] } } : {}),
  ...extra,
  ...(children.length ? { children: children.filter(Boolean) } : {}),
});
export const div = (style, ...k) => el("DivBlock", style, {}, ...k);
export const section = (style, ...k) => el("Section", style, {}, ...k);
export const par = (style, text) => el("Paragraph", style, { set_text: { text } });
export const h = (lvl, style, text) =>
  el("Heading", style, { set_heading_level: { heading_level: lvl }, set_text: { text } });
/** TextBlock's set_text SILENTLY NO-OPS at creation — copy is written afterwards by
 *  fix-texts.mjs via element_settings key "text". The text is kept here so the fixer can
 *  zip schema order against the live depth-first order. */
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
export const youtube = (style, url) => el("YouTubeVideo", style, { set_youtube_video: { url } });

// ---------- resumable section builder ----------
/** Build `sections` onto a v2 page, one root per entry, skipping anything already recorded in
 *  `<logName>`. Each entry: { label, tree, parentLabel? }. Returns the label -> element id map. */
export function buildSections(slug, sections, logName) {
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
