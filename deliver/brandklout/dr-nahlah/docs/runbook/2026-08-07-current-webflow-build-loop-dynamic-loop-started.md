## CURRENT — Webflow build loop (dynamic `/loop`, started 2026-08-07 16:10Z)

> [!IMPORTANT]
> **THE 200k ROTATION RULE IS DISABLED AT THE USER'S EXPLICIT INSTRUCTION** ("forget about the 200k
> token limits, it delays the process"). `WEBZITE_CONTEXT_LIMIT=100000000` /
> `WEBZITE_CONTEXT_WARN=99000000` are set in `env` in `.claude/settings.local.json` (gitignored) in
> `main` **and in all five `bk-*` worktrees**. `SYSTEM_RULES.md` §5 and the hooks are UNCHANGED —
> only the thresholds are raised locally. Delete those two keys to restore the rule.
>
> **This was not theoretical.** The guard rotated `bk-grand-mission` at **296,322 tokens** and
> `bk-mason-park` at 220,405 — Grand Mission's replacement session came up **idle at an empty
> prompt** with the build already finished but nobody reading the result. `env` in settings applies
> at session **start**, so a worktree only gets the new ceiling on its next session.

### Grand Mission — BUILT, INDEPENDENTLY VERIFIED, MERGED (`e163804`)

Its agent delivered `7ed22d5` then rotated. **Verified from `main`, not believed:**

| Page | Staging | staging-verify | triggers (staging vs design) |
| :--- | :--- | :--- | :--- |
| implant | `/implant-ai` | **20/20** | 80 vs 80 |
| cosmetic | `/cosmetic-ai` | **20/20** | 62 vs 62 |
| thank-you | `/thank-u-landing-ai` | **20/20** | 34 vs 34 |

All on `https://grandmissiondentistry.webflow.io`. Every pin scrubs to 3 distinct states, GSAP
3.13.0 registered, zero 404s, zero console errors.

**Production is untouched** — `www.grandmissiondentistry.com/<slug>` 301s to the apex, which **404s**
on all three. Staging-only held. Check the *followed* status: the bare `www` 301 reads like a
success if you stop there.

**The build is deliberately NOT a class conversion.** Each page is **one HtmlEmbed holding the
design body verbatim**, CSS in the page head block, JS in the footer block, and **zero Webflow
styles created** (proven by a before/after style-name diff). That is why the motion survived intact
on a live 303-page site. Do not "fix" it into classes — see `build-pages.mjs`'s header comment and
the new section C-alt2 in `deliver/process/07-webflow-build/html-to-webflow-clipboard.md`, which the
merge brought into `main`.

### Mason Park — BUILT, INDEPENDENTLY VERIFIED, MERGED (`e81bd01`)

`a1561f4` put all three on staging (`https://mason-park-dental.webflow.io`). Re-verified from
`main` **after fixing the harness** (see below) — its own 17/17 was weakly evidenced:

| Page | staging-verify | triggers (staging vs design) |
| :--- | :--- | :--- |
| `/invisalign` | **21/21** | 43 vs 43 |
| `/new-patient-special` | **21/21** | 38 vs 38 |
| `/thank-you` | **21/21** | 28 vs 28 |

Built via a different route from Grand Mission: a new **`payload_to_whtml.py`** (908 lines, in
`mason-park/workflows/07-webflow-build/`) serialises the clipboard payload to WHTML so pages build
as real Webflow elements, not embeds. **It is reusable and currently lives in a client folder —
consider lifting it into `deliver/process/07-webflow-build/`.** Two routes now exist and both are
proven; pick by whether the CSS can survive class conversion.

**THE CAMPAIGN IS COMPLETE: 6 of 6 paid pages built into Webflow, verified from `main`, merged.**
Arvada's 6 pages were never dispatched for a Webflow build — that work has not been asked for.
