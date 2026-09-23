#!/usr/bin/env node
// swap-chrome.mjs <pageKey> <builtLog> — replace the per-page chrome elements
// with instances of the shared Campaign components, then set per-page props.
import fs from 'node:fs';
import { callTool, PAGES } from './lib.mjs';

const COMPS = {
  announce: '312fbb72-c97a-2c98-5353-378ed2f5fc60',
  header: 'f31deacc-7a10-b626-177d-4556827d6ed4',
  footer: '82f42c9f-26da-a605-22f9-f876f889920c',
  mobileBar: '3a92163f-1bfe-2aac-958b-d2072a4df9cd',
};
const PROPS = {
  annText: '9bc62263-e94d-6df3-b32c-81df70749e40',
  annNote: 'f8c4dfce-e2eb-a756-6844-0c4a3d10ae48',
  hdrLabel: 'ceab590f-2892-7b10-d10f-2f6711116324',
  hdrLink: '02126a32-97d2-77bb-245c-cc28e637a2a9',
  hdrShow: '38ea9a10-b742-af3e-7ab6-115b123e4f8a',
  ftrLabel: '7602590c-e656-79b8-3d01-63193f7b23e8',
  ftrLink: 'c36b0336-91ef-5bee-b44a-56b9eddd1dda',
  barLabel: 'f9a8cb2f-ba2c-9449-86d1-4abc2f2e9782',
  barLink: '4207aaf3-12e6-89fd-ceb5-1212f71fdf0b',
};

// per-page prop overrides
const OVERRIDES = {
  emergency: {
    announce: [
      { prop_id: PROPS.annText, type: 'string', string_value: 'Same-day emergency visits' },
      { prop_id: PROPS.annNote, type: 'string', string_value: '· Extended hours & Saturdays' },
    ],
    header: [{ prop_id: PROPS.hdrLabel, type: 'string', string_value: 'Request urgent visit' }],
    footer: [{ prop_id: PROPS.ftrLabel, type: 'string', string_value: 'Request urgent visit' }],
    mobileBar: [{ prop_id: PROPS.barLabel, type: 'string', string_value: 'Request urgent visit' }],
  },
  consult: {
    header: [{ prop_id: PROPS.hdrLink, type: 'link', link_mode: 'url', link_to: '#consult-form' }],
    footer: [{ prop_id: PROPS.ftrLink, type: 'link', link_mode: 'url', link_to: '#consult-form' }],
    mobileBar: [{ prop_id: PROPS.barLink, type: 'link', link_mode: 'url', link_to: '#consult-form' }],
  },
  thankyou: {
    header: [{ prop_id: PROPS.hdrShow, type: 'boolean', boolean_value: false }],
  },
};

const pageKey = process.argv[2];
const logName = process.argv[3];
const page = PAGES[pageKey];
const built = JSON.parse(fs.readFileSync(logName, 'utf8'));

for (const part of Object.keys(COMPS)) {
  const oldId = built[part];
  if (typeof oldId !== 'string') { console.error('no built id for', part); continue; }
  // 1. insert instance before the old element
  const ins = callTool('data_component_tool', {
    context: 'Insert shared chrome component instance beside the page-local copy before removing it.',
    siteId: '698111847e9608eb30ee21c6', pageId: page.id,
    actions: [{ label: 'ins-' + part, insert_component_instance: { component_id: COMPS[part], parent_element_id: { component: page.id, element: oldId }, creation_position: 'before' } }],
  });
  const instId = (ins.match(/"element":"([0-9a-f-]+)"/) || [])[1];
  if (!instId || /"error"/.test(ins)) { console.error('INSERT FAIL', part, ins.slice(0, 300)); process.exitCode = 1; continue; }
  // 2. remove old element
  const rm = callTool('data_element_tool', {
    context: 'Remove the page-local chrome element replaced by the shared component instance.',
    siteId: '698111847e9608eb30ee21c6', pageId: page.id,
    actions: [{ label: 'rm-' + part, remove_element: { id: { component: page.id, element: oldId } } }],
  });
  if (/"error"/i.test(rm)) { console.error('REMOVE FAIL', part, rm.slice(0, 300)); process.exitCode = 1; }
  // 3. per-page prop overrides
  const ov = (OVERRIDES[pageKey] || {})[part];
  if (ov && ov.length) {
    const set = callTool('data_component_props_tool', {
      context: 'Set per-page prop values on the inserted chrome component instance.',
      siteId: '698111847e9608eb30ee21c6', pageId: page.id,
      actions: [{ label: 'props-' + part, set_component_instance_prop_values: { element_id: { component: page.id, element: instId }, values: ov } }],
    });
    if (/"error"/i.test(set)) { console.error('PROPS FAIL', part, set.slice(0, 300)); process.exitCode = 1; }
    else console.log(part, 'instance + props ok');
  } else {
    console.log(part, 'instance ok');
  }
}
