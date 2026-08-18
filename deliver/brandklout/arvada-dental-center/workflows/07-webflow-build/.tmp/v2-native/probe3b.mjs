#!/usr/bin/env node
/** probe3 — <details>/<summary> as native elements, :hover, combo classes, media queries. */
import { call, SITES } from './wf.mjs';

const PAGE = '6a83e962d17d0bfe618c49f7';
const BODY = { component: PAGE, element: '6a83e962d17d0bfe618c49fd' };

const res = call('data_whtml_builder', [
  {
    build_label: 'hover-combo-media',
    parent_element_id: BODY,
    creation_position: 'append',
    html: '<div class="probe-row"><a class="probe-button" href="#top">Book now<span class="probe-button_chev">›</span></a><a class="probe-button is-light" href="#top">Secondary<span class="probe-button_chev">›</span></a></div>',
    css: [
      '.probe-row{display:grid;grid-template-columns:1fr 1fr;gap:24px}',
      '.probe-button{display:inline-flex;align-items:center;justify-content:center;gap:18px;min-height:51px;padding:13px 24px;background-color:#c8b282;color:#403830;font-weight:700;text-transform:uppercase}',
      '.probe-button:hover{background-color:#d3aa5a}',
      '.probe-button.is-light{background-color:#ffffff;color:#403830}',
      '.probe-button_chev{font-size:19px;line-height:1}',
      '@media screen and (max-width: 991px){.probe-row{grid-template-columns:1fr}}',
      '@media screen and (max-width: 767px){.probe-button{min-height:48px}}',
    ].join(''),
    return_element_info: true,
  },
], { site: SITES.arvada, page: PAGE });

console.log(JSON.stringify(res, null, 1).slice(0, 5000));
