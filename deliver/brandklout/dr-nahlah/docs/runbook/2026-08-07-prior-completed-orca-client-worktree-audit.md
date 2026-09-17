## Prior completed: Orca/client-worktree audit (2026-08-07)

**Done in `30b0168` (`docs(orchestration): version client workflow propagation`).** The audit found
that the quality gap was systemic, not just model variance:

- Client worktrees and copied client workflows are snapshots. Neither later local `main` commits nor
  later `deliver/process/` edits cascade automatically.
- The canonical `07-webflow-build` overview named pasteable components as the standard while its
  trigger still dispatched the superseded whole-page method; active client copies did not contain
  `PASTEABLE-COMPONENTS.md`.
- Grand Mission and Mason Park briefs depended on an absolute path to untracked Dr. Nahlah build
  files in the root checkout, defeating worktree isolation.
- The generic `04-design` trigger still described template-section assembly, four breakpoints, and
  placeholder imagery. It did not require a brand-authority inventory or canary approval.
- The Brandklout loop had no persisted acceptance state, bounded per-run unit, repair ceiling, or
  stop rule. It could repeat a rejected direction while every static gate remained green.

The corrected model is now documented in `ORCA.md`, Deliver rules, initialization/process indexes,
Brandklout orchestration/design standards, and the `04`/`07` triggers. New requirements: record
`process_baseline_commit`, refresh only at clean task boundaries, canary before batch multiplication,
one accepted transition per session, persistent `.tmp/iteration-state.json`, and escalation after
two failed repairs of the same gate.

**Do not distribute `30b0168` into active client branches yet.** Current state after this commit:

| Worktree | Relative to `main` | Dirty entries | Action |
| :--- | :--- | ---: | :--- |
| `bk-dr-nahlah` | 54 behind, 0 ahead | 43 | Checkpoint/migrate the partial client package first |
| `bk-grand-mission` | 1 behind, 2 ahead | 51 | Finish or checkpoint component work, then merge `main` |
| `bk-mason-park` | 1 behind, 4 ahead | 50 | Finish or checkpoint component work, then merge `main` |

`main` is 70 commits ahead of `origin/main`; Orca worktrees created from `origin/main` will be stale
until that gap is intentionally resolved. Do not reset any client branch to `main`: Grand Mission
and Mason Park have unique commits and substantial uncommitted work.

**Next:**

1. Checkpoint the three dirty client worktrees, then merge `main` into each and record the baseline.
2. Add a read-only client-worktree preflight/doctor that checks branch freshness, cleanliness,
   baseline metadata, canonical-vs-client workflow drift, and required reference presence.
3. Promote a lightweight, tracked Dr. Nahlah pasteable-component fixture into `deliver/process/`;
   the live site remains the only portable reference today.
4. Start the next design batch with one canary and `iteration-state.json`; do not run an open-ended
   multi-page improvement loop.

## Done

| Commit | What |
| :--- | :--- |
| `56f430d` | Responsive screenshot QA gate — 6 breakpoints, overflow assertion |
| `b770c4a` | **Journey architecture** is now the spec: named chapters, not bands |
| `f8eaf4b` | `journey-audit.mjs` static gate. Baseline: **0/13 pages pass** |
| `0af2ebf` | Per-client Webflow MCP instances for the 4 Brandklout clients — **superseded, see below** |
| `71c6f93` | Session rotation at 200k (this rule) |
| `9738fe8` | **Fluid root font-size** is a house standard on every build |
| *(this session)* | **Webflow MCP consolidated: 6 Brandklout instances → one `webflow-brandklout`** |
| *(this session)* | **Dr. Nahlah fluid root DONE** — all gates green, uncommitted in `bk-dr-nahlah` |
| `eef9677` | Two gate defects fixed: journey-audit no longer FAILs the drafts index; `fluid-root.mjs` no longer pollutes an importer's stdout |
| `ed4d9b8` | **`fluid-root.md` corrected** on replacing a `clamp()` scale — the outstanding gotcha is now closed |
| `8e4068d` | **Merged `bk-grand-mission`** (3 pages) — conflict in `fluid-root.md` resolved as a **union** |
| `c60032a` | **Merged `bk-arvada`** (6 pages) — both conflicts were the same fix arriving twice; took `main`'s superset |
| `a4cb52a` | **`mason-park/thank-you` raised to standard** (5ch/2pin -> 7ch/3pin) and the 479/480 seam closed, 25% -> **0.0%** |
| *(merge)* | **Merged `bk-mason-park`** (3 pages) — `ASANA-DISPATCH.md` resolved as a union |
| `29a0ddf` | **Webflow OAuth SOLVED and every site ID recorded.** The 15-record empty-token saga is over |
| `9977798` | **`staging-verify.mjs`** — the gate that proves a built page kept its motion. Plus a latent `-0` fix in Grand Mission's `verify.mjs` |
| `a7bd422` | **Livewell Dental baseline + Orca setup** — committed routed workflows and created `bk-livewell` from local `main` |

> [!IMPORTANT]
> **ALL 12 PAGES ARE MERGED INTO `main` AND PASS: `journey-audit` 12/12.** The design phase of this
> campaign is complete. Mason Park's agent also added a diagnostic the other two builds lack — it
> reports the **478/479** seam separately (24.8%, reported not asserted) because that is where the
> reading tier is *supposed* to step. Worth copying to Arvada and Grand Mission.

**All 12 pages are in `main` and re-verified there**, not just in their worktrees. Worth knowing:
**`journey-audit --all` reads the `bk-*` worktrees, not `main`** — after a merge you must point it at
`main`'s own paths to verify what you actually merged. The command that does that:

```bash
node deliver/brandklout/scripts/journey-audit.mjs \
  deliver/brandklout/grand-mission-dentistry/workflows/04-design/.tmp/*-landing-page \
  deliver/brandklout/mason-park/workflows/04-design/.tmp/{invisalign,new-patient-special,thank-you} \
  deliver/brandklout/arvada-dental-center/workflows/04-design/.tmp/{aox,dentist-near-me,emergency,implants,next-door,veneers}
# -> 12/12 pages pass the static journey gate
```

**INDEPENDENTLY VERIFIED FROM `main` (2026-08-07).** Not believed — re-run here. Every harness was
executed from this worktree against each client's package, not read out of the agents' reports.

| Client | journey-audit | `fluid-root --check` | computed root | scrub proof |
| :--- | :--- | :--- | :--- | :--- |
| grand-mission | 3/3 PASS | 3/3, exit 0 | size floors OK | **48/48 x 3 pages** (`04-design/.tmp/verify.mjs`) |
| arvada | 6/6 PASS | 7/7, exit 0 | **PASS, 26 widths x 6 pages** | 6 pages x 3 pins, all 3-state |
| mason-park | **3/3 PASS** (after `a4cb52a`) | 3/3, exit 0 | **115/115**, seam re-proved 37/37 | **57/57** |

The scrub proofs are real, not shape-matched: probes read *different* values at 25/50/75%
(`4/18 -> 9/18 -> 14/18` words, `$428 -> $340 -> $251`, `inset(66.8% -> 36.8% -> 6.8%)`).

**`mason-park/thank-you` — found failing, fixed, re-verified, merged. Closed.** It was 5 chapters /
2 pins against a spec of 6-8 and >=3, caught twice independently (the static audit, and its own
scrub proof saying `pinned chapters registered (2 expected)`). The user's call was to fix the page,
not exempt thank-you pages — Grand Mission's passes at 6/3, so the bar was already proven reachable.
Its agent delivered `a4cb52a`: now **7 chapters / 3 pins**, and the 479/480 type seam closed from
**25% to 0.0%** by moving the reading tier from `<=479` to `<=478`.

**Do not look for QA in a fixed place.** Grand Mission's harness lives in `04-design/.tmp/verify.mjs`,
Arvada's and Mason Park's in `08-qa/.tmp/`. Searching only `08-qa/` reports "no harness at all" for
Grand Mission, which is wrong — it has the best of the three (generic, driven by `[data-scrub-probe]`
attributes in the markup rather than hard-coded selectors).

**Webflow MCP consolidation (user's call, 2026-08-07).** All Brandklout clients live in one Webflow
workspace Brandklout owns, so per-client instances authorized against that same workspace and
isolated nothing — while costing an OAuth round trip, a `.mcp.json` edit and a session restart per
client. Replaced the six (`webflow-dr-nahlah`, `-livewell-dental`, `-grand-mission-dentistry`,
`-arvada-dental-center`, `-mason-park`, `-stone-dental-implant-center`) with one
**`webflow-brandklout`**. Nothing was lost: **no Webflow instance held a token in any profile** —
every `mcpOAuth` record has an empty `accessToken`, including ones the docs called authenticated.
The compensating control is documented everywhere: **the boundary is the site ID, not the tool
prefix**. Client registry lives in `deliver/brandklout/docs/mcp-access.md`.

Earlier: read-only Asana access via MCP JSON-RPC scripts (`deliver/brandklout/scripts/`), full task
context download including subtasks/comments/attachments, per-client worktrees and starter docs.

## In progress

**The fluid-root campaign is COMPLETE on all three clients** (`9738fe8` + `cd99316`), verified and
merged. Grand Mission `4768e58`, Mason Park `9459d58`, Arvada `6653b70` — Arvada's agent committed
mid-session, after an earlier note here said it had not.

> [!IMPORTANT]
> **TWO AGENTS ARE RUNNING as of 2026-08-07** — the Webflow build, dispatched from here.
>
> | Worktree | Terminal | Brief on disk (untracked) | Task |
> | :--- | :--- | :--- | :--- |
> | `bk-grand-mission` | `term_596cd031-…` | `.orca-webflow-brief.md` | overwrite 3 existing pages in place |
> | `bk-mason-park` | `term_ee2d092b-…` | `.orca-webflow-brief.md` | create + build 3 new pages |
>
> **Mason Park's handle changed** — it was `term_7814c4d5-…` when dispatched and is now
> `term_ee2d092b-…`. Re-read `orca terminal list` before addressing either; do not trust a handle
> copied out of an earlier runbook.
>
> **Both confirmed alive and progressing at 15:25Z**, neither blocked, both with real task lists.
> Grand Mission is uploading 27 images (6.8MB) and settling the navbar/Footer/Global-Styles chrome
> question; it measured the page freeform ceiling at **50k**, not the ~10k this runbook guessed.
> Mason Park wrote its own `payload_to_whtml` serializer and is on the 14 shared images. Both still
> have "install the motion layer" and "verify" ahead of them, and both were sent the pointer to
> `staging-verify.mjs`.
>
> `main` was merged into both first, so they have the `07-webflow-build` scaffolding, the corrected
> `fluid-root.md` and the live site IDs. Both worktrees already listed `webflow-brandklout` in
> `.claude/settings.local.json` → `enabledMcpjsonServers`, so the team-profile grant is visible to
> them. **Do not dispatch anything else into these two worktrees until they report.**
>
> `bk-arvada` (6 pages) is **not** dispatched — its Webflow build has not been asked for yet.

Earlier state, now historical: all three client terminals were idle after the `thank-you` fix landed.

| Worktree | Orca terminal | Package | State |
| :--- | :--- | :--- | :--- |
| `bk-grand-mission` | `term_596cd031-7ce3-48d3-b05b-5acfafe501a6` | 3 pages, per-page `kit.css` + `styles.css` | **merged**, idle |
| `bk-arvada` | `term_97d9cfe7-b285-41e6-87b4-0626dad784e3` | 6 pages, shared `_shared/journey.css` | **merged**, idle |
| `bk-mason-park` | `term_7814c4d5-7fd4-4b83-8a68-6973060846d6` | 3 pages, shared `shared/mpd.css` | **merged**, idle |

Briefs on disk per worktree, all untracked and now historical: `.orca-brief.md`,
`.orca-fluid-brief.md`, and in `bk-mason-park` also `.orca-thankyou-brief.md`.
`bk-stone` (`term_e0fe6f64-…`) is scoping-only, has **no build yet**, and was correctly skipped.

**The `bk-*` branches are NOT merged back the other way.** `main` has everything, but each client
branch still sits at its own tip. Before dispatching new work into one, `git -C <wt> merge main` so
it has the corrected `fluid-root.md`, the guarded `fluid-root.mjs` and the new `07-webflow-build`
scaffolding.

**Dr. Nahlah is FINISHED and now lives in `bk-dr-nahlah`** (`term_81842127-8180-4c53-9565-8b9c03e02ff2`).
It started in `main` per `.orca-fluid-brief-dr-nahlah.md` (repo root, untracked), then the user
redirected it to the client worktree mid-task. `bk-dr-nahlah` was empty and stale — sat at
`0f86911` with no `deliver/brandklout/` at all — so it was `git merge --ff-only main`'d (a pure
fast-forward, zero unique commits) and **only `04-design/` was copied in** (71M). `00-`, `03-` and
`07-` are 708M of untracked binaries the task never touched and were deliberately left in `main`.

**`main` was then restored to its exact pre-task baseline**: the six tracked source files
`git checkout --`'d and `final-site/` rebuilt. `node scripts/fluid-root.mjs --check` on `main`'s
`final-site` reports `missing=11 clamp=95`, the number recorded before any edit. **The fluid work
does not exist in `main` — do not look for it there.** Nothing is committed in either tree.

Full detail, including the full gate table and the reasoning, is in
`C:\Users\ACER\orca\workspaces\Webzite Agentic Workflow\bk-dr-nahlah\.claude\RUNBOOK.md`.

**Mid-flight scale change** (`cd99316`): the curve was made continuous — flat **16px from 479 to
1440**, dropping the 14px step at 480. All four agents were notified to `git merge main` and
regenerate. Their briefs on disk were patched to match.

> [!NOTE]
> **Resolved.** The other agent's MCP edits (`.mcp.json`, `mcp-servers/ACCESS_MODEL.md`,
> `mcp-servers/MCP_INDEX.md`) landed in `3528671`; `main` is clean of them. The standing rule still
> applies though: **stage explicit paths, never `git add -A` in `main`**, because `main` carries ~59
> untracked paths including hundreds of MB of client binaries and the untracked `.orca-*` briefs.
