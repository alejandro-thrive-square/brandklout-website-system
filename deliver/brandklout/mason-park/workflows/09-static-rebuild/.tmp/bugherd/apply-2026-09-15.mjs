// The 2026-09-15 BugHerd round's page edits. Idempotent: a swap whose old
// frame is gone and new frame is present counts as already done.
//
//   node apply-2026-09-15.mjs          (from .tmp/bugherd)
//
// #45  The team page gets its own photographs: nine of its fifteen frames were
//      also on the homepage. One scene per slot; captions follow the picture.
// #21  The home band's huddle read glum; team-huddle-smile is the frame where
//      the front of the group is laughing.
// #6   The relay's closing sentence hung alone; a photograph sits beside it.
import fs from "node:fs";
import path from "node:path";

const HOME = path.join(import.meta.dirname, "..", "..", "home");
const manifest = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "..", "album-manifest.json"), "utf8"));

function srcset(key, prefix) {
  const m = manifest[key];
  if (!m) throw new Error(`no manifest entry: ${key}`);
  const big = m.sizes[m.sizes.length - 1];
  return {
    src: `${prefix}assets/uploads/2026/09/${big.file}`,
    srcset: m.sizes.map((s) => `${prefix}assets/uploads/2026/09/${s.file} ${s.w}w`).join(", "),
    w: big.w, h: big.h, alt: m.alt,
  };
}

function imgTag(key, prefix, { sizes, loading = "lazy", fetchpriority } = {}) {
  const s = srcset(key, prefix);
  return `<img src="${s.src}" srcset="${s.srcset}" sizes="${sizes}" alt="${s.alt.replace(/"/g, "&quot;")}" width="${s.w}" height="${s.h}"` +
    (fetchpriority ? ` fetchpriority="${fetchpriority}"` : ` loading="${loading}"`) + ` decoding="async">`;
}

const attr = (tag, name) => (tag.match(new RegExp(`\\s${name}="([^"]*)"`)) || [])[1];
const imgRe = (key) => new RegExp(`<img[^>]*src="[^"]*mp-${key}-\\d+x\\d+\\.jpg"[^>]*>`, "g");

let changed = 0;
function swap(html, file, oldKey, newKey, caption) {
  const prefix = file.includes("/") ? "../" : "";
  const hits = html.match(imgRe(oldKey)) || [];
  if (hits.length === 0) {
    if ((html.match(imgRe(newKey)) || []).length) return html;   // already done
    throw new Error(`${file}: neither ${oldKey} nor ${newKey} found`);
  }
  if (hits.length !== 1) throw new Error(`${file}: ${oldKey} appears ${hits.length} times`);
  const old = hits[0];
  const tag = imgTag(newKey, prefix, { sizes: attr(old, "sizes"), loading: attr(old, "loading") || "lazy", fetchpriority: attr(old, "fetchpriority") });
  let out = html.replace(old, tag);
  if (caption) {
    const cap = new RegExp(`(<figure class="el-sheet_tile" data-caption=")[^"]*(" tabindex="0">)(<img[^>]*mp-${newKey}-)`);
    if (!cap.test(out)) throw new Error(`${file}: no sheet tile around ${newKey}`);
    out = out.replace(cap, `$1${caption}$2$3`);
  }
  console.log(`${file}  ${oldKey} -> ${newKey}${caption ? `  "${caption}"` : ""}`);
  changed++;
  return out;
}

function edit(file, fn) {
  const abs = path.join(HOME, file);
  const before = fs.readFileSync(abs, "utf8");
  const after = fn(before, before.includes("\r\n") ? "\r\n" : "\n");
  if (after !== before) fs.writeFileSync(abs, after);
}

// ---- the team page (#45) ---------------------------------------------------
edit("our-team/index.html", (h) => {
  h = swap(h, "our-team/index.html", "team-front-desk", "team-desk-morning");
  h = swap(h, "our-team/index.html", "team-reception", "team-desk-plan", "The front desk, before the doors open");
  h = swap(h, "our-team/index.html", "team-pair-laughing", "desk-laugh", "The front desk, between calls");
  // desk-call-3 is the same person, desk and call as desk-laugh beside it.
  h = swap(h, "our-team/index.html", "desk-call-3", "clinical-room", "In a treatment room");
  h = swap(h, "our-team/index.html", "hygienist-working-3", "dentist-assistant", "A dentist and his assistant");
  h = swap(h, "our-team/index.html", "team-corridor", "desk-pair-tablet", "Going over the day&rsquo;s plan");
  h = swap(h, "our-team/index.html", "hygienist-working-4", "clinical-charting", "Charting, between patients");
  h = swap(h, "our-team/index.html", "team-window-smile", "hygienist-loupes");
  h = swap(h, "our-team/index.html", "hygienist-working-5", "clinical-pair-chair");
  h = swap(h, "our-team/index.html", "desk-family", "checkin-screen");
  h = swap(h, "our-team/index.html", "desk-patient", "desk-phone");
  h = h.replace("<figcaption>One of the clinical team, between appointments</figcaption>", "<figcaption>One of the hygienists, at the chair</figcaption>");
  return h;
});

// ---- the home page (#21, #6) -----------------------------------------------
edit("index.html", (h, eol) => {
  h = swap(h, "index.html", "team-huddle", "team-huddle-smile");
  if (!h.includes("re-inset")) {
    const anchor = "the appointment that gets dropped.</p>";
    if (!h.includes(anchor)) throw new Error("index.html: relay sentence not found");
    const fig = `${eol}        <figure class="re-inset">${imgTag("checkin-counter", "", { sizes: "(max-width: 899px) 40vw, 12rem" })}<figcaption>The front counter, suite 104A</figcaption></figure>`;
    h = h.replace(anchor, anchor + fig);
    console.log("index.html  relay inset: checkin-counter");
    changed++;
  }
  return h;
});

console.log(`${changed} change(s)`);
