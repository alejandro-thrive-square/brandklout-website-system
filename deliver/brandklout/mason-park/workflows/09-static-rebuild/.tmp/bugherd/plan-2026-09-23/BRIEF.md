# BugHerd 2026-09-23: per-note photo plan (brief shared by every planning agent)

Working dir: `deliver/brandklout/mason-park/workflows/09-static-rebuild/.tmp/bugherd` (run everything from here).
Site: Mason Park Dental (ADULT general practice, Katy TX). Local source `../../home/<page>/index.html` is identical to staging.

## Inputs
- `resolve-2026-09-23.json`: one record per open note: `n`, `text` (the note), `page`, `sel` (selector from the live page),
  `slot` (section / card index "k/N" / current img basename / rendered w x h at 1440), `att` (attachment files in `screens-2026-09-23/`), `shot`.
- `screens-2026-09-23/<n>.jpg`: BugHerd's screenshot of the note, with the pin. `screens-2026-09-23/<n>-att1-*.png|jpg`: the photo the agency attached.
- `tasks-2026-09-23.json`: raw BugHerd records if you need more.

## For each of your notes
1. Read the screenshot AND the attachment (the Read tool shows images). Confirm the slot the resolver found is the one the pin is on.
   If they disagree, trust the screenshot and say so (selectors lie on stacked/staggered layouts).
2. Decide the action:
   - `replace`: swap the current image in that slot.
   - `add-media`: the card has no photo; "use the same format as 01" = give the card a `svc-card_media` photo on top like card 01 has.
   - `other`: not a photo placement (explain in `notes`).
   - `skip`: attachment empty/unusable (explain).
3. Pick the crop. Get dims with `node ../frame.mjs --dims <file>`; for a grid to aim with, `node ../frame.mjs --probe <file>` writes `<file>.probe.png` (Read it).
   The box is SOURCE pixels `x,y,w,h`, must stay inside the image, and must be EXACTLY the slot aspect (within 1%):

   | slot | aspect w:h |
   | :-- | :-- |
   | `.ch-qualify .svc-card_media` (and contacts `#reach`) | 4:3 |
   | `.ch-why .svc-card_media` (incl. contacts `#who`) | 16:10 |
   | `.pa-shot` (process path cards) | 4:3 |
   | `.svc-overlap_media` (compare / treatment / finding overlaps) | 3:2 |
   | `.pr-portrait`, `.el-wall_photo`, `.bl-art_shot`, `.rg-arc` big shot | 4:5 |
   | `.ar-bg` (arrival hero background) | 16:9 (it covers ~2.2:1, subject in the middle band, object-position 50% 32%) |
   | `.iv-shot` | 16:9 |
   | `.el-pair_frame` | 4:3 |
   | `.el-mosaic_tile`, home `#people` banner, our-services `#practices` | use the rendered w/h from `slot` |
   | `.rg-thumb` (home range index thumbnails) | 4:3 |

   Place people well: never cut a face or a person in half at the edge; the mouth/teeth when the card is about a mouth.
4. Widths: default `410,768,1024,1536`. If the box is narrower than 1536, drop widths above the box width; an upscale of up to ~1.2x is fine with `upscale: true`.
5. Alt text: what is in the picture, plainly, <= 110 characters, no "image of". Written for this card's topic.
6. FLAG in `notes` (and still plan it unless it is disqualifying): watermark, brand logo or visible product text, text baked into the image,
   AI artefacts (malformed teeth/hands/fingers), a CHILD patient (this is the adult site), a screenshot of a web page instead of a photo
   (crop the photo part), box narrower than ~600 source px, the same photo already used elsewhere on the same page.
7. Notes that say "the same for all pages" / "do the same for all pages": say what you think the reviewer means, and list (grep `../../home`)
   every other page that carries the same slot, with the image it has now. Do NOT expand it yourself; I decide.

## Output
Write ONE file: `plan-2026-09-23/<your-group>.json`, an array, one object per note:
```json
{ "n": 133, "action": "add-media", "page": "/services/oral-cancer-screening/", "section": "qualify", "card": 2, "cardName": "White or red patches",
  "slot": "qualify svc-card_media", "current": null, "src": "screens-2026-09-23/133-att1-image.png", "srcDims": "1200x800",
  "box": "0,0,1067,800", "aspect": "4:3", "widths": "410,768,1024", "upscale": false,
  "key": "n133-white-patch-tongue", "alt": "A white patch on the side of the tongue",
  "source": "client image attached to BugHerd #133 on 2026-09-21 (1200x800); cropped 4:3 on the patch", "notes": "" }
```
`key` must be unique: `n<note>-<2-4 word slug>`, lowercase, hyphens. `current` is the basename in the slot now (or null).
For slots that are not a card (hero, overlap, portrait...), `card` is null and `section` is the section id.

## Hard rules
- Do NOT run `frame.mjs` with a key (it writes the shared album-manifest.json and the uploads folder). Only `--dims` and `--probe`.
- Do NOT edit anything under `../../home`, do not commit, do not touch BugHerd.
- When done, reply with: count planned per action, and every FLAG, one line each.
