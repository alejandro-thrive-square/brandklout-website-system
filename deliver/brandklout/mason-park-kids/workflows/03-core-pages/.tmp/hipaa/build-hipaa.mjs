// Build home/hipaa-disclosure/index.html: the HHS model Notice of Privacy Practices our Webflow
// sites carry at /hipaa-disclosure, in this site's /privacy-policy template.
//
//   node .tmp/hipaa/build-hipaa.mjs
//
// The notice text is reference-stone.html (Stone Dental Implant Center's live page, fetched
// 2026-10-01) VERBATIM. Only the practice-specific parts are swapped (SWAPS below), and the
// effective date. The chrome (head, top line, masthead, footer, scripts) is copied from
// home/privacy-policy/index.html, which stamp.mjs keeps identical to the homepage's.
//
// Legal entity: neither this site's privacy page nor any other page, the recovered WordPress
// export, or the live site names one, so the notice names the practice ("Mason Park Dental for
// Kids") and the duplicated alias in the opening sentence is dropped. Replace ENTITY when the
// practice confirms its legal name.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOME = path.resolve(HERE, "..", "..", "home");
const ref = fs.readFileSync(path.join(HERE, "reference-stone.html"), "utf8");
const shell = fs.readFileSync(path.join(HOME, "privacy-policy", "index.html"), "utf8");

const ENTITY = "Mason Park Dental for Kids";
const PRACTICE = "Mason Park Dental for Kids";
const EFFECTIVE = "October 1, 2026";
const TITLE = `HIPAA Disclosure | ${PRACTICE}`;
const DESCRIPTION = `The Notice of Privacy Practices of ${PRACTICE} in Katy, TX: how your child's health information may be used and shared, and your rights.`;

// ---------------------------------------------------------------- the notice, as blocks
const article = ref.match(/<article>([\s\S]*)<\/article>/)[1];
const blocks = [...article.matchAll(/<(p|h2|h3|ul)\b[^>]*>([\s\S]*?)<\/\1>/g)].map((m) => ({ tag: m[1], html: m[2] }));

// Practice-specific swaps. Each must hit exactly once; anything else in the text is HHS's.
const swap = (html, from, to) => {
  if (!html.includes(from)) throw new Error(`swap target not found: ${from}`);
  return html.replace(from, to);
};
const fix = (b) => {
  let h = b.html;
  if (/^<strong>Effective Date:<\/strong>/.test(h)) h = `<strong>Effective Date:</strong> ${EFFECTIVE}`;
  if (h.includes("This Notice of Privacy Practices applies to")) {
    h = swap(h, "Stone Surgical Arts PLLC (“Stone Dental Implant Center,” “we,” “us,” or “our”)",
      ENTITY === PRACTICE ? `${ENTITY} (“we,” “us,” or “our”)` : `${ENTITY} (“${PRACTICE},” “we,” “us,” or “our”)`);
    h = swap(h, 'href="/privacy-policy"', 'href="/privacy-policy/"');
  }
  if (h.startsWith("<strong>Stone Surgical Arts PLLC</strong>")) {
    h = [
      `<strong>${ENTITY}</strong>`,
      "21830 Kingsland Blvd #104B",
      "Katy, TX 77450",
      'Phone: <a href="tel:+12815787100">(281) 578-7100</a>',
      'Email: <a href="mailto:office@masonparkdental.com">office@masonparkdental.com</a>',
      'Website: <a href="/">masonparkpediatricdental.com</a>',
    ].join("<br>");
  }
  if (/Stone|Westlake|stonesurgical|383-8361/i.test(h)) throw new Error(`Stone detail left in: ${h.slice(0, 80)}`);
  // Webflow's role="list" is dropped; lf-ticks is this site's list.
  return { ...b, html: h };
};
const B = blocks.map(fix);

// Cut the notice at its h2s: [ {h2, body: [...]}, ... ], with the preamble first.
const groups = [{ h2: null, body: [] }];
for (const b of B) {
  if (b.tag === "h2") groups.push({ h2: b.html, body: [] });
  else groups.at(-1).body.push(b);
}
const take = (h2) => {
  const i = groups.findIndex((g) => g.h2 === h2);
  if (i < 0) throw new Error(`no group ${h2}`);
  return groups.splice(i, 1)[0];
};

// ---------------------------------------------------------------- rendering
const el = (b, ind) => {
  if (b.tag === "ul") return `${ind}<ul class="lf-ticks" role="list">${b.html}</ul>`;
  return `${ind}<${b.tag}>${b.html}</${b.tag}>`;
};
// A run of blocks becomes lf-sections, one per h3 (blocks before the first h3 form their own).
const sections = (body, ind = "      ") => {
  const out = [];
  let cur = null;
  for (const b of body) {
    if (b.tag === "h3" || !cur) { cur = []; out.push(cur); }
    cur.push(b);
  }
  return out.map((s) => `${ind}<section class="lf-section">\n${s.map((b) => el(b, ind + "  ")).join("\n")}\n${ind}</section>`).join("\n");
};
const head = (n, tag, h2, lead = []) => `    <div class="lf-head">
      <p class="chapter-tag"><i></i><b>${tag}</b></p>
      <h2 data-split>${h2}</h2>
${lead.map((b) => el(b, "      ")).join("\n")}
    </div>`;
const chapter = (n, id, name, theme, headHtml, bodyHtml) => `<section class="ch ch-${id}" id="${id}" data-chapter="${n}" data-chapter-name="${name}" data-theme="${theme}">
  <div class="wrap lf-layout lf-split">
${headHtml}
    <div>
${bodyHtml}
    </div>
  </div>
</section>`;

// Preamble: effective date, scope, the bold tagline (becomes the chapter's h2), description, contact.
const pre = groups.shift().body;
const tagline = pre.find((b) => /^<strong>Your Information\. Your Rights\. Our Responsibilities\.<\/strong>$/.test(b.html));
const preBody = pre.filter((b) => b !== tagline);
// The three summary lists (the first "Your Rights", "Your Choices", "Our Uses and Disclosures").
const sum = ["Your Rights", "Your Choices", "Our Uses and Disclosures"].map((h) => take(h));
const summary = sum.map((g) => [{ tag: "h3", html: g.h2 }, ...g.body]).flat();

const rights = take("Your Rights");
const choices = take("Your Choices");
const uses = take("Our Uses and Disclosures");
const other = take("How else can we use or share your health information?");
const resp = take("Our Responsibilities");
const changes = take("Changes to the Terms of this Notice");
if (groups.length) throw new Error(`unplaced sections: ${groups.map((g) => g.h2).join(", ")}`);

// The lead paragraphs before a group's first h3 sit under its h2, as on the privacy page's heads.
const split = (g) => {
  const i = g.body.findIndex((b) => b.tag === "h3");
  return i < 0 ? [[], g.body] : [g.body.slice(0, i), g.body.slice(i)];
};

const ch = [];
ch.push(chapter(1, "notice", "The Notice", "warm",
  head(1, "The Notice", tagline.html.replace(/<\/?strong>/g, "")),
  [sections(preBody), sections(summary)].join("\n")));
{
  const [lead, rest] = split(rights);
  ch.push(chapter(2, "rights", "Your Rights", "sage", head(2, "Rights in detail", rights.h2, lead), sections(rest)));
}
ch.push(chapter(3, "choices", "Your Choices", "sky", head(3, "Choices in detail", choices.h2, choices.body.slice(0, 1)),
  sections(choices.body.slice(1))));
{
  const [lead, rest] = split(uses);
  ch.push(chapter(4, "uses", "Our Uses", "warm", head(4, "Uses in detail", uses.h2, lead), sections(rest)));
}
{
  const [lead, rest] = split(other);
  ch.push(chapter(5, "other", "Other Uses", "sage", head(5, "Other Uses", other.h2, lead), sections(rest)));
}
ch.push(chapter(6, "responsibilities", "Our Responsibilities", "sky", head(6, "Our duties", resp.h2),
  [sections(resp.body), sections([{ tag: "h3", html: changes.h2 }, ...changes.body])].join("\n")));

// ---------------------------------------------------------------- the page
const MAP = "https://www.google.com/maps/place/Mason+Park+Dental+for+Kids+-+Pediatric+Dentist+Katy+TX/@29.7759444,-95.7490312,17z/data=!4m6!3m5!1s0x8641277706112ec1:0x98941d027afdec7b!8m2!3d29.7759444!4d-95.7490312!16s%2Fg%2F11sff9c67k";
const ppMain = shell.match(/<main class="main-wrapper" id="main">[\s\S]*?<\/main>/)[0];
const invitation = ppMain.match(/<section class="ch ch-invitation"[\s\S]*?<\/section>\n<\/main>/)[0].replace(/\n<\/main>$/, "")
  .replace('data-chapter="4"', 'data-chapter="7"')
  .replace("<h2 data-split>Ask us anything about this.</h2>", "<h2 data-split>Questions about this notice?</h2>")
  .replace(/<p class="iv-lede">[\s\S]*?<\/p>/, '<p class="iv-lede">To see or correct your child’s record, to ask how we share it, or to file a complaint, contact the office.</p>')
  .replace('<a href="/accessibility-statement/">Accessibility statement</a>', '<a href="/privacy-policy/">Privacy policy</a><br><a href="/accessibility-statement/">Accessibility statement</a>');
if (!invitation.includes("Questions about this notice?") || !invitation.includes("Privacy policy")) throw new Error("invitation edits missed");

const arrival = `<section class="ch ch-arrival is-compact" id="arrival" data-chapter="0" data-chapter-name="Arrival" data-theme="dark">
  <div class="ar-bg" data-drift>
    <img src="../assets/uploads/st-window-960.webp" srcset="../assets/uploads/st-window-480.webp 480w, ../assets/uploads/st-window-960.webp 960w, ../assets/uploads/st-window-1400.webp 1400w" sizes="100vw" alt="Sunlight through a window in a quiet room" fetchpriority="high" decoding="async">
  </div>
  <div class="ar-veil" aria-hidden="true"></div>
  <div class="ar-in">
    <p class="chapter-tag"><i></i><b>Notice of Privacy Practices</b></p>
    <h1 class="ar-title" data-split>HIPAA <em>Disclosure</em></h1>
    <p class="ar-lede" data-anim="hide">How medical information about you may be used and disclosed and how you can get access to this information. Effective ${EFFECTIVE}.</p>
    <div class="ar-actions" data-anim="hide"><a class="button is-sun is-lg" href="#rights">Your rights</a>
      <a class="button is-ghost-light is-lg" href="tel:+12815787100">(281) 578-7100</a></div>
  </div>
</section>`;

const main = `<main class="main-wrapper" id="main">
<!-- built by .tmp/hipaa/build-hipaa.mjs from the HHS model notice; see its header -->
${arrival}

<nav class="crumbs" aria-label="Breadcrumb"><span><a href="/">Home</a></span><span>HIPAA disclosure</span></nav>

${ch.join("\n\n")}

${invitation}
</main>`;

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
page = page.split("/privacy-policy/\">\n").join("/hipaa-disclosure/\">\n"); // canonical + og:url
if ((page.match(/hipaa-disclosure\/">/g) || []).length !== 2) throw new Error("canonical/og:url swap missed");

const out = path.join(HOME, "hipaa-disclosure", "index.html");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, page);
console.log(`${path.relative(process.cwd(), out)}: ${page.length} bytes, ${ch.length + 2} chapters, ${B.length} notice blocks`);
console.log(`title: ${TITLE}\ndescription (${DESCRIPTION.length}): ${DESCRIPTION}`);
