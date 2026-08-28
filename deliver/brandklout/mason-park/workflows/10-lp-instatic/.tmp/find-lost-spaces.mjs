/**
 * Find every place Instatic's importer will eat a meaningful space.
 *
 * importHtml stores a text node's content trimmed, so `<span>Straighter Teeth.
 * </span><span>Nobody</span>` publishes as "Straighter Teeth.Nobody". It trims
 * NBSP too, so the source's own `&nbsp;` workaround does not survive either.
 * The h1 on /invisalign is the visible case; this reports all of them.
 *
 *   node find-lost-spaces.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGES = path.join(HERE, "out", "pages");

// Elements whose leading/trailing whitespace is visually meaningful because a
// sibling follows on the same line.
const INLINE = /^(span|a|b|i|em|strong|sup|sub|small|u|code|abbr|mark)$/i;

let total = 0;
for (const f of fs.readdirSync(PAGES)) {
  const { slug, html } = JSON.parse(fs.readFileSync(path.join(PAGES, f), "utf8"));
  const hits = [];

  // Walk tag boundaries; track text runs between them.
  const re = /<\/?([a-zA-Z][\w-]*)\b[^>]*>/g;
  let last = 0, m;
  let prevTag = null, prevWasClose = false;
  while ((m = re.exec(html))) {
    const text = html.slice(last, m.index);
    const tag = m[1];
    const isClose = m[0][1] === "/";

    if (text) {
      const lead = /^[\s ]/.test(text);
      const trail = /[\s ]$/.test(text);
      const meaty = text.trim().length > 0;
      // A trimmed edge only matters when an inline element sits on that side.
      if (meaty && trail && !isClose && INLINE.test(tag)) {
        hits.push(`trailing space before <${tag}>: ${JSON.stringify(text.slice(-28))}`);
      }
      if (meaty && lead && prevWasClose && INLINE.test(prevTag ?? "")) {
        hits.push(`leading space after </${prevTag}>: ${JSON.stringify(text.slice(0, 28))}`);
      }
    }
    prevTag = tag; prevWasClose = isClose;
    last = re.lastIndex;
  }

  total += hits.length;
  console.log(`${slug.padEnd(34)} ${hits.length}`);
  for (const h of hits) console.log(`    ${h}`);
}
console.log(`\n${total} boundaries where a space would be lost`);
