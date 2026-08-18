#!/usr/bin/env node
// build-lp.mjs — the generic landing-page builder. Both LPs are structural twins (identical
// selector counts in every section), so one script builds either from its own reference:
//
//   node build-lp.mjs dental-implants dental-implants-v2 /ads-landing-pages/dental-implants-consultation-v2
//
// Everything page-specific comes out of the reference itself:
//   - copy, asset ids and nesting from v2-reference/<ref>/tree-1440.json (the RENDERED page —
//     outline.json is parsed from the saved file with no CSS or JS and comes out reordered)
//   - the split headlines from headings(<ref>), which reads the `accent` class out of
//     page.html; the coloured half can be the second run OR the first
//
// This creates NO new classes: the lp_ family built for the cosmetic page covers both.
// Resumable — each section root is logged to built/<slug>.json and skipped on re-run.
import { buildSections, div, section, par, txt, img, dom, linkUrl, linkPhone, el, video,
  tree, byClass, all, headings, PHONE_TEXT } from "./lib.mjs";

const REF = process.argv[2] || "cosmetic";
const SLUG = process.argv[3] || "cosmetic-v2";
const CONSULT = process.argv[4] || "/ads-landing-pages/cosmetic-consultation-v2";
const BOOK_ONLINE = "https://www.flexbook.me/gmdent/1";
const REFERRING = "/refer-a-patient";
const MAPS = "https://maps.app.goo.gl/EeX5CMrv2yQfDC8i6";

const T = tree(REF);
const H = headings(REF);
const sec = (i) => T.sections[i];
const texts = (n) => all(n, (x) => x.text).map((x) => x.text);
const first = (n, cls) => byClass(n, cls)[0];
const imgsOf = (n) => all(n, (x) => x.tag === "img");

const cta = (label = "Book a Consultation") =>
  div("lp_center_row", linkUrl("lp_button", CONSULT, txt(null, label)));

/** Headline `i` from the reference, rebuilt as plain + accent spans. A Webflow Span is not
 *  text-bindable but a DOM span is, so both halves are DOM spans. */
const heading = (i, cls, level = 2) => {
  const h = H[i];
  if (!h) throw new Error(`no reference heading at index ${i} for ${REF}`);
  const kids = h.accent
    ? (h.accentFirst
      ? [dom("span", "lp_heading_accent", { set_text: { text: h.accent + " " } }),
         dom("span", null, { set_text: { text: h.head } })]
      : [dom("span", null, { set_text: { text: h.head + " " } }),
         dom("span", "lp_heading_accent", { set_text: { text: h.accent } })])
    : [dom("span", null, { set_text: { text: h.head } })];
  return el("Heading", cls, { set_heading_level: { heading_level: level } }, ...kids);
};

// ------------------------------------------------------------------ header
const LOGO = imgsOf(sec(0))[0].asset;
const PHONE_ICON = (await import("./lib.mjs")).assetByName("gmc-icon-phone-white.svg");
const CHEVRON = (await import("./lib.mjs")).assetByName("gmc-icon-chevron-navy.svg");
const header = section("section_lp_header",
  div("lp_header_bar",
    div("lp_header_inner",
      el("LinkBlock", null, { set_link: { link_type: "url", link: "/" } },
        img("lp_header_logo", LOGO, "Grand Mission Dentistry")),
      div("lp_header_actions",
        linkPhone("lp_header_link", img("lp_header_icon", PHONE_ICON, ""), txt(null, PHONE_TEXT)),
        linkUrl("lp_header_link", REFERRING, txt(null, "Referring Doctors")),
        linkUrl("lp_header_cta", BOOK_ONLINE, txt(null, "Book Online"), img("lp_header_cta_icon", CHEVRON, ""))))));

// ------------------------------------------------------------------ hero
const HE = sec(1);
const hero = section("section_lp_hero",
  div("lp_container",
    div("lp_hero_grid",
      div("lp_hero_content",
        dom("span", "lp_eyebrow", { set_text: { text: first(HE, "imp-section-label").text } }),
        div("lp_rating_badge",
          dom("span", "lp_rating_stars", { set_text: { text: "★★★★★" } }),
          txt(null, (first(HE, "imp-rating-badge")?.text || "Five-Star Rated on Google, Yelp & Nextdoor"))),
        heading(0, "lp_hero_h1", 1),
        par("lp_hero_lead", first(HE, "imp-paragraph-hero").text),
        dom("ul", "lp_tick_list", {}, ...byClass(HE, "imp-li").map((li) =>
          dom("li", "lp_tick_item", {},
            dom("span", "lp_tick_icon", { set_text: { text: "✓" } }),
            txt(null, (li.text || texts(li)[0]).replace(/^✓\s*/, ""))))),
        div("lp_button_row",
          linkUrl("lp_button", CONSULT, txt(null, "Book a Consultation")),
          linkPhone(["lp_button", "is-ghost"], txt(null, `Call ${PHONE_TEXT}`)))),
      div("lp_form_card",
        par("lp_form_card_title", first(HE, "imp-hero-form").text),
        par("lp_form_card_note", first(HE, "imp-p").text),
        el("Form", "lp_form_stack")))));

// ------------------------------------------------------------------ journey
const J = sec(2);
const journey = section("section_lp_journey",
  div("lp_container",
    div("lp_journey_intro",
      dom("span", "lp_eyebrow", { set_text: { text: first(J, "imp-section-label").text } }),
      heading(1, "lp_heading"),
      par("lp_lead", first(J, "imp-paragraph").text)),
    div("lp_compare_wrap",
      div("lp_compare",
        div("lp_compare_stage",
          img("lp_compare_img", byClass(J, "csm-ba__img--before")[0].asset,
            "Smile before treatment at Grand Mission Dentistry"),
          img(["lp_compare_img", "is-after"], byClass(J, "csm-ba__img--after")[0].asset,
            "The same smile after treatment at Grand Mission Dentistry"),
          dom("span", "lp_compare_tag", { set_text: { text: "Before" } }),
          dom("span", ["lp_compare_tag", "is-after"], { set_text: { text: "After" } }),
          div("lp_compare_divider")),
        div("lp_compare_foot",
          dom("span", "lp_compare_foot_strong", { set_text: { text: "Real Grand Mission Dentistry patient" } }))),
      par("lp_compare_hint", "Before on the left, after on the right.")),
    div("lp_journey_cols", ...byClass(J, "imp-jcol").map((col, i) => {
      const dark = i === 0;
      return div(dark ? ["lp_jcol", "is-dark"] : "lp_jcol",
        el("Heading", dark ? ["lp_jcol_h", "is-light"] : "lp_jcol_h",
          { set_heading_level: { heading_level: 3 }, set_text: { text: byClass(col, "heading-style-h3")[0].text } }),
        // the row's sentence is on the <li> and the glyph on its child span — read by role
        dom("ul", "lp_jlist", {}, ...byClass(col, "imp-li-2").map((li) => dom("li", "lp_jitem", {},
          dom("span", dark ? "lp_jmark" : ["lp_jmark", "is-positive"], { set_text: { text: dark ? "✕" : "✓" } }),
          txt(null, li.text || texts(li)[0])))));
    })),
    div("lp_chapters", ...byClass(J, "imp-chapter").map((c) =>
      div("lp_chapter",
        img("lp_chapter_img", first(c, "imp-img-2").asset, first(c, "imp-img-2").alt),
        div("lp_chapter_body",
          dom("span", "lp_chapter_num", { set_text: { text: first(c, "imp-cnum").text ?? texts(first(c, "imp-cnum"))[0] } }),
          el("Heading", "lp_chapter_h", { set_heading_level: { heading_level: 3 }, set_text: { text: first(c, "imp-h3-5").text } }),
          par("lp_chapter_p", first(c, "imp-p-4").text))))),
    cta()));

// ------------------------------------------------------------------ difference
const D = sec(3);
const videoCard = () =>
  div("lp_video_card", video(null),
    div("lp_video_title",
      dom("span", "lp_rating_stars", { set_text: { text: "★★★★★" } }),
      txt(null, "Patient story in their own words")));
const dVideos = all(D, (n) => n.tag === "iframe");
const difference = section("section_lp_difference",
  div("lp_container",
    dom("span", "lp_eyebrow", { set_text: { text: first(D, "imp-section-label").text } }),
    heading(2, "lp_heading"),
    div("lp_grid_4", ...byClass(D, "imp-card").map((c) =>
      div("lp_card",
        el("Heading", "lp_card_h", { set_heading_level: { heading_level: 3 }, set_text: { text: first(c, "imp-h3-6").text } }),
        par("lp_card_p", first(c, "imp-p-5").text)))),
    div("lp_video_row", videoCard()),
    div("lp_video_row", ...dVideos.slice(1, 4).map(() => videoCard())),
    cta()));

// ------------------------------------------------------------------ specialist
const SP = sec(4);
const specialist = section("section_lp_specialist",
  div("lp_container",
    div("lp_doctor_grid",
      div("lp_doctor_col", div("lp_doctor_sticky", div("lp_doctor_media", video(null)))),
      div("lp_hero_content",
        dom("span", "lp_eyebrow", { set_text: { text: first(SP, "imp-section-label").text } }),
        heading(3, "lp_heading"),
        par("lp_lead", first(SP, "imp-paragraph").text),
        dom("ul", "lp_cred_list", {}, ...byClass(SP, "imp-li-3").map((li) => {
          // here the <li> is empty and the tick span comes first: [tick, tail, lead]
          const t = texts(li);
          return dom("li", "lp_cred_item", {},
            dom("span", "lp_tick_icon", { set_text: { text: "✓" } }),
            dom("span", "lp_cred_text", {},
              dom("strong", "lp_cred_strong", { set_text: { text: t[2] } }),
              txt(null, " " + t[1])));
        })),
        el("Blockquote", "lp_quote", { set_text: { text: first(SP, "imp-blockquote").text } }))),
    div("lp_photo_strip", ...byClass(SP, "imp-img-5").map((im) => img("lp_photo_strip_img", im.asset, im.alt)))));

// ------------------------------------------------------------------ options
const OP = sec(5);
const optionCard = (card) => {
  const rows = byClass(card, "service_item-detail");
  const specs = rows.filter((r) => texts(r).length === 2);
  const note = rows.find((r) => texts(r).length === 1);
  const kids = [];
  specs.forEach((r, i) => {
    const [label, value] = texts(r);
    kids.push(div("lp_spec_row",
      dom("span", "lp_spec_label", { set_text: { text: label } }),
      dom("span", "lp_spec_value", { set_text: { text: value } })));
    if (i < specs.length - 1) kids.push(div("lp_spec_divider"));
  });
  if (note) kids.push(par("lp_option_note", texts(note)[0]));
  const im = first(card, "service_item-img");
  return div("lp_option_card",
    img("lp_option_img", im.asset, im.alt),
    div("lp_option_body",
      div("lp_option_head",
        el("Heading", "lp_option_h", { set_heading_level: { heading_level: 3 }, set_text: { text: first(card, "services_card-heading").text } }),
        par("lp_option_desc", first(card, "imp-serv-desc").text)),
      div("lp_option_specs", ...kids)));
};
const options = section("section_lp_options",
  div("lp_container",
    dom("span", "lp_eyebrow", { set_text: { text: first(OP, "imp-section-label").text } }),
    heading(4, "lp_heading"),
    par(["lp_lead", "is-centered"], first(OP, "imp-paragraph").text),
    div("lp_options_grid", ...byClass(OP, "service_item").map(optionCard))));

// ------------------------------------------------------------------ process
const PR = sec(6);
const process_ = section("section_lp_process",
  div("lp_container",
    div("lp_doctor_grid",
      div("lp_hero_content",
        dom("span", "lp_eyebrow", { set_text: { text: first(PR, "imp-section-label").text } }),
        heading(5, "lp_heading"),
        par("lp_lead", texts(first(PR, "imp-paragraph")).join(" ")),
        div("lp_grid_3",
          ...byClass(PR, "imp-card").map((c) => {
            const [head, body] = texts(c);
            return div("lp_card",
              el("Heading", "lp_card_h", { set_heading_level: { heading_level: 3 } },
                dom("span", "lp_step_num", { set_text: { text: head.match(/^(\d+)/)?.[1] ?? "" } }),
                dom("span", null, { set_text: { text: head.replace(/^\d+/, "") } })),
              par("lp_card_p", body));
          }),
          cta())),
      div("lp_doctor_col", div("lp_doctor_sticky", div("lp_doctor_media", video(null)))))));

// ------------------------------------------------------------------ gallery
const G = sec(7);
const gallery = section("section_lp_gallery",
  div("lp_container",
    dom("span", "lp_eyebrow", { set_text: { text: first(G, "imp-section-label").text } }),
    heading(6, "lp_heading"),
    par(["lp_lead", "is-centered"], first(G, "imp-paragraph").text),
    div("lp_gallery_grid", ...byClass(G, "imp-img-3").map((im) => img("lp_gallery_img", im.asset, im.alt))),
    cta()));

// ------------------------------------------------------------------ space
const SPC = sec(8);
const officeCombo = (i) => (i === 0 ? "lp_office_img"
  : i <= 2 ? ["lp_office_img", "is-mid"] : ["lp_office_img", "is-short"]);
const space = section("section_lp_space",
  div("lp_container",
    dom("span", "lp_eyebrow", { set_text: { text: first(SPC, "imp-section-label").text } }),
    heading(7, "lp_heading"),
    par(["lp_lead", "is-centered"], first(SPC, "imp-paragraph").text),
    div("lp_office_grid", ...imgsOf(SPC).map((im, i) => img(officeCombo(i), im.asset, im.alt)))));

// ------------------------------------------------------------------ faq
const F = sec(9);
const faq = section("section_lp_faq",
  div("lp_faq_wrap",
    dom("span", ["lp_eyebrow", "is-centered"], { set_text: { text: first(F, "imp-section-label").text } }),
    heading(8, ["lp_heading", "is-centered"]),
    div("lp_process_container", ...byClass(F, "accordion-item").map((item, i) =>
      dom("details", "lp_faq_item", i === 0 ? { set_attributes: { attributes: [{ name: "open", value: "" }] } } : {},
        dom("summary", "lp_faq_trigger", {},
          el("Heading", "lp_faq_question", { set_heading_level: { heading_level: 4 }, set_text: { text: first(item, "imp-header3").text } }),
          dom("span", "lp_faq_icon", { set_text: { text: "+" } })),
        div("lp_faq_answer", par("lp_card_p", first(item, "imp-paragraph").text)))))));

// ------------------------------------------------------------------ closing
const C = sec(10);
const closing = section("section_lp_closing",
  div("lp_container",
    dom("span", ["lp_eyebrow", "is-centered"], { set_text: { text: first(C, "imp-section-label").text } }),
    heading(9, ["lp_heading", "is-centered"]),
    par("lp_closing_lead", first(C, "imp-paragraph").text),
    div("lp_closing_media", video(null), cta()),
    el("Paragraph", "lp_closing_note", {},
      dom("span", null, { set_text: { text: "Prefer to talk? Call " } }),
      linkPhone("lp_closing_link", txt(null, PHONE_TEXT)),
      dom("span", null, { set_text: { text: " · Mon 9–7 · Tue–Wed 10–8 · Thu–Fri 8–6 · Sat 8–3" } }))));

// ------------------------------------------------------------------ footer
const FT = sec(11);
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
  { label: "journey", parentLabel: "main", tree: journey },
  { label: "difference", parentLabel: "main", tree: difference },
  { label: "specialist", parentLabel: "main", tree: specialist },
  { label: "options", parentLabel: "main", tree: options },
  { label: "process", parentLabel: "main", tree: process_ },
  { label: "gallery", parentLabel: "main", tree: gallery },
  { label: "space", parentLabel: "main", tree: space },
  { label: "faq", parentLabel: "main", tree: faq },
  { label: "closing", parentLabel: "main", tree: closing },
  { label: "footer", parentLabel: "shell", tree: footer },
], `${SLUG}.json`);

console.log(JSON.stringify(done, null, 1));
