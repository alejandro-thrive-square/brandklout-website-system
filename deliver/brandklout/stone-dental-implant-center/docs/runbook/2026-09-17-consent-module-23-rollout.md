# 2026-09-17 — Consent standard promoted to process module 23; GHL bridge rolled out

## Done
- The kit moved from `deliver/brandklout/snippets/` into `deliver/process/23-termly-ghl-consent/`, which
  holds the directive, `consent-kit.mjs`, `kit/` and the **site registry with rollout state**. Read the
  registry there, not here.
- Bridge v2.2.0: same behaviour, compacted to 1,965 chars minified so it fits Webflow's registered-script
  cap. Adds `window.BrandkloutConsentBridge` (version) and `window.BrandkloutConsentConfig` (per-site
  overrides).
- **Webflow (6 sites):** registered site script `BrandkloutConsentBridge` 2.2.0 in the footer; each hosted
  copy was checked with `cmp` against the min file. Published only Grand Mission, which was verified live
  on /contact and /free-e-book (forms carry `denied`). Arvada, Legacy, Livewell and Marvel have pending
  Designer changes, so the bridge ships with their next publish.
- **Stone Dental:** removed the pasted v2.0 bridge from the footer freeform code and applied the registered
  2.2.0 script. **Not published.** Someone published at 21:55 on 2026-09-16, and the footer edit then
  bumped `lastUpdated`, so it is unclear whether other Designer edits are pending. v2.0 is still live and
  still works; v2.2 replaces it on the next publish.
- **Instatic:** 2.2.0 is live and checked on IFA, Mason Park, Mason Park Kids, Stone Surgical Arts, Stone
  Med Spa and West LA Implants. Dr. Nahlah has it as a draft only (its draft was already dirty). The
  Brandklout website was skipped.

## Next
- Phase 2 per site when the user sends the Termly scripts (see the module directive).
- Stone Dental: the next publish ships v2.2 (check `window.BrandkloutConsentBridge === "2.2.0"`).
- The 4 ad landing pages still have no Consent Preferences link.

## Gotchas
- `git sparse-checkout add` removed the tracked `snippets/` folder from the working tree mid-move.
  Recovered with `git show HEAD:`.
- `add_site_script` 404s when a site has no applied scripts; use `set_site_scripts` there.
