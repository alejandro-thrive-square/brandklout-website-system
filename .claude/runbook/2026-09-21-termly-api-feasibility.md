# 2026-09-21 — Termly free-account API: can it create, scan, publish and hand back the embed?

## Why
The Termly rollout is ~30 client accounts (`deliver/brandklout/termly-setup.md`). The question was
whether the API key a free Termly account exposes under Settings can carry the whole per-client
setup: create/configure the website, run the cookie scan, update the privacy policy, and return the
install embed for Webflow or Instatic. Grand Mission Dentistry was the test client.

## Done
Probed the live API from Node (Chrome is unusable here — NordVPN Threat Protection 204s
`app.termly.io`). Two distinct real keys were tested: Grand Mission's, pasted by the user into the
repo-root `.env` as `TERMLYGRANDMISSION`, and Stone Dental's `TERMLY_API_KEY` from
`~/.webzite/.env`. Both behave identically.

**Verdict: no. None of the four steps are reachable with a free-account key.** Findings are folded
into [`23-termly-ghl-consent.md`](../../deliver/process/23-termly-ghl-consent/23-termly-ghl-consent.md)
gotchas. Nothing was changed on any client site or Termly account — this run was read-only.

## Gotchas
- **The free-account "API key" is a per-website `legacy_token`, not an account credential.** A bogus
  value against `app.termly.io/api/v1/cookie_whitelist` answers
  `Couldn't find Website with [WHERE "websites"."legacy_token" = $1]`, which names the column it is
  looked up in. It therefore cannot address anything outside its own website, and there is no
  account-level surface behind it at all.
- **One endpoint accepts it, and that endpoint is inert.** `GET /api/v1/cookie_whitelist` returns
  `200 {"cookies":[],"categories":["essential"],"uuid":null}` — the same stub for both keys, with no
  `uuid` param, with a junk one, and with Stone Dental's real live UUID
  (`e51fcbf6-ee3e-41de-8aeb-9af4d07bdb32`, read off its published head). The `uuid` field echoes
  nothing and the cookie list never fills, so do not build anything on this response.
- **`/api/v1/websites` and `/api/v1/documents` answer `401 not_authenticated`** under raw
  `Authorization`, `Bearer` and `x-api-key` alike. They are dashboard *session-cookie* endpoints, not
  key endpoints — a 401 there is not a scope problem you can fix with a better key. Every other path
  tried (`/scans`, `/scan` GET and POST, `/documents`, `/banners`, `/cookies`, `/snippet`, `/embed`,
  `/user`, `/me`, `/account`, `/settings`) is a flat 404.
- **The key will not even yield its own website UUID**, so it cannot produce the install embed
  indirectly. The embed is not an API artifact anyway: it is
  `https://app.termly.io/resource-blocker/<website-uuid>?autoBlock=off`, and the UUID is copied off
  the dashboard by hand — or, for a site already carrying Termly, scraped from its published head.
- **The API that does all four things is the partner API and it is gated.** Base
  `https://api.termly.io`; headers `X-Termly-Timestamp` (`%Y%m%dT%H%M%SZ`, 15-minute window) and
  `Authorization: TermlyV1, PublicKey=<key>, Signature=<hmac>`; endpoints cover Websites, Banners,
  Cookies, Custom Consent Themes, Collaborators, Trigger Scan, Scan Reports, Document Preview and
  Publish Cookie Policy. Termly's own docs: *"if you want to use the partner API you need to be
  issued keys manually by us"*, via termly.io/agencies. Both free keys return `401 Unauthorized`
  against it. Account signup has no API in either tier.
- **The key landed in the wrong file.** `TERMLYGRANDMISSION` was hand-added to the repo-root `.env`,
  which `scripts/env-sync.mjs` regenerates from `~/.webzite/.env` on every `npm install` — the value
  will be silently dropped. It belongs under `[grand-mission-dentistry]` in the master as
  `TERMLY_API_KEY`, following the naming already used for Stone Dental. Not moved in this run: the
  user should confirm, since the secret has to be written to the master by hand.
- **Grand Mission's consent bridge is already live and the registry is right.** Its published head
  carries no Termly script, but the body end serves
  `brandkloutconsentbridge-2.2.0.js`. A first grep missed it because Webflow lowercases the
  registered-script filename — match case-insensitively when checking whether a bridge shipped.

## Next
- **Decide the route.** Either apply at termly.io/agencies for partner keys — the only thing that
  makes a 30-account rollout scriptable, and the executor can be written against the scheme recorded
  above the day they land — or keep account creation, the scan and the policy manual and let the
  agent start at the UUID.
- **Grand Mission phase 2 is one value away.** With the website UUID from its dashboard: Termly line
  with `?autoBlock=off` first in the head above GTM, Consent Preferences link in the footer, then tag
  the trackers outside GTM (GHL head script, Ahrefs). The bridge is already there.
- Move the key to `~/.webzite/.env` under `[grand-mission-dentistry]` and delete it from the repo
  root, then `node scripts/env-sync.mjs`.
