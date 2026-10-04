# 2026-10-01 · Style selection is a concept deck

Asked (Livewell): "the Hackensack link is the new way we let clients choose the style; each selection
is a subpage with a different style. Update our processes from main."

## Done

- `scenario-0-new-site/01-client-inquiry` step 10 rewritten: five full homepages with the same content
  in the same order (`content.md`, `directions.md`, `concept-0N-<slug>.html`, `index.html`), built to
  the design standard, checked at 1440 + 390, published to the client's Instatic staging as
  `/concepts` + `/concept-0N-<slug>`.
- `scenario-1-migration/README.md`: a migration runs scenario 0 step 01 items 3-10 (instance, staging,
  plugins, concept deck) before step 02; it used to skip straight to step 02.
- Livewell registered in `tools/instatic-domain-origins/sites.json` (production + staging) and in
  `tools/instatic-plugins/plugins.json`.
- First deck: bk-livewell, https://livewell-dental-staging.up.railway.app/concepts.

## Next

- Promote `shoot-concept.mjs` and `publish-deck.mjs` (bk-livewell
  `scenario-0-new-site/01-client-inquiry/output/code/`) into the step's `scripts/`; the screenshot
  script borrows puppeteer-core from scenario 1's capture scripts by relative path.
- Promote Hackensack's `staging-env.mjs` and `with-setup-env.mjs` into `tools/instatic-site/setup/`
  (now used on two clients).

## Gotchas

- Hackensack's deck was hand-built on Webflow by someone else; the step now builds it ourselves.
  Its "Dark Luxury" direction breaks the light-themes rule and has no equivalent.
- `provision-instance.mjs` answered "Not Authorized" on a stale Railway token until `railway whoami`
  refreshed it.

## Version Control

Follows [SYSTEM_RULES.md §5](../../SYSTEM_RULES.md).
