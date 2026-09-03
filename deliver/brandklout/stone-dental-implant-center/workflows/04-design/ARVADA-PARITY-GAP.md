# All-on-X Landing Page — Arvada Parity Gap Analysis

Status: **STRICT CLONE, BUILT AND STAGED** 2026-09-03. Live on the Webflow subdomain only
(`https://stone-surgical-arts.webflow.io/ads-landing-pages/all-on-x`); the four custom domains are
untouched and still serve the old page, pending a go-ahead for the full-site publish.

Date: 2026-09-03. Target: bring `/ads-landing-pages/all-on-x` on
**Stone Dental Implant Center** (site `6a07d5aac093f0e4521d29bc`, page `6a99792d6642f8d8d2c99716`)
to the same **structure** as the Arvada All-on-X landing page, using **only Stone's own assets and
copy**.

Reference: **Arvada Dental Center**, site `693c51e685b19f0d0c149cab`, page
`6a8403e80803b770778d2d72`, live at
`https://arvadadentalimplants.com/ads-landing-pages/all-on-x-ads-landing`.

> The previous build used **Livewell Dental** as its structural reference
> ([ALL-ON-X-CAMPAIGN.md](./ALL-ON-X-CAMPAIGN.md)). Arvada replaces Livewell as the reference. The
> two are not the same page: Arvada is roughly 2.4× the markup (80 KB vs Stone's 33 KB) and leans
> heavily on video, a spec-table option comparison, and a much longer FAQ.

Captures used for this analysis live in `.tmp/arvada-reference/`
(`arvada-landing.html`, `arvada-landing.deep.txt`, `stone-landing.deep.txt`).

---

## 1. Section-by-section parity table

| # | Arvada block | Stone today | Gap |
| :-- | :--- | :--- | :--- |
| 1 | `section.header` — address pill + pin icon, centred logo, phone button | logo + phone + button, **no address** | Add the address pill linking to directions |
| 2 | `section.imp-hero` — eyebrow, rating badge, 2‑tone H1, lead, 3 ✓ bullets, CTA, service‑area note, **hero video + caption**, **form card with live GHL iframe** | same copy skeleton, but a **still image** where the video goes and an **empty form embed** | **Hero video** + **fix the dead form** |
| 3 | `div.imp-trust` — 5 stat tiles (`1,300+` / `24+ Years` / `IV` / `5280` / `FULL-ARCH FOCUSED`) | Google + Yelp logo strip only | **Add a 5-stat trust bar** (keep the logos) |
| 4 | `section.imp-journey` — label, 2‑tone H2, intro, **before/after drag slider**, **Life Before / Life After ✕ vs ✓ columns (5 each)**, **4 chapter cards (photo + `01 · …` + quote + copy)**, CTA | 4 text-only story cards, no slider, no before/after columns, **no photos** | **Slider, the two ✕/✓ columns, photos on all 4 chapters, CTA** |
| 5 | `section.imp-story` — label, H2, 4 feature cards, **1 wide + 3 vertical patient videos with ★★★★★ captions**, **Google reviews widget**, CTA | 4 feature cards + CTA only | **4 captioned testimonial videos + reviews widget** |
| 6 | `section.imp-specialist` — **vertical doctor video**, label, H2, copy, **4 credential rows (bold label + explanation)**, **blockquote**, **4-image practice strip** | photo + H2 + 2 paragraphs + 6 bare chips + CTA | **Doctor video, credential rows, pull quote, 4-image strip** |
| 7 | `section.imp-options` — label, H2, intro, **3 option cards**, each with an image and a spec table (*Implants per arch / Treatment time / Ideal if you want / Investment $–$$$ / pricing note*) | **2** cards, no images, 2–4 bare meta rows, no investment tier | **3rd option, images, full spec table, investment tiers** |
| 8 | `section.section-12` — process: label, H2, intro, 3 numbered cards, **CTA**, **vertical explainer video** | 3 steps, no intro, no CTA, no video | **Intro, CTA, explainer video** |
| 9 | `section.imp-gallery` — label, H2, intro, **3-image result grid**, CTA | this is Stone's *video* section (8 embeds) | **Add a real photo gallery** (Stone has ~20 pairs) |
| 10 | `section.imp-space-2` — label, H2, intro, **5-image office grid** | H2 + copy + CTA + **1 image** | **4 more office/practice photos** |
| 11 | `section.section_ty-faq` — label, H2, **10 accordion FAQs with check icons** | **6** plain, always-open Q/A | **Accordion behaviour + 4 more questions** |
| 12 | `section.imp-final` — label, H2, copy, **video**, call CTA, "Prefer to talk?" line with hours | H2 + copy + 2 CTAs | **Closing video + the call/hours line** |
| 13 | `div.ty-marks` — **credential logo marquee** (5 logos, duplicated for the scroll) | — | See §4, decision needed |
| 14 | `footer.ty-foot` — practice + address + **medical/results disclaimer** | logo, address, hours, 3 links, legal | **Add the results disclaimer** |

**Score: 13 of 14 blocks needed work; 2 were outright broken** (dead hero form, and a smile
gallery that showed testimonial videos instead of results). **All 14 blocks are now built.**

---

## 2. Stone's assets — what we actually have

The current page uses a small fraction of what is already in the Webflow library.

### Before / after patient pairs — **~20 available, 2 in use**

| Set | Files | Notes |
| :--- | :--- | :--- |
| `Before & After All on X implants` `(1)–(5)` + base | 6 × 1145×763 | Already split into `allonx-p1…p5-before/after.jpg` (8 halves) for the slider |
| `imgi_44/43/40/38/55/42/46_*`, `IMG_4282` | 8 × 1440–1920 sq | Combined side-by-side pairs, `PIC·COLLAGE` / `Collageable` watermark |
| `IMG_3832 / 3069 / 4859 / 3155`, `87EBF053…`, `1D5B03A2…`, `6E55DCCC…` | 7 × 800–1920 sq | Combined side-by-side pairs |

> **Orientation varies between sets** — in several of these the *after* is on the **left**. Check
> each pair before cropping or captioning.

### Real practice photography

| Asset | What it is |
| :--- | :--- |
| `656023592_18090389450155974_….avif` | **Building exterior**, "SSA STONE SURGICAL ARTS" signage |
| `banner-office-bg-img.webp` | **Reception desk** under the STONE SURGICAL sign |
| `Why choose Stone Surgical Implant Center.avif` | **Two team members at the front desk** (in use) |
| `dr stone.webp` (4316×6474), `Dr. Mona Stone, DDS..webp` | Dr. Stone studio portraits |
| `Doctor Mona Stone Banner.avif`, `Doctor Mona Stone at Stone Dental Implant Center.avif` | Dr. Stone in the consult room, implant graphics on screen |
| `all on x at stone surgical arts.webp`, `Single implant at …`, `Same Day Implants at …` | Service illustrations for the option cards |

**Stock, not Stone** — do not present as the practice: `First visit at Stoine Surgical Implant
Center.webp`, `Patient is smiling at Stone Surgical Arts.webp`, `Business man looking outside the
window.webp`, `phone consultation.webp`, `all on x implants.avif`.

**Other practices' assets that leaked into this library — never use:** anything named
`LIVEWELL…`, `livewell dental office…`, `LW-logo`, `West LA Implants`, `office-24/35`,
`chris-teaching…`, `IACI.webp`, `icoi logo.png`, `imgi_24_GKC-logo.svg`, `imgi_25_FAG-logo.svg`,
`imgi_27_AAD-logo.svg`, and the three `…MAKRIS…` / `Before SS` / `After SS` files (Makris Dental
patients, currently on Stone's own home page under a Makris alt tag).

### Video — 13 available, 8 in use and 2 of those are off-topic

| ID | Title | Best use |
| :--- | :--- | :--- |
| `MClykj3NC-M` | Doctor profile — Dr. Mona Stone ("Dr. Jawline") | **Hero video** and/or specialist section |
| `TfxI89BAY9w` | All on 4 explained | **Process section explainer** |
| `WSBoMQuIwPU` | William Goldman testimony | Story section |
| `M6HwFDnQeJE` | Samuel Compos testimony | Story section |
| `nGXAhZDvsgs` | Don Hull testimony | Story section |
| `Ts__XGC0sTc` | Patient testimony (Nov 2024) | Story section |
| `0_DIwrmIGu0` | Patient Ron testimonial | Story / closing |
| `YYmE8wszrBw` | Practice overview | Closing CTA |
| `1188307662` / `1188307682` / `1188307691` | Vimeo — All-on-4 transformations ("So happy for him", "All on four transformation… no words", "New smile for a very deserving father") | **Vertical clips for the 4 journey chapters** |
| `9Ha_jOTupqo` | Wayne — **facial trauma** | ⚠️ **not All-on-X** |
| `4cCSqJlfWGM` | Barbara — **alveoloplasty** | ⚠️ **not All-on-X** |

> The last two are currently sitting in Stone's *"Real Arches. Real Results."* All-on-X gallery.
> Neither is a full-arch case. They should move out of that section.

---

## 3. Copy sources (all from the client's own pages)

Everything Arvada says has a Stone equivalent already published on
`stonedentalimplantcenter.com` — nothing needs to be invented.

| Arvada element | Stone source |
| :--- | :--- |
| Trust stats | 255+ five-star reviews · board-certified OMS · biomedical engineering degree · UMKC DDS · 3 Level 1 trauma centres · attending surgeon at Baylor & Methodist · KLS MARTIN IPS® certified · English & Spanish · available 24/7 |
| Credential rows + blockquote | `/meet-dr-mona-stone` — *"What truly sets her apart is how she sees."* |
| 3 option cards | `/all-on-x-implants` — the **All-on-X vs Dentures vs Bridges** comparison table (stays in permanently, replaces a full arch, preserves jawbone, feels natural, designed around face, lasts decades) |
| Process + intro | `/all-on-x-implants` — the **5-step** process (consultation & 3D scan → face-first smile design → placement → same-day temporaries → permanent arch); Arvada's shape is 3 steps |
| 10 FAQs | 6 already live on `/all-on-x-implants`; the remaining 4 (age, care, vs dentures, why 4 vs 6 implants) all have answers in the service copy |
| Investment tiers | Existing `$25,000–$50,000+ per arch` range with Lending Club / Cherry / Sunbit / Proceed Finance |
| Footer disclaimer | Adapt from Arvada's shape, with Dr. Stone's name and no pricing promise |

**House rules that apply:** no em dashes anywhere in client copy (RUNBOOK gotcha 10); no invented
facts; no Brandklout pricing; and zero copy shared with Arvada or Livewell — run the same 6-gram
overlap diff the last build used, against **both** reference pages this time.

---

## 4. Decisions taken (Alejandro, 2026-09-03)

1. **Credential marquee**: built as a **scrolling text marquee** of Stone's own credentials, no
   borrowed logos.
2. **The two off-topic videos**: kept, but moved **out of the results gallery** into a clearly
   labelled "Beyond full-arch care" row in the story section.
3. **Publishing**: build now, ask before the live publish. Staged to the Webflow subdomain only.

## 5. What was built

Page `6a99792d6642f8d8d2c99716` was wiped and rebuilt from
[`.tmp/build/content_v2.py`](./.tmp/build/content_v2.py) via
[`.tmp/build/build_v2.py`](./.tmp/build/build_v2.py):

    python3 build_v2.py wipe | structure | embeds | verify

14 sections inserted through `data_whtml_builder` (one call per section), then **17 HtmlEmbeds**
(13 videos, the comparison slider, the GHL form, the FAQ accordion, the credential marquee)
created with `data_element_builder` and filled with `data_element_settings_tool`. All 17 verified
non-empty after the build.

Asset use went from 2 before/after photos and 1 practice photo to **6 gallery pairs + the slider
pair, 5 practice photos and all 13 videos**.

### Bugs found and fixed during QA

| Bug | Cause | Fix |
| :--- | :--- | :--- |
| Header phone lost its styling and rendered as a default blue underlined link | `CSS_V2` redefined the existing site class `.axon-header_phone` with a different rule body, so Webflow minted `.axon-header_phone-1` carrying only the new properties | renamed to a fresh class `.axon-header_tel` with the full property set. Same family as the `inline-section-0` bug below: **never redefine an existing site class from `whtml_builder`; always use a new name** |
| Trust bar rendered navy on navy, text unreadable | an inline `style=` attribute made Webflow mint `.inline-section-0`, which collided with a pre-existing site style carrying a navy background | gave the section its own `.axon-trustbar` class; **never use inline `style=` in `whtml_builder` HTML on this site** |
| "Drag to compare" appeared twice | the slider embed renders its own hint | removed the duplicate `<p>` from the section HTML |
| Process steps crushed into ~150px columns | 3-across steps inside the narrow half of a `0.85fr 1.15fr` grid | new `.axon-proc_grid` (1.25fr / 0.75fr) with steps stacked vertically |
| Office/strip photos cropped through faces | `object-fit: cover` centred on tall portraits | added `object-position` to `.axon-off_*` and `.axon-strip_img` |
| A prominent photo reads "Dr. Monica Stone" | the client's own banner asset carries that artwork | `Doctor Mona Stone Banner.avif` dropped from the page entirely; see §6 |

## 5b. Strict-clone pass (2026-09-03, after the teammate review)

The first build was Arvada's structure plus extras. The brief was tightened to a **strict clone:
same components, same layout, same item counts, different content**. These extras were removed.

| Removed | Count | Why |
| :--- | :--- | :--- |
| "Book a Consultation" button in the header | 1 | Arvada's header is address, logo, phone only |
| Second hero CTA ("Call ...") | 1 | Arvada's hero has one CTA |
| Google/Yelp badge row under the trust stats | 1 row | Arvada's trust strip is five stat tiles, nothing else |
| Second testimonial video row | 3 videos | Arvada has one wide + three vertical, full stop |
| "Beyond full-arch care" block (label, note, 2 videos) | 1 block | Not in Arvada; the two off-topic videos come off the page |
| "Book a Consultation" in the specialist section | 1 | Arvada has no button there |
| Buttons on all three option cards | 3 | Arvada's option cards carry no CTA |
| "Full-Arch Solution" tag on the featured option card | 1 | Not in Arvada |
| Three extra gallery images | 3 | Arvada's gallery is a three-up grid |
| Gallery disclaimer paragraph | 1 | Arvada's disclaimer lives only in the footer |
| "Call ..." button in the experience section | 1 | Arvada has no button there |
| Second final-CTA button | 1 | Arvada's closing block has one call CTA |
| Footer logo, hours, Practice column, nav links, copyright row, legal links | 7 links | Arvada's footer is a legal line and a disclaimer, nothing else |

Added for fidelity: the pin and phone icons in the header (Stone has its own copies of both
`location-pin-svgrepo-com` and `phone-svgrepo-com`), and a check mark before each FAQ answer to
match Arvada's answer rows.

### Verified parity, item for item

| Item | Arvada | Stone |
| :--- | ---: | ---: |
| CTA buttons on the page | 6 | 6 |
| Distinct videos | 8 | 8 |
| h1 / h2 / h3 | 1 / 9 / 16 | 1 / 9 / 16 |
| Hero bullets | 3 | 3 |
| Trust stat tiles | 5 | 5 |
| Life Before / After list items | 10 | 10 |
| Journey chapters | 4 | 4 |
| Feature + process step cards | 7 | 7 |
| Credential rows / blockquote | 4 / 1 | 4 / 1 |
| Option cards | 3 | 3 |
| Gallery images | 3 | 3 |
| FAQ items | 10 | 10 |
| Footer paragraphs / links | 2 / 0 | 2 / 0 |

Videos in use (8): `TfxI89BAY9w` hero, `WSBoMQuIwPU` story wide, Vimeo `1188307682` /
`1188307691` / `1188307662` story vertical, `MClykj3NC-M` specialist, `YYmE8wszrBw` process,
`0_DIwrmIGu0` closing. **Five of Stone's videos are now unused** (`nGXAhZDvsgs`, `M6HwFDnQeJE`,
`Ts__XGC0sTc`, and the two off-topic ones `9Ha_jOTupqo` facial trauma and `4cCSqJlfWGM`
alveoloplasty), because Arvada has only eight slots.

### Two things that are still not identical, and cannot be

1. **The Google reviews widget.** Arvada's story section embeds ElfSight app
   `5c283beb-4bc5-4802-8a1a-4fb3f6cd6f1f`. That widget shows **Arvada's** reviews, so it cannot be
   reused. Stone's ElfSight account has only a floating review badge (`c92f78df-...`, already
   global on the page) and an Instagram feed (`7b3bee65-...`). **A Google Reviews widget needs to
   be created in Stone's ElfSight account** and its id dropped into the story section to close
   this last gap.
2. **Tag semantics.** Arvada renders the trust strip and the credential marquee as `<div>`; ours
   are `<section>`. Rendered output and layout are identical; only the wrapper tag differs.

### A consequence worth a decision

Arvada's footer carries **no Privacy Policy or Terms links**, so the strict clone dropped Stone's.
Google Ads generally expects a reachable privacy policy on a paid landing page. Say the word and
the two links go back into the footer legal line; it is a one-line change.

## 6. Open items for the client

1. **`Doctor Mona Stone Banner.avif` says "Dr. Monica Stone"** while the practice trades as
   Dr. **Mona** Stone. The asset is no longer used on this page, but it is still on the main site.
2. **Review count.** The page says "255+ five-star reviews" (sourced from the client's own copy);
   the site's live ElfSight widget currently reads **276 reviews, 4.9**. Worth raising to 276+.
3. **Premises signage** in the real practice photos reads "Stone Surgical Arts", not "Stone Dental
   Implant Center". Same premises, two brands (RUNBOOK gotcha 4), but ad traffic may notice.
4. **Google reviews widget.** Arvada embeds a dedicated ElfSight reviews block in its story
   section. Stone's site-wide floating widget already appears on the page; a dedicated in-page
   block would need a widget id from Stone's ElfSight account.

## 7. Still to do

1. **Credential logo marquee (block 13).** Arvada's five logos (Kois Center, AGD, ICOI, AACD,
   Implant Accelerator) are Dr. Bennett's. Stone has no logo assets of her own. Options: skip the
   block (Livewell's equivalent was skipped for the same reason), render Stone's credentials as a
   text marquee, or ask the client for badge files.
2. **The two off-topic videos** (`9Ha_jOTupqo` facial trauma, `4cCSqJlfWGM` alveoloplasty) — remove
   from the All-on-X page, or keep as general practice proof outside the results gallery.
3. **Google reviews widget.** Arvada embeds an ElfSight app. Stone has a different ElfSight app id
   on the page already; confirm whether a reviews widget exists in Stone's ElfSight account.
1. **The live publish.** Any publish is **full-site to four domains**, including
   `stonesurgicalarts.com`; single-page publishing returns `bad_request` on this plan
   (RUNBOOK gotcha 4). The page is a live paid-traffic destination. Awaiting the go-ahead.
2. **The consultation and thank-you pages** were not touched. They still follow the Livewell
   shape. Arvada has its own consult and thank-you pages if parity is wanted there too.
3. Mobile-viewport screenshots (the responsive CSS is published and verified, but not
   eyeballed at width), and an end-to-end form submission test.

---

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Reference captures
under `.tmp/arvada-reference/` stay untracked.
