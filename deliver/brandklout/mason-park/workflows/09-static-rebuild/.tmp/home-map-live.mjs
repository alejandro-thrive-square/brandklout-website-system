/**
 * Make the homepage's "Find us in Katy" map actually render on the LIVE site.
 *
 *   node home-map-live.mjs
 *
 * Output: live-home/pages/home.json  — { slug, title, description, html },
 *         the same shape to-instatic.mjs emits, ready for legal-convert.mjs.
 *
 * THE DEFECT
 * The section is already on the live homepage, heading and all, and its map has
 * never drawn. Instatic's importer does not keep an <iframe> in a page body: the
 * stored export has
 *
 *   <div class="embed_component"><iframe data-src="…maps/embed…"></iframe></div>
 *
 * and what the live page publishes is the same node with the tag turned into a
 * bare <div> — attributes intact, frame gone. The publisher then writes
 * `frame-src 'none'` on top. So visitors get a heading over an empty box.
 *
 * Same defect, same fix as /contacts in the 2026-08-28 legal revision: leave a
 * placeholder here, and let place-legal-embeds.mjs swap it for a
 * `webzite.embed-origins` Embed block, which is the only construct that puts a
 * frame on a published Instatic page and widens `frame-src` for that page alone.
 *
 * WHY THIS PATCHES THE OLD DESIGN
 * `dist/` is the redesigned build and it has NOT shipped — masonparkdental.com
 * still serves the 2026-08-27 design. So, exactly as legal-live.mjs does, the
 * chrome comes verbatim from the export that produced the live page and only
 * the one node is touched. The redesigned build gets the same section from
 * site/pages.mjs `home()`, which had dropped it entirely; both are restored, so
 * the map survives the redesign ship. When that ships, this script is dead.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, "instatic", "pages", "home.json");
const OUT = path.join(HERE, "live-home", "pages");

// ------------------------------------------------------------------- guard
// Identical to legal-live.mjs's: the live stylesheet still leads on
// --accent: #00bde0, a token the redesign deleted. If instatic/ has been
// regenerated from the redesigned dist, splicing its chrome into the live site
// would publish a page the live stylesheet cannot style.
const exportedCss = fs.readFileSync(path.join(HERE, "instatic", "site.css"), "utf8");
if (!exportedCss.includes("--accent: #00bde0")) {
  console.error(
    "instatic/ no longer holds the design that is live on masonparkdental.com.\n" +
    "If the redesign has shipped, this script is obsolete - publish the homepage the\n" +
    "normal way and delete it. If it has not, restore instatic/ from git first.",
  );
  process.exit(1);
}

const page = JSON.parse(fs.readFileSync(SRC, "utf8"));
if (page.slug !== "/") throw new Error(`instatic/pages/home.json is slug ${page.slug}, not "/"`);

// The map embed, as the stored page carries it. Matched rather than retyped:
// the `pb=` parameter encodes the pin, and a hand-copied one is a wrong pin.
const mapBlock = /<div class="embed_component">\s*<iframe data-src="(https:\/\/www\.google\.com\/maps\/embed[^"]*)"[^>]*><\/iframe>\s*<\/div>/;
const m = page.html.match(mapBlock);
if (!m) throw new Error("no map embed found on the stored homepage - has instatic/ been regenerated?");
if (!/Mason%20Park%20Dental/.test(m[1])) throw new Error("the stored map url does not name Mason Park Dental");

// It must be inside the "Find us in Katy" section, not some other embed.
const before = page.html.slice(0, page.html.indexOf(m[0]));
if (!/Find us in Katy/.test(before.slice(-600))) {
  throw new Error('the map embed is not inside the "Find us in Katy" section');
}

// 460px matches what the old stylesheet gave this frame:
// `.embed_component iframe { height: clamp(300px, 42vw, 460px) }`. The Embed
// block replaces that wrapper, so the height has to be carried explicitly or
// the frame collapses.
const html = page.html.replace(
  mapBlock,
  `<div data-embed-slot="map" data-embed-url="${m[1]}" data-embed-height="460"></div>`,
);
if (html.includes("<iframe")) {
  console.log("note: the homepage carries another <iframe> that is NOT being converted");
}

fs.rmSync(path.join(HERE, "live-home"), { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, "home.json"), JSON.stringify({
  slug: page.slug,
  title: page.title,
  description: page.description,
  html,
}, null, 1));

console.log(`home  ${html.length} b  map slot placed (h=460)`);
console.log(`   pin: ${decodeURIComponent((m[1].match(/!2s([^!]*)/) || [, "?"])[1])}`);
console.log("\n1 page -> live-home/pages/");
