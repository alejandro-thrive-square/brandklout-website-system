/**
 * lib-nodes.mjs — locate editable nodes inside an Instatic page snapshot.
 *
 * `site_read_document` returns the page as HTML with a `uid="..."` on every
 * editable node. That uid is what `site_replace_node_html` takes, so a push can
 * be planned entirely offline against the snapshot in `.instatic/` and only the
 * writes need to go over the wire.
 *
 * The markup is machine-generated and well-formed, so a tag scanner is enough;
 * there is no need for a full HTML parser. Void elements are tracked because
 * `<img>` and `<br>` never close and would otherwise unbalance the stack.
 */
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr']);

/**
 * Parse into a flat list of nodes: { uid, tag, start, end, innerStart, innerEnd, depth }.
 * `start`/`end` bracket the whole element; `innerStart`/`innerEnd` its children.
 */
export function parseNodes(html) {
  const nodes = [];
  const stack = [];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
  let m;
  while ((m = re.exec(html))) {
    const [full, slash, tag, attrs] = m;
    const selfClosing = /\/\s*$/.test(attrs) || VOID.has(tag.toLowerCase());
    if (slash) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].tag === tag.toLowerCase()) {
          const n = stack[i];
          n.innerEnd = m.index;
          n.end = m.index + full.length;
          stack.length = i;
          break;
        }
      }
    } else if (!selfClosing) {
      const uid = /\buid="([^"]+)"/.exec(attrs)?.[1] || null;
      const n = { uid, tag: tag.toLowerCase(), start: m.index,
        innerStart: m.index + full.length, innerEnd: -1, end: -1, depth: stack.length };
      nodes.push(n);
      stack.push(n);
    } else {
      const uid = /\buid="([^"]+)"/.exec(attrs)?.[1] || null;
      nodes.push({ uid, tag: tag.toLowerCase(), start: m.index,
        innerStart: m.index + full.length, innerEnd: m.index + full.length,
        end: m.index + full.length, depth: stack.length, void: true });
    }
  }
  return nodes.filter((n) => n.end >= 0);
}

export const inner = (html, n) => html.slice(n.innerStart, n.innerEnd);

/** Visible text of a node, with inline tags removed and whitespace collapsed. */
export function textOf(html, n) {
  return inner(html, n)
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/&rsquo;/g, '’').replace(/&lsquo;/g, '‘')
    .replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”')
    .replace(/&middot;/g, '·').replace(/&copy;/g, '©')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The DEEPEST node whose text contains `needle`, with a uid and no element
 * children carrying uids that also contain it. Going deepest keeps a rewrite as
 * small as possible: replacing a section because one word inside it changed
 * would re-create every descendant and lose their ids.
 */
export function findDeepest(html, nodes, needle, { requireUid = true } = {}) {
  // requireUid:false is for the LOCAL build, which carries no uid attributes at
  // all — they are Instatic's editor ids. Defaulting to true and forgetting to
  // pass it makes every local lookup return null, which reads as "the sentence
  // is not in the local build" rather than "you asked the wrong side".
  const hits = nodes.filter((n) => (!requireUid || n.uid) && textOf(html, n).includes(needle));
  if (!hits.length) return null;
  hits.sort((a, b) => b.depth - a.depth || (a.innerEnd - a.innerStart) - (b.innerEnd - b.innerStart));
  return hits[0];
}

/**
 * Minimal edit between two strings: the differing middle once a common prefix
 * and suffix are removed. Used so a punctuation fix rewrites only the punctuation
 * and any <strong>/<a> markup inside the node survives untouched.
 */
export function minimalEdit(was, now) {
  let p = 0;
  while (p < was.length && p < now.length && was[p] === now[p]) p++;
  let s = 0;
  while (s < was.length - p && s < now.length - p &&
         was[was.length - 1 - s] === now[now.length - 1 - s]) s++;
  return { from: was.slice(p, was.length - s), to: now.slice(p, now.length - s) };
}
