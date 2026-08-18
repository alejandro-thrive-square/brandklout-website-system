#!/usr/bin/env node
// build-consult.mjs — the generic consultation-page builder, for both funnels:
//
//   node build-consult.mjs cosmetic-consultation cosmetic-consultation-v2 cosmetic
//
// The third argument is the FUNNEL ("cosmetic" | "implant"), because this page carries most of
// the cross-client leakage the capture found and several strings have to be chosen per funnel
// rather than copied. Every substitution is listed in SUBSTITUTIONS below and logged.
//
// Reuses the landing pages' header, footer, video row, button and form classes; only the
// hero, the form card, the stories intro and the closing proof band use consult_ classes.
import { buildSections, div, section, par, txt, img, dom, linkUrl, linkPhone, el, video,
  tree, byClass, all, headings, assetByName, PHONE_TEXT } from "./lib.mjs";

const REF = process.argv[2] || "cosmetic-consultation";
const SLUG = process.argv[3] || "cosmetic-consultation-v2";
const FUNNEL = process.argv[4] || "cosmetic";
const THANKYOU = `/ads-landing-pages/${FUNNEL === "implant" ? "dental-implants" : "cosmetic"}-thank-you-v2`;
const BOOK_ONLINE = "https://www.flexbook.me/gmdent/1";
const REFERRING = "/refer-a-patient";
const MAPS = "https://maps.app.goo.gl/EeX5CMrv2yQfDC8i6";

const T = tree(REF);
const H = headings(REF);
const sec = (i) => T.sections[i];
const first = (n, cls) => byClass(n, cls)[0];
const imgsOf = (n) => all(n, (x) => x.tag === "img");

// --------------------------------------------------------------------------------
// The reference is a Livewell Dental page incompletely adapted. These are the strings that
// must NOT be reproduced; each is logged in the build report.
//   reference                                          -> v2
//   "Start Your Implant Consultation" (on cosmetic)     -> the funnel's own treatment
//   alt "Dr. Chris Kim, Livewell Dental"                -> the doctor the asset shows
//   "…a real Livewell Dental patient."                  -> Grand Mission Dentistry
//   "why others chose livewell dental"                  -> why others chose Grand Mission
//   watermark "implants · comfort · craft"              -> the funnel's own words
// --------------------------------------------------------------------------------
const COSMETIC = FUNNEL !== "implant";
const SUBSTITUTIONS = {
  cardTitle: COSMETIC ? "Start Your Cosmetic Consultation" : "Start Your Implant Consultation",
  asideAlt: "Dr. William Sung, DMD at Grand Mission Dentistry in Richmond, TX",
  storiesFoot: "Individual results vary. Every case shown is a real Grand Mission Dentistry patient.",
  proofEyebrow: "why others chose Grand Mission Dentistry",
  watermark: COSMETIC
    ? "veneers · comfort · craft · veneers · comfort · craft · "
    : "implants · comfort · craft · implants · comfort · craft · ",
};

const heading = (i, cls, level = 2) => {
  const h = H[i];
  const kids = h?.accent
    ? (h.accentFirst
      ? [dom("span", "consult_h2_accent", { set_text: { text: h.accent + " " } }),
         dom("span", null, { set_text: { text: h.head } })]
      : [dom("span", null, { set_text: { text: h.head + " " } }),
         dom("span", "consult_h2_accent", { set_text: { text: h.accent } })])
    : [dom("span", null, { set_text: { text: h?.head ?? "" } })];
  return el("Heading", cls, { set_heading_level: { heading_level: level } }, ...kids);
};

// ------------------------------------------------------------------ header (LP classes)
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

// ------------------------------------------------------------------ hero
// The reference's card holds a LeadConnector iframe (custom code, and a form that would send
// leads to a different practice). v2 puts a native Webflow form there instead.
const HE = sec(1);
const aside = first(HE, "qz-hero__aside-img");
const hero = section("section_consult_hero",
  div("lp_container",
    div("consult_hero_grid",
      div("consult_hero_content",
        dom("span", "consult_eyebrow", { set_text: { text: first(HE, "landing-section-label").text } }),
        div("consult_rating",
          dom("span", "lp_rating_stars", { set_text: { text: "★★★★★" } }),
          txt(null, first(HE, "landing-rating-badge").text)),
        heading(0, "consult_h1", 1),
        par("consult_lead", first(HE, "landing-p1").text),
        div("consult_chips", ...byClass(HE, "landing-hero-chip").map((c) =>
          dom("span", "consult_chip", {},
            dom("span", "consult_chip_dot", {}),
            txt(null, c.text)))),
        div("consult_aside",
          img("consult_aside_img", aside.asset, SUBSTITUTIONS.asideAlt),
          par("consult_aside_text", first(HE, "landing-p3").text))),
      div("consult_card",
        div("consult_card_head",
          par("consult_card_title", SUBSTITUTIONS.cardTitle),
          div("consult_meter", div("consult_meter_fill"))),
        el("Form", "lp_form_stack")))));

// ------------------------------------------------------------------ stories
const ST = sec(2);
const videoCard = () =>
  div("lp_video_card", video(null),
    div("lp_video_title",
      dom("span", "lp_rating_stars", { set_text: { text: "★★★★★" } }),
      txt(null, "Patient story in their own words")));
const stVideos = all(ST, (n) => n.tag === "iframe");
const stories = section("section_consult_stories",
  div("lp_container",
    div("consult_stories_intro",
      dom("span", "consult_eyebrow", { set_text: { text: first(ST, "landing-section-label").text } }),
      heading(1, "consult_h2"),
      par("consult_stories_lead", first(ST, "landing-p2").text)),
    div("lp_video_row", videoCard()),
    div("lp_video_row", ...stVideos.slice(1, 4).map(() => videoCard())),
    div("lp_center_row", linkUrl("lp_button", THANKYOU, txt(null, "Book a Consultation"))),
    par("consult_stories_foot", SUBSTITUTIONS.storiesFoot)));

// ------------------------------------------------------------------ proof
const PF = sec(3);
const proof = section("section_consult_proof",
  dom("div", "consult_proof_watermark", { set_text: { text: SUBSTITUTIONS.watermark } }),
  div("consult_proof_inner",
    dom("span", ["consult_eyebrow", "is-centered"], { set_text: { text: SUBSTITUTIONS.proofEyebrow } }),
    heading(2, "consult_proof_h2"),
    div("consult_rating",
      dom("span", "consult_badge_stars", { set_text: { text: "★★★★★" } }),
      dom("span", "consult_badge_text", { set_text: { text: first(PF, "qz-proof__badge-txt").text } }))));

// ------------------------------------------------------------------ footer (LP classes)
const FT = sec(4);
const footer = section("section_lp_footer",
  div("lp_footer_inner",
    div("lp_footer_row",
      el("Paragraph", "lp_footer_legal", {},
        dom("span", null, { set_text: { text: "Grand Mission Dentistry, Dr. William Sung DMD " } }),
        linkUrl("lp_footer_link", MAPS,
          dom("strong", null, { set_text: { text: "8620 Grand Mission Blvd Ste E, Richmond, TX 77407" } })),
        dom("span", null, { set_text: { text: "." } })),
      div(null,
        dom("span", "lp_footer_line", {},
          linkUrl("lp_footer_link", "/privacy-policy", txt(null, "Privacy Policy")),
          dom("span", null, { set_text: { text: " · " } }),
          linkUrl("lp_footer_link", "/terms-of-service", txt(null, "Terms of Service"))),
        dom("span", "lp_footer_line", { set_text: { text: "© 2026 Grand Mission Dentistry of Richmond" } }))),
    par("lp_footer_disc", first(FT, "ty-foot__disc").text)));

const done = buildSections(SLUG, [
  { label: "shell", tree: div("page-wrapper") },
  { label: "header", parentLabel: "shell", tree: header },
  { label: "main", parentLabel: "shell", tree: div("main-wrapper") },
  { label: "hero", parentLabel: "main", tree: hero },
  { label: "stories", parentLabel: "main", tree: stories },
  { label: "proof", parentLabel: "main", tree: proof },
  { label: "footer", parentLabel: "shell", tree: footer },
], `${SLUG}.json`);

console.log(JSON.stringify(done, null, 1));
console.log("substitutions:", JSON.stringify(SUBSTITUTIONS, null, 1));
