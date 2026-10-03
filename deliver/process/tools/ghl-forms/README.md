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

### The model, field by field

Grand Mission's *Contact Form Website* (`HHUjLT7QwNmfVq4yjxw5`), read from its public payload on
2026-10-03. Labels are empty; the placeholder is the visible text.

| # | GHL element | Field key | Placeholder / text | Required |
| :- | :--- | :--- | :--- | :- |
| 1 | Full Name | `full_name` | Name | no |
| 2 | Phone | `phone` | Phone Number* | no |
| 3 | Email | `email` | Email | no |
| 4 | Single Dropdown | `contact.preferred_language_of_contact` | Select Preferred Language* · English, Spanish | no |
| 5 | Single Dropdown | `contact.treatment_type` | Select Treatment Type* · Implants, Veneers, Emergency, Clear Aligners, New Patient, Invisalign | no |
| 6 | Multi Line | `contact.please_enter_any_questions_or_concerns_you_may_have_here` | Message | no |
| 7 | Terms & Conditions | `terms_and_conditions` | box 1 care text, box 2 marketing text, legal name *William Sung DMD PC DBA Grand Mission Dentistry office* | no |
| 8 | Captcha | `captcha` | | |
| 9 | Submit | `button` | Submit | |
| 10 | Text (heading) | `header` | `Privacy Policy` \| `Terms of Service`, links on `https://grandmissiondentistry.com/…`, new tab | |
| 11–21 | 11 consent fields, hidden | `contact.privacy_*`, `contact.marketing_disclosure_version` | Query Key = the key without `contact.` | no |
| 22 | Custom HTML | `html` | GHL's empty default ("The Custom HTML goes here") | |

Two things in the model differ from the table above: nothing is *required* (the `*` is only typed
into the placeholders), and its dropdown is called *Treatment Type*. Both are open for the owner to
settle against the reference video (see [Open questions](#open-questions)).

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

## Copying the fields from another sub-account

A sub-account that has none of the custom fields (gate: `consent fields 0/11`, no service dropdown)
gets them from Grand Mission by **snapshot**, not by retyping them. Read in GoHighLevel on
2026-10-03 (Codex, read-only):

| Route | What it does | Verdict |
| :--- | :--- | :--- |
| **Agency › Account Snapshots** | A snapshot of a sub-account; **Load snapshot** runs *Sub-accounts → Assets → Conflicts* and lets you tick single assets under Custom Fields, Custom Values, Tags, Workflows, Surveys, Calendars, Marketing, Sites. | **The route.** Needs an agency-level user (the signed-in user is one). |
| Snapshot **GMD Copy** | Already exists, taken from Grand Mission, 124 assets, already linked to Mason Park Dental of Katy. | The snapshot to reuse. Take a fresh one if Grand Mission's fields changed since. |
| Settings › Custom Fields | 110 fields in 12 folders on Grand Mission (`Consent` is one). Tools menu: *Edit searchable fields*, *Edit unique fields*. | No import, export or copy. |
| Sites › Forms › row *Actions* | Edit, Preview, View submission, Duplicate, Share, Move to folder, Delete. | No *Copy to sub-account*. *Share* not yet tested. |
| Marketing › Ad Manager | Facebook / Google / LinkedIn ad campaigns and conversion tracking. | Nothing to do with forms or fields. |

Steps (untested end to end — see [Open questions](#open-questions)):
1. Agency › Account Snapshots › **GMD Copy** › *Load snapshot* (or a fresh snapshot of Grand Mission).
2. **Sub-accounts:** the target practice only.
3. **Assets:** tick only the custom fields the form needs: the `Consent` folder (11 fields),
   *Treatment Type*, and the Contact message field. Untick everything else, above all workflows,
   calendars, sites and tags.
4. **Conflicts:** keep the target's existing field wherever one already exists. Never overwrite.
5. Then build or fix the form with the [steps](#steps) above; the fields are now in the field list.
6. Gate it.

## Open questions

For the owner to settle against the reference video, then fold into the standard:
1. **Required.** The model has no required fields; the `*` is placeholder text only. Should Phone
   and the service dropdown be truly required?
2. **Service vs. Treatment Type.** Reuse `contact.treatment_type` (the model's key, which the
   snapshot carries over) as the standard name? Recommended: yes, one key in every sub-account.
3. **Language dropdown.** Standard or on request only?
4. **Snapshot vs. form *Share*.** Does *Share* on a form copy it with its custom fields into another
   sub-account? If so it may replace steps 1–5 for a new form.
5. **Consent box required on 7 forms.** Legacy, Ortega, South Bay, AVA, Organ Mountain, Markham,
   Haven and Makris have the SMS box *required*. The standard (A2P 10DLC) says optional. Confirm
   before flipping them.

## Gotchas

- **A dropdown's options live on the custom field, not the form.** Editing the options of a reused
  `Service` field changes every form in the sub-account that uses it. Read them before you change
  them.
- **The Terms & Conditions element's template text** is `[BUSINESS NAME] … [USE_CASE…]`. The gate
  fails on it.
- **Each sub-account is separate.** Custom fields, consent fields and forms never sync between
  practices, even sister ones (Grand Mission and Mason Park share Dr. William Sung, not a GHL
  location). They are *copied* once, with a snapshot (next section).
- **Old-domain leftovers.** Check the legal pages say the current domain: Mason Park's
  `/terms-of-service` still named `bestdentistinkatytx.com` on 2026-10-03.

## Reference forms

| Client | Form | Notes |
| :--- | :--- | :--- |
| Grand Mission | `HHUjLT7QwNmfVq4yjxw5` *Contact Form Website* | The model. Has the optional language dropdown. |
| Mason Park | `JuzM9SxuJMPDMwfO6cgj` *Contact form* (`/contacts`) | Brought to the standard 2026-10-03. |

### Every client, 2026-10-03

`check-ghl-form.mjs --standard` over the form on each live contact page (no `--origin`):

| Passes | Fails |
| :--- | :--- |
| Grand Mission, Stone Dental Implant Center, Omnia, Livewell, Mason Park | **No service dropdown:** Legacy, Ortega, Dentiq, South Bay, AVA, Organ Mountain, IFA, Marvel (contact + 20% offer), Markham, Haven, West LA, Azusa, Mason Park Pediatric, Elite. **SMS box required:** Legacy, Ortega, South Bay, AVA, Organ Mountain, Markham, Haven, Makris. **Save-and-exit on:** Dentiq, Hackensack, West LA, Restore. **No consent fields (0/11):** Azusa, Elite. **No SMS element / links:** Azusa, Mason Park Pediatric (`example.com`), Markham (links). **Form gone:** Atwood `XUpKr4CxpDhVdw20Ir6Y`. |

No form found on the contact page of Nahlah, Kissimmee, Stone Surgical, Stone Med Spa, Oceanic,
Arvada (embedded elsewhere or on another page).

## Version Control

Follows the root version control rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Codex run
output stays in `%TEMP%`; never commit a report that contains a secret.
