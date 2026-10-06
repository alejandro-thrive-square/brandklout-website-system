# 2026-10-06 — The GHL form on /book never appeared for some visitors: `loading="lazy"` removed

The ask: the client says the form "is not showing at all"; for us it was fine.

## Cause

`loading="lazy"` on the GHL iframe — our own edit of the vendor paste (2026-09-17, `ghl-form.mjs`).
`form_embed.js` hides every form frame at DOMContentLoaded (`opacity:0; visibility:hidden;
position:absolute; left:-9999px`) and reveals it only when the form inside posts its height. A lazy
frame below the fold is deferred; once parked at `left:-9999px` it never nears the viewport, so it
never loads and never reveals. Blank slot, forever.

Measured on production before the fix (fresh profile, scrolled to the slot):

| Browser | Result |
| :--- | :--- |
| Firefox 390×844, 768×1024, 1366×768 | **never requested the frame** — blank |
| Firefox 1440×900 | revealed 6.6s (form inside the lazy margin before the hide) |
| Chrome 1440 / 390 | revealed 5–13s |
| WebKit desktop / iPhone 14 | revealed 8–14s |

Control: the same page served without `lazy` revealed in Firefox at 390 and 1366.
Ruled out: the GHL form (exists, 200), CSP, a src-rewrite loop (the consent bridge sets src once;
2–3 document loads total), Turnstile / `backend.leadconnectorhq.com` / `form_embed.js` blocked
(form still reveals), mainstream blocklists (EasyPrivacy blocks only GHL event endpoints).

Second defect: `js/11-form.js`'s fallback checked `clientHeight < 40` at 12s, but a hidden frame keeps
565px, so the "please call" message never showed for any failure of this kind.

## Done

- `site-src/ghl-form.mjs`: `loading="lazy"` removed, comment says never to add it back.
- `site-src/js/11-form.js`: fallback judges visibility (hidden/opacity 0/left -9999/height) at 25s,
  and removes the message if the form reveals later (watch up to 120s).
- New `05-instatic-upload/fix-ghl-form.mjs`: string-level edits on the instance (the /book Embed
  node's snippet + the fallback inside `src/scripts/site.js`), not a push from local source — staging
  has the 2026-10-05 class renames, production does not.
- **PRODUCTION published** (shell seq 28 → save seq 31, `{"publishedPages":27}`,
  draftMatchesPublished true after). Backup `.tmp/backup-prod-2026-10-06170319-seq28-pre-ghl-lazy`.
- **STAGING draft only** (save seq 33), **not published**: its draft already differed from live
  before this run (someone else's pending edits, likely the class-standard work). Backup
  `.tmp/backup-staging-2026-10-06170313-seq32-pre-ghl-lazy`.

## Verified on production after

Served HTML has no `lazy` on the iframe; the site bundle carries the new check. Firefox 390, 768,
1366, 1440 and WebKit iPhone all REVEALED (Firefox 390 solo: 6.4s). `form-test.mjs` FAIL none, frame
753×759 (resized by the vendor — before it stayed at 565). Frame host blocked: the fallback text
appears at ~26s, visible.

## Next

- Ask the client to reload /book (hard refresh) and confirm; which browser they use would confirm the
  Firefox match, but the fix covers every case found.
- Staging publishes the fix with whoever publishes its pending draft next — or re-run
  `fix-ghl-form.mjs` (idempotent; says "already") to check.
- Still open from 2026-09-17, inside GHL: consent text names "Stone Surgical PLLC"; the form's own
  Privacy/Terms links go to example.com.

## Gotchas

- **Never `loading="lazy"` on a GHL iframe** — any embed whose script hides the frame off-screen until
  it loads. Chrome and Safari mask it; Firefox exposes it. Test embeds in Firefox at phone width.
- A "form not showing" report with a working form in your browser: run
  `scratchpad`-style probes per engine (Playwright `firefox`/`webkit` 1.49.1) before blaming the client.
- Stone Dental Implant Center's old `all-on-x` landing snapshots (bk-dentalpro-toolkit) also had a
  lazy GHL iframe; those URLs now 404, so nothing live, but do not copy that markup.

## Version Control

Tracked. Committed with the work it describes.
