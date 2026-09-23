#!/usr/bin/env node
// wire-form.mjs — settings pass for the consult form: input names, radio
// values, redirect, button text, and every label's copy.
import fs from 'node:fs';
import { callTool, PAGES } from './lib.mjs';

const PAGE = PAGES.consult.id;
const raw = fs.readFileSync('.consultform.json', 'utf8');
const ids = [...new Set([...raw.matchAll(/"element":"([0-9a-f-]{30,})"/g)].map(m => m[1]))];
const by = (suf) => {
  const hit = ids.find(i => i.endsWith(suf));
  if (!hit) throw new Error('no id ending ' + suf);
  return hit;
};
const E = (suf) => ({ component: PAGE, element: by(suf) });

const text = (v) => ({ key: 'text', static_text: { value: v } });
const op = (suf, ...settings) => ({ label: suf, element_id: E(suf), settings });

const stage = process.argv[2] || 'all';

if (stage === 'all' || stage === 'settings') {
  const ops = [
    // form identity + redirect
    op('93929027', { key: 'domId', static_text: { value: 'consult-form' } }),
    op('93929028',
      { key: 'name', static_text: { value: 'Dental Implant Consultation' } },
      { key: 'redirect', static_text: { value: '/ads-landing-pages/new-dental-implants-thank-you' } },
    ),
    // radios: shared group, distinct values
    op('8646c50f', { key: 'groupName', static_text: { value: 'concern' } }, { key: 'value', static_text: { value: 'One missing tooth' } }, { key: 'required', static_boolean: { value: true } }),
    op('6c3199f7', { key: 'groupName', static_text: { value: 'concern' } }, { key: 'value', static_text: { value: 'Several missing teeth' } }),
    op('a588ff4a', { key: 'groupName', static_text: { value: 'concern' } }, { key: 'value', static_text: { value: 'Most or all teeth' } }),
    op('8d223d21', { key: 'groupName', static_text: { value: 'concern' } }, { key: 'value', static_text: { value: 'A failing implant placed elsewhere' } }),
    // radio labels
    op('8646c510', text('One missing tooth')),
    op('6c3199f8', text('Several missing teeth')),
    op('a588ff4b', text('Most or all teeth')),
    op('8d223d22', text('A failing implant placed elsewhere')),
    // text inputs
    op('d9c8111c', { key: 'name', static_text: { value: 'First name' } }),
    op('4100836d', { key: 'name', static_text: { value: 'Last name' } }),
    op('c32a8e1e', { key: 'name', static_text: { value: 'Phone' } }, { key: 'type', static_text: { value: 'tel' } }, { key: 'attributes', attributes: [{ name_static: 'placeholder', value_static: '(281) 555-0123' }] }),
    op('f13e6be5', { key: 'name', static_text: { value: 'Email' } }, { key: 'type', static_text: { value: 'email' } }, { key: 'required', static_boolean: { value: false } }, { key: 'attributes', attributes: [{ name_static: 'placeholder', value_static: 'you@example.com' }] }),
    // checkbox
    op('5c8354b1', { key: 'name', static_text: { value: 'Contact consent' } }, { key: 'required', static_boolean: { value: true } }),
    op('5c8354b2', text('I authorize Grand Mission Dentistry to contact me about this request by phone, email, or text. Consent is not a condition of purchase. Message and data rates may apply; reply STOP to opt out.')),
    // button
    op('7c3c8c30', { key: 'buttonText', static_text: { value: 'Request my consultation' } }),
    // copy
    op('3facc73c', text('What would you like to replace?')),
    op('5aedb6c0', text('Choose the closest answer. You can explain more by phone.')),
    op('4dc28bc9', text('First name *')),
    op('b701b64c', text('Last name *')),
    op('1c1d3133', text('Mobile phone *')),
    op('14babc06', text('Email (optional)')),
    op('d0e615fa', text('Best time to reach you')),
    op('4d71300a', text('Preferred contact')),
    op('e6f0e98c', text('Please do not include private medical details here. We will discuss health history securely.')),
    op('202d2e4e', text('Prefer to talk? Call (281) 789-8836')),
    // success / error messages
    op('93929032', text('Thank you! Your request has been received. Keep your phone nearby — the team will call to confirm.')),
    op('93929035', text('We could not send your request. Please call (281) 789-8836.')),
  ];
  for (let i = 0; i < ops.length; i += 10) {
    const out = callTool('data_element_settings_tool', {
      context: 'Wire consult form input names, values, redirect, and label copy.',
      siteId: '698111847e9608eb30ee21c6', pageId: PAGE,
      actions: [{ label: 'b' + i, set_settings: { operations: ops.slice(i, i + 10) } }],
    });
    const errs = (out.match(/"error"/gi) || []).length;
    console.log('batch', i, 'errors:', errs, errs ? out.slice(0, 600) : '');
  }
}

if (stage === 'all' || stage === 'selects') {
  // Replace the two option-less selects with text inputs (options are not
  // settable through this API surface).
  const acts = [];
  acts.push({ label: 'rm-sel1', remove_element: { id: E('e7e285b8') } });
  acts.push({ label: 'rm-sel2', remove_element: { id: E('0492defa') } });
  const out = callTool('data_element_tool', {
    context: 'Remove option-less selects to replace with text inputs.',
    siteId: '698111847e9608eb30ee21c6', pageId: PAGE, actions: acts,
  });
  console.log('remove selects errors:', (out.match(/"error"/gi) || []).length);
  const mk = (parentSuf, name) => callTool('data_element_builder', {
    context: 'Append replacement text inputs for the removed selects.',
    siteId: '698111847e9608eb30ee21c6', pageId: PAGE,
    actions: [{
      build_label: name, parent_element_id: E(parentSuf), creation_position: 'append',
      element_schema: { type: 'FormTextInput', set_style: { style_names: ['campaign-input'] } },
    }],
  });
  console.log('input1:', /success/i.test(mk('a1fa170f', 'best-time')) ? 'ok' : 'FAIL');
  console.log('input2:', /success/i.test(mk('d2522335', 'contact-method')) ? 'ok' : 'FAIL');
}
