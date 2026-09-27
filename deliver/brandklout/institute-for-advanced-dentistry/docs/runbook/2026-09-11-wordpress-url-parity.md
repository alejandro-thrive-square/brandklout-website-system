# 2026-09-11 — Keeping the WordPress URLs on Instatic

**Ask:** before the domain moves, make sure the URLs match the old WordPress site.

## Done

- Read Instatic's router over `railway ssh` (`server/publish/publicRouter.ts`). A page is looked up
  by one slug, and the pages table flattens `/` to `-`. Nested `/parent/child` routes exist only for
  CMS collection rows, so a nested page URL cannot be served natively. Confirmed on the live
  instance: `/dental-services/dental-implants/` returns 404, while the flat slug returns 200 with or
  without a trailing slash.
- Canonical tags already carry WordPress's nested URLs (`prepare-wp.mjs` keeps the WP canonical
  verbatim).
- Wrote [`../dns/URL-RULES.md`](../dns/URL-RULES.md): 6 Cloudflare URL rewrites (nested path → flat
  slug, invisible to the visitor) and 3 redirects (apex → www, `/about/`, `/contact/`).
  `wildcard_replace()` is allowed in URL rewrites with no plan restriction in the docs.
- Added `workflows/21-instatic-upload/verify-wp-urls.mjs`. On the Railway host it applies the rules
  itself: 61 WordPress URLs, 29 rewritten, 2 redirected, **0 fail**. On the real domain it tests
  Cloudflare instead.

## Next

- The user creates the rules in the new zone (or grants the token Zone → Transform Rules + Single
  Redirect edit, and they are pushed by API). Then, after the switch, run
  `verify-wp-urls.mjs https://www.ifadentistry.com`.
- Decide whether internal links go back to nested URLs at the switch (see URL-RULES.md, last
  section). Without that change, clicking a menu item shows the flat slug.

## Gotchas

- A `wildcard "/dental-services/*"` filter also matches `/dental-services/` itself, because `*`
  matches the empty string. Rewritten, that becomes `/dental-services-`, a 404. Every section rule
  carries an `ne "/…/"` guard.
- No local Instatic source exists. Read it in the container (`/app/server`, `/app/src`) through the
  Railway link dir recorded in `~/.railway/config.json` for project `3449a121…`.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
