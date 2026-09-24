# 2026-09-24 — The DNI pool was held by Termly on this site; released and proven

Asked: "The DNI number pool script is not swapping on the Stone Dental site."

## Found

- Live footer (site freeform code, since 2026-09-16) serves both GHL tags as
  `<script type="text/plain" data-categories="advertising" src=…number_pool.js>` and `…user_session.js`.
  Termly only runs them after a visitor accepts advertising. Anyone who ignores or declines the
  banner never gets a swap. This contradicts the client's 2026-09-22 instruction: pools run without consent.
- The 2026-09-16 standard ("tag every tracker, GHL included") put the hold there. The 2026-09-22
  instruction reached Stone Surgical Arts and Dr. Nahlah, but not this footer.
- **Once released, the pool swaps.** One `dni-proof.mjs --accept` visit (bk-dr-nahlah
  `22-instatic-api-sync/`): `assign-number` 201, `(817) 383-8361` → `(817) 510-5371` in 4 text spots
  and 7 `tel:` links. The display number is in the pool's swap list, so the Termly hold is the only blocker.

## Fixed (LIVE)

- At first neither Webflow MCP connection could reach this site: `webflow-brandklout`'s grant had
  shrunk to the two Arvada sites. The user re-authenticated it with the whole workspace ticked (74 sites).
- Footer freeform code: the two LeadConnector tags are now plain `<script src>`. The comment reads
  "NOT consent-held (client instruction 2026-09-22)". Backup of the previous footer:
  `workflows/08-qa/.tmp/footer-before-2026-09-24.html`.
- Published to `www.` + apex + webflow.io. The site had last been published 2026-09-23 22:42, after the
  consent scripts (Bridge 2.2.0, Preferences 1.3.0) were applied, so nothing else was pending from us.
- **Proof, no consent given** (`dni-proof.mjs --relay`, fresh visitor, banner unanswered):
  `(817) 383-8361` → `(817) 623-5358`, 4 text + 1 dashed + 7 `tel:` links.

## Changed

- `deliver/process/23-termly-ghl-consent/23-termly-ghl-consent.md` phase 2 step 2: GHL pool tags are
  now an explicit exception, never tagged.

## Gotchas

- This run claimed two real pool numbers ((817) 510-5371, (817) 623-5358).
- `get_site_freeform_code` 404 "The site cannot be found" = the site is not in the OAuth grant.
  Re-auth `webflow-brandklout` and tick every site: the grant is replaced wholesale.

## Version Control

Tracked. Follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
