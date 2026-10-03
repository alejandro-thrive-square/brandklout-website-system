// Client workaround, 2026-09-30. tools/instatic-site/push/upload-media.mjs and set-alt.mjs use P.WORK / P.DIST
// but never import lib/paths.mjs (lost in the 2026-09-23 promotion), so they die with "P is not defined".
// Preloading this file gives them the same module as a global, without editing the toolkit copy:
//   node --import ./output/code/preload-paths.mjs ../../tools/instatic-site/push/upload-media.mjs
// Remove once main carries the missing import.
import * as P from '../../../../tools/instatic-site/lib/paths.mjs';
globalThis.P = P;
