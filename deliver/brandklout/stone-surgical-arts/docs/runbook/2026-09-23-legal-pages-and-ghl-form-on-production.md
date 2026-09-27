# 2026-09-23, later — Legal pages updated and promoted with the GHL form, production then staging

Asked: "Build privacy and terms of services", then "on production, then staging and add this form
on each contact form that you see across the site", with the GHL snippet for form
`Nzf3xQVLhgMlABuVMxCN`.

## Done

- **Legal text brought up to date.** The 2026-09-17 pages said the site runs no third-party scripts
  and sets no tracking cookies. That stopped being true when the site gained the GHL form, Termly,
  the Sienna widget and the call-tracking pool. Privacy: a *Call tracking* subsection in 01, the
  service-providers line in 04, LeadConnector / Termly / Sienna in 05, and 06 Cookies rewritten
  (essential, call tracking, preferences; no advertising cookies, no analytics; the Cookie
  Preferences link). Terms: the tracking-number sentence in 04, and LeadConnector and Termly in
  08. The effective date is **September 23, 2026** on both pages.
- **The contact form.** The site has exactly one contact form, on `/book`, and it was already
  this form on staging (since 2026-09-17). The snippet's `data-height` 1218 replaced 565. The
  `<form class="check_component">` on the four procedure pages is a self-check tick-list that
  sends nothing, so it was left alone. Production had the old hand-built form, which sent
  nowhere; this promotion replaced it.
- **Production** (`www.dfwsurgicalarts.com`), with backups taken first: DB
  `VACUUM INTO /app/storage/backups/cms-2026-09-23-seq39-pre-legal-promotion.db`, API snapshot
  `21-instatic-upload/.tmp/backup-www-2026-09-23-pre-legal-promotion/`, git tag
  `stone-prod-pre-legal-2026-09-23`. Then `upload-media` (77/77 skip), `build-import-input`,
  `ship.sh` (0 warnings), `push-site --apply --force` (54 written, 0 deleted, seq 40),
  `place-embeds --apply` (book: 1 block), publish `{"publishedPages":54}`.
- **Staging**: the same steps with the staging link dir (snapshot
  `.tmp/backup-staging-2026-09-23-pre-legal/`), 54 written, 1 embed, `{"publishedPages":54}`.

## Verified

- Production: `verify-live` `FAIL none` (54/54 distinct titles, 8 retired routes gone), and
  `compare-live book privacy-policy terms-of-service` finds no differences. In the live HTML, the
  pool tags, the Termly script and both consent code assets survived the push on every page
  checked. The number is `767-4188` with no `918-3666` anywhere. The footer's legal links now
  point to `/privacy-policy` and `/terms-of-service`, and no page links to the sister practice's
  legal pages any more (the About page's brand card still links to the sister site on purpose).
  `/book` carries the form at `data-height="1218"` with `form_embed.js`.
- Staging: `verify-live` `FAIL none`. Same number, the form on `/book`, the new effective date,
  **no pool**, and `X-Robots-Tag: noindex` still set.
- The form was not rendered in a headless browser: Turnstile blanks GHL forms under automation
  (memory). It is the same form and the same embed path that rendered on staging on 2026-09-17.

## Next

- **Inside GoHighLevel (the practice's side):** the form's own Privacy/Terms links still point
  at `example.com`. Point them at `https://www.dfwsurgicalarts.com/privacy-policy` and
  `/terms-of-service`. Its consent text names "Stone Surgical PLLC", not "Stone Surgical Arts PLLC".
- Someone at the practice sends one real test submission and confirms it arrives.
- The practice or its counsel should still read both legal pages. They are adapted, not legal
  advice.

## Gotchas

- `push-site.mjs` refuses a re-import without `--force` ("52 page(s) already carry authored
  content"). That is trap 11 working as designed. Every page is in the payload, so nothing is lost.
- `push-site.mjs` replaces only `site.js` and `tokens.css` among the shell's files, so Termly's
  `brandklout-consent-*.js` code assets survive a full push. Plugin settings are not touched
  either, so the pool and Termly `siteScripts` survive.
- `upload-media.mjs` rewrites `.tmp/media-map.json` for whichever host it last ran against.
  After this run that is **staging**. Re-run it against production before any production build.

## Version Control

Tracked. Follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
