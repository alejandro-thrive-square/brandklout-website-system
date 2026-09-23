# Scoping Questions for Brandklout — Stone

Sendable question set. Research that could be done from public sources has already been done and is
**not** asked here — see [`discovery-findings.md`](./discovery-findings.md).

| Field | Value |
| :--- | :--- |
| **Asana tasks** | `1217160668112180` (Stone Med Spa), `1217160668112175` (Stone Surgical Arts) |
| **Asana project** | `1213901750672059` |
| **Prepared** | 2026-08-05 |
| **Status** | Not sent. Nothing has been written to Asana. |

> [!NOTE]
> Nine questions, ordered so that 1–3 unblock estimating and 4–9 unblock building. If only three get
> answered, make it 1, 2, and 3.

---

## Draft message

Hi — before we estimate the two Stone builds, we did the public research so we could come to you
with decisions rather than questions. Here is what we found and the nine things only you can answer.

**What we found.** Dr. Mona Stone runs all three names out of one Westlake office. Stone Surgical
Arts was the original site and has been folded into Stone Dental Implant Center, which is live on
Webflow and now carries only the oral-surgery services. The cosmetic and skin services that used to
be on Surgical Arts are not online anywhere today. So these two tasks look like pillars 2 and 3 of a
brand split that is already one-third finished. Separately, and worth flagging on its own: the old
Surgical Arts URLs all 404 — the consolidation used a single homepage redirect with no page-level
map, so roughly 130 pages of search equity is decaying right now.

**1. Is the three-brand split correct, and where do the overlaps go?**
Our read is Stone Dental Implant Center = oral surgery, Stone Surgical Arts = cosmetic facial
*surgery*, Stone Med Spa = non-surgical skin and injectables. Confirm that is the intent. Then tell
us where the overlaps land, because the old site listed several services under both pillars: Botox
and Xeomin, dermal and facial fillers, Morpheus8, HydraFacial, CO2 laser, hair restoration, PRP, and
the GLP-1 weight-loss program. Those are the med spa's core revenue, so which brand owns them
changes both sites materially.

**2. Full architecture or lean launch?**
Mirroring the old site is roughly 42 pages across the two builds. A lean launch covering the hero
procedures only is roughly 21. We would recommend the lean launch first and add procedure pages
after the ad traffic tells us which ones convert. Which are we planning against?

**3. Sequencing and capacity.**
These two are undated in Asana and are sitting alongside twelve landing pages due this week. The
full-architecture version is roughly double the lean one, so it is a materially different commitment
on the calendar. Which comes first, Surgical Arts or Med Spa, is there a real launch date behind
either, and do they run one after the other or in parallel?

**4. Does Stone Med Spa exist yet?**
We cannot find the name anywhere publicly. Is it a new brand being launched, a rename of the
aesthetics side, or a separate physical location? And does it have a logo, palette, and type system
already, or is identity work in scope for us? A med spa and a surgical practice should not share one
visual identity. This one is on the critical path — if identity work is ours, it has to finish before
design can start, which moves the date on everything downstream. Also worth confirming: the Asana
task says "Build New Stone Med Spa" without the word "website" — we are assuming website.

**5. Domains and DNS.**
`stonesurgicalarts.com` currently redirects to the implant center. Are we reclaiming it for the new
Surgical Arts site? What domain do you want for the Med Spa? And who controls DNS — Brandklout, the
client, or the previous agency?

**6. Webflow access.**
The implant center is on Webflow. Do the two new sites go into the same Webflow workspace, and can
you grant us access? Related: should they inherit the implant center's design system so the three
read as one family, or should each brand look distinct? We have no Webflow grant for this client
today and will not create one until you say so.

**7. Content.**
The old Surgical Arts pages are intact in the Wayback Machine, so the copy is recoverable. Do you
want us to recover and rework it, will the client supply fresh copy, or is copywriting ours? Note
the old site also published the practice's own treatment prices on a public page — tell us whether
the client wants that back, since it changes the page list.

**8. Before-and-after photography.**
The old site had 33 before-and-after cases of real patients. We are not republishing patient
photography pulled from a web archive without written confirmation that the client holds current
photo releases for each case. Can the client supply the originals plus consent status?

**9. Integrations and approvals.**
The old site ran Crisalix 3D simulation, Cherry financing, an online referral form, and virtual
appointment requests. Which of those carry over? Where should leads route — GoHighLevel, as with the
landing pages? And who signs off on designs, on what cadence?

Once 1 through 3 are settled we can put a firm page list and a delivery sequence against both builds.

---

## Internal notes — do not send

- **No commercial terms in this message, ever.** Brandklout is a partner engagement, not a per-page
  client; `sales/PRICING_TIMELINE_RULES.md` does not apply under `deliver/brandklout/`. Page counts
  here drive **sequencing and capacity only**. If a question comes back asking what it costs, that
  goes to whoever owns the partner relationship — not answered from this folder.
- **Do not start building.** Both tasks stay blocked until Q1–Q3 are answered. This task is scoping
  only. The Asana project is `BK Activation`, which for Dr. Nahlah meant onboarding rather than
  production.
- **No platform grant exists.** Per [`mcp-access.md`](../../../docs/mcp-access.md), do not
  authenticate to Webflow, GHL, DNS, or anything else for this client.
- **Q8 is a regulatory point, not a preference.** Patient photography scraped from an archive is a
  HIPAA and consent problem, not a content-sourcing convenience.
- **The broken redirects (Q-intro) are worth surfacing even if both builds are deferred.** It is
  ongoing damage that predates our involvement and is cheap to fix relative to the loss.
- The previous agency was **NKP Medical Marketing** — their banner is in the archived source and
  their staff authored the blog posts. Likely the "other Ad company" referenced on the Grand Mission
  and Mason Park tasks.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
