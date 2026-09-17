## CURRENT TASK — Webflow build for Grand Mission + Mason Park (2026-08-07)

User's ask: build both clients' pages into Webflow, **publish to STAGING only**, then verify the
Webflow render matches the local files.

**UNBLOCKED AND DISPATCHED. Both client agents are running.** Nothing here is waiting on the
orchestrator; the next orchestrator job is to receive their reports, merge, and run the cross-client
verification pass from `main`.

### OAuth — SOLVED

**The user completed it via `/mcp` in this worktree**, not via the manual callback hand-back that the
previous session had prescribed. `webflow-brandklout` is now authenticated on the **team** profile
and advertises its full tool surface (`data_sites_tool`, `data_pages_tool`, `data_element_tool`,
`data_whtml_builder`, `data_scripts_tool`, …). The whole `authenticate` / `complete_authentication`
pair is gone from the tool list, which is itself the signal that a grant is live.

Worth keeping: the diagnosis that produced 15 empty records was *correct about the mechanism* (a
record is written at flow start, the token at completion) but the prescribed fix was never needed.
`/mcp` from a live session did what repeated `authenticate` calls could not.

### Site IDs — DISCOVERED AND COMMITTED (`29a0ddf`)

`list_sites` returned **9 sites, all in workspace `63b4b7393e89b78575e9a9bb`**. Registry written to
`deliver/brandklout/docs/mcp-access.md` and every client's own file. Three findings that matter:

- **The Dr. Nahlah workspace doubt is resolved.** Its workspace is Brandklout's, not Webzite's. One
  shared instance is the right model; no client needs a dedicated one.
- **Arvada has FIVE sites and four are copies.** The deliverable is `693c51e685b19f0d0c149cab`
  ("Arvada Dental Center", the only one on `arvadadentalimplants.com`), **user-confirmed**. The
  decoys — "Arvada Dental Implants Center", "Arvada Cosmetic Dental Implants", "Arvada Implants",
  "Arvada Dental Center - Blue" — are recorded in both access files. Match on ID, never on name.
- **Stone Dental has no site in the workspace at all.** Its read-only status is now structural
  rather than procedural: there is nothing to act on.

| Client | Site ID | Notes |
| :--- | :--- | :--- |
| Grand Mission | `698111847e9608eb30ee21c6` | live production site, **303 pages** |
| Mason Park | `6a60bdc0340e5f1784b4d553` | effectively empty — **1 page** (Home), no custom domain |
| Arvada | `693c51e685b19f0d0c149cab` | user-confirmed; 4 decoy copies exist |
| Livewell | `69d03fdbe999e9907724a69d` | confirmed |
| Dr. Nahlah | `6a6b84cc7fe55ddeabc0b314` | confirmed |
| Stone | — | **no site exists** |

### Grand Mission already holds the OLD build — overwrite in place (user decision)

The three destination pages **already exist and already contain the superseded band-stack version**,
created 2026-08-04 and last touched 2026-08-05. Sections are class-named `iai_section-tint` /
`iai_section-white` / `cai_section-light` / `cai_section-dark`, alternating — the exact architecture
this campaign was rebuilt to escape. Page shell is Client-First (`page-wrapper` > Global Styles,
navbar, `main-wrapper`, Footer).

| Local package | Webflow page | Page ID |
| :--- | :--- | :--- |
| `implant-landing-page` | `implant-ai` | `6a724b6977f9b0019d2a03f8` |
| `cosmetic-landing-page` | `cosmetic-ai` | `6a723ad5534774f35f17d119` |
| `thank-you-landing-page` | `thank-u-landing-ai` | `6a7268a862a728c1cd4df73b` |

All three are `draft: false` but **404 on both staging and production** — the site has not been
published since they were created. So the old build is not exposed to anyone, which is what made
overwriting low-risk. **Who created them is still unknown** and was not chased; if it matters later,
ask Brandklout about 2026-08-04.

The user's call was **overwrite in place**, keeping slugs and page IDs so any ad URLs already
pointing at `/implant-ai` survive.

### Mason Park is the easy one

One page exists (Home, `6a60bdc3340e5f1784b4d5e3`). The three landing pages do not exist and must be
created with `create_page`. Staging `https://mason-park-dental.webflow.io` returns 200.

**Build rules that already cost time on earlier clients** — do not rediscover them:
- Convert **whole-page with `--wrap`** so the payload has a **single root**. A multi-root payload
  crashes the Designer; size is not the problem.
- `--page-prefix` is **required**, or classes ship named literally `p`/`div`/`span`.
- Gate on `simulate_paste.mjs` — a payload can pass every static gate and still be dead on
  interaction.
- Pages after the first need `--avoid`; cross-page class collisions are real.
- Prefer the **`data_*` Data API tools** (fast, headless, no bridge app). Designer-bridge tools take
  up to 15 min per action and must be strictly sequential.

**Scope — CONFIRMED by the user 2026-08-07.** `main` does site-ID discovery, registry, dispatch and
the cross-client verification pass. The page building goes to the `bk-*` worktrees. Both were
briefed and are running (see **In progress**).

### Already done for this task (`a247407`) — do not redo

`07-webflow-build/` is now scaffolded in **both** clients (neither had one; Grand Mission had only
`01-content-intake` + `04-design`, Mason Park added `08-qa`). Each contains the process-library
converter chain plus `simulate_paste.mjs` copied from `dr-nahlah` (the process copy lacks it).

The pipeline is **proved working**. This exact command produced a valid payload:

```bash
python deliver/process/07-webflow-build/html_to_webflow_wholepage.py \
  --html deliver/brandklout/grand-mission-dentistry/workflows/04-design/.tmp/implant-landing-page/index.html \
  --css  deliver/brandklout/grand-mission-dentistry/workflows/04-design/.tmp/implant-landing-page/styles.css \
  --wrap --page-prefix imp \
  --out  deliver/brandklout/grand-mission-dentistry/workflows/07-webflow-build/.tmp/implant
# -> 649 nodes, 156 styles, 1 root, wrapped under one 'page-wrapper' Block
```

> [!WARNING]
> **THE MOTION LAYER DOES NOT TRAVEL WITH THE PASTE. This is the actual build, not the paste.**
> The converter emitted a **703-byte** `webflow-custom-code.js` while the page's real behaviour is
> **22KB** across `app.js` (7,493 b) and `page.js` (14,746 b). Every pin, scrub and SplitText call
> lives there. Paste the markup alone and the page arrives as a **stack of static bands** — the
> precise failure this entire campaign was rebuilt to escape, and it will pass a screenshot review.
>
> Also: **GSAP is vendored locally** at `assets/gsap/{gsap,ScrollTrigger,ScrollToPlugin,ScrollSmoother,SplitText}.min.js`.
> Those relative `src`s resolve to nothing on `webflow.io`. Point them at a CDN (all plugins are
> free since 3.13) or upload them. Per `[[reference_gsap_journey_build]]`: **register plugins in the
> body, not the head**, or ScrollSmoother silently dies.
>
> Verify the built page by **driving it**, not by screenshotting it — reuse each client's existing
> harness (`verify.mjs` / `scrub-proof.mjs`) against the staging URL. A pinned scene that does not
> scrub is invisible to a capture.

**Measured 2026-08-07 — the JS does not fit anywhere obvious, and this is the real build risk.**

| Client | CSS (converts to Webflow classes — not a problem) | JS (needs a home — the problem) |
| :--- | :--- | :--- |
| Grand Mission | `kit.css` 37,476 shared + `styles.css` 14,900–20,624/page | `wz.js` 20,073 shared + `app.js` 3,807–7,493 + `page.js` 9,861–14,746 = **34–42KB/page** |
| Mason Park | `mpd.css` 37,683 shared | `mpd.js` 7,284 + `mpd-flush.js` 18,758 = **~26KB**, shared by all 3 |

The ceilings: `register_inline_script` caps at **2,000 characters** (useless here), and page freeform
custom code has a per-block limit around 10k. So the ladder briefed to both agents is: **GSAP from
CDN first** (removes ~140KB of vendored `assets/gsap/*.min.js` whose relative `src`s resolve to
nothing on `webflow.io`), then minify, then trim the shared runtime, and **only then** consider
`register_hosted_script` — with an instruction to **stop and report before choosing a host**, since
putting a paying client's page behind our own CDN account is the user's call.

**Never use site-wide custom code on Grand Mission** — 303 pages would execute it. Mason Park is
empty, so site-level is defensible there.
