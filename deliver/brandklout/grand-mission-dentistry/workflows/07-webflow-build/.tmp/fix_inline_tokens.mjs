/**
 * fix_inline_tokens.mjs — rebuild the inline elements `data_whtml_builder`
 * threw away, and clear the placeholder text it left in their place.
 *
 *   node fix_inline_tokens.mjs <implant|cosmetic|thank-you> [--dry]
 *
 * WHAT WENT WRONG
 * ---------------
 * WHTML protects inline children by swapping them for its OWN placeholder
 * tokens — `##INLINE30##` — and then never substitutes them back. The tokens
 * are not ours: they appear in no artifact this repo produces, only in the
 * live tree and the published HTML. On staging that is 17 tokens rendering as
 * visible text on cosmetic and 4 on thank-you; the clipboard-built implant has
 * none. Among the casualties are the primary CTA's own label
 * ("Schedule an appointment"), all eight case-card badges ("Case 01" …), the
 * header's chapter readout, and the empty spans the runtime pins scenes to —
 * which is why cosmetic and thank-you reported `0 pinned`.
 *
 * HOW THE REPAIR IS ANCHORED
 * --------------------------
 * In every affected parent the token String is the FIRST child, so the missing
 * elements are simply prepended (in reverse, so they land in payload order) and
 * the String is then removed. Nothing has to reason about siblings.
 *
 * Parents are matched to the payload by a signature built from whatever
 * survived — `id`, `data-*`, `href`, then class — because class alone is not
 * enough: the case buttons kept `data-lightbox` and lost their classes
 * entirely. Every token node must match exactly one payload parent, and the
 * number of elements to rebuild must equal the number of tokens, or the script
 * refuses rather than guessing.
 */
import fs from 'node:fs';
import { call, sleep, SITE, PAGES } from './mcp.mjs';

const name = process.argv[2];
const dry = process.argv.includes('--dry');
const pageId = PAGES[name];
if (!pageId) { console.error(`usage: node fix_inline_tokens.mjs <${Object.keys(PAGES).join('|')}> [--dry]`); process.exit(2); }

/* ---------------------------------------------------------------- payload -- */
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style']);

/** Minimal stack parser. The input is our own serialized payload, not
 *  arbitrary web HTML, so tags are balanced and quoting is uniform. */
function parse(html) {
  const root = { tag: '#root', attrs: {}, children: [] };
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:\s+[^\s=>]+(?:="[^"]*")?)*)\s*(\/?)>/g;
  let last = 0, m;
  const text = (s) => {
    if (s.trim()) stack[stack.length - 1].children.push({ tag: '#text', text: s });
  };
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
    const node = { tag: t, attrs, children: [] };
    stack[stack.length - 1].children.push(node);
    if (VOID.has(t) || selfClose) continue;
    if (RAW.has(t)) {                                   // skip to the close tag
      const end = html.indexOf(`</${t}`, re.lastIndex);
      if (end > -1) { node.children.push({ tag: '#text', text: html.slice(re.lastIndex, end) }); re.lastIndex = last = end; }
      continue;
    }
    stack.push(node);
  }
  text(html.slice(last));
  return root;
}

const payload = parse(JSON.parse(fs.readFileSync(`${name}/whtml/chunks.json`, 'utf8'))
  .map((c) => c.html).join(''));

/** Identity that survives the conversion, most distinctive first. */
const sigOf = (attrs) => {
  const keep = Object.entries(attrs)
    .filter(([k]) => k === 'id' || k === 'href' || k.startsWith('data-'))
    .filter(([, v]) => v !== '')
    .sort(([a], [b]) => a.localeCompare(b));
  if (keep.length) return keep.map(([k, v]) => `${k}=${v}`).join('&');
  return 'class=' + (attrs.class ?? '').trim();
};

const payloadBySig = new Map();
(function index(n) {
  for (const c of n.children) {
    if (c.tag === '#text') continue;
    const s = sigOf(c.attrs);
    if (!payloadBySig.has(s)) payloadBySig.set(s, []);
    payloadBySig.get(s).push(c);
    index(c);
  }
})(payload);

/* ------------------------------------------------------------------- live -- */
const tree = await call('data_element_tool', {
  siteId: SITE, pageId,
  context: `Reading the ${name} landing page's element tree to find every element whose text is one of the HTML converter's leftover ##INLINE## placeholder tokens, so the inline elements it discarded can be rebuilt. Read-only.`,
  actions: [{ label: 'tree', get_all_elements: {} }],
});

const liveSig = (n) => {
  const a = n.attributes ?? {};
  const keep = Object.entries(a)
    .filter(([k]) => k === 'id' || k === 'href' || k.startsWith('data-'))
    .filter(([, v]) => v !== '')
    .sort(([x], [y]) => x.localeCompare(y));
  if (keep.length) return keep.map(([k, v]) => `${k}=${v}`).join('&');
  return 'class=' + (n.styleNames ?? []).join(' ');
};

const hits = [];
const liveCount = new Map();
(function walk(n) {
  if (!n || typeof n !== 'object') return;
  if (n.type !== 'String') {
    const s = liveSig(n);
    liveCount.set(s, (liveCount.get(s) ?? 0) + 1);
    const tok = (n.children ?? [])[0];
    if (tok?.type === 'String' && /##INLINE\d+##/.test(tok.textContent ?? '')) {
      hits.push({ parent: n, token: tok, sig: s, nth: liveCount.get(s) - 1 });
    }
  }
  (n.children ?? []).forEach(walk);
})(tree[0].result?.[0]?.data ?? tree[0].result?.data);

console.log(`${name}: ${hits.length} element(s) carrying placeholder tokens`);

const INLINE = new Set(['span', 'b', 'i', 'em', 'strong', 'small', 'mark', 'abbr', 'code', 'u', 's']);
const plan = [];
const refused = [];
for (const h of hits) {
  const cands = payloadBySig.get(h.sig) ?? [];
  const src = cands[h.nth];
  const nTokens = (h.token.textContent.match(/##INLINE\d+##/g) || []).length;
  if (!src) { refused.push(`${h.sig} #${h.nth}: no payload match (${cands.length} candidate(s))`); continue; }

  /* Which of the payload's element children did NOT survive? Match the live
     element children off against the payload's in order, by class. */
  const liveKids = (h.parent.children ?? []).filter((k) => k.type !== 'String');
  const liveClasses = liveKids.map((k) => (k.styleNames ?? []).join(' ') || (k.attributes?.class ?? ''));
  const missing = [];
  let li = 0;
  for (const c of src.children) {
    if (c.tag === '#text') continue;
    const cls = (c.attrs.class ?? '').trim();
    if (li < liveKids.length && (liveClasses[li] === cls || (!cls && !liveClasses[li]))) { li++; continue; }
    if (!INLINE.has(c.tag)) { li++; continue; }         // a block child that just moved
    missing.push(c);
  }
  if (missing.length !== nTokens) {
    refused.push(`${h.sig} #${h.nth}: ${nTokens} token(s) but ${missing.length} missing inline child(ren)`);
    continue;
  }
  plan.push({ ...h, missing });
}

for (const p of plan) {
  console.log(`  ${p.sig.slice(0, 52).padEnd(54)} rebuild ${p.missing.length}: ` +
    p.missing.map((c) => `<${c.tag} class="${c.attrs.class ?? ''}"${c.attrs.id ? ` id="${c.attrs.id}"` : ''}>` +
      (c.children.find((x) => x.tag === '#text')?.text.trim() ? `"${c.children.find((x) => x.tag === '#text').text.trim().slice(0, 24)}"` : '')).join(' '));
}
for (const r of refused) console.log(`  REFUSED ${r}`);
if (dry || !plan.length) { console.log(dry ? 'dry run — nothing written' : 'nothing to do'); process.exit(refused.length ? 1 : 0); }

/* Which of the classes we are about to ask for actually EXIST as site styles?
   `set_style` takes a LIST and appears to no-op the whole list if any name is
   unknown — the rebuilt case badges came back carrying no class at all because
   the list named `gallery__badge`, which the converter had folded into the
   synthetic `cos-emb-5` and never created. The cards then had no width, the
   pinned ribbon had nothing to travel, and the page failed one scrub check
   while passing everything else. Ask first, and drop names that do not exist. */
const asked = [...new Set(plan.flatMap((p) => p.missing
  .flatMap((c) => (c.attrs.class ?? '').trim().split(/\s+/)).filter(Boolean)))];
const real = new Set();
for (let i = 0; i < asked.length; i += 10) {
  const r = await call('data_style_tool', {
    siteId: SITE, pageId,
    context: `Checking which of these class names exist as styles on the site before applying them to rebuilt elements of the ${name} landing page. Read-only.`,
    actions: [{ label: 'q', query_styles: { queries: asked.slice(i, i + 10).map((n2) => ({ label: n2, name_path: [n2], limit: 30 })) } }],
  });
  for (const block of r[0].result ?? []) for (const m of block.matches ?? []) real.add(m.name);
}
const dropped = asked.filter((c) => !real.has(c));
if (dropped.length) console.log(`  (not site styles, will not be applied: ${dropped.join(', ')})`);

let made = 0;
for (const p of plan) {
  /* Prepend in REVERSE so the finished order matches the payload. */
  for (const c of [...p.missing].reverse()) {
    const cls = (c.attrs.class ?? '').trim().split(/\s+/).filter((n2) => n2 && real.has(n2)).join(' ');
    const txt = c.children.find((x) => x.tag === '#text')?.text.trim() ?? '';
    const res = await call('data_element_builder', {
      siteId: SITE, pageId,
      actions: [{
        build_label: c.attrs.id || cls || c.tag,
        parent_element_id: p.parent.id,
        creation_position: 'prepend',
        element_schema: {
          type: 'BY_CUSTOM_TAG', custom_tag: c.tag,
          ...(cls ? { set_style: { style_names: cls.split(/\s+/) } } : {}),
          ...(txt ? { set_text: { text: txt } } : {}),
          ...(Object.keys(c.attrs).some((k) => k !== 'class' && k !== 'id')
            ? { set_attributes: { attributes: Object.entries(c.attrs)
                .filter(([k]) => k !== 'class' && k !== 'id')
                .map(([k, v]) => ({ name: k, value: v })) } }
            : {}),
        },
      }],
    });
    const entry = Array.isArray(res[0]) ? res[0][0] : res[0];
    if (entry.status !== 'success' && entry.status !== 'partial_success') {
      console.error(`  FAILED ${c.tag}.${cls}: ${JSON.stringify(entry).slice(0, 400)}`);
      process.exit(1);
    }
    if (c.attrs.id) {
      await sleep(1000);
      await call('data_element_settings_tool', {
        siteId: SITE, pageId,
        context: `Setting the DOM id "${c.attrs.id}" on a rebuilt inline element of the ${name} landing page; the page's own runtime selects its animation anchors by id and skips a whole chapter when one is absent.`,
        actions: [{ label: c.attrs.id, set_settings: { operations: [{ label: c.attrs.id, element_id: entry.data.id, settings: [{ key: 'domId', static_text: { value: c.attrs.id } }] }] } }],
      });
    }
    made++;
    await sleep(1200);
  }
  /* Only now is the placeholder safe to remove. */
  await call('data_element_tool', {
    siteId: SITE, pageId,
    context: `Removing a leftover ##INLINE## placeholder string from the ${name} landing page now that the inline elements it stood in for have been rebuilt in its place.`,
    actions: [{ label: 'rm', remove_element: { id: p.token.id } }],
  });
  console.log(`  rebuilt ${p.missing.length} + cleared token on ${p.sig.slice(0, 40)}`);
  await sleep(1200);
}
console.log(`${made} element(s) rebuilt, ${plan.length} placeholder(s) cleared`);
