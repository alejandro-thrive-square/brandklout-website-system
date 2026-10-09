# Brief · content depth on the money pages (Scenario 7 step 04, 2026-10-09)

The user approved the copy change on staging (2026-10-09). The practice signs it off before production.
Specs: `../code/depth/<page>.json`, written with `../code/insert-sections.mjs`.

| Page | Words before → after | Sections added |
| --- | --- | --- |
| `/dental-implants` | 974 → 1,445 | `#candidate` (who implants suit), `#recovery` (week by week), `#risks` (what can go wrong, how it is kept unlikely), `#compare` (implant, bridge or denture) |
| `/all-on-4` | 1,094 → 1,299 | `#candidate` (who All-on-4 is for), `#recovery` (living with the provisional arch) |
| `/veneers` | 517 → 678 | `#compare` (veneers, crowns or whitening), `#cost` (what moves the price) |
| `/implant-cost` | 882 → 962 | `#consult` (what you leave the consultation with) |

**Where each fact is stated on the site**
- candidacy, grafting, extractions, gum treatment first: `/dental-implant-faq`, `/implant-supported-dentures` process
- recovery (rest a few days, back to normal within a week, OTC medication, soft food for several months, a temporary worn throughout, reviews): `/dental-implant-faq`, `/dental-implants`, `/all-on-4`
- risks (success above 95%, nerve position measured on the scan, printed guide, peri-implantitis, five-year warranty with Precare): `/dental-implants`, `/our-facility`, `/five-year-warranty`
- bridge vs implant (reshaping two healthy neighbors, next best option): `/crowns-and-bridges`; dentures: `/implant-cost`
- veneers vs crowns vs whitening (under a millimeter of enamel, crowns for molars and teeth too damaged, whitening about an hour): `/veneers`, `/cosmetic-dentistry`, `/teeth-whitening`
- consultation (scan, options with prices in writing, insurance checked, claims filed, financing, free second opinion): `/crowns-and-bridges`, `/implant-cost`

**For the practice to confirm** (general statements the site does not make yet)
1. `/dental-implants` `#candidate`: "Tell the team about smoking, diabetes and the medicines you take: they affect how bone heals around an implant."
2. `/dental-implants` `#recovery`: "First week: back to work and normal activity for most people" (the site says "normal activity"; "work" is ours).
3. `/veneers` `#cost`: veneers priced by number of teeth and material (stated on the site for crowns).

## Version Control

Client step output, tracked on `bk-dr-nahlah` per [SYSTEM_RULES.md §4](../../../../../../../SYSTEM_RULES.md).
