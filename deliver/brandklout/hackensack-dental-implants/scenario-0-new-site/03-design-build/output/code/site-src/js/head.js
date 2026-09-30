/* Runs in <head>, after the vendored GSAP files. Decides once whether the page may hide anything:
   .js means scripting is on (tabs and the FAQ collapse); .motion means GSAP loaded and the
   visitor has not asked for reduced motion. No .motion, nothing is hidden and nothing is pinned. */
(function () {
  var d = document.documentElement;
  d.classList.add('js');
  if (window.gsap && window.ScrollTrigger && window.SplitText && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) d.classList.add('motion');
})();
