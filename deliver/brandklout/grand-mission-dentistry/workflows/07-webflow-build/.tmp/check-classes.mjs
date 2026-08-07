/**
 * check-classes.mjs — prove the build added no Webflow classes.
 *
 * The claim that matters on a live 303-page site: an embed-based build creates
 * no global styles, so none of the site's existing classes can be restyled or
 * forked. This diffs the post-build style-name set against the pre-build
 * snapshot taken before anything was written.
 */
import fs from 'node:fs';
import { callTool } from './wfmcp.mjs';
const r = await callTool('data_style_tool', {
  siteId: '698111847e9608eb30ee21c6', pageId: '6a724b6977f9b0019d2a03f8',
  context: 'Counting site classes after the build to prove the embed based approach created no new global styles on this large production site.',
  actions: [{ label: 'all', get_styles: { query: 'all' } }],
});
const post = new Set(JSON.parse(r.text).result.map((s) => s.name).filter(Boolean));
fs.writeFileSync('site-classes-after.txt', [...post].sort().join('\n'));

const before = fs.existsSync('site-classes-before.txt')
  ? new Set(fs.readFileSync('site-classes-before.txt', 'utf8').trim().split(/\r?\n/))
  : null;
console.log('site style names after build :', post.size);
if (!before) { console.log('(no pre-build snapshot to diff against)'); process.exit(0); }
console.log('site style names before build:', before.size);
const added = [...post].filter((n) => !before.has(n)).sort();
const removed = [...before].filter((n) => !post.has(n)).sort();
console.log('ADDED  :', added.length ? added.join(', ') : '(none)');
console.log('REMOVED:', removed.length ? removed.join(', ') : '(none)');

// And the design's own distinctive class names must be absent entirely.
const design = fs.readFileSync('design-class-names.txt', 'utf8').trim().split(/\r?\n/);
const present = design.filter((n) => post.has(n));
console.log(`\n${design.length} design class names; ${present.length} exist as Webflow styles:`);
console.log('  ' + (present.join(', ') || '(none)'));
console.log('  of those, pre-existing before this build:', present.filter((n) => before.has(n)).length);
