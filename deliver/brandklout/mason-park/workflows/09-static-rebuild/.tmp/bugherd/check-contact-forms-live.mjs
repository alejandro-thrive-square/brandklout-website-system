// Gate for the 2026-09-25 contact-forms change, against one instance:
//   node bugherd/check-contact-forms-live.mjs https://staging.masonparkdental.com > out.txt
// Page list: every row of the newest backup for that host plus every article
// (never a hardcoded list). Checks: no Flexbook href anywhere; /contacts has
// exactly two sections (arrival + form) and only the Contact form; each ad page
// with a form carries its campaign's site form and no Google Ads form.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const HERE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const base = (process.argv[2] ?? "").replace(/\/$/, "");
const host = new URL(base).host;
const backup = fs.readdirSync(HERE).filter((f) => f.startsWith(`backup-${host}-`)).sort().pop();
const rows = JSON.parse(fs.readFileSync(path.join(HERE, backup), "utf8")).pages;
const slugs = rows.map((r) => r.cells.slug).filter((s) => s && s !== "blog-article" && s !== "404");
const articles = JSON.parse(fs.readFileSync(path.join(HERE, "blog", "cms-rows.json"), "utf8")).map((r) => `blog/${r.slug ?? r.cells?.slug}`);
const urls = [...slugs.map((s) => (s === "index" ? "/" : `/${s}`)), ...articles.map((s) => `/${s}`)];
const FORMS = { contact: "JuzM9SxuJMPDMwfO6cgj", invisalign: "jRr3J74MVYjrYAsp4zZD", np: "jEXtvRc1ObkKd1QvmSGn" };
const OLD = ["YbX91GhEDKkCN4GH4gka", "AFu5BpJpMjgSnSf8yybc"];
const problems = [];
let n = 0, withBook = 0;
const queue = [...urls];
async function worker() {
  while (queue.length) {
    const u = queue.shift();
    const res = await fetch(base + u + (u.endsWith("/") ? "" : "/"), { redirect: "follow" });
    const h = await res.text();
    n++;
    if (res.status !== 200) { problems.push(`${u}: HTTP ${res.status}`); continue; }
    // Links only: the cookie and privacy policies name FlexBook as a service in their text.
    const fb = h.match(/href="[^"]*flexbook[^"]*"/gi);
    if (fb) problems.push(`${u}: ${fb.length} Flexbook link(s)`);
    // Instatic publishes "/contacts/" as "/contacts".
    if (/href="\/contacts\/?"/.test(h)) withBook++;
    if (u.startsWith("/ads-landing-pages/")) {
      for (const o of OLD) if (h.includes(o)) problems.push(`${u}: still carries Google Ads form ${o}`);
      const want = /consultation$|invisalign$|new-patient-special$/.test(u) ? (u.includes("invisalign") ? FORMS.invisalign : FORMS.np) : null;
      if (want && !h.includes(`data-form-id="${want}"`)) problems.push(`${u}: missing form ${want}`);
    }
    // The six root Webflow-port ad pages (workflow 10) mirror Webflow: their footer
    // links a Patient_Privacy_Policy.pdf on Webflow's CDN, the thank-you pages none.
    const webflowPort = /^\/(invisalign|new-patient-special)(-consultation|-thank-you)?$|^\/new-patient-thank-you$/.test(u);
    if (!webflowPort && !/href="\/privacy-policy\/?"/.test(h)) problems.push(`${u}: no Privacy Policy link`);
    if (u === "/privacy-policy") {
      const n = (h.match(/class="faq_item"/g) ?? []).length;
      if (n !== 13) problems.push(`/privacy-policy: ${n} policy sections, want 13 (still the old page?)`);
    }
    if (u === "/contacts") {
      const main = h.slice(h.indexOf("<main"), h.indexOf("</main>"));
      const sections = (main.match(/<section\b/g) ?? []).length;
      if (sections !== 2) problems.push(`/contacts: ${sections} sections in <main>, want 2`);
      if (!h.includes(`data-form-id="${FORMS.contact}"`)) problems.push(`/contacts: Contact form ${FORMS.contact} missing`);
      for (const id of [FORMS.invisalign, FORMS.np, ...OLD]) if (h.includes(id)) problems.push(`/contacts: carries another form ${id}`);
    }
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
console.log(`${base}: ${n} URLs, ${withBook} link to /contacts/, ${problems.length} problem(s)`);
for (const p of problems) console.log("  " + p);
