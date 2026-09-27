// Pulls the site's PEOPLE-AND-PLACES photography from Magnific / Freepik.
//
// WHY THIS IS A SEPARATE FILE FROM get-stock.mjs. That file's contract, written
// at the top of it in capitals, is that no stock portrait may ever go on this
// site: `filters[people][exclude]=1` on every query and an `avoid` list that
// drops any title containing "woman", "man", "face", "portrait" or "model".
// This file's contract is the opposite one. Editing get-stock.mjs to allow
// people would have left a file whose header forbids what its code does, which
// is worse than two files.
//
// > [!IMPORTANT]
// > **WHY THE RULE CHANGED, 2026-09-01.** The client: *"we have some statue
// > images that don't lead to any surgical procedure. We need to make sure to
// > grab some images of people and places."* They are right, and the reason is
// > not that the old rule was wrong but that it was applied too widely. A
// > carved marble bust on a neck lift page says "art gallery", not "surgery",
// > and a page selling an operation on a human neck that contains no human at
// > all reads as evasive rather than as careful.
//
// > [!IMPORTANT]
// > **WHAT IS STILL FORBIDDEN, AND THIS PART DOES NOT MOVE.**
// >
// >   1. **No before/after, ever.** Not stock, not generated, not the archive's
// >      33 consented cases, and above all not `img/before-after/image1.jpg`
// >      from the Drive export, which is the DEVICE MANUFACTURER'S marketing
// >      photograph of ANOTHER SURGEON'S patient. See HANDOFF.md.
// >   2. **No image may be captioned, framed or laid out as a Stone patient or
// >      a Stone result.** A person may appear as a person: in a consulting
// >      room, at home during a recovery, outdoors afterwards, at a mirror.
// >      They may not appear inside a results grid, beside a "before" label, or
// >      under a caption that claims an outcome. The rule the old header was
// >      really protecting is that A FACE PLACED WHERE A RESULT GOES IS A
// >      CLAIM, and that is still true.
// >   3. **No named individual is ever depicted by a stock or generated
// >      likeness.** Dr. Stone, Brooke, Abby and the team are real people with
// >      real photographs or none.
// >
// > `avoid` on every slot below drops "before", "after", "result",
// > "transformation", "surgery", "injection", "syringe" and "botox" from the
// > candidate titles, so a clinical-claim image cannot arrive by accident.
//
// AGE AND CASTING ARE PART OF THE BRIEF, not an afterthought. A neck lift is an
// operation for people in their fifties and sixties. Stock aesthetics
// photography defaults to twenty-five-year-olds, and a page about neck laxity
// illustrated by a twenty-five-year-old is both dishonest and useless to the
// person reading it. Every `term` below says the age band out loud and `prefer`
// ranks for it.
//
// Auth: MAGNIFIC in the repo-root .env (gitignored), same key as get-stock.mjs.
//
// Usage:
//   node get-people.mjs              download anything missing
//   node get-people.mjs --force      re-download everything
//   node get-people.mjs --dry-run    search only; print candidates, write nothing
//   node get-people.mjs --only p-hero-profile
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ASSETS = path.join(HERE, "assets");
const MANIFEST = path.join(HERE, "people-manifest.json");

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
  if (!env) throw new Error(`No MAGNIFIC and no .env above ${HERE}.`);
  const line = fs.readFileSync(env, "utf8").split("\n").find((l) => l.startsWith("MAGNIFIC="));
  if (!line) throw new Error(`.env at ${env} has no MAGNIFIC line.`);
  return line.slice("MAGNIFIC=".length).trim().replace(/^["']|["']$/g, "");
}

/* Dropped from every slot, on top of each slot's own list. This is the clinical
   claim guard and it is not per-slot for a reason: a slot author should not be
   able to forget it. */
const NEVER = [
  "before", "after", "result", "transformation", "makeover",
  "surgery", "surgeon", "operating", "scalpel", "injection", "injectable",
  "syringe", "botox", "filler", "needle", "bruise", "swollen", "bandage",
];

/* --- the slots ------------------------------------------------------------
   `aspect` is per slot here, unlike get-stock.mjs, which hard-codes 16:9
   because every slot it serves is a wide band. This site's tall frames are the
   whole reason its layouts can overlap and bleed, so a portrait slot has to be
   able to say so.

   `id` PINS A CHOSEN RESOURCE. `--dry-run` prints the top six candidates per
   slot; where the ranked first hit was not the right picture, the id of the one
   that was is recorded here. That keeps the search reproducible AND keeps a
   human decision from being silently re-ranked away by a future API change.
   A slot with no `id` takes whatever ranks first, which is fine where the top
   hit was already right. */
const SLOTS = [
  {
    file: "p-neck-profile.webp",
    id: 179239533, // the first hit was a grey studio banner crop. This one is a true profile with the jaw and neck line actually visible, which is the subject.
    aspect: 2 / 3,
    term: "mature woman fifties profile neck jawline soft natural window light neutral background",
    orientation: "vertical",
    prefer: ["profile", "mature", "woman", "neck", "natural", "portrait"],
    avoid: ["young", "teen", "child", "makeup", "glamour"],
    used: "neck-lift.html — the full-bleed hero. A 2:3 source in a 1440-wide hero shows a band about 38% of its height, so the hero is TALL (86vh) and object-position is set at 55% to land that band on the mouth, jaw and neck rather than on an eyebrow. The first attempt used 32% and was a close-up of a forehead.",
  },
  /* p-consultation was here and was removed the same day. The booking block it
     served carries the practice's real address and real phone number, and the
     stock desk scene it returned had a pill bottle on it, which says pharmacy.
     `ssa-consult-room.webp` is the practice's own room and is the right picture
     for that block. The rule this records: stock fills a slot the practice
     cannot photograph, and a consultation room is not one of those. */
  {
    file: "p-recovery-home.webp",
    aspect: 3 / 2,
    term: "woman resting at home sofa blanket tea window light calm neutral interior",
    orientation: "horizontal",
    prefer: ["home", "resting", "sofa", "blanket", "calm", "window"],
    avoid: ["sick", "illness", "hospital", "pain"],
    used: "neck-lift.html — the first fortnight. Recovery is at home, not in a theatre.",
  },
  {
    file: "p-outdoors.webp",
    id: 419506050, // the first hit was a businesswoman by a glass building, which is a corporate stock cliche and says nothing about this.
    aspect: 2 / 3,
    term: "confident mature woman fifties outdoors daylight relaxed candid neutral clothing",
    orientation: "vertical",
    prefer: ["mature", "confident", "outdoors", "candid", "woman", "fifties"],
    avoid: ["young", "teen", "fashion", "glamour", "swimsuit"],
    used: "neck-lift.html — settling, months later. The point of the operation is a life, not a face.",
  },
  {
    file: "p-mirror.webp",
    id: 50471602, // the un-pinned run returned a woman of about twenty-five under a heading asking whether the reader's skin still retracts. This one is the age the page is written for.
    aspect: 3 / 2,
    term: "mature woman fifties looking in mirror touching her neck jawline bathroom soft daylight",
    orientation: "horizontal",
    prefer: ["mature", "mirror", "jawline", "neck", "touching", "reflection", "middle aged"],
    // AGE IS THE POINT OF THIS SLOT. The first run returned a woman of about
    // twenty-five, on a page about neck laxity, directly under a heading asking
    // the reader whether their skin still retracts.  now drops the young
    // ones outright rather than hoping the ranking does it.
    avoid: ["makeup application", "cosmetics", "brush", "young", "teen", "girl"],
    used: "neck-lift.html — who it suits. The chapter is a self-assessment and this is what taking it looks like.",
  },
  {
    file: "p-face-cat.webp",
    id: 324646332, // the first hit was a no-makeup studio closeup on a grey seamless. This one is daylight and outdoors, which is the palette the site is in.
    aspect: 2 / 3,
    term: "mature woman face portrait soft daylight neutral warm background calm expression",
    orientation: "vertical",
    prefer: ["portrait", "face", "mature", "woman", "natural", "calm"],
    avoid: ["young", "teen", "child", "glamour", "studio flash"],
    used: "index.html — the Face category card. REPLACES cat-face-tall.webp, a marble bust on a plinth.",
  },

  /* --- the blepharoplasty page, 2026-09-01 --------------------------------
     TWO NEW SLOTS AND NOT FOUR. The eyelid page reuses `p-recovery-home.webp`
     and `p-outdoors.webp` from the neck lift, because a sofa in the first
     fortnight and a park at month three are pictures of a RECOVERY, not of a
     procedure, and nothing in either frame is about a neck. The two that had
     to be replaced are the two where the subject was the anatomy: a profile of
     a jawline and a hand resting on a throat are both the wrong body part on a
     page about eyes, and leaving them would have been the visual version of
     the mistake the client already caught once. */
  {
    file: "p-eyes-portrait.webp",
    id: 315873470, // the first hit was a broad open-mouthed smile by a window, and a big smile closes the eye. This page is about the upper lid; the subject has to be looking out of it.
    aspect: 2 / 3,
    term: "mature woman fifties face portrait eyes open natural window light neutral background",
    orientation: "vertical",
    prefer: ["mature", "portrait", "eyes", "woman", "natural", "calm", "face"],
    // Same age rule as every slot here, and it bites harder on this one: eyelid
    // stock is overwhelmingly a twenty-year-old's eye in a beauty close-up.
    avoid: ["young", "teen", "child", "glamour", "makeup", "mascara", "lashes", "eyelash", "closeup"],
    used: "blepharoplasty.html — the full-bleed hero. Object-position is set at 38% rather than the neck page's 55%, because on this page the band that has to land is the eyes, not the jaw.",
  },
  {
    file: "p-eyes-mirror.webp",
    // Three were tried before this one. 366817402 was a teal-tiled locker room and
    // the subject looked unhappy with her own face, which is a register this
    // practice does not use. 396822584 was warm but she is pulling her cheeks in a
    // skincare-advert gesture, with soap bottles and a houseplant in shot. This one
    // is a face inside a round mirror, in the site's own warm neutrals, and the eye
    // and upper lid are the thing she is actually looking at.
    id: 58988501,
    aspect: 3 / 2,
    term: "mature woman touching her eyebrow temple with fingertip looking in mirror soft daylight",
    orientation: "horizontal",
    prefer: ["mature", "mirror", "reflection", "looking", "woman", "middle aged", "bathroom"],
    avoid: ["makeup application", "cosmetics", "brush", "mascara", "young", "teen", "girl"],
    used: "blepharoplasty.html — who it suits. The section is a self-assessment and the brow test is done in front of a mirror, which is what this is a picture of.",
  },
];

const KEY = apiKey();
const force = process.argv.includes("--force");
const dryRun = process.argv.includes("--dry-run");
const onlyIdx = process.argv.indexOf("--only");
const only = onlyIdx > -1 ? process.argv[onlyIdx + 1] : null;

const api = async (url) => {
  const r = await fetch(url, { headers: { "x-freepik-api-key": KEY } });
  if (!r.ok) throw new Error(`${r.status} ${r.statusText} on ${url}`);
  return r.json();
};
const hasAny = (text, words) => words.some((w) => text.includes(w));

const MAX_W = 1400;
const QUALITY = 82;

function toWebp(jpg, webp, aspect) {
  const script = `
import sys
from PIL import Image
src, dst, max_w, q, aspect = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), float(sys.argv[5])
im = Image.open(src)
if im.mode not in ("RGB", "RGBA"):
    im = im.convert("RGB")
w, h = im.size
if w / h > aspect:
    new_w = round(h * aspect)
    left = (w - new_w) // 2
    im = im.crop((left, 0, left + new_w, h))
else:
    new_h = round(w / aspect)
    # Crop from the UPPER third, not the centre. Every slot here is a person,
    # and a centre crop on a standing figure takes the torso and loses the head.
    top = min(max(0, (h - new_h) // 3), h - new_h)
    im = im.crop((0, top, w, top + new_h))
if im.width > max_w:
    im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
im.save(dst, "WEBP", quality=q, method=6)
print(im.width, im.height)
`;
  const out = execFileSync("python", ["-c", script, jpg, webp, String(MAX_W), String(QUALITY), String(aspect)], {
    encoding: "utf8",
  });
  const [w, h] = out.trim().split(/\s+/).map(Number);
  return { w, h };
}

async function pick(slot) {
  // NOTE: no `filters[people][exclude]`, which is the one line that makes this
  // file different from get-stock.mjs.
  const url =
    `https://api.freepik.com/v1/resources?term=${encodeURIComponent(slot.term)}` +
    `&limit=50&order=relevance&filters[content_type][photo]=1` +
    `&filters[orientation][${slot.orientation}]=1`;
  const { data } = await api(url);
  const drop = NEVER.concat(slot.avoid || []);
  const candidates = (data || [])
    .map((d) => ({ ...d, t: String(d.title || "").toLowerCase() }))
    .filter((d) => !hasAny(d.t, drop));
  if (!candidates.length) return null;
  candidates.sort((a, b) => {
    const score = (d) => (slot.prefer || []).filter((w) => d.t.includes(w)).length;
    return score(b) - score(a);
  });
  return candidates;
}

fs.mkdirSync(ASSETS, { recursive: true });
const manifest = fs.existsSync(MANIFEST)
  ? JSON.parse(fs.readFileSync(MANIFEST, "utf8"))
  : {
      generatedAt: null,
      source: "Magnific (api.freepik.com)",
      note: "People-and-places photography. Read the header of get-people.mjs before adding a slot: what a person may and may not be shown as on this site is written there.",
      slots: {},
    };

const log = [];
for (const slot of SLOTS) {
  if (only && slot.file !== only && slot.file !== `${only}.webp`) continue;
  const dest = path.join(ASSETS, slot.file);
  if (!force && !dryRun && fs.existsSync(dest) && manifest.slots[slot.file]) {
    log.push(`skip  ${slot.file}`);
    continue;
  }
  try {
    const hits = await pick(slot);
    if (!hits) throw new Error("no candidate survived the avoid list");
    if (dryRun) {
      log.push(`\n${slot.file}  (${slot.orientation}, ${slot.aspect.toFixed(2)})`);
      for (const h of hits.slice(0, 6)) log.push(`   ${h.id}  ${h.title}`);
      continue;
    }
    // A pinned id wins if the search still returns it; if it has been
    // withdrawn, fall back to the ranking rather than failing the whole run,
    // and say so in the log so the pin can be re-chosen.
    let hit = hits[0];
    if (slot.id) {
      const pinned = hits.find((h) => String(h.id) === String(slot.id));
      if (pinned) hit = pinned;
      else log.push(`note  ${slot.file}: pinned id ${slot.id} not in results, using the top hit`);
    }
    const dl = await api(`https://api.freepik.com/v1/resources/${hit.id}/download`);
    const bin = await fetch(dl.data.url);
    if (!bin.ok) throw new Error(`download ${bin.status}`);
    const tmp = dest.replace(/\.webp$/, ".orig.jpg");
    fs.writeFileSync(tmp, Buffer.from(await bin.arrayBuffer()));
    const originalBytes = fs.statSync(tmp).size;
    const { w, h } = toWebp(tmp, dest, slot.aspect);
    fs.unlinkSync(tmp);
    manifest.slots[slot.file] = {
      id: hit.id,
      title: hit.title,
      author: hit.author?.name || null,
      license: hit.licenses?.[0]?.type || null,
      pageUrl: hit.url,
      term: slot.term,
      usedFor: slot.used,
      width: w,
      height: h,
      bytes: fs.statSync(dest).size,
      originalBytes,
    };
    log.push(`ok    ${slot.file.padEnd(24)} ${w}x${h}  ${(fs.statSync(dest).size / 1024).toFixed(0)}KB  ${hit.title}`);
  } catch (e) {
    log.push(`FAIL  ${slot.file.padEnd(24)} ${e.message}`);
    process.exitCode = 1;
  }
  await new Promise((r) => setTimeout(r, 350));
}

if (!dryRun) {
  const live = new Set(SLOTS.map((s) => s.file));
  for (const file of Object.keys(manifest.slots)) {
    if (!live.has(file)) delete manifest.slots[file];
  }
  manifest.generatedAt = new Date().toISOString();
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n", "utf8");
}
console.log(log.join("\n"));
