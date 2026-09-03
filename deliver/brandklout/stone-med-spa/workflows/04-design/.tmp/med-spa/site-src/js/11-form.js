// THE BOOKING FORM, WHICH IS INERT, AND THE PATH CHOOSER ABOVE IT.
//
// READ THIS BEFORE WIRING IT UP. The form does not post anywhere and that is
// deliberate, not unfinished. This practice has:
//
//   - no scheduling endpoint chosen for the med spa brand,
//   - no decision on who takes a virtual consultation or on what platform,
//   - and therefore no answer to whether that platform is HIPAA-compliant.
//
// A medical intake form that collects a name, a phone number and a description
// of what someone dislikes about their face, and then drops it, is worse than
// no form: the patient believes they have booked. So submit is prevented, the
// status line says plainly that the form is not live yet, and it gives the
// phone number, which is a channel that actually works today.
//
// WHEN AN ENDPOINT EXISTS: delete the preventDefault branch, put the action on
// the <form>, and delete this comment. Do not "just turn it on" without also
// confirming the destination is HIPAA-appropriate — the fields below are PHI
// the moment a patient types into them.
//
// The path chooser is the small piece that does work: choosing virtual or
// in-office scrolls to the form and preselects the matching option, so the two
// halves of the page are one flow rather than two.
(function () {
  "use strict";

  function initPaths() {
    var links = document.querySelectorAll("[data-path]");
    if (!links.length) return;
    var select = document.querySelector("[data-visit-type]");

    Array.prototype.forEach.call(links, function (link) {
      link.addEventListener("click", function () {
        if (!select) return;
        var want = link.getAttribute("data-path");
        for (var i = 0; i < select.options.length; i++) {
          if (select.options[i].value === want) {
            select.selectedIndex = i;
            break;
          }
        }
      });
    });
  }

  function initForm() {
    var form = document.querySelector("[data-inert-form]");
    if (!form) return;
    var status = form.querySelector("[data-form-status]");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!status) return;
      status.textContent =
        "This form is not connected yet. Please call (817) 383-8361 and we will book you in — " +
        "your details have not been sent.";
      // Focus is NOT moved to the status line. It is aria-live="polite", so a
      // screen reader announces it without yanking the caret out of the field
      // the visitor was in, and a sighted user is already looking at the button
      // the message appears beside.
    });
  }

  function boot() {
    initPaths();
    initForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
