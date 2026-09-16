# Termly + GoHighLevel consent: standard install

This is the Brandklout standard for every client site that uses a Termly cookie banner and embedded
GHL forms. It was first set up and verified on Stone Dental on 2026-09-16.

## What goes on each site

| # | Paste | Where | File |
| :--- | :--- | :--- | :--- |
| 1 | Termly script, **`autoBlock=off`** | Site-wide **head**, **above GTM** | [`termly-head.html`](./termly-head.html) |
| 2 | GHL form embed (iframe + `form_embed.js`) as GHL gives it | The page | from GHL, unchanged |
| 3 | GHL connection script | Site-wide **footer** | [`termly-ghl-consent.html`](./termly-ghl-consent.html) |
| 4 | Consent Preferences link | **Every** footer, landing pages included | [`consent-preferences-link.html`](./consent-preferences-link.html) |

Per site, only three things change: the Termly website ID in #1, and `marketingDisclosureVersion` and
`privacyPolicyVersion` in the `CONFIG` block of #3. There is **no allowlist**.

**Tag every tracker that isn't in GTM.** With auto-block off, Termly holds only the scripts you tag.
For example, GHL call tracking:

```html
<script type="text/plain" data-categories="advertising" src="https://backend.leadconnectorhq.com/appengine/loc/<LOCATION>/pool/<POOL>/number_pool.js"></script>
<script type="text/plain" data-categories="advertising" src="https://backend.leadconnectorhq.com/appengine/js/user_session.js"></script>
```

Termly loads a tagged script when the visitor accepts that category (`analytics`, `advertising`,
`performance`, `social_networking`). GTM tags are held by Google Consent Mode instead. Termly sets the
defaults to `denied`, and they switch to `granted` when the visitor accepts. That is why Termly must
sit above GTM.

## Why auto-block is off

`autoBlock=on` holds everything Termly doesn't recognise until the visitor clicks Accept. On Stone Dental
that included **Webflow's own JavaScript**, so fresh visitors saw a broken page. It also held every
YouTube, Vimeo and Maps embed, the review widgets, and the GHL forms (behind an "Enable" box). Working
around that took an allowlist that had to be kept up to date on every site. With auto-block off, the
site works as built, and trackers are held explicitly instead.

**Trade-off:** a new tracker that someone adds without tagging it (and that isn't in GTM) runs before
consent. Adding a tracker means tagging it; there is no automatic safety net.

## What the GHL connection script does

The GHL form is a cross-origin iframe, so a website script can't touch its fields. GHL does prefill
any field whose **query key** appears in the iframe URL, including dropdowns, checkboxes and text.
The script adds the eleven values below to every `…/widget/(form|survey|booking)/…` iframe, and
reloads those iframes when the visitor changes their choice.

**Until the visitor answers the banner, it sends the values a Decline click would send.** The
timestamp, receipt ID and policy version stay empty until there is a real Termly record, so the CRM can
tell "declined by default" from "clicked Decline".

| Field | Value |
| :--- | :--- |
| `privacy_analytics_consent` | `granted` if Termly `analytics` was accepted, otherwise `denied` |
| `privacy_advertising_consent` | `granted` only if `advertising` was accepted with no GPC signal or Do Not Sell request, otherwise `denied` |
| `privacy_ad_user_data_consent` | same as advertising |
| `privacy_ad_personalization_consent` | same as advertising |
| `privacy_sale_share_opt_out` | `true` unless advertising was accepted with no GPC signal or Do Not Sell request |
| `privacy_gpc_detected` | `true` / `false` from `navigator.globalPrivacyControl` (or Termly's saved `gpc`) |
| `privacy_consent_timestamp_utc` | ISO UTC time when the choice was saved; empty before any choice |
| `privacy_policy_version` | `CONFIG.privacyPolicyVersion`, or Termly's `document_version_id` if that is empty |
| `privacy_cmp_receipt_id` | Termly visitor UUID; empty before any choice |
| `privacy_source_url` | page origin + path (no query string) |
| `marketing_disclosure_version` | `CONFIG.marketingDisclosureVersion` |

The timestamp, receipt ID and policy version come from Termly's `localStorage` record
(`TERMLY_API_CACHE` → `TERMLY_COOKIE_CONSENT`), because Termly's public JavaScript API doesn't expose
them. If Termly changes that format, those three fields come through empty.

## GHL setup (once per location)

1. **Custom fields**, folder `Consent`. Create each field with the type below:
   - `privacy_analytics_consent`, `privacy_advertising_consent`, `privacy_ad_user_data_consent`,
     `privacy_ad_personalization_consent`: single dropdown with the options `granted`, `denied`,
     `unknown`.
   - `privacy_sale_share_opt_out`, `privacy_gpc_detected`: checkbox with the options `true`, `false`.
   - The other five fields: single line.
2. **Every embedded form** gets all eleven fields. Keep each field's **Query Key** equal to the field
   key, and hide the fields inside the form. Hidden fields still prefill.

## Verify

Open the site in a private window.
1. **Before answering the banner:** the page, videos, maps and forms all load. In DevTools,
   `document.querySelectorAll('[data-autoblocked]').length` is `0`. No `number_pool.js` or
   `user_session.js` request appears in the Network tab. The form iframe `src` contains
   `privacy_analytics_consent=denied`.
2. **After Decline:** the form's values stay `denied`, and a receipt ID appears.
3. **After Accept:** the form reloads with `granted`, and the call-tracking scripts load.
4. **Consent Preferences link:** clicking it opens Termly's window.

On Stone Dental, `workflows/08-qa/.tmp/termly-ghl-consent-check.cjs` automates these checks.

## Gotchas

- **NordVPN Threat Protection blocks `app.termly.io` in Chrome.** One symptom is that the banner's
  Cookie Policy link opens nothing. For headless tests, send Termly's requests through Node
  (`ctx.route`).
- **Changing consent reloads the form.** If a visitor changes their choice mid-form, the iframe reloads
  and the fields they already filled are cleared.
- **The Termly key we can get is read-only.** It is a Consent API key (`Authorization: <key>` against
  `app.termly.io/api/v1/cookie_whitelist?uuid=`). It can't change categories or blocking.
- **Hosted GHL funnel pages are not covered.** There is no parent page to run the script on.

## Version Control

This directive follows the root-level version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
Change the version in each script header whenever its behaviour changes.
