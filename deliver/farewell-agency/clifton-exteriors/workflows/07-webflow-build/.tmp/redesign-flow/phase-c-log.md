# Phase C Log — Componentize new sections + redistribution (2026-07-10)

## C.1 — 7 new sections componentized (DONE)
Pasted `.nx-batch` wrapper found on Components page (/untitled). All 7 transformed to components under `· 01 Sections`. Root-class dedupe noted: media/contact roots merged to `section_fin-partners`, thanks root to `section_form-panel` (Webflow merges byte-identical section-band defs on paste) — harmless (band metrics only; each is its own component; identity via `data-nx-*`).

| Component | ID | Props bound |
|---|---|---|
| Section / Process Timeline | `428c47f1-4839-ea9d-1bb7-6b16bf8aab72` | Eyebrow Text, Paragraph Text |
| Section / Form Panel | `7d143a14-5a4e-47fa-09d6-4948c9fecb7f` | Eyebrow Text, Paragraph Text |
| Section / Financing Partners | `782a1198-8621-a036-99e2-43fffdfb5e84` | Eyebrow Text, Partner Body Text (GreenSky draft) |
| Section / Media Grid | `ea936c7c-79d2-044d-18a9-22d867a8899a` | Eyebrow Text |
| Section / Thank You Hero | `ddb858da-b347-5c68-bbd1-77aa50957622` | Quote Text |
| Section / Contact Direct | `07f0396d-23f3-c4bc-737d-9f59b6684d06` | Eyebrow Text |
| Section / Badge Wall | `adb130f3-cf63-a299-be0a-058232d2c113` | Eyebrow Text |

Headings on the new sections stay static (baked 1:1 correct) — where a heading varies per page (Form Panel, Process Timeline) the plan is duplicate-per-page, not props (matches the FAQ/teammate pattern). Eyebrow `<div>` confirmed bindable via `text` key. 7 showcase instances live inside the `nx-batch` wrapper on the workshop page.

## C.2 — Redistribution (QUEUED — needs decisions + confirmation)

Per-page swap recipe (proven in spike): read page tree → for each target slot, `insert_component_instance` beside the Relume shell (its position = the map) → `set_component_instance_prop_values` → `remove_element` the shell. Then per-page publish + focused-tab QA.

### Duplicates to create during redistribution
- Process Timeline → **Section / Insurance Steps** (delete step 10, edit 9 steps + heading to insurance copy from `phase-b-content.md` §2a).
- Form Panel → **Section / Form Insurance** + **Section / Form Employment** (edit heading/eyebrow/sub; build the two DIFFERENT native forms headlessly via `element_builder` into `.form-panel__slot` — field specs in `phase-b-content.md` §2c/§3b).
- Services FAQ → per-service duplicates (doors/roofing/siding/gutters) editing Q&A statics (counts 2/6/3/4).

### Page order (proposed)
1. Service pages: **doors → roofing → siding → gutters** (12 Services components; roofing sets Cert Visible=true, Feature 03 Visible=true, Card visibility per counts; de-windows gallery/pricing/FAQ).
2. **our-process** (Process Timeline), **testimonials** (Thank You Hero), **media** (Media Grid) — no decisions needed.
3. **about-us** (Badge Wall — needs 13 logo assets uploaded first), **insurance-claims** (Insurance Steps + Form Insurance), **contact-us** (Contact Direct), **employment** (Form Employment + Contact Direct).
4. **financing** (Financing Partners — GreenSky copy is DRAFT, client to approve).
5. **pricing** (5 per-service pricing instances), **portfolio** (5 galleries), **blog** (CMS list).
6. **service-locations** — DECISION PENDING (rebuild JS search/map + 18 city pages, or keep grid).
7. **Nav rollout**: replace old `navbar_` with mega-nav on the 14 stale pages.
8. **Asset uploads**: badge-wall 13 logos, thank-you logo, gallery/portfolio images (S3 flow → bind).
9. **Purge**: unregister 0-instance Relume shell components — **USER CONFIRMATION REQUIRED** (access rules).

### DECISIONS (answered 2026-07-10)
1. Missing copy → **use my drafted copy** (GreenSky etc.).
2. Service-locations → **keep the simple grid** (skip JS search/map + 18 city pages).
3. Roofing warranty → **keep "10 Year" on roofing**, Lifetime elsewhere.
4. Sweep pace → **run autonomously**.

### DOORS — DONE (2026-07-10, published to staging)
Doors already had the full 12-section win-* whole-page paste in the Designer (unpublished, from 2026-07-08). Redistribution executed:
- **Componentized (insert instance → set doors props → remove pasted twin):** Financing (default=global), Confidence (default=global), Process (Paragraph overridden to generic), Contact (default=global), Curb Appeal (5 props), Portfolio (10 props), Pricing (11 props). Prop IDs resolved LIVE from each insert response (recipe's 2-day-old IDs were partly stale — always resolve live).
- **Kept pasted (already correct doors content baked in):** hero shell, invite (3-paragraph copy > 2 props), upgrades (5 items), FAQ (doors 2 Q&A), sunshine. NOTE: Phase A now enables componentizing hero/upgrades/sunshine too (Subheading/Heading split props + Card 05/vis) — deferred; pasted content is already correct so not blocking.
- **Hero images relinked** external WP URLs → assets (bg 6a4e959c…, 5 badges).
- **Reviews wall inserted** (component `e6d5df1a-1e49-e8e2-5e1c-7cc2aed9daa0`) between FAQ and Contact.
- Still on OLD template navbar (Navigation `e620f609`) — mega-nav rollout pending (batch step).

Doors instance IDs: financing 87e9758d, confidence bab31d9e, process 56ab4af3, contact 40439870, curb 43d3eb77, portfolio bc31d529, pricing d12afb95, reviews edc1df42.

### WAVE 1 DONE + published + verified (2026-07-10) — built from components via agents
- **roofing** — full 13-section service build; FAQ Roofing duplicate component `4558d1d5-62d7-3579-4440-b506ece14f78`; Cert Visible, 10-Year warranty, 3-feature pricing all applied. Content checks pass.
- **our-process** — hero, financing, Feature Split "Setting The Right Expectations", Process Timeline (10 steps), reviews, CTA. Clean (0 placeholders — already on mega-nav).
- **testimonials** — Thank You Hero + Reviews + CTA.
- **media** — Page Header hero, Media Grid (4 videos), reviews, CTA.

Agent-discovered gotchas (added to BUILD-KIT usage): `insert_component_instance` + `move_element` REJECT component-instance anchors ("internal error") → build by APPENDING sections to the main-wrapper block in final order, rebuild tail to reorder; FAQ question text sits on String child nodes of text-block wrappers (set_text on the String, not the block); CTA Band Button Link prop only accepts url/email/phone (not page).

Verify finding: pages still show 8 "lorem" hits = OLD NAVBAR dropdown cards (h5+spacer+p), NOT page bodies — clears with mega-nav rollout. Testimonials has 1 hotlinked old-WP video (global, pre-existing) — re-host at finalize.

### WAVE 2 DONE + published + verified (2026-07-10) — all bodies 0 placeholders
- **siding** — 13 sections; FAQ Siding dup `d67f1002-359e-42c2-8eb4-94c812eb7b85`; 3 upgrades, 3-feature pricing ($8-14K/$16-24K/$28-50K+). FLAG: `page-siding.html` is roofing-derived — build used genuine siding content from oldsite C.4, but pricing bullets still carry "shingles"-type roofing artifacts → needs a siding copy pass. Asset subs: hero=DL_Resizer11(roofing), financing/curb=siding resizer2/4; DL_Resizer8/resizer1/resizer3/close_up_siding NOT uploaded.
- **gutters** — 13 sections; FAQ Gutters dup `0988b616-c06d-62e6-739e-dc4dc2da09eb`; 3 upgrades, 3-feature pricing ($1-1.5K/$2-3.5K/$4-10K+). Asset gap: hero/invite/curb + 9 portfolio slots all default windows photos (no gutters assets uploaded).
- **financing** — Page Header, Financing Partners, reviews, CTA.
- **about-us** — hero, 2 Feature Splits (About + Mission), Trust Bar, Badge Wall (13 empty logo tiles), reviews, CTA.

11 PAGES NOW LIVE ON COMPONENT DESIGN: home, windows, doors, roofing, siding, gutters, our-process, testimonials, media, financing, about-us.

### WAVE 3 DONE + published (2026-07-10) — "other pages" from components
- **contact-us**: hero "Tell Us About Your Project", Financing Banner, Section/Contact (native form, reused), Contact Direct (address/phone/email/map defaults), Reviews.
- **employment**: hero "Join Our Team", Feature Split "Let's Work Together", Section/Contact form, Contact Direct, Reviews, CTA "Build Your Career...".
- **insurance-claims**: hero, financing, Feature Split (Hassle-Free Insurance Assistance), FAQ Insurance (dup `74f06610`, 4 Q&A), **Insurance Steps (dup of Process Timeline `7cc04af4`, 9 steps, 10th deleted)**, Trust Bar, Section/Contact form, Reviews, CTA "Your Home Built To Perfection".
- **pricing**: hero, financing, 5× Services Pricing (windows/doors/roofing/siding/gutters, correct amounts+headings), Reviews, CTA "Quality Is Our Promise".
- **blog**: hero, financing, Blog List, Reviews, CTA "Inspired To Start?".
- **service-locations**: hero + kept real 17-location grid + price-match band + Reviews + CTA (grid-only per decision).

KEY: native form already existed in Section/Contact (`28bf5e9c`) — reused, no form-build needed. Phone link_mode works (tel:); page link_mode rejected (use url).

CONTENT FOLLOW-UPS (flagged by agents):
- siding + gutters PRICING BULLETS = windows defaults ("vinyl windows") — need real siding/gutter bullets (no verbatim source; do NOT invent). Same family as the siding "shingles" artifact.
- Blog List = 3 STATIC cards (real titles), NOT bound to the Blog Posts CMS collection (`6a2468813c13802cdd2db710`) — bind for live posts (follow-up).
- Form pages use the basic Section/Contact form (name/email/phone) — expanding to full old-site field sets (insurance 24-field, employment 13-field) is a follow-up.
- CTA Band paragraphs on several pages were drafted (component default was lorem, not hideable) — review copy.

ALL PAGES NOW BUILT (16) EXCEPT **portfolio** (deferred — 5 galleries need uploaded project photos; asset-gated).

### PORTFOLIO LOCAL BUILD READY (2026-07-10)
- Design source: `04-design/.tmp/final-design/page-portfolio.html`.
- Webflow clipboard package: `07-webflow-build/.tmp/page-portfolio/paste_01_page_portfolio.html` (single root, 303 nodes).
- Converter/QA: ALL PASS against windows, doors, roofing, reviews, CTA, and `sections-new`; one intentional collision-avoidance rename (`win-port__marquee-page-portfolio`) with data-hook-based JS unaffected.
- Asset inventory: 64 unique gallery images across five service galleries (15 windows / 12 doors / 8 roofing / 18 siding / 11 gutters), plus hero + five trust badges. All 71 `<img>` elements have alt attributes.
- Remaining Webflow work: upload/reuse the 64 project assets, bind them to five Services Portfolio component instances (or paste the prepared whole-page fallback), add Reviews + CTA, then publish to staging and run focused-tab QA. Webflow mutation/publish still requires the client target confirmation in `docs/mcp-access.md`.

### STILL TO DO
- **Form pages** (native Webflow form via element_builder — NOT attempted yet): contact-us (contact form + Contact Direct), insurance-claims (dup Process Timeline→9-step + Form Panel→insurance 13-field form + FAQ), employment (Form Panel→employment 13-field form + Contact Direct). Form field specs in phase-b-content.md §2c/§3b.
- **Content pages**: pricing (5 Services Pricing instances per service), portfolio (5 galleries), blog (CMS list), service-locations (grid only — keep staging's 17-loc grid).
- **Asset uploads** (S3 flow, source from old WP): siding 4 imgs, gutters ~12 imgs, badge-wall 13 logos, thank-you logo, re-host 1 old-WP video.
- **siding copy pass** (remove roofing artifacts from pricing bullets/etc).
- **mega-nav rollout** → ~13 pages still on old navbar (also clears navbar lorem).
- **purge** 0-instance Relume shells (USER OK required).

### Remaining pages (same mechanic)
- **roofing**: has recipe (`page-roofing/component-replacements.json`); roofing extras — Cert Visible=true + Cert Text (GAF/CertainTeed), Feature 03 Visible=true + 3rd feature per tier, Card 01 Title "10 Year Craftsmanship Warranty" on Confidence.
- **siding, gutters**: check for existing paste/recipe; if absent, generate payloads first (siding 3 upgrades, gutters 3 upgrades/6 gallery).
- **our-process** (Process Timeline), **testimonials** (Thank You Hero + reviews), **media** (Media Grid), **about-us** (Badge Wall — upload 13 logos first), **insurance-claims** (dup Process Timeline→9-step + Form Panel→insurance form), **contact-us** (Contact Direct), **employment** (Form Panel→employment form + Contact Direct), **financing** (Financing Partners, draft copy), **pricing** (5 pricing instances), **portfolio** (5 galleries), **blog** (CMS), **service-locations** (grid only).
- **Nav rollout**: mega-nav → 14 pages. **Asset uploads**: badge-wall 13, thank-you logo, per-service images. **FAQ**: per-service duplicates.

### Blocking decisions (from gap-analysis §6)
1. Financing + employment copy: use my draft (GreenSky) / real client copy?
2. service-locations cluster scope.
3. Roofing "10 Year" vs "Lifetime" warranty wording.

## Version Control
Lightweight `.tmp/` artifact per SYSTEM_RULES.md §4.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
