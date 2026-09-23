#!/usr/bin/env node
// build-cosmetic.mjs — Cosmetic Dentist v2, built from the captured reference.
//
// Content comes from 08-qa/.tmp/v2-reference/cosmetic/outline.json (copy, hrefs, asset ids)
// and tree-1440.json (nesting and layout). Class names come from the lp_ family. NOTHING is
// carried over from the reference's own markup.
//
// Resumable: each section root is logged to built/cosmetic-v2.json and skipped on re-run.
import { buildSections, div, section, par, txt, img, dom, linkUrl, linkPhone, el,
  outline, assetByName, PHONE_TEXT } from "./lib.mjs";

const SLUG = "cosmetic-v2";
const O = outline("cosmetic");
const S = (i) => O.sections[i].items;
/** Pull the full text of the nth item of kind k in section i — the outline is the copy source
 *  of record, so nothing is retyped here and a copy fix is a re-run, not an edit. */
const pick = (i, k, n = 0) => S(i).filter((x) => x.k === k)[n]?.t ?? "";
const imgs = (i) => S(i).filter((x) => x.k === "img");
const links = (i) => S(i).filter((x) => x.k === "a");

// The reference's CTAs point at "#": every "Book a Consultation" goes to the funnel's own
// consultation page instead (logged as a substitution).
const CONSULT = "/ads-landing-pages/cosmetic-consultation-v2";
const BOOK_ONLINE = "https://www.flexbook.me/gmdent/1";
const REFERRING = "/refer-a-patient";

// ---------------------------------------------------------------------------------
// S0 header. The blue bar is a child of the header shell on the reference, so it is a
// child here too. The icons are HtmlEmbeds on the reference (custom code, not allowed);
// the phone icon becomes the site's own gmc-icon-phone-white.svg and the "Referring
// Doctors" icon is dropped — the site has no person glyph and one is not worth inventing.
// ---------------------------------------------------------------------------------
const LOGO = imgs(0)[0].asset;
const PHONE_ICON = assetByName("gmc-icon-phone-white.svg");
const CHEVRON_NAVY = assetByName("gmc-icon-chevron-navy.svg");

const header = section("section_lp_header",
  div("lp_header_bar",
    div("lp_header_inner",
      el("LinkBlock", null, { set_link: { link_type: "url", link: "/" } },
        img("lp_header_logo", LOGO, "Grand Mission Dentistry")),
      div("lp_header_actions",
        linkPhone("lp_header_link",
          img("lp_header_icon", PHONE_ICON, ""),
          txt(null, PHONE_TEXT)),
        linkUrl("lp_header_link", REFERRING, txt(null, "Referring Doctors")),
        linkUrl("lp_header_cta", BOOK_ONLINE,
          txt(null, "Book Online"),
          img("lp_header_cta_icon", CHEVRON_NAVY, ""))))));

// ---------------------------------------------------------------------------------
// S1 hero. The h1 carries an inline accent: a Webflow Span is not text-bindable but a DOM
// span is, so the headline is two spans rather than a text node plus a span.
// The reference's form card is a title, a note and a LeadConnector embed that renders at
// 0px — v2 replaces the embed with a native Webflow form (logged substitution).
// ---------------------------------------------------------------------------------
const heroTicks = S(1).filter((x) => x.k === "li").map((x) =>
  dom("li", "lp_tick_item", {},
    dom("span", "lp_tick_icon", { set_text: { text: "✓" } }),
    txt(null, x.t.replace(/^✓\s*/, ""))));

const hero = section("section_lp_hero",
  div("lp_container",
    div("lp_hero_grid",
      div("lp_hero_content",
        dom("span", "lp_eyebrow", { set_text: { text: pick(1, "t", 0) } }),
        div("lp_rating_badge",
          dom("span", "lp_rating_stars", { set_text: { text: "★★★★★" } }),
          txt(null, "Five-Star Rated on Google, Yelp & Nextdoor")),
        el("Heading", "lp_hero_h1", { set_heading_level: { heading_level: 1 } },
          dom("span", null, { set_text: { text: "A Smile You'll Love" } }),
          dom("span", "lp_text_accent", { set_text: { text: "In Every Photo." } })),
        par("lp_hero_lead", pick(1, "p", 0)),
        dom("ul", "lp_tick_list", {}, ...heroTicks),
        div("lp_button_row",
          linkUrl("lp_button", CONSULT, txt(null, "Book a Consultation")),
          linkPhone(["lp_button", "is-ghost"], txt(null, `Call ${PHONE_TEXT}`)))),
      div("lp_form_card",
        par("lp_form_card_title", pick(1, "p", 1)),
        par("lp_form_card_note", pick(1, "p", 2)),
        // A Text Field cannot be a child of the Form WRAPPER — "Text Field can only be
        // placed in a Form" — so the wrapper goes in empty here and build-form.mjs appends
        // the fields to the FormForm inside it. Field name / type / placeholder and the
        // redirect are settings, written after the fields exist.
        el("Form", "lp_form_stack"))))); 

const done = buildSections(SLUG, [
  { label: "shell", tree: div("page-wrapper") },
  { label: "header", parentLabel: "shell", tree: header },
  { label: "main", parentLabel: "shell", tree: div("main-wrapper") },
  { label: "hero", parentLabel: "main", tree: hero },
], "cosmetic-v2.json");

console.log(JSON.stringify(done, null, 1));
