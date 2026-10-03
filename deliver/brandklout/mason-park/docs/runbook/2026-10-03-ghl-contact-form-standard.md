# 2026-10-03 — GHL Contact form brought to the lead-form standard

The user asked for the Grand Mission form as the example (`HHUjLT7QwNmfVq4yjxw5`), **without** its
language dropdown, plus a service dropdown, the compliance checkbox and real Privacy/Terms links.

## Done
- **Form `JuzM9SxuJMPDMwfO6cgj` "Contact form"** (the one on `/contacts`), sub-account Mason Park
  Dental of Katy `9tm8C3iReDUyrhdV01Kd`, edited by Codex computer use (`--allow-writes`) and saved.
  Public order now: First Name, Last Name, Email, Phone, **Service**, Message, **care consent**,
  **marketing consent**, Request Appointment, captcha, **Privacy Policy | Terms of Service**.
- **Service**: new contact custom field (tag `kSncQKFQKevIZBVgTTaf`), Single Dropdown, required.
  Options: Cleanings & Exams · New Patient Visit · Dental Implants · Invisalign · Cosmetic Dentistry
  (Veneers, Bonding, Whitening) · Crowns & Bridges · Dentures · Root Canal · Extractions & Wisdom
  Teeth · Emergency Visit · Other.
- **SMS consent**: GHL Terms & Conditions element, both boxes optional and unchecked, legal name
  **Mason Park Dental PLLC DBA Mason Park Dental of Katy** (from `/privacy-policy`).
- **Links**: `https://www.masonparkdental.com/privacy-policy` and `/terms-of-service`, new tab
  (were `https://www.example.com`).
- Untouched: the 11 hidden consent fields, captcha, Submit label, inline thank-you message, styling.
- **Verified keyless**: `check-ghl-form.mjs --standard --origin https://www.masonparkdental.com`
  FAIL (4 problems) before, `ok` after. The site embed needs no change (same form id).
- The process is now a guide on main: `deliver/process/tools/ghl-forms/README.md` (`b9b7722a`).

## Next
- **`/terms-of-service` still says the site is at `https://bestdentistinkatytx.com/`** (old domain).
  Fix the page copy to www.masonparkdental.com.
- The ad-page forms (Invisalign, New Patient Special, the Google Ads forms) are not yet on the
  standard; run the gate over them. BugHerd #256 (a Submit label) is still open.
- Look at `/contacts` once in a normal browser: Turnstile hides the embed from automation.

## Gotchas
- Codex opened a new GHL tab because the open one was another location's form editor, and closed it after.

## Version Control
Follows the root rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
