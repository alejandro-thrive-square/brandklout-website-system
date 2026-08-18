#!/usr/bin/env node
// sync-text.mjs — make every text run on a v2 page match what its build schema intended.
//
// Why this exists: `set_text` in an element_schema works on Heading, Paragraph and a DOM
// element, but **silently no-ops on a TextBlock**. The element is created carrying Webflow's
// default string "This is some text inside of a div block." and the build reports success, so
// nothing short of reading the rendered page catches it — 35 runs on the cosmetic page.
//
// The fix is a reconciliation rather than a one-off patch: walk the schema and the live
// subtree in the same depth-first order, and write every node whose live text differs. That
// also repairs copy that went to the WRONG element (the journey rows had their tick glyph and
// their sentence swapped), and it is idempotent, so it can be re-run after any build change.
//
// Usage: SCHEMA_ONLY is set internally; node sync-text.mjs <v2-slug> [--dry]
process.env.SCHEMA_ONLY = "1";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SCHEMAS, call, SITE, page } from "./lib.mjs";

const SLUG = process.argv[2] || "cosmetic-v2";
const DRY = process.argv.includes("--dry");
const HERE = path.dirname(fileURLToPath(import.meta.url));
const P = page(SLUG);

// importing a build script only collects its schemas — SCHEMA_ONLY keeps it off the API.
// cosmetic-v2 was built by the three build-cosmetic scripts before build-lp.mjs existed;
// every other page comes from build-lp.mjs, which needs its ref/slug/consult arguments.
if (SLUG === "cosmetic-v2") {
  for (const f of ["build-cosmetic.mjs", "build-cosmetic-2.mjs", "build-cosmetic-3.mjs"]) await import("./" + f);
} else {
  const [ref, consult] = process.argv.slice(3).filter((a) => !a.startsWith("--"));
  if (!ref) throw new Error("usage: node sync-text.mjs <v2-slug> <ref-slug> <consult-path> [--dry]");
  process.argv[2] = ref; process.argv[3] = SLUG; process.argv[4] = consult;
  await import("./build-lp.mjs");
}
const built = JSON.parse(fs.readFileSync(path.join(HERE, "built", `${SLUG}.json`), "utf8"));

/** Schema nodes that carry copy, depth-first. */
function wanted(node, out = []) {
  if (node.set_text) out.push({ type: node.type, text: node.set_text.text });
  (node.children || []).forEach((k) => wanted(k, out));
  return out;
}
/** Live elements that own a String child, depth-first. TextBlock reports as Block. */
function actual(node, out = []) {
  const str = (node.children || []).find((k) => k.type === "String");
  if (str) out.push({ type: node.type, id: str.id.element, text: str.textContent ?? "" });
  (node.children || []).forEach((k) => actual(k, out));
  return out;
}
const DEFAULT_TEXT = "This is some text inside of a div block.";
const SAME = { TextBlock: "Block", Blockquote: "Blockquote", DOM: "DOM", Heading: "Heading", Paragraph: "Paragraph", FormBlockLabel: "FormBlockLabel" };

let writes = [], mismatched = 0;
for (const s of SCHEMAS) {
  const root = built[s.label];
  if (!root || typeof root !== "string") continue;
  const live = call("data_element_tool", {
    context: "Read a built section so its copy can be reconciled against the build schema.",
    siteId: SITE, pageId: P.page,
    actions: [{ label: "s", query_elements: { queries: [{ label: "s", element_id: { component: P.page, element: root }, children_depth: -1 }] } }],
  })[0].result[0].data[0].matches[0];

  const w = wanted(s.tree), a = actual(live);
  if (w.length !== a.length) {
    // A section whose live tree carries runs the schema never asked for — a Form brings its
    // own labels and success/error messages — cannot be zipped positionally. Fall back to the
    // unambiguous subset: the nodes still holding Webflow's TextBlock default, matched in
    // order against the schema's TextBlocks. Both counts must agree or nothing is written.
    const defaults = a.filter((x) => x.text === DEFAULT_TEXT);
    const blocks = w.filter((x) => x.type === "TextBlock");
    if (defaults.length && defaults.length === blocks.length) {
      defaults.forEach((d, i) => writes.push({ label: s.label, id: d.id, from: d.text, to: blocks[i].text }));
      console.log(`~ ${s.label}: ${w.length} vs ${a.length} runs — matched ${defaults.length} default TextBlock(s) instead`);
    } else {
      console.log(`! ${s.label}: schema wants ${w.length} text runs, page has ${a.length}, ${defaults.length} default vs ${blocks.length} TextBlocks — skipped`);
      mismatched++;
    }
    continue;
  }
  for (let i = 0; i < w.length; i++) {
    const expect = SAME[w[i].type] || w[i].type;
    if (a[i].type !== expect) {
      console.log(`! ${s.label}[${i}]: schema ${w[i].type} vs page ${a[i].type} — section skipped`);
      mismatched++;
      writes = writes.filter((x) => x.label !== s.label);
      break;
    }
    if (a[i].text !== w[i].text) writes.push({ label: s.label, id: a[i].id, from: a[i].text, to: w[i].text });
  }
}

console.log(`${writes.length} text run(s) differ from the schema; ${mismatched} section(s) skipped`);
for (const x of writes.slice(0, 40)) {
  console.log(`  [${x.label}] ${JSON.stringify(x.from.slice(0, 46))} -> ${JSON.stringify(x.to.slice(0, 46))}`);
}
if (DRY || !writes.length) process.exit(0);

for (let i = 0; i < writes.length; i += 8) {
  const batch = writes.slice(i, i + 8);
  call("data_element_tool", {
    context: "Write the copy the build schema intended onto text runs that came out wrong.",
    siteId: SITE, pageId: P.page,
    actions: batch.map((x, k) => ({
      label: `t${i + k}`,
      set_text: { id: { component: P.page, element: x.id }, text: x.to },
    })),
  });
  console.log("wrote", batch.length);
}
