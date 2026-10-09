# 2026-10-09 · BugHerd round 3 (#39-#112) and the two hub pages: 73 pins closed, 2 waiting

Asana `1219333478027729` ("Create two new pages on the website", links BugHerd #59 and #60) plus every
other open pin on board 541030: 75 open pins from `agency@brandklout.com`, made 2026-10-07/08 in Chrome
at 2560×1305. Pulled with screenshots and attachments by id (`workflows/08-qa/.tmp/bugherd/2026-10-09/`,
`fetch-attachments.mjs`, contact sheets in `sheets/`). Everything went into the LIVE draft as surgical
edits by one script, `workflows/21-instatic-upload/apply-bugherd-round3.mjs`, on **production and on
staging** (it translates class names per instance). No push.

## Done

| Pins | Where | Change |
| :-- | :-- | :-- |
| #59 #60 | new pages, nav | **`/surgery-and-care`** (7 photo cards: IV sedation … General dentistry) and **`/the-practice`** (6 cards: Our team … Contact): cloned chrome, split cover, `section_post-index[data-hub]` card grid, invitation with their own "Where next"; SEO cells + `data-seo` (canonical, CollectionPage JSON-LD). Primary nav on all 81 main pages: Implants · **Surgery & Care** · Technology · Dr. Barriere · Results · **The Practice** · Contact |
| #39 #41 #42 #55 | every statement / home reality / compare | No pin, no scroll-writing: every word, column and row shown (`wla-review-3.js` releases the pins; `wla-review-3.css` holds the end state). Compare: the three gold boxes at once |
| #45 | every ledger | No pin; every row readable; the row under the pointer lights (gold bar, gold title, the others dim) |
| #49 | every before/after | No pin; hover swaps to the after and back; tap on touch; Enter/Space on keyboard (`role=button`, `aria-pressed`) |
| #43 #46 | every pinned steps | Gold "Scroll" cue with a moving line under the counter, fades at the last step |
| #50 #51 #96 / #97 / #66 / #64 | fonts | Proof headings Lora SemiBold; proof quotes Cormorant Garamond SemiBold (measure 24ch); statement banners (and the home reality line) Lora SemiBold; FAQ heads Playfair Display SemiBold. Variable woff2 (Latin) as media, own family names |
| #44 #56 #63 #72 #74 #76 #78 #80 #82 #88 #89 #92 #103 #111 | 14 pages | The pinned section moved up to sit right after the cover, "The Reality" second ("swap with the first one" read as #44/#56 spell it out); chapters renumbered |
| #98 | /our-practice | The Team before The Rooms |
| #65 | 81 pages | Footer: name + line centred on two lines (`.footer_brand`), then five columns in one row (office, hours, three link groups) |
| #94 | /general-dentistry | Statement left, the six services as an FAQ-style accordion on the right (`data-st-services`, reuses `.faq`); the rail chapter removed |
| #52 #53 | /technology | "Your questions about our technology, *answered.*", tag "Frequently asked questions" |
| #90 #109 (+3) | 5 headings | Punctuation after an `<em>` moved inside it, so the comma never wraps alone (also /financing, /sedation-dentistry, /zirconia-fixed-bridge) |
| 34 image pins | 25 pages | Replaced with the attachment (#47 also on the six neighbourhood pages with the same four-visit plan). 29 attachments were the site's own media (perceptual match, reused); 5 new photos uploaded as `patient-smile-portrait-1..5.jpg` with alt text on the asset. Focal points from face positions against each slot's box |
| #54 #68 #91 #95 | 4 images | Recentred (focal point; #54 #95 #77 also lost the parallax overscan that cut heads) |

**Waiting:** #25 (All-on-4 card, still no attachment; asked 10-07) and #69 (/hybrid-dentures steps, no
attachment; asked today). Both stay open on the board.

**Nav, decided here:** seven links do not fit beside the phone number and the chapter readout. Measured
1024-1920 (`scratchpad/navfit.mjs`): with the phone and the readout out of the bar the links fit from 1280
up; at ≤1279 (standard Laptop breakpoint) they fold into the menu, which has them all. The phone stays on
the cover buttons, the invitation, the footer and the phone bar. Ad pages untouched (`body.is-lp`).

## Instances

| | Production | Staging |
| :-- | :-- | :-- |
| Class names | old (`b-statement`, `fp-X-Y`) | Client-First (`section_statement`, `object-position-X-Y`) |
| Writes | seq 39 (81 pages + shell), 40-41 (hubs), 42-44 (focal/CSS follow-ups), 45-47 (hubs rebuilt, descriptions ≤160) | seq 11-15, 16-18, same set |
| Publish | 89 pages, draft = published | 89 pages, draft = published |
| Media | `upload-media.mjs --only` (9 files) | `upload-files-to.mjs` → `.tmp/media-map.staging.json` |

## Proof

- `snap-pages.mjs`: two captures of the unchanged site diff to 0 lines; after the patch every main page
  differs only by its nav/footer/own edits, the 6 ad pages by the two new asset tags, 2 pages NEW.
- `verify-round3.mjs` (headless Chrome, both instances): pins left only on the steps (and the home page's
  answer/precision/transformation, not in scope); statement in "Lora WLA", word opacity 1; cue shown;
  compare columns opacity 1 with gold borders; proof `clip-path: inset(0)` on hover; tap swap at 390;
  nav no overflow at 1920/1440/1280, menu at 1100; 42 image slots rendered and looked at.
- Published HTML carries the promoted focal classes (`fp-60-20` on /faq, `fp-100-50`, `fp-10-40`).
- BugHerd: 73 done, #25 and #69 todo (checked by id after the replies).

## Source (`workflows/04-design/.tmp/site-src`)

Mirrored by a sub-agent, file edits only: `node build.mjs --strict` exit 0, 89 pages, `class-audit --local
--strict` 414 classes, 0 out of bounds (run from main's copy of the tool: the client copy cannot find the
style-guide assets outside this checkout). Images in the page modules plus `templates/neighborhoods.mjs`
and a `CARD` override in `templates/blog.mjs` (cards 13/15/43 only); chapter order is array order;
`statement({services: {items}})` and a shared `faqItem` in `lib/blocks.mjs`; `postindex` `hub` variant;
`pages/surgery-and-care.mjs`, `pages/the-practice.mjs`; nav + footer in `lib/layout.mjs`; the new CSS/JS
as `css/06-review-3.css` and `js/95-review-3.js` (also in push-site's `TOKEN_FILES`). Two latent source bugs
fixed on the way: `lib/image-map.mjs` only stripped `fp-` focal classes after the class rename, so some
images carried two `object-position-*` (about 12 pages change in the local build only); and an
`ASSET_ALT` table keeps alts the library holds for photos whose last source placement this round removed.
Small known differences from live: `cover_image` on two covers, empty alts on post-index cards (as on all
cards).

## Gotchas

- **A node pointing at an ambient rule renders no class** (trap 47): the 10-07 /faq focal fix (#22) never
  showed. Promote the focal rule to `kind: "class"`; on staging also fix its stale `name`.
- **`is-after` is taken** in the class map (new name of `ba-label--after`): the script refuses new classes
  that collide; the swap state is `is-swapped`.
- **The BugHerd list endpoint pages at 100**: this board has 112. `reply-round3.mjs` addresses pins by
  global id from the by-id pull.
- **`upload-media.mjs` is not safe on a second host** (newest-100 list): `upload-files-to.mjs` derives the
  staging map from production's, because the clone shares `/uploads` paths.
- Several reviewer picks exist only as 800px library files (front-desk-receptionist, cbct-emily,
  doctor-patient-2, patient-under-sedation, patients-eating), two of them in hero slots (/implant-cost,
  /what-to-expect): soft at 2x. Drive's sign-in has expired (`node scripts/drive.mjs auth`); its folders
  hold case photos, not the practice shoot.
- This reviewer now asks for LESS scroll-pinning (static statements, hover instead of scroll). Opposite of
  the early Brandklout feedback; ask before adding pins on this site.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../SYSTEM_RULES.md).
