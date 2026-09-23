## 2026-08-28 (session 21b): the editor is a popup, and every page is populated — PUBLISHED AND VERIFIED LIVE

Client feedback: the per-page editor appearing under a list of eighty rows is a
poor experience; make it a popup. And then populate Open Graph and schema on
every page.

Both done. Plugins at **open-graph v1.1.2** and **aeo-schema v1.2.0**;
`verify-seo-plugins.mjs` re-run after the publish — **1590 assertions over all
79 published URLs, all green**.

### The popup: a native `<dialog>`, and the three things it cost

`showModal()`, not a styled div. The top layer escapes `overflow` and ancestor
transforms and the admin shell has both, so a `position: fixed` overlay would
have been clipped by the scroll container the page lives in. The browser gives
the focus trap, the inert background and Escape for free.

- **`::backdrop` cannot be set inline** — one `<style>` injected once. The
  dialog is transparent and unpadded; the visible surface is the host's own
  `Card`, so the popup is themed by the admin instead of by guesses about its
  colour tokens.
- **`inset: 0` + `margin: auto` is what centres it.** The UA sheet does that
  only while nothing else sets margin or inset; the admin's reset does, and the
  first build pinned the popup to the top-left corner.
- **Listen to `close`, not `cancel`.** This is the one that would cost someone a
  session. Cancelling the Escape close-request and closing from React reads
  correctly and is wrong: measured in Chrome, the element closed, the `cancel`
  handler never ran, React went on believing the popup was open, and **the row
  could never be reopened**. `close` fires however the element closed —
  including our own `d.close()` — so it is the single source of truth. The extra
  `onClose()` our own close triggers is a no-op.

A note on driving this under CDP: the first synthetic click after a navigation
or after another interaction frequently does not reach React's handler. It is
the harness, not the page — a second click on the same coordinate always
worked. Do not go looking for a bug in the component.

### Populating all 80 pages

`populate-seo.mjs` writes an explicit override and a schema block for every page
and article, through the plugins' own routes. 80/80 and 80/80, confirmed in the
admin: "80 pages and articles · 80 with a hand-written override".

**Two values are deliberately left DERIVING, and it is the same judgement
twice: never freeze a fallback into eighty rows.**

- The **canonical URL** comes from the site-address setting. Storing 80 absolute
  URLs would turn a domain change into an 80-row edit.
- **`og:description` on the 7 pages with no `seoDescription`** — the derived
  value there is the site-wide sentence, and freezing that as an explicit
  override would re-create the exact defect the Open Graph plugin was written to
  remove, except worse, because it would then no longer follow the setting. The
  seven are `all-on-4`, `dental-conditions`, `implant-supported-dentures`,
  `index`, `meet-dr-nahlah`, `our-team`, `post`. **They need a description
  writing; until then they keep deriving.**

The mirror image of that rule caught a real bug in the dry run. `/` was
deliberately pointed at the doctor's portrait — which is ALSO the fallback
image — so the skip-the-fallback rule suppressed it, and the home page would
have come out with no override and fallen back to the first picture on the page:
**a patient's before photograph, as the share card for the practice's front
door.** A hand-set picture now always wins over anything derived.

**`populate-seo.mjs` is also the re-sync.** Materialising a derived value stops
it tracking its source, so `og:title` no longer follows a CMS title edit.
Re-running it refreshes every stored title and description from the current
content while preserving what a person set by hand (image, alt, canonical URL,
type). Say that to whoever maintains the site.

### One entity, one node — and the gate it broke

`aeo-schema` now collapses graph nodes sharing an `@id`: union of `@type`
(generated first), block wins on any shared property. A stored block therefore
EXTENDS a generated node instead of sitting beside it. `/all-on-4` publishes one
`["WebPage", "MedicalWebPage"]`, an article one `["Article", "BlogPosting"]`, a
subtype added to the type it specialises. Before it, `/privacy-policy` published
two `WebPage` nodes with the same id.

**`@type` is a string OR an array**, and `verify-seo-plugins.mjs` compared it
with `===`. It silently stopped matching and reported **93 failures against a
site that was entirely correct**. Fixed to treat `@type` as a set, and it now
also asserts no `@id` appears twice — the collapse can only regress silently.

### What each page now declares

`ContactPage 3 · CollectionPage 4 · WebPage 11 · Blog 1 · MedicalWebPage 13 ·
MedicalProcedure 12 · MedicalAudience 13 · AboutPage 4 · Person 1 ·
OfferCatalog 1 · FAQPage 1 · BlogPosting 43`

The home page carries an `OfferCatalog` of the ten treatments;
`/meet-dr-nahlah` a `Person` for Dr. Nahlah; each article an `articleSection`
taken from its own `topic` cell, so the schema and the visible chip on `/posts`
cannot disagree.

### Still open

- The **7 pages with no `seoDescription`**, listed above.
- **`sameAs`** is still empty and there is still no `aggregateRating`. Both need
  facts nobody has supplied — Google Business Profile / Facebook / Yelp URLs,
  and a review count the site actually displays. Do not invent either.
- The pages have still never been through **Google's Rich Results Test**.
