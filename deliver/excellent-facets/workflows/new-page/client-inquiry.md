## My input

 https://excellent-facets.webflow.io Basically it's a Webflow site so I need you to first scrape and understand really deeply the current structure so we can create this new page. First produce the HTML, CSS, and JavaScript with all the requirements of the process and second produce the pasteable components so I can jump into Webflow and paste the page. C:\Users\pc\Documents\Webzite Studio\Webzite Agentic Workflow\deliver\process


## Client input

Here is the new brief:

We are going to print a QR code on our packaging and marketing materials. When scanned, it should take the customer or supplier directly to a single page where they can download our compliance and corporate documents. We would like this page to be hosted at excellentfacets.com/documents.

A couple of clarifications regarding how it should fit into the site: It needs to be a single page—rather than having separate English and French versions—so both languages ​​should be presented together on the same page. Also, it should not appear anywhere in the site's navigation menu; the only way to access it should be by scanning the QR code or entering the URL directly.

The files were too large to attach, so I’ve sent them via Dropbox: https://www.dropbox.com/t/1vpH5xemBPWTzkSN
There are twenty-one files in total (all PDFs), corresponding to seven documents: our 2024 and 2023 Sustainability Reports, the Company Overview brochure, our Supplier Code of Conduct, our Approved Mines List, our New Client KYC Form, and our Identification and Verification Form. Most exist in both English and French, so each requires a download link for both languages, placed side-by-side. The KYC and Identification forms come in three versions based on the entity: one for Excellent Facets Inc., one for Excellent Facets SAS, and one for Excellent Facets SA. The 2023 Sustainability Report is the only document that exists only in English.

Regarding the design, you have the freedom to approach it however you think works best. The only two things that matter to us are that it aligns with the rest of the site and works well on mobile, since almost all visitors will arrive by scanning a QR code. It would be ideal if you could share a mockup of the mobile view first. A practical note: the page must be public—requiring no login or email capture prior to downloading—and the file must download directly.


My idea is for it to function like a well-organized Linktree. Proposed structure:
Three thematic groups, ranging from the most general (company documents) to the most specific (forms by entity). Each document appears as a card with EN and FR download options side-by-side. Please note that the on-page labels should be in English and French (not Spanish), as the page is bilingual (EN/FR); the Spanish text below is provided for your reference only.



## Page Structure

Header

Excellent Facets logo
Bilingual title: Compliance & Company Documents / Documents de conformité et d'entreprise
One-line intro: Download our latest compliance and company documents below. / Téléchargez ci-dessous nos derniers documents de conformité et d'entreprise.

Group 1 — Company & Sustainability / Entreprise et durabilité

Sustainability Report 2024 / Rapport de durabilité 2024 → [EN] [FR]
Sustainability Report 2023 / Rapport de durabilité 2023 → [EN]
Company Overview / Présentation de l'entreprise → [EN] [FR]

Group 2 — Compliance & Suppliers / Conformité et fournisseurs

Supplier Code of Conduct / Code de conduite des fournisseurs → [EN] [FR]
Approved Mine Sources List / Liste des mines approuvées → [EN] [FR]

Group 3 — Customer Onboarding / Intégration client

New Customer KYC Form / Formulaire KYC nouveau client

Excellent Facets Inc. → [EN] [FR]
Excellent Facets SAS → [EN] [FR]
Excellent Facets SA → [EN] [FR]


Identification & Verification Form / Formulaire d'identification et de vérification

Excellent Facets Inc. → [EN] [FR]
Excellent Facets SAS → [EN] [FR]
Excellent Facets SA → [EN] [FR]


## Execution Record

Executed as a mobile-first Webflow update workflow. The standalone HTML/CSS/JS design, 21 canonical PDF files, public-site style audit, responsive screenshots, QA records, and five Webflow clipboard components are stored under `.tmp/`. See [WEBFLOW_HANDOFF.md](./WEBFLOW_HANDOFF.md) for artifact paths, validated QA results, final asset-URL preparation, and the paste sequence.

The page was not added to Webflow or published. Production PDF URLs must be finalized before the final component regeneration and paste; publishing still requires explicit approval.

**Revision (download dropdowns + hover + square corners):** Per client feedback, every download on the page (all 5 document cards AND the 6 Customer Onboarding entity rows — 11 dropdowns total, no inline buttons left) now sits behind a "Download" dropdown that opens on hover (desktop) / tap (touch). Border-radius was also removed globally. The design sources, Webflow components, and screenshots under `.tmp/` were regenerated; re-run `apply_production_links.py` once production PDF URLs are set, then regenerate + paste the components per [WEBFLOW_HANDOFF.md](./WEBFLOW_HANDOFF.md).

## Version Control

Follow [SYSTEM_RULES.md — Section 4](../../../../SYSTEM_RULES.md). Do not commit the supplied ZIP, PDFs, screenshots, secrets, or other binary/media assets. Lightweight design, payload, QA, and documentation artifacts may be committed when useful.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS