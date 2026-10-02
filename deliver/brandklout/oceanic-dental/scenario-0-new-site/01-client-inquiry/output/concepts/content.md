# Oceanic Dental · homepage content for the concept deck

Read off the live Webflow homepage (https://www.oceanicdental.com/, captured 2026-10-02 in
`scenario-1-migration/01-old-site-capture/output/`). Every concept page carries **this content in
this order**, so the client compares style against style, not content against content. Copy is the
client's own: shorten for layout, never invent claims, numbers, names or credentials. No em dashes.

Image base: `https://cdn.prod.website-files.com/66cd6c49cbb85d43d9e41a7c/` (written `CDN/` below).
Blog image base: `https://cdn.prod.website-files.com/682138d7f666525258b6422c/` (written `BLOG/`).
Webflow serves smaller variants by inserting `-p-800`, `-p-1080` or `-p-1600` before the extension
(e.g. `..._Oceanic_Dental_Doctors_2026-p-1600.jpeg`). **Only the variants listed here are known to
exist**; anything else, use the original as written.

## Brand

- Practice: **Oceanic Dental**, two offices in Orange County, CA. Lead dentist **Dr. Krystal Pham, D.D.S.**
- Positioning line: **Smile Bright, Feel Right.** Concierge-level cosmetic, implant and family dentistry,
  all specialists in-house.
- Book online: `https://www.oceanicdental.com/book`
- **Huntington Beach** office: 16052 Beach Blvd, Ste 112, Huntington Beach, CA 92647 ·
  **(714) 841-0203** (`tel:+17148410203`) · page `https://www.oceanicdental.com/top-dentist-huntington-beach` ·
  directions `https://maps.google.com/?q=16052+Beach+Blvd+Suite+112+Huntington+Beach+CA+92647`
- **Fountain Valley** office: 17991 Euclid St, Fountain Valley, CA 92708 · **(714) 378-0085**
  (`tel:+17143780085`) · page `https://www.oceanicdental.com/fountain-valley-dentist` ·
  directions `https://maps.google.com/?q=17991+Euclid+St+Fountain+Valley+CA+92708`
- Phone numbers: type them with a plain hyphen, exactly as above (the live site's call tracking
  swaps these strings; an en dash breaks the swap).
- Hours: Mon-Thu 8am-5pm · Fri 7am-3pm · Sat by appointment · Sun closed.
- Current palette (Webflow variables): deep teal `#1a3743` (ink), teal `#29999a`, oceanic blue
  `#64b5b6`, aqua light `#afe7e5`, aqua pale `#d1f5f4`, sand `#eee9e0`, cream `#fdf3e2`, blush
  `#ffd1ca`, clay `#8f5433`.
- Current type: **"Oceanic Font"**, the practice's own wide display caps (TTF, CORS open:
  `CDN/66cee5d757983fccf6ab4239_oceanic%20font.ttf`, load with `@font-face`), and **Nunito** for text.
- Current motifs: a teal flower (plumeria) mark, soft wave dividers, rounded white cards on aqua.
- Logo, colour wordmark (flower + OCEANIC DENTAL, teal, transparent PNG, wide):
  `CDN/6722a3d143778f507af0d612_OCEANIC-LOGO-WEB.png` (a `-p-500` variant exists).
- Logo, flower mark only (cyan, 150 px): `CDN/66d0a95d2217b15864e41c13_LOGO-CYAN-SMALL.png`.
- Logo, stacked (flower over OCEANIC / DENTAL): `CDN/66e5631f5fb04309594b11bb_Layer_1.png`. **Pale outline artwork: nearly invisible on white**; use the colour wordmark in footers unless the ground is dark enough.

## Sections, in order

### 1 · Hero
- H1: **Cosmetic, Implant & Family Dental Care**
- Line: **Smile Bright, Feel Right.** Experience concierge-level dental care that feels just right,
  because your smile deserves nothing less.
- CTAs: **Book Online** (`/book`) · **Call Huntington Beach (714) 841-0203** · **Call Fountain Valley (714) 378-0085**
  (two call buttons, or one "Call" that reveals both).
- Proof chip: **2,000+ five-star reviews** · Huntington Beach & Fountain Valley.
- Photos, pick per concept:
  - Smiling woman, bokeh (the current hero, wide 1904 x 640): `CDN/66fcd588a7d21f1ced9c3db6_oceanic-dental-bright-smile.jpg`
    (variants `-p-800`, `-p-1080`, `-p-1600`). Low height: use as a band, not a tall full-bleed.
  - Reception with the flower logo wall, Fountain Valley (1534 x 803): `CDN/66fc692201459effc1e4a4f8_Oceanic-Dental-Home.jpg`
  - Dr. Krystal Pham at the logo wall, 2026 portrait (3648 square, 1 MB): `CDN/6a7a3904ec566b2d2b4b8798_4a1f3084a5b030a35b78bcfb74f3aded_Dr.Krystal_Pham_Oceanic_dental_2026.jpeg`
  - Hallway with the logo (5472 x 2988, 1.4 MB): `CDN/66fd8193cd325a53732ab315_IMG_81066.jpg`

### 2 · Dental Services We Offer
- Sub: **Everything You Need for a Happy, Healthy Smile!** Our in-house specialists provide everything
  from routine check-ups to advanced cosmetic and full-mouth restorative treatments, ensuring a
  seamless journey to the smile you love.
- Three categories, each with three items and a photo:
  - **General Dentistry**: Exams (X-ray, oral cancer scans) · Cleanings & gum disease treatment ·
    Sedation dentistry. Photo `CDN/670ffd4d3cf853542eb469fa_Oceanic-dental-Jamie-Hygenist.jpg`
    (hygienist with patient, 1000 sq). Links: `/services/first-visit-new-patient-exam`,
    `/services/cleanings-and-gum-disease-treatment`, `/services/sedation-dentistry`.
  - **Cosmetic Dentistry**: Cosmetic & teeth whitening · Porcelain crowns & No-Prep veneers ·
    Invisalign® teeth straightening. Photo `CDN/670ee958b89fe0dfb7c5278b_Oceanic-dental-veneer.jpg`
    (smiling woman, 1024 sq). Links: `/services/cosmetic-dentistry`, `/services/teeth-whitening`,
    `/noprep`, `/services/invisalign-clear-teeth-straightening`.
  - **Restorative Dentistry**: Full-mouth restoration · Root canal therapy · Composite fillings.
    Photo `CDN/670ed75009e0aca1738d361a_Oceanic-dental-implant.jpg` (implant crown in hand, 1613 sq).
    Links: `/services/full-mouth-restoration`, `/services/root-canal-therapy`,
    `/services/composite-tooth-colored-fillings`.
- CTA: All services (`/services`).

### 3 · Smile Bright, Feel Right (statement)
- At Oceanic Dental, we believe everyone deserves high-quality, personalized dental care. That's why
  we're dedicated to making every visit effective, comfortable, and as pleasant as possible.
- A statement moment, not a text block. No photo required; a concept may use the hallway or reception.

### 4 · Concierge-Level Services for Exceptional Care
- Eyebrow: Your Smile, Our Priority.
- Body: From your first consultation to your final result, we provide personalized, one-on-one care,
  giving you the attention you deserve, combining expertise with genuine compassion.
- Three points: **Personalized Care** · **Highest Comfort and Satisfaction** · **Expertise with Compassion**.
- Photo: patient relaxing in the chair with headphones and a blanket, `CDN/66fd98b38f58a153e5c147e1_Concierge%20care.jpg`
  (1024 sq, `-p-800` exists). Spare: `CDN/67117fd93c05fc063e49a559_Oceanic-dental-concierge-dental-care.jpg` (same scene, other crop).
- Film (optional, ambient or click to play): "Highest Patient Comfort, Dr. Krystal Pham, DDS",
  mp4 `https://cdn.prod.website-files.com/66cd6c49cbb85d43d9e41a7c%2F6aac3076fdd6eb92f6c69679_Highest%20Patient%20Comfort%20Dr.Krystal%20Pham%2C%20DDS_mp4.mp4`,
  poster `https://cdn.prod.website-files.com/66cd6c49cbb85d43d9e41a7c%2F6aac3076fdd6eb92f6c69679_Highest%20Patient%20Comfort%20Dr.Krystal%20Pham%2C%20DDS_poster.0000000.jpg` (720 sq).
- CTA: Book Now.

### 5 · Experience the latest AI Technology
- Eyebrow: Future of Dentistry.
- Body: Our state-of-the-art equipment and AI technology allow us to deliver precise and comprehensive
  diagnoses and treatments with unparalleled accuracy and efficiency.
- Three points: **Comprehensive Diagnoses** · **Precise and Effective Treatments** · **Exceptional Dental Experience**.
- Photos: assistant reviewing a panoramic X-ray on screen `CDN/6916522ae6d96094bfb792ca_dental_x-ray-tech.jpg`
  (1024 sq, the current one, `-p-800` exists); AI-assisted diagnosis `CDN/66fdd443cd42cbdf5d6cb4b8_oceanic-dental-AI.jpg` (1024 sq);
  AI X-ray readout on a tablet `BLOG/68c30334bf3a6fc9c0612e62_oceanic-dental-AI-overjet-1.jpg`.
- Film (optional): iTero 3D scan, mp4 `https://cdn.prod.website-files.com/66cd6c49cbb85d43d9e41a7c%2F6710080dffdf06921d275cd5_Oceanic-dental-itero-3Dscan-transcode.mp4`,
  poster `https://cdn.prod.website-files.com/66cd6c49cbb85d43d9e41a7c%2F6710080dffdf06921d275cd5_Oceanic-dental-itero-3Dscan-poster-00001.jpg`.
- CTA: Book Now.

### 6 · Top-Rated Dental Professionals
- Eyebrow: Local Experts You Can Trust.
- Body: Our top-rated doctors and dental specialists provide all services in-house, eliminating the
  need for multiple providers. This saves you time, reduces headaches, and cuts extra costs.
- Three points: **All Treatments Under One Roof** · **Time and Cost Savings** · **Seamless Experience**.
- The in-house specialists (from the Our Team page, use as a roster or chips, names exactly):
  Dr. Krystal Pham, D.D.S. · Dr. William Noh (Oral Surgeon) · Dr. Mamoru Tanaka (Prosthodontist) ·
  Dr. Liz Hoang (Periodontist) · Dr. Samar Hubbi (Endodontist). "Every clinical doctor and team member
  brings a minimum of five years of hands-on experience."
- Photo: **the 2026 doctors group** (five doctors at the logo wall, 5472 x 3273):
  `CDN/6a7a380f4bb753dd019fa496_Oceanic_Dental_Doctors_2026.jpeg` (use `-p-1600.jpeg`; `-p-1080`, `-p-800` exist).
  Do **not** use the homepage's current "Dr Cantrell and Dr Bonin" photo: Dr. Bonin is no longer on the team page.
- CTA: Meet our team (`/about/our-team`).

### 7 · No-Prep Porcelain Veneers
- Eyebrow: No-Prep Porcelain Veneers.
- H2: **Add Beauty. Preserve the Tooth.**
- Body: Considering a smile refresh without drilling? Oceanic Dental offers true no-prep porcelain
  veneers for qualified smiles: ultra-thin veneers that transform the shape, proportion and color of
  your smile while preserving the healthy enamel underneath.
- Three points: **No drilling. Typically no shots. No temporary veneers.** · **Remarkably thin. Beautifully natural.**
- **Drag compare** (must actually drag, pointer + keyboard): one image holds both states stacked,
  before on top, after below, `CDN/6aab371b49d55c6273efe331_no_prep-veneer-dr.Krystal_Pham_case16.jpeg`
  (1280 x 1229; `-p-1080`, `-p-800` exist). Show each half with `background-size: 100% 200%` and
  `background-position: top` (before) / `bottom` (after), or an `<img>` in an `overflow:hidden` box
  at 200% height. Check the split line falls between the two smiles.
- More cases (each already a before | after composite, faces on top, smiles below):
  `CDN/6aab36c79db1700ec3287b93_no_prep-veneer-dr.Krystal_Pham_case18.jpeg`,
  `CDN/6aab371a9e06ee026f14b468_no_prep-veneer-dr.Krystal_Pham_case12.jpeg` (1254 sq each).
- Film (optional): no-prep veneers patient, mp4 `https://cdn.prod.website-files.com/66cd6c49cbb85d43d9e41a7c%2F6aab4678a4474d4c3cf2e4b3_No_prep_veneers_patient_oceanic_dental_mp4.mp4`,
  poster `https://cdn.prod.website-files.com/66cd6c49cbb85d43d9e41a7c%2F6aab4678a4474d4c3cf2e4b3_No_prep_veneers_patient_oceanic_dental_poster.0000000.jpg`.
- CTA: Book Now · Learn about No-Prep (`/noprep`).

### 8 · Our Patients Love Us!
- Line: When it comes to your dental care, you don't want just any dentist. You want the best
  dentist. And that's exactly what you'll find at Oceanic Dental.
- Recognition: Recognized as one of Orange County's best dental practices by the Orange County
  Register People's Choice Awards, with **2,000+** combined 5-star reviews and trusted by over
  **15,000** patients in our local communities.
- Counters (animate them): **1,420+** PatientConnect · **850+** Yelp · **300+** Google · **360+** Healthgrades.
  Five stars under each. Use text labels or simple marks; do not hotlink third-party logos.

### 9 · Real Stories. Real Smiles.
- Sub: Hear directly from our patients about their experiences, their journeys, and why they trust
  Oceanic Dental with their smiles.
- Two films (YouTube). Use a **static** `<iframe src="https://www.youtube.com/embed/<id>?rel=0" loading="lazy" title="...">`
  in the markup (a script-injected iframe is blocked by the host's frame policy). Poster for a facade:
  `https://i.ytimg.com/vi/<id>/hqdefault.jpg`.
  - `SMSbvMEPLIc` · **Kurt Lichthardt**, Huntington Beach patient: "For over 10 years, Kurt has trusted
    Dr. Pham and our team of skilled doctors and hygienists with his dental health."
  - `3sysxJy3Np4` · **Dr. Julia Close**, Fountain Valley patient: her 14+ year journey with Dr. Pham and
    the team, and how that care transformed her smile and her confidence.

### 10 · What to Expect at Your Visit
- H2: **Follow our 2 easy steps to achieve a selfie-worthy smile!**
- **Step 1: Let's Chat.** Book an in-person consultation to discuss your dental needs and goals.
  You'll leave with a personalized plan for your best smile.
- **Step 2: Smile Transformation.** Start bringing your smile to life with our gentle, attentive care,
  whether it's a cleaning or an advanced treatment. You'll walk away ready to show off a bright, confident smile!
- Photo (optional): Dr. Pham in consultation `CDN/67101ec8b4293f78a7c2b4d3_Oceanic-dental-dr-Pham-consultation.jpg` (1000 sq).

### 11 · Book an appointment: two offices
- Sub: Ready to transform your smile and boost your confidence? Schedule your visit at one of our
  convenient locations.
- **Huntington Beach**, "Serene & Cozy": personalized dental care in a serene setting near Bella Terra,
  with easy access off the 405 and Beach Blvd. Many patients visit from Oak View and Adams.
  Address, phone, Book in Huntington Beach (`/contact-huntington-beach`), Get Directions.
  Photo `CDN/6887f0a317119c082fbf9c28_Oceanic-dental-huntington-beach-office-small.jpg` (1536 x 864;
  `-p-1080`, `-p-800` exist). **It has "Serene & Cozy" and an "HUNTINGTON BEACH OFFICE" pill baked
  into its top-left corner**: crop with `object-position: center 70%` or frame it so the baked text
  reads as intended; never lay new text over it.
- **Fountain Valley**, "Modern & Welcoming": the latest technology, near Mile Square Park, easy access
  from the 405, five minutes from South Coast Plaza. Address, phone, Book in Fountain Valley
  (`/contact-fountain-valley`), Get Directions. Photo `CDN/6887f0a7188237b2d0b42c15_Oceanic-dental-Fountain-Valley-office-small.jpg`
  (1536 x 864, same baked-in text caveat).
- Spare interiors: Fountain Valley reception `CDN/66fd902d82148f9ae17d63dc_Oceanic-Dental-Home-copy1.jpg` (797 sq).

### 12 · Expert Tips from Your Trusted Dental Team
- Sub: Expert-recommended strategies to keep your teeth and gums healthy.
- Two articles (tag "Oral Care", author Oceanic Dental):
  - **Choosing the Right Dental Implant Provider in Fountain Valley** · November 25, 2025 · A clear,
    concise guide to choosing the right implant provider in Fountain Valley, Huntington Beach and the
    surrounding OC area. `BLOG/69265b3ccc3d3f584d24e1d1_dental_implant_provider_oceanic_dental.jpg` ·
    `/resource/choosing-the-right-dental-implant-provider-in-fountain-valley`
  - **Why Diet Matters for Your Summer Smile** · May 28, 2025 · Hydrating fruits, crunchy veggies and
    calcium-rich treats keep your teeth strong and gleaming. `BLOG/6837b464955b19d8eadc7594_Summer_Diet_Guide_Oceanic_Dental.jpg` ·
    `/resource/why-diet-matters-for-your-summer-smile`
- CTA: View more (`/resource`).

### 13 · Closing CTA + footer
- H2: **Achieve The Smile You Love, Today!** · Book Now.
- Line: If you still have questions or need more info, we're here to help. Give us a call or send us
  a quick message. A two-field form (Email, Question, Send) is fine visually; it must not submit
  anywhere (`onsubmit` prevents and shows "Thanks, this is a concept preview").
- Footer: stacked logo, both offices (address + phone), hours, socials (Facebook HB
  `https://www.facebook.com/OceanicDental/`, Instagram HB `https://www.instagram.com/oceanic_dental/`,
  Facebook FV `https://www.facebook.com/OceanicDentalFV/`, Instagram FV `https://www.instagram.com/oceanicdentalfv/`,
  YouTube `https://www.youtube.com/channel/UCd9uMr5uqX7Sdk7fGaiPjug`, LinkedIn `https://www.linkedin.com/company/oceanicdental/`),
  the services list, © 2026 Oceanic Dental, Terms (`/terms`) · Privacy (`/private-policy`) ·
  HIPAA Disclosure (`/hipaa-disclosure`).
- Nav (top): Services · Insurance & Payment (`/insurance-payment`) · About (`/about/our-story`,
  `/about/our-team`) · Contact (`/contact`) · **Book Online**.

## Photography notes

- The practice photos are real and recent (2026 doctors, Dr. Pham, both offices). The smile and
  patient portraits on the services pages are stock or generated; use them sparingly and never
  caption one as a named patient.
- Every concept uses a photograph in nearly every chapter (Brandklout rule) and no photo twice on one page.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../../../SYSTEM_RULES.md).
