# 2026-09-23d — ChatGPT All-on-4 page switched to its own GHL form. LIVE on production and staging

Request (Alejandro): use the new GHL form `AD6c2Du26a0JUpxoh6p5` ("Tyson Corner Office - Chat GPT
AO4") on the ChatGPT page. The name says Tysons, and that does not matter. Do production first,
then staging, and leave the page otherwise as it is.

## Done

Commit: _(see git log for this file)_

- `set-chatgpt-form.mjs` replaces the snippet of the page's single `brandklout.embed-origins.embed`
  node. It was `8jq7yzSeCzZrIkuA3sSG` (Alexandria - Google All On 4) and is now
  `AD6c2Du26a0JUpxoh6p5`, with data-height 1934. Nothing else on the page changed. The write goes
  through site-document, not a row PATCH, so the slash slug holds. It is read back after writing.
- **Production** (`www.drnahlah.com`): draft matched published before the write. Published, 58
  pages. Live HTML has exactly one form iframe, the new id, 0 consultation links and 8 `#book` links.
- **Staging** (`INSTATIC_BASE_URL=https://staging.drnahlah.com`, same script): published, 58
  pages. Live HTML has the new form id.

## Gotchas

- **The new form redirects to `/ads-landing-pages/tysons-all-on-4-thank-you`**, a *Google*
  thank-you page (read from the widget's `__NUXT_DATA__` `redirectUrl`). ChatGPT leads therefore
  still land in a Google-counted funnel, and still no ChatGPT conversion is measured. Fixing it
  means changing the redirect in GHL (e.g. to a ChatGPT thank-you URL with `measure lead_created`).
  That is the client's call and has not been done.
- `dup-chatgpt-landing.mjs` re-clones the Alexandria page, *including its Google form*. If it is
  re-run, run `set-chatgpt-form.mjs --apply` after it on both hosts. The script is idempotent.

## Version Control

Tracked with the repo. Follows the runbook rules in
[SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
