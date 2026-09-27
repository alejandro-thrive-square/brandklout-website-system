// Pulls the site's stock photography from the Magnific / Freepik API.
//
// WHY THERE IS STOCK HERE AT ALL. The practice owns four usable photographs
// (reception, office, two of Dr. Stone) and Gabby's shoot has not landed. The
// content expansion added sections that need a picture to read as designed —
// four category bands, the recovery band, the consultation band. Those slots
// are stock until real photography replaces them, and every one is a room, a
// texture or a detail. None of them is a face.
//
// > [!IMPORTANT]
// > NO STOCK PORTRAIT MAY GO ON THIS SITE. A stock model on a surgery page
// > reads as a patient, and a stock face beside a treatment name reads as that
// > treatment's result. Both are misrepresentation on a medical site whatever
// > the alt text says. The queries below are written to return interiors,
// > instruments and textures, `people: false` is asserted on every slot, and
// > audit.mjs fails the build if a stock file is referenced from a
// > before/after or results context.
//
// Auth: MAGNIFIC in the repo-root .env (gitignored). The key is Freepik-family
// and serves magnific.com resources from api.freepik.com.
//
// Usage:
//   node get-stock.mjs              download anything missing
//   node get-stock.mjs --force      re-download everything
//   node get-stock.mjs --dry-run    search only; print candidates, write nothing
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(HERE, "assets");
const MANIFEST = path.join(HERE, "stock-manifest.json");

// .env lives at the repo root. Walk up rather than counting directories: this
// file sits eight levels down and a miscount fails with a misleading path.
function findEnv() {
  let dir = HERE;
  for (let i = 0; i < 12; i++) {
    const candidate = path.join(dir, ".env");
    if (fs.existsSync(candidate)) return candidate;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

function apiKey() {
  if (process.env.MAGNIFIC) return process.env.MAGNIFIC.trim();
  const env = findEnv();
  if (!env) {
    throw new Error(
      `No MAGNIFIC in the environment and no .env found above ${HERE}.\n` +
        `The key lives in the bk-dr-nahlah worktree's .env; copy the MAGNIFIC line across.`,
    );
  }
  const line = fs
    .readFileSync(env, "utf8")
    .split("\n")
    .find((l) => l.startsWith("MAGNIFIC="));
  if (!line) throw new Error(`.env at ${env} has no MAGNIFIC line.`);
  return line.slice("MAGNIFIC=".length).trim().replace(/^["']|["']$/g, "");
}

/* --- the slots ------------------------------------------------------------
   One entry per image the markup asks for. `file` is what the markup points
   at, so changing a query never changes a filename and never breaks a page.

   `orientation` and `term` are passed to the search; `prefer` re-ranks the
   results by title keyword so the top hit is the one actually wanted rather
   than whatever the API happened to order first. `avoid` drops candidates
   outright — that is where "no faces" is enforced, alongside people:false. */
const SLOTS = [
  /* cat-neck, cat-skin, cat-non-surgical and recovery-calm were removed on
     2026-08-31: each was chosen for palette and depicted nothing the section
     said. Replaced by generated images bound to the copy - see
     generate-images.mjs. cat-face survives, reused on memberships. */

  {
    file: "cat-face.webp",
    term: "aesthetic clinic treatment room minimal beige interior",
    orientation: "horizontal",
    prefer: ["clinic", "treatment room", "interior", "minimal"],
    avoid: ["woman", "man", "girl", "face", "portrait", "model", "patient"],
    used: "treatments.html — Face category band",
  },
  {
    file: "consult-room.webp",
    term: "empty consultation room desk two chairs warm neutral light",
    orientation: "horizontal",
    prefer: ["consultation", "office", "desk", "chair", "interior"],
    avoid: ["woman", "man", "people", "face", "portrait", "meeting"],
    used: "book.html — consultation band",
  },
  {
    file: "clinic-detail.webp",
    term: "modern medical clinic reception detail architecture neutral palette",
    orientation: "horizontal",
    prefer: ["reception", "architecture", "interior", "detail"],
    avoid: ["woman", "man", "people", "face", "portrait"],
    used: "about.html — practice band",
  },
  {
    file: "membership-still.webp",
    term: "luxury spa skincare products shelf neutral beige still life",
    orientation: "horizontal",
    prefer: ["spa", "product", "shelf", "still life", "luxury"],
    avoid: ["woman", "man", "face", "portrait", "model"],
    used: "memberships.html — programme band",
  },
];

const KEY = apiKey();
const force = process.argv.includes("--force");
const dryRun = process.argv.includes("--dry-run");

const api = async (url) => {
  const r = await fetch(url, { headers: { "x-freepik-api-key": KEY } });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} on ${url}`);
  return r.json();
};

const hasAny = (text, words) => words.some((w) => text.includes(w));

/* --- resize ---------------------------------------------------------------
   The API returns originals — 5376px wide, up to 16MB each. Unusable on a
   page. Everything is downscaled to fit MAX_W and re-encoded as WebP, which
   is what the rest of the site's imagery already uses.

   Pillow does the work because it is the only encoder installed here: there
   is no sharp in this repo and no ImageMagick on this machine. (`convert` on
   PATH is the Windows filesystem utility, not ImageMagick — do not reach for
   it.) ffmpeg is present as a fallback if Pillow ever goes missing. */
const MAX_W = 1600;
const QUALITY = 82;
// Every slot on this site is a wide band. The API's orientation filter is not
// reliable — `filters[orientation][horizontal]` still returned a 1600x2400
// flat-lay twice — so the aspect is enforced here by a centre crop instead of
// by the query. The markup would object-fit these anyway; cropping at build
// time means the bytes are not downloaded and shipped only to be hidden.
const ASPECT = 16 / 9;

function toWebp(jpg, webp) {
  const script = `
import sys
from PIL import Image
src, dst, max_w, q, aspect = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), float(sys.argv[5])
im = Image.open(src)
if im.mode not in ("RGB", "RGBA"):
    im = im.convert("RGB")

# Centre-crop to the target aspect before scaling.
w, h = im.size
if w / h > aspect:
    new_w = round(h * aspect)
    left = (w - new_w) // 2
    im = im.crop((left, 0, left + new_w, h))
else:
    new_h = round(w / aspect)
    top = (h - new_h) // 2
    im = im.crop((0, top, w, top + new_h))

if im.width > max_w:
    im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
im.save(dst, "WEBP", quality=q, method=6)
print(im.width, im.height)
`;
  const out = execFileSync(
    "python",
    ["-c", script, jpg, webp, String(MAX_W), String(QUALITY), String(ASPECT)],
    { encoding: "utf8" },
  );
  const [w, h] = out.trim().split(/\s+/).map(Number);
  return { w, h };
}

async function pick(slot) {
  const url =
    `https://api.freepik.com/v1/resources?term=${encodeURIComponent(slot.term)}` +
    `&limit=40&order=relevance&filters[content_type][photo]=1` +
    `&filters[orientation][${slot.orientation}]=1&filters[people][exclude]=1`;
  const { data } = await api(url);
  const candidates = (data || [])
    .map((d) => ({ ...d, t: String(d.title || "").toLowerCase() }))
    .filter((d) => !hasAny(d.t, slot.avoid));
  if (!candidates.length) return null;
  // Rank by how many preferred words the title carries; ties keep API order.
  candidates.sort((a, b) => {
    const score = (d) => slot.prefer.filter((w) => d.t.includes(w)).length;
    return score(b) - score(a);
  });
  return candidates[0];
}

fs.mkdirSync(ASSETS, { recursive: true });
const manifest = fs.existsSync(MANIFEST)
  ? JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
  : { generatedAt: null, source: "Magnific (api.freepik.com)", slots: {} };

const log = [];
for (const slot of SLOTS) {
  const dest = path.join(ASSETS, slot.file);
  if (!force && !dryRun && fs.existsSync(dest) && manifest.slots[slot.file]) {
    log.push(`skip  ${slot.file}`);
    continue;
  }
  try {
    const hit = await pick(slot);
    if (!hit) throw new Error("no candidate survived the avoid list");
    if (dryRun) {
      log.push(`would  ${slot.file.padEnd(22)} ${hit.id}  ${hit.title}`);
      continue;
    }
    const dl = await api(`https://api.freepik.com/v1/resources/${hit.id}/download`);
    const bin = await fetch(dl.data.url);
    if (!bin.ok) throw new Error(`download ${bin.status}`);
    // Land the original next to the target, convert, then drop it. The
    // original is never what ships.
    const tmp = dest.replace(/\.webp$/, ".orig.jpg");
    fs.writeFileSync(tmp, Buffer.from(await bin.arrayBuffer()));
    const originalBytes = fs.statSync(tmp).size;
    const { w, h } = toWebp(tmp, dest);
    fs.unlinkSync(tmp);
    manifest.slots[slot.file] = {
      id: hit.id,
      title: hit.title,
      author: hit.author?.name || null,
      license: hit.licenses?.[0]?.type || null,
      pageUrl: hit.url,
      term: slot.term,
      usedFor: slot.used,
      // width/height so the markup can carry them and reserve layout space.
      width: w,
      height: h,
      bytes: fs.statSync(dest).size,
      originalBytes,
    };
    log.push(
      `ok    ${slot.file.padEnd(24)} ${String(w) + "x" + h}  ` +
        `${(originalBytes / 1024 / 1024).toFixed(1)}MB -> ${(fs.statSync(dest).size / 1024).toFixed(0)}KB`,
    );
  } catch (e) {
    log.push(`FAIL  ${slot.file.padEnd(22)} ${e.message}`);
    process.exitCode = 1;
  }
  await new Promise((r) => setTimeout(r, 350));
}

if (!dryRun) {
  // Drop entries for files SLOTS no longer names. Without this the manifest
  // accumulates dead rows every time a slot is renamed — the switch from .jpg
  // to .webp left eight of them, each claiming a licence for a file that is
  // not on disk and not on the site. The manifest is the attribution record,
  // so it has to describe what actually ships and nothing else.
  const live = new Set(SLOTS.map((s) => s.file));
  for (const file of Object.keys(manifest.slots)) {
    if (!live.has(file)) delete manifest.slots[file];
  }

  manifest.generatedAt = new Date().toISOString().slice(0, 10);
  manifest.note =
    "Stock stands in for photography the practice does not yet own. Every slot is a " +
    "room, an object or a texture — never a face, because a stock face on a surgery " +
    "page reads as a patient or as a result. Replace with real photography as it lands.";
  manifest.licenceNote =
    "Every asset here is a PREMIUM Magnific/Freepik resource, downloaded against the " +
    "MAGNIFIC key in the repo-root .env. That key belongs to the client, so the licence " +
    "runs with their subscription — it must still be active when the site goes live, and " +
    "the per-asset licence URLs are on each resource's page (see pageUrl). If the site is " +
    "ever handed to another party, re-check the licence terms before the handover.";
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), "utf8");
}
console.log(log.join("\n"));
