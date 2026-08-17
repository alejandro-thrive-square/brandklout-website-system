// Reconcile the 301 map against the page set the design build actually has.
//
// WHY THIS EXISTS. The map was written against an eleven-page site, so it sent
// every URL the rebuild had dropped to the nearest surviving page. The design
// build has since grown to 28 pages, and a number of those dropped URLs are
// real pages again — /cosmetic-dentistry, /dental-conditions, /our-team,
// /financing, /patient-center and more. A redirect on a URL that is now a page
// does not degrade gracefully: it makes the page unreachable, and it is live
// right now (verified 2026-08-17: /video-gallery, /blog and /terms-conditions
// all return 200 serving a DIFFERENT page, while a genuinely unknown URL 404s).
//
// So this is not a one-off cleanup. Every time the build gains a page, a rule
// somewhere in this map may have become wrong, and the only safe way to know is
// to derive the answer from the built site rather than to remember.
//
// Usage: node reconcile.mjs [--write]
//   default    report only
//   --write    emit drnahlah-301-redirects.reconciled.csv next to the source
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CSV = path.join(HERE, "drnahlah-301-redirects.csv");
const SITE = path.resolve(HERE, "..", "..", "04-design", ".tmp", "final-site");
const WRITE = process.argv.includes("--write");

if (!fs.existsSync(SITE)) {
  console.error(`no built site at ${SITE} — run 04-design/.tmp/site-src/build-site.mjs first`);
  process.exit(1);
}

/* The slugs the new site serves. index.html is "/". */
const slugs = new Set(
  fs.readdirSync(SITE)
    .filter((f) => f.endsWith(".html") && !f.startsWith("_"))
    .map((f) => (f === "index.html" ? "/" : "/" + f.replace(/\.html$/, ""))),
);

/* Old URLs the rebuild kept but renamed. These stay redirects — the URL really
   is gone — but the target has to be the page that now holds that content,
   not whatever the eleven-page site had to settle for. Same-name matches are
   detected automatically above; these are the ones only a human knows. */
const RENAMED = {
  "/our-dental-facility": "/our-facility",
  "/dental-crowns-and-bridges": "/crowns-and-bridges",
  // The two survey confirmations were the same 978 words under two slugs, and
  // both now have a real destination instead of being dropped onto a treatment
  // page that does not mention the form the visitor just submitted.
  "/veneer-survey-thank-you": "/thank-you",
  "/implant-survey-thank-you": "/thank-you",
};

const rows = fs.readFileSync(CSV, "utf8").trim().split(/\r?\n/);
const header = rows.shift();

const keep = [];
const nowAPage = [];   // old path is a real page again -> the rule must go
const repoint = [];    // old path renamed -> target should change
const deadTarget = []; // rule points at something the site does not have

for (const line of rows) {
  const i = line.lastIndexOf(",");
  const from = line.slice(0, i).trim();
  const to = line.slice(i + 1).trim();

  // Wildcards cannot be checked against a page list; leave them alone.
  const wild = /[(*]/.test(from);

  if (!wild && slugs.has(from)) {
    nowAPage.push({ from, to });
    continue;                       // drop the rule
  }
  if (RENAMED[from] && RENAMED[from] !== to) {
    repoint.push({ from, to, should: RENAMED[from] });
    keep.push(`${from},${RENAMED[from]}`);
    continue;
  }
  if (!slugs.has(to)) deadTarget.push({ from, to });
  keep.push(line);
}

console.log(`site serves ${slugs.size} pages`);
console.log(`map has ${rows.length} rules\n`);

console.log(`--- ${nowAPage.length} rules to REMOVE: the old URL is a real page again ---`);
console.log(`    Live now, these hide the new page behind the redirect target.`);
for (const r of nowAPage) console.log(`  ${r.from.padEnd(32)} currently -> ${r.to}`);

console.log(`\n--- ${repoint.length} rules to RE-POINT: the URL is gone, but the content moved ---`);
for (const r of repoint) console.log(`  ${r.from.padEnd(32)} ${r.to}  ->  ${r.should}`);

console.log(`\n--- ${deadTarget.length} rules pointing at a page the build does not have ---`);
const byTarget = new Map();
for (const r of deadTarget) byTarget.set(r.to, (byTarget.get(r.to) || 0) + 1);
for (const [to, n] of [...byTarget.entries()].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(n).padStart(4)} rules -> ${to}`);
}

if (WRITE) {
  const out = path.join(HERE, "drnahlah-301-redirects.reconciled.csv");
  fs.writeFileSync(out, [header, ...keep].join("\n") + "\n");
  console.log(`\nwrote ${path.basename(out)} — ${keep.length} rules (was ${rows.length})`);
} else {
  console.log(`\n(report only; pass --write to emit the reconciled CSV)`);
}
