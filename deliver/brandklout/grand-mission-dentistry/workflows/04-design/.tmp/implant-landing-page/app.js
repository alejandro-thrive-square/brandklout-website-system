/* ==========================================================================
   IMPLANT LANDING PAGE — offer tokens + lead capture
   Asana task 1217133289235653 (parent 1217040406855578)

   SINGLE SOURCE OF TRUTH for every price and phone number on the page.
   This file runs synchronously at the end of <body>, before wzFlush(), so the
   hero counter animates toward the value set here rather than a hard-coded one.
   ========================================================================== */

var OFFER = {
  /* Single-tooth implant starting price. Currently the figure published on
     grandmissiondentistry.com ("starts at $2,999"). The previous ad company's
     landing page ran "$3,499 with an extra $500 off when paid in full" — if
     Brandklout confirms that offer is live, change this one value. */
  implantPrice: 2999,

  /* The practice's main line. The previous implant campaign used the tracking
     number (281) 747-5929; swap it in here once Brandklout confirms who owns
     that number and that it stays connected after the agency handover. */
  phoneDisplay: '(281) 789-8836',
  phoneDial: '+12817898836',
};

/* GHL lead destination. Asana task 1217133289235653 requires the lead form to
   live in GoHighLevel. Null until we have the endpoint or embed snippet — the
   form still validates, traps bots and shows its success state, so the page
   reviews end to end without GHL existing. */
var LEAD_ENDPOINT = null;
var THANK_YOU_URL = null; // the thank-you page in this build

(function () {
  /* ---------- tokens ---------------------------------------------------- */
  var priceText = OFFER.implantPrice.toLocaleString('en-US');

  document.querySelectorAll('[data-offer="implant-price-value"]').forEach(function (el) {
    el.textContent = priceText;
  });
  /* The hero figure is a counter: hand the runtime the number, not the string. */
  document.querySelectorAll('[data-offer-count]').forEach(function (el) {
    el.setAttribute('data-count', String(OFFER.implantPrice));
    el.textContent = '$' + priceText;
  });
  document.querySelectorAll('[data-tel]').forEach(function (el) {
    el.textContent = OFFER.phoneDisplay;
  });
  document.querySelectorAll('[data-tel-link]').forEach(function (el) {
    el.setAttribute('href', 'tel:' + OFFER.phoneDial);
  });

  /* ---------- multi-step qualification quiz ----------------------------- */
  var panel = document.getElementById('quiz');
  var form = document.getElementById('leadForm');
  if (!panel || !form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll('.step'));
  var bar = document.getElementById('quizBar');
  var back = document.getElementById('quizBack');
  var next = document.getElementById('quizNext');
  var progress = panel.querySelector('.panel__progress');
  var current = 0;

  function show(index) {
    current = index;
    steps.forEach(function (s, i) { s.classList.toggle('is-active', i === index); });
    var pct = ((index + 1) / steps.length) * 100;
    bar.style.width = pct + '%';
    progress.setAttribute('aria-valuenow', String(Math.round(pct)));
    back.hidden = index === 0;
    next.querySelector('span').textContent =
      index === steps.length - 1 ? 'Request my free consultation' : 'Continue';
    /* Pinned sections below measure against page height, which changes as the
       panel grows and shrinks. */
    if (window.ScrollTrigger) ScrollTrigger.refresh();
    var first = steps[index].querySelector('input:not([type=hidden])');
    if (first && index > 0) first.focus({ preventScroll: true });
  }

  /* Choosing an option advances automatically — the reason a quiz beats a block
     of fields is that each step costs one tap, not two. */
  steps.forEach(function (step, index) {
    step.querySelectorAll('input[type="radio"]').forEach(function (radio) {
      radio.addEventListener('change', function () {
        if (index < steps.length - 1) setTimeout(function () { show(index + 1); }, 220);
      });
    });
  });

  back.addEventListener('click', function () { show(Math.max(0, current - 1)); });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!validateStep(steps[current])) return;
    if (current < steps.length - 1) { show(current + 1); return; }
    submitLead();
  });

  function validateStep(step) {
    clearErrors(step);

    var radios = step.querySelectorAll('input[type="radio"]');
    if (radios.length) {
      var chosen = Array.prototype.slice.call(radios).some(function (r) { return r.checked; });
      if (!chosen) {
        var legend = step.querySelector('.step__q');
        legend.style.color = '#c0392b';
        setTimeout(function () { legend.style.color = ''; }, 1800);
        return false;
      }
      return true;
    }

    var ok = true;
    step.querySelectorAll('input[required]').forEach(function (input) {
      var valid =
        input.type === 'checkbox'
          ? input.checked
          : input.value.trim() !== '' && input.checkValidity();
      if (!valid) {
        ok = false;
        input.setAttribute('aria-invalid', 'true');
        var slot = step.querySelector('[data-error-for="' + input.id + '"]');
        if (slot) {
          slot.textContent =
            input.type === 'checkbox'
              ? 'Please agree to the terms so we can contact you.'
              : input.value.trim() === ''
              ? 'This one is required.'
              : 'Please check this is correct.';
        }
      }
    });
    return ok;
  }

  function clearErrors(step) {
    step.querySelectorAll('[aria-invalid]').forEach(function (el) {
      el.removeAttribute('aria-invalid');
    });
    step.querySelectorAll('.field__error').forEach(function (el) { el.textContent = ''; });
  }

  function submitLead() {
    /* Honeypot: a bot fills every field it finds, a patient never sees this one. */
    if (form.company_website && form.company_website.value) return;

    var data = {};
    new FormData(form).forEach(function (value, key) { data[key] = value; });
    data.page = 'implant-landing-page';
    data.asana_task_gid = '1217133289235653';

    var finish = function () {
      panel.classList.add('is-done');
      if (window.ScrollTrigger) ScrollTrigger.refresh();
      if (WZ && WZ.smoother) WZ.smoother.scrollTo(panel, true, 'center center');
      else panel.scrollIntoView({ block: 'center' });
    };

    if (!LEAD_ENDPOINT) {
      console.info('[lead] would POST to GHL:', data);
      finish();
      return;
    }

    next.disabled = true;
    next.querySelector('span').textContent = 'Sending…';
    fetch(LEAD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
      .then(function () {
        if (THANK_YOU_URL) { window.location.href = THANK_YOU_URL; return; }
        finish();
      })
      .catch(function () {
        next.disabled = false;
        next.querySelector('span').textContent = 'Request my free consultation';
        var slot = form.querySelector('[data-error-for="f-consent"]');
        if (slot) slot.textContent = 'Something went wrong. Please call the practice instead.';
      });
  }
})();
