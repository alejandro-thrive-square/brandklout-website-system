/**
 * Turn the six captured Webflow landing pages into an Instatic import bundle.
 *
 *   node build.mjs [--media instatic-media-map.json]
 *
 * Output in out/
 *   pages/<slug>.json   { slug, title, description, robots, html }  body-only
 *   lp.css              the namespaced stylesheet (see scope-css.mjs)
 *   media-manifest.json every local file to upload, with its size
 *   forms.json          which page carries which GoHighLevel form
 *
 * WHAT CHANGES, AND WHY ONLY THIS
 * The pages carry no Webflow interactions at all - zero `data-w-id`, zero
 * inline `opacity:0` - so they render correctly as static HTML. That is what
 * makes a faithful port possible. Five deliberate changes:
 *
 *   1. SCOPE.    Everything is wrapped in `.lp-page`, and the stylesheet is
 *                namespaced to match, so the landing pages cannot restyle the
 *                71 pages already live on this Instatic site. They share 44
 *                Client-First class names.
 *   2. MEDIA.    Webflow CDN URLs become local paths, then Instatic upload
 *                paths once --media is supplied. srcset/sizes are dropped:
 *                Instatic regenerates its own responsive variants, and a
 *                candidate pointing at a file we never uploaded is a broken
 *                image. 114 URLs become 26 files.
 *   3. SCRIPTS.  Every <script> is stripped. Two of them do real work and come
 *                back as a registered Instatic runtime script instead: the
 *                GoHighLevel form embed and the call-tracking number pool.
 *                The rest (WebFont, Webflow's touch-class shim, GSAP, the
 *                MPD runtime) only enhance pages that already render.
 *   4. STYLES.   <style> blocks in the head and body are hoisted into lp.css.
 *                The fluid rem engine is among them and is load-bearing.
 *   5. PDF.      The Patient Privacy Policy link is unwrapped to plain text.
 *                Instatic refuses application/pdf, so the alternative is a
 *                link that 404s in production.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { scopeCss } from "./scope-css.mjs";
import { preserveSpaces, MARKER_CSS } from "./spaces.mjs";
import { baseUrl, localName, decodeEntities } from "./urls.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CAPTURE = path.join(HERE, "capture");
const OUT = path.join(HERE, "out");

const argv = process.argv.slice(2);
const mediaArg = argv.includes("--media") ? argv[argv.indexOf("--media") + 1] : null;
const MEDIA = mediaArg && fs.existsSync(mediaArg) ? JSON.parse(fs.readFileSync(mediaArg, "utf8")) : {};

const SLUGS = [
  "invisalign", "new-patient-special", "invisalign-consultation",
  "new-patient-special-consultation", "invisalign-thank-you", "new-patient-thank-you",
];

const CDN = /https:\/\/(cdn\.prod\.website-files\.com|d3e54v103j8qbb\.cloudfront\.net)\/[^"'\s)]+/g;

// ---------------------------------------------------------------- utilities

/** Index just past the `</div>` matching the `<div` that starts at `from`. */
function matchDiv(html, from) {
  const re = /<\/?div\b[^>]*>/gi;
  re.lastIndex = from;
  let depth = 0, m;
  while ((m = re.exec(html))) {
    if (m[0][1] === "/") { depth--; if (depth === 0) return re.lastIndex; }
    else if (!m[0].endsWith("/>")) depth++;
  }
  return -1;
}

const styleBlocks = new Map(); // hash -> css, so the shared blocks ship once

function harvestStyles(html) {
  return html.replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_, css) => {
    // Relume ships a stray <meta> inside a comment in one block; harmless, but
    // it must not reach the stylesheet.
    const clean = css.replace(/<meta\b[^>]*>/gi, "");
    styleBlocks.set(crypto.createHash("md5").update(clean).digest("hex"), clean);
    return "";
  });
}

// ------------------------------------------------------------------- passes

/**
 * The GoHighLevel form is an <iframe> plus its loader script, inside a w-embed.
 *
 * IT CANNOT BE EMBEDDED ON INSTATIC. The publisher builds the page CSP from
 * what the node tree contains (`core/publisher/cspPlan.ts`): `frame-src`
 * relaxes only for modules that declare CSP sources at render time, and the
 * only module that does is the YouTube/Vimeo video one. The plugin SDK's
 * `frontend.assets[]` ships assets FROM THE PLUGIN ZIP, so it cannot allowlist
 * a third-party origin either. Injecting the iframe from our own runtime script
 * fails the same way - `frame-src 'none'` blocks a scripted iframe exactly as
 * it blocks a static one.
 *
 * So the form becomes a link to the SAME GoHighLevel form, hosted by
 * GoHighLevel. The form id is unchanged, so submissions land in the same
 * pipeline and automations as before; what is lost is that the visitor fills it
 * on a GoHighLevel page instead of inline. That is a real conversion-rate cost
 * and it is recorded in the README as the top open item.
 */
function extractForms(html, slug, forms) {
  return html.replace(
    /<div class="w-embed w-script">\s*<iframe[\s\S]*?<\/iframe>\s*(?:<script[\s\S]*?<\/script>)?\s*<\/div>/gi,
    (block) => {
      const id = (block.match(/data-form-id="([^"]+)"/) || [])[1];
      const name = (block.match(/data-form-name="([^"]+)"/) || [])[1] ?? "";
      const height = (block.match(/data-height="([^"]+)"/) || [])[1] ?? "723";
      if (!id) return block;
      forms.push({ slug, formId: id, formName: name, height: Number(height) });
      // The label mirrors the card's own heading, which reads "Start Your ..."
      // on all four pages that carry a form.
      return `<div class="lp_form-embed">`
        + `<a class="button is-full" href="https://api.leadconnectorhq.com/widget/form/${id}"`
        + ` target="_blank" rel="noopener noreferrer">Start your consultation</a>`
        + `<p class="lp_form-note">Prefer to talk? Call `
        + `<a href="tel:+12817698878">(281) 769-8878</a>.</p>`
        + `</div>`;
    },
  );
}

/**
 * Static version of the `mpd-parity unwrap` script: a .w-embed holding exactly
 * one <svg> or <sup> is replaced by that element. Doing it at build time means
 * the behaviour survives without shipping the script.
 */
function unwrapEmbeds(html) {
  let out = html, changed = true, guard = 0;
  while (changed && guard++ < 200) {
    changed = false;
    const open = /<div class="w-embed[^"]*">/gi;
    let m;
    while ((m = open.exec(out))) {
      const end = matchDiv(out, m.index);
      if (end === -1) continue;
      const inner = out.slice(m.index + m[0].length, end - "</div>".length).trim();
      const only = inner.match(/^<(svg|sup)\b[\s\S]*<\/\1>$/i);
      if (!only) continue;
      out = out.slice(0, m.index) + inner + out.slice(end);
      changed = true;
      break;
    }
  }
  return out;
}

function rewriteMedia(html, used) {
  // srcset and sizes go first, so their URLs are never counted as used files.
  let out = html.replace(/\s(?:srcset|sizes)="[^"]*"/gi, "");
  out = out.replace(CDN, (u) => {
    if (/\.pdf$/i.test(u)) return u; // handled by unwrapPdf
    const file = localName(baseUrl(u));
    used.add(file);
    return MEDIA[file] ?? `/assets/${file}`;
  });
  return out;
}

/** Instatic refuses application/pdf; a link to one would 404 in production. */
function unwrapPdf(html) {
  return html.replace(
    /<a\b[^>]*href="https:\/\/cdn\.prod\.website-files\.com\/[^"]*\.pdf"[^>]*>([\s\S]*?)<\/a>/gi,
    (_, text) => text,
  );
}

// --------------------------------------------------------------------- main

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "pages"), { recursive: true });

const forms = [];
const used = new Set();
const report = [];
let spacesRestored = 0;

for (const slug of SLUGS) {
  const file = path.join(CAPTURE, "raw", `${slug}.html`);
  const raw = fs.readFileSync(file, "utf8");
  const head = raw.split("</head>")[0];
  const bodyOpen = raw.match(/<body[^>]*>/i);
  const body = raw.slice(raw.indexOf(bodyOpen[0]) + bodyOpen[0].length, raw.lastIndexOf("</body>"));

  const title = decodeEntities((head.match(/<title>([\s\S]*?)<\/title>/i) || [])[1]?.trim() ?? "");
  const description = decodeEntities((head.match(/<meta name="description" content="([^"]*)"/i) || [])[1] ?? "");
  const pageKey = (bodyOpen[0].match(/data-page-key="([^"]+)"/) || [])[1] ?? slug;

  harvestStyles(head); // the fluid rem engine and the parity patch live here

  let html = body;
  html = harvestStyles(html);
  html = extractForms(html, slug, forms);
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, "");
  html = unwrapEmbeds(html);
  html = unwrapPdf(html);
  html = rewriteMedia(html, used);
  // LAST: Instatic's importer trims every text node, so any space that carries
  // meaning has to stop being whitespace before it gets there. See spaces.mjs.
  const sp = preserveSpaces(html);
  html = sp.html.trim();
  spacesRestored += sp.restored;

  // Every landing page is paid-traffic only and must not compete with the main
  // site in the index. Four of the six already said so in Webflow; the two
  // consultation pages could not be given it there, because Webflow's API
  // refuses page-level custom code. See the v2 build report's FOLLOW-UP note.
  const wrapped = `<div class="lp-page" data-lp="${pageKey}">${html}</div>`;

  fs.writeFileSync(
    path.join(OUT, "pages", `${slug}.json`),
    JSON.stringify({ slug, title, description, robots: "noindex, nofollow", html: wrapped }, null, 2),
  );
  report.push({ slug, title, bytes: wrapped.length, forms: forms.filter((f) => f.slug === slug).length });
}

// ------------------------------------------------------------------ styles

const bundle = [...styleBlocks.values()].join("\n");
const webflow = fs.readFileSync(path.join(CAPTURE, "css", "webflow-shared.css"), "utf8");
let css = scopeCss(`${webflow}\n${bundle}`);
// Authored already scoped, so these deliberately bypass the transform above.
css += `\n${MARKER_CSS}\n`;
// The form card held a 723px iframe; it now holds a button and a note. Its
// `min-height:40rem` was reserving space for that iframe and would otherwise
// leave a tall empty white box in the hero. These come last in the sheet, so
// they win over the Webflow rule at equal specificity.
css += `.lp-page .lp_form-embed{display:flex;flex-direction:column;gap:0.75rem}\n`;
css += `.lp-page .lp_form-note{margin:0;font-size:0.875rem;opacity:0.75}\n`;
css += `.lp-page .lp_form-card{min-height:0}\n`;
// The two chevrons are referenced from the stylesheet, so they need the same
// rewrite the markup got.
css = css.replace(CDN, (u) => {
  const f = localName(baseUrl(u));
  used.add(f);
  return MEDIA[f] ?? `/assets/${f}`;
});
fs.writeFileSync(path.join(OUT, "lp.css"), css);

// ------------------------------------------------------------------ outputs

const assets = path.join(CAPTURE, "assets");
const manifest = [...used].sort().map((f) => {
  const p = path.join(assets, f);
  return { file: f, path: p, bytes: fs.existsSync(p) ? fs.statSync(p).size : 0 };
});
const missing = manifest.filter((m) => m.bytes === 0);
fs.writeFileSync(path.join(OUT, "media-manifest.json"), JSON.stringify(manifest, null, 2));
fs.writeFileSync(path.join(OUT, "forms.json"), JSON.stringify(forms, null, 2));

console.log("page                              bytes  forms  title");
for (const r of report) {
  console.log(`${r.slug.padEnd(34)}${String(r.bytes).padStart(6)}${String(r.forms).padStart(7)}  ${r.title.slice(0, 44)}`);
}
console.log(`\nlp.css            ${css.length} bytes (from ${webflow.length} webflow + ${bundle.length} inline)`);
console.log(`media             ${manifest.length} files, ${(manifest.reduce((n, m) => n + m.bytes, 0) / 1e6).toFixed(1)} MB`);
console.log(`spaces restored   ${spacesRestored}`);
console.log(`forms             ${forms.length} (${[...new Set(forms.map((f) => f.formId))].join(", ")})`);
console.log(`media mapped      ${mediaArg ? `${manifest.filter((m) => MEDIA[m.file]).length}/${manifest.length}` : "no --media map yet"}`);
if (missing.length) {
  console.log(`\nMISSING ON DISK (${missing.length}):`);
  for (const m of missing) console.log(`  ${m.file}`);
  process.exitCode = 1;
}
