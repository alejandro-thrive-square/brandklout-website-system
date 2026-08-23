# Kindness RAINS Eternal — Platform Recommendation & Quote

**Date:** 2026-07-30
**Prepared for:** kindness RAINS eternal (Andrew P Lee)
**Prepared by:** Webzite

All pricing follows [PRICING_TIMELINE_RULES.md](../../../sales/PRICING_TIMELINE_RULES.md) — $200/page design, $200/page development, 1 day per line item. Migration-specific work is quoted separately per [offer-migration-to-webflow.md](../../../sales/process/01-define-offers/offers/offer-migration-to-webflow.md).

## 1. What I found

I audited every page of the live site and read the full MUSED brand guide. Two things stand out.

**The real problem isn't the visual design — it's the structure.** `Music`, `Song List`, `Lyrics` and `Backstories` are four separate pages describing the same six songs. Someone who wants to hear *Inner Space*, read its lyrics and read its story visits three pages and finds the title in each. Every new release means editing four pages by hand. The catalogue is explicitly planned to keep growing through 2026–2027, so this gets worse, not better.

**The mailing list — the site's most valuable asset — doesn't exist.** The homepage and the kRe:Atives page both ask people to join and promise a free 2026 songbook to early members. There is no signup form anywhere on the site. Every visitor who wanted to say yes had no way to. Fixing that is worth more than any amount of restyling.

Secondary: the old blue `kRe.` logo is still live, the homepage opens on a full-screen photo with no headline or call to action, and the navigation is unstyled text in the bottom-left corner of a background image.

## 2. One correction to a premise

The brand guide states that the type hierarchy was chosen from fonts available inside Bandzoogle, so Andrew could apply it himself without switching software. MUSED scoped the identity assuming the site stays where it is.

That assumption doesn't survive contact with the actual constraint, but it also costs nothing to drop: **Rubik, Fira Sans and IBM Plex Mono are all Google Fonts and are natively available in Webflow, free.** Moving platforms doesn't cost you the typography — it removes the ceiling MUSED was designing under.

And typography is the smallest part of it. Going through the guide page by page, the identity is really a **layout** system: a hairline-ruled editorial grid with oversized section titles, 50/50 split compositions (dark against light, photography against flat colour), and monospace metadata pinned into corners — `MOVE, UPLIFT, CONNECT`, `EST. 2026`, tracklists, dates. That grid-and-rules language is straightforward to build in Webflow and essentially impossible to reproduce inside a Bandzoogle template, which gives you a background image and stacked content blocks. **The part of this identity that is hardest to keep is exactly the part Bandzoogle can't do.**

One thing to flag: the guide's final page is signed *"Brand proposal."* It defines logo, palette, type and mood, but not clearspace rules, a spacing scale, a type scale, buttons, forms, icons or motion. That's normal for identity work and it isn't a problem — but it means the web design step has to *extend* the identity into a working interface system, not merely apply a finished one. That work sits inside the per-page design rate quoted below; I'm noting it so nobody assumes a web-ready design system already exists.

## 3. Honest trade-off: what Bandzoogle does better

Bandzoogle is not a bad product. It is built specifically for musicians, and it includes things Webflow does not have natively:

- **A store with 0% commission** on music, merch and ticket sales
- **A built-in mailing list** tied to the fan database
- **A built-in music player** with track hosting
- **EPK, tour dates and fan/member features** out of the box

If Andrew is actively selling through the Bandzoogle store, that revenue path has to be replaced (Bandcamp, Webflow Ecommerce, or a Shopify embed) and none of those are 0%. **This is the single question that should decide the platform**, and I can't answer it from the outside — see §7.

From the public site I can see: the store is not visible, the mailing list has no signup form, and the player is a standard embed. If that reflects the whole picture, nothing of value is lost by moving.

Ongoing platform cost — see [bandzoogle-vs-webflow-features.md](./bandzoogle-vs-webflow-features.md) for the full research:

| Stack | Annual | Commission |
| :--- | :--- | :--- |
| Bandzoogle Pro | **~$220** | **0%** on music, merch, tickets, subscriptions, crowdfunding |
| Webflow Premium, no store | ~$300 | n/a |
| Webflow Premium + Ecommerce Standard | ~$648 | 2% |
| Webflow Premium + Ecommerce Plus | **~$1,188** | 0% |

**If Andrew isn't selling, the move costs ~$80/year — nothing. If he is selling and wants to keep 0% commission entirely inside Webflow, it costs roughly $970/year more.** That is a 5× difference and it is the single most important number in this document.

There is a hybrid that mostly dissolves it: Bandzoogle sells **standalone merch-store plans** at $6.37–$20.79/mo, apparently independent of website plans. Site in Webflow, commerce on a Bandzoogle merch store at 0%, linked together — commission-free selling for ~$76/yr instead of ~$888/yr. I could not confirm from the pricing page whether a merch plan can be held without a website plan; it needs one support ticket to Bandzoogle. Bandcamp is the zero-fixed-cost fallback if it doesn't hold.

Three things genuinely cannot be rebuilt in Webflow at any price: **Luminate/SoundScan sales reporting** (chart eligibility), **the identity-linked fan database** (per-song plays and skips mapped against individual fans), and **geo-targeted emailing** off that data. Whether those matter depends entirely on whether Andrew uses them.

## 3b. Can Bandzoogle be pushed further with custom code?

Yes — more than I implied above, and it's worth being precise about it. Per [Bandzoogle's own documentation](https://bandzoogle.com/help/articles/387-adding-html-css-and-javascript-to-a-page) (last updated 14 January 2026) there are **three injection points**:

| Where | How to reach it | What it takes |
| :--- | :--- | :--- |
| **Per-page block** | Edit Content → Pages → Add Feature → "HTML Code" | Arbitrary HTML, CSS or JS placed at a chosen position on one page |
| **Site-wide CSS** | Edit Theme → bottom of left bar → "Customize CSS" | CSS applied to every page; overrides the design-panel controls |
| **Site-wide `<head>`** | Edit Content → Pages → Site-wide Settings → "Headers and metatags" | Anything into `<head>` on every page — Google Fonts, stylesheets, JS libraries |

So we could load Rubik / Fira Sans / IBM Plex Mono, apply a full custom stylesheet, pull in an animation library, and hand-build individual sections as HTML blocks. A re-skin can go **considerably further than the stock template suggests** — I under-sold this in §4 Option A and I'd rather correct it than win the argument cheaply.

### But it stops well short of "bespoke," for five concrete reasons

1. **You never control the outer DOM.** The template still renders the page shell — header, nav, footer, wrappers, the background-image system. Your HTML blocks land *inside* their containers, so you inherit their max-widths, padding and positioning contexts. The full-bleed 50/50 splits this brand is built on mean escaping a constrained container with `100vw` and negative-margin tricks. Possible; brittle.
2. **You're writing CSS against selectors you reverse-engineered.** Bandzoogle's class names are theirs, undocumented, and can change in any platform update with no changelog. When they do, the site silently breaks.
3. **Bandzoogle explicitly disclaims support.** Their wording: misuse "can easily make your website stop working. We cannot provide support for problems caused by what you add here." When it breaks, there is nobody to call.
4. **Changing template wipes everything.** Also their wording: *all custom CSS added to your account is deleted if you change your site's template.* The design gets permanently welded to one template choice.
5. **It's presentation only — there is no content model.** This is the decisive one. Code injection restyles pages; it cannot create a Song collection. `Music` / `Song List` / `Lyrics` / `Backstories` stay four hand-maintained pages, and adding track 7 stays a four-page manual edit.

### The trap worth naming

Point 5 has a sting. If we hand-build custom song sections as raw HTML blocks to make them look right, **Andrew can no longer edit his own site** — every lyric fix and every new release becomes a code change routed through us. That is the exact opposite of what an independent artist managing his own catalogue needs, and it destroys the original reason MUSED chose Bandzoogle-native fonts.

And the economics invert. Fighting a closed template to approximate a bespoke design is **slower per page than building it properly**, not faster. A genuinely heavy custom-code Bandzoogle build would run **above** the $2,400 in Option B and land somewhere more fragile than the $2,800 Webflow build. Paying more for less is the outcome to avoid.

### What I'd actually do with this capability

Two things, both worth having regardless of platform choice:

- **A quick win now, this week.** The `<head>` and HTML-block access means I can drop a working mailing-list signup onto the live site immediately — before any redesign. The site has been asking people to join with no way to say yes; that stops today rather than in three weeks. Small, cheap, and it starts compounding straight away.
- **A cheap proof, if you want one.** Before committing to a platform, I can inject the brand fonts, palette and type scale into the current site as a limited test. You'd see the identity on the real site within a day and can judge the ceiling for yourself instead of taking my word for it.

**Verdict:** Bandzoogle plus custom code gets you a *good-looking* site. It does not get you a bespoke one, and it never gets you a content model. Option B remains genuinely viable and would look far better than today — I just wouldn't spend extra money chasing "high-end" inside it.

> One item to confirm with access: the docs don't mention plan gating on the Customize CSS panel, but it's worth verifying it's available on Andrew's current plan rather than assuming.

## 4. The three options, priced

### Option A — MUSED designs in Figma, I adapt it to Bandzoogle

MUSED produces the site design; I implement it within Bandzoogle's template system.

| | |
| :--- | :--- |
| **My fee** | **$1,200** (6 pages × $200 implementation) |
| **MUSED's design fee** | Separate, paid by you — I can't quote it |
| **Duration** | ~6 working days on my side, after MUSED delivers |

**I don't recommend this one, and I want to be direct about why.** You'd pay twice — MUSED for a design and me for an implementation — to arrive at the most compromised result of the three. With custom CSS (see §3b) Bandzoogle can get closer to a Figma design than the stock template suggests, but it still can't reproduce one faithfully, so a portion of what you pay MUSED for gets negotiated away during implementation. And critically: **it does not fix the structural problem.** Without a content model, `Music` / `Song List` / `Lyrics` / `Backstories` stay four hand-maintained pages no matter how good they look.

Adapting a design to fight a closed template is also not cheaper work than building it properly — it's slower per page, with a worse ceiling.

### Option B — I design and build it, staying on Bandzoogle

I design from the MUSED guide and implement on Bandzoogle. No third party, no handoff loss.

| | |
| :--- | :--- |
| **Cost** | **$2,400** (6 pages × $400 design + development) |
| **Duration** | **12 working days** (~2.5 weeks) |

Better than Option A — one team, no translation loss, and I design to what the platform can actually execute instead of designing into a wall. You keep the 0% store and the built-in mailing list.

But the ceiling is the same. The four-way song split stays. Every new release stays a four-page manual edit. And a meaningful part of the MUSED identity — the layout language, the motion, the poster-like compositions — stays on paper.

### Option C — I design and build it on Webflow, and migrate the site ⭐ Recommended

Full redesign against the brand guide, built on Webflow, with the catalogue restructured into a proper content model and all existing content migrated.

**Pages:**

| # | Page | Notes |
| :--- | :--- | :--- |
| 1 | Home | Identity-led hero, latest release, featured songs, mailing-list capture |
| 2 | Music | Releases + full catalogue, CMS-driven |
| 3 | Song (CMS template) | One entry per song — player, lyrics, backstory, artwork, credits |
| 4 | Bio | Collective, Andrew, current projects |
| 5 | kRe:Atives | Community, working mailing-list signup, songbook offer |
| 6 | Contact | Enquiries, collaboration, booking |

| | |
| :--- | :--- |
| Design + development | 6 pages × $400 = **$2,400** |
| Migration package | **$400** |
| **Total** | **$2,800** |
| **Duration** | **~14 working days (~3 weeks)** |

The migration package covers: content audit, exporting all songs / lyrics / backstories / artwork out of Bandzoogle, importing them into the Webflow CMS, a 301 redirect map for all 8 existing URLs so nothing already indexed breaks, metadata and Open Graph preservation, DNS switch, and 48 hours of post-launch monitoring.

**What you get here that neither other option gives you:**

- Four fragmented song pages collapse into **one Song collection**. Publishing track 7 becomes one CMS entry — enter it once, and it appears on Music, on its own page, on Home, everywhere it belongs. This is the fix that pays for itself over the next two years of releases.
- A **working mailing-list signup**, finally connected to the promise the site has been making.
- The MUSED identity built properly — the type system, the palette, the poster compositions, and the video/animation direction the site has already announced.
- Full editorial control for Andrew via the Webflow Editor, without touching layout.

### Comparison

| | Option A | Option B | **Option C** |
| :--- | :--- | :--- | :--- |
| Platform | Bandzoogle | Bandzoogle | **Webflow** |
| My fee | $1,200 | $2,400 | **$2,800** |
| MUSED fee | Separate, additional | — | — |
| Duration | ~6 days + MUSED's | 12 days | **~14 days** |
| Brand applied faithfully | Partially | Mostly | **Fully** |
| Fixes the 4-page song split | No | No | **Yes** |
| New release = 1 edit | No (4 edits) | No (4 edits) | **Yes** |
| Working mailing list | Bandzoogle built-in | Bandzoogle built-in | **Yes (integrated)** |
| Keeps 0% store | Yes | Yes | No — needs replacing |
| Annual platform cost | ~$150 | ~$150 | ~$300 |

**Option C costs $400 more than Option B and is the only one that fixes the actual problem.** Against Option A it is very likely *cheaper overall* once MUSED's design fee is counted, and it delivers considerably more.

### Lean variant of Option C — $2,400

If the budget should land exactly where Option B sits: fold `kRe:Atives` into a section on Home and Music rather than giving it its own page.

**5 pages × $400 = $2,000 + $400 migration = $2,400 · ~10 working days + migration.**

That is **the same price as staying on Bandzoogle**, on Webflow, with the content model and the working mailing list. If the choice comes down to money, this is the one to take.

## 5. What's included regardless of option

- Restructuring and re-flowing the existing copy into the new architecture
- Placeholder frames for images and video, sized and styled, swappable by you later at no cost
- Full responsive implementation across breakpoints
- Applying the MUSED palette, logo system and type hierarchy

## 6. What's not included

Per [PRICING_TIMELINE_RULES.md § 6](../../../sales/PRICING_TIMELINE_RULES.md):

- **Copywriting** — restructuring your existing text is included; writing new text is not
- **Photography and video production** — placeholders are provided
- **Brand identity work** — already delivered by MUSED
- **Heavy scroll-driven / GSAP animation** beyond standard interactions
- **Ongoing retainer or ad-hoc changes** after handoff

## 7. What I need from you

**Yes — direct access would materially improve this quote.** It isn't blocking; I can start from the public site and the brand guide. But one item genuinely changes the recommendation:

**Deciding:**
1. **Bandzoogle admin or contributor login.** Specifically to answer: *is the store in use, and does the mailing list already have subscribers?* If Andrew is selling through Bandzoogle's 0% store, that materially weakens the case for Option C and we should talk before committing. If not, Option C is clear.

**Needed for the work:**
2. **Brand asset pack from MUSED** — the logo as **SVG** in all three lockups (main, version 2, isotype); the serif face used in the wordmark, or confirmation that the logo is outlined and the font itself is never needed; and the photography and film-grain textures from the guide. If MUSED can share the working file rather than just the PDF, that saves a round of asset chasing.
3. **Confirmation on audio** — do songs stay as Spotify/Apple embeds, or do you want self-hosted audio files on the site?
4. **Domain registrar access** — at launch only, for the DNS switch.
5. **Analytics access**, if any is installed — to establish a traffic baseline before migrating.

> [!WARNING]
> **One irreversible item.** If you do move off Bandzoogle, the mailing list and any fan/customer data must be **exported before the subscription is cancelled**. Bandzoogle holds that data. This is the only step in the whole project that can't be undone, and it happens first, not last.

## 8. Recommendation

**Option C**, or its lean variant if budget is the deciding factor.

The site's own homepage already announces a new logo, video animations and a possible platform move. The direction is settled — this is about picking the platform that can actually deliver it. Bandzoogle can carry a re-skin. It can't carry a content model, and a content model is what a growing catalogue needs.

The one thing that would change my answer is an active Bandzoogle store. Give me access and I'll confirm it in a day.

## Version Control

- All changes to this document follow the version control rules in [SYSTEM_RULES.md — Section 4](../../../SYSTEM_RULES.md).
- **Branch naming**: `deliver/kre-<description>`.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
