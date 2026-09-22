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

## Update, same day: DNI ungated and published

- The user reported "DNI not triggering". A driven Chrome run showed 1.1.0 working as designed: no
  swap until Accept, then FV 378-0085 became 874-8019 and HB 841-0203 became 617-7432, with the
  assign-number POST returning 201 both times.
- The user asked for DNI **before any consent choice**. `oceanicdni` **1.2.0** loads the pool on page
  load with no Termly check. Its hosted copy was checked with `cmp`: identical. This departs from the
  kit's rule for this site only.
- The user had already published the first round at 21:40. The agent published 1.2.0 to both custom
  domains, having checked that nothing else was pending (`lastUpdated` 21:40:24 vs `lastPublished`
  21:40:21). Verified live: the home page swaps FV 378-0085 to 599-8539 with the banner untouched.
- Each driven run claimed a real pool number (3 FV, 1 HB in total). They're sticky per visitor and
  return to the pool.

## Update 2: both pools on every page (OceanicDNI 2.0.0)

- The user reported that on `/book` (the main location chooser) the HB number didn't swap, and asked
  how to spread DNI across the site, because the footer shows both numbers.
- `number_pool.js` runs `initNumberPool()` from a setTimeout, where `currentScript` is null, so it
  scans every `<script>` with `number_pool` in its src and asks each pool for a number. After the
  fetch, `getNumber` keys by the response's poolId and the location. So **2.0.0 executes only the FV
  copy and adds HB as an inert `<script type="text/plain">`**. One init, one number per pool, and each
  pool swaps only its own forwarding number. This is sitewide, footer included; the HB contact page
  gets both pools too.
- Tested before registering, by routing the live `oceanicdni-*.js` to the new file on `/book` with
  the banner untouched: one `number_pool.js` fetch, **exactly two** assign-number 201s, and both
  `tel:` links swapped (FV to 912-7609, HB to 942-5320). The hosted 2.0.0 was checked with `cmp`:
  identical.
- The en dash in `(714) 841–0203` blocks the HB text swap (the `tel:` link still swaps). It is now a
  hyphen on `/book` (2 links), `/hb`, `/top-dentist-huntington-beach`, `/dentists-of-irvine`, `/contact`
  and `/contact-huntington-beach`.
- Published ~22:00, after checking that only those 5 pages had changed since the user's 21:51 publish.
  Verified live as one visitor with the banner untouched: `/book` swapped both numbers (HB to
  909-2982, FV to 874-8019, 2 assigns), then `/` showed the same numbers with no new assign.

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
5. ~~En-dash HB numbers~~: all fixed and published.
6. GHL side (Brandklout team): the eleven `privacy_*` consent fields on both forms. See module 23.

## Gotchas

- **Webflow registered scripts take `data-*` attributes only.** `type="text/plain"` is refused with a
  400, so the DNI loader gates itself on `Termly.getConsentState().advertising`. No Termly, no consent,
  no DNI. A visitor who never answers the banner sees the office numbers.
- **Two pools on one page:** execute ONE `number_pool.js` and add the other pools as inert
  `type="text/plain"` script tags. The init scans every tag. Two executed copies run init twice.
  (The earlier note "never put two pools on one page" was wrong.)
- The Webflow MCP rate-limits `query_elements` (429 from `GET /v2/pages`) after roughly 30 calls in a
  few minutes. Batch the queries.

## Version Control

Tracked on `bk-oceanic-dental`. See [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
