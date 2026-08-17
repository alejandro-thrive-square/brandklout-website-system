# Dr. Nahlah — WordPress → Webflow 301 Redirect Plan

Built 2026-08-17. Covers the migration of `drnahlah.com` from WordPress + Yoast onto the
rebuilt Webflow site (`6a6b84cc7fe55ddeabc0b314`, workspace `63b4b7393e89b78575e9a9bb`).

> [!WARNING]
> **The domain already points at Webflow and no redirects are installed.** `www.drnahlah.com`
> has been serving the Webflow build since **2026-08-14 17:14 UTC**. Every old WordPress URL
> is a live 404 right now — verified against `/about`, `/all-on-four`, `/prosthodontics`.
> This is losing rankings and paid/organic traffic every day it stands.

## Deliverable

| File | What it is |
| :--- | :--- |
| `workflows/14-migration-seo-redirects/.tmp/drnahlah-301-redirects.csv` | **Upload this.** Two columns, header row, 129 redirects. Matches Webflow's *Site settings → Publishing → 301 redirects → Import CSV* dialog. |
| `workflows/14-migration-seo-redirects/.tmp/drnahlah-301-redirects-audit.csv` | Same rows plus `Source` and `Was live at migration` — for review, not for upload. |
| `workflows/14-migration-seo-redirects/build_redirects.py` | Re-runnable generator. Holds the mapping tables and validates them. |

## How the inventory was built

Three sources, because no single one is complete:

1. **`01-content-intake/.tmp/current-site-scrape/site-data.json`** — the 78 URLs that were
   live on WordPress at migration time (33 pages, 43 blog posts, 2 category archives).
2. **Wayback Machine CDX** for `drnahlah.com/*` — surfaced **29 legacy URLs** from earlier
   site generations (`/all-on-four`, `/prosthodontics`, `/dental-crowns`, `/veneers-gallery`,
   the `/dental-implants-in-dc-*` cluster, and ~20 older Q&A posts). These were already gone
   before the 2026-07-30 scrape, so the scrape alone would have missed them — but their
   inbound links and any WordPress-era redirect chains died with the platform.
3. **`data_pages_tool.list_pages`** on the live Webflow site — the 11 real destination pages.

Plus WordPress structural patterns (category, author, tag, date archives, blog pagination,
feeds, `/wp-json`) that Yoast exposed to crawlers.

## The new site has 11 pages

`/` · `/meet-dr-nahlah` · `/dental-implants` · `/all-on-4` · `/veneers` · `/smile-makeover` ·
`/implant-cost` · `/sedation-dentistry` · `/smile-gallery` · `/patient-stories` · `/contact`

All eleven verified **200** on `www.drnahlah.com`. There are **no CMS collections** on the
site, so there is no blog and no dynamic destination for any of the 43 posts.

## Coverage

**78 / 78** URLs that were live on WordPress at migration are accounted for:

- **8** kept the same slug and need no rule — Webflow serves them directly:
  `/` `/dental-implants` `/all-on-4` `/veneers` `/smile-makeover` `/sedation-dentistry`
  `/smile-gallery` `/contact`
- **70** are covered by an explicit redirect rule.

Total CSV rows: **129** (70 live-at-migration + 29 legacy + 30 structural/wildcard).

Destination distribution:

| Destination | Rules |
| :--- | ---: |
| `/dental-implants` | 53 |
| `/` | 28 |
| `/all-on-4` | 19 |
| `/meet-dr-nahlah` | 9 |
| `/implant-cost` | 5 |
| `/contact` | 5 |
| `/veneers` | 3 |
| `/smile-gallery` | 2 |
| `/smile-makeover` | 2 |
| `/patient-stories` | 2 |
| `/sedation-dentistry` | 1 |

## Mapping decisions

Old pages that no longer exist were folded into the page that absorbed their content:

| Old WordPress page | New destination | Why |
| :--- | :--- | :--- |
| `/about`, `/dr-esam-nahlah`, `/our-team`, `/our-dental-facility`, `/tysons-study-club` | `/meet-dr-nahlah` | The rebuild collapsed five practice/people pages into one bio page. |
| `/implant-supported-dentures` | `/all-on-4` | Closest surviving full-arch page. |
| `/dental-implant-faq`, `/dental-crowns-and-bridges`, `/oral-surgery`, `/dental-conditions` | `/dental-implants` | Content was absorbed into the implants page. |
| `/cosmetic-dentistry`, `/teeth-whitening` | `/smile-makeover` | The cosmetic hub is now the makeover page. |
| `/cost-of-dental-implants`, `/financing` | `/implant-cost` | The new cost page covers both price drivers and the three payment routes. |
| `/testimonials`, `/video-gallery` | `/patient-stories` | Merged into one proof page. |
| `/patient-center`, `/doctor-referral`, `/emergency-dentistry`, `/free-event` | `/contact` | All were forms or "get in touch" pages. |
| `/privacy-policy`, `/terms-conditions` | `/` | **No legal pages exist on the new site.** See open items below. |
| `/veneer-survey-thank-you` → `/veneers`, `/implant-survey-thank-you` → `/dental-implants` | | Funnel thank-you pages; sending to the matching service page. |

The **43 blog posts** were mapped one by one on search intent, not by pattern: cost posts →
`/implant-cost`, full-arch/denture posts → `/all-on-4`, veneer posts → `/veneers`, sedation →
`/sedation-dentistry`, everything else → `/dental-implants`. The per-post decisions are in
`build_redirects.py` under `POSTS`.

## Rules that were applied

- **No trailing slashes.** Webflow natively 301s `/veneers/` → `/veneers` before redirect
  matching runs — confirmed live. Emitting slash variants would be dead weight.
- **No self-redirects.** The eight surviving slugs are deliberately absent from the CSV;
  a `/veneers → /veneers` row would be a loop. `build_redirects.py` still lists them in its
  tables (to document that they survived) and filters them at write time.
- **Every destination is validated against the live page list.** The generator raises if a
  rule points anywhere that is not one of the 11 real pages.
- **Wildcards use Webflow's `(.*)` syntax** and all collapse to a single destination, so
  none of them depend on rule ordering: `/category/(.*)`, `/blog/(.*)`, `/author/(.*)`,
  `/tag/(.*)`, `/feed/(.*)`, `/wp-json/(.*)`, and `/2017/(.*)` … `/2026/(.*)`.

## How to import

1. Webflow → **Site settings → Publishing → 301 redirects → Import CSV**.
2. Upload `drnahlah-301-redirects.csv`. When asked, confirm the **first row is a header**.
3. **Publish the site** — redirects do not take effect until the next publish.
4. Spot-check with `curl -I` (see below).

```bash
for p in /about /dr-esam-nahlah /financing /testimonials /blog \
         /category/dental-implants /all-on-four /prosthodontics \
         /porcelain-veneers-the-answers-to-your-questions; do
  echo -n "$p -> "
  curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "https://www.drnahlah.com$p"
done
```

Every line should read `301` with a destination on the list of 11 pages.

## Open items — not redirects, but found while doing this

1. **`/sitemap.xml` returns 404 and `robots.txt` is empty.** Webflow's auto-generated
   sitemap appears to be switched off. Google has no map of the new site. Turn it on in
   *Site settings → SEO → Sitemap*, then resubmit in Search Console.
2. **No `/privacy-policy` or `/terms-conditions` page exists.** The old site had both
   (1,114 and 1,705 words). They are currently redirecting to the homepage, which is the
   least-bad option but not a fix. A medical practice should carry both, plus an HIPAA/
   privacy notice. Worth raising with the client.
3. **43 blog posts have no equivalent destination.** They carry the practice's local-SEO
   equity for "dental implants McLean VA". Redirecting a specific article to a service page
   works as a link-equity and user-experience patch, but Google may treat some as soft 404s
   and the long-tail rankings will not survive. The durable fix is a CMS blog on the new
   site with the best 10–15 posts rewritten and republished at their original slugs — at
   which point those rows come out of this CSV. Flagged as a scope question, not done here.
4. **Search Console.** Once redirects are live, submit the sitemap and use the URL
   Inspection tool on the highest-traffic old URLs to force a recrawl.

## Version Control
- Follows the version control rules in [SYSTEM_RULES.md - Section 4](../../../../SYSTEM_RULES.md).
- CSV and generator are lightweight text artifacts and are committed.
