/* The before/after sliders are dead on Instatic and the cause is one CSS rule.
 *
 * An earlier session met the importer's `<input type=range>` -> `type="text"`
 * rewrite by hiding the stray text box and turning the whole `.pk-ba` figure
 * into a pointer-drag surface, implemented in a code asset `before-after.js`.
 * `retire-scripts.mjs` later disabled that asset, because site.js had taken
 * over and now COERCES the input back to a range. What it did not do is take
 * the CSS with it, so `runtime-states.css` still carries
 *
 *     .pk-ba input { display: none !important }
 *
 * which hides the very element site.js repairs. `!important` beats site.css's
 * `.pk-ba input[type=range]{opacity:0}` overlay, so every slider on the live
 * site is a static 50/50 split that cannot be dragged.
 *
 * Every gate stayed green because `sim-check` serves the pulled documents
 * against site.css and site.js only; runtime-states.css is never loaded there.
 * build-sim.mjs now copies it too.
 */
import { callJson, callWrite } from './instatic-mcp.mjs';

const readCode = (fileId) => callJson('site_read_code_asset', { fileId, maxChars: 100000 });
const patchCode = (fileId, expectedHash, oldText, newText) =>
  callWrite('site_patch_code_asset', { fileId, expectedHash, replacements: [{ oldText, newText }] });

const FILE = 'nk6AFzRk2twU4JIcKbxH4';   // src/styles/runtime-states.css

const OLD = `/* ba-drag-surface ---- before/after sliders ----
   Instatic rewrites the range input to type="text"; hide that stray box and make the
   figure itself the drag surface (the JS gives it role="slider" and a tabindex). */
.pk-ba input { display: none !important }
.pk-ba { cursor: ew-resize; touch-action: pan-y }
.pk-ba:focus-visible { outline: 2px solid var(--gold-light); outline-offset: 3px }`;

const NEW = `/* ---- before/after sliders ----
   Nothing to override here. The importer rewrites <input type=range> to
   type="text"; site.js coerces it back and site.css lays the (opacity 0)
   range over the whole figure, exactly as on every other host. The rules
   that used to live here hid that input for a pointer-drag implementation
   in before-after.js, and that asset was retired on 2026-08-19 -- the CSS
   outlived it and killed every slider on the site. Do not re-add it. */`;

const before = await readCode(FILE);
if (!before.content.includes(OLD)) {
  console.error('the ba-drag-surface block is not present verbatim; aborting');
  process.exit(1);
}
console.log('read', before.content.length, 'chars, hash', before.hash);

await patchCode(FILE, before.hash, OLD, NEW);

const after = await readCode(FILE);
console.log('after', after.content.length, 'chars');
console.log('display:none gone   ->', !/\.pk-ba input \{ display: none/.test(after.content));
console.log('range overlay kept  ->', /\.pk-ba input\[type=range\]/.test(after.content));
