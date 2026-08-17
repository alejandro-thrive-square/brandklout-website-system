/* =============================================================================
   SECTION: gallery-filter
   Registered against #gaGrid; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
/* Filtering is plain DOM work — it must keep working with GSAP absent, so this
   module uses WZ.dom, which runs immediately instead of queueing. It still goes
   through WZ.section so the registry knows about it and the gates can tell
   "this section is not on the page" apart from "this section is broken". */
WZ.dom('gallery-filter', '#gaGrid', function () {
  var bar = document.getElementById('gaFilters'),
      grid = document.getElementById('gaGrid');
  if (!bar || !grid) return;
  bar.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-cat]');
    if (!btn) return;
    var cat = btn.getAttribute('data-cat');
    bar.querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b === btn));
    });
    grid.querySelectorAll('.ga-item').forEach(function (item) {
      item.hidden = !(cat === 'all' || item.getAttribute('data-cat') === cat);
    });
    /* Pinned/scrubbed triggers elsewhere on the page measured the old height. */
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
});
