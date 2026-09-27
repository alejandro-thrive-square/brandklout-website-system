// The 2026-09-16 BugHerd round's page edits (notes #50-#77, and the three
// reopened: #1, #43, #3). Idempotent: every replacement whose new text is
// already present and old text is gone counts as done.
//
//   node apply-2026-09-16.mjs          (from .tmp/bugherd)
//
// The site-wide motion and colour fixes are in assets/ (journey.js,
// elevate.js, site.css), not here: see the run's runbook.
//
// #53  "Two stand alone sites that can reference each other ... let Mason Park
//      focus on cosmetic and general dentistry." The homepage's two-practice
//      framing (the relay, Under One Roof, the comparison table, the wall and
//      the people band) is rewritten around this practice; the pediatric
//      practice is named as Mason Park Dental for Kids and referenced, not sold.
// #51 #52 #56  Home hero title, lede and the relay caption, the agency's words.
// #1   Home hero photograph: Drs. Nguyen and Sung with their children (Drive).
// #57-#63  Services: title, lede, "in one screen", the count, prevention first,
//      Dr. Nguyen's photograph on the pediatric half.
// #65  Financing: the insurance answer, from Jessica's Asana comment (09-15).
// #68-#72 #76  Doctors: headline, kickers, Dr. Nguyen's practices, the lede.
// #43  Team: the agency's Canva portraits, named, grouped by role.
import fs from "node:fs";
import path from "node:path";

const HOME = path.join(import.meta.dirname, "..", "..", "home");
const manifest = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "..", "album-manifest.json"), "utf8"));
const team = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, "team-2026-09-16.json"), "utf8"));

const esc = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
function imgTag(key, prefix, { sizes, loading = "lazy", fetchpriority, alt } = {}) {
  const m = manifest[key];
  if (!m) throw new Error(`no manifest entry: ${key}`);
  const big = m.sizes[m.sizes.length - 1];
  return `<img src="${prefix}assets/uploads/2026/09/${big.file}" srcset="${m.sizes.map((s) => `${prefix}assets/uploads/2026/09/${s.file} ${s.w}w`).join(", ")}" sizes="${sizes}" alt="${esc(alt ?? m.alt)}" width="${big.w}" height="${big.h}"` +
    (fetchpriority ? ` fetchpriority="${fetchpriority}"` : ` loading="${loading}"`) + ` decoding="async">`;
}

let changed = 0;
function edit(file, fn) {
  const abs = path.join(HOME, file);
  const before = fs.readFileSync(abs, "utf8");
  const ctx = { html: before, file };
  fn(ctx);
  if (ctx.html !== before) { fs.writeFileSync(abs, ctx.html); console.log(`wrote ${file}`); }
}
// Replace every occurrence of a (a string or a RegExp) with b. When a is
// gone: done if `done` (default: b) is on the page, skipped if `optional`,
// otherwise an error.
function rep(ctx, a, b, note = "", { done = b, optional = false } = {}) {
  const has = typeof a === "string" ? ctx.html.includes(a) : a.test(ctx.html);
  if (!has) {
    if (done && ctx.html.includes(done)) return;
    if (optional) return;
    throw new Error(`${ctx.file}: not found ${note}: ${String(a).slice(0, 90)}`);
  }
  ctx.html = typeof a === "string" ? ctx.html.split(a).join(b) : ctx.html.replace(a, b);
  changed++;
  console.log(`  ${ctx.file}: ${note || String(a).slice(0, 60)}`);
}

/* ------------------------------------------------------------------ home */
edit("index.html", (c) => {
  rep(c, /<img src="assets\/uploads\/2023\/11\/g7-1536x1024\.jpg"[^>]*>/,
    imgTag("family-nguyen-sung", "", { sizes: "100vw", fetchpriority: "high" }), "#1 hero photograph", { done: "mp-family-nguyen-sung-" });
  rep(c, `<h1 class="ar-title" data-split>Two dental practices.<br>One <em>front door.</em></h1>`,
    `<h1 class="ar-title" data-split>Your Lifetime Partner in Dental Health, <em>Today and for Generations to Come</em></h1>`, "#51 title");
  rep(c, `A general practice for adults and a board certified pediatric practice for children, sharing one building and serving families across Harris County.`,
    `From routine cleanings to complete smile makeovers, we care for every smile in your family and across Harris County.`, "#52 lede");
  rep(c, `<div><b>Adults and kids</b><span>Under one roof</span></div><div><b>Board certified</b><span>Pediatric dentistry</span></div>`,
    `<div><b>Cosmetic and general</b><span>Dentistry</span></div><div><b>Katy, TX</b><span>Kingsland Boulevard</span></div>`, "#53 meta");
  rep(c, `<a class="button is-ghost-light is-lg" href="#together">See how that works</a>`,
    `<a class="button is-ghost-light is-lg" href="#together">See the practice</a>`, "#53 hero button");

  // The relay: the same scene, about this practice.
  rep(c, `Most families in Katy run two dental offices. One for the adults. One for the children. Two waiting rooms, two drives across town, two sets of forms, and nobody who has seen the whole family.`,
    `Most people see a dentist when something already hurts. By then a cleaning has become a filling, a filling has become a crown, and nobody showed them what was coming.`, "#53 relay statement");
  rep(c, `<p>It is the reason a child&rsquo;s check gets postponed, and the reason an adult&rsquo;s own cleaning is the appointment that gets dropped.</p>`,
    `<p>Care here starts with prevention: a cleaning, an exam, and a plan you can read before anything is done.</p>`, "#53 relay after");
  rep(c, `<figcaption>One waiting room on Kingsland Boulevard, shared by both practices.</figcaption>`,
    `<figcaption>We are here to guide you and walk you through your treatment options. No rush, no pressure, we take the time to answer all of your questions.</figcaption>`, "#56 caption");
  rep(c, `<p class="re-turn">Here it is one building, one team, one afternoon.</p>`,
    `<p class="re-turn">Here it is one team, and the same faces every visit.</p>`, "#53 relay turn");

  // Under One Roof becomes The Practice.
  rep(c, `data-chapter="2" data-chapter-name="Under One Roof"`, `data-chapter="2" data-chapter-name="The Practice"`, "#53 chapter name");
  rep(c, `<p class="chapter-tag"><i></i><b>Under One Roof</b></p>`, `<p class="chapter-tag"><i></i><b>The Practice</b></p>`, "#53 chapter tag");
  rep(c, `<h2 data-split>The whole family, on one afternoon.</h2>`, `<h2 data-split>Cosmetic and general dentistry, in one place.</h2>`, "#53 together h2");
  rep(c, `Two specialties under one roof: a general practice for adults and a pediatric practice for children, each with its own suite and its own waiting area, so the whole family is seen on one afternoon.`,
    `Cleanings and checkups, fillings and crowns, whitening, veneers and Invisalign&reg;, planned with you and priced in writing before anything starts.`, "#53 together lede");
  rep(c, /<b data-count="3">3<\/b>(\r?\n\s*)<span>Doctors on staff<\/span>/, `<b data-count="2">2</b>$1<span>General dentists</span>`, "#53 figure 1", { done: "General dentists</span>" });
  rep(c, /<b data-count="35">35<\/b>(\r?\n\s*)<span>Treatments offered<\/span>/, `<b data-count="100">100</b>$1<span>Hours of training a year, Dr. Sung</span>`, "#53 figure 2", { done: "Hours of training a year, Dr. Sung" });
  rep(c, `<p class="tg-aside">Three generations of one family are booked in this building most weeks.</p>`,
    `<p class="tg-aside">Most visits start with a checkup and a cleaning, and leave with a plan you can take home.</p>`, "#53 aside");
  rep(c, `<h3>How one building saves your family time.</h3>`, `<h3>What changes when one practice plans it all.</h3>`, "#53 versus title");
  rep(c, `aria-label="Mason Park compared with using two separate dental practices"`, `aria-label="Mason Park compared with a dental visit elsewhere"`, "#53 table label");
  rep(c, `<span role="columnheader" class="vs-b">Two separate practices</span>`, `<span role="columnheader" class="vs-b">Often, elsewhere</span>`, "#53 column");
  rep(c, `data-label="Two separate practices"`, `data-label="Often, elsewhere"`, "#53 cell labels");
  rep(c, `General dentists and a pediatric practice in the same building.</span>`, `Cleanings, fillings, crowns and cosmetic work planned by the same two dentists.</span>`, "#53 row 1a");
  rep(c, `A referral to a children&rsquo;s practice on the other side of Katy.</span>`, `A different office for each kind of work.</span>`, "#53 row 1b");
  rep(c, `A dedicated adult practice with its own waiting area, and the pediatric practice across the hall. Adults come here for general dentistry in its own right, not only as parents.</span>`,
    `A practice for adults and teens, with its own waiting area and the same hygienist next time.</span>`, "#53 row 2a");
  rep(c, `Two practices, two calendars, two half days off work.</span>`, `Whoever is free that day.</span>`, "#53 row 2b");

  rep(c, `<p class="chapter-tag"><i></i><b>Inside the adult practice</b></p>`, `<p class="chapter-tag"><i></i><b>Inside the practice</b></p>`, "#53 wall tag");
  rep(c, `A specialized team focused on adult needs, with its own waiting area, separate from the pediatric practice across the hall.`,
    `A team focused on cosmetic and general care for adults and teens, with its own waiting area in suite 104A.`, "#53 wall lede");
  rep(c, `Full spectrum treatment under one roof.`, `Full spectrum treatment in one practice.`, "#53 range blurb");
  rep(c, `<p class="el-pair_line">One building. <em>One team.</em></p>`, `<p class="el-pair_line">One practice. <em>One team.</em></p>`, "#53 pair line");

  rep(c, `Dr. Nguyen for the children, Dr. Cho and Dr. Sung for the adults. Three doctors who trained together in Boston and share one building in Katy.`,
    `Dr. Cho and Dr. Sung for cosmetic and general dentistry, and Dr. Nguyen, the board certified pediatric dentist at Mason Park Dental for Kids. Three doctors who trained together in Boston.`, "#53 people lede");
  rep(c, `<p class="pe-note">Board certified. The children&rsquo;s side of the hall.</p>`, `<p class="pe-note">Board certified. Mason Park Dental for Kids.</p>`, "#53 Nguyen note");
  rep(c, `Leads the pediatric practice, from the first tooth on.`, `Leads Mason Park Dental for Kids, from the first tooth on.`, "#53 Nguyen blurb");
  rep(c, `<p class="pe-role">General Dentist</p>`, `<p class="pe-role">Cosmetic, Restorative, and General</p>`, "#69/#70 home roles");
  rep(c, `Behind the doctors, a dedicated and specialized team that keeps both the general and the pediatric practice running.`,
    `Behind the doctors, a dedicated team of hygienists, assistants and coordinators, and the same faces every visit.`, "#53 people band");
  rep(c, `welcomes new patients, adults and children alike.`,
    `welcomes new patients, adults and teens alike. Children are seen by Dr. Nguyen at Mason Park Dental for Kids.`, "#53 FAQ (page and JSON-LD)");
});

/* -------------------------------------------------------------- services */
edit("our-services/index.html", (c) => {
  rep(c, `<h1 class="ar-title" data-split>Thirty five treatments. <em>No referral out.</em></h1>`,
    `<h1 class="ar-title" data-split>Everything Your Smile Needs, <em>From Preventive Care to Complete Smile Makeovers</em></h1>`, "#61 title");
  rep(c, `Cleanings to implants, whitening to dentures, in one building on Kingsland Boulevard.`,
    `Cleanings to implants, whitening to dentures, in one practice in Katy, TX.`, "#57 lede");
  rep(c, `<a class="button is-ghost-light is-lg" href="#finder">Start from what is wrong</a>`,
    `<a class="button is-ghost-light is-lg" href="/services/preventative-dentistry/">Start with a checkup</a>`, "#62 button");
  rep(c, `<h2 data-split>Every treatment, in one screen.</h2>`, `<h2 data-split>Find the care you need.</h2>`, "#59 map title");
  rep(c, `Seven groups. Pick one; the photograph is that side of the practice.`,
    `Seven kinds of care. Choose one to see every treatment in it.`, "#58 map lede");
  rep(c, /\s*<figcaption class="el-tabs_count">[^<]*<\/figcaption>/, ``, "#60 count removed", { done: null, optional: true });

  // #62: prevention first. The cleaning row leads the finder.
  rep(c, `<h2 data-split>Start from what is wrong.</h2>`, `<h2 data-split>Start with what you need.</h2>`, "#62 finder title");
  rep(c, `What brought you here on the left, where the practice would begin under it. Nothing is started on the day you arrive.`,
    `Most visits begin with a checkup and a cleaning. Pick the line that fits, and see where the practice would begin.`, "#62 finder lede");
  rep(c, `with a broken tooth. Nine lines, entry by what is wrong, and a sticky`, `with a question. Ten lines, a checkup first (BugHerd #62), and a sticky`, "#62 comment");
  const gums = c.html.match(/[ \t]*<li class="el-finder_item"><a class="el-finder_row" href="#invitation" data-img="gums"[\s\S]*?<\/li>\r?\n/);
  if (gums) {
    const nl = gums[0].includes("\r\n") ? "\r\n" : "\n";
    const row = gums[0]
      .replace(`href="#invitation"`, `href="/services/preventative-dentistry/"`)
      .replace(`Bleeding gums, or a long time since a cleaning`, `A checkup and a cleaning, or it has been a while`)
      .replace(`A deep cleaning, then ongoing gum care with the same hygienist.`, `A cleaning, an exam and x-rays. Gum care if the gums need it, with the same hygienist next time.`);
    c.html = c.html.replace(gums[0], "");
    const first = c.html.indexOf(`<li class="el-finder_item">`);
    const lineStart = c.html.lastIndexOf(nl, first) + nl.length;
    c.html = c.html.slice(0, lineStart) + row + c.html.slice(lineStart);
    let n = 0;
    c.html = c.html.replace(/<span class="el-finder_num">\d+<\/span>/g, () => `<span class="el-finder_num">${String(++n).padStart(2, "0")}</span>`);
    changed++;
    console.log(`  ${c.file}: #62 cleaning row first, ${n} rows renumbered`);
  }
  // The panel's resting frame follows the first row.
  rep(c, `class="is-active" data-img="pain"`, `data-img="pain"`, "#62 pain frame not first", { done: null, optional: true });
  rep(c, /(alt="A hygienist at the chair in a treatment room" width="1536" height="2046") (data-img="gums")/, `$1 class="is-active" $2`, "#62 cleaning frame first", { done: `class="is-active" data-img="gums"` });
  rep(c, `Book a first visit and say what is wrong. The plan and the price are written down before anything starts.`,
    `Book a checkup, and tell us what you would like to change. The plan and the price are written down before anything starts.`, "#62 invitation");

  // #63 and #53: the pediatric half is Dr. Nguyen, and a reference.
  rep(c, /<img src="\.\.\/assets\/uploads\/2026\/09\/mp-team-pair-talking-2-1536x1153\.jpg"[^>]*>/,
    `<img src="../assets/uploads/2023/11/HS-8-scaled.jpg" srcset="../assets/uploads/2023/11/HS-8-683x1024.jpg 683w, ../assets/uploads/2023/11/HS-8-768x1152.jpg 768w, ../assets/uploads/2023/11/HS-8-1024x1536.jpg 1024w" sizes="(max-width: 767px) 100vw, 50vw" alt="Dr. Tam Nguyen" class="is-portrait" loading="lazy" decoding="async">`, "#63 Dr. Nguyen photograph", { done: "class=\"is-portrait\"" });
  rep(c, `<h2 data-split>Adults on one side, the pediatric practice on the other.</h2>`, `<h2 data-split>This practice, and the children&rsquo;s practice next door.</h2>`, "#53 practices title");
  rep(c, `Two practices share this address, so a family is booked through one front desk.`,
    `Mason Park Dental for Kids shares the building, so children have a board certified pediatric dentist a few steps away.`, "#53 practices lede");
  rep(c, `data-chapter-name="The Two Practices"`, `data-chapter-name="Next Door"`, "#53 chapter name");
  rep(c, `<p class="chapter-tag"><i></i><b>The Two Practices</b></p>`, `<p class="chapter-tag"><i></i><b>Next Door</b></p>`, "#53 chapter tag");
  rep(c, `<span class="ab-half_kicker">Across the hall</span>`, `<span class="ab-half_kicker">In the same building</span>`, "#53 kicker");
  rep(c, `<h3>The pediatric practice</h3>`, `<h3>Mason Park Dental for Kids</h3>`, "#53 half title");
  rep(c, `Dr. Nguyen, board certified pediatric dentist. Same address, same front desk.`, `Dr. Tam Nguyen, board certified pediatric dentist, at the same address.`, "#53 half text");
});

/* ------------------------------------------------------------- financing */
edit("financing/index.html", (c) => {
  const old = `We work with major PPO insurance plans and accept most insurance providers.`;
  const now = `We accept all PPO insurance plans, and we also take Delta Dental and Medicaid.`;
  rep(c, old, now, "#65 insurance answer (page and JSON-LD)");
  rep(c, `<th scope="col">Insurance<small>PPO plans</small></th>`, `<th scope="col">Insurance<small>All PPO plans, Delta Dental, Medicaid</small></th>`, "#65 table head");
});

/* --------------------------------------------------------------- doctors */
edit("our-doctors/index.html", (c) => {
  rep(c, `<h2 data-split>Two general dentists, one building.</h2>`, `<h2 data-split>Cosmetic and general dentistry.</h2>`, "#68 headline");
  rep(c, `<p class="cp-kicker">General Dentist</p>`, `<p class="cp-kicker">Cosmetic, Restorative, and General</p>`, "#69 #70 kickers");
  rep(c, `<p class="cp-kicker cp-split_role">Board Certified Pediatric Dentist, the pediatric practice</p>`,
    `<p class="cp-kicker cp-split_role">Board Certified Pediatric Dentist, Mason Park Dental for Kids and Mason Park Dental of Katy</p>`, "#72 role");
  rep(c, `<div><dt>Where</dt><dd>The pediatric practice, same address, same front desk</dd></div>`,
    `<div><dt>Where</dt><dd>Mason Park Dental for Kids and Mason Park Dental of Katy, same address</dd></div>`, "#72 where");
  rep(c, `<p class="pe-lede">The practice&rsquo;s own numbers, from its published biographies. Nothing rounded up.</p>`,
    `<p class="pe-lede">The standards behind the care: training well past what Texas asks of a dentist, and a fellowship few general dentists hold.</p>`, "#76 lede");
});

/* ------------------------------------------------------------------ team */
const GROUPS = [
  { name: "Hygienists", note: "Cleanings, gum care and the checkup", match: /RDH/ },
  { name: "Dental assistants", note: "At the chair beside the doctors", match: /RDA/ },
  { name: "Front office", note: "Plans, insurance and your calendar", match: /Coordinator/ },
];
const ROLE = { RDH: "Registered Dental Hygienist", RDA: "Registered Dental Assistant" };
function roll(prefix, nl) {
  const I = (n) => nl + " ".repeat(n);
  const out = [];
  for (const g of GROUPS) {
    const people = team.filter((p) => g.match.test(p.role) && !/^Dr\./.test(p.name));
    out.push(`${I(6)}<div class="tm-group">`);
    out.push(`${I(8)}<div class="tm-group_head"><h3>${g.name}</h3><p>${g.note}</p></div>`);
    out.push(`${I(8)}<ul class="tm-grid" data-stagger>`);
    for (const p of people) {
      const role = ROLE[p.role] || p.role;
      out.push(`${I(10)}<li class="tm-card"><figure class="tm-card_face">${imgTag(p.key, prefix, { sizes: "(max-width: 479px) 50vw, (max-width: 991px) 33vw, 16rem", alt: `${p.name}, ${role}` })}</figure><p class="tm-card_name"><b>${p.name}</b><span>${role}</span></p></li>`);
    }
    out.push(`${I(8)}</ul>`);
    out.push(`${I(6)}</div>`);
  }
  return out.join("");
}
edit("our-team/index.html", (c) => {
  const nl = c.html.includes("\r\n") ? "\r\n" : "\n";
  rep(c, `<!-- THE FACES. The team, in the practice's own photographs, as a contact${nl}     sheet. Nobody here is captioned by name: the practice publishes no${nl}     roster, and the rule below applies. -->`,
    `<!-- THE FACES. The team at work, in the practice's own photographs, as a${nl}     contact sheet. The named portraits follow in THE TEAM. -->`, "faces comment");
  rep(c, `<p class="el-sheet_line">One team, for the adults and for the pediatric practice across the hall</p>`,
    `<p class="el-sheet_line">One team, and the same faces every visit</p>`, "#53 sheet line");
  if (!c.html.includes(`id="team"`)) {
    const at = c.html.indexOf(`<!-- THE REASON.`);
    if (at < 0) throw new Error("our-team: no THE REASON anchor");
    const block = [
      `<!-- THE TEAM. The agency's Canva portraits (BugHerd #43, 2026-09-16), one`,
      `     studio set, named, grouped by what each person does for a patient. -->`,
      `<section class="ch ch-roll" id="team" data-chapter="3" data-chapter-name="The Team">`,
      `  <div class="wrap cp-head is-split">`,
      `    <div>`,
      `      <p class="chapter-tag"><i></i><b>The Team</b></p>`,
      `      <h2 data-split>The people you will meet.</h2>`,
      `    </div>`,
      `    <p class="pe-lede">Hygienists, assistants and the front office. The same faces at the desk and at the chair, visit after visit.</p>`,
      `  </div>`,
      `  <div class="wrap">`,
      `    <div class="tm-roll">${roll("../", nl)}`,
      `    </div>`,
      `  </div>`,
      `</section>`,
      ``,
      ``,
    ].join(nl);
    c.html = c.html.slice(0, at) + block + c.html.slice(at);
    changed++;
    console.log(`  ${c.file}: #43 THE TEAM chapter, ${team.filter((p) => !/^Dr\./.test(p.name)).length} portraits`);
  }
});

/* ---------------------------------------------- #3 the header logo, all pages
   The artwork ran to every edge of its file; logo-pad.mjs re-exported it with
   transparent margin inside the file (mp-logo-nav-422x180.png). One PNG at
   2.2x the rendered width, so no srcset. */
const LOGO = /<img src="((?:\.\.\/)*)assets\/uploads\/2023\/08\/Dentist-Katy-TX-Logo-2\.webp" srcset="[^"]*" sizes="192px" class="navbar_logo" alt="Mason Park Dental of Katy" width="406" height="156"/;
let logos = 0;
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "assets") walk(abs); continue; }
    if (!e.name.endsWith(".html")) continue;
    const html = fs.readFileSync(abs, "utf8");
    if (!LOGO.test(html)) continue;
    fs.writeFileSync(abs, html.replace(LOGO, `<img src="$1assets/uploads/2026/09/mp-logo-nav-422x180.png" class="navbar_logo" alt="Mason Park Dental of Katy" width="422" height="180"`));
    logos++;
  }
})(HOME);
if (logos) { changed += logos; console.log(`  #3 header logo swapped on ${logos} pages`); }

console.log(`${changed} change(s)`);
