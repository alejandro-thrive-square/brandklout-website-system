// Build ../current-site-inventory.md from the manifests the other scripts wrote.
// Usage: node inventory.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, "..");
const J = (f) => (fs.existsSync(path.join(OUT, f)) ? JSON.parse(fs.readFileSync(path.join(OUT, f), "utf8")) : null);
const site = J("site-data.json");
// merge the sharded screenshot runs (page-extracts-<k>.json) with any --only re-shoot
// (page-extracts.json); the most recently written record per URL wins
const extractFiles = fs
  .readdirSync(OUT)
  .filter((f) => /^page-extracts(-\d+)?\.json$/.test(f))
  .sort((a, b) => fs.statSync(path.join(OUT, a)).mtimeMs - fs.statSync(path.join(OUT, b)).mtimeMs);
const ex = new Map();
for (const f of extractFiles) for (const e of J(f) || []) if (!e.error) ex.set(e.url, e);
const extracts = [...ex.values()];
const media = J("media-library.json") || [];
const vimeo = J("vimeo.json") || [];
const mb = (b) => (b / 1048576).toFixed(1) + " MB";
const dec = (s) => String(s || "").replace(/&#8211;/g, "–").replace(/&#038;|&amp;/g, "&").replace(/&#8217;/g, "’").replace(/&#8230;/g, "…");

const pathOf = (u) => new URL(u).pathname;
const ok = site.pages.filter((p) => p.status === "ok");
const pageSet = new Set(site.inventory.pages.map((p) => pathOf(p.link)));
const postSet = new Set(site.inventory.posts.map((p) => pathOf(p.link)));
const kind = (p) => (pageSet.has(pathOf(p.url)) ? "page" : postSet.has(pathOf(p.url)) ? "post" : "archive");

const row = (p) => {
  const e = ex.get(p.url) || {};
  return `| ${pathOf(p.url)} | ${kind(p)} | ${dec(e.h1 || "").replace(/\s+/g, " ")} | ${e.words ?? ""} | ${e.description ? "yes" : "no"} |`;
};
const groups = [
  ["Top-level pages", ok.filter((p) => kind(p) === "page" && !/^\/(dental-services|about-our-practice)\//.test(pathOf(p.url)))],
  ["Service pages (/dental-services/)", ok.filter((p) => kind(p) === "page" && /^\/dental-services\//.test(pathOf(p.url)))],
  ["About pages (/about-our-practice/)", ok.filter((p) => kind(p) === "page" && /^\/about-our-practice\//.test(pathOf(p.url)))],
  ["Blog posts (root-level slugs)", ok.filter((p) => kind(p) === "post")],
  ["Archives (category / pagination)", ok.filter((p) => kind(p) === "archive")],
];

const assetsOk = site.assets.filter((a) => a.status !== "fail");
const byExt = {};
for (const a of assetsOk) {
  const e = (a.rel.match(/\.([a-z0-9]+)$/i) || [, "other"])[1].toLowerCase();
  byExt[e] = byExt[e] || { n: 0, b: 0 };
  byExt[e].n++;
  byExt[e].b += a.size || 0;
}
const mediaBy = {};
for (const m of media) {
  mediaBy[m.mime] = mediaBy[m.mime] || { n: 0, b: 0 };
  mediaBy[m.mime].n++;
  mediaBy[m.mime].b += m.bytes || 0;
}
const noAlt = media.filter((m) => m.mime.startsWith("image/") && !m.alt).length;
const big = media.filter((m) => m.width >= 1600).length;

const redirects = site.pages.filter((p) => p.status === "redirect");
const totalWords = extracts.reduce((s, e) => s + (e.words || 0), 0);

const md = `# Institute for Advanced Dentistry — current site inventory

Scraped ${site.scrapedAt.slice(0, 10)} from ${site.origin} (the outgoing agency's WordPress build). Everything in this folder was produced by the scripts in \`scrapers/\`; nothing was hand-edited.

## What is in this folder

| Path | What it is |
| :--- | :--- |
| \`site/\` | The whole site rewritten to relative paths. Open \`site/index.html\` in a browser: CSS, JS, GSAP/Motion.page animations, fonts, images and the hero video all load from disk. Internal links go to the local copies. |
| \`raw-html/\` | The untouched server HTML of every URL, for diffing and for the redirect map later. |
| \`screenshots/desktop/\` | Full-page PNG of every URL at 1440 px, live site, scroll-triggered blocks revealed. |
| \`screenshots/local-check/\` | The same shot taken from the \`file://\` mirror for six pages, to prove the mirror renders. |
| \`media-library/\` | Every original in the WordPress media library (${media.length} files, ${mb(media.reduce((s, m) => s + (m.bytes || 0), 0))}), pulled through the REST API, so it includes uploads no page currently uses. |
| \`media-library/vimeo/\` | The Vimeo clips the site embeds, downloaded from the player. |
| \`pages/\` | One Markdown extract per URL: title, meta description, outline, image list, body text. |
| \`site-data.json\` / \`pages.csv\` / \`assets-manifest.csv\` | Page and asset manifests with status and byte counts. |
| \`media-library.json\` / \`media-library.csv\` | Media-library manifest with dimensions, alt text and captions. |
| \`vimeo.json\` | Vimeo clip manifest: id, title, owner, duration, which page embeds it. |

## Platform

- WordPress with the **Bricks** theme (plus a \`bricks-child\`), **Motion.page** for GSAP scroll animation, **Fluent Forms** for the contact form (reCAPTCHA v3), **Site Kit**, **Bricksable**, **Akismet**.
- Tracking: Google Tag Manager \`GTM-K8N3JK3Q\`. Widgets: Trustindex (Google reviews) and UserWay (accessibility). Both load from their CDNs, so they still work in the mirror while online.
- Fonts: Kanit and the theme's other Google Fonts, mirrored into \`site/_ext/\`.
- The Yoast sitemap URLs return 200 with the 404 page, so the crawl came from the WP REST API (pages, posts, categories) plus every same-origin link found in the pages. \`robots.txt\` blocks AI crawlers by name but allows everything else.
- Phone on every page: (602) 242-2256. Address on the home page: 13360 N 94th Dr, Suite B, Peoria, AZ.

## Pages: ${ok.length} URLs captured, ${totalWords.toLocaleString()} words of body copy

${groups
  .map(
    ([title, list]) => `### ${title} (${list.length})

| URL | Kind | H1 | Words | Meta description |
| :--- | :--- | :--- | ---: | :--- |
${list.map(row).join("\n")}`
  )
  .join("\n\n")}

${redirects.length ? `Redirects seen while crawling: ${redirects.map((r) => `\`${pathOf(r.url)}\` → \`${r.redirect}\``).join(", ")}.` : ""}

## Assets referenced by the pages (${assetsOk.length} files, ${mb(assetsOk.reduce((s, a) => s + (a.size || 0), 0))})

| Type | Files | Size |
| :--- | ---: | ---: |
${Object.entries(byExt)
  .sort((a, b) => b[1].b - a[1].b)
  .map(([e, v]) => `| ${e} | ${v.n} | ${mb(v.b)} |`)
  .join("\n")}

${(() => {
  const n = site.assets.filter((a) => a.status === "fail").length;
  return n ? `${n} assets failed to download; see \`assets-manifest.csv\`.` : "Every referenced asset downloaded. (Wildcard patterns like `/wp-content/plugins/*` in the speculation-rules script are skipped: they are not files.)";
})()}

## Media library (${media.length} originals)

| MIME | Files | Size |
| :--- | ---: | ---: |
${Object.entries(mediaBy)
  .sort((a, b) => b[1].b - a[1].b)
  .map(([e, v]) => `| ${e} | ${v.n} | ${mb(v.b)} |`)
  .join("\n")}

- ${big} images are 1600 px wide or wider. ${noAlt} images carry no alt text.
- Self-hosted video: \`intro_video_v6.mp4\` (home hero) and \`dental-implant-and-ceramic-crown-placement-video.mp4\`.

## Video embeds (Vimeo)

${
  vimeo.length
    ? `| Vimeo id | Title | Owner | Length | Embedded on | Local file |
| :--- | :--- | :--- | ---: | :--- | :--- |
${vimeo
  .map((v) => `| ${v.id} | ${v.title || ""} | ${v.owner || ""} | ${v.duration_s ?? ""} s | ${v.embedded_on.join(", ")} | ${v.status === "fail" ? "**failed**: " + v.error : v.file} |`)
  .join("\n")}

Every clip sits on the outgoing agency's Vimeo account ("Gilleard Marketing"). The six short procedure animations are stock explainers; the four testimonials (Helen, Mark, Philip, Lisa) are the practice's own footage. The embeds die the day that account revokes them, so the downloaded files are the copy to re-host.

${(() => {
  const n = vimeo.filter((v) => v.status === "fail").length;
  return n
    ? `${n} clips could not be pulled; see \`vimeo.json\` for the error. Seven of them are domain-locked, and Vimeo answers a headless-Chrome user-agent with a 401 bot page, so \`vimeo.mjs\` must send a normal Chrome UA plus the site as referer. It works on the VPN.`
    : "Every clip downloaded. Seven are domain-locked: they need the site as referer and a normal Chrome user-agent (a headless UA gets a 401 bot page).";
})()}`
    : "_vimeo.json not generated yet._"
}

## What does not work offline

- The Fluent Forms contact form posts to \`admin-ajax.php\`; it renders but cannot submit.
- Trustindex reviews, UserWay and the Google Maps iframes need the network.
- Search (\`?s=\`) and the RSS feeds were left pointing at the live site.

## Version Control

Text manifests, page extracts and the scripts in \`scrapers/\` are committed. \`site/\`, \`raw-html/\`, \`screenshots/\`, \`media-library/\` and \`scrapers/node_modules/\` are binary or bulk and stay local, per the root \`.gitignore\`. Re-create them with \`node mirror.mjs\`, \`node screenshots.mjs\`, \`node vimeo.mjs\`, then \`node inventory.mjs\`.
`;
fs.writeFileSync(path.join(OUT, "current-site-inventory.md"), md);
console.log("wrote current-site-inventory.md");
