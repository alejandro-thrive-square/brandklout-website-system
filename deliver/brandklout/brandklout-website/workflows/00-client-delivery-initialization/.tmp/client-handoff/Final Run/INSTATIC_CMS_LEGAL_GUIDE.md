# Instatic CMS Setup — Legal Pages

This package converts **Privacy**, **Terms**, and **HIPAA & Data Handling** into a single reusable CMS collection.

## What to create in Instatic

Create one collection named **Legal Pages** and one collection-page template.

Recommended route:

`/legal/{slug}`

You can also use root-level routes if Instatic supports them. The important part is that all policy pages share one template.

## Collection fields

| Field | Type | Purpose |
|---|---|---|
| Name | Plain text | Internal CMS item name |
| Slug | Slug | Page URL |
| Footer label | Plain text | Short navigation/footer label |
| Eyebrow | Plain text | Small heading above page title |
| Page title | Plain text | H1 |
| Intro | Plain text | Intro sentence below H1 |
| Notice | Plain text | Optional callout above policy body |
| Body | **Rich text** | Main editable legal/policy content |
| SEO title | Plain text | Browser/search title |
| SEO description | Plain text | Meta description |
| Canonical path | Plain text | Optional canonical route |
| Sort order | Number | Optional ordering |
| Published | Boolean | Publish control |
| Show market prequalification | Boolean | Optional CTA visibility control |

The exact schema is in `cms/legal-pages/schema.json`.

## Import the current three records

Use either:

- `cms/legal-pages/legal-pages.csv` — easiest for most CMS importers
- `cms/legal-pages/legal-pages.json` — structured migration source
- `cms/legal-pages/entries/*.md` — human-readable backup/editing format

Current entries:

1. Privacy Policy
2. Terms of Use
3. HIPAA & Data Handling

## Template

Import `cms-templates/legal-page-template.html` as the collection-page template.

Use `assets/pages/legal-cms-template.css` as its stylesheet.

Elements are marked with `data-cms-field` attributes so the binding is obvious:

- `data-cms-field="footer_label"`
- `data-cms-field="eyebrow"`
- `data-cms-field="title"`
- `data-cms-field="intro"`
- `data-cms-field="notice"`
- `data-cms-field="body_richtext"`

SEO tags are marked with `data-cms-seo`.

## To add a new legal page later

Do **not** duplicate HTML.

1. Add a new item to **Legal Pages**.
2. Enter its title, slug, intro and rich-text body.
3. Publish it.
4. Add its CMS link to the footer only if you want it surfaced there.

The same template and stylesheet will render it automatically.

## Static snapshots in this package

`privacy.html`, `terms.html`, and `hipaa.html` are retained only as local-preview / fallback snapshots. They now all use `legal-cms-template.css` and are generated from the CMS content source. **Do not import them as three independently managed Instatic pages.**
