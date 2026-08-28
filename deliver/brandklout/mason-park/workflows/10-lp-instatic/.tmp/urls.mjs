/**
 * URL and text helpers shared by the fetcher and the build.
 *
 * Kept in their own module because importing them from fetch-assets.mjs would
 * re-run that script's top-level download on every build.
 */

/** `.../6a7be037dd..._Name-p-500.jpeg` -> `.../6a7be037dd..._Name.jpeg` */
export const baseUrl = (u) => u.replace(/-p-\d+\.(jpg|jpeg|png|webp|gif|avif)$/i, ".$1");

/** Webflow prefixes every asset with a 24-char id; keep it, it guarantees uniqueness. */
export const localName = (u) => decodeURIComponent(u.split("/").pop().split("?")[0]);

/**
 * Instatic stores a page title and description as TEXT, not markup, so
 * `Exam, X-Rays &amp; Cleaning` would publish with a literal `&amp;` in the
 * browser tab. This is the same defect fixed for the main-site export in
 * 3e69c51; the landing pages hit it on 2 of 6 titles.
 */
const NAMED = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  reg: "®", copy: "©", trade: "™", hellip: "…",
  mdash: "—", ndash: "–", rsquo: "’", lsquo: "‘",
  ldquo: "“", rdquo: "”", deg: "°",
};
export const decodeEntities = (s) =>
  s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, body) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X"
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return NAMED[body.toLowerCase()] ?? m;
  });
