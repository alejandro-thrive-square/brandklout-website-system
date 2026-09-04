// Pull the Vimeo clips the site embeds. They are embed-only (vimeo.com/<id> and
// /config both refuse), so open the player with the site as referrer, read its
// inline playerConfig, and hand the HLS master to ffmpeg.
//
// Usage: node vimeo.mjs            -> ../media-library/vimeo/<id>-<title>.mp4 + vimeo.json
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, "..");
const DIR = path.join(OUT, "media-library", "vimeo");
fs.mkdirSync(DIR, { recursive: true });
const REFERER = "https://www.ifadentistry.com/";

// ids + the page each is embedded on, from raw-html
const embeds = new Map();
const walk = (d) => {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const f = path.join(d, e.name);
    if (e.isDirectory()) walk(f);
    else if (e.name === "index.html") {
      const html = fs.readFileSync(f, "utf8");
      for (const m of html.matchAll(/player\.vimeo\.com\/video\/(\d+)/g)) {
        const rel = path.relative(path.join(OUT, "raw-html"), d).replace(/\\/g, "/");
        if (!embeds.has(m[1])) embeds.set(m[1], new Set());
        embeds.get(m[1]).add("/" + (rel ? rel + "/" : ""));
      }
    }
  }
};
walk(path.join(OUT, "raw-html"));
console.log(`${embeds.size} vimeo ids`);

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: "new",
});
const page = await browser.newPage();
await page.setExtraHTTPHeaders({ referer: REFERER });
const manifest = [];
for (const [id, pages] of embeds) {
  const rec = { id, embedded_on: [...pages] };
  try {
    await page.goto(`https://player.vimeo.com/video/${id}?byline=0&portrait=0`, { waitUntil: "networkidle2", timeout: 60000 });
    const cfg = await page.evaluate(() => window.playerConfig || null);
    if (!cfg) throw new Error("no playerConfig on the player page");
    rec.title = cfg.video?.title;
    rec.owner = cfg.video?.owner?.name;
    rec.duration_s = cfg.video?.duration;
    rec.width = cfg.video?.width;
    rec.height = cfg.video?.height;
    rec.thumbnail = cfg.video?.thumbs?.base || cfg.video?.thumbs?.["1280"] || null;
    const files = cfg.request?.files || {};
    const prog = (files.progressive || []).sort((a, b) => b.width - a.width)[0];
    const hls = files.hls?.cdns?.[files.hls?.default_cdn]?.url || Object.values(files.hls?.cdns || {})[0]?.url;
    const safe = (rec.title || id).replace(/[^\w\- ]+/g, "").trim().slice(0, 60).replace(/\s+/g, "-");
    const out = path.join(DIR, `${id}-${safe}.mp4`);
    rec.file = path.basename(out);
    if (fs.existsSync(out) && fs.statSync(out).size > 0) {
      rec.status = "cached";
    } else if (prog) {
      rec.source = "progressive";
      const res = await fetch(prog.url, { headers: { referer: REFERER } });
      fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
      rec.status = "ok";
    } else if (hls) {
      rec.source = "hls";
      const r = spawnSync(
        "ffmpeg",
        ["-y", "-loglevel", "error", "-headers", `Referer: ${REFERER}\r\n`, "-i", hls, "-c", "copy", "-bsf:a", "aac_adtstoasc", out],
        { encoding: "utf8" }
      );
      if (r.status !== 0) throw new Error("ffmpeg: " + (r.stderr || "").slice(-300));
      rec.status = "ok";
    } else throw new Error("no progressive or hls in playerConfig");
    rec.bytes = fs.statSync(out).size;
    console.log(`${id} ${rec.status} ${rec.title} (${(rec.bytes / 1048576).toFixed(1)} MB, ${rec.width}x${rec.height}, ${rec.duration_s}s)`);
  } catch (e) {
    rec.status = "fail";
    rec.error = e.message;
    console.log(`${id} FAIL ${e.message}`);
  }
  manifest.push(rec);
}
await browser.close();
fs.writeFileSync(path.join(OUT, "vimeo.json"), JSON.stringify(manifest, null, 2));
