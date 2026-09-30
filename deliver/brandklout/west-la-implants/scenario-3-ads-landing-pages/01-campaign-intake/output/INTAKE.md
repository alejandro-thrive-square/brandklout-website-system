# West LA Implants · ads landing pages · intake

Two Asana tasks, both assigned to Alejandro, both in *BK Implementation - West LA Implants › Growth
Engine*. Neither carries an attachment or a comment; the full pulls are in
[`assets/asana-context/`](./assets/asana-context/).

| Campaign | Asana | Traffic | The brief, in full |
| :-- | :-- | :-- | :-- |
| All-on-6 | `1218513737115127` "West LA All on 6 Page (Chat GPT Ads)" | ChatGPT Ads | *(empty description)* |
| 3-on-6 | `1218556641026733` "West La 3 on 6 Landing Page (Google Search)" | Google Search | "Please create a 3 on 6 landing page for West LA Implants for Google search. It needs to have the same structure as all on x landing page build out." Subtasks: landing page, consult, thank you |

"The same structure as the All-on-X landing page build out" is read as the agency's standing combo
(landing, consultation, thank you, in Livewell's order), which is also what the three subtasks
name. Both campaigns are built as that combo.

## Slugs

All under `/ads-landing-pages/`, Livewell's pattern (`<offer>`, `<offer>-consultation`,
`thank-you-<offer>`):

| Campaign | Landing | Consultation | Thank you |
| :-- | :-- | :-- | :-- |
| All-on-6 | `all-on-6` | `all-on-6-consultation` | `thank-you-all-on-6` |
| 3-on-6 | `3-on-6` | `3-on-6-consultation` | `thank-you-3-on-6` |

The manifest is [`combo.json`](./combo.json).

## Checklist

- [x] Campaign list and slugs.
- [ ] **One GHL form id per campaign.** None received. Both pages carry the prototype fields.
- [ ] **Each form's thank-you redirect.** Depends on the production host, which is also open.
- [ ] **Conversion method and owner.** No Google tag of any kind is on this instance.
- [x] Phone to show: the new-patient line `(310) 692-9316`, written in a DNI-swappable format.
      No number pool runs on this instance.
- [x] Consent: Termly is live on the instance (`autoBlock=off`), through the site scripts.
- [ ] Offer facts confirmed by the client. See "Claims" below.
- [x] Assets located. See "Assets".
- [x] `combo.json` written.

## Claims, and where each one comes from

Everything on the six pages is on the organic build already (which was written from the client's
own site), in a Google review shown on the approved homepage, or in a patient film's own
transcript. Nothing else was added.

| Claim | Source |
| :-- | :-- |
| Dr. Barriere: Ohio State, yearlong NYU Langone surgical residency, 1,000+ hours, AACD / AAID / ADA | `pages/dr-tony-barriere.mjs` (client site) |
| CBCT scan first, Yomi® robotic guidance or a printed guide, in-house lab, one floor | `pages/our-practice.mjs`, `pages/dr-tony-barriere.mjs` |
| IV, oral and nitrous sedation; IV patients remember little | `pages/sedation-dentistry.mjs` |
| Temporary teeth the day of surgery "in most full-arch cases"; final zirconia after three to four months | `pages/all-on-4.mjs` |
| Full arch on "four or more" implants, "some cases use five or six" | `pages/all-on-4.mjs`; the client's own post says "four to eight" |
| Free second opinion | client site ("offers free second opinions") |
| Six lenders, Proceed Finance to $60,000 over 96 months, most PPO plans in network, claims filed | `pages/financing.mjs` |
| "We reply within one business day" | the organic consultation form |
| The four Google review lines, and the two long ones | the approved homepage |
| Every line in a patient's or the doctor's mouth | [`assets/patient-film-transcripts.md`](./assets/patient-film-transcripts.md), the practice's own YouTube descriptions |

**Withheld on purpose**, because nothing in writing backs them for a paid page:

- any price or "starting at" figure;
- "free consultation" or "complimentary consultation" (the client's site only promises a free
  *second opinion*);
- the one-year warranty (it is on the organic site; an ad needs the written terms first);
- an implant count (the site says 5,000 sets, the questionnaire 6,000+; still open with the client);
- a star rating or review count (none is sourced; the pages quote named reviews instead);
- "no cost, no obligation" and any urgency line.

## Assets

| Beat | What is used | From |
| :-- | :-- | :-- |
| Hero film | Dr. Barriere at the Yomi robot (`dr-barriere-yomi-1920.mp4`) | the practice's B-roll |
| The journey | Leslie (All-on-6 page), Michael (3-on-6 page): their before/after pair and their own words | practice photographs, film transcripts |
| Filmed stories | Leslie, Emily, Michael | the practice's YouTube channel |
| The dentist | headshots, the X-ray screen, surgery stills | practice photographs |
| Results | six before/after pairs per page | the practice's gallery |
| The space | reception, CBCT suite, surgical suite, operatory, in-house lab | practice photographs |

No stock photograph is on any of the six pages. No new media was needed: every file is already in
the instance's library.

## Open questions for Brandklout

1. **The two Go High Level forms.** One per campaign, each redirecting to its own thank-you page,
   with save-and-exit off and the ten `privacy_*` fields. Send the embed snippet for each. Until
   then the form on the pages is a prototype: it collects nothing and forwards to the thank-you
   page so the flow can be reviewed. **The pages must not take paid traffic in this state.**
2. **The host.** The pages live on `west-la-implants-production.up.railway.app`. The client's
   domain is still WordPress. Do the ads run to the Railway host, to a subdomain pointed at
   Instatic, or do they wait for the domain switch? The forms' redirects depend on the answer.
3. **Conversion.** Which tags fire on the two thank-you URLs (GTM container, Google Ads, GA4), and
   how ChatGPT Ads counts a lead. No Google tag is installed on this instance.
4. **Does a GHL number pool (DNI) run on these pages**, and if so which number is the display
   number. The pages show the new-patient line.
5. **3-on-6 and All-on-6, clinically.** The practice's own site never names either. The pages
   describe both in general terms (three bridges on six implants, no denture plate; a full-arch
   bridge on six implants instead of four). Dr. Barriere should confirm he offers both, and read
   the options table, the three steps and the FAQ on each landing page.
6. **Neither journey patient had the advertised treatment.** Leslie's arches are All-on-4®, and
   Michael's was a full mouth reconstruction on implants. Both are labelled as what they were. If
   the practice has a true All-on-6 and a true 3-on-6 case with photographs, they should replace
   these.
7. **Consent** for Leslie, Emily and Michael on a paid page (it is already open for the organic site).
8. **Approve or strike**: "A second opinion is free" and "No pressure, no surprises".
9. **The theme.** The site's approved direction is dark. The ads pages follow it; the agency's
   light-themes rule was not applied here because the client chose this one.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../../SYSTEM_RULES.md). Source task GIDs: `1218513737115127`,
`1218556641026733`.
