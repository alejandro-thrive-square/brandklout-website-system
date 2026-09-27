# Reference inventory — Institute for Advanced Dentistry, home page

Brand-authority preflight for `04-design`, 2026-09-21. Every source that can carry design
direction, what it controls, and which one wins.

| Source | Where | Controls | In the worktree? | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **Logo colour guide** `Insitute-for-Advance-Dentistry-Color-Guide.png` | Drive › Website Content › Branding › Logo › PNG | **Identity** | Yes, `03-graphic-resources/.tmp/drive/logo-png/` | **Authority for colour and type.** Gold `#C3972B` (Pantone 1245 C), highlight `#FFF688`, grey `#727376`, silver `#BDBFC1`, charcoal `#373435`. Fonts: Century Gothic, Arial Narrow |
| Logo files (9 PNG, plus Ai/EPS/PDF/JPEG) | same folder | Identity | PNG only | Transparent versions are grey-on-light; the dark-ground variant is derived in `build-media.py` |
| **Client brief**, Jessica's 2026-08-29 Asana comment | `01-content-intake/.tmp/asana-context/` | **Content, positioning, every figure** | Yes | **Authority for copy and claims.** Two disciplines; the differentiator is who designs the case; technology is supporting cast |
| **Photoshoot**, 196 frames | Drive › Website Content › Photoshoot (Dr. Portrait, Office, PT Dr:Staff Interactions, PT Portraits ×4, Technology) | Imagery | 2000 px copies in `03-graphic-resources/.tmp/drive/web/`, contact sheets in `_contact/` | **Authority for imagery.** Every photograph on the page is the practice's own |
| B-roll, `Web Broll_Main.mp4` (18 s) | Drive › Website Content › Videos › BRoll | Hero media | Yes, `drive/broll/` | Used, re-encoded to 3.0 MB / 0.7 MB |
| Four patient stories (Helen, Mark, Lisa, Philip) | intake scrape `media-library/vimeo/`; masters also on Drive › Videos | Proof | Yes | Used, re-encoded to ~5 MB each |
| Smile Gallery, case folders by treatment | Drive › Smile Gallery | Before/after | One case pulled (`case-lori`, 20 veneers) | Used for the signature scene; the pair aligns to the pixel after cropping |
| Current live site (the WordPress clone on Instatic) | `01-content-intake/.tmp/current-site-scrape/` | Structure of the old site, three written reviews, the free-exam offer, memberships, financing logos | Yes | **Content only.** Its navy ground, Kanit type and band structure are the previous agency's and are not carried forward |
| "Homepage Concepts", six directions | https://institute-for-advanced-dentistry---conc.webflow.io/ (Trong, 2026-08-31) | Colour/type studies over one band layout | Read over the public URL | **Reference only.** No concept is recorded as chosen, and all six keep the section order this redesign replaces. Closest in spirit: 04 "Midnight Ivory" |
| Asana "Style Guide" task | blocks Design Home Page | Identity | Nothing attached | Open. The logo colour guide above is the only brand document that exists |

## Conflicts, and how they were settled

1. **Navy or no navy.** The concepts page calls the identity "navy-and-gold". The practice's own
   logo board has no navy in it: gold and three cool greys. The navy came from the previous
   agency's website. **The logo board wins**; the page is graphite-black, gold and ivory.
2. **Implants placed: 2,500+ or 2,800+.** The brief says both. The page uses **2,500+**, the figure
   that appears three times in the brief and on the live site. Needs the client's answer.
3. **"100% patient satisfaction"** is in the brief and is not on the page: it is an absolute claim
   about outcomes. Raise it with Brandklout before anyone uses it.
4. **Positioning.** The live title tag says "comprehensive dentistry"; the brief says specialty
   practice, two disciplines. **The brief wins**, as `docs/project-overview.md` already records.
5. **The free first visit.** "Complimentary comprehensive exam, CBCT and smile design preview" is
   what the live site offers today, and the brief lists the implant and cosmetic consultations as
   "Complimentary–$300". The page states the live offer; confirm it is still current.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../../SYSTEM_RULES.md). Text only; the media it names is gitignored.
