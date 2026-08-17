/* ==========================================================================
   COSMETIC LANDING PAGE — offer tokens + lead capture
   Asana task 1217072657902270 (parent 1217040406855578)

   SINGLE SOURCE OF TRUTH for every price and phone number on the page.
   Runs synchronously at the end of <body>, before wzFlush(), so the offer
   counters animate toward the values set here.
   ========================================================================== */

var OFFER = {
  /* Live offers published on grandmissiondentistry.com (2026-08-05). */
  newPatient: 189, // exam, X-rays, cleaning, treatment plan
  invisalign: 3799, // aligners, refinements, retainer, whitening

  /* The cosmetic campaign's own call-tracking number, as published on the
     vendor original — distinct from the implant page's, which is the point of
     tracking numbers. OPEN with Brandklout: if it belongs to the outgoing ad
     company it may be disconnected at handover. Fallback is the main line,
     (281) 789-8836 / +12817898836. */
  phoneDisplay: '(281) 729-4615',
  phoneDial: '+12817294615',
};

/* GHL lead destination — Asana task 1217072657902270 requires the form to live
   in GoHighLevel. Null until we have the endpoint or embed snippet. */
var LEAD_ENDPOINT = null;
var THANK_YOU_URL = null; // the thank-you page in this build

(function () {
  /* ---------- tokens ---------------------------------------------------- */
  var text = {
    'new-patient-value': OFFER.newPatient.toLocaleString('en-US'),
    'invisalign-value': OFFER.invisalign.toLocaleString('en-US'),
  };
  Object.keys(text).forEach(function (key) {
    document.querySelectorAll('[data-offer="' + key + '"]').forEach(function (el) {
      el.textContent = text[key];
    });
  });

  /* Counters get the number, not the string. */
  var counters = { 'new-patient': OFFER.newPatient, invisalign: OFFER.invisalign };
  Object.keys(counters).forEach(function (key) {
    document.querySelectorAll('[data-offer-count="' + key + '"]').forEach(function (el) {
      el.setAttribute('data-count', String(counters[key]));
      el.textContent = counters[key].toLocaleString('en-US');
    });
  });

  document.querySelectorAll('[data-tel]').forEach(function (el) {
    el.textContent = OFFER.phoneDisplay;
  });
  document.querySelectorAll('[data-tel-link]').forEach(function (el) {
    el.setAttribute('href', 'tel:' + OFFER.phoneDial);
  });

  /* ---------- lead form ------------------------------------------------- */
  var panel = document.getElementById('book');
  var form = document.getElementById('leadForm');
  var submit = document.getElementById('formSubmit');
  if (!panel || !form) return;

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (!validate()) return;

    /* Honeypot: a bot fills every field it finds, a patient never sees this. */
    if (form.company_website && form.company_website.value) return;

    var data = {};
    new FormData(form).forEach(function (value, key) { data[key] = value; });
    data.page = 'cosmetic-landing-page';
    data.asana_task_gid = '1217072657902270';

    var finish = function () {
      panel.classList.add('is-done');
      if (window.ScrollTrigger) ScrollTrigger.refresh();
      if (window.WZ && WZ.smoother) WZ.smoother.scrollTo(panel, true, 'center center');
      else panel.scrollIntoView({ block: 'center' });
    };

    if (!LEAD_ENDPOINT) {
      console.info('[lead] would POST to GHL:', data);
      finish();
      return;
    }

    submit.disabled = true;
    submit.querySelector('span').textContent = 'Sending…';
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
        submit.disabled = false;
        submit.querySelector('span').textContent = 'Request my consultation';
        var slot = form.querySelector('[data-error-for="f-consent"]');
        if (slot) slot.textContent = 'Something went wrong. Please call the practice instead.';
      });
  });

  function validate() {
    form.querySelectorAll('[aria-invalid]').forEach(function (el) {
      el.removeAttribute('aria-invalid');
    });
    form.querySelectorAll('.field__error').forEach(function (el) { el.textContent = ''; });

    var ok = true;
    form.querySelectorAll('input[required]').forEach(function (input) {
      var valid =
        input.type === 'checkbox'
          ? input.checked
          : input.value.trim() !== '' && input.checkValidity();
      if (!valid) {
        ok = false;
        input.setAttribute('aria-invalid', 'true');
        var slot = form.querySelector('[data-error-for="' + input.id + '"]');
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
})();
