// ===========================================================================
// BugHerd #34: "Missing a form fill for inquires" on /contacts.
//
// The site has no form anywhere and Instatic has no form backend, so the
// submission has to land somewhere. Brandklout's lead destination is
// GoHighLevel (see deliver/brandklout/docs/ASANA-DISPATCH.md), and no GHL form
// exists on record for Mason Park Kids. This script is the whole change,
// waiting on one value: put the client's GHL form URL in FORM_URL and run it.
//
//   node add-inquiry.mjs --dry
//   node add-inquiry.mjs
//
// It adds a fourth chapter to /contacts between "Four Ways" and "The Hours",
// renumbers the two below it, and adds the same section to the recipe so a
// rebuild keeps it. The CSS (.iq-slot) is already in site.css.
//
// AFTER RUNNING, two more things, or the form renders as an empty box:
//   1. frame-src. The published CSP is `frame-src 'none'` plus whatever
//      set-origins.mjs has been told. Add the form's origin:
//        cd ../../../../process/18-instatic-embeds
//        node set-origins.mjs --frame https://api.leadconnectorhq.com   # or the real host
//      Read embed-origins' notes first: autoTrust only opens frame-src for
//      embeds that are in the markup at publish, and a GHL form that injects
//      its own iframe at runtime needs the origin listed explicitly.
//   2. Reserve the height. The slot below is 44rem; GHL forms resize
//      themselves through postMessage, and a slot with no height collapses to
//      nothing before the first message arrives.
// ===========================================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(HERE, '..', 'home');
const DRY = process.argv.includes('--dry');

// ---------------------------------------------------------------------------
// THE ONE VALUE THIS IS WAITING FOR. A GoHighLevel form/survey embed URL for
// Mason Park Dental for Kids, e.g. https://api.leadconnectorhq.com/widget/form/<id>
const FORM_URL = '';
// ---------------------------------------------------------------------------

if (!FORM_URL) {
  console.error('FORM_URL is empty. Ask Brandklout for the GoHighLevel form embed URL for');
  console.error('Mason Park Kids (BugHerd #34 asks for it), put it above, and run again.');
  console.error('Do NOT ship this section with an empty slot: the client sees a blank panel.');
  process.exit(2);
}

const SECTION = `
<section class="ch ch-inquiry" id="inquiry" data-chapter="2" data-chapter-name="Ask Us" data-theme="paper">
  <div class="wrap ch-head is-split">
    <div>
      <p class="chapter-tag"><i></i><b>Ask Us</b></p>
      <h2 data-split>Or put the question in writing.</h2>
    </div>
    <p class="lede">Insurance, a second opinion, whether your child is old enough yet: send it here and the front desk answers. It is not a booking, and it does not put you on a list.</p>
  </div>
  <div class="wrap">
    <div class="iq-slot">
      <div class="embed_component">
        <iframe data-src="${FORM_URL}" title="Send the practice a question" loading="lazy"></iframe>
      </div>
    </div>
    <p class="ch-note">If your child is in pain today, call rather than write: <a href="tel:+12815787100">(281) 578-7100</a>, Monday to Thursday, 9am to 6pm.</p>
  </div>
</section>
`;

const file = path.join(SITE, 'contacts', 'index.html');
let src = fs.readFileSync(file, 'utf8');
if (src.includes('ch-inquiry')) { console.log('already there, nothing to do'); process.exit(0); }

const anchor = '\n<section class="ch ch-hours" id="hours"';
if (!src.includes(anchor)) throw new Error('cannot find the hours chapter to insert before');

// The new chapter takes index 2; the two below it move down one.
src = src.replace(anchor, SECTION + anchor);
src = src.replace(/(<section class="ch ch-hours" id="hours" data-chapter=")2(")/, '$13$2');
src = src.replace(/(<section class="ch ch-invitation" id="invitation" data-chapter=")3(")/, '$14$2');

if (!DRY) fs.writeFileSync(file, src);
console.log(`${DRY ? 'would add' : 'added'} the Ask Us chapter to contacts/index.html`);
console.log('next: node stamp.mjs, node check.mjs, then the publish chain in the 03 README');
console.log('and set frame-src for ' + new URL(FORM_URL).origin);
