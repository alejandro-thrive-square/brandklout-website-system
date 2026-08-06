// Assembles every page in the site from one shell + one body file per page.
//
// The shell (head tokens, nav, drawer, footer, GSAP flush) lives in partials/ so
// the eleven pages cannot drift apart. Each pages/<slug>.body.html holds only
// <section> elements, each still carrying its own <style> and <script> — the
// self-contained paste units the Webflow build needs.
//
// Usage: node build-site.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SRC = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(SRC, "..", "final-site");
const read = (p) => fs.readFileSync(path.join(SRC, p), "utf8");

const head = read("partials/head.html");
const nav = read("partials/nav.html");
const drawer = read("partials/drawer.html");
const footer = read("partials/footer.html");
const flush = read("partials/flush.html");
const pagekit = read("partials/pagekit.html");

const CHAPTER_READOUT = `<div class="nav-chapter" aria-hidden="true">
        <span>Chapter</span><b id="navCh">00</b><i id="navBar"></i><span id="navName">Arrival</span>
      </div>`;

// nav-links key -> which page is "current"
const NAVKEYS = ["IMPLANTS", "COSMETIC", "GALLERY", "ABOUT", "CONTACT"];

const PAGES = [
  { slug: "index", body: "home", journey: 1, navKey: null,
    title: "Dr. Nahlah — Implant &amp; Prosthodontic Specialists | McLean &amp; Alexandria, VA",
    desc: "Board-certified prosthodontist Dr. Esam Nahlah rebuilds smiles with dental implants, All-on-4 and full-mouth reconstruction in McLean and Alexandria, Virginia." },
  { slug: "dental-implants", journey: 0, navKey: "IMPLANTS",
    title: "Dental Implants in McLean &amp; Alexandria, VA | Dr. Nahlah",
    desc: "Single implants to full-arch reconstruction, planned and placed by a board-certified prosthodontist. Surgery and final teeth under one roof in Northern Virginia." },
  { slug: "all-on-4", journey: 0, navKey: "IMPLANTS",
    title: "All-on-4 Full-Arch Dental Implants | McLean &amp; Alexandria, VA",
    desc: "A fixed full arch on four implants — planned digitally, placed under sedation, often with teeth the same day. All-on-4 with Dr. Esam Nahlah, prosthodontist." },
  { slug: "implant-cost", journey: 0, navKey: "IMPLANTS",
    title: "What Dental Implants Cost &amp; How to Finance Them | Dr. Nahlah",
    desc: "What drives the cost of a dental implant, why quotes differ so widely, and the financing options available at Dr. Nahlah Implants &amp; Prosthodontics Specialists." },
  { slug: "sedation-dentistry", journey: 0, navKey: "IMPLANTS",
    title: "Sedation Dentistry &amp; IV Sedation | McLean &amp; Alexandria, VA",
    desc: "IV-sedation certified with hospital privileges at Inova Fairfax. Long implant appointments pass in what feels like minutes." },
  { slug: "smile-makeover", journey: 0, navKey: "COSMETIC",
    title: "Smile Makeover in McLean, VA | Dr. Nahlah Prosthodontics",
    desc: "A smile designed before anything is prepared — veneers, crowns and implants combined into one plan by a board-certified prosthodontist." },
  { slug: "veneers", journey: 0, navKey: "COSMETIC",
    title: "Porcelain Veneers in McLean &amp; Alexandria, VA | Dr. Nahlah",
    desc: "Hand-layered porcelain veneers designed to the face first. Shape, shade and bite planned by the specialist who places them." },
  { slug: "smile-gallery", journey: 0, navKey: "GALLERY",
    title: "Smile Gallery — Before &amp; After | Dr. Nahlah, McLean VA",
    desc: "Real cases treated at Dr. Nahlah Implants &amp; Prosthodontics Specialists — full-arch implants, veneers and whitening, before and after." },
  { slug: "patient-stories", journey: 0, navKey: "GALLERY",
    title: "Patient Stories &amp; Testimonials | Dr. Nahlah, McLean VA",
    desc: "Patients of Dr. Esam Nahlah tell the story best — filmed testimonials from full-arch implant and smile makeover patients in Northern Virginia." },
  { slug: "about", journey: 0, navKey: "ABOUT",
    title: "Meet Dr. Esam Nahlah, D.D.S., M.S. — Board-Certified Prosthodontist",
    desc: "Diplomate of the American Board of Prosthodontics, hospital privileges at Inova Fairfax, founder of the Tysons Study Club. Meet the specialist." },
  { slug: "contact", journey: 0, navKey: "CONTACT",
    title: "Contact &amp; Locations — McLean and Alexandria, VA | Dr. Nahlah",
    desc: "Two Northern Virginia offices. Tysons Corner in McLean and Old Town Alexandria. Phone numbers, hours, directions and consultation booking." },
];

fs.mkdirSync(OUT, { recursive: true });
let built = 0;
for (const p of PAGES) {
  const bodyFile = `pages/${p.body || p.slug}.body.html`;
  if (!fs.existsSync(path.join(SRC, bodyFile))) {
    console.warn(`SKIP ${p.slug} — no ${bodyFile}`);
    continue;
  }
  const body = read(bodyFile);

  let navHtml = nav
    .replace("{{JOURNEY}}", String(p.journey))
    .replace("{{CHAPTER_READOUT}}", p.journey ? CHAPTER_READOUT : "");
  for (const k of NAVKEYS) {
    navHtml = navHtml.replace(`{{CUR_${k}}}`, p.navKey === k ? ' aria-current="page"' : "");
  }

  const headHtml = head
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${p.title}</title>`)
    .replace(/(<meta name="description" content=")[\s\S]*?(">)/, `$1${p.desc}$2`);

  const out = `${headHtml}
<body>

<!-- ==========================================================================
     FIXED UI — outside #smooth-wrapper so ScrollSmoother never transforms it
     ========================================================================== -->
${navHtml}
${drawer}

<div id="smooth-wrapper">
<div id="smooth-content">
<main id="top">
${p.journey ? "" : pagekit}
${body}

</main>

${footer}
</div><!-- /#smooth-content -->
</div><!-- /#smooth-wrapper -->

${flush}
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, `${p.slug}.html`), out);
  built++;
}
console.log(`built ${built}/${PAGES.length} pages -> ${path.relative(process.cwd(), OUT)}`);
