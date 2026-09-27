// 1200x630 share versions of every image a page shares (2026-09-25). The heroes were
// 1536x2046 portraits of 350-610 KB: WhatsApp drops a preview image over ~300 KB, and the
// networks crop to 1.91:1, cutting a portrait through the middle. Wide photos (>= 1.6:1)
// are cover-cropped; anything taller is shown whole, centred on a blurred, darkened copy of
// itself, so no face is cut. JPEG q80, typically 60-180 KB.
//   node og/render-share-cards.mjs og/share-sources-www.json  -> og/share/<name>-share-1200x630.jpg
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
const sources = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
const OUT = path.join("og", "share"); fs.mkdirSync(OUT, { recursive: true });
const nameOf = (url) => url.replace(/^.*\/uploads\/[A-Za-z0-9_-]{21}-/, "").replace(/-\d+x\d+(\.\w+)$/, "").replace(/\.\w+$/, "") + "-share-1200x630.jpg";
const images = [...new Set(Object.values(sources).map((s) => s.image))];
const br = await chromium.launch({ channel: "chrome" });
const p = await br.newPage({ viewport: { width: 1200, height: 630 } });
const report = [];
for (const url of images) {
  const name = nameOf(url);
  const file = path.join(OUT, name);
  if (fs.existsSync(file)) { report.push(`${name} (exists)`); continue; }
  const res = await fetch(url);
  const buf = Buffer.from(await res.arrayBuffer());
  const mime = res.headers.get("content-type") || "image/jpeg";
  const src = `data:${mime};base64,${buf.toString("base64")}`;
  await p.setContent(`<html><body style="margin:0;width:1200px;height:630px;overflow:hidden;background:#2e3538">
    <img id="i" src="${src}" style="position:absolute;inset:0;width:1200px;height:630px;object-fit:cover"></body></html>`);
  await p.waitForFunction(() => document.getElementById("i").complete);
  const ratio = await p.evaluate(() => { const i = document.getElementById("i"); return i.naturalWidth / i.naturalHeight; });
  if (ratio < 1.6) {
    await p.evaluate(() => {
      const bg = document.getElementById("i");
      bg.style.filter = "blur(28px) brightness(.62)"; bg.style.transform = "scale(1.12)";
      const fg = bg.cloneNode(); fg.id = "f";
      Object.assign(fg.style, { filter: "none", transform: "none", objectFit: "contain", boxShadow: "0 0 40px rgba(0,0,0,.35)" });
      document.body.appendChild(fg);
    });
  } else {
    await p.evaluate(() => { document.getElementById("i").style.objectPosition = "50% 32%"; });
  }
  await p.screenshot({ path: file, type: "jpeg", quality: 80, clip: { x: 0, y: 0, width: 1200, height: 630 } });
  report.push(`${name} ${ratio.toFixed(2)} ${ratio < 1.6 ? "contained" : "cropped"} ${Math.round(fs.statSync(file).size / 1024)} KB`);
}
await br.close();
console.log(report.join("\n"));
