# 2026-09-15 — The client's website feedback, applied and published to staging

One ask: the client's feedback on Asana, not BugHerd, because a teammate could not get BugHerd
working on this project. Task
[`1218408530306236`](https://app.asana.com/1/1210572425689866/project/1211830976769588/task/1218408530306236)
"Westlake Medical Aesthetics - website feedback", ten subtasks, due 2026-09-18. **Staging first**:
everything below is on `https://staging.westlaketxmedspa.com`. **Production is unchanged.**

## Done

### The ten subtasks

| Subtask | What changed |
| :-- | :-- |
| Rebranding `…563` | "Stone Med Spa" is **Westlake Medical Aesthetics** everywhere: wordmark (WESTLAKE / MEDICAL AESTHETICS), titles, JSON-LD, alt text, copyright, favicon W, footer mark W. |
| Treatment structure `…564` | `treatments-data.mjs`: **twelve treatments in four categories**. Injectables (Botox/Xeomin, Dysport & Jeuveau, fillers, **Sculptra**), Skin Rejuvenation (Morpheus8, peels, **SkinPen**), Restoration (PRP, hair), **Facials** (HydraFacial 45–90 min, dermaplaning, skin boosters). The home shelf is now the four categories rather than one panel per treatment. |
| Team page `…565` | Two cards: **Brooke, Nurse Practitioner Injector** and **Abby, Medical Esthetician** (still no portrait, initial kept). The other six profiles are gone, and so are the group photos showing them (team cover, doctor filmstrip, reception pair). |
| Membership `…566` | One plan from the attached flyer: **$149/month**, complimentary monthly facial, 10% off treatments, 10% off skincare, member events & giveaways. The **90-day commitment and 30-day notice** appear three times (cover, plan card, closing line). The year grid gained a monthly-facial row. |
| Navigation `…567` | "Botox & Xeomin" is out of the drawer and footer; the page is reached from its row on /treatments. The navbar's "Dr. Stone" became "Our team". |
| Before and after `…568` | Case counts (15 / 0), "awaiting written consent" and the consent FAQ are removed from /results, /botox and /about. The empty plates stay for the new photos. |
| Copy rewrite `…569` | Every page rewritten in plainer US English. The clipped aphorisms, British spellings (anaesthetic, centre, programme) and "X, not Y" lines are gone. |
| Consultation language `…570` | **Dr. Stone does not assess or inject here.** Every "placed by the surgeon" line is gone; consultations are "with one of our medical providers". /meet-the-doctor is now the surgeon at the sister practice, with no role invented for her on this side. |
| Financing `…571` | Cherry is card 01 (primary) with **Apply with Cherry**; CareCredit is card 02 with **Apply with CareCredit** (`carecredit.com/apply/`). "Vendors to be confirmed" is gone. |
| About `…572` | Reframed around the relationship: the non-surgical sister practice to Stone Surgical Arts, same building, its own team and menu. Surgery next door, aesthetics here, referral when surgery is the better route. |

### Two facts taken from the client's material, not asked for

- **Phone (817) 918-3666**, replacing (817) 383-8361 site-wide. It is on the client's own flyer
  (the membership attachment) and on CareCredit's listing for Stone Surgical Arts at 72 Andorra
  Dr Ste 110. 383-8361 was never confirmed (HANDOFF open item 3).
- **Socials**: Instagram @westlakeaesthetics and TikTok @westlakeaesthetic, from the flyer. The
  Facebook link was the Stone Surgical Arts page and is gone.

### Carried over from production's admin edit

Someone set every production page's title and description in the admin on 2026-09-12 (the
"Forth Worth" typo). The body copy matched the build, so that was the only admin edit. Its intent
(the name, the Dallas–Fort Worth area) is in `seo.json`; each page has its own title again.

### Staging push

- Snapshot first: `05-instatic-upload/.tmp/backup-staging-2026-09-15/` (site + pages JSON).
- `set-alt --map media-map.staging.json --apply`: 9 alt texts updated on staging (trap 36).
- `ship.sh` against the staging link dir (`check-link` OK), `push-site --apply --force`
  (seq 1, 11 pages, SEO intact), publish: `{"publishedPages":11}`.
- Staging had **no fonts** (trap 35): `install-fonts.mjs --apply` on staging, republished. One
  font's 404 was stuck in Cloudflare's cache from a probe (trap 37); purged with a one-hour
  Cache Purge token, **revoked**.
- The membership cover facts ("90 days" wrapped on phones) were reworded and staging republished.

### Gates

- Local: `audit` FAIL none (one WARN, the home title at 71 chars — the client's own format),
  `all-pages` 132 clean, `menu-test` 9/9 (updated for twelve rows and four groups).
- Staging: `verify-live` FAIL none (11 routes, 78 URLs, 167 assets, 11/11 distinct titles),
  `css-parity` FAIL none.
- `compare-live`: 142 findings before the font fix, then **2** on the final push — the trap 30
  container-margin noise on /treatments.
- `visual-diff`, final push, sienna blocked: **1440 ≤1.4%** on ten pages, **390 ≤4.2%** on ten.
  - The two outliers were looked at, not waved through. /meet-the-doctor at 1440 (7.4%) was card
    03's photo captured before it loaded; a real-viewport shot of staging shows it present.
    /about at 390 (7.9%) is a 24px vertical offset, with the same photographs on both sides.
  - Before the font fix it read 13–37%; with the widget still loading, 390 read 11–37%.

## Next

1. **The practice's own Cherry link.** The button goes to Cherry's generic patient site
   (`withcherry.com`). Cherry apply links are per practice (`pay.withcherry.com/<slug>`), the slug
   is not public, and every guess stalled behind Cloudflare. One line from the client fixes it:
   the link in `pages/financing.body.html`.
2. **Review on staging, then production.** Once the client or Sang signs off, run the same
   pipeline against production (`INSTATIC_BASE_URL` unset): back up production first (memory:
   Instatic DB backup via VACUUM INTO), `install-fonts` is not needed there, `set-alt` uses the
   default map.
3. **Abby's portrait.** Her card shows an initial.
4. **Reviews are still placeholders**, labelled as such. A verbatim Google pull with names the
   client will publish.
5. **Comment on the Asana subtasks** once production is updated. Asana writes need explicit
   confirmation (`mcp-access.md`); nothing was written to Asana this run.
6. Clinical sign-off on the five new treatments' figures (onset, longevity, downtime), as for the
   original seven.
7. The sitemap Worker does not need rebuilding: no page was added or renamed.

## Gotchas

- **Clone ≠ instance.** A staging clone copies the DB and the media library, not files other
  modules wrote to disk. Fonts were the one that bit (trap 35). Plugins came across because
  `clone-plugins` copies them by hand.
- **Don't probe a URL you are about to create.** The 404 is cached for four hours at the edge
  (trap 37). Check the container with `railway ssh ls` instead.
- **A freshly minted Cloudflare token can answer `10000 Authentication error` for a few
  seconds.** Wait, then retry.
- **The sienna widget is on production and staging, not local** (trap 38). `visual-diff.mjs` now
  blocks it; `compare-live` measured the same pages as identical.
- **Price rule.** `CLAUDE.md` forbids recording Brandklout prices. The $149 is the client's own
  retail price for their own membership, supplied for this page; it is labelled that way in
  `membership.body.html`.

## Version Control

Tracked. Committed with the work it describes.
