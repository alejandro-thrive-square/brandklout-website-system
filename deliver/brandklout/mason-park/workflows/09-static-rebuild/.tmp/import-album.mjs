// ===========================================================================
// THE PRACTICE'S OWN PHOTOGRAPHS, brought in from the client's album.
//
// WHY THIS FILE EXISTS. The 2026-08-28 handoff pointed at a Google Photos
// album (photos.app.goo.gl/k9MzHrudUfh4QhpW9, titled "MARKETING PHOTOS", 212
// frames) and until 2026-09-02 nothing used it: every page ran on the five
// photographs the old WordPress site published plus a dozen of its licensed
// stock frames. The album is the practice itself -- the front desk, the
// treatment rooms, the sterilizer, the scanner, the team in their own scrubs,
// real families on the waiting room sofa -- and it is what "more images" has
// to mean on a site for a real building.
//
// WHAT IS TAKEN, and the rule. Rooms, people at work, and patients who sat for
// the practice's own marketing photographs. NOT taken: the intraoral
// before/after pairs (frames 005, 008, 051, 053, 060, 066, 127, 175, 185, 198),
// because a clinical result is a claim the practice has to make itself with a
// caption that says whose mouth it is; and frame 187, which is a patient record
// with a name, a date of birth and a phone number on it. Nobody on these pages
// is named unless the practice names them.
//
// HOW. Google serves any frame at any width with an `=w<px>` suffix, so each
// pick is fetched at the four widths the pages' srcsets use and dropped into
// home/assets/uploads/2026/09/ under a name that says what it shows, with the
// WordPress-style `-<w>x<h>` suffix the rest of the folder uses. Dimensions
// are read out of the JPEG itself. The manifest (album-manifest.json) carries
// the alt text and the sizes, and `img()` in the pages was written from it.
//
//   node import-album.mjs            # download what is missing
//   node import-album.mjs --force    # re-download everything
// ===========================================================================
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, "..", "home", "assets", "uploads", "2026", "09");
const URLS = path.join(HERE, "album-urls.txt");
const FORCE = process.argv.includes("--force");
const WIDTHS = [410, 768, 1024, 1536];

// frame number in the sorted album list -> slug and alt text
const PICKS = [
  [64, "team-front-desk", "The Mason Park Dental team gathered at the front desk"],
  [153, "team-reception", "The team at reception before the first appointment of the day"],
  [69, "team-corridor", "The corridor between the front desk and the treatment rooms"],
  [119, "team-pair-talking", "Two of the clinical team talking between appointments"],
  [155, "team-pair-laughing", "Two of the clinical team laughing between appointments"],
  [207, "team-pair-window", "Two of the clinical team by the treatment room window"],
  [132, "team-reading-chart", "Two hygienists reading a chart under the practice's award plaques"],
  [184, "team-plaques", "Two of the team under the practice's award plaques"],
  // BugHerd 2026-09-10: #21 wanted a team frame where nobody looks sad (the
  // front-desk huddle, 64, reads glum), #45 a portrait frame for the team
  // page's narrow pane, #40 a landscape frame for About's 16:9 invitation
  // shot so nobody's head is cropped off.
  [134, "team-huddle", "The team gathered at the front desk before the doors open"],
  [85, "team-window-smile", "One of the clinical team between appointments, by the window"],
  [33, "desk-checkin-pair", "A mother and daughter checking in at the front desk"],
  [131, "kid-xray-smile", "A dentist smiling with a young patient before a digital x-ray"],
  [148, "kid-xray", "Taking a digital x-ray with a young patient"],
  [165, "kid-exam", "A dentist checking a young patient's teeth"],
  [117, "kid-talk", "A dentist explaining the next step to a young patient"],
  [159, "kid-toy-machine", "A toddler at the toy machine after a visit"],
  [171, "kid-toy-machine-2", "A small patient choosing a prize from the toy machine"],
  [125, "kid-shelf", "A young patient with the take-home products at the front desk"],
  [195, "kid-shelf-small", "A small patient beside the take-home product shelf"],
  [177, "kid-shelf-teen", "A young patient holding a take-home kit at the front desk"],
  [160, "sofa-forms", "A couple filling in their new patient forms on a tablet in the waiting room"],
  [97, "sofa-forms-2", "New patient forms on a tablet, on the waiting room sofa"],
  [43, "sofa-forms-3", "Two new patients on the waiting room sofa with the check-in tablet"],
  [172, "desk-call", "The front desk taking a call"],
  [146, "desk-call-2", "A member of the front desk on the phone"],
  [16, "desk-call-3", "The front desk on the phone with a patient"],
  [130, "desk-call-4", "A member of the front desk on the phone"],
  [95, "desk-call-5", "The front desk taking a booking"],
  [211, "desk-tablet", "Checking in on a tablet at the front desk"],
  [115, "desk-tablet-2", "The front desk handing a tablet across the counter"],
  [133, "desk-family", "A mother and daughter reviewing a treatment plan at the front desk"],
  [118, "desk-family-2", "A mother and daughter at the front desk with the treatment plan"],
  [123, "desk-family-3", "A family reviewing a treatment plan together at the front desk"],
  [208, "desk-patient", "A patient and the front desk going through her plan"],
  [38, "desk-patient-2", "A patient talking with the front desk"],
  [57, "scanner-screen", "The intraoral scanner showing a patient's teeth on the screen"],
  [183, "scanner-screen-2", "The scanner's screen during a digital impression"],
  [116, "scanner-screen-3", "A digital impression on screen in the treatment room"],
  [1, "scanner-chair", "A digital scan taken from the chair"],
  [88, "sterilizer", "Instruments coming out of the sterilizer"],
  [40, "sterilizer-2", "A sealed instrument pouch going into the sterilizer"],
  [81, "ceiling-screen", "The view from the chair: a screen on the ceiling"],
  [90, "ceiling-screen-2", "The ceiling screen above the treatment chair"],
  [22, "hygienist-working", "A hygienist at work in a treatment room"],
  [49, "hygienist-working-2", "A hygienist at the chair in a treatment room"],
  [129, "hygienist-working-3", "Two of the clinical team with a patient in the chair"],
  [192, "hygienist-working-4", "A hygienist working with an assistant"],
  [52, "hygienist-working-5", "A hygienist in the pediatric treatment room"],
  [142, "dentist-handheld", "A dentist with the handheld x-ray unit"],
  [76, "dentist-handheld-2", "A dentist setting up a handheld x-ray"],
  [61, "dentist-standing", "A dentist in the treatment room"],
  [201, "girl-chair", "A dentist with a young patient in the chair"],
  [204, "girl-chair-2", "A dentist and a young patient getting ready for a check up"],
  [210, "girl-chair-3", "A young patient smiling in the chair"],
  [124, "girl-chair-4", "A young patient in the chair with the dentist"],
  [44, "schedule-screen", "The day's schedule at the front desk"],
  [101, "pediatric-room", "The pediatric treatment room"],
  [141, "pediatric-room-2", "The pediatric treatment room, with the windows onto the parking lot"],
  [79, "treatment-room", "A treatment room with a patient in the chair"],
  [54, "treatment-room-2", "A treatment room, seen from the corridor"],
  [94, "patient-chair-team", "Two of the team with a patient in the chair"],
  [174, "team-plaques-2", "Two of the team reading a schedule under the award plaques"],
  [20, "team-pair-talking-2", "Two of the clinical team talking in the corridor"],
];

const urls = fs.readFileSync(URLS, "utf8").split(/\r?\n/).filter(Boolean);
fs.mkdirSync(OUT, { recursive: true });

// width and height out of the JPEG's first SOF marker
function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const marker = buf[i + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

const manifest = {};
for (const [n, slug, alt] of PICKS) {
  const url = urls[n - 1];
  if (!url) { console.error(`no url for frame ${n}`); process.exit(1); }
  const sizes = [];
  for (const w of WIDTHS) {
    const res = await fetch(`${url}=w${w}`);
    if (!res.ok) { console.error(`${slug} @${w}: ${res.status}`); process.exit(1); }
    const buf = Buffer.from(await res.arrayBuffer());
    const dim = jpegSize(buf);
    if (!dim) { console.error(`${slug} @${w}: not a jpeg`); process.exit(1); }
    const file = `mp-${slug}-${dim.w}x${dim.h}.jpg`;
    const abs = path.join(OUT, file);
    if (FORCE || !fs.existsSync(abs)) fs.writeFileSync(abs, buf);
    sizes.push({ w: dim.w, h: dim.h, file, bytes: buf.length });
  }
  manifest[slug] = { frame: n, alt, sizes };
  console.log(`${slug.padEnd(22)} ${sizes.map((s) => s.w + "x" + s.h).join("  ")}  ${(sizes[3].bytes / 1024).toFixed(0)} KB`);
}
fs.writeFileSync(path.join(HERE, "album-manifest.json"), JSON.stringify(manifest, null, 2));
console.log(`\n${Object.keys(manifest).length} photographs -> ${path.relative(process.cwd(), OUT)}`);
