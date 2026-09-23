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
| 1 | **GHL consent bridge** ([`kit/ghl-consent-bridge.js`](./kit/ghl-consent-bridge.js)) | Webflow: registered site script `BrandkloutConsentBridge`, **header** (standard since 2026-09-23; sites still on footer move at their next publish). Instatic: script asset `src/scripts/brandklout-consent-bridge.js`, all pages, body end | **1: agent**, no Termly needed |
| 2 | **Termly script**, `?autoBlock=off` ([`kit/termly-head.html`](./kit/termly-head.html)) | Site-wide head, **above GTM** | **2**: needs the client's Termly account |
| 3 | **Trackers tagged** `type="text/plain" data-categories="…"` | Wherever they sit | **2** |
| 4 | **Cookie Preferences control** ([`kit/consent-preferences.js`](./kit/consent-preferences.js)) | Webflow: registered site script `BrandkloutConsentPreferences`, **header**. Instatic: script asset `src/scripts/brandklout-consent-preferences.js`, all pages, body end | **2** (the control does nothing until Termly loads) |

### Why the preferences control is a script, not HTML in the footer
[`kit/consent-preferences-link.html`](./kit/consent-preferences-link.html) is still the right answer
where a human is editing one footer. It does not scale to 29 sites:

- **Instatic inlines the footer into every page** — 57 of them on `dr-nahlah`. A page write through
  `PUT /site-document` drops `seoTitle`/`seoDescription`, and restoring those needs a
  `PATCH /data/rows`, which flattens every `a/b` slug's route (see `instatic-api-sync`).
- **Webflow's footer is a Designer layout.** The Data API writes site-wide freeform head/footer
  *code*; it cannot put a link inside the footer nav. Only the Designer can, with a human present.

So [`kit/consent-preferences.js`](./kit/consent-preferences.js) inserts it at runtime. It finds the
footer's Privacy Policy and Terms links, works out the repeating unit they share (the `<a>`, or the
`<li>`/`<span>` each sits in), **clones it**, relabels the copy and binds Termly's modal. Cloning is
what makes one file work on 29 unrelated designs: the control inherits that site's exact typography,
colour, spacing and hover without a line of CSS from us, and any separator between the two legal
items (a `|`, a bullet) is cloned with it. A link that does nothing without JavaScript loses nothing
by being created with JavaScript.

**Phase 1 is safe without Termly.** With no Termly record, the bridge sends the values a Decline click
would send (`denied`, opt-out `true`). **Phase 2 must wait for Termly.** A tracker tagged `text/plain`
never runs until Termly releases it, so tagging before Termly exists switches call tracking off.

### The banner is part of the page, so the page's CSS reaches it
Termly renders its banner into `#termly-code-snippet-support` in the document, **not** an iframe.
Every global rule on the site applies to it. Livewell shipped with

```css
img { width: 100%; max-width: 100%; height: 100%; max-height: 100%; display: inline-block; }
```

which sized Termly's own 76x20 logo to **1348x355** and turned the banner into a 511px slab over the
hero. Nothing was wrong with the consent setup; the site's CSS was leaking into a third-party widget.

`kit/consent-preferences.js` 1.3.0 injects a guard at parse time, before the banner exists:

```css
#termly-code-snippet-support :is(img,svg){width:auto;height:auto}
```

Only `width` and `height`, because those are what a site sets globally and Termly sets neither — it
lets its logo size intrinsically. The id selector beats a bare `img` rule on specificity, so no
`!important` is needed and Termly's own styling still wins everywhere it does set something.
Confirmed a no-op on a healthy site (dr-nahlah: 76x20 before and after).

### Webflow does not have Instatic's embed problem
On Instatic a cookie banner appears to break Vimeo, YouTube, GHL forms and DNI numbers. That is the
**CSP**, not the banner: Instatic publishes a `Content-Security-Policy` meta tag (`script-src 'self'`,
often `frame-src 'none'`), and third-party origins have to be granted through the `embed-origins`
plugin. **Webflow emits no CSP at all** — verified on all 10 live sites, 2026-09-22 — so that whole
class of failure does not exist there.

With `autoBlock=off` Termly itself blocks nothing: measured before any consent choice, Vimeo players
(584x329), GHL form iframes (~575-690px wide) and Google Maps all render, and
`[data-autoblocked]` is 0 on every site. The only things that wait are the ones tagged by hand.

### Call tracking is exempt, by client decision
**GoHighLevel number pools are NEVER consent-tagged.** The client's instruction, 2026-09-22: *"The
pools should be running even if the cookie consent is not accepted."* It was made knowingly and it
applies to every site. Tagging `number_pool.js` as `advertising` was tried the same day and reverted
on dr-nahlah, grand-mission, arvada, livewell and IFA.

Analytics and ad pixels (ahrefs, Meta, the OpenAI pixel) **do** stay tagged. Termly still governs
those and whatever is tagged inside GTM — just not call tracking.

**A pool that has to reach a second host needs `connectOrigins`.** The pool loads from
`backend.leadconnectorhq.com` but asks for its number at `services.leadconnectorhq.com`, and the
session helper reports to `services.msgsndr.com`. On Instatic, a page with **no Embed block** keeps
the strict CSP, whose `connect-src` allows neither, so the swap is silently refused there and
nowhere else. Every Brandklout site carrying a pool has this trap; dr-nahlah hit it on 79 of 97
URLs. Fixed on dr-nahlah and IFA. Webflow emits no CSP, so it cannot happen there.

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
cd deliver/process/tools/termly-ghl-consent
node consent-kit.mjs minify                        # rebuild BOTH .min.js files (each <= 2000 chars)
node consent-kit.mjs instatic status               # read-only, every Instatic site
node consent-kit.mjs instatic apply  [--only a,b] --apply   # both script assets, one atomic save
node consent-kit.mjs instatic termly  [--only a,b] --apply  # phase 2: Termly head line + origins
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
   the same 404, so use `set_site_scripts` with just `[{id, location: "header", version}]`. Every Brandklout consent script is registered in the **header** (owner decision 2026-09-23): a footer script is emitted last and malformed page markup swallows it (see Gotchas).
   If scripts are already applied, `add_site_script` keeps them.
4. **Publish only when nothing else is pending.** Check that `get_site` `lastUpdated` is within seconds
   of `lastPublished`. Applying a registered script does not change `lastUpdated`, but a freeform code
   edit does. Otherwise leave it: the script ships with the team's next publish.
5. Remove any older pasted copy of the bridge from the footer freeform code, and move a bridge still applied in the `footer` location to `header`.
6. `node consent-kit.mjs check <a page with a GHL form>` should report `bridge: "2.2.0"` and form values.

### Phase 1 — Instatic
`instatic apply --apply` writes the asset (draft) and reads it back. A SiteFile without an `id` is
silently dropped. `instatic publish` refuses a site unless the draft matched live before our first
write **and** nothing has been saved since (tracked in `.tmp/clean-before-apply-<host>.json`). The
script is served same-origin, so `script-src 'self'` is enough.

`instatic termly` reads the site's Termly website UUID from
[`kit/termly-websites.json`](./kit/termly-websites.json) — the tracked registry of all 29 accounts:
client, account email, **public** website UUID, live domain, platform, Webflow site id. The UUID is
not a secret (it is in every page's source). The per-website API keys are in `~/.webzite/.env`
`[vars]` as `TERMLY_<CLIENT>`, referenced as `TERMLY_API_KEY` from each client section.

### Phase 2 — once the Termly script arrives (per site)
1. **Head:** add the Termly line with `?autoBlock=off` as the first thing in the head, above GTM. On
   Instatic it goes in the `brandklout.embed-origins` `siteScripts`, together with
   `connectOrigins: https://us.consent.api.termly.io` and `frameOrigins: https://app.termly.io`
   (see `instatic-embeds`). If Termly is already there with `autoBlock=on`, switch it to `off`.
2. **Tag every tracker outside GTM.** Change `<script src=…>` to
   `<script type="text/plain" data-categories="advertising|analytics" src=…>`, and inline pixels to
   `<script type="text/plain" data-categories="…">`. Known so far: GHL `number_pool.js` and
   `user_session.js` (advertising), Meta Pixel (advertising), the OpenAI `oaiq` pixel (advertising),
   Ahrefs analytics (analytics).
3. **Add the Consent Preferences link** to every footer, landing pages included.
4. **Test** in a private window, or with `check --termly-proxy`. Before answering the banner:
   `autoblocked` 0, no tracking requests, forms `denied`. After Decline: a receipt ID appears. After
   Accept: `granted`, and tracking loads. The Preferences link opens Termly.

## Site registry and rollout state (2026-09-22)

29 Termly accounts were created by hand on 2026-09-22, one free account per client website. Every
account, UUID, domain and site id is in [`kit/termly-websites.json`](./kit/termly-websites.json);
this table is the rollout state on top of it.

**Consent is LIVE and gated on 15 sites** (Grand Mission is live but carries the release defect below). Gated means: Termly present with `autoBlock=off`, the
banner renders, the Cookie Preferences control is in the footer, clicking it opens Termly's
preference modal, and no tracker fires before a choice is made.

| Site | Platform | Termly | Control | Live? | Trackers before consent |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Dr. Nahlah | Instatic | off | yes | **live, gated** | none (GHL pair tagged via plugin 1.7.0) |
| Mason Park | Instatic | off (was `on`) | yes | **live, gated** | none |
| Stone Surgical Arts | Instatic | off | yes | **live, gated** | none |
| Institute for Advanced Dentistry | Instatic | off | yes | **live, gated** | none (GHL pair tagged in `site-tags.js` 1.1.0) |
| Westlake Medical Spa | Instatic | off | yes | **live, gated** | none |
| Grand Mission | Webflow | off | yes | **live**; call tracking fine, **ahrefs tag never releases** | pool un-gated by design; ahrefs held forever (defect) |
| Livewell | Webflow | off | yes | **live, gated** | none (replaced the Silktide trial block) |
| Omnia | Webflow | off | yes | **live** | **GHL pair, fired by GTM** |
| Legacy Dental | Webflow | off | yes | **live** | **GHL pair, fired by GTM** |
| South Bay Dental Loft | Webflow | off | yes | **live, gated** | none |
| Hackensack | Webflow | off | yes | **live, gated** | none |
| Haven | Webflow | off | yes | **live, gated** | none (a review badge overlaps the footer row) |
| AVA | Webflow | off | yes | **live, gated** | none |
| Organ Mountain | Webflow | off | yes | **live, gated** | none |
| Azusa | Webflow | off | yes | **live, gated** | none |
| Mason Park Kids | Instatic | off | yes | applied + published to the **unlaunched** build | none |
| West LA Implants | Instatic | off | yes | applied + published to the **unlaunched** build | none |
| Arvada | Webflow | off | yes | **applied, not published** | tagged, unverified until publish |
| Stone Dental Implant Center | Webflow | off | yes | **applied, not published** | already tagged |
| Marvel Dental | Webflow | off | yes | **applied, not published** | tagged, unverified until publish |
| Ortega | Webflow | off | yes | **applied, not published** | tagged, unverified until publish |
| Dentiq | Webflow | off | yes | **applied, not published** | — |
| Ason / KISSIME | Webflow | off | yes | **applied, not published** | tagged, unverified until publish |
| Markham | Webflow | off | yes | **applied, not published** | — |
| Elite | Webflow | off | yes | **applied, not published** | — |
| Restore | Webflow | off | yes | **applied, not published** | — |
| Makris | Webflow | off | yes | **applied, not published** | tagged, unverified until publish |
| Atwood | Webflow | off | yes | **applied, not published** | — |
| Oceanic | Webflow | — | — | **blocked** | account exists; site is not in our Webflow workspace |

**"Applied, not published"** means the change is staged and ships with the team's next publish. Those
sites had Designer work pending before this rollout touched them, so publishing would have shipped
somebody else's unfinished page. Check `get_site`: `lastUpdated` within about a minute of
`lastPublished` means clean. **Check it BEFORE writing freeform code — a head write moves
`lastUpdated` and destroys the signal.**

### Two sites are not the site the public gets
`masonparkpediatricdental.com` and `westlaimplants.com` still answer from **WordPress**. The Instatic
builds are on `mason-park-kids.up.railway.app` and `west-la-implants-production.up.railway.app` and
have not been cut over. Consent is on the Instatic builds and will arrive with the cutover; the live
WordPress sites have none, and we have no credentials for them.

## Gotchas
- **A third-party widget that renders in the page inherits the page's CSS.** Any global
  `img`/`svg`/`button` rule can disfigure it, and it will look like the widget is broken. Measure the
  widget's own elements (`banner.mjs` in the scratchpad pattern: rendered size plus the stylesheet
  rules that match), do not guess. The guard above covers images; a site with a global `button` or
  `a` rule could need the same treatment.
- **Never consent-tag a GoHighLevel number pool.** See the client decision above. A hold there
  turns call tracking off for everyone who does not accept, and on Grand Mission it turned it off
  entirely, because the release never fired at all.
- **Tagged scripts can stay held forever, and it looks like success.** On Grand Mission the three
  `text/plain` scripts are still held after Accept, so ahrefs and GHL call tracking are simply off.
  Hackensack releases correctly in the same browser run with the same tag values, and the two Termly
  accounts have identical `region_settings` and `has_cookie_report`. **A gate that only checks
  "nothing fires before consent" scores this as a pass** — check the other direction too: after
  Accept, `document.querySelectorAll('script[type="text/plain"][data-categories]')` must be empty.
- **Testing consent on this workstation needs care.** NordVPN answers `app.termly.io` with a bare 204
  in Chrome, so without a proxy the banner never renders; with the naive proxy the consent POST to
  `us.consent.api.termly.io` fails CORS and nothing is ever saved. A proxy that echoes the page
  origin back in `access-control-allow-origin` and answers `OPTIONS` itself fixes that. Compare two
  sites in ONE run before believing a site-specific result.
- **Malformed page markup swallows anything Webflow appends before `</body>`.** A registered
  *footer* script is emitted last, so an unclosed `<style>` or a broken tag anywhere earlier eats it:
  the browser parses our `<script>` as CSS text and it never runs. South Bay had exactly that (an
  unclosed `<style>` in page custom code, "Force your header font size back"), AVA a different one.
  Both looked fine in the served HTML and both were invisible to any check that greps the HTML rather
  than the DOM. **Register the preferences control in the `header`**, inside our own well-formed
  block — it self-defers to `DOMContentLoaded`, so head placement costs nothing.
- **A Termly category on a dynamically inserted script still works.** Termly picks up a
  `script[type="text/plain"][data-categories]` appended *after* it has already scanned the page and
  flips it to `text/javascript` on consent (verified live on drnahlah.com, 2026-09-22). That is what
  lets a site's own tag loader gate itself — see IFA's `site-tags.js`.
- **A tracker fired by GTM cannot be tagged from the page.** Omnia and Legacy still load the GHL
  call-tracking pair before consent because their GTM containers fire it with no consent check.
  Tagging the head does nothing for it; the fix is inside each GTM container.
- **Cloudflare serves a stale page for minutes after a Webflow publish**, and where the cache level
  ignores query strings a `?cb=` buster does not help. A check that fails right after a publish with
  `cf-cache: HIT` and a non-zero `age` is the edge, not the deployment — re-check on a `MISS`.
- **A gate that only asserts the control exists is worthless.** Click it and look for Termly's modal,
  which renders as `<dialog class="termly-styles-root-…">` — there is no `data-testid` on it. Also
  hit-test the control's centre: on Haven a floating review badge sits over the footer legal row, so
  a bound control can still be unreachable for a real visitor.
- **`register_inline_script` source is typed through a tool call**, where a backslash can lose a
  layer. `kit/consent-preferences.js` is therefore written with no escape sequences at all (plain
  substring matching instead of regexes) and `minify` refuses to ship a backslash. Verify anyway:
  `curl` the returned `hostedLocation` and `cmp` it against the local min file.
- **Termly accounts are created by hand, and a free-account key automates nothing** (re-probed
  2026-09-21). The key a free dashboard hands out is a *per-website legacy token*, not an account
  credential: a bogus value against `app.termly.io/api/v1/cookie_whitelist` answers `Couldn't find
  Website with [WHERE "websites"."legacy_token" = $1]`. That one read-only endpoint is the whole
  surface. `/api/v1/websites` and `/api/v1/documents` answer `401 not_authenticated` — they are
  dashboard session endpoints and no header form (raw, `Bearer`, `x-api-key`) opens them; every other
  path 404s. So **no**: the key cannot create a website, trigger a scan, publish a policy, or return
  the embed snippet, and it will not even tell you its own website UUID (`cookie_whitelist` returns
  `uuid: null` — the same stub with no `uuid` param, with a junk one, and with a real live UUID, so
  the one endpoint that does answer is inert). The embed is not an API problem anyway — it is
  `https://app.termly.io/resource-blocker/<website-uuid>?autoBlock=off`, and the UUID is read off the
  dashboard by hand.
- **Creating websites, scans and policies needs the partner API**, base `https://api.termly.io`,
  headers `X-Termly-Timestamp: %Y%m%dT%H%M%SZ` (15-minute window) and
  `Authorization: TermlyV1, PublicKey=<key>, Signature=<hmac>`; endpoints cover Websites, Banners,
  Cookies, Custom Consent Themes, Collaborators, Trigger Scan, Scan Reports, Document Preview and
  Publish Cookie Policy. Termly issues those keys by hand through termly.io/agencies ("if you want to
  use the partner API you need to be issued keys manually by us"); our free-account key returns `401
  Unauthorized` there. **Applying for partner keys is the only way to automate the ~30-account
  rollout** — until then account creation, the scan and the policy stay manual, and the agent's part
  starts once the UUID exists.
- **NordVPN Threat Protection** returns a headerless 204 for `app.termly.io` in Chrome. The symptom is
  that the banner's Cookie Policy link opens nothing. Use `check --termly-proxy`.
- **The registered-script cap is 2,000 characters.** The v2.2 minified bridge is 1,965. Anything that
  grows it must be paid for elsewhere, or split into two registered scripts.
- **`add_site_script` 404s on a site with no applied scripts.** Use `set_site_scripts` there, after
  `get_site_scripts` has confirmed the 404.
- **`git sparse-checkout add` re-applies the sparse patterns** and deletes tracked files outside them
  from the working tree. On 2026-09-17 that removed the old `deliver/brandklout/snippets/` mid-move.
  Recover them with `git show HEAD:<path>`.
- **Line endings differ between checkouts.** The Instatic assets deployed on 2026-09-17 carry CRLF from
  the worktree, while main's copy of the kit is LF. `consent-kit.mjs` ignores CR when it decides whether
  an asset is current, and deploys LF from now on. Byte-comparing a Webflow hosted copy is still exact
  (the min file has no line breaks).
- **Changing consent reloads the form**, which clears any fields the visitor already filled in.
- **Instatic `frame-src 'none'`** (Stone Surgical Arts, Stone Med Spa, West LA Implants) blocks GHL
  iframes outright. The bridge is ready for them, but a form needs the Embed block and its frame
  origin first.

## Version Control
This directive follows the root-level version control rules in [SYSTEM_RULES.md](../../../SYSTEM_RULES.md).
`.tmp/` holds probe output and the per-host publish guards; it is git-ignored except its `.gitignore`.
