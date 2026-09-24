# 2026-09-24 — The DNI pool is held by Termly on this site

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

## Not done — needs the fix applied

Neither Webflow MCP connection can reach this site (`webflow-brandklout` sees only the two Arvada
sites; `webflow` only Mused Design; both 404 on `6a07d5aac093f0e4521d29bc`). The fix:

1. Site Settings → Custom Code → Footer: on the two LeadConnector `<script>` lines, delete
   `type="text/plain" data-categories="advertising"` and change the comment to "not consent-held
   (client instruction 2026-09-22)".
2. Publish both domains. **This also ships the pending changes**: BrandkloutConsentBridge 2.2.0 and
   the Cookie Preferences control, applied since 2026-09-17/22 and never published.
3. Check: `curl` the home page and confirm no `text/plain` on `number_pool`. Then run one fresh
   visit with no consent (`dni-proof.mjs --relay`); `tel:` links should change.

## Changed

- `deliver/process/23-termly-ghl-consent/23-termly-ghl-consent.md` phase 2 step 2: GHL pool tags are
  now an explicit exception, never tagged.

## Gotchas

- This run claimed one real pool number ((817) 510-5371).
- To reach the site again, re-authorise the Webflow MCP OAuth with Stone Dental ticked.
  The grant is per site, and the current grants do not include it.

## Version Control

Tracked. Follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
