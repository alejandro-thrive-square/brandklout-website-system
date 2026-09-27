# IA rationale — West LA Implants full site

**Decided 2026-09-22**, when Brandklout reported the homepage design approved and asked for the
rest of the site. There was no separate wireframe round: the homepage's eight-chapter journey is
the approved structural language, and the page list comes from the gap analysis, so the interior
pages went straight to the elevated build (the standing rule since the first Brandklout round:
static-first builds are rejected). `sitemap.json` beside this file is the record.

## The page count

The gap analysis put the build at 28–34 designed pages. This is **34 designed pages plus the
46-entry journal**: the 42 WordPress pages consolidated to 24 (the four cosmetic pages into one
hub, the four conditions into two, the three grafting pages into one, doctor and "commitment to
excellence" into one, gallery + stories + videos into one, the survey thank-yous into one state),
then the additions the analysis called for: six neighbourhood pages, an owned cost page, a
technology page, a sedation page, pre/post-op instructions (folded into the first-visit page),
a referring-doctor page and an accessibility statement.

## The template system

Every interior page is a list of named chapters rendered by `04-design/.tmp/site-src/lib/blocks.mjs`.
Nineteen block types; a page uses six to eight. Scroll drives at least three of them on every
designed page (`statement` written by scroll, `steps` and `compare` pinned and stepped, `ledger`
counting, `proof` where the before/after slider *is* the scroll, `rail` travelling sideways).
The same runtime and the same chrome (nav, site-index drawer, footer, mobile bar) wrap the
approved homepage, whose `index.html` is untouched apart from real nav links and the Zocdoc CTA.

Templates by page kind:

| Kind | Chapters, in order |
| :--- | :--- |
| Treatment | cover · statement · steps · compare · strip · proof · faq · invite |
| Condition | cover · statement · compare/ledger · strip · steps · proof · faq · invite |
| Decision (cost, financing) | cover · statement · ledger · compare · strip · faq · invite |
| Hub (cosmetic, general) | cover · statement · rail · steps · strip/proof · faq · invite |
| Doctor / practice | cover (film) · statement · steps/ledger · strip · team · proof · faq · invite |
| Results | cover · stories · gallery · videos · strip · invite |
| Neighbourhood | cover · statement · strip (the drive) · steps · compare · proof · faq · invite |
| Journal entry | cover · prose · invite |

## What the client still owes the build

Pricing figures (the cost page explains *why* there is no menu price and quotes after a scan;
Asana dependency "Add Pricing Information for the Pages" is open), the real form destination
(GHL setup task), consent for the three filmed patients and the before/after cases, a vector
logo, and the privacy-policy text (the page carries a clearly marked draft for counsel).

## Version Control

Follows the root-level rules in [SYSTEM_RULES.md](../../../../../../SYSTEM_RULES.md).
