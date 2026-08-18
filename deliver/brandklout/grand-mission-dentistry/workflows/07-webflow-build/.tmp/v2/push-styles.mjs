#!/usr/bin/env node
// push-styles.mjs — create the generated client-first classes on the Grand Mission site.
// Base properties go in with create_style; each breakpoint is a separate update_style.
// Idempotent: a class already recorded in styles-pushed.json is skipped, so a run that
// dies part-way resumes instead of re-creating.
//
// Re-asserting a value a style already has answers "[Conflict] The operation could not be
// applied to the style block store" and aborts the WHOLE run on its first call, which is why
// nothing here rewrites an existing definition.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { call, SITE, page } from "./lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
// node push-styles.mjs                -> the generated lp_ family
// node push-styles.mjs manual         -> styles-def.manual.mjs (the hand-authored addendum)
const WHICH = process.argv[2] || "generated";
const DEF = WHICH === "manual"
  ? { STYLES: (await import("./styles-def.manual.mjs")).STYLES }
  : JSON.parse(fs.readFileSync(path.join(HERE, (process.env.OUT || "styles-def.generated.json")), "utf8"));
const DONE_FILE = path.join(HERE, (process.env.DONE || `styles-pushed${WHICH === "manual" ? "-manual" : ""}.json`));
const done = fs.existsSync(DONE_FILE) ? JSON.parse(fs.readFileSync(DONE_FILE, "utf8")) : {};

// Style writes need a page context; use a v2 page so nothing can be aimed at an original.
const PAGE = page("cosmetic-v2").page;

const keyOf = (s) => (s.parents ? s.parents.join(".") + ">" : "") + s.n;
const propList = (obj) => Object.entries(obj).map(([k, v]) =>
  (v && typeof v === "object" && v.v)
    ? { property_name: k, variable_as_value: v.v }
    : { property_name: k, property_value: String(v) });

let created = 0, failed = 0;
for (const s of DEF.STYLES) {
  const key = keyOf(s);
  if (done[key]) continue;
  const parents = s.parents ? { parent_style_names: s.parents } : {};
  const actions = [{
    label: "create " + key,
    create_style: { name: s.n, ...parents, properties: propList(Object.keys(s.p).length ? s.p : { opacity: "1" }) },
  }];
  for (const [bp, props] of Object.entries(s.bp || {})) {
    actions.push({
      label: `${key}@${bp}`,
      update_style: { style_name: s.n, ...parents, breakpoint_id: bp, properties: propList(props) },
    });
  }
  try {
    call("data_style_tool", {
      context: "Create the client-first lp_ class family for the Grand Mission v2 landing-page rebuild.",
      siteId: SITE, pageId: PAGE, actions,
    });
    done[key] = true;
    fs.writeFileSync(DONE_FILE, JSON.stringify(done, null, 1));
    created++;
    console.log("ok", key);
  } catch (e) {
    failed++;
    console.error("FAIL", key, String(e.message || e).slice(0, 400));
    process.exitCode = 1;
    break;   // a style store conflict poisons the rest of the run; stop and look
  }
}
console.log(`created ${created}, failed ${failed}, done ${Object.keys(done).length}/${DEF.STYLES.length}`);
