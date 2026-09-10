# Institute for Advanced Dentistry — current site inventory

Scraped 2026-09-10 from https://www.ifadentistry.com (the outgoing agency's WordPress build). Everything in this folder was produced by the scripts in `scrapers/`; nothing was hand-edited.

## What is in this folder

| Path | What it is |
| :--- | :--- |
| `site/` | The whole site rewritten to relative paths. Open `site/index.html` in a browser: CSS, JS, GSAP/Motion.page animations, fonts, images and the hero video all load from disk. Internal links go to the local copies. |
| `raw-html/` | The untouched server HTML of every URL, for diffing and for the redirect map later. |
| `screenshots/desktop/` | Full-page PNG of every URL at 1440 px, live site, scroll-triggered blocks revealed. |
| `screenshots/local-check/` | The same shot taken from the `file://` mirror for six pages, to prove the mirror renders. |
| `media-library/` | Every original in the WordPress media library (237 files, 34.6 MB), pulled through the REST API, so it includes uploads no page currently uses. |
| `media-library/vimeo/` | The Vimeo clips the site embeds, downloaded from the player. |
| `pages/` | One Markdown extract per URL: title, meta description, outline, image list, body text. |
| `site-data.json` / `pages.csv` / `assets-manifest.csv` | Page and asset manifests with status and byte counts. |
| `media-library.json` / `media-library.csv` | Media-library manifest with dimensions, alt text and captions. |
| `vimeo.json` | Vimeo clip manifest: id, title, owner, duration, which page embeds it. |

## Platform

- WordPress with the **Bricks** theme (plus a `bricks-child`), **Motion.page** for GSAP scroll animation, **Fluent Forms** for the contact form (reCAPTCHA v3), **Site Kit**, **Bricksable**, **Akismet**.
- Tracking: Google Tag Manager `GTM-K8N3JK3Q`. Widgets: Trustindex (Google reviews) and UserWay (accessibility). Both load from their CDNs, so they still work in the mirror while online.
- Fonts: Kanit and the theme's other Google Fonts, mirrored into `site/_ext/`.
- The Yoast sitemap URLs return 200 with the 404 page, so the crawl came from the WP REST API (pages, posts, categories) plus every same-origin link found in the pages. `robots.txt` blocks AI crawlers by name but allows everything else.
- Phone on every page: (602) 242-2256. Address on the home page: 13360 N 94th Dr, Suite B, Peoria, AZ.

## Pages: 55 URLs captured, 44,115 words of body copy

### Top-level pages (9)

| URL | Kind | H1 | Words | Meta description |
| :--- | :--- | :--- | ---: | :--- |
| /terms-of-service/ | page | Terms of Service | 859 | no |
| /contact-us/thank-you/ | page |  | 14 | no |
| /patient-referrals/ | page | Patient Referrals | 207 | no |
| /smile-gallery/ | page | You Deserve Extraordinary Results | 151 | no |
| /testimonials/ | page | Our patients say it best | 2559 | no |
| /accessibility-statement/ | page | Accessibility Statement | 276 | no |
| /contact-us/ | page |  | 162 | no |
| / | page | Replace Missing Teeth with Strong, Natural-Looking Dental Implants | 876 | no |
| /privacy-policy/ | page | Privacy Policy | 1753 | no |

### Service pages (/dental-services/) (17)

| URL | Kind | H1 | Words | Meta description |
| :--- | :--- | :--- | ---: | :--- |
| /dental-services/cosmetic-dentistry-ppc/ | page | Advanced Cosmetic Dentistry in Peoria | 555 | no |
| /dental-services/new-teeth-in-one-day/ | page | New Teeth in One Day | 1245 | no |
| /dental-services/denture-stabilization/ | page | Denture Stabilization with Dental Implants | 870 | no |
| /dental-services/dental-implants/ | page | Full-Service Dental Implant Treatment in Peoria, AZ | 1312 | no |
| /dental-services/dental-implant-complications/ | page | Dental Implant Complications | 555 | no |
| /dental-services/teeth-cleanings/ | page | Teeth Cleanings | 509 | no |
| /dental-services/cosmetic-dentistry/ | page | Cosmetic Dentistry | 710 | no |
| /dental-services/biocompatible-dentistry/ | page | Biocompatible Dentistry | 591 | no |
| /dental-services/new-patient-exam/ | page | New Patient Exam | 499 | no |
| /dental-services/tmj-treatment/ | page | TMJ Treatment | 691 | no |
| /dental-services/sedation-dentistry/ | page | Comfort & Sedation Dentistry | 579 | no |
| /dental-services/sleep-apnea/ | page | Sleep Apnea and Snoring Treatment | 492 | no |
| /dental-services/tooth-extractions/ | page | Tooth Extractions | 297 | no |
| /dental-services/dental-crowns-and-bridges/ | page | Dental Crowns & Bridges | 549 | no |
| /dental-services/full-mouth-rehabilitation/ | page | Full-Mouth Rehabilitation | 287 | no |
| /dental-services/dental-veneers/ | page | Dental Veneers | 671 | no |
| /dental-services/ | page | Our Top-Quality Dental Services & Solutions | 127 | no |

### About pages (/about-our-practice/) (5)

| URL | Kind | H1 | Words | Meta description |
| :--- | :--- | :--- | ---: | :--- |
| /about-our-practice/articles/ | page | Articles | 391 | no |
| /about-our-practice/payment-options/ | page | Payment Options | 230 | no |
| /about-our-practice/ | page | About Our Practice | 484 | no |
| /about-our-practice/what-is-a-prosthodontist/ | page | What is a Prosthodontist? | 292 | no |
| /about-our-practice/meet-dr-bensoussan/ | page | Meet Dr. Bensoussan | 580 | no |

### Blog posts (root-level slugs) (19)

| URL | Kind | H1 | Words | Meta description |
| :--- | :--- | :--- | ---: | :--- |
| /peoria-prosthodontics-institute-for-advanced-dentistry/ | post | Peoria Prosthodontics – Institute For Advanced Dentistry | 1501 | no |
| /expert-implants-dentist-peoria/ | post | Expert Implants Dentist in Peoria – Advanced Dentistry | 1499 | no |
| /implant-crown-peoria-az/ | post | What Is an Implant Crown? A Prosthodontist’s Guide for Peoria Patients | 1230 | no |
| /advanced-dental-restorations-in-peoria-az/ | post | Advanced Dental Restorations in Peoria, AZ | 2038 | no |
| /cosmetic-dental-treatments/ | post | Transform Your Smile With Cosmetic Dental Treatments | 1916 | no |
| /dental-implant-success-rates-in-2026/ | post | Dental Implant Success Rates in 2026: What You Should Know Before Choosing Dental Implants | 1091 | no |
| /what-is-a-prosthodontist/ | post | What Is a Prosthodontist? Understanding This Advanced Dental Specialty | 952 | no |
| /new-smile-in-one-day-in-peoria-az/ | post | How to Get a New Smile in One Day in Peoria AZ | 1021 | no |
| /cosmetic-dentist-in-peoria-az/ | post | What Can You Expect from a Cosmetic Dentist in Peoria AZ? | 987 | no |
| /tooth-replacement-peoria-az/ | post | Tooth Replacement Peoria AZ: A Full Guide to Dental Implants | 1388 | no |
| /why-prosthodontist-dental-implants-in-peoria/ | post | 9 Reasons To Choose A Prosthodontist for Dental Implants in Peoria AZ | 1746 | no |
| /dental-implants-for-single-tooth-replacement/ | post | Benefits of Dental Implants for Single Tooth Replacement | 925 | no |
| /6-reasons-dental-implants-are-ideal-for-young-adults/ | post | 6 Reasons Dental Implants Are Ideal for Young Adults | 698 | no |
| /are-dental-implants-tax-deductible/ | post | Are Dental Implants Tax Deductible? | 1942 | no |
| /how-age-affects-dental-implant-surgery/ | post | How Age Affects Dental Implant Surgery | 760 | no |
| /how-dental-implants-improve-airway-stability-and-breathing-during-sleep/ | post | How Dental Implants Improve Airway Stability and Breathing During Sleep | 998 | no |
| /how-dental-implants-can-transform-your-lifestyle/ | post | How Dental Implants Can Transform Your Lifestyle | 672 | no |
| /understanding-dental-implant-success-rates-and-longevity/ | post | Understanding Dental Implant Success Rates and Longevity | 1474 | no |
| /the-role-of-dental-implants-in-addressing-speech-disorders-and-cleft-palate-conditions/ | post | The Role of Dental Implants in Addressing Speech Disorders and Cleft Palate Conditions | 727 | no |

### Archives (category / pagination) (5)

| URL | Kind | H1 | Words | Meta description |
| :--- | :--- | :--- | ---: | :--- |
| /category/advanced-treatment/ | archive | Advanced Treatment | 107 | no |
| /category/cosmetic-dentistry/ | archive | Cosmetic Dentistry | 107 | no |
| /category/general-and-preventive-care/ | archive | General & Preventive Care | 138 | no |
| /category/implants-and-full-arch-solutions/ | archive | Implants & Full-Arch Solutions | 297 | no |
| /category/uncategorized/ | archive | Uncategorized | 391 | no |

Redirects seen while crawling: `/contact/` → `/contact-us/`, `/about/` → `/about-our-practice/`.

## Assets referenced by the pages (777 files, 54.3 MB)

| Type | Files | Size |
| :--- | ---: | ---: |
| jpg | 487 | 34.9 MB |
| mp4 | 2 | 9.0 MB |
| png | 78 | 4.3 MB |
| woff2 | 130 | 2.4 MB |
| webp | 33 | 1.5 MB |
| js | 19 | 0.9 MB |
| ttf | 4 | 0.8 MB |
| css | 19 | 0.4 MB |
| woff | 1 | 0.1 MB |
| svg | 4 | 0.0 MB |

Every referenced asset downloaded. (Wildcard patterns like `/wp-content/plugins/*` in the speculation-rules script are skipped: they are not files.)

## Media library (237 originals)

| MIME | Files | Size |
| :--- | ---: | ---: |
| image/jpeg | 186 | 21.8 MB |
| video/mp4 | 2 | 9.0 MB |
| image/png | 35 | 2.9 MB |
| image/webp | 7 | 0.9 MB |
| image/svg+xml | 7 | 0.0 MB |

- 33 images are 1600 px wide or wider. 26 images carry no alt text.
- Self-hosted video: `intro_video_v6.mp4` (home hero) and `dental-implant-and-ceramic-crown-placement-video.mp4`.

## Video embeds (Vimeo)

| Vimeo id | Title | Owner | Length | Embedded on | Local file |
| :--- | :--- | :--- | ---: | :--- | :--- |
| 1095751306 | Porcelain Veneers | Gilleard Marketing | 13 s | /dental-services/cosmetic-dentistry/ | 1095751306-Porcelain-Veneers.mp4 |
| 1091943220 | How Dental Crowns Are Placed on Teeth | Gilleard Marketing | 10 s | /dental-services/cosmetic-dentistry/ | 1091943220-How-Dental-Crowns-Are-Placed-on-Teeth.mp4 |
| 1095751286 | Dental Bonding | Gilleard Marketing | 10 s | /dental-services/cosmetic-dentistry/ | 1095751286-Dental-Bonding.mp4 |
| 1095751275 | Teeth Whitening | Gilleard Marketing | 10 s | /dental-services/cosmetic-dentistry/ | 1095751275-Teeth-Whitening.mp4 |
| 1091954104 | How Dental Implants and Ceramic Crowns Are Placed | Gilleard Marketing | 12 s | /dental-services/cosmetic-dentistry/, /dental-services/new-teeth-in-one-day/ | 1091954104-How-Dental-Implants-and-Ceramic-Crowns-Are-Placed.mp4 |
| 1091943339 | TMJ Arthritis and Jaw Dislocation | Gilleard Marketing | 21 s | /dental-services/tmj-treatment/ | 1091943339-TMJ-Arthritis-and-Jaw-Dislocation.mp4 |
| 1130043614 | Helen's Testimonial - Institute for Advanced Dentistry | Gilleard Marketing | 130 s | /testimonials/ | 1130043614-Helens-Testimonial---Institute-for-Advanced-Dentistry.mp4 |
| 1130043702 | Mark's Testimonial - Institute for Advanced Dentistry | Gilleard Marketing | 127 s | /testimonials/ | 1130043702-Marks-Testimonial---Institute-for-Advanced-Dentistry.mp4 |
| 1130043822 | Lisa's Testimonial - Institute for Advanced Dentistry | Gilleard Marketing | 124 s | /testimonials/ | 1130043822-Lisas-Testimonial---Institute-for-Advanced-Dentistry.mp4 |
| 1130043776 | Philip's Testimonial - Institute for Advanced Dentistry | Gilleard Marketing | 100 s | /testimonials/ | 1130043776-Philips-Testimonial---Institute-for-Advanced-Dentistry.mp4 |

Every clip sits on the outgoing agency's Vimeo account ("Gilleard Marketing"). The six short procedure animations are stock explainers; the four testimonials (Helen, Mark, Philip, Lisa) are the practice's own footage. The embeds die the day that account revokes them, so the downloaded files are the copy to re-host.

Every clip downloaded. Seven are domain-locked: they need the site as referer and a normal Chrome user-agent (a headless UA gets a 401 bot page).

## What does not work offline

- The Fluent Forms contact form posts to `admin-ajax.php`; it renders but cannot submit.
- Trustindex reviews, UserWay and the Google Maps iframes need the network.
- Search (`?s=`) and the RSS feeds were left pointing at the live site.

## Version Control

Text manifests, page extracts and the scripts in `scrapers/` are committed. `site/`, `raw-html/`, `screenshots/`, `media-library/` and `scrapers/node_modules/` are binary or bulk and stay local, per the root `.gitignore`. Re-create them with `node mirror.mjs`, `node screenshots.mjs`, `node vimeo.mjs`, then `node inventory.mjs`.
