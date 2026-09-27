# BrandKlout V11 - Three featured stories + story introductions

## View the site
Open `OPEN-ME.html` in a desktop browser for a self-contained, internally navigable preview.
It includes the current styles, scripts, graphics, and local story covers.
YouTube streaming and optional online photography require internet access.
If a local browser blocks an embed, use the adjacent Watch on YouTube link or serve the site through your web host.

## What changed
- Expanded homepage and customer-story directory cards: rounded white panels, category badges, in-place video, practice summary, result grid, and a full-story link.
- Three featured stories on the homepage, in this order: Legacy, AVA, OCPAO. One row on desktop (1000px and wider), stacked on smaller screens. All six stories remain in the directory.
- Each detailed story now has a short, case-specific introduction immediately below its What changed heading, matching the Challenge panel structure.
- Reference-inspired detail headers with a gradient headline, white-framed media panel, speaker details, and dark summary strip.
- Restored Challenge / What changed panels, Why this story matters, and a three-part playbook on all six detail pages.
- Existing case-study charts remain. The six solutions, three promoted specialty categories, guarantee page, assessment questions, and assessment video were not redesigned in this update.

## Video sources
Legacy: -AoUNSpxeAo
Oceanic / visibility: MeqveWUBHO4
Omnia: xS-FwYPS0DY
OCPAO: pChw6256klY
Oceanic / future ready: r92o3HAhRec

AVA has no customer-interview URL in the supplied source package. Its card and detail header remain a written customer story; no unrelated video was substituted.
Videos load inside their card/header after Play, rather than in a modal. The interface has a close control and a direct YouTube fallback link. No video autoplays on page load.

## Editable files
- `index.html`: homepage story grid.
- `customer-stories.html`: complete story directory.
- `customer-story-*.html`: the six detailed stories.
- `assets/stories-v10.css`: scoped story layout and responsive styles.
- `assets/stories-v10.js`: in-place video player behavior.
- `assets/customer-stories-v10.json`: a reference manifest of the content used in the compiled pages (not a live content feed).
- `assets/story-media/`: local fallback covers.

## Rebuild the self-contained preview
Install beautifulsoup4, then from this folder run:

    python3 tools/build_preview.py OPEN-ME.html

To create a preview starting on a particular page:

    python3 tools/build_preview.py legacy-preview.html --start-page customer-story-legacy-dental-pasadena.html

The normal HTML files use the assets directory. Keep that directory alongside the files on deployment.
The preview builder inlines the CSS, JavaScript and local images. It deliberately excludes OPEN-ME.html and START-HERE.html from the page registry.

## What still needs setup
Existing CRM and booking configuration is unchanged. No live lead-submission integration was activated by this update.
Client figures remain selected client-period claims, not predictions for another practice. AVA's $109K is monthly collections within the first 90 days after grand opening, not production or a cumulative 90-day total.

## QA
See QA_SUMMARY.json for the current V11 layout, content, and interaction checks.
YouTube embed construction and inline controls were checked; external streaming could not be tested in this environment.
