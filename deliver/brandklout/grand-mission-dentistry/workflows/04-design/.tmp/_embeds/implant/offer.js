/* OFFER + LEAD LAYER — single source of truth for every price and phone
   number on the page (Asana 1217133289235653). Behaviour, not motion: runs at
   DOM-ready whatever GSAP or prefers-reduced-motion say, before the kit's
   counters read data-count (the boot gate guarantees that order). */
WZ.onReady(function () {
  var OFFER = {
    /* Single-tooth implant starting price — the figure published on
       grandmissiondentistry.com ("starts at $2,999"). The previous ad
       company's page ran "$3,499 with an extra $500 off when paid in full";
       if Brandklout confirms that offer is live, change this one value. */
    implantPrice: 2999,
    /* The implant campaign's own call-tracking number, as published on the
       vendor original. OPEN with Brandklout: if it belongs to the outgoing ad
       company it may be disconnected at handover. Fallback is the main line,
       (281) 789-8836 / +12817898836 — a two-line change here, nowhere else. */
    phoneDisplay: '(281) 747-5929',
    phoneDial: '+12817475929',
  };
  /* GHL lead destination — null until Brandklout hands over the endpoint. The
     form still validates, traps bots and shows its success state. */
  var LEAD_ENDPOINT = null;
  var THANK_YOU_URL = null;

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

  /* ---------- multi-step qualification quiz ---------------------------- */
  var panel = document.getElementById('quiz');
  var form = document.getElementById('leadForm');
  if (!panel || !form) return;

  var steps = Array.prototype.slice.call(form.querySelectorAll('.gm-step'));
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
    /* Pinned sections measure against page height, which changes as the
       panel grows and shrinks. */
    if (window.ScrollTrigger) ScrollTrigger.refresh();
    var first = steps[index].querySelector('input:not([type=hidden])');
    if (first && index > 0) first.focus({ preventScroll: true });
  }

  /* Choosing an option advances automatically — each step costs one tap. */
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
    /* Honeypot: a bot fills every field it finds, a patient never sees it. */
    if (form.company_website && form.company_website.value) return;

    var data = {};
    new FormData(form).forEach(function (value, key) { data[key] = value; });
    data.page = 'implant-landing-page';
    data.asana_task_gid = '1217133289235653';

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
});
