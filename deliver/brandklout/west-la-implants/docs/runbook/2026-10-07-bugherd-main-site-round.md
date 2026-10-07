# 2026-10-07 · Brandklout BugHerd round on the main site (project 541030): 14 pins closed, 1 waiting

Fifteen open pins from `agency@brandklout.com` (#19-#28, #30, #35-#38), pulled with screenshots and
attachments by id. Everything went into the live draft as surgical edits written against each row's
seq, with guarded publishes (seq 35-38). No full push.

## Done

| Pin | Page | Change |
| :-- | :-- | :-- |
| #19 | /bone-grafting | "Four ways to put bone back." -> "Three ways to rebuild bone *support.*" (three cards) |
| #20 | /missing-teeth | "Four choices. Only two…" -> "Three choices. Only one puts a root back in the bone." |
| #22 | /faq | Cover photo: no parallax (`.par` overscan hid the top), focal 60% 20%: both faces in frame |
| #23 | /faq | Invitation lead "Request a call from our team."; cover button "Ask Your Own" -> "Request a Call" |
| #24 | all 87 | Every H1 (`.display`) in Playfair Display 600: variable woff2 (Latin, upright + italic) uploaded as media, `@font-face 'Playfair Display WLA'` in `css/05-site-review.css` (live `src/styles/wla-site-review.css`, now in `TOKEN_FILES`). Section titles keep Bodoni Moda |
| #26 | / | Answer card 1 (Dental Implants) -> the attached render, `dental-implant-crown-placement.png` |
| #27 #36 | all | YouTube `@westlaimplants892` (404, copied from WordPress) -> `@westlaimplants` (82 links) |
| #37 | all | Zocdoc `booking-link/practice/…` (opens blank, checked in a real browser via Codex) -> `zocdoc.com/practice/west-la-implants-65990` (324 links) |
| #28 #30 | / | Experience heading "Advanced dentistry. Care centered on *you.*"; lead = reviewer's copy (em dash -> comma) |
| #38 | /dental-implants | Statement smaller and left; `nav.st-services` with the 8 Dental Implants services on the right (`section[data-st-services]`) |
| #35 | 80 pages | The prototype `.in-form` (said "Thank you" and sent nothing) -> GHL **Contact (new site)** `DCNQTSgl14CNZ93H7Fi3` embedded directly (`apply-ghl-site-forms.mjs`) |
| #21 | /referring-doctors | New GHL **Referral (new site)** `dnR28L5agKj0fQiuZcuH` (duplicated from the contact form: provider = contact, patient name + phone required, "Send referral") |

Both forms: email notification on (noreply@westlaimplants.com, westlaimplants@gmail.com,
jessica@thrivesquare.com, subject "Website Form Submission"), redirect `/thank-you`, the marketing
consent ends "Consent is not a condition of purchase." (built and verified by Codex).

**Waiting:** #25 (All-on-4 card image): the pin has no attachment. A comment asks the reviewer to re-attach it.

## Proof

- All 87 pages snapshotted before and after each publish. The only differences are the changes above
  plus the new stylesheet bundle.
- `check-embed.mjs` (main): 34 linked pages, one GHL frame each, none lazy.
- The snapshot shows the forms on 84 pages (80 main + 4 ad form pages), referral on /referring-doctors
  only, 0 prototype field grids, 0 dead YouTube/Zocdoc links.
- Screenshots: /dental-implants statement 1440; /faq cover 1440; Playfair H1 at 1440 and 390 (no
  clipping in the line masks).
- `insta-api` restored dropped `seoTitle`/`seoDescription` cells on 34 + 33 pages during the saves.
- The source matches: rebuilt `dist` carries every change (`statement({services})`, `cover image.still`,
  copy, links, image).

## Gotchas

- **A read-back that compares raw JSON reports new nodes as "differ"**: the server re-orders node keys.
  The patch scripts now compare canonically (sorted keys). The first `apply-bugherd-site` run stopped
  before publishing on that false alarm; `gpub` proved the draft held only this run's 81 pages, then
  published.
- **The forms are not in `site-src`**: `invite()` still renders the prototype. After ANY `push-site.mjs`,
  run `apply-ghl-site-forms.mjs --apply --publish` (and `add-ghl-forms.mjs` for the ad pages).
- The script left by an earlier session, `add-ghl-contact.mjs` (untracked), does the same surgery
  without per-page forms or a publish guard; `apply-ghl-site-forms.mjs` supersedes it.
- `fp-*` focal rules exist for every 10% step; look them up by `name`, not `kind`.
