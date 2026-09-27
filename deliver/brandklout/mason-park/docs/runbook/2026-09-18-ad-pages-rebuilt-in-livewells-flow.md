# 2026-09-18 - The ad pages rebuilt in Livewell's flow, under /ads-landing-pages

The agency reviewed the six redesigned paid routes published to staging that morning and rejected
them: *"this output does not convince me. These landing pages should have the same flow of
information that Livewell has on his ad landing pages. Once you finish, upload everything to
Instatic. Make sure to include all of these landing pages inside of this slug /ads-landing-pages."*

The first cut was the organic service page with a form chapter near the bottom, and its
consultation page was a clone of its landing page. This run threw that away and wrote the six pages
fresh, in the reference set's flow, in Mason Park's own design system, and published them to
staging under `/ads-landing-pages/`.

## Done

Implementation commit: `0dfec3a9`.

- Read Livewell's live set (`www.livewelldentalva.com/ads-landing-pages/{dental-implants,
  dental-implant-consultation, thank-you-implants}`, curl with a browser UA) and mapped its flow.
- `build-ads-landing-pages.mjs` writes six pages to `home/ads-landing-pages/<slug>/`. It replaces
  `build-ad-pages.mjs` and the six root folders, which are deleted.

| Campaign | Landing | Consultation | Thank you | Form |
| :--- | :--- | :--- | :--- | :--- |
| Invisalign | `/ads-landing-pages/invisalign` | `/ads-landing-pages/invisalign-consultation` | `/ads-landing-pages/invisalign-thank-you` | `YbX91GhEDKkCN4GH4gka` |
| $189 New Patient | `/ads-landing-pages/new-patient-special` | `/ads-landing-pages/new-patient-special-consultation` | `/ads-landing-pages/new-patient-thank-you` | `AFu5BpJpMjgSnSf8yybc` |

- **Landing (8 chapters):** Arrival with the lead form in the hero, The Journey (four moves,
  pinned and scrubbed, the signature moment), Why Here (four reasons, then three doors), The
  Dentist, The Path, The Proof and the rooms, Questions, The Invitation with offer, credentials and
  disclaimer. **Consultation (4):** the form first, the proof, the dentist with credentials and
  disclaimer, the invitation. **Thank you (5):** the phone first and no form, what to expect on the
  call beside why not to wait, three pillars, questions, the invitation.
- Every landing CTA goes to the consultation page, as Livewell's do. The practice publishes no
  before-and-after cases, so the reference's gallery is not reproduced; the proof is the practice's
  own Google reviews and rooms. Nothing is invented.
- Backed up staging first: `backup-staging.masonparkdental.com-2026-09-18T12-58-47.json` (63 pages,
  747 media, shell seq 91). Shipped only the six pages (`ship-payload.mjs --dir pages-ads`),
  converted 6 of 6 with no warnings, placed four forms and six tracking blocks, imported.
- Removed the six first-cut root routes from **staging** with `retire-old-ad-routes.mjs`. They are
  in the backup above. Staging is 63 draft / 63 published, no drift, last published
  `2026-09-18T13:33:44.919Z`. **Production was not written**, not even read for this run.

## Verified

Local: `check.mjs` 0 errors on six pages; journey audit PASS on both landing pages (8 chapters,
3 pins, 22 scrubs); `probe-ad-journey.mjs` 0 problems on both; `qa-ad-pages.mjs` 36 renders, 0
problems; settled element screenshots reviewed at 1440 and 390.

Live on staging: six 200s, 0 broken images, 0 overflow; six 390px renders clean; four form frames
and loaders 200 with the right campaign id, **514px wide in their cards**, none on either thank-you
page, nothing blocked by CSP; all six number pools 200 and the public number swapped to the tracked
one; **0 elements matched by an ad blocker's list**; every scene assertion passes on the published
page.

## Gotchas

- **Never name anything on a paid page `ad`.** The first import used `is-ad`, `ad-hero`, `ad-rail`,
  `ad-place` and `ad-disclaimer`. All five are on the generic cosmetic lists ad blockers apply
  (`position: absolute !important; clip-path: inset(100%) !important`). On staging the whole hero,
  form included, collapsed to a 0px box while `verify-live`, the mobile gate, the form gate and the
  tracking gate were all green. It renders perfectly locally because the list is not applied to
  `file://`. This workstation's NordVPN Threat Protection applies it to every http(s) page, which is
  how it was caught. The namespace is `lp-*` / `is-lp` / `is-lp-page`. **The first cut's `.ad-rail`
  had been hidden for every blocked visitor since it shipped.** `probe-adblock.mjs` is the gate; it
  has to go through CDP, because the injected sheet is not in `document.styleSheets`.
- **A class on the local form placeholder is still on the published Embed module.** The slot node
  becomes the module and gains `wz-embed`. The placeholder's `display: grid; place-content: center`
  left the GHL iframe at 300px in a 578px card. Scope placeholder looks to `:not(.wz-embed)`.
  `verify-form.mjs` printed `300x905` all along and nobody read the width.
- **The GHL frame arrives at 150px and grows to 800 to 900 a few seconds later**, moving every
  scene below it. `journey.js` refreshes on height change, so the page is right, but a probe that
  reads trigger ranges in the first seconds reads ranges about to be replaced. The probe waits 14 s
  on a URL, and the slot now reserves `min-height: 50rem`.
- **A head pinned beside its own content must opt out of the shared departure** (`data-no-depart`
  on the section). The departure trigger is measured in document flow and faded the Why heading
  where it would have been.
- **A pin needs something to hold through.** As a two by two, the four reasons were shorter than
  the head beside them and the pin's range was 0px: `held at 133/133/133` and also
  `grid at 133/133/133`. They are rows now. Assert that the *other* thing moved.
- **`shot.mjs` photographs on the move.** Two photographs looked missing (a mask reveal and a lazy
  portrait caught mid-arrival). `shot-el.mjs` settles on one selector first and reports what each
  image loaded; both were fine.
- **From Git Bash, `bash` is MSYS, not WSL, and leading-slash arguments are rewritten.** The
  transport scripts assumed `/mnt/c/...` and failed; `verify-live.mjs /ads-landing-pages/x` asked
  for `C:/Program Files/Git/ads-landing-pages/x` and reported six 404s. The transports now ask the
  bash they get; for `verify-live.mjs` set `MSYS_NO_PATHCONV=1`.
- **Two album frames are not on staging** (`kid-toy-machine`, `pediatric-room`): the adult site
  dropped the children's imagery in BugHerd round three. The exporter reports them as unmapped.
  Swap the frame rather than upload it.
- Nested slugs serve correctly here because these rows were only ever written through
  `site-document`. A `PATCH /data/rows/:id` on one of them flattens its route to
  `/ads-landing-pages-<slug>` until it is re-saved.
- The status call straight after a publish answered 502 once. The publish had already returned 63.

## Next

1. Agency review of the six routes on staging.
2. **At promotion, outside this repository:** point each GHL form's redirect at
   `/ads-landing-pages/<campaign>-thank-you` (they are the live ads' forms and still redirect to
   production's root thank-you slugs, so they were not touched); move the ads' final URLs, or
   redirect the old root slugs through the workflow-12 Cloudflare Worker (Instatic has no redirects).
3. These pages depend on staging's stylesheet, script bundle and media. They go live with the rest
   of the staging site, not ahead of it.
4. Still open from the earlier run: staging's embed-origins plugin is 1.5.1 without Termly.

## Version Control

Follows the root rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md). Implementation, tooling
and the workflow README are commit `0dfec3a9`; this run file, the index and the standing runbook are
committed separately as the documentation handoff.

## Infrastructure

Staging runs on Railway/Instatic; the transport was driven from Windows through Git Bash and
Railway's bundled native CLI. The Node scripts use platform-neutral filesystem APIs and remain
compatible with Ubuntu 24.04 LTS on the Hostinger VPS.
