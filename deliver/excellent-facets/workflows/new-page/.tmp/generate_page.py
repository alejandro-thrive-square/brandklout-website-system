from pathlib import Path

BASE = Path(__file__).parent
FINAL = BASE / "final-design"
LOGO = (BASE / "site-reference" / "wordmark-inline.svg.txt").read_text(encoding="utf-8")


def download(file_name, label, language, key):
    return f'''<a class="ef-download" href="documents/{file_name}" download="{file_name}" data-direct-download data-file-key="{key}" data-language="{language}"><span class="ef-download-label">{label} <span class="ef-download-language">PDF</span></span><span class="ef-download-icon" aria-hidden="true">↓</span></a>'''


def download_dropdown(files, menu_id):
    """Render a report's download buttons inside a dropdown (details/summary)."""
    items = "".join(
        f'<a class="ef-download ef-dropdown-item" href="documents/{file_name}" download="{file_name}" '
        f'data-direct-download data-file-key="{key}" data-language="{language}">'
        f'<span class="ef-download-label">{label} <span class="ef-download-language">PDF</span></span>'
        f'<span class="ef-download-icon" aria-hidden="true">↓</span></a>'
        for file_name, label, language, key in files
    )
    return (
        f'<details class="ef-dropdown" data-ef-dropdown>'
        f'<summary class="ef-download ef-download-trigger" data-ef-dropdown-toggle aria-haspopup="true" aria-expanded="false">'
        f'<span class="ef-download-label">Download <span class="ef-download-language">/ Télécharger</span></span>'
        f'<span class="ef-download-caret" aria-hidden="true"></span>'
        f'</summary>'
        f'<div class="ef-dropdown-menu" id="{menu_id}" data-ef-dropdown-menu>{items}</div>'
        f'</details>'
    )


def document_card(year, document_type, en_title, fr_title, files, extra="", last=False, as_dropdown=False, dropdown_id=""):
    card_class = "ef-document-card ef-card-last" if last else "ef-document-card"
    if as_dropdown:
        action = download_dropdown(files, dropdown_id)
    else:
        buttons = "".join(download(*item) for item in files)
        downloads_class = "ef-downloads ef-downloads-single" if len(files) == 1 else "ef-downloads"
        action = f'<div class="{downloads_class}">{buttons}</div>'
    return f'''<article class="{card_class}">
      <div class="ef-document-meta"><span class="ef-document-type">{document_type}</span><span>{year}</span></div>
      <h3 class="ef-document-title"><span lang="en">{en_title}</span><span class="ef-document-title-fr" lang="fr">{fr_title}</span></h3>
      {extra}
      {action}
    </article>'''


def entity_row(name, prefix, key, row_class=""):
    dropdown = download_dropdown([
        (prefix + "-en.pdf", "English", "en", key + "_en"),
        (prefix + "-fr.pdf", "Français", "fr", key + "_fr"),
    ], f"ef-dropdown-{key}")
    return f'''<div class="ef-entity-row {row_class}">
      <p class="ef-entity-name">{name}</p>
      {dropdown}
    </div>'''


company_cards = "\n".join([
    document_card("2024", "Report / Rapport", "Sustainability Report 2024", "Rapport de durabilité 2024", [
        ("sustainability-report-2024-en.pdf", "English", "en", "sustainability_2024_en"),
        ("sustainability-report-2024-fr.pdf", "Français", "fr", "sustainability_2024_fr"),
    ], as_dropdown=True, dropdown_id="ef-dropdown-sustainability-2024"),
    document_card("2023", "Report / Rapport", "Sustainability Report 2023", "Rapport de durabilité 2023", [
        ("sustainability-report-2023-en.pdf", "English", "en", "sustainability_2023_en"),
    ], '<p class="ef-language-note">English only / Anglais uniquement</p>', as_dropdown=True, dropdown_id="ef-dropdown-sustainability-2023"),
    document_card("Current", "Brochure", "Company Overview", "Présentation de l’entreprise", [
        ("company-overview-en.pdf", "English", "en", "company_overview_en"),
        ("company-overview-fr.pdf", "Français", "fr", "company_overview_fr"),
    ], last=True, as_dropdown=True, dropdown_id="ef-dropdown-company-overview"),
])

compliance_cards = "\n".join([
    document_card("Current", "Policy / Politique", "Supplier Code of Conduct", "Code de conduite des fournisseurs", [
        ("supplier-code-of-conduct-en.pdf", "English", "en", "supplier_code_en"),
        ("supplier-code-of-conduct-fr.pdf", "Français", "fr", "supplier_code_fr"),
    ], as_dropdown=True, dropdown_id="ef-dropdown-supplier-code"),
    document_card("Current", "Source list / Liste", "Approved Mine Sources List", "Liste des mines approuvées", [
        ("approved-mine-sources-en.pdf", "English", "en", "approved_mines_en"),
        ("approved-mine-sources-fr.pdf", "Français", "fr", "approved_mines_fr"),
    ], as_dropdown=True, dropdown_id="ef-dropdown-approved-mines"),
])

kyc_rows = "\n".join([
    entity_row("Excellent Facets Inc.", "new-customer-kyc-inc", "kyc_inc", "ef-entity-row-first"),
    entity_row("Excellent Facets SAS", "new-customer-kyc-sas", "kyc_sas"),
    entity_row("Excellent Facets SA", "new-customer-kyc-sa", "kyc_sa", "ef-entity-row-last"),
])

identification_rows = "\n".join([
    entity_row("Excellent Facets Inc.", "identification-verification-inc", "identification_inc", "ef-entity-row-first"),
    entity_row("Excellent Facets SAS", "identification-verification-sas", "identification_sas"),
    entity_row("Excellent Facets SA", "identification-verification-sa", "identification_sa", "ef-entity-row-last"),
])

header_embed = '''.ef-docs-topbar .ef-wordmark { transition: opacity .2s ease; }
@media print { .ef-docs-topbar { border-bottom-color: #202020; } }'''

hero_embed = '''@media print { .ef-docs-hero { background: #fff; color: #202020; } .ef-docs-hero .ef-hero-mark { display: none; } }'''

library_embed = '''.ef-docs-library .ef-download,
.ef-docs-library .ef-document-card { transition: background-color .2s ease, border-color .2s ease, color .2s ease, transform .2s ease; }
.ef-docs-library .ef-download-status { transition: opacity .2s ease, transform .2s ease; }
.ef-docs-library .ef-download-status.is-visible { opacity: 1; transform: translateY(0); }
.ef-docs-library .ef-download.is-downloading { cursor: wait; opacity: .65; }
.ef-docs-library .ef-download:focus-visible { outline: 3px solid #d1abab; outline-offset: 3px; }
/* Report dropdown: visibility is driven by the native <details> [open] attribute
   via display (NOT a transitioned class), so show/hide is instant and never gets
   stuck. Native <details> works without JS; documents.js only adds UX polish. */
.ef-docs-library .ef-dropdown:not([open]) > .ef-dropdown-menu { display: none; }
.ef-docs-library .ef-dropdown[open] > .ef-dropdown-menu { display: flex; }
.ef-docs-library .ef-download-caret { transform: rotate(45deg); transition: transform .2s ease; }
.ef-docs-library .ef-dropdown[open] > .ef-download-trigger .ef-download-caret { transform: rotate(-135deg); }
@keyframes ef-dropdown-in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
.ef-docs-library .ef-dropdown[open] > .ef-dropdown-menu { animation: ef-dropdown-in .15s ease both; }
@media (hover: hover) {
  .ef-docs-library .ef-download:hover { background: #245c52; border-color: #245c52; color: #fff; transform: translateY(-2px); }
  .ef-docs-library .ef-document-card:hover { border-color: #245c52; }
  .ef-docs-library .ef-dropdown-item:hover { transform: none; }
  .ef-docs-library .ef-dropdown-item:hover .ef-download-language { color: rgba(255, 255, 255, 0.8); }
}
@media (prefers-reduced-motion: reduce) {
  .ef-docs-library .ef-download,
  .ef-docs-library .ef-document-card,
  .ef-docs-library .ef-download-status { transition: none; }
  .ef-docs-library .ef-download-caret { transition: none; }
  .ef-docs-library .ef-dropdown[open] > .ef-dropdown-menu { animation: none; }
}'''

footer_embed = '''.ef-docs-footer .ef-footer-contact { transition: color .2s ease; }
.ef-docs-footer .ef-footer-contact:focus-visible { outline: 3px solid #d1abab; outline-offset: 4px; }
@media (hover: hover) { .ef-docs-footer .ef-footer-contact:hover { color: #d1abab; } }'''

BODY = f'''<a class="ef-skip-link" href="#documents-library">Skip to documents / Aller aux documents</a>
<header class="ef-docs-topbar">
  <div class="ef-topbar-inner">
    <div class="ef-wordmark" role="img" aria-label="Excellent Facets">{LOGO}</div>
  </div>
  <style data-embed>{header_embed}</style>
</header>
<section class="ef-docs-hero" aria-labelledby="documents-title">
  <div class="ef-hero-mark" aria-hidden="true"><div class="ef-hero-mark-inner"></div></div>
  <div class="ef-hero-inner">
    <p class="ef-hero-kicker"><span lang="en">Public document centre</span> · <span lang="fr">Centre de documents publics</span></p>
    <h1 class="ef-hero-title" id="documents-title"><span lang="en">Compliance &amp; Company Documents</span><span class="ef-title-fr" lang="fr">Documents de conformité et d’entreprise</span></h1>
    <p class="ef-hero-intro"><span lang="en">Download our latest compliance and company documents below.</span><span class="ef-intro-fr" lang="fr">Téléchargez ci-dessous nos derniers documents de conformité et d’entreprise.</span></p>
  </div>
  <style data-embed>{hero_embed}</style>
</section>
<main class="ef-docs-library" id="documents-library" data-ef-docs>
  <div class="ef-library-inner">
    <section class="ef-group ef-group-first" aria-labelledby="group-company">
      <div class="ef-group-heading"><span class="ef-group-number">01</span><h2 class="ef-group-title" id="group-company"><span lang="en">Company &amp; Sustainability</span><span class="ef-group-title-fr" lang="fr">Entreprise et durabilité</span></h2></div>
      <div class="ef-card-grid">{company_cards}</div>
    </section>
    <section class="ef-group" aria-labelledby="group-compliance">
      <div class="ef-group-heading"><span class="ef-group-number">02</span><h2 class="ef-group-title" id="group-compliance"><span lang="en">Compliance &amp; Suppliers</span><span class="ef-group-title-fr" lang="fr">Conformité et fournisseurs</span></h2></div>
      <div class="ef-card-grid ef-card-grid-two">{compliance_cards}</div>
    </section>
    <section class="ef-group" aria-labelledby="group-onboarding">
      <div class="ef-group-heading"><span class="ef-group-number">03</span><h2 class="ef-group-title" id="group-onboarding"><span lang="en">Customer Onboarding</span><span class="ef-group-title-fr" lang="fr">Intégration client</span></h2></div>
      <div class="ef-forms-stack">
        <article class="ef-form-card"><div class="ef-form-heading"><h3 class="ef-form-title"><span lang="en">New Customer KYC Form</span><span class="ef-form-title-fr" lang="fr">Formulaire KYC nouveau client</span></h3></div><div class="ef-entity-list">{kyc_rows}</div></article>
        <article class="ef-form-card"><div class="ef-form-heading"><h3 class="ef-form-title"><span lang="en">Identification &amp; Verification Form</span><span class="ef-form-title-fr" lang="fr">Formulaire d’identification et de vérification</span></h3></div><div class="ef-entity-list">{identification_rows}</div></article>
      </div>
    </section>
  </div>
  <div class="ef-download-status" role="status" aria-live="polite" data-download-status></div>
  <style data-embed>{library_embed}</style>
  {{SCRIPT_SLOT}}
</main>
<footer class="ef-docs-footer">
  <div class="ef-footer-inner">
    <div><p class="ef-footer-brand">Excellent Facets</p><p class="ef-footer-note">Public documents · Documents publics</p></div>
    <a class="ef-footer-contact" href="mailto:info@excellentfacets.com">info@excellentfacets.com</a>
  </div>
  <style data-embed>{footer_embed}</style>
</footer>'''


def page(script_markup):
    content = BODY.replace("{SCRIPT_SLOT}", script_markup)
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex,follow">
  <title>Compliance &amp; Company Documents | Excellent Facets</title>
  <meta name="description" content="Download Excellent Facets compliance, sustainability, supplier and customer onboarding documents in English and French.">
  <link rel="icon" href="https://cdn.prod.website-files.com/667ba12b8def17ce19a9419b/66955e507e30416995bd0b25_Favicon.png">
  <link rel="stylesheet" href="documents.css">
</head>
<body>
{content}
</body>
</html>
'''


index = page('<script src="documents.js" defer></script>')
(FINAL / "index.html").write_text(index, encoding="utf-8")
javascript = (FINAL / "documents.js").read_text(encoding="utf-8")
webflow_source = page(f"<script data-embed>{javascript}</script>")
(FINAL / "webflow-source.html").write_text(webflow_source, encoding="utf-8")
print(f"Wrote index.html ({len(index)} chars), webflow-source.html ({len(webflow_source)} chars), {index.count('data-direct-download')} download links")
