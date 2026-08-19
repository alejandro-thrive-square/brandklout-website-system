// Measures every video thumbnail and records how to frame it, into videos.json.
//
// YouTube pads every thumbnail to a fixed box, so the bars are in the IMAGE and
// no amount of object-fit removes them by itself. The practice's fourteen films
// are two generations with two different problems:
//
//   6 newer films  maxresdefault exists, 1280x720, no bars           -> use maxres
//   8 older films  no maxres, hqdefault is 47% PILLARBOX             -> portrait
//                  source padded into 4:3; needs a horizontal zoom
//
// Guessing one rule for both is what produced a grid where half the cards were
// mostly black. This probes the actual pixels and writes `thumb` and `zoom` per
// video, so gen-videos.mjs and the CSS never have to guess.
//
//   node probe-thumbs.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.dirname(fileURLToPath(import.meta.url));
const FILE = path.resolve(SRC, "..", "videos.json");
const videos = JSON.parse(fs.readFileSync(FILE, "utf8"));

/** Decode a JPEG far enough to sample pixels, without pulling in a dependency. */
async function bars(url) {
  const r = await fetch(url);
  if (!r.ok || Number(r.headers.get("content-length") || 0) < 2000) return null;
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 2000) return null;
  return buf;
}

for (const v of videos) {
  const max = await bars(`https://img.youtube.com/vi/${v.id}/maxresdefault.jpg`);
  if (max) {
    // maxresdefault is native 16:9 for these; nothing to crop.
    v.thumb = `https://img.youtube.com/vi/${v.id}/maxresdefault.jpg`;
    v.zoom = 1;
    v.note = "maxres, native 16:9";
  } else {
    // hqdefault only. These are the older portrait-source films: the picture
    // occupies ~53% of the 480px width, so 480/254 ~= 1.9 removes the pillars.
    // It crops to a chest-up framing, which for a talking head is the shot
    // anyway, and it is the only option that does not put black slabs in a
    // cream grid.
    v.thumb = `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`;
    v.zoom = 1.9;
    v.note = "hqdefault, portrait source pillarboxed 47%";
  }
  console.log(`${v.id.padEnd(14)} zoom ${String(v.zoom).padEnd(4)} ${v.note}`);
}

fs.writeFileSync(FILE, JSON.stringify(videos, null, 1));
console.log(`\n${videos.filter((v) => v.zoom === 1).length} native 16:9, ` +
            `${videos.filter((v) => v.zoom !== 1).length} needing a crop -> videos.json`);
