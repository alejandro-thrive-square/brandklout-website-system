# 2026-09-22 — Termly cookie consent on Mason Park Pediatrics

Part of the rollout that put a cookie banner on all 29 Brandklout sites in one pass. The full
picture, the other 28 sites and every gotcha are in
[`deliver/process/23-termly-ghl-consent`](../../../../process/23-termly-ghl-consent/23-termly-ghl-consent.md);
this file is only what is true for **this** site.

## State

**Applied and published to the Instatic build**, which is not yet the live site. Nothing fires before a visitor chooses.

| | |
| :--- | :--- |
| **Termly account** | `masonparkpediatricdental@brandklout.com` |
| **Website UUID** (public, it is in every page's source) | `1e31d822-4be9-4f13-8fea-784b57185bb0` |
| **Embed** | `https://app.termly.io/resource-blocker/1e31d822-4be9-4f13-8fea-784b57185bb0?autoBlock=off` |
| **Platform** | instatic |
| **Live URL** | https://www.masonparkpediatricdental.com |

## The credential, and how this worktree gets it

`TERMLY_API_KEY` is **already in this worktree's `.env`**. It is resolved from the one master file:

```
~/.webzite/.env   [vars]      TERMLY_MASON_PEDIATRIC=<the key>
                  [mason-park-kids]  TERMLY_API_KEY=${TERMLY_MASON_PEDIATRIC}
```

- **Never hand-edit `.env` here.** It is generated, and `npm install` (Orca's per-worktree setup
  hook) rewrites it. Edit the master, then `node scripts/env-sync.mjs` in this worktree.
- Check it resolved: `node scripts/env-sync.mjs --check` should list `TERMLY_API_KEY`.
- **The key does almost nothing.** A free Termly account's key is a per-website legacy token whose
  whole surface is one read-only endpoint. It cannot create a website, run a scan, publish a policy
  or return the embed. The thing you actually need is the **website UUID** above, which is public
  and tracked in `deliver/process/23-termly-ghl-consent/kit/termly-websites.json`.

## What was put on the site

- **Termly script**: the `brandklout.embed-origins` plugin's `siteScripts`, placed above GTM.
  `connectOrigins` carries `us.consent.api.termly.io` and `frameOrigins` carries
  `app.termly.io`, or the banner's policy link opens nothing.
- **Cookie Preferences control**: code asset
  `src/scripts/brandklout-consent-preferences.js`, all pages, body end.
- **Trackers** outside GTM are tagged `type="text/plain" data-categories="analytics|advertising"`,
  which is how Termly holds one until the visitor accepts that category.
- `autoBlock=off`. With it **on**, Termly held the site's own JavaScript, videos, maps and forms
  behind an "Enable" box until a visitor accepted. Off means Termly blocks nothing on its own and
  only the hand-tagged scripts wait.

- **The Instatic build is not what the public gets.** `masonparkpediatricdental.com` still
  answers from **WordPress**. Consent is applied and published to the Railway build and arrives
  for real visitors at cutover. The live WordPress site has no consent banner and we hold no
  credentials for it.
- This is also the only one of the 29 sites with **no privacy policy, terms or cookie policy
  page at all**. The banner links Termly's hosted Cookie Policy; the site still needs its own.

## Traps worth knowing here

- **Never put a consent hold back on a GoHighLevel number pool** without a new client decision.
  The client's instruction (2026-09-22) is that the pools run even when consent is not accepted.
- **A gate that only asks "does anything fire before consent?" is half a gate.** A script that is
  held and never released looks identical to a pass. Check the other direction too: after Accept,
  `document.querySelectorAll('script[type="text/plain"][data-categories]')` must be empty.
- **Click the control, do not just look for it.** Termly's preference centre renders as
  `<dialog class="termly-styles-root-…">` and carries no `data-testid`.
- **Testing consent from this workstation needs a proxy.** NordVPN answers `app.termly.io` with a
  bare 204 in Chrome, so the banner never renders; and a naive proxy breaks the consent POST's CORS,
  so nothing is ever saved. `consent-kit.mjs check <url> --termly-proxy` handles the first half.

## Checks

```bash
node deliver/process/23-termly-ghl-consent/consent-kit.mjs check https://www.masonparkpediatricdental.com --termly-proxy
```

```bash
node deliver/process/23-termly-ghl-consent/consent-kit.mjs instatic status --only mason-park-kids
```

## Version Control

Tracked with the repo. Follows the runbook rules in
[SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
