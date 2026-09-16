# 2026-09-16 — Termly cookie consent on every production page

**Instance:** `https://www.masonparkdental.com` (production). Staging untouched.
**Commit:** see git log for this file (settings live in the instance, not the repo).

## Done

- The agency's Termly resource blocker
  (`https://app.termly.io/resource-blocker/90bab4d8-7193-4168-bc7a-cfaa68868b05?autoBlock=on`)
  is on all 78 published pages, through the `brandklout.embed-origins` 1.6.0 setting
  **Scripts on every page** (`siteScripts`). Termly is listed first, above Sienna.
- The same plugin's settings now also allow `connectOrigins: https://us.consent.api.termly.io`
  (where Accept/Decline is saved) and `frameOrigins: https://app.termly.io`. `siteScripts` only
  grants the script's own host, so without these a page with no Embed block could show the
  banner but not save the choice.
- Before publishing, production's draft matched what was live (`draftMatchesPublished: true`),
  so the two publishes (16:29 and 16:31 UTC) pushed nothing but this.
- Checked in Chrome at 1440 on `/`, `/about-us`, `/privacy-policy`: the banner shows, no Termly
  CSP errors, and Accept on `/about-us` POSTs 201 to the consent API and closes the banner.
  Check script: `workflows/09-static-rebuild/.tmp/termly-check.cjs` (`ACCEPT=1` to click Accept).

## Next

- **Staging** (`staging.masonparkdental.com`, the rebuild) runs embed-origins **1.5.1**, which
  has no `siteScripts`. Termly has to be added there too before the rebuild replaces production:
  install 1.6.0, then set the same three values.

## Gotchas

- **NordVPN hides Termly in Chrome:** `app.termly.io` answers a headerless 204 in the browser
  and 200 from node/curl. `termly-check.cjs` sends Termly's requests through Node's `fetch`
  (`ctx.route`) so the check can run with the VPN on.
- Termly logs "ResourceBlocker is not the first script on the page". `siteScripts` adds tags
  `async` just before `</head>`. The banner and consent work, but the auto-blocker may miss
  a script that loads before it. Making it truly first would need a plugin change (a
  sync, head-first option).
- Pages with no Embed block already block Cloudflare's `email-decode.min.js` and the
  `cloudflareinsights` beacon under their CSP. That was true before this change; Termly did
  not cause it.
- Git Bash turns a `/about-us` argument into a Windows path. Pass page slugs to
  `termly-check.cjs` without the slash.
