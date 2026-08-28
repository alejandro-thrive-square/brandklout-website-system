/**
 * Namespace a stylesheet so it can only ever style one subtree.
 *
 * WHY THIS EXISTS
 * The six landing pages come off Webflow carrying a Client-First stylesheet,
 * and the 71 pages already live on Instatic carry a *different* Client-First
 * stylesheet. They share 44 class names outright - `padding-global`,
 * `container-large`, `heading-style-h1`, `button` and friends. Instatic serves
 * one site-wide CSS bundle, so shipping the landing-page CSS as-is would
 * restyle every live page on the site. Every selector therefore gets scoped to
 * `.lp-page`, the wrapper build.mjs puts around each landing page's body.
 *
 * THE ROOT-ELEMENT PROBLEM
 * The pages are sized by a fluid rem engine that sets `html { font-size: ... }`
 * from custom properties on `:root`. `rem` always resolves against the root
 * element, so that rule cannot be scoped into a descendant without rewriting
 * every length in the file. Instead the root selectors become
 * `html:has(.lp-page)` - still the root element, but matching only on a page
 * that actually contains a landing page. `:has()` is baseline in every browser
 * these pages will see.
 *
 * Specificity rises by exactly one class for every landing-page rule, uniformly,
 * so the cascade *within* the subtree is unchanged - and the landing-page rules
 * now outrank the site's own rules on the same class names, which is what we
 * want inside `.lp-page`.
 */

/** Split a selector list on top-level commas only (not inside :is(), [attr], strings). */
export function splitSelectors(list) {
  const out = [];
  let depth = 0, quote = null, buf = "";
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (quote) {
      buf += c;
      if (c === quote && list[i - 1] !== "\\") quote = null;
      continue;
    }
    if (c === '"' || c === "'") { quote = c; buf += c; continue; }
    if (c === "(" || c === "[") depth++;
    if (c === ")" || c === "]") depth--;
    if (c === "," && depth === 0) { out.push(buf); buf = ""; continue; }
    buf += c;
  }
  if (buf.trim()) out.push(buf);
  return out;
}

/** Length of the first compound selector (`html.w-mod-js` -> 13, `:root` -> 5). */
const firstCompoundEnd = (sel) => {
  let depth = 0;
  for (let i = 0; i < sel.length; i++) {
    const c = sel[i];
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (depth === 0 && (c === " " || c === ">" || c === "+" || c === "~")) return i;
  }
  return sel.length;
};

export function scopeSelector(sel, scope) {
  const s = sel.trim();
  if (!s) return s;

  // Webflow ships `html`/`:root` rules that set the fluid root font-size and the
  // custom properties feeding it. These must stay on the root element.
  if (/^(:root|html)\b/.test(s)) {
    const end = firstCompoundEnd(s);
    const head = s.slice(0, end).replace(/^:root/, "html");
    return `${head}:has(${scope})${s.slice(end)}`;
  }

  // `body` IS the landing-page wrapper for our purposes:
  //   `body` -> `.lp-page`, `body.x` -> `.lp-page.x`, `body .y` -> `.lp-page .y`
  if (/^body\b/.test(s)) return s.replace(/^body/, scope);

  // A bare universal selector would otherwise become `.lp-page*`.
  if (s.startsWith("*")) return `${scope} ${s}`;

  return `${scope} ${s}`;
}

/** At-rules whose body is a plain declaration list, not nested rules. */
const FLAT_AT = /^@(font-face|page|property|counter-style|font-feature-values|viewport)\b/i;
/** At-rules whose body holds full rules that themselves need scoping. */
const NESTED_AT = /^@(media|supports|layer|container|scope)\b/i;

export function scopeCss(css, scope = ".lp-page") {
  let out = "";
  let i = 0;

  const readBlock = (start) => {
    // start points at `{`; return the index just past the matching `}`.
    let depth = 0, quote = null;
    for (let j = start; j < css.length; j++) {
      const c = css[j];
      if (quote) { if (c === quote && css[j - 1] !== "\\") quote = null; continue; }
      if (c === '"' || c === "'") { quote = c; continue; }
      if (c === "{") depth++;
      else if (c === "}") { depth--; if (depth === 0) return j + 1; }
    }
    return css.length;
  };

  while (i < css.length) {
    // Comments and whitespace pass straight through.
    if (css.startsWith("/*", i)) {
      const end = css.indexOf("*/", i + 2);
      const stop = end === -1 ? css.length : end + 2;
      out += css.slice(i, stop); i = stop; continue;
    }
    const brace = css.indexOf("{", i);
    if (brace === -1) { out += css.slice(i); break; }

    const prelude = css.slice(i, brace);
    const trimmed = prelude.trim();

    // Statement at-rules (@import, @charset) end at `;` before any `{`.
    const semi = css.indexOf(";", i);
    if (trimmed.startsWith("@") && semi !== -1 && semi < brace) {
      out += css.slice(i, semi + 1); i = semi + 1; continue;
    }

    const blockEnd = readBlock(brace);
    const body = css.slice(brace + 1, blockEnd - 1);

    if (trimmed.startsWith("@")) {
      if (NESTED_AT.test(trimmed)) {
        out += `${prelude}{${scopeCss(body, scope)}}`;
      } else if (FLAT_AT.test(trimmed) || /^@keyframes|^@-webkit-keyframes/i.test(trimmed)) {
        // @font-face declarations and keyframe stops are not selectors.
        out += `${prelude}{${body}}`;
      } else {
        out += `${prelude}{${body}}`;
      }
    } else {
      const scoped = splitSelectors(prelude)
        .map((s) => {
          const lead = s.match(/^\s*/)[0];
          return lead + scopeSelector(s, scope);
        })
        .join(",");
      out += `${scoped}{${body}}`;
    }
    i = blockEnd;
  }
  return out;
}
