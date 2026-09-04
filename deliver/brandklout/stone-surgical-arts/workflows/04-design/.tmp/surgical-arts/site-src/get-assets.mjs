// Pulls the client's own images off their Webflow CDN into site-src/assets.
//
// These are Stone's assets on Stone's site — the Surgical Arts logo, Dr. Stone's
// portrait, the practice photography and the stone texture the current brand
// already uses. Reusing them is the point: the chosen design is called "closest
// evolution of the current brand", so the rebuild should carry the real marks
// rather than stand-ins.
//
// Nothing here is committed (assets/ is gitignored); re-run to repopulate.
//
// Usage: node get-assets.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "assets");
fs.mkdirSync(OUT, { recursive: true });

const CDN = "https://cdn.prod.website-files.com/6a07d5aac093f0e4521d29bc/";

// name -> path under the site's CDN folder. Names are what the markup asks for.
const WANT = {
  // NOTE: the CDN file called "SSA_Main Colored 3" is the STONE DENTAL IMPLANT
  // CENTER logo, not Surgical Arts. Kept under an honest name for reference only —
  // the Surgical Arts wordmark is set in markup (.brand_component), per the board.
  "logo-sdic-sister-brand.avif": "6a08718e6758b2666bffce6c_98956fcca07ead3a8ca4bc67ac8740e1_SSA_Main%20Colored%203.avif",
  "banner-ssa.avif": "6a0b1e62dfa5dd7f5b6f678b_Stone%20Surgical%20Arts%20banner.avif",
  "dr-stone-portrait.webp": "6a08acf1dee55f6fabe78a25_Dr.%20Mona%20Stone%2C%20DDS..webp",
  "dr-stone-office.avif": "6a340c349acbd3186be2deda_Doctor%20Mona%20Stone%20at%20Stone%20Dental%20Implant%20Center.avif",
  "texture-stone.jpg": "6a08728921f08afd8371be44_imgi_17_texture-grey.jpg",
  "office-exterior.webp": "6a242c6d587d8591d7f04c39_banner-office-bg-img.webp",
};

const log = [];
for (const [name, tail] of Object.entries(WANT)) {
  const file = path.join(OUT, name);
  if (fs.existsSync(file) && fs.statSync(file).size > 1000) {
    log.push(`skip  ${name}`);
    continue;
  }
  try {
    const r = await fetch(CDN + tail, {
      headers: { "user-agent": "Mozilla/5.0 (asset collection for the site owner)" },
    });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const buf = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(file, buf);
    log.push(`ok    ${name}  ${(buf.length / 1024).toFixed(0)}KB`);
  } catch (e) {
    log.push(`FAIL  ${name}  ${e.message}`);
  }
}
console.log(log.join("\n"));
