#!/usr/bin/env node
/**
 * Split a whole-page Webflow clipboard payload (XscpData) into per-section
 * pasteable COMPONENTS — the Dr. Nahlah pattern the manual-paste workflow is
 * built on:
 *
 *   - each component is ONE section subtree with a single root, so it pastes
 *     without the multi-root Designer crash;
 *   - the section's behaviour rides INSIDE it as its own HtmlEmbed
 *     (`WZ.add(...)`), never in page-settings custom code, so the section can
 *     be moved, reordered, or pasted onto another page and keep working;
 *   - style records are copied VERBATIM from the page payload that built the
 *     live site, so on paste Webflow merges every class by name instead of
 *     forking `-2` twins. Do not hand-edit a styleLess here — an edited def is
 *     what causes forks.
 *
 * Site-level prerequisites still apply (installed once per site, already live
 * on Dr. Nahlah): GSAP CDN tags + WZ bootstrap + webflow-runtime-states.css in
 * the site head, registerPlugin/ScrollSmoother/WZ.flush in the site footer,
 * and the display fonts enabled in Site Settings.
 *
 * Usage:
 *   node extract_section_components.mjs <package-dir> <page-slug> <out-root>
 *   # e.g. node extract_section_components.mjs .tmp/light home .tmp/components
 *
 * Emits <out-root>/<page-slug>/<nn>-<section-id>/final.json plus a shared
 * manifest entry; paste pages are generated afterwards with make_paste_page.py
 * (its execCommand/application-json mechanism is the only one Webflow reads).
 */

import fs from 'node:fs';
import path from 'node:path';

const [pkgDir, pageSlug, outRoot] = process.argv.slice(2);
if (!pkgDir || !pageSlug || !outRoot) {
  console.error('usage: node extract_section_components.mjs <package-dir> <page-slug> <out-root>');
  process.exit(2);
}

const raw = JSON.parse(fs.readFileSync(path.join(pkgDir, 'final.json'), 'utf8'));
const pl = raw.payload;
const byId = new Map(pl.nodes.map((n) => [n._id, n]));
const parentOf = new Map();
for (const n of pl.nodes) for (const c of n.children || []) parentOf.set(c, n._id);

const attrId = (n) => (n.data && n.data.attr && n.data.attr.id) || '';
const tagOf = (n) => n.tag || (n.data && n.data.block && n.data.block.tag) || '';

// ---- locate the page root and the main content node -----------------------
const childIds = new Set([...parentOf.keys()]);
const roots = pl.nodes.filter((n) => !childIds.has(n._id));
if (roots.length !== 1) {
  console.error(`FATAL ${pageSlug}: expected 1 root, found ${roots.length}`);
  process.exit(1);
}
const root = roots[0];

let mainNode = pl.nodes.find((n) => attrId(n) === 'top') || pl.nodes.find((n) => tagOf(n) === 'main');
if (!mainNode) {
  console.error(`FATAL ${pageSlug}: no main content node (#top / <main>) found`);
  process.exit(1);
}

// ---- helpers ---------------------------------------------------------------
function subtreeIds(startId) {
  const out = [];
  const stack = [startId];
  while (stack.length) {
    const id = stack.pop();
    const n = byId.get(id);
    if (!n) {
      console.error(`FATAL ${pageSlug}: dangling child ref ${id}`);
      process.exit(1);
    }
    out.push(id);
    for (const c of n.children || []) stack.push(c);
  }
  return new Set(out);
}

const styleById = new Map(pl.styles.map((s) => [s._id, s]));
function styleClosure(nodeIdSet) {
  const wanted = new Set();
  for (const id of nodeIdSet) {
    const n = byId.get(id);
    for (const cls of n.classes || []) wanted.add(cls);
  }
  // include combo children so no style record carries a dangling reference
  let grew = true;
  while (grew) {
    grew = false;
    for (const sid of [...wanted]) {
      const s = styleById.get(sid);
      if (!s) {
        console.error(`FATAL ${pageSlug}: node references missing style ${sid}`);
        process.exit(1);
      }
      for (const kid of s.children || []) {
        if (!wanted.has(kid)) { wanted.add(kid); grew = true; }
      }
    }
  }
  return pl.styles.filter((s) => wanted.has(s._id)); // keep original order, records verbatim
}

function assetSubset(nodeIdSet) {
  const blob = JSON.stringify([...nodeIdSet].map((id) => byId.get(id)));
  return (pl.assets || []).filter((a) => blob.includes(a._id) || (a.cid && blob.includes(a.cid)));
}

function emitComponent(sectionNode, index, total, kind) {
  const secId = attrId(sectionNode) || `${kind}-${index}`;
  const ids = subtreeIds(sectionNode._id);
  const nodes = pl.nodes.filter((n) => ids.has(n._id)); // original order preserved
  const styles = styleClosure(ids);
  const assets = assetSubset(ids);
  const embeds = nodes.filter((n) => n.type === 'HtmlEmbed');
  const scripted = embeds.some((e) => /(?:WZ|MPD)\.add/.test(e.v || ''));

  const out = {
    type: raw.type,
    payload: { nodes, styles, assets, ix1: [], ix2: { interactions: [], events: [], actionLists: [] } },
    meta: raw.meta,
  };

  const dirName = `${String(index).padStart(2, '0')}-${secId}`;
  const dir = path.join(outRoot, pageSlug, dirName);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'final.json'), JSON.stringify(out));

  // custom data-* attributes ride in data.xattr, not data.attr
  const xattr = (name) =>
    ((sectionNode.data && sectionNode.data.xattr) || []).find((a) => a.name === name)?.value || '';
  const chapterName =
    (sectionNode.data && sectionNode.data.attr && sectionNode.data.attr['data-chapter-name']) ||
    xattr('data-chapter-name');
  const theme = xattr('data-theme');

  return {
    page: pageSlug,
    dir: path.join(pageSlug, dirName).replace(/\\/g, '/'),
    kind,
    sectionId: secId,
    chapterName,
    theme,
    order: index,
    of: total,
    nodes: nodes.length,
    styles: styles.length,
    assets: assets.length,
    embeds: embeds.length,
    scripted,
  };
}

// ---- what becomes a component ---------------------------------------------
// 1) every direct child of the main content node (the page's sections, in order)
// 2) the footer (lives outside <main> but inside the smooth-content wrapper)
// 3) for the canonical page only: the page shell (everything EXCEPT the
//    sections inside main), used once per NEW page before pasting sections.
const sections = (mainNode.children || []).map((id) => byId.get(id));
const manifest = [];
sections.forEach((s, i) => manifest.push(emitComponent(s, i + 1, sections.length, 'section')));

const footerNode = pl.nodes.find((n) => tagOf(n) === 'footer');
if (footerNode && !subtreeIds(mainNode._id).has(footerNode._id)) {
  manifest.push(emitComponent(footerNode, sections.length + 1, sections.length, 'footer'));
}

if (process.env.EMIT_SHELL === '1') {
  // Shell = full page with main's children removed. Verbatim otherwise.
  const keep = new Set(pl.nodes.map((n) => n._id));
  for (const s of sections) for (const id of subtreeIds(s._id)) keep.delete(id);
  const shellNodes = pl.nodes
    .filter((n) => keep.has(n._id))
    .map((n) => (n._id === mainNode._id ? { ...n, children: [] } : n));
  const shellIds = new Set(shellNodes.map((n) => n._id));
  const styles = styleClosure(shellIds);
  const assets = assetSubset(shellIds);
  const out = {
    type: raw.type,
    payload: { nodes: shellNodes, styles, assets, ix1: [], ix2: { interactions: [], events: [], actionLists: [] } },
    meta: raw.meta,
  };
  const dir = path.join(outRoot, pageSlug, '00-page-shell');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'final.json'), JSON.stringify(out));
  manifest.unshift({
    page: pageSlug,
    dir: `${pageSlug}/00-page-shell`,
    kind: 'shell',
    sectionId: 'page-shell',
    chapterName: 'Page shell (nav + drawer + smooth wrapper + empty main + footer)',
    order: 0,
    of: sections.length,
    nodes: shellNodes.length,
    styles: styles.length,
    assets: assets.length,
    embeds: shellNodes.filter((n) => n.type === 'HtmlEmbed').length,
    scripted: false,
  });
}

// append to the shared manifest
const manifestPath = path.join(outRoot, 'manifest.json');
const existing = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : [];
const merged = existing.filter((e) => e.page !== pageSlug).concat(manifest);
fs.writeFileSync(manifestPath, JSON.stringify(merged, null, 1));

for (const m of manifest) {
  console.log(
    `${m.dir}  [${m.kind}] #${m.sectionId}${m.chapterName ? ` "${m.chapterName}"` : ''} ` +
      `nodes=${m.nodes} styles=${m.styles} assets=${m.assets} embeds=${m.embeds}${m.scripted ? ' scripted' : ''}`
  );
}
