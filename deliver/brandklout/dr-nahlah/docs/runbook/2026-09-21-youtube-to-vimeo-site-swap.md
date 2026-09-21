# 2026-09-21 — Every practice-owned film swapped from YouTube to Vimeo, live

Follows the same day's Vimeo description run. The client asked for the site's YouTube
embeds to be replaced with the Vimeo ones and the Vimeo BugHerd pins closed.

## Done

Commit: `<SHA>`

**108 of 124 YouTube nodes converted across 15 pages**, applied to staging first, then
production, published to both. Zero YouTube *embeds* remain anywhere on the site.

Three mechanisms carried YouTube and each needed its own swap:

| mechanism | nodes | what changed |
| :--- | ---: | :--- |
| `base.video` (eager iframe) | 18 | became `brandklout.embed-origins.embed` with Vimeo's snippet |
| `.vl-card[data-yt]` facade | 45 | attribute became `data-vimeo`; `site.js` reads either |
| `img.youtube.com` thumbnail | 45 | became the 1280×720 still from `i.vimeocdn.com` |

Plus two supporting writes:

- **CSP**: `https://player.vimeo.com` added to Embed Origins `frameOrigins`, read-merge-write.
- **`src/scripts/site.js`**: the click-to-play handler now builds a Vimeo *or* a YouTube
  player from whichever attribute the card carries (95,091 → 95,299 ch).

Scripts, all idempotent and plan-by-default:
`22-instatic-api-sync/{survey-youtube,inventory-video,swap-youtube-to-vimeo,patch-facade-vimeo,add-vimeo-frame-origin,backup-video-pages,do-publish}.mjs`

**Verified in a real browser on staging before production**: facade click builds a
`player.vimeo.com` iframe with the right id and `autoplay=1`; a YouTube card still builds a
YouTube one; every embed lands at 1.78 ratio with no zero-size box and no horizontal
overflow; no CSP violation and no page error in the console.

## NOT done, and why

**The eight THE WELLNESS HOUR films on `/video-library` stay on YouTube.** They are
third-party syndicated content licensed for embedding, were never uploaded to the client's
Vimeo, and the 2026-08-28 run already recorded that re-hosting them is an unanswered rights
question. `/video-library` is therefore **mixed-host by design**: 6 Vimeo, 8 YouTube.
`A9wuNvIfFEw yo1gLUGnRbM 938agcztJjs fx6eztXBVqQ zjvRSifApBs btCwe4wry5o um69fjRjTHs xgOBrrKQjeU`.

BugHerd **#31** (home, Melanie) and **#34** (Alexandria All-on-4 hero) closed `done`.
**#41 / #42 left open on purpose** — they ask for a *veneers* film, which is a content
problem, not a host problem. There is still no veneer patient film; the swap does not
address them.

## Gotchas

- **A non-YouTube `<iframe>` cannot be a node of its own.** Instatic treats it as a
  forbidden custom tag and publishes an empty div. The working shape is the
  `brandklout.embed-origins.embed` module with `source: "snippet"` — which is not a guess,
  it is what the two Vimeo films already on `/index` and `/meet-dr-nahlah` use. Copy a shape
  that is already live rather than inventing one.
- **`autoTrust` does not cover a runtime-built iframe.** It lifts `frame-src` only for
  embeds present in the published HTML, so the static Vimeo snippets work without any
  allowlist entry while the `.vl-card` facades — which build their iframe in JS on click —
  would die silently behind CSP. That is why `player.vimeo.com` had to go in `frameOrigins`.
- **Never run `process/18-instatic-embeds/set-origins.mjs` against this site.** It sends all
  three origin fields from its own flags, so it would blank `connectOrigins` (Termly) and
  `siteScripts` (Sienna, Termly, GTM, both LeadConnector tags). Use
  `add-vimeo-frame-origin.mjs`, which reads, merges and verifies the other keys survived.
- **`data-yt` could not simply be renamed.** Eight films stay on YouTube, so the handler had
  to learn both attributes. A rename would have killed the Wellness Hour cards silently —
  the thumbnails would still render and only a click would reveal it.
- **One false positive to know about**: `lOT65KmIIygokvq1EV0J5` on `/index` is a *self-hosted*
  `/uploads/…hero.mp4` whose `title` prop is the literal string "YouTube video", a leftover
  default. Any grep for "youtube" flags it. It is not an embed; leave it alone. `/index`
  correctly still reports `videos: 1` after the swap.
- **Vimeo thumbnails replaced a diagnostic.** The old tell for a third-party film was
  `hqdefault` rather than `maxresdefault` in the thumbnail URL. Owned films now point at
  `i.vimeocdn.com`, so that heuristic only survives for the eight that stayed.
- The rollback snapshot (21 rows, the shell, the plugin settings) is at
  `22-instatic-api-sync/.tmp/vimeo-swap-backup/prod/` — **gitignored, so it exists only in
  this worktree**. Deleting the worktree deletes it.

## Next

1. **Privacy on the Vimeo folder is still wide open** — all 14 films are
   `privacy.view=anybody`, `privacy.embed=public`. Now that the site embeds them, locking to
   `embed=whitelist` on `drnahlah.com` is finally actionable and was the migration's original
   point. Unchanged so far because it changes what the public can see.
2. **Still no `VideoObject` JSON-LD.** Host-agnostic, and the change that actually does SEO
   work. `src/scripts/jsonld/index.js` is where it would go.
3. The `04-design/.tmp/site-src/` static build still emits YouTube. It is no longer what
   serves the site, but anyone rebuilding from it would undo this.
4. #41 / #42 still need one filmed veneer patient from the practice.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
