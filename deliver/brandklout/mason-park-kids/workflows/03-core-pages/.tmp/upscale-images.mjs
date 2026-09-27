/**
 * Re-emits the practice's SOFT photographs at high resolution through Magnific
 * (Freepik's upscaler), into `_upscaled/<key>.png`.
 *
 *   node upscale-images.mjs                 everything not yet upscaled
 *   node upscale-images.mjs --force         redo everything
 *   node upscale-images.mjs --only staff-gia
 *   node upscale-images.mjs --list          print the table, call nothing
 *
 * WHY. 2026-09-08, the client: "Increase image quality on blurry images (using
 * magnific ai generation)." Nine of the twenty-three photographs in the pool
 * come off the old WordPress install at 300 to 1200px - four of the nine staff
 * portraits are 300x300 thumbnails, Dr. Nguyen's older portrait is 342x451 -
 * and the pages paint them at 480 to 1200 CSS px, which is 2x to 4x on a phone.
 * That is the softness you can see.
 *
 * THIS IS THE SAME PHOTOGRAPH, ENLARGED. Never a substitute. Everyone in these
 * frames is a real, named member of staff or a real doctor, and a person who
 * merely resembles them is not them. Creativity stays at 1 and resemblance at 3
 * so the upscaler adds fabric, hair and skin texture without reinterpreting a
 * face; `soft_portraits` is asserted on every frame that contains a person.
 * Look at every face in `_upscaled/` before shipping it - the raw PNG is kept
 * next to nothing else precisely so it can be reviewed - and if one comes back
 * wrong, delete that PNG and prep-images.py silently falls back to the mirror.
 *
 * The pool's naming rule still holds: a key says WHAT THE FRAME SHOWS. Nothing
 * here renames, recrops or reframes anything; prep-images.py still owns the
 * widths, the aspect and the webp encode.
 *
 * Auth: MAGNIFIC in the repo-root .env (a Freepik API key).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "_upscaled");
// abspath, never a relative walk: this worktree's root is long enough that the
// unresolved "..\..\" form of these paths passes MAX_PATH and every open()
// fails as "no such file". Same trap prep-images.py documents.
const MIRROR = path.resolve(HERE, "..", "..", "01-site-recovery", ".tmp", "recovered", "mirror", "wp-content", "uploads");

const argv = process.argv.slice(2);
const force = argv.includes("--force");
const list = argv.includes("--list");
const only = argv.includes("--only") ? argv[argv.indexOf("--only") + 1] : null;

function apiKey() {
  if (process.env.MAGNIFIC) return process.env.MAGNIFIC.trim();
  let dir = HERE;
  for (let i = 0; i < 12; i++) {
    const c = path.join(dir, ".env");
    if (fs.existsSync(c)) {
      const line = fs.readFileSync(c, "utf8").split("\n").find((l) => l.startsWith("MAGNIFIC="));
      if (line) return line.slice("MAGNIFIC=".length).trim().replace(/^["']|["']$/g, "");
    }
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  throw new Error("no MAGNIFIC in the environment and no .env above " + HERE);
}
const KEY = apiKey();

/* `key` is the pool name in prep-images.py, so the markup never changes.
   `face` picks the portrait preset and is true for every frame with a person
   in it. `note` is why the frame is here. */
const JOBS = [
  // The four 300px staff thumbnails. Real, named members of staff.
  //
  // NOT EVERY 300px FACE CAN BE UPSCALED, and this is the evidence.
  // Run at 4x on 2026-09-08, Gia and Kebra came back faithful. KAREN came back
  // as a DIFFERENT WOMAN - a European face and hair in place of an East Asian
  // one - and ANABEL came back with a visibly narrowed jaw and lightened skin.
  // Re-run at 2x, which reconstructs far less, both drifted the same way
  // again: Karen was still someone else, Anabel still slimmed.
  // So those two are `skip`. Their pages keep the 300px originals, which are
  // soft, and soft is the correct trade: a sharp photograph of a person who is
  // not Karen is not an improvement to Karen's portrait, it is a fabrication
  // of a real named colleague, and no amount of resolution makes it one.
  // The difference is the source, not the setting - Gia's and Kebra's frames
  // are tighter and in focus, and there is enough face left for resemblance to
  // hold on to. Judge the contact sheet, never the settings.
  // Re-run these two only with a better ORIGINAL, never with a lower scale.
  { key: "staff-anabel", from: "2023/12/Anabel-Front-Desk.jpeg", scale: "2x", face: true, skip: true, note: "300x300; reshaped her face at 4x AND 2x" },
  { key: "staff-gia", from: "2023/12/Gia-Front-Desk-1.jpg", scale: "4x", face: true, note: "300x301 thumbnail; 4x verified faithful" },
  { key: "staff-kebra", from: "2023/12/Kebra-Front-Desk.jpeg", scale: "4x", face: true, note: "302x301 thumbnail; 4x verified faithful" },
  { key: "staff-karen", from: "2023/12/Karen-RDH.jpeg", scale: "2x", face: true, skip: true, note: "300x300; returned a different person at 4x AND 2x" },
  // Dr. Nguyen's older portrait, the one the team page runs small.
  { key: "dr-nguyen-2", from: "2020/04/mam.png", scale: "4x", face: true, note: "342x451, the 2020 portrait" },
  // The practice's own frames that are under 1400px.
  { key: "knee-2", from: "2024/11/1.png", scale: "2x", face: true, note: "1000x800 knee-to-knee" },
  { key: "smile", from: "2024/11/2.png", scale: "2x", face: true, note: "1200x900 Dr. Nguyen and a child" },
  // The blog-library frames. People, so soft_portraits, but never captioned as
  // this practice's patients - see the pool notes in prep-images.py.
  { key: "chair", from: "2026/05/MeltdownstoSmilesWhatReallyHappensInsideaPediatricDentalClinic.jpg", scale: "2x", face: true, note: "1200x900" },
  { key: "mother", from: "2026/05/TinyTeethBigDealWhyChoosingtheRightKidsDentistMattersMoreThanYouThink.jpg", scale: "2x", face: true, note: "1050x786" },
  { key: "toddler", from: "2023/08/44.webp", scale: "4x", face: true, note: "682x1024" },
  { key: "baby", from: "2023/08/45.webp", scale: "4x", face: true, note: "640x428" },
  // The waiting room banner: 1920 wide but a 93KB webp, so it is wide and
  // mushy rather than small and sharp. No face in it.
  { key: "waiting", from: "2023/11/Dentist-in-Katy-Office.webp", scale: "2x", face: false, note: "1920x822, 93KB webp" },
];

const api = async (method, url, body) => {
  const r = await fetch(url, {
    method,
    headers: { "x-freepik-api-key": KEY, "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${r.status} ${text.slice(0, 300)}`);
  return JSON.parse(text);
};

async function upscale(buf, job) {
  const created = await api("POST", "https://api.freepik.com/v1/ai/image-upscaler", {
    image: buf.toString("base64"),
    scale_factor: job.scale,
    optimized_for: job.face ? "soft_portraits" : "standard",
    creativity: 1,
    hdr: 2,
    resemblance: 3,
    fractality: 0,
    engine: "magnific_sharpy",
  });
  const id = created.data.task_id;
  for (let i = 0; i < 180; i++) {
    await new Promise((r) => setTimeout(r, 5000));
    const s = await api("GET", `https://api.freepik.com/v1/ai/image-upscaler/${id}`);
    if (s.data.status === "COMPLETED") return s.data.generated[0];
    if (s.data.status === "FAILED") throw new Error(`task failed: ${s.data.error ?? "unknown"}`);
  }
  throw new Error("timed out waiting for the upscaler");
}

if (list) {
  for (const j of JOBS) {
    const src = path.join(MIRROR, ...j.from.split("/"));
    console.log(`${j.key.padEnd(14)} ${j.scale}  ${fs.existsSync(src) ? "src ok " : "MISSING"}  ${j.skip ? "SKIP  " : "      "}${j.note}`);
  }
  process.exit(0);
}

fs.mkdirSync(OUT, { recursive: true });
// `skip` is a rejection recorded in the table, not a to-do: a job marked skip
// produced a face that was not the person. `--only <key>` still runs it, so a
// better original can be tried deliberately.
const queue = JOBS.filter((j) => (only ? j.key === only : !j.skip));
let failed = 0;
const CONCURRENCY = 3;

await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const job = queue.shift();
      const dst = path.join(OUT, `${job.key}.png`);
      try {
        if (fs.existsSync(dst) && !force) { console.log(`skip  ${job.key} (already upscaled)`); continue; }
        const src = path.join(MIRROR, ...job.from.split("/"));
        if (!fs.existsSync(src)) { console.error(`MISSING SOURCE ${job.key}: ${src}`); failed++; continue; }
        console.log(`upscaling ${job.key} ${job.scale} ...`);
        const url = await upscale(fs.readFileSync(src), job);
        const bin = await fetch(url);
        if (!bin.ok) throw new Error(`download ${bin.status}`);
        fs.writeFileSync(dst, Buffer.from(await bin.arrayBuffer()));
        console.log(`ok    ${job.key}  ${(fs.statSync(dst).size / 1024 / 1024).toFixed(1)}MB  -> ${path.relative(HERE, dst)}`);
      } catch (e) {
        failed++;
        console.error(`FAIL  ${job.key}: ${e.message}`);
      }
    }
  }),
);
if (failed) process.exitCode = 1;
