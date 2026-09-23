# Ads Landing Pages · 02 Build the Combo

## Purpose
Build each campaign as three pages: landing, consultation, thank you. Follow Livewell's flow of
information beat for beat, in the client's own design system. Two first cuts that improvised
the flow were rejected ("this output does not convince me"). Spend the originality on the look,
never on the order.

## Inputs
- `deliver/brandklout/<client>/scenario-3-ads-landing-pages/01-campaign-intake/output/combo.json` and `INTAKE.md` (step 01).
- The client's design system: tokens, fonts, components, section shapes from the organic site.
- The reference combo, live and readable with a browser User-Agent:
  - `https://www.livewelldentalva.com/ads-landing-pages/dental-implants`
  - `https://www.livewelldentalva.com/ads-landing-pages/dental-implant-consultation`
  - `https://www.livewelldentalva.com/ads-landing-pages/thank-you-implants`
- Section cards for the Sitemap FigJam: `tools/specialty-sitemaps/section-flows.py`
  (`T['ads_landing']`, `T['ads_consult']`, `T['ads_thankyou']`), kept identical to the tables below.

## The flow (named as the reference names its sections)

**Landing page.** Every CTA links to the consultation page. The form also sits in the hero.

| # | Livewell section | What it carries |
| :-- | :-- | :-- |
| 0 | `imp-header` | Minimal header: logo, phone, Book a Consultation. No menu. |
| 1 | `imp-hero` | Offer headline, review badge, three checks, Book + Call, service area, the doctor on film, the GHL form card, credentials. |
| 2 | `landing-journey` | "One patient's real journey": one before and after slider, Life Before / Life After lists, four story beats in the patient's words. |
| 3 | `imp-story` | "Why patients drive past other offices": four reasons, then the filmed patient stories. |
| 4 | `imp-specialist` | The dentist: credentials, pull quote, photographs. |
| 5 | `imp-options` | Options for this offer: what each is, treatment time, ideal if, what moves the cost. |
| 6 | `section-12` (how it works) | Three steps: consultation and 3D scan, treatment, final result. |
| 7 | `imp-gallery` | "Real patients. Real results.": before and after cases, Book. |
| 8 | `imp-space-2` | "A space designed for your comfort": office and room photos. |
| 9 | `imp-faq` | "Everything patients ask before booking": pain, same day, bone, cost, financing. |
| 10 | `imp-final` | Final call: Book, "prefer to talk? call", hours, credential strip. |
| 11 | `ty-foot` | Address, privacy and terms links, results and pricing disclaimer, review widget. |

**Consultation page.** Form first. Nothing else competes with it.

| # | Livewell section | What it carries |
| :-- | :-- | :-- |
| 0 | `imp-header-4-copy` | Logo and phone only. |
| 1 | `section_qz-hero` | "Book your free consultation", review badge, "reviewed by" the doctor, the campaign's GHL form. |
| 2 | `section_qz-stories` | "Hear from our patients": the wall of filmed patient stories. |
| 3 | `section_qz-proof` | "One dentist, start to finish": reviews and credentials. |
| 4 | `ty-foot` | Address and disclaimer. |

**Thank-you page.** Phone first, no form. The conversion fires here.

| # | Livewell section | What it carries |
| :-- | :-- | :-- |
| 0 | `imp-header-2` | Logo and phone only. |
| 1 | `section_ty-hero` | "Let's talk about your new smile", Call, the rating, "a quick two minute call". |
| 2 | `section_ty-expect` | What the call covers: treatment options, payment options, complimentary consultation. |
| 3 | `section_ty-why` | Why the practice: experience, personalized care, clear costs. |
| 4 | `section_ty-faq` | "Any questions before you call?" |
| 5 | `section_ty-cta` | "Ready to take the next step?": call, visit, hours, credentials. |
| 6 | `ty-foot` | Address and disclaimer. |

## Checklist
- [ ] Every landing page has all eleven beats, in this order, and the form in the hero.
- [ ] Every landing CTA links to its own consultation page.
- [ ] Consultation page is form first; thank-you page has no form and a `tel:` link above the fold.
- [ ] Class names use an `lp-*` namespace. Nothing named `ad`, `ads`, `ad-*`, `is-ad`, `*-ad`.
- [ ] Form slot styled `.slot.wz-embed { display:block; width:100% }` (Instatic), height reserved.
- [ ] Films: the practice's own patients only; the hero film is the doctor.
- [ ] Every page noindex, follow, and out of the sitemap and the menu.
- [ ] Phone written in a DNI-swappable format on all three pages.
- [ ] Built on staging first.

## Steps
1. **Read the reference.** Open the three Livewell pages. Note what each beat does, not how it
   looks. Livewell's canonical on the landing page points at its organic implants page; the other
   two canonicals point at themselves.
2. **Write the copy per campaign.** One set of eleven beats per offer, in the client's voice,
   from sourced facts only (step 01). Keep the section headings close to the reference's intent.
   Same seven FAQ questions across a campaign's landing page and thank-you page is fine.
3. **Design in the client's system.** Use the organic site's tokens, fonts and components. Give
   the ad set its own section shapes; never copy another client's shapes. Light themes only.
   Photo in every section that has one on the reference. Motion must stay readable (ADA).
4. **Name classes `lp-*`.** Ad blockers hide `ad`-named classes with `!important` on http(s)
   only, so the local render and every static gate look perfect while the published hero and
   form collapse to 0px. `/ads-landing-pages/` as a URL folder is fine.
5. **Build the pages.** Pick the platform path below.
6. **Wire the form.** Paste the GHL vendor snippet unedited for this campaign's form id. On
   landing and consultation pages only. Reserve its height (`min-height` about 800 to 900px): the
   frame arrives at 150px and grows seconds later. Never pin, move or re-parent a form or its
   ancestors with a scroll animation: every DOM move reloads the iframe.
7. **Tags.** The site-wide tags must reach these pages: Termly (autoBlock off), GTM, the GHL number
   pool and `user_session.js` where DNI runs. Follow `tools/termly-ghl-consent`.
8. **SEO head.** Title and description per page (no doubled city, no fragments). `noindex, follow`
   on all three. Keep them out of the sitemap and the navigation.
9. **Publish to staging and run `03-qa-and-launch.md`.**

### Instatic path (Dr. Nahlah, Mason Park)
1. Build static pages locally with a builder script that fills a per-campaign template from
   `combo.json` (Dr. Nahlah: `build-site.mjs` with a `LOCATIONS` table and `{{LOC_*}}` tokens;
   Mason Park: `build-ads-landing-pages.mjs`). Put the form in
   `<div class="wz-embed" data-wz-embed="auto">` with the vendor snippet, or a placeholder the
   push replaces.
2. Upload images first. The importer drops `data:` URIs, and a re-cut image needs a new filename
   or the upload is skipped by basename.
3. Convert to Instatic nodes and write each page through **site-document** at the nested slug
   `ads-landing-pages/<slug>`. A later row `PATCH` (for SEO cells) flattens the route to
   `/ads-landing-pages-<slug>`: re-save through site-document after any patch.
4. The form becomes a `brandklout.embed-origins.embed` block. It keeps the slot's classes, so
   scope placeholder looks to `.slot:not(.wz-embed)` and give `.slot.wz-embed`
   `display:block; width:100%`. If the slot had a `padding-top:%` aspect box for a bare iframe,
   drop it when the snippet brings its own wrapper.
5. Put the landing CSS in a code asset scoped to the ad page ids. Merge with the existing scope;
   never replace it with only the pages you pushed.
6. Site tags go in the Embed Origins `siteScripts` (1.8.0 or later for per-page pool scoping with
   `#pages=` / `#except=`). Add `services.leadconnectorhq.com` and `services.msgsndr.com` to
   `connectOrigins`, `us.consent.api.termly.io` too, and `app.termly.io` to `frameOrigins`.
   Read-merge-write the plugin settings. See `tools/instatic-embeds`.
7. Noindex through the SEO head settings; confirm the route entry.
8. Order: media, pages, site script bundle, SEO head, tags, publish staging, gates, then the same
   on production.

### Webflow path (Livewell, Stone Dental, Arvada)
1. Create the `/ads-landing-pages/` folder once. Three pages per campaign inside it.
2. Build with `tools/webflow-build`: either the clipboard paste (`html_to_webflow.py` with a
   page-unique `--page-prefix`, one root per paste, test on a throwaway page first) or section by
   section with `data_whtml_builder` (one section per call, at most five actions).
3. Never redefine an existing site class and never use inline `style=` in whtml: either mints a
   collision class. A single bad CSS rule aborts the whole call.
4. The GHL form, films, sliders and FAQ scripts go in HtmlEmbeds. Script embeds created through the
   Data API do not run in preview: register the behaviour as a page script
   (`register_inline_script` + `set_page_scripts`). Re-check embed `code` before publishing; it can
   go empty after later edits.
5. Page Settings: noindex, excluded from the sitemap, SEO title and description.
6. The MCP token cannot publish on some plans; publish from the Designer. On Stone Dental's plan a
   publish goes to every domain, so it is a production publish.
7. Cloning another client's set (Stone Dental from Arvada): rebuild in a new class namespace, then
   scan text AND element settings (alt text, embed code, links) for the source client's name.

## Conditionals
- If the client has no before and afters, then replace `imp-gallery` with reviews and keep the
  journey beat as a written story with a room photo. Do not reproduce the gallery empty.
- If the offer is veneers or cosmetic, then say what the treatment cannot do, and avoid
  "guaranteed result" wording (Dr. Nahlah BugHerd #48).
- If a trademark is used (All-on-4), then its disclaimer appears only on that campaign's pages.
- If two offices share a campaign, then build per office: its own form, phone, address and pool.
- If a warranty or price claim has no written terms, then withhold it until the client sends them.
- If the client wants a quiz instead of a form, then it is a separate build (Livewell's quiz); it
  still ends on a campaign thank-you page.

## Do / Don't
- Do follow the reference order exactly. Rejected twice when improvised.
- Do link every landing CTA to its consultation page, and keep the hero form too.
- Do keep the thank-you page phone first with no form.
- Don't start from the organic service page and bolt a form on (Mason Park's rejected first cut).
- Don't add urgency panels ("what happens if you wait"): Google flags them (Dr. Nahlah #43).
- Don't name anything `ad`.
- Don't use generic presenter films or another practice's patients.
- Don't pin or re-parent anything holding an iframe.

## Tools
- `tools/webflow-build/webflow-build.md`: HTML to Webflow conversion, clipboard and whtml paths.
- `tools/instatic-embeds/instatic-embeds.md`: the Embed block, siteScripts, frame and connect origins.
- `tools/instatic-api-sync/instatic-api-sync.md` and `insta-api.mjs`: REST writes to Instatic.
- `tools/termly-ghl-consent/termly-ghl-consent.md`: Termly head and the GHL consent bridge.
- `tools/specialty-sitemaps/section-flows.py`: the same flows as FigJam section cards.
- Builders not promoted (content is per client), read as examples:
  bk-mason-park `workflows/09-static-rebuild/output/build-ads-landing-pages.mjs` and
  `place-ad-embeds.mjs`; bk-dr-nahlah `workflows/04-design/output/site-src/build-site.mjs`,
  `workflows/22-instatic-api-sync/{ads-to-nodes.py, push-ads-pages.mjs, set-site-tags.mjs}`;
  bk-stone-dental `workflows/04-design/output/build/build_v2.py`; bk-arvada
  `workflows/07-webflow-build/output/v2-native/` (template plus per-topic JSON content).

## Outputs
- `deliver/brandklout/<client>/scenario-3-ads-landing-pages/02-build-the-combo/output/code/` : builder, templates, copy per
  campaign, `output/` built pages and push logs.
- Published pages on staging under `/ads-landing-pages/`.

## Evidence
- Livewell live pages, read 2026-09-23 (section classes above), and bk-livewell
  `workflows/07-webflow-build/output/{IMPLANTS-RUNBOOK.md, QUIZ-AND-THANK-YOU-RUNBOOK.md, COSMETIC-LANDING-RUNBOOK.md}`
- bk-dr-nahlah / `docs/runbook/2026-09-18-ads-livewell-flow-live-on-instatic.md`,
  `2026-09-21-bugherd-32-48-ads-review-applied.md`
- bk-mason-park / `docs/runbook/2026-09-18-redesigned-ad-funnels-built-locally.md`,
  `2026-09-18-ad-pages-rebuilt-in-livewells-flow.md`
- bk-stone-dental / `docs/runbook/2026-09-03-status-all-on-x-ad-campaign-trio-live.md`

## Version Control
Follows [SYSTEM_RULES.md §4](../../../../SYSTEM_RULES.md).
