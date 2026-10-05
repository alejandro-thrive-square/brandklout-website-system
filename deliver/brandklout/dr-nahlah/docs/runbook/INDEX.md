# Runbook index

98 runs, newest first. Each line is one file in this folder.
**Read this index first and open only what you need** — opening every entry is how a runbook
eats a context window.

| Date | Run | File |
| :--- | :--- | :--- |
| 2026-10-04 | 2026-10-04 — Everything editable on Instatic, **STAGING ONLY**: tokens into the Framework panel (4 colour aliases, 7 type sizes, gutter/section ends; root 16; 40 variables), `landing.css` (175 rules) into the registry and disabled; `editability.mjs` EDITABLE; parity exact bar the Framework's 2-dec rem (body 15.6→15.68px); a Framework panel edit survived page and shell uploads — carries **gotchas** | [`2026-10-04-everything-editable-staging.md`](./2026-10-04-everything-editable-staging.md) |
| 2026-10-02 | 2026-10-02b — `/doctor-referral` rebuilt (Asana referral form): Stone's order, both PDFs via the drnahlah-files Worker + 302s, a native PDF-style form posting to GHL workflow "Website - Doctor Referral" (verified end to end), the review wall; six old sections removed. **STAGING ONLY, client reviewing** — carries **gotchas** (GHL mapping tokens, webhook sample, Codex tabs, no PDFs in Instatic) | [`2026-10-02b-doctor-referral-form.md`](./2026-10-02b-doctor-referral-form.md) |
| 2026-10-02 | 2026-10-02 — QA report of 2026-09-28: every Web Dev item fixed on prod + staging + site-src (template headings/inert/directions, sitemap, iOS icon, CF beacon off, spelling/names/titles/descriptions in 7 stores, 95 post fixes, axe, /posts grid, hero 2.8 MB, -mclean URLs + 301s, 81 share images, open-graph 1.2.3); audit 81/81 clean — carries **gotchas** (CF RUM enabled:false, token 403 on routes, no redirect on rename, seo-head og:image) + the CS decisions still open | [`2026-10-02-qa-report-fixes.md`](./2026-10-02-qa-report-fixes.md) |
| 2026-10-01 | 2026-10-01b — "HIPAA Disclosure" added to the footer legal row on all 59 pages, prod + staging, plus site-src partials; every page otherwise identical, layout unchanged at 1440/390 — carries **gotchas** (site-test dead link, Termly control in the row) | [`2026-10-01b-hipaa-footer-link.md`](./2026-10-01b-hipaa-footer-link.md) |
| 2026-10-01 | 2026-10-01 — `/hipaa-disclosure` (HHS Notice of Privacy Practices) injected on staging + production, both entities named, every other page identical bar publish artefacts — carries **gotchas** + flags (static sitemap, Grand Mission text in both privacy policies) | [`2026-10-01-hipaa-disclosure-page.md`](./2026-10-01-hipaa-disclosure-page.md) |
| 2026-09-28 | 2026-09-28 — IV sedation and the anaesthesiologist removed site-wide (Asana "Update Website"): nitrous + oral only, 7 stores, prod + staging + site-src, 0 hits on 99 URLs — carries **gotchas** (aeo-schema stored blocks, title cell, loadEnvFile `#`, v2 import path) | [`2026-09-28-no-iv-sedation-no-anaesthesiologist.md`](./2026-09-28-no-iv-sedation-no-anaesthesiologist.md) |
| 2026-09-23 | 2026-09-23d — ChatGPT page switched to its own GHL form `AD6c2Du26a0JUpxoh6p5`, production then staging — carries **gotchas** (the form redirects to the Tysons Google thank-you page) | [`2026-09-23d-chatgpt-page-own-form.md`](./2026-09-23d-chatgpt-page-own-form.md) |
| 2026-09-23 | 2026-09-23c — staging re-mirrored from production: 58/58 parity, 18 missing images imported, embed-origins 1.8.0, settings synced WITHOUT GHL pools or GTM (`sync-plugin-settings.mjs`) — carries **gotchas** | [`2026-09-23c-staging-remirror.md`](./2026-09-23c-staging-remirror.md) |
| 2026-09-23 | 2026-09-23b — ChatGPT Ads All-on-4 landing page `/ads-landing-pages/alexandria-all-on-4-chatgpt` (live clone, CTAs to its own form); OpenAI pixel moved onto it only, off the Google pages — carries **gotchas** (no ChatGPT conversion measured) | [`2026-09-23b-chatgpt-all-on-4-landing-page.md`](./2026-09-23b-chatgpt-all-on-4-landing-page.md) |
| 2026-09-23 | 2026-09-23 — OpenAI Ads (ChatGPT Ads) pixel on the six All-on-4 ads pages, `lead_created` on the two thank-you pages, consent-held for advertising; proved with requests aborted — carries **gotchas** | [`2026-09-23-openai-ads-pixel-all-on-4.md`](./2026-09-23-openai-ads-pixel-all-on-4.md) |
| 2026-09-22 | 2026-09-22 — Termly cookie banner, preferences control and tracker tagging on this site; where TERMLY_API_KEY comes from — carries **gotchas** | [`2026-09-22-termly-cookie-consent.md`](./2026-09-22-termly-cookie-consent.md) |
| 2026-09-22 | 2026-09-22e — DNI pools no longer wait for cookie consent (client); a strict CSP had been refusing the pool's number request on 79 of 97 URLs (every page without an embed), fixed and proved — carries **gotchas** | [`2026-09-22e-dni-pools-without-consent-and-csp-fix.md`](./2026-09-22e-dni-pools-without-consent-and-csp-fix.md) |
| 2026-09-22 | 2026-09-22d — two GoHighLevel number pools scoped per office: Alexandria site-wide except the Tysons ads pages, Tysons on those nine (embed-origins 1.8.0 `pages=`/`except=`); swap proved in text and `tel:` — carries **gotchas** | [`2026-09-22d-two-dni-pools-scoped-per-office.md`](./2026-09-22d-two-dni-pools-scoped-per-office.md) |
| 2026-09-22 | 2026-09-22c — new-patient numbers retargeted per office (Tysons (703) 448-3312, Alexandria (571) 617-7245), live on 79 URLs; the head needed a separate fix from the body — carries **gotchas** | [`2026-09-22c-office-numbers-retargeted-live.md`](./2026-09-22c-office-numbers-retargeted-live.md) |
| 2026-09-22 | 2026-09-22b — home page reviews: the six-card wall removed, the ReputationHub embed is the only reviews there; why both were on the page — carries **gotchas** | [`2026-09-22b-home-page-reviews-are-the-embed-only.md`](./2026-09-22b-home-page-reviews-are-the-embed-only.md) |
| 2026-09-22 | 2026-09-22 — GoHighLevel DNI: the tags were already live since 2026-09-17; proved the swap works and gated the number formats — carries **gotchas** | [`2026-09-22-ghl-dni-number-swap-verified-live.md`](./2026-09-22-ghl-dni-number-swap-verified-live.md) |
| 2026-09-21 | 2026-09-21d — the five-year warranty claim withheld from all 18 ads landing pages pending the practice's approval (reversible in two commands); where the claim came from — carries **gotchas** | [`2026-09-21d-warranty-claim-withheld-from-the-ads-pages.md`](./2026-09-21d-warranty-claim-withheld-from-the-ads-pages.md) |
| 2026-09-21 | 2026-09-21c — veneers-filtered Google review wall on both consultation pages (#41/#42), /five-year-warranty built and linked eleven times (#47), and the site-wide `.rv-wall{display:none}` that was hiding every review card — carries **gotchas** | [`2026-09-21c-veneer-review-wall-and-the-warranty-terms-page.md`](./2026-09-21c-veneer-review-wall-and-the-warranty-terms-page.md) |
| 2026-09-21 | 2026-09-21b — the August BugHerd backlog closed (ten pins fixed in August, never written back), #29 and #30 built and LIVE; board now 42 done / 5 blocked — carries **gotchas** | [`2026-09-21b-bugherd-august-backlog-closed-pins-29-30-live.md`](./2026-09-21b-bugherd-august-backlog-closed-pins-29-30-live.md) |
| 2026-09-21 | BugHerd #32–#48 — Brandklout's review of the eighteen ads landing pages applied and live (2026-09-21) | [`2026-09-21-bugherd-32-48-ads-review-applied.md`](./2026-09-21-bugherd-32-48-ads-review-applied.md) |
| 2026-09-18 | 2026-09-18 — ads landing pages: rebuilt to the Livewell flow, LIVE on production under /ads-landing-pages/ (18 pages, headless REST import, site tags live) — carries **gotchas** | [`2026-09-18-ads-livewell-flow-live-on-instatic.md`](./2026-09-18-ads-livewell-flow-live-on-instatic.md) |
| 2026-09-17 | 2026-09-17c — ads landing pages: two offices (18 pages), more imagery on more grounds, the four site tags — carries **gotchas** | [`2026-09-17c-ads-two-offices-more-imagery-site-scripts.md`](./2026-09-17c-ads-two-offices-more-imagery-site-scripts.md) |
| 2026-09-17 | 2026-09-17b — ads landing pages: the GHL form moved into every hero, filmed patients added — carries **gotchas** | [`2026-09-17b-ads-landing-form-in-hero-and-filmed-patients.md`](./2026-09-17b-ads-landing-form-in-hero-and-filmed-patients.md) |
| 2026-09-17 | 2026-09-17 — ads landing pages: nine pages built locally, NOT PUBLISHED, forms blocked — carries **gotchas** | [`2026-09-17-ads-landing-pages-nine-pages-built-locally.md`](./2026-09-17-ads-landing-pages-nine-pages-built-locally.md) |
| 2026-09-10 | 2026-09-10 — plugin ids renamed to brandklout.* (migration, all instances) | [`2026-09-10-plugin-ids-renamed-to-brandklout.md`](./2026-09-10-plugin-ids-renamed-to-brandklout.md) |
| 2026-09-10 | 2026-09-10 — Instatic plugin author changed to Brandklout (live + source) | [`2026-09-10-plugin-author-is-brandklout.md`](./2026-09-10-plugin-author-is-brandklout.md) |
| 2026-08-31 | DONE 2026-08-31: the 404 page — LIVE ON STAGING AND PRODUCTION, verified both
 | [`2026-08-31-the-404-page-live-on-staging-and-production-veri.md`](./2026-08-31-the-404-page-live-on-staging-and-production-veri.md) |
| 2026-08-31 | DONE 2026-08-31: staging.drnahlah.com — a full clone of production, LIVE and VERIFIED, committed `f5e9c66`
 | [`2026-08-31-staging-drnahlah-com-a-full-clone-of-production.md`](./2026-08-31-staging-drnahlah-com-a-full-clone-of-production.md) |
| 2026-08-30 | DONE 2026-08-30: portrait centring bug — FIXED, PUBLISHED AND VERIFIED LIVE, not committed
 | [`2026-08-30-portrait-centring-bug-fixed-published-and-verifi.md`](./2026-08-30-portrait-centring-bug-fixed-published-and-verifi.md) |
| 2026-08-28 | BLOCKED 2026-08-28: YouTube -> Vimeo migration — 12 films downloaded, upload needs the right account
 | [`2026-08-28-youtube-vimeo-migration-12-films-downloaded-uplo.md`](./2026-08-28-youtube-vimeo-migration-12-films-downloaded-uplo.md) |
| 2026-08-28 | 2026-08-28 - embed-origins upgraded to 1.4.0 on Dr. Nahlah (encorercm.com)
 | [`2026-08-28-embed-origins-upgraded-to-1-4-0-on-dr-nahlah-enc.md`](./2026-08-28-embed-origins-upgraded-to-1-4-0-on-dr-nahlah-enc.md) |
| 2026-08-28 | 2026-08-28 (session 21b): the editor is a popup, and every page is populated — PUBLISHED AND VERIFIED LIVE
 | [`2026-08-28-session-21b-the-editor-is-a-popup-and-every-page.md`](./2026-08-28-session-21b-the-editor-is-a-popup-and-every-page.md) |
| 2026-08-28 | 2026-08-28 (session 21): BugHerd #14 #26 #27 #28, and two new SEO plugins — PUBLISHED AND VERIFIED LIVE
 | [`2026-08-28-session-21-bugherd-14-26-27-28-and-two-new-seo-p.md`](./2026-08-28-session-21-bugherd-14-26-27-28-and-two-new-seo-p.md) |
| 2026-08-27 | 2026-08-27 (session 20): BugHerd #13 reopened, #24 #25 new — PUBLISHED AND VERIFIED LIVE
 | [`2026-08-27-session-20-bugherd-13-reopened-24-25-new-publish.md`](./2026-08-27-session-20-bugherd-13-reopened-24-25-new-publish.md) |
| 2026-08-27 | 2026-08-27 (session 19): BugHerd #13 #15 #16 #19 #20 #21 #22 #23 — PUBLISHED AND VERIFIED LIVE
 | [`2026-08-27-session-19-bugherd-13-15-16-19-20-21-22-23-publi.md`](./2026-08-27-session-19-bugherd-13-15-16-19-20-21-22-23-publi.md) |
| 2026-08-27 | DRAFT 2026-08-27 (pin #11): no page repeats an image — 58 images changed, NOT PUBLISHED, NOT COMMITTED
 | [`2026-08-27-draft-pin-11-no-page-repeats-an-image-58-images.md`](./2026-08-27-draft-pin-11-no-page-repeats-an-image-58-images.md) |
| 2026-08-27 | DRAFT 2026-08-27 (session 18b): BugHerd #9 — /posts cards carry the post's image — NOT PUBLISHED, NOT COMMITTE | [`2026-08-27-draft-session-18b-bugherd-9-posts-cards-carry-th.md`](./2026-08-27-draft-session-18b-bugherd-9-posts-cards-carry-th.md) |
| 2026-08-27 | DRAFT 2026-08-27 (session 18a): BugHerd #8 — services cards get an image, two ways — NOT PUBLISHED, NOT COMMIT | [`2026-08-27-draft-session-18a-bugherd-8-services-cards-get-a.md`](./2026-08-27-draft-session-18a-bugherd-8-services-cards-get-a.md) |
| 2026-08-27 | DONE 2026-08-27 (pin #10): /posts search bar + topic filter — DRAFT, not published
 | [`2026-08-27-pin-10-posts-search-bar-topic-filter-draft-not-p.md`](./2026-08-27-pin-10-posts-search-bar-topic-filter-draft-not-p.md) |
| 2026-08-27 | DONE 2026-08-27 (session 17): the Vimeo desktop/mobile swap — DRAFT, not published
 | [`2026-08-27-session-17-the-vimeo-desktop-mobile-swap-draft-n.md`](./2026-08-27-session-17-the-vimeo-desktop-mobile-swap-draft-n.md) |
| 2026-08-27 | DONE 2026-08-27 (session 15j): the favicon was being overwritten by JS — LIVE
 | [`2026-08-27-session-15j-the-favicon-was-being-overwritten-by.md`](./2026-08-27-session-15j-the-favicon-was-being-overwritten-by.md) |
| 2026-08-27 | DONE 2026-08-27 (session 15i): favicon — the "N" monogram, on the DRAFT
 | [`2026-08-27-session-15i-favicon-the-n-monogram-on-the-draft.md`](./2026-08-27-session-15i-favicon-the-n-monogram-on-the-draft.md) |
| 2026-08-27 | DRAFT 2026-08-27 (session 16): pin #7 revisited - the article layout, NOT PUBLISHED
 | [`2026-08-27-draft-session-16-pin-7-revisited-the-article-lay.md`](./2026-08-27-draft-session-16-pin-7-revisited-the-article-lay.md) |
| 2026-08-27 | DONE 2026-08-27 (session 15h): Chapter 05 PINS on mobile again
 | [`2026-08-27-session-15h-chapter-05-pins-on-mobile-again.md`](./2026-08-27-session-15h-chapter-05-pins-on-mobile-again.md) |
| 2026-08-27 | DONE 2026-08-27 (session 15g): Chapter 05's card reveal, restored on touch
 | [`2026-08-27-session-15g-chapter-05-s-card-reveal-restored-on.md`](./2026-08-27-session-15g-chapter-05-s-card-reveal-restored-on.md) |
| 2026-08-27 | DONE 2026-08-27 (session 15f): Chapter 05 gold-block bug — MINE, fixed
 | [`2026-08-27-session-15f-chapter-05-gold-block-bug-mine-fixed.md`](./2026-08-27-session-15f-chapter-05-gold-block-bug-mine-fixed.md) |
| 2026-08-26 | DONE 2026-08-26 (session 15e): the mobile flicker, actually fixed
 | [`2026-08-26-session-15e-the-mobile-flicker-actually-fixed.md`](./2026-08-26-session-15e-the-mobile-flicker-actually-fixed.md) |
| 2026-08-26 | DONE 2026-08-26 (session 15d): pin #7 LIVE — all six pins shipped
 | [`2026-08-26-session-15d-pin-7-live-all-six-pins-shipped.md`](./2026-08-26-session-15d-pin-7-live-all-six-pins-shipped.md) |
| 2026-08-26 | IN PROGRESS 2026-08-26 (session 15c): pin #7, images chosen, awaiting approval
 | [`2026-08-26-session-15c-pin-7-images-chosen-awaiting-approva.md`](./2026-08-26-session-15c-pin-7-images-chosen-awaiting-approva.md) |
| 2026-08-26 | DONE 2026-08-26 (session 15b): pins #2-#6 LIVE, #7 blocked
 | [`2026-08-26-session-15b-pins-2-6-live-7-blocked.md`](./2026-08-26-session-15b-pins-2-6-live-7-blocked.md) |
| 2026-08-26 | DONE 2026-08-26 (session 15): BugHerd connected, board exported
 | [`2026-08-26-session-15-bugherd-connected-board-exported.md`](./2026-08-26-session-15-bugherd-connected-board-exported.md) |
| 2026-08-25 | DONE 2026-08-25 (session 14): client fix list — 3 of 4 LIVE
 | [`2026-08-25-session-14-client-fix-list-3-of-4-live.md`](./2026-08-25-session-14-client-fix-list-3-of-4-live.md) |
| 2026-08-25 | DONE 2026-08-25 (session 13): sitemap + 301 map LIVE on Cloudflare
 | [`2026-08-25-session-13-sitemap-301-map-live-on-cloudflare.md`](./2026-08-25-session-13-sitemap-301-map-live-on-cloudflare.md) |
| 2026-08-25 | INCIDENT 2026-08-25 (session 12b): I 404'd all 43 blog articles — FIXED ON DRAFT, seq 75
 | [`2026-08-25-incident-session-12b-i-404-d-all-43-blog-article.md`](./2026-08-25-incident-session-12b-i-404-d-all-43-blog-article.md) |
| 2026-08-25 | DONE 2026-08-25 (session 12): performance — DRAFT seq 74, NOT PUBLISHED
 | [`2026-08-25-session-12-performance-draft-seq-74-not-publishe.md`](./2026-08-25-session-12-performance-draft-seq-74-not-publishe.md) |
| 2026-08-25 | DONE 2026-08-25 (session 11): SEO metadata for pages and assets — DRAFT seq 70, NOT PUBLISHED
 | [`2026-08-25-session-11-seo-metadata-for-pages-and-assets-dra.md`](./2026-08-25-session-11-seo-metadata-for-pages-and-assets-dra.md) |
| 2026-08-24 | DONE 2026-08-24 (session 10d): link URLs are editable via a PLUGIN — INSTALLED & VERIFIED LIVE
 | [`2026-08-24-session-10d-link-urls-are-editable-via-a-plugin.md`](./2026-08-24-session-10d-link-urls-are-editable-via-a-plugin.md) |
| 2026-08-24 | DONE 2026-08-24 (session 10c): the editor can edit link URLs again — PATCH WRITTEN, NOT DEPLOYED
 | [`2026-08-24-session-10c-the-editor-can-edit-link-urls-again.md`](./2026-08-24-session-10c-the-editor-can-edit-link-urls-again.md) |
| 2026-08-24 | DONE 2026-08-24 (session 10b): every CTA band carries BOTH offices — DRAFT, seq 67
 | [`2026-08-24-session-10b-every-cta-band-carries-both-offices.md`](./2026-08-24-session-10b-every-cta-band-carries-both-offices.md) |
| 2026-08-24 | DONE 2026-08-24 (session 10): the contact page is split one-per-office — DRAFT ONLY, NOT PUBLISHED
 | [`2026-08-24-session-10-the-contact-page-is-split-one-per-off.md`](./2026-08-24-session-10-the-contact-page-is-split-one-per-off.md) |
| 2026-08-22 | DONE 2026-08-22 (session 9): the hero seam and the clipped descenders — both LIVE on Instatic
 | [`2026-08-22-session-9-the-hero-seam-and-the-clipped-descende.md`](./2026-08-22-session-9-the-hero-seam-and-the-clipped-descende.md) |
| 2026-08-22 | DONE 2026-08-22 (session 8c): everything is on GitHub, and the plugin is canonical
 | [`2026-08-22-session-8c-everything-is-on-github-and-the-plugi.md`](./2026-08-22-session-8c-everything-is-on-github-and-the-plugi.md) |
| 2026-08-22 | DONE 2026-08-22 (session 8b): compatible mode — v1.3.0, and the Elfsight finding
 | [`2026-08-22-session-8b-compatible-mode-v1-3-0-and-the-elfsig.md`](./2026-08-22-session-8b-compatible-mode-v1-3-0-and-the-elfsig.md) |
| 2026-08-22 | DONE 2026-08-22 (session 8): a pasted SCRIPT now runs — plugin v1.2.0
 | [`2026-08-22-session-8-a-pasted-script-now-runs-plugin-v1-2-0.md`](./2026-08-22-session-8-a-pasted-script-now-runs-plugin-v1-2-0.md) |
| 2026-08-22 | DONE 2026-08-22 (session 7): the Embed block is gated where a PERSON meets it — `63e94ae`, `cbf532a`
 | [`2026-08-22-session-7-the-embed-block-is-gated-where-a-perso.md`](./2026-08-22-session-7-the-embed-block-is-gated-where-a-perso.md) |
| 2026-08-22 | DONE 2026-08-22 (session 7): the audit is ONE complete run again — `63e94ae`
 | [`2026-08-22-session-7-the-audit-is-one-complete-run-again-63.md`](./2026-08-22-session-7-the-audit-is-one-complete-run-again-63.md) |
| 2026-08-22 | DONE 2026-08-22 (session 7): the Stop hook's runbook path is FIXED — `59afddf`
 | [`2026-08-22-session-7-the-stop-hook-s-runbook-path-is-fixed.md`](./2026-08-22-session-7-the-stop-hook-s-runbook-path-is-fixed.md) |
| 2026-08-22 | DONE 2026-08-22: embeds can be placed BY HAND, no agent — Embed block v1.1.0
 | [`2026-08-22-embeds-can-be-placed-by-hand-no-agent-embed-bloc.md`](./2026-08-22-embeds-can-be-placed-by-hand-no-agent-embed-bloc.md) |
| 2026-08-22 | DONE 2026-08-22: the live Google review widget is on the site — `eee062a`
 | [`2026-08-22-the-live-google-review-widget-is-on-the-site-eee.md`](./2026-08-22-the-live-google-review-widget-is-on-the-site-eee.md) |
| 2026-08-22 | Gotchas — 2026-08-22
 — carries **gotchas** | [`2026-08-22-gotchas.md`](./2026-08-22-gotchas.md) |
| 2026-08-22 | DONE 2026-08-22: session rotation was rotating on EVERY turn, and typing blind — `fa9bb1c`
 | [`2026-08-22-session-rotation-was-rotating-on-every-turn-and.md`](./2026-08-22-session-rotation-was-rotating-on-every-turn-and.md) |
| 2026-08-22 | DONE 2026-08-22: third-party embeds ARE possible — plugin built, proven live — `5a197e4`
 | [`2026-08-22-third-party-embeds-are-possible-plugin-built-pro.md`](./2026-08-22-third-party-embeds-are-possible-plugin-built-pro.md) |
| 2026-08-22 | DONE 2026-08-22: the hero gradient, and the gate that could not see it — `f8ca058`
 | [`2026-08-22-the-hero-gradient-and-the-gate-that-could-not-se.md`](./2026-08-22-the-hero-gradient-and-the-gate-that-could-not-se.md) |
| 2026-08-21 | CURRENT PRIORITY (2026-08-21): Dr. Nahlah on Instatic — migration DONE and live; embeds are the open question
 | [`2026-08-21-current-priority-dr-nahlah-on-instatic-migration.md`](./2026-08-21-current-priority-dr-nahlah-on-instatic-migration.md) |
| 2026-08-21 | Gotchas — 2026-08-21 session (worktree move + wrap-up)
 — carries **gotchas** | [`2026-08-21-gotchas-session-worktree-move-wrap-up.md`](./2026-08-21-gotchas-session-worktree-move-wrap-up.md) |
| 2026-08-20 | CURRENT PRIORITY (2026-08-20, late): Marvel Dental emergency funnel
 | [`2026-08-20-current-priority-late-marvel-dental-emergency-fu.md`](./2026-08-20-current-priority-late-marvel-dental-emergency-fu.md) |
| 2026-08-20 | ~~!! READ FIRST — the draft's site.css is in an UNKNOWN state~~ (2026-08-20) — RESOLVED 2026-08-21
 | [`2026-08-20-read-first-the-draft-s-site-css-is-in-an-unknown.md`](./2026-08-20-read-first-the-draft-s-site-css-is-in-an-unknown.md) |
| 2026-08-20 | Latest completed: West LA Implants client folder + worktree (2026-08-20, latest)
 | [`2026-08-20-latest-completed-west-la-implants-client-folder.md`](./2026-08-20-latest-completed-west-la-implants-client-folder.md) |
| 2026-08-20 | The Path chapter broke apart on a 4K monitor (2026-08-20)
 | [`2026-08-20-the-path-chapter-broke-apart-on-a-4k-monitor.md`](./2026-08-20-the-path-chapter-broke-apart-on-a-4k-monitor.md) |
| 2026-08-20 | IN FLIGHT: the blog, reachable and part of the build (2026-08-20)
 | [`2026-08-20-in-flight-the-blog-reachable-and-part-of-the-bui.md`](./2026-08-20-in-flight-the-blog-reachable-and-part-of-the-bui.md) |
| 2026-08-20 | Latest completed: the published site audited page by page, and four site-wide defects closed (2026-08-20)
 | [`2026-08-20-latest-completed-the-published-site-audited-page.md`](./2026-08-20-latest-completed-the-published-site-audited-page.md) |
| 2026-08-19 | Latest completed: the blog, 33 pages, and the whole old site covered (2026-08-19)
 | [`2026-08-19-latest-completed-the-blog-33-pages-and-the-whole.md`](./2026-08-19-latest-completed-the-blog-33-pages-and-the-whole.md) |
| 2026-08-19 | Latest completed: reviews as native cards (2026-08-19)
 | [`2026-08-19-latest-completed-reviews-as-native-cards.md`](./2026-08-19-latest-completed-reviews-as-native-cards.md) |
| 2026-08-19 | Latest completed: Dr. Nahlah Instatic parity + FP figure + chapters 07/08 (2026-08-19, later)
 | [`2026-08-19-latest-completed-dr-nahlah-instatic-parity-fp-fi.md`](./2026-08-19-latest-completed-dr-nahlah-instatic-parity-fp-fi.md) |
| 2026-08-19 | Latest completed: Dr. Nahlah media pass + Instatic CSS/JS centralisation (2026-08-19)
 | [`2026-08-19-latest-completed-dr-nahlah-media-pass-instatic-c.md`](./2026-08-19-latest-completed-dr-nahlah-media-pass-instatic-c.md) |
| 2026-08-18 | Latest completed: Dr. Nahlah client corrections + differentiators (2026-08-18)
 | [`2026-08-18-latest-completed-dr-nahlah-client-corrections-di.md`](./2026-08-18-latest-completed-dr-nahlah-client-corrections-di.md) |
| 2026-08-18 | Latest completed: Instatic admin 403s — CSRF origin + owner email typo (2026-08-18)
 | [`2026-08-18-latest-completed-instatic-admin-403s-csrf-origin.md`](./2026-08-18-latest-completed-instatic-admin-403s-csrf-origin.md) |
| 2026-08-18 | Latest completed: Instatic on Railway — volume bloat diagnosed & pruned (2026-08-18)
 | [`2026-08-18-latest-completed-instatic-on-railway-volume-bloa.md`](./2026-08-18-latest-completed-instatic-on-railway-volume-bloa.md) |
| 2026-08-17 | Latest completed: Dr. Nahlah WP → Webflow 301 redirect map (2026-08-17)
 | [`2026-08-17-latest-completed-dr-nahlah-wp-webflow-301-redire.md`](./2026-08-17-latest-completed-dr-nahlah-wp-webflow-301-redire.md) |
| 2026-08-11 | Latest completed: Relume MCP authenticated + Kit Foundation V1 test build (2026-08-11)
 | [`2026-08-11-latest-completed-relume-mcp-authenticated-kit-fo.md`](./2026-08-11-latest-completed-relume-mcp-authenticated-kit-fo.md) |
| 2026-08-10 | Latest completed: Relume library MCP registered (2026-08-10)
 | [`2026-08-10-latest-completed-relume-library-mcp-registered.md`](./2026-08-10-latest-completed-relume-library-mcp-registered.md) |
| 2026-08-10 | Latest completed: sparse client worktrees (2026-08-10)
 | [`2026-08-10-latest-completed-sparse-client-worktrees.md`](./2026-08-10-latest-completed-sparse-client-worktrees.md) |
| 2026-08-10 | Latest completed: automatic worktree → main asset mirror (2026-08-10)
 | [`2026-08-10-latest-completed-automatic-worktree-main-asset-m.md`](./2026-08-10-latest-completed-automatic-worktree-main-asset-m.md) |
| 2026-08-10 | Latest completed: all six `bk-*` branches merged into main (2026-08-10)
 | [`2026-08-10-latest-completed-all-six-bk-branches-merged-into.md`](./2026-08-10-latest-completed-all-six-bk-branches-merged-into.md) |
| 2026-08-09 | Latest completed: Dealer Websites — Pricing page made prop-editable (2026-08-09)
 | [`2026-08-09-latest-completed-dealer-websites-pricing-page-ma.md`](./2026-08-09-latest-completed-dealer-websites-pricing-page-ma.md) |
| 2026-08-08 | Previously completed: Dealer Websites — nested Collection List removed from the theme card (2026-08-08)
 | [`2026-08-08-previously-completed-dealer-websites-nested-coll.md`](./2026-08-08-previously-completed-dealer-websites-nested-coll.md) |
| 2026-08-08 | Also completed: Dealer Websites Integrations — script moved into the section (2026-08-08)
 | [`2026-08-08-also-completed-dealer-websites-integrations-scri.md`](./2026-08-08-also-completed-dealer-websites-integrations-scri.md) |
| 2026-08-08 | Also completed: Dealer Websites Features — unnested (2026-08-08)
 | [`2026-08-08-also-completed-dealer-websites-features-unnested.md`](./2026-08-08-also-completed-dealer-websites-features-unnested.md) |
| 2026-08-08 | Prior completed: Dealer Websites alternating feature rows (2026-08-08)
 | [`2026-08-08-prior-completed-dealer-websites-alternating-feat.md`](./2026-08-08-prior-completed-dealer-websites-alternating-feat.md) |
| 2026-08-07 | Prior completed: Livewell Dental client worktree (2026-08-07)
 | [`2026-08-07-prior-completed-livewell-dental-client-worktree.md`](./2026-08-07-prior-completed-livewell-dental-client-worktree.md) |
| 2026-08-07 | Prior completed: Orca/client-worktree audit (2026-08-07)
 | [`2026-08-07-prior-completed-orca-client-worktree-audit.md`](./2026-08-07-prior-completed-orca-client-worktree-audit.md) |
| 2026-08-07 | CURRENT TASK — Webflow build for Grand Mission + Mason Park (2026-08-07)
 | [`2026-08-07-current-task-webflow-build-for-grand-mission-mas.md`](./2026-08-07-current-task-webflow-build-for-grand-mission-mas.md) |
| 2026-08-07 | CURRENT — Webflow build loop (dynamic `/loop`, started 2026-08-07 16:10Z)
 | [`2026-08-07-current-webflow-build-loop-dynamic-loop-started.md`](./2026-08-07-current-webflow-build-loop-dynamic-loop-started.md) |
| 2026-08-07 | CURRENT — Pasteable-components pivot (2026-08-07, supersedes the headless builds)
 — carries **gotchas** + open questions | [`2026-08-07-current-pasteable-components-pivot-supersedes-th.md`](./2026-08-07-current-pasteable-components-pivot-supersedes-th.md) |
| 2026-09-21 | Vimeo: 12 films already uploaded; all 14 descriptions written (9 from YouTube, 4 from auto-captions) — carries **gotchas** on team-token access, the 50/min limit and open privacy | [`2026-09-21-vimeo-descriptions-synced.md`](./2026-09-21-vimeo-descriptions-synced.md) |
| 2026-09-21 | YouTube -> Vimeo: 108 of 124 nodes swapped across 15 pages, live; 8 Wellness Hour films stay on YouTube | [`2026-09-21-youtube-to-vimeo-site-swap.md`](./2026-09-21-youtube-to-vimeo-site-swap.md) |
| 2026-09-21 | Home story film clipped after the Vimeo swap (doubled 16:9 box) — fixed; carries **gotchas** on aspect-box collisions | [`2026-09-21-home-story-film-clipped-fix.md`](./2026-09-21-home-story-film-clipped-fix.md) |
