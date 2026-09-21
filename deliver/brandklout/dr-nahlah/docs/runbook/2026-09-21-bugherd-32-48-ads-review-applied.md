# 2026-09-21 — BugHerd #32–#48: Brandklout's review of the eighteen ads landing pages

Brandklout (gauge@thrivesquare.com, Safari 1728×962) reviewed the live ads set on 2026-09-18 and
left seventeen pins, #32 through #48. Eleven were code and are **live on production**; three are
someone else's system or need an asset the practice has not given us; two were questions and one
is answered below with the source.

The nine older main-site pins (#13, #14, #24–#31) were **not** touched — they predate this batch
and several wait on the client. They are still open on the board.

## Done (`f1196277`)

| Pin | Asked | Done |
| :-- | :-- | :-- |
| #33 | "No Cost, No Obligation doesn't make sense lets remove this" (hero note) | `lp-hero-note` is now just "Serving {{LOC_CITY}} and Northern Virginia", on all three campaign bodies |
| #35 | rewrite of the first journey card | copy replaced verbatim with the pin's text (All-on-4) |
| #36 | rewrite of the `#why-here` deck | "Every post lands at an exact angle, depth and position, so the arch above it loads evenly, every time." |
| #37, #38 | "Box isn't aligned" on two of four `#why-here` cards | **it was the reveal animation, not the layout.** See Gotchas |
| #40 | `.lp-sec-aside` "No cost · no obligation" — "doesn't make sense remove please" | span deleted from all three campaign bodies; the section CTA is the button alone |
| #43 | "This section needs to be removed across all landing pages, it will get flagged by Google" | `.lp-warn` ("What can happen if treatment is delayed") gone from the three thank-you bodies, and the deck above it no longer says "and why acting now matters" |
| #44 | "The All-on-4 trademark disclaimer is not relevant on the implants pages or veneers pages" | new `{{LP_TRADEMARK}}` token in `build-site.mjs`; the Nobel Biocare sentence is emitted only when `campaign === "all-on-4"`. The implants and veneers pages never use the term (checked: 0 occurrences) |
| #45 | duplicated title tags and Open Graph titles | the two All-on-4 consultation titles lost their doubled city; the four `…, <city>, VA, McLean & Alexandria VA` OG titles became `<Service> \| Dr. Nahlah \| <City>, VA`; the six thank-you descriptions lost the office name they already carried mid-sentence; the two veneers consultation titles gained the missing comma |
| #46 | sentence-fragment meta descriptions | both implant-consultation descriptions replaced with the pin's recommended text |
| #47 | five-year warranty needs proof | **partial, see Next.** No terms sheet exists to link to. Every paid-page mention now carries the condition the All-on-4 pages already published: "conditional on the Precare cleanings every six months". Six mentions, all six done |
| #48 | "Adjust verbiage away from guaranteed results for the smile preview" | ten phrases across the three veneers bodies plus four SEO fields. The H1 is now "See your smile designed *before* any enamel is touched"; every "Digital Smile Design preview **of the result**" is a Digital Smile Design; "you approve the **result**" is "you approve the **design**"; the closer says in so many words that it is a proposal, not a promise of the finished porcelain |

### #39 — "Was this statement validated from the current site?"

Yes. The card is `#why-here` card 4 on All-on-4: "Nitrous oxide, oral or IV sedation. Oral and IV
are administered by a medical anesthesiologist, and transport is arranged both ways."

- `pages/all-on-4.body.html:343` (FAQ, live at `/all-on-4`): "Nitrous oxide, oral sedation and IV
  sedation. Oral and IV are administered by a medical anaesthesiologist and need transport
  arranged both ways." — the ads card is this sentence.
- `pages/sedation-dentistry.body.html:84` and `:93`: oral sedation is "under the **supervision of**
  a medical anaesthesiologist. Transport both ways needs arranging in advance"; IV sedation
  "Transport both ways is required."

One wrinkle worth Brandklout's call, **not changed**: `/all-on-4` says "administered by" and
`/sedation-dentistry` says "under the supervision of". Both are already live; the ads page mirrors
the stronger of the two. If the practice wants the softer phrasing on paid traffic, it is one word.

## Not done, and why

| Pin | Blocker |
| :-- | :-- |
| #32 | "Continue Button and Preferred Method of contact removal" — both are fields of the **LeadConnector form**, not of the page. The page embeds `inline-<formId>`; the field list and the Continue step are configured in GHL. Nothing in this repository can change them |
| #34 | "Can we upload this on Vimeo?" — yes, technically, but it is not free. The hero film is the page's **one real YouTube `<iframe>`**, which is what makes Instatic lift CSP `frame-src` for the click-to-play facades further down. Moving it to Vimeo means adding `player.vimeo.com` to Embed Origins `frameOrigins` (read-merge-write; `autoTrust` does not cover runtime iframes) and re-uploading the film to the shared agency Vimeo account. Worth doing as its own job, with the other thirteen films, not as a one-off |
| #41, #42 | "Dental Implants video needs to be replaced with Veneers Video" — **there is no veneer patient film.** The library's fourteen films split six the practice's own (maxres) and eight generic-presenter clips that are not Dr. Nahlah (hqdefault). All three cosmetic titles — Seven Steps of Veneers, Smile Makeovers, Fixing Grey Lines — are in the generic eight, and a generic presenter must not go on a paid page. This is "Next" item 4 from the 2026-09-18 run and still is |

## Verified

| Gate | Result |
| :-- | :-- |
| `check-page-lists.mjs` | all three page lists agree, 55 pages |
| `css-vocab.mjs` | 10 problems, **all pre-existing** (pagekit vs blog); none names `landing`, `lp-next-list` or `lp-next-head` |
| `site-test.mjs`, the 18 ads pages | 282 pass / 37 fail; every failure is `privacy-policy.html, terms-conditions.html` **unresolved because only the 18 ads slugs were in the run's page set** — the gate resolves links against the pages it was given. Both files exist in `final-site` and answer 200 |
| `fluid-qa.mjs`, the 14 pages whose markup changed, at 360/390/768/991/1280/1440/1920 | **210/210** |
| staging draft write | 18/18 read back byte-identical on node, image, section and embed counts; templates intact |
| `verify-ads-live.mjs https://staging.drnahlah.com` | 18/18 pages; 72 failures, all four site tags × 18, the known staging gap (its Embed Origins is 1.4.0, no `siteScripts`) |
| published staging thank-you page at 1440 | eyeballed; the rebuilt "on the call" row matches local |
| `verify-ads-live.mjs https://www.drnahlah.com` | **all eighteen pages verified** |
| live production spot-check, four pages | `lp-warn` 0, "no cost, no obligation" 0, "See your veneers before you have them" 0, Nobel Biocare only on the All-on-4 pages, no `data-rv="stagger"` on a 4-up card row, all four new copy strings present |

`publishedPages: 56` on both hosts, unchanged. `draftMatchesPublished` was `true` on production
before the push, so nothing else rode along.

## The board

Written back on 2026-09-21 with `workflows/05-design-revisions/close-bugherd-2026-09-21.mjs`,
which carries the exact text posted. Eleven pins moved to `done` with a note on what changed;
the six that are answers, partials or blockers kept their status and got the reason.

| | Pins |
| :-- | :-- |
| `done` (11) | #33, #35, #36, #37, #38, #40, #43, #44, #45, #46, #48 |
| still `todo`, commented (6) | #32 (GHL), #34 (Vimeo), #39 (answered, one open question), #41, #42 (no veneer film), #47 (needs the terms document) |

Re-pulled afterwards: 11 done, 6 open, one comment on each of the seventeen.

## Next

1. **A warranty terms sheet from the practice** (#47). Six paid-page mentions of the five-year
   warranty now state the Precare condition, but none of them links to terms, because none exist
   anywhere on the site. Once we have the document it is a page plus six links.
2. **#32 in LeadConnector**: remove the Continue step and the "Preferred Method of Contact" field
   from all six forms. Same visit as the still-open redirect-to-thank-you work.
3. **A filmed veneer patient** (#41, #42), and a photograph of the Alexandria office.
4. **Decide on Vimeo** (#34) for the film library as a whole.
5. The nine older pins, #13, #14, #24–#31, are still open and untouched by this run.
6. Still open from 2026-09-18: LeadConnector thank-you redirects, Google Ads conversions.

## Gotchas

- **"Box isn't aligned" was the reveal, not the grid.** `.pk-card` is a stretched grid item and the
  row's cards are always the same height; what the reviewer screenshotted was `data-rv="stagger"`
  caught mid-flight — `js/20-pagekit.js` tweens `y: 30 → 0` with a `.09` stagger, so at any instant
  during the ~1.2 s the four bordered boxes sit on a staircase. Two pins, two cards, one cause. Fix
  was to give the nine `.pk-cards` rows on the ads pages a plain `data-rv`, so a row of bordered
  boxes lands as one block. **A bordered card row must not stagger on Y.** The rest of the site
  keeps the stagger; only the ads pages changed.
- **`.sp-copy` is styled as `.pk-split .sp-copy`.** Removing the `.lp-warn` column left `.pk-split`
  with one child, and unwrapping it silently dropped the copy's `display:grid`, its `1.1rem` gap and
  its `56ch` measure. The list now carries its own measure in `70-landing.css` and the heading above
  it got `.lp-next-head` for the gap it used to inherit.
- **Deleting half a two-column section leaves a hole.** With `.lp-warn` gone the numbered list sat
  at 62ch against an empty right half at 1440. It is now three across from 1040px up, with a
  hairline between rather than under. Check the band, not just the diff.
- **`seo.json` is CRLF and 2-space.** `JSON.stringify(seo, null, 1)` plus an LF write turns a
  22-line edit into a 3,476-line diff. Re-serialize with indent 2 and `\r\n`.
- **The `--project` guard in `pull-bugherd.mjs` still works**; the board is project 537587 and the
  list endpoint still hides `url`, `selector_info` and the screenshot, so the detail call is still
  the only way to know where a pin is. Several of this batch's pins (#35, #36) have a *rewrite* as
  the description with no other words — the screenshot's highlight is the only way to know which
  sentence they replace.
- **`.tmp/ads-nodes` (2026-09-18) was left alone**; this run converted into `.tmp/ads-nodes-bugherd`
  so the previous node documents stay on disk as the rollback source.
- **fluid-qa still starves in the background.** Two runs sat at zero bytes for four minutes; in the
  foreground, three pages at a time, each batch finishes well inside the tool timeout.

## Version Control

This run file follows the runbook rules in [SYSTEM_RULES.md §5](../../../../SYSTEM_RULES.md).
