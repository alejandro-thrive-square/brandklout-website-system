// Build home/terms-of-service/index.html: the Terms of Service of the sister adult practice
// (https://www.masonparkdental.com/terms-of-service, fetched 2026-10-03 as reference-masonpark.html),
// in this site's /privacy-policy template. Sibling of ../hipaa/build-hipaa.mjs.
//
//   node .tmp/terms/build-terms.mjs
//
// The legal text (the lead paragraphs and the twenty numbered sections) is the reference VERBATIM.
// Only the practice-specific parts are swapped (SWAPS below): the entity, the website, phone,
// suite, the e-mail (Cloudflare-obfuscated in the reference, decoded and checked), the effective
// date, the Smile Preview tool name the kids site does not have, and Privacy Policy / Notice of
// Privacy Practices are linked to this site's /privacy-policy/ and /hipaa-disclosure/.
// The chrome (head, top line, masthead, footer, scripts) is copied from home/privacy-policy/index.html.
//
// Entity: as on /hipaa-disclosure, no legal entity is named anywhere on this site, so the terms
// name the practice ("Mason Park Dental for Kids") and drop the duplicated alias. Replace ENTITY
// when the practice confirms its legal name.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOME = path.resolve(HERE, "..", "..", "home");
const ref = fs.readFileSync(path.join(HERE, "reference-masonpark.html"), "utf8");
const shell = fs.readFileSync(path.join(HOME, "privacy-policy", "index.html"), "utf8");

const ENTITY = "Mason Park Dental for Kids";
const PRACTICE = "Mason Park Dental for Kids";
const EFFECTIVE = "October 3, 2026";
const EMAIL = "office@masonparkdental.com";
const TITLE = `Terms of Service | ${PRACTICE}`;
const DESCRIPTION = `The Terms of Service of ${PRACTICE} in Katy, TX: use of this website, appointment requests, and our text messaging program.`;

// ---------------------------------------------------------------- the reference, as blocks
const blocksOf = (html) => [...html.matchAll(/<(p|ul)\b[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => ({ tag: m[1], html: m[2] }));
const lfBody = ref.match(/<div class="lf-body text-rich-text">([\s\S]*?)<\/div>/)[1];
const lead = blocksOf(lfBody);
const items = [...ref.matchAll(/<summary class="faq_question">([^<]*)<\/summary><div class="faq_answer">([\s\S]*?)<\/div><\/details>/g)]
  .map((m) => ({ title: m[1], body: blocksOf(m[2]) }));
if (lead.length !== 3) throw new Error(`expected 3 lead paragraphs, got ${lead.length}`);
if (items.length !== 20 || items.some((it, i) => !it.title.startsWith(`${i + 1}. `))) throw new Error(`expected sections 1-20, got ${items.length}`);
// The "Important Parts" summary (the reference's own first chapter): three cards and a ledger.
const keyCh = ref.match(/<section class="ch ch-qualify"[\s\S]*?<\/section>/)[0];
const cards = [...keyCh.matchAll(/<div class="svc-card_body">([\s\S]*?)<\/div><\/article>/g)].map((m) => {
  const name = (m[1].match(/<h3 class="svc-card_name">([\s\S]*?)<\/h3>/) || [])[1]
    ?? m[1].match(/<p class="svc-price">([\s\S]*?)<small>([\s\S]*?)<\/small><\/p>/).slice(1).join(": ").replace(/: Do not/, ": do not");
  return { name, text: m[1].match(/<p class="svc-card_text">([\s\S]*?)<\/p>/)[1] };
});
const ledgerLabel = keyCh.match(/<p class="svc-ledger-label">([\s\S]*?)<\/p>/)[1];
const ledger = [...keyCh.match(/<ul class="svc-ledger">([\s\S]*?)<\/ul>/)[1].matchAll(/<li><b>([\s\S]*?)<\/b><span>([\s\S]*?)<\/span><\/li>/g)].map((m) => [m[1], m[2]]);
const keyH2 = keyCh.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)[1];
const keyLede = keyCh.match(/<p class="pe-lede">([\s\S]*?)<\/p>/)[1];
if (cards.length !== 3 || ledger.length !== 3) throw new Error(`summary: ${cards.length} cards, ${ledger.length} ledger rows`);

// ---------------------------------------------------------------- practice-specific swaps
const cfDecode = (hex) => { const k = parseInt(hex.slice(0, 2), 16); let o = ""; for (let i = 2; i < hex.length; i += 2) o += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16) ^ k); return o; };
const hits = {};
const swap = (h, from, to, key = from) => {
  const n = h.split(from).length - 1;
  hits[key] = (hits[key] || 0) + n;
  return h.split(from).join(to);
};
const fix = (h) => {
  h = h.replace(/<a href="\/cdn-cgi\/l\/email-protection" class="__cf_email__" data-cfemail="([0-9a-f]+)">\[email&#160;protected\]<\/a>/g, (_, hex) => {
    const e = cfDecode(hex);
    if (e !== EMAIL) throw new Error(`reference e-mail is ${e}, not ${EMAIL}`);
    hits.email = (hits.email || 0) + 1;
    return `<a href="mailto:${EMAIL}">${EMAIL}</a>`;
  });
  h = h.replace(/\s+target="_self"/g, "");
  h = swap(h, "Mason Park Dental of Katy PLLC (“Mason Park Dental of Katy,” “we,” “us,” or “our”), located at https://bestdentistinkatytx.com/",
    ENTITY === PRACTICE ? `${ENTITY} (“we,” “us,” or “our”), located at https://masonparkpediatricdental.com/` : `${ENTITY} (“${PRACTICE},” “we,” “us,” or “our”), located at https://masonparkpediatricdental.com/`, "scope");
  h = swap(h, "Mason Park Dental of Katy", PRACTICE, "practice");
  h = swap(h, "tel:+12817698878", "tel:+12815787100", "tel");
  h = swap(h, "(281) 769-8878", "(281) 578-7100", "phone");
  h = swap(h, "the Virtual Consultation / Smile Preview tool", "the Virtual Consultation", "smile-preview");
  h = swap(h, "our Privacy Policy and Cookie Policy", 'our <a href="/privacy-policy/">Privacy Policy</a> and Cookie Policy', "privacy-link");
  h = swap(h, "our separate Notice of Privacy Practices under HIPAA", 'our separate <a href="/hipaa-disclosure/">Notice of Privacy Practices</a> under HIPAA', "npp-link");
  // The client asked for no em dashes in the copy (check.mjs rule 8): punctuation only, same words.
  h = swap(h, "any message you receive — after you reply STOP,", "any message you receive; after you reply STOP,", "dash");
  h = swap(h, "independent third parties — not directly by", "independent third parties, not directly by", "dash");
  h = swap(h, "All content on this Site — including text, graphics, logos, icons, photographs, videos, page layouts, design elements, and written content — is owned",
    "All content on this Site (including text, graphics, logos, icons, photographs, videos, page layouts, design elements, and written content) is owned", "dash");
  if (/—|&mdash;/.test(h)) throw new Error(`em dash left: ${h.slice(0, 80)}`);
  return h;
};
const fixB = (b) => ({ ...b, html: fix(b.html) });
const LEAD = lead.map(fixB);
const ITEMS = items.map((it) => ({ title: fix(it.title), body: it.body.map(fixB) }));
// Section 20's contact block, in the HIPAA page's form.
const contact = ITEMS[19].body.at(-1);
if (!contact.html.startsWith(`${PRACTICE}<br>21830 Kingsland Blvd #104A`)) throw new Error(`contact block changed: ${contact.html.slice(0, 80)}`);
contact.html = [
  `<strong>${ENTITY}</strong>`,
  "21830 Kingsland Blvd #104B",
  "Katy, TX 77450",
  'Phone: <a href="tel:+12815787100">(281) 578-7100</a>',
  `Email: <a href="mailto:${EMAIL}">${EMAIL}</a>`,
  'Website: <a href="/">masonparkpediatricdental.com</a>',
].join("<br>");
hits.contact = 1;
const CARDS = cards.map((c) => ({ name: fix(c.name), text: fix(c.text) }));
const LEDGER = ledger.map(([b, s]) => [fix(b), fix(s)]);
// Every swap must have fired; the counts are what the reference holds.
const EXPECT = { scope: 1, dash: 3, email: 2, tel: 2, "smile-preview": 1, "privacy-link": 2, "npp-link": 1, contact: 1 };
for (const [k, n] of Object.entries(EXPECT)) if (hits[k] !== n) throw new Error(`swap ${k}: ${hits[k] || 0} hit(s), expected ${n}`);
if (!(hits.practice >= 10) || !(hits.phone >= 2)) throw new Error(`swap counts: ${JSON.stringify(hits)}`);

// ---------------------------------------------------------------- rendering
const el = (b, ind) => (b.tag === "ul"
  ? `${ind}<ul class="lf-ticks" role="list">${b.html.replace(/\s*class="lf-ticks"/, "")}</ul>`
  : `${ind}<${b.tag}>${b.html}</${b.tag}>`);
const section = (title, body, ind = "      ") => `${ind}<section class="lf-section">
${[...(title ? [{ tag: "h3", html: title }] : []), ...body].map((b) => el(b, ind + "  ")).join("\n")}
${ind}</section>`;
const head = (tag, h2, leadBlocks = []) => `    <div class="lf-head">
      <p class="chapter-tag"><i></i><b>${tag}</b></p>
      <h2 data-split>${h2}</h2>
${leadBlocks.map((b) => el(b, "      ")).join("\n")}
    </div>`;
const chapter = (n, id, name, theme, headHtml, bodyHtml) => `<section class="ch ch-${id}" id="${id}" data-chapter="${n}" data-chapter-name="${name}" data-theme="${theme}">
  <div class="wrap lf-layout lf-split">
${headHtml}
    <div>
${bodyHtml}
    </div>
  </div>
</section>`;
const secs = (a, b) => ITEMS.slice(a - 1, b).map((it) => section(it.title, it.body)).join("\n");

const ch = [];
ch.push(chapter(1, "key", "The Important Parts", "warm", head("The Important Parts", keyH2, [{ tag: "p", html: keyLede }]),
  [...CARDS.map((c) => section(c.name, [{ tag: "p", html: c.text }])),
    section(ledgerLabel, [{ tag: "ul", html: LEDGER.map(([b, s]) => `<li><strong>${b}.</strong> ${s}</li>`).join("") }])].join("\n")));
ch.push(chapter(2, "terms", "The Terms", "sage",
  // The three lead paragraphs sit in the body as an untitled first section: in lf-head they stack
  // with no gap between them (seen on staging 2026-10-03). Only the effective date stays under the h2.
  head("Sections 1 to 4", "Using this website.", [{ tag: "p", html: `<strong>Effective Date:</strong> ${EFFECTIVE}` }]),
  [section(null, LEAD), secs(1, 4)].join("\n")));
ch.push(chapter(3, "messages", "Messages", "sky", head("Section 5", "Calls, e-mail and text messages."), secs(5, 5)));
ch.push(chapter(4, "tools", "Tools", "warm", head("Sections 6 to 9", "Third-party tools, financing, and your part."), secs(6, 9)));
ch.push(chapter(5, "liability", "Liability", "sage", head("Sections 10 to 15", "Ownership, disclaimers and liability."), secs(10, 15)));
ch.push(chapter(6, "law", "Law and Contact", "sky", head("Sections 16 to 20", "Law, privacy, changes, and who to ask."), secs(16, 20)));

// ---------------------------------------------------------------- the page
const ppMain = shell.match(/<main class="main-wrapper" id="main">[\s\S]*?<\/main>/)[0];
const invitation = ppMain.match(/<section class="ch ch-invitation"[\s\S]*?<\/section>\n<\/main>/)[0].replace(/\n<\/main>$/, "")
  .replace('data-chapter="4"', 'data-chapter="7"')
  .replace("<h2 data-split>Ask us anything about this.</h2>", "<h2 data-split>Questions about these terms?</h2>")
  .replace(/<p class="iv-lede">[\s\S]*?<\/p>/, '<p class="iv-lede">If anything on this page is unclear, or you want to opt out of text messages and would rather do it by phone than by replying STOP, call the office.</p>')
  .replace('<a href="/accessibility-statement/">Accessibility statement</a>', '<a href="/privacy-policy/">Privacy policy</a><br><a href="/hipaa-disclosure/">HIPAA disclosure</a><br><a href="/accessibility-statement/">Accessibility statement</a>');
if (!invitation.includes("Questions about these terms?") || !invitation.includes("HIPAA disclosure") || !invitation.includes("replying STOP")) throw new Error("invitation edits missed");

const arrival = `<section class="ch ch-arrival is-compact" id="arrival" data-chapter="0" data-chapter-name="Arrival" data-theme="dark">
  <div class="ar-bg" data-drift>
    <img src="../assets/uploads/st-window-960.webp" srcset="../assets/uploads/st-window-480.webp 480w, ../assets/uploads/st-window-960.webp 960w, ../assets/uploads/st-window-1400.webp 1400w" sizes="100vw" alt="Sunlight through a window in a quiet room" fetchpriority="high" decoding="async">
  </div>
  <div class="ar-veil" aria-hidden="true"></div>
  <div class="ar-in">
    <p class="chapter-tag"><i></i><b>Legal</b></p>
    <h1 class="ar-title" data-split>Terms of <em>Service</em></h1>
    <p class="ar-lede" data-anim="hide">Effective ${EFFECTIVE}. These terms govern your use of this website and our text messaging program.</p>
    <div class="ar-actions" data-anim="hide"><a class="button is-sun is-lg" href="#terms">Read the terms</a>
      <a class="button is-ghost-light is-lg" href="tel:+12815787100">(281) 578-7100</a></div>
  </div>
</section>`;

const main = `<main class="main-wrapper" id="main">
<!-- built by .tmp/terms/build-terms.mjs from the sister practice's terms; see its header -->
${arrival}

<nav class="crumbs" aria-label="Breadcrumb"><span><a href="/">Home</a></span><span>Terms of service</span></nav>

${ch.join("\n\n")}

${invitation}
</main>`;

// No adult-practice leftovers in what this build wrote (the shared footer links the adult practice on purpose).
const LEFT = [/of Katy/i, /PLLC/, /bestdentistinkatytx/i, /(?<!office@)masonparkdental\.com/i, /769-8878|12817698878/, /104A/i,
  /Smile Preview/i, /cdn-cgi|cfemail|email&#160;protected/, /\bimplant|veneer|denture|whitening|all-on/i, /programme/, /target="_self"/];
for (const re of LEFT) {
  const m = main.match(re);
  if (m) throw new Error(`adult-practice leftover ${re}: …${main.slice(Math.max(0, m.index - 60), m.index + 60)}…`);
}

let page = shell.replace(ppMain, () => main);
const metaSwap = (re, val) => {
  if (!re.test(page)) throw new Error(`head line missing: ${re}`);
  page = page.replace(re, val);
};
const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
metaSwap(/<title>[^<]*<\/title>/, `<title>${TITLE}</title>`);
metaSwap(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(DESCRIPTION)}">`);
metaSwap(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(TITLE)}">`);
metaSwap(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(DESCRIPTION)}">`);
page = page.split("/privacy-policy/\">\n").join("/terms-of-service/\">\n"); // canonical + og:url
if ((page.match(/terms-of-service\/">/g) || []).length !== 2) throw new Error("canonical/og:url swap missed");
if (DESCRIPTION.length >= 160) throw new Error(`description is ${DESCRIPTION.length} chars`);
const chapters = ch.length + 2;
if (chapters > 8) throw new Error(`${chapters} chapters, the journey cap is 8`);

const out = path.join(HOME, "terms-of-service", "index.html");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, page);
console.log(`${path.relative(process.cwd(), out)}: ${page.length} bytes, ${chapters} chapters, ${ITEMS.length} sections`);
console.log(`swaps: ${JSON.stringify(hits)}`);
console.log(`title: ${TITLE}\ndescription (${DESCRIPTION.length}): ${DESCRIPTION}`);
