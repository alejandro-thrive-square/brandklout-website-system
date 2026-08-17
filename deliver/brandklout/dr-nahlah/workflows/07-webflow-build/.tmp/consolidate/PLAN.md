# Class consolidation plan

- pages captured: **14**
- families to consolidate: **25**
- classes to retire: **143**
- elements to rewrite: **328**
- buckets skipped: **57**

> [!WARNING]
> Names collapsing to the same selector: `btn-after-2` <- "btn-after-2", "btn-after 2"; `eyebrow-2` <- "eyebrow 2", "eyebrow-2"

> [!NOTE]
> 92 applied names have no rule in the published CSS (empty classes): page, wrap, ph-in, btn, btn-primary, magnetic, btn-ghost, pk, sec-pad, ga-item …

## Families

| canonical | forks | elements | prerequisite |
| :--- | ---: | ---: | :--- |
| `chapter-tag` | 10 | 42 |  |
| `ph-bg-after` | 9 | 9 |  |
| `pk-crumb` | 9 | 9 |  |
| `ph-lead` | 9 | 9 |  |
| `nx-k` | 9 | 27 |  |
| `nx-d` | 9 | 27 |  |
| `dr-grid` | 8 | 8 |  |
| `dr-foot` | 8 | 8 |  |
| `lc-head` | 8 | 8 |  |
| `pg-hero` | 6 | 6 | delete 3 redundant combo(s): .patient-stories-div.pg-hero, .contact-div.pg-hero, .sg-div.pg-hero |
| `ph-meta` | 6 | 6 |  |
| `lc-body` | 6 | 6 |  |
| `sp-copy` | 6 | 8 |  |
| `sp-list` | 6 | 6 |  |
| `pk-head` | 5 | 20 | delete 4 redundant combo(s): .contact-div.pk-head, .sm-div.pk-head, .vn-div.pk-head, .sg-div.pk-head |
| `pk-more` | 5 | 10 | delete 2 redundant combo(s): .contact-a-9.pk-more, .contact-a-10.pk-more |
| `n` | 5 | 32 |  |
| `summary-after` | 4 | 19 |  |
| `fa-body` | 4 | 18 |  |
| `ba-line-before` | 4 | 37 |  |
| `pk-ba-cap` | 3 | 9 |  |
| `pk-more-7` | 1 | 1 |  |
| `pk-quote-mark` | 1 | 1 |  |
| `pk-quote` | 1 | 1 |  |
| `pk-quote-by` | 1 | 1 |  |

## Skipped buckets

- identical definitions but different components (stems: slider-arrow-icon_default, slider-arrow-icon): `slider-arrow-icon_default`, `slider-arrow-icon`
- converter tag-names (out of scope): `nahlah-div`, `about-div`, `patient-stories-div`, `contact-div`, `sedation-dentistry-div`, `implant-cost-div` (+5)
- identical definitions but different components (stems: bg, ph-bg): `bg`, `ph-bg`, `ph-bg-2`, `ph-bg-3`, `ph-bg-4`, `ph-bg-5` (+5)
- converter tag-names (out of scope): `nahlah-i-3`, `about-i-3`, `patient-stories-i-3`, `sedation-dentistry-i-3`, `implant-cost-i-3`, `sm-i-3` (+4)
- selector shared by more than one Designer name: eyebrow-2: `eyebrow`, `eyebrow-2`, `eyebrow-3`, `eyebrow-4`, `eyebrow-5`, `eyebrow-6` (+5)
- converter tag-names (out of scope): `nahlah-em`, `about-em`, `patient-stories-em`, `sedation-dentistry-em`, `implant-cost-em`, `sm-em` (+4)
- identical definitions but different components (stems: actions, ph-actions): `actions`, `ph-actions`, `ph-actions-2`, `ph-actions-3`, `ph-actions-4`, `ph-actions-5` (+5)
- converter tag-names (out of scope): `nahlah-a-5`, `about-a-7`, `patient-stories-a-7`, `sedation-dentistry-a-7`, `implant-cost-a-7`, `sm-a-7` (+4)
- converter tag-names (out of scope): `nahlah-span`, `about-span`, `patient-stories-span`, `sedation-dentistry-span`, `implant-cost-span`, `sm-span` (+4)
- selector shared by more than one Designer name: btn-after-2: `btn-after`, `btn-after-2`, `btn-after-3`, `btn-after-4`, `btn-after-5`, `btn-after-6` (+5)
- converter tag-names (out of scope): `nahlah-div-4`, `about-div-5`, `sedation-dentistry-div-5`, `implant-cost-div-5`, `sm-div-5`, `vn-div-5` (+2)
- converter tag-names (out of scope): `nahlah-p-4`, `about-p`, `patient-stories-p-4`, `sedation-dentistry-p`, `implant-cost-p-3`, `sm-p` (+4)
- converter tag-names (out of scope): `nahlah-strong`, `about-strong`, `patient-stories-strong`, `sedation-dentistry-strong`, `implant-cost-strong`, `sm-strong` (+3)
- mixed named/converter bucket — coincidental match: `nahlah-ul-2`, `cr-list`
- converter tag-names (out of scope): `nahlah-i-6`, `about-i-4`, `sedation-dentistry-i-4`, `implant-cost-i-4`, `vn-i-4`, `ao4-i-4` (+1)
- identical definitions but different components (stems: creds-more-after, pk-more-after): `creds-more-after`, `pk-more-after`
- converter tag-names (out of scope): `nahlah-img-4`, `sm-img-3`, `vn-img-4`, `ao4-img-4`, `di-img-4`
- converter tag-names (out of scope): `about-div-2`, `patient-stories-div-2`, `sedation-dentistry-div-2`, `implant-cost-div-2`, `sm-div-2`, `vn-div-2` (+1)
- converter tag-names (out of scope): `about-h4`, `patient-stories-h4`, `sedation-dentistry-h4`, `implant-cost-h4`, `sm-h4`, `vn-h4` (+1)
- converter tag-names (out of scope): `about-ul`, `patient-stories-ul`, `sedation-dentistry-ul`, `implant-cost-ul`, `sm-ul`, `vn-ul` (+1)
- converter tag-names (out of scope): `about-li`, `patient-stories-li`, `sedation-dentistry-li`, `implant-cost-li`, `sm-li`, `vn-li` (+1)
- converter tag-names (out of scope): `about-a-4`, `patient-stories-a-4`, `sedation-dentistry-a-4`, `implant-cost-a-4`, `sm-a-4`, `vn-a-4` (+1)
- converter tag-names (out of scope): `about-b`, `patient-stories-b`, `sedation-dentistry-b`, `implant-cost-b`, `sm-b`, `vn-b` (+1)
- converter tag-names (out of scope): `about-a-5`, `patient-stories-a-5`, `sedation-dentistry-a-5`, `implant-cost-a-5`, `sm-a-5`, `vn-a-5` (+1)
- converter tag-names (out of scope): `about-div-3`, `patient-stories-div-3`, `sedation-dentistry-div-3`, `implant-cost-div-3`, `sm-div-3`, `vn-div-3` (+3)
- converter tag-names (out of scope): `about-img-2`, `patient-stories-img-2`, `sedation-dentistry-img-2`, `implant-cost-img-2`, `sm-img-2`, `vn-img-2` (+3)
- converter tag-names (out of scope): `about-div-4`, `patient-stories-div-4`, `sedation-dentistry-div-4`, `implant-cost-div-4`, `sm-div-4`, `vn-div-4` (+3)
- converter tag-names (out of scope): `about-a-6`, `patient-stories-a-6`, `sedation-dentistry-a-6`, `implant-cost-a-6`, `sm-a-6`, `vn-a-6` (+3)
- converter tag-names (out of scope): `about-i-2`, `patient-stories-i-2`, `sedation-dentistry-i-2`, `implant-cost-i-2`, `sm-i-2`, `vn-i-2` (+3)
- converter tag-names (out of scope): `about-h1`, `patient-stories-h1`, `sedation-dentistry-h1`, `implant-cost-h1`, `sm-h1`, `vn-h1` (+3)
- converter tag-names (out of scope): `about-b-2`, `sedation-dentistry-b-2`, `implant-cost-b-2`, `sm-b-2`, `vn-b-2`, `ao4-b-2` (+1)
- converter tag-names (out of scope): `about-span-2`, `sedation-dentistry-span-2`, `implant-cost-span-2`, `sm-span-2`, `vn-span-2`, `ao4-span-2` (+1)
- converter tag-names (out of scope): `about-h2`, `patient-stories-h2`, `sedation-dentistry-h2`, `implant-cost-h2`, `sm-h2`, `vn-h2` (+3)
- converter tag-names (out of scope): `about-p-2`, `patient-stories-p`, `sedation-dentistry-p-2`, `implant-cost-p`, `ao4-p-3`, `di-p-2`
- converter tag-names (out of scope): `about-figure`, `sedation-dentistry-figure`, `vn-figure`, `ao4-figure-3`, `di-figure`
- converter tag-names (out of scope): `about-img-3`, `sedation-dentistry-img-3`, `vn-img-3`, `ao4-img-3`, `di-img-3`
- converter tag-names (out of scope): `about-li-4`, `sedation-dentistry-li-2`, `implant-cost-li-2`, `vn-li-2`, `ao4-li-2`, `di-li-2`
- converter tag-names (out of scope): `about-li-5`, `sedation-dentistry-li-3`, `implant-cost-li-3`, `vn-li-3`, `ao4-li-3`, `di-li-3`
- converter tag-names (out of scope): `about-h3`, `patient-stories-h3`, `sedation-dentistry-h3`, `implant-cost-h3`, `sm-h3`, `vn-h3` (+2)
- converter tag-names (out of scope): `about-p-3`, `patient-stories-p-2`, `sedation-dentistry-p-3`, `implant-cost-p-2`, `sm-p-2`, `vn-p-3` (+2)
- converter tag-names (out of scope): `about-figure-2`, `ao4-figure`
- converter tag-names (out of scope): `about-a-8`, `patient-stories-a-8`, `implant-cost-a-8`, `sm-a-8`, `ao4-a-9`, `di-a-10`
- converter tag-names (out of scope): `patient-stories-p-3`, `sm-p-3`, `vn-p-4`, `ao4-p-4`, `di-p-4`
- converter tag-names (out of scope): `sedation-dentistry-details`, `implant-cost-details`, `vn-details`, `ao4-details`, `di-details`
- converter tag-names (out of scope): `sedation-dentistry-summary`, `implant-cost-summary`, `vn-summary`, `ao4-summary`, `di-summary`
- converter tag-names (out of scope): `sedation-dentistry-details-2`, `implant-cost-details-2`, `vn-details-2`, `ao4-details-2`, `di-details-2`
- converter tag-names (out of scope): `sedation-dentistry-a-8`, `vn-a-8`, `sg-a-8`
- mixed named/converter bucket — coincidental match: `more`, `more-2`, `di-a-8`
- converter tag-names (out of scope): `sm-figure`, `vn-figure-2`, `ao4-figure-2`, `di-figure-2`, `sg-figure`
- converter tag-names (out of scope): `sm-span-3`, `vn-span-3`, `ao4-span-4`, `di-span-4`, `sg-span-2`
- converter tag-names (out of scope): `sm-span-4`, `vn-span-4`, `ao4-span-5`, `di-span-5`, `sg-span-3`
- converter tag-names (out of scope): `sm-input`, `vn-input`, `ao4-input`, `di-input`, `sg-input`
- converter tag-names (out of scope): `ao4-div-6`, `di-div-6`
- converter tag-names (out of scope): `ao4-div-7`, `di-div-7`
- converter tag-names (out of scope): `ao4-b-3`, `di-b-3`
- converter tag-names (out of scope): `ao4-span-3`, `di-span-3`
- converter tag-names (out of scope): `ao4-a-8`, `di-a-9`
