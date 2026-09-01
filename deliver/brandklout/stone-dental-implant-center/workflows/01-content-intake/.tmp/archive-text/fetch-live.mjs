// Pulls the LIVE Stone Dental Implant Center site (Webflow) down as plain text.
//
// web.archive.org is refusing this IP outright — every request resets — so the
// archived Surgical Arts copy is only available here as the screenshots in
// ../wayback-screenshots/shots. The live site is the other half of the source
// material and is reachable: it carries Dr. Stone's bio, the credentials, the
// NAP, the hours and the testimonials, all of which the Surgical Arts build
// needs to state correctly rather than invent.
//
// Usage: node fetch-live.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "live");
fs.mkdirSync(OUT, { recursive: true });

const ORIGIN = "https://www.stonedentalimplantcenter.com";

const PATHS = [
  "/",
  "/about-us",
  "/meet-dr-mona-stone",
  "/services",
  "/before-after",
  "/patient-testimonials",
  "/your-first-visit",
  "/insurance-financing",
  "/contact",
  "/virtual-appointment-request",
  "/pre-op-post-op-instructions",
];

const slug = (p) => (p === "/" ? "home" : p.replace(/^\//, "").replace(/\//g, "--")) + ".txt";

function textFrom(html) {
  let s = html;
  s = s.replace(/<!--[\s\S]*?-->/g, " ");
  s = s.replace(/<(script|style|noscript|svg)\b[\s\S]*?<\/\1>/gi, " ");
  s = s.replace(/<\/(p|div|section|li|h[1-6]|tr|td)>/gi, "\n");
  s = s.replace(/<br\s*\/?>/gi, "\n");
  s = s.replace(/<h([1-6])[^>]*>/gi, "\n\n## ");
  s = s.replace(/<li[^>]*>/gi, "\n- ");
  s = s.replace(/<[^>]+>/g, " ");
  s = s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;|&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
  s = s.replace(/[ \t ]+/g, " ").replace(/\n{3,}/g, "\n\n");
  return s.split("\n").map((l) => l.trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// Every <img>/background the page carries, so the build can point at real
// practice photography instead of stock where the client already owns a shot.
function imagesFrom(html) {
  const out = new Set();
  for (const m of html.matchAll(/<img[^>]+src="([^"]+)"/gi)) out.add(m[1]);
  for (const m of html.matchAll(/srcset="([^"]+)"/gi)) {
    for (const cand of m[1].split(",")) out.add(cand.trim().split(/\s+/)[0]);
  }
  for (const m of html.matchAll(/url\((&quot;|"|')?(https:\/\/[^)"']+\.(?:jpg|jpeg|png|webp|avif|svg))/gi))
    out.add(m[2]);
  return [...out].filter((u) => /^https?:/.test(u));
}

const allImages = new Set();
const log = [];
for (const p of PATHS) {
  try {
    const r = await fetch(ORIGIN + p, {
      headers: { "user-agent": "Mozilla/5.0 (content audit for the site owner)" },
    });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const html = await r.text();
    fs.writeFileSync(
      path.join(OUT, slug(p)),
      `SOURCE: ${ORIGIN}${p}\n\n${textFrom(html)}\n`,
      "utf8",
    );
    imagesFrom(html).forEach((u) => allImages.add(u));
    log.push(`ok    ${p}`);
  } catch (e) {
    log.push(`FAIL  ${p}  ${e.message}`);
  }
  await new Promise((r) => setTimeout(r, 400));
}
fs.writeFileSync(
  path.join(OUT, "_images.txt"),
  [...allImages].sort().join("\n") + "\n",
  "utf8",
);
console.log(log.join("\n") + `\nimages: ${allImages.size}`);
