# hackensack-dental-implants · the complete site

Built 2026-10-09, after the home page was approved. Every page of the live site now exists in the
approved design (concept 04, "Human Transformation"), at the same address, so the move needs no
redirects. The home page's own review, with its sources and open items, is
[`canary-review.md`](./canary-review.md).

**Staging:** https://hackensack-dental-implants-staging.up.railway.app/ (not indexed). Production is
untouched; the live Webflow site is untouched.

## How to open it

- **The staging link above** is the one to review and share; every page is linked from the menu.
- Locally: `node code/serve.mjs` from this folder, then http://127.0.0.1:4173/ (any path, e.g.
  `/services/all-on-x`). `OPEN-home.html` opens the home page by double-click.
- Full-page captures of every page at 1440 and 390: `look/pages/<page>/<width>.png` (gitignored).

## The pages (39)

| Group | Pages |
| :--- | :--- |
| Home | `/` (the approved page, unchanged in design) |
| Implant Solutions | `/services` (all treatments), `/services/dental-implants`, `/single-implant`, `/implant-bridges`, `/all-on-x`, `/full-mouth-rehabilitation`, `/implant-revision`, `/smile-makeovers`, `/sedation`, `/emergency-dental-care` |
| About | `/about`, `/dr-alan-meskin`, `/dr-won-sang-lee-dds`, `/dr-maurice-srour-dds`, `/dr-dmitriy-klass-dds-msd`, `/technology`, `/office-gallery`, `/referring-doctors` |
| Patients | `/first-visit-expectations`, `/cost-of-dental-implants`, `/insurance-financing`, `/pre-post-op-instructions`, `/dental-implant-faqs`, `/blog` and its six articles |
| Results | `/gallery` (six consented before and after cases), `/patient-testimonials` |
| Contact | `/contact` (the live booking form and map) |
| Legal | `/privacy-policy`, `/terms-conditions`, `/cookie-policy`, `/hipaa-disclosure`, the 404 page |

## What changed on the approved home page

The design, copy and order are as approved. The comparison against the approved capture is in
`look/ab/`. What differs:

- **The menu** is the site menu: About, Implant Solutions, Patients, Results, Contact, each opening a
  list; under 1280px a burger opens a full-screen drawer. The footer lists every page and the legal
  links.
- **The H1** is now the page's keyword, "Dental Implants in Hackensack, NJ", in the small gold label
  above the headline (SEO standard: one H1 carrying the keyword). "Eat. Smile. Live confidently again."
  looks exactly as before.
- **Links that led nowhere now lead to their pages**: the three treatments, Dr. Meskin's story, the
  surgeons, plus "See our technology" and "See the full Smile Gallery".
- **Under the hood**: every class follows the Client-First standard and every style is editable in
  Instatic's Styles and Framework panels (the agency standard since 2026-10-05).

## How the inner pages are built

- **Copy is the practice's own**, from the live site, placed and not rewritten. Long runs fold behind
  "Read more" (no wall of text). Every change to the old copy is listed in the page's source header
  and summarised below.
- **One component library** for every inner page (`code/site-src/lib/ui.mjs`), the home page's language
  carried across: light grounds that change chapter by chapter, Newsreader statements, gold numerals,
  photographs that bleed off the page edge. Motion: the answer to "What is ..." written by the scroll
  while the chapter holds, the steps of treatment with a counter that follows them, recovery timelines
  drawn by the scroll, rows and cards that slide in, before and after cases wiped by the scroll and
  dragged by the mouse, the doctors' films in a light box.
- **Photographs**: the practice's own first (drive, live site, stills from the two patient films), then
  the live site's licensed Adobe Stock (implant models), then nine Freepik photos for objects and food.
  No stock face sits beside a treatment. Each photo is on at most two pages; each page opens on its own.
  Ledger: `images.csv`.

## To confirm with Brandklout or the client

The content questions the old copy raises. Nothing below was changed on the page unless it says so.

1. **The phone number.** The site uses (551) 368-2476. The privacy policy, terms and HIPAA notice
   (kept verbatim) print (201) 488-8866, the number on the Aesthetic Dental Center awning.
2. **The legal pages** are the live ones, verbatim. The cookie policy reads like a generic template
   (a "Cookie Consent Manager", Flash cookies, dated January 1, 2026); the HIPAA notice carries the HHS
   model's hospital and substance-use (Part 2) wording; the legal entity is "Aesthetic Dental Center of
   Hackensack, LLC DBA Hackensack Center for Dental Implants".
3. **The blog** came with another practice's template. Fixed: "Arvada Dental Center & Implants" and
   "in Arvada" now name Hackensack, four dead links point at the real pages, the second phone number is
   551, and the template's images are gone. **To confirm**: the cost article's figures (sinus lift
   $1,500 to $2,500, extractions $150 to $400 a tooth) and claims (complimentary consultations, a
   dedicated insurance coordinator, 95 to 98% success), and **whether the practice offers zygomatic
   implants** (an article explains them; the site has no page for them).
4. **The cost page prices**, as on the live page: All-on-X acrylic $179 a month or from $13,999;
   zirconia $249 a month, $24,999 struck through to $18,999; single implant from $3,599; bridge from
   $8,999. Both All-on-X cards say "General anesthesia available"; the treatment pages say sedation
   "up to IV sedation".
5. **Numbers and claims**: 50,000+ implants and 30+ years (home and About, the practice's own
   totals); the About letter's "three decades … over 1,000 full-arch cases"; Dr. Lee's and Dr. Srour's
   figures; Dr. Klass called "NYU-trained periodontist" (his periodontics was Boston University);
   "Care in Three Languages" against five in the footer.
6. **The referral page**: the live page's hero named another practice ("Saline Oral Facial & Dental
   Implant Surgery"); it now names Hackensack Center. The referral PDF says "DMD" and "Suite A"; it is
   linked from the Webflow CDN until a corrected PDF is supplied (it disappears when the Webflow site
   is removed).
7. **Copy slips kept verbatim**: "What Affect the cost"; implant bridges' last step headed "Fitting
   Your Final Crown"; single implant "chewing on the other side near the site"; "Chips, Cracks, and
   Gaps" on smile makeovers; "Care in Multi-Languages ... in English, and Spanish" on sedation.
8. **One sentence left out** on emergency care ("These are airway and systemic concerns ..."): its
   "These" points at cases the page never lists.
9. Still open from the home page review: the patient quote beside Isaac, "All-on-4®" (Nobel Biocare's
   trademark), the dentists in the films who are not Dr. Meskin, captions for the films.

## What was checked

Filled in by the run that pushed this; the step runbook has the commands.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../../SYSTEM_RULES.md). Source is tracked
(`code/site-src/` css, js, lib, pages, partials); `dist/`, media, fonts and `look/` are gitignored and
backed up to R2.
