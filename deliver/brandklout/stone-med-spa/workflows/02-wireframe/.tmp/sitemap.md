# Proposed sitemap — Stone Med Spa

**Date:** 2026-09-02 · **Phase:** `02-wireframe` · **Status:** proposed, not approved, not built

Evidence: [`competitive-research.md`](./competitive-research.md).
Machine-readable: [`sitemap.json`](./sitemap.json).
Source of the page list: Asana task
[`1218112701145002` "Core Pages - MedSpa"](https://app.asana.com/1/1210572425689866/project/1211830976769588/task/1218112701145002)
and its eleven subtasks.

> [!WARNING]
> **This sitemap is proposed under an unresolved scope question and nine of its eleven pages are
> safe under any answer; two are not.** See §4. Do not begin design until Brandklout answers which
> brand owns the med spa menu — the blocker recorded in
> [`project-overview.md`](../../../docs/project-overview.md).

---

## 1. The eleven core pages

Asana names eleven pages and gives no descriptions for any of them. The URLs, templates and
section spines below are proposed from the competitive research, not from a brief.

| # | Page | Proposed URL | Template | Notes |
| :-- | :--- | :--- | :--- | :--- |
| 1 | Home | `/` | `T1-home` | 8 sections, ~450 words. Lightest page in the set, by design. |
| 2 | About Us | `/about` | `T2-content` | The practice's story. **Not** the doctor's bio. |
| 3 | Meet The Doctor | `/about/dr-mona-stone` | `T3-bio-lead` | Deep bio. Carries the practice's clinical authority. |
| 4 | Meet the Team | `/about/team` | `T3-bio-grid` | Credentials in the heading, grouped by role. |
| 5 | Services Overview | `/services` | `T4-services-hub` | **Dual-axis hub.** See §2. |
| 6 | Service Page Sample (Botox) | `/services/botox` | `T5-service-detail` | The sample *is* the template for the whole menu. |
| 7 | Testimonials / Before & After | `/results` | `T6-proof` | Three proof types on one page. See §3. |
| 8 | Financing | `/financing` | `T2-content` | Vendor-FAQ structure, per Viva. |
| 9 | Book Consultation — Virtual and In-Office | `/book-consultation` | `T7-conversion` | See the open question in §5. |
| 10 | Membership Plan | `/membership` | `T2-content` | Two named tiers. |
| 11 | General Thank You Page | `/thank-you` | `T8-thankyou` | `noindex`. Conversion-tracking endpoint. |

### Not in the eleven, but required before launch

Asana's list is a *content* list; it omits the pages a site cannot legally or practically ship
without. Flagging them now so they are scoped rather than discovered late:

| Page | URL | Why |
| :--- | :--- | :--- |
| Contact | `/contact` | Address, hours, map, phone. Distinct from booking. Every one of the five has it. |
| Privacy Policy | `/privacy-policy` | Required. |
| Terms & Conditions | `/terms` | Required. |
| Accessibility Statement | `/accessibility` | Medical practice; ADA exposure. Beverly Hills ships a widget. |
| 404 | `/404` | — |

Recommend confirming with Brandklout whether these are inside the "core pages" task or a separate
one. They are five pages of real work.

---

## 2. Services Overview: build it on two axes

The strongest finding in the research is that every serious med spa site organises treatments on
**two** axes — what we do, and what is wrong with you — and cross-links them. Beverly Hills runs 24
concern pages plus a concern search box; NassifMD runs eight "conditions treated"; Ject runs eight
"skin goals".

`/services` should therefore do two jobs on one page:

```
/services
├── Axis A — by treatment      → category blocks, each linking to its service pages
│     Injectables · Skin & Resurfacing · Energy Devices · Hair Restoration · Skincare
└── Axis B — by concern        → "What would you like to change?" grid
      Fine lines · Volume loss · Acne & scarring · Pigmentation · Laxity · Hair thinning
```

Both axes land on the same service detail pages. The concern axis is the more valuable half —
patients search "sagging jawline", not "Morpheus8" — and it is the half most single-location med
spas skip.

**Scope note:** the eleven-page brief funds *one* service page (Botox). The category hubs and
concern pages are a second phase. The `/services` page should be built so that axis B initially
renders as anchor links into the same page, and can be promoted to real `/concerns/*` pages later
without changing the URL of anything already published.

### The service detail template (`T5`)

Botox is the sample, so the sample must be the template. Section spine, from NassifMD's Botox page
(the deepest in the set, 1,420 words) plus Skin Solutions' two additions:

1. H1 — treatment + locality (`Botox in Westlake, TX`)
2. What it is
3. What it does for you — benefit-framed, second person
4. Am I a candidate?
5. **Before & after** — embedded, not only linked
6. How it compares to adjacent products (Botox vs Dysport vs Xeomin)
7. Why this practice for this treatment — the surgeon is the differentiator
8. **Pre & post-treatment care**
9. FAQ — 6–10 questions
10. Consultation CTA

---

## 3. `/results` carries three proof types, and a consent problem

None of the five sites treat "testimonials" as one undifferentiated page. `/results` should stack:

1. **Before & after photography** — the primary asset
2. **Written reviews** — pulled from Google
3. **Video testimonials** — if any exist

Then an **authenticity FAQ**, which Beverly Hills uses to answer "are these real clients of yours?"
before the visitor thinks to ask.

> [!CAUTION]
> **We cannot currently publish before-and-after photography.** The project overview records 15
> archived galleries of real Stone patients that are *not usable without current written consent
> per case*. The page must be designed to degrade: if consent is not obtained in time, `/results`
> ships as reviews + video only, and the gallery section is added later without a redesign. Do not
> design a layout that collapses without the photographs.

Getting per-case written consent is a client task with a real lead time. It should be raised in the
same message as the scoping questions.

---

## 4. What changes under each answer to the blocker

The scope question is *which brand owns the med spa menu*. Nine of the eleven pages are unaffected.
Two are, and one more shifts in emphasis:

| Page | Scenario A — two sites, both sell the menu | Scenario B — menu moves here, cut from Surgical Arts | Scenario C — different brand (memberships / maintenance / wellness) |
| :--- | :--- | :--- | :--- |
| `/services` | **Cannibalises Surgical Arts.** Same treatments, same city, same surgeon, two domains competing for one set of search terms. | As proposed. Requires a **redirect map** from the Surgical Arts treatment URLs and edits to a site the client has already reviewed. | **Rewritten.** The menu is not the product; the programme is. |
| `/services/botox` | Direct duplicate of a published Surgical Arts page. | As proposed, plus a 301 from the sibling URL. | May not exist as a standalone page at all. |
| `/membership` | Secondary. | Secondary. | **Becomes the hero of the site**, and `/` is built around it. |
| The other eight | Unaffected | Unaffected | Unaffected |

**Recommendation.** NassifMD is a live, market-tested instance of Scenario B: one surgeon, two
domains, split on modality (surgical vs non-surgical), cross-linked by a brand switcher in the
header of both sites. It is the only one of the three that neither wastes the Surgical Arts build
nor sets the two sites against each other. Put it to Brandklout as the default and ask them to
confirm or reject it, rather than asking an open question.

Scenario A should be named as the one to avoid, explicitly, because it is what happens by default
if nobody decides.

---

## 5. Open questions this sitemap could not resolve

1. **Virtual consultations.** The brief asks for "Virtual and In-Office". **None of the five
   best-in-class sites offers a virtual consultation** — the search across all 35 captured pages
   returned one false positive. Before `/book-consultation` can be designed: who takes the call, on
   what platform, and is it a HIPAA-compliant channel? A video visit is a clinical service, not a
   form field.
2. **Trading name.** Asana says *Stone Med Spa*; Instagram says *Westlake Medical Aesthetics*. Every
   URL and every H1 in this sitemap is provisional until this is settled.
3. **Domain.** None chosen. `stonesurgicalarts.com` is already contested by the sibling build.
4. **Brand identity.** No logo, palette or type system found. Every one of the five competitors runs
   custom photography and none use stock. This sits on the critical path *ahead* of design.
5. **Before-and-after consent.** See §3.
6. **The five legal/utility pages.** In scope or not?

---

## 6. Global elements

**Header** — logo · Services · Results · Membership · About (Doctor, Team) · Financing ·
`(817) 383-8361` as a `tel:` link · **Book a Consultation** button.

The consultative CTA label ("Book a Consultation") is correct for this practice rather than the
transactional one ("Book Now"): Stone sells a surgeon's treatment plan, not an appointment slot.
Every one of the five keeps a phone number in the header; in this category the phone still converts.

**Footer** — address and map, hours, phone, the five legal pages, social, and a short
"Stone Surgical Arts" cross-link if Scenario B is chosen.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md).
