# 2026-09-25 — Every "Book" button goes to /contacts; Contacts is the hero and the form; the client's GHL forms

The client sent three GHL forms (`workflows/01-content-intake/.tmp/scripts.html`) and asked:

> make sure every "Book Consultation" goes to the Contacts page and the Contacts page should only
> have a hero section and the form section. Nothing else. Right now a lot of buttons go to flexbook.

The user settled two questions: the **Invisalign** and **New Patient Special** forms go on the
**ads landing pages** (replacing the Google Ads forms), and the button **wording stays** as it is.

**Done and live on staging and production** (commit `dc97da01`).

## What changed

- **Links.** Every Flexbook link in the build (1,559 on 404 files, pages plus generators plus the blog
  build) is now `href="/contacts/"`, same tab. Instatic publishes it as `/contacts`. On production,
  25 production-only rows (old pages: team, old service slugs, FAQs, legal, `appointment`...) carried 35
  "Schedule Online" Flexbook links. `bugherd/patch-old-flexbook.mjs` changed them in place (`base.link`
  hrefs only).
- **Contacts** (`home/contacts/index.html`): the arrival (its "Book online" now jumps to `#form`) and
  a new `.ch-contact-form` chapter holding the GHL **Contact form** `JuzM9SxuJMPDMwfO6cgj`. The reach
  cards, map, doctors, proof, invitation and breadcrumb are gone. CSS is the "Contact is the hero and
  the form" block at the foot of `site.css`.
- **Ad pages** (`/ads-landing-pages/`): **Contact Form Invisalign** `jRr3J74MVYjrYAsp4zZD` on the
  Invisalign landing and consultation pages, **Contact Form New Patient Special**
  `jEXtvRc1ObkKd1QvmSGn` on the $189 pair. `build-ads-landing-pages.mjs` carries the ids and heights
  (re-run output is byte-identical to the pages). The six **root** Webflow-port ad pages the live
  ads use are unchanged and still carry the Google Ads forms.
- `.tmp/site-forms.json` holds the three snippets verbatim. `place-ad-embeds.mjs` fills each slot by
  the form id it carries and now also fills `/contacts`.
- The ad-hero form slot reserves 44rem, down from 50rem: the new forms settle at about 715px.

## How it was pushed

Backups: `backup-staging...2026-09-25T13-53-28.json`, `backup-www...2026-09-25T13-53-32.json`, and
`backup-www...2026-09-25T14-39-10.json` before the old-page patch.
`bugherd/push-contact-forms-2026-09-25.sh` (the page chain plus the blog-template chain; articles
untouched) ran with `TARGET=staging`, then again (after the slot-height change) with `TARGET=staging`
and `TARGET=production`. Staging has 63 pages published and production 94, draft == published on both.

## Verified

- `check.mjs`: 229 pages, 0 errors.
- `bugherd/check-contact-forms-live.mjs <base>` checks every row plus all 161 articles. Staging:
  222 URLs, 0 problems. Production: 253 URLs, 0 problems.
- `probe-ad-form-box.mjs`: the forms fill their cards (Contacts 704px wide, ad heroes 514px). Screenshots
  were taken at 1440 and 390, with no overflow.
- `type-diff.mjs --all` (the root ad pages, after the stylesheet change): 0 styled differently.

## Gotchas

- **Instatic strips the trailing slash** from `/contacts/`. A gate matching `href="/contacts/"`
  counts zero.
- **Production-only rows are outside the build.** A site-wide link change needs a live patch for
  them, and a gate that reads the instance's rows, not the local pages.
- **The production draft differed before this push**: someone opened `.is-lg` in the editor at
  13:35 and left `backgroundColor: ""`. It is harmless, and it was published with this push.
- The Turnstile "complete the challenge" message in the automated screenshots is Turnstile refusing
  automation, not a broken form.
- `converted-pages.json` holds the **templates** after this chain (the template steps overwrite it).
  Every chain rebuilds it, so never run `place-ad-embeds` on its own after one.

## Open, for the client

- **GHL redirects (the user is setting them):** the Invisalign form redirects to `/thank-you-invisalign`
  and the NP form to `/thank-you-new-patient`. Neither route exists. The ad thank-you pages are
  `/ads-landing-pages/invisalign-thank-you` and `/ads-landing-pages/new-patient-thank-you`. The
  Contact form shows GHL's default inline message ("We appreciate your feedback!").
- The cookie and privacy policies still name FlexBook as a service in their text.

## Version Control

This run file follows the runbook rules in [SYSTEM_RULES.md §5](../../../../../SYSTEM_RULES.md).
