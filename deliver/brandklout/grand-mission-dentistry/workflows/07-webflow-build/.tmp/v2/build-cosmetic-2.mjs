#!/usr/bin/env node
// build-cosmetic-2.mjs — sections 2..5 of Cosmetic Dentist v2 (journey, difference,
// specialist, options). The remaining sections follow in build-cosmetic-3.mjs.
//
// Content comes from v2-reference/cosmetic/tree-1440.json — the RENDERED reference, not the
// saved page.html. outline.json is extracted from the file with no CSS or JS, so anything the
// live page reorders or injects comes out wrong: the Swiper-driven options cards lost a spec
// label there and the specialist credentials paired against the wrong strings.
//
// Class names are the lp_ family. Nothing from the reference's own markup is carried over.
import { buildSections, div, section, par, txt, img, dom, linkUrl, el, tree, byClass, all }
  from "./lib.mjs";

const SLUG = "cosmetic-v2";
const T = tree("cosmetic");
const sec = (i) => T.sections[i];
/** Every text run inside a node, depth-first — the row/list idiom the reference uses. */
const texts = (n) => all(n, (x) => x.text).map((x) => x.text);
const first = (n, cls) => byClass(n, cls)[0];
const CONSULT = "/ads-landing-pages/cosmetic-consultation-v2";

const cta = (label = "Book a Consultation") =>
  div("lp_center_row", linkUrl("lp_button", CONSULT, txt(null, label)));
/** A heading whose tail is accented. A Webflow Span is not text-bindable but a DOM span is. */
const splitHeading = (level, cls, head, tail) =>
  el("Heading", cls, { set_heading_level: { heading_level: level } },
    dom("span", null, { set_text: { text: head } }),
    dom("span", "lp_heading_accent", { set_text: { text: tail } }));
const youtube = (src) =>
  el("YouTubeVideo", null, { set_youtube_video: { url: src.replace("/embed/", "/watch?v=") } });

// ---------------------------------------------------------------- S2 journey
// The reference's before/after is a JS drag slider. v2 renders a fixed 50% split (the
// `is-after` combo clips the second image), so the "Drag to compare" hint would be untrue and
// is replaced with a static caption. Logged substitution.
const J = sec(2);
const jChapters = byClass(J, "imp-chapter");
const journey = section("section_lp_journey",
  div("lp_container",
    div("lp_journey_intro",
      dom("span", "lp_eyebrow", { set_text: { text: first(J, "imp-section-label").text } }),
      splitHeading(2, "lp_heading", "From Hiding Your Smile ", "To Showing It Off"),
      par("lp_lead", first(J, "imp-paragraph").text)),
    div("lp_compare_wrap",
      div("lp_compare",
        div("lp_compare_stage",
          img("lp_compare_img", byClass(J, "csm-ba__img--before")[0].asset,
            "Smile before cosmetic treatment at Grand Mission Dentistry"),
          img(["lp_compare_img", "is-after"], byClass(J, "csm-ba__img--after")[0].asset,
            "The same smile after cosmetic treatment at Grand Mission Dentistry"),
          dom("span", "lp_compare_tag", { set_text: { text: "Before" } }),
          dom("span", ["lp_compare_tag", "is-after"], { set_text: { text: "After" } }),
          div("lp_compare_divider")),
        div("lp_compare_foot",
          dom("span", "lp_compare_foot_strong",
            { set_text: { text: "Real Grand Mission Dentistry patient" } }))),
      par("lp_compare_hint", "Before on the left, after on the right.")),
    div("lp_journey_cols",
      ...byClass(J, "imp-jcol").map((col, i) => {
        const dark = i === 0;
        return div(dark ? ["lp_jcol", "is-dark"] : "lp_jcol",
          el("Heading", dark ? ["lp_jcol_h", "is-light"] : "lp_jcol_h",
            { set_heading_level: { heading_level: 3 }, set_text: { text: byClass(col, "heading-style-h3")[0].text } }),
          dom("ul", "lp_jlist", {}, ...byClass(col, "imp-li-2").map((li) => {
            const [mark, ...rest] = texts(li);
            return dom("li", "lp_jitem", {},
              dom("span", dark ? "lp_jmark" : ["lp_jmark", "is-positive"], { set_text: { text: mark } }),
              txt(null, rest.join(" ")));
          })));
      })),
    div("lp_chapters", ...jChapters.map((c) =>
      div("lp_chapter",
        img("lp_chapter_img", byClass(c, "imp-img-2")[0].asset, byClass(c, "imp-img-2")[0].alt),
        div("lp_chapter_body",
          dom("span", "lp_chapter_num", { set_text: { text: first(c, "imp-cnum").text ?? texts(first(c, "imp-cnum"))[0] } }),
          el("Heading", "lp_chapter_h", { set_heading_level: { heading_level: 3 }, set_text: { text: first(c, "imp-h3-5").text } }),
          par("lp_chapter_p", first(c, "imp-p-4").text))))),
    cta()));

// ---------------------------------------------------------------- S3 difference
const D = sec(3);
const videoCard = (src) =>
  div("lp_video_card", youtube(src),
    div("lp_video_title",
      dom("span", "lp_rating_stars", { set_text: { text: "★★★★★" } }),
      txt(null, "Patient story — in their own words")));
const dVideos = all(D, (n) => n.tag === "iframe");
const difference = section("section_lp_difference",
  div("lp_container",
    dom("span", "lp_eyebrow", { set_text: { text: first(D, "imp-section-label").text } }),
    splitHeading(2, "lp_heading", "Why Patients Drive Past ", "Other Cosmetic Dentists"),
    div("lp_grid_4", ...byClass(D, "imp-card").map((c) =>
      div("lp_card",
        el("Heading", "lp_card_h", { set_heading_level: { heading_level: 3 }, set_text: { text: first(c, "imp-h3-6").text } }),
        par("lp_card_p", first(c, "imp-p-5").text)))),
    div("lp_video_row", videoCard(dVideos[0].src)),
    div("lp_video_row", ...dVideos.slice(1, 4).map((v) => videoCard(v.src))),
    cta()));

// ---------------------------------------------------------------- S4 specialist
const SP = sec(4);
const specialist = section("section_lp_specialist",
  div("lp_container",
    div("lp_doctor_grid",
      div("lp_doctor_col",
        div("lp_doctor_sticky",
          div("lp_doctor_media", youtube(all(SP, (n) => n.tag === "iframe")[0].src)))),
      div("lp_hero_content",
        dom("span", "lp_eyebrow", { set_text: { text: first(SP, "imp-section-label").text } }),
        el("Heading", "lp_heading", { set_heading_level: { heading_level: 2 }, set_text: { text: first(SP, "imp-h2").text } }),
        par("lp_lead", first(SP, "imp-paragraph").text),
        dom("ul", "lp_cred_list", {}, ...byClass(SP, "imp-li-3").map((li) => {
          // texts() gives [tick, tail, lead] — the <strong> lead-in renders FIRST but sits
          // last in the DOM, so it is read by position, not by order.
          const t = texts(li);
          return dom("li", "lp_cred_item", {},
            dom("span", "lp_tick_icon", { set_text: { text: "✓" } }),
            dom("span", "lp_cred_text", {},
              dom("strong", "lp_cred_strong", { set_text: { text: t[2] } }),
              txt(null, " " + t[1])));
        })),
        el("Blockquote", "lp_quote", { set_text: { text: first(SP, "imp-blockquote").text } }))),
    div("lp_photo_strip", ...byClass(SP, "imp-img-5").map((im) =>
      img("lp_photo_strip_img", im.asset, im.alt)))));

// ---------------------------------------------------------------- S5 options
// The reference drives the three treatment cards with Swiper; v2 uses a plain responsive grid.
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
    splitHeading(2, "lp_heading", "From One Small Refinement ", "To a Complete Smile"),
    par(["lp_lead", "is-centered"], first(OP, "imp-paragraph").text),
    div("lp_options_grid", ...byClass(OP, "service_item").map(optionCard))));

const done = buildSections(SLUG, [
  { label: "journey", parentLabel: "main", tree: journey },
  { label: "difference", parentLabel: "main", tree: difference },
  { label: "specialist", parentLabel: "main", tree: specialist },
  { label: "options", parentLabel: "main", tree: options },
], "cosmetic-v2.json");

console.log(JSON.stringify(done, null, 1));
