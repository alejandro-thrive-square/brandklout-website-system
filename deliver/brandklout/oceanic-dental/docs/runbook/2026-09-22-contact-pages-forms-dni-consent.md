# 2026-09-22 — Location contact pages, GHL forms, DNI and Termly consent

Everything below is in the Webflow **draft**. Nothing was published: the site already had unpublished
Designer edits (`lastUpdated` 19:59 vs `lastPublished` 19:07 UTC), and publishing production is the
user's call.

## Done

- **Site recorded:** `66cd6c49cbb85d43d9e41a7c`, live on www.oceanicdental.com (`docs/mcp-access.md`).
- **Two contact pages**, duplicated from `/contact` (`66cd77afe1badc7079ef593a`), which is untouched:
  - `/contact-fountain-valley` (`6ab2ea437cb88fb88269743e`): FV GHL form `wF05U3sxrzyvd6Hi4y3s`.
  - `/contact-huntington-beach` (`6ab2ea4567cac9f58b8e9a25`): HB GHL form `u3CsmKEaGt3BVpDDUaR0`.
  - On each page the native Webflow form (`contact_form_form-block`) was replaced by an HtmlEmbed. The
    embed holds the client's snippet verbatim inside `<div class="ghl-form-embed" style="min-height:646px">`.
  - SEO title and description are per location. The OG image was re-set, because duplicating dropped it.
  - HB page: the HB number in the location card was typed `(714) 841–0203` (an **en dash**), which
    GHL's pool can't match. It is now a hyphen on that page.
  - Both forms have `enableSaveExitConfirmation` off (`check-ghl-form.mjs`), so no "Submission in progress".
- **Registered site scripts, header, applied with `set_site_scripts`** (there were none before):
  - `brandkloutconsentbridge` 2.2.0 (the kit's min file). The hosted copy was checked with `cmp`: identical.
  - `oceanicdni` 1.1.0, from [`../../site-scripts/dni-loader.js`](../../site-scripts/dni-loader.js):
    the **FV pool on every page**, the **HB pool only on `/contact-huntington-beach`**. It injects
    `number_pool.js` + `user_session.js` only once Termly reports advertising consent. The hosted copy
    was checked with `cmp`: identical.
- **Site head (freeform):** the Termly resource blocker `e3f87a5b-…?autoBlock=off` is now the first line.
  The Google Ads gtag (`AW-16451602888`) loader and its config are tagged
  `type="text/plain" data-categories="advertising"`. The existing font-smoothing CSS and the Sienna
  widget are unchanged.
- **Footer component:** an HtmlEmbed after the Privacy Policy link holds
  `<a href="#" class="footer4_legal-link terms termly-display-preferences">Consent Preferences</a>`, plus a
  one-line `<style>` that makes its `.w-embed` wrapper inline. On desktop `.footer4_bottom-wrapper` is
  `display:block` with inline links, so the wrapper div would otherwise put the link on its own line.
  This hasn't been seen rendered yet: the element snapshot needs the Designer open.

## Next

1. **Publish** (user). Then run `node deliver/process/23-termly-ghl-consent/consent-kit.mjs check
   https://www.oceanicdental.com/contact-fountain-valley,https://www.oceanicdental.com/contact-huntington-beach --termly-proxy`
   (redirect output to a file) and look at the footer link placement on the live page.
2. **GA4 `G-2HMERPBQ7R` is loaded by Webflow's Google Analytics integration** (Site settings → Apps &
   Integrations), printed above all custom code and so above Termly, and it can't be tagged. By hand:
   clear the ID there, then add
   `<script type="text/plain" data-categories="analytics" async src="https://www.googletagmanager.com/gtag/js?id=G-2HMERPBQ7R"></script>`
   plus a tagged config script to the head, under the Ads block.
3. **`/brighten` page head** loads GA4 a second time (untagged, and a duplicate of the integration's).
   Delete its first two `<script>` tags. The conversion helper can stay: once gtag is gated, it only
   pushes to `dataLayer`.
4. Decide what `/contact` becomes (nav links point there; it still has the native Webflow form).
   Options: a location chooser linking to the two new pages, or a 301 to one of them.
5. The en dash `(714) 841–0203` is also on `/hb`, `/top-dentist-huntington-beach`, `/book`,
   `/dentists-of-irvine` and `/contact`. The FV pool doesn't swap HB numbers, so it only matters if HB
   DNI is ever extended to those pages.
6. GHL side (Brandklout team): the eleven `privacy_*` consent fields on both forms. See module 23.

## Gotchas

- **Webflow registered scripts take `data-*` attributes only.** `type="text/plain"` is refused with a
  400, so the DNI loader gates itself on `Termly.getConsentState().advertising`. No Termly, no consent,
  no DNI. A visitor who never answers the banner sees the office numbers.
- `number_pool.js` finds its pool from `document.currentScript.src`, or else from the first
  `number_pool` script on the page. Never put two pools on one page.
- The Webflow MCP rate-limits `query_elements` (429 from `GET /v2/pages`) after roughly 30 calls in a
  few minutes. Batch the queries.

## Version Control

Tracked on `bk-oceanic-dental`. See [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
