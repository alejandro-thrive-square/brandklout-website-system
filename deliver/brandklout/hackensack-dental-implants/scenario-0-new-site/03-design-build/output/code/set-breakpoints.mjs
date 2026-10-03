// Client script, 2026-09-30. Gives the Instatic editor the house breakpoints (step 2 of the
// design-build directive): Desktop as the base, then 1279, 991, 767, 479. A fresh instance has
// Mobile 375 / Tablet 768 / Desktop 1440, and push-site.mjs leaves them as it finds them.
// `desktop` stays first: it is the editor's base frame, and without it every panel edit lands
// under a max-width query and looks unpublished at 1280 and over.
// Only the editor's tabs change. The site's own stylesheet rules are site conditions and are untouched.
// Usage (from the step folder): INSTATIC_BASE_URL=https://<staging host> node output/code/set-breakpoints.mjs [--apply]
import { getSite, saveShell, BASE } from '../../../../tools/instatic-site/lib/site.mjs';

const WANT = [
  { id: 'desktop', label: 'Desktop', width: 1440, mediaQuery: '(max-width: 1440px)', icon: 'monitor' },
  { id: 'laptop', label: 'Laptop', width: 1279, mediaQuery: '(max-width: 1279px)', icon: 'monitor' },
  { id: 'tablet', label: 'Tablet', width: 991, mediaQuery: '(max-width: 991px)', icon: 'tablet' },
  { id: 'mobile-l', label: 'Mobile landscape', width: 767, mediaQuery: '(max-width: 767px)', icon: 'smartphone' },
  { id: 'mobile', label: 'Mobile portrait', width: 479, mediaQuery: '(max-width: 479px)', icon: 'smartphone' },
];
const { site, seq } = await getSite();
const have = JSON.stringify(site.breakpoints ?? []);
console.log(`${BASE}\n  now   ${(site.breakpoints ?? []).map((b) => `${b.id}:${b.width}`).join(' ')}\n  want  ${WANT.map((b) => `${b.id}:${b.width}`).join(' ')}`);
if (have === JSON.stringify(WANT)) console.log('  already set');
else if (!process.argv.includes('--apply')) console.log('dry run; re-run with --apply');
else {
  const res = await saveShell({ ...site, breakpoints: WANT }, seq);
  const after = (await getSite()).site.breakpoints ?? [];
  console.log(`  saved ${JSON.stringify(res).slice(0, 60)}; now ${after.map((b) => `${b.id}:${b.width}`).join(' ')}`);
  if (JSON.stringify(after) !== JSON.stringify(WANT)) process.exitCode = 1;
}
