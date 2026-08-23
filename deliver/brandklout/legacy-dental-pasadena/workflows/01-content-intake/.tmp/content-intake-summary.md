# Content intake summary — Legacy Dental Pasadena (Invisalign funnel)

Completed 2026-08-20. Everything below was taken from the practice's own live site, its own CMS, its
own Vimeo library, or its own Google Business profile. Nothing here is invented, and nothing was
sourced from stock or from a competitor.

Scope reminder: three pages, one funnel. Landing page → consultation page → thank-you page. See
[page-flow.md](../../../docs/page-flow.md).

## What the intake produced

| Artifact | What it holds | Committed? |
| :--- | :--- | :--- |
| `.tmp/asset-catalogue.md` / `.tmp/assets/asset-catalogue.json` | 168 media files, indexed with alt text, source page and every responsive variant | Index yes, media no |
| `.tmp/assets/media/` | The 168 files themselves, 41.4 MB, largest variant of each | Gitignored |
| `.tmp/assets/video-posters/` | 1280px posters for all 9 Vimeo videos | Gitignored |
| `.tmp/video-inventory.json` | The 9 videos: id, title, length, orientation | Yes |
| `.tmp/reviews/google-reviews.json` | 31 real Google reviews with names, 20 of them Invisalign-specific, plus the authoritative rating and count | Yes |
| `.tmp/site/` | Static HTML of 10 live pages, plus the site stylesheet | Yes |
| `.tmp/rendered/` | CDP capture of the offer LP with third-party widgets resolved | Network JSON yes, rendered DOM gitignored |
| `.tmp/existing/` | The existing offer LP, captured at scaffold time | Yes |
| `.tmp/assets.json`, `.tmp/assets-offer.json` | Raw extraction output, 675 asset references before de-duplication | Yes |

Tooling written this phase and kept for reuse: `extract_assets.mjs`, `download_assets.mjs`,
`capture_rendered.mjs`.

## The five findings that change the build

### 1. The review-count contradiction is now settled by data, not by a guess

The practice's own Google Business profile, read through the Elfsight widget the site itself runs:

| | |
| :--- | :--- |
| Google rating | **5.0** |
| Google review count | **486** |
| Place id | `ChIJwzHEaifDwoARnQXBX95TD5s` |
| Captured | 2026-08-20 |

So of the two figures the existing page prints, "480+ 5-star Google Reviews" is accurate and
slightly conservative, and "4.9★ Ratings from 150+ Reviews" is stale. This is evidence to hand to
`Update copywriting to make sure its true` (`1217658322593896`, Gauge Hill), not a decision to make
here. The count moves; the pages should not hard-code it.

### 2. There are 20 real Invisalign reviews, with names, usable as copy

`.tmp/reviews/google-reviews.json` holds 31 five-star reviews captured from the live widget, 20 of
which name Invisalign explicitly. They are attributed (toby kim, Jen G, Jackie, Marilyn Green,
Feifei Cao, Samantha Ornelas, Roel Abuce, V Reyes and others) and they are specific:

> "Very experienced, high-volume Invisalign office. They made me feel comfortable, explained the
> process clearly, and gave me confidence moving forward with treatment."

There is no need to write testimonial copy for these pages, and no excuse for doing so.

### 3. The practice already runs two Elfsight review widgets, one of them built for this campaign

| Widget id | Elfsight name | Filter |
| :--- | :--- | :--- |
| `33f2eb26-ad12-4f8c-a68d-92dd234c5f4b` | **"Legacy Dental Invisalign Marketing Ad"** | 5-star only, 20 items |
| `3574fcbf-0bad-4538-8997-540a1ea3b1a5` | site-wide | 4-star and up, 12 items |

The first exists specifically for Invisalign ad traffic. Reusing it on the new pages gives live,
always-current, genuinely Google-sourced reviews with zero transcription risk. It is also a
third-party embed, which has a rendering cost and needs a real reserved slot in the layout.

### 4. There are **six** Invisalign videos, not one

The runbook recorded three CMS testimonial videos with one Invisalign item. That is true of the
`Home videos` collection (confirmed: 3 published items, exactly as recorded) but it misses five more
Invisalign videos hard-coded into the existing offer LP. The real library:

| Vimeo id | Title | Length | Orientation | Where it lives |
| :--- | :--- | ---: | :--- | :--- |
| `1183600276` | New - Legacy Dental Pasadena Invisalign Process | 154s | landscape | offer LP |
| `1193010876` | Invisalign Testimonial - 01 | 120s | portrait | offer LP |
| `1195848251` | Testimonial (3) | 140s | portrait | offer LP |
| `1196557291` | "She used to feel insecure about her smile..." | 101s | portrait | offer LP |
| `1196557292` | "Invisalign + implants. Real results. Real confidence. Thank you, Rocio" | 46s | portrait | offer LP |
| `1129777153` | Seham Abuali Patient Story | 88s | landscape | CMS `testimonial-video-2` |
| `1129778550` | Paul Hahn Patient Story (emergency) | 50s | landscape | CMS `testimonial-video-1` |
| `1129779416` | Linda Kyle Patient Story (full mouth) | 101s | landscape | CMS `testimonial-video-3` |
| `1130256085` | Dr. Sunyoto | 29s | landscape | home hero background |

Five of the six Invisalign videos are **portrait**, which is a layout constraint and not a detail: a
vertical-video wall is the natural treatment, and a 16:9 grid would letterbox them.

The three CMS items carry attributed quotes, read from the collection:

- Seham A. — "After he did the extensive work on my teeth, he talked about Invisalign. I never
  thought having straight teeth was even possible. Dr. Sean truly changed my confidence and gave me
  a reason to smile again. Thank you, Dr. Sunyoto."
- Paul — emergency care, not Invisalign.
- Linda K. — full mouth rehabilitation, not Invisalign.

Only Seham A. is on topic. The other five Invisalign videos have no written quote attached anywhere
on the site, so any caption for them has to come from the client, not from us.

### 5. The form pattern is already established, and it is per-channel

Both LeadConnector forms on the site belong to Legacy, and both are named:

| Page | Form id | `data-form-name` |
| :--- | :--- | :--- |
| `/invisalign-offer-pasadena` | `GWW0nyfomRxi8uIYLZex` | **"Legacy Dental Pasadena Meta Ads"** |
| `/our-services/cosmetic-dentistry/invisalign` | `SZUMNyrV7SQYc8odMkv5` | "Contact Us" |

Two things follow. First, **there is no cross-client form leak here**, unlike Mason Park, whose
consult pages embed Livewell Dental's form. Second, the offer LP's form is named for its paid
channel, which is the second independent piece of evidence that this practice runs one landing page
per channel (the first being the draft page titled "Invisalign Meta Ads"). Gauge Hill will very
likely create a third LeadConnector form named for whichever channel replaces LSA, and the
consultation page needs a reserved, correctly sized slot for it.

The existing LP embeds the form **inline on the landing page**. Our funnel deliberately does not:
page 1 sends to page 2, and page 2 holds the form. That is the Mason Park shape and it is what was
agreed.

## Content the pages will be built from

### Offer mechanics, verbatim from the live page

Unchanged from what is already transcribed in
[project-overview.md](../../../docs/project-overview.md#existing-invisalign-offer-page--the-content-source):
$3,379 all-inclusive after a $600 new-patient coupon, against a stated $5,500 to $7,500 market; a
$100 refundable deposit; a 3% credit-card surcharge with none on debit, HSA or FSA; four financing
ladders (pay in full, in-office $1,000 down, Cherry at about $166/month 0% for 24 months, HFD at
$89/paycheck); insurance reimbursement typically $1,000 to $3,000; treatment 6 to 18 months; a
seven-item inclusion list; new patients only. Subject to open question 4 below.

### Proof the practice can actually stand behind

| Proof | Source | Safe to print? |
| :--- | :--- | :--- |
| 2026 Invisalign Diamond Provider | Stated site-wide, badge asset on disk | Yes |
| 5.0 Google rating, 486 reviews | Google, read 2026-08-20 | Yes, but do not hard-code a number that moves; the widget shows it live |
| 20 named Invisalign reviews | Google via Elfsight | Yes, via the widget |
| 6 Invisalign videos | The practice's own Vimeo | Yes |
| Invisalign before-and-afters | The practice's own photography, patients named in file metadata (Richard, Rosa) | Yes for the images; **check patient consent before naming anyone** |
| "500+ Invisalign Cases Completed" | The existing page only | **No.** Unverified, belongs to Gauge Hill's copy task |
| "480+" / "150+" review counts | The existing page only, and they contradict each other | **No.** Superseded by the figure above |

### Brand system already on the site

Read from `legacy-dental.shared.a2a45aabb.min.css`. The new pages inherit this rather than inventing
a palette:

| Token | Value | Role |
| :--- | :--- | :--- |
| `--dark-green` | `#585b2f` | Primary. Olive, used 43 times |
| `--soft-white` | `#fdf8ee` | Page ground, cream |
| `--skin` | `#eaddca` | Secondary surface, sand |
| `--grey` | `#949c94` | Muted sage |
| accent | `#f99b1b` | Amber, used sparingly |

Type: **Cardo** for headings (`--_typography---font-styles--heading`), **Montserrat** for body, with
Oswald, Varela and Alex Brush also loaded. The site also carries a Relume-derived token layer
(`--_primitives---colors--*`, `--color-scheme-1--*`) alongside the four plain brand variables, and a
Client-First style guide sits at page `68e12d871f12c7f04a762ae7` (draft). Read that before creating
any class in `07`.

### Practice facts for the footer and the thank-you page

Dr. Sean Sunyoto DDS; 1213 N. Lake Ave #1, Pasadena, CA 91104; (626) 584-1800; Mon to Fri 8 AM to
5 PM, Saturday flexible, Sunday closed, clinical days Mon, Tue, Wed and Fri; service areas South
Pasadena, Arcadia, Altadena, San Marino, La Cañada Flintridge, Monrovia. Booking runs through Jarvis
Analytics at `https://schedule.jarvisanalytics.com/frame?eoid=15391&elid=15000000000923`.

## Things to carry forward as warnings

- **Tracking is already installed site-wide**, on every page including the existing offer LP:
  GTM container **`GTM-TTLFRPH2`** and Meta Pixel **`1284882733596471`** (found as a `noscript`
  image beacon, which is also live evidence that Meta is or was an active channel). "Connect
  tracking" therefore means adding a conversion trigger inside containers that already exist, not
  installing anything. Still Gauge Hill's task; we install nothing and we duplicate nothing.
- The site also loads Ahrefs analytics, `link.msgsndr.com/js/form_embed.js` (LeadConnector),
  Elfsight, Swiper 11, and `sienna-accessibility`. New pages should not duplicate these globally.
- **"BOOK FREE CONSULATION"** is live on the offer page, twice, misspelled. Do not carry it across.
- One image alt on the live site reads "Invisalign **Pearl** Provider" while the copy everywhere
  else says **Diamond**. Pearl is a lower Align tier. Minor, but it belongs in the same copy-review
  hand-off.
- The existing `/invisalign-offer-pasadena` page stays live and untouched. We add alongside.

## Gate

The minimum content required to design is present: offer mechanics, real proof, real photography,
real video, real reviews, the brand system, and the practice facts. `04-design` is unblocked for the
landing page and the thank-you page. The **consultation page** is unblocked for layout, but its form
slot stays a documented seam until Gauge Hill creates the form.

Four questions remain open. Only the slug set blocks `07`. See
[open-questions.md](./open-questions.md).

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
