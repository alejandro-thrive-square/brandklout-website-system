/**
 * Downloads the two typefaces and writes a local @font-face stylesheet.
 *
 * WHY. Client, 2026-09-01: "Everything should be local." Until now the build
 * pulled Cormorant Garamond and Inter from fonts.googleapis.com on every page
 * load, which is the last remote dependency in a site that already vendors its
 * own JavaScript. Three reasons it matters here beyond the instruction:
 *
 *   - It is a render-blocking request to a third party on a MEDICAL practice's
 *     site, and it tells Google the IP of everyone who visits.
 *   - The whole design is two typefaces. If that request is slow or blocked,
 *     the page falls back to Georgia and Arial and stops being the design.
 *   - The client-review file (make-preview.mjs) is meant to be self-contained
 *     and was not: open it on a plane and the type was wrong.
 *
 * SUBSETTING. Latin only, and only the weights the stylesheets actually use:
 *
 *   Cormorant Garamond  300, 400, 400 italic     display
 *   Inter               400, 500, 600, 700       body, labels, buttons
 *
 * The head partial asked for six Cormorant cuts and five Inter cuts; a grep of
 * css/ for `font-weight` shows 500 and 600 are never set on the display face
 * and Cormorant 300 italic is never used, so those are not downloaded. Adding
 * one back is a line in WANTED plus a re-run.
 *
 * Usage:  node get-fonts.mjs          download anything missing
 *         node get-fonts.mjs --force  re-download everything
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.join(HERE, "assets", "fonts");
const OUT_CSS = path.join(HERE, "css", "03-fonts.css");
const force = process.argv.includes("--force");

/* Google serves different formats by User-Agent. This one gets woff2. */
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const WANTED = [
  { family: "Cormorant Garamond", css: "Cormorant+Garamond", weight: 300, style: "normal", file: "cormorant-garamond-300" },
  { family: "Cormorant Garamond", css: "Cormorant+Garamond", weight: 400, style: "normal", file: "cormorant-garamond-400" },
  { family: "Cormorant Garamond", css: "Cormorant+Garamond", weight: 400, style: "italic", file: "cormorant-garamond-400-italic" },
  { family: "Inter", css: "Inter", weight: 400, style: "normal", file: "inter-400" },
  { family: "Inter", css: "Inter", weight: 500, style: "normal", file: "inter-500" },
  { family: "Inter", css: "Inter", weight: 600, style: "normal", file: "inter-600" },
  { family: "Inter", css: "Inter", weight: 700, style: "normal", file: "inter-700" },
];

fs.mkdirSync(FONT_DIR, { recursive: true });

async function fetchCss(spec) {
  const ital = spec.style === "italic" ? "ital," : "";
  const axis = spec.style === "italic" ? `1,${spec.weight}` : `${spec.weight}`;
  const url = `https://fonts.googleapis.com/css2?family=${spec.css}:${ital}wght@${axis}&display=swap`;
  const r = await fetch(url, { headers: { "User-Agent": UA } });
  if (!r.ok) throw new Error(`${url} -> ${r.status}`);
  return r.text();
}

/* Google splits a family into unicode-range blocks. Only the `latin` one is
   wanted: the site is English and Spanish, both of which latin covers, and
   taking the lot would triple the weight for glyph sets nobody renders. */
function latinBlock(css) {
  const blocks = css.split("@font-face").slice(1);
  for (const b of blocks) {
    if (!/unicode-range:[^;]*U\+0000-00FF/.test(b)) continue;
    const m = b.match(/src:\s*url\((https:[^)]+\.woff2)\)/);
    if (m) return m[1];
  }
  // Some families ship one block with no unicode-range at all.
  const m = css.match(/src:\s*url\((https:[^)]+\.woff2)\)/);
  if (!m) throw new Error("no woff2 url in the returned css");
  return m[1];
}

const log = [];
for (const spec of WANTED) {
  const dest = path.join(FONT_DIR, `${spec.file}.woff2`);
  if (!force && fs.existsSync(dest)) {
    log.push(`skip  ${spec.file}.woff2`);
    continue;
  }
  const css = await fetchCss(spec);
  const url = latinBlock(css);
  const bin = await fetch(url, { headers: { "User-Agent": UA } });
  if (!bin.ok) throw new Error(`download ${url} -> ${bin.status}`);
  fs.writeFileSync(dest, Buffer.from(await bin.arrayBuffer()));
  log.push(`ok    ${spec.file}.woff2  ${(fs.statSync(dest).size / 1024).toFixed(1)}KB`);
}

/* --- the stylesheet ------------------------------------------------------
   Named 03-fonts.css so it lands after 02-base.css and before every component
   file, because css/ is concatenated in filename order and @font-face has to be
   declared before the rules that use the family. */
const faces = WANTED.map(
  (s) => `@font-face {
  font-family: "${s.family}";
  font-style: ${s.style};
  font-weight: ${s.weight};
  font-display: swap;
  src: url("fonts/${s.file}.woff2") format("woff2");
  /* Latin only. The practice serves English and Spanish and both are covered;
     the Cyrillic, Greek and Vietnamese blocks Google also ships would roughly
     triple the download for glyphs this site never renders. */
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
    U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215,
    U+FEFF, U+FFFD;
}`
).join("\n\n");

const header = `/* ===========================================================================
   THE TYPEFACES, SELF-HOSTED. Generated by site-src/get-fonts.mjs.

   Client, 2026-09-01: "Everything should be local." This replaces the
   render-blocking fonts.googleapis.com stylesheet the head partial used to
   carry. Nothing about the design changes: same two families, same weights,
   same fallback stacks in 01-tokens.css.

   Why it is worth doing on this site in particular: it is a medical practice,
   so a third-party request on every page view hands Google the IP of everyone
   who visits; the design IS these two typefaces, so a blocked or slow request
   turned the page into Georgia and Arial; and the client-review build is meant
   to be self-contained and was not.

   Paths are relative to assets/, because build-site.mjs concatenates css/ into
   assets/site.css and a relative url() resolves against the stylesheet. This is
   the same rule that the CTA band's texture got wrong for two days.

   DO NOT HAND-EDIT. Re-run \`node get-fonts.mjs --force\` instead.
   =========================================================================== */

`;

fs.writeFileSync(OUT_CSS, header + faces + "\n", "utf8");
console.log(log.join("\n"));
console.log(`\ncss/03-fonts.css written, ${WANTED.length} faces`);
