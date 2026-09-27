/**
 * Keep the spaces Instatic's HTML importer throws away.
 *
 * THE DEFECT
 * importHtml stores each text node TRIMMED. The Invisalign hero is
 *
 *   <span>Straighter Teeth. </span><span class="lp_heading-accent">Nobody</span><span>&nbsp;Has To Know.</span>
 *
 * and it published as "Straighter Teeth.NobodyHas To Know." - three words run
 * together in a 3.5rem headline. NBSP is trimmed too, so the source's own
 * `&nbsp;` workaround does not survive. Nothing structural catches this: the
 * node count, the class list and the collapsed text all still match, because
 * the loss is exactly one space character per boundary.
 *
 * THE FIX
 * A space that would be trimmed is replaced, in place, by an empty marker
 * element. The space then lives in CSS (`content`), which the importer cannot
 * trim, and the marker survives because empty elements do.
 *
 * A plain space is generated rather than an NBSP so the headline can still wrap
 * at that point, which is where the reference wraps it.
 */

/** Elements whose surrounding whitespace is visually meaningful. */
const INLINE = new Set([
  "span", "a", "b", "i", "em", "strong", "sup", "sub", "small", "u",
  "code", "abbr", "mark", "s", "q", "cite", "time", "label", "br", "img",
]);

export const MARKER = '<span class="lp-sp"></span>';
export const MARKER_CSS = '.lp-page .lp-sp::after{content:" ";white-space:pre-wrap}';

/** Split HTML into a flat list of {type:'tag'|'text', ...} items. */
function tokenize(html) {
  const out = [];
  const re = /<[^>]+>/g;
  let last = 0, m;
  while ((m = re.exec(html))) {
    if (m.index > last) out.push({ type: "text", value: html.slice(last, m.index) });
    const raw = m[0];
    const name = (raw.match(/^<\/?\s*([a-zA-Z][\w-]*)/) || [])[1]?.toLowerCase() ?? "";
    out.push({ type: "tag", value: raw, name, close: raw[1] === "/", self: raw.endsWith("/>") });
    last = re.lastIndex;
  }
  if (last < html.length) out.push({ type: "text", value: html.slice(last) });
  return out;
}

const isWs = (c) => c === " " || c === "\t" || c === "\n" || c === "\r" || c === " ";

/**
 * True when the boundary on `dir` side of token `i` continues a line of text -
 * i.e. an inline element or more text sits there, rather than a block edge.
 */
function inlineNeighbour(toks, i, dir) {
  for (let j = i + dir; j >= 0 && j < toks.length; j += dir) {
    const t = toks[j];
    if (t.type === "text") {
      if (t.value.trim()) return true;
      continue; // whitespace-only, keep looking
    }
    // An opening inline tag on the right, or a closing inline tag on the left,
    // both mean text continues on the same line.
    if (INLINE.has(t.name)) return true;
    return false; // a block tag ends the line; the space is not meaningful
  }
  return false;
}

/** Replace trimmable-but-meaningful spaces with the marker element. */
export function preserveSpaces(html) {
  const toks = tokenize(html);
  const out = [];
  let restored = 0;

  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (t.type !== "text") { out.push(t.value); continue; }

    const trimmed = t.value.trim();
    if (!trimmed) {
      // Whitespace-only: only meaningful when it separates two inline things.
      if (isWs(t.value[0]) && inlineNeighbour(toks, i, -1) && inlineNeighbour(toks, i, +1)) {
        out.push(MARKER); restored++;
      }
      continue;
    }

    const lead = isWs(t.value[0]) && inlineNeighbour(toks, i, -1);
    const trail = isWs(t.value[t.value.length - 1]) && inlineNeighbour(toks, i, +1);
    if (lead) restored++;
    if (trail) restored++;
    out.push((lead ? MARKER : "") + trimmed + (trail ? MARKER : ""));
  }

  return { html: out.join(""), restored };
}
