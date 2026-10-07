/* ==========================================================================
   PINS THAT FIT — the ad pages only (body.is-lp). BugHerd #29/#31/#32, 2026-10-07:
   "the sticky animation cuts the actual content, at least on larger screens".

   1. Re-measure when the page grows. The GHL form in the hero arrives at its
      reserved height and grows ~100px after ScrollTrigger has measured the page,
      so every pin below started ~100px late and sat that far down the screen,
      its foot cut. A height change of the page now refreshes ScrollTrigger.
   2. A pinned chapter that is still taller than the screen (a 768px laptop, say)
      is not pinned at all: its trigger is removed, its animation set to the end
      state, and the section gets .is-flow (css/60-lp.css) so it scrolls by
      normally with everything visible. Nothing is ever held off-screen.
   ========================================================================== */
(function(){
  if (!document.body || !document.body.classList.contains('is-lp')) return;
  var PANELS = ['.cp-pin', '.sp-pin', '.rl-pin'];
  var lastH = 0, busy = false, t;

  function ready(){ return window.ScrollTrigger && window.gsap && ScrollTrigger.getAll().some(function(s){ return s.pin; }); }
  function triggersFor(panel){ return ScrollTrigger.getAll().filter(function(s){ return s.pin === panel; }); }

  function flow(panel){
    var sec = panel.closest('section');
    if (!sec || sec.classList.contains('is-flow')) return false;
    triggersFor(panel).forEach(function(st){
      var anim = st.animation;
      /* rail: the card parallax rides the rail tween; drop it first */
      if (anim) ScrollTrigger.getAll().forEach(function(s){ if (s.vars && s.vars.containerAnimation === anim) s.kill(); });
      st.kill(true);
      if (anim) anim.kill();
    });
    sec.classList.add('is-flow');
    if (sec.classList.contains('b-compare')) {
      var cols = sec.querySelectorAll('.cp-col');
      gsap.set(cols, { clearProps: 'opacity,transform,scale' });
      gsap.set(sec.querySelectorAll('.cp-col li'), { clearProps: 'opacity,transform' });
      cols.forEach(function(c){ c.classList.add('is-lit'); });
      var tr = sec.querySelector('.cp-track i'); if (tr) tr.style.transform = 'scaleX(1)';
    }
    if (sec.classList.contains('b-steps')) {
      gsap.set(sec.querySelectorAll('.sp-step'), { clearProps: 'all' });
      var list = sec.querySelector('.sp-list'); if (list) list.style.minHeight = '';
    }
    if (sec.classList.contains('b-rail')) {
      var track = sec.querySelector('.rl-track'), bar = sec.querySelector('.rl-progress b'), count = sec.querySelector('.rl-count'), n = sec.querySelectorAll('.rl-card').length;
      gsap.set(track, { clearProps: 'transform' });
      track.addEventListener('scroll', function(){
        var p = track.scrollLeft / (track.scrollWidth - track.clientWidth || 1);
        if (bar) bar.style.transform = 'scaleX(' + p + ')';
        if (count) count.textContent = String(Math.min(n, Math.round(p * (n - 1)) + 1)).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
      }, { passive: true });
    }
    return true;
  }

  function check(){
    var changed = false;
    PANELS.forEach(function(sel){
      document.querySelectorAll(sel).forEach(function(panel){
        if (!triggersFor(panel).length) return;
        /* the content's foot, not the panel's bottom padding, has to be on screen */
        var need = panel.offsetHeight - (parseFloat(getComputedStyle(panel).paddingBottom) || 0);
        if (need > window.innerHeight + 1) changed = flow(panel) || changed;
      });
    });
    return changed;
  }

  function refresh(){
    if (busy) return;
    busy = true;
    ScrollTrigger.refresh();
    if (check()) ScrollTrigger.refresh();
    lastH = document.documentElement.scrollHeight;
    var c = document.getElementById('smooth-content'); if (c) lastH = c.offsetHeight;
    busy = false;
  }

  function start(){
    if (!ready()) { setTimeout(start, 250); return; }
    refresh();
    var content = document.getElementById('smooth-content') || document.body;
    if (window.ResizeObserver) new ResizeObserver(function(){
      var h = content.offsetHeight;
      if (Math.abs(h - lastH) < 3 || busy) return;
      clearTimeout(t); t = setTimeout(refresh, 250);
    }).observe(content);
    window.addEventListener('resize', function(){ clearTimeout(t); t = setTimeout(refresh, 300); });
  }
  if (document.readyState === 'complete') start(); else window.addEventListener('load', start);
})();
