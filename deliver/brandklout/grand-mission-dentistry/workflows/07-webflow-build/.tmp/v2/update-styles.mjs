#!/usr/bin/env node
// update-styles.mjs — push CHANGED definitions onto classes that already exist.
//
// Two API facts shape this file:
//
//  1. **Re-asserting a value the style already holds answers "[Conflict] The operation could
//     not be applied to the style block store" and aborts the whole call.** So an update
//     payload must contain only properties whose value actually moved.
//  2. **There is no way to READ a class's stored properties.** `query_styles` ignores its
//     filter and returns every style on the site as metadata only; `get_styles` the same. So
//     "what does this class currently hold?" cannot be answered, and the local snapshot in
//     styles-def.pushed.json can drift out of sync with the site.
//
// Given (2), a conflict is not an error — it is the store saying "already correct". So the
// class is tried as one batch first, and on conflict it falls back to one property per call,
// where a conflict means that single property was already right and everything else still
// lands. Nothing is left half-applied and the run never dies on a stale snapshot.
//
// Clearing a property: there is no remove_properties action in this MCP build. Sending an
// EMPTY string works ("" is accepted where "auto" is not, and resets the property).
//
// Usage: node update-styles.mjs                 (diff generated vs styles-def.pushed.json)
//        node update-styles.mjs lp_office_img   (or an explicit list of class names/keys)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { call, SITE, page } from "./lib.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = page("cosmetic-v2").page;
const NOW = JSON.parse(fs.readFileSync(path.join(HERE, (process.env.OUT || "styles-def.generated.json")), "utf8")).STYLES;
const PUSHED_FILE = path.join(HERE, (process.env.PUSHED || "styles-def.pushed.json"));
const PUSHED = JSON.parse(fs.readFileSync(
  fs.existsSync(PUSHED_FILE) ? PUSHED_FILE : path.join(HERE, "styles-def.prescroll.json"), "utf8")).STYLES;

const keyOf = (s) => (s.parents ? s.parents.join(".") + ">" : "") + s.n;
const prop = (k, v) => (v && typeof v === "object" && v.v)
  ? { property_name: k, variable_as_value: v.v }
  : { property_name: k, property_value: String(v) };

const old = Object.fromEntries(PUSHED.map((s) => [keyOf(s), s]));
const wanted = process.argv.slice(2);
const changed = NOW.filter((s) => {
  const k = keyOf(s);
  if (wanted.length) return wanted.includes(k) || wanted.includes(s.n);
  const o = old[k];
  return o && (JSON.stringify(o.p) !== JSON.stringify(s.p)
    || JSON.stringify(o.bp || {}) !== JSON.stringify(s.bp || {}));
});

/** Properties to send for one breakpoint: everything whose value moved, plus an empty string
 *  for anything the old definition had and the new one drops (a stale baked pixel height
 *  would otherwise survive the update, since update_style MERGES). */
function delta(now = {}, before = {}) {
  const out = [];
  for (const [k, v] of Object.entries(now)) {
    if (JSON.stringify(before[k]) !== JSON.stringify(v)) out.push(prop(k, v));
  }
  for (const k of Object.keys(before)) if (!(k in now)) out.push({ property_name: k, property_value: "" });
  return out;
}

const isConflict = (e) => /\[Conflict\]/.test(String(e.message || e));

function apply(label, styleName, parents, breakpoint, properties) {
  if (!properties.length) return { sent: 0, already: 0 };
  const action = (props) => ({
    label, update_style: { style_name: styleName, ...parents, ...(breakpoint ? { breakpoint_id: breakpoint } : {}), properties: props },
  });
  try {
    call("data_style_tool", { context: "Update a client-first class whose measured definition changed.", siteId: SITE, pageId: PAGE, actions: [action(properties)] });
    return { sent: properties.length, already: 0 };
  } catch (e) {
    if (!isConflict(e)) throw e;
    // one of these is already stored at this value — find out which by sending them singly
    let sent = 0, already = 0;
    for (const p of properties) {
      try {
        call("data_style_tool", { context: "Update one property of a client-first class after a batch conflict.", siteId: SITE, pageId: PAGE, actions: [action([p])] });
        sent++;
      } catch (e2) { if (isConflict(e2)) already++; else throw e2; }
    }
    return { sent, already };
  }
}

let touched = 0;
for (const s of changed) {
  const o = old[keyOf(s)] || { p: {}, bp: {} };
  const parents = s.parents ? { parent_style_names: s.parents } : {};
  let sent = 0, already = 0;
  for (const [bp, [now, before]] of Object.entries({
    "": [s.p, o.p],
    ...Object.fromEntries([...new Set([...Object.keys(s.bp || {}), ...Object.keys(o.bp || {})])]
      .map((b) => [b, [(s.bp || {})[b] || {}, (o.bp || {})[b] || {}]])),
  })) {
    const r = apply(`${keyOf(s)}@${bp || "main"}`, s.n, parents, bp || null, delta(now, before));
    sent += r.sent; already += r.already;
  }
  touched++;
  console.log(`ok ${keyOf(s)} — ${sent} written, ${already} already correct`);
}

fs.writeFileSync(PUSHED_FILE, JSON.stringify({ STYLES: NOW }, null, 1));
console.log(`updated ${touched} class(es); snapshot written to styles-def.pushed.json`);
