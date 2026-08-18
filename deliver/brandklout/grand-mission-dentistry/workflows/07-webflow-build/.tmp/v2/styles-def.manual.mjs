// styles-def.manual.mjs — the classes the generator could not produce.
//
// Three reasons a class lands here instead of in gen-styles.mjs's MAP:
//  1. The reference paints it with a stack the generator's one-chain-per-class model cannot
//     express — the header is a `.header` shell whose blue actually comes from a child
//     `.navbar`, and its grey `rgb(95,95,93)` never shows because the navbar covers it.
//  2. It replaces something v2 is not allowed to reproduce: the header's icons are HtmlEmbeds
//     (custom code), so they become Image elements pointing at the site's own gmc-icon-* SVGs;
//     the FAQ rows become a native Webflow Dropdown.
//  3. It is NEW: the hero card on the reference is a title, a note, and an EMPTY LeadConnector
//     embed (0px). v2 puts a native Webflow form in it, so the card needs field styling.
//
// Values are the measured ones from v2-reference/cosmetic/styles-extra.json unless noted.
import { V } from "./tokens.mjs";

const radius = (r) => ({
  "border-top-left-radius": r, "border-top-right-radius": r,
  "border-bottom-left-radius": r, "border-bottom-right-radius": r,
});
const border = (w, c) => Object.fromEntries(["top", "right", "bottom", "left"].flatMap((s) => [
  [`border-${s}-width`, w], [`border-${s}-style`, "solid"], [`border-${s}-color`, c],
]));

export const STYLES = [
  // ---- header -------------------------------------------------------------------
  // Fixed, z 999, 58px tall, and HIDDEN from 991 down — on the reference every child of the
  // header measures 0x0 at 991 and below (the converter's own `hide-tablet`), so the phone
  // number and Book Online button genuinely do not exist on tablet or mobile. Reproduced as
  // measured; flagged in the build report as a UX question for the client, not a build defect.
  {
    n: "section_lp_header",
    p: {
      position: "fixed", top: "0px", left: "0px", right: "0px", "z-index": "999",
      width: "100%", "box-shadow": "0 4px 5px 0 rgba(0,0,0,0.2)",
    },
    bp: { medium: { display: "none" }, small: { display: "none" }, tiny: { display: "none" } },
  },
  { n: "lp_header_bar", p: { width: "100%", "background-color": { v: V.blue } } },
  {
    n: "lp_header_inner",
    p: {
      display: "flex", "flex-direction": "row", "align-items": "center",
      "justify-content": "space-between", gap: "16px", "min-height": "58px",
      width: "100%", "max-width": "1280px", "margin-left": "auto", "margin-right": "auto",
      "padding-left": "4%", "padding-right": "4%",
    },
  },
  { n: "lp_header_logo", p: { height: "32px", width: "auto", "object-fit": "contain" } },
  { n: "lp_header_actions", p: { display: "flex", "flex-direction": "row", "align-items": "center", gap: "8px" } },
  {
    n: "lp_header_link",
    p: {
      display: "flex", "flex-direction": "row", "align-items": "center", gap: "8px",
      "padding-top": "12px", "padding-bottom": "12px", "padding-left": "16px", "padding-right": "16px",
      color: { v: V.white }, "font-size": "11px", "line-height": "18.48px", "text-decoration": "none",
    },
  },
  { n: "lp_header_icon", p: { width: "16px", height: "16px", "object-fit": "contain" } },
  {
    n: "lp_header_cta",
    p: {
      display: "flex", "flex-direction": "row", "align-items": "center", "justify-content": "space-between",
      gap: "16px", "padding-top": "4.8px", "padding-bottom": "4.8px",
      "padding-left": "19.2px", "padding-right": "19.2px",
      "background-color": { v: V.white }, color: { v: V.navy },
      "font-size": "12px", "font-weight": "600", "letter-spacing": "0.32px",
      "text-transform": "capitalize", "text-decoration": "none",
      ...border("1px", { v: V.sky }),
    },
  },
  { n: "lp_header_cta_icon", p: { width: "26px", height: "26px", "object-fit": "contain" } },

  // ---- "how it works" section (the reference calls it .section-12) ------------------
  { n: "section_lp_process", p: { "padding-top": "80px", "padding-bottom": "80px" } },
  {
    n: "lp_process_container",
    p: {
      width: "100%", "max-width": "940px", "margin-left": "auto", "margin-right": "auto",
      "padding-top": "20px", "padding-bottom": "20px", "padding-left": "4%", "padding-right": "4%",
    },
  },

  // ---- FAQ: a native Webflow Dropdown wearing the reference's accordion styling --------
  {
    n: "lp_faq_item",
    p: {
      width: "100%", "background-color": { v: V.white },
      "padding-top": "24px", "padding-bottom": "14px", "padding-left": "30px", "padding-right": "30px",
      "margin-bottom": "20px", "box-shadow": "0 3px 7px 0 rgba(0,0,0,0.03)", ...radius("10px"),
    },
  },
  {
    n: "lp_faq_trigger",
    p: {
      display: "flex", "flex-direction": "row", "align-items": "flex-start",
      "justify-content": "space-between", width: "100%", "padding-top": "0px",
      "padding-bottom": "0px", "padding-left": "0px", "padding-right": "0px",
      "background-color": "transparent",
      // Webflow's own .w-dropdown-toggle sets white-space:nowrap; on the Mason Park build that
      // clipped the tail of every FAQ question off a 390px viewport.
      "white-space": "normal",
    },
  },
  {
    n: "lp_faq_icon",
    p: {
      display: "flex", "align-items": "center", "justify-content": "center",
      width: "30px", height: "30px", "flex-shrink": "0",
      "background-color": { v: V.mist }, color: "rgba(0,0,0,0.6)",
      "font-size": "24px", "line-height": "24px", ...radius("50%"),
    },
  },
  { n: "lp_faq_answer", p: { "margin-top": "10px", width: "100%", "background-color": "transparent" } },

  // ---- native form in the hero card (the reference's embed renders at 0px) -------------
  { n: "lp_form_stack", p: { display: "flex", "flex-direction": "column", gap: "10px", "margin-top": "14px", width: "100%" } },
  {
    n: "lp_form_input",
    p: {
      width: "100%", height: "44px", "margin-bottom": "0px",
      "padding-left": "12px", "padding-right": "12px",
      "font-size": "14px", color: { v: V.n6 }, "background-color": { v: V.white },
      ...border("1px", { v: V.lpLine }), ...radius("8px"),
    },
  },
  {
    n: "lp_form_submit",
    p: {
      width: "100%", "padding-top": "14px", "padding-bottom": "14px",
      "background-color": { v: V.navy }, color: { v: V.white },
      "font-size": "13px", "font-weight": "700", "letter-spacing": "1px",
      "text-transform": "uppercase", ...radius("8px"),
      ...border("0px", { v: V.navy }),
    },
  },
  // The Life Before / Life After column headings. The reference styles them with the kit's
  // heading-style-h3 plus a colour helper; v2 gives them one class and an is-light combo so
  // the dark column does not depend on a tag style's inherited colour.
  { n: "lp_jcol_h", p: { "font-size": "24px", "font-weight": "700", "line-height": "36px", "margin-bottom": "12px", color: { v: V.lpNavy } } },
  { n: "is-light", parents: ["lp_jcol_h"], p: { color: { v: V.white } } },

  { n: "lp_form_note", p: { "font-size": "11px", "line-height": "16px", color: { v: V.n4 }, "margin-top": "8px" } },
];
