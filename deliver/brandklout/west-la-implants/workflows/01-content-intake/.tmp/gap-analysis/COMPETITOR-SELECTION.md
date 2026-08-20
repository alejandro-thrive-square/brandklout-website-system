# Competitor Selection Report: West LA Implants

**Prepared for Brandklout, 2026-08-20**

| Field | Value |
| :--- | :--- |
| **Client** | West LA Implants, `westlaimplants.com` (Dr. Tony Barriere, DDS) |
| **Client address** | 12301 Wilshire Blvd #205, Los Angeles CA 90025 |
| **Client footprint** | 91 crawlable URLs |
| **Benchmark selected** | Wilshire Oral Surgery & Implant Center, `wilshireoralsurgery.com` |
| **Candidates screened** | 6 |
| **Screen re-verified** | 2026-08-20, live HTTP against all six domains |
| **Evidence** | `competitor-screen.csv` (this folder) |

---

## The short answer

We chose Wilshire Oral Surgery because it is the only practice in the screen that is
**competing for the same patient, on the same procedure, at the same scale**.

It sits at **12300 Wilshire Blvd**. The client sits at **12301 Wilshire Blvd**. Opposite
sides of the same intersection, same ZIP, same catchment. Implants and full-arch are their
lead offer, not a line item. And their site is 79 URLs against the client's 91, close enough
that a difference in coverage reads as a deliberate strategy choice rather than as one
practice simply owning a bigger website.

No other candidate matched on more than one of those three axes.

---

## Why these criteria

A content gap analysis is only actionable if the benchmark is a practice the client is
actually losing patients to. We screened on five things, in priority order.

**1. Catchment overlap, the highest-weighted axis.**
Local dental search is dominated by proximity. A practice four miles east competes in a
different map pack and ranks for a different set of "near me" queries, so its content
strategy is aimed at people who were never going to walk into 12301 Wilshire. Distance is
the criterion that most directly determines whether a gap is a gap *for this client*.

**2. Same lead procedure.**
The benchmark has to lead with the client's highest-value service. Benchmark against a
general dentist and the "gaps" surfaced would largely be cleanings, whitening and family
dentistry pages, which would push the build in the wrong direction.

**3. Comparable content footprint.**
We wanted a site within roughly half to double the client's URL count. Benchmark against a
416-page site and the finding degrades to "they have more pages than you": true,
unactionable, and not a strategy insight.

**4. Independent operator.**
Two domains run by one practice are one strategy, not two data points. Counting them
separately would have double-weighted a single competitor's approach.

**5. A machine-readable sitemap.**
Required for a complete crawl rather than a sample. In this screen it turned out **not** to
be a differentiator: all six candidates had one (see the correction below).

**What we deliberately did not use.** We did not rank candidates by search rankings, traffic
estimates or backlink profiles. This engagement has no keyword-tool subscription attached, so
any such number would have been an unverifiable guess presented as data. Everything in the
screen is a fact pulled directly from the live sites.

---

## The screen

Distances are estimated from street addressing along the Wilshire corridor, not measured
door to door. Specialty mentions are homepage term counts, used as a lead-offer signal.

| Domain | Address | Dist. | Lead specialty | URLs | Verdict |
| :--- | :--- | ---: | :--- | ---: | :--- |
| **wilshireoralsurgery.com** | 12300 Wilshire Blvd #326 | **0.0 mi** | Oral surgery + implants | 79 | **SELECTED** |
| santamonicaoms.com | 2001 Wilshire Blvd, Santa Monica | ~3.5 mi | Oral surgery + implants | 91 | Runner-up |
| implantcenterlosangeles.com | 6200 Wilshire Blvd #1609 | ~4.5 mi | Implants only | 69 | Rejected |
| ladentist.com | 6200 Wilshire Blvd #1609 | ~4.5 mi | General + cosmetic | 416 | Rejected |
| westlosangelesperio.com | 11645 Wilshire Blvd #1001 | ~0.5 mi | Periodontics | 142 | Rejected |
| brentwooddentalcare.net | 11600 Wilshire Blvd #520 | ~0.6 mi | General + cosmetic | 107 | Rejected |

### Why each rejection

**Santa Monica Center for Oral Surgery** was the closest call. Right specialty, and at 91
URLs its footprint matches the client's exactly. It lost on catchment alone: a Santa Monica
practice competes for Santa Monica searchers. Worth revisiting if the client's growth plan
targets the coast.

**Implant Center Los Angeles** has the strongest implant-topic density in the entire screen
by a wide margin: **349 homepage mentions of "implant" across only 69 URLs**. On pure
implant-content depth it is arguably the best teacher in the set. It was rejected because it
sits in Miracle Mile, and because it shares an operator and a suite number with
`ladentist.com`: it is a microsite, not an independent competitor. **We recommend it as an
optional secondary benchmark** if Brandklout wants a second read specifically on implant page
depth.

**Wilshire Smile Studio (`ladentist.com`)** is the same operator as the above, is a general
and cosmetic practice rather than an implant practice, and at 416 URLs is 4.6x the client's
footprint. Rejected on three axes.

**West Los Angeles Periodontics** is geographically the second-closest, at roughly half a
mile. Periodontists do place implants, and its homepage mentions implants 36 times. But it
mentions periodontics 87 times: it leads with gum disease and perio surgery. Benchmarking
against it would have pulled the content plan toward a specialty the client does not lead
with.

**Brentwood Dental Care** is a general and cosmetic practice. Implants appear, but alongside
veneers, crowns and family dentistry. Same reasoning as above.

---

## Correction to the first version of the gap analysis

The first version of `CONTENT-GAP-ANALYSIS.md` stated that `westlosangelesperio.com` and
`brentwooddentalcare.net` were dropped for having **no machine-readable sitemap**. That was
wrong. On re-verification both serve valid sitemaps: `westlosangelesperio.com` a flat
`/sitemap.xml` with 142 URLs, `brentwooddentalcare.net` a `sitemap_index.xml` totalling 107.

Both were still correctly rejected, but on **specialty mismatch**, which is the reason now
recorded. The gap analysis has been corrected. No finding in it depended on the wrong reason,
so no conclusion changes.

---

## What the selection bought us

Choosing a same-block competitor on the same procedure is what made the headline finding
credible rather than generic:

- The competitor runs **31 neighborhood landing pages to the client's 0**, a verified
  4-services x 9-neighborhoods matrix: dental implants, oral surgeon, wisdom teeth removal
  and sedation dentistry, across Brentwood, Century City, Culver City, Mar Vista, Palms,
  Santa Monica, Sawtelle, West Los Angeles and Westwood.
- Those are the same nine neighborhoods that feed the client's own front door. The
  competitor's homepage says 12300 Wilshire is "minutes from nine Westside" neighborhoods.

Had we benchmarked four miles east, that matrix would have pointed at neighborhoods the
client does not draw from, and the single largest recommendation in the build would have been
aimed at the wrong map.

---

## Limits of this method

- **One benchmark, by design.** We chose depth on the most relevant competitor over shallow
  coverage of five. A second benchmark is cheap to add; the runner-up and the depth benchmark
  are both named above.
- **Server-rendered HTML only.** Anything injected by JavaScript after page load is invisible
  to this crawl, on both sites.
- **No traffic, ranking or backlink data**, for the reason given above.
- **Distances are derived from street addresses**, not measured routes.
- **Homepage term counts are a lead-offer signal, not a full content audit.** They were used
  to sort candidates, not to produce findings.

---

## Recommendation for future Brandklout clients

This screen was reconstructed after the fact because the delivery process has no competitor
selection step: `deliver/process/01-content-intake` did not mention competitor choice at all.
That is how an unverified reason reached a client-facing document.

A screening step has been added to that module, so every future engagement records its
candidate set, its criteria and its evidence at the moment the choice is made, rather than
reconstructing them later.

---

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../../../SYSTEM_RULES.md).
Documentation artifact; the evidence table `competitor-screen.csv` sits alongside it.
