# Excellent Facets — Page Inventory (2026-07-08)

## Progress log (2026-07-08, staged — NOT published)

- §1 DONE: Footer Fr fixed (Paris SAS + Place Vendôme address, FR country names, Genève/Jaipur labels). Affiliations (Section / Logos, shared EN+FR) already had Aura logo; fixed 4 wrong aria-labels + hidden text labels (DMIA, WDC, Original Luxury, Aura). World clock already had Jaipur. /fr/diamonds SEO title → "Nos Diamants".
- §1 FOLLOW-UP (2026-07-08): Footer Fr "Nous Contacter" heading (Block 5e1e03c3…83e2) used combo `u-text-large` while EN Footer's three headings all use `u-text-h2` — it rendered smaller than its "S'inscrire à notre newsletter" / "Bureaux" siblings. Reset to `["text_heading","u-text-h2"]`. Rest of the Footer Fr tree is structurally identical to EN Footer (verified node-by-node).
- Footer EN/FR remaining deltas, NOT changed (need decision): (a) office order in `footer_layout` — FR = NY, Paris, Genève, Jaipur (per spec §1); EN = NY, Genève, Paris, Jaipur (EN is the stale one — spec says this order applies "en todas partes"). (b) FR submit button lacks the `aria-label` + hidden `.hide` text label EN has. (c) FR FormErrorMessage still English ("Oops! Something went wrong…").
- §4 DONE: /fr/white-melee → title/SEO "Mêlé Rond"; /fr/single-cut → "Taille Huit-huit (8/8)" + 1,80 mm meta; created /fr/calibrated-fancy-shapes (6a4e50906e476eada06a4fe3); /fr/diamonds overview rebuilt to 6 slides in spec order (3 repurposed + 3 built new, Btn Links use relative URLs — prop runtime only supports url mode); Navbar Fr dropdown: 6 items renamed/ordered, new Calibrées item added, Huit-huit unhidden.
- §4 PENDING: 301 /fr/fancy-color-diamonds → /fr/fancy-color-melee-diamonds (needs user confirmation + old page unpublish/draft).
- §6 DONE: /fr/calibrated-fancy-shapes fully French — hero (Précision Assortie à Grande Échelle), intro ×2, spec strip (Gamme de Tailles 0,02–0,75 ct; Tolérances +0,00/-0,02), provenance, Formes Disponibles gallery (8 items), swapped in Navbar Fr (lang-switch via relative URLs)/Footer Fr/Synthetic Fr (full FR props), Logos heading "Nos Affiliations."
- §14 PARTIAL: Synthetic Fr component DEFAULTS now carry exact spec machine names (AMS2… par De Beers / DiamondSure™ par De Beers / DiamondCheck™ par GIA / iD100™ par GIA / DiaTrue CXL2 par OGI Systems). Still must fix per-instance overrides on the 5 older FR pages (white-melee instance overrides prop 1 with typo "dedétection"; props 2–5 default now OK unless overridden elsewhere).
- Navbar Fr dropdown (component 0cef722c…): items renamed + ordered [Tous les diamants, Mêlé Rond, Tailles Fantaisie Calibrées (NEW, page-linked), Taille sur Mesure, Taille Huit-huit (8/8) (unhidden), Diamants de Couleur Mêlés, Diamants de Couleur Certifiés]. All six verified page-linked.
- Useful technique: to clone Webflow-native elements (SliderSlide, DropdownLink) create a temp Slider/Dropdown via data_element_builder, move_element the harvested child into place, delete the temp. A slider/dropdown refuses to release its LAST slide/child. Builder set_style pollutes with stray combo classes — always re-run set_style after building.
- set_text works on String child nodes (not on plain div Blocks). Btn Link component id d1150f3d-27d2-8b63-ded9-c93ad26f25b0; props: Link cf359a27…, Text d5ed264e….
- §2 DONE: /fr/home Notre Entreprise = 3 new paragraphs (String 0db12482…bbc0 replaced + 2 new Paragraphs 77f045ea…5dbd, 3b33f9b8…56bff after Paragraph 0db12482…bbbf); Héritage tile fixed on both strings 0db12482…bb35 + …bb87 (year removed); hero slogan untouched.
- §3 IN PROGRESS /fr/about (669522d7a0b78e01eb1df575): intro String f30b591b…fe77 (old 26-années text, needs §3 replacement — check for sibling paragraphs). Desktop timeline: history_content f30b…fe80 = history_vector_top (5 history_top items cls 1–5) + history_vector_bottom (5 history_bottom items cls 1–5), 2023 item = history_top "5" (f30b…fed2). Mobile: history_mobile f30b…ff4c = history_flex (9 items) + 1 more item ff97 (2023). Team: team_content f30b…ffa5 (Amay card + popup fs-modal-element modal) + team_layout f30b…ffbe with 7 team_grid_card (open-2…open-8) + LinkedIn card. Amay bio popup strings: …ffd1 (grid popup) & …fee4/…ff95 are 2023-timeline texts. Sustainability teaser string: f30b…0094 ("certification de neutralité carbone pour l'année 2023"). EN about reference (6685c911433110dd31477211): desktop timeline extended with history_top "6" (6368395d…ddeb = 2025) and history_bottom "6" (3c679a11…5e48 = 2026); 2024 appears at strings 14511562…e165a6/…e165b1 (inside existing bottom "5" area — verify). Position classes "1"–"6" are site styles, reusable on FR. Mobile flex has 11 history_mobile_content items (new: e6a8d3fe…6a68 = 2024, 423fb748…d54b = 2025) + line block 14511562…16609 contains 2026 string …16603? (verify). Team layout EN: open-2 … open-10 cards + email card; NEW = open-9 (47ba0799… Nathan Bensoussan), open-10 (01a38f91… Nathalie Bonvin); Deepak "President, Excellent Facets" string 130a03c6…8423; Amay EN title "President, Excellent Facets SAS, SA, and Pvt Ltd" string 572fb2f9…8560. FR team currently: featured team_content (Amay + popup) + team_layout f30b…ffbe with open-2…open-8 + LinkedIn link card (FR last card is LinkedIn; EN last is email — note difference). FR Amay title string to change: find "Directeur"/title near f30b…ffc3/ffcd (Amay Sheth name strings). Popups: fs-modal-element="modal" blocks; new members need matching popup blocks (EN pattern modal-9/modal-10 presumably in team_content Block f30b…ffa5 counterpart).
FR spec §3 texts to paste: intro (3 paras), 2024/2025/2026 timeline, Amay title "Président, Excellent Facets SAS, SA et Pvt Ltd", Deepak/Nathan/Nathalie bios, sustainability teaser line (replace f30b…0094).

### EN timeline item anatomy (template for FR clones)
Item = Block [history_top|history_bottom, "N", u-column-custom] > (a) Block [u-hflex-right-bottom (top) / u-hflex-right-top (bottom)] > Block[history_date u-text-large]>String year + Block[history_visual u-vflex-center-top] > 2 HtmlEmbeds (one = history_trigger with attr fs-modal-element=open-N; order: trigger FIRST in top items, SECOND in bottom items); (b) Block[history_popup] attr fs-modal-element=modal-N > history_card > Image team_img (asset 66b672409f17c8664e23903f) + history_line + history_text > [history_card_layout > h3 history_heading year] + history_line horizontal + [history_card_layout > Paragraph text] + HtmlEmbed history_icon attr fs-modal-element=close-N.
EN new items: bottom "5" = 2024 (open/modal/close-19), top "6" = 2025 (20), bottom "6" = 2026 (21). Desktop chronology zig-zags top-N, bottom-N alternating; FR top "5" = 2023 currently last.
**CLONING TECHNIQUE for arbitrary elements (incl. HtmlEmbeds the builder can't create):** data_component_tool transform_element_to_component (replace:false) on an existing FR timeline item Block → insert_component_instance ×3 into vector containers → unlink_component_instance each → 3 independent editable copies → fix position class via set_style, year/text via set_text on Strings, fs-modal-element attrs via set_attributes, then unregister_component the temp. (Worked for slides/dropdowns via temp Slider/Dropdown; transform is rejected on SliderSlide but plain Blocks should be fine.)
§3 DONE (2026-07-08): intro 3 paras replaced (fe77/fe79/fe7b); 2024 desktop text (ff4a) + mobile (ff9e) replaced; 2025 desktop clone e506f799… (top 6, modal-20), 2026 desktop clone 05086778… (bottom 6, modal-21); mobile 2025 clone bc69b7c8…, 2026 clone 80aba82f…; Deepak title ffb0 → "Président, Excellent Facets" + bio ffbc replaced; Amay title ffc5 → "Président, Excellent Facets SAS, SA et Pvt Ltd"; Nathan card a4e4ff33… (open-9/modal-9), Nathalie card f35181ee… (open-10/modal-10) inserted before LinkedIn card, both with spec bios. NOTE: new cards use team_placeholder embed (no photos) — client can drop photos in Designer. Sustainability teaser 0094 replaced.
§5 DONE (/fr/white-melee 6695231ae260364bc56e11ef): H1 "Mêlé Rond.", intro p1/p2 + inventory line (strings f476/f478/f47a), specs Pureté IF–SI (f489), "Poids du Poli" 0,002–0,20 ct (f48e/f490), Symétrie fix (f4aa), NEW Gamme de Tailles item cloned after Couleur (block d6345ae4…, strings 04d3bc59…ae86/ae88), provenance (59937/74019), Synthetic Fr instance e712bb5a…: Flutting = §5 Calibrage text, machine prop 1 typo fixed. Spec strip block ids: Pureté f483, Poids f48a, Couleur f491, Taille f498, Poli f49f, Symétrie f4a6.
§7 DONE (cut-to-measure 6853fb013142b018f3aa9be3): H1 "Taille sur Mesure", subtitle "Concevoir des Diamants à la Mesure des Créations", intro 2 paras, REMOVED shapes gallery section (3a370626…), reworked 5 process rows + built 2 new (Précision Vérifiée 254d7131…, Sécurité IP 02f87dfd…) into process_list 9b2b5c26…, machine typo fixed.
§8 DONE (fancy-color-melee 6853f8d1eda9bf0d27621337): H1 "Diamants de Couleur Mêlés", intro (0,60–2,50 mm, Fancy/Intense/Vivid/Deep), removed 2 Strong labels, quality note, tile labels FR (Rose/Jaune/Bleu/Cognac/Orange jaunâtre/Vert olive/Brun chocolat), REMOVED neon tile (heading ab8b3d24…eea) + its shade image (…f16), fixed dup Cognac, machine typo fixed.
§9 DONE (fancy-color-certified 6853fec4cd4f68b14fca3916): H1, intro (120 Argyle+GIA), Foxfire/Smithsonian provenance, 4 avantage cards, machine typo fixed.
§10 DONE (single-cut 6695234320cd94ec11712b66): H1 "Taille Huit-huit (8/8).", subtitle "Élégance Intemporelle.", 2 paras (huit facettes couronne + huit culasse, "en dessous de 1,80 mm"), removed obsolete 57/58-facette para, machine typo fixed. SEO meta already 1,80 mm.
ALL 6 diamond pages (§5-10) COMPLETE.
Task5 §11-17 pages: §11 sustainability 6695237c9fbf8620fd93d583, §12 responsible-sourcing 6695236eabf0415529d3304f, §13 socially-compliant-manufacturing 6695235e78d6f35ce099eb44, §14 synthetic-free 6695234eaa03d53c28df6f0c, §15 philanthropy 669523899d3dd21f684637f8, §16 human-rights 66952397da2917e60ae8d1e2, §17 contact 669523a34220bd1e88e4f385.
Manual 301 (user does in Site Settings > Publishing > 301 redirects): /fr/fancy-color-diamonds → /fr/fancy-color-melee-diamonds; old page 669523274220bd1e88e4be53 already drafted.

§14 DONE (synthetic-free 6695234eaa03d53c28df6f0c): 10 machine strings (desktop+mobile) → exact brochure French names.
§15 DONE (philanthropy 669523899d3dd21f684637f8): foundation name ce1 → "La Fondation caritative Amay, Deepak et Neena Sheth."; desc ce3 replaced; NGO list kept.
§16 DONE (human-rights 66952397da2917e60ae8d1e2): added new "Salaires Décents et Normes du Travail" section (4f19e74f…2090) before improve_wrap. MANUAL: swap Vendor Code of Conduct download link to current file + confirm complaints contact email/responsible person (needs client-provided asset).
§17 DONE (contact 669523a34220bd1e88e4f385): filled Paris ?? in desktop location block (896/898); set tel: links on NY+Genève phones (desktop ef4/ef7 + mobile efa/efc); ADDED Paris+Jaipur phones desktop (3199c784…, 63f60cda…) + mobile (cbede627…, 1fa0b4b6…); added Paris+Jaipur mobile office items (eceb326b…, 02574186…); FR country names on all office blocks.
MANUAL/CLIENT ITEMS: (1) 301 redirect above; (2) Vendor CoC file link §16; (3) new team member photos on /fr/about (Nathan/Nathalie use placeholder — Deepak/Amay bio popups may too); (4) Sustainability §11 report download PDF (2024 Annual Sustainability Report) needs asset.
§12 DONE (responsible-sourcing 6695236eabf0415529d3304f): restructured into 4 subtitled blocks — Vers la mine/et non seulement vers le pays (subtitle 6045 + body 8027), Achat de brut (22c5c954+6b2fdd48), Achat de poli (d4f60c2d+db8b0146), Audité aux normes des maisons (020418a5+460025ed); old RJC/policies download paragraph (8028) moved to end (preserves Code of Conduct download).
§13 DONE (socially-compliant-manufacturing 6695235e78d6f35ce099eb44): "Deux Sites. Une Seule Norme." (a7+ab), Jaipur block (df938650+bc817bad), Visakhapatnam block (29bc7ad0+ad) with ISO 9001:2015 + 40% female.
§11 DONE (sustainability 6695237c9fbf8620fd93d583): carbon statement cd3 (GRI/WJI/SBTi 42%); NEW EU-frameworks/Aura DPP/Nature Roadmap para (c66fcea8) after carbon; gender WEPs+disabled-women desktop tab d7b + mobile accordion dd5; decent-work 4 offices desktop d81 + stray EN-dup panel d87 (was English → now FR). Mobile accordion has NO decent-work card (skips SDG8) so nothing more mobile-side.
ALL CONTENT PAGES §1-17 COMPLETE. Nothing published yet (all staged/draft).

## MANUAL / CLIENT-PROVIDED ITEMS (report in final summary)
1. 301 redirect /fr/fancy-color-diamonds → /fr/fancy-color-melee-diamonds (Site Settings > Publishing > 301 Redirects). Old page already set to draft.
2. §16 human-rights: swap Vendor Code of Conduct download to current file + confirm complaints contact email & responsible person.
3. §3 about team photos: Nathan Bensoussan & Nathalie Bonvin cards use placeholder image (team_placeholder) — client to add photos.
4. §11 sustainability: add 2024 Annual Sustainability Report PDF download alongside 2023 (needs asset). Existing report slider + download button already present — confirm which year.
5. Aura Blockchain Consortium logo already present in shared affiliations row (was there); only aria-labels/hidden labels were corrected.

## QA CHECKLIST (task6)
- Verify FR nav dropdown 6 diamond pages accessible desktop+mobile.
- Confirm no em dashes (—) in pasted text; Genève always "office/bureau".
- Verify new /fr/calibrated-fancy-shapes renders with Navbar Fr/Footer Fr.
- Verify timeline 2024/2025/2026 popups open (fs-modal-element numbering 19/20/21).
- Verify contact 4 phones + 4 offices desktop+mobile.
- Spot-check builder-created elements didn't keep stray combo classes (all reset).
OBSOLETE TODO (done) on /fr/about: (1) read FR bottom "5" (f30b…ff38) + top "5" (f30b…fed2) year strings & modal numbers; (2) read FR team grid card names (open-2…open-8) to see if Deepak exists; (3) clone 3 timeline items (2024 bottom-5-position?, 2025 top6, 2026 bottom6 — mirror EN classes) + 2-3 mobile items + team cards for Deepak?/Nathan/Nathalie with popups modal-9/10 (mirror EN numbering); (4) intro + Amay title + sustainability line; (5) §5+§7-10 diamond pages, §11-17 pages (task 5) still pending entirely.

Site ID: `667ba12b8def17ce19a9419b` · FR folder ID: `669522a57de2e7a5053e4e4b`
No Webflow Localization — FR pages are static duplicates inside the `/fr` folder.

## FR pages (parentId = 669522a57de2e7a5053e4e4b)

| Path | Page ID | Spec section | Notes |
| :--- | :--- | :--- | :--- |
| /fr/home | 669522b54bdcb9927e7a50ff | §2 | |
| /fr/about | 669522d7a0b78e01eb1df575 | §3 | |
| /fr/diamonds | 66952308b7b7313dd5a3cbf5 | §4 | SEO title "Notre Diamants" → "Nos Diamants"; rebuild to 6 cards |
| /fr/white-melee-diamonds | 6695231ae260364bc56e11ef | §5 | Rename to "Mêlé Rond", keep slug |
| /fr/fancy-color-diamonds | 669523274220bd1e88e4be53 | §4 | OLD page — 301 to /fr/fancy-color-melee-diamonds, remove from overview |
| /fr/single-cut-diamonds | 6695234320cd94ec11712b66 | §10 | Rebuild as "Taille Huit-huit (8/8)" |
| /fr/synthetic-free | 6695234eaa03d53c28df6f0c | §14 | Machine names only |
| /fr/socially-compliant-manufacturing | 6695235e78d6f35ce099eb44 | §13 | Two-facility model |
| /fr/responsible-sourcing | 6695236eabf0415529d3304f | §12 | Four blocks |
| /fr/sustainability | 6695237c9fbf8620fd93d583 | §11 | Desktop + mobile accordion |
| /fr/philanthropy | 669523899d3dd21f684637f8 | §15 | Foundation name/description |
| /fr/human-rights | 66952397da2917e60ae8d1e2 | §16 | Add living-wage section; Vendor CoC link |
| /fr/contact | 669523a34220bd1e88e4f385 | §17 | Add Jaipur, 4 phones |
| /fr/cut-to-measure-fancy-shape-diamonds | 6853fb013142b018f3aa9be3 | §7 | |
| /fr/fancy-color-melee-diamonds | 6853f8d1eda9bf0d27621337 | §8 | |
| /fr/fancy-color-certified-diamonds | 6853fec4cd4f68b14fca3916 | §9 | |
| /fr/calibrated-fancy-shapes | 6a4e50906e476eada06a4fe3 | §6 | CREATED 2026-07-08 as duplicate of EN 6a275546117a78f89f7cf28a — still needs FR content + swap EN Navbar/Footer components to Navbar Fr/Footer Fr |

## EN reference pages (site root)

| Path | Page ID |
| :--- | :--- |
| / (Home) | 667ba12b8def17ce19a941d2 |
| /about | 6685c911433110dd31477211 |
| /diamonds | 6686ab7ba4a4c25e83444c88 |
| /white-melee-diamonds (Round Mêlée) | 668979ddb3096e80b553ebc4 |
| /calibrated-fancy-shapes | 6a275546117a78f89f7cf28a |
| /cut-to-measure-fancy-shape-diamonds | 6840b869dac86a28918ae110 |
| /single-cut-diamonds | 6686afe17900f0b097f5d6f1 |
| /fancy-color-melee (old Fancy Color Diamonds) | 6686afc4999a8c52556950c5 |
| /fancy-color-melee-diamonds | 6841a78702274b50a5451ca1 |
| /fancy-color-certified-diamonds | 6840eb58b13239397fe50e2b |
| /synthetic-free | 668830bca012efd165b631d8 |
| /socially-compliant-manufacturing | 6686aff940a1f6764e7ffdf9 |
| /responsible-sourcing | 6686b01182036e93584adcd0 |
| /sustainability | 6686b0517ce677e57e566e0c |
| /philanthropy | 6686b07951a9e0bd7d0978b8 |
| /human-rights | 6686b0a08aead9fa96ed1b14 |
| /contact | 6686b08c22735ad0b472b4f7 |

## Utility

404: 667ba12b8def17ce19a941d5 · Password: 667ba12b8def17ce19a941d4 · Styleguide (draft): 667ba12b8def17ce19a941d3 · Example Layouts (draft): 667ba12b8def17ce19a941d6

## Version Control

This document follows the root-level version control rules in [SYSTEM_RULES.md](/SYSTEM_RULES.md). Commit only non-secret, repo-friendly workflow context and artifacts.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
