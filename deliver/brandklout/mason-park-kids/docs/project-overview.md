# Project Overview — Mason Park Dental for Kids

| Field | Value |
| :--- | :--- |
| **Client** | Mason Park Dental for Kids (pediatric brand of Mason Park Dental of Katy) |
| **Agency** | Brandklout (white-label partner; Webzite delivers, Brandklout owns the relationship) |
| **Domain** | `pediatricdentistkatytx.com` |
| **Site name / tagline** | "Dentist Katy" / "Mason Park Family Dental" — the WordPress org name is **Mason Park Dental for Kids** |
| **Address** | 21830 Kingsland Blvd #104A, Katy, TX 77450 — **the same practice address as the main site** |
| **Hosting** | SiteGround, `gtxm1211.siteground.biz`, GCP `34.174.211.179` |
| **Asana task** | none — ask Brandklout to create one so a GID can be recorded |
| **Started** | 2026-08-27 |
| **Worktree** | `bk-mason-park-kids` (its own, since 2026-08-28 — see below) |

> [!IMPORTANT]
> **Same client, different site.** This is the second brand of the practice covered by
> [`mason-park/`](../../mason-park/docs/project-overview.md) — same owners, same address, same
> doctors (Dr. Tam Nguyen DMD is the board-certified pediatric dentist; Dr. Dave Cho appears on
> both). It has its own domain, its own WordPress install, its own SiteGround account and its own
> database, which is why it gets its own client folder. It is **not** a separate client for
> billing, reporting or relationship purposes.
>
> **It does not share a worktree with the main site.** It used to — one agent held both — and
> that was a mistake: sessions kept crossing the two sites' facts, because the two builds are
> near-identical in shape and differ in every detail that matters (domain, host, database, page
> set, which findings are real where). Since 2026-08-28 this site lives in `bk-mason-park-kids`,
> a sparse worktree that checks out **only** this client folder plus the shared process library.
> The main site is in `bk-mason-park`, one directory over. Do not work both from one session.
>
> Anything you learn here about the theme, the component library or the incident almost certainly
> applies to the main site too, and vice versa. Check both before concluding something is unique
> to one.

## Relationship to the main site

| | Main site | This site |
| :--- | :--- | :--- |
| Folder | [`mason-park/`](../../mason-park/docs/project-overview.md) | `mason-park-kids/` |
| Domain | `bestdentistinkatytx.com` | `pediatricdentistkatytx.com` |
| WordPress theme | `tooth-fairy` (ThemeREX) | **`tooth-fairy` — the same theme** |
| Status | Rebuilt as static, **live** on Instatic at `mason-park.up.railway.app` | Rebuilt as static, **54 pages, building locally**; not yet hosted |
| Content | 71 pages + ~180 blog posts | 40 pages + 157 posts + 580 attachments |
| Hosting account | SiteGround, `35.208.39.228` | SiteGround, `34.174.211.179` — **a different account** |

Because both sites run the same ThemeREX `tooth-fairy` build, the Client-First component library
and stylesheet from the main site's `workflows/09-static-rebuild/` are expected to carry over
almost unchanged. **Read that README before designing anything here** — but note it is **not in
this worktree**: workflow 09 lives on the `bk-mason-park` branch and has not merged to `main`, and
this worktree's sparse cone excludes `mason-park/` besides. Read it in place at
`../bk-mason-park/deliver/brandklout/mason-park/workflows/09-static-rebuild/README.md`, and copy
what you need rather than reaching across for it at build time.

## Status

### 2026-08-28 — rebuilt as a static site, 54 pages, passing its own QA gate

The rebuild is in [`workflows/02-static-rebuild/`](../workflows/02-static-rebuild/README.md) and
runs locally with `node build.mjs && node audit.mjs && node serve.mjs`. **Read that README before
changing anything here** — three of the decisions it records are not obvious from the code.

The one that shaped the whole build: **the live install publishes 40 pages and not one of them is a
service page, yet its own main menu links to 24 URLs under `/services/`.** Every one of those menu
links was a 404 on the live site. The pages exist in a *second, abandoned* WordPress install
(`hni_` prefix, previous agency) sharing the same database, as clean paragraph HTML. 24 of its 69
pages are carried forward; the rest are an adult general-dentistry set that does not belong on a
pediatric site.

Also found, and each written up in the workflow README: the same four **fabricated awards** as the
parent site; a smile gallery that was stock photography over invented monthly price tiers; **two
contradictory sets of the practice's own address and phone number** published on the same page; a
services page selling the parent practice's adult treatments off the parent practice's web server;
and a page named `our-team-copy` that is not a copy of anything but a 1,000-word parent guide
nobody could reach.

### 2026-08-27 — content recovered off the server

Both of the practice's sites went down in the same incident. The main site was rebuilt and
republished; this one was not, and it is still on SiteGround.

**The live site cannot be crawled.** Past SiteGround's bot wall, every URL on
`pediatricdentistkatytx.com` redirects to `https://mason-park.up.railway.app/` — the main site's
new home. The redirect is set at SiteGround's domain level (it is not in `.htaccess` and not in
the database), so we cannot lift it, and the practice's own pages are not reachable over HTTP at
all. Recovery therefore ran over SSH.

Recovered so far — see
[`workflows/01-site-recovery/`](../workflows/01-site-recovery/README.md):

- **40 published pages, 157 posts, 580 attachments** as a WXR export, plus a full database dump
- page/post/media inventories and the nav-menu structure
- an offline mirror of all 40 pages with their CSS, JS, fonts and images

### 2026-08-27 — the WordPress install is actively compromised

Not residual damage from the original attack — an intrusion **still in progress** while we were
working. Four fake plugins with obfuscated PHP were planted between 25 and 27 August, two of them
active, and a 174 KB backdoor sits in `mu-plugins/transient-cleanup.php` with a backdated mtime
and `000` permissions, which WordPress attempts to load on every request.

Full detail and the handling rules in
[`security-incident-2026-08-27.md`](./security-incident-2026-08-27.md). **Read it before touching
anything recovered from this host.**

The recommendation matches the one made for the main site: treat the WordPress install as
unrecoverable rather than cleanable, rebuild static from the recovered content, and have
Brandklout tell SiteGround the account is still being written to.

## Open questions for the client

The full list, with the evidence behind each, is in
[`workflows/02-static-rebuild/README.md`](../workflows/02-static-rebuild/README.md). The ones that
block a launch:

1. **Suite number and phone.** The pediatric chrome publishes **#104B / (281) 578-7100**; the
   footer, copied from the parent practice's site, publishes **#104A / (281) 769-8878**. The
   rebuild uses the pediatric set throughout and the practice has to confirm it.
2. **Smile gallery** — needs real before/after photography, with consent. The live one was stock.
3. **Privacy Policy** — neither site has ever published one. The rebuild ships an interim notice,
   clearly marked, which is a stopgap and not the fix.
4. **Two PDFs** were never recovered and their links are unwrapped: the savings-plan brochure and
   the patient privacy form.
5. **Booking link.** `flexbook.me/masonpark/1` is the *parent* practice's scheduler, which is what
   the pediatric site itself linked. Confirm pediatric appointments should book through it.
6. **Dr. William Sung** is still named in this site's copy though he was deliberately removed from
   the parent site's rebuild.
7. **Blog posts (157)** — in or out of scope? They were explicitly out of scope for the main site.

Settled during the rebuild, recorded here so they are not reopened by accident:

- **Is the brand being kept?** Assumed yes — the rebuild was commissioned on 2026-08-28.
- **Which pages are real?** The 11 ThemeREX demo pages (`blog-*`, `shop`, `cart`, `my-account`,
  `wishlist-page`, `pricing`, `newsletter-popups`) are dropped, as on the parent site.
  `dental-savings-plan` is dropped as a duplicate of the menu's `dental-saving-plan`.
- **`our-team-copy`** is not a duplicate: it is a parent guide to knee-to-knee infant exams, now
  published at `/knee-to-knee-pediatric-dental-exam/`.

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../SYSTEM_RULES.md). Recovered client
data (`**/recovered/`) is gitignored: the database dump carries credentials and patient-adjacent
PII, and the mirror is heavy. The scripts and reports that produced it are committed.
