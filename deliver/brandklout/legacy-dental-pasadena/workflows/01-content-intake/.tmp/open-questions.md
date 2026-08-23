# Open questions — Legacy Dental Pasadena (Invisalign funnel)

State at the close of `01-content-intake`, 2026-08-20. Two of the six questions carried into this
phase are now **closed by evidence**. Four remain, and only one of them blocks anything.

## Closed during intake

### ~~Which review figure is true?~~ Closed

Google shows **5.0 stars across 486 reviews** as of 2026-08-20, read from the practice's own
Business profile through the Elfsight widget the site already runs. "480+" is right, "150+" is
stale. What gets **printed** is still Gauge Hill's call under
`Update copywriting to make sure its true` (`1217658322593896`); the recommendation is to print no
fixed number at all and let the live widget speak, because 486 will be 500 soon enough.

### ~~Is Mason Park's wrong-client form leak repeated here?~~ Closed

No. Both LeadConnector forms on this site are Legacy's own: `GWW0nyfomRxi8uIYLZex`
("Legacy Dental Pasadena Meta Ads") and `SZUMNyrV7SQYc8odMkv5` ("Contact Us"). The Mason Park leak
is still real and still worth raising, but it is a separate engagement's bug.

## Open

### 1. The slug set — **this is the only blocker, and it blocks `07`, not `04`**

The three pages need three URLs. The site already ranks six indexed Invisalign URLs plus a live
offer LP and a draft, so a careless slug takes traffic from pages the practice already owns.

Three shapes, with the trade-off named:

| | Landing | Consultation | Thank you | Trade-off |
| :--- | :--- | :--- | :--- | :--- |
| **A. Recommended** | `/new-invisalign-pasadena` | `/new-invisalign-consultation` | `/new-invisalign-thank-you` | Zero collision with anything indexed. `new-` also reads as "new patient", which is what the offer is restricted to. Matches the Brandklout campaign-package convention used on Grand Mission |
| **B. Mason Park literal** | `/invisalign` | `/invisalign-consultation` | `/invisalign-thank-you` | Identical to the sibling client, so the funnel is instantly recognisable to Brandklout. But `/invisalign` at the root competes directly with the indexed `/our-services/cosmetic-dentistry/invisalign` |
| **C. Channel-named** | `/invisalign-<channel>-pasadena` | `/invisalign-<channel>-consultation` | `/invisalign-<channel>-thank-you` | Matches the practice's own observed habit most literally (a form named "Meta Ads", a draft page named "Invisalign Meta Ads"). But it needs question 2 answered first, and it is an ugly display URL in an ad |

Whichever is chosen, all three pages should be **excluded from the sitemap and set to noindex**,
which is what the practice already does with `/invisalign-offer-pasadena`. That is what actually
prevents cannibalisation; the slug only prevents confusion.

### 2. Which channel replaces LSA?

Google Search Ads, Performance Max and Meta each imply a different above-the-fold treatment: search
traffic arrives with intent and a query to be matched, Meta traffic arrives cold and needs the hook
first. It also decides question 1 if shape C is chosen, and it decides what Gauge Hill names the
form and the DNI pool.

Not a blocker. The page can be designed intent-first and re-hooked at the top later, which is a
copy change rather than a structural one. It should be answered before the LP hero is finalised.

### 3. Is the $3,379 offer still current?

It is on the live page today and it is described as limited-time promotional pricing, and the whole
campaign is being re-pointed to a new channel. The entire landing page is built on it: the headline,
the comparison against $5,500 to $7,500, the four financing ladders, the $100 deposit.

If the number moves, the page changes shape, not just a figure. Worth confirming before `04-design`
locks the LP.

### 4. Patient names on before-and-after images

The practice's own before-and-after files carry patient first names in their filenames and alt text
("B&A Invisalign Richard", "Rosa Before and After Invisalign"). The images are already public on the
live site; the **names** are only in metadata, not displayed as captions.

Using the images is safe. Captioning them with those names is a consent question, and the answer is
the client's. Default for now: use the images, caption them without names.

## Not questions, just hand-offs

These are settled and simply need to reach Gauge Hill with the evidence:

- The **review-count contradiction** and the stale "150+" figure. Evidence in
  `.tmp/reviews/google-reviews.json`.
- **"500+ Invisalign Cases Completed"** is unverified anywhere outside the existing page.
- **"BOOK FREE CONSULATION"**, misspelled twice on the live offer page.
- One alt reading **"Invisalign Pearl Provider"** where everything else says Diamond.
- **GTM `GTM-TTLFRPH2` and Meta Pixel `1284882733596471` are already installed site-wide.**
  "Connect tracking" is a trigger inside containers that already exist, not a new install. The live
  Meta Pixel is also a partial answer to question 2.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
