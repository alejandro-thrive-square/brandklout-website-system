# Termly → GoHighLevel consent bridge

This is the standard way to get a visitor's Termly cookie choices into the GHL contact record. The
same script works on every Brandklout client site that uses Termly and an embedded GHL form.

**File:** [`termly-ghl-consent.html`](./termly-ghl-consent.html). Paste it as-is. It is one `<script>`
tag with a `CONFIG` block at the top.

## How it works

A GHL form is embedded as a cross-origin iframe (`…/widget/form/<id>`). A script on the website can't
read or change fields inside that iframe. GHL does fill any field whose **query key** appears in the
iframe URL, including dropdowns, checkboxes and text. The bridge uses that. It reads Termly's state,
adds the eleven `privacy_*` / `marketing_*` values to the `src` of every GHL form, survey or booking
iframe on the page, and reloads those iframes whenever the visitor changes their choice.

It also fixes a problem that Termly creates. With `autoBlock=on`, Termly marks the GHL iframe
`data-categories="unclassified"` and leaves it blank until the visitor clicks **Accept**. A visitor who
clicks Decline or ignores the banner never sees the form. With `loadFormsWithoutConsent: true` (the
default), the bridge loads the form for everyone. The contact form is strictly necessary, and the
consent values it carries are what makes that visitor's choice auditable.

## Mapping

| Field | Value |
| :--- | :--- |
| `privacy_analytics_consent` | `granted` / `denied` from Termly `analytics`; `unknown` before any choice |
| `privacy_advertising_consent` | `granted` only if `advertising` is allowed and there is no GPC signal or Do Not Sell request; otherwise `denied` (`unknown` before any choice) |
| `privacy_ad_user_data_consent` | same as advertising |
| `privacy_ad_personalization_consent` | same as advertising |
| `privacy_sale_share_opt_out` | `true` if GPC is on, Do Not Sell was requested, or advertising was declined; otherwise `false` |
| `privacy_gpc_detected` | `true` / `false` from `navigator.globalPrivacyControl` (or Termly's saved `gpc`) |
| `privacy_consent_timestamp_utc` | ISO UTC time when the choice was saved; empty before any choice |
| `privacy_policy_version` | `CONFIG.privacyPolicyVersion`, or Termly's `document_version_id` if that is empty |
| `privacy_cmp_receipt_id` | Termly visitor UUID (`visitor_id`) |
| `privacy_source_url` | page origin + path (no query string, so no gclid or other personal data) |
| `marketing_disclosure_version` | `CONFIG.marketingDisclosureVersion` |

Termly doesn't give a timestamp, receipt ID or policy version through its public API, so the bridge
reads them from Termly's own `localStorage` record (`TERMLY_API_CACHE` → `TERMLY_COOKIE_CONSENT`). If
Termly changes that format, those three fields come through empty, and the consent fields still work.

## Install on a client site

1. **GHL: custom fields.** In the location, create the eleven fields listed above (folder `Consent`).
   Consent fields are single dropdowns with the options `granted`, `denied`, `unknown`. The two
   true/false fields are checkboxes with the options `true`, `false`. Everything else is single line.
2. **GHL: form.** Add all eleven fields to every form embedded on the site. Leave each field's
   **Query Key** as the field key (for example `privacy_analytics_consent`). Mark each field hidden in
   the form builder.
   The label-based `hideFields` script only works when it runs *inside* the form. Pasted on the
   website, it can't reach the fields in the iframe.
3. **Website:** paste `termly-ghl-consent.html` into the footer custom code for the whole site. In
   Webflow that is *Site settings → Custom code → Footer code*; on Instatic it goes in a site-wide
   code asset. Set `marketingDisclosureVersion` to the date of the current consent wording, then publish.
4. **Verify:** open a page with a form in a private window. The form should appear before you choose
   anything. In DevTools, the iframe `src` should include `privacy_analytics_consent=unknown`. Click
   Decline: the iframe reloads with `denied` and `privacy_sale_share_opt_out=true`. Submit a test lead
   and check the contact's Consent folder in GHL.
   The headless check used on Stone Dental is described in the 2026-09-16 run in that client's runbook.

## Gotchas

- **Reloads lose typed input.** When the visitor changes their choice in *Consent Preferences* while
  filling out the form, the iframe reloads and the fields they already filled are cleared. That is
  unavoidable: a cross-origin form can't be updated in place.
- **Turning off `loadFormsWithoutConsent`** brings back Termly's default: decliners see an empty box
  where the form should be.
- **GHL popup forms** (`data-layout` popup or sticky) are the same iframe, and the bridge handles them
  too. **Hosted GHL funnel pages** are not covered, because they have no parent page to run the script.
- **Headless testing:** NordVPN returns a headerless 204 for `app.termly.io` in Chrome, so route
  Termly's requests through Node (`ctx.route`).

## Version Control

This directive follows the root-level version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
Change the version in the script header whenever its behaviour changes.
