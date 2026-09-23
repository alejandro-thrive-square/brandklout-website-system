/**
 * resolve_wholepage.mjs — post-process a whole-page copy page.
 *
 * `html_to_webflow_wholepage.py` writes the payload already wrapped in its
 * copy page, so there is no standalone JSON to feed the fluid resolver. This
 * pulls the payload back out, runs `resolveFluid` (clamp()/calc()/min() ->
 * concrete px, because Webflow's style panel cannot parse a CSS function and
 * shows `0` for one), and writes:
 *
 *   <out>.json              resolved payload  -> feed to make_paste_page.py
 *   <out>.breakpoints.json  per-breakpoint overrides -> data_style_tool after paste
 *
 * Never regenerate the copy page here: `make_paste_page.py` owns that, and the
 * MIME-type + `</script>`-escaping rules are easy to get wrong.
 *
 * Usage:
 *   node resolve_wholepage.mjs .tmp/wholepage/paste_00_full-page.html .tmp/wholepage/resolved
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const { resolveFluid } = await import(
  path.resolve(here, "../../../../mcp-servers/webflow-clientfirst/lib.mjs")
    .replaceAll("\\", "/")
    .replace(/^([A-Za-z]):/, "file:///$1:")
);

const [pasteHtml, outBase] = process.argv.slice(2);
if (!pasteHtml || !outBase) {
  console.error("usage: node resolve_wholepage.mjs <paste page.html> <out base>");
  process.exit(1);
}

const html = fs.readFileSync(pasteHtml, "utf8");
const m = html.match(
  /<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/,
);
if (!m) throw new Error("no application/json payload block found");
// write_copy_page escapes `</` to `<\/` so an embedded `</script>` cannot
// terminate the host block early; JSON reads `\/` as `/`, so this round-trips.
const doc = JSON.parse(m[1]);

const before = JSON.stringify(doc.payload.styles).match(
  /\b(clamp|calc|min|max)\(/g,
)?.length ?? 0;

const { payload, breakpoints, resolved, failed } = resolveFluid(doc.payload);
doc.payload = payload;

/* Merge the per-breakpoint values INTO each style's `variants`, so they travel
 * with the paste. resolveFluid only rewrites the DESKTOP value in styleLess and
 * hands the rest back as a side file — which then has to be applied by ~235
 * `data_style_tool.update_style` calls after pasting. Skipping that step is
 * silent and total: every mobile font-size stays at its desktop px (the live
 * hero read 106px on a 500px-wide viewport, 2026-07-30).
 *
 * Webflow variant keys are the breakpoint names the converter already uses. */
const BP_KEY = { xxl: "xxl", xl: "xl", large: "large", tablet: "medium", mobileL: "small", mobileP: "tiny" };
const byName = new Map();
for (const s of payload.styles) {
  if (!s.comb) byName.set(s.name, s);
  else if (!byName.has(s.name)) byName.set(s.name, s);
}
let merged = 0;
for (const [src, key] of Object.entries(BP_KEY)) {
  for (const [cls, props] of Object.entries(breakpoints[src] || {})) {
    const s = byName.get(cls);
    if (!s) continue;
    const desktop = (breakpoints.desktop || {})[cls] || {};
    // Only emit a variant for values that actually differ from desktop —
    // an override identical to base is noise and trips the gate's own check.
    const diff = Object.entries(props).filter(([p, v]) => desktop[p] !== v);
    if (!diff.length) continue;
    s.variants ||= {};
    const existing = s.variants[key]?.styleLess || "";
    const kept = existing
      .split(";")
      .map((d) => d.trim())
      .filter((d) => d && !diff.some(([p]) => d.startsWith(p + ":")));
    s.variants[key] = {
      styleLess: [...kept, ...diff.map(([p, v]) => `${p}: ${v}`)].join("; ") + ";",
    };
    merged++;
  }
}
console.log(`merged ${merged} breakpoint overrides into style variants`);

const after = JSON.stringify(doc.payload.styles).match(
  /\b(clamp|calc|min|max)\(/g,
)?.length ?? 0;

fs.mkdirSync(path.dirname(outBase), { recursive: true });
fs.writeFileSync(`${outBase}.json`, JSON.stringify(doc, null, 2), "utf8");
fs.writeFileSync(
  `${outBase}.breakpoints.json`,
  JSON.stringify(breakpoints, null, 2),
  "utf8",
);

console.log(`CSS functions in styleLess: ${before} -> ${after}`);
console.log(`resolved declarations: ${resolved}`);
if (failed.length) {
  console.log(`UNRESOLVED (${failed.length}) — reported, not guessed:`);
  for (const f of failed) console.log(`  .${f.class} { ${f.prop}: ${f.value} }`);
}
for (const bp of Object.keys(breakpoints)) {
  console.log(`  ${bp}: ${Object.keys(breakpoints[bp]).length} classes overridden`);
}
