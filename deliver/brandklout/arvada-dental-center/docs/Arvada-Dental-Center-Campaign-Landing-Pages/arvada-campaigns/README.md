# Arvada Dental Center & Implants campaign landing pages

Ready-to-deploy static campaign site with six complete conversion journeys:

- `/dentist-near-me/` — $109 new patient visit
- `/next-door-family/` — family and neighborhood
- `/dental-implants/` — single and multiple implants
- `/all-on-x-full-arch/` — fixed full arch
- `/emergency-dentistry/` — urgent care
- `/porcelain-veneers/` — cosmetic

Each route has a matching `/consult/[campaign]/` and `/thank-you/[campaign]/` page. Open `preview.html` for a private route index. The public `index.html` redirects to the new patient landing page.

Section structure is a one-for-one mirror of the Grand Mission Dentistry campaign package in `../../Grand-Mission-Dentistry-Campaign-Landing-Pages/`. Only the content, imagery, palette, and typography differ.

## Required before launching ads

1. Open `assets/config.js` and set `formEndpoint` to the secure CRM, form service, or serverless endpoint that should receive leads.
2. Test that every form delivers a record and then redirects to the correct thank-you page. When no endpoint is configured, the site clearly shows "Preview mode" and only demonstrates the redirect; it does **not** transmit or retain phone/email data.
3. Replace or append your Google Ads / Meta Pixel / GA4 snippets. Buttons and forms already push descriptive events to `window.dataLayer` when present.
4. Confirm the offer, review count, financing language, hours, and clinical claims immediately before launch.
5. Host over HTTPS. Do not collect health details in a general marketing form; use your approved secure intake process for medical history.

## Form payload

Forms POST `multipart/form-data` to the configured endpoint with: concern, first_name, last_name, phone, email, best_time, contact_method, contact_consent, campaign, UTM fields, and gclid. A 2xx response triggers the treatment-specific thank-you page.

## Asset and content notes

- Brand colours, typography, practice photos, patient-result images, provider facts, offers, hours, reviews, and FAQ answers were taken from Arvada Dental Center & Implants' official website as of August 18, 2026.
- Fonts are self-hosted from the live brand system: Area Extended (headings), Century Gothic (body), Garnetta (available for taglines). No external font or script requests are made.
- The visual system uses the live brand's brown, warm brown, gold, and cream palette.
- The emergency FAQ on the live site quotes a phone number that is not the practice's main line; every page in this package uses **(303) 421-7611** throughout.
- Two campaigns run offers with legal restrictions: the $109 new patient special (patients 18 and over, restrictions apply, not HMO or Medicaid) and the published $18,795 fixed full arch. Both disclaimers appear in the offer fine print and the footer.

## Regenerating

Copy edits live in `build/data.mjs`. Structure lives in `build/build.mjs`. After changing either:

```
node build/build.mjs
```

That rewrites all 20 HTML files. `assets/styles.css`, `assets/app.js`, and `assets/config.js` are hand-maintained and are not regenerated.
