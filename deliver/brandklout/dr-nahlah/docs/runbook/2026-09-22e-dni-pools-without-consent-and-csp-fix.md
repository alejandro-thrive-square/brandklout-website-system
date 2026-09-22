# 2026-09-22e — DNI pools run without cookie consent, and the CSP that blocked them on 79 URLs

Client instruction: "The pools should be running even if the cookie consent is not accepted."

## Done

- **Consent hold removed.** `set-site-tags.mjs` writes both pool lines and `user_session.js`
  without `#consent=advertising`, so they publish as plain `<script src async>`. Its header
  says not to put the hold back. Published.
- **A real bug found while proving it, and fixed.** The pool loads from
  `backend.leadconnectorhq.com`, which is granted with the tag, but asks for its number at
  **`services.leadconnectorhq.com`**, and the session helper reports to
  **`services.msgsndr.com`**. A page with **no Embed block** keeps the strict CSP, and its
  `connect-src` allowed neither. The browser said: `Connecting to
  'https://services.leadconnectorhq.com/phone-system/number-pools/assign-number' violates
  the following Content Security Policy directive`. So **the swap was refused on 79 of 97
  URLs**: every page without an embed, including /our-team, /privacy-policy and the blog. Home,
  /contact and the ads pages have embeds, run in compatible mode (`connect-src https:`), and
  had been swapping all along, which is why every earlier proof passed. Both hosts are now
  in `connectOrigins` on every page.
- **`check-pool-scope.mjs`** now also fails a page whose pool tag is consent-held, or whose
  CSP would refuse the `assign-number` call. Before the fix: 79 failing. After: **97 URLs,
  0 failing.**
- **Proof, a fresh visitor who never answers the banner** (`dni-proof.mjs --relay`):
  - `/our-team`: (571) 617-7245 -> tracking number, 3 text + 3 `tel:`; the same number on
    `/privacy-policy`, 2 + 2 (sticky, from the pool's cache).
  - `/ads-landing-pages/tysons-veneers`: (703) 448-3312 -> tracking number, 7 text + 8 `tel:`.
- `dni-proof.mjs --relay` = the Node relay (NordVPN) with no consent step. That is now the
  normal run here. It also logs which LeadConnector requests fail and why.

## Gotchas

- **A site-script host grant is not enough for a tracker that calls a second host.** The
  plugin grants the script's own origin `connect-src`. Any API on another host needs
  `connectOrigins`, and the gap shows **only on pages without an Embed block**. Every
  other Brandklout site with the GoHighLevel pool has the same trap. The directive now says so.
- **Read the browser's console, not the network log**, when a fetch says `Failed to fetch`
  with no request in the network log. A CSP refusal never reaches the network. The console
  (`Log.enable` over CDP) names the blocked directive.
- The consent decision was the client's, made knowingly. The Termly banner still governs
  GTM tags that are tagged in GTM. It no longer governs call tracking on this site.

## What is next

1. `(703) 940-5410` (Alexandria, current patients) is in neither pool. Confirm that is intended.
2. Check the other Brandklout sites that carry a GoHighLevel pool for the same
   `services.leadconnectorhq.com` connect-src gap.

## Version Control

Tracked with the repo. Follows the runbook rules in
[SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
