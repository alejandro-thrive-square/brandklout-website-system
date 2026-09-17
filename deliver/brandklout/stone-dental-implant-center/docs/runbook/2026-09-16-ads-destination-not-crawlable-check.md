# 2026-09-16 — Google Ads "Destination not crawlable" check

Google Ads flagged the ad for `https://www.stonedentalimplantcenter.com/ads-landing-pages/all-on-x`
as "Destination not crawlable". Diagnosis only, nothing changed in Webflow.

## Done
* AdsBot-Google (desktop + mobile UA) gets **200** on the landing page, the consultation page and the
  thank-you page; also 200 with `?gclid=…&utm_*` and `?gad_source=1`. Trailing slash 301s to the
  bare URL. Apex 301s to www. robots.txt is only a `Sitemap:` line (allows all).
* DNS: www CNAME `cdn.webflow.com`, apex A `198.202.211.1` — Webflow's own edge, no client
  Cloudflare/WAF in front.
* The three ad pages carry `<meta name="robots" content="noindex">` — does **not** block Ads review.
* No meta refresh or JS redirect on the page.

## Findings
* Page **"All on X - Landing Page Chat GPT"** (`/ads-landing-pages/all-on-x-landing-page-chat-gpt`,
  id `6aa46154dc955b61a5b54020`) was created 2026-09-11 20:15 UTC, after the last publish
  (2026-09-11 03:42 UTC) — it 404s live. Not the ad URL, per the user.
* `/all-on-x` (id `6a99792d6642f8d8d2c99716`) has unpublished edits from 2026-09-16 11:08 UTC.

## Next
* Confirm the ad's Final URL / tracking template / final URL suffix exactly; then "Appeal issue"
  in Google Ads (the page is reachable, so the flag looks stale or transient).

## Gotchas
* The keyless PageSpeed Insights API was over daily quota (429) — no Google-IP fetch test was
  possible; there is no Google API key in `~/.webzite/.env`.
