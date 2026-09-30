# All-on-X "quiz" combo — design source

The new All-on-X ads test for Arvada Dental Center & Implants, from the design attached to Asana
task `1218962992162869` ("Make new landing page - AOX"). The attachment is one page; the campaign
unit is three:

| Page | Local file | What it is |
| :--- | :--- | :--- |
| Landing | `native/out/all-on-x-quiz.html` | The proposed design. The quiz sits in the hero. |
| Consult | `native/out/all-on-x-quiz-consult.html` | The same quiz first, then what the free visit includes. |
| Thank-you | `native/out/all-on-x-quiz-thank-you.html` | Phone number first, no form, what happens next, patient videos. |

```
node native/build.mjs [--refresh-host]   # write the local pages and the Webflow parts
node native/verify.mjs                   # the gate: it clicks through the quiz, videos and CTAs
node native/verify.mjs --staging         # the same gate against webflow.io (once per publish)
node clips.mjs native/out/<page>.html <width> [selector ...]   # readable review crops into shots/
node brand-probe.mjs <url> [url ...]     # re-measure the live site's colours and fonts into brand/
```

## It is authored as a Webflow page

The pages are **native Webflow elements and classes**, so everything a visitor reads can be edited
in the Designer. That decides how the source is written:

| File | Becomes | Rule |
| :--- | :--- | :--- |
| `native/wf.css` | Webflow styles | One class per element, single-class selectors, desktop first, only `max-width` 991 / 767 / 479, literal values. `build.mjs` refuses anything else. |
| markup in `native/build.mjs` | Designer elements | Headings, paragraphs, link blocks, a native form, lists, images. Every class has a rule; a class without one is dropped silently by the builder. |
| `native/code.css` | page head code | Only what a style cannot hold: states the script toggles, the estimate's torn edge, keyframes, the video dialog. |
| `native/site.js` | page footer code | Behaviour only. It reads every word from the page. |

`build.mjs` renders the markup twice from one source: `out/` is what Webflow will publish (its own
`w-` classes, its form wrapper) under the live site's stylesheet, so the local page **is** the
staging page; `07-webflow-build/.tmp/aox-quiz/native/` is what the builder is given.

What is editable in the Designer, and where:

- All copy, headings, buttons, images, FAQ, comparison rows, the estimate.
- **The quiz**: all five steps are on the page (the canvas shows them stacked, because the
  one-at-a-time rule is in head code). Questions and answers are plain text. The "which teeth"
  answers carry `data-arch` (`upper` / `lower` / `both`), which picks the estimate.
- **The estimate's other wordings** are custom attributes on the estimate block (`data-label-*`,
  `data-total-both`, `data-note-both`).
- **Headline variants** for `?hl=dentures|failing|price|monthly` are `data-hl-*` on the H1.
- **The lead webhook** is `data-lead-webhook` on the quiz element. No code edit needed.

Not editable there: the validation messages, which are in `site.js`.

## The brand is the site's

The attachment came in green and yellow, set in Atkinson Hyperlegible. `brand-probe.mjs` measured
www.arvadadentalcenter.com as it renders (evidence in `brand/*.json`):

| Role | Site value |
| :--- | :--- |
| Grounds | `#fdf8ef` body, `#ffffff`, `#f6f3ee` band, `#5f5f5d` dark (the live ad page's hero) |
| Ink | `#222222`, secondary `#5f5f5d` |
| Accent | gold `#c8b282` for fills and rules, `#8c6946` where gold is text on light |
| Headings | `area extended` 700, capitalised, 3rem / 2rem at desktop |
| Body | `Centurygothic` 400 and 700, 17px / 1.5 |
| Buttons | uppercase, square; primary is the site's gold gradient with `#222` text |

The site's most common button is a silver gradient with white text, about 2:1. It is not used for
the primary action; gold with `#222` is 7.7:1.

## What differs from the attachment, beyond the brand

1. Photo slots filled from the practice's own library and its own YouTube stills.
   `transformation-image-1.jpg` is Chris's photograph again, so the square slots take images 2 and 3.
2. Videos open in a dialog, created on click.
3. A submitted lead goes to the thank-you page; the first name travels in `sessionStorage`.
4. No automatic dark theme.
5. The comparison is a grid of blocks rather than a `<table>`, and the process steps carry real
   number and line elements, because a Webflow style has no pseudo-elements.
6. **No caller-ID promise.** "We'll call you from (720) 419-3699" published as a false sentence:
   the site's call tracking rewrites the number wherever it appears.
7. **An empty webhook fails closed on a real host.** Preview (walk through, send nothing) exists
   only on `localhost` and `*.webflow.io`; anywhere else the visitor is told to call.

## Not decided here — blocks launch, not review

- **`data-lead-webhook` is empty.** Until the GoHighLevel inbound webhook is set, no lead is sent.
  `verify.mjs` proves the payload against a local endpoint; test one real submission once it is set.
- **The price.** The design says `$18,795` (and `$235`/mo, `$37,590`, `$471`/mo). On 2026-09-30
  the live cost page says "Starting at $17,795". `PRICE` at the top of `build.mjs` is the one place.
- **Claims the attachment's own checklist asks to verify**, none of which the live site states:
  Google 4.8 / 1,200+ reviews, Healthgrades 4.9, "more than $10,000 below the national chains".
- **"Anna"** — the practice titles the video "Anna's story!", its own lower-third says Angela.
- **Slugs** are working names; whether this replaces the live set is the ads team's call.

## Version Control

Tracked, under the root rules in [SYSTEM_RULES.md](../../../../../../../SYSTEM_RULES.md).
`shots/` and `native/out/assets/host.css` (a copy of the live site stylesheet) are ignored.
