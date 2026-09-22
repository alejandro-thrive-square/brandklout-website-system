# 2026-09-22 — Termly cookie consent on Stone Dental Implants

Part of the rollout that put a cookie banner on all 29 Brandklout sites in one pass. The full
picture, the other 28 sites and every gotcha are in
[`deliver/process/23-termly-ghl-consent`](../../../../process/23-termly-ghl-consent/23-termly-ghl-consent.md);
this file is only what is true for **this** site.

## State

**Applied but not published** — it ships with this site's next publish. Nothing fires before a visitor chooses.

| | |
| :--- | :--- |
| **Termly account** | `stonedentalimplantcenter@thrivesquare.com` |
| **Website UUID** (public, it is in every page's source) | `e51fcbf6-ee3e-41de-8aeb-9af4d07bdb32` |
| **Embed** | `https://app.termly.io/resource-blocker/e51fcbf6-ee3e-41de-8aeb-9af4d07bdb32?autoBlock=off` |
| **Platform** | webflow |
| **Live URL** | https://www.stonedentalimplantcenter.com |

## The credential, and how this worktree gets it

`TERMLY_API_KEY` is **already in this worktree's `.env`**. It is resolved from the one master file:

```
~/.webzite/.env   [vars]      TERMLY_STONE_DENTAL=<the key>
                  [stone-dental-implant-center]  TERMLY_API_KEY=${TERMLY_STONE_DENTAL}
```

- **Never hand-edit `.env` here.** It is generated, and `npm install` (Orca's per-worktree setup
  hook) rewrites it. Edit the master, then `node scripts/env-sync.mjs` in this worktree.
- Check it resolved: `node scripts/env-sync.mjs --check` should list `TERMLY_API_KEY`.
- **The key does almost nothing.** A free Termly account's key is a per-website legacy token whose
  whole surface is one read-only endpoint. It cannot create a website, run a scan, publish a policy
  or return the embed. The thing you actually need is the **website UUID** above, which is public
  and tracked in `deliver/process/23-termly-ghl-consent/kit/termly-websites.json`.

## What was put on the site

- **Termly script**: site-wide **head** custom code, first, above GTM, inside a
  `BEGIN/END brandklout-consent` block. Webflow site `6a07d5aac093f0e4521d29bc`.
- **Cookie Preferences control**: registered script `BrandkloutConsentPreferences` 1.2.0,
  applied at **header**. It is deliberately not in the footer — a footer script is emitted
  last and any malformed markup earlier on the page swallows it.
- **Trackers** outside GTM are tagged `type="text/plain" data-categories="analytics|advertising"`,
  which is how Termly holds one until the visitor accepts that category.
- `autoBlock=off`. With it **on**, Termly held the site's own JavaScript, videos, maps and forms
  behind an "Enable" box until a visitor accepted. Off means Termly blocks nothing on its own and
  only the hand-tagged scripts wait.

- Termly and the consent bridge were already live here from the 2026-09-17 run; this run added
  the Cookie Preferences control. The footer already had a `.termly-display-preferences` link,
  and the control skips a page that already has one, so there is no duplicate.
- **Not published** — changes were pending before this run touched the site.

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
node deliver/process/23-termly-ghl-consent/consent-kit.mjs check https://www.stonedentalimplantcenter.com --termly-proxy
```

## Version Control

Tracked with the repo. Follows the runbook rules in
[SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
