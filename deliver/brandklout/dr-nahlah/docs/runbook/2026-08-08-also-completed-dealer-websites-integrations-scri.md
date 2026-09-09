## Also completed: Dealer Websites Integrations — script moved into the section (2026-08-08)

Page `69ea3dc31e43f8ff9b72e4f8`. **Published.** User's ask was the Themes treatment; the audit showed
this page is *not* broken — its filter works — so the work was the componentize half plus the user's
own requirement: **get the script out of Page Settings so the section can move between pages.**

Architecture here is deliberately different from Themes and must not be "fixed":

```
section.section_filters2         visible: sidebar + an EMPTY feed grid
section.section_filters2.hide    the real Collection List (31 items) — LOAD-BEARING data source
```

A 9,382-char script in Page Settings clones matching cards from the hidden section into the visible
grid. **Do not delete the hidden section** — unlike the Features residue on Themes, emptying it
empties the page. It re-implements Finsweet CMS Filter (the `fs-cmsfilter-*` attributes are present
but the Finsweet CDN is **not** loaded).

Done:
1. New PlainText field **`category-names`** (`ff4ce366…f8b7a`) on Integrations, a pipe-separated
   mirror of the MultiReference `category` — populated on **all 31 items** (2 carry two categories:
   DealerWebsites.com, eBay Motors), verified zero missing via an `exists:false` filter, published.
2. Hidden hook `[data-integration-categories]` bound to it, inside `.event18_category-wrapper` —
   which is **already `display:none` in the design**, so no new class and no visual change. Replaces
   the nested category-tag Collection List as the filter's data source.
3. Script + motion CSS ported verbatim into a **new HtmlEmbed inside the section**
   (`d4ced1c0-…a942a`), reading the hook with the old `.tag.is-alternate` markup kept as fallback.

**Migration guard (this is the subtle part).** Both copies run until the user deletes the Page
Settings one, and two copies binding the same labels would double-fire. The embed copy defers one
tick, claims `window.__dwFilters2`, and **replaces each label with a clone** — which drops the old
copy's listeners, so exactly one copy drives the filter. Becomes a no-op once the old script is gone.

Verified live over CDP, all 12 categories against the CMS: `Auto Marketplaces 12/12, DMS 1/1,
Classified Apps 2/2, Ad posting 3/3, Wholesale Auction 2/2, Inventory Apps 3/3, Lot Services 2/2,
Vehicle History Reports 3/3, Accept Payments 1/1, Live Chat 1/1, Credit / Financing 2/2, Social 1/1`
— zero mismatches, info block tracks, zero console errors, repeat clicks stable.

**Then proved it survives ALONE**: fetched the page, stripped only the Page Settings copy, served it
locally and re-drove it — `scriptsInDoc: 1`, 12 on load, DMS 1, Ad posting 3, Auto Marketplaces 12,
Social 1, no errors. So the section is genuinely portable.

**CLOSED OUT.** The user deleted the Page Settings script and wrapped both sections in one
`.section_integrations` div (`d5978d25-…e7dd`) to convert them together — and hit "still has a nested
collection". **My miss:** step 2 added the hook but never deleted the nested category-tag list it
replaced (`4364429a-…d5f85`), so the blocker was still there. Deleted it; `.section_integrations` now
holds **2 top-level lists, 0 nested** (checked inside each list, not just at wrapper level).

Live page after all of it: **96,289 bytes** (was 100,666), 3 `w-dyn-list`, **0** old script, **1**
section-embedded script, **0** `tag is-alternate`, 31 hooks. Re-drove all 12 categories — every count
still matches the CMS, zero console errors, screenshot renders identically to before.

**Do not report the deselect toggle as a bug.** Clicking the *already-active* filter deselects it and
shows all 31 — pre-existing behaviour, not something the port introduced. It cost time twice: a probe
at 1800ms read `21/12` because a 31-card reveal staggers to `30 × 75ms = 2250ms`, so the count landed
mid-fade. Settled reading is 31/31, and re-selecting returns 12/12. **Any harness for this page must
wait > 2.4s, or it will invent a mismatch.**
