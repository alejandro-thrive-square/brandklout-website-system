// THE CONCERN FILTER over the treatment ledger.
//
// The ledger renders every treatment, grouped by category, as <details> rows.
// This module adds the second axis: pick a concern and the table narrows to the
// treatments that address it.
//
// WHY IT FILTERS RATHER THAN NAVIGATES. The competitive research found that
// every serious med spa site runs a concern axis alongside the treatment axis,
// and the big ones run it as real pages — Beverly Hills has twenty-four. Ours
// is a filter over one page because the eleven-page brief does not fund twenty-
// four pages, and because a filter can be promoted to real /concerns/* pages
// later without changing the URL of anything already published. The markup is
// already shaped for that: each row carries its concerns as a data attribute,
// which is exactly what a page generator would read.
//
// It is a progressive enhancement in the strict sense. With no JavaScript the
// buttons are still rendered but every row is visible, which is the whole menu
// and therefore a correct page. Nothing is hidden in CSS by default.
//
// The filter is single-select. Multi-select was tried and discarded: with seven
// treatments and seven concerns, two concerns almost always select the entire
// menu, so the control did nothing while looking like it should.
(function () {
  "use strict";

  function initLedger() {
    var root = document.querySelector("[data-ledger]");
    if (!root) return;

    var buttons = Array.prototype.slice.call(
      document.querySelectorAll("[data-concern]")
    );
    var rows = Array.prototype.slice.call(root.querySelectorAll("[data-treatment]"));
    var groups = Array.prototype.slice.call(root.querySelectorAll("[data-group]"));
    var empty = root.querySelector("[data-ledger-empty]");
    var count = document.querySelector("[data-ledger-count]");
    if (!buttons.length || !rows.length) return;

    var active = null;

    function apply() {
      var shown = 0;

      rows.forEach(function (row) {
        var list = (row.getAttribute("data-concerns") || "").split(" ");
        var match = !active || list.indexOf(active) !== -1;
        row.hidden = !match;
        // A row left open from a previous filter would otherwise reappear
        // expanded when the filter is cleared, which reads as a glitch.
        if (!match) row.open = false;
        if (match) shown++;
      });

      // A category heading with no visible rows under it is noise, so the whole
      // shelf goes rather than leaving a heading over a gap.
      groups.forEach(function (group) {
        var visible = group.querySelectorAll("[data-treatment]:not([hidden])");
        group.hidden = visible.length === 0;
      });
      // Same for a subheading inside a category (Biostimulators).
      Array.prototype.forEach.call(root.querySelectorAll("[data-sub]"), function (sub) {
        sub.hidden = sub.querySelectorAll("[data-treatment]:not([hidden])").length === 0;
      });

      if (empty) empty.hidden = shown !== 0;

      if (count) {
        if (!active) {
          count.textContent = "";
        } else {
          var label = "";
          for (var i = 0; i < buttons.length; i++) {
            if (buttons[i].getAttribute("data-concern") === active) {
              label = buttons[i].textContent.trim();
              break;
            }
          }
          count.textContent =
            shown === 0
              ? "No treatment on the menu addresses " + label.toLowerCase() + "."
              : shown +
                (shown === 1 ? " treatment addresses " : " treatments address ") +
                label.toLowerCase() +
                ".";
        }
      }

      buttons.forEach(function (b) {
        // data-active, not aria-pressed: the chips are links since BugHerd #51.
        b.setAttribute(
          "data-active",
          b.getAttribute("data-concern") === active ? "true" : "false"
        );
      });
    }

    buttons.forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-concern");
        // Clicking the active concern clears it. Without this the only way back
        // to the full menu is a page reload, because there is no "all" button —
        // and there is no "all" button because an eighth pill that means "no
        // filter" reads as an eighth concern.
        active = active === id ? null : id;
        apply();
      });
    });

    apply();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLedger);
  } else {
    initLedger();
  }
})();
