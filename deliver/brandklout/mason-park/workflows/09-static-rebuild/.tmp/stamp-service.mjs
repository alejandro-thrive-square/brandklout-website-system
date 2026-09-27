// Stamp a NEW treatment page under home/services/<slug>/ from the Invisalign
// page's chrome, then splice in an authored <main> and expand its {{img}}
// macros.
//
// The README's rule is that the chrome (head, topbar, header, footer, the six
// script tags) is stamped and identical on every page, and only the chapter
// bodies are authored. The original stamper was deliberately left out of the
// repo when there were eleven pages and `home/<slug>/index.html` became the
// source. Thirty more treatment pages is the case it said to write a new one
// for.
//
// Every treatment page sits at the same depth as the Invisalign page
// (home/services/<slug>/), so the ../../ asset prefix is already correct and
// nothing in the chrome needs rewriting except the page's own head fields and
// the last breadcrumb crumb.
//
//   node stamp-service.mjs <spec.json> <body.main.html>
//
// spec.json:
//   { "slug": "dental-crowns",
//     "title": "Dental Crowns in Katy, TX | Mason Park Dental",
//     "description": "...",
//     "crumb": "Crowns",
//     "faq": [ { "q": "...", "a": "..." } ] }     // faq optional
//
// A page with no `faq` gets no FAQPage block: a schema block asserting
// questions the page does not answer is a lie to a search engine.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOME = path.join(HERE, "..", "home");
const TEMPLATE = path.join(HOME, "services", "invisalign", "index.html");
const SITE = "https://bestdentistinkatytx.com";

const [specPath, bodyPath] = process.argv.slice(2);
if (!specPath || !bodyPath) {
  console.error("usage: node stamp-service.mjs <spec.json> <body.main.html>");
  process.exit(2);
}

const spec = JSON.parse(fs.readFileSync(path.resolve(specPath), "utf8"));
for (const k of ["slug", "title", "description", "crumb"]) {
  if (!spec[k]) throw new Error("spec is missing " + k);
}
const url = `${SITE}/services/${spec.slug}/`;

const main = fs.readFileSync(path.resolve(bodyPath), "utf8").trim();
if (!main.startsWith("<main") || !main.endsWith("</main>"))
  throw new Error("body file must start with <main and end with </main>");

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

let html = fs.readFileSync(TEMPLATE, "utf8");

// --- head -----------------------------------------------------------------
html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(spec.title)}</title>`);
html = html.replace(
  /<meta name="description" content="[^"]*">/,
  `<meta name="description" content="${esc(spec.description)}">`,
);
html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);
html = html.replace(
  /<meta property="og:title" content="[^"]*">/,
  `<meta property="og:title" content="${esc(spec.title)}">`,
);
html = html.replace(
  /<meta property="og:description" content="[^"]*">/,
  `<meta property="og:description" content="${esc(spec.description)}">`,
);
html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${url}">`);

// BreadcrumbList: only the third item moves.
html = html.replace(/(<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"BreadcrumbList")[\s\S]*?(<\/script>)/, (_m, open, close) => {
  const ld = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Services", item: `${SITE}/our-services/` },
      { "@type": "ListItem", position: 3, name: spec.crumb, item: url },
    ],
  };
  return `<script type="application/ld+json">${JSON.stringify(ld)}${close}`;
});

// FAQPage: replaced when the spec carries one, dropped outright when it does not.
const faqRe = /\n?<script type="application\/ld\+json">\{"@context":"https:\/\/schema\.org","@type":"FAQPage"[\s\S]*?<\/script>/;
if (Array.isArray(spec.faq) && spec.faq.length) {
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: spec.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  html = html.replace(faqRe, `\n<script type="application/ld+json">${JSON.stringify(ld)}</script>`);
} else {
  html = html.replace(faqRe, "");
}

// --- body -----------------------------------------------------------------
const a = html.indexOf("<main");
const b = html.indexOf("</main>");
if (a < 0 || b < 0) throw new Error("no <main> in the template");
html = html.slice(0, a) + main + html.slice(b + "</main>".length);

const out = path.join(HOME, "services", spec.slug, "index.html");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);

execFileSync(process.execPath, [path.join(HERE, "expand-img.mjs"), out], { stdio: "inherit" });

// The breadcrumb crumb lives in the authored body, not the chrome, so it is
// asserted rather than rewritten: a page that shows "Invisalign" over copy
// about crowns is the kind of thing a stamper is supposed to make impossible.
const stamped = fs.readFileSync(out, "utf8");
if (!stamped.includes(`<span class="breadcrumb_item">${spec.crumb}</span>`))
  console.warn(`  ! ${spec.slug}: the body's last breadcrumb crumb is not "${spec.crumb}"`);

console.log("stamped services/" + spec.slug + "/index.html");
