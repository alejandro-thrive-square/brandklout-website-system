# Open Questions — Grand Mission Dentistry

Status as of 2026-08-05, after the intake pass. Answered items are struck through with their source
so nobody re-asks them.

## Resolved during intake

| Was blocking | Answer | Source |
| :--- | :--- | :--- |
| ~~No client website URL recorded~~ | **https://grandmissiondentistry.com** | web search + fetch |
| ~~Asana attachments never retrieved~~ | Retrieved: `gmd-implant-lp.html`, `gmd-cosmetic-lp.html` in `.tmp/originals/` | Asana `get_attachments` on `1217040406855578` |
| ~~No brand palette / type~~ | Montserrat + Great Vibes; blues `#04669c` / `#002241` / `#abd6ff`, browns `#403830` / `#8c6946` | live site CSS `:root` |
| ~~No real doctor names~~ | Dr. William Sung DMD, Dr. Van Nguyen DDS, Dr. Tam Nguyen DMD (pediatric) | live site + originals |
| ~~No real reviews~~ | 5 named reviews + aggregate awards | originals + live site |
| ~~No imagery~~ | 48 assets downloaded incl. 8 real patient photos and both logos | `.tmp/assets/` |
| ~~What built the originals~~ | GoHighLevel, by "Digital Presence Matters" (outgoing ad company), GTM-TGSMNX3 | original HTML |

## Still open — needs Brandklout or the client

### 1. Which implant price is live? **(blocks the implant page hero)**
The client's own site says a single implant **"starts at $2,999"**. The original landing page sells
**$3,499 with an extra $500 off when paid in full**. These cannot both headline the same campaign.
Also confirm whether the "Free Dental Exam & X-Ray Worth $750" consult bundle is still on.

### 2. Which financing partners are current? **(blocks the financing matrix section)**
Live site names **Cherry** only. The originals name **Alphaeon, LendingClub, CareCredit**. The
Asana spec explicitly asks for an "Insurance & Flexible Financing Matrix", so this needs to be right.

### 3. Which office hours are correct?
Three different published sets (live site, implant LP, cosmetic LP) — see
[content-intake-summary.md](./content-intake-summary.md) §1. The thank-you page has a "Practice
Details" section, so a wrong table ships to every converted lead.

### 4. Phone numbers — keep the per-page tracking numbers?
Implant (281) 747-5929, cosmetic (281) 729-4615, main line (281) 789-8836. If these are the outgoing
agency's tracking numbers they may be switched off at handover, and every CTA on the page dies.

### 5. GHL: who creates the form, and where does it live?
Two tasks say "Make sure lead form is created in GHL for this specific page". We have **no GHL
grant** — see [mcp-access.md](../../../docs/mcp-access.md). Options: Brandklout supplies an embed
snippet per page, or we get a GHL seat. Also needed: the thank-you page URL is the form's redirect
target, so the three pages are one flow.

### 6. Build destination: pages on the existing Webflow site, or standalone?
The client's live site is already Webflow (site `698111847e9608eb30ee21c6`, Relume-based). Landing
pages almost certainly belong on it — which needs a **per-client Webflow grant that does not exist**.
Alternative is a standalone deploy on a subdomain the way the originals were hosted.

### 7. Long-form quiz or short form?
Both house references convert with a 7–8 step qualification quiz (missing teeth, timeline, credit
band) rather than a 4-field block. That changes the GHL form spec and the data the sales team gets.
Worth a deliberate yes/no before design.

### ~~8. Who is "Sang"?~~ RESOLVED 2026-08-06
**Sang Huynh** — owner of both the `BK Implementation - Grand Mission Dentistry` project and the
`Success Daily Stand-Up` project, on the Customer Success team. He is the approver and sets the
review loop. Trong Huynh and Jessica are project members; Gauge Hill and Nayeli Ortega follow the
tasks. **Nayeli Ortega** commented "as discussed by team, this is ready" on **both** the Implant and
Cosmetic subtasks on 2026-08-04 — which is why those two carry explicit section specs and the others
do not. Source: `asana-context/CONTEXT.md`.

### 9. Pricing/timeline basis
3 pages, but per [PRICING_TIMELINE_RULES.md](../../../../../../sales/PRICING_TIMELINE_RULES.md) the rate
depends on whether these are new designs or rebuilds of the attached originals. The attachments are
now in hand, so the call can be made — but it is Brandklout's commercial call, not ours.

## Urgency — this work blocks someone

The parent task `1217040406855578` **blocks** `Finalize Account Transfer for Grand Mission`
(Gauge Hill, due 2026-08-06, still incomplete). The landing pages are the gate on that transfer.
Priority order is therefore **Implant → Cosmetic → Thank-you**: the first two are the ones the team
signed off as ready to build.

The brief has moved before — the parent's original due date was 2026-07-31 and has been changed five
times, the description rewritten three times, with 12h 24m already tracked. **Treat the current
Asana description as authoritative and do not resurrect anything from earlier revisions.**

## Not questions — standing rules

- Never invent testimonials, patient stories, or statistics. Everything usable is already inventoried.
- The reference URLs are structure and content only. Do not reproduce their design.
- Do not write to Asana. Comments notify real Brandklout staff.

## Version Control

Lightweight intake artifact. Follows [SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md).
