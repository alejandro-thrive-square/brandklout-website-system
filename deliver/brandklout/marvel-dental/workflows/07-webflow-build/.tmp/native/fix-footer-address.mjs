/**
 * The city was authored as a separate <p> beside the street link, so the flex
 * column gave it a row gap and the address read as two unrelated lines. The
 * landing page has always shipped one link with a <br>; this makes the other
 * two match it.
 */
import { call, SITES } from './wf.mjs';

const HREF = 'https://maps.app.goo.gl/b4ZwRQypmm1cJ1316';
const HTML = `<a class="camp_footer_link" href="${HREF}">1113 Main Avenue, Suite A<br>Clifton, NJ 07011</a>`;

const PAGES = {
  consult: { page: '6a87561bee07bd22cd8998cb', link: '007d81fa-ca56-efb9-f92f-2677c987c220', city: '007d81fa-ca56-efb9-f92f-2677c987c222' },
  ty:      { page: '6a875664e0d205ff3cbd0121', link: 'c032a715-f971-c89a-1964-63af5a858c3e', city: 'c032a715-f971-c89a-1964-63af5a858c40' },
};

const which = process.argv[2];
const t = PAGES[which];
if (!t) { console.log('usage: fix-address.mjs consult|ty'); process.exit(1); }
const o = { site: SITES.marvel, page: t.page };

const ins = call('data_whtml_builder', [{
  build_label: 'address',
  parent_element_id: { component: t.page, element: t.link },
  creation_position: 'after',
  html: HTML,
  return_element_info: true,
}], o);
console.log('insert:', JSON.stringify(ins).slice(0, 600));

const ok = JSON.stringify(ins).includes('"success"') || JSON.stringify(ins).toLowerCase().includes('inserted');
if (!ok) { console.log('insert did not report success; nothing removed'); process.exit(1); }

const rm = call('data_element_tool', [
  { label: 'rm-old-link', remove_element: { id: { component: t.page, element: t.link } } },
  { label: 'rm-city-p',   remove_element: { id: { component: t.page, element: t.city } } },
], o);
console.log('remove:', JSON.stringify(rm).slice(0, 600));
