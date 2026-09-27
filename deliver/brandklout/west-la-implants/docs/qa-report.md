# QA report — West LA Implants, pre-review content-fit pass

**2026-09-24.** Live at <https://west-la-implants-production.up.railway.app/>, published **seq 22**, then **seq 23** (strict image pass).
The reviewer-facing version (with the checklist Jessica works from) is the Claude Doc
**"West LA Implants — Pre-Review QA"**: <https://claude.ai/code/artifact/6613c321-fd82-4fb0-aae3-04222e1b3cbc>.
The process is step 5 of [`08-qa.md`](../../../../process/08-qa/08-qa.md).

## Result

| Check | Found | Fixed | Remaining |
| :--- | ---: | ---: | :--- |
| Runts (one short word alone on a heading/statement/caption's last line) | 565 | 547 | 18: 9 caption name lines (by design), 5 scroll-written statements at 7–10 lines, 4 others |
| Text under 14px | 393 | 393 | — |
| Lines over ~90 characters | 26 | 23 | 3 on What to Expect's aftercare tabs |
| Headings over 4–5 lines at 390 | 12 | 7 | 5: two page H1s, three journal titles |
| Uneven copy across one card row | 7 | 0 | Accepted: heights already match |
| Image CROP (subject out of frame) | 33 | 33 | — |
| Image MISMATCH (photo contradicts copy) | 19 | 18 | All-on-4 step 01 (robot beside "first visit") |
| Image REPEAT (same photo twice on a page) | 14 | 12 | Results: Leslie's story card repeats the gallery pair (shared component) |
| Image ALT wrong | 7 | 6 | tooth-extractions implant-crown-model alt, left consistent with dental-implants |
| Image QUALITY (soft / low-res) | 9 | 0 | Needs originals: before/after cases at 300×225, journal photos at 800px |
| Copy: "Los Angeles, FL" | 3 | 3 | — |

Gates after publish: `verify-live` 80 routes FAIL none · `css-parity` FAIL none · `verify-motion-live`
FAIL none · `check-local --base` 80/80 at 1440 and 390 FAIL none · `qa-fit --base` 33 findings, all
accepted above. Termly (resource-blocker + both consent code assets) still loads.

## Strict image pass (same day, seq 23)

The bar was raised to relevance 3 (the photo shows the specific subject of its copy) plus ≥1:1
resolution at 1440. Re-review of 370 placements: **167 failed** → 67 swapped to the practice's own
photos, 52 replaced by licensed Freepik stock (42 files), 3 re-cropped, 45 are before/after case
photos that need the client's originals. Verification of the result: 33 residual crops/alts/duplicates,
all fixed. Final audit: no visible photo under 1:1 except dark statement backgrounds and the
before/after cases. Details: [run](./runbook/2026-09-24-strict-image-pass.md).

## Artifacts

- `workflows/08-qa/.tmp/qa-fit.mjs`: the audit (copy fit + image contact sheets)
- `workflows/08-qa/.tmp/fit-baseline/`: baseline `copy-fit.json`, `image-context.json`, the five
  `review-*.json` model reviews and the merged `image-findings.json`
- `workflows/08-qa/.tmp/fit/`: the live re-run (`copy-fit.json`)
- Contact sheets and crops (PNG/JPG) stay local, gitignored

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
