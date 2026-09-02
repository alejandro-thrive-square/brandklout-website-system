# Competitive research — five best-in-class med spa websites

**Date:** 2026-09-02 · **Worktree:** `bk-stone-med-spa` · **Phase:** input to `02-wireframe`

Research only. Nothing was designed or built. The deliverable is
[`sitemap.md`](./sitemap.md) / [`sitemap.json`](./sitemap.json); this file is its evidence.

> [!NOTE]
> All five sites were captured live on 2026-09-02 with headless Chrome at 1440×desktop and
> 390×mobile. 40 full-page PNGs are in [`screenshots/`](./screenshots/) (gitignored — `*.png` is
> excluded repo-wide). Structured extraction of every page is in
> [`content.json`](./content.json): titles, meta, heading spine, nav links, CTA labels, section
> word/image counts, schema types.

---

## 1. Why these five

The published "best med spa website" listicles are SEO inventory, not judgement, so they were used
only to build a candidate pool. 21 candidates were verified live, their sitemaps pulled, and the
five below were chosen because each one answers a question **this** project has to answer. Two
were rejected despite strong craft (Minimale Skin, Alea) because they teach styling we can already
do and nothing about structure.

| # | Site | Pages | Why it is in the set |
| :-- | :--- | ---: | :--- |
| 1 | [NassifMD Medical Spa](https://www.nassifmdmedspa.com/) | 134 | **A surgeon's med spa run as a separate brand from his surgical practice.** This is Stone's exact problem. |
| 2 | [Beverly Hills Med Spa](https://www.beverlyhillsmedspa.com/) | 186 | The best concern-first information architecture found anywhere in the category. |
| 3 | [Skin Solutions Collective](https://www.skinsolutions.co/) | 49 | The closest 1:1 match to our eleven-page brief, at a size we can actually build. |
| 4 | [Ject](https://ject.us/) | 473 | Treatments merchandised as products; the strongest membership and booking machinery. |
| 5 | [Viva Day Spa + Med Spa](https://www.vivadayspa.com/) | ~200 | Texas. Two brands under one roof. **The only one of the five with a financing page.** |

---

## 2. The finding that matters most

**NassifMD solves the problem that is currently blocking this build, and it solves it with a link.**

Dr. Paul Nassif is a facial plastic surgeon who runs a surgical practice *and* a med spa. Rather
than merge them or let them compete, he runs two separate domains and puts a brand switcher in the
top-left utility bar of both:

```
PLASTIC SURGERY  |  MEDSPA  |  ESPAÑOL
    ↓                 ↓
drpaulnassif.com   nassifmdmedspa.com
```

The split is drawn on **modality, not on body part**: surgery lives on one domain, everything
non-surgical on the other. The med spa domain sells injectables, lasers, body contouring,
aesthetician services, hair restoration and skincare, and never sells an operation. The surgical
domain never sells a HydraFacial.

This matters because [`project-overview.md`](../../../docs/project-overview.md) records that Stone
Surgical Arts already publishes the entire med spa menu at fixed prices, and that the three ways
out are (1) two competing sites, (2) cut the menu out of Surgical Arts, or (3) a different brand
entirely. **NassifMD is a live, working, market-tested instance of option 2** — and it shows the
cut is survivable because the two sites cross-link rather than compete.

Viva is the same pattern executed inside one domain: `SPA TREATMENTS` and `MED SPA` are separate
first-level nav items, separate URL trees (`/treatments/*` vs `/med-spa/*`), separate staff pages
(`/about/med-spa-staff/`), and separate booking paths. That is the shape option 3 would take if
Brandklout decides the med spa is a sub-brand rather than a standalone one.

> [!IMPORTANT]
> This does not unblock the build. It narrows the question from "what do we do?" to "which of these
> two proven patterns does Brandklout want?" — which is an easier question to put to a client.

---

## 3. Content analysis

### 3.1 Every strong site organises treatments on two axes, not one

This is the single most consistent finding. Three of the five publish a **concern axis** alongside
the **treatment axis**, and the two axes cross-link into each other:

| Site | Treatment axis (what we do) | Concern axis (what's wrong) |
| :--- | :--- | :--- |
| NassifMD | `/injectables/` `/lasers/` `/body-contouring…/` `/aesthetician/` `/other-services/` `/skincare/` | `/conditions-treated/` — 8 pages |
| Beverly Hills | `/face` `/skin` `/body` `/hair` `/wellness` | `/concerns/` — **24 pages**, with a search box |
| Ject | `/treatments/` — 11 categories | `/skin-goals/` — 8 pages |
| Skin Solutions | Fillers · Lasers · Body · Wrinkle Reducers · Microneedling · Peels | — (uses a signature service instead) |
| Viva | `/med-spa/` — injectables · skin rejuvenation · body contouring · lasers | — |

The reason is commercial, not editorial. Patients do not search "Morpheus8"; they search "sagging
jawline". The treatment axis captures people who already know the brand name of the thing they
want. The concern axis captures everyone else — which is most of the market, and the more valuable
half, because they have not yet chosen a provider.

Beverly Hills goes furthest: its `/concerns` hub opens with **"Find The Right Treatment For Your
Aesthetic Concern"**, a free-text search field prompting *"Search your skin concern (e.g., acne,
wrinkles, pigmentation…)"*, and a grid of 24 concerns grouped under Face, Body, Hair and Wellness.
It is a triage tool disguised as a page.

### 3.2 The service page has a settled anatomy

NassifMD's Botox page (1,420 words, 14 sections) is the deepest in the set and the others are
subsets of it. The recurring spine, in order:

1. **H1 = treatment + city** ("BOTOX Beverly Hills") — local SEO carried by the H1, not a tagline
2. What it is / what it is made of
3. What it can do for *your* look — benefit framing, second person
4. Am I a candidate?
5. **Before & after, embedded in the page** — not only linked to a separate gallery
6. How it differs from adjacent products (Botox vs Dysport vs Xeomin)
7. Why choose us for this specific treatment
8. **FAQ** — 5–10 questions, always including "how much does it cost?" and "will I look frozen?"
9. Consultation CTA

Skin Solutions adds two sections worth stealing: **"PRE & POST-TREATMENT INFO"** and treatment-specific
**reviews** (not site-wide ones). Ject inverts the model entirely — its Botox page is only 281 words
because it is a *category landing page* that routes into a booking store, with the education pushed
to the blog.

### 3.3 Social proof is stratified, and the gallery carries a compliance burden

None of the five treat "testimonials" as one page. They run three separate proof types:

- **Written reviews** — Beverly Hills has a dedicated `/patient-reviews` page, 1,132 words
- **Video testimonials** — embedded per-treatment and on `/results`
- **Before & after photography** — Skin Solutions' `/before-and-afters` carries **291 images** on
  one page; Beverly Hills has `/results`

Beverly Hills' `/results` page ends with an FAQ block that exists purely to defuse scepticism and
liability:

> *"ARE THE BEFORE-AND-AFTER IMAGES REAL CLIENTS OF BEVERLY HILLS MED SPA?"*
> *"WHAT TYPES OF TREATMENTS ARE FEATURED IN THE BEFORE AND AFTER PHOTOS?"*
> *"HOW SOON CAN I EXPECT TO SEE RESULTS FROM MY TREATMENT?"*

This is directly relevant to us. The project overview records 15 archived before-and-after galleries
of real Stone patients that are **not usable without current written consent per case**. The
category norm is to publish them *and* to answer the authenticity question on the page. We can do
neither until consent exists, so the gallery page must be designed to degrade gracefully — see
§5.4 of the sitemap rationale.

Note also what Viva's `/gallery/` actually is: a **facility** gallery (five locations, 56 images),
not a results gallery. Two different pages that share a word.

### 3.4 Membership is the business model; financing is nearly absent

Four of the five run a membership programme and it is merchandised hard — Ject and Skin Solutions
both put `MEMBERSHIP` in the primary nav, and Ject's sitewide promo bar quotes a member discount
and a non-member discount side by side, which is a permanent, visible argument to join.

Two membership architectures were observed:

| Model | Example | Shape |
| :--- | :--- | :--- |
| **Named tiers** | Skin Solutions | Two tiers, named for the customer rather than the product: **"HIGH MAINTENANCE"** and **"LOW MAINTENANCE"** |
| **Fee + credit + perks** | Ject | A joining fee plus an account credit spendable across the year at member rates, wrapped with partner-brand perks, a birthday gift and a free peel; plus occasion packages (Wedding, Men's) |

Financing is the opposite story. **Only Viva, the Texas practice-attached one, has a financing
page at all** — `/med-spa/financing/`, 1,844 words, built almost entirely as FAQ around three
third-party vendors (Allē Payment Plans, Cherry, CareCredit). The four luxury and DTC brands have
none: they sell memberships and packages instead of lending.

That is a signal about *audience*, not about quality. Financing pages appear where the customer is
a suburban patient considering a four-figure course of treatment; they disappear where the customer
is an urban repeat buyer of a routine. Westlake is the former. Our brief asks for a financing page
and the brief is right — but the model to copy is Viva's, and it is a vendor-FAQ page, not a
sales page.

### 3.5 Nobody offers a virtual consultation

Searched across all 35 captured pages for "virtual consult", "video consult", "telehealth",
"telemedicine", "online consult", "virtual appointment". **One hit, and it is a false positive** —
Viva's phrase "online consultation request form", which is a web form, not a video visit.

Our Asana brief asks for *"Book Consultation — Virtual and In-Office"*. Not one of the five
best-in-class med spas in the category does this. That does not make it wrong — it is plausibly a
genuine differentiator for a surgeon-led practice where a virtual screening saves the patient a
drive — but it needs a real operational answer (who takes the call, on what platform, is it a
HIPAA-compliant channel) before it becomes a page. Flagged as an open question, not designed.

### 3.6 Booking, and the conversion furniture

| Site | Booking mechanism | Primary CTA label |
| :--- | :--- | :--- |
| Ject | Full external store, `booking.ject.us/webstoreNew/…` (Zenoti-pattern) | "Book Now" |
| Viva | On-site page + per-treatment forms (3–4 forms per page) | "Book Appointment" / "Schedule a Complimentary Consultation" |
| Skin Solutions | `/book-now` page, single form, 80 words | "BOOK NOW" |
| Beverly Hills | Form-driven | "BOOK A CONSULTATION" |
| NassifMD | Contact page, no online booking | "Contact Us" |

Two patterns worth noting. First, **the CTA label splits by business model**: transactional brands
say "Book Now", consultative brands say "Book a Consultation" or "Schedule a Complimentary
Consultation". Stone is consultative — a surgeon-led practice selling a treatment plan, not a
30-minute appointment slot — so the consultative label is correct.

Second, **every site keeps a phone number in the header** next to the booking button, and Beverly
Hills, Viva and NassifMD all render it as a `tel:` link. In this category the phone still converts.

### 3.7 Craft observations

- **Typography** is uniformly a high-contrast serif display over a neutral sans body. Beverly Hills
  and Ject both use a fashion-magazine serif; Skin Solutions runs an all-caps letterspaced sans.
- **Palette** splits into two camps: warm blush/burgundy (Beverly Hills), and desaturated
  greige/off-white with a single accent (Skin Solutions' red, Ject's deep green). The 2026 trend
  commentary calls dusty rose dominant; the actual award-adjacent sites are more restrained.
- **Photography** is the real differentiator and it is always custom. Skin Solutions leads with its
  own reception desk; Viva with treatment-room photography; Ject with editorial studio portraits.
  None use stock. **Stone currently has no med spa photography and no brand identity** — this is on
  the critical path ahead of design.
- **Accessibility**: Beverly Hills ships a visible accessibility widget. Only NassifMD and Beverly
  Hills emit structured data (`Physician`, `MedicalOrganization`, `MedicalBusiness`); Ject and Viva
  emit **none**, which is a real SEO gap in a local-intent category and an easy win for us.
- **Weight**: homepages ran 404–2,791 words and 18–139 images. The two best-regarded (Beverly Hills
  at 404 words, Skin Solutions at 711) are the *lightest*. Length is not the lever.

---

## 4. What each site is worth stealing for, page by page

| Our page (from Asana) | Best model | What to take |
| :--- | :--- | :--- |
| Home | Beverly Hills | 404 words, 8 sections, awards + press row above the fold, one CTA repeated |
| About Us | Skin Solutions | Practice-level story separate from the doctor's bio |
| Meet The Doctor | NassifMD `/about/dr-paul-nassif/` | Credentials → signature technique → hospital affiliations → media → giving back |
| Meet the Team | Viva `/about/med-spa-staff/` | Grouped by role with credentials in the heading (`PA-C`, `FNP-C`, `LA, LT`) |
| Services Overview | Beverly Hills `/concerns` + NassifMD `/treatments-offered/` | **Both axes.** Category hub + concern triage |
| Service Page (Botox) | NassifMD `/injectables/botox/` | The nine-part spine in §3.2, plus Skin Solutions' pre/post-care block |
| Testimonials / Before & After | Beverly Hills `/results` + Skin Solutions `/before-and-afters` | Three proof types, separated; authenticity FAQ on the gallery |
| Financing | Viva `/med-spa/financing/` | Vendor-by-vendor FAQ structure, not a sales pitch |
| Book Consultation | Viva `/med-spa/complimentary-consultation/` | "Treatments you're interested in" multi-select in the form |
| Membership Plan | Skin Solutions + Ject | Two named tiers (Skin Solutions) or fee+credit+perks (Ject) |
| Thank You | — | None of the five expose one; it is a conversion-tracking page by convention |

---

## 5. Sources

Roundups used to build the candidate pool (not as judgement):
[Colorlib](https://colorlib.com/wp/med-spa-website-examples/) ·
[Flamingo Agency](https://www.flamingoagency.com/blog/best-medical-spa-websites/) ·
[WebCitz](https://www.webcitz.com/blog/best-medspa-websites/)

Award context: [Awwwards — aesthetics/clinic entries](https://www.awwwards.com/sites/aesthetics-clinic)

Primary sources — captured live 2026-09-02:
[nassifmdmedspa.com](https://www.nassifmdmedspa.com/) ·
[beverlyhillsmedspa.com](https://www.beverlyhillsmedspa.com/) ·
[skinsolutions.co](https://www.skinsolutions.co/) ·
[ject.us](https://ject.us/) ·
[vivadayspa.com](https://www.vivadayspa.com/)

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md). Screenshots in
`screenshots/` are excluded by the repo-wide `*.png` asset rule.
