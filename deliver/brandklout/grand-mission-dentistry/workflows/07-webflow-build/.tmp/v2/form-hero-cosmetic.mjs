#!/usr/bin/env node
// form-hero-cosmetic.mjs — finish the hero card's native form.
//
// `type: "Form"` does not create an empty wrapper: it creates a complete Webflow form —
// FormWrapper > FormForm with two LABELLED text inputs and a submit button, plus the success
// and error messages. So this pass ADJUSTS that default rather than building fields:
//   - the reference card has no field labels -> remove both FormBlockLabels
//   - it needs three fields, not two -> append one FormTextInput
//   - the flex stack belongs on the FormForm, not the wrapper
//   - names / types / placeholders / required / button text / redirect are SETTINGS, written
//     with data_element_settings_tool after the fields exist (placeholder goes through the
//     `attributes` key — it is NOT unreachable, contrary to the older note in the traps memory)
import { call, SITE, page } from "./lib.mjs";

const PAGE = page("cosmetic-v2").page;
const CARD = "47463d5d-f2ae-250d-6c0b-959101d9b428";
const THANKYOU = "/ads-landing-pages/cosmetic-thank-you-v2";

const q = (element, depth) => call("data_element_tool", {
  context: "Read the hero form subtree so its fields can be adjusted in place.",
  siteId: SITE, pageId: PAGE,
  actions: [{ label: "q", query_elements: { queries: [{ label: "f", element_id: { component: PAGE, element }, children_depth: depth }] } }],
})[0].result[0].data[0].matches[0];

const walk = (n, out = []) => { out.push(n); (n.children || []).forEach((k) => walk(k, out)); return out; };

let card = q(CARD, 4);
let nodes = walk(card);
const byType = (t) => nodes.filter((n) => n.type === t);

const wrapper = byType("FormWrapper")[0];
const form = byType("FormForm")[0];
if (!form) throw new Error("no FormForm under the hero card");

// 1. drop the default labels
for (const lab of byType("FormBlockLabel")) {
  call("data_element_tool", {
    context: "Remove the default form field labels; the reference card has none.",
    siteId: SITE, pageId: PAGE,
    actions: [{ label: "rm", remove_element: { id: { component: PAGE, element: lab.id.element } } }],
  });
  console.log("removed label", lab.id.element.slice(0, 8));
}

// 2. third field, inserted before the submit button
const btn = byType("FormButton")[0];
call("data_element_builder", {
  context: "Add the third text field to the hero form (first name, phone, email).",
  siteId: SITE, pageId: PAGE,
  actions: [{
    build_label: "email",
    parent_element_id: { component: PAGE, element: btn.id.element },
    creation_position: "before",
    element_schema: { type: "FormTextInput", set_style: { style_names: ["lp_form_input"] } },
  }],
});
console.log("added third field");

// 3. re-read, then style what the default gave us
card = q(CARD, 4);
nodes = walk(card);
const inputs = nodes.filter((n) => n.type === "FormTextInput");
const button = nodes.filter((n) => n.type === "FormButton")[0];
const formForm = nodes.filter((n) => n.type === "FormForm")[0];
const styleOps = [
  { label: "form", set_style: { id: { component: PAGE, element: formForm.id.element }, style_names: ["lp_form_stack"] } },
  ...inputs.map((n, i) => ({ label: "in" + i, set_style: { id: { component: PAGE, element: n.id.element }, style_names: ["lp_form_input"] } })),
  { label: "btn", set_style: { id: { component: PAGE, element: button.id.element }, style_names: ["lp_form_submit"] } },
];
call("data_element_tool", {
  context: "Apply the client-first form classes to the fields Webflow created by default.",
  siteId: SITE, pageId: PAGE, actions: styleOps,
});
console.log("styled", inputs.length, "inputs + submit + form");

// 4. settings: identity, redirect, field names/types/placeholders, button copy
const FIELDS = [
  { name: "First name", type: "text", ph: "Your first name", required: true },
  { name: "Phone", type: "tel", ph: "(281) 555-0123", required: true },
  { name: "Email", type: "email", ph: "you@example.com", required: true },
];
const text = (value) => ({ static_text: { value } });
const ops = [
  { element_id: { component: PAGE, element: formForm.id.element },
    settings: [{ key: "name", ...text("Cosmetic Hero Consultation") }, { key: "redirect", ...text(THANKYOU) }] },
  ...inputs.map((n, i) => ({
    element_id: { component: PAGE, element: n.id.element },
    settings: [
      { key: "name", ...text(FIELDS[i].name) },
      { key: "type", ...text(FIELDS[i].type) },
      { key: "required", static_boolean: { value: FIELDS[i].required } },
      { key: "attributes", attributes: [{ name_static: "placeholder", value_static: FIELDS[i].ph }] },
    ],
  })),
  { element_id: { component: PAGE, element: button.id.element },
    settings: [{ key: "buttonText", ...text("Request My Consultation") }] },
];
// ONE action carrying every operation. Sending one action PER ELEMENT applies only the
// first and reports success for the rest — that is how the field names silently stayed at
// Webflow's defaults ("Name", "Email", "Field") while the FormForm's name and redirect,
// which happened to be action 0, landed fine.
call("data_element_settings_tool", {
  context: "Write the hero form's identity, redirect, field names, types and placeholders.",
  siteId: SITE, pageId: PAGE,
  actions: [{ label: "settings", set_settings: { operations: ops } }],
});
console.log("settings written for", ops.length, "elements");

// 5. read back — a write echo is not proof
const after = walk(q(CARD, 4));
for (const n of after.filter((x) => /^Form(TextInput|Button|Form)$/.test(x.type))) {
  console.log(n.type, (n.styleNames || []).join("."), JSON.stringify(n.settings || {}).slice(0, 160));
}
