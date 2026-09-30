# 2026-09-30 — All-on-X "quiz" combo, local build

**Asana:** `1218962992162869` "Make new landing page - AOX" (Arvada, Ad-Hoc section). The link
first handed over pointed at `1218786832903900`, which is Hackensack's "Design Home Page"; the
Arvada task was found with `search_tasks` for "Arvada" modified after 2026-09-15.

## Done

- Pulled the task: `workflows/01-content-intake/.tmp/asana-aox-sung-2026-09-30/` (one attachment,
  `all-on-x-landing.html`, plus the AI audit of the current page in the comments).
- Built the three-page combo locally in `workflows/04-design/.tmp/aox-quiz/`: landing (the
  attachment, photo slots filled), consult (quiz first), thank-you (phone first, no form).
  `build.mjs` generates all of it from the attachment; read that folder's `README.md`.
- `node verify.mjs` passes 93 checks: no overflow and every image loaded at 360/390/768/1024/
  1440/1920 on all three pages, the quiz clicked through to the thank-you page on both pages that
  carry it, validation, the video lightbox, the sticky bar, one phone number, single-fire tracking.

## Next

1. Review of the local pages, then answers to the open items below.
2. Webflow build on site `693c51e685b19f0d0c149cab`. Needs a custom-code route; the v2 native
   route cannot carry this design (script quiz, pseudo-elements, `clamp()`).
3. Publishing is a separate go-ahead.

## Open, all blocking launch

- `LEAD_WEBHOOK_URL` is empty. The quiz sends leads nowhere until the GHL inbound webhook exists.
- Price: design says $18,795, the live cost page says "Starting at $17,795" today.
- Unverified claims from the attachment's own checklist (ratings, "$10,000 below", monthly figures).
- Final slugs, and whether this replaces the live All-on-X set or runs beside it.

## Gotchas

- **The attachment's head comment contains the words `<script>` and `<img>` in prose.** A first
  `indexOf('<script>')` lands in the comment; take the last one.
- **`transformation-image-1.jpg` is Chris's photo again.** The design's notes list both for the
  same section.
- **YouTube `maxres1/2/3.jpg` are alternate frames.** Anna's default thumbnail has a burned-in
  caption; `maxres3.jpg` is clean.
- **The existing GHL form `PzBilvSVUmynr9PLukbt` still redirects to
  `www.arvadadentalimplants.com/ads-landing-pages/all-on-x-thank-you`**, the other Webflow site
  since the 2026-09-23 domain move. It answers 200, so nothing looks broken; worth a look by
  whoever owns the form.
- A Bash heredoc halves backslashes even into `python -`; patch `.mjs` files with the Edit tool.

## Version Control

Tracked. Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
