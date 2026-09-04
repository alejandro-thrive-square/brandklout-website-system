// Pulls the archived Stone Surgical Arts pages out of the Wayback Machine as
// plain text, so the Surgical Arts rebuild can be written from the practice's
// own published copy rather than invented.
//
// The old site was WordPress (built by NKP Medical). The chrome — nav, footer,
// sidebars, the NKP banner — repeats on every page and is worthless here, so
// the extractor keeps only the main content region and strips scripts, styles
// and navigation before flattening to text.
//
// Usage: node fetch-archive.mjs [--only <substring>]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "pages");
fs.mkdirSync(OUT, { recursive: true });

// 2026-05-13 is the capture Gabby linked in Slack; Wayback resolves to the
// nearest snapshot per URL, so a page archived only in 2023 still comes back.
const STAMP = "20260513224347";

const PATHS = [
  "/",
  "/about-us",
  "/about-us/about-facial-surgeon-southlake",
  "/about-us/facial-surgery-media-articles-southlake",
  "/contact-facial-surgeon-southlake",
  "/contact-information",
  "/pricing",
  "/patient-resources/pricing",
  "/testimonials",
  "/financing",
  "/patient-resources/financing",
  "/patient-resources/financing/cherry-financing",
  "/patient-resources/crisalix",
  "/patient-resources",
  "/patient-resources/request-consultation",
  "/before-after",
  "/before-after/surgical",
  "/before-after/non-surgical",
  "/facial-surgery-southlake",
  "/cosmetic-facial-surgery-southlake",
  "/cosmetic-facial-surgery-southlake/blepharoplasty",
  "/cosmetic-facial-surgery-southlake/botox-xeomin",
  "/cosmetic-facial-surgery-southlake/buccal-fat-removal",
  "/cosmetic-facial-surgery-southlake/chin-sculpting-reshaping",
  "/cosmetic-facial-surgery-southlake/eyelid-lifting",
  "/cosmetic-facial-surgery-southlake/facelift-easy-lift",
  "/cosmetic-facial-surgery-southlake/facetite",
  "/cosmetic-facial-surgery-southlake/facial-fat-transfer",
  "/cosmetic-facial-surgery-southlake/facial-fillers",
  "/cosmetic-facial-surgery-southlake/facial-implants",
  "/cosmetic-facial-surgery-southlake/fat-transfer",
  "/cosmetic-facial-surgery-southlake/hydrafacial-md",
  "/cosmetic-facial-surgery-southlake/male-facial-enhancement",
  "/cosmetic-facial-surgery-southlake/morpheus8",
  "/cosmetic-facial-surgery-southlake/myellevate-facelift",
  "/cosmetic-facial-surgery-southlake/neck-lift",
  "/cosmetic-facial-surgery-southlake/neck-liposuction",
  "/cosmetic-facial-surgery-southlake/skin-lesion-removal",
  "/skin-treatments-southlake",
  "/skin-treatments-southlake/botox-xeomin",
  "/skin-treatments-southlake/chemical-peels",
  "/skin-treatments-southlake/co2-laser-skin-resurfacing",
  "/skin-treatments-southlake/dermal-fillers",
  "/skin-treatments-southlake/dysport-and-jeuveau",
  "/skin-treatments-southlake/facial-fillers",
  "/skin-treatments-southlake/hair-restoration",
  "/skin-treatments-southlake/morpheus8",
  "/skin-treatments-southlake/prp-treatment",
  "/skin-treatments-southlake/regenerative-therapy",
  "/patient-resources/pre-op-post-op-instructions",
  "/patient-resources/pre-op-post-op-instructions/before-intravenous-anesthesia-sedation",
  "/patient-resources/pre-op-post-op-instructions/facial-plastic-surgery-non-surgical-procedures-post-op",
  "/patient-resources/online-referral",
  "/about-facial-surgeon-southlake",
  "/before-after/surgical/blepharoplasty",
  "/before-after/non-surgical/lip-fillers",
];

const slug = (p) =>
  (p === "/" ? "home" : p.replace(/^\//, "").replace(/\//g, "--")) + ".txt";

function textFrom(html) {
  let s = html;
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  s = s.replace(/<(script|style|noscript|svg|iframe)\b[\s\S]*?<\/\1>/gi, " ");
  // Wayback injects its own toolbar markup; it is always in these wrappers.
  s = s.replace(/<div id="wm-ipp[\s\S]*?<\/div>\s*<\/div>/gi, " ");
  s = s.replace(/<(header|footer|nav|aside)\b[\s\S]*?<\/\1>/gi, " ");
  // Keep block boundaries as newlines so headings do not run into body copy.
  s = s.replace(/<\/(p|div|section|li|h[1-6]|tr|br|td)>/gi, "\n");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<h([1-6])[^>]*>/gi, "\n\n## ");
  s = s.replace(/<li[^>]*>/gi, "\n- ");
  s = s.replace(/<[^>]+>/g, " ");
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;|&rsquo;/g, "’")
    .replace(/&#8216;|&lsquo;/g, "‘")
    .replace(/&#8220;|&ldquo;/g, "“")
    .replace(/&#8221;|&rdquo;/g, "”")
    .replace(/&#8211;|&ndash;/g, "–")
    .replace(/&#8212;|&mdash;/g, "—")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  s = s.replace(/[ \t ]+/g, " ");
  s = s.replace(/\n{3,}/g, "\n\n");
  s = s
    .split("\n")
    .map((l) => l.trim())
    .filter((l, i, a) => l.length || (i && a[i - 1].length))
    .join("\n");
  return s.trim();
}

const only = process.argv.includes("--only")
  ? process.argv[process.argv.indexOf("--only") + 1]
  : null;

const log = [];
for (const p of PATHS) {
  if (only && !p.includes(only)) continue;
  const file = path.join(OUT, slug(p));
  if (fs.existsSync(file) && fs.statSync(file).size > 400) {
    log.push(`skip  ${p}`);
    continue;
  }
  const url = `https://web.archive.org/web/${STAMP}/https://stonesurgicalarts.com${p}`;
  let ok = false;
  for (let attempt = 0; attempt < 3 && !ok; attempt++) {
    try {
      const r = await fetch(url, {
        headers: { "user-agent": "Mozilla/5.0 (content recovery for the site owner)" },
        redirect: "follow",
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const html = await r.text();
      const txt = textFrom(html);
      fs.writeFileSync(file, `SOURCE: stonesurgicalarts.com${p}\n\n${txt}\n`, "utf8");
      log.push(`ok    ${p}  ${txt.length}b`);
      ok = true;
    } catch (e) {
      if (attempt === 2) log.push(`FAIL  ${p}  ${e.message}`);
      else await new Promise((r) => setTimeout(r, 2500 * (attempt + 1)));
    }
  }
  await new Promise((r) => setTimeout(r, 900));
}
fs.writeFileSync(path.join(HERE, "fetch-log.txt"), log.join("\n") + "\n", "utf8");
console.log(log.join("\n"));
