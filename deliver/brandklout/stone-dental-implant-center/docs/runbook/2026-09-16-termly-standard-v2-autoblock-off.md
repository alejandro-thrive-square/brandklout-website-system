# 2026-09-16 — Termly standard v2: auto-block off, no allowlist (LIVE)

## Done
- Decided the standard for all sites: Termly `autoBlock=off` above GTM, no allowlist, trackers outside
  GTM tagged `type="text/plain" data-categories="..."`, GHL connection script v2.0.0 in the footer, and
  a Consent Preferences link in every footer. Kit and install steps are in
  `deliver/brandklout/snippets/termly-ghl-consent/README.md`. The allowlist snippet was deleted
  (it is in git history).
- GTM `GTM-MF9C6BGG` fires only the GA4 Google tag `G-CKF75GSYFM`, which respects Consent Mode.
  Termly still sets the defaults to `denied` with auto-block off.
- Stone Dental, via MCP, then full publish to both domains:
  - **Head:** Termly `?autoBlock=off`, then GTM, then the font CSS.
  - **Footer:** `number_pool.js` and `user_session.js` tagged `advertising`, GHL connection script v2.0.0.
  - **Rollback copies:** `workflows/08-qa/.tmp/head-after-2026-09-16.html` (allowlist era) and
    `footer-before-v2-2026-09-16.html`. The files now live are `head-v2-…` and `footer-v2-…`.
- Live check (`workflows/08-qa/.tmp/termly-ghl-consent-check.cjs live <paths>`): 4 pages × no choice /
  Decline / Accept, all pass.
  - Every case: `Webflow` object, 0 autoblocked, 0 placeholders, all embeds loaded.
  - No choice and Decline: call tracking not requested, form values `denied`.
  - Accept: call tracking loads, Consent Mode updates to `granted`, form values `granted`.

## Next
- Add a Consent Preferences link to the 4 live ad landing pages: all-on-x, all-on-x-consultation,
  all-on-x-landing-page-chat-gpt, thank-you-all-on-x. Not done; waiting on the user.
- `/about` returns 404.

## Gotchas
- With auto-block off, an untagged tracker added outside GTM runs before consent.
- The GHL form iframe calls GHL's attribution `create_session` once before consent, from inside the
  iframe. No site script can change that.
