/* All-on-X quiz pages: behaviour only.

   Every word a visitor reads is a native Webflow element and is edited in the
   Designer: the questions, the answers, the prices, the headline variants.
   This script reads them from the page; it holds no copy except the
   validation messages. What it does:

     - walks the quiz one step at a time and sends the lead
     - swaps the headline for ?hl=<name> (text lives in data-hl-<name> on #hl)
     - shows the sticky bar, opens patient videos over the page
     - pushes the tracking events the campaign uses to window.dataLayer

   SETTINGS live on the quiz element (#quiz) as custom attributes:
     data-lead-webhook   the GoHighLevel inbound webhook URL. EMPTY = no lead is sent.
     data-thank-you      where a submitted lead lands.
*/
(function(){
  'use strict';

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.dataLayer = window.dataLayer || [];
  function track(event, data){
    try { var o = { event: event }; if (data) for (var k in data) o[k] = data[k]; window.dataLayer.push(o); } catch (e) {}
  }
  function text(el){ return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }

  var params = new URLSearchParams(location.search);
  var attribution = {};
  ['utm_source','utm_medium','utm_campaign','utm_content','utm_term','gclid','fbclid','hl'].forEach(function(k){
    var v = params.get(k); if (v) attribution[k] = v;
  });

  /* ===== Headline variants for ad message match: ?hl=dentures | failing | price | monthly ===== */
  var hlEl = document.getElementById('hl');
  var hl = params.get('hl');
  if (hlEl && hl && /^[a-z0-9-]+$/.test(hl)) {
    var variant = hlEl.getAttribute('data-hl-' + hl);
    if (variant) hlEl.textContent = variant;
  }

  /* ===== Quiz ===== */
  var quiz = document.getElementById('quiz');
  if (quiz) initQuiz();

  function initQuiz(){
    var steps = Array.prototype.slice.call(quiz.querySelectorAll('.aq-qstep'));
    var questions = steps.filter(function(s){ var k = s.getAttribute('data-step'); return k !== 'contact' && k !== 'done'; });
    var contactStep = steps.filter(function(s){ return s.getAttribute('data-step') === 'contact'; })[0];
    var doneStep = steps.filter(function(s){ return s.getAttribute('data-step') === 'done'; })[0];
    var order = questions.concat(contactStep ? [contactStep] : [], doneStep ? [doneStep] : []);
    var fill = document.getElementById('q-fill');
    var count = document.getElementById('q-count');
    var bar = quiz.querySelector('.aq-track');
    var back = quiz.querySelector('.aq-back');
    var form = document.getElementById('lead-form');
    var answers = {}, arch = '', idx = 0, started = false, advancing = false, sending = false;

    function el(id){ return document.getElementById(id); }

    function show(i, moveFocus){
      idx = Math.max(0, Math.min(i, order.length - 1));
      order.forEach(function(s, j){ s.classList.toggle('is-active', j === idx); });
      var n = questions.length;
      var pct = Math.round((Math.min(idx, n + 1) + 1) / (n + 2) * 100);
      if (fill) fill.style.width = pct + '%';
      if (bar) bar.setAttribute('aria-valuenow', pct);
      if (count) count.textContent = idx < n ? 'Question ' + (idx + 1) + ' of ' + n : (order[idx] === contactStep ? 'Last step' : 'All done');
      if (back) back.classList.toggle('is-hidden', idx === 0 || order[idx] === doneStep);
      if (order[idx] === contactStep) estimate();
      if (moveFocus) {
        var q = order[idx].querySelector('.aq-q');
        if (q) { q.setAttribute('tabindex', '-1'); q.focus({ preventScroll: true }); }
        if (quiz.getBoundingClientRect().top < 0) quiz.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      }
    }

    /* The estimate on the last step follows the "which teeth" answer. Its one-arch
       wording is the element's own text; the other wordings are its attributes. */
    function estimate(){
      var est = quiz.querySelector('.aq-est'); if (!est) return;
      var l = est.querySelector('.aq-est-l'), n = est.querySelector('.aq-est-n'), m = est.querySelector('.aq-est-m');
      [l, n, m].forEach(function(x){ if (x && !x.hasAttribute('data-default')) x.setAttribute('data-default', x.textContent); });
      function pick(node, name){ if (node) node.textContent = est.getAttribute(name) || node.getAttribute('data-default'); }
      pick(l, arch ? 'data-label-' + arch : '');
      pick(n, arch === 'both' ? 'data-total-both' : '');
      pick(m, arch === 'both' ? 'data-note-both' : '');
    }

    questions.forEach(function(step){
      var key = step.getAttribute('data-step');
      Array.prototype.slice.call(step.querySelectorAll('.aq-opt')).forEach(function(opt){
        opt.setAttribute('role', 'button');
        opt.setAttribute('aria-pressed', 'false');
        opt.addEventListener('click', function(e){
          e.preventDefault();
          if (advancing) return;
          var label = text(opt.querySelector('.aq-opt-label')) || text(opt);
          answers[key] = label;
          if (opt.hasAttribute('data-arch')) arch = opt.getAttribute('data-arch');
          Array.prototype.slice.call(step.querySelectorAll('.aq-opt')).forEach(function(x){
            x.classList.toggle('is-selected', x === opt); x.setAttribute('aria-pressed', String(x === opt));
          });
          if (!started) { started = true; track('quiz_start'); }
          track('quiz_step', { quiz_step: questions.indexOf(step) + 1, quiz_question: key, quiz_answer: label });
          advancing = true;
          setTimeout(function(){ advancing = false; show(idx + 1, true); }, reduce ? 0 : 170);
        });
      });
    });

    if (back) back.addEventListener('click', function(e){ e.preventDefault(); show(idx - 1, true); });

    /* ----- the lead form ----- */
    function digits(p){
      var d = String(p).replace(/\D/g, '');
      if (d.length === 11 && d.charAt(0) === '1') d = d.slice(1);
      return d;
    }
    function showErr(id, msg){
      var input = el(id), e = el(id + '-err');
      if (!input || !e) return !msg;
      if (msg) { input.setAttribute('aria-invalid', 'true'); e.textContent = msg; e.classList.add('is-shown'); }
      else { input.removeAttribute('aria-invalid'); e.classList.remove('is-shown'); }
      return !msg;
    }
    function sendLead(payload){
      var url = (quiz.getAttribute('data-lead-webhook') || '').trim();
      if (!url) {
        /* No webhook: a preview walks through and sends nothing, but only on a
           review host. On a real domain it fails, so a visitor is told to call
           instead of being thanked for a lead nobody received. */
        var previewHost = /^(localhost|127\.0\.0\.1)$|\.webflow\.io$/.test(location.hostname);
        if (window.console) console.warn('[aox-quiz] data-lead-webhook is empty: this lead was NOT sent anywhere' + (previewHost ? ' (preview mode).' : '.'));
        return previewHost ? Promise.resolve() : Promise.reject(new Error('no lead webhook configured'));
      }
      return fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), keepalive: true
      }).then(function(r){ if (!r.ok) throw new Error('HTTP ' + r.status); });
    }

    if (form) {
      form.noValidate = true;
      var name = el('f-name'), phone = el('f-phone'), email = el('f-email'), sms = el('f-sms');
      var submit = form.querySelector('[type="submit"]');
      var formErr = el('form-err');
      var submitLabel = submit ? submit.value : '';
      if (name) name.placeholder = '';
      if (email) email.placeholder = '';
      if (phone) {
        phone.placeholder = '(303) 555-0123';
        phone.addEventListener('blur', function(){
          var d = digits(phone.value);
          if (d.length === 10) phone.value = '(' + d.slice(0,3) + ') ' + d.slice(3,6) + '-' + d.slice(6);
        });
      }
      /* Capture phase, and stopped here: the site's own form handler must never
         see this submit, or the lead would also go to Webflow's form inbox. */
      form.addEventListener('submit', function(ev){
        ev.preventDefault(); ev.stopPropagation(); ev.stopImmediatePropagation();
        if (sending) return;
        var first = null;
        var nm = name.value.trim(), d = digits(phone.value), em = email ? email.value.trim() : '';
        if (!showErr('f-name', nm ? '' : 'Enter your first name so we know who to ask for.')) first = first || 'f-name';
        if (!showErr('f-phone', d.length === 10 ? '' : 'Enter a 10-digit mobile number so our coordinator can reach you.')) first = first || 'f-phone';
        if (!showErr('f-email', !em || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em) ? '' : 'Check your email address, or leave it blank.')) first = first || 'f-email';
        if (first) { el(first).focus(); track('lead_form_error', { field: first }); return; }

        if (formErr) formErr.classList.remove('is-shown');
        sending = true;
        if (submit) { submit.disabled = true; submit.value = 'Sending your request…'; }

        var payload = {};
        for (var k in answers) payload[k] = answers[k];
        payload.first_name = nm;
        payload.phone = d;
        payload.email = em;
        payload.sms_consent = !!(sms && sms.checked);
        payload.landing_page = location.origin + location.pathname;
        payload.submitted_at = new Date().toISOString();
        for (var a in attribution) payload[a] = attribution[a];

        sendLead(payload).then(function(){
          track('generate_lead', { quiz_arch: answers.arch, quiz_timeline: answers.timeline, quiz_payment: answers.payment });
          var ty = quiz.getAttribute('data-thank-you');
          if (ty) {
            /* The first name travels in sessionStorage, never in the URL. */
            try { sessionStorage.setItem('aox_lead', JSON.stringify({ first_name: nm, at: Date.now() })); } catch (e) {}
            /* a short pause lets the tag manager send generate_lead before the page changes */
            setTimeout(function(){ location.assign(ty); }, 350);
            return;
          }
          sending = false;
          show(order.indexOf(doneStep) >= 0 ? order.indexOf(doneStep) : idx, true);
        }).catch(function(){
          sending = false;
          if (submit) { submit.disabled = false; submit.value = submitLabel; }
          if (formErr) formErr.classList.add('is-shown');
        });
      }, true);
    }

    /* Every "See if I qualify" button scrolls to the quiz and keeps the visitor's place. */
    Array.prototype.slice.call(document.querySelectorAll('[data-to-quiz]')).forEach(function(b){
      b.addEventListener('click', function(e){
        e.preventDefault();
        track('cta_click', { cta_location: b.getAttribute('data-loc') || '' });
        quiz.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        setTimeout(function(){
          var q = order[idx].querySelector('.aq-q');
          if (q) { q.setAttribute('tabindex', '-1'); q.focus({ preventScroll: true }); }
        }, reduce ? 0 : 450);
      });
    });

    /* Sticky mobile bar appears once the quiz and the final call to action are out of view. */
    var sticky = document.getElementById('sticky');
    var finalSec = document.getElementById('final');
    if (sticky && finalSec && 'IntersectionObserver' in window) {
      var quizVisible = true, finalVisible = false;
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if (en.target === quiz) quizVisible = en.isIntersecting; else finalVisible = en.isIntersecting;
        });
        sticky.classList.toggle('is-visible', !quizVisible && !finalVisible);
      }, { threshold: 0.12 });
      io.observe(quiz); io.observe(finalSec);
    }

    quiz.classList.add('is-ready');
    show(0, false);
  }

  /* ===== Patient video dialog =====
     A face tile is a plain link to YouTube, so it works with scripts off. With
     scripts on the video opens over the page. No player exists until a click. */
  var dlg = null, frame = null, lastTile = null;
  function buildDialog(){
    dlg = document.createElement('dialog');
    dlg.className = 'aq-vid';
    dlg.setAttribute('aria-label', 'Patient story video');
    dlg.innerHTML = '<button type="button" class="aq-vid-x" aria-label="Close video">&times;</button><div class="aq-vid-frame"></div>';
    document.body.appendChild(dlg);
    frame = dlg.querySelector('.aq-vid-frame');
    dlg.querySelector('.aq-vid-x').addEventListener('click', function(){ dlg.close(); });
    dlg.addEventListener('click', function(e){ if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function(){
      frame.innerHTML = '';
      if (lastTile) lastTile.focus({ preventScroll: true });
    });
  }
  function openVideo(id, title, tile){
    if (!dlg) buildDialog();
    lastTile = tile;
    var f = document.createElement('iframe');
    f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0&playsinline=1';
    f.title = title || 'Patient story';
    f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    f.allowFullscreen = true;
    frame.appendChild(f);
    dlg.showModal();
  }

  /* ===== Click tracking: phone, prequalify, video ===== */
  document.addEventListener('click', function(e){
    if (!e.target.closest) return;
    var a = e.target.closest('a[href^="tel:"]');
    if (a) track('phone_click', { cta_location: a.getAttribute('data-loc') || '' });
    var pq = e.target.closest('a[href*="pay.withcherry.com"]');
    if (pq) track('prequal_click', { cta_location: pq.getAttribute('data-loc') || '' });
    var v = e.target.closest('a[data-yt]');
    if (v) {
      var id = v.getAttribute('data-yt');
      track('video_click', { video_id: id });
      /* Modified clicks (new tab) and browsers without <dialog> keep the plain link. */
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button || !window.HTMLDialogElement) return;
      e.preventDefault();
      openVideo(id, v.getAttribute('aria-label'), v);
    }
  });

  /* ===== Thank-you page: greet by first name ===== */
  var ty = document.getElementById('ty-title');
  if (ty) {
    try {
      var lead = JSON.parse(sessionStorage.getItem('aox_lead') || 'null');
      if (lead && lead.first_name) ty.textContent = text(ty).replace(/\.$/, '') + ', ' + lead.first_name + '.';
    } catch (e) {}
  }
})();
