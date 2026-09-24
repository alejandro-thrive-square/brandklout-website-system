/**
 * Gives every one of the fifty-seven published pages its own meta description,
 * canonical and share card, as `brandklout.open-graph` per-page overrides.
 *
 *   node populate-seo.mjs --dry-run     print the table and the source of each
 *   node populate-seo.mjs               write the overrides
 *
 * WHY OVERRIDES AND NOT THE PAGE ROW. The plugin prefers a page's own
 * `seoDescription` cell and only falls back to an override. This site's `pages`
 * table has no such cell: `GET /admin/api/cms/pages` returns rows whose cells
 * are exactly `title, slug, body`, and 0 of 57 carry a description. Adding a
 * column to the content table to hold a string the plugin already has a place
 * for would be the wrong end of the problem; the override store is the
 * designed mechanism and needs no schema change.
 *
 * WHERE EACH DESCRIPTION COMES FROM, in order:
 *   1. `local`  - the eleven core pages have a hand-written <meta name=
 *                 "description"> in home/<slug>/index.html. Authoritative.
 *   2. `mirror` - the forty-six migrated pages were WordPress pages with their
 *                 own descriptions, and workflow 01's mirror still has them
 *                 (39 of the 40 index.html files it recovered carry one).
 *                 These are the PRACTICE'S OWN words, which is why they are
 *                 preferred over anything generated.
 *   3. `derived`- last resort: the page's own first real paragraph, live,
 *                 trimmed on a word boundary. Still the page's own words; just
 *                 nobody wrote them as a description.
 * A page that reaches none of the three is reported and skipped rather than
 * given an invented sentence.
 *
 * Re-running is idempotent: an override whose description and url already
 * match is left alone.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";
import { api, getPages, BASE } from "./insta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HOME = path.resolve(HERE, "..", "home");
const MIRROR = path.resolve(HERE, "..", "..", "01-site-recovery", ".tmp", "recovered", "mirror");
const CHROME = process.env.CHROME_PATH || "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const SITE = "https://masonparkpediatricdental.com"; // 2026-09-24 launch (was pediatricdentistkatytx.com)
const DRY = process.argv.includes("--dry-run");
const MAX = 158; // what Google renders before it truncates

const decode = (s) =>
  s
    .replace(/&#0?39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"').replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&#8217;/g, "\u2019").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();

const metaFrom = (file) => {
  if (!fs.existsSync(file)) return null;
  const html = fs.readFileSync(file, "utf8");
  // Capture the DELIMITER and stop at that delimiter only. `[^"']+` looks
  // right and is not: it also stops at the first apostrophe, so
  // "Your child's first visit ..." came back as "Your child".
  const m = /<meta\s+name=["']description["']\s+content=(["'])([\s\S]*?)\1/i.exec(html);
  return m ? decode(m[2]) : null;
};

/* The local file a live slug is built from.
   2026-09-09: this was a hand-written table of the ELEVEN core routes, and the
   other forty-six therefore fell through to the mirror or to a derived
   sentence even after they had local source of their own. Every page has a
   local file now, so the mapping is just the path - which also means a page
   added later is picked up without anybody remembering to add a row.
   The home page is the one route whose slug is not its path: its row slug on
   this instance is "index", not "", and keying on "" left it deriving. */
const localFile = (slug) =>
  slug && slug !== "index"
    ? path.join(HOME, ...slug.split("/"), "index.html")
    : path.join(HOME, "index.html");

const rows = (await getPages()).rows ?? [];
console.log(`${BASE}: ${rows.length} page(s)`);

const plan = [];
for (const r of rows) {
  const slug = String(r.slug ?? "").replace(/^\/+|\/+$/g, "");
  let description = null;
  let source = null;

  const local = localFile(slug);
  if (fs.existsSync(local)) {
    description = metaFrom(local);
    if (description) source = "local";
  }
  if (!description) {
    // The mirror keeps a WordPress page at <slug>/index.html, and the site
    // root at index.html - so the home row's "index" slug maps to the root
    // here too, not to a directory called "index".
    const rel = slug && slug !== "index" ? path.join(...slug.split("/"), "index.html") : "index.html";
    description = metaFrom(path.join(MIRROR, rel));
    if (description) source = "mirror";
  }
  plan.push({ slug, id: r.id, title: r.cells?.title ?? "", description, source });
}

/* Anything still without one gets the page's own opening paragraph, read off
   the live page. One browser, one pass. */
const need = plan.filter((p) => !p.description);
if (need.length) {
  const browser = await chromium.launch({ executablePath: CHROME });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  for (const p of need) {
    try {
      await page.goto(`${BASE}/${p.slug}`, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForTimeout(500);
      const text = await page.evaluate(() => {
        // The page's OWN opening argument, which means the article column and
        // nothing else. The migrated template puts a "Book your child's visit"
        // card in a sidebar inside <main>, and taking the first paragraph in
        // document order handed that card's copy to the accessibility
        // statement - a description that describes the furniture.
        const scope = document.querySelector("main, .main-wrapper, article") ?? document.body;
        const ps = Array.from(scope.querySelectorAll("p")).filter(
          (el) => !el.closest("aside, nav, footer, header, .sidebar_component, .callbar_component, .breadcrumb_component"),
        );
        const ok = [];
        for (const el of ps) {
          const s = (el.textContent || "").replace(/\s+/g, " ").trim();
          if (s.length < 60 || /^(home|menu|skip)\b/i.test(s)) continue;
          ok.push(s);
        }
        if (!ok.length) return "";
        // A paragraph that swallowed its own heading reads "GeneralMason Park
        // Family Dental strives ..." - a lowercase letter butted against a
        // capital. Prefer one without that; if the only candidate has it near
        // the start, put the space back rather than throwing the sentence away.
        const clean = ok.find((s) => !/[a-z][A-Z]/.test(s));
        if (clean) return clean;
        return ok[0].replace(/^(.{0,24}?[a-z])([A-Z])/, "$1 $2");
      });
      if (text) { p.description = text; p.source = "derived"; }
    } catch (e) {
      console.error(`  could not read /${p.slug}: ${String(e.message).slice(0, 80)}`);
    }
  }
  await browser.close();
}

// Trim on a word boundary; never mid-word, never with a dangling comma.
const trim = (s) => {
  if (!s) return s;
  s = s.replace(/\s+/g, " ").trim();
  if (s.length <= MAX) return s;
  const cut = s.slice(0, MAX);
  const at = Math.max(cut.lastIndexOf(" "), 0);
  return cut.slice(0, at).replace(/[,;:\-\u2013\u2014]+$/, "").trim() + "...";
};

let written = 0, same = 0, missing = 0;
for (const p of plan) {
  if (!p.description) { missing++; console.log(`  NONE   /${p.slug}`); continue; }
  const description = trim(p.description);
  // The home row's slug is "index"; its canonical is the site root, not
  // /index/. Every other slug is its own path.
  const url = `${SITE}/${p.slug && p.slug !== "index" ? p.slug + "/" : ""}`;
  console.log(`  ${p.source.padEnd(7)} /${(p.slug || "(home)").padEnd(45)} ${description.slice(0, 70)}`);
  if (DRY) continue;
  try {
    await api("POST", "/admin/api/cms/plugins/brandklout.open-graph/runtime/override", {
      key: p.slug, description, url, enabled: true,
    });
    written++;
  } catch (e) {
    console.error(`  FAILED /${p.slug}: ${String(e.message).slice(0, 200)}`);
  }
}

const bySource = {};
for (const p of plan) bySource[p.source ?? "none"] = (bySource[p.source ?? "none"] ?? 0) + 1;
console.log(`\nsources: ${Object.entries(bySource).map(([k, v]) => `${k} ${v}`).join(", ")}`);
console.log(DRY ? "dry run - nothing written" : `${written} override(s) written, ${same} unchanged, ${missing} with no description`);
if (missing) process.exitCode = 1;
