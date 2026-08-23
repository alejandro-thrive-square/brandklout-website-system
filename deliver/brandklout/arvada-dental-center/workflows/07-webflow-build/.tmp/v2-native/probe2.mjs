#!/usr/bin/env node
/**
 * probe2.mjs — the two questions that decide the build architecture.
 *
 * 1. Does whtml_builder REUSE an existing site class when the fragment ships no CSS for it?
 *    If yes, the class layer is built once and every later page insert is markup-only.
 * 2. Do <details>/<summary> survive as native elements? The reference FAQ is JS-free and
 *    depends on them.
 * 3. Do :after / :before rules in the raw CSS land as Webflow pseudo styles?
 */
import { call, SITES } from './wf.mjs';

const PAGE = '6a83e962d17d0bfe618c49f7';
const BODY = { component: PAGE, element: '6a83e962d17d0bfe618c49fd' };

const res = call('data_whtml_builder', [
  {
    build_label: 'reuse-no-css',
    parent_element_id: BODY,
    creation_position: 'append',
    html: '<div class="campaign-container"><p class="campaign-announce_lead">reuse probe</p></div>',
    return_element_info: true,
  },
  {
    build_label: 'details-faq',
    parent_element_id: BODY,
    creation_position: 'append',
    html: '<div class="probe-faq_list"><details class="probe-faq_item" open><summary class="probe-faq_toggle">Question one<span class="probe-faq_plus">+</span></summary><div class="probe-faq_answer">Answer one.</div></details></div>',
    css: '.probe-faq_item{border-bottom:1px solid #d8d1c6;padding-top:18px;padding-bottom:18px}.probe-faq_toggle{display:flex;justify-content:space-between;align-items:center;cursor:pointer;font-weight:700}.probe-faq_toggle::-webkit-details-marker{display:none}.probe-faq_answer{padding-top:12px;color:#5f5f5d}',
    return_element_info: true,
  },
  {
    build_label: 'pseudo',
    parent_element_id: BODY,
    creation_position: 'append',
    html: '<a class="probe-button" href="#top">Book now</a>',
    css: '.probe-button{display:inline-flex;align-items:center;justify-content:center;gap:18px;min-height:51px;padding:13px 24px;background-color:#c8b282;color:#403830;font-weight:700;text-transform:uppercase}.probe-button:after{content:"\\203A";font-size:19px;line-height:1}.probe-button:hover{background-color:#d3aa5a}',
    return_element_info: true,
  },
], { site: SITES.arvada, page: PAGE });

console.log(JSON.stringify(res, null, 1).slice(0, 7000));
