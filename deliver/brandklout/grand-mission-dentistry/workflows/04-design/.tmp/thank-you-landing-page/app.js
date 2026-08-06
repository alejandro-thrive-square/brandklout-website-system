/* ==========================================================================
   THANK YOU LANDING PAGE — practice tokens + live open/closed status
   Asana task 1217162605683014 (parent 1217040406855578)

   SHARED ARCHETYPE — Mason Park Dental has the identical 4-section spec.
   To reuse: change PRACTICE below and the practice details in index.html.
   Nothing else is client-specific.
   ========================================================================== */

var PRACTICE = {
  phoneDisplay: '(281) 789-8836',
  phoneDial: '+12817898836',

  /* Opening hours as published on grandmissiondentistry.com (2026-08-05).
     [openMinutes, closeMinutes] from midnight, or null when closed.
     NOTE: the two vendor landing pages publish two *different* hour sets. This
     is the client's own current site, and it is the one to trust until
     Brandklout confirms otherwise. Keep this table and the <dl> in index.html
     in step — the banner reads this, the visible list is markup. */
  hours: {
    0: null, // Sunday
    1: [9 * 60, 19 * 60], // Monday     9:00 am – 7:00 pm
    2: [10 * 60, 20 * 60], // Tuesday  10:00 am – 8:00 pm
    3: [10 * 60, 20 * 60], // Wednesday
    4: [8 * 60, 18 * 60], // Thursday   8:00 am – 6:00 pm
    5: [8 * 60, 18 * 60], // Friday
    6: [8 * 60, 15 * 60], // Saturday   8:00 am – 3:00 pm
  },
};

var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

(function () {
  /* ---------- tokens ---------------------------------------------------- */
  document.querySelectorAll('[data-tel]').forEach(function (el) {
    el.textContent = PRACTICE.phoneDisplay;
  });
  document.querySelectorAll('[data-tel-link]').forEach(function (el) {
    el.setAttribute('href', 'tel:' + PRACTICE.phoneDial);
  });

  /* ---------- open / closed right now -----------------------------------
     A thank-you page is read minutes after the form is submitted, so "call us"
     is only useful if the visitor knows whether anyone is there to answer.
     Runs on the visitor's clock; the practice is US Central, which is accurate
     for local traffic — all a Richmond, TX campaign gets.
     -------------------------------------------------------------------- */
  var statusEl = document.getElementById('openStatus');
  var statusText = document.getElementById('openStatusText');
  var nextEl = document.getElementById('openNext');
  if (!statusEl || !statusText) return;

  var now = new Date();
  var day = now.getDay();
  var minutes = now.getHours() * 60 + now.getMinutes();
  var today = PRACTICE.hours[day];

  var fmt = function (mins) {
    var h24 = Math.floor(mins / 60);
    var m = mins % 60;
    var suffix = h24 >= 12 ? 'pm' : 'am';
    var h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    return h12 + ':' + String(m).padStart(2, '0') + ' ' + suffix;
  };

  if (today && minutes >= today[0] && minutes < today[1]) {
    statusText.textContent = 'Open now';
    statusEl.classList.add('is-open');
    nextEl.textContent = 'Closing at ' + fmt(today[1]) + ' today.';
  } else {
    statusText.textContent = 'Closed right now';
    statusEl.classList.add('is-closed');

    for (var step = 0; step < 8; step++) {
      var d = (day + step) % 7;
      var slot = PRACTICE.hours[d];
      if (!slot) continue;
      if (step === 0 && minutes >= slot[0]) continue; // already past today's open
      var label = step === 0 ? 'today' : step === 1 ? 'tomorrow' : DAY_NAMES[d];
      nextEl.textContent =
        'Opens ' + label + ' at ' + fmt(slot[0]) +
        '. Leave a message and the team will call you back.';
      break;
    }
  }

  /* Highlight today's row in the hours list. */
  var row = document.querySelector('#hoursList [data-day="' + day + '"]');
  if (row) row.classList.add('is-today');
})();
