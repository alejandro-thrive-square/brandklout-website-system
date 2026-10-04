/**
 * The practice's Google reviews widget, shared by the import chain (place-ad-embeds.mjs turns
 * the `data-elfsight-reviews` slot into an Embed) and the live-row script (add-elfsight-reviews.mjs).
 *
 * Elfsight Google Reviews `e30c1531-…` (Trong's account) on Mason Park Dental of Katy, 21830
 * Kingsland Blvd #104A (the adult practice; #104B is the kids'). Since 2026-10-04 it replaces the
 * practice's All-in-One Reviews `32926aff` (other account), whose header has no Google logo, under
 * the in-section standard (deliver/process/tools/elfsight-reviews/README.md). Registry:
 * deliver/process/tools/elfsight-reviews/review-widgets.json. Never create a second one.
 *
 * The snippet is Elfsight's install code WITHOUT `data-elfsight-app-lazy`: with the attribute
 * platform.js loads and the widget never boots on Instatic (0px, no error). Verified on the kids'
 * site 2026-09-29. It goes in a brandklout.embed-origins Embed in snippet mode, never raw page
 * HTML (Instatic strips <script>); a page holding one gets the plugin's compatible CSP, which is
 * what lets platform.js reach Elfsight's API hosts.
 */
export const WIDGET_ID = "e30c1531-deaf-4e44-b3de-61cf3426bce9";
export const MODULE_ID = "brandklout.embed-origins.embed";
export const SLOT_CLASS = "rv-embed";
export const SNIPPET = [
  "<!-- Elfsight Google Reviews | Mason Park Dental of Katy -->",
  '<script src="https://elfsightcdn.com/platform.js" async></script>',
  `<div class="elfsight-app-${WIDGET_ID}"></div>`,
].join("\n");

export const embedProps = () => ({
  source: "snippet",
  snippet: SNIPPET,
  url: "",
  title: "Google reviews",
  fit: "auto",
  height: 420,
  ratio: "16 / 9",
  lazy: true,
  allowFullscreen: false,
  allow: "",
});
