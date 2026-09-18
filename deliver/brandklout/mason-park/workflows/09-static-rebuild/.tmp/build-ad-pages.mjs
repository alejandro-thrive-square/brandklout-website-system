/**
 * Build the six paid-traffic routes from the reviewed staging design system.
 *
 * The campaign pages deliberately reuse the hand-authored Invisalign, New
 * Patients and Thank You pages. Those are the approved source for brand,
 * chapter motion and responsive behaviour. This pass adds only the funnel
 * layer: noindex metadata, a focused mobile rail, the exact campaign form
 * placeholder and campaign-specific confirmation copy.
 *
 *   node .tmp/build-ad-pages.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOME = path.join(HERE, "..", "home");

const campaigns = [
  {
    key: "invisalign",
    source: "services/invisalign/index.html",
    title: "Invisalign in Katy, TX | Mason Park Dental",
    description: "Save $1,000 on all-inclusive Invisalign treatment at Mason Park Dental in Katy, with an additional $500 discount when treatment is prepaid in full.",
    formId: "YbX91GhEDKkCN4GH4gka",
    formName: "Contact Form Google Ads (Invisalign) - Mason Park",
    heading: "Start your Invisalign consultation.",
    lead: "Tell us what you would like to change about your smile. Our team will call to arrange a consultation and explain the offer before you commit.",
    button: "Start my consultation",
    consultTitle: "Invisalign Consultation | Mason Park Dental",
    consultDescription: "Request an Invisalign consultation with Mason Park Dental in Katy, TX.",
    thanksTitle: "Thank You for Your Invisalign Request | Mason Park Dental",
    thanksDescription: "Your Invisalign consultation request has reached Mason Park Dental. Here is what happens next.",
    thanksHero: "Thank you. <em>Your smile starts here.</em>",
    thanksLead: "Your Invisalign consultation request is with our front desk. We will call during office hours to arrange a time and explain the offer.",
    meanwhileHref: "/services/invisalign/",
    meanwhileText: "Review Invisalign treatment",
  },
  {
    key: "new-patient-special",
    source: "new-patients/index.html",
    title: "$189 New Patient Special | Mason Park Dental of Katy",
    description: "A comprehensive exam, digital x-rays, cleaning and written treatment plan for $189 at Mason Park Dental of Katy.",
    formId: "AFu5BpJpMjgSnSf8yybc",
    formName: "Contact Form Google Ads (NP) - Mason Park",
    heading: "Claim the $189 new patient special.",
    lead: "Tell us what brings you in. Our team will call to arrange your first visit and confirm what the $189 appointment includes.",
    button: "Claim the $189 visit",
    consultTitle: "$189 New Patient Consultation | Mason Park Dental",
    consultDescription: "Request the $189 new patient visit at Mason Park Dental of Katy.",
    thanksTitle: "Thank You for Your New Patient Request | Mason Park Dental",
    thanksDescription: "Your $189 new patient visit request has reached Mason Park Dental. Here is what happens next.",
    thanksHero: "Thank you. <em>Your first visit is next.</em>",
    thanksLead: "Your $189 new patient request is with our front desk. We will call during office hours to arrange a time and confirm the offer.",
    meanwhileHref: "/new-patients/",
    meanwhileText: "Review your first visit",
  },
];

const read = (rel) => fs.readFileSync(path.join(HOME, rel), "utf8");

function write(slug, html) {
  const dir = path.join(HOME, slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), html);
  console.log(`wrote /${slug}/ (${html.length} bytes)`);
}

function meta(html, { slug, title, description }) {
  const canonical = `https://www.masonparkdental.com/${slug}/`;
  html = html
    .replace(/<title>[\s\S]*?<\/title>/i, `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*">/i, `<meta name="description" content="${description}">`)
    .replace(/<link rel="canonical" href="[^"]*">/i, `<link rel="canonical" href="${canonical}">`)
    .replace(/<meta property="og:title" content="[^"]*">/i, `<meta property="og:title" content="${title}">`)
    .replace(/<meta property="og:description" content="[^"]*">/i, `<meta property="og:description" content="${description}">`)
    .replace(/<meta property="og:url" content="[^"]*">/i, `<meta property="og:url" content="${canonical}">`);
  if (!/<meta name="robots"/i.test(html)) {
    html = html.replace(/(<link rel="canonical"[^>]*>)/i, `$1\n<meta name="robots" content="noindex, follow">`);
  }
  return html.replace(/<body class="([^"]*)">/i, '<body class="$1 is-ad-page">');
}

function assetDepth(html, fromDepth, toDepth = 1) {
  const from = "../".repeat(fromDepth) + "assets/";
  const to = "../".repeat(toDepth) + "assets/";
  return html.split(from).join(to);
}

function rail(c, confirmation = false) {
  const href = confirmation ? c.meanwhileHref : "#consultation";
  const label = confirmation ? c.meanwhileText : c.button;
  return `<aside class="ad-rail" aria-label="Consultation actions">
  <span>${c.key === "invisalign" ? "$1,000 off Invisalign" : "$189 first visit"}</span>
  <a href="tel:+12817698878">Call</a>
  <a class="button" href="${href}">${label}</a>
</aside>`;
}

function formSection(c, chapter) {
  return `<section class="ch ad-consult" id="consultation" data-chapter="${chapter}" data-chapter-name="The Consultation" data-theme="dark">
  <div class="wrap ad-consult_grid">
    <div class="ad-consult_copy">
      <p class="chapter-tag"><i></i><b>The Consultation</b></p>
      <h2 data-split>${c.heading}</h2>
      <p>${c.lead}</p>
      <ul class="ad-consult_points">
        <li>No obligation</li>
        <li>Clear next steps</li>
        <li>Call from the Mason Park team</li>
      </ul>
      <p class="ad-consult_phone">Prefer to speak now? <a href="tel:+12817698878">(281) 769-8878</a></p>
    </div>
    <div class="ad-form-card">
      <p class="ad-form-kicker">Secure consultation form</p>
      <div class="ad-form-slot" data-ghl-form="${c.formId}" data-ghl-name="${c.formName}" data-ghl-height="723">
        <p>Contact form</p>
        <small>The live form is inserted by Instatic at import.</small>
      </div>
      <p class="ad-form-note">By submitting, you agree that Mason Park Dental may contact you about this request.</p>
    </div>
  </div>
</section>`;
}

function removeSectionById(html, id) {
  const open = new RegExp(`<section\\b[^>]*\\bid="${id}"[^>]*>`, "i").exec(html);
  if (!open) throw new Error(`section #${id} not found`);
  const tag = /<\/?section\b[^>]*>/gi;
  tag.lastIndex = open.index;
  let depth = 0;
  for (let match; (match = tag.exec(html));) {
    depth += /^<section\b/i.test(match[0]) ? 1 : -1;
    if (depth === 0) return html.slice(0, open.index) + html.slice(tag.lastIndex);
  }
  throw new Error(`section #${id} is not balanced`);
}

function numberChapters(html) {
  let chapter = 0;
  return html.replace(/data-chapter="\d+"/g, () => `data-chapter="${chapter++}"`);
}

function landing(c, consultation = false) {
  let html = read(c.source);
  const sourceDepth = c.source.split("/").length - 1;
  html = assetDepth(html, sourceDepth);
  const slug = consultation ? `${c.key}-consultation` : c.key;
  html = meta(html, {
    slug,
    title: consultation ? c.consultTitle : c.title,
    description: consultation ? c.consultDescription : c.description,
  });
  html = html.replace(/href="https:\/\/www\.flexbook\.me\/masonpark\/1"[^>]*>/g, `href="#consultation">`);
  html = html.replace(/>Book an appointment</g, `>${c.button}<`)
             .replace(/>Book a first visit</g, `>${c.button}<`);
  if (consultation) {
    html = html.replace(/<h1 class="ar-title" data-split>[\s\S]*?<\/h1>/, `<h1 class="ar-title" data-split>${c.heading}</h1>`)
      .replace(/<p class="ar-lede" data-anim="hide">[\s\S]*?<\/p>/, `<p class="ar-lede" data-anim="hide">${c.lead}</p>`);
  }
  const invitation = html.match(/<section class="ch ch-invitation"[^>]*data-chapter="(\d+)"/);
  if (!invitation) throw new Error(`${c.source}: invitation not found`);
  const formChapter = Number(invitation[1]);
  html = html.replace(
    /<section class="ch ch-invitation"([^>]*?)data-chapter="\d+"/,
    `<section class="ch ch-invitation"$1data-chapter="${formChapter + 1}"`,
  );
  html = html.replace(/<section class="ch ch-invitation"/, `${formSection(c, formChapter)}\n\n<section class="ch ch-invitation"`);
  // Paid traffic needs the full argument, not the editorial page's repetition.
  // The source pages remain untouched; only these campaign derivatives fold the
  // overlapping beats into an eight-chapter conversion arc.
  if (c.key === "invisalign") {
    for (const id of ["qualify", "why", "compare"]) html = removeSectionById(html, id);
  } else {
    html = removeSectionById(html, "see");
  }
  html = numberChapters(html);
  html = html.replace(/<a class="callbar_component"[^>]*>[\s\S]*?<\/a>/, `${rail(c)}\n<a class="callbar_component" href="tel:+12817698878">Call (281) 769-8878</a>`);
  return html;
}

function thankYou(c) {
  const slug = c.key === "invisalign" ? "invisalign-thank-you" : "new-patient-thank-you";
  let html = meta(read("thank-you/index.html"), {
    slug,
    title: c.thanksTitle,
    description: c.thanksDescription,
  });
  html = html
    .replace(/Thank you\. <em>We have it\.<\/em>/, c.thanksHero)
    .replace(/The front desk will call during office hours to confirm a time\. In pain today\? Do not wait for the call\./, c.thanksLead)
    .replace(/<span class="breadcrumb_item">Thank You<\/span>/, `<span class="breadcrumb_item">${c.key === "invisalign" ? "Invisalign" : "New Patient"} Thank You</span>`)
    .replace(/<a class="button is-ghost-light is-lg" href="\/">Back to the homepage<\/a>/, `<a class="button is-ghost-light is-lg" href="${c.meanwhileHref}">${c.meanwhileText}</a>`)
    .replace(/<a class="callbar_component"[^>]*>[\s\S]*?<\/a>/, `${rail(c, true)}\n<a class="callbar_component" href="tel:+12817698878">Call (281) 769-8878</a>`);
  return html;
}

for (const c of campaigns) {
  write(c.key, landing(c));
  write(`${c.key}-consultation`, landing(c, true));
  write(c.key === "invisalign" ? "invisalign-thank-you" : "new-patient-thank-you", thankYou(c));
}
