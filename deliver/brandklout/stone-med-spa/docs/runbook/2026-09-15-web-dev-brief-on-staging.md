# 2026-09-15, later — The teammate's web dev brief, applied and published to staging

One ask: "We have this new brief that one teammate sent. We need to update the site accordingly."
The brief is
[`01-content-intake/.tmp/client-references/Web Dev Brief - WMA.md`](../../workflows/01-content-intake/.tmp/client-references/Web%20Dev%20Brief%20-%20WMA.md)
(the .docx next to it is the original and is not committed because it is a binary). It is a
teammate's write-up of a client call with Summer Takkouch. Most of it repeated the Asana feedback
the [earlier run](./2026-09-15-client-feedback-on-staging.md) had already applied, so this run
applied only the **differences**. **Staging only**, and production is unchanged.

## Done (commit SHA in INDEX)

| Brief | Change |
| :-- | :-- |
| §1 Phone "no change needed" | **Reverted to (817) 383-8361** site-wide (navbar, drawer, footer, closing band, book, botox, home, thank-you, JSON-LD). It is a call-tracking number that forwards to the office line 918-3666. The earlier run had swapped in the flyer's office line. |
| §2 Menu | Category order is now Injectables, Skin Rejuvenation, **Facials, Restoration**. Sculptra sits under a **Biostimulators** subheading, via a new `group` field in `treatments-data.mjs`, `categoryRows()` in `build-site.mjs`, a `data-sub` wrapper hidden by `10-ledger.js` when the filter empties it, and `.menu_subhead` in `57-menu.css`. HydraFacial says "several versions", and dermaplaning explains what it is. **Skin boosters are now HydraFacial booster serums** ("offered with the HydraFacial"), not HA injections. |
| §2 Counting copy | The "12 treatments" counts are off the /treatments, /about and home facts. The /treatments cover now leads with what non-invasive treatment achieves. |
| §3 Team | "Full bio coming soon." on both cards. |
| §4 About | The three-card "names" stack is deleted. The line section reads "Two teams. Your plan." (two practices, two teams, referral). "Same building" is removed from every page and from SEO, because the businesses are separate and a physical move is likely. |
| §5 Rules | Rule 01 says "assessed by our highly skilled medical providers". Rule 03 is "A plan that's yours alone". **Rules 1–2 were held**; see Next 1. |
| §6 Reviews | Two verbatim excerpts from the practice's own Google listing (cid `5029391273850887414`), on home and /results, plus a link card and an FAQ link to the listing. The placeholders are gone. |
| §7 Financing | The membership FAQ is deleted. |
| §8 Membership | "Why a membership?" with the client's wallet framing, under the flyer's "Wellness Wallet" name, plus "One membership. No tiers to compare." The **signed membership agreement** is disclosed in the flag, the plan card, the closing line and SEO. |
| §9 Book | "You're assessed by our highly skilled medical providers…". The heading is "Your first consultation can be in person or by video." "Any treatment happens afterward in our Westlake office" is deleted, including from the closing band. |
| Global | "our highly skilled medical providers" on home, about, team, book, the closing band and the SEO descriptions. |

### Staging push

- Backup first: `.tmp/backup-staging-2026-09-15-brief/` (seq 3). `snapshot-staging.mjs` now takes a
  folder argument, because it had overwritten a fixed folder.
- `ship.sh` used the previous session's `link-staging` dir (still linked, and `check-link` said OK).
  `push-site --apply --force` (the dry run's refusal is trap 11, expected), then publish:
  `{"publishedPages":11}`. DoH was not needed, because the subdomain now resolves on this workstation.

### Gates

- Local: `audit` FAIL none (the WARN is the home title at 71 chars, as before). `all-pages` 132
  clean. `menu-test` 9/9.
- Staging: `verify-live` FAIL none (11 routes, 11/11 titles). `css-parity` FAIL none. `compare-live`
  has 2 findings, which are the trap 30 container-margin noise.
- `visual-diff`: 1440 ≤1.4% and 390 ≤4.1% on ten pages. **/about is 6.5% at 1440 and 23% at 390
  (+31px)**. I looked at it: the live render wraps the "Two teams" paragraph onto one extra line,
  and everything below shifts. The sections are identical.
- A curl pass over ten staging pages found 383-8361 on all of them. None carried 918-3666, "same
  building", the placeholders or the membership FAQ.

## Next

1. **Ask the client about Dr. Stone and injections** (brief §11). The brief's rules "The surgeon
   injects. If Dr. Stone is not in, you are not injected." contradict the Asana feedback ("not by
   Dr. Stone, nor does she do the injections") and Brooke's NP Injector title. The site still says
   Brooke injects and Dr. Stone does not treat patients here (`/botox`, `/team`,
   `/meet-the-doctor`, the Injectables blurb). Whichever way the client answers, those four places
   change together.
2. **Confirm how the Wellness Wallet works.** The copy follows the client's words: the $149 goes
   into the wallet each month and saves toward the next treatment. Does an unused balance roll
   over, and what happens to it on cancellation? Confirm before production.
3. **Reviewer names.** Tati Segovia (Botox) and Lisa Dray (Botox/HydraFacial/microneedling) are
   quoted without names. The listing's other three reviews are by Summer Takkouch (the client),
   "Mona Stone" and "Martin Stone", and they are deliberately not used. As more reviews come in,
   put the ones that name a treatment on that treatment's page (brief §6). Botox has one now, and
   /botox has no slot for it yet.
4. From the client, still: the Cherry link, the treatment price list, bios and photos for Brooke
   and Abby, and before-and-after photos.
5. The Google listing says **#110b**; the site says #110. Ask which.
6. Then production, following the earlier run's Next 2.

## Gotchas

- **A brief can undo an earlier "fact taken from the client's material".** The flyer's phone was
  the office line, but the site deliberately uses a tracking number. Before changing a phone
  number, check whether it is a call-tracking line.
- **A Google review isn't a patient testimonial just because it's five stars.** Check reviewer
  names against the client and the doctor before quoting any.
- **`push-site.mjs` without `--apply` exits 1 on a live site** (trap 11 refusal). A `&&` chain
  stops there, so run `--apply --force` on its own line.
- **/about at 390 diffs high whenever its paragraphs re-wrap.** Look before chasing it.

## Version Control

Tracked. Committed with the work it describes.
