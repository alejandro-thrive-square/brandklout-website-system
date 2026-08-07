#!/usr/bin/env node
/**
 * build-pages.mjs — put the three Grand Mission journey pages into Webflow.
 *
 * ===========================================================================
 * WHY THIS IS NOT A CLASS CONVERSION
 * ===========================================================================
 * The house converter (html_to_webflow_wholepage.py) turns HTML+CSS into real,
 * Designer-editable Webflow classes. That is the right tool for a card/section
 * design. It is the WRONG tool for these three pages, and the reason is
 * expressiveness, not size. Measured on this build:
 *
 *   - 35 distinct media queries, of which only 4 are canonical Webflow
 *     breakpoints. The rest (900, 860, 800, 1000, 1199, 640, 560 and
 *     critically 759 — the pin on/off line) cannot exist as Webflow
 *     breakpoints at all. data_whtml_builder hard-errors on any of them:
 *     "Unsupported media query ... Use exactly one of: 991/767/479/1280/
 *     1440/1920".
 *   - 4 @keyframes.
 *   - 43 clamp() and 11 calc() declarations, including the house fluid root
 *     `html { font-size: calc(var(--base)*1rem + var(--coefficient)*1vw) }`.
 *     The Designer style panel cannot parse CSS functions and shows them as
 *     0px.
 *   - 86 attribute/state/pseudo selectors — [data-theme], .wz-static, ::before
 *     chains — which are not class properties.
 *   - the whole :root custom-property token layer.
 *   - two prefers-reduced-motion blocks that paint the resolved state of every
 *     pinned scene.
 *
 * The converter's own residual file for this page (webflow-runtime-states.css)
 * came out at 126 bytes, because it only ever saw styles.css — the 37KB
 * kit.css is <link>ed, not inlined, so the entire token/reset/pin layer was
 * missing from its 156 styles. Converting would have shipped a page that
 * renders and is dead.
 *
 * So: the markup goes in verbatim as ONE HtmlEmbed per page, the CSS goes in
 * the page's head block, the JS in the page's footer block. Nothing is
 * reinterpreted, no Webflow class is created, and therefore none of the site's
 * 1,512 existing classes can be touched. On a live 303-page production site
 * that last property is worth more than Designer-editability on three ad
 * landing pages.
 *
 * ===========================================================================
 * MEASURED WEBFLOW CEILINGS (2026-08-07, this site, paid plan)
 * ===========================================================================
 *   set_page_freeform_code   50,000 chars PER BLOCK, head and footer each.
 *                            <script> IS accepted (the note in
 *                            html-to-webflow-clipboard.md saying freeform
 *                            returns 406 for script tags is wrong).
 *   HtmlEmbed `code`         50,000 chars. (10,000 is the Designer UI limit,
 *                            not the API's.)
 *   register_inline_script    2,000 chars — useless here, as the brief said.
 *
 * Every page's total lands inside those, so no external host is needed and
 * rung 4 of the brief's ladder (register_hosted_script) is never reached.
 *
 *   node build-pages.mjs --dry            # build artifacts, touch nothing
 *   node build-pages.mjs                  # all three pages
 *   node build-pages.mjs implant          # one page
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { callTool } from './wfmcp.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DESIGN = path.resolve(HERE, '../../04-design/.tmp');
const OUT = path.join(HERE, 'built');
const SITE = '698111847e9608eb30ee21c6'; // Grand Mission Dentistry — the security boundary
const LIMIT = 50_000;

const GSAP = '3.13.0';
// All GSAP plugins are free as of 3.13, and these five CDN files are
// byte-identical to the copies vendored in the design packages (verified
// 2026-08-07), so the pages run the exact build they were verified against.
const GSAP_FILES = ['gsap', 'ScrollTrigger', 'ScrollToPlugin', 'ScrollSmoother', 'SplitText'];

const PAGES = {
  implant: {
    pkg: 'implant-landing-page',
    pageId: '6a724b6977f9b0019d2a03f8',
    bodyId: '6a724b6977f9b0019d2a0401',
    slug: 'implant-ai',
  },
  cosmetic: {
    pkg: 'cosmetic-landing-page',
    pageId: '6a723ad5534774f35f17d119',
    bodyId: null, // discovered at run time
    slug: 'cosmetic-ai',
  },
  'thank-you': {
    pkg: 'thank-you-landing-page',
    pageId: '6a7268a862a728c1cd4df73b',
    bodyId: null,
    slug: 'thank-u-landing-ai',
  },
};

const DRY = process.argv.includes('--dry');
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const assetMap = JSON.parse(fs.readFileSync(path.join(HERE, 'asset-map.json'), 'utf8'));

// --------------------------------------------------------------------------- //
// artifact building (pure, no network)
// --------------------------------------------------------------------------- //

/** Body markup, verbatim, minus the <script> tags (they become footer code). */
function bodyMarkup(pkg) {
  const html = fs.readFileSync(path.join(DESIGN, pkg, 'index.html'), 'utf8');
  const m = html.match(/<body[^>]*>([\s\S]*)<\/body>/);
  if (!m) throw new Error(`${pkg}: no <body> found`);
  let body = m[1];
  // Drop the four <script> elements at the end of body. They are re-emitted,
  // in the same order, into the footer freeform block.
  body = body.replace(/[ \t]*<script\b[^>]*>[\s\S]*?<\/script>[ \t]*\r?\n?/g, '');
  // Point every relative image at the Webflow CDN. A missed one is invisible
  // in a screenshot review and is exactly what staging-verify's 404 check
  // catches, so fail loudly instead.
  body = body.replace(/(["'])assets\/([^"']+)\1/g, (whole, q, file) => {
    const hit = assetMap[file];
    if (!hit?.hostedUrl) throw new Error(`${pkg}: no uploaded asset for assets/${file}`);
    return `${q}${hit.hostedUrl}${q}`;
  });
  const leftover = body.match(/["']assets\/[^"']+["']/g);
  if (leftover) throw new Error(`${pkg}: unrewritten asset paths ${leftover.join(', ')}`);
  return compact(body).trim();
}

/**
 * Shrink the markup to fit the 50,000-char embed without changing what it
 * renders. Implant needs this: 54,599 raw against a 50,000 ceiling.
 *
 * Two transforms, both safe here and verified against the design:
 *  1. Drop HTML comments. These packages carry ~5.7KB of them, mostly the
 *     chapter-map documentation block at the top of body — useful in the repo,
 *     dead weight in the shipped page.
 *  2. Strip leading indentation from each line. HTML collapses any run of
 *     whitespace to a single space, so replacing "\n<10 spaces>" with "\n"
 *     leaves exactly the same single whitespace token between tags. This is
 *     only safe because nothing here preserves whitespace: the packages have no
 *     <pre>, the one <textarea> (cosmetic #f-msg) is empty, and the only
 *     white-space declaration anywhere in kit.css or the page stylesheets is
 *     `nowrap` (6 of them), which collapses whitespace rather than keeping it.
 *
 * Result: implant 54,599 -> 37,427, and inter-tag spacing is untouched.
 */
function compact(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{2,}/g, '\n');
}

/**
 * esbuild via its JS API (the .bin/.cmd shim cannot be spawned on Windows).
 * esbuild specifically, because it preserves every media query, @keyframes,
 * custom property and clamp()/calc() exactly, and merges only byte-identical
 * duplicates — @keyframes drift is defined identically in kit.css and in each
 * page's styles.css, so 4 definitions collapsing to 3 is a semantic no-op.
 *
 * Needs `npm install esbuild` in this .tmp directory (node_modules is
 * gitignored here — it carries a platform binary).
 */
async function minifyCss(pkg, tag) {
  const src =
    fs.readFileSync(path.join(DESIGN, '_vendor/kit/kit.css'), 'utf8') +
    '\n' +
    fs.readFileSync(path.join(DESIGN, pkg, 'styles.css'), 'utf8');
  fs.writeFileSync(path.join(OUT, `${tag}.raw.css`), src);
  const esbuild = await import('esbuild');
  const { code, warnings } = await esbuild.transform(src, { loader: 'css', minify: true });
  for (const w of warnings) console.warn(`  css warning: ${w.text}`);
  fs.writeFileSync(path.join(OUT, `${tag}.min.css`), code);
  return code;
}

function headBlock(pkg, css) {
  const html = fs.readFileSync(path.join(DESIGN, pkg, 'index.html'), 'utf8');
  const fonts = html.match(/https:\/\/fonts\.googleapis\.com\/css2\?[^"]+/)[0];
  return [
    // These are paid-traffic ad landing pages; the design marks them noindex
    // and that carries through to the build.
    '<meta name="robots" content="noindex">',
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    `<link href="${fonts}" rel="stylesheet">`,
    `<style>${css}</style>`,
  ].join('\n');
}

function footerBlock(pkg) {
  const read = (p) => fs.readFileSync(path.join(DESIGN, p), 'utf8');
  const parts = GSAP_FILES.map(
    (f) => `<script src="https://cdn.jsdelivr.net/npm/gsap@${GSAP}/dist/${f}.min.js"></script>`,
  );
  // wz.js, page.js, app.js stay in SEPARATE <script> blocks, in the design's
  // own order. Concatenating them into one block would merge three top-level
  // scopes; a single repeated `const` between files is a SyntaxError that kills
  // the whole bundle silently.
  for (const f of ['_vendor/kit/wz.js', `${pkg}/page.js`, `${pkg}/app.js`]) {
    parts.push(`<script>\n${read(f).trim()}\n</script>`);
  }
  // The design's end-of-body inline call. wz.js registers the GSAP plugins and
  // creates the smoother; wzFlush() then releases every queued chapter so each
  // ScrollTrigger measures the final smoothed layout. Plugins register here in
  // the body, never in head, or ScrollSmoother dies silently.
  parts.push('<script>\nwzFlush();\n</script>');
  return parts.join('\n');
}

function seoFrom(pkg) {
  const html = fs.readFileSync(path.join(DESIGN, pkg, 'index.html'), 'utf8');
  const title = html.match(/<title>([^<]*)<\/title>/)?.[1]?.trim();
  const desc = html
    .match(/<meta\s+name="description"\s+content="([\s\S]*?)"/)?.[1]
    ?.replace(/\s+/g, ' ')
    .trim();
  return { title, desc };
}

async function buildArtifacts(key) {
  const { pkg } = PAGES[key];
  const body = bodyMarkup(pkg);
  const css = await minifyCss(pkg, key);
  const head = headBlock(pkg, css);
  const footer = footerBlock(pkg);
  const seo = seoFrom(pkg);
  fs.writeFileSync(path.join(OUT, `${key}.embed.html`), body);
  fs.writeFileSync(path.join(OUT, `${key}.head.html`), head);
  fs.writeFileSync(path.join(OUT, `${key}.footer.html`), footer);
  return { body, head, footer, seo };
}

// --------------------------------------------------------------------------- //
// Webflow ops
// --------------------------------------------------------------------------- //

const j = (text) => JSON.parse(text);
const failed = (text) => /"status":"error"|"error":\{/.test(text);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * One tool call, with backoff on the two transient failures Webflow's API
 * throws during a build like this:
 *   429 too_many_requests — several of these actions do internal reads, so a
 *       run that writes three pages back to back will hit the limit.
 *   1101 Cloudflare worker error — documented as "do not retry", but the
 *       identical retry succeeds (see html-to-webflow-clipboard.md C-alt).
 * Everything else fails loudly and immediately.
 */
async function call(tool, args, what, tries = 5) {
  for (let attempt = 1; ; attempt++) {
    const r = await callTool(tool, args);
    const bad = r.raw.isError || failed(r.text);
    if (!bad) return r.text;
    const transient = /too_many_requests|"status":429|\b1101\b/.test(r.text);
    if (!transient || attempt >= tries) {
      throw new Error(`${what} FAILED: ${r.text.slice(0, 700)}`);
    }
    const wait = 2000 * 2 ** (attempt - 1);
    console.log(`    ${what}: transient failure, retrying in ${wait}ms (attempt ${attempt}/${tries})`);
    await sleep(wait);
  }
}

/** The page shell we found on all three pages, and what we do with it. */
async function wipeShell(key) {
  const { pageId } = PAGES[key];
  const text = await call(
    'data_element_tool',
    {
      siteId: SITE,
      pageId,
      context: 'Reading the landing page top level shell so the superseded band stack build can be removed before the journey markup is inserted.',
      actions: [{ label: 'shell', get_all_elements: { depth: 1 } }],
    },
    `${key}: read shell`,
  );
  const root = j(text).result[0].data;
  const bodyId = root.id;
  const children = root.children ?? [];

  // Everything under Body goes. That deliberately takes the client's
  // `Global Styles`, `navbar` and `Footer` component INSTANCES with it, plus
  // the page-wrapper/main-wrapper Client-First shell. See the chrome note in
  // the report: .page-wrapper carries `overflow: clip`, the Global Styles
  // embed injects a body-level `a { color: inherit }` that would outrank the
  // design's own link styling from a later cascade position, and the design
  // supplies its own fixed header + footer carrying the reading-progress bar
  // and chapter readout. Removing an instance touches only this page.
  for (const c of children) {
    await call(
      'data_element_tool',
      {
        siteId: SITE,
        pageId,
        context: 'Removing the superseded band stack shell from this landing page so the journey build replaces it in place, keeping the slug and page id.',
        actions: [{ label: `remove ${c.type}`, remove_element: { id: c.id } }],
      },
      `${key}: remove ${c.type}`,
    );
  }
  return bodyId;
}

async function buildPage(key) {
  const cfg = PAGES[key];
  const art = await buildArtifacts(key);
  const sizes = {
    embed: art.body.length,
    head: art.head.length,
    footer: art.footer.length,
  };
  console.log(
    `\n=== ${key} (${cfg.slug}, page ${cfg.pageId})\n` +
      `    embed  ${String(sizes.embed).padStart(6)} / ${LIMIT}\n` +
      `    head   ${String(sizes.head).padStart(6)} / ${LIMIT}\n` +
      `    footer ${String(sizes.footer).padStart(6)} / ${LIMIT}`,
  );
  for (const [k, v] of Object.entries(sizes)) {
    if (v > LIMIT) throw new Error(`${key}: ${k} is ${v} chars, over the ${LIMIT} ceiling`);
  }
  if (DRY) return sizes;

  const bodyId = await wipeShell(key);

  // One HtmlEmbed holding the whole document body, verbatim.
  const created = await call(
    'data_element_builder',
    {
      siteId: SITE,
      pageId: cfg.pageId,
      context: 'Creating the single embed that will carry the entire journey page markup verbatim so no styling or motion is reinterpreted.',
      actions: [
        {
          build_label: 'journey markup host',
          parent_element_id: bodyId,
          creation_position: 'append',
          element_schema: { type: 'HtmlEmbed' },
        },
      ],
    },
    `${key}: create embed`,
  );
  const embedId = j(created)[0].data.id;

  await call(
    'data_element_settings_tool',
    {
      siteId: SITE,
      pageId: cfg.pageId,
      context: 'Writing the full journey page markup into the embed so Webflow emits it verbatim without converting classes or forms.',
      actions: [
        {
          label: 'write markup',
          set_settings: {
            operations: [
              { label: 'code', element_id: embedId, settings: [{ key: 'code', static_text: { value: art.body } }] },
            ],
          },
        },
      ],
    },
    `${key}: write embed code`,
  );

  // Page-level custom code only. NEVER site-level on this site: 303 pages.
  await call(
    'data_scripts_tool',
    {
      context: 'Writing page level head and footer custom code carrying the design stylesheet and the GSAP motion runtime for this one landing page only.',
      actions: [
        { label: 'head', set_page_freeform_code: { page_id: cfg.pageId, location: 'head', content: art.head } },
        { label: 'footer', set_page_freeform_code: { page_id: cfg.pageId, location: 'footer', content: art.footer } },
      ],
    },
    `${key}: freeform code`,
  );

  // The pages were titled "Implant AI" / "Cosmetic AI" / "Thank U Landing AI".
  // Slug and page id stay exactly as they were so any live ad URL survives.
  if (art.seo.title) {
    await call(
      'data_pages_tool',
      {
        context: 'Setting the page title and search description from the approved design so the shipped landing page is not titled with its internal working name.',
        actions: [
          {
            label: 'seo',
            update_page_settings: {
              site_id: SITE,
              page_id: cfg.pageId,
              title: art.seo.title,
              seo: { title: art.seo.title, description: art.seo.desc },
            },
          },
        ],
      },
      `${key}: page settings`,
    );
  }

  console.log(`    built: embed ${embedId.element}`);
  return sizes;
}

fs.mkdirSync(OUT, { recursive: true });
const keys = only.length ? only : Object.keys(PAGES);
for (const k of keys) {
  if (!PAGES[k]) throw new Error(`unknown page "${k}" — use one of ${Object.keys(PAGES).join(', ')}`);
  await buildPage(k);
}
console.log(DRY ? '\ndry run — nothing was written to Webflow' : '\nall requested pages built');
