/* CHAPTER 01 — THE LOSS (pinned, scrubbed): the sentence is written word by
   word and the ridge gauge narrows in step with it. */
WZ.add(function (W) {
  var pin = document.getElementById('lossPin');
  var big = document.getElementById('lossBig');
  var bar = document.getElementById('ridgeBar');
  var num = document.getElementById('lossCount');
  var rail = document.getElementById('lossRail');
  if (!pin || !big || !bar) return;

  var sp = W.splitWords(big);
  var words = sp && sp.words && sp.words.length ? sp.words : null;

  /* The client's own figure. The gauge is the sentence made visible. */
  var LOST = 25;

  var paint = function (p) {
    if (words) {
      /* Words brighten one at a time; each word owns its own colour — two
         tweens writing colour on one word over overlapping ranges flicker. */
      var reached = p * (words.length + 2);
      for (var i = 0; i < words.length; i++) {
        var local = Math.min(1, Math.max(0, reached - i));
        words[i].style.color = 'rgba(255,255,255,' + (0.22 + local * 0.78).toFixed(3) + ')';
      }
    }
    /* Never lands exactly on 1: a scrubbed scale that resolves to 1 snaps
       its rasterisation and flickers at the edge. */
    gsap.set(bar, { scaleX: 1 - (LOST / 100) * p });
    if (num) num.textContent = 'Up to ' + Math.round(LOST * p) + '%';
    if (rail) gsap.set(rail, { scaleX: p });
  };

  var mm = gsap.matchMedia();
  mm.add('(min-width: 760px)', function () {
    return W.scrub(
      { trigger: pin, start: 'top top', end: '+=130%', pin: true, scrub: 0.3, anticipatePin: 1, invalidateOnRefresh: true },
      paint
    );
  });
  /* Below 760px the pin would eat the whole screen on a device that has
     little of it. The same scene plays, driven by the section passing. */
  mm.add('(max-width: 759px)', function () {
    return W.scrub({ trigger: pin, start: 'top 80%', end: 'bottom 55%', scrub: 0.35 }, paint);
  });
});
