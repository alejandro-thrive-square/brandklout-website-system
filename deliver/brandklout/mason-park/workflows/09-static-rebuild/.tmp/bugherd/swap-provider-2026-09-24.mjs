// "Dr. Dave Cho needs to be more prominent; Dr. Sung only beside Dr. Cho" (2026-09-24).
// Every service page's provider band (.svc-provider) becomes Dr. Cho's: his portrait,
// his name, "Your dentist". Dr. Sung moves to a smaller card inside the band, after the
// stats. The band's sentence is left for the copy pass, which rewrites every mention.
// Idempotent: a band that already names Dr. Cho is skipped.
//   node swap-provider-2026-09-24.mjs > swap-provider-2026-09-24.log
import fs from "node:fs";
import path from "node:path";
const HOME = path.join(import.meta.dirname, "..", "..", "home");
const dirs = fs.readdirSync(path.join(HOME, "services"));
const CHO = (p) => `<img src="${p}assets/uploads/2026/09/mp-dr-cho-portrait-562x750.jpg" srcset="${p}assets/uploads/2026/09/mp-dr-cho-portrait-410x547.jpg 410w, ${p}assets/uploads/2026/09/mp-dr-cho-portrait-562x750.jpg 562w" sizes="(max-width: 767px) 100vw, 24rem" alt="Dr. Dave Cho, DMD" width="562" height="750" loading="lazy" decoding="async">`;
const SUNG = (p) => `<a class="svc-provider_also" href="/our-doctors/">
        <img src="${p}assets/uploads/2026/09/mp-dr-sung-standing-2-410x546.jpg" alt="Dr. William Sung, DMD" width="410" height="546" loading="lazy" decoding="async">
        <span class="svc-provider_also-body"><span class="svc-provider_also-role">Also on the team</span><b>Dr. William Sung, DMD</b><span>Fellow of the Academy of General Dentistry</span></span>
      </a>`;
let changed = 0, skipped = 0;
for (const d of dirs) {
  const f = path.join(HOME, "services", d, "index.html");
  if (!fs.existsSync(f)) continue;
  let h = fs.readFileSync(f, "utf8");
  const a = h.indexOf('<div class="svc-provider">');
  if (a < 0) continue;
  const bodyEnd = h.indexOf('<div class="lf-body', a);
  const end = bodyEnd > 0 ? bodyEnd : h.indexOf("</div>\n  </div>", a);
  let band = h.slice(a, end);
  if (band.includes("Dr. Dave Cho")) { skipped++; continue; }
  if (!band.includes("<h3>Dr. William Sung, DMD</h3>")) throw new Error(`${d}: band does not name Dr. Sung`);
  const p = "../../";
  band = band.replace(/<img\b[^>]*mp-dr-sung-standing-2[^>]*>/, CHO(p));
  band = band.replace("<h3>Dr. William Sung, DMD</h3>", "<h3>Dr. Dave Cho, DMD</h3>");
  band = band.replace('<p class="svc-provider_role">Your provider</p>', '<p class="svc-provider_role">Your dentist</p>');
  // The smaller Dr. Sung card: after the stats when there are any, else after the sentence.
  const stats = band.indexOf("</ul>", band.indexOf('<ul class="svc-stats">'));
  if (band.includes('<ul class="svc-stats">') && stats > 0) band = band.slice(0, stats + 5) + "\n      " + SUNG(p) + band.slice(stats + 5);
  else { const pe = band.lastIndexOf("</p>"); band = band.slice(0, pe + 4) + "\n      " + SUNG(p) + band.slice(pe + 4); }
  h = h.slice(0, a) + band + h.slice(end);
  fs.writeFileSync(f, h);
  changed++;
  console.log(`swap ${d}`);
}
console.log(`${changed} bands now Dr. Cho's, ${skipped} already done`);
