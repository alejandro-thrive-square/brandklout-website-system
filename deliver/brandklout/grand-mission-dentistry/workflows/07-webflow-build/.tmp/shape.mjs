import { callTool } from './wfmcp.mjs';
const r = await callTool('data_element_tool', {
  siteId: '698111847e9608eb30ee21c6', pageId: '6a724b6977f9b0019d2a03f8',
  context: 'Inspecting the response envelope shape of get_all_elements so the diagnostic script can parse it correctly. Read-only.',
  actions: [{ label: 'tree', get_all_elements: {} }],
});
console.log('TEXT LENGTH:', r.text.length);
console.log(r.text.slice(0, 1500));
