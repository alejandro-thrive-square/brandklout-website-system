// Builds the human-readable side of the scrape: manifest.csv (every asset, where
// it came from, where it landed) plus INVENTORY.md (pages, media by type, the
// biggest files, external embeds and anything that failed).
//
//   node report.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const STATE = path.join(HERE, ".state");
const read = (f, d) => {
  try {
    return JSON.parse(fs.readFileSync(path.join(STATE, f), "utf8"));
  } catch {
    return d;
  }
};

const pages = read("pages.json", []);
const results = read("download-results.json", []);
const iframes = read("iframes.json", []);

const KIND = [
  [/\.(jpe?g|png|gif|webp|avif|bmp|ico)(\?|$)/i, "image"],
  [/\.svg(\?|$)/i, "svg"],
  [/\.(mp4|webm|ogv|mov|m4v|avi)(\?|$)/i, "video"],
  [/\.(mp3|wav|m4a|ogg|aac)(\?|$)/i, "audio"],
  [/\.(woff2?|ttf|otf|eot)(\?|$)/i, "font"],
  [/\.css(\?|$)/i, "css"],
  [/\.js(\?|$)/i, "js"],
  [/\.(pdf|docx?|xlsx?|pptx?|zip)(\?|$)/i, "document"],
  [/\.(json|xml|txt)(\?|$)/i, "data"],
];
const kindOf = (u, ctype = "") => {
  for (const [re, k] of KIND) if (re.test(u)) return k;
  if (/^image\/svg/.test(ctype)) return "svg";
  if (/^image\//.test(ctype)) return "image";
  if (/^video\//.test(ctype)) return "video";
  if (/^audio\//.test(ctype)) return "audio";
  if (/font/.test(ctype)) return "font";
  if (/css/.test(ctype)) return "css";
  if (/javascript/.test(ctype)) return "js";
  if (/pdf/.test(ctype)) return "document";
  return "other";
};

const rel = (p) => (p ? path.relative(HERE, p).replace(/\\/g, "/") : "");
const host = (u) => {
  try {
    return new URL(u).hostname;
  } catch {
    return "?";
  }
};

// ------------------------------------------------------------------ manifest
const rows = results.map((r) => ({
  url: r.url,
  kind: kindOf(r.url, r.ctype || ""),
  host: host(r.url),
  status: r.ok ? "ok" : `fail:${r.status || r.error}`,
  bytes: r.ok ? r.bytes || 0 : 0,
  local: r.ok ? rel(r.dest) : "",
  origin: r.origin || "",
  pages: (r.pages || []).filter((p) => p !== "(network-log)"),
}));

const csvCell = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = [
  ["url", "kind", "host", "status", "bytes", "local_path", "found_via", "used_on_count", "used_on"].join(","),
  ...rows
    .sort((a, b) => a.kind.localeCompare(b.kind) || b.bytes - a.bytes)
    .map((r) =>
      [r.url, r.kind, r.host, r.status, r.bytes, r.local, r.origin, r.pages.length, r.pages.join(" | ")]
        .map(csvCell)
        .join(",")
    ),
].join("\n");
fs.writeFileSync(path.join(HERE, "manifest.csv"), csv, "utf8");

// ----------------------------------------------------------------- inventory
const okRows = rows.filter((r) => r.status === "ok");
const byKind = new Map();
for (const r of okRows) {
  const e = byKind.get(r.kind) || { n: 0, bytes: 0 };
  e.n++;
  e.bytes += r.bytes;
  byKind.set(r.kind, e);
}
const mb = (b) => (b / 1048576).toFixed(2);
const kb = (b) => (b / 1024).toFixed(0);

const ownHost = okRows.filter((r) => /bestdentistinkatytx|masonparkdental/.test(r.host));
const thirdParty = okRows.filter((r) => !/bestdentistinkatytx|masonparkdental/.test(r.host));
const media = okRows.filter((r) => ["image", "svg", "video", "audio"].includes(r.kind));
const failures = rows.filter((r) => r.status !== "ok");
const goodPages = pages.filter((p) => !p.error);

const L = [];
L.push("# Site scrape — bestdentistinkatytx.com (Mason Park Dental)");
L.push("");
L.push(`Captured **${new Date().toISOString().slice(0, 10)}**. Full crawl of the live WordPress site, `);
L.push("rendered through real Chrome because SiteGround's proof-of-work bot wall returns a 202 stub to");
L.push("plain HTTP clients. Every page was scrolled to completion before harvesting so lazy images load.");
L.push("");
L.push("## Totals");
L.push("");
L.push("| | |");
L.push("| :--- | ---: |");
L.push(`| Pages crawled | ${goodPages.length} |`);
L.push(`| Distinct asset URLs seen | ${rows.length} |`);
L.push(`| Assets downloaded | ${okRows.length} |`);
L.push(`| Media files (image/svg/video/audio) | ${media.length} |`);
L.push(`| Total downloaded | ${mb(okRows.reduce((a, r) => a + r.bytes, 0))} MB |`);
L.push(`| From the practice's own domain | ${ownHost.length} files, ${mb(ownHost.reduce((a, r) => a + r.bytes, 0))} MB |`);
L.push(`| Third-party (CDN, fonts, widgets) | ${thirdParty.length} files, ${mb(thirdParty.reduce((a, r) => a + r.bytes, 0))} MB |`);
L.push(`| Failed | ${failures.length} |`);
L.push("");
L.push("## By type");
L.push("");
L.push("| Type | Files | Size |");
L.push("| :--- | ---: | ---: |");
for (const [k, e] of [...byKind].sort((a, b) => b[1].bytes - a[1].bytes)) {
  L.push(`| ${k} | ${e.n} | ${mb(e.bytes)} MB |`);
}
L.push("");
L.push("## Layout");
L.push("");
L.push("```");
L.push("site-scrape/");
L.push("├── pages/<slug>/rendered.html   # DOM after JS, per page");
L.push("│                 rendered.txt   # visible text");
L.push("│                 meta.json      # SEO, headings, phones, forms, JSON-LD, fonts");
L.push("├── assets/<host>/<path>          # every file, mirroring its live URL");
L.push("├── manifest.csv                  # url → local path, type, size, pages it appears on");
L.push("├── crawl.mjs / download.mjs / report.mjs");
L.push("└── .state/                       # crawl + download bookkeeping");
L.push("```");
L.push("");

// Largest media, which is what a rebuild actually reuses.
const topMedia = [...media].sort((a, b) => b.bytes - a.bytes).slice(0, 30);
L.push("## Largest media files");
L.push("");
L.push("| Size | Type | File | Pages |");
L.push("| ---: | :--- | :--- | ---: |");
for (const r of topMedia) {
  L.push(`| ${kb(r.bytes)} KB | ${r.kind} | \`${r.local}\` | ${r.pages.length} |`);
}
L.push("");

if (thirdParty.length) {
  const hosts = new Map();
  for (const r of thirdParty) {
    const e = hosts.get(r.host) || { n: 0, bytes: 0 };
    e.n++;
    e.bytes += r.bytes;
    hosts.set(r.host, e);
  }
  L.push("## Third-party hosts");
  L.push("");
  L.push("| Host | Files | Size |");
  L.push("| :--- | ---: | ---: |");
  for (const [h, e] of [...hosts].sort((a, b) => b[1].bytes - a[1].bytes)) {
    L.push(`| ${h} | ${e.n} | ${mb(e.bytes)} MB |`);
  }
  L.push("");
}

if (iframes.length) {
  L.push("## Embeds");
  L.push("");
  L.push("Iframe sources found in the DOM. Third-party embeds are recorded, not mirrored — the remote");
  L.push("player or map is not ours to download.");
  L.push("");
  L.push("| Source | Pages |");
  L.push("| :--- | ---: |");
  for (const f of iframes.sort((a, b) => b.pages.length - a.pages.length)) {
    L.push(`| \`${f.url.slice(0, 130)}\` | ${f.pages.length} |`);
  }
  L.push("");
}

L.push("## Pages");
L.push("");
L.push("| Slug | Title | Words | Images | Video |");
L.push("| :--- | :--- | ---: | ---: | ---: |");
for (const p of goodPages.sort((a, b) => a.slug.localeCompare(b.slug))) {
  L.push(`| \`${p.slug}\` | ${String(p.title || "").replace(/\|/g, "\\|").slice(0, 70)} | ${p.words} | ${p.imgCount} | ${p.videoCount} |`);
}
L.push("");

if (failures.length) {
  L.push("## Failures");
  L.push("");
  L.push("| Status | URL |");
  L.push("| :--- | :--- |");
  for (const f of failures.slice(0, 80)) L.push(`| ${f.status} | \`${f.url.slice(0, 140)}\` |`);
  if (failures.length > 80) L.push(`| … | ${failures.length - 80} more, see manifest.csv |`);
  L.push("");
}

const pageErrors = pages.filter((p) => p.error);
if (pageErrors.length) {
  L.push("## Pages that did not capture");
  L.push("");
  for (const p of pageErrors) L.push(`- \`${p.url}\` — ${p.error}`);
  L.push("");
}

L.push("## Version Control");
L.push("");
L.push("Follows [SYSTEM_RULES.md](../../../../../../../SYSTEM_RULES.md). The scripts, `manifest.csv`,");
L.push("this inventory and the per-page text/meta are committed; `assets/` and `rendered.html` are");
L.push("binary-heavy or huge and stay gitignored — re-run `node crawl.mjs && node download.mjs` to");
L.push("rebuild them.");
L.push("");

fs.writeFileSync(path.join(HERE, "INVENTORY.md"), L.join("\n"), "utf8");
console.log(`manifest.csv — ${rows.length} rows`);
console.log(`INVENTORY.md — ${goodPages.length} pages, ${okRows.length} assets, ${media.length} media`);
