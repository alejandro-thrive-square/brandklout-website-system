# 2026-10-06 — GHL embeds: never `loading="lazy"` — rule, gate, fleet scan

Stone Med Spa's client saw no form on `/book` while we saw it fine. Cause: our own `loading="lazy"`
on the GHL iframe. `form_embed.js` parks the frame at `left:-9999px` until it loads; a lazy frame
there never loads, so Firefox (390/768/1366 wide) showed a blank slot forever. Client-side fix and
evidence: bk-stone-med-spa, `docs/runbook/2026-10-06-ghl-form-lazy-never-loaded.md` (`b7e09c45`).

## Done (main)

- `tools/ghl-forms/README.md`: standard row "The embed on the site", new section **Embedding the
  form** (the mechanism, the evidence, the Embed block's URL-mode lazy default, fallbacks must test
  visibility not height, probe Firefox/WebKit when "fine for me"), Step 6 runs the new gate and looks
  in Firefox at phone width, a Gotcha line.
- New gate `tools/ghl-forms/check-embed.mjs <origin>… [--page /path]`: served HTML of every sitemap
  page (sitemap.xml → sitemap_index.xml → home page + its links), fails on any GHL iframe with
  `loading="lazy"`, lists frames and `form_embed.js` per page; an origin with zero pages is a
  PROBLEM (not a silent ok); undoes Git Bash's `/path` → `C:/Program Files/Git/path` rewrite.
  Proven both ways: the pre-fix `/book` fails, the fixed site passes.
- `scenario-3 …/verify-form.mjs`: fails a combo page whose form iframe is lazy.
- Gate wired into QA: scenario 0 `04-qa` (step 5 + tool list), scenario 2 `03-qa-and-publish`,
  scenario 3 `03-qa-and-launch` (step 2), scenario 6 `03-qa-and-publish`; PROCESS_INDEX row.
- `instatic-plugins/embed-origins/README.md`: URL mode writes `loading="lazy"` by default — never for
  GHL; use snippet mode or turn *Lazy load* off.

## Fleet scan (2026-10-06, after the Stone Med Spa fix)

943 pages, 99 GHL frames, **0 lazy**: Dr. Nahlah, Mason Park, Mason Park Kids, Stone Surgical Arts,
Stone Dental Implant Center, Grand Mission, Brandklout, Westlake, IFA, West LA (Railway host).
**Not read:** Livewell and Oceanic — their `*-production.up.railway.app` hosts did not answer; rerun
on their public domains.

## Next

- Optional plugin change (Scenario 4, not done): in `embed-origins` `frame()`, force `eager` for GHL
  widget URLs, so URL mode cannot reproduce this. Today the docs + gate cover it.
- Run `check-embed.mjs` on Livewell and Oceanic by their public domains.

## Gotchas

- Chrome and Safari mask this bug; only Firefox (or a slow device) shows it. "Works for me" is not
  evidence for an embed.
- The gate reads served HTML: a GHL frame injected later by a script is invisible to it.
- Node fetch gates: redirect output to a file, never pipe (Node 24 libuv assertion on Windows).

## Version Control

Tracked. Committed with the work it describes.
