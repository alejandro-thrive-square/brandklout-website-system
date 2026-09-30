# 2026-09-30 — All-on-X "quiz" combo: designed, branded, on Webflow staging as native pages

**Asana:** `1218962992162869` "Make new landing page - AOX" (Arvada, Ad-Hoc section). The link
first handed over pointed at `1218786832903900`, which is Hackensack's "Design Home Page"; the
Arvada task was found with `search_tasks` for "Arvada" modified after 2026-09-15.

## Standing state

Three **native** Webflow pages on site `693c51e685b19f0d0c149cab`, under `/ads-landing-pages/`,
published to **webflow.io staging only**:

| Page | Slug | Page id |
| :--- | :--- | :--- |
| Landing | `all-on-x-quiz` | `6abd1c475916198b01bfe90d` |
| Consult | `all-on-x-quiz-consult` | `6abd1c4f0b0c410a144a4850` |
| Thank-you | `all-on-x-quiz-thank-you` | `6abd1c00c6b0efd3cb30ff7f` |

Source and gates: `workflows/04-design/.tmp/aox-quiz/` (read its `README.md`). Webflow tooling and
what the builder does: `workflows/07-webflow-build/.tmp/aox-quiz/README.md`.

## Done, in order

1. Pulled the task: `workflows/01-content-intake/.tmp/asana-aox-sung-2026-09-30/` (one attachment,
   `all-on-x-landing.html`, plus the AI audit of the current page in the comments).
2. Built the combo from the attachment: landing (photo slots filled), consult (quiz first),
   thank-you (phone first, no form).
3. **Rebranded to the live site** (user: "make sure the brand looks the same as the current
   site"): grounds `#fdf8ef` / `#fff` / `#f6f3ee` / dark `#5f5f5d`, ink `#222`, gold `#c8b282`
   (`#8c6946` as text), `area extended` 700 capitalised headings, `Centurygothic` body, uppercase
   square buttons. `brand-probe.mjs` measured them; `brand/*.json` is the evidence.
4. First Webflow push (user: "Push to webflow"): each page as one Embed plus head and footer code.
   **Rejected the same day: "This is not editable on the designer".**
5. **Rebuilt natively.** 197 `aq-` classes as Webflow styles, every element a Designer element
   (headings, paragraphs, link blocks, a native form, lists, bound images). The quiz's questions,
   answers, estimate wordings, headline variants and the webhook URL are all edited in the
   Designer. Custom code is `code.css` (3 KB of states) and `site.js` (behaviour).
6. Gates on the native build: `native/verify.mjs` 125 checks locally (layout at six widths, the
   quiz clicked through on both pages, the webhook payload captured by a local endpoint, the
   production guard, videos, sticky bar, tracking); `push-native.mjs check` (every class on the
   right number of elements); `parity.mjs` **identical, element for element, at 1440 / 1100 / 900 /
   600 / 390 on all three pages**; the click gate once against staging, 98 of 99, the one miss a
   test timing fault (the click landed mid-scroll; the event was then confirmed by hand).

## Next

1. Answers to the open items below.
2. Publishing to the custom domain is a separate go-ahead. A whole-site publish by anyone takes
   these pages live; with no webhook the quiz then shows its "call us" error, by design.
3. After a webhook is set (`data-lead-webhook` on the quiz element, in the Designer): one real
   submission from a browser. The POST is cross-origin JSON, so the webhook must answer a preflight.
4. Once the team edits these pages in the Designer, **stop running `push-native.mjs pages`**: it
   clears and rebuilds the body.

## Open, all blocking launch

- The lead webhook is empty. The quiz sends leads nowhere until the GHL inbound webhook exists.
- Price: design says $18,795, the live cost page says "Starting at $17,795" today.
- Unverified claims from the attachment's own checklist (ratings, "$10,000 below", monthly figures).
- Final slugs, and whether this replaces the live All-on-X set or runs beside it.

## Gotchas

- **A page on this site is elements and classes, never an Embed.** Identical rendering is not the
  bar; being editable in the Designer is. `v2-native/PLAN.md` said so and it was missed once.
- **The builder's dialect** (single-class selectors, no attribute selectors, labels and inputs only
  inside a form, a class with no rule silently dropped, form/checkbox/submit needing a post-pass)
  is written up in `07-webflow-build/.tmp/aox-quiz/README.md`. Probe a fragment with `probe.mjs`
  before authoring against it.
- **Author the local source in the builder's dialect and under the site's own stylesheet.** Then
  local and staging match by construction; `parity.mjs` had nothing to find but a font stack.
- **`v2-native/wf.mjs` is dead**: the Webflow MCP now needs `session_id` and `agent_id` on every
  call. Use `07-webflow-build/.tmp/aox-quiz/wfq.mjs`.
- **Call tracking rewrites the phone number inside sentences.** "We'll call you from (720)..."
  published as "from (983) 228-0387", a pool number. Never promise a caller ID on this site.
- **The Sienna widget floors every font size to a whole pixel** on this site, after load. A
  computed-style diff must block it or every rem size looks leaked.
- **An `auto` margin's computed value is unstable** (120px or 0px for the same centred box,
  depending on when it is read). Compare position and width instead.
- **Staging runs the real call-tracking pool.** Each fresh-profile run of the staging gate takes a
  number; do not loop it.
- **`asset_tool` needs an open Designer session**; `create_asset` plus the presigned S3 POST does not.
- **`transformation-image-1.jpg` is Chris's photo again.** YouTube `maxres1/2/3.jpg` are alternate
  frames: Anna's default thumbnail has a burned-in caption, `maxres3.jpg` is clean.
- **The existing GHL form `PzBilvSVUmynr9PLukbt` still redirects to
  `www.arvadadentalimplants.com/ads-landing-pages/all-on-x-thank-you`**, and the live ad page's
  canonical points at that domain too, both left from the 2026-09-23 domain move. Not touched here.
- **The site declares far more than it uses** (Lato, Nexa, Didot, Playfair, Garnetta, a brown
  `#403830`). Read the brand off computed styles weighted by area, not off the variable list. A
  named font that never loads still passes a computed-style check; assert `document.fonts`.
- `aq-build-probe` is a draft scratch page left on the site; the API cannot delete pages.
- A Bash heredoc halves backslashes, also into a `.py` file; patch `.mjs` files with the Edit tool.

## Version Control

Tracked. Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
