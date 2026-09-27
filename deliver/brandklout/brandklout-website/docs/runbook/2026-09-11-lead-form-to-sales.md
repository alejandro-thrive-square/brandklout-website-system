## 2026-09-11 (night): the home "Check my market" form emails sales@brandklout.com

Asked: "sales@brandklout.com — this is the email for the homepage form". Before that: no lead email
existed on brandklout.com (it had no form; its `privacy@`/`legal@`/`hipaa@` addresses are the legal
pop-up's contact lines), and Instatic sends no email and runs only `cms` forms (trap 42).

### Done

- **Relay: FormSubmit** (`https://formsubmit.co`). Free, no account; it emails every POST to the
  address in its URL, as a table, with the visitor's `email` field as reply-to.
- `patches/index.html.mjs` #12 replaces Sang's handler (which cancelled the submit and showed his
  message) with one that POSTs the form's fields as JSON to
  `https://formsubmit.co/ajax/sales@brandklout.com`, subject *New "Check my market" lead from
  brandklout.com*. The browser's `required` checks run first, as in his page. The button is
  disabled while sending. On success the form resets and his `#success` message shows; on failure an
  alert says so and gives the address. The legal pop-up's script moved to the FAQ line as its anchor,
  so the two patches don't overlap.
- Plugin `brandklout.embed-origins`: `connectOrigins` is now `https://sheetdb.io
  https://formsubmit.co`. `verify-live` fails `/` if its CSP lacks formsubmit.co. `form-probe`
  captures the POST (after letting the CORS preflight through) and aborts it, so **no test email is
  sent**.

### Gates

Published `{"publishedPages":7}`, seq 12. Home CSP: `connect-src 'self' https://sheetdb.io
https://formsubmit.co`.

- `verify-live` FAIL none (7/7 titles; new check: `/` allows formsubmit.co). `css-parity` FAIL none.
- `form-probe`, lead form: the POST left the browser to
  `https://formsubmit.co/ajax/sales@brandklout.com` as `application/json` with `name, email,
  practice, market, service, budget, problem, _subject, _template`. The CORS preflight passed, so
  FormSubmit accepts this origin. The POST was aborted, so no email was sent. Because of the abort,
  the page took its failure path: the alert, with `#success` still hidden. That is the right
  behaviour for a failed send. The legal pop-up, FAQ and survey checks still pass.
- `visual-diff` / `compare-live` not re-run: this publish changed only script code, not markup or
  CSS. Last run: home 0.015% / 0.031%, 9 benign findings.
- The one console 404 on the home page was already in the v1 probe; it is not this change.

### Waiting on someone at sales@brandklout.com

**FormSubmit sends a one-time "Activate form" email to sales@ on the first submission, and
delivers nothing until it is clicked.** Nobody has submitted yet (the probe aborts its POST), so
the first real lead will trigger the activation and may not itself arrive. The clean way: someone
submits one clearly labelled test from the review link, whoever reads sales@ clicks Activate, then
confirm the next test arrives. Only then point the domain at the site.

### Flag for Sang (his copy, not changed)

The success message still reads "Prototype form submitted. Connect this form to your CRM /
calendar in production." It now shows after a real, delivered submission. The privacy line still
says "Replace this prototype text with your final privacy language."

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
