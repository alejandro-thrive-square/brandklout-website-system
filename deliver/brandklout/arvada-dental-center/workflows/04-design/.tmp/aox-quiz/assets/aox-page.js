/* aox-page.js: loaded on all three pages (landing, consult, thank-you).
   Click tracking for phone, video and prequalify links; the patient video
   lightbox; and the thank-you page's first-name greeting. The quiz itself
   lives in aox-quiz.js. */
(function(){
  'use strict';

  var PREQUAL_URL = 'https://pay.withcherry.com/arvada-dental-center--implants';
  window.dataLayer = window.dataLayer || [];
  function track(event, data){
    try { var o = { event: event }; if (data) for (var k in data) o[k] = data[k]; window.dataLayer.push(o); } catch (e) {}
  }

  /* ===== Patient video lightbox =====
     A face tile is a plain link to YouTube, so it still works with scripts
     off. With scripts on, the video opens over the page and the visitor
     stays. No player exists until a tile is clicked. */
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

  document.addEventListener('click', function(e){
    if (!e.target.closest) return;
    var a = e.target.closest('a[href^="tel:"]');
    if (a) track('phone_click', { cta_location: a.getAttribute('data-loc') || '' });
    var pq = e.target.closest('a[href="' + PREQUAL_URL + '"]');
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

  /* ===== Thank-you page =====
     The quiz leaves the first name in sessionStorage, never in the URL, so no
     personal detail reaches analytics or the browser history. */
  var ty = document.getElementById('ty-title');
  if (ty) {
    try {
      var lead = JSON.parse(sessionStorage.getItem('aox_lead') || 'null');
      if (lead && lead.first_name) ty.textContent = 'Request received, ' + lead.first_name + '.';
    } catch (e) {}
  }
})();
