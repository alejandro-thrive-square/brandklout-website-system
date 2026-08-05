# Shared Learnings — from the Arvada build, for the rest of the Brandklout batch

Authored 2026-08-05 while building Arvada's six landing pages. Everything here is client-agnostic
and meant to be reused by Grand Mission, Mason Park, Stone and Dr. Nahlah.

Linked from [ASANA-DISPATCH.md](../../docs/ASANA-DISPATCH.md) in two lines, deliberately — that file
is edited by every worktree and long edits there cause merge conflicts. Put shared findings in your
own client folder and link to them.

> [!NOTE]
> **No commercial terms here.** Brandklout is a partner engagement, not a per-page client;
> `sales/PRICING_TIMELINE_RULES.md` does not apply anywhere under `deliver/brandklout/`. Scope and
> page count matter only for sequencing and capacity.

## 1. Every reference in this batch is the same page underneath

Strip the styling and all nine references run the **same nine beats**:

> hero → qualifier → offer → mechanism → proof → doctor → process → FAQ → close

What varies between pages is **which beat leads** and **how loud the offer is** — an emergency
visitor and a full-arch visitor are at opposite ends of the deliberation spectrum and cannot be sold
the same way. Full per-reference extraction, including the copy angles worth stealing and the ones
worth refusing:
[`../workflows/01-content-intake/.tmp/reference-structure-notes.md`](../workflows/01-content-intake/.tmp/reference-structure-notes.md).

## 2. All four recurring archetypes now have a working implementation

At [`../workflows/04-design/.tmp/`](../workflows/04-design/.tmp/): implants, All-on-X,
cosmetic/veneers, and the new-patient special (built twice, once for search intent and once for
neighbourhood intent).

They share `_shared/brand.css` and `_shared/brand.js`, which between them provide: a token system
with light/dark section bands, a mountain-ridge section motif, the stepped qualifier, an accessible
FAQ accordion, form validation with a single swappable `submitLead()`, a live opening-hours pill, the
offer "ticket" component, a reveal system with a proper reduced-motion path, and a sticky mobile
action bar.

**Re-skin the tokens; do not rebuild the components.** The `:root` block is the only part that should
need to change for another practice.

Two things in there are worth copying regardless of design direction:

- **`submitLead()` is the single lead choke-point.** No client in this batch has a GoHighLevel
  endpoint yet. Routing every form through one function means wiring GHL up later is a one-function
  change rather than a hunt.
- **The live opening-hours pill.** Several references headline "Open Now" and guarantee same-day
  appointments. If your client is not actually open, do not copy that claim — compute the real state
  and say it.

## 3. Two scrapers, because these sites fight back

Both in [`../workflows/01-content-intake/.tmp/`](../workflows/01-content-intake/.tmp/):

| Script | Problem it solves |
| :--- | :--- |
| `capture.mjs` | Dental sites in this batch sit behind SiteGround **sgcaptcha** and Cloudflare. `curl` and `WebFetch` get a `202` interstitial or a `403`, never the page. This drives headless Chrome over CDP, waits the challenge out, and dumps rendered HTML, a structured `meta.json` and full-page PNGs at any widths you ask for. |
| `fetch-assets.mjs` | The challenge covers **images** too, and specifically intercepts *scripted* requests — an in-page `fetch()` for a `.webp` returns `text/html` even with the cookie set, while the browser's own `<img>` loads fine. This reads the original bytes off the network log with `Network.getResponseBody` while the real pages load, which also avoids the re-encoding a canvas round-trip would cause. |

Gotchas both scripts already handle, which cost time to find:

- **Wait on the document's identity, not its size.** The sgcaptcha interstitial is ~12KB, so a
  byte-length check sails straight past it. Check the URL and title instead.
- **`HEADED=1`** runs a real window for sites that fingerprint headless Chrome.
- **Set `Accept-Language`.** `smilecenter.com` serves Spanish without it.
- **Assets are gitignored repo-wide** (`*.webp`, `*.png`, …). Commit the `assets-manifest.json` the
  script writes; it is the record that lets anyone re-fetch.

## 4. Screenshots cannot verify these pages

A static capture of any page in this batch shows **blank sections**, because nothing has scrolled and
so `IntersectionObserver` never fired. Two consequences:

- Use [`../workflows/04-design/.tmp/_shared/preview.mjs`](../workflows/04-design/.tmp/_shared/preview.mjs)
  to render previews — it scrolls the page first.
- Verify behaviour by driving it, not by looking at it.
  [`../workflows/08-qa/.tmp/qa.mjs`](../workflows/08-qa/.tmp/qa.mjs) is a 238-check suite covering
  the qualifier, form validation, FAQ, live status, responsive overflow at five widths, and
  reduced-motion. Point it at another client's pages by editing its `PAGES` array.

**Scroll at human pace when testing.** At 0.6 viewport-heights every 130ms the harness outran
IntersectionObserver and under-reported reveals as a failure; 0.45vh / 220ms is honest. Also check
image integrity *after* scrolling, or every `loading="lazy"` image reports as broken.

## 5. Two contrast traps in dental brand palettes

Both caught on Arvada, both likely to recur — these practices favour bright cyan and amber:

- Bright cyan (`#03c5ec`) as text on a light band is **1.9:1**. It fails even the 3:1 large-text bar.
- Amber (`#fb8e28`) on a light band is **2.2:1**.

Keep a darkened text-safe variant of each brand colour for anything that is *read*, and reserve the
bright brand values for fills, icons and text on dark bands.

## 6. The Greenspot reference is unretrievable — do not burn time on it

`greenspotcrossingsdentistry.com/lp/59-nps/` is cited by **two** Arvada tasks and is the same
archetype Mason Park's *New Patient Special* needs. It returns a hard Cloudflare `403` — a WAF rule,
not a JS challenge, so headed Chrome does not help either, `WebFetch` gets the same, and the `/lp/`
path is not in the Wayback Machine (the rest of the domain is).

Use `sites.leadconnectorhq.com/preview/fhJtcZQi3uNr35Y2kKYC` instead — a `$189` new-patient-special
page, same archetype, captured successfully at
[`../workflows/01-content-intake/.tmp/reference-captures/ref-nextdoor-ghl/`](../workflows/01-content-intake/.tmp/reference-captures/ref-nextdoor-ghl/).
Its testimonials are **lorem ipsum placeholders**, which is a useful reminder of what not to ship.

Worth someone asking Brandklout for a screenshot or PDF of the Greenspot page.

## 7. Ask Brandklout once, for the whole batch

These came up on Arvada but are almost certainly batch-wide:

1. **Which phone number should paid traffic use** — practices in this batch run call-tracking lines
   alongside their main number.
2. **Where form submissions post** — no GoHighLevel endpoint, form ID or location ID has been
   supplied for any client.
3. **The Asana attachments** ("originals from the other Ad company") have never been downloaded for
   any client. `get_attachments` is available in the MCP tool set.
4. **Check the client's own site for a published offer before assuming there isn't one.** Arvada's
   was on a page not linked from the main navigation.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md).
