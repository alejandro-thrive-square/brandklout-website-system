# Workflow: 23 - Termly Consent + GoHighLevel Bridge

## Client-Facing Overview
Every client site shows a Termly cookie banner. Each patient's choice is saved on the lead in GoHighLevel
(GHL): analytics, advertising, sale/share opt-out, GPC, timestamp, receipt ID and policy version. The site
keeps working whether or not the patient answers the banner, and tracking waits for consent.

> [!IMPORTANT]
> **Integrity Rule**: any change to the bridge, the kit or the rollout state must be recorded here in the
> same commit, and mirrored in [PROCESS_INDEX.md](../PROCESS_INDEX.md). Bump the version inside
> `kit/ghl-consent-bridge.js` whenever its behaviour changes, then run `node consent-kit.mjs minify`.

## What goes on every site

| # | Piece | Where | Phase |
| :--- | :--- | :--- | :--- |
| 1 | **GHL consent bridge** ([`kit/ghl-consent-bridge.js`](./kit/ghl-consent-bridge.js)) | Webflow: registered site script `BrandkloutConsentBridge`, footer. Instatic: script asset `src/scripts/brandklout-consent-bridge.js`, all pages, body end | **1: agent**, no Termly needed |
| 2 | **Termly script**, `?autoBlock=off` ([`kit/termly-head.html`](./kit/termly-head.html)) | Site-wide head, **above GTM** | **2**: needs the client's Termly account |
| 3 | **Trackers tagged** `type="text/plain" data-categories="…"` | Wherever they sit | **2** |
| 4 | **Consent Preferences link** ([`kit/consent-preferences-link.html`](./kit/consent-preferences-link.html)) | Every footer, landing pages included | **2** (the link does nothing until Termly loads) |

**Phase 1 is safe without Termly.** With no Termly record, the bridge sends the values a Decline click
would send (`denied`, opt-out `true`). **Phase 2 must wait for Termly.** A tracker tagged `text/plain`
never runs until Termly releases it, so tagging before Termly exists switches call tracking off.

### Why `autoBlock=off` and no allowlist
`autoBlock=on` held Webflow's own JavaScript, every video and map, and the GHL forms (behind an
"Enable" box) until the visitor clicked Accept. Fresh visitors saw a broken page. An allowlist fixed
that, but it would need upkeep on every site, so the standard (decided 2026-09-16) is: **auto-block off,
tag trackers by hand**. GTM tags are held by Google Consent Mode instead; Termly sets its defaults to
`denied` even with auto-block off, which is why Termly goes above GTM.

**The cost:** a tracker added later outside GTM and left untagged runs before consent. Adding a tracker
means tagging it.

### What the bridge sends
GHL forms are cross-origin iframes, so no site script can touch their fields. GHL does prefill any field
whose **query key** is in the iframe URL (dropdowns, checkboxes and text alike). The bridge rewrites
every `…/widget/(form|survey|booking)/…` iframe URL and reloads those iframes when consent changes.

| Field | Value |
| :--- | :--- |
| `privacy_analytics_consent` | `granted` if Termly `analytics` was accepted, else `denied` |
| `privacy_advertising_consent`, `privacy_ad_user_data_consent`, `privacy_ad_personalization_consent` | `granted` only if `advertising` was accepted with no GPC signal and no Do Not Sell request, else `denied` |
| `privacy_sale_share_opt_out` | `true` unless advertising was accepted with no GPC signal and no Do Not Sell request |
| `privacy_gpc_detected` | `navigator.globalPrivacyControl` (or Termly's saved `gpc`) |
| `privacy_consent_timestamp_utc`, `privacy_cmp_receipt_id`, `privacy_policy_version` | From Termly's `localStorage` record (`TERMLY_API_CACHE` → `TERMLY_COOKIE_CONSENT`); empty before a real choice, so the CRM can tell "declined by default" from "clicked Decline" |
| `privacy_source_url` | Page origin + path |
| `marketing_disclosure_version` | `2026-09-16` by default. A site can override it by setting `window.BrandkloutConsentConfig = { marketingDisclosureVersion: "…" }` before the bridge runs |

`window.BrandkloutConsentBridge` holds the running version; `check` reads it.

### GHL side (once per location, done by the Brandklout team)
1. Create these custom fields in the folder `Consent`:
   - The four `*_consent` fields: single dropdown with the options `granted` / `denied` / `unknown`.
   - `privacy_sale_share_opt_out` and `privacy_gpc_detected`: checkbox with the options `true` / `false`.
   - The other five fields: single line.
2. Add all eleven fields to every embedded form. Keep each **Query Key** equal to the field key, and hide
   the fields inside the form. Hidden fields still prefill.

## The kit

```bash
cd deliver/process/23-termly-ghl-consent
node consent-kit.mjs minify                        # rebuild kit/ghl-consent-bridge.min.js (<= 2000 chars)
node consent-kit.mjs instatic status               # read-only, every Instatic site
node consent-kit.mjs instatic apply  [--only a,b] --apply
node consent-kit.mjs instatic publish --only a,b  --apply
node consent-kit.mjs check <url>[,<url>] [--termly-proxy]
node consent-kit.mjs snippet [--disclosure DATE]  # paste-able block for a platform with no API
```

Run it with output redirected to a file, never piped (Node on Windows dies on a libuv assertion when
stdout is a pipe). Instatic sites are every `~/.webzite/.env` section with an `INSTATIC_BASE_URL`.

### Phase 1 — Webflow (MCP `webflow-brandklout`, site ID from the registry)
1. `get_registered_scripts`. If `brandkloutconsentbridge` is missing, `register_inline_script` with
   `display_name: "BrandkloutConsentBridge"`, `version` = the bridge version, and `source_code` = the
   exact contents of `kit/ghl-consent-bridge.min.js`. A new version is registered the same way with the
   new version string.
2. **Verify the hosted copy:** `curl` the returned `hostedLocation` and `cmp` it against the min file.
   It must be identical; the file was typed through a tool call.
3. `get_site_scripts`. A 404 means no site scripts are applied, and then `add_site_script` fails with
   the same 404, so use `set_site_scripts` with just `[{id, location: "footer", version}]`.
   If scripts are already applied, `add_site_script` keeps them.
4. **Publish only when nothing else is pending.** Check that `get_site` `lastUpdated` is within seconds
   of `lastPublished`. Applying a registered script does not change `lastUpdated`, but a freeform code
   edit does. Otherwise leave it: the script ships with the team's next publish.
5. Remove any older pasted copy of the bridge from the footer freeform code.
6. `node consent-kit.mjs check <a page with a GHL form>` should report `bridge: "2.2.0"` and form values.

### Phase 1 — Instatic
`instatic apply --apply` writes the asset (draft) and reads it back. A SiteFile without an `id` is
silently dropped. `instatic publish` refuses a site unless the draft matched live before our first
write **and** nothing has been saved since (tracked in `.tmp/clean-before-apply-<host>.json`). The
script is served same-origin, so `script-src 'self'` is enough.

### Phase 2 — once the Termly script arrives (per site)
1. **Head:** add the Termly line with `?autoBlock=off` as the first thing in the head, above GTM. On
   Instatic it goes in the `brandklout.embed-origins` `siteScripts`, together with
   `connectOrigins: https://us.consent.api.termly.io` and `frameOrigins: https://app.termly.io`
   (see `18-instatic-embeds`). If Termly is already there with `autoBlock=on`, switch it to `off`.
2. **Tag every tracker outside GTM.** Change `<script src=…>` to
   `<script type="text/plain" data-categories="advertising|analytics" src=…>`, and inline pixels to
   `<script type="text/plain" data-categories="…">`. Known so far: GHL `number_pool.js` and
   `user_session.js` (advertising), Meta Pixel (advertising), the OpenAI `oaiq` pixel (advertising),
   Ahrefs analytics (analytics).
3. **Add the Consent Preferences link** to every footer, landing pages included.
4. **Test** in a private window, or with `check --termly-proxy`. Before answering the banner:
   `autoblocked` 0, no tracking requests, forms `denied`. After Decline: a receipt ID appears. After
   Accept: `granted`, and tracking loads. The Preferences link opens Termly.

## Site registry and rollout state (2026-09-17)

| Site | Platform | ID / base | Bridge | Live? | Termly | Trackers outside GTM (phase 2) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Stone Dental Implant Center | Webflow | `6a07d5aac093f0e4521d29bc` | 2.2.0 registered; old v2.0 paste removed from footer | **v2.0 live**; v2.2 ships on next publish (left unpublished: pending state unclear) | **done**, off, above GTM | done (GHL tagged) |
| Grand Mission Dentistry | Webflow | `698111847e9608eb30ee21c6` | 2.2.0 | **live** (published 2026-09-17), checked on /contact and /free-e-book | — | GHL (head), Ahrefs; GTM noscript only, no GTM loader in head |
| Arvada Dental Center | Webflow | `693c51e685b19f0d0c149cab` | 2.2.0 | next publish (Designer changes pending since 2026-09-15) | — | GHL (head **and** footer, loaded twice), OpenAI pixel |
| Legacy Dental Pasadena | Webflow | `68e12d861f12c7f04a762a8e` | 2.2.0 | next publish (pending since 2026-09-10; also serves caldentalpasadena.com) | — | GHL, Meta Pixel, Ahrefs, Sally AI widget |
| Livewell Dental | Webflow | `69d03fdbe999e9907724a69d` | 2.2.0 | next publish (pending since 2026-09-14) | — | GHL, Ahrefs |
| Marvel Dental | Webflow | `69aedbc6b0c7e78051fd6a2c` | 2.2.0 | next publish (pending since 2026-09-07; live-domain publish is the user's call) | — | GHL, Ahrefs (loaded twice) |
| Institute for Advanced Dentistry | Instatic | `institute-for-advanced-dentistry` | 2.2.0 | **live**, form checked | — | — |
| Mason Park | Instatic | `mason-park` | 2.2.0 | **live** | present, **autoBlock=on**: switch to off | check |
| Mason Park Kids | Instatic | `mason-park-kids` | 2.2.0 | **live** | — | — |
| Stone Surgical Arts | Instatic | `stone-surgical-arts` | 2.2.0 | **live** | — | — (frame-src 'none': no GHL form can render yet) |
| Stone Med Spa | Instatic | `stone-med-spa` | 2.2.0 | **live** | — | — (frame-src 'none') |
| West LA Implants | Instatic | `west-la-implants` | 2.2.0 | **live** | — | — (frame-src 'none') |
| Dr. Nahlah | Instatic | `dr-nahlah` | 2.2.0 | draft only, ships with the owner's next publish (the draft was already dirty) | — | — |
| Brandklout website | Instatic | `brandklout-website` | not applied (agency site, dirty draft) | — | — | — |

All Instatic sites above were checked live on 2.2.0 on 2026-09-17 (IFA's form carried `denied`).

## Gotchas
- **Termly accounts are created by hand.** The key the team can issue is the Consent API key: raw
  `Authorization: <key>` against `app.termly.io/api/v1/cookie_whitelist?uuid=`, read-only. Creating
  websites needs the partner API (`api.termly.io/v1`, HMAC-signed), whose keys Termly issues through
  termly.io/agencies. With those keys this module could create the Termly websites too.
- **NordVPN Threat Protection** returns a headerless 204 for `app.termly.io` in Chrome. The symptom is
  that the banner's Cookie Policy link opens nothing. Use `check --termly-proxy`.
- **The registered-script cap is 2,000 characters.** The v2.2 minified bridge is 1,965. Anything that
  grows it must be paid for elsewhere, or split into two registered scripts.
- **`add_site_script` 404s on a site with no applied scripts.** Use `set_site_scripts` there, after
  `get_site_scripts` has confirmed the 404.
- **`git sparse-checkout add` re-applies the sparse patterns** and deletes tracked files outside them
  from the working tree. On 2026-09-17 that removed the old `deliver/brandklout/snippets/` mid-move.
  Recover them with `git show HEAD:<path>`.
- **Changing consent reloads the form**, which clears any fields the visitor already filled in.
- **Instatic `frame-src 'none'`** (Stone Surgical Arts, Stone Med Spa, West LA Implants) blocks GHL
  iframes outright. The bridge is ready for them, but a form needs the Embed block and its frame
  origin first.

## Version Control
This directive follows the root-level version control rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md).
`.tmp/` holds probe output and the per-host publish guards; it is git-ignored except its `.gitignore`.
