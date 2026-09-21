# 2026-09-21 — Vimeo: the 12 films were already uploaded; all 14 descriptions now written

Answering "can we use the Vimeo API / is there an MCP, and are the videos already in the
Dr. Nahlah folder?" — yes to the API, no MCP needed, and yes they were already up.

## Done

Commit: `<SHA>`

- **The Vimeo API works with the token already in `~/.webzite/.env` (`VIMEO=`).** No MCP
  server exists for Vimeo and none is needed — plain `fetch` + bearer token.
- **The 12 films were already uploaded**, 2026-08-29, `upload=complete transcode=complete`,
  in folder `Dr. Nahlah` = project **30326239** on account **`/users/248712727`** (33 client
  folders: ACE Dental, Arvada, Livewell, Dentiq…). They went up through the Vimeo web UI,
  not `upload_to_vimeo.py`.
- **Manifest write-back**: `03-graphic-resources/.tmp/video-migration-manifest.csv` now
  carries `vimeo_id` + `vimeo_thumb` on all 12 rows, `status=uploaded-vimeo`. It had been
  left with all-empty `vimeo_id`, so every downstream step still believed the migration was
  blocked.
- **13 descriptions written** over `PATCH /videos/{id}`, each verified by read-back
  (byte-exact, 0 mismatched, 0 empty, 0 flattened across all 14 in the folder):
  - **9 straight copies** from the archived YouTube `.info.json` — including
    `1222231749` Melanie, whose live copy had lost every line break (one flat paragraph);
    rewritten with its paragraphs intact.
  - **4 written from Vimeo's auto-generated captions** (`/videos/{id}/texttracks`), because
    YouTube had no usable copy: `1222231660` Donita (174 ch), `1222231319` Barbara (191 ch),
    `1222231320` joint testimonial (empty), `1221697337` Study Club (no YouTube counterpart).
- Rollback + payloads: `03-graphic-resources/.tmp/vimeo-backups/`
  (`descriptions-before-sync.json`, `descriptions-to-write.json`).

## Gotchas

- **The token is a team member's, and `/me` is the wrong place to look.** It authenticates as
  Alejandro Milano `/users/262627187`, free tier, **0 videos, 0 folders** — `/me/videos` is
  empty and `/me/projects` is empty. The workspace content hangs off the owner:
  `/users/248712727/projects/...`. `/me/teams` and `/me/team_members` both 404.
- **To prove edit rights without writing**, read `metadata.interactions` on a video: a team
  video returns `edit: {options:["PATCH"]}`; a stranger's public video returns
  `interactions: []`. Don't infer access from a 200 on a GET — public reads always succeed.
- **Rate limit is 50/min** and it is shared/low; a cold run can open on `429` before you have
  made a single call. `x-ratelimit-reset` is an ISO timestamp. Pace writes ~2.5 s apart and
  retry on 429 with ~25 s of backoff.
- **Log every write as it happens.** The first run buffered its log and printed at the end,
  then died on `UND_ERR_CONNECT_TIMEOUT` at video 12 of 13 — the record of what had landed
  died with it. Recovery was a read-back diff against the staged payload. Append to a file
  per step and make the runner resumable/idempotent.
- **`/me/teams` 404 is not "no team".** It is not an endpoint in v3.4.
- **The production domain is `www.drnahlah.com`** — which is what the YouTube descriptions
  already link to, so the straight copies point at the right site. The 2026-08-28 run's
  `EMBED_DOMAINS = dresamnahlah.com` was a wrong guess; that runbook also wrongly calls
  `user248712727` "Sang Huynh's personal account" and says a different token is needed.
  Neither holds.
- **Auto-captions mangle the doctor's name** — "Dr. Nahal", "Nawa", "Dr. Naylor", "Dr. Nald"
  all appear. Correct to "Dr. Nahlah" before using caption text anywhere public.
- **Python `len()` and JS `.length` disagree by 5 on these strings** — the house boilerplate
  carries 5 non-BMP emoji (🦷 💻 📞 📍 💻) that JS counts as surrogate pairs. Not corruption;
  don't "fix" it.
- House description shape, lifted byte-exact from an existing YouTube description rather than
  retyped: `header \n-----\n body \n-----\n bio \n-----\n contact`.

## Next

1. **Privacy is still wide open** — every one of the 14 is `privacy.view=anybody`,
   `privacy.embed=public`. The migration's whole premise was domain-locked embedding
   (`embed=whitelist`, `view=disable`). Decide deliberately: locked down (the original plan,
   but then the descriptions do no public SEO work) or left public (indexed vimeo.com pages
   competing with the practice's own). Not actioned — it changes what the client's audience
   can see.
2. **Speaker labels on `1222231320` are inferred**, not sourced — auto-captions carry no
   speaker IDs. Written as "Patient" / "His wife" from context ("my husband started"). Worth
   a human confirming before it matters.
3. The site still embeds **YouTube**, not these Vimeo films. The host swap in
   `04-design/.tmp/site-src/` was never done, and the live site is Instatic, not that build.
4. Still **no `VideoObject` JSON-LD** anywhere on the site — host-agnostic, and the change
   that actually does SEO work.
5. The 8 Wellness Hour third-party films remain correctly **not** migrated (rights unresolved).

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
