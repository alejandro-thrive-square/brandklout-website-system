# 2026-10-09 — Home page feedback: no gap under the badge strip, two repeated photos swapped (PRODUCTION)

Client design feedback on `/`:
- "Let's remove the spacing below" the "Credentialed by" strip.
- Swap the wall photo, which repeated the pair beside it.
- Swap the "At the desk" sofa photo.

## Done (published 14:33Z, seq 91)
- **Badge strip:** the reviews chapter (`ch-said`, `#proof`) kept its 155px bottom padding under the
  dark strip, which showed as a cream band before the dark Invitation. A new rule closes it:
  `.ch:not(.ch-invitation):has(> .pr-badges:last-child) { padding-bottom: 0; }`. It went into
  `home/assets/site.css`, and production's `src/styles/mason-park.css` now equals that file byte for
  byte. Measured at 1736 and 390: the strip's bottom equals the chapter's bottom, which equals the top
  of the next chapter. The ad pages, whose proof chapter also ends on the strip, get the same.
- **Photos** on the home row:
  - wall tile `eXUeFT`: `team-pair-window` -> `n166-front-desk-call-hero`;
  - "At the desk" `Z2J6t8`: `sofa-forms-2` -> `n223-front-desk-call`.
  - Neither was already on the page. Neither shows Dr. Nguyen (see the Yelp run).
- Script: `.tmp/yelp/home-feedback.mjs` (one atomic save of shell + home row, then publish).

## Next
- **Staging** does not have the badge rule. Its CSS is in the registry under the Client-First names,
  so the rule there is `chapter_component` / `section_said` / `proof_badges`. Add it when staging is
  next touched; another session is mid-way through Phase 2 there.
- The home page still repeats some photos across chapters: `hygienist-working-3` twice,
  `scanner-screen-3` twice, `team-pair-laughing` twice, and the sofa couple three times.

## Version Control

This run file follows the runbook rules in [SYSTEM_RULES.md §5](../../../../SYSTEM_RULES.md).
