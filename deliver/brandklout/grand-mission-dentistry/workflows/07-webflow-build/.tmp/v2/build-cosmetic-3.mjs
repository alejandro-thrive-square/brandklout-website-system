#!/usr/bin/env node
// build-cosmetic-3.mjs — sections 6..11 of Cosmetic Dentist v2: process ("how it works"),
// gallery, space, FAQ, closing band, footer. Finishes the page.
//
// The FAQ is a native `details`/`summary` pair rather than a Webflow Dropdown. Both are
// custom-code-free, but Dropdown generates a fixed DropdownToggle/DropdownList/DropdownLink
// skeleton that has to be dismantled per item, while details/summary is the structure the
// section actually wants and needs no post-pass. The same choice was made on the campaign
// rebuild for this site.
import { buildSections, div, section, par, txt, img, dom, linkUrl, linkPhone, el, video,
  tree, byClass, all, PHONE_TEXT } from "./lib.mjs";

const SLUG = "cosmetic-v2";
const T = tree("cosmetic");
const sec = (i) => T.sections[i];
const texts = (n) => all(n, (x) => x.text).map((x) => x.text);
const first = (n, cls) => byClass(n, cls)[0];
const CONSULT = "/ads-landing-pages/cosmetic-consultation-v2";

const cta = (label = "Book a Consultation") =>
  div("lp_center_row", linkUrl("lp_button", CONSULT, txt(null, label)));
const splitHeading = (level, cls, head, tail) =>
  el("Heading", cls, { set_heading_level: { heading_level: level } },
    dom("span", null, { set_text: { text: head } }),
    dom("span", "lp_heading_accent", { set_text: { text: tail } }));

// ---------------------------------------------------------------- S6 how it works
// Two columns: the copy and numbered steps on the left, a sticky video on the right. The
// reference bakes the step number into the heading text ("1Consultation & Digital
// Simulation"); v2 splits it back out into its own element so it can be styled and edited.
const PR = sec(6);
const process = section("section_lp_process",
  div("lp_container",
    div("lp_doctor_grid",
      div("lp_hero_content",
        dom("span", "lp_eyebrow", { set_text: { text: first(PR, "imp-section-label").text } }),
        splitHeading(2, "lp_heading", "Your Dental Work ", "Shouldn't Look & Feel Like Dental Work"),
        par("lp_lead", texts(first(PR, "imp-paragraph")).join(" ")),
        div("lp_grid_3",
          ...byClass(PR, "imp-card").map((c) => {
            const [head, body] = texts(c);
            const num = head.match(/^(\d+)/)?.[1] ?? "";
            return div("lp_card",
              el("Heading", "lp_card_h", { set_heading_level: { heading_level: 3 } },
                dom("span", "lp_step_num", { set_text: { text: num } }),
                dom("span", null, { set_text: { text: head.replace(/^\d+/, "") } })),
              par("lp_card_p", body));
          }),
          cta())),
      div("lp_doctor_col",
        div("lp_doctor_sticky",
          div("lp_doctor_media", video(null)))))));

// ---------------------------------------------------------------- S7 gallery
const G = sec(7);
const gallery = section("section_lp_gallery",
  div("lp_container",
    dom("span", "lp_eyebrow", { set_text: { text: first(G, "imp-section-label").text } }),
    el("Heading", "lp_heading", { set_heading_level: { heading_level: 2 }, set_text: { text: first(G, "imp-h2").text } }),
    par(["lp_lead", "is-centered"], first(G, "imp-paragraph").text),
    div("lp_gallery_grid", ...byClass(G, "imp-img-3").map((im) =>
      img("lp_gallery_img", im.asset, im.alt))),
    cta()));

// ---------------------------------------------------------------- S8 space
// The collage runs three image ratios; each tile gets the combo matching its own.
const SPC = sec(8);
const officeCombo = (i) => (i === 0 ? "lp_office_img"
  : i <= 2 ? ["lp_office_img", "is-mid"] : ["lp_office_img", "is-short"]);
const space = section("section_lp_space",
  div("lp_container",
    dom("span", "lp_eyebrow", { set_text: { text: first(SPC, "imp-section-label").text } }),
    splitHeading(2, "lp_heading", "A Space Designed ", "For Your Comfort"),
    par(["lp_lead", "is-centered"], first(SPC, "imp-paragraph").text),
    div("lp_office_grid", ...all(SPC, (n) => n.tag === "img").map((im, i) =>
      img(officeCombo(i), im.asset, im.alt)))));

// ---------------------------------------------------------------- S9 FAQ
const F = sec(9);
const faq = section("section_lp_faq",
  div("lp_faq_wrap",
    dom("span", ["lp_eyebrow", "is-centered"], { set_text: { text: first(F, "imp-section-label").text } }),
    el("Heading", ["lp_heading", "is-centered"], { set_heading_level: { heading_level: 2 }, set_text: { text: first(F, "imp-h2").text } }),
    div("lp_process_container", ...byClass(F, "accordion-item").map((item, i) =>
      dom("details", "lp_faq_item", i === 0 ? { set_attributes: { attributes: [{ name: "open", value: "" }] } } : {},
        dom("summary", "lp_faq_trigger", {},
          el("Heading", "lp_faq_question", { set_heading_level: { heading_level: 4 }, set_text: { text: first(item, "imp-header3").text } }),
          dom("span", "lp_faq_icon", { set_text: { text: "+" } })),
        div("lp_faq_answer",
          par("lp_card_p", first(item, "imp-paragraph").text)))))));

// ---------------------------------------------------------------- S10 closing
const C = sec(10);
const closing = section("section_lp_closing",
  div("lp_container",
    dom("span", ["lp_eyebrow", "is-centered"], { set_text: { text: first(C, "imp-section-label").text } }),
    el("Heading", ["lp_heading", "is-centered"], { set_heading_level: { heading_level: 2 }, set_text: { text: all(C, (n) => n.tag === "h2")[0].text } }),
    par("lp_closing_lead", first(C, "imp-paragraph").text),
    div("lp_closing_media", video(null), cta()),
    // The reference renders "Prefer to talk? Call" immediately followed by the hours, with the
    // number as a separate link — reordered here so the sentence reads correctly.
    el("Paragraph", "lp_closing_note", {},
      dom("span", null, { set_text: { text: "Prefer to talk? Call " } }),
      linkPhone("lp_closing_link", txt(null, PHONE_TEXT)),
      dom("span", null, { set_text: { text: " · Mon 9–7 · Tue–Wed 10–8 · Thu–Fri 8–6 · Sat 8–3" } }))));

// ---------------------------------------------------------------- S11 footer
const FT = sec(11);
const footer = section("section_lp_footer",
  div("lp_footer_inner",
    div("lp_footer_row",
      el("Paragraph", "lp_footer_legal", {},
        dom("span", null, { set_text: { text: "Grand Mission Dentistry, Dr. William Sung DMD " } }),
        linkUrl("lp_footer_link", "https://maps.app.goo.gl/EeX5CMrv2yQfDC8i6",
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
  { label: "process", parentLabel: "main", tree: process },
  { label: "gallery", parentLabel: "main", tree: gallery },
  { label: "space", parentLabel: "main", tree: space },
  { label: "faq", parentLabel: "main", tree: faq },
  { label: "closing", parentLabel: "main", tree: closing },
  { label: "footer", parentLabel: "shell", tree: footer },
], "cosmetic-v2.json");

console.log(JSON.stringify(done, null, 1));
