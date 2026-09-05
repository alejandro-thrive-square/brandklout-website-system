## BLOCKED 2026-08-28: YouTube -> Vimeo migration — 12 films downloaded, upload needs the right account

Client wants the site's YouTube embeds moved to Vimeo "because Vimeo has better SEO".
Downloads are done; the upload is blocked on credentials for the correct account.

### What the site actually embeds

20 distinct videos across three pages of the `04-design` build:
`index.html` (1), `patient-stories.html` (6), `video-library.html` (14).
Two mechanisms — 7 plain `<iframe>`, 13 facade cards (`data-yt` + `img.youtube.com`
thumbnail, iframe built on click by `sections/video-library.js:44`).

**`final-site/` is GENERATED.** Do not edit it. Sources are
`04-design/.tmp/site-src/`: `pages/home.body.html:529`,
`pages/patient-stories.body.html` (6 iframes), `pages/video-library.body.html`,
`gen-videos.mjs:36,95`, `sections/video-library.js:44`, and `videos.json`
(the 13 cards' id/title/thumb/zoom). `probe-thumbs.mjs` picks maxres vs hqdefault.

### The ownership split — this is the important finding

- **11** are Dr. Esam Nahlah's own channel `UCKAbJ7TTUB-rFOTQ57DEq9g`.
- **1** (`bn3vdCgDTrc`) is `Esam Abou Nahlah` `UCymnZ1ijyJzczc5GvJTF8Ug` — alt
  channel, almost certainly his, unconfirmed.
- **8 are THE WELLNESS HOUR** `UC5g_QKb5sBQ-A6WSG9B7cHw` — a third party.
  Bone Grafting, Fixing Grey Lines, Options for Failing Teeth, Replacing Front
  Teeth, Sedation Dentistry, Seven Steps of Veneers, Single Tooth Implants,
  Smile Makeovers. Syndicated patient-education content licensed for *embedding*.
  **Not downloaded, not uploaded.** Re-hosting them on the client's Vimeo is a
  rights question nobody has answered. Do not migrate these on your own judgement.

### Done

12 films downloaded at 1080p (326 MB) to
`03-graphic-resources/.tmp/downloads/video/` (gitignored; `*.mp4` is too).
Each has its `.info.json` + thumbnail. Manifest driving the whole job:
`03-graphic-resources/.tmp/video-migration-manifest.csv` — 20 rows, with empty
`vimeo_id` / `vimeo_thumb` columns to fill on upload.
Uploader written and ready: `03-graphic-resources/upload_to_vimeo.py`
(`--check` / `--dry-run` / run; checkpoints the CSV after every file, so an
interrupted run resumes).

### Gotchas

- **Three Vimeo accounts are in play. Check which one a token belongs to before
  uploading anything.** `.env`'s `VIMEO=` was first the app's *Client Secret*
  (128-char base64 -> HTTP 401 `error_code 8003`); a real access token is much
  shorter. The replacement token authenticates as **Alejandro Milano, FREE tier,
  1 GB LIFETIME cap, 0 folders**. But the two Vimeo videos already on the live
  site (`1221240290`, `1221697337`, Chapter 03) belong to **Sang Huynh
  `vimeo.com/user248712727`** — that is where the client's Vimeo content already
  lives, and the "Dr. Nahlah folder" the user says exists is presumably there.
- **A free Vimeo account defeats the entire point of this migration.** Domain-
  restricted embedding (`privacy.embed=whitelist`) and hiding from vimeo.com
  (`privacy.view=disable`) are paid-tier only. On free, every film gets a public
  indexed vimeo.com page under a personal profile — a second page the client does
  not own, competing with their own. Worse for SEO than the YouTube status quo.
- The site has **no `VideoObject` JSON-LD at all**. That, not the host swap, is
  the change that actually does SEO work, and it is host-agnostic — worth doing
  whether or not the Vimeo move happens.
- Tooling installed this session: `yt-dlp` and `PyVimeo` (pip), `ffmpeg 9.0.1`
  (winget `Gyan.FFmpeg`). ffmpeg is NOT on PATH for already-open shells; pass
  `--ffmpeg-location .../Gyan.FFmpeg_.../ffmpeg-9.0.1-full_build/bin`.
- The live site is **Instatic**, not this static build. Whatever is changed here
  still has to be carried across; these embeds were not checked against live.

### Next

1. Get an access token on the account that owns the Dr. Nahlah folder (Sang
   Huynh / the paid Brandklout account), scopes `public private edit upload
   video_files`. Confirm tier is Starter+ before uploading.
2. `python upload_to_vimeo.py --check`, then run it. Set `EMBED_DOMAINS` in that
   script to the real production domain — currently a guess.
3. Swap the source files listed above off the manifest, rebuild, verify.
4. Decide the Wellness Hour 8: confirm redistribution rights, leave them on
   YouTube (mixed library), or replace with practice footage.
