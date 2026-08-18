#!/usr/bin/env node
// fix-defaults.mjs — clear the placeholder content Webflow inserts when an element is created
// without its own copy. Found by reading the PUBLISHED html, not the element tree: none of it
// is visible in query_elements' summary view.
//
//  1. A Heading built with CHILD elements and no set_text keeps Webflow's default string
//     "Heading" as a leading text node, so every split headline renders "HeadingA Smile You'll
//     Love…". Nine of them on the cosmetic page.
//  2. A FormTextInput created through the builder ships `placeholder="Example Text"` — the two
//     inputs Webflow generates with the Form itself come through empty, only an appended one
//     carries it. `placeholder` is a reserved attribute name for set_attributes, but
//     remove_attribute clears it.
//  3. Re-assert the form field names and read them back against the served markup: the stored
//     setting and the published `data-name` disagreed after the first pass.
//
// Usage: node fix-defaults.mjs <v2-slug>
import { call, SITE, page } from "./lib.mjs";

const SLUG = process.argv[2] || "cosmetic-v2";
const P = page(SLUG);
const walk = (n, o = []) => { o.push(n); (n.children || []).forEach((k) => walk(k, o)); return o; };
const read = () => walk(call("data_element_tool", {
  context: "Read the v2 page tree to find elements still carrying Webflow's default copy.",
  siteId: SITE, pageId: P.page,
  actions: [{ label: "b", query_elements: { queries: [{ label: "b", element_id: { component: P.page, element: P.body }, children_depth: -1 }] } }],
})[0].result[0].data[0].matches[0]);

let nodes = read();

// ---- 1. the stray "Heading" text node on every multi-child heading ----------------
const strays = [];
for (const n of nodes) {
  if (n.type !== "Heading" || !(n.children || []).length) continue;
  const kids = n.children;
  if (kids.length < 2) continue;                       // a plain heading owns its String
  for (const k of kids) {
    if (k.type === "String" && /^(Heading|Text|Paragraph|Block)$/.test((k.textContent || "").trim())) {
      strays.push(k.id.element);
    }
  }
}
console.log(`stray default text nodes: ${strays.length}`);
for (let i = 0; i < strays.length; i += 8) {
  call("data_element_tool", {
    context: "Remove the default text node Webflow left inside headings that were built from child elements.",
    siteId: SITE, pageId: P.page,
    actions: strays.slice(i, i + 8).map((id, k) => ({
      label: "rm" + (i + k), remove_element: { id: { component: P.page, element: id } },
    })),
  });
}

// ---- 2 + 3. form fields: clear the default placeholder, re-assert the names --------
nodes = read();
const inputs = nodes.filter((n) => n.type === "FormTextInput");
const FIELDS = [
  { name: "First name", type: "text" },
  { name: "Phone", type: "tel" },
  { name: "Email", type: "email" },
];
for (const inp of inputs) {
  try {
    call("data_element_tool", {
      context: "Clear the default \"Example Text\" placeholder from a form field.",
      siteId: SITE, pageId: P.page,
      actions: [{ label: "ph", remove_attribute: { id: { component: P.page, element: inp.id.element }, name: "placeholder" } }],
    });
  } catch (e) { console.log("placeholder clear:", String(e.message).slice(0, 90)); }
}
call("data_element_settings_tool", {
  context: "Re-assert the form field names, types and required flags.",
  siteId: SITE, pageId: P.page,
  actions: [{
    label: "f",
    set_settings: {
      operations: inputs.map((n, i) => ({
        element_id: { component: P.page, element: n.id.element },
        settings: [
          { key: "name", static_text: { value: FIELDS[i].name } },
          { key: "type", static_text: { value: FIELDS[i].type } },
          { key: "required", static_boolean: { value: true } },
          { key: "domId", static_text: { value: FIELDS[i].name.toLowerCase().replace(/\s+/g, "-") } },
        ],
      })),
    },
  }],
});

// ---- read back ---------------------------------------------------------------------
nodes = read();
const left = nodes.filter((n) => n.type === "String" && /^(Heading|Text|Paragraph|Block)$/.test((n.textContent || "").trim())
  && (nodes.find((p) => (p.children || []).some((c) => c.id.element === n.id.element))?.children.length ?? 0) > 1);
console.log(left.length ? `STILL ${left.length} stray default node(s)` : "headings clean");
for (const n of nodes.filter((x) => x.type === "FormTextInput")) {
  const s = call("data_element_settings_tool", {
    context: "Read a form field back to confirm its name and type.",
    siteId: SITE, pageId: P.page,
    actions: [{ label: "g", get_settings: { type: "all_raw_settings", element_id: { component: P.page, element: n.id.element } } }],
  })[0].result[0].data.matches;
  console.log("field", JSON.stringify(s.filter((m) => /name|type|attributes|domId/.test(m.key))));
}
