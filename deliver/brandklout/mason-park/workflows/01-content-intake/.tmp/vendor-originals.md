# The previous ad company's originals — triage

**Source Asana parent task**: `1217040406855582`
**Files**: [`asana-context/attachments/`](./asana-context/attachments/) — pulled from the Asana task,
GID-stamped. That folder is the single source of truth; do not keep copies elsewhere.

| Attachment | Asana attachment GID | Page |
| :--- | :--- | :--- |
| `mpd-invisalign-lp.html` | `1217162344633748` | Invisalign LP |
| `mpd-new-patient-lp.html` | `1217162344633750` | New Patient Special LP |

These are the *"originals from the other Ad company"* the parent task refers to. The Invisalign one
previously sat loose at the client folder root with no provenance, which made it look like Webzite
work in progress; it is not.

## Verdict: reference material, not deliverables

Both are static rebuilds of the earlier agency's GoHighLevel pages. Neither is a finished Webzite
deliverable and neither removed any scope.

| Signal | Both files |
| :--- | :--- |
| Images | `images.leadconnectorhq.com` / `assets.cdn.filesafe.space`, GHL sub-account `GWgJnGNYokMRdIAB4fm2` |
| Google Tag Manager | `GTM-KWL239K7` — the previous agency's container |
| StatCounter | project `12978118` — theirs |
| Lead form | posts to a `{{WEBHOOK_FORM_URL}}` placeholder — wired to nothing |
| `robots` | `noindex, nofollow` |

Their **design was not reproduced**, per the batch rule that reference material supplies structure and
content only.

## Call-tracking numbers — one per page, confirmed

This is the important finding, and it corrects an earlier assumption that there was a single tracking
number for the client.

| Page | Number in the vendor original |
| :--- | :--- |
| Invisalign LP | **(281) 767-8698** |
| New Patient Special LP | **(281) 688-1610** |
| Practice's real public number | (281) 769-8878 |

Two different numbers, on two pages, from the same vendor, sharing one GTM container and one
StatCounter project. Neither appears in any public listing for the practice. That is **per-page call
tracking**, matching the pattern already observed on Grand Mission's equivalent pages.

Consequence for our build: the tracking number is a **per-page** value, not a client-level one. The
pages are wired accordingly — see `04-design/.tmp/shared/mpd.js`.

> [!WARNING]
> Ownership of these two numbers is unconfirmed. They were provisioned by the outgoing vendor, so
> they may not be under Brandklout's control and may not still route to the practice. **Dial both
> before any spend starts.** The practice's public number is one line away as a fallback.

The thank-you page has **no** vendor original and therefore no discovered number. Asana says
*"Check GHL for proper tracking number"* for that task specifically.

## Content taken from them

Copy that exists nowhere else, used because it is the practice's own:

- **From the Invisalign original** — the free stack (Vivera retainers, KOR whitening gel, free
  virtual or in-office consultation, free 3D and wellness scan); Dr. Dave Cho's and Dr. William
  Sung's bios verbatim; the six bite problems; the accreditation set.
- **From the New Patient original** — see the discrepancy below. Its extra offer detail was **not**
  adopted, pending confirmation.

## Discrepancy: what the $189 actually includes

The vendor's New Patient page describes a **richer** offer than the client's own `/special-offers/`
page, and the two do not agree.

| Source | What $189 includes |
| :--- | :--- |
| Client's live site (**used on our page**) | Comprehensive exam, x-rays, cleaning, full treatment plan. "That's $328 in savings." |
| Vendor original (**not used**) | Comprehensive dental exam, essential x-rays, wellness-enhancing 3D mouth scan, precision bite analysis, thorough regular cleaning — and elsewhere on the same page also soft tissue evaluation, gum/periodontal analysis and a CT scan |

The vendor page additionally offers a **"Choose Your Exclusive Gift"** mechanic that appears nowhere
on the client's site:

- Free Sonicare electric toothbrush — *PPO patients only*
- Free KOR teeth whitening kit — *PPO patients only*
- $250 off treatment of $750 or more — *cash and PPO patients*
- *Offers cannot be combined*

Our page uses the **client's own, narrower** description. Under-describing an offer is the safer
error than over-promising one we cannot verify, and the gift mechanic carries PPO eligibility
conditions we have no authority to assert. But if the vendor's version is the offer as actually run
in market, our page is under-selling it and the gift choice is a strong conversion device worth
adding. **This needs a decision from the practice** — it is in Open Questions.

## Conflict: Saturday opening

The vendor's New Patient page claims *"We are open on Saturdays as well, beyond regular hours."*
The client's live site says **Friday, Saturday and Sunday: Closed**. Our pages follow the live site.
Either the vendor page is stale or the practice changed its hours; worth confirming.

## Do not reuse

The GTM container, the StatCounter project, the GHL-hosted images, and the two tracking numbers until
their ownership is confirmed.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
