# Page flow — Legacy Dental Pasadena (Invisalign campaign)

The three Asana subtasks are **three pages in one funnel**, modelled on Mason Park. Confirmed by
the user 2026-08-20 and verified against the live Mason Park site the same day.

```
  PAGE 1                        PAGE 2                      PAGE 3
  /<invisalign-lp-slug>   -->   /<...>-consultation   -->   /<...>-thank-you
  sell the service              form + testimonials         tracking
  maximum information           minimum distraction         conversion fires here
```

## Mason Park, as actually built

Not the two-page shape recorded in this repo's older notes — that was superseded. `list_pages` on
site `6a60bdc0340e5f1784b4d553` (2026-08-20) shows a **triplet per campaign**:

| Campaign | Landing | Consultation | Thank you |
| :--- | :--- | :--- | :--- |
| Invisalign | `/invisalign` | `/invisalign-consultation` | `/invisalign-thank-you` |
| New Patient Special | `/new-patient-special` | `/new-patient-special-consultation` | `/new-patient-thank-you` |

Captures of all three live pages are in
[`../workflows/01-content-intake/.tmp/reference/`](../workflows/01-content-intake/.tmp/reference/).

## Page 1 — Landing page

**Job: sell the service, with as much information as possible.** This is the long page. It is where
every objection gets answered, because page 2 deliberately answers none.

Asana `1217658295652537`. Built as a chaptered journey per
[DESIGN-STANDARD.md](../../docs/DESIGN-STANDARD.md) — Mason Park's Invisalign LP runs 7 chapters,
3 of them pinned and scrubbed. Not a stack of coloured bands.

All of the material already exists on the practice's own
`/invisalign-offer-pasadena` and is transcribed in
[project-overview.md](./project-overview.md#existing-invisalign-offer-page--the-content-source):
the $3,379 all-inclusive price against a $5,500–$7,500 market, the four financing ladders, the $100
refundable deposit, the package inclusion list, Diamond Provider status, the insurance position,
6 FAQs, and the Free Consultation → See Your New Smile → Start Treatment arc.

The CTA sends the visitor to page 2. It does **not** open a form in place — that is the difference
from the older Mason Park build.

## Page 2 — Consultation page

**Job: capture the lead. The form and a few testimonial videos, and very little else.**

Asana `1217658295652542`. Short and quiet by design: someone who reaches it has already been sold,
so anything that is not the form or reassurance is a leak.

Mason Park's, section by section — the template to follow:

| Section | Contents |
| :--- | :--- |
| Sticky header | Phone, "Limited Consultation Availability", ★★★★★ rating |
| Hero + form | "Book Your Free Consultation" · one-line reassurance · **doctor photo, name and role beside the form** · the embedded form card |
| Testimonials | "Hear From Our Patients" · overall rating · three review cards · "Individual results vary. Every case shown is a real patient." |
| Marquee | Three-word rhythm strip |
| Short reassurance | One claim, e.g. "One Dentist, Start To Finish" |
| Footer | Rating, NAP, service areas, and the **full offer-terms disclaimer** |

**Legacy has real testimonial videos, so this page gets video, not just quote cards.** The
`Home videos` CMS collection (`68e3cdad8b3d712f2e9e9684`) holds **3 published items**, each with a
Vimeo id, a WebP poster, an attributed quote and a service label:

| Slug | Vimeo id | Subject | Patient |
| :--- | :--- | :--- | :--- |
| `testimonial-video-2` | `1129777153` | **Invisalign success story** | Seham A. |
| `testimonial-video-1` | `1129778550` | Emergency dental care | Paul |
| `testimonial-video-3` | `1129779416` | Full mouth transformation | Linda K. |

Lead with the Invisalign one. These are real patients — read the collection, never retype the
quotes, and do not invent a fourth.

The doctor beside the form is **Dr. Sean Sunyoto, DDS**.

> [!IMPORTANT]
> **The form itself is Gauge Hill's task** (`Form creation and redirect to thank you page`,
> `1217658612249899`). Build the card, the layout and the seam; do not decide the endpoint.

> [!WARNING]
> **Mason Park's consult pages embed the wrong client's form, and both of them do it.**
> `/invisalign-consultation` and `/new-patient-special-consultation` both embed LeadConnector form
> `6SUhknD0606Y66ZAgaZI`, whose `data-form-name` and `title` read
> **"Livewell Dental Google Cosmetic - Landing"** — a different Brandklout client. It is a
> placeholder that was never swapped, and it is live on both pages today.
>
> Copy Mason Park's *layout*, never its embed id. And raise the Mason Park leak separately — it is
> not this engagement's bug, but it is sending one client's Invisalign leads into another client's
> form.

## Page 3 — Thank-you page

**Job: tracking.** It is the conversion destination — the URL that proves a lead happened, and the
page the conversion tag fires on.

Asana `1217658295652547`. Mason Park's is a full 6-chapter journey (Received · The Fast Track ·
What Happens Next · The Preparation · The Team · Where To Find Us), so "it is just for tracking"
describes its *purpose*, not permission to ship a bare confirmation line. It still answers what
happens next, what to bring, and where to find us.

Mason Park's thank-you page currently carries **no tracking tags at all** — no GTM, no `gtag`, no
`fbq`. That is consistent with the split of work here:

> [!IMPORTANT]
> **Do not install tracking.** `Connect tracking` (`1217658322593903`) and
> `DNI Set Up for landing page (code insertion)` (`1217658322593910`) are Gauge Hill's. Build the
> page so a tag can be dropped in — a stable URL, a distinguishable page, the phone number in a
> swappable element — then hand it over and say exactly where the tag goes.

## What still needs answering

- **The slug set.** Confirmed 2026-08-20: the landing page is a **new page alongside**
  `/invisalign-offer-pasadena`, which stays live and untouched. The three slugs themselves are
  still open, and the site already ranks a wide Invisalign tree — see
  [project-overview.md](./project-overview.md#existing-invisalign-footprint-on-the-site--read-before-choosing-a-slug).
- **Which channel replaces LSA**, since it shapes the above-the-fold treatment.
- **Whether the $3,379 offer is still current.**

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
