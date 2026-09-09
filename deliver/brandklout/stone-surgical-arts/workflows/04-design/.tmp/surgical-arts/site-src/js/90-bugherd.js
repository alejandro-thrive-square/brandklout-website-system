/* ===========================================================================
   BUGHERD — the review sidebar, on the review host only. 2026-09-01.

   WHY THIS IS A JS MODULE AND NOT A <script> TAG IN partials/head.html.
   Instatic has NO custom-head field, and `importHtml` strips every <script>
   out of a page it imports: `ship.sh` reports `strippedScripts: 2` per page on
   every run, which is exactly this. A tag pasted into the head partial would
   work in `final-site/` and then silently not exist on the published site,
   which is the worst of the two possible failures because the local build
   would prove it works.

   Instatic has exactly ONE script asset for the whole site,
   `src/scripts/site.js`, assembled by push-site.mjs as
   `bootstrap + vendor.js + site.js`. That bundle is the only hook a
   third-party script has. This file is part of `site.js` — build-site.mjs
   concatenates `js/*.js` in FILENAME ORDER — so it reaches both targets from
   one place with no change to the upload workflow at all. `90-` puts it last,
   after the runtime and the two page layers, and marks it as not-core.

   > [!IMPORTANT]
   > **IT IS HOST-GATED, AND THE GATE IS THE POINT.**
   >
   > `partials/head.html` carries an explicit decision this file would
   > otherwise contradict: the typefaces are self-hosted rather than pulled
   > from Google because *"this is a medical practice, and a third-party
   > stylesheet on every page view hands Google the IP of everyone who visits"*.
   > A feedback widget loading unconditionally from bugherd.com is the same
   > trade made in the opposite direction, on a site whose visitors are people
   > researching surgery.
   >
   > So it runs on the Railway review instance and nowhere else. When this
   > moves to stonesurgicalarts.com the script stops loading BY ITSELF. That is
   > a deliberate choice of mechanism over discipline: "remember to strip
   > BugHerd before launch" is a checklist item, and checklist items are
   > forgotten. A hostname test cannot be.
   >
   > It also keeps `check-standalone.mjs` green. That suite asserts NOTHING is
   > fetched off the file so the packed previews work on a plane, and an
   > unconditional third-party script fails it on all three.

   Add a host here to extend it. Do not remove the gate and rely on removing
   the file later.

   > [!WARNING]
   > **THIS DOES NOT CURRENTLY RENDER, AND THE FAULT IS NOT HERE. 2026-09-09.**
   > The tag below is injected correctly on every published page with the right
   > key — verified live in the DOM. Instatic's publisher then writes a
   > `Content-Security-Policy` meta into every published page carrying
   > `script-src 'self'; frame-src 'none'`, which forbids the bugherd.com
   > script AND the sidebar's iframe. The CSP is not in this build and is not
   > an HTTP header, so nothing local reveals it.
   >
   > Do not "fix" this by loosening the host gate, changing the key, or moving
   > the tag back into `partials/head.html` — none of those is the cause, and
   > the head tag is stripped by `importHtml` anyway. The only things that
   > relax Instatic's CSP are a module declaring `cspSources` and a plugin
   > declaring `frontend.assets[]`. See trap 29 in
   > `workflows/21-instatic-upload/21-instatic-upload.md`.
   >
   > `bugherd-test.mjs` passes 104/104 regardless: it aborts bugherd.com
   > requests and asserts the host GATE, which still works. It has never
   > asserted that the sidebar renders.
   =========================================================================== */
(function () {
  "use strict";

  /* The Instatic instance the team reviews on. Suffix match rather than
     equality, so a Railway redeploy that mints a new generated domain does not
     silently turn the sidebar off. */
  var REVIEW_HOSTS = [".up.railway.app"];

  var host = String(window.location.hostname || "");
  var onReviewHost = REVIEW_HOSTS.some(function (suffix) {
    return host === suffix.replace(/^\./, "") || host.slice(-suffix.length) === suffix;
  });
  if (!onReviewHost) return;

  /* The project key. It is a PUBLIC client-side key by design — it ships in the
     page source of every BugHerd-instrumented site — so it is not a secret and
     it does not belong in .env. It does identify the board, so swapping client
     means swapping this. */
  var API_KEY = "whxgp1fjoqpgvwaf6mdttg";
  var SRC = "https://www.bugherd.com/sidebarv2.js?apikey=" + API_KEY;

  /* Guard on the positive, same rule as the rest of this build's JS. A second
     copy of the sidebar is a visible bug, and Instatic's own editor chrome can
     re-run a bundle. */
  if (document.querySelector('script[src*="bugherd.com/sidebarv2.js"]')) return;

  var s = document.createElement("script");
  s.src = SRC;
  s.async = true;
  document.head.appendChild(s);
})();
