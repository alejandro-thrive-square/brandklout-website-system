#!/usr/bin/env node
/**
 * probe-whtml.mjs — prove the native build route end to end on one small section.
 *
 * Feeds the client reference's announce bar (HTML + its own CSS, :root vars resolved to
 * concrete values) through data_whtml_builder and reads back what Webflow actually made:
 * element types, class names, and whether the classes carry real properties.
 */
import { call, SITES } from './wf.mjs';

const PAGE = '6a83e962d17d0bfe618c49f7';               // Dental Implants v2
const BODY = { component: PAGE, element: '6a83e962d17d0bfe618c49fd' };

const html = `<section class="campaign-announce"><div class="campaign-container campaign-announce_inner"><div><span class="campaign-announce_lead">Free implant consultation</span><span class="campaign-announce_note">· Monday–Friday appointments</span></div><a class="campaign-announce_link" href="tel:+13034217611">(303) 421-7611</a></div></section>`;

const css = `
.campaign-container{width:min(1180px,calc(100% - 48px));margin-left:auto;margin-right:auto}
.campaign-announce{height:36px;background-color:#403830;color:#ffffff;font-size:12px}
.campaign-announce_inner{height:100%;display:flex;align-items:center;justify-content:space-between}
.campaign-announce_lead{font-weight:700}
.campaign-announce_note{opacity:.72;margin-left:5px}
.campaign-announce_link{font-family:AreaExtended;font-size:11px;font-weight:700;letter-spacing:.04em;color:#c8b282}
`;

const res = call('data_whtml_builder', [{
  build_label: 'announce',
  parent_element_id: BODY,
  creation_position: 'append',
  html,
  css,
  return_element_info: true,
}], { site: SITES.arvada, page: PAGE });

console.log(JSON.stringify(res, null, 1).slice(0, 6000));
