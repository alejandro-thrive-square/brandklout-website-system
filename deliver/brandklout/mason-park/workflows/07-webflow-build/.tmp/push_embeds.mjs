#!/usr/bin/env node
/**
 * push_embeds.mjs — re-install each page's HtmlEmbed code from the re-themed
 * payload, and read it back.
 *
 * Source Asana task GID: 1217040406855582
 *
 * WHY AN EMBED IS NOT COVERED BY A STYLE RE-THEME
 * -----------------------------------------------
 * The lead form rides in an HtmlEmbed that carries its OWN <style> block, so
 * none of it is a Webflow style and `update_style` cannot reach it. After a
 * re-theme that verified 313/313 rules, the published CSS still served
 * `.form-card .btn--sand{background:#a8875f}`, `.consent{color:#4e585b}` and
 * `font-family:Outfit` — the whole form was still on the old palette and the
 * old typeface. Only reading the PUBLISHED stylesheet found it.
 *
 * Diff first, install second: the converter regenerates markup as well as
 * colour, and an embed swap replaces live form markup.
 *
 *   node push_embeds.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { callTool } from './wfmcp.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = '6a60bdc0340e5f1784b4d553'; // Mason Park Dental — the boundary.
// The two lead-form embeds. thank-you's embed is the Google Maps iframe: it
// carries no palette and no type, so it is deliberately left alone rather than
// swapped for a payload whose only difference is entity-escaped ampersands.
const EMBEDS = {
  invisalign: { page: '6a75f467c7c9e1a0c133edd1', element: '6f1285e0-23e1-9551-1c29-0f95b9cb91e7' },
  'new-patient-special': { page: '6a75f468bfddad669aaf8321', element: '4b182a2e-b28b-05d5-695c-168867ceb169' },
};
const dry = process.argv.includes('--dry');

/**
 * Resolve the design tokens the converter left behind in the embed's INLINE
 * styles. `:root` never made it onto the Webflow site — that is the same
 * "var() is resolved once, at the base" gap the display ladder hit — so an
 * embed shipped verbatim renders `font-family:var(--display)`, which resolves
 * to nothing and drops the form's headings to the browser default.
 * Values are read straight off the design package so they cannot drift.
 */
const TOKENS = {
  '--display': "'Fraunces',Georgia,'Times New Roman',serif",
  '--t-body': '1.125rem',
};
function resolveTokens(code) {
  let out = code;
  for (const [name, value] of Object.entries(TOKENS)) {
    out = out.split(`var(${name})`).join(value);
  }
  const left = out.match(/var\((--[a-z0-9-]+)\)/g);
  if (left) throw new Error(`unresolved design tokens in embed: ${[...new Set(left)].join(', ')}`);
  return out;
}

for (const [page, { page: pageId, element }] of Object.entries(EMBEDS)) {
  const raw = JSON.parse(fs.readFileSync(path.join(HERE, page, 'whtml', 'embeds.json'), 'utf8'));
  const want = resolveTokens((Array.isArray(raw) ? raw[0] : raw).code);
  const id = { component: pageId, element };

  const { text } = await callTool('data_element_settings_tool', {
    siteId: SITE,
    pageId,
    context: 'Reads one HtmlEmbed code setting so it can be diffed against the re-themed payload.',
    actions: [{ label: `read ${page}`, get_settings: { type: 'all_resolved_settings', element_id: id } }],
  });
  // Settings come back as {result:[{data:{matches:[{key,value},...]}}]} — a
  // list of key/value pairs, not an object keyed by setting name.
  const codeOf = (t) =>
    (JSON.parse(t).result?.[0]?.data?.matches ?? []).find((s) => s.key === 'code')?.value ?? null;
  const current = codeOf(text);

  if (current === null) {
    console.log(`${page}: no code setting on that element — is the id right?`);
    continue;
  }
  if (current.trim() === want.trim()) {
    console.log(`${page}: embed already matches the payload (${want.length}B) — nothing to do`);
    continue;
  }

  // Report the shape of the change before replacing live markup.
  const strip = (s) => s.replace(/<style>[\s\S]*?<\/style>/, '');
  console.log(
    `${page}: embed differs — live ${current.length}B vs payload ${want.length}B; ` +
      `markup outside <style> ${strip(current) === strip(want) ? 'IDENTICAL' : 'ALSO CHANGED'}`
  );
  if (dry) continue;

  await callTool('data_element_settings_tool', {
    siteId: SITE,
    pageId,
    context: 'Installs the re-themed HtmlEmbed code, which carries its own stylesheet no style update can reach.',
    actions: [{
      label: `write ${page}`,
      set_settings: {
        operations: [{ element_id: id, label: page, settings: [{ key: 'code', static_text: { value: want } }] }],
      },
    }],
  });

  const back = await callTool('data_element_settings_tool', {
    siteId: SITE,
    pageId,
    context: 'Reads the HtmlEmbed code back to confirm it stored verbatim.',
    actions: [{ label: `verify ${page}`, get_settings: { type: 'all_resolved_settings', element_id: id } }],
  });
  const stored = codeOf(back.text) ?? '';
  console.log(`   ${stored.trim() === want.trim() ? 'ok' : 'FAIL'} stored ${stored.length}B`);
}
