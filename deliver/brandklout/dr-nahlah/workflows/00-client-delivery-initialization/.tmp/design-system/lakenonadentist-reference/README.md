# Visual Reference — lakenonadentist.com

The template Dr. Nahlah approved during discovery. Captured 2026-07-30 as the
`selected_design_system_reference` for this project, per
[00-client-delivery-initialization](../../../00-client-delivery-initialization.md).

> [!IMPORTANT]
> **Visual reference only.** This folder holds screenshots. No HTML, CSS, or JS from
> the reference site is stored, fetched into artifacts, or read into agent context —
> deliberately, to avoid polluting the build with another site's markup and to keep
> the rebuild an original design informed by the reference, not a code clone.
> The reference site is **Makris Dental Prosthodontics** (a different practice);
> nothing from it may be reproduced verbatim in Dr. Nahlah's site — not copy,
> not imagery, not brand marks.

## Contents

| Path | What it is |
| :--- | :--- |
| `desktop/` | Full-page JPEG per page, 1440px wide |
| `mobile/` | Full-page JPEG per page, 390×844 (18 pages, one per distinct template) |
| `urls.txt` | All 77 sitemap URLs (desktop sweep) |
| `urls-mobile.txt` | Mobile subset — one page per distinct template |
| `capture.mjs` | The capture driver (re-runnable) |
| `capture-manifest*.json` | Per-page result: file, page height, truncation flag, size |
| `capture-desktop.log` / `capture-mobile.log` | Run logs |

Screenshots are `.jpg` and therefore **gitignored** by the repo's binary-asset rule.
They live locally and sync to the VPS via `rclone` (see
[DELIVER_SYSTEM_RULES.md §3](../../../../../DELIVER_SYSTEM_RULES.md)). The manifests,
URL lists, and this README are committed so the capture is reproducible.

## Capture Method

Per page the driver:
1. Navigates and waits 3.5s for fonts and hero media.
2. Scrolls top → bottom in viewport steps (450ms dwell) so lazy-loaded images and
   IntersectionObserver reveals fire.
3. Scrolls back to top and takes one `captureBeyondViewport` full-page shot, so
   reveals are captured in their end state rather than at `opacity: 0`.

Full-page captures are clamped to 15000px (Chrome garbles taller captures); pages
past that are flagged `truncated: true` in the manifest. Only the homepage
(15915px) exceeds it.

Re-run with:
```bash
node capture.mjs urls.txt desktop --width 1440 --height 900
node capture.mjs urls-mobile.txt mobile --width 390 --height 844 --label mobile
```

## Reference Site Structure (77 URLs)

Useful because Dr. Nahlah is also a prosthodontist practice — the IA maps closely.

- **Doctor / practice**: meet-the-doctor, what-is-a-prosthodontist, about-us, advanced-technology, in-house-lab
- **Implants hub**: implants, smile-in-a-day, one-day-implants, all-on-4, implant-supported-bridges, implant-supported-overdentures, single-tooth-implants, 3d-implant-placement, same-day-extraction-and-implant-placement
- **Treatments hub**: general-dentistry, cleaning-prevention, gum-disease, extractions, fillings, night-guards, emergency-care
- **Cosmetic**: cosmetic-dentistry, smile-makeover, teeth-whitening, invisalign, porcelain-veneers
- **Restorative**: restorative-dentistry, porcelain-crowns, same-day-crowns, ceramic-bridges, dentures, full-mouth-rehabilitation
- **TMJ / bite**: tmj-bite-care, tmj-tmd, bruxism, occlusal-analysis, occlusal-guards, worn-dentition
- **Patient**: your-first-visit, financial-information, patient-forms, appointment-request, refer-a-patient, cherry, proceed-finance
- **Proof**: testimonials, blog (4 posts)
- **Local SEO**: 6 city landing pages (lake-nona, the-villages, st-cloud, altamonte-springs, casselberry, ocoee) + 13 nested service pages under `/lake-nona-dentist/`

The **city-landing-page pattern with nested service pages** is the strongest
structural idea to borrow — Dr. Nahlah has two locations (McLean/Tysons and
Alexandria) and currently no location landing pages at all.

## Version Control
- Follows the version control rules in [SYSTEM_RULES.md - Section 4](../../../../../../SYSTEM_RULES.md).
- Screenshots are gitignored binary media synced to the VPS; manifests and URL lists are committed.
