/* ==========================================================================
   FILMS ON THE PAGE — a patient film plays in a lightbox, on Vimeo, without
   leaving the page (review 2026-10-06: "YouTube videos open on another tab;
   play on the same tab, better in Vimeo"). Brandklout's rule: every video on
   every site is on the agency's Vimeo, with a description that links back to
   the website.

   Any link to a film in FILMS (a YouTube watch URL, or its Vimeo URL) opens
   the player. Instatic cannot publish a Vimeo <iframe> (non-YouTube iframes
   become empty divs), so the player is built here at click time. That needs a
   page whose CSP lets Vimeo frame in: a page without an embed gets
   `frame-src 'none'` and the link simply opens Vimeo in a new tab instead.
   ========================================================================== */
(function(){
  /* YouTube id -> Vimeo id (+ the private hash when a clip is unlisted). Agency team account,
     folder "West LA Implants" (vimeo.com/user/248712727/folder/30817251), public, uploaded 2026-10-07. */
  var FILMS = {
    'nH1ST1jo8WQ': { v: '1233866645', h: '' },
    '4skcfz94ZS4': { v: '1233866646', h: '' },
    'SDVe8k_zQUE': { v: '1233866644', h: '' }
  };
  var byVimeo = {};
  Object.keys(FILMS).forEach(function(k){ byVimeo[FILMS[k].v] = FILMS[k]; });

  function filmFor(a){
    var href = a.getAttribute('href') || '';
    var yt = href.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
    if(yt && FILMS[yt[1]]) return FILMS[yt[1]];
    var vm = href.match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if(vm && byVimeo[vm[1]]) return byVimeo[vm[1]];
    return null;
  }
  function frameAllowed(){
    var m = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if(!m) return true;
    var fs = ((m.getAttribute('content') || '').match(/frame-src([^;]*)/) || [])[1];
    if(fs === undefined) return true;
    return /\shttps:(\s|$)|player\.vimeo\.com/.test(fs);
  }
  var vimeoPage = function(f){ return 'https://vimeo.com/' + f.v + (f.h ? '/' + f.h : ''); };

  /* every film link points at Vimeo, so a new tab (no player) also lands there */
  function retarget(){
    document.querySelectorAll('a[href]').forEach(function(a){
      var f = filmFor(a);
      if(!f || f.v.charAt(0) === '_') return;
      a.setAttribute('href', vimeoPage(f));
      var label = a.getAttribute('aria-label');
      if(label) a.setAttribute('aria-label', label.replace(/ on YouTube$/, ''));
    });
  }

  var box, frame, lastFocus;
  function build(){
    box = document.createElement('div');
    box.className = 'wz-film';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Patient film');
    box.innerHTML = '<div class="wz-film-veil"></div><div class="wz-film-stage"><button type="button" class="wz-film-close" aria-label="Close the film">&times;</button><div class="wz-film-frame"></div></div>';
    document.body.appendChild(box);
    frame = box.querySelector('.wz-film-frame');
    box.querySelector('.wz-film-close').addEventListener('click', close);
    box.querySelector('.wz-film-veil').addEventListener('click', close);
  }
  function open(f, title){
    if(!box) build();
    lastFocus = document.activeElement;
    var src = 'https://player.vimeo.com/video/' + f.v + '?autoplay=1&title=0&byline=0&portrait=0&dnt=1' + (f.h ? '&h=' + f.h : '');
    frame.innerHTML = '<iframe src="' + src + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="' + (title || 'Patient film').replace(/"/g, '&quot;') + '"></iframe>';
    box.classList.add('is-open');
    document.documentElement.classList.add('wz-film-open');
    if(window.WZ && WZ.smoother) WZ.smoother.paused(true);
    box.querySelector('.wz-film-close').focus();
  }
  function close(){
    if(!box || !box.classList.contains('is-open')) return;
    box.classList.remove('is-open');
    document.documentElement.classList.remove('wz-film-open');
    frame.innerHTML = '';
    if(window.WZ && WZ.smoother) WZ.smoother.paused(false);
    if(lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape') close(); });
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href]');
    if(!a || e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return;
    var f = filmFor(a);
    if(!f || f.v.charAt(0) === '_') return;
    if(!frameAllowed()) return; /* the link opens Vimeo in a new tab */
    e.preventDefault();
    open(f, a.getAttribute('aria-label') || a.textContent.trim());
  }, true);
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', retarget); else retarget();
})();
