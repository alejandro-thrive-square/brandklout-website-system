#!/usr/bin/env node
// build-thankyou.mjs — the generic thank-you page builder, for both funnels:
//
//   node build-thankyou.mjs cosmetic-thank-you cosmetic-thank-you-v2 cosmetic
//
// THESE TWO PAGES CARRY THE HEAVIEST CROSS-CLIENT LEAKAGE OF THE SIX: the entire contact card
// belongs to another practice (Livewell Dental, Fairfax Station VA) — phone, address, maps
// link and opening hours — the "Experience" card credits their doctor, and the COSMETIC page's
// whole FAQ is implant copy including implant pricing. So this builder substitutes rather than
// copies; every substitution is declared in SUBSTITUTIONS, echoed on completion, and sourced
// from Grand Mission's own material (the landing pages' reference trees and the practice's
// site), never invented.
import { buildSections, div, section, par, txt, img, dom, linkUrl, linkPhone, el,
  tree, byClass, all, headings, assetByName, PHONE, PHONE_TEXT } from "./lib.mjs";

const REF = process.argv[2] || "cosmetic-thank-you";
const SLUG = process.argv[3] || "cosmetic-thank-you-v2";
const FUNNEL = process.argv[4] || "cosmetic";
const COSMETIC = FUNNEL !== "implant";
const BOOK_ONLINE = "https://www.flexbook.me/gmdent/1";
const REFERRING = "/refer-a-patient";
const MAPS = "https://maps.app.goo.gl/EeX5CMrv2yQfDC8i6";
const LP = COSMETIC ? "cosmetic" : "dental-implants";

const T = tree(REF);
const H = headings(REF);
const sec = (i) => T.sections[i];
const first = (n, cls) => byClass(n, cls)[0];
const imgsOf = (n) => all(n, (x) => x.tag === "img");

// ---------------------------------------------------------------------------------
// Every correction, with where its replacement comes from.
// ---------------------------------------------------------------------------------
const SUBSTITUTIONS = {
  // reference: "Call (703) 844-2975" (Livewell's number, on two buttons and a fact link)
  callLabel: `Call ${PHONE_TEXT}`,
  phoneText: PHONE_TEXT,
  // reference: "320+ five star reviews" (Livewell's count); the LPs state 1,800+
  proof: "1,800+ five star reviews",
  // reference: "You may be a candidate for implants" on both funnels
  badge: COSMETIC ? "You may be a candidate for a smile makeover" : "You may be a candidate for implants",
  // reference: "Why Grand Mission Dental?" — the practice is Grand Mission Dentistry
  whyHeading: "Why Grand Mission Dentistry?",
  // reference: "Dr. Chris, a Kois Center graduate and Fellow of the International Congress of
  // Oral Implantology…" — replaced with Dr. Sung's own credentials, as stated on the LPs
  experience: "Dr. William Sung, DMD, a Tufts University graduate and Fellow of the Academy of "
    + "General Dentistry, plans and places every case himself from start to finish.",
  // reference: "…at our Fairfax Station practice"
  practice: "our Richmond practice",
  // reference contact card — all three facts are another practice's
  addressLine1: "8620 Grand Mission Blvd Ste E",
  addressLine2: "Richmond, TX 77407",
  hours: ["Mon: 9am to 7pm", "Tue & Wed: 10am to 8pm", "Thu & Fri: 8am to 6pm", "Sat: 8am to 3pm"],
};
/** Apply the string-level corrections to any copy taken from the reference. */
const fix = (t) => (typeof t !== "string" ? t : t
  .replace(/\(703\)\s*844-2975/g, PHONE_TEXT)
  .replace(/320\+/g, "1,800+")
  .replace(/our Fairfax Station practice/gi, SUBSTITUTIONS.practice)
  .replace(/Grand Mission Dental\b(?! Group)/g, "Grand Mission Dentistry")
  .replace(/\bDr\. Chris\b/g, "Dr. William Sung"));

const heading = (i, cls, level = 2) => {
  const h = H[i];
  const head = fix(h?.head ?? ""), accent = fix(h?.accent ?? "");
  const kids = accent
    ? (h.accentFirst
      ? [dom("span", "consult_h2_accent", { set_text: { text: accent + " " } }),
         dom("span", null, { set_text: { text: head } })]
      : [dom("span", null, { set_text: { text: head + " " } }),
         dom("span", "consult_h2_accent", { set_text: { text: accent } })])
    : [dom("span", null, { set_text: { text: head } })];
  return el("Heading", cls, { set_heading_level: { heading_level: level } }, ...kids);
};

// ------------------------------------------------------------------ header / footer (LP)
const LOGO = imgsOf(sec(0))[0].asset;
const header = section("section_lp_header",
  div("lp_header_bar",
    div("lp_header_inner",
      el("LinkBlock", null, { set_link: { link_type: "url", link: "/" } },
        img("lp_header_logo", LOGO, "Grand Mission Dentistry")),
      div("lp_header_actions",
        linkPhone("lp_header_link", img("lp_header_icon", assetByName("gmc-icon-phone-white.svg"), ""), txt(null, PHONE_TEXT)),
        linkUrl("lp_header_link", REFERRING, txt(null, "Referring Doctors")),
        linkUrl("lp_header_cta", BOOK_ONLINE, txt(null, "Book Online"),
          img("lp_header_cta_icon", assetByName("gmc-icon-chevron-navy.svg"), ""))))));

const FT = sec(6);
const footer = section("section_lp_footer",
  div("lp_footer_inner",
    div("lp_footer_row",
      el("Paragraph", "lp_footer_legal", {},
        dom("span", null, { set_text: { text: "Grand Mission Dentistry, Dr. William Sung DMD " } }),
        linkUrl("lp_footer_link", MAPS,
          dom("strong", null, { set_text: { text: `${SUBSTITUTIONS.addressLine1}, ${SUBSTITUTIONS.addressLine2}` } })),
        dom("span", null, { set_text: { text: "." } })),
      div(null,
        dom("span", "lp_footer_line", {},
          linkUrl("lp_footer_link", "/privacy-policy", txt(null, "Privacy Policy")),
          dom("span", null, { set_text: { text: " · " } }),
          linkUrl("lp_footer_link", "/terms-of-service", txt(null, "Terms of Service"))),
        dom("span", "lp_footer_line", { set_text: { text: "© 2026 Grand Mission Dentistry of Richmond" } }))),
    par("lp_footer_disc", fix(first(FT, "ty-foot__disc").text))));

// ------------------------------------------------------------------ hero
const HE = sec(1);
const hero = section("section_confirm_hero",
  div("confirm_hero_glow"),
  div("confirm_hero_inner",
    img("consult_aside_img", first(HE, "qz-hero__aside-img").asset,
      "Dr. William Sung, DMD at Grand Mission Dentistry in Richmond, TX"),
    dom("span", "confirm_badge", {},
      dom("span", "confirm_badge_dot", {}),
      txt(null, SUBSTITUTIONS.badge)),
    heading(0, "confirm_h1", 1),
    par("confirm_lede", fix(first(HE, "ty-hero__lede").text)),
    div("confirm_cta_col",
      linkPhone("confirm_call_btn", txt(null, SUBSTITUTIONS.callLabel)),
      el("Paragraph", "confirm_proof", {},
        dom("span", "confirm_stars", { set_text: { text: "★★★★★" } }),
        dom("span", null, { set_text: { text: SUBSTITUTIONS.proof } })),
      par("confirm_micro", fix(first(HE, "ty-hero__micro").text)))));

// ------------------------------------------------------------------ what happens next
const EX = sec(2);
const expect = section("section_confirm_expect",
  div("lp_container",
    div("confirm_head",
      dom("span", ["lp_eyebrow", "is-centered"], { set_text: { text: first(EX, "imp-section-label").text } }),
      heading(1, "confirm_h2"),
      par("confirm_head_lede", fix(first(EX, "ty-expect__lede").text))),
    div("confirm_expect_grid",
      div(null,
        par("confirm_label", fix(first(EX, "ty-expect__label").text)),
        div("confirm_steps", ...byClass(EX, "ty-step").map((st, i) =>
          div("confirm_step",
            dom("span", "confirm_step_num", { set_text: { text: String(i + 1) } }),
            el("Heading", "confirm_step_h3", { set_heading_level: { heading_level: 3 }, set_text: { text: fix(first(st, "ty-step__h3").text) } }),
            par("confirm_step_p", fix(first(st, "ty-step__p").text)))))),
      div(null,
        par("confirm_risks_label", fix(first(EX, "ty-risks__label").text)),
        div("confirm_risks_list", ...byClass(EX, "ty-risk").map((r) =>
          div("confirm_risk",
            dom("span", "confirm_risk_mark", { set_text: { text: "✓" } }),
            par("confirm_risk_p", fix(first(r, "ty-risk__p").text))))))),
    div("confirm_reassure",
      el("Paragraph", "confirm_risk_p", {},
        dom("span", "confirm_reassure_strong", { set_text: { text: "No cost, no obligation." } }),
        dom("span", null, { set_text: { text: " We walk you through everything on the call. There is no pressure to decide." } })))));

// ------------------------------------------------------------------ why
const WHY = sec(3);
const why = section("section_confirm_why",
  div("lp_container",
    div("confirm_head",
      dom("span", ["lp_eyebrow", "is-centered"], { set_text: { text: first(WHY, "imp-section-label").text } }),
      el("Heading", "confirm_h2", { set_heading_level: { heading_level: 2 }, set_text: { text: SUBSTITUTIONS.whyHeading } })),
    div("confirm_why_grid", ...byClass(WHY, "ty-why__card").map((c, i) =>
      div("confirm_why_card",
        dom("span", "confirm_why_icon", { set_text: { text: first(c, "ty-why__icon").text } }),
        el("Heading", "confirm_why_h3", { set_heading_level: { heading_level: 3 }, set_text: { text: fix(first(c, "ty-why__h3").text) } }),
        par("confirm_why_p", i === 0 ? SUBSTITUTIONS.experience : fix(first(c, "ty-why__p").text)))))));

// ------------------------------------------------------------------ faq
// The cosmetic thank-you page's reference FAQ is implant copy, pricing included. Take the
// funnel's own questions from its landing page instead — never invented, and never the wrong
// treatment's.
const FQ = sec(4);
const lpFaq = byClass(tree(LP).sections[9], "accordion-item").map((item) => ({
  q: byClass(item, "imp-header3")[0].text,
  a: byClass(item, "imp-paragraph")[0].text,
}));
const refFaq = byClass(FQ, "ty-faq__item").map((item) => ({
  q: first(item, "ty-faq__trigger").text,
  a: fix(first(item, "ty-faq__a").text),
}));
const faqItems = COSMETIC ? lpFaq : refFaq;
const faq = section("section_confirm_faq",
  div("lp_container",
    div("confirm_head",
      dom("span", ["lp_eyebrow", "is-centered"], { set_text: { text: first(FQ, "imp-section-label").text } }),
      heading(3, "confirm_h2")),
    div("confirm_faq_list", ...faqItems.map((f, i) =>
      dom("details", "confirm_faq_item", i === 0 ? { set_attributes: { attributes: [{ name: "open", value: "" }] } } : {},
        dom("summary", "confirm_faq_trigger", {},
          txt(null, f.q),
          dom("span", "confirm_faq_sign", { set_text: { text: "+" } })),
        div("confirm_faq_panel", par("confirm_faq_a", f.a)))))));

// ------------------------------------------------------------------ closing card
const CT = sec(5);
const fact = (label, ...kids) => div(null, par("confirm_fact_label", label), ...kids);
const cta = section("section_confirm_cta",
  div("confirm_cta_card",
    div("confirm_cta_glow"),
    div("confirm_cta_inner",
      heading(4, "confirm_cta_h2"),
      par("confirm_cta_p", fix(first(CT, "ty-cta__p").text)),
      linkPhone("confirm_cta_call", txt(null, SUBSTITUTIONS.callLabel)),
      el("Paragraph", "confirm_cta_proof", {},
        dom("span", "confirm_cta_stars", { set_text: { text: "★★★★★" } }),
        dom("span", null, { set_text: { text: SUBSTITUTIONS.proof } })),
      par("confirm_cta_micro", fix(first(CT, "ty-cta__micro").text)),
      div("confirm_cta_facts",
        fact("Call", el("Paragraph", "confirm_fact_copy", {},
          el("LinkBlock", "confirm_fact_link", { set_link: { link_type: "phone", link: PHONE } },
            txt(null, SUBSTITUTIONS.phoneText)))),
        fact("Visit", el("Paragraph", "confirm_cta_p", {},
          linkUrl("confirm_fact_link", MAPS,
            dom("span", null, { set_text: { text: SUBSTITUTIONS.addressLine1 } }),
            dom("span", null, { set_text: { text: SUBSTITUTIONS.addressLine2 } })))),
        fact("Hours", el("Paragraph", "confirm_cta_p", {},
          ...SUBSTITUTIONS.hours.map((h) => dom("span", null, { set_text: { text: h } }))))))));

const done = buildSections(SLUG, [
  { label: "shell", tree: div("page-wrapper") },
  { label: "header", parentLabel: "shell", tree: header },
  { label: "main", parentLabel: "shell", tree: div("main-wrapper") },
  { label: "hero", parentLabel: "main", tree: hero },
  { label: "expect", parentLabel: "main", tree: expect },
  { label: "why", parentLabel: "main", tree: why },
  { label: "faq", parentLabel: "main", tree: faq },
  { label: "cta", parentLabel: "main", tree: cta },
  { label: "footer", parentLabel: "shell", tree: footer },
], `${SLUG}.json`);

console.log(JSON.stringify(done, null, 1));
console.log(`FAQ source: ${COSMETIC ? "cosmetic landing page (reference FAQ is implant copy)" : "reference"} — ${faqItems.length} items`);
console.log("substitutions:", JSON.stringify(SUBSTITUTIONS, null, 1));
