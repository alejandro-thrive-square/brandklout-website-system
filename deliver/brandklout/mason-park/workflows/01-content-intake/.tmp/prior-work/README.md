# Prior work — `mpd-invisalign-lp.html`

**Source Asana task GID**: `1217133289235652` (Invisalign Landing Page)
**Triaged**: 2026-08-05

This file sat at the root of `deliver/brandklout/mason-park/` with no docs and no record of where it
came from. [project-overview.md](../../../../docs/project-overview.md) flagged resolving it as the
first blocking unknown, because a finished page would have removed a third of the scope.

## Verdict: it is the previous ad company's page, not a Webzite deliverable

It is a **static rebuild of the earlier agency's GoHighLevel landing page**, and it is the artefact
the parent Asana task refers to: *"Attached are the originals from the other Ad company. Use it as a
reference point."*

The evidence:

| Signal | What it shows |
| :--- | :--- |
| Every image is on `images.leadconnectorhq.com` / `assets.cdn.filesafe.space` | GoHighLevel's CDN, under the previous agency's sub-account `GWgJnGNYokMRdIAB4fm2` |
| `GTM-KWL239K7` hard-coded in `<head>` | A Google Tag Manager container that is not the practice's |
| StatCounter project `12978118` | Third-party analytics belonging to the previous agency |
| `WEBHOOK_URL = "{{WEBHOOK_FORM_URL}}"` | The lead form was never wired up — it posts nowhere |
| Phone `(281) 767-8698` throughout | Not the practice's public number; see below |
| `noindex, nofollow` | Never intended to be a live indexed page |

So it is **not a finished deliverable and not client-supplied source material** — it is a rebuild of
the competitor page. Treating it as done would have shipped the previous agency's tracking, their
design, and a dead form.

## How it was used

As a **content source**, which is what it is good for. The following was taken from it because it is
the practice's own copy and appears nowhere else:

- The all-inclusive Invisalign "free" stack — Vivera retainers, KOR whitening gel, free virtual or
  in-office consultation, free 3D and wellness scan.
- Dr. Dave Cho's and Dr. William Sung's bios, verbatim.
- The six bite problems (crossbite, gapped teeth, underbite, overbite, crowded teeth, open bite).
- The accreditation set (Kois Center, Seattle Study Club, AGD, AAPD, ABPD).

Its **design was not used**, per the batch rule that reference material supplies structure and
content only. Its pricing was superseded by the client's own `/special-offers/` page, which is
authoritative and more complete.

## The phone number finding

The page hard-codes **(281) 767-8698** in the header, footer, sticky widget and form error path.
The practice's real public number is **(281) 769-8878** — that is what the live site and every
directory listing carry, and (281) 767-8698 appears in none of them.

That strongly suggests (281) 767-8698 is the **call-tracking number the previous agency
provisioned**, which is exactly what the thank-you page task means by *"check GHL for proper
tracking number."* It cannot be confirmed without GHL access, so the new pages fall back to the
public number and read it from one constant. See Open Questions in
[project-overview.md](../../../../docs/project-overview.md).

## Do not reuse

The GTM container, the StatCounter project, the GHL-hosted images and the tracking number all belong
to the previous agency. None of them should be carried into the new pages.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md).
