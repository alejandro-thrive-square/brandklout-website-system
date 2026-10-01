/* 52-cosmetic — the cosmetic group's own behaviour. Guards on its own elements.
   1. The gallery lightbox is position:fixed, but it sits inside #smooth-content, which ScrollSmoother
      transforms on desktop: a fixed box inside a transformed ancestor is placed against that ancestor, so
      the lightbox would open thousands of pixels down the page. It moves to <body> (its listeners go with it).
   2. The gallery's case count follows the filter. */
(function () {
  'use strict';
  var IFA = window.IFA, $ = IFA.$, $$ = IFA.$$;

  IFA.module({
    init: function () {
      var lb = $('[data-lb]');
      if (lb && lb.parentNode !== document.body) document.body.appendChild(lb);

      var count = $('[data-cos-count]'), gal = $('[data-gal]');
      if (count && gal) {
        var paint = function () { count.textContent = String($$('[data-gal-item]', gal).filter(function (it) { return !it.hidden; }).length); };
        $$('[data-filter]').forEach(function (c) { c.addEventListener('click', function () { setTimeout(paint, 0); }); });
        paint();
      }
    }
  });
})();
