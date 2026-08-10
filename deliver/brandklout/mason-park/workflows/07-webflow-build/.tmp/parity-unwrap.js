/* mpd-parity unwrap — remove the embed wrapper the converter puts around every
   inline icon and trademark mark.
   Source Asana task GID: 1217040406855582

   The converter emits each inline <svg> and <sup> as a verbatim HtmlEmbed, and a
   Webflow embed is a <div>. That div sits in the middle of a sentence and splits
   the inline run, so the icon or the mark lands on its own line: the FAQ question
   span measured 222x95 against the design's 379x34, and the offer chips 145x112
   against 165x43.

   CSS cannot fix it. `display:contents` was applied and verified in the computed
   style, and the span still measured 222x95; `display:inline` did nothing either.
   Removing the div from the DOM — and only that — produces 198x34 against the
   design's 198x34, exactly. So the wrapper has to go, not be restyled.

   Only wrappers holding a SINGLE svg or sup are touched. The embed's own <style>
   is hoisted to the end of <head>, which keeps its position in the cascade
   (after the Webflow stylesheet and after the parity patch, exactly where it sat
   when it was in the body).

   The html.mpd-unwrapped class this sets is what the CSS compensations in
   parity-patch.css key off: with the script running they switch themselves off
   so the design's own rules apply unmodified, and if the script never runs they
   stay on and keep the pages readable. */
(function () {
  "use strict";
  function unwrap() {
    var wraps = document.querySelectorAll(".w-embed");
    var moved = 0, rejoined = 0;
    for (var i = 0; i < wraps.length; i++) {
      var w = wraps[i];
      var kids = [];
      for (var j = 0; j < w.childNodes.length; j++) {
        var n = w.childNodes[j];
        if (n.nodeType === 1 && n.tagName === "STYLE") continue;
        if (n.nodeType === 3 && !n.nodeValue.trim()) continue;
        kids.push(n);
      }
      if (kids.length !== 1 || kids[0].nodeType !== 1) continue;
      var only = kids[0];
      var tag = only.tagName.toLowerCase();
      if (tag !== "svg" && tag !== "sup") continue;
      var st = w.querySelector("style");
      if (st) document.head.appendChild(st);
      var parent = w.parentNode;
      parent.insertBefore(only, w);
      parent.removeChild(w);
      moved++;
      // A <div> is not phrasing content, so where the converter put the embed
      // inside a <p> the PARSER already closed the paragraph before it. The
      // mark and the rest of the sentence are then siblings of the paragraph
      // rather than inside it — visible as a mark stranded on its own line, and
      // as `<sup>` computing to display:block when the container is a grid.
      // Nothing in CSS can rejoin them; the nodes have to move.
      var prev = only.previousElementSibling;
      if (prev && /^(P|H1|H2|H3|H4|H5|H6)$/.test(prev.tagName)) {
        var trailing = [];
        for (var k = only.nextSibling; k && k.nodeType === 3; k = k.nextSibling) trailing.push(k);
        prev.appendChild(only);
        for (var m = 0; m < trailing.length; m++) prev.appendChild(trailing[m]);
        rejoined++;
      }
    }
    document.documentElement.classList.add("mpd-unwrapped");
    // The chapter scripts run during parse and register their ScrollTriggers
    // against the pre-unwrap geometry. Jump-scrolling a page whose height has
    // moved under a trigger is the trap that produced four phantom defects in
    // session 2, so tell ScrollTrigger the document changed.
    if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === "function") {
      window.ScrollTrigger.refresh();
    }
    return { unwrapped: moved, rejoined: rejoined };
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", unwrap);
  } else {
    unwrap();
  }
})();
