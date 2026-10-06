# 2026-10-06e — Referral survey: SMS consent placeholders replaced, consent made optional

The user reported that the `/doctor-referral` survey showed GoHighLevel's template text in its two
SMS consent boxes: "from **[BUSINESS NAME]** about **[USE_CASE_FROM_CAMPAIGN_DESCRIPTION]**".

**State: FIXED AND VERIFIED.** The survey is GHL's own page in an iframe, so the fix is in GHL
alone. Production and staging both embed it (`widget/survey/KXFNR4JPqxonXEFTtme0`, checked on both
hosts), so no Instatic write or publish was needed.

## Done

All edits were made through Codex computer use with `--allow-writes`, in two runs. Both
`session.log`s show `browser.` calls and no `orca computer`.

| What | Detail |
| :--- | :--- |
| Survey | *Patient Referral Survey - Website* `KXFNR4JPqxonXEFTtme0`, McLean sub-account `xJDu1mFoW5jFYTNqmuk7`. Only its Terms & Conditions field was edited. |
| Box 1 (care) | The same wording as the live contact form `axgcdqEPUFoHF8Dt5Nji`, which is in the same sub-account (read keyless, its builder was never opened): "…messages from Esam Abou Nahlah, DDS, MS, PLLC DBA Dr. Nahlah Implants & Prosthodontics Specialists related to my care, including appointment reminders, confirmations, billing notices, and other account-related communications…" |
| Box 2 (marketing) | Also the contact form's wording: "…occasional marketing messages from Esam Abou Nahlah, DDS, MS, PLLC DBA Dr. Nahlah Implants & Prosthodontics Specialists, such as special offers, discounts, newsletters, and updates about services…" |
| Required | Was **on**, so a doctor had to consent to texts before submitting a referral. Now **off**. The ghl-forms standard (`deliver/process/tools/ghl-forms/README.md`, row 5) says consent is "Not required, unchecked", because A2P 10DLC rejects required consent. The setting is in the field's gear menu › General Settings (Codex's first run did not find it). |

## Verified (live widget, keyless)

- A survey version of the gate's T&C rules (session scratch `check-survey-consent.mjs`; it reads
  the slides' `slideData` from `__NUXT_DATA__`) prints **ok**:
  - `required=false`;
  - neither box has a placeholder;
  - both name the legal name;
  - neither carries pasted markup.
- Both rendered labels show the new text in the existing Roboto 14px `#141416`.
- Every other input on the survey is unchanged, apart from its required flags. The required count
  went from 4 to 3: only the consent field changed.
- No test referral was submitted.

## Gotchas

- **`check-ghl-form.mjs` cannot see surveys.** It fetches `widget/form/<id>` only, and a survey
  keeps its fields under `surveyData.formData.slides[].slideData[]`, not `fields`. That is why this
  template text went live on 2026-10-03 unnoticed. The fix belongs on main (process).
- **`slideData[].preview` keeps the template text** (`[BUSINESS NAME]` ×2) after the edit. It is
  the builder's element thumbnail, not rendered to visitors. Check `placeholder` / `placeholder2`
  (the two boxes) and the rendered `<label>`s, not a raw grep of the page.

## Addendum, same day: hero line names both offices

Brandklout's review (Jessica): the `/doctor-referral` hero lead said only "Tysons Corner". It now
reads **"A prosthodontic and implant referral practice in Tysons Corner and Alexandria. Thank you
for partnering with us."**

- `one-offs/referral-hero-both-offices.mjs` matches the line by its text, not by class, so the
  same script ran on production (old class names) and staging (Client-First). Each host was run
  with plan, then `--apply`, then `--publish`:
  - **production:** published 23:41Z, 285 nodes;
  - **staging:** published 23:42Z, 286 nodes, because staging still has the About PDF button.
- On each host:
  - exactly one `base.text` changed;
  - the read-back equals the plan;
  - no other rows moved, and the shell is untouched;
  - `insta-api` restored the SEO cells the save dropped.
- Both live pages show the new line. The title, meta description, the one JSON-LD block, the
  one H1, the survey iframe and the ReputationHub wall are unchanged.
- The line feeds no schema and is not in `/llms.txt` (`seo-v3/out`), so no SEO v3 rebuild was
  needed. The survey section's "goes straight to the Tysons Corner · McLean office" stays, because
  the survey lives in the McLean sub-account.
- Site source: `pages/doctor-referral.body.html` edited and rebuilt. Only
  `final-site/doctor-referral.html` changed.

## Version Control

Follows the root rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
