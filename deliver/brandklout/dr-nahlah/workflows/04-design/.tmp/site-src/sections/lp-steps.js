/* =============================================================================
   SECTION: lp-steps — the process rail on the ads landing pages.

   Registered against `.lp-steps`, so it runs on the three landing pages and
   nowhere else, and it travels with the markup if the section is ever moved.

   Two things happen, and neither of them reveals content:

     1. `--p` on `.lp-steps-line` scrubs 0 to 1 across the section, which fills
        the hairline above the step row.
     2. each `.lp-step` takes `is-lit` as the fill passes it, which is what
        turns its numeral from a grey outline into the brand gradient.

   The numerals, headings and copy are all legible from the first paint. The lit
   state only ever adds emphasis, so a visitor with reduced motion, with JS off
   or on a page where GSAP failed to load reads exactly the same page — it just
   does not animate. That matters more here than anywhere else on the site,
   because this is the section that explains what happens after they book.
   ============================================================================= */
WZ.section("lp-steps", function (W) {
  gsap.utils.toArray(".lp-steps").forEach(function (rail) {
    var line = rail.querySelector(".lp-steps-line");
    var steps = gsap.utils.toArray(rail.querySelectorAll(".lp-step"));
    if (!steps.length) return;

    /* Reduced motion gets the finished state, not the animation: the line full
       and every numeral lit. Painting it here rather than leaving it at zero
       means the section does not read as half-loaded. */
    if (W.reduced) {
      if (line) line.style.setProperty("--p", 1);
      steps.forEach(function (s) { s.classList.add("is-lit"); });
      return;
    }

    if (line) {
      gsap.to(line, {
        "--p": 1, ease: "none",
        /* The rail is a horizontal line on desktop and a vertical spine on a
           phone, and the phone spine is not what fills — it is a static hair.
           Scrubbing the custom property regardless is harmless there and keeps
           one trigger rather than a matchMedia branch. */
        scrollTrigger: { trigger: rail, start: "top 72%", end: "bottom 62%", scrub: .3 },
      });
    }

    steps.forEach(function (step) {
      ScrollTrigger.create({
        trigger: step, start: "top 78%",
        onEnter: function () { step.classList.add("is-lit"); },
        /* No onLeaveBack. A step that un-lights when the reader scrolls back up
           to re-read it looks like the page losing its place. */
      });
    });
  });
});
