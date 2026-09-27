# 2026-09-25 — The Privacy Policy, rebuilt as a site page

The user asked: "the privacy policy should be created".

Before this run, staging had no `/privacy-policy`. Production served the old Webflow-era row
(effective 28 August 2026, with its own header), and nothing in the rebuilt site linked to it.

**Done and live on staging and production.**

## What changed

- **`home/privacy-policy/index.html`**, in the Terms of Service page's shape: the arrival, "The Short
  Version" (three cards and a ledger, each restating a section of the policy), the full policy as
  13 numbered accordion sections, and the invitation band. It was generated from the Terms page by a
  one-off script (not kept); edit the HTML directly from now on.
- **Wording**: the old production policy, carried over, with three changes:
  - FlexBook is removed from Sections 1 and 5 (booking is the GHL form on `/contacts` since this
    morning), and the GHL line in Section 5 now names the contact and appointment request forms.
  - The email address is written out (Cloudflare had obfuscated it).
  - **The effective date is now 25 September 2026**, as Section 13 requires when the policy changes.
- **Links**: "Privacy Policy" sits before "Terms of Service" in the footer legal row (232 pages and the
  generators) and in the `/ads-landing-pages/` legal line (`lp-legal_links`, 6 pages). It is also on
  the `/sitemap/` page and in `sitemap.xml`.
- On production, `import-pages --overwrite` replaced the old row by slug. Backups:
  `backup-staging...2026-09-25T15-48-08.json` and `backup-www...2026-09-25T15-48-11.json`.

## Verified

- `check.mjs`: 230 pages, 0 errors. `shot.mjs` at four widths: no overflow, clean.
- `bugherd/check-contact-forms-live.mjs` now also requires a Privacy Policy link on every page and
  13 sections on `/privacy-policy`. Staging: 223 URLs, 0 problems. Production: 253 URLs, 0 problems.
- `type-diff.mjs --all`: 0 styled differently.

## Gotchas

- **`build-sitemap.mjs` has drifted.** A re-run would add the six `/ads-landing-pages/` routes to
  `sitemap.xml` and swap the round-five building-exterior photo on `/sitemap/` for an older one. So
  both files were patched by hand; the builder's "Legal" list does include Privacy now. Diff its
  output before trusting a re-run.
- **The root Webflow-port ad pages** (`/invisalign`, `/new-patient-special` and their consultation
  and thank-you pages) link "Privacy Policy" to `Patient_Privacy_Policy.pdf` on Webflow's CDN; the
  thank-you pages have no privacy link. They mirror Webflow, so the gate exempts them.
- The policy links `/cookie-policy/`, which exists on production only (staging 404s it).

## Open

- Whether the root ad pages' Privacy link should point at `/privacy-policy`, not the PDF.
- The Terms page still says `bestdentistinkatytx.com` and mentions "external scheduling tools".

## Version Control

This run file follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
