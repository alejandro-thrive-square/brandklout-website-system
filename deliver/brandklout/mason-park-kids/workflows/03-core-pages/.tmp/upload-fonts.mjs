/**
 * Self-hosts the VARIABLE Fraunces and Nunito on Instatic, because the
 * platform's own font installer only installs static instances.
 *
 *   node upload-fonts.mjs --fetch     download the two woff2 into _fonts/
 *   node upload-fonts.mjs             upload them, write font-map.json
 *   node upload-fonts.mjs --dry       say what would happen
 *
 * WHY. `diff-live.mjs` reported every heading on every live page 10-20% wider
 * than the same heading locally, and `font-axes.mjs` found the reason:
 *
 *     local  Fraunces is VARIABLE. "opsz" 9 measures 1665px, "opsz" 144
 *            measures 1340px on the same string. The axes move it.
 *     live   Fraunces is a STATIC INSTANCE. "opsz" 9 and "opsz" 144 both
 *            measure 1657px. The axes do nothing at all.
 *
 * So `font-variation-settings: "SOFT" 100, "opsz" 144` - which is on every
 * display face in site.css and is where this brand's "soft and slightly wonky"
 * comes from - was being silently dropped on the published site, and every
 * live heading was set in the TEXT cut of Fraunces at display size. Not a
 * width bug: the wrong cut of the typeface, on all fifty-seven pages.
 *
 * Instatic's `/admin/api/cms/fonts/install` takes a family and a list of
 * static weights and asks Google for exactly that, so there is no axis to
 * pass. The route around it is the media library: a woff2 is just a file, and
 * `@font-face` in our own stylesheet can point at wherever it lands.
 *
 * The family is registered as "Fraunces VF", not "Fraunces". Naming it
 * "Fraunces" would put it in a fight with the five static instances the
 * platform already installed and registered on the shell, and which of the two
 * won would depend on asset order - the exact trap `reorder-styles.mjs` exists
 * for. A separate name in front of the stack cannot collide, and if the upload
 * ever disappears the stack simply falls back to the static Fraunces, which is
 * what live has today.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { uploadFile, listMedia, BASE } from "./insta.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(HERE, "_fonts");
// `--fetch` writes BOTH here and into the site, because site.css names two
// sources for every face: the Instatic upload first, then this relative path.
// A woff2 is gitignored repo-wide (the root ignores every font extension, to
// keep scraped Elementor families out), so both copies are regenerated, and
// `--fetch` is the one command that regenerates them.
const LOCAL = path.resolve(HERE, "..", "home", "assets", "fonts");
const MAP = path.join(HERE, "font-map.json");
const argv = process.argv.slice(2);
const FETCH = argv.includes("--fetch");
const DRY = argv.includes("--dry");

/* The Google CSS2 request has to name the AXES, or Google serves a static
   instance - the same mistake the platform's installer makes. A modern
   User-Agent is required too: with none, Google serves ttf. */
const WANT = [
  /* 2026-09-16, BugHerd #4: the practices' brand guide (Nikole Culo Designs,
     Nov 2021, in the Mason Park shared drive) sets Collier, FreightNeo Pro and
     Avenir Next. All three are Adobe-licensed and there is no Adobe Fonts web
     project, so the site uses the nearest open faces: Marcellus for Collier
     (the flared, glyphic caps of the logo), Figtree for Avenir Next. The old
     Fraunces/Nunito entries stay in font-map.json but nothing names them. */
  {
    file: "marcellus.woff2",
    family: "Marcellus MP",
    css: "https://fonts.googleapis.com/css2?family=Marcellus",
    style: "normal",
    weight: "400",
  },
  {
    file: "figtree-vf.woff2",
    family: "Figtree VF",
    css: "https://fonts.googleapis.com/css2?family=Figtree:wght@300..900",
    style: "normal",
    weight: "300 900",
  },
  {
    file: "figtree-vf-italic.woff2",
    family: "Figtree VF",
    css: "https://fonts.googleapis.com/css2?family=Figtree:ital,wght@1,300..900",
    style: "italic",
    weight: "300 900",
  },
];

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

if (FETCH) {
  fs.mkdirSync(DIR, { recursive: true });
  for (const w of WANT) {
    const css = await (await fetch(w.css, { headers: { "user-agent": UA } })).text();
    // The LAST src in the sheet is the widest subset; latin is what we serve.
    const blocks = css.split("@font-face").filter((b) => b.includes("src:"));
    const latin = blocks.find((b) => /unicode-range:[^;]*U\+0000/.test(b)) ?? blocks[blocks.length - 1];
    const m = /url\((https:\/\/[^)]+\.woff2)\)/.exec(latin);
    if (!m) { console.error(`no woff2 in the sheet for ${w.family} ${w.style}`); process.exitCode = 1; continue; }
    const bin = await fetch(m[1]);
    if (!bin.ok) { console.error(`download ${bin.status} for ${w.file}`); process.exitCode = 1; continue; }
    const buf = Buffer.from(await bin.arrayBuffer());
    fs.mkdirSync(LOCAL, { recursive: true });
    fs.writeFileSync(path.join(DIR, w.file), buf);
    fs.writeFileSync(path.join(LOCAL, w.file), buf);
    console.log(`${w.file.padEnd(24)} ${(buf.length / 1024).toFixed(0)}KB  ${m[1]}`);
  }
  console.log(`\n-> ${path.relative(HERE, DIR)} and home/assets/fonts/   now run without --fetch to upload`);
  process.exit(0);
}

console.log(BASE);
const listed = await listMedia();
const existing = new Map();
for (const a of listed.assets ?? listed.rows ?? []) {
  existing.set(`${a.filename ?? a.name}|${a.sizeBytes ?? a.size}`, a.publicPath ?? a.url ?? a.path);
}

const map = fs.existsSync(MAP) ? JSON.parse(fs.readFileSync(MAP, "utf8")) : { faces: {} };
let failed = 0;
for (const w of WANT) {
  const abs = path.join(DIR, w.file);
  if (!fs.existsSync(abs)) { console.error(`  no ${w.file} - run with --fetch first`); failed++; continue; }
  const buf = fs.readFileSync(abs);
  const hit = existing.get(`${w.file}|${buf.length}`);
  if (hit) {
    map.faces[w.file] = { url: hit, family: w.family, style: w.style, weight: w.weight };
    console.log(`  reused  ${w.file} -> ${hit}`);
    continue;
  }
  if (DRY) { console.log(`  would upload ${w.file} (${buf.length} B)`); continue; }
  try {
    const res = await uploadFile("/admin/api/cms/media", w.file, buf, "font/woff2");
    const a = res.asset ?? res.media ?? res;
    const url = a.publicPath ?? a.url ?? a.path;
    if (!url) throw new Error(`no path in ${JSON.stringify(res).slice(0, 200)}`);
    map.faces[w.file] = { url, family: w.family, style: w.style, weight: w.weight };
    console.log(`  uploaded ${w.file} -> ${url}`);
  } catch (e) {
    console.error(`  FAILED ${w.file}: ${String(e.message).slice(0, 300)}`);
    failed++;
  }
}

if (!DRY) {
  fs.writeFileSync(MAP, JSON.stringify(map, null, 2));
  console.log(`\n-> ${path.relative(HERE, MAP)}`);
}
if (failed) process.exitCode = 1;
