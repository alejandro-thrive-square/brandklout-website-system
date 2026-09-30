/* THE PRACTICE'S GOOGLE REVIEWS, LIVE — one copy of the Elfsight install code, read by
   three places so they cannot drift:

     build-site.mjs            inlines SNIPPET into every [data-embed="google-reviews"]
                               slot, so the static build shows the real widget.
     push-site.mjs             puts the same SNIPPET into a `brandklout.embed-origins.embed`
                               module node on a full re-push, because Instatic's importer
                               strips a raw <script> (the slot would publish empty).
     add-elfsight-reviews.mjs  (05-instatic-upload) writes the same node straight into a
                               live instance's draft, which is how it first went live on
                               2026-09-30 without a whole-site replace.

   The widget (Google Reviews, carousel, light theme, transparent background) lives on the
   shared agency Elfsight account and is registered in
   deliver/process/tools/elfsight-reviews/review-widgets.json. Its source is the MED SPA's
   own listing — Westlake Medical Aesthetics, 72 Andorra Dr #110B, Westlake, TX 76262
   (5.0 from 15 reviews, 2026-09-30). #110 is Stone Surgical Arts and #110A is Stone Dental:
   never point this widget at either. Do not create, edit or delete the widget from here;
   the registry above is the place that decides.

   ONE DELIBERATE EDIT TO ELFSIGHT'S PASTE: `data-elfsight-app-lazy` is removed. With it,
   platform.js loads, `window.eapps` exists and the widget never boots on an Instatic page
   (0px, no boot request, no error); any later DOM mutation made it render. Verified on
   Mason Park Kids 2026-09-29 and here. Keep the attribute out. */

export const WIDGET_ID = '73fff4ec-b68f-4c97-af8a-7b022584e166'
export const TITLE = 'Google reviews'
/* The Elfsight header plus one carousel row is ~440px; the slot reserves this so the
   page does not jump while platform.js boots. `fit: auto` on the Embed block means the
   block takes the widget's real height once it renders. */
export const MIN_HEIGHT = 420

export const SNIPPET = `<!-- Elfsight Google Reviews | Westlake Medical Aesthetics (#110B) -->
<script src="https://elfsightcdn.com/platform.js" async></script>
<div class="elfsight-app-${WIDGET_ID}"></div>`
