// Copies the client's own media out of 01-content-intake into this package.
// Source of truth stays the intake catalogue; nothing here is edited or
// re-encoded, and nothing is invented. Names are flattened to readable slugs so
// the markup reads as design rather than as Webflow asset ids.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.dirname(fileURLToPath(import.meta.url));
const MEDIA = path.resolve(SRC, "..", "..", "..", "01-content-intake", ".tmp", "assets", "media");
const POSTERS = path.resolve(SRC, "..", "..", "..", "01-content-intake", ".tmp", "assets", "video-posters");
const OUT = path.join(SRC, "assets");

// left: file in the intake catalogue. right: the name this package uses.
const MAP = {
  // identity
  "68ecff1adac15261a09155eb_Legacy_dental_pasadena_green_logo.webp": "logo-green.webp",
  "68e3d47d3939b5f40267aa7a_Legacy_footer_logo.svg": "logo-footer.svg",
  "6a2892641830e4fc6c94e5fc_Legacy_Dental_Pasadena_-Invisalign-Diamond-Plus-California.png": "badge-invisalign-diamond.png",
  "69730d0bf3efea2d41366b72_aligntech-faculty-advanced-invisalign-clincheck.webp": "badge-aligntech-faculty.webp",
  "69be094d94c24f50393e23ce_Invisalign-Logo-1-1.avif": "mark-invisalign.avif",

  // people
  "68e3d2351a752c82af35bf5a_Headshot_Dr_Sean.webp": "dr-sean.webp",
  "699d278c0954a36bd513362f_Team_Photo.webp": "team.webp",

  // the practice, its room and its machines
  "699d2f764eb980cbfa882896_L1030288.webp": "aligners-printed.webp",
  "699d278b71138b6bb15a308c_L1030289.webp": "printer.webp",
  "699d278c44f4571d28a8d167_L1030291.webp": "mill.webp",
  "699d29846eb0e94dc30bdfae_L1030293_2.webp": "scanner.webp",
  "68e3ceaf437dcc10dc7d0e55_IMG_0028_Edited_.webp": "office-1.webp",
  "68eb04dfb9c5157f8b91cc43_IMG_0030.webp": "office-2.webp",
  "68eb1b6dd4f313aae843c61a_IMG_0035.webp": "office-3.webp",

  // Invisalign results. Real patients. NO NAMES anywhere: not in the file name,
  // not in a caption, not in alt text. Settled by the client 2026-08-20.
  "68e3d2a35f3209d7621834c0_B_A_Invisalign_Richard.webp": "result-1.webp",
  "68e3d2a35f3209d7621834aa_Rosa_Before_and_After_Invisalign_and_Cleaning_and_crowns.webp": "result-2.webp",
  "69bce2885d3bc3320ee3855c_51F20829-2708-417C-8651-C80DC0D5E82B.avif": "result-3.avif",
  "68f4374595b1b2eea976e4ee_158794487_889921331784267_4172550734435893437_n.webp": "result-4.webp",
  "68f32447e338520639174df2_242913246_4996588593691236_6735902800389115872_n.webp": "result-5.webp",
  "68f32573025fb2e82c5011f5_121068373_339130384021663_7945310055049215671_n.webp": "result-6.webp",
  "68f324d9371841182829a77d_138480568_456615812170893_422491641178256520_n.webp": "result-7.webp",
  "68f42e4db11023b0e64562b0_277906259_1671583156518554_61475407494088376_n.webp": "result-8.webp",

  // people wearing the outcome, for the softer beats
  "69be24e6346bd49824496e6f_Screenshot_2026-03-20_at_9.55.40_PM.webp": "smile-1.webp",
  "69babc2eb88ae0e5e3da3fdf_Screenshot_2026-03-18_at_7.52.01_AM.avif": "smile-2.avif",
  "69bce28b524fec3546c5d91e_83FC9191-8FA7-4713-9E1A-0DF72387C49F.avif": "smile-3.avif",
  "69babaa5e20bf170b407c754_B33B633E-EC2B-463E-8C06-52529505C2B0.webp": "aligner-hand.webp",

  // the practice's own Invisalign film, already transcoded by Webflow
  "68e12d861f12c7f04a762a8e_68edebc1df94d3d39311bfd2_Invisalign-transcode.mp4": "invisalign.mp4",
  "68e12d861f12c7f04a762a8e_68edebc1df94d3d39311bfd2_Invisalign-transcode.webm": "invisalign.webm",
};

// Vimeo posters keep their ids: the id IS how the embed is addressed.
const POSTER_IDS = ["1183600276", "1193010876", "1195848251", "1196557291", "1196557292", "1129777153"];

fs.mkdirSync(OUT, { recursive: true });
let ok = 0;
const missing = [];
for (const [from, to] of Object.entries(MAP)) {
  const src = path.join(MEDIA, from);
  if (!fs.existsSync(src)) { missing.push(from); continue; }
  fs.copyFileSync(src, path.join(OUT, to));
  ok++;
}
for (const id of POSTER_IDS) {
  const src = path.join(POSTERS, `vimeo-${id}.jpg`);
  if (!fs.existsSync(src)) { missing.push(`vimeo-${id}.jpg`); continue; }
  fs.copyFileSync(src, path.join(OUT, `poster-${id}.jpg`));
  ok++;
}
// GSAP travels with the package so headless verification is deterministic.
const gsapOut = path.join(OUT, "gsap");
fs.mkdirSync(gsapOut, { recursive: true });
for (const f of fs.readdirSync(path.join(SRC, "vendor", "gsap"))) {
  fs.copyFileSync(path.join(SRC, "vendor", "gsap", f), path.join(gsapOut, f));
}

console.log(`assets copied: ${ok}`);
if (missing.length) { console.error("MISSING:\n  " + missing.join("\n  ")); process.exit(1); }
