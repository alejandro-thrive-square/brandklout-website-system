#!/usr/bin/env node
/**
 * patch-links.mjs — one-off: the two things only the SERVED page revealed.
 *
 * 1. Webflow serves no global anchor reset on this site. A bare <a> renders
 *    browser-blue and underlined, so the header phone number shipped as a 1996
 *    hyperlink. Every link class has to state its own colour and decoration.
 * 2. The cloned layer carries `display: none` on the announce bar. A value diff
 *    cannot see it — the stylesheet never mentions display, so there is nothing
 *    to compare against. Saying it explicitly is what brings the bar back.
 *
 * Run once; it is idempotent.
 */
import fs from 'node:fs';

const FILE = new URL('./camp.css', import.meta.url);
let css = fs.readFileSync(FILE, 'utf8');

const add = (selector, decls) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp('(' + escaped + ' \\{)([^}]*)(\\})');
  const m = css.match(re);
  if (!m) { console.log('rule not found:', selector); return; }
  const missing = decls.filter((d) => !m[2].includes(d.split(':')[0] + ':'));
  if (!missing.length) { console.log('already set:', selector); return; }
  css = css.replace(re, (whole, open, body, close) =>
    open + body.replace(/\s*$/, '\n') + missing.map((d) => '  ' + d + ';\n').join('') + close);
  console.log('patched:', selector, '->', missing.join('; '));
};

add('.camp_announce', ['display: block']);
add('.camp_header_phone', ['color: #ffffff', 'text-decoration: none']);
add('.camp_header_brand', ['text-decoration: none']);
add('.camp_announce_link', ['text-decoration: none']);
add('.camp_video_slot', ['text-decoration: none']);
add('.camp_mobile-bar_link', ['text-decoration: none']);
add('.camp_button', ['text-decoration: none']);
add('.camp_text-link', ['text-decoration: none']);
add('.camp_footer_link', ['text-decoration: none']);

// The container gutter has to live on the element that carries both classes:
// Webflow resolves `class="camp_container camp_proof_grid"` to the COMBO, and
// this site's combo inherited Arvada's 0px, so the proof bar lost its gutter.
if (!css.includes('.camp_container.camp_proof_grid')) {
  css = css.replace(/(\.camp_proof_grid \{[^}]*\}\n)/, '$1\n/* the gutter lives on the combo, because that is what Webflow resolves */\n.camp_container.camp_proof_grid {\n  padding-left: 24px;\n  padding-right: 24px;\n}\n');
  console.log('patched: .camp_container.camp_proof_grid gutter');
}

fs.writeFileSync(FILE, css);
