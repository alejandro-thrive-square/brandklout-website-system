# 2026-09-22 — Termly cookie consent rolled out across all 29 Brandklout sites

Repo-level: this touched two process modules and 28 client sites on two platforms, so it belongs
here rather than in one client's runbook.

## Done

**Credentials first.** 29 Termly per-website API keys were pasted into the *generated* repo `.env`,
which `env-sync` rewrites on every `npm install`. Moved them into `~/.webzite/.env` `[vars]` as
`TERMLY_<CLIENT>` (the section whose whole purpose is values referenced but never written to a
worktree `.env`), and pointed each of the 13 existing client sections at its own key with
`TERMLY_API_KEY=${TERMLY_<CLIENT>}`. The pre-existing lone `TERMLY_API_KEY` under
`[stone-dental-implant-center]` turned out to be Stone Dental's key, byte-identical, so it became a
reference with no change in value. Backup: `~/.webzite/.env.bak-2026-09-22-termly-accounts`.
Verified with `env-sync --check` in `bk-dr-nahlah`: `TERMLY_API_KEY` resolves.

**The accounts are readable without the API.** The public resource-blocker payload
(`app.termly.io/resource-blocker/<uuid>`) carries the whole `__TERMLY_WEBSITE_CONFIG__`: website
name, url, consent count, quota flag and the documents list. That is how all 29 domains and document
UUIDs were read without a single dashboard login — worth remembering, because the free-account API
still automates nothing. Result: every account has exactly one auto-created **Cookie Policy** and
**no Privacy Policy document**. 28 of 29 sites already have their own hand-written privacy policy
page, so those stay; only Mason Park Kids has no legal pages at all.

**Tracked registry:** `deliver/process/23-termly-ghl-consent/kit/termly-websites.json` — 29 rows of
client, account email, public website UUID, live domain, platform, Webflow site id, rollout state.

**New: `kit/consent-preferences.js`** (1.2.0, 1,865 bytes minified). Inserts the Cookie Preferences
control at runtime by cloning the footer's Privacy Policy/Terms link, so it inherits each site's own
typography and separators. Reason it is a script and not footer HTML is in the directive.

**Rolled out.** 7 Instatic sites via `consent-kit.mjs instatic apply|termly|publish`; 21 Webflow
sites via head freeform code (Termly first, above GTM) plus a registered `BrandkloutConsentPreferences`
script. Trackers in head code tagged `type="text/plain" data-categories="…"`.

**Live and fully gated: 16 sites** (banner + control + modal opens on click + nothing fires before a
choice). 11 Webflow sites are applied but deliberately unpublished — they had Designer work pending.
Full table in the directive.

## Gotchas

- **A Webflow registered *footer* script can be silently swallowed.** It is emitted last, so any
  malformed markup earlier on the page eats it — South Bay had an unclosed `<style>` in page custom
  code and the browser parsed our `<script>` as CSS. The served HTML looked perfect; only the parsed
  DOM showed it. **Register in the `header`.** All 21 sites were moved and republished.
- **Check `lastUpdated` vs `lastPublished` BEFORE writing freeform code** — the write itself moves
  `lastUpdated`, so the "is anything else pending?" signal is gone afterwards. Learned by destroying
  it on the first site (Grand Mission, which happened to be clean).
- **A plugin setting's `description` is capped at 500 characters.** Over it, `inspect-package`
  answers `400 Invalid plugin manifest: Expected union value`, naming neither field nor limit.
- **Termly honours a tagged script inserted after it has scanned** — verified live. That is what
  lets a site's own tag loader gate itself (IFA).
- **Cloudflare serves a stale page for minutes after a Webflow publish**, and `?cb=` does not help
  where the cache level ignores query strings. `cf-cache: HIT` + non-zero `age` on a failing check
  means the edge, not the deployment.
- **Two "Instatic" sites are not what the public gets.** `masonparkpediatricdental.com` and
  `westlaimplants.com` still answer from WordPress; the Instatic builds are unlaunched on Railway.

## Next

- Publish the 11 staged Webflow sites when their Designer work is ready — nothing more to do on them.
- **Omnia and Legacy**: the GHL call-tracking pair still fires before consent because their **GTM
  containers** fire it with no consent check. The page cannot tag it; fix inside GTM.
- **Oceanic**: has a Termly account but `oceanicdental.com` is not in the Webflow workspace this
  account can reach. Needs the right workspace or a hand-paste.
- **Mason Park Kids**: no privacy policy, terms or cookie policy page at all.
- **Kissimmee and Atwood**: a dead template link "Cookies Settings" → `#` sits in the footer beside
  the working control. Remove it in the Designer.
- **Haven**: a floating review badge overlaps the footer legal row.
- The GHL consent bridge is still missing on 15 Webflow sites (Phase 1). Consent is collected and
  enforced there; it just is not written onto the GHL lead.

## Version Control
This runbook follows the root-level rules in [SYSTEM_RULES.md](../../SYSTEM_RULES.md).
