# Arvada Dental Center — standing runbook

The **standing** state of this project: what is true now, what is next, and the
traps. Dated run history is one file per run under
[`runbook/`](./runbook/INDEX.md) — read the index, then only the runs you need.
Do not read them all.

**Sites (since 2026-09-23 — the domains moved):**
- www.arvadadentalcenter.com → Webflow `693c51e685b19f0d0c149cab` "Arvada Dental Center" · display number (303) 421-7611
- www.arvadadentalimplants.com → Webflow `69f2fe636ca87b3f22fa54c1` "Arvada Implants Center" · display number (720) 719-9579

## Call tracking waits for consent — 2026-09-23

User instruction 2026-09-23 **replaces** the 2026-09-22 "pools run without consent" decision for both
Arvada sites: the GHL pairs and (Implants) Practice By Numbers are tagged `advertising`. Both sites now run
the same Termly website. Applied, **not published** (Designer work pending). Next: publish, verify release
after Accept, and make each GHL pool swap the new display number. Details and open flags:
[`runbook/2026-09-23-dni-behind-consent-and-seo-numbers.md`](./runbook/2026-09-23-dni-behind-consent-and-seo-numbers.md).

> This file was started by the Termly consent run and so far covers only that.
> Add the rest of this project's standing state as you learn it.
## Cookie consent (Termly) — 2026-09-22

**Applied but not published** — it ships with this site's next publish. Tagged analytics and ad pixels wait for consent; the GoHighLevel pool was exempt until 2026-09-23 (see above). Account `arvadadental@brandklout.com`, website UUID
`77ba2aba-a1b9-4abf-b939-15961125d597`, `autoBlock=off`. The Cookie Preferences control is inserted at runtime by
`BrandkloutConsentPreferences` / `brandklout-consent-preferences.js`, which clones the footer's
Privacy Policy link so it matches this site's own type.

`TERMLY_API_KEY` is in this worktree's generated `.env`, from `~/.webzite/.env` `[vars]`
`TERMLY_ARVADA`. Never hand-edit `.env`; edit the master and run `node scripts/env-sync.mjs`.
The key is near-useless (one read-only endpoint) — the public **website UUID** is what tooling needs.

~~Do not re-add a consent hold to a GoHighLevel number pool~~ — superseded 2026-09-23: the pools on both
Arvada sites now wait for advertising consent, by user instruction.

Full history: [`runbook/2026-09-22-termly-cookie-consent.md`](./runbook/2026-09-22-termly-cookie-consent.md). Cross-site detail:
[`deliver/process/23-termly-ghl-consent`](../../../../process/23-termly-ghl-consent/23-termly-ghl-consent.md).

## Version Control
Tracked. Follows the root-level version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
