# BrandKlout website - V13

## Preview
Open OPEN-ME.html in Chrome, Safari, Edge, or Firefox. Styling, interaction code and local reference imagery are embedded. All content pages are navigable inside the preview. Online video and optional full-resolution photo upgrades require internet access.

## Publish
Deploy the source pages plus the assets folder. OPEN-ME.html is a design preview, not the production homepage.

## This update
See CHANGELOG-v13.md. The measurable-results homepage section has Legacy, AVA and Oceanic in matching photo cards. Legacy's comparison chart is now on customer-story-legacy-dental-pasadena.html#legacy-growth-comparison.

## Rebuild
python tools/build_preview.py ../BrandKlout-Visual-Preview-v13.html
python tools/build_preview.py ../BrandKlout-Legacy-Story-v13.html --start-page customer-story-legacy-dental-pasadena.html

## Integration
The CRM endpoint is still unconfigured. Configure the form integration in assets/site.js before collecting submissions. The user-facing proof figures are client-reported, not newly verified in this design update.

## Photos
assets/results-v13.json documents the supplied photo references. Local reference images allow the new cards to display offline; the full-resolution originals upgrade when available online. Replace the low-resolution Legacy portrait with its original for sharp production imagery.
