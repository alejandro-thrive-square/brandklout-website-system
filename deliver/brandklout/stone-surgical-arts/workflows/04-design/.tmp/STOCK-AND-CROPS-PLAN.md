# Execution plan — the doctor's stock photography, and the faces being cut

Written 2026-09-04 for the session that picks this up. Two jobs, in this order:
the crops are a **bug**, the stock images are **new work**. Fixing crops first means
the new photographs land into a layout that no longer cuts heads off.

---

## Job 1 — faces are being cut off

**Reported by the client:** on several pages a person's face is cut by the frame.

**Diagnosed, not guessed.** The stylesheet has **40** `object-fit: cover` rules and only
**12** `object-position` declarations. The other **31** fall back to `object-position:
50% 50%`, which centres the crop. On a portrait photograph of a person the face sits in
the upper third, so a centred crop in a short frame takes the chin and forehead.

Selectors with `cover` and **no** `object-position` — the ones that carry people are
marked, and those are the fix:

| File | Selector | Carries a person? |
| :--- | :--- | :--- |
| `50-journey.css` | `.arrival_photo img` | **yes** |
| `50-journey.css` | `.thesis_face` | **yes — it is in the name** |
| `50-journey.css` | `.path_media img`, `.offer_media img`, `.ask_media img`, `.invite_media img` | mixed |
| `51-dossier.css` | `.suits_media img`, `.recov_figure img`, `.book_media img` | mixed |
| `52-elevate.css` | `.concern_float img`, `.concern_thumb img` | **yes** |
| `52-elevate.css` | `[data-parallax] img`, `.catalogue_media img`, `.strip_tile img`, `.proof_media img`, `.related_media img` | mixed |
| `53-hub.css` | `.catx_media img`, `.still_component img`, `.hubfaq_media img` | mixed |
| `54-profile.css` | `.prof_side img`, `.why_photo img`, `.lead_media img` | **yes — Dr. Stone** |
| `54-profile.css` | `.beyond_grid figure img` | mixed |
| `55-about.css` | `.roster_card-media img` | **yes — staff roster** |
| `55-about.css` | `.place_media img`, `.steps_media img`, `.gallery_item img` | mixed |
| `56-offers.css` | `.offer_hero-media img`, `.consent_media img`, `.desk_media img`, `.prep_media img` | mixed |

### How to fix it properly

Do **not** blanket-apply `object-position: 50% 25%`. The existing 12 declarations were
each chosen for their image (`51-dossier.css` already uses `50% 66%` and `50% 18%`), and
`51-dossier.css:82` carries a comment explaining a case where no `object-position` can
help because the frame is only ~38% of the image height. Read those first.

1. Render every page at the four widths with `.tmp/shot.mjs` (run `cd .tmp && npm i`
   once first — the dev deps are gitignored and are not in this worktree).
2. Find the frames where a face is actually clipped. A cut face is visible in the
   screenshot; a centred crop on a photograph of a *room* is fine and must not change.
3. Set `object-position` per selector, from the photograph it actually shows. Where one
   selector serves several photographs with different subject placement, the honest fix
   is a modifier class on the element, not a compromise value that half-cuts both.
4. Where the frame is too short for any crop to hold the face, change the frame's
   aspect ratio — that is the case the dossier comment describes.
5. Re-shoot the screenshots and compare. **The gate is the render, not the rule.**

---

## Job 2 — the doctor's chosen stock photography

**Location.** `../../01-content-intake/.tmp/Stock Images-20260904T185452Z-1-001/Stock Images/`
— 20 files, 134 MB. The doctor chose these, so they are the preferred imagery.

**They are camera originals and cannot go on a page as they are:** 19 JPEGs between
3936px and 8768px wide, plus one QuickTime video.

| Subject | Files | Note |
| :--- | :--- | :--- |
| Botox and Xeomin | 3 | up to 8768x4892 |
| Chemical peels | 2 JPEG + **1 `.mov` (29.9 MB)** | `Chemical peels.jpeg` is 6652x2217, an unusually wide crop |
| Dysport | 2 | |
| Facial fillers | 3 | |
| Hair restoration | 3 | `Hair restoration.jpeg` is the **only portrait** frame, 4480x6720 |
| Morpheus8 | 2 | |
| PRP treatment | 4 | |

### How to bring them in

- Follow the existing pipeline. `site-src/` already has `get-stock.mjs`, `stock-manifest.json`
  and `generated-manifest.json`; every slot is a named entry with alt text and provenance.
  **Add these the same way** — a new manifest entry per slot, not loose files.
- Output `.webp` at the srcset widths the pages already use. Match what
  `import-album.mjs` does for Mason Park if a reference is useful.
- **Alt text is required** and the manifests carry it. Write what the photograph shows.
- These subjects map onto the treatments page and the individual dossiers. Check
  `final-site/treatments.html` for which of these the site actually sells before
  placing a photograph next to a claim.
- **The video**: convert out of `.mov` before use, and check whether any component
  supports video at all — `dr-stone-steps.webp` is currently a *thumbnail* of a video,
  not a player. Adding one is a design decision; raise it rather than inventing it.

---

## Context you need before touching anything

- **The local assets were restored from the published Instatic instance on 2026-09-04,
  and they are PRE-UPSCALE.** The 2026-09-04 refinement pass (`9628637b`) re-emitted 16
  photographs at 2x–4x through Magnific and was never published, so those higher-res
  bytes are gone. `dr-stone-standing.webp` is 988x1482 where the job targets 2000.
  Re-running `upscale-doctor.mjs` is blocked: 15 of 16 jobs read from
  `01-content-intake/.tmp/google-drive-images/`, which is **empty**, and the Google Drive
  API credentials **do not work** (confirmed by Alejandro). Ask for the client's export.
  `dr-stone-portrait.webp` is the exception — `get-assets.mjs` pulls it off the Webflow CDN.
- **`MAGNIFIC` is available** in this worktree's `.env`, which is generated from
  `~/.webzite/.env`. Never hand-edit `.env` here; add to the master and re-run
  `node scripts/env-sync.mjs`.
- **Do not publish to Instatic without being asked.** `INSTATIC_BASE_URL` in `.env` is the
  Surgical Arts instance. The last publish was 2026-09-01; the refinement pass after it is
  deliberately unpublished.
- **This branch is 35+ commits ahead of `origin/main` and is not pushed.** Commit as you go.

## Gates

`.tmp/check-standalone.mjs`, `.tmp/audit.mjs`, `.tmp/shot.mjs`, `.tmp/probe.mjs`.
`shot.mjs` and the playwright-based ones need `cd .tmp && npm i` first.
