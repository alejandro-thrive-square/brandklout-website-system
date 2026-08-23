# Fix log — content corrections applied to the Webflow LPs

Date: 2026-08-19. Published to STAGING only (https://mason-park-dental.webflow.io), no custom domain.
Every replacement is sourced from bestdentistinkatytx.com. Nothing was invented; where no source
existed the claim was removed or swapped for a verified one.

## 1. Stat rail (both LPs)

The Invisalign page uses the `LP Stat Band` component `bedcc43c-...`; the NPS page carries an
inline copy of the same markup, so both were edited.

| slot | was | now | source |
| :--- | :--- | :--- | :--- |
| 1 | 320+ / five-star patient reviews | 5.0 / Google patient rating | Trustindex cards carry `data-rating="5.0"`; the count was never exposed |
| 2 | UCSF / DDS & AEGD trained | Tufts / DMD, Tufts University | /our-doctors/ "received his dental degree from Tufts University"; /services/invisalign/ uses "Dr. William Sung, DMD" |
| 3 | 5.0 / Center Graduate (NPS); Invisalign / Center Graduate (Inv) | $189 / new patient special; $1,000 / off Invisalign | /special-offers/ |
| 4 | FAGD FICOI / dual fellowships | FAGD / top 7% of Texas dentists | /our-doctors/ "held by only 7% of all general dentists in the State of Texas" |
| 5 | 1,300+ / smiles created | 100+ / CE hours a year | /our-doctors/ "averages almost 100 hours of CE credits each year" |

Slot 3 now carries each page's advertised offer above the fold.

## 2. Credential list (both LPs)

- "UCSF DDS & AEGD trained - one of the most respected dental programs in the country" ->
  "DMD, Tufts University - where he earned his dental degree before practicing in Massachusetts
  and moving to Katy"
- "FAGD ... only about 6% of general dentists in the United States" -> "... only 7% of general
  dentists in the State of Texas"
- NPS "National Clinical Educator - trusted to train other dentists" -> "Continuing Education -
  almost 100 hours a year, over eight times the yearly requirement for a dentist in the state of Texas"
- NPS heading "The Dentist Other Dentists Learn Advanced Cosmetics From" -> "The Dentist Katy
  Families Trust With Their Smiles"
- Inv "10+ years of dental experience - and 100+ hours of CE every year" -> "Almost 100 hours of
  continuing education a year - over eight times the yearly requirement for a dentist in the state
  of Texas" (the client site's "10 years" figure is the team's COMBINED experience, not his)

## 3. Review count, all 16 instances removed

"320+ Five-Star Reviews, Google, Yelp, and Healthgrades" -> "Rated 5.0 by our patients on Google";
"5.0 320+ Google reviews" -> "5.0 based on Google reviews"; thank-you and marquee variants ->
"rated 5.0 on Google". The 5.0 rating is real; the count never had a source, and the intake summary
had already recorded that no aggregate count could be claimed.

## 4. Office hours, 4 pages

`Mon-Tue 8-5 / Wed-Thu 8-4 / Fri 8-1` -> `Mon & Wed 9am-6pm / Tue & Thu 8am-5pm / Fri-Sun closed`
(in the shared LP Closer, so both LPs and both consultation pages). Every weekday was wrong and
Friday is a closed day. The thank-you pages already had it right and were left alone.

## 5. New Patient Special page now sells the New Patient Special

- eyebrow -> "$189 New Patient Special, Katy, TX"
- headline -> "A Better Smile Starts With Your / $189 First Visit"
- subhead -> "A comprehensive exam, digital x-rays, a cleaning and a full written treatment plan
  for $189, a saving of $328."
- bullets 1-2 -> the offer's actual inclusions
- all 6 CTAs -> "Claim the $189 Special"
- FAQ "How do I know whether I need veneers or bonding?" (whose answer described the $189 visit)
  -> "What is included in the $189 new patient special?"
- $189 now appears 12x in the body; it appeared 0 times before.

## 6. Invisalign page: veneer copy out, offer in

- "04 The Reveal" and "Your Finished Smile" no longer say "master-crafted porcelain"; both now
  describe the final tray and retainers.
- The "Will my smile look natural?" and "Can I preview the result?" answers were the verbatim
  veneer answers; both rewritten for aligners.
- eyebrow -> "$1,000 Off Invisalign, Katy, TX"; subhead now states $1,000 off, $4,800 -> $3,800.
- hero bullets 1 and 3 -> the practice's published all-inclusive list (consultation, 3D scans and
  x-rays, aligners and refinements, retainers, Kor whitening gel).
- cost FAQ now carries the full offer terms including the $500 prepay discount.
- thank-you page: "A set of Vivera retainers is included" -> "retainers are included in Mason
  Park's all-inclusive Invisalign pricing" (the site says retainers, not the Vivera brand).

## 7. House style

All 39 em dashes removed across the six pages and the page titles; verified 0 remaining on the
published output. Also repaired "in Katy modern, calm" on the NPS page, a sentence left
ungrammatical when an earlier edit stripped an em dash without replacing the punctuation.

## 8. CTA routing (client request)

Every booking button now goes to its own funnel's consultation page instead of the `#form` anchor:
- New Patient Special -> /new-patient-special-consultation (6 buttons)
- Invisalign -> /invisalign-consultation (6 buttons)

The `LP Header` already had a CTA Link prop (overridden per instance). `LP Closer` had none, so a
`CTA Link` prop `003ad9ad-8c81-4421-d9fb-6d6cca857e70` was created and the closer button's `link`
setting bound to it, then set per page. Note: component link props accept only url/email/phone,
not `page`, so these are root-relative URLs.

The hero form card is still on both pages and still captures leads directly.

## Verified on published staging

- 0 instances of 320+, UCSF, FICOI, 1,300+, Center Graduate, 6%-of-US, National Clinical Educator
- 0 em dashes on all six pages
- hours identical and correct on all six pages
- $189 x12 and $328 x1 on NPS; $1,000 x5, $4,800 x2, $3,800 x2 on Invisalign
- 6/6 CTA hrefs per page point at the matching consultation page

## Still outstanding (unchanged by this pass)

- Lead delivery: the site head still holds the `{{GHL_INBOUND_WEBHOOK_URL}}` placeholder, so the
  native forms have nowhere to post. Client blocker.
- The consultation pages still cannot get `noindex` headlessly; needs a Designer edit before go-live.
- "Master-crafted porcelain" remains on the NPS page in two places, which is correct there: that
  page's cosmetic section is about veneers.
