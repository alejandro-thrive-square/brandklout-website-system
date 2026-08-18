#!/usr/bin/env node
/** probe3 — <details>/<summary> as native elements, :hover, combo classes, media queries. */
import { call, SITES } from './wf.mjs';

const PAGE = '6a83e962d17d0bfe618c49f7';
const BODY = { component: PAGE, element: '6a83e962d17d0bfe618c49fd' };

const res = call('data_whtml_builder', [
  {
    build_label: 'details-faq-skip',
    parent_element_id: BODY,
    creation_position: 'append',
    html: '<div class="probe-faq_list"><details class="probe-faq_item" open><summary class="probe-faq_toggle">Question one<span class="probe-faq_plus">+</span></summary><div class="probe-faq_answer">Answer one.</div></details></div>',
    css: '.probe-faq_item{border-bottom:1px solid #d8d1c6;padding-top:18px;padding-bottom:18px}.probe-faq_toggle{display:flex;justify-content:space-between;align-items:center;cursor:pointer;font-weight:700;list-style:none}.probe-faq_answer{padding-top:12px;color:#5f5f5d}',
    return_element_info: true,
  },
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
