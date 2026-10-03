# hackensack-dental-implants · old-site capture

Captured 2026-09-30 from https://www.hackensackdentalimplants.com/ (scenario 1, step 01). Everything
is under [`scenario-1-migration/01-old-site-capture/output/`](../../scenario-1-migration/01-old-site-capture/output/);
paths below are relative to it.

## Counts

| What | Count | Where |
| :--- | :--- | :--- |
| Pages scraped to markdown + JSON | 38 of 38 in the sitemap, 52,830 words | `scrape/pages/`, `scrape/data/`, `scrape/site-data.json` |
| Screenshots | 38 pages at 1440 and 390 (76 files, 139 MB) | `screenshots/w1440/`, `w390/` (R2 only) |
| Assets | 675 files, 203 MB, 228 logical assets, 3 inline SVGs, 0 YouTube/Vimeo embeds | `assets/downloads/wf/` (R2 only); `assets/ASSETS.md`, `asset-catalogue.csv`, `asset-manifest.csv` |
| Verbatim mirror | 38 pages + the 404 page, 700 assets, 227 MB; 39/39 pages render with the network cut | `mirror/site/` (open `index.html`), `mirror/raw-html/`, `mirror/mirror-manifest.json` |
| Mirror scan | passed: no executables, archives, injection markers or obfuscated loaders | `scan.log` |
| Blog | 6 posts, 6,973 words, 60 FAQ pairs, from the Webflow CMS | `posts/posts.json`, `posts/posts/*.md`, `posts/webflow-cms.json` |
| URL inventory | 38 paths, all 200; Wayback has none | `url-inventory.csv`, `url-inventory.txt` |
| Tracking | 38 pages rendered | `tracking/tracking-inventory.md` |
| Email DNS | 6 records | [`email-dns-hackensackdentalimplants.com.md`](./email-dns-hackensackdentalimplants.com.md), `.json`, [`hackensackdentalimplants.com-email.zone`](./hackensackdentalimplants.com-email.zone) |

The six asset downloads that failed are not real files: the script guessed a WordPress "original"
for names that end in `-1024x768`, and the CDN answered 403.

## Platform and host

- **Webflow**, site `6a1f4de5739bab24f074660f`, in the Brandklout workspace (the `webflow-brandklout`
  grant reads it). Served through Cloudflare; apex 301s to `www`.
- **Domain** registered 2026-07-18 at Namecheap, nameservers `ajay` / `ruth.ns.cloudflare.com`. The
  zone is already on Cloudflare, so a cutover is a record change, not a nameserver change.
- **The site is about four months old.** CMS collections were created 2026-05-11, the domain in July.
  That is why the Wayback Machine has no capture of it: the CDX API answered 200 with zero rows for
  the apex and for `www` (it was returning 503 "Temporarily Offline" twenty minutes earlier, so
  re-run `wayback-cdx.mjs` once more before the redirect map is called final).
- **No redirect history to preserve** beyond the 38 live paths, unless the practice had an earlier
  domain. Ask.

## Email

Google Workspace: MX `smtp.google.com`, DKIM selector `google`, DMARC `p=none` reporting to
Cloudflare. **SPF is `v=spf1 ~all` with no `include:_spf.google.com`**, so mail from Workspace
soft-fails SPF today. Worth fixing in the zone regardless of the rebuild; it needs the client's or
Brandklout's go-ahead.

## Trackers and embeds

| Tag | Id | Pages |
| :--- | :--- | :--- |
| Google Tag Manager | `GTM-WK9DNXD3` | 38 |
| GA4 | `G-5092G9WRXB` | 38 |
| Termly consent | `1fc5bc4f-c8b7-4c4d-a57e-dd55c802a266` | 38 |
| Ahrefs analytics | script on every page | 38 |
| Cloudflare Web Analytics | beacon on every page | 38 |
| GoHighLevel survey | `6CLNUlXI06FDHLD9XKBJ` | 12 |
| GoHighLevel forms | `PJjhjcpMEQU8MMCTRpLV`, `SHs2QaddefZy9lixAea9` | 1 each |
| Elfsight | app `cf96ca10-8feb-4ac7-8668-ddf398e0f61f` | 3 |
| Meta pixel (`connect.facebook.net`) | 14 requests across the 38 renders, not in the page markup (GTM or the GHL embed loads it) | to confirm |
| Google Maps embed | | 13 |

One phone number is linked everywhere, `+1 551 368 2476`, and it did not change between pages, so
there is no number pool on the site. Who owns the GTM, GA4, Termly, GHL and Elfsight accounts is
not known yet. Front-end libraries: Swiper 12, Flowbase Boosters (GSAP 3.12.5, count-up, ticker,
before/after slider, text highlight), Finsweet Attributes 2.

## Content findings for a client ruling

1. **Two blog posts still name another practice.** "Arvada Dental Center & Implants" is in the body
   of `/blog/dental-implants-no-bone-zygomatic-implants-explained`, "most dental practices in Arvada"
   is in `/blog/dental-implant-cost-hackensack-nj-2026-pricing-guide`, and that post's thumbnail file
   is `Dental Implants Cost in Arvada 2026.avif`. The six posts came with the template this site was
   cloned from (all created 2026-05-14). They need a rewrite or a ruling before they are carried over.
2. **Four links in the blog posts are dead on the live site** (404): `/all-on-x-implants`,
   `/what-to-expect`, `/zygomatic-implants`, `/implant-supported-dentures`. Same cause: the posts
   link to the template's page names. The real pages are `/services/all-on-x` and
   `/first-visit-expectations`; the site has no zygomatic or implant-denture page.
3. **A second phone number**, `(201) 488-8866`, appears in the SMS help text of the privacy policy,
   terms and HIPAA pages and in three blog posts. Everything else uses `(551) 368-2476`. Which is the
   office line and which is the tracking line?
4. **No structured data on any page** (no JSON-LD), and the 15 blog categories in the CMS are unused
   (no post has one).
5. **Legal and blog pages have two H1s** (privacy, terms, HIPAA, all six posts), and `/blog` shares
   the home page's title tag.
6. **The home hero video shows orthodontic braces** on a dental-implant practice, and most service
   page video is Adobe Stock. The client drive has Before and Afters, Clinical Photos and a set of
   office photos from 2026-09-14 that the current site does not use.
7. Four doctors have pages (Meskin, Srour, Lee, Klass); `facts.md` listed one. Hours on the contact
   page: Monday to Friday 10:00 AM to 6:00 PM.

## Where the heavy files are

Screenshots, asset downloads and the mirror are gitignored. They are backed up to R2
(`node scripts/assets.mjs pull hackensack-dental-implants` restores them; the manifest is
[`assets.tsv`](../../assets.tsv)). **Not yet on the client's shared drive**
(`0ADqUKcTkH0SxUk9PVA`, "Hackensack Center for Dental Implants"): `scripts/drive.mjs` only reads, so
the upload to `Old Site Capture/2026-09-30/` is a manual step.

## Version Control

Follows [SYSTEM_RULES.md §4](../../../../../SYSTEM_RULES.md).
