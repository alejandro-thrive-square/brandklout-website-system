// harvest-migrated.mjs — pull the 46 migrated pages' CONTENT off the live site
// into one JSON file, so the redesign has local source to work from.
//
// Why the live site and not the recovery mirror: the mirror (workflow 01,
// `recovered/`) is gitignored and is not in this worktree. The live pages ARE
// the mirror's words — workflow 02 imported them verbatim — so they are the
// same source, one hop further on. What the live pages add is Instatic's own
// escaping, which we undo here.
//
// What comes out, per page: the eyebrow and h1 from the old hero, the
// breadcrumb trail, the article prose as a list of blocks (p / h2 / h3 / ul /
// ol / table / img), the sidebar's related links, and any FAQ pairs. Nothing is
// rewritten. The redesign re-tags these blocks into chapters; it does not
// invent copy the practice never wrote.
//
//   node harvest-migrated.mjs            all 46
//   node harvest-migrated.mjs invisalign one, printed
//
// Writes migrated-content.json.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = 'https://mason-park-kids.up.railway.app';
const OUT = path.join(HERE, 'migrated-content.json');

const CORE = new Set([
  'index', 'about-us', 'our-doctors', 'our-team', 'our-services',
  'services/comprehensive-pediatric-dentistry', 'new-patients', 'financing',
  'dental-saving-plan', 'patient-reviews', 'thank-you',
]);

function slugs() {
  const f = fs.readdirSync(HERE).filter(n => n.startsWith('backup-') && n.endsWith('.json')).sort().pop();
  const j = JSON.parse(fs.readFileSync(path.join(HERE, f), 'utf8'));
  return j.pages.map(p => p.slug).filter(s => !CORE.has(s)).sort();
}

// --- the smallest HTML reader that can do this job -------------------------
// The migrated markup is machine-written by to-instatic: no comments, no
// script, no self-closing oddities beyond the void elements. A real parser is
// not worth a dependency here, but a regex is not enough either, so: a tiny
// tokenizer into a tree.

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

function parse(html) {
  const root = { tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  const re = /<(\/?)([a-zA-Z][-a-zA-Z0-9]*)((?:\s+[^\s"'>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*(\/?)>/g;
  let last = 0, m;
  while ((m = re.exec(html))) {
    const text = html.slice(last, m.index);
    if (text) stack[stack.length - 1].children.push({ tag: '#text', text });
    last = re.lastIndex;
    const [, close, rawTag, rawAttrs, selfClose] = m;
    const tag = rawTag.toLowerCase();
    if (close) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tag) { stack.length = i; break; }
      }
    } else {
      const node = { tag, attrs: attrs(rawAttrs), children: [] };
      stack[stack.length - 1].children.push(node);
      if (!VOID.has(tag) && !selfClose) stack.push(node);
    }
  }
  const tail = html.slice(last);
  if (tail) stack[stack.length - 1].children.push({ tag: '#text', text: tail });
  return root;
}

function attrs(raw) {
  const out = {};
  const re = /([^\s"'>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m;
  while ((m = re.exec(raw || ''))) out[m[1].toLowerCase()] = decode(m[2] ?? m[3] ?? m[4] ?? '');
  return out;
}

const ENT = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“',
  ndash: '–', mdash: '—', hellip: '…', reg: '®',
  copy: '©', trade: '™', deg: '°', middot: '·',
  rarr: '→', times: '×',
};
function decode(s) {
  return String(s).replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (all, body) => {
    if (body[0] === '#') {
      const n = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(n) ? String.fromCodePoint(n) : all;
    }
    return ENT[body] ?? all;
  });
}

function find(node, pred, out = []) {
  for (const c of node.children || []) {
    if (c.tag !== '#text' && pred(c)) out.push(c);
    find(c, pred, out);
  }
  return out;
}
const hasClass = (n, c) => (n.attrs?.class || '').split(/\s+/).includes(c);
const first = (node, pred) => find(node, pred)[0] || null;

function text(node) {
  if (node.tag === '#text') return decode(node.text);
  if (node.tag === 'br') return ' ';
  return (node.children || []).map(text).join('');
}
const tidy = s => s.replace(/\s+/g, ' ').trim();

// Inline markup we keep inside a block: links, emphasis, line breaks.
function inline(node) {
  return (node.children || []).map(c => {
    if (c.tag === '#text') return esc(decode(c.text));
    if (c.tag === 'br') return '<br>';
    if (c.tag === 'a') {
      const href = c.attrs.href || '';
      const ext = /^https?:/.test(href) && !href.includes('pediatricdentistkatytx') && !href.includes('railway.app');
      const rel = ext ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${esc(href)}"${rel}>${inline(c)}</a>`;
    }
    if (c.tag === 'strong' || c.tag === 'b') return `<b>${inline(c)}</b>`;
    if (c.tag === 'em' || c.tag === 'i') return `<em>${inline(c)}</em>`;
    if (c.tag === 'sup') return `<sup>${inline(c)}</sup>`;
    return inline(c);
  }).join('');
}
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// --- blocks ----------------------------------------------------------------

function blocks(node, out = []) {
  for (const c of node.children || []) {
    if (c.tag === '#text') continue;
    switch (c.tag) {
      case 'p': {
        const t = tidy(inline(c));
        if (t) out.push({ t: 'p', html: t });
        break;
      }
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': {
        const t = tidy(text(c));
        if (t) out.push({ t: 'h', level: +c.tag[1], text: t });
        break;
      }
      case 'ul': case 'ol': {
        const items = find(c, n => n.tag === 'li')
          .filter(li => !find(li, n => n.tag === 'li').length)
          .map(li => tidy(inline(li))).filter(Boolean);
        if (items.length) out.push({ t: c.tag === 'ol' ? 'ol' : 'ul', items });
        break;
      }
      case 'table': {
        const rows = find(c, n => n.tag === 'tr').map(tr =>
          find(tr, n => n.tag === 'td' || n.tag === 'th').map(td => ({
            head: td.tag === 'th', html: tidy(inline(td)),
          })));
        if (rows.length) out.push({ t: 'table', rows });
        break;
      }
      case 'img': {
        out.push({ t: 'img', src: c.attrs.src || '', alt: c.attrs.alt || '', w: +c.attrs.width || 0, h: +c.attrs.height || 0 });
        break;
      }
      case 'blockquote': {
        out.push({ t: 'quote', html: tidy(inline(c)) });
        break;
      }
      case 'details': {
        const q = first(c, n => n.tag === 'summary');
        const body = { tag: 'x', children: (c.children || []).filter(n => n.tag !== 'summary') };
        out.push({ t: 'faq', q: q ? tidy(text(q)) : '', a: blocks(body) });
        break;
      }
      case 'iframe': {
        out.push({ t: 'iframe', src: c.attrs.src || c.attrs['data-src'] || '', title: c.attrs.title || '' });
        break;
      }
      default:
        blocks(c, out);
    }
  }
  return out;
}

// --- one page --------------------------------------------------------------

async function harvest(slug) {
  const url = `${BASE}/${slug === 'index' ? '' : slug}`;
  const res = await fetch(url, { headers: { 'user-agent': 'webzite-harvest/1' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const html = await res.text();

  const head = html.slice(0, html.indexOf('</head>'));
  const title = (head.match(/<title>([\s\S]*?)<\/title>/) || [, ''])[1];
  const desc = (head.match(/<meta name="description" content="([^"]*)"/) || [, ''])[1];
  const robots = /noindex/i.test(head);

  const doc = parse(html.slice(html.indexOf('<body')));
  const main = first(doc, n => n.tag === 'main');
  if (!main) throw new Error(`no <main> on ${slug}`);

  const hero = first(main, n => hasClass(n, 'hero_component'));
  const eyebrow = hero ? tidy(text(first(hero, n => hasClass(n, 'text-style-eyebrow')) || { children: [] })) : '';
  const h1 = tidy(text(first(main, n => n.tag === 'h1') || { children: [] }));

  const crumbNav = first(main, n => hasClass(n, 'breadcrumb_component'));
  const crumbs = crumbNav ? find(crumbNav, n => hasClass(n, 'breadcrumb_item')).map(s => {
    const a = first(s, n => n.tag === 'a');
    return { text: tidy(text(s)), href: a ? a.attrs.href : null };
  }) : [];

  const article = first(main, n => n.tag === 'article') || first(main, n => hasClass(n, 'text-rich-text'));
  const body = article ? blocks(article) : [];

  const aside = first(main, n => n.tag === 'aside');
  const related = aside ? find(aside, n => hasClass(n, 'sidebar_list')).flatMap(ul =>
    find(ul, n => n.tag === 'a').map(a => ({ text: tidy(text(a)), href: a.attrs.href }))) : [];

  // Some migrated pages carry their FAQ as <details> outside the article.
  const faqNodes = find(main, n => n.tag === 'details');
  const faqs = faqNodes.map(d => {
    const q = first(d, n => n.tag === 'summary');
    const rest = { tag: 'x', children: (d.children || []).filter(n => n.tag !== 'summary') };
    return { q: q ? tidy(text(q)) : '', a: blocks(rest) };
  });

  return { slug, url, title: decode(title), description: decode(desc), noindex: robots, eyebrow, h1, crumbs, body, related, faqs };
}

// --- run -------------------------------------------------------------------

const only = process.argv[2];
const list = only ? slugs().filter(s => s.includes(only)) : slugs();
if (!list.length) { console.error('no match'); process.exit(1); }

const pages = [];
for (const s of list) {
  try {
    const p = await harvest(s);
    pages.push(p);
    const counts = p.body.reduce((a, b) => (a[b.t] = (a[b.t] || 0) + 1, a), {});
    console.log(String(p.body.length).padStart(3), s.padEnd(46), JSON.stringify(counts));
  } catch (e) {
    console.log('  !', s, e.message);
  }
}

if (only) {
  console.log(JSON.stringify(pages[0], null, 2));
} else {
  fs.writeFileSync(OUT, JSON.stringify({ takenAt: new Date().toISOString(), base: BASE, pages }, null, 2));
  console.log(`\n${pages.length} pages -> ${path.relative(process.cwd(), OUT)}`);
}
