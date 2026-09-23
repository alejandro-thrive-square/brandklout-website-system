# Content audit — Webflow LPs vs the client's published site

Date: 2026-08-19
Reference (ground truth): https://bestdentistinkatytx.com/ (home, /special-offers/, /our-doctors/,
/services/invisalign/, /contacts/, /financing/) captured 2026-08-19.
Audited: the six live staging slugs on https://mason-park-dental.webflow.io — confirmed to be
serving the v2 native builds (`lp_*` / `consult_*` / `confirm_*` classes, zero `imp-*`).

Verified correct and needing no change: phone `tel:+12817698878` on all six pages, the address
(21830 Kingsland Blvd #104A, Katy, TX 77450), the $189 / $328-savings / $129-child figures,
the Invisalign offer terms ($1,000 off, $4,800 -> $3,800, +$500 prepay), "Dr. William Sung, DMD"
(the client's own Invisalign service page uses DMD), Cherry 0% APR / no hard credit check,
and all six testimonials (verbatim from the intake capture).

---

## 1. Credentials that the client's site does not support

| Claim on the Webflow pages | What bestdentistinkatytx.com actually says | Where |
| :--- | :--- | :--- |
| "UCSF — DDS & AEGD trained" / "UCSF DDS & AEGD trained, one of the most respected dental programs in the country" | Dr. Sung "received his dental degree from **Tufts University** in Boston"; B.S. from Pacific Union College. UCSF appears nowhere on the site. | NPS LP + Invisalign LP, 2x each (stat rail + credential list) |
| "FAGD, earned by only about **6% of general dentists in the United States**" | "Fellowship in the Academy of General Dentistry which is held by only **7% of all general dentists in the State of Texas**" | NPS LP + Invisalign LP, 1x each |
| "FAGD · FICOI — dual fellowships" | FAGD only. FICOI is claimed nowhere. | NPS LP + Invisalign LP stat rails |
| "1,300+ smiles created" | Closest real figure: "over **200+** successful Invisalign cases", "over 10 years of **combined** experience" | NPS LP + Invisalign LP stat rails |
| "Invisalign® — Center Graduate" | Site says only that the practice provides Invisalign. No "Center Graduate" designation. | Invisalign LP stat rail |
| "National Clinical Educator - trusted to train other dentists" + section heading "The Dentist Other Dentists Learn Advanced Cosmetics From" | Site says he belongs to "several well known groups and study clubs". No teaching claim. | NPS LP |
| "10+ years of dental experience" (attributed to Dr. Sung) | "over 10 years of **combined** experience" — a team figure, not his | Invisalign LP |

Note: the two thank-you pages already state the FAGD stat **correctly** ("held by only 7% of
general dentists in Texas"), so the site currently contradicts itself page to page.

Real, unused, and stronger than several of the above: Dr. Sung "averages almost 100 hours of CE
credits each year, which is over eight times the yearly requirement for a dentist in the state of
Texas." (The Invisalign LP already uses the 100-hours half of this.)

## 2. Review count — 16 unsourced instances

Every page carries "**320+** Five-Star Reviews" and "5.0 ★★★★★ **320+** Google reviews"
(3x on each LP and consultation page, 2x on each thank-you page).

`01-content-intake/.tmp/content-intake-summary.md` recorded the opposite conclusion at intake:
> "the total Google review count is not exposed by the widget markup, so **no aggregate count is
> claimed anywhere on the pages** — only the 5.0 rating and the individual reviews. Yelp separately
> lists 23 reviews."

The **5.0 rating is real** (each Trustindex card carries `data-rating="5.0"`). The 320+ count is not
sourced anywhere in the repo or on the client's site. The strapline also reads "Google, Yelp, and
Healthgrades" — Yelp has 23, and Healthgrades was never checked.

## 3. Office hours are wrong on 4 of the 6 pages

- NPS LP, Invisalign LP, and both consultation pages: **"Mon–Tue 8–5 · Wed–Thu 8–4 · Fri 8–1"**
- Client site (footer, every page): **Mon 9am–6pm · Tue 8am–5pm · Wed 9am–6pm · Thu 8am–5pm ·
  Fri, Sat & Sun CLOSED**
- Both thank-you pages already have it right ("Mon & Wed: 9am to 6pm / Tue & Thu: 8am to 5pm /
  Fri – Sun: Closed").

Every weekday is wrong and the pages invite people in on a Friday the practice is closed.

## 4. The New Patient Special page is not about the New Patient Special

`<title>` = "$189 New Patient Special — Exam, X-Rays & Cleaning | Mason Park Dental of Katy".
The page body is a **cosmetic dentistry / veneers / smile-design** page:

- Hero: "A Smile You'll Love In Every Photo" / "Natural-looking cosmetic dentistry designed around
  your face, your bite, and your goals."
- **"$189" appears nowhere in the body.** Neither do the inclusions (comprehensive exam, x-rays,
  cleaning, full treatment plan) nor the "$328 in savings".
- Every CTA is "Book a Consultation" — none claims the offer.
- The FAQ headed "How do I know whether I need veneers or bonding?" answers a different question
  entirely (it describes what the $189 visit covers).
- The offer only surfaces in the footer legal disclaimer and one insurance FAQ.

The ad promises $189; the page sells veneers. The two thank-you pages, by contrast, handle the
$189 offer correctly and in detail.

## 5. Veneer copy left on the Invisalign page

- Journey step "04 · The Reveal", under the quote "I stopped noticing I was wearing them":
  "**Master-crafted porcelain**, shaded and shaped to match your natural teeth." Porcelain is
  veneers, not aligners.
- Process step "Your Finished Smile": "**Master-crafted porcelain or refined bonding**, fitted and
  checked against your original design."
- FAQs "Will my smile look natural?" and "Can I preview the result before treatment?" are the
  verbatim veneer answers carried over from the NPS page.
- The **$1,000 off / $4,800 -> $3,800 / +$500 prepay offer never appears in the page body** — only
  in the `<title>` and in the footer disclaimer on the *consultation* page.

## 6. House style: em dashes

39 em dashes in shipped copy, against the standing no-em-dash rule:
invisalign 15 · new-patient-special 10 · new-patient-thank-you 8 · the other three 2 each.

---

## Suggested resolution

**Apply directly (unambiguous, sourced):**
1. Hours -> the client's real hours, on the two LPs and two consultation pages.
2. "6% of general dentists in the United States" -> "7% of general dentists in Texas" (matches the
   thank-you pages).
3. "UCSF DDS & AEGD trained" -> Tufts University (his actual school), or drop the stat.
4. Invisalign page: replace the two "master-crafted porcelain" passages and the two veneer FAQs
   with aligner-appropriate copy; surface the $1,000 off offer in the body.
5. NPS page: put the $189 price, its four inclusions, and the $328 savings into the hero and the
   CTAs; fix the mismatched veneers/bonding FAQ.
6. Strip the em dashes.

**Needs the client to confirm or remove (do not invent):**
- the "320+" Google review count (16 instances)
- "1,300+ smiles created"
- FICOI fellowship
- "Invisalign Center Graduate"
- "National Clinical Educator" / "The Dentist Other Dentists Learn Advanced Cosmetics From"
- whether "10+ years" is Dr. Sung's own or the team's combined figure
