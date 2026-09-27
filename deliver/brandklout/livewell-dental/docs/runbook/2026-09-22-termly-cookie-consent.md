# 2026-09-22 — Termly cookie consent on Livewell

Part of the rollout that put a cookie banner on all 29 Brandklout sites in one pass. The full
picture, the other 28 sites and every gotcha are in
[`deliver/process/23-termly-ghl-consent`](../../../../process/23-termly-ghl-consent/23-termly-ghl-consent.md);
this file is only what is true for **this** site.

## State

**Live.** The banner renders and the Cookie Preferences control opens Termly's modal. Tagged analytics and ad pixels wait for consent; the **GoHighLevel call-tracking pool deliberately does not** (client instruction, 2026-09-22).

| | |
| :--- | :--- |
| **Termly account** | `livewelldental@thrivesquare.com` |
| **Website UUID** (public, it is in every page's source) | `5fd99c51-71ee-4d73-8914-8d4d8565f19e` |
| **Embed** | `https://app.termly.io/resource-blocker/5fd99c51-71ee-4d73-8914-8d4d8565f19e?autoBlock=off` |
| **Platform** | webflow |
| **Live URL** | https://www.livewelldentalva.com |

## The credential, and how this worktree gets it

`TERMLY_API_KEY` is **already in this worktree's `.env`**. It is resolved from the one master file:

```
~/.webzite/.env   [vars]      TERMLY_LIVEWELL=<the key>
                  [livewell-dental]  TERMLY_API_KEY=${TERMLY_LIVEWELL}
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
  `BEGIN/END brandklout-consent` block. Webflow site `69d03fdbe999e9907724a69d`.
- **Cookie Preferences control**: registered script `BrandkloutConsentPreferences` 1.2.0,
  applied at **header**. It is deliberately not in the footer — a footer script is emitted
  last and any malformed markup earlier on the page swallows it.
- **Trackers** outside GTM are tagged `type="text/plain" data-categories="analytics|advertising"`,
  which is how Termly holds one until the visitor accepts that category.
- `autoBlock=off`. With it **on**, Termly held the site's own JavaScript, videos, maps and forms
  behind an "Enable" box until a visitor accepted. Off means Termly blocks nothing on its own and
  only the hand-tagged scripts wait.

- This site had the **Silktide** trial banner (`live: false`, staging only), which also carried
  its ahrefs and GoHighLevel tags and loaded them unconditionally on the live domain. That block
  is gone; Termly replaces it. Ahrefs now waits for consent, the GoHighLevel pool does not.
- The consent bridge here is **2.3.0**, ahead of the kit's 2.2.0. It was left alone.

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
node deliver/process/23-termly-ghl-consent/consent-kit.mjs check https://www.livewelldentalva.com --termly-proxy
```

## Version Control

Tracked with the repo. Follows the runbook rules in
[SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
