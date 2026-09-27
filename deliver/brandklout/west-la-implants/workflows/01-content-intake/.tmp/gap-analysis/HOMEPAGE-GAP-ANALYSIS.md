# Homepage Gap Analysis: West LA Implants vs Three LA Implant Competitors

| Field | Value |
| :--- | :--- |
| **Client** | West LA Implants, `westlaimplants.com` (Dr. Tony Barriere, DDS) |
| **Client address** | 12301 Wilshire Blvd #205, Los Angeles CA 90025 |
| **Competitor 1** | Wilshire Oral Surgery & Implant Center, `wilshireoralsurgery.com` — 12300 Wilshire Blvd #326 (across the street) |
| **Competitor 2** | Santa Monica Center for Oral Surgery, `santamonicaoms.com` — 2001 Wilshire Blvd, Santa Monica |
| **Competitor 3** | Implant Center Los Angeles / Wilshire Smile Studio, `implantcenterlosangeles.com` — 6200 Wilshire Blvd #1609 |
| **Pulled** | Client + Wilshire 2026-08-20; SMOMS + ICLA 2026-09-10. Screenshots all 2026-09-10, 1440px wide |
| **Scope** | Homepage only. Site-level comparison is in [`CONTENT-GAP-ANALYSIS.md`](./CONTENT-GAP-ANALYSIS.md) |
| **Feeds** | `02-wireframe`, `03-graphic-resources`, `06-content-seo` |
| **Design target** | `concept-03` — dark editorial, Bodoni Moda + Manrope, gold accent. Client-approved |

This is a content and layout read of four homepages, taken from the scraped markdown, the
rendered HTML and the four full-page screenshots. It exists to answer one question: what
does the new West LA Implants homepage have to contain to win an implant lead on this block?

---

## (a) Scoreboard

| | **West LA Implants** | **Wilshire Oral Surgery** | **Santa Monica OMS** | **Implant Center LA** |
| :--- | :--- | :--- | :--- | :--- |
| Word count | 1,118 | 1,162 | 6,757 *(inflated: a hidden duplicated review carousel repeats 72 times)* | **421** |
| Images | 17 | 21 | 50 | 30 |
| Rendered page height @1440px | 5,984 px | **17,081 px** | 7,374 px | 6,967 px |
| Content sections | 9 | 11 | 11 | 15 |
| Video on the page | **2 self-hosted (Master-Broll hero, Dr-Broll) + 3 YouTube patient stories** | none | 1 office walkthrough | none |
| `h1` | **"Home"**, then a second `h1` "General Dentist - Los Angeles, CA" | "Wilshire Oral Surgery and Implant Center" | "Santa Monica's Best in Oral Surgery" (duplicated) | "Dental Implants Los Angeles" (below two `h2`s) |
| Header CTA | phone number only, no button | **"Call or Text", "Request An Appointment", "Patient Registration"** | "Book Appointment" (sticky) | "$99 Special … CALL NOW" bar + "BOOK APPOINTMENT" |
| CTAs in body, and where | 1 tab strip (mid), 1 "Call Now" (base) | 2 (top), form (65%), area grid (90%) | 6 (hero, 25%, 60%, 80%, 95%) | 8 (bar, hero, 35% form, 85% form) |
| Phone prominence | header, footer. **Footer displays (310) 481-0111 but the link dials (310) 692-9316** | header, footer, sticky | header, footer | **4 places incl. a dedicated dark strip under the hero** |
| Inline lead form | **none** | **11 fields + insurance-card upload** | none (links to `/book-appointment`) | **two 4-field forms** |
| Credentials named | AACD / AAID / ADA, Ohio State, NYU Langone — in body prose, no badges | **"board-certified" in para 2** | "Expert Surgeons" icon card | role labels per doctor (Oral Surgeon / Periodontist) |
| Star rating shown | **none visible** (`AggregateRating 4.9 / 40` in JSON-LD only) | **"Over 300 5-Star Reviews" eyebrow + Google widget** (`4.9 / 238` in schema) | **5 gold stars on each review card** | none |
| Review quotes | 4 real Google quotes — **hidden inside the 4th tab** | **6 named quotes, always visible** | **8 named quotes in a carousel** | none |
| Years / volume proof | none on page | "Over 300 5-Star Reviews" | **"EST 1974 · 50 Years of Oral Surgery Care"** | none |
| Pricing / financing | **none** | *(hub page: All-on-4 from $9,990, $110/mo, 0% financing, free consult)* | none on home | **"$99 Special — Implant Consult + CT Scans" bar + CareCredit block** |
| Technology named | **Yomi® robot, 3D printer, CBCT** | *(Cone Beam 3D Imaging as a service row)* | "Advanced Technology" icon, unnamed | none |
| FAQ on the homepage | **none** | none | **5-question accordion + `FAQPage` schema** | none |
| Neighbourhood / service area | **none** | **9-neighbourhood grid with drive times** | none | headline list: "Serving Los Angeles, Santa Monica, Beverly Hills, West Hollywood" |
| Team treatment | 1 doctor, 1 paragraph, 1 portrait | **2 surgeons, portraits + Read More** | **6 surgeons, large tiles with surname watermarks** | **4 doctors on an LA-skyline band** |
| Patient stories | **3 named video stories: Leslie, Emily, Michael** | none | 2 named patient portraits tagged "Dental Implant" | none |
| Before / after | none on homepage (tab label only) | none | none | none |
| Press / media logos | none | none | none | **12-logo "As Seen On" wall** (NBC, ABC, CBS, Fox, USA Today, LA Weekly, FLAUNT, Dentistry Today …) |
| Map embedded | none | none | none | **Google Map** |
| Hours on page | footer only | footer | **footer table** | **dark strip under the hero + footer** |

Two scoreboard cells deserve a note.

- **SMOMS's 6,757 words are not real.** A duplicated, visually hidden testimonial carousel
  repeats the same six reviews twelve times. Their visible copy is roughly 900 words — the
  same band as the client and Wilshire.
- **ICLA's `$99 Special` never reaches the body text.** It runs as an announcement bar and
  as a baked JPEG. A search engine, a screen reader and an answer engine all see nothing.
  Their headline offer is invisible to everything except a sighted browser.

---

## (b) Section-by-section walk

### West LA Implants (current) — 9 sections, 5,984 px

| # | Section | What it does well |
| ---: | :--- | :--- |
| 1 | Utility bar: logo, `(310) 481-0111` | Phone is above everything else |
| 2 | Blue nav: Dental Implants / Aesthetic Dentistry / Services / Conditions We Treat / What To Expect / Who We Are / Contact / Patient Portal | The IA is genuinely good — "Conditions We Treat" is a patient-language entry no competitor has |
| 3 | Split hero: dark copy panel + operatory photo with a play button ("Get a Sneak Peek", `Master-Broll.mp4`) | Real footage of the real office in the hero. Nobody else in the set opens with owned video |
| 4 | Four-tab strip: What To Expect / Meet The Doctors / Smile Gallery / Our Reviews | Compresses four proof types into one band — but shows only one at a time |
| 5 | "What to expect": doctor-with-patient photo + Yomi / 3D printer / same-day emergencies | Names the technology in the first body paragraph |
| 6 | Blue band: "Top-Of-The-Line Technology. Superior Care." + Dr. Barriere portrait with a play button | The one place the practice argues *why* it is different |
| 7 | "Our First-Class Services": 4 tall cards — Full Mouth Implants, Cosmetic, Wisdom Teeth, Sedation | Covers the four money intents in one row |
| 8 | "Our Patients Tell The Story Best": carousel of 3 video stories with quote headlines | The strongest asset on the page and the hardest for any competitor to copy |
| 9 | "Discover The Difference." + footer (contact, hours, services, about) | One clear closing ask |

Defects visible in the screenshot: the `h1` is the word **"Home"**; the review tab is closed
by default so the page ships with **zero visible social proof**; the story carousel renders a
broken alt attribute as the literal text **"logo-dark"** next to each card; there is **no form
anywhere**; the service cards are walls of unbroken body copy in a narrow column.

### Wilshire Oral Surgery — 11 sections, 17,081 px

| # | Section | What it does well |
| ---: | :--- | :--- |
| 1 | Sticky header: Call-or-Text, Request An Appointment, Patient Registration | Three ways to act, permanently on screen |
| 2 | Full-bleed sunset hero over the neighbourhood, "Welcome to …" | Sells the location, not the procedure |
| 3 | "The Needs Of The Patient Come First" | Puts **board-certified** in the second paragraph |
| 4 | "Our Team": 2 surgeon portraits | Faces early |
| 5 | "Our Featured Services": **12 full-width image rows** | Exhaustive scope — and the reason the page is 17,000 px; it is a scroll trap |
| 6 | "What To Expect": Patient Registration / Insurance / Length Of Procedure | **Logistics as reassurance.** "Wisdom teeth take 30–60 minutes." Nobody else answers the practical questions |
| 7 | "Over 300 5-Star Reviews" → **Patient Testimonials**, 6 named quotes | Volume claim then evidence, in that order |
| 8 | "Our Reviews": embedded Google widget | Third-party proof, not self-reported |
| 9 | "Contact Us": 11-field form incl. insurance name, ID, DOB and **insurance-card photo upload** | Captures a near-complete intake before the patient ever calls |
| 10 | **"Serving the Westside of Los Angeles"**: 9-neighbourhood grid with drive times ("10–15 min east on Wilshire") | The single smartest block on any of the four homepages |
| 11 | Footer: contact, hours, accessibility statement | — |

### Santa Monica Center for Oral Surgery — 11 sections, 7,374 px

| # | Section | What it does well |
| ---: | :--- | :--- |
| 1 | Minimal header: hamburger, centred wordmark, Book Appointment | Restraint; the CTA is the only coloured thing |
| 2 | Hero: a warm interior lounge photo, not a clinical one | Sells *arriving* rather than *being treated* |
| 3 | **"EST 1974 · 50 Years of Oral Surgery Care"** badge + office video | One number does all the authority work |
| 4 | "Why Choose Us": 4 icons — Expert Surgeons, Advanced Technology, Patient-Centered, Comprehensive | Scannable in two seconds |
| 5 | Reviews: **two large real patient portraits** labelled "Dental Implant" beside a starred review card | Pairs a face with a procedure with a rating — the best-built proof block in the set |
| 6 | "Meet our Team": 6 surgeon tiles, surname watermarked across each portrait | Editorial treatment of headshots; worth stealing as a *technique* |
| 7 | "Oral Surgery Procedures": 3x3 tile grid, "View All" as the highlighted tile | Dense and fast; no body copy at all |
| 8 | "Transform Your Smile Today" wide interior band | A visual breath before the close |
| 9 | **FAQ accordion, 5 questions, with `FAQPage` schema** | The only homepage in the set with an answer-engine surface |
| 10 | Final CTA: dark copy panel + smiling patient photo | Clean split close |
| 11 | Footer: location, hours table, 3 link columns | — |

Their own defect: the Santa Monica homepage's FAQ and final CTA say **"Beverly Hills"** five
times. It is copy pasted from their second location and never corrected.

### Implant Center Los Angeles / Wilshire Smile Studio — 15 sections, 6,967 px

| # | Section | What it does well |
| ---: | :--- | :--- |
| 1 | Announcement bar: "$99 Special — Dental Implant Consult + CT Scans. CALL NOW" | An offer before the logo |
| 2 | Hero: founder's quote in script + cut-out portrait, BOOK APPOINTMENT | Personality-led, not procedure-led |
| 3 | Dark strip: phone · hours · address · email | **Every practical fact in one band under the hero.** Cheap and very effective |
| 4 | "$99 SPECIAL" offer graphic with two doctors | Repeats the offer — but as a JPEG |
| 5 | **"AS SEEN ON" 12-logo press wall** | Borrowed authority at scale; the strongest trust device on any of the four |
| 6 | "Serving Los Angeles, Santa Monica, Beverly Hills, West Hollywood, and More" | States the catchment in an `h2` |
| 7 | "Book Your Appointment": 4-field form at ~35% scroll | Short form, high on the page |
| 8–10 | Three alternating service blocks: Dental Implants / All-on-Four / Sedation | One idea, one image, one paragraph each |
| 11 | "We Accept CareCredit" + logo | Money question answered in one line |
| 12 | "Our Team": 4 doctors over an LA skyline, each with a role label | Specialism made legible: Oral Surgeon, Periodontist, Cosmetic Dentist |
| 13 | Three blog teasers | Freshness signal |
| 14 | Second contact form over a clinical photo + **Google Map** | Two chances to convert |
| 15 | Footer: CareCredit, services, links, contact | — |

At 421 words this is the thinnest page in the set, and it still out-converts the client's
structurally, because every section asks for something.

---

## (c) The gaps, ranked by likely impact on a new-patient implant lead

| # | Gap | Who does it | Why it costs leads |
| ---: | :--- | :--- | :--- |
| 1 | **No lead form on the homepage.** Every conversion depends on a phone call or a nav click | Wilshire (11 fields), ICLA (two 4-field forms) | Implant research happens at night and on mobile. With no form, out-of-hours intent evaporates |
| 2 | **Zero visible social proof.** The four real Google quotes sit inside the 4th tab, closed by default | Wilshire, SMOMS, both always-visible | The page ships with no proof at all above the fold or below it |
| 3 | **No star rating or review count on the page.** The client's own JSON-LD already carries `4.9` | Wilshire prints "Over 300 5-Star Reviews"; SMOMS stars every card | A rating is the fastest trust transfer available and the client is hiding one it already claims |
| 4 | **No money signal of any kind** | Wilshire (prices, 0% financing, free consult); ICLA ($99 consult, CareCredit) | "What will this cost" is the second question after "will it work". The client has six lenders and an in-house savings plan and mentions none of it |
| 5 | **The `h1` is "Home"**, with a second `h1` reading "General Dentist - Los Angeles, CA" | All three name the practice or the procedure | The one string Google weighs most says nothing, and "General Dentist" actively undersells an implant practice |
| 6 | **No booking button in the header** | Wilshire 2, SMOMS 1 sticky, ICLA 1 + offer bar | The highest-intent click has no permanent home |
| 7 | **No numeric authority on the page** — no years, no case volume, no CE hours | Wilshire "Over 300 5-Star"; SMOMS "EST 1974 · 50 Years" | The client's equivalents exist but are buried on `/commitment-to-excellence/` |
| 8 | **No FAQ block and no `FAQPage` schema** | SMOMS | This is the shape AI Overviews and answer engines cite. The client has written FAQ answers already, on a deeper page |
| 9 | **No service-area block** | Wilshire's 9-neighbourhood drive-time grid | An implant patient chooses partly on travel. The homepage says only "Los Angeles" |
| 10 | **No credentials or affiliation strip.** AACD / AAID / ADA, Ohio State, NYU Langone are prose | ICLA's 12-logo press wall; Wilshire's board-certified line | Badges are read; paragraphs are skimmed |
| 11 | **No before-and-after anywhere on the page** | Nobody — this is uncontested | The client has 52 before/after case files, three of which are Leslie, Emily and Michael. It appears as a tab label |
| 12 | **No hours, address or map in a scannable strip** | ICLA's dark strip; SMOMS's hours table; ICLA's map | Footer-only means a scroll to the end to learn whether the practice is open |
| 13 | **Phone display and phone link disagree in the footer.** Visible text reads `(310) 481-0111`, `href` is `tel:+1-310-692-9316` | — | A tap and a manual dial reach different lines. Call attribution is unreliable either way |
| 14 | **The practice is one face.** No team presence at all | SMOMS 6 portraits, ICLA 4, Wilshire 2 | A solo doctor reads as smaller than a centre. The client has a staff photo (`staff.jpg`) and uses it nowhere |
| 15 | **Broken alt text renders as visible copy.** "logo-dark" prints beside each patient story card | — | It is on the most valuable section of the page |

### Where `concept-03` is thin against the competitors

The approved concept fixes the type, the grounds and the hierarchy. It does not yet fix the
content. Measured against the same scoreboard, the concept is still missing:

| Missing from the concept | Matched by | Fix |
| :--- | :--- | :--- |
| Any review, rating or quote attribution | Wilshire, SMOMS | Add a reviews section (blueprint §8) |
| The three patient story films as a section | nobody — client-only asset | Add (blueprint §5) |
| Before-and-after | nobody | Add (blueprint §9) |
| Service area / neighbourhood | Wilshire, ICLA | Add (blueprint §14) |
| Financing signal | Wilshire, ICLA | Add (blueprint §11) |
| Hours, map, "open today" | ICLA, SMOMS | Add to the location close (§14) |
| Team beyond the doctor | SMOMS, ICLA, Wilshire | Add the staff photo to §7 |
| `FAQPage` schema on the FAQ | SMOMS | Mark up §13 |
| The correct phone number | — | The concept header shows `(310) 481-0111`. Must be **(310) 692-9316** |

One more thing about the concept: **its body copy is strategy notes, not patient copy.**
Lines like *"The redesign should make the implant specialty unmistakable"* and *"Real patient
stories should become a central conversion tool instead of a secondary gallery"* are written
to the agency, not to a patient with a failing bridge. Every paragraph in the concept needs
rewriting before it is real copy. The headlines are good and should survive.

---

## (d) Where the client already wins — do not lose these

| Asset | Client | Wilshire | SMOMS | ICLA |
| :--- | :--- | :--- | :--- | :--- |
| **Yomi® robotic implant guidance** | named on the homepage, dedicated page | none | none | none |
| **Named patient story films** — Leslie (Full Arch All-On-4), Emily (Crowns & Implants), Michael (Full Mouth Reconstruction) | 3, with quote headlines | none | 2 photos, no film | none |
| **Owned B-roll of the real office and doctor** — `Master-Broll`, `Dr-Broll`, `Emily-B-ROLL`, `Leslie-Broll` | 4 clips, 33 MB | none | 1 architecture clip | none |
| Real photography of the doctor with real patients | yes (`emily_barrerie_patient_interaction`, `barriere_dentalpatient_welcoming`, the hug frame used in the concept hero) | stock + staff portraits | stock + portraits | studio cut-outs |
| Media library depth | **219 distinct assets** | 59 | 142 | 35 |
| Prosthetic breadth — hybrid fixed-detachable, zirconia fixed bridge, implant-supported dentures | 3 dedicated pages | 0 | 0 | 0 |
| Cosmetic line — veneers/Lumineers, whitening, smile makeover, Invisalign | 5 pages | 0 | 0 | 1 job title |
| "Conditions We Treat" patient-language IA | 4 pages | none | none | none |
| `VideoObject` schema | **5 pages** (homepage clip is `Master-Broll.mp4`) | none | none | none |
| Before/after case library | **52 files**, incl. Leslie, Emily and Michael's own cases | none | none | none |
| Blog archive | 46 posts | 13 | 53 | 17 |

Two corrections to the August analysis, found in this pass:

- The client **does** already emit `AggregateRating` (`4.9`, `40` reviews) and `VideoObject`
  on its homepage. The August pass read only top-level `@type` and missed both.
- Wilshire **now** emits `LocalBusiness` + `AggregateRating` (`4.9`, `238` reviews) +
  `BreadcrumbList` on all 79 pages, and SMOMS emits `FAQPage` on its homepage. The client's
  structured-data lead is real but much narrower than the August document concluded. See the
  update section in `CONTENT-GAP-ANALYSIS.md`.

---

## (e) Recommended homepage blueprint — 14 sections

Order matters: proof arrives before the ask, and the ask repeats three times. Every headline
below is a direction, not final copy — short, editorial, one sentence per idea, in the
Bodoni Moda display voice the concept established.

### 1. Sticky header

- **Purpose** — make calling and requesting a consultation permanently available.
- **Pattern from** — Wilshire (three header actions) and SMOMS (one sticky button, restrained).
- **Real client facts** — new-patient line **(310) 692-9316**; nav mirrors the existing IA:
  Implants · Technology · Dr. Barriere · Results · Contact.
- **Headline direction** — none. A wordmark, a phone, a button.
- **Assets** — `westlaimplants_logo_white_web.png`.
- **Note** — replace the current-patient line `(310) 481-0111` everywhere in the header and
  hero. Keep it only in a "Current patients" utility link, and make display text and `href`
  agree, which they do not today.

### 2. Hero

- **Purpose** — name the specialty and the city in one breath, with one primary action.
- **Pattern from** — `concept-03`, kept as approved. It already beats all three competitors
  on hierarchy.
- **Real client facts** — implant and cosmetic dentistry; West Los Angeles; consultation.
- **Headline direction** — "Advanced surgery. Exceptional standards." (approved concept line).
  Eyebrow: "Implant & cosmetic dentistry · West Los Angeles". Sub: one sentence, patient-facing.
- **Assets** — the hug frame `barriere_dentalpatient_welcoming_westlaimplants3.jpg` as the
  still; `Master-Broll.mp4` as an optional muted background loop, as the current site already does.

### 3. Proof bar

- **Purpose** — put the numbers directly under the hero, where Wilshire and SMOMS put theirs.
- **Pattern from** — Wilshire's hero stat stack; SMOMS's "EST 1974" badge.
- **Real client facts, verified-only** — `Yomi®` robotic guidance · 3D CBCT planning ·
  IV sedation available · `4.9` on Google. **Leave the implants-placed cell empty until the
  client confirms the figure** (see verification list below).
- **Headline direction** — no headline. Four cells, one word each plus a caption.
- **Assets** — none; type only, on the concept's charcoal ground.

### 4. Treatments

- **Purpose** — route the five money intents in one screen.
- **Pattern from** — `concept-03`'s numbered 01–05 cards, which read better than SMOMS's flat
  tile grid and far better than Wilshire's 12-row scroll trap.
- **Real client facts** — Dental Implants · All-on-4® / Full Arch · IV Sedation · Veneers &
  Lumineers · Invisalign®. All five are existing pages.
- **Headline direction** — "Specialized care for complex smile needs." (concept line, keep).
- **Assets** — `dental-implants-mode.png`, `all-on-4-dental-implant-model-x.png`,
  `sedation-iv-circle.png`, `veneer_cosmetic_dentalpatient1.jpg`, `invisalign-tray.jpg`.

### 5. Patient stories — film

- **Purpose** — the client's single largest advantage; none of the three can answer it.
- **Pattern from** — client only. Wilshire and ICLA have no patient video; SMOMS has portraits.
- **Real client facts** — the three existing stories, with their existing on-site quote
  headlines: *"Full Arch All-On-4 Gave Me My Confidence Back!"* — Leslie; *"I Felt Like The
  Old Me Because Of My Crowns & Dental Implants"* — Emily; *"I Have Teeth Again Thanks To My
  Full Mouth Reconstruction!"* — Michael.
- **Headline direction** — "Our patients tell the story best." (the client's own line, keep it).
- **Assets** — `Leslie-Broll.mp4`, `Emily-B-ROLL.mp4`, plus the YouTube story edits already
  embedded; stills `leslie_dentalpatient_allon4_barriere.jpg`,
  `emily_dentalpatient_implant_barriere1.jpg`, `michael_dentalpatient_reconstruction_barriere.jpg`.
- **Note** — fix the broken alt text that currently prints "logo-dark" beside each card.

### 6. Technology

- **Purpose** — build authority on the axis the client can win, since it cannot win on
  surgical board certification.
- **Pattern from** — Wilshire's Cone-Beam service page, done better; the source list is the
  client's own `/commitment-to-excellence/`.
- **Real client facts** — Yomi Dental Robotic System · cone-beam CT (CBCT) · intraoral
  scanners · 3D printer · in-house milling · diode laser · smile simulation ·
  chrome-guided implant surgery.
- **Headline direction** — "Plan digitally. Place precisely. Restore beautifully." (concept).
- **Assets** — `barriere_dentalpractice_dentalimplant_westla2/3/4.jpg` (real operatory),
  `barrerie_westla_xray_diagnostics1.png`, stills from `Master-Broll.mp4`.

### 7. Dr. Barriere, and the team

- **Purpose** — the credentials, short, with a real photograph, plus a team presence the
  current site lacks entirely.
- **Pattern from** — SMOMS's editorial portrait treatment; ICLA's role labels.
- **Real client facts** — The Ohio State University College of Dentistry; a yearlong surgical
  residency at NYU Langone Hospital; more than 1,000 hours of continuing education; member of
  the American Academy of Cosmetic Dentistry, the American Academy of Implant Dentistry and
  the American Dental Association; more than a decade in practice.
- **Headline direction** — "Complex dentistry deserves focused experience." (concept).
- **Assets** — `tonybarrerie_headshot_dentist_westlaimplants1.jpg` or the garden portrait
  `barriere_headshot_confident_dentalpractice_westlaimplants1.png`; `Dr-Broll.mp4`;
  `staff.jpg` for a one-line team band.
- **Note** — **do not write "board-certified".** That belongs to the oral and maxillofacial
  surgeons across the street. "Advanced surgical training" and "focused implant experience"
  are accurate and defensible.

### 8. Reviews

- **Purpose** — close the single largest proof gap, and get the quotes out of a closed tab.
- **Pattern from** — SMOMS (patient photo + stars + named quote in one card); Wilshire
  (a volume claim, then the evidence).
- **Real client facts, quote-for-quote from the current homepage** — Peter Chang, Joshua
  Jonah Fischman, Annie Gigliotti, Mike Hascats. Use these four verbatim and no others. The
  `4.9` rating comes from the client's own markup; confirm the live count before printing it.
- **Headline direction** — "What our patients say." Or take Wilshire's shape: a count above,
  the quotes below.
- **Assets** — no stock faces. Text cards on the concept's grounds, with a Google mark.

### 9. Before and after

- **Purpose** — the visual proof an implant lead actually wants, and completely uncontested:
  not one of the three competitors shows a single case.
- **Pattern from** — nobody. This is open ground.
- **Real client facts** — the existing case library. Lead with the three cases that match the
  films: `case10` (Leslie), `case11` (Emily), `case12` (Michael), so the gallery and the
  stories are the same people.
- **Headline direction** — "The result is bigger than a set of teeth." (concept line, keep).
- **Assets** — `case10/11/12_before|after_westlaimplants_*.jpg`, plus `case1`–`case9` in the
  full gallery link.

### 10. Comfort and experience

- **Purpose** — convert the anxious patient, who is a large share of the implant market.
- **Pattern from** — `concept-03`'s chip grid; the intent is Wilshire's "What To Expect".
- **Real client facts** — IV sedation and sedation dentistry are on the live site; same-day
  appointments for dental emergencies are on the live homepage. **The concept's other chips
  (Netflix, noise-cancelling headphones, blankets, English + Spanish) come from the client
  questionnaire, not the site — confirm before publishing.**
- **Headline direction** — "Advanced dentistry without forgetting the person in the chair."
- **Assets** — `sedation-dentistry-patient-smiling.jpg`, waiting-room frames from `Master-Broll.mp4`.

### 11. Cost and financing

- **Purpose** — answer the money question all three competitors answer and the client does not.
- **Pattern from** — Wilshire's published-figure block, softened to what the client can truly say.
- **Real client facts** — six financing partners (Lending Club, CareCredit, Proceed Finance,
  Alphaeon, Cherry, Sunbit); an in-house **West LA Implants Dental Savings Plan**, which no
  competitor has an equivalent of; an existing Cost & Compare page.
- **Headline direction** — "Make the first step feel clear."
- **Assets** — none needed; a lender logo row plus type.
- **Note** — **publish no price figure.** The client's site contains none. Every dollar amount
  on it today is a lender's credit limit. If the client wants to match Wilshire's
  "from $9,990", that number must come from the practice in writing.

### 12. Consultation form

- **Purpose** — the lead capture the current homepage has none of.
- **Pattern from** — ICLA's four-field form (short, converts) rather than Wilshire's eleven
  fields plus an insurance-card upload (thorough, but a wall).
- **Real client facts** — fields: name · phone · email · what can we help with (implants,
  All-on-4 / full arch, IV sedation, veneers, Invisalign) · preferred contact.
- **Headline direction** — "Request an implant consultation." (concept).
- **Assets** — none.
- **Note** — the form must post to the practice, not to the third-party `/schedule/`
  Angular shell. That shell is the biggest single leak on the current site.

### 13. FAQ

- **Purpose** — the answer-engine surface. Only one of the four homepages has one.
- **Pattern from** — SMOMS's 5-question accordion, plus the `FAQPage` schema they ship with it.
- **Real client facts** — draw the answers from the existing
  `/dental-implant-surgery-los-angeles-ca/dental-implant-faq/` page, which is already written
  and already accurate (implant longevity, success rates above 95%, candidacy, sedation).
- **Headline direction** — "Confidence starts with good information." (concept).
- **Assets** — none.
- **Note** — ship `FAQPage` JSON-LD with it. Neither Wilshire nor ICLA has any.

### 14. Service area and location close

- **Purpose** — the local block Wilshire owns outright and the client has zero of, folded
  into the final call to action.
- **Pattern from** — Wilshire's nine-neighbourhood drive-time grid; ICLA's map and detail strip.
- **Real client facts** — 12301 Wilshire Blvd Suite 205, Los Angeles CA 90025; Monday to
  Friday 9:00am–5:00pm, Saturday and Sunday closed; new patients **(310) 692-9316**.
- **Headline direction** — "A modern implant center for Los Angeles." (concept closing line).
- **Assets** — map, `footer_cta_barriere.jpg` as the closing image.
- **Note** — list neighbourhood names only. **Do not invent drive times** the way Wilshire
  has; if the practice wants them, measure them.

---

## Claims that must be verified with the client before publishing

| Claim | Where it comes from | Status |
| :--- | :--- | :--- |
| **"6,000+ implants placed"** | `concept-03` stat bar only, footnoted as client-questionnaire data we do not hold | **Conflicts with the live site**, which says "more than 5,000 **sets** of dental implants" on `/commitment-to-excellence/`. Two different numbers and two different units — a "set" is not an implant. Publish neither until the client confirms the figure *and* the unit in writing |
| "1,000+ hours of continuing education" | live homepage | On the site, so usable. But the `/commitment-to-excellence/` meta says "In 2021, he completed more than 300 hours" — confirm the cumulative total is current in 2026 |
| "More than a decade of experience" | live homepage and `/general-dentistry/` | Written for a 2022 site. Almost certainly understated now. Ask for the current figure |
| "4.9 rating / 40 reviews" | the client's own homepage `AggregateRating` JSON-LD | The markup is 2022-era and static. Pull the live Google count before printing any number |
| **"Board-certified"** | competitors only | **Never claim it.** Wilshire's own alt text identifies Dr. Vahedi as an ABOMS diplomate — an oral and maxillofacial surgeon credential. Dr. Barriere is a DDS with a yearlong surgical residency at NYU Langone. Use "advanced surgical training", "focused implant experience". Claiming parity here is both false and losable |
| Netflix, noise-cancelling headphones, blankets and pillows, English + Spanish | `concept-03` only | Not on the live site. Confirm each one |
| "Same-day appointments for dental emergencies" | live homepage | Confirm still true |
| `TeethToday®`, `NDX® nSequence` lab, Yomi, diode laser, in-house milling, 3D printer, CBCT | `/commitment-to-excellence/` | All on the live site. Confirm the equipment is still in service and the programme affiliations still current |
| Any treatment price, any "starting at", any monthly payment | nowhere on the client site | Do not create one. Every dollar figure on the client's site today is a lender credit limit |
| Any superlative — "best", "leading", "#1" | SMOMS uses "Santa Monica's Best" | Do not copy that shape |
| The six financing partners and the in-house savings plan | `/financing-los-angeles-ca/` | On the site. Confirm all six are still active partners |

---

## Evidence

| File | What it holds |
| :--- | :--- |
| `homepage-screenshots/*-full.png` | Full-page 1440px captures of all four homepages plus `concept-03` |
| `homepage-screenshots/*-fold.png` | Above-the-fold captures |
| `homepage-screenshots/*.rendered.html` | Rendered DOM of each, used for the CTA, `tel:` and schema counts |
| `four-site-summary.csv` | Site-level metrics for all four, from `scrapers/compare_four.py` |
| `../current-site-scrape/pages/home.md` | Client homepage extract |
| `../competitor-scrape/*/pages/home.md` | The three competitor homepage extracts |
| `../../03-graphic-resources/.tmp/ASSETS.md` | The 622-asset client media catalogue referenced throughout the blueprint |

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md).
