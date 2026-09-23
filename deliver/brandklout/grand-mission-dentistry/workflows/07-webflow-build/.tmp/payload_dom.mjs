/**
 * payload_dom.mjs — parse a whtml chunk payload into a tree, and describe an
 * element by whatever identity survives conversion.
 *
 * Shared by the two repair tools (fix_inline_tokens.mjs,
 * restore_section_scripts.mjs), which both have to answer the same question:
 * "which live element is this payload element?" The live tree does not echo
 * `class` reliably — the case-card buttons kept `data-lightbox` and lost their
 * classes outright — so identity is taken from `id` / `data-*` / `href` first
 * and only falls back to class.
 *
 * The input is our own serialized payload, not arbitrary web HTML: tags are
 * balanced and attribute quoting is uniform, so a stack parser is enough.
 */
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style']);

export function parse(html) {
  const root = { tag: '#root', attrs: {}, children: [], parent: null };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^\s=>]+(?:="[^"]*")?)*)\s*(\/?)>/g;
  let last = 0, m;
  const text = (s) => { if (s.trim()) stack[stack.length - 1].children.push({ tag: '#text', text: s }); };
  while ((m = re.exec(html))) {
    text(html.slice(last, m.index));
    last = re.lastIndex;
    if (m[0].startsWith('<!--')) continue;
    const [, close, tag, attrStr, selfClose] = m;
    const t = tag.toLowerCase();
    if (close) {
      for (let i = stack.length - 1; i > 0; i--) if (stack[i].tag === t) { stack.length = i; break; }
      continue;
    }
    const attrs = {};
    for (const a of attrStr.matchAll(/([^\s=]+)(?:="([^"]*)")?/g)) if (a[1]) attrs[a[1]] = a[2] ?? '';
    const parent = stack[stack.length - 1];
    const node = { tag: t, attrs, children: [], parent };
    parent.children.push(node);
    if (VOID.has(t) || selfClose) continue;
    if (RAW.has(t)) {                       // take the body verbatim, do not parse it
      const end = html.indexOf(`</${t}`, re.lastIndex);
      if (end > -1) { node.raw = html.slice(re.lastIndex, end); re.lastIndex = last = end; }
      continue;
    }
    stack.push(node);
  }
  text(html.slice(last));
  return root;
}

/** Identity built from the attributes that survive conversion. */
export const sigOf = (attrs) => {
  const keep = Object.entries(attrs)
    .filter(([k, v]) => (k === 'id' || k === 'href' || k.startsWith('data-')) && v !== '')
    .sort(([a], [b]) => a.localeCompare(b));
  return keep.length ? keep.map(([k, v]) => `${k}=${v}`).join('&')
                     : 'class=' + (attrs.class ?? '').trim();
};

/** The same identity, read off a live element from get_all_elements. */
export const liveSigOf = (n) => {
  const keep = Object.entries(n.attributes ?? {})
    .filter(([k, v]) => (k === 'id' || k === 'href' || k.startsWith('data-')) && v !== '')
    .sort(([a], [b]) => a.localeCompare(b));
  return keep.length ? keep.map(([k, v]) => `${k}=${v}`).join('&')
                     : 'class=' + (n.styleNames ?? []).join(' ');
};

/** Index every element of a parsed payload by signature, in document order. */
export function indexBySig(root) {
  const by = new Map();
  (function walk(n) {
    for (const c of n.children) {
      if (c.tag === '#text') continue;
      const s = sigOf(c.attrs);
      if (!by.has(s)) by.set(s, []);
      by.get(s).push(c);
      walk(c);
    }
  })(root);
  return by;
}
