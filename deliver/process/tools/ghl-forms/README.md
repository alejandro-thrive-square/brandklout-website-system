# GoHighLevel lead forms

How every Brandklout site's GoHighLevel (GHL) lead form is built or fixed, so all of them look
and work the same: the contact / appointment form, and the forms in an ads combo. Set up
2026-10-03 on Mason Park; the model is Grand Mission's *Contact Form Website*
(`HHUjLT7QwNmfVq4yjxw5`).

GHL has no API we can write forms with, so the edit is done by **Codex computer use**
([../codex-computer-use](../codex-computer-use/README.md)) and checked **keyless** by the gate.

## The standard

Top to bottom:

| # | Element | Rule |
| :- | :--- | :--- |
| 1 | Name | First + Last Name, or Full Name. Keep whatever the form already has. |
| 2 | Phone, Email | Keep. |
| 3 | **Service** | Single Dropdown, contact custom field `Service` (reuse `Service` / `Treatment Type` if the sub-account has one). Placeholder *Select a service*, **required**. 8–12 options from the site's own services pages, in the practice's words, ending with *Other*. |
| 4 | Message | Keep (Multi Line, optional). |
| 5 | **SMS consent** | GHL's standard **Terms & Conditions** element. **Not required, unchecked.** Checkbox 1 = care messages, checkbox 2 = marketing (texts below), with the practice's **legal name**. |
| 6 | Captcha, Submit | Keep; never change the Submit label unless the task says so. |
| 7 | **Privacy Policy \| Terms of Service** | Text element, links to `<origin>/privacy-policy` and `<origin>/terms-of-service`, new tab. GHL's default is `https://www.example.com` — never ship it. |
| — | 11 hidden consent fields | `privacy_*` + `marketing_disclosure_version`, hidden, Query Key = field key ([termly-ghl-consent](../termly-ghl-consent/termly-ghl-consent.md)). |
| — | Save-and-exit | **Off** ([termly-ghl-consent](../termly-ghl-consent/termly-ghl-consent.md), gotcha "Submission in progress"). |

**Not standard: the preferred-language dropdown.** Grand Mission has one (English / Spanish); add
it only when the client asks for it.

Consent texts (`{LEGAL}` = the legal name, e.g. *Mason Park Dental PLLC DBA Mason Park Dental of Katy*):

> By checking this box, I consent to receive messages from {LEGAL} related to my care, including
> appointment reminders, confirmations, billing notices, and other account-related communications.
> Message frequency may vary. Message and data rates may apply. Reply HELP for assistance or STOP
> to opt out.

> By checking this box, I consent to receive occasional marketing messages from {LEGAL}, such as
> special offers, discounts, newsletters, and updates about services. Message frequency may vary.
> Message and data rates may apply. Reply HELP for assistance or STOP to opt out.

The checkbox stays optional because A2P 10DLC (the carriers' SMS registration) rejects consent
that is a condition of submitting the form.

## Steps

1. **Find the form.** The id is in the site's embed (`…/widget/form/<id>`); grep the live page:
   `curl -sL -A Mozilla/5.0 <page> | grep -oE "widget/form/[A-Za-z0-9]+"`. The sub-account
   (location) id is in the form's public payload (`locationId`) or the client's runbook.
2. **Read where it stands** (no login, submits nothing):
   ```bash
   cd deliver/process/tools/termly-ghl-consent
   node gates/check-ghl-form.mjs --standard --origin https://www.<client>.com <formId> > output/ghl-forms.log 2>&1
   ```
   Each `PROBLEM` line is one thing to fix.
3. **Collect the inputs**, all from the live site — never invent them:
   - **Legal name**: the first line of the site's `/privacy-policy` ("X PLLC DBA Y").
   - **Origin**: the production origin (`https://www.…`). Both `/privacy-policy` and
     `/terms-of-service` must answer 200 there; build the missing page first.
   - **Services**: the site's `/services/*` pages grouped into 8–12 patient-facing choices, plus *Other*.
4. **Run Codex.** Fill the placeholders in [`codex-instruction.txt`](./codex-instruction.txt) and run
   it with writes allowed (the user asked for the change; the instruction names it):
   ```bash
   node deliver/process/tools/codex-computer-use/codex_cu.mjs "<filled instruction>" --allow-writes --timeout 40
   ```
   For a **new** form, say so and have Codex create it from blank: it must never open an existing
   form, not even to copy its style (2026-10-02: an open builder on a live lead form looked like
   an edit, and the user stopped it). Give the style from the site's tokens instead.
5. **Gate again** (step 2). It must print `ok`. Then look at the form once on the live page in a
   normal browser: in automation the embed stays hidden behind Cloudflare Turnstile.
6. **Record** it in the client runbook: form id, the service list, the legal name used.

## Gotchas

- **A dropdown's options live on the custom field, not the form.** Editing the options of a reused
  `Service` field changes every form in the sub-account that uses it. Read them before you change
  them.
- **The Terms & Conditions element's template text** is `[BUSINESS NAME] … [USE_CASE…]`. The gate
  fails on it.
- **Each sub-account is separate.** Custom fields, consent fields and forms do not carry over from
  another practice, even a sister one (Grand Mission and Mason Park share Dr. William Sung, not a
  GHL location).
- **Old-domain leftovers.** Check the legal pages say the current domain: Mason Park's
  `/terms-of-service` still named `bestdentistinkatytx.com` on 2026-10-03.

## Reference forms

| Client | Form | Notes |
| :--- | :--- | :--- |
| Grand Mission | `HHUjLT7QwNmfVq4yjxw5` *Contact Form Website* | The model. Has the optional language dropdown. |
| Mason Park | `JuzM9SxuJMPDMwfO6cgj` *Contact form* (`/contacts`) | Brought to the standard 2026-10-03. |

## Version Control

Follows the root version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Codex run
output stays in `%TEMP%`; never commit a report that contains a secret.
