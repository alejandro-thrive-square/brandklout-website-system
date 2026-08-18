// gen-styles.mjs — turn the measured reference styles into a client-first class system.
//
// Hand-transcribing ~70 classes x 7 breakpoints is where parity dies, so the VALUES come
// straight out of `08-qa/.tmp/v2-reference/<slug>/styles.json` (computed styles of the live
// page at 1920/1440/1280/1100/991/767/478). What is hand-authored here is only the NAME MAP:
// which client-first class replaces which legacy chain, and which properties that class owns.
//
// Webflow breakpoints vs the measured widths:
//   1920 -> xxl · 1440 -> xl · 1280 -> large · 1100 -> MAIN (base, covers 992-1279)
//   991 -> medium · 767 -> small · 478 -> tiny
// A breakpoint override is emitted only where the value differs from the base.
//
// Usage: node gen-styles.mjs [refSlug=cosmetic] -> styles-def.generated.json
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REF = path.join(HERE, "..", "..", "..", "08-qa", ".tmp", "v2-reference");
const SLUG = process.argv[2] || "cosmetic";
// Each page family is generated from its own reference into its own file, so regenerating
// one family cannot clobber another's definitions.
const FAMILY = process.env.FAMILY || "lp";
const OUTFILE = process.env.OUT || "styles-def.generated.json";

const BP = { 1920: "xxl", 1440: "xl", 1280: "large", 1100: "main", 991: "medium", 767: "small", 478: "tiny" };
// 1920 is measured but NOT emitted — see NON_MONOTONIC note in the header comment.
const ORDER = [1100, 1280, 1440, 991, 767, 478];

// Site variables the generated classes bind to instead of hardcoding hex.
export { V } from "./tokens.mjs";
import { V } from "./tokens.mjs";
// rgb() as measured -> the variable that carries it, so generated colours bind to tokens.
const COLOR_VAR = {
  "rgb(255, 255, 255)": V.white,
  "rgb(0, 34, 65)": V.navy,
  "rgb(4, 102, 156)": V.blue,
  "rgb(171, 214, 255)": V.sky,
  "rgb(11, 44, 65)": V.lpNavy,
  "rgb(211, 170, 90)": V.lpGold,
  "rgb(246, 243, 238)": V.lpCream,
  "rgb(216, 224, 228)": V.lpLine,
  "rgb(231, 236, 241)": V.lpLineSoft,
  "rgb(55, 107, 123)": V.lpSlate,
  "rgb(252, 252, 252)": V.light,
  "rgb(238, 238, 238)": V.n1,
  "rgb(102, 102, 102)": V.n4,
  "rgb(68, 68, 68)": V.n5,
  "rgb(34, 34, 34)": V.n6,
};

// Property sets, by the ROLE a class plays.
const P = {
  section: ["padding-top", "padding-bottom", "background-color", "color"],
  container: ["display", "flex-direction", "align-items", "gap", "width", "max-width",
    "padding-left", "padding-right", "margin-top", "margin-bottom"],
  grid: ["display", "grid-template-columns", "gap", "align-items", "justify-content", "max-width",
    "margin-top", "margin-bottom"],
  flex: ["display", "flex-direction", "flex-wrap", "align-items", "justify-content", "gap",
    "margin-top", "margin-bottom"],
  text: ["font-size", "font-weight", "line-height", "letter-spacing", "text-transform",
    "text-align", "color", "max-width", "margin-bottom", "margin-top", "display"],
  // display alone is not enough: a box that happens to be flex loses its direction and
  // silently becomes a ROW. Four sections rendered side-by-side because of it.
  box: ["display", "flex-direction", "flex-wrap", "align-items", "justify-content", "gap",
    "padding-top", "padding-right", "padding-bottom", "padding-left",
    "background-color", "color", "border-radius", "border-top-width", "border-top-color",
    "border-left-width", "border-left-color", "box-shadow", "margin-bottom", "margin-top",
    "max-width", "min-height", "text-align", "overflow"],
  media: ["width", "height", "aspect-ratio", "object-fit", "border-radius", "overflow",
    "margin-bottom", "max-width", "display"],
};

// ---------------------------------------------------------------------------
// THE NAME MAP. `from` is the legacy class chain measured on the reference page;
// `n` is the client-first class v2 builds with; `role` picks the property set.
// `parents` makes it a combo (Client-First `is-*` modifier) instead of a global.
// `add` / `drop` adjust the copied property set. Order here is the order created.
// ---------------------------------------------------------------------------
export const MAP = [
  // ---- page-level type + section shells -------------------------------------
  { n: "section_lp_hero", from: "section.imp-hero", role: "section" },
  { n: "section_lp_journey", from: "section.imp-journey", role: "section" },
  { n: "section_lp_difference", from: "section.imp-story", role: "section" },
  { n: "section_lp_specialist", from: "section.imp-specialist", role: "section" },
  { n: "section_lp_options", from: "section.imp-options", role: "section" },
  { n: "section_lp_gallery", from: "section.imp-gallery", role: "section" },
  { n: "section_lp_space", from: "section.imp-space-2", role: "section" },
  { n: "section_lp_faq", from: "section.imp-faq", role: "section" },
  { n: "section_lp_closing", from: "section.imp-final", role: "section" },
  { n: "section_lp_footer", from: "footer.ty-foot", role: "section" },

  // ---- container -------------------------------------------------------------
  { n: "lp_container", from: "div.imp-div.imp-wrap", role: "container",
    add: { "margin-left": "auto", "margin-right": "auto" } },

  // ---- shared type -----------------------------------------------------------
  { n: "lp_eyebrow", from: "span.imp-section-label", role: "text", drop: ["max-width"] },
  { n: "is-centered", parents: ["lp_eyebrow"], from: "span.imp-section-label.center", role: "text",
    only: ["text-align"] },
  { n: "lp_heading", from: "h2.imp-h2", role: "text", drop: ["max-width"] },
  { n: "is-centered", parents: ["lp_heading"], from: "h2.imp-h2.center", role: "text", only: ["text-align"] },
  { n: "lp_heading_accent", from: "span.imp-h2", role: "text", drop: ["max-width", "margin-bottom"] },
  { n: "lp_lead", from: "p.imp-paragraph", role: "text" },
  { n: "is-centered", parents: ["lp_lead"], from: "p.imp-paragraph.center", role: "text", only: ["text-align"] },

  // ---- hero ------------------------------------------------------------------
  { n: "lp_hero_grid", from: "div.imp-div.imp-wrap.imp-hero-grid", role: "grid" },
  { n: "lp_hero_content", from: "div.imp-hero-copy", role: "box" },
  { n: "lp_hero_h1", from: "h1.imp-header-1", role: "text", drop: ["max-width"] },
  { n: "lp_text_accent", from: "span.imp-header-1.accent", role: "text", drop: ["max-width", "margin-bottom"] },
  { n: "lp_hero_lead", from: "p.imp-paragraph-hero", role: "text" },
  { n: "lp_rating_badge", from: "span.imp-rating-badge", role: "box" },
  { n: "lp_rating_stars", from: "span.imp-stars", role: "text" },
  { n: "lp_tick_list", from: "ul.imp-p-7", role: "flex", add: { "list-style-type": "none", "padding-left": "0px" } },
  { n: "lp_tick_item", from: "li.imp-li", role: "text", drop: ["max-width"] },
  { n: "lp_tick_icon", from: "span.imp-check", role: "text" },
  { n: "lp_button_row", from: "div.imp-hero-ctas", role: "flex" },
  { n: "lp_button", from: "a.vnr-a.lw-btn.lw-btn--gold", role: "box",
    add: { "text-decoration": "none", display: "inline-flex", "align-items": "center", "justify-content": "center" } },
  { n: "is-ghost", parents: ["lp_button"], from: "a.imp-a-2.imp-btn.imp-btn-ghost", role: "box",
    only: ["background-color", "color", "border-top-width", "border-top-color", "border-left-width", "border-left-color"] },
  { n: "lp_hero_media", from: "div.imp-hero-media", role: "box" },
  { n: "lp_form_card", from: "div.imp-form-card.w-node-_7e0d08e5-c048-8280-ce3e-6fd1bffd0086-5f17d119", role: "box" },
  { n: "lp_form_card_title", from: "p.imp-hero-form", role: "text" },
  { n: "lp_form_card_note", from: "p.imp-p", role: "text" },
  { n: "lp_media_caption", from: "span.imp-media-caption", role: "text" },

  // ---- journey ---------------------------------------------------------------
  { n: "lp_journey_intro", from: "div.imp-journey-intro", role: "box" },
  { n: "lp_compare_wrap", from: "div.imp-ba-wrap", role: "box" },
  { n: "lp_compare", from: "div.csm-ba", role: "box" },
  { n: "lp_compare_stage", from: "div.csm-ba__stage.ratio", role: "media" },
  { n: "lp_compare_img", from: "img.csm-img-2.csm-ba__img.csm-ba__img--before", role: "media",
    add: { position: "absolute", top: "0px", left: "0px", width: "100%", height: "100%" } },
  { n: "is-after", parents: ["lp_compare_img"], from: "img.csm-img-2.csm-ba__img.csm-ba__img--after", role: "media",
    only: [], add: { "clip-path": "inset(0 0 0 50%)" } },
  { n: "lp_compare_tag", from: "span.csm-div.csm-ba__tag.csm-ba__tag--before", role: "box" },
  { n: "is-after", parents: ["lp_compare_tag"], from: "span.csm-div.csm-ba__tag.csm-ba__tag--after", role: "box",
    only: [], add: { left: "auto", right: "16px" } },
  { n: "lp_compare_divider", from: "div.csm-ba__handle", role: "box" },
  { n: "lp_compare_foot", from: "div.csm-ba__foot", role: "box" },
  { n: "lp_compare_foot_strong", from: "span.csm-ba__foot-strong", role: "text" },
  { n: "lp_compare_hint", from: "p.imp-ba-hint", role: "text" },
  { n: "lp_journey_cols", from: "div.imp-journey-cols", role: "grid" },
  { n: "lp_jcol", from: "div.imp-a-2.imp-jcol.imp-jcol-after", role: "box" },
  { n: "is-dark", parents: ["lp_jcol"], from: "div.imp-a-2.imp-jcol.imp-jcol-before.dark", role: "box",
    only: ["background-color", "color", "border-top-color", "border-left-color"] },
  { n: "lp_jlist", from: "ul.imp-ul", role: "flex", add: { "list-style-type": "none", "padding-left": "0px" } },
  { n: "lp_jitem", from: "li.imp-li-2", role: "text", drop: ["max-width"] },
  { n: "lp_jmark", from: "span.imp-span-4.imp-mark", role: "text" },
  { n: "is-positive", parents: ["lp_jmark"], from: "span.imp-span-5.imp-mark", role: "text", only: ["color"] },
  { n: "lp_chapters", from: "div.imp-chapters", role: "grid" },
  { n: "lp_chapter", from: "div.imp-chapter", role: "box" },
  { n: "lp_chapter_img", from: "img.imp-img-2", role: "media" },
  { n: "lp_chapter_body", from: "div.imp-cbody", role: "box" },
  { n: "lp_chapter_num", from: "span.imp-cnum", role: "text" },
  { n: "lp_chapter_h", from: "h3.imp-h3-5", role: "text", drop: ["max-width"] },
  { n: "lp_chapter_p", from: "p.imp-p-4", role: "text" },
  { n: "lp_center_row", from: "div.imp-journey-cta", role: "flex", add: { "text-align": "center" } },

  // ---- difference -------------------------------------------------------------
  { n: "lp_grid_4", from: "div.imp-grid-4", role: "grid" },
  { n: "lp_card", from: "div.imp-card", role: "box" },
  { n: "lp_card_h", from: "h3.imp-h3-6", role: "text", drop: ["max-width"] },
  { n: "lp_card_p", from: "p.imp-p-5", role: "text" },
  { n: "lp_video_row", from: "div.imp-videos-grid", role: "grid" },
  { n: "lp_video_card", from: "div.imp-vid-outer", role: "box" },
  { n: "lp_video_title", from: "div.imp-vid-title", role: "text" },

  // ---- specialist --------------------------------------------------------------
  { n: "lp_doctor_grid", from: "div.imp-doc-grid", role: "grid" },
  { n: "lp_doctor_col", from: "div.stcky-video-block", role: "box" },
  { n: "lp_doctor_sticky", from: "div.sticky-video", role: "box", add: { position: "sticky", top: "90px" } },
  { n: "lp_doctor_media", from: "div.imp-doc-img", role: "media" },
  { n: "lp_cred_list", from: "ul.imp-creds", role: "flex", add: { "list-style-type": "none", "padding-left": "0px" } },
  { n: "lp_cred_item", from: "li.imp-li-3", role: "text", drop: ["max-width"] },
  { n: "lp_cred_text", from: "span.imp-hero-copy", role: "text" },
  { n: "lp_cred_strong", from: "strong.imp-hero-copy", role: "text" },
  { n: "lp_quote", from: "blockquote.imp-blockquote", role: "box" },
  { n: "lp_photo_strip", from: "div.imp-teach-strip", role: "grid" },
  { n: "lp_photo_strip_img", from: "img.imp-img-5", role: "media" },

  // ---- options -----------------------------------------------------------------
  { n: "lp_grid_3", from: "div.imp-grid-3", role: "grid" },
  // The reference runs the three treatment cards through Swiper. v2 uses a plain grid: same
  // layout at every width the reference actually shows, and no custom code.
  { n: "lp_options_grid", from: "div.swiper-wrapper-3.is-services", role: "grid",
    add: { display: "grid", "grid-template-columns": "repeat(3, 1fr)" },
    bpAdd: { medium: { "grid-template-columns": "repeat(2, 1fr)" }, small: { "grid-template-columns": "1fr" } } },
  { n: "lp_option_card", from: "div.service_item", role: "box",
    add: { display: "flex", "flex-direction": "column", gap: "16px" } },
  { n: "lp_option_img", from: "img.service_item-img", role: "media" },
  { n: "lp_option_body", from: "div.service_item-content-wrap", role: "flex" },
  { n: "lp_option_head", from: "div.service_item-content", role: "flex" },
  { n: "lp_option_h", from: "h3.services_card-heading", role: "text", drop: ["max-width"] },
  { n: "lp_option_desc", from: "div.imp-serv-desc", role: "text" },
  { n: "lp_option_specs", from: "div.service_item-details", role: "flex" },
  { n: "lp_spec_row", from: "div.service_item-detail", role: "flex" },
  { n: "lp_spec_label", from: "div.imp-feature", role: "text", drop: ["max-width"] },
  { n: "lp_spec_value", from: "div.service_item-details-value", role: "text", drop: ["max-width"] },
  { n: "lp_spec_divider", from: "div.divider-2", role: "box" },
  { n: "lp_option_note", from: "div.service_item-details-desc", role: "text" },

  // ---- process -----------------------------------------------------------------
  { n: "lp_step_num", from: "span.imp-stepnum", role: "box" },

  // ---- gallery / space ----------------------------------------------------------
  { n: "lp_gallery_grid", from: "div.imp-gallery-grid", role: "grid" },
  { n: "lp_gallery_img", from: "img.imp-img-3", role: "media" },
  { n: "lp_space_lead", from: "p.imp-hero-copy.imp-sub", role: "text" },
  { n: "lp_office_grid", from: "div.imp-office-grid", role: "grid" },
  { n: "lp_office_img", from: "img.imp-img-6", role: "media" },
  { n: "is-tall", parents: ["lp_office_img"], from: "img.imp-img-7", role: "media",
    only: ["height", "aspect-ratio"] },

  // ---- faq ------------------------------------------------------------------------
  { n: "lp_faq_wrap", from: "div.imp-div.imp-wrap.imp-faq-wrap", role: "container" },
  { n: "lp_faq_question", from: "h4.imp-header3", role: "text", drop: ["max-width"],
    // Webflow's .w-dropdown-toggle sets white-space:nowrap, which clipped every FAQ row off
    // the right of a 390px viewport on the Mason Park build. Override it on the question.
    add: { "white-space": "normal", "min-width": "0px" } },

  // ---- closing + footer --------------------------------------------------------------
  { n: "lp_closing_media", from: "div.div-block-41", role: "box" },
  { n: "lp_closing_lead", from: "p.imp-paragraph.cta", role: "text" },
  { n: "lp_closing_note", from: "p.imp-alt", role: "text" },
  { n: "lp_closing_link", from: "a.imp-a-5", role: "text", add: { "text-decoration": "none" } },
  { n: "lp_footer_inner", from: "div.ty-div.lw-shell.foot", role: "flex" },
  { n: "lp_footer_row", from: "div.ty-foot__row", role: "flex" },
  { n: "lp_footer_legal", from: "p.ty-foot__legal-3", role: "text" },
  { n: "lp_footer_line", from: "span.imp-footer-line", role: "text" },
  { n: "lp_footer_link", from: "a.imp-a-6", role: "text", add: { "text-decoration": "none" } },
  { n: "lp_footer_disc", from: "p.ty-foot__disc", role: "text" },
  // ============================ consult_ family ============================
  // The two consultation pages. They REUSE the header, footer, video row and button classes
  // the landing pages already have; only the hero, the form card, the stories intro and the
  // closing proof band are new.
  { fam: "consult", n: "section_consult_hero", from: "section.section_qz-hero", role: "section" },
  { fam: "consult", n: "consult_hero_grid", from: "div.qz-hero__grid", role: "grid" },
  { fam: "consult", n: "consult_hero_content", from: "div.landing-hero-grid-left", role: "box" },
  { fam: "consult", n: "consult_eyebrow", from: "span.landing-section-label", role: "text", drop: ["max-width"] },
  { fam: "consult", n: "is-centered", parents: ["consult_eyebrow"], from: "span.landing-section-label.center", role: "text", only: ["text-align", "display", "justify-content"] },
  { fam: "consult", n: "consult_rating", from: "span.landing-rating-badge", role: "box" },
  { fam: "consult", n: "consult_h1", from: "h1.landing-hero-h1", role: "text", drop: ["max-width"] },
  { fam: "consult", n: "consult_lead", from: "p.landing-p1", role: "text" },
  { fam: "consult", n: "consult_chips", from: "div.qz-hero__chips", role: "flex" },
  { fam: "consult", n: "consult_chip", from: "span.landing-hero-chip", role: "box" },
  { fam: "consult", n: "consult_chip_dot", from: "span.qz-hero__dot", role: "box" },
  { fam: "consult", n: "consult_aside", from: "div.qz-hero__aside", role: "flex" },
  { fam: "consult", n: "consult_aside_img", from: "img.qz-hero__aside-img", role: "media" },
  { fam: "consult", n: "consult_aside_text", from: "p.landing-p3.white", role: "text" },
  { fam: "consult", n: "consult_card", from: "div.qz-card", role: "box" },
  { fam: "consult", n: "consult_card_head", from: "div.qz-card__head", role: "box" },
  { fam: "consult", n: "consult_card_title", from: "p.landing-hero-form-h2", role: "text", drop: ["max-width"] },
  { fam: "consult", n: "consult_meter", from: "div.qz-card__meter", role: "box" },
  { fam: "consult", n: "consult_meter_fill", from: "div.qz-card__meter-fill", role: "box" },

  { fam: "consult", n: "section_consult_stories", from: "section.qz-div.section_qz-stories.lw-sec", role: "section" },
  { fam: "consult", n: "consult_stories_intro", from: "div.imp-consult-stories", role: "flex" },
  { fam: "consult", n: "consult_h2", from: "h2.landing-h2", role: "text", drop: ["max-width"] },
  { fam: "consult", n: "consult_h2_accent", from: "span.landing-h2.accent", role: "text", drop: ["max-width", "margin-bottom"] },
  { fam: "consult", n: "consult_stories_lead", from: "p.landing-p2.short", role: "text" },
  { fam: "consult", n: "consult_stories_foot", from: "p.qz-stories__foot", role: "text" },

  { fam: "consult", n: "section_consult_proof", from: "section.qz-div.section_qz-proof.lw-sec", role: "section" },
  // a decorative word-rail that runs far wider than the page; every ancestor clips it, so its
  // own width is intended and must not be read as overflow
  { fam: "consult", n: "consult_proof_watermark", from: "div.qz-proof__drift", role: "text", drop: ["max-width"] },
  { fam: "consult", n: "consult_proof_inner", from: "div.qz-proof__in", role: "box" },
  { fam: "consult", n: "consult_proof_h2", from: "h2.qz-proof__h2", role: "text", drop: ["max-width"] },
  { fam: "consult", n: "consult_proof_em", from: "em.qz-em", role: "text", drop: ["max-width"] },
  { fam: "consult", n: "consult_badge_stars", from: "span.qz-proof__badge-stars", role: "text" },
  { fam: "consult", n: "consult_badge_text", from: "span.qz-proof__badge-txt", role: "text" },
  // ============================ confirm_ family ============================
  // The two thank-you pages. They reuse the landing pages' header and footer; everything
  // between is their own. This page carries the heaviest cross-client leakage of the six —
  // the whole contact card is another practice's — so build-thankyou.mjs substitutes rather
  // than copies (see its SUBSTITUTIONS block).
  { fam: "confirm", n: "section_confirm_hero", from: "section.section_ty-hero", role: "section" },
  { fam: "confirm", n: "confirm_hero_glow", from: "div.ty-hero__glow", role: "box" },
  { fam: "confirm", n: "confirm_hero_inner", from: "div.ty-hero__in", role: "box" },
  { fam: "confirm", n: "confirm_badge", from: "span.ty-hero__badge", role: "box" },
  { fam: "confirm", n: "confirm_badge_dot", from: "span.ty-hero__badge-dot", role: "box" },
  { fam: "confirm", n: "confirm_h1", from: "h1.ty-hero__h1", role: "text", drop: ["max-width"] },
  { fam: "confirm", n: "confirm_lede", from: "p.ty-hero__lede", role: "text" },
  { fam: "confirm", n: "confirm_cta_col", from: "div.ty-hero__cta", role: "flex" },
  { fam: "confirm", n: "confirm_call_btn", from: "a.ty-head__logo.lw-btn.lw-btn--gold.ty-hero__call", role: "box", add: {"text-decoration":"none"} },
  { fam: "confirm", n: "confirm_proof", from: "p.ty-hero__proof", role: "flex" },
  { fam: "confirm", n: "confirm_stars", from: "span.ty-hero__stars", role: "text" },
  { fam: "confirm", n: "confirm_micro", from: "p.ty-hero__micro", role: "text" },

  { fam: "confirm", n: "section_confirm_expect", from: "section.ty-div.section_ty-expect.lw-sec", role: "section" },
  { fam: "confirm", n: "confirm_head", from: "div.ty-expect__head", role: "box" },
  { fam: "confirm", n: "confirm_h2", from: "h2.ty-h2", role: "text", drop: ["max-width"] },
  { fam: "confirm", n: "confirm_head_lede", from: "p.ty-expect__lede", role: "text" },
  { fam: "confirm", n: "confirm_expect_grid", from: "div.ty-expect__grid", role: "grid" },
  { fam: "confirm", n: "confirm_label", from: "p.ty-expect__label", role: "text" },
  { fam: "confirm", n: "confirm_steps", from: "div.ty-steps", role: "box" },
  { fam: "confirm", n: "confirm_step", from: "div.ty-div.ty-step", role: "box" },
  { fam: "confirm", n: "confirm_step_num", from: "span.ty-div.ty-step__num", role: "box" },
  { fam: "confirm", n: "confirm_step_h3", from: "h3.ty-step__h3", role: "text", drop: ["max-width"] },
  { fam: "confirm", n: "confirm_step_p", from: "p.ty-step__p", role: "text" },
  { fam: "confirm", n: "confirm_risks_label", from: "p.ty-risks__label", role: "flex" },
  { fam: "confirm", n: "confirm_risks_list", from: "div.ty-risks__list", role: "grid" },
  { fam: "confirm", n: "confirm_risk", from: "div.ty-risk", role: "flex" },
  { fam: "confirm", n: "confirm_risk_mark", from: "span.ty-risk__mark", role: "box" },
  { fam: "confirm", n: "confirm_risk_p", from: "p.ty-risk__p", role: "text" },
  { fam: "confirm", n: "confirm_reassure", from: "div.ty-reassure", role: "box" },
  { fam: "confirm", n: "confirm_reassure_strong", from: "span.ty-reassure__strong", role: "text" },

  { fam: "confirm", n: "section_confirm_why", from: "section.ty-div.section_ty-why.lw-sec", role: "section" },
  { fam: "confirm", n: "confirm_why_grid", from: "div.ty-why__grid", role: "grid" },
  { fam: "confirm", n: "confirm_why_card", from: "div.ty-why__card", role: "box" },
  { fam: "confirm", n: "confirm_why_icon", from: "span.ty-why__icon", role: "box" },
  { fam: "confirm", n: "confirm_why_h3", from: "h3.ty-why__h3", role: "text", drop: ["max-width"] },
  { fam: "confirm", n: "confirm_why_p", from: "p.ty-why__p", role: "text" },

  { fam: "confirm", n: "section_confirm_faq", from: "section.ty-div.section_ty-faq.lw-sec", role: "section" },
  { fam: "confirm", n: "confirm_faq_list", from: "div.ty-faq__list", role: "grid" },
  { fam: "confirm", n: "confirm_faq_item", from: "div.ty-div.ty-faq__item", role: "box" },
  // Webflow's own .w-dropdown-toggle sets white-space:nowrap, and this row is a summary in v2;
  // an unwrappable question clipped off a 390px viewport on the Mason Park build.
  { fam: "confirm", n: "confirm_faq_trigger", from: "div.ty-faq__trigger", role: "flex", add: {"white-space":"normal","list-style-type":"none","cursor":"pointer"} },
  { fam: "confirm", n: "confirm_faq_sign", from: "span.ty-div.ty-faq__sign", role: "box" },
  { fam: "confirm", n: "confirm_faq_panel", from: "div.ty-faq__panel", role: "box" },
  { fam: "confirm", n: "confirm_faq_a", from: "p.ty-faq__a", role: "text" },

  { fam: "confirm", n: "section_confirm_cta", from: "section.section_ty-cta", role: "section" },
  { fam: "confirm", n: "confirm_cta_card", from: "div.ty-cta__card", role: "box" },
  { fam: "confirm", n: "confirm_cta_glow", from: "div.ty-cta__glow", role: "box" },
  { fam: "confirm", n: "confirm_cta_inner", from: "div.ty-cta__in", role: "box" },
  { fam: "confirm", n: "confirm_cta_h2", from: "h2.ty-cta__h2", role: "text", drop: ["max-width"] },
  { fam: "confirm", n: "confirm_cta_p", from: "p.ty-cta__p", role: "text" },
  { fam: "confirm", n: "confirm_cta_call", from: "a.ty-head__logo.lw-btn.ty-cta__call", role: "box", add: {"text-decoration":"none"} },
  { fam: "confirm", n: "confirm_cta_proof", from: "p.ty-cta__proof", role: "flex" },
  { fam: "confirm", n: "confirm_cta_stars", from: "span.ty-cta__stars", role: "text" },
  { fam: "confirm", n: "confirm_cta_micro", from: "p.ty-cta__micro", role: "text" },
  { fam: "confirm", n: "confirm_cta_facts", from: "div.ty-cta__facts", role: "grid" },
  { fam: "confirm", n: "confirm_fact_label", from: "p.ty-cta__fact-label", role: "text" },
  { fam: "confirm", n: "confirm_fact_copy", from: "p.ty-cta__fact-copy", role: "text" },
  { fam: "confirm", n: "confirm_fact_link", from: "a.ty-cta__fact-link", role: "text", add: {"text-decoration":"none"} },
];

// ---------------------------------------------------------------------------------
const styles = JSON.parse(fs.readFileSync(path.join(REF, SLUG, "styles.json"), "utf8"));

/** Measured track lists are pixel widths; a rebuild needs the RATIO. Equal tracks become
 *  repeat(N, 1fr); unequal ones become fr proportions, which is what the original CSS said. */
function tracks(value) {
  const px = value.trim().split(/\s+/).map(parseFloat);
  if (px.some(Number.isNaN)) return value;
  if (px.length === 1) return "1fr";
  const min = Math.min(...px);
  if (px.every((x) => Math.abs(x - min) <= 2)) return `repeat(${px.length}, 1fr)`;
  return px.map((x) => `${(x / min).toFixed(2).replace(/\.?0+$/, "")}fr`).join(" ");
}

/** A measured px value that is really "fill the parent" must not be baked in. */
const isLayoutWidth = (prop, v, rect) =>
  (prop === "width" || prop === "height") && /px$/.test(v) && Math.abs(parseFloat(v) - rect.w) < 2;

function pick(entry, props, width) {
  const b = entry.byWidth[width];
  if (!b) return {};
  const out = {};
  for (const p of props) {
    let v = b.css[p];
    if (v === undefined) continue;
    if (p === "grid-template-columns") v = tracks(v);
    if (p === "width" && isLayoutWidth(p, v, b.rect)) continue;
    if (p === "background-color" && v === "rgba(0, 0, 0, 0)") continue;
    if (p === "overflow" && v === "visible") continue;
    if (p === "display" && v === "block") continue;           // the default for every div/text
    if (p === "text-align" && (v === "start" || v === "left")) continue;
    if (/^margin-(top|bottom)$/.test(p) && parseFloat(v) === 0) continue;
    // measure only sampled the top/left edges; Webflow needs all four, and a width with no
    // style renders nothing.
    if (p === "border-top-width" || p === "border-left-width") {
      for (const side of ["top", "right", "bottom", "left"]) {
        out[`border-${side}-width`] = v;
        out[`border-${side}-style`] = "solid";
      }
      continue;
    }
    if (p === "border-top-color" || p === "border-left-color") {
      const cv = COLOR_VAR[v] ? { v: COLOR_VAR[v] } : v;
      for (const side of ["top", "right", "bottom", "left"]) out[`border-${side}-color`] = cv;
      continue;
    }
    if (COLOR_VAR[v]) { out[p] = { v: COLOR_VAR[v] }; continue; }
    out[p] = v;
  }
  return out;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const missing = [];
const STYLES = [];

/** An image's measured `height` is the USED value of `height: auto` — it follows the width and
 *  differs at every breakpoint. Baking those pixels gives a layout that is right at exactly
 *  seven widths and wrong between them, so a media class carries a RATIO instead: the design's
 *  own aspect-ratio when it declares one, otherwise the ratio of the measured box. */
function asRatio(entry, base) {
  const declared = entry.byWidth[1100]?.css["aspect-ratio"];
  const r = entry.byWidth[1100]?.rect;
  delete base.height;
  delete base.width;
  if (!declared && r && r.w > 0 && r.h > 0) base["aspect-ratio"] = `${(r.w / r.h).toFixed(4)}`;
  base.width = "100%";
  base.height = "auto";
  return base;
}

for (const m of MAP.filter((x) => (x.fam || "lp") === FAMILY)) {
  const entry = styles[m.from];
  if (!entry) { missing.push(`${m.n} <- ${m.from}`); continue; }
  let props = m.only ? m.only : P[m.role];
  if (m.drop) props = props.filter((p) => !m.drop.includes(p));
  let base = pick(entry, props, 1100);
  if (m.role === "media" && !m.only) base = asRatio(entry, base);
  base = { ...base, ...(m.add || {}) };
  const bp = {};
  for (const w of ORDER) {
    if (w === 1100) continue;
    const v = pick(entry, props, w);
    const delta = {};
    for (const [k, val] of Object.entries(v)) {
      if (m.add && k in m.add) continue;          // authored value wins at every breakpoint
      // a media class is ratio-driven; its per-breakpoint used heights/widths are noise
      if (m.role === "media" && !m.only && (k === "height" || k === "width")) continue;
      if (!same(val, base[k])) delta[k] = val;
    }
    if (Object.keys(delta).length) bp[BP[w]] = delta;
  }
  // Authored breakpoint values, for the few places where v2 deliberately departs from the
  // reference — e.g. the options row, which the reference drives with Swiper and v2 rebuilds
  // as a plain grid that has to be told how to collapse.
  for (const [b, props] of Object.entries(m.bpAdd || {})) bp[b] = { ...(bp[b] || {}), ...props };
  STYLES.push({ n: m.n, ...(m.parents ? { parents: m.parents } : {}), p: base, ...(Object.keys(bp).length ? { bp } : {}) });
}

fs.writeFileSync(path.join(HERE, OUTFILE),
  JSON.stringify({ ref: SLUG, generatedFrom: "measured computed styles", V, STYLES }, null, 1));
console.log(`generated ${STYLES.length} ${FAMILY} styles from ${SLUG} -> ${OUTFILE}`);
if (missing.length) console.log(`MISSING source chain (${missing.length}):\n  ` + missing.join("\n  "));
