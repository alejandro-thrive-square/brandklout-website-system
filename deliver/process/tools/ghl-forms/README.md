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
| 0 | **Labels** | **Every visible field has a label above it** (Name, Phone, Email, Service, Message…), placeholders as hints, like Mason Park's `/contacts` form. Owner decision 2026-10-03; it differs from the Grand Mission model, which is placeholder-only. Never turn the form-wide *Show Label* switch off (see Gotchas). |
| 1 | Name | First + Last Name, or Full Name. Keep whatever the form already has. |
| 2 | Phone, Email | Keep. |
| 3 | **Service** | **Site forms only (contact, appointment). Landing-page forms have none**: the patient already landed on one service, and those forms redirect to the campaign's thank-you page instead. Single Dropdown, contact custom field `Service` (reuse `Service` / `Treatment Type` if the sub-account has one). Placeholder *Select a service*, **required**. 8–12 options from the site's own services pages, in the practice's words, ending with *Other*. |
| 4 | Message | Keep (Multi Line, optional). |
| 5 | **SMS consent** | GHL's standard **Terms & Conditions** element. **Not required, unchecked.** Checkbox 1 = care messages, checkbox 2 = marketing (texts below), with the practice's **legal name**. **Both boxes the same font size (14px)**; GHL keeps an inline 16px on box 1, so `site-style.mjs --compare` measures the rendered sizes. |
| 6 | Captcha, Submit | **Captcha above the Submit button.** Never change the Submit label unless the task says so. |
| 7 | **Privacy Policy \| Terms of Service** | Text element, links to `<origin>/privacy-policy` and `<origin>/terms-of-service`, new tab. GHL's default is `https://www.example.com` — never ship it. |
| — | 11 hidden consent fields | `privacy_*` + `marketing_disclosure_version`, hidden, Query Key = field key ([termly-ghl-consent](../termly-ghl-consent/termly-ghl-consent.md)). **All 11 sit after the Privacy \| Terms links**, and they are hidden by CSS, not a script (see [No layout shift](#no-layout-shift)). |
| — | **No layout shift** | [`no-shift.css`](./no-shift.css) at the top of the form's **Custom CSS**, and **no hide script**: delete any Custom HTML element whose script hides the `privacy_*` fields. |
| — | **Styling** | Matches the site, not GHL's defaults (Inter, grey `#D0D5DD` borders, blue `#155EEF` button). See [Styling](#styling). |
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

The Mason Park forms (2026-10) also had a Custom HTML element at the bottom holding a script that hid
the 11 fields by their label text. It is replaced by [`no-shift.css`](./no-shift.css): delete it.

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

1. **Find every form on the site, not just the contact page.** Ad landing pages, `/appointment`
   and campaign pages carry their own forms, and those are the ones reviewers keep flagging. Grep
   each page (the sitemap leaves ad pages out, so add them by hand):
   `curl -sL -A Mozilla/5.0 <page> | grep -oE "widget/form/[A-Za-z0-9]+"`.
2. **Know the practice's sub-account.** The location id of the site's own contact form (gate output,
   `location …`) or the client runbook. Every form on the site must live there.
3. **Read where it stands** (no login, submits nothing):
   ```bash
   cd deliver/process/tools/termly-ghl-consent
   node gates/check-ghl-form.mjs --standard --origin https://www.<client>.com      --legal "<X PLLC DBA Y>" --location <locationId> <formId> [...] > output/ghl-forms.log 2>&1
   ```
   Each `PROBLEM` line is one thing to fix. Beyond the standard it fails on: a form in **another
   practice's sub-account** (its leads land in that practice's CRM), a consent box that does **not
   name the legal name**, a single consent box, and a submit **redirect that does not answer 200**.
4. **Collect the inputs**, all from the live site — never invent them:
   - **Legal name**: the first line of the site's `/privacy-policy` ("X PLLC DBA Y").
   - **Origin**: the production origin (`https://www.…`). Both `/privacy-policy` and
     `/terms-of-service` must answer 200 there; build the missing page first.
   - **Services**: the site's `/services/*` pages grouped into 8–12 patient-facing choices, plus *Other*.
     If the sub-account already has a `Service` field, **reuse it as is** (its options are shared).
   - **Campaign / landing-page forms**: no service dropdown; the thank-you URL (must answer 200)
     and the Submit label the campaign asks for. Gate them with `--landing`.
   - **Styling**: `node site-style.mjs <page>` ([Styling](#styling)).
5. **Run Codex**, one form per run, one after another (same sub-account). Fill the placeholders in
   [`codex-instruction.txt`](./codex-instruction.txt) and run it with writes allowed:
   ```bash
   node deliver/process/tools/codex-computer-use/codex_cu.mjs "<filled instruction>" --allow-writes --model gpt-6.1-sol --timeout 40
   ```
   For a **new** form, say so and have Codex create it from blank: it must never open an existing
   form, not even to copy its style (2026-10-02: an open builder on a live lead form looked like
   an edit, and the user stopped it). Give the style from the site's tokens instead. A form in the
   wrong sub-account is not moved: build it new in the right one, swap the embed, retire the old one.
6. **Gate again** (step 3). It must print `ok`. Then look at the form once on the live page in a
   normal browser: in automation the embed stays hidden behind Cloudflare Turnstile.
7. **Record** it in the client runbook: form id, the service list, the legal name used.

## Styling

Every form takes the site's look, read from the live page — never typed from memory and never
GHL's defaults. `site-style.mjs` drives the installed Chrome headless, reads the page's computed
styles (body font and colour, heading colour, the main call-to-action button, an input if the page
has one) and prints the values to set in the form builder's **Styles** panel:

```bash
cd deliver/process/tools/ghl-forms
node site-style.mjs <page with the form> > output/site-style.json                         # what to set
node site-style.mjs --compare <formId> <page with the form> > output/site-style.log 2>&1  # what differs now
```

| Builder setting | From the site |
| :--- | :--- |
| Label + input + placeholder font | body font family and size |
| Label colour, input text colour | heading colour, body colour |
| Input background, border, corner radius | the site's input, else white, body colour at 20%, the button's radius |
| Button background, text, radius | the main call-to-action button (colour, font, weight, case, radius), full width |
| Consent and Privacy/Terms text | body font, 14px, body colour, **as a Custom CSS rule** on `.tnc` / `.terms-text-container` (`!important`): the Styles panel and inline text styles do not reach GHL's mobile copy of the consent text |
| Form background | transparent, so the page's card shows through |
| Custom CSS | [`no-shift.css`](./no-shift.css) first, then the styling block |

Give Codex these exact values in the instruction (step 5) and run `--compare` again after it
saves; it must print `style ok`. A font the builder does not list (a site's self-hosted variable
font) gets the closest Google font of the same family, named in the client runbook.

Read 2026-10-03: Mason Park's contact form is still on GHL's Inter (site: Nunito Sans, Karla
uppercase button `#8C6349`, 2px radius); even the Grand Mission model uses Arial and GHL's blue
button against a Montserrat site. Styling is new to the standard, so no form passes it yet.

## No layout shift

Every form must hold its height from the first paint. GoHighLevel serves the form as HTML that
already includes the 11 hidden consent fields, **visible**, and its JavaScript only takes over
2–3 s later. The old in-form hide script ran after that, so every form loaded about 2,250px tall and
then collapsed to about 1,100px. Cloudflare Turnstile (the captcha) then grew from 27px to 100px.

[`no-shift.css`](./no-shift.css) fixes both. The form's Custom CSS is served in the page `<head>`,
so it applies before anything is drawn:

- **Consent fields:** 7 of the 11 carry `data-q="privacy_…"` and are matched by it. The 4 consent
  **dropdowns** (`analytics`, `advertising`, `ad_user_data`, `ad_personalization`) carry no
  attribute CSS can match; only their label text names them. So the second selector hides every
  element **after the Privacy | Terms links**, except one holding a button or an iframe. That is why
  the 11 fields must be the last elements, after the links. The gate checks the order.
- **Captcha:** `min-height: 100px` on `.captcha-container`, the height Turnstile settles at for a
  real visitor (measured in a signed-in Chrome, 2026-10-04). Headless Chrome gets an interactive
  challenge plus an error line (136px); that is automation only.

Measured 2026-10-04 on Mason Park *Contact*, *Invisalign* and *Kids*, at 1348px and 375px, script
off and CSS on: 0/11 fields visible at first paint, prefill from the URL still fills dropdowns,
checkboxes and text fields, and the largest jump fell from ~1,150px to ≤36px (the headless-only
challenge line).

**GoHighLevel reformats the Custom CSS box** when it loses focus: it re-indents, strips the quotes
from attribute selectors (`[data-q^=privacy_]`) and can drop the `#_builder-form` prefix from the
existing rules. All of that is valid and expected. `no-shift.css` is written unquoted so it survives
the reformat, and Codex must save anyway (the first Kids run stopped at the reformat and saved nothing).

Live since 2026-10-04 on every GHL form embedded on an Instatic site: Mason Park *Contact*, *Invisalign*,
*New Patient Special* and *Kids*; Dr. Nahlah *Alexandria* `g7FeioS7e7quSCxIQHRw` and *McLean*
`axgcdqEPUFoHF8Dt5Nji`; IFA `cxtQ5q29TfUr3cYlMmDB`; Stone Surgical Arts `Nzf3xQVLhgMlABuVMxCN`; Stone Med
Spa `Gqnb0W1NH95MjROPRaLe` (gate ok, style ok, the same height from the
first paint to fully loaded at 1348px and 375px).

Still open: on the site, GHL's embed carries `data-height` from the builder. Mason Park's form says
`2442`, because the builder counts the hidden fields. Whether `form_embed.js` sizes the iframe to
it before resizing is not yet measured.

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

- **A form copied from another practice stays in that practice's sub-account.** Mason Park's two
  *Google Ads* forms (`YbX91GhEDKkCN4GH4gka`, `AFu5BpJpMjgSnSf8yybc`) live in **Grand Mission's**
  location `mZ2q3yXtue090i2YLcrj` and link to grandmissiondentistry.com's privacy pages: any lead
  from them lands in Grand Mission's CRM. They are off the site since 2026-09-25 but still exist.
  `--location` catches this; copy the *fields* by snapshot, then build the form in the right account.
- **Landing-page forms are where the errors hide.** Contact pages get checked; campaign forms
  don't. Mason Park's Invisalign and New Patient Special forms had no consent element, no links and
  redirected to 404 thank-you routes while the contact form passed. Always gate every form on the site.
- **Claude in Chrome cannot build GHL forms.** The builder is a cross-origin iframe (no `javascript_tool`
  reach), elements are added only by drag-and-drop and a synthetic drag does not register; on a
  758px-high laptop screen the *Customized* tiles (T & C, Text, Html) are cut off too. Use Codex; if
  its Chrome plugin fails ("Unable to load browser request-header policy", often after a network
  drop), restart the ChatGPT app and rerun. That error is the plugin's Statsig feature-flag load
  (`ab.chatgpt.com`) failing in `browser-service.mjs`; on 2026-10-03 an app restart did not clear
  it, and the registry entry the plugin blames was present. Next: reinstall the Chrome plugin from
  the ChatGPT app, then restart Chrome.
- **Polish the first pass misses** (seen on both Mason Park landing forms): GHL keeps the first
  consent box at 16px and the second at 14px, a required field with an empty label shows a stray
  `*` above it, field spacing is uneven, and the Privacy/Terms links stay GHL blue. Set the consent
  text size, the link colour (site link or body colour) and the field spacing explicitly in the
  styling step.
- **Hide the consent fields with CSS, never a script** ([No layout shift](#no-layout-shift)). A
  script in a Custom HTML element runs only after GHL's JavaScript loads, so the 11 fields show for
  2–3 s and the form then collapses by ~1,150px. The gate fails a form that still carries one.
- **Never turn the form-wide *Show Label* switch off.** The 11 consent fields are hidden only while
  labels are on; with it off GHL renders them as empty dropdowns, true/false boxes and blank inputs
  below the links (Invisalign form, 2026-10-03, reverted in minutes). The gate now fails
  `formLabelVisible: false` on any form with consent fields. A stray `*` above a placeholder-only
  field means the field is required with an empty label; it goes when the field is optional (the
  Grand Mission model) — an owner decision, see open question 1.
- **Check the whole public form, not a viewport.** Codex's verification screenshots stop at the
  links. Render the full height: `chrome --headless=new --window-size=900,2600 --screenshot=… <form url>`.
- **One Codex run = one small, saved step.** `gpt-6-luna` (the cheap default) finishes a step of
  one or two changes, but on a whole-form brief it stops halfway and saves nothing (kids form,
  2026-10-04). Order: (1) fields/dropdown, (2) consent + captcha + links, (3) styling, each ending in
  Save + a public-form check.
- **Style with one pasted Custom CSS block, not the Styles-panel menus.** Luna's Styles-panel save did
  not reach the public form and the panel's font menu lacked Figtree; one exact CSS block (Google
  Fonts `@import`, `#_builder-form` labels/inputs/button/`.terms-text-container`/links), pasted by
  `gpt-6.1-sol`, worked first time. Exception: **single-line field corner radius** comes from the
  Styles panel's field radius setting — GHL's own field CSS outranks custom CSS there.
- **GHL renders the consent text twice: a desktop copy and a mobile copy.** The mobile copy
  carries the builder's own inline fonts (Inter 16px for box 1, Roboto 14px for box 2 on Mason Park's
  landing forms, 2026-10-04), so a form styled only through the builder looks right on desktop and
  off-brand on phones. It also reflows the form ~44px once GHL's JavaScript runs. Fix it with the
  `.tnc` / `.terms-text-container` Custom CSS rule. `--compare` now also renders the form as a 375px
  phone and fails off-brand consent text.
- **Consent text is typed, not pasted** (IFA, 2026-10-04): Codex pasted box 1 with a chunk of the
  captcha's markup (`<div id="cf-turnstile-…">`), which rendered as ~130px of blank space between the
  boxes. The gate now fails a consent box carrying `div`/`iframe`/widget markup.
- **The captcha has no label.** GHL labels a new Captcha element *Bot protection*; the standard
  (Mason Park) leaves it empty. The gate fails a labelled captcha, and a missing one.
- **GHL stores the consent text as HTML**, so `&` arrives as `&amp;` (sometimes `&amp;amp;`); the gate
  decodes entities before matching `--legal` (Dr. Nahlah's "Implants & Prosthodontics").
- **Close what you open.** Each Codex brief says: reuse an open tab already on the form, else open one
  and close it before reporting. Builder tabs left by earlier runs stay claimed by their old session
  and only the user can close them (two were left on 2026-10-04: McLean and Stone Med Spa, the second
  holding a failed run's unsaved edits — close those without saving).
- **`site-style.mjs` reads the site's real call-to-action** (2026-10-04): it skips cookie-banner
  buttons (it had picked Termly's black *Decline* on Dr. Nahlah) and reads **gradient** buttons
  (Dr. Nahlah's gold, IFA's yellow) by their first stop. A gradient site button gets the full
  `linear-gradient(...)` as the form button's `background` in Custom CSS, not the flat base colour.
- **`site-style.mjs --compare` measures the rendered public form** (fonts, button colour, field
  radii, consent sizes), so CSS-styled forms are judged as visitors see them.
- **GoHighLevel signs out mid-session** (`app.gohighlevel.com/?logout=true`, "Sign into your
  account"). Codex never enters credentials: the user signs in, then the step reruns.
- **Codex runs on the workspace's credits.** "Your workspace is out of credits" ends a run mid-edit;
  whatever was saved stays saved. Gate and `--compare` the form to see what landed.
- **Tabs left by a failed run stay claimed** ("already claimed by another browser session"). Tell
  the next run to open its own tab and close it.
- **A Codex run that loses the browser saves nothing.** "Debugger unattached" or a dropped
  connection ends the run before *Save*; gate the form to confirm it is unchanged, then rerun.

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
| Mason Park | `JuzM9SxuJMPDMwfO6cgj` *Contact form* (`/contacts`) | **Site-form reference.** Standard 2026-10-03; styled + polished (Nunito Sans, 14px consent, grey underlined links, 16px gaps) the same night: gate ok, style ok. **No-shift CSS 2026-10-04**, hide script deleted. |
| Mason Park Kids | `pyYcEmfIvtv5LwB1s4X6` *Contact form* (`masonparkpediatricdental.com/contacts`, location `ayfI5c9B3HDoNAubf1Sj`) | 2026-10-04: existing kids Service field kept (10 options), consent names **Mason Park Dental for Kids** (no legal entity, user's decision), captcha above Submit, kids-site links, Figtree + `#93644A` pill via Custom CSS. **No-shift CSS 2026-10-04**, hide script deleted. |
| Mason Park | `jRr3J74MVYjrYAsp4zZD` *Contact Form Invisalign* (`/ads-landing-pages/invisalign*`) | **Landing reference.** 2026-10-03: no dropdown, two consent boxes, links, *Book My Free Consultation*, redirect `/ads-landing-pages/invisalign-thank-you`, site styling. Gate `--landing` ok, `site-style --compare` ok. |
| Mason Park | `jEXtvRc1ObkKd1QvmSGn` *Contact Form New Patient Special* | Same, *Claim My $189 Visit*, redirect `/ads-landing-pages/new-patient-thank-you`. ok / style ok. |

| Dr. Nahlah (Alexandria / McLean) | `g7FeioS7e7quSCxIQHRw` / `axgcdqEPUFoHF8Dt5Nji` | Standard 2026-10-04: two boxes per office entity, per-office legal pages, Raleway + gold gradient. Gate ok, style ok. |
| IFA | `cxtQ5q29TfUr3cYlMmDB` | Standard 2026-10-04: new *Service* dropdown (12), captcha, Poppins + yellow gradient. Gate ok, style ok. |
| Stone Surgical Arts | `Nzf3xQVLhgMlABuVMxCN` | Standard 2026-10-04: captcha, `www` links, Inter + green button. Gate ok, style ok. |
| Stone Med Spa | `Gqnb0W1NH95MjROPRaLe` | Standard 2026-10-04: consent names **Westlake Medical Aesthetics** (its own policy), single *Service* dropdown replaced the multi-select. Gate ok, style ok. |

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
