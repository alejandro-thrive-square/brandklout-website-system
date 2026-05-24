# Compliance Notes

Applies to the entire website: index plus all sub-pages, including Invest, Scale, Develop, and Sell.

## Global Requirements

- Keep all licensee and brokerage compliance information in the footer only.
- Do not place the DRE number, broker name, REAL logo, or any compliance text in the header, navigation, hero eyebrow strip, or anywhere above the fold.
- If the DRE number appears anywhere outside the footer, remove it.

## Footer Compliance Column

Add `REAL Broker, LLC` to the footer compliance column.

Replace the current footer line:

```text
(c) 2026 Giovanni Serrano Real Estate
```

With:

```text
Giovanni Serrano - DRE #02282434
REAL Broker, LLC - DRE #: 02022092
(c) 2026 Giovanni Serrano
```

## REAL Broker Logo

- REAL Broker logos received from Gio (EPS format in `WebFinalChanges/`).
- Convert EPS files to SVG before placing in `final-design/`.
- Place the REAL logo in the footer alongside the compliance text.
- Follow REAL's brand guidelines for logo usage and sizing.

## Open Compliance Items

- [DONE] REAL Broker logos received from Gio — EPS → SVG conversion needed.
- Get REAL Broker, LLC's corporate DRE license number from REAL's compliance team before publish.
- Confirm whether REAL requires its legal address to be shown in the footer.

## Legibility

- Compliance text must render at body-copy size or close to it.
- Do not shrink the compliance text into faint micro-text.

## Implementation

- Build the footer as a single shared component.
- The shared footer should propagate this change automatically to every page: index, Invest, Scale, Develop, Sell, and any future sub-pages.
