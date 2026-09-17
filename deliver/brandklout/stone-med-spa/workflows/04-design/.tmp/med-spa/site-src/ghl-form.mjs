/* THE PRACTICE'S GO HIGH LEVEL FORM — one copy of the vendor paste, read by two
   places so they cannot drift:

     build-site.mjs   inlines SNIPPET into the [data-embed="ghl-form"] slot, so the
                      static build and any plain host show the real form.
     push-site.mjs    puts the same SNIPPET into a `brandklout.embed-origins.embed`
                      module node, because Instatic's importer publishes a
                      non-YouTube <iframe> as an empty div (workflow 18, and the
                      memory note "Instatic iframe is a forbidden custom tag").

   THE PASTE IS THE CLIENT'S, VERBATIM, with two deliberate edits:

     1. `height:100%` -> `height:565px`. The vendor writes 100%, which resolves
        against a wrapper that has no height of its own (the Embed block's
        `.wz-embed` is auto-height in snippet mode), so the form collapses to
        nothing. 565px is the vendor's own `data-height`, and `form_embed.js`
        overwrites it with the real height as soon as the form reports one.
     2. `loading="lazy"` added. The form sits below the fold on /book.

   `data-cookie-consent="true"` is the vendor's; it is also what the site's
   consent bridge (`001-brandklout-consent-bridge.js`, a site script installed on
   this instance) looks for — it rewrites this iframe's URL with the visitor's
   Termly choice as `privacy_*` query parameters. Termly itself is NOT installed
   on this site yet, and until it is the bridge writes the same values a Decline
   would. Do not remove the vendor's data-* attributes: the bridge matches the
   iframe by its `/widget/form/` URL and the script sizes it by its id.

   WHEN THE CLIENT SENDS A DIFFERENT FORM: change FORM_ID and the paste here, and
   nothing else. Both consumers follow. */

export const FORM_ID = 'Gqnb0W1NH95MjROPRaLe'
export const FORM_NAME = 'Contact Page'
export const HEIGHT = 565

export const SNIPPET = `<iframe
    src="https://api.leadconnectorhq.com/widget/form/${FORM_ID}"
    style="width:100%;height:${HEIGHT}px;border:none;border-radius:8px"
    id="inline-${FORM_ID}"
    data-layout="{'id':'INLINE'}"
    data-trigger-type="alwaysShow"
    data-trigger-value=""
    data-activation-type="alwaysActivated"
    data-activation-value=""
    data-deactivation-type="neverDeactivate"
    data-deactivation-value=""
    data-form-name="${FORM_NAME}"
    data-height="${HEIGHT}"
    data-layout-iframe-id="inline-${FORM_ID}"
    data-form-id="${FORM_ID}"
    data-cookie-consent="true"
    data-cookie-consent-provider="auto"
    title="${FORM_NAME}"
    loading="lazy"
></iframe>
<script src="https://link.msgsndr.com/js/form_embed.js"></script>`
