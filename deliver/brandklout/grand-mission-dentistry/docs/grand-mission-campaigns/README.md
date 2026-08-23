# Grand Mission Dentistry campaign landing pages

Ready-to-deploy static campaign site with five complete conversion journeys:

- `/new-patients/`
- `/full-mouth-implants/`
- `/emergency-dentistry/`
- `/dental-implants/`
- `/porcelain-veneers/`

Each route has a matching `/consult/[campaign]/` and `/thank-you/[campaign]/` page. Open `preview.html` for a private route index. The public `index.html` redirects to the new-patient landing page.

## Required before launching ads

1. Open `assets/config.js` and set `formEndpoint` to the secure CRM, form service, or serverless endpoint that should receive leads.
2. Test that every form delivers a record and then redirects to the correct thank-you page. When no endpoint is configured, the site clearly shows “Preview mode” and only demonstrates the redirect; it does **not** transmit or retain phone/email data.
3. Replace or append your Google Ads / Meta Pixel / GA4 snippets. Buttons and forms already push descriptive events to `window.dataLayer` when present.
4. Confirm the offer, review count, financing language, hours, and clinical claims immediately before launch.
5. Host over HTTPS. Do not collect health details in a general marketing form; use your approved secure intake process for medical history.

## Form payload

Forms POST `multipart/form-data` to the configured endpoint with: concern, first_name, last_name, phone, email, best_time, contact_method, contact_consent, campaign, UTM fields, and gclid. A 2xx response triggers the treatment-specific thank-you page.

## Asset and content notes

- Brand colors, typography, practice photos, patient-result images, provider facts, offers, hours, and patient video IDs were adapted from Grand Mission Dentistry’s official website as of August 14, 2026.
- Review themes are paraphrased from public Google reviews; no outcome is guaranteed.
- The visual system uses the live brand’s Montserrat typography and navy, blue, warm brown, and sand palette.
