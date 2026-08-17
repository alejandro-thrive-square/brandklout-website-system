#!/usr/bin/env node
// build-consult-form.mjs — replace the default form internals with the consult
// fields (single-step version of the local 2-step form).
import fs from 'node:fs';
import { el, div, txt, par, linkPhone, icon, callTool, PAGES } from './lib.mjs';

const PAGE = PAGES.consult.id;
const FORM_WRAPPER = '9f23c867-01e7-f002-fb11-fa7e93929027';
const FORM = '9f23c867-01e7-f002-fb11-fa7e93929028';
const DEFAULTS = ['9029', '902b', '902c', '902e', '902f'].map(s => '9f23c867-01e7-f002-fb11-fa7e9392' + s);

const step = process.argv[2] || 'all';

if (step === 'all' || step === 'clear') {
  const out = callTool('data_element_tool', {
    context: 'Remove the default form fields before appending the consult field set.',
    siteId: '698111847e9608eb30ee21c6', pageId: PAGE,
    actions: DEFAULTS.map((e, i) => ({ label: 'rm' + i, remove_element: { id: { component: PAGE, element: e } } })),
  });
  console.log('clear errors:', (out.match(/"error"/g) || []).length);
}

const label = (text) => el('FormBlockLabel', 'campaign-field-label', { set_text: { text } });
const input = (cls = 'campaign-input') => el('FormTextInput', cls);
const radio = () => el('FormRadioInput', 'campaign-choice');
const select = () => el('FormSelect', 'campaign-input');

const schema = [
  txt('campaign-form_legend', 'What would you like to replace?'),
  par('campaign-form_hint', 'Choose the closest answer. You can explain more by phone.'),
  div('campaign-choice-grid', radio(), radio(), radio(), radio()),
  div('campaign-field-row',
    div(null, label('First name *'), input()),
    div(null, label('Last name *'), input()),
  ),
  label('Mobile phone *'), input(),
  label('Email (optional)'), input(),
  div('campaign-field-row',
    div(null, label('Best time to reach you'), select()),
    div(null, label('Preferred contact'), select()),
  ),
  el('FormCheckboxInput', 'campaign-checkbox-row'),
  par('campaign-privacy-note', 'Please do not include private medical details here. We will discuss health history securely.'),
  el('FormButton', ['campaign-button', 'is-gold', 'is-full'], { set_text: { text: 'Request my consultation' } }),
  par('campaign-form_callout', 'Prefer to talk? Call (281) 789-8836'),
];

if (step === 'all' || step === 'fields') {
  for (const [i, tree] of schema.entries()) {
    const out = callTool('data_element_builder', {
      context: 'Append consult form fields to the native Webflow form.',
      siteId: '698111847e9608eb30ee21c6', pageId: PAGE,
      actions: [{ build_label: 'f' + i, parent_element_id: { component: PAGE, element: FORM }, creation_position: 'append', element_schema: tree }],
    });
    const ok = /success/i.test(out);
    console.log('field', i, ok ? 'ok' : 'FAIL ' + out.slice(0, 300));
    if (!ok) process.exit(1);
  }
}

if (step === 'all' || step === 'dump') {
  const out = callTool('data_element_tool', {
    context: 'Dump the rebuilt form subtree to wire input names and options.',
    siteId: '698111847e9608eb30ee21c6', pageId: PAGE,
    actions: [{ label: 'tree', query_elements: { queries: [{ label: 'q', element_id: { component: PAGE, element: FORM_WRAPPER }, children_depth: -1 }] } }],
  });
  fs.writeFileSync('.consultform.json', out);
  console.log('dumped', out.length, 'bytes');
}
