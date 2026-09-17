## DRAFT 2026-08-27 (pin #11): no page repeats an image — 58 images changed, NOT PUBLISHED, NOT COMMITTED

BugHerd #11, pinned on `/smile-makeover`'s process grid. 19 of 37 pages repeated
an image in their own content; 0 do now. Client report:
`05-design-revisions/.tmp/bugherd/pin-11-report.md`. Draft seq 108 after my last
write.

### The finding that matters more than the fix

**The media library holds byte-identical uploads of the same photograph under
different filenames.** `lab.jpg` **is** `tech-hero.jpg` — one 215,637-byte file,
two asset ids. Also `sedation.jpg` = `sedation-patient.jpg` =
`sedation-dentistry-patient.jpg`, `crown-model.jpg` = `dental-crowns-model-2.jpg`,
`multiple-dental-implant-model.png` = `multi-implant-model.png`.

That single fact caused the repeat the client pinned — the three identical lab
photographs in `/smile-makeover`'s `.pk-cards-4` were two filenames — and
accounted for repeats on eight pages. **Comparing filenames or asset ids will not
find it. Compare the bytes.** 163 more duplicate-upload groups sit unused in the
library.

And the weaker signals are not enough on their own: `sizeBytes` + `blurHash`
agreeing looks conclusive and is not. Of 196 metadata-collision candidates that
actually render, **117 were NOT byte-identical** — the before/after case pairs
collide on blurHash because it is only 4x3 DCT components. `audit-page-images.mjs`
therefore hashes the bytes of the collision candidates that are on a page (~197
files, seconds) and demotes the rest.

### Where images live on this site

Every rendered image is a `base.image` node with `props.src` = the asset's
`publicPath`. Verified, not assumed: `/smile-makeover` has 23 `base.image` nodes
and exactly 23 `/uploads/` strings, and **none of the 885 style rules carries a
`background-image`**. So walking the node tree is complete coverage. The only
other `/uploads/` reference on the whole site is the og:image inside
`src/scripts/seo-head.js`, which renders nothing.

Alt text lives on the **asset** (`altText`), not on the node — `props.alt` is
absent everywhere.

### Tools added (re-runnable; read-only unless flagged)

- `audit-page-images.mjs [--after]` — the inventory. Walks all 37 pages in DOM
  order, groups by byte-identity, classifies CHROME vs CONTENT, and reports the
  posts table too. Writes `image-audit.<tag>.{md,json}`.
- `audit-round-corners.mjs [--after]` — decodes every PNG with `zlib` (no
  dependency) and screens every JPEG through the CMS's own `blurHash`. Reads the
  matching `image-audit.<tag>.json`, so run the two with the same flag.
- `dedupe-page-images.mjs [--apply]` — the fix. A 57-row plan keyed by node id
  with an asserted `expect` filename, a contact sheet, and a **simulation that
  refuses to run if the plan would leave any page repeating**.
- `resolve-home-image-clash.mjs [--apply]` — the one cross-agent collision, below.

### Gotchas earned, in the order they cost me time

1. **`#nav` and `.foot` are in EVERY page's own node tree.** A naive duplicate
   count reports the logo as a 37-page repeat and buries every real finding. The
   classifier is structural (`/^#nav$|^\.nav|^\.foot|^#drawer/`), not
   filename-based — `logo.png` is chrome in `.nav-logo` and would still be a
   defect in a process card. Deliberately NOT chrome: `.brandmark` (the
   CareCredit / Proceed / LendingClub logos, which are real page content) and
   `.rv-head` (the Google mark on the review wall).
2. **`/post` is the entry template.** Its image srcs are binding tokens
   (`{currentEntry.featuredMediaPath}`), so the hero and the related cards look
   like the same src while rendering a different photograph per article.
   Counting them is a false positive.
3. **"Transparent corners" is NOT how you find a rounded crop.** That is just a
   PNG cut-out, and this library is full of legitimate ones. My first pass
   flagged 22 of the 23 PNGs, which is the same as flagging nothing. The real
   test is **corners transparent AND all four edge midpoints opaque AND >70%
   coverage** — a circle inscribed in a square touches all four edge midpoints;
   a cut-out object does not. All nine true offenders came back at exactly 79%
   coverage, which is π/4: they were perfect circles.
4. **`sizeBytes` is the field, not `size`.** My first signature used
   `a.size ?? a.byteSize ?? …`, all undefined, so every duplicate-upload group
   was silently skipped and the pinned `/smile-makeover` defect did not
   reproduce. The asset shape is `{id, filename, mimeType, sizeBytes, publicPath,
   width, height, blurHash, dominantColor, variants[]}`.
5. **A page write through `PUT /site-document` drops `seoTitle` and
   `seoDescription`** — `pageToCells()` does not carry them, and **33 of the 37
   pages have them**. Capture before the write and re-apply after with
   `PATCH /data/rows/:id`, which does merge. Both my scripts do this; if you
   write a page any other way, do it too.
6. **31 media uploads take longer than the 2-minute tool timeout.** The first
   `--apply` died after 11 uploads — and a Freepik download SPENDS QUOTA, so
   re-running would have paid for those 11 twice. The upload ledger
   (`.tmp/pin11/uploaded.json`) is now written **after every single upload**, and
   a key already in it is skipped. Run long applies with `run_in_background`.
7. **Freepik's relevance ordering is loose.** "zirconia dental crown laboratory"
   returned ceramic *cups* at rank 0; "temporary dental bridge prosthesis
   fitting" returned an open surgical field with blood. Every search entry now
   carries a `must`/`avoid` title sieve, and **every survivor was looked at as a
   picture from the free 626px preview before any download was spent.** Do not
   skip the eyeball step — the title lies.
8. **Check the render frame before choosing an image.** `.pk-card-fig-pad` and
   `.mz-plain` are `object-fit: contain` + padding on a flat card — variants that
   exist *because* the art was a cut-out. Where the replacement is a photograph
   the class comes off (5 nodes); where the tile genuinely holds a model render
   among other model renders it stays, because dropping it from one leaves a
   single full-bleed photo in a row of padded models. The same reasoning made me
   re-pick a render that was clean but on hot pink, for an *unpadded* card.

### The cross-agent collision, and the real lesson

Pins #8 and #11 both reached for `8L6A7479.jpg` (the practice's intraoral scanner
— the only unused "digital" photograph in 443 assets) and after both writes
landed it rendered twice on `/index`. Neither of us was wrong alone.

I moved mine: `#services` is the section the client pinned on #8 and they had
eleven cards to fill, while I had one card of four and a licensed alternative
already in hand. Fix: `resolve-home-image-clash.mjs` — idempotent, and it no-ops
if the clash is already gone.

**The lesson: `NOTES-images.md` only works if the claim is written down BEFORE
the asset is used.** I wrote a long warning into that file and claimed nothing in
its table, and that is precisely what let the collision through.

### Deliberately not changed, and why

- **`team-hana.png`** on `/our-team` — a real dental assistant, circularly
  cropped, among four square staff photos. Swapping a named employee for stock
  photography is a worse error than the crop. The practice must supply the square
  original; it is a one-file change once they do.
- **`allon4.png`** on `/all-on-4` — a detector false positive, confirmed from the
  pixels. A 3D render whose translucent blue backdrop reaches all four edges.

### Left for someone else

**All 43 post rows carry a `featuredMedia` and 14 assets are used twice**
(`MAX_USES = 2` in `post-image-pool.mjs`). Invisible on an article page; 14
visible duplicate pairs on `/posts` once the cards render — the same defect as
this pin. The list is in `briefs/NOTES-posts.md` for whoever owns the posts
table. Clearing it needs 14 more distinct images.

One licensed picture (the implant-supported overdenture, on
`/implant-supported-dentures` and `/dental-implants`) sits on a blue studio
backdrop while its two row-neighbours are on white. It is the only accurate
photograph of that prosthesis in the catalogue, so accuracy won over palette.
Flagged for a designer, not blocking.

### Before publishing

Nothing here is published or committed. The draft also carries pins #8, #9 and
#10 plus two earlier sessions' unpublished work. Re-run
`node audit-page-images.mjs --after` after any further image edit — it is cheap,
and it is the check that catches a new collision.
