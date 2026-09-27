/* =============================================================================
   SECTION: blog-filter                                          BugHerd pin #10
   Search + topic filter over the /posts index.

   Registered against #blFilter rather than a class: the section around it
   carries the generic `.pk .pk-alt` every interior page uses, so guarding on
   that would run this on 27 pages that have no grid. Same reasoning as
   gallery-filter's #gaGrid guard.

   WZ.dom, not WZ.section. The queue is only flushed once ScrollSmoother has
   been created, and when GSAP fails to load the boot sequence reveals the
   content and returns WITHOUT flushing — so a queued listener would never be
   attached and the search box would be dead furniture on exactly the visits
   where the page is already degraded. Filtering is plain DOM work; it must
   survive GSAP being absent.

   THE TOPIC IS DATA, NOT A GUESS. Each card renders `<p class="bl-topic">` from
   its row's `topic` cell (see push-posts-filter.mjs). Nothing here re-derives a
   topic from a title — this file has no taxonomy in it at all, and the <option>
   list is pruned against what the cards actually carry, so adding a thirteenth
   topic to post-image-pool.mjs and re-running the push is the whole change.
   ============================================================================= */
WZ.dom('blog-filter', '#blFilter', function () {
  var bar = document.getElementById('blFilter'),
      grid = document.querySelector('#articles .bl-grid'),
      input = document.getElementById('blSearch'),
      select = document.getElementById('blTopic'),
      count = document.getElementById('blCount'),
      empty = document.getElementById('blEmpty'),
      clear = document.getElementById('blClear');
  if (!bar || !grid || !input || !select || !count) return;

  /* Fold case, strip diacritics, and reduce every run of punctuation to one
     space. Without this, "all-on-4" does not match "All-on-4 " and a search for
     "implant's" matches nothing. Hyphens become spaces on BOTH sides, so
     "all on 4" and "all-on-4" are the same query. */
  function norm (s) {
    var v = String(s == null ? '' : s).toLowerCase();
    /* Guarded: String.prototype.normalize is absent on older Android WebViews,
       and a filter that throws is worse than one that does not fold accents. */
    if (v.normalize) v = v.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return v.replace(/[^a-z0-9]+/g, ' ').replace(/^ +| +$/g, '');
  }
  /* The URL form of a topic. By construction slugify(label) === the taxonomy id
     in post-image-pool.mjs, which is what makes `?topic=implants` work with no
     lookup table on this side. push-posts-filter.mjs asserts that for all
     twelve and refuses to run if a label is ever edited into one that breaks it. */
  function slugify (s) { return norm(s).replace(/ /g, '-'); }

  /* ---- index the cards ONCE -------------------------------------------- */
  /* 43 cards x (title + excerpt) is a few kilobytes of string. Building it per
     keystroke would still be fast, but building it once means a keystroke is a
     substring test and nothing else. */
  var cards = [].slice.call(grid.querySelectorAll('.bl-card')).map(function (el) {
    var h = el.querySelector('h2'),
        p = el.querySelector('p'),
        t = el.querySelector('.bl-topic');
    return {
      el: el,
      topic: t ? slugify(t.textContent) : '',
      /* Title AND excerpt. Title-only search feels broken on this archive:
         "dental implants" is in almost every one of the 43 headlines, so it
         would return everything while a real question returns nothing. The
         topic word is in the haystack too, so typing "sedation" finds the
         sedation pieces even when the word is absent from the copy. */
      hay: norm((h ? h.textContent : '') + ' ' +
                (p ? p.textContent : '') + ' ' +
                (t ? t.textContent : ''))
    };
  });
  var total = cards.length;

  /* ---- prune the topic list to what is actually on the page ------------- */
  /* The <option> list is published from the full taxonomy. A topic no article
     has been classified under is a dead end, so it goes — rather than leaving
     the reader a choice that always returns the empty state. */
  var present = {};
  cards.forEach(function (c) { if (c.topic) present[c.topic] = (present[c.topic] || 0) + 1; });
  [].slice.call(select.options).forEach(function (o) {
    if (o.value && !present[o.value]) o.remove();
  });

  /* ---- apply ------------------------------------------------------------ */
  function apply (fromUser) {
    var q = norm(input.value),
        terms = q ? q.split(' ') : [],
        topic = select.value,
        shown = [];

    cards.forEach(function (c) {
      /* Every term must appear somewhere in the card — AND, not OR. On an
         archive this uniform, OR returns all 43 for any two-word query. */
      var hit = (!topic || c.topic === topic) && terms.every(function (t) {
        return c.hay.indexOf(t) !== -1;
      });
      if (hit) shown.push(c.el);
      c.el.hidden = !hit;
    });

    var narrowed = shown.length < total;
    /* Only while the filter is actually narrowing — see .bl-grid[data-bl-active]
       in 62-blog.css. Typing a character that still matches all 43 must not
       reflow the grid under the reader. */
    if (narrowed) grid.setAttribute('data-bl-active', ''); else grid.removeAttribute('data-bl-active');
    grid.hidden = shown.length === 0;
    if (empty) empty.hidden = shown.length !== 0;

    count.textContent = shown.length === 0
      ? 'No articles match'
      : narrowed
        ? shown.length + ' of ' + total + ' articles'
        : total + ' articles';

    /* Anything the reader has just asked to see must be VISIBLE, not waiting on
       a scroll trigger that was measured against the old layout.
       `.wz-kit [data-rv]{opacity:0}` plus a per-card `gsap.from` means a card
       below the fold has never been revealed; filtered up into view it would be
       a blank cell. Kill the tween (which kills the ScrollTrigger it created)
       and clear the inline transform.

       Deliberately NOT done on the initial unfiltered pass — a normal visit
       still gets the entrance animation. The deep-linked case is handled before
       this ever runs; see `unreveal` at the bottom of this file. */
    if (fromUser && window.gsap) {
      shown.forEach(function (el) {
        gsap.killTweensOf(el);
        gsap.set(el, { clearProps: 'transform' });
        gsap.set(el, { opacity: 1 });
      });
    }

    /* The page just got shorter or taller. ScrollSmoother caches the content
       height, so without this the reader can be scrolled past the new end of
       the document and every pinned trigger on the page is measuring stale
       numbers. */
    if (window.ScrollTrigger) ScrollTrigger.refresh();

    if (fromUser) writeUrl(input.value, topic);
  }

  /* ---- the URL ---------------------------------------------------------- */
  /* replaceState, not pushState: a filter is not a navigation, and 43 history
     entries from 43 keystrokes would trap the reader's back button on the page. */
  function writeUrl (q, topic) {
    if (!window.history || !history.replaceState) return;
    var u;
    try { u = new URL(window.location.href); } catch (e) { return; }
    if (q) u.searchParams.set('q', q); else u.searchParams.delete('q');
    if (topic) u.searchParams.set('topic', topic); else u.searchParams.delete('topic');
    history.replaceState(null, '', u.pathname + (u.search ? u.search : '') + u.hash);
  }

  function readUrl () {
    var p;
    try { p = new URL(window.location.href).searchParams; } catch (e) { return; }
    var q = p.get('q'), topic = p.get('topic');
    if (q) input.value = q;
    /* Only honour a topic the <select> still offers — a stale or hand-typed
       `?topic=` must not leave the control showing "All topics" while the grid
       shows nothing. */
    if (topic && [].some.call(select.options, function (o) { return o.value === topic; })) {
      select.value = topic;
    }
  }

  /* ---- wire up ---------------------------------------------------------- */
  input.addEventListener('input', function () { apply(true); });
  select.addEventListener('change', function () { apply(true); });
  input.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' && e.keyCode !== 27) return;
    if (!input.value) return;
    input.value = '';
    apply(true);
  });
  if (clear) clear.addEventListener('click', function () {
    input.value = '';
    select.value = '';
    apply(true);
    input.focus();
  });

  /* ---- the deep-linked load ---------------------------------------------
     Ordering, and it is the whole reason this is not just `gsap.set(...)` in
     `apply`: this module runs IMMEDIATELY (WZ.dom), while the `[data-rv]`
     reveal in js/20-pagekit.js is QUEUED and does not register until
     js/90-boot.js flushes it after ScrollSmoother exists. So anything we set
     here is overwritten a moment later by pagekit's own
     `gsap.from(el,{opacity:0, scrollTrigger:…})`, and the reader who followed
     `/posts?topic=…` lands on a screen of blank cells — measured, in Chrome,
     before this was written.

     `gsap.utils.toArray('[data-rv]')` is what pagekit reads. Taking the
     attribute off the cards BEFORE the flush means they are never registered
     at all, and `.wz-kit [data-rv]{opacity:0}` stops matching them, so they
     paint at full opacity with no tween to fight. The rest of the page keeps
     its reveals; only the archive gives its up, and only on a visit that
     arrived pre-filtered — where an entrance animation for results you
     explicitly asked for is wrong anyway. */
  function unreveal () {
    cards.forEach(function (c) { c.el.removeAttribute('data-rv'); });
  }

  readUrl();
  if (input.value || select.value) unreveal();
  apply(false);
});
