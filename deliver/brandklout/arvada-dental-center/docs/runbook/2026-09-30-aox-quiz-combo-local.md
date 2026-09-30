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
- **Rebranded to the live site** on the user's instruction ("make sure the brand looks the same as
  the current site"). The attachment was green and yellow in Atkinson Hyperlegible; the pages now
  use the site's measured values: grounds `#fdf8ef` / `#fff` / `#f6f3ee` / dark `#5f5f5d`, ink
  `#222`, gold `#c8b282` (`#8c6946` as text), `area extended` 700 capitalised headings,
  `Centurygothic` body, uppercase square buttons. `brand-probe.mjs` is the measuring tool and
  `brand/*.json` the evidence.
- `node verify.mjs` passes 105 checks, including the loaded font faces and brand colours: no overflow and every image loaded at 360/390/768/1024/
  1440/1920 on all three pages, the quiz clicked through to the thank-you page on both pages that
  carry it, validation, the video lightbox, the sticky bar, one phone number, single-fire tracking.

- **Pushed to Webflow and published to staging only** (user: "Push to webflow"). Pages
  `all-on-x-quiz` `6abd1c475916198b01bfe90d`, `all-on-x-quiz-consult` `6abd1c4f0b0c410a144a4850`,
  `all-on-x-quiz-thank-you` `6abd1c00c6b0efd3cb30ff7f`, under `/ads-landing-pages/` on site
  `693c51e685b19f0d0c149cab`. Custom-code route: stylesheet in page head code, markup in one Embed,
  scripts in page footer code. Tooling and the site's quirks: `workflows/07-webflow-build/.tmp/aox-quiz/README.md`.
  `parity.mjs` reports local and staging identical on all three pages at 1440 and 390; the click
  gate passed 87 checks against staging. **Not published to arvadadentalcenter.com.**

## Next

1. Answers to the open items below.
2. Publishing to the custom domain is a separate go-ahead. A whole-site publish by anyone will
   take these pages live; with no webhook the quiz then shows the "call us" error, by design.
3. After a webhook is set: one real submission from a browser (cross-origin JSON POST, preflight).

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
- **The site declares far more than it uses.** Its stylesheet carries Lato, Nexa, Didot, Playfair
  and Garnetta faces and a brown `#403830`; the rendered pages are almost entirely Century Gothic
  and Area Extended on cream, grey and gold. Read the brand off computed styles weighted by area
  and characters, not off the variable list.
- **A named font that never loads still passes a computed-style check** (it reports the family and
  paints Verdana). Assert `document.fonts` loaded faces.
- **`v2-native/wf.mjs` is dead**: the Webflow MCP now needs `session_id` and `agent_id` on every
  call. Use `07-webflow-build/.tmp/aox-quiz/wfq.mjs`.
- **Call tracking rewrites the phone number inside sentences.** "We'll call you from (720)..."
  published as "from (983) 228-0387", a pool number. Never promise a caller ID on this site.
- **The Sienna widget floors every font size to a whole pixel** on this site, after load. A
  computed-style diff must block it or every rem size looks leaked.
- **Staging runs the real call-tracking pool.** Each fresh-profile run of the staging gate takes a
  number; do not loop it.
- **The live ad page's canonical still points at `www.arvadadentalimplants.com`**, left from the
  domain move. Not touched here.
- A Bash heredoc halves backslashes even into `python -`; patch `.mjs` files with the Edit tool.

## Version Control

Tracked. Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
