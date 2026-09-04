// Second pass over the archive fetch.
//
// fetch-archive.mjs pins one snapshot timestamp (20260513224347) for every URL
// and lets Wayback resolve the nearest capture. Eleven pages came back as
// ~80-byte stubs that way, and the "closest" snapshot is no better: the site's
// 2026 captures are all a bot-challenge interstitial ("One moment, please…"),
// archived with status 200 at ~5 KB. The real pages are in the older captures.
//
// So this pass reads the full CDX history per URL and takes the LARGEST 200
// capture, not the newest — length is what separates a real page from an
// interstitial. The snapshot date is recorded in each file's SOURCE line
// because a 2025 capture is older content than the rest of the intake.
//
// Usage: node refetch-stubs.mjs        (rewrites any pages/*.txt under 400 bytes)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "pages");

// Same extractor as fetch-archive.mjs. Kept in step by hand: if one changes,
// change both, or the two passes produce differently-shaped text.
function textFrom(html) {
  let s = html;
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  s = s.replace(/<(script|style|noscript|svg|iframe)\b[\s\S]*?<\/\1>/gi, " ");
  s = s.replace(/<div id="wm-ipp[\s\S]*?<\/div>\s*<\/div>/gi, " ");
  s = s.replace(/<(header|footer|nav|aside)\b[\s\S]*?<\/\1>/gi, " ");
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

// pages/<slug>.txt -> the site path it came from. Inverse of fetch-archive's slug().
const unslug = (f) =>
  f === "home.txt" ? "/" : "/" + f.replace(/\.txt$/, "").replace(/--/g, "/");

const stubs = fs
  .readdirSync(OUT)
  .filter((f) => f.endsWith(".txt") && fs.statSync(path.join(OUT, f)).size < 400);

const log = [];
for (const file of stubs) {
  const p = unslug(file);
  const target = `https://stonesurgicalarts.com${p}/`;
  try {
    const cdx = await fetch(
      `http://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(target)}` +
        `&fl=timestamp,length&filter=statuscode:200&limit=40`,
    );
    const rows = (await cdx.text())
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((l) => {
        const [timestamp, length] = l.split(/\s+/);
        return { timestamp, length: Number(length) || 0 };
      });
    if (!rows.length) throw new Error("no snapshot");
    // Largest capture wins: the interstitials are ~5 KB, real pages ~140 KB.
    const snap = rows.sort((a, b) => b.length - a.length)[0];

    // id_ asks Wayback for the original bytes without its toolbar rewrite.
    const url = `https://web.archive.org/web/${snap.timestamp}id_/${target}`;
    const r = await fetch(url, {
      headers: { "user-agent": "Mozilla/5.0 (content recovery for the site owner)" },
      redirect: "follow",
    });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const txt = textFrom(await r.text());
    if (txt.length < 400) throw new Error(`still a stub (${txt.length}b)`);
    fs.writeFileSync(
      path.join(OUT, file),
      `SOURCE: stonesurgicalarts.com${p}  (snapshot ${snap.timestamp})\n\n${txt}\n`,
      "utf8",
    );
    log.push(`ok    ${p}  ${txt.length}b  @${snap.timestamp}`);
  } catch (e) {
    log.push(`FAIL  ${p}  ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 900));
}
console.log(log.join("\n") || "nothing under 400 bytes");
