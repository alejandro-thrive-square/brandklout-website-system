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
 *   tracking.json       the third-party scripts each page keeps (call tracking, reviews)
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
 *   3. SCRIPTS.  Every <script> is stripped from the markup. The ones that do
 *                real work come back as `webzite.embed-origins` Embed blocks,
 *                placed on the node graph by place-embeds.mjs: the GoHighLevel
 *                form (with its own loader) and, per tracking.json, the call
 *                -tracking number pool and the review widget. The rest
 *                (WebFont, Webflow's touch-class shim, jQuery, webflow.js,
 *                GSAP, the MPD runtime) only enhance pages that already render.
 *   4. STYLES.   <style> blocks in the head and body are hoisted into lp.css.
 *                The fluid rem engine is among them and is load-bearing.
 *   5. PDF.      The Patient Privacy Policy link keeps its Webflow CDN href.
 *                Instatic refuses application/pdf, so the file itself cannot
 *                move; see unwrapPdf().
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

/**
 * Third-party scripts carried over from the Webflow page, by host.
 *
 * Everything else the original loads is deliberately dropped: jQuery and
 * webflow.js (no interactions survive the port anyway), the four GSAP bundles
 * and the MPD runtime (they only enhance pages that already render), and
 * WebFont (Montserrat is installed into Instatic instead).
 *
 *   backend.leadconnectorhq.com  the call-tracking number pool. On the Webflow
 *                                page it swaps the practice's public number for
 *                                a per-campaign one - the reference renders
 *                                (281) 645-5375 where the markup says
 *                                (281) 769-8878. Without it every ad call
 *                                attributes to the main number.
 *   elfsightcdn.com              the review widget the four non-thank-you pages
 *                                already carry a container for.
 *
 * `link.msgsndr.com/js/form_embed.js` is NOT here: it travels inside the form
 * snippet, so it lands with the form it belongs to.
 */
const TRACKING_HOSTS = /^https:\/\/(backend\.leadconnectorhq\.com|elfsightcdn\.com)\//;

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
 * Instatic's own publisher would strip both and its base CSP carries
 * `frame-src 'none'`, so a plain port cannot keep them. The
 * `webzite.embed-origins` plugin is what makes it possible: it registers an
 * Embed block module AND rewrites the published page's CSP meta at publish
 * time, per page, for pages that actually contain an embed.
 *
 * This pass records the vendor snippet VERBATIM and leaves a placeholder in its
 * place. `place-embeds.mjs` swaps that placeholder for a real Embed node after
 * conversion - the HTML importer knows nothing about plugin modules, so the
 * substitution has to happen on the node graph.
 *
 * Two campaigns, two different forms, and they must not be crossed:
 *   Invisalign          YbX91GhEDKkCN4GH4gka  ("Contact Form Google Ads (Invisalign)")
 *   $189 New Patient    AFu5BpJpMjgSnSf8yybc  ("Contact Form Google Ads (NP)")
 * Each appears on its campaign's landing page AND its consultation page; the
 * two thank-you pages carry no form. The id is read out of the page being
 * built, never assumed, so a page can only ever get its own campaign's form.
 */
function extractForms(html, slug, forms) {
  return html.replace(
    /<div class="w-embed w-script">\s*<iframe[\s\S]*?<\/iframe>\s*(?:<script[\s\S]*?<\/script>)?\s*<\/div>/gi,
    (block) => {
      const id = (block.match(/data-form-id="([^"]+)"/) || [])[1];
      const name = (block.match(/data-form-name="([^"]+)"/) || [])[1] ?? "";
      const height = (block.match(/data-height="([^"]+)"/) || [])[1] ?? "723";
      if (!id) return block;
      // The snippet is the w-embed's contents - the iframe and its loader -
      // with the Webflow wrapper removed. Kept byte-for-byte so the form
      // behaves exactly as it does on the Webflow page.
      const snippet = block
        .replace(/^<div class="w-embed w-script">/i, "")
        .replace(/<\/div>$/i, "")
        .trim();
      forms.push({ slug, formId: id, formName: name, height: Number(height), snippet });
      return `<div class="lp_form-embed" data-ghl-form="${id}" data-ghl-height="${height}"></div>`;
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

/**
 * Instatic refuses application/pdf, so the file cannot move with the page. Until 2026-09-18 the
 * link was unwrapped to plain text, which left /invisalign's footer with no privacy link at all
 * and the bare text unstyled (18px white instead of the link's 12.8px). The PDF still answers 200
 * on Webflow's CDN, so the link now stays exactly as Webflow has it. It dies with the Webflow
 * site: if that is ever deleted, point it at /privacy-policy instead. `--unwrap-pdf` restores the
 * old behaviour.
 */
function unwrapPdf(html) {
  if (!process.argv.includes("--unwrap-pdf")) return html;
  return html.replace(
    /<a\b[^>]*href="https:\/\/cdn\.prod\.website-files\.com\/[^"]*\.pdf"[^>]*>([\s\S]*?)<\/a>/gi,
    (_, text) => text,
  );
}

// --------------------------------------------------------------------- main

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "pages"), { recursive: true });

const forms = [];
const tracking = [];
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
  // Keep the tracking/review script tags before dropping the rest; they come
  // back as their own Embed block in place-embeds.mjs.
  const keepScripts = [];
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, (tag) => {
    const src = (tag.match(/\bsrc="([^"]+)"/i) || [])[1];
    if (src && TRACKING_HOSTS.test(src)) {
      keepScripts.push(`<script src="${src}"${/\basync\b/i.test(tag) ? " async" : ""}></script>`);
    }
    return "";
  });
  if (keepScripts.length) tracking.push({ slug, scripts: keepScripts });
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
// The main site's stylesheet is on these pages too. Scoping makes our rules outrank its rules
// on a shared name, but only for a property we set: whatever ONLY the site sets leaks through.
// type-diff.mjs --all found the whole list on production (2026-09-18): its unscoped
// `h1..h6{font-family;color}`, `h2{letter-spacing}` and `.button{display:inline-flex;gap;
// align-items;font-family;transition}`, plus the Elfsight portal, which hangs off <body> and so
// inherits the site's body face instead of Webflow's. Each is put back to what Webflow computes.
// This block goes FIRST: at equal specificity every later landing-page rule still wins.
const LEAK_CSS = [
  ".lp-page h1,.lp-page h2,.lp-page h3,.lp-page h4,.lp-page h5,.lp-page h6{font-family:inherit;color:inherit;letter-spacing:inherit}",
  ".lp-page .button{display:revert;gap:normal;align-items:normal;font-family:inherit;transition:all 0s ease 0s}",
  // On the body, not on the portal: Elfsight sets `font-family:inherit` on its own root and wins.
  "body:has(.lp-page){font-family:Montserrat,sans-serif}",
].join("\n");
let css = `${LEAK_CSS}\n${scopeCss(`${webflow}\n${bundle}`)}`;
// Authored already scoped, so these deliberately bypass the transform above.
css += `\n${MARKER_CSS}\n`;
// The Embed block fills the form card again, exactly as the Webflow iframe
// did, so the card keeps its own `min-height:40rem` and needs no override -
// only the embed wrapper needs to span the card.
css += `.lp-page .lp_form-embed{width:100%}\n`;

// FAQ accordions. The reveal itself needs no new CSS - Webflow's own
// `.w-dropdown-list.w--open{display:block}` does it, and lp-faq.js adds the
// class webflow.js would have. This is only the open/closed affordance: the
// `+` glyph rotates into an `x`. Purely visual, so the copy is untouched.
css += `.lp-page .w-dropdown-toggle .lp_faq_icon,\n`
  + `.lp-page .w-dropdown-toggle .confirm_faq_icon{display:inline-block;transition:transform .18s ease}\n`;
css += `.lp-page .w-dropdown-toggle.w--open .lp_faq_icon,\n`
  + `.lp-page .w-dropdown-toggle.w--open .confirm_faq_icon{transform:rotate(45deg)}\n`;
// The toggle is a <div>; make it read as interactive.
css += `.lp-page .w-dropdown-toggle{cursor:pointer}\n`;
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
fs.writeFileSync(path.join(OUT, "tracking.json"), JSON.stringify(tracking, null, 2));

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
