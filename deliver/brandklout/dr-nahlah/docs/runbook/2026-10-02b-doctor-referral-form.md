# 2026-10-02b — /doctor-referral rebuilt: PDF downloads, a native PDF-style referral form into GHL, the review wall

Asana `1219086723228800` "Add Referral Form to Website" (assignee Alejandro, due 2026-10-02).
Brief: a dedicated referrals section like `stonedentalimplantcenter.com/patient-forms`, the two
attached PDFs (Front = referral form, Back = About Dr. Nahlah) as downloads, and the form as a
GoHighLevel form.

**State: LIVE ON STAGING ONLY.** The client asked to review staging before production
(2026-10-02). Production `/doctor-referral` is still the old page.

## Done

| Commit | What |
| :--- | :--- |
| `52b84713` `4ba9e929` | `/doctor-referral` = **hero › #referral-forms › #referral-form › #patient-reviews**. The six sections below the form (experience, capability, study-club, refer, next, book) were removed (client: "they don't serve any purpose there", including the two-office booking block). Hero buttons: "Refer a patient" → `#referral-form`, "Download the referral form" → the PDF. |
| | **#referral-forms**: this site's `.pk-split`, the preview card `referral-form-card.jpg` (page 1 of Front.pdf on cream at 4:3, made with headless Chrome so the split's `object-fit:cover` does not crop it), copy with the fax number, two buttons. |
| | **#referral-form**: `partials/referral-form.html`, ONE embed snippet (markup + `<style>` + `<script>`) laid out like the paper: gold bands, underlined pairs, 01–16 tooth chips, two column-major checklists. `build-site.mjs` now inlines `<!--#include partials/x.html-->`. It POSTs JSON to the GHL Inbound Webhook (CORS is open on it), with phones as `+1XXXXXXXXXX` and empty fields omitted. Honeypot + 4 s minimum. No file upload (a webhook carries no files): radiographs go by fax or with the patient. |
| | **#patient-reviews**: a fresh-id clone of the home page's `#reviews` block with the live ReputationHub Embed. |
| | Push: `22-instatic-api-sync/push-referral-page.mjs` (`--apply`, `--publish` guarded to this page only). It has an **update mode**: on an already-restructured page it only replaces the form snippet. |
| | **PDFs**: Instatic media refuses PDFs (400: images/video/fonts only). They are served by the `drnahlah-files` Worker on `agency-45e.workers.dev` (`14-…/deploy-referral-pdfs.mjs`, PDFs embedded base64), and `drnahlah.com/patient-referral-form.pdf` + `/about-dr-nahlah.pdf` are 302 rows in `drnahlah_301` (`add-referral-pdf-redirects.mjs`). Both answer on www and staging. |

### GoHighLevel (McLean sub-account `xJDu1mFoW5jFYTNqmuk7`, all via Codex computer use)

- Workflow **Website - Doctor Referral** (`b533da17-bfc3-4774-afd4-f682fb821d9d`), **published**.
  Trigger Inbound Webhook `…/hooks/xJDu1mFoW5jFYTNqmuk7/webhook-trigger/6a4edb9c-f6ef-4607-b759-dd3855fd9212`.
  Steps: Create/Update Contact (first/last name, phone, DOB, source, + custom fields Referral date,
  Referring doctor, Referring doctor phone, Doctor comments) → tag `doctor-referral` → a 13-line
  note with every field.
- Custom field folder **Referral Form**: Referral date, Referring doctor, Doctor comments,
  Upper teeth, Lower teeth, Reason for referral, Additional information, Radiographs or records
  (+ Referring doctor phone outside the folder). The checkbox ones are not mapped (they reject
  text); the note carries them.
- **Verified end to end** from the staging page: contact "TEST Referral Website Three" with source,
  tag, fields and the full note.
- Abandoned: GHL builder form `NZgQWT70a54fLzOUe1b0` "Patient Referral Form - Website", half
  built, embedded nowhere (client found the builder form "odd"; the native form replaced it).

## Next

1. **Client reviews staging**, then production: `node push-referral-page.mjs` (plan) →
   `--apply` → `--publish` against production (no `INSTATIC_BASE_URL`). Production still has
   the old layout, so it runs the full restructure, not update mode. Then an Asana comment and
   complete the task.
2. **No office alert** on a new referral (client: none for now). Codex could not get GHL's in-app
   Internal Notification to persist. Add one when the client names an address.
3. Delete the TEST contacts "TEST Referral Website", "… Two" (never created, the workflow
   errored), "… Three" (exists) and the abandoned builder form, once the client agrees.
4. Media (`referral-form-card.jpg`, the two PDFs in `site-src/assets/`) is gitignored and not yet
   in R2: `node scripts/assets.mjs push --client dr-nahlah --no-worktrees`.

## Gotchas

- **GHL Create Contact "no differentiation field value … Email or Phone"** had two causes in
  turn: mappings saved as plain text (`phone`) instead of the picker token
  `{{inboundWebhookRequest.phone}}`, and before that a bare 10-digit phone / empty date fields.
  Read the execution log's step error, not the 200 from the webhook.
- **The Inbound Webhook trigger only saves after a sample arrives**, and an unsaved trigger's URL
  is thrown away. Have Codex add the trigger AND send the sample (curl) in the same run.
- **Codex tabs**: a tab Codex opens or marks stays bound to that run, so later runs can't claim it
  and open another. Fixed in the wrapper on main (`47d65e1f`, `b1379d58`, `ca184637`): reuse open
  tabs, never `markDeliverable()`, close own tabs before reporting.
- **The Chrome extension can't read local files**, so Codex cannot upload a local file to GHL.
- **The Cloudflare token still 403s on zone Worker routes**, but a new Worker script and its
  workers.dev switch work.
- **Element screenshots of this site in headless Chrome** come out offset or blank (ScrollSmoother
  + reveals). Check a snippet on a bare page with `site.css`, and check the live page by its DOM.
- In a page body comment, never write `<!--#include-->` literally: the `-->` closes the comment.

## Version Control

Follows the root rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
