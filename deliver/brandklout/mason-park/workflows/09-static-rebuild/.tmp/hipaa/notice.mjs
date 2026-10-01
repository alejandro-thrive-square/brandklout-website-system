// The HIPAA Disclosure's body: the HHS model Notice of Privacy Practices exactly as the agency's
// Webflow sites carry it (hhs-notice-reference-stone.html, fetched from
// stonedentalimplantcenter.com/hipaa-disclosure 2026-10-01), with only the practice-specific
// parts swapped. One source for both the local page (build-hipaa-page.mjs) and the live row
// (add-hipaa-page.mjs).
//
// Entity: "Mason Park Dental PLLC", as this site's own Terms of Service and Privacy Policy state it
// ("Mason Park Dental PLLC DBA Mason Park Dental of Katy"). One location: 21830 Kingsland Blvd #104A.
// Mason Park Dental for Kids is a separate site with its own policy and is not covered here.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const ENTITY = "Mason Park Dental PLLC";
export const PRACTICE = "Mason Park Dental of Katy";
export const EFFECTIVE = "October 1, 2026"; // the notice's own format, as briefed
export const EFFECTIVE_HOUSE = "1 October 2026"; // this site's format, for the page furniture
export const TITLE = `HIPAA Disclosure | ${PRACTICE}`;
export const DESCRIPTION = `HIPAA Notice of Privacy Practices for ${PRACTICE}, effective ${EFFECTIVE_HOUSE}: how your health information may be used and shared, and your rights.`;
export const SLUG = "hipaa-disclosure";

const NBSP = String.fromCharCode(160); // the reference has one after "Effective Date:"; kept verbatim
const SWAPS = [
  [`<strong>Effective Date:</strong>${NBSP}September 28, 2026`, `<strong>Effective Date:</strong>${NBSP}${EFFECTIVE}`],
  [
    "This Notice of Privacy Practices applies to Stone Surgical Arts PLLC (“Stone Dental Implant Center,” “we,” “us,” or “our”).",
    `This Notice of Privacy Practices applies to ${ENTITY} (“${PRACTICE},” “we,” “us,” or “our”).`,
  ],
  [
    "<p><strong>Stone Surgical Arts PLLC</strong><br/>72 Andorra Dr, Suite 110A<br/>Westlake, TX 76262<br/>Phone: (817) 383-8361<br/>Email: info@stonesurgicalarts.com</p>",
    `<p><strong>${ENTITY}</strong><br/>d/b/a ${PRACTICE}<br/>21830 Kingsland Blvd #104A<br/>Katy, TX 77450<br/>Phone: (281) 769-8878<br/>Email: office@masonparkdental.com<br/>Website: www.masonparkdental.com</p>`,
  ],
];

export function noticeHtml() {
  let html = fs.readFileSync(path.join(HERE, "hhs-notice-reference-stone.html"), "utf8");
  html = html.replace(/<!--[\s\S]*?-->\s*/g, "").trim();
  for (const [from, to] of SWAPS) {
    if (html.split(from).length !== 2) throw new Error(`reference text not found exactly once: ${from.slice(0, 60)}`);
    html = html.replace(from, to);
  }
  html = html.replace(/^<article>/, "").replace(/<\/article>$/, "");
  // This site's list class (the Privacy Policy's lists are .lf-ticks too).
  html = html.replaceAll('<ul role="list">', '<ul class="lf-ticks">');
  const left = html.match(/Stone|Westlake|Andorra|817|stonesurgical/gi);
  if (left) throw new Error(`reference practice details left in the notice: ${[...new Set(left)].join(", ")}`);
  return html;
}

// Parse the notice's small HTML subset (p h2 h3 ul li strong em a br, no attributes but
// href/class) into a tree: {tag, attrs, children} | {text}.
export function parse(html) {
  const root = { tag: "#root", attrs: {}, children: [] };
  const stack = [root];
  const re = /<(\/?)([a-z0-9]+)((?:\s+[a-z-]+="[^"]*")*)\s*(\/?)>|([^<]+)/gi;
  let m;
  while ((m = re.exec(html))) {
    const top = stack[stack.length - 1];
    if (m[5] !== undefined) { top.children.push({ text: m[5] }); continue; }
    const [, close, tag, attrStr, selfClose] = m;
    if (close) {
      if (top.tag !== tag) throw new Error(`unbalanced </${tag}> inside <${top.tag}>`);
      stack.pop();
      continue;
    }
    const attrs = Object.fromEntries([...attrStr.matchAll(/([a-z-]+)="([^"]*)"/gi)].map((a) => [a[1], a[2]]));
    const el = { tag, attrs, children: [] };
    top.children.push(el);
    if (!selfClose && tag !== "br") stack.push(el);
  }
  if (stack.length !== 1) throw new Error("unclosed element in notice");
  return root.children;
}

// Instatic nodes in the shape the converter produced for the Privacy Policy:
//   element holding only text  -> base.text  {tag: p|h2|h3}       (li/strong/em: container > text)
//   element with mixed content -> base.container {tag: "custom", customTag}
//   <ul class=..>              -> base.container {tag: "ul"} with classIds
//   inline text                -> base.text {tag: "none"};  <a> -> base.link;  <br> -> custom br
// Every node carries children: [] (production's validator 400s one without it).
export function toNodes(tree, parentId, newId) {
  const nodes = {};
  const make = (moduleId, props, parent, classIds = []) => {
    const n = { id: newId(), moduleId, props: { ...props, htmlAttributes: {} }, breakpointOverrides: {}, children: [], classIds, parentId: parent };
    nodes[n.id] = n;
    return n;
  };
  const TEXT_TAGS = new Set(["p", "h2", "h3"]);
  const walk = (item, parent) => {
    if (item.text !== undefined) return make("base.text", { text: item.text, tag: "none" }, parent).id;
    const { tag, attrs, children } = item;
    const classIds = attrs.class ? attrs.class.split(/\s+/) : [];
    if (tag === "a") {
      const text = children.map((c) => c.text ?? "").join("");
      return make("base.link", { href: attrs.href, text, target: "_self" }, parent, classIds).id;
    }
    if (tag === "br") return make("base.container", { tag: "custom", customTag: "br" }, parent).id;
    if (TEXT_TAGS.has(tag) && children.length === 1 && children[0].text !== undefined) {
      return make("base.text", { text: children[0].text, tag }, parent, classIds).id;
    }
    const el = tag === "ul"
      ? make("base.container", { tag: "ul", customTag: "" }, parent, classIds)
      : make("base.container", { tag: "custom", customTag: tag }, parent, classIds);
    el.children = children.map((c) => walk(c, el.id));
    return el.id;
  };
  const top = tree.map((t) => walk(t, parentId));
  return { nodes, top };
}
