#!/usr/bin/env node
// form-hero.mjs — finish the hero card's native form on any v2 page.
//
// `type: "Form"` does not create an empty wrapper: it creates a COMPLETE Webflow form —
// FormWrapper > FormForm with two LABELLED text inputs and a submit button, plus success and
// error messages. So this ADJUSTS that default rather than building fields:
//   - drop the two default FormBlockLabels, then add our own three (visible labels are used
//     because `placeholder` is a RESERVED attribute name and cannot be set or removed)
//   - append a third text input
//   - move the flex stack onto the FormForm, style the fields
//   - names / types / required / redirect are SETTINGS, written after the fields exist
//
// Usage: node form-hero.mjs <v2-slug> <redirect-path>
import { call, SITE, page } from "./lib.mjs";

const SLUG = process.argv[2] || "cosmetic-v2";
const REDIRECT = process.argv[3] || "/ads-landing-pages/cosmetic-thank-you-v2";
const P = page(SLUG);
const walk = (n, o = []) => { o.push(n); (n.children || []).forEach((k) => walk(k, o)); return o; };
const readPage = () => walk(call("data_element_tool", {
  context: "Read the v2 page to find and finish its hero form.",
  siteId: SITE, pageId: P.page,
  actions: [{ label: "b", query_elements: { queries: [{ label: "b", element_id: { component: P.page, element: P.body }, children_depth: -1 }] } }],
})[0].result[0].data[0].matches[0]);

const FIELDS = [
  { name: "First name", type: "text" },
  { name: "Phone", type: "tel" },
  { name: "Email", type: "email" },
];

let nodes = readPage();
const form = nodes.find((n) => n.type === "FormForm");
if (!form) throw new Error("no FormForm on " + SLUG);

// 1. remove the default labels (ours are added with the right copy below)
for (const lab of nodes.filter((n) => n.type === "FormBlockLabel")) {
  call("data_element_tool", {
    context: "Remove a default form label before adding the labelled fields.",
    siteId: SITE, pageId: P.page,
    actions: [{ label: "rm", remove_element: { id: { component: P.page, element: lab.id.element } } }],
  });
}

// 2. a third input, before the submit button
nodes = readPage();
const btn = nodes.find((n) => n.type === "FormButton");
if (nodes.filter((n) => n.type === "FormTextInput").length < 3) {
  call("data_element_builder", {
    context: "Add the third hero form field.",
    siteId: SITE, pageId: P.page,
    actions: [{
      build_label: "third", parent_element_id: { component: P.page, element: btn.id.element },
      creation_position: "before",
      element_schema: { type: "FormTextInput", set_style: { style_names: ["lp_form_input"] } },
    }],
  });
}

// 3. a visible label before each field
nodes = readPage();
let inputs = nodes.filter((n) => n.type === "FormTextInput");
inputs.forEach((n, i) => {
  call("data_element_builder", {
    context: "Insert a visible label above a hero form field (placeholders are unreachable).",
    siteId: SITE, pageId: P.page,
    actions: [{
      build_label: "lab" + i, parent_element_id: { component: P.page, element: n.id.element },
      creation_position: "before",
      element_schema: { type: "FormBlockLabel", set_style: { style_names: ["lp_form_label"] }, set_text: { text: FIELDS[i].name } },
    }],
  });
});

// 4. styles on what Webflow generated
nodes = readPage();
inputs = nodes.filter((n) => n.type === "FormTextInput");
const submit = nodes.find((n) => n.type === "FormButton");
const formForm = nodes.find((n) => n.type === "FormForm");
call("data_element_tool", {
  context: "Apply the client-first form classes to the generated form parts.",
  siteId: SITE, pageId: P.page,
  actions: [
    { label: "form", set_style: { id: { component: P.page, element: formForm.id.element }, style_names: ["lp_form_stack"] } },
    ...inputs.map((n, i) => ({ label: "in" + i, set_style: { id: { component: P.page, element: n.id.element }, style_names: ["lp_form_input"] } })),
    { label: "btn", set_style: { id: { component: P.page, element: submit.id.element }, style_names: ["lp_form_submit"] } },
  ],
});

// 5. settings in ONE operations batch — one action per element applies only the first
call("data_element_settings_tool", {
  context: "Write the hero form identity, redirect, field names, types and required flags.",
  siteId: SITE, pageId: P.page,
  actions: [{
    label: "settings",
    set_settings: {
      operations: [
        { element_id: { component: P.page, element: formForm.id.element },
          settings: [{ key: "name", static_text: { value: `${SLUG} hero consultation` } },
                     { key: "redirect", static_text: { value: REDIRECT } }] },
        ...inputs.map((n, i) => ({
          element_id: { component: P.page, element: n.id.element },
          settings: [
            { key: "name", static_text: { value: FIELDS[i].name } },
            { key: "type", static_text: { value: FIELDS[i].type } },
            { key: "required", static_boolean: { value: true } },
            { key: "domId", static_text: { value: FIELDS[i].name.toLowerCase().replace(/\s+/g, "-") } },
          ],
        })),
        { element_id: { component: P.page, element: submit.id.element },
          settings: [{ key: "buttonText", static_text: { value: "Request My Consultation" } }] },
      ],
    },
  }],
});

// 6. read back
for (const n of readPage().filter((x) => x.type === "FormTextInput")) {
  const s = call("data_element_settings_tool", {
    context: "Read a hero form field back.",
    siteId: SITE, pageId: P.page,
    actions: [{ label: "g", get_settings: { type: "all_raw_settings", element_id: { component: P.page, element: n.id.element } } }],
  })[0].result[0].data.matches.filter((m) => /^(name|type|required)$/.test(m.key));
  console.log("field", JSON.stringify(s));
}
