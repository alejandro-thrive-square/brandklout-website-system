# Image audit — BugHerd #11 (BEFORE)

Read off the **draft** document. 443 assets in the library,
37 pages walked, 492 rendered images.

**19 of 37 pages repeat an image in their own content.**
Header/footer chrome (the logo, the footer mark) is counted separately — it is on
every page by design and is not a defect.

| page | images | distinct | content repeats | chrome repeats |
|---|---:|---:|---:|---:|
| `/post` | 5 | 3 | 0 | 2 |
| `/contact-alexandria` | 4 | 3 | 0 | 1 |
| `/contact-maclean` | 4 | 3 | 0 | 1 |
| `/video-library` | 16 | 15 | 0 | 1 |
| `/terms-of-service-maclean` | 3 | 2 | 0 | 1 |
| `/terms-of-service-alexandria` | 3 | 2 | 0 | 1 |
| `/privacy-policy-maclean` | 3 | 2 | 0 | 1 |
| `/privacy-policy-alexandria` | 3 | 2 | 0 | 1 |
| `/posts` | 3 | 2 | 0 | 1 |
| `/thank-you` | 8 | 7 | 0 | 1 |
| `/terms-conditions` | 3 | 2 | 0 | 1 |
| `/emergency-dentistry` | 9 | 7 | **1** | 1 |
| `/cosmetic-dentistry` | 15 | 12 | **2** | 1 |
| `/contact` | 2 | 1 | 0 | 1 |
| `/all-on-4` | 24 | 17 | **5** | 1 |
| `/about` | 13 | 11 | **1** | 1 |
| `/veneers` | 15 | 11 | **3** | 1 |
| `/teeth-whitening` | 12 | 8 | **3** | 1 |
| `/smile-makeover` | 23 | 20 | **1** | 1 |
| `/smile-gallery` | 111 | 110 | 0 | 1 |
| `/sedation-dentistry` | 8 | 5 | **1** | 1 |
| `/privacy-policy` | 3 | 2 | 0 | 1 |
| `/patient-stories` | 8 | 7 | 0 | 1 |
| `/patient-center` | 16 | 13 | **2** | 1 |
| `/our-team` | 12 | 11 | 0 | 1 |
| `/our-facility` | 19 | 15 | **2** | 1 |
| `/oral-surgery` | 12 | 10 | **1** | 1 |
| `/meet-dr-nahlah` | 9 | 6 | **2** | 1 |
| `/index` | 25 | 21 | **3** | 1 |
| `/implant-supported-dentures` | 16 | 14 | **1** | 1 |
| `/implant-cost` | 13 | 11 | **1** | 1 |
| `/financing` | 12 | 9 | **2** | 1 |
| `/doctor-referral` | 12 | 9 | **1** | 1 |
| `/dental-implants` | 22 | 18 | **3** | 1 |
| `/dental-implant-faq` | 7 | 6 | 0 | 1 |
| `/dental-conditions` | 9 | 8 | 0 | 1 |
| `/crowns-and-bridges` | 10 | 6 | **2** | 1 |

## The repeats, in reading order

### `/emergency-dentistry`

- **tech-advanced.jpg** — used **2×** (same-src)
  - 1. `#medical > .wrap.section > .mz.mz-4 > .mz-fig`  · node `7pHtlf2CHEHIWsCcDRyuo`
  - 2. `#top > #expect > .wrap.section.pk-split.pk-split-rev > .sp-fig`  · node `XjtTktpnmNM64c1EXdRNe`

### `/cosmetic-dentistry`

- **crown-model.jpg + dental-crowns-model-2.jpg** — used **2×** (same-picture)
  - 1. `.wrap.section > .pk-cards.pk-cards-3 > .pk-card > .pk-card-fig`  · node `KU7Q-buxkX67ur7KRGFB2`
  - 2. `.wrap.section > .pk-cards.pk-cards-3 > .pk-card > .pk-card-fig`  · node `ShD_pnFug5jZ4sKfWar4L`
- **consult-discussion.jpg** — used **2×** (same-src)
  - 1. `.wrap.section > .pk-cards.pk-cards-3 > .pk-card > .pk-card-fig`  · node `XYm7MDYy7MMLjnpFZyXOI`
  - 2. `#top > #evaluation > .wrap.section.pk-split.pk-split-rev > .sp-fig`  · node `_NHQphtJcMN4usEXMdfCa`

### `/all-on-4`

- **case-ao4-double-1-after.jpg** — used **3×** (same-src)
  - 1. `#why > .wrap.section > .mz.mz-4 > .mz-fig`  · node `hlU04_-NosrjR7RM40jMD`
  - 2. `.pk-ba-grid.pk-ba-grid-3 > <custom> > .pk-ba > .ba-img-after`  · node `pYy21b0GNPtbWUe45Rzhy`
  - 3. `.wrap.section > .pk-cards.pk-cards-3 > .pk-card > .pk-card-fig`  · node `Yl8OcRCzK5cvbWC04BP3J`
- **case-ao4-double-1-before.jpg** — used **2×** (same-src)
  - 1. `#why > .wrap.section > .mz.mz-4 > .mz-fig`  · node `IHz56w-XNNn06vf3nCHre`
  - 2. `.wrap.section > .pk-ba-grid.pk-ba-grid-3 > <custom> > .pk-ba`  · node `Sqbz-s6ajYjDx14m8YZy_`
- **consult.jpg** — used **2×** (same-src)
  - 1. `.wrap.section > .pk-cards.pk-cards-4 > .pk-card > .pk-card-fig`  · node `ABBr-NwW_ET0K8FTC2ME9`
  - 2. `.wrap.section > .pk-cards.pk-cards-3 > .pk-card > .pk-card-fig`  · node `bA1K2WF3Yx-MZ20shax3H`
- **case-ao4-single-2-after.jpg** — used **2×** (same-src)
  - 1. `.wrap.section > .pk-cards.pk-cards-4 > .pk-card > .pk-card-fig`  · node `6ZtUxYLABoaZ8z56vTg_-`
  - 2. `.pk-ba-grid.pk-ba-grid-3 > <custom> > .pk-ba > .ba-img-after`  · node `HnLjNrwghbHbN4O4BY5Cq`
- **case-ao4-double-9-after.jpg** — used **2×** (same-src)
  - 1. `#smooth-content > #top > #band > .mband-fig`  · node `-OaO6g7dvcSrIzxR8jWeg`
  - 2. `.pk-ba-grid.pk-ba-grid-3 > <custom> > .pk-ba > .ba-img-after`  · node `akwmhXnCHBcM1d6R3tPVY`

### `/about`

- **lab.jpg + tech-hero.jpg** — used **2×** (same-picture)
  - 1. `#home > .wrap.section > .mz.mz-4 > .mz-fig`  · node `PEJaKnLmkFlnDwlYTOa_G`
  - 2. `.wrap.section > .pk-cards.pk-cards-4 > .pk-card > .pk-card-fig`  · node `Fw-oou1LElLoVk_84vQYs`

### `/veneers`

- **veneers-procedure.png** — used **2×** (same-src)
  - 1. `#smooth-content > #top > #hero > .ph-bg`  · node `2CBUyuzQwN90HmyE7yIR_`
  - 2. `.wrap.section > .pk-cards.pk-cards-4 > .pk-card > .pk-card-fig.pk-card-fig-pad`  · node `NJGzTcTkYf2ctwkZuh6Ua`
- **case-veneers-5-after.jpg** — used **2×** (same-src)
  - 1. `#top > #candidacy > .wrap.section.pk-split > .sp-fig`  · node `Xy6SLUhkpcHpjH3IrU8xt`
  - 2. `.wrap.section > .pk-cards.pk-cards-4 > .pk-card > .pk-card-fig`  · node `xNpw6k3L6CE-D1OmTzE6i`
- **case-veneers-7-after.jpg** — used **2×** (same-src)
  - 1. `.pk-ba-grid.pk-ba-grid-3 > <custom> > .pk-ba > .ba-img-after`  · node `x3BqrGCgSjNQqfyYy1hoQ`
  - 2. `#smooth-content > #top > #band > .mband-fig`  · node `lb448ZPUdgahJwhEE05cY`

### `/teeth-whitening`

- **case-whitening-1-before.jpg** — used **2×** (same-src)
  - 1. `#advantage > .wrap.section > .mz.mz-4 > .mz-fig`  · node `Un0PMhoKj4gssYXEzYR-V`
  - 2. `.wrap.section > .pk-ba-grid > <custom> > .pk-ba`  · node `Ep6uNX3GwkGB8wD5B8Pgj`
- **whitening-procedure.jpg** — used **2×** (same-src)
  - 1. `#advantage > .wrap.section > .mz.mz-4 > .mz-fig`  · node `mI0lupolk6kTHl6q5T7Kg`
  - 2. `#top > #keeping > .wrap.section.pk-split.pk-split-rev > .sp-fig`  · node `07KV90HOg3rRSeK28t2MU`
- **case-whitening-1-after.jpg** — used **2×** (same-src)
  - 1. `#advantage > .wrap.section > .mz.mz-4 > .mz-fig`  · node `CvmqO8U-fDUHsMqSl59JG`
  - 2. `.pk-ba-grid > <custom> > .pk-ba > .ba-img-after`  · node `oN9Paoq3o-eoRP9pNANeQ`

### `/smile-makeover`

- **lab.jpg + tech-hero.jpg** — used **3×** (same-picture)
  - 1. `#approach > .wrap.section > .mz.mz-4 > .mz-fig`  · node `jN8Ih92QAx1rDE8EJRyPr`
  - 2. `.wrap.section > .pk-cards.pk-cards-4 > .pk-card > .pk-card-fig`  · node `onzd7fJ7UhMpbItQgFPUx`
  - 3. `.wrap.section > .pk-cards.pk-cards-4 > .pk-card > .pk-card-fig`  · node `LjfMxUlTRbh8viI0BPcrs`

### `/sedation-dentistry`

- **sedation-patient.jpg + sedation-dentistry-patient.jpg + sedation.jpg** — used **3×** (same-picture)
  - 1. `#smooth-content > #top > #hero > .ph-bg`  · node `AJVv_wPoMt65wvwEnUknT`
  - 2. `.wrap.section > .pk-cards.pk-cards-3 > .pk-card > .pk-card-fig`  · node `m73-r6VxldENiDfFI1qzE`
  - 3. `#smooth-content > #top > #band > .mband-fig`  · node `Ag-4UKgaVQqvM4JvadRF5`

### `/patient-center`

- **pt-interaction.jpg** — used **2×** (same-src)
  - 1. `#smooth-content > #top > #hero > .ph-bg`  · node `Lgzl-zSVrtbMtQCqv9R4j`
  - 2. `.wrap.section > .pk-cards.pk-cards-4 > .pk-card > .pk-card-fig`  · node `XnxW9bAxAq9n3aEW20qg0`
- **financing-card.jpg** — used **2×** (same-src)
  - 1. `#welcome > .wrap.section > .mz.mz-4 > .mz-fig`  · node `vdzGUe_v7Cc3ArKvokR6V`
  - 2. `#top > #affordable > .wrap.section.pk-split.pk-split-rev > .sp-fig`  · node `y8uajj65_JqRHy_-gq55B`

### `/our-facility`

- **lab.jpg + tech-hero.jpg** — used **3×** (same-picture)
  - 1. `.wrap.section > .pk-cards.pk-cards-3 > .pk-card > .pk-card-fig`  · node `YuwEJ5If3fkVO9Xpb2hFt`
  - 2. `.wrap.section > .pk-cards.pk-cards-3 > .pk-card > .pk-card-fig`  · node `1DrY8PcmeQUVpkeGJzTXa`
  - 3. `#top > #why > .wrap.section.pk-split > .sp-fig`  · node `8VTFY7aJrfSf2XbBgPR9E`
- **office-hero.jpg** — used **2×** (same-src)
  - 1. `#smooth-content > #top > #hero > .ph-bg`  · node `qYpdbWqFzXfdrPUXsx78b`
  - 2. `#tour > .wrap.section > .ft-grid > .ft-fig.ft-d`  · node `pf48cLlrf8mPaZpELwh_t`

### `/oral-surgery`

- **tech-hero.jpg + lab.jpg** — used **2×** (same-picture)
  - 1. `#one-place > .wrap.section > .mz.mz-4 > .mz-fig`  · node `x2wzbz_KGIGNb6NAOyvfR`
  - 2. `#one-place > .wrap.section > .mz.mz-4 > .mz-fig`  · node `qjQjEh4udQJ4L9XuYARWG`

### `/meet-dr-nahlah`

- **dr-with-patient.jpg** — used **2×** (same-src)
  - 1. `#smooth-content > #top > #hero > .ph-bg`  · node `xIsAqfDObqHMeAt0J8mZf`
  - 2. `#specialty > .wrap.section > .mz.mz-4 > .mz-fig.mz-tall`  · node `Vt1BYfqKgc8X1ZAyEsfuk`
- **dr-award.jpg** — used **2×** (same-src)
  - 1. `#specialty > .wrap.section > .mz.mz-4 > .mz-fig.mz-tall`  · node `cW-RUGHV-qlYmmhZ0hriK`
  - 2. `#top > #teaching > .wrap.section.pk-split > .sp-fig`  · node `RHJnOc9CXTBG3L3uwj7JL`

### `/index`

- **case2-before.jpg** — used **2×** (same-src)
  - 1. `#top > #reality > .re-frame > #realityImg`  · node `QWE7RAi1LGAPQsQhShUj4`
  - 2. `#tPin > .wrap > #cmp > .tf-slide`  · node `miMgEr9-VcDH0IRXDe3E5`
- **case1-after.jpg** — used **2×** (same-src)
  - 1. `.wrap > #cmp > .tf-slide.is-on > .tf-aft`  · node `WpuB6U9SIvX7YITACZ8Gy`
  - 2. `#pathPin > #pathTrack > .pa-card > .pa-shot`  · node `opGWBWrurdecOO9mckl2b`
- **case2-after.jpg** — used **2×** (same-src)
  - 1. `.wrap > #cmp > .tf-slide > .tf-aft`  · node `zDjPfRzZLqb57IyHdAsqE`
  - 2. `#pathPin > #pathTrack > .pa-card > .pa-shot`  · node `cRuOiEXdSxjXa-vv026-L`

### `/implant-supported-dentures`

- **case-fullarch-4-after.jpg** — used **2×** (same-src)
  - 1. `.pk-ba-grid > <custom> > .pk-ba > .ba-img-after`  · node `-GR7223wqCV5_ZHpYsV4-`
  - 2. `.wrap.section > .pk-cards.pk-cards-4 > .pk-card > .pk-card-fig`  · node `kbO0SPpFztuISsYRwdB3y`

### `/implant-cost`

- **consult-discussion.jpg** — used **2×** (same-src)
  - 1. `.wrap.section > .pk-cards.pk-cards-3 > .pk-card > .pk-card-fig`  · node `U5EdzPcYHQ-POY3gcesZW`
  - 2. `#top > #insurance > .wrap.section.pk-split.pk-split-rev > .sp-fig`  · node `Z7esPl8_3_95a1Th_8klk`

### `/financing`

- **financing-card.jpg** — used **2×** (same-src)
  - 1. `#why > .wrap.section > .mz.mz-4 > .mz-fig`  · node `5Vw6wU9F1p4zQagFBTL9b`
  - 2. `#top > #payment > .wrap.section.pk-split > .sp-fig`  · node `RunEiMTDe_EDzlezQz6sm`
- **consult-discussion.jpg** — used **2×** (same-src)
  - 1. `#why > .wrap.section > .mz.mz-4 > .mz-fig`  · node `9-2Rfn9X_C_pF19i5BPAE`
  - 2. `#top > #no-insurance > .wrap.section.pk-split.pk-split-rev > .sp-fig`  · node `Eb7LfM9CTFhTJJy9kbC-1`

### `/doctor-referral`

- **tech-hero.jpg + lab.jpg** — used **3×** (same-picture)
  - 1. `.wrap.section > .pk-cards.pk-cards-4 > .pk-card > .pk-card-fig`  · node `_ROEc4-BAkLJV3qDLd-Dv`
  - 2. `.wrap.section > .pk-cards.pk-cards-4 > .pk-card > .pk-card-fig`  · node `tU5PdnJ7QAUKWIo2mhuks`
  - 3. `#top > #study-club > .wrap.section.pk-split.pk-split-rev > .sp-fig`  · node `4Q9I8DwGxxvO6f1soWULs`

### `/dental-implants`

- **dental-implant-crown-model.jpg** — used **2×** (same-src)
  - 1. `#anatomy > .wrap.section > .mz.mz-3 > .mz-fig.mz-plain`  · node `-OH7CrQscJmWNxFuAMT2u`
  - 2. `.wrap.section > .pk-cards.pk-cards-4 > .pk-card > .pk-card-fig`  · node `l9K6Z9xGN5z59uo6nVtUK`
- **multiple-dental-implant-model.png + multi-implant-model.png** — used **2×** (same-picture)
  - 1. `#anatomy > .wrap.section > .mz.mz-3 > .mz-fig.mz-plain`  · node `ZaD_ahHoGlKvCkiwUHCmb`
  - 2. `.wrap.section > .pk-cards.pk-cards-4 > .pk-card > .pk-card-fig.pk-card-fig-pad`  · node `zGyfqm0SoP80jSgQVjOdd`
- **case-ao4-double-3-after.jpg** — used **2×** (same-src)
  - 1. `.wrap.section > .pk-cards.pk-cards-4 > .pk-card > .pk-card-fig`  · node `qA8mryZz1FiooFmi9TsUn`
  - 2. `.pk-ba-grid.pk-ba-grid-3 > <custom> > .pk-ba > .ba-img-after`  · node `kVdSOnRozoNFFBc7bLFD6`

### `/crowns-and-bridges`

- **crown-model.jpg + dental-crowns-model-2.jpg** — used **3×** (same-picture)
  - 1. `#whole > .wrap.section > .mz.mz-4 > .mz-fig`  · node `deaL_U7yzvTeawSqxg4Cb`
  - 2. `#whole > .wrap.section > .mz.mz-4 > .mz-fig`  · node `9A1xiJxUZmnhScny_sSTT`
  - 3. `#top > #crowns > .wrap.section.pk-split > .sp-fig`  · node `xEkqU69-yGh5RKDkfsQXx`
- **bridge-model.jpg** — used **2×** (same-src)
  - 1. `#whole > .wrap.section > .mz.mz-4 > .mz-fig`  · node `_spUT-F420vU09EQRxxH6`
  - 2. `#top > #bridges > .wrap.section.pk-split.pk-split-rev > .sp-fig`  · node `tCmLxHzh4duY7huMLIVfO`

## Posts table

43 article rows; 43 carry a `featuredMedia`.
14 asset(s) headline more than one article — every one of those becomes a visible side-by-side repeat once pin #9 renders them as cards on `/posts`:

- `patient_heroo.jpg` ×2 — are-there-factors-that-determine-which-type-of-dental-implant-procedure-i-can-get-treated-with, navigating-the-path-to-smile-restoration-unveiling-the-secrets-of-implants-of-teeth
- `patient_hero.jpg` ×2 — dental-implants-everything-you-need-to-know, complete-teeth-replacement-the-perks-of-dental-implants-explained
- `arch_implants.jpg` ×2 — should-sedation-dentistry-be-used-for-full-mouth-dental-implant-procedures, can-i-have-a-customized-new-smile-with-full-mouth-dental-implants
- `pt-interaction-3.jpg` ×2 — are-there-advantages-to-replacing-my-missing-teeth-with-dental-implants-in-mclean-va, unraveling-the-complexities-complications-in-implant-dentistry
- `pt-hero-3.jpg` ×2 — have-multiple-missing-teeth-you-should-get-treated-with-multiple-dental-implants, integrating-treatment-dental-practices-into-your-dental-implant-procedure
- `homepage_hero.jpg` ×2 — after-my-dental-implants-are-placed-how-will-i-know-if-i-have-peri-implantitis, uncovering-the-mystery-the-in-depth-guide-to-dental-implants
- `pt-hero-1.jpg` ×2 — how-exactly-do-implant-supported-dentures-in-mclean-va-benefit-my-smile, discovering-the-benefits-and-process-of-snap-on-dentures-in-mclean-va
- `patient_hero4.jpg` ×2 — do-i-need-a-full-mouth-dental-implant-consultation, ready-to-learn-how-full-mouth-dental-implants-are-cost-effective
- `patient_hero5.jpg` ×2 — ready-to-learn-what-a-typical-full-mouth-dental-implant-procedure-looks-like, should-i-upgrade-my-smile-from-traditional-dentures-to-all-on-4-dental-implants-in-mclean-va
- `pt-hero-4.jpg` ×2 — considering-getting-treated-with-all-on-4-dental-implants-in-mclean-va-this-is-why-you-should, all-on-four-your-questions
- `practice-space-1.jpg` ×2 — how-many-missing-teeth-can-dental-implants-replace, your-comprehensive-guide-on-dental-implants-the-best-replacement-of-tooth-solution
- `practice-space-2.jpg` ×2 — are-there-side-effects-to-dental-implant-procedures, unlock-the-benefits-of-dental-implants-your-best-teeth-replacement-option
- `patient-story.jpg` ×2 — longevity-of-dental-implants-causes-and-fixes-for-damages, discover-the-promising-world-of-teeth-implants-in-mclean-va
- `pt-interaction-5.jpg` ×2 — revamp-your-smile-understanding-the-basics-of-tooth-implants-in-mclean-va, deciphering-dental-implants-your-guide-to-implant-dentistry-in-mclean-va
