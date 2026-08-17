// lib.mjs — shared helpers for building campaign pages via data_element_builder.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
const WFMCP = path.join(HERE, '..', 'wfmcp.mjs');
export const SITE = '698111847e9608eb30ee21c6';
export const PAGES = {
  implants: { id: '6a8299c9e8c592d788e327ca', body: '6a8299c9e8c592d788e327d1' },
  emergency: { id: '6a8299c9509f752da031a277', body: '6a8299c9509f752da031a27e' },
  consult: { id: '6a8299c905e084f80b8d481e', body: '6a8299c905e084f80b8d4825' },
  thankyou: { id: '6a8299cae5353a50d6c43228', body: '6a8299cae5353a50d6c43230' },
};
export const PHONE = '+12817898836';
export const PHONE_TEXT = '(281) 789-8836';

const assetMap = JSON.parse(fs.readFileSync(path.join(HERE, 'asset-map.json'), 'utf8'));
export const A = (file) => {
  const e = assetMap[file];
  if (!e) throw new Error('asset not uploaded: ' + file);
  return e.id;
};
export const ICON = (name) => A('icon-' + name + '.svg'); // e.g. ICON('chevron-white')

// ---- element schema DSL ----
export const el = (type, style, extra = {}, ...children) => ({
  type,
  ...(style ? { set_style: { style_names: Array.isArray(style) ? style : [style] } } : {}),
  ...extra,
  ...(children.length ? { children } : {}),
});
export const div = (style, ...children) => el('DivBlock', style, {}, ...children);
export const section = (style, ...children) => el('Section', style, {}, ...children);
export const txt = (style, text) => el('TextBlock', style, { set_text: { text } });
export const par = (style, text) => el('Paragraph', style, { set_text: { text } });
export const h = (lvl, style, text) => el('Heading', style, { set_heading_level: { heading_level: lvl }, set_text: { text } });
export const img = (style, assetId, alt) => el('Image', style, { set_image_asset: { image_asset_id: assetId, ...(alt ? { alt_text: alt } : {}) } });
export const icon = (name, style = 'campaign-icon') => img(style, ICON(name), '');
export const linkUrl = (style, url, ...children) => el('LinkBlock', style, { set_link: { link_type: 'url', link: url } }, ...children);
export const linkPage = (style, pageId, ...children) => el('LinkBlock', style, { set_link: { link_type: 'page', link: pageId } }, ...children);
export const linkPhone = (style, ...children) => el('LinkBlock', style, { set_link: { link_type: 'phone', link: PHONE } }, ...children);
export const dom = (tag, style, extra = {}, ...children) => el('DOM', style, { set_dom_config: { dom_tag: tag }, ...extra }, ...children);

// A standard CTA button: LinkBlock with text + trailing icon.
export const btn = (styles, target, label, iconName) => {
  const kids = [txt(null, label)];
  if (iconName) kids.push(icon(iconName));
  const extra = target.page
    ? { set_link: { link_type: 'page', link: target.page } }
    : target.phone
      ? { set_link: { link_type: 'phone', link: PHONE } }
      : { set_link: { link_type: 'url', link: target.url } };
  return el('LinkBlock', styles, extra, ...kids);
};

// ---- runner ----
export function callTool(tool, args) {
  const f = path.join(HERE, '.args-build.json');
  fs.writeFileSync(f, JSON.stringify(args));
  return execFileSync('node', [WFMCP, 'call', tool, '--file', f], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

export function buildSections(pageKey, sections, logName) {
  const page = PAGES[pageKey];
  const LOG = path.join(HERE, logName);
  const done = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, 'utf8')) : {};
  for (const s of sections) {
    if (done[s.label]) { console.log('skip', s.label); continue; }
    const args = {
      context: 'Build campaign landing page sections natively with client-first classes.',
      siteId: SITE, pageId: page.id,
      actions: [{
        build_label: s.label,
        parent_element_id: {
          component: page.id,
          element: s.parentLabel ? String(done[s.parentLabel]) : page.body,
        },
        creation_position: 'append',
        element_schema: s.tree,
      }],
    };
    const f = path.join(HERE, '.args-build.json');
    fs.writeFileSync(f, JSON.stringify(args));
    let out;
    try {
      out = execFileSync('node', [WFMCP, 'call', 'data_element_builder', '--file', f], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    } catch (e) {
      console.error('FAIL(exec)', s.label, String(e.message).slice(0, 300));
      process.exitCode = 1; break;
    }
    if (!/"result"|success/i.test(out) || /"isError"\s*:\s*true/.test(out)) {
      console.error('FAIL', s.label, out.slice(0, 800));
      process.exitCode = 1; break;
    }
    const idMatch = out.match(/"element"\s*:\s*"([0-9a-f-]+)"/);
    done[s.label] = idMatch ? idMatch[1] : true;
    fs.writeFileSync(LOG, JSON.stringify(done, null, 1));
    console.log('built', s.label);
  }
  return done;
}
