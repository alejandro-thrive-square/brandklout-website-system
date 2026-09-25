# Dr. Cho leads: brief shared by every copy agent (2026-09-24)

Site: Mason Park Dental of Katy. This is the ADULT general practice, live at www.masonparkdental.com.
Local source: `deliver/brandklout/mason-park/workflows/09-static-rebuild/home/<page>/index.html`.
Paths below are relative to `deliver/brandklout/mason-park/workflows/09-static-rebuild/`.

## The client's instruction (verbatim)

> Dr Dave Cho needs to be more prominent.
> Dr Sung should be mentioned only beside Dr Cho.
> Dr Sung shouldn't be on the ads landing pages.

The user then clarified: on every page, Dr. Cho leads (name, portrait and credentials come first).
Anywhere Dr. Sung appears alone, add Dr. Cho as the prominent one, with Dr. Sung in a smaller card.
On the ad landing pages, remove Dr. Sung entirely.

## Facts: use ONLY these. Never invent a credential, number or experience.

**Dr. Dave Cho, DMD**: general dentist (cosmetic, restorative and general).
- Dental degree: Tufts University (Boston). Undergraduate: University of California, Riverside, Bachelor's in Biochemistry.
- Worked five years at a pharmaceutical company before dentistry.
- Experienced in oral sedation, endodontics (root canals), oral surgery, implant placement and cosmetic dentistry.
- Holds a sedation certification ("the sedation certification to make a long appointment one appointment").
- Sees patients of all ages. His favourite part is forming lifelong relationships with patients. A laid-back
  attitude and calm demeanor that put nervous patients at ease.
- Attends several continuing education courses each year.
- Lives in Houston with his wife Ellie, their puppy Mimi and their newborn daughter Claudia ("#girldad").
- Portrait: album key `dr-cho-portrait` (3:4, files `mp-dr-cho-portrait-410x547.jpg` and `-562x750.jpg`), and
  the square `team-dr-dave-cho` (`-410x410`, `-750x750`).

**Dr. William Sung, DMD, FAGD**: general dentist.
- Tufts dental degree. Pacific Union College, B.S. His father and two uncles are dentists.
- Fellow of the Academy of General Dentistry, which only 7% of Texas general dentists hold.
- Averages almost 100 hours of continuing education a year (over 8x the Texas requirement).

**Dr. Tam Nguyen**: board-certified pediatric dentist, across the hall (Mason Park Dental for Kids). Leave her as she is.

## Rules

1. **Dr. Sung never appears alone.** Any sentence, card, caption, FAQ answer or JSON-LD text that names Dr. Sung
   must also name Dr. Cho, **first**. Choose the rewrite that is true:
   - A generic statement about what the dentist does ("Dr. Sung measures the pocket depth…", "Dr. Sung will
     tell you…", "fitted by Dr. Sung") becomes **Dr. Cho**. Both are general dentists who do this work, and
     Dr. Cho also takes "he", so the grammar holds.
   - A claim that is only true of Dr. Sung (the AGD fellowship, the 7%, ~100 CE hours, the family of dentists)
     is **never** moved to Dr. Cho. Either drop it, or keep it as a clause about Dr. Sung in a sentence that
     leads with Dr. Cho. For example: "Dr. Cho plans the treatment, and Dr. Sung, a Fellow of the Academy of
     General Dentistry, sees patients here too."
   - A claim about experience that the facts give Dr. Cho (sedation, root canals, oral surgery, implants,
     cosmetic) can be his. A claim about experience the facts do NOT give him (frenectomies on newborns,
     TMJ case volume, laser work, advanced gum disease) must not be moved onto him. Rewrite it about
     "the practice" or "the team", or drop it.
   - "Dr. Sung and Dr. Cho" becomes "Dr. Cho and Dr. Sung". Dr. Cho always comes first.
   - When a sentence names neither, leave it alone. Do not add doctor names where there were none.
2. **Patient reviews are quoted verbatim.** Never edit a review's words. If a review names Dr. Sung and not
   Dr. Cho, replace the whole review (quote, name and source) with another real review from
   `home/patient-reviews/index.html` that names Dr. Cho or no doctor, and is not already on the same page.
   Keep the markup shape identical.
3. **Portraits.** The provider band (`.svc-provider`) on the service pages has already been swapped to Dr. Cho,
   with a small Dr. Sung card (`.svc-provider_also`) inside it. Do not touch that markup, except the one `<p>`
   sentence under `<h3>Dr. Dave Cho, DMD</h3>`: rewrite it for Dr. Cho under rule 1. Anywhere else a Dr. Sung
   portrait stands alone as the dentist (`mp-dr-sung-standing-2`), Dr. Cho's portrait takes the lead position.
   If Dr. Sung keeps a place, it is smaller and beside Dr. Cho.
4. **Keep everything else byte-identical**: classes, structure, links, images you were not told to change,
   entities (`&rsquo;` `&mdash;` `&nbsp;`), line endings. Edit text in place with exact-string edits. Do not
   reformat the file.
5. Also fix `<meta name="description">`, `og:description`, `<title>` and the FAQ JSON-LD
   (`application/ld+json`) when they name Dr. Sung alone. The JSON-LD answer text must match the visible answer.
6. Do not touch `assets/site.css`, other agents' pages, anything under `.tmp/` except what you are told, or git.
   Do not push, publish, or call any API.

## When you finish

Run from `deliver/brandklout/mason-park/workflows/09-static-rebuild/.tmp`:
`node bugherd/doctors-inventory.mjs > bugherd/doctors-inventory-<your-group>.log`, and check your pages.
Every page should have `cho >= 1` wherever `sung >= 1`. Then reply with:
- the pages changed, with sentences rewritten per page
- every claim you DROPPED rather than moved, one line each
- every review you swapped: page, old reviewer, new reviewer
- anything you were unsure of
