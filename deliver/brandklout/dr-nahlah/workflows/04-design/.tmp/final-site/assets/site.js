/* ===== js/00-runtime.js ===== */
/* ==========================================================================
   THE RUNTIME
   Every section's behaviour lives in its own file under site-src/sections/ and
   registers itself here by name. A section only runs if its markup is on the
   page, so moving `<section class="ch-arrival">` to a different page carries
   its behaviour with it and leaving it off costs nothing — which is the whole
   reason the JS is split per section rather than per page.

   Registration queues; it does not run. ScrollSmoother is created first and the
   queue is flushed afterwards (js/90-boot.js), so every ScrollTrigger measures
   against the final smoothed layout. Without that ordering, triggers registered
   mid-parse measure a half-built page.
   ========================================================================== */
window.WZ = (function(){
  var q = [], flushed = false;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ok = !!(window.gsap && window.ScrollTrigger);

  /* NOTE: plugins are deliberately NOT registered here. Registering
     ScrollTrigger before document.body exists leaves its internals
     half-initialised, and ScrollSmoother then dies on `getScrollFunc` with
     "Cannot read properties of undefined". js/90-boot.js does the registration
     instead, and this whole file ships at the end of <body> for the same
     reason. */

  /* The registry. `modules` records what each section guards on, so a gate can
     check the property that matters — a module runs exactly when its markup is
     on the page, and never otherwise — rather than assuming it. */
  var registered = [], active = [], modules = [];

  /* Split into masked lines, with graceful degradation if SplitText is absent. */
  /* Pass `build` when the lines carry a tween: it runs on the first split and
     again on every re-split, and whatever it returns is killed before the next
     one so tweens never point at dead nodes. Omit it for one-shot entrances —
     the lines still re-flow, they just do not re-animate. */
  function splitLines(el, build){
    if(!window.SplitText) return null;
    try{
      var opts = {type:'lines', mask:'lines', linesClass:'wz-line', autoSplit:true};
      if(build) opts.onSplit = function(self){ return build(self); };
      return (SplitText.create ? SplitText.create(el,opts) : new SplitText(el,opts));
    }catch(e){
      try{ return new SplitText(el,{type:'lines',linesClass:'wz-line'}); }catch(e2){ return null; }
    }
  }
  function splitWords(el){
    if(!window.SplitText) return null;
    try{
      var opts = {type:'words', wordsClass:'wz-word'};
      return (SplitText.create ? SplitText.create(el,opts) : new SplitText(el,opts));
    }catch(e){ return null; }
  }

  return {
    reduced: reduced,
    ok: ok,
    smoother: null,
    splitLines: splitLines,
    splitWords: splitWords,
    registered: registered,
    active: active,
    modules: modules,

    /* WZ.section(name[, selector], fn)
       `name` identifies the module; `selector` is what has to be on the page for
       it to run, defaulting to `.<name>`. Pass a selector when the section's own
       class is not unique enough to guard on — the gallery filter guards on
       `#gaGrid`, because its section carries the generic `.pk` class that every
       interior page uses. */
    section: function(name, selector, fn){
      if (typeof selector === 'function') { fn = selector; selector = '.' + name; }
      registered.push(name); modules.push({name: name, selector: selector, mode: 'queued'});
      if (!document.querySelector(selector)) return;
      active.push(name);
      this.add(fn);
    },

    /* Same registration, but runs straight away instead of queueing.
       For behaviour that is plain DOM work and must survive GSAP being absent:
       the queue is only flushed once ScrollSmoother has been created, and when
       GSAP fails to load the boot sequence reveals the content and returns
       without flushing — so a queued click handler would never be attached. */
    dom: function(name, selector, fn){
      if (typeof selector === 'function') { fn = selector; selector = '.' + name; }
      registered.push(name); modules.push({name: name, selector: selector, mode: 'immediate'});
      if (!document.querySelector(selector)) return;
      active.push(name);
      this.run(fn);
    },

    add: function(fn){ flushed ? this.run(fn) : q.push(fn); },
    run: function(fn){ try{ fn(this); }catch(e){ console.error('[WZ section]', e); } },
    flush: function(){
      flushed = true;
      var self = this;
      q.forEach(function(fn){ self.run(fn); });
      q.length = 0;
    }
  };
})();

/* ===== js/20-pagekit.js ===== */
WZ.add(function (W) {
  var kit = document.body;
  if (!W.reduced) kit.classList.add('wz-kit');

  /* Before/after sliders work with or without GSAP — they are content, not motion. */
  document.querySelectorAll('.pk-ba').forEach(function (ba) {
    var range = ba.querySelector('input[type=range]');
    /* Instatic maps every <input> onto its own form-control module, which only
       knows type="text": the three comparison sliders arrive as text boxes
       showing "50", with the aria-label dropped. Coerce the one input this
       component owns back to a range before wiring it, so the slider works on
       any host that rewrites input types. No-op where it arrived intact. */
    if (!range) {
      var alt = ba.querySelector('input');
      if (alt && alt.getAttribute('max') === '100') {
        alt.type = 'range';
        if (!alt.getAttribute('aria-label')) alt.setAttribute('aria-label', 'Reveal the after photograph');
        range = alt;
      }
    }
    if (!range) return;
    var paint = function () { ba.style.setProperty('--pos', range.value + '%'); };
    range.addEventListener('input', paint);
    paint();
  });

  if (W.reduced) return;

  /* One reveal rule for the whole kit: anything tagged data-rv rises into place
     when it crosses 86% of the viewport. data-rv="stagger" walks its children. */
  gsap.utils.toArray('[data-rv]').forEach(function (el) {
    // A nested data-rv is animated twice — once as its parent's stagger child
    // and once in its own right — and the two `from` tweens fight over opacity,
    // which can strand it invisible. The outer reveal already covers it.
    if (el.parentElement && el.parentElement.closest('[data-rv]')) return;
    var mode = el.getAttribute('data-rv');
    var targets = mode === 'stagger' ? el.children : el;
    gsap.set(el, { opacity: 1 });
    gsap.from(targets, {
      opacity: 0, y: 30, duration: .95, ease: 'power3.out',
      stagger: mode === 'stagger' ? .09 : 0,
      scrollTrigger: { trigger: el, start: 'top 86%' }
    });
  });

  /* Masked line reveal for anything asking for it. */
  gsap.utils.toArray('[data-split]').forEach(function (el) {
    W.splitLines(el, function (self) {
      return gsap.from(self.lines, {
        yPercent: 108, duration: 1.05, stagger: .08, ease: 'power4.out',
        scrollTrigger: { trigger: el, start: 'top 88%' }
      });
    });
  });

  /* Photos drift against the scroll so a static page still feels alive. */
  gsap.utils.toArray('[data-drift]').forEach(function (img) {
    gsap.fromTo(img, { yPercent: -6, scale: 1.12 }, {
      yPercent: 6, scale: 1.12, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: .8 }
    });
  });

  /* Counters. Reduced motion prints the final value immediately (above). */
  gsap.utils.toArray('.pk-stats [data-count]').forEach(function (el) {
    var target = parseFloat(el.getAttribute('data-count')),
        dec = parseInt(el.getAttribute('data-decimals') || '0', 10),
        suffix = el.getAttribute('data-suffix') || '',
        obj = { v: 0 };
    gsap.to(obj, {
      v: target, duration: 1.9, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 90%' },
      onUpdate: function () {
        el.textContent = obj.v.toLocaleString('en-US',
          { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
      }
    });
  });
});
/* Reduced motion never runs the counter tween, so paint the finals up front. */
(function () {
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.pk-stats [data-count]').forEach(function (el) {
    var dec = parseInt(el.getAttribute('data-decimals') || '0', 10);
    el.textContent = parseFloat(el.getAttribute('data-count'))
      .toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec })
      + (el.getAttribute('data-suffix') || '');
  });
})();

/* ===== sections/blog-filter.js ===== */
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

/* ===== sections/blog-post.js ===== */
/* =============================================================================
   SECTION: blog-post                                        BugHerd pin #7
   Registered against `.bl-post`, so it costs nothing on the other 34 pages.

   The template can only place furniture AROUND the article. On Instatic the
   whole entry — h1, date and body — renders through a single `base.outlet`, and
   nothing in the template can reach inside it. Everything in this file is a
   consequence of that:

   1. TITLE AND DATE. They belong in the hero now (the client's reference puts
      them over the photograph). The hero binds `{currentEntry.title}` itself,
      but there is no date FIELD to bind — `publishedAt` is the import
      timestamp, identical on all 43 rows — so the only true date is the one
      written into the article body, and it is MOVED from there into the hero.
      The body's own h1 is removed rather than hidden: two h1s in one document,
      one of them display:none, is a worse page than one.

   2. CONTENTS. Built from the headings the article actually has. Articles with
      fewer than three H2s get none: a two-item table of contents is furniture,
      not navigation. It is ONE node with two homes — in the flow below 1280,
      in the left rail above it — never a copy in each.

   3. FAQ. Only from headings that are QUESTIONS, so an article whose sections
      are statements gets no accordion. Each row carries the OPENING of that
      section and a link into it, not the section again; the full answers go out
      as FAQPage JSON-LD, which is what an FAQ block is for.

   4. RELATED. The related strip is a `base.loop` over the posts table, and the
      loop has no "not equal" filter — the article being read can appear in its
      own related list. It is removed here by comparing hrefs. The strip asks
      for four and shows three, so removing one never leaves a short row.

   Plain DOM via WZ.dom: none of the above depends on GSAP, and an article must
   keep its contents list even if the animation runtime failed to load. The
   rails are a separate module below, because they do depend on it.
   ============================================================================= */
WZ.dom('blog-post', '.bl-post', function () {
  var post = document.querySelector('.bl-post');
  var body = post && post.querySelector('.bl-body');
  if (!body) return;

  var hero = document.querySelector('.pg-hero.bl-ph');
  /* The region the outlet renders into. Everything the entry brought with it is
     inside this one element, not spread across .bl-body. */
  var region = body.firstElementChild && body.firstElementChild.children.length
    ? body.firstElementChild
    : body;

  /* ---- title and date, into the hero ------------------------------------- */
  /* Only when there IS a hero to move them to. On a template that predates the
     hero this leaves the article exactly as it was rather than beheading it. */
  if (hero) {
    var when = region.querySelector('.bl-when');
    var slot = hero.querySelector('.bl-ph-when');
    if (when && slot) slot.textContent = (when.textContent || '').trim();
    if (when) when.remove();
    var h1 = region.querySelector('h1');
    if (h1) h1.remove();
  }

  /* ---- contents ---------------------------------------------------------- */
  var heads = [].slice.call(region.querySelectorAll('h2'));
  var nav = null;
  var marker = null;

  heads.forEach(function (head, i) {
    /* The body is authored HTML and carries no ids. Derive one from the
       heading text so a shared link survives a re-render, and fall back to
       the index if two headings slugify the same. */
    if (!head.id) {
      var slug = (head.textContent || '')
        .toLowerCase().replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60);
      head.id = slug && !document.getElementById(slug) ? slug : 'section-' + (i + 1);
    }
  });

  if (heads.length >= 3) {
    nav = document.createElement('nav');
    nav.className = 'bl-toc';
    nav.setAttribute('aria-labelledby', 'blTocTitle');

    var h = document.createElement('b');
    h.id = 'blTocTitle';
    h.textContent = 'Contents';
    nav.appendChild(h);

    var list = document.createElement('ol');
    heads.forEach(function (head) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + head.id;
      a.textContent = head.textContent;
      li.appendChild(a);
      list.appendChild(li);
    });
    nav.appendChild(list);

    /* Immediately before the FIRST HEADING, which is after the lede when there
       is one and at the very top when there is not — several of the 43 open
       straight into an h2. Anchoring to the first paragraph instead buried the
       list inside section one on those. The marker holds the spot, so moving
       the list out to the rail and back is exact. */
    marker = document.createComment('bl-toc');
    region.insertBefore(marker, heads[0]);
    marker.parentNode.insertBefore(nav, marker);

    /* ScrollSmoother owns the scroll position, so a raw hash jump lands in the
       wrong place. Route these the way js/90-boot.js routes every other anchor. */
    nav.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var t = document.getElementById(a.getAttribute('href').slice(1));
      if (!t) return;
      e.preventDefault();
      var W = window.WZ;
      if (W && W.smoother) W.smoother.scrollTo(t, true, 'top 96px');
      else t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    /* ---- one list, two homes ---------------------------------------------
       In the rail the list is a column of its own; in the flow it is a bordered
       block after the lede. Same node either way — a copy in each would drift
       the moment one of them gained a state. */
    var railL = document.querySelector('.bl-rail-l');
    var wide = window.matchMedia('(min-width: 1280px)');
    var place = function () {
      if (!railL) return;
      if (wide.matches) {
        if (nav.parentNode !== railL) railL.appendChild(nav);
      } else if (marker.parentNode && nav.parentNode !== marker.parentNode) {
        marker.parentNode.insertBefore(nav, marker);
      }
    };
    place();
    wide.addEventListener('change', function () {
      place();
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });

    /* Which heading the reader is inside. One callback per crossing rather than
       per frame — the same reason Chapter 05's card reveal is an observer. The
       band is the top third of the window, so "here" is the heading the reader
       has most recently passed rather than whichever is merely on screen. */
    if (window.IntersectionObserver) {
      var lis = [].slice.call(list.children);
      var visible = {};
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { visible[en.target.id] = en.isIntersecting; });
        var idx = -1;
        for (var i = 0; i < heads.length; i++) { if (visible[heads[i].id]) { idx = i; break; } }
        if (idx < 0) return;
        lis.forEach(function (li, i) { li.classList.toggle('is-here', i === idx); });
      }, { rootMargin: '-96px 0px -68% 0px' });
      heads.forEach(function (head) { io.observe(head); });
    }
  }

  /* ---- the FAQ ----------------------------------------------------------- */
  var questions = heads.filter(function (h) { return /\?\s*$/.test((h.textContent || '').trim()); });
  if (questions.length >= 3) {
    var faq = document.createElement('section');
    faq.className = 'bl-faq';
    var faqTitle = document.createElement('b');
    faqTitle.textContent = 'Common questions';
    faq.appendChild(faqTitle);

    var acc = document.createElement('div');
    acc.className = 'pk-faq';
    faq.appendChild(acc);

    var schema = [];
    questions.forEach(function (head) {
      /* Everything between this heading and the next one IS the answer. */
      var paras = [];
      var n = head.nextElementSibling;
      while (n && n.tagName !== 'H2') {
        if (/^(P|UL|OL)$/.test(n.tagName)) paras.push(n);
        n = n.nextElementSibling;
      }
      if (!paras.length) return;

      var d = document.createElement('details');
      var s = document.createElement('summary');
      s.textContent = (head.textContent || '').trim();
      d.appendChild(s);

      var fb = document.createElement('div');
      fb.className = 'fa-body';
      var p = document.createElement('p');
      p.textContent = (paras[0].textContent || '').trim();
      fb.appendChild(p);

      var more = document.createElement('a');
      more.className = 'pk-more';
      more.href = '#' + head.id;
      more.textContent = paras.length > 1 ? 'Read the full answer' : 'Read it in context';
      fb.appendChild(more);
      d.appendChild(fb);
      acc.appendChild(d);

      schema.push({
        '@type': 'Question',
        name: s.textContent,
        acceptedAnswer: {
          '@type': 'Answer',
          text: paras.map(function (el) { return (el.textContent || '').trim(); }).join(' ')
        }
      });
    });

    if (acc.children.length >= 3) {
      var cta = post.querySelector('.bl-cta');
      if (cta && cta.parentNode) cta.parentNode.insertBefore(faq, cta);
      else (document.querySelector('.bl-main') || post).appendChild(faq);

      /* The anchors have to travel through the smoother like every other one. */
      acc.addEventListener('click', function (e) {
        var a = e.target.closest('a[href^="#"]');
        if (!a) return;
        var t = document.getElementById(a.getAttribute('href').slice(1));
        if (!t) return;
        e.preventDefault();
        var W = window.WZ;
        if (W && W.smoother) W.smoother.scrollTo(t, true, 'top 96px');
        else t.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      var ld = document.createElement('script');
      ld.type = 'application/ld+json';
      ld.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: schema
      });
      document.head.appendChild(ld);
    }
  }

  /* ---- related ----------------------------------------------------------- */
  var strip = document.querySelector('.bl-related');
  if (!strip) return;
  var here = location.pathname.replace(/\/$/, '');
  var cards = [].slice.call(strip.querySelectorAll('.bl-rel-card'));
  var shown = 0;
  cards.forEach(function (card) {
    var link = card.querySelector('a[href]');
    var href = link ? link.getAttribute('href').replace(/\/$/, '') : '';
    if (href === here || shown >= 3) { card.remove(); return; }
    /* A row with no featured image would otherwise show an empty grey plate. */
    var fig = card.querySelector('.bl-rel-fig');
    var img = fig && fig.querySelector('img');
    if (fig && (!img || !img.getAttribute('src'))) fig.remove();
    shown++;
  });
  if (!shown) strip.remove();
});

/* =============================================================================
   SECTION: blog-rails — the two columns that stay put
   `position: sticky` CANNOT work on this site. ScrollSmoother puts the whole
   page inside `#smooth-wrapper{position:fixed;overflow:hidden}` and translates
   the content, so nothing has a scrolling ancestor to stick to: the existing
   `.pk-lede .lc-head` sticky rule has been inert on the live site for as long
   as the smoother has been on. Measured on /sedation-dentistry — 400px of
   scroll moved the "sticky" heading the full 400px.

   So the rails are PINNED with ScrollTrigger instead, and only where they are a
   third column at all. `pinSpacing: false` because the pin must not add height:
   the rail is shorter than the article by definition, and a spacer would push
   the related strip down by the length of the pin.

   Registered with WZ.section rather than WZ.dom so it runs AFTER the smoother
   exists and measures the settled layout.
   ============================================================================= */
WZ.section('blog-rails', '.bl-post', function (W) {
  if (W.reduced || !window.ScrollTrigger || !window.gsap) return;
  var main = document.querySelector('.bl-main');
  if (!main) return;

  var TOP = 120;          /* clear of the nav, which is 96px plus its progress bar */
  var mm = gsap.matchMedia();

  /* ONLY THE CONTENTS RAIL IS PINNED. The trust rail is three cards and runs
     about 1,100px — taller than the window on any laptop — so pinning it would
     hold its own foot off the screen for the length of the article. It sits at
     the top of the piece and scrolls away, which is what the reference does
     with the same stack; the consult block at the end of the article is what
     carries the CTA the rest of the way down. */
  mm.add('(min-width: 1280px)', function () {
    var rail = document.querySelector('.bl-rail-l');
    if (!rail || !rail.firstElementChild) return;
    /* Still guarded: a 20-heading contents list on a short window would hide
       its own tail. Then it simply scrolls, and the layout is unchanged. */
    if (rail.offsetHeight > window.innerHeight - TOP - 24) return;
    var t = ScrollTrigger.create({
      trigger: rail,
      start: 'top ' + TOP + 'px',
      end: function () {
        return '+=' + Math.max(0, main.offsetHeight - rail.offsetHeight - 24);
      },
      pin: true,
      pinSpacing: false,
      invalidateOnRefresh: true,
      /* Declared even though this is the page's only pin: the home page lost a
         whole chapter to leaving pin ordering implicit. */
      refreshPriority: -1
    });
    return function () { t.kill(); };
  });
});

/* ===== sections/ch-arrival.js ===== */
/* =============================================================================
   SECTION: ch-arrival
   Registered against .ch-arrival; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-arrival", function (W) {
  var root = document.getElementById('arrival');
  var reveal = root.querySelectorAll('[data-anim="hide"]');
  /* Resolved by CLASS with an id fallback, and every use guarded. Instatic's
     HTML importer maps <video> onto its own Video module, which has no
     htmlAttributes escape hatch, so the `id` is dropped on import: the film
     came through fine but `getElementById` returned null and the first
     onEnter threw, taking the rest of the chapter's ScrollTriggers with it.
     A class is data the importer keeps, so this survives the trip. */
  var film = root.querySelector('.ar-film') || document.getElementById('heroFilm');
  gsap.set(reveal,{visibility:'visible'});

  /* Reduced motion keeps the poster frame — a looping background film is
     exactly the kind of motion that setting asks us to stop. */
  if(W.reduced){ gsap.set(reveal,{opacity:1,y:0}); return; }

  /* Plays only while the chapter is on screen: no background decode, and no
     battery burned on a video nobody is looking at. */
  ScrollTrigger.create({
    trigger:root, start:'top bottom', end:'bottom top',
    onEnter:    function(){ if(!film) return; var p=film.play(); if(p&&p.catch) p.catch(function(){}); },
    onEnterBack:function(){ if(!film) return; var p=film.play(); if(p&&p.catch) p.catch(function(){}); },
    onLeave:    function(){ if(film) film.pause(); },
    onLeaveBack:function(){ if(film) film.pause(); }
  });

  /* Entrance — headline splits into masked lines and rises. */
  var tl = gsap.timeline({delay:.15});
  var split = W.splitLines(document.getElementById('heroTitle'));
  if(split && split.lines && split.lines.length){
    gsap.set(split.lines,{yPercent:110});
    tl.to(split.lines,{yPercent:0,duration:1.15,stagger:.09,ease:'power4.out'},0);
  }else{
    tl.from('#heroTitle',{opacity:0,y:40,duration:1,ease:'power3.out'},0);
  }
  tl.from(root.querySelector('.chapter-tag'),{opacity:0,x:-24,duration:.9,ease:'power3.out'},.05)
    .from('#heroLead',       {opacity:0,y:26,duration:.9,ease:'power3.out'},.55)
    .from(root.querySelector('.ar-actions'),{opacity:0,y:26,duration:.9,ease:'power3.out'},.68)
    .from(root.querySelectorAll('.ar-meta div'),{opacity:0,y:22,duration:.8,stagger:.08,ease:'power3.out'},.78)
    .from(root.querySelector('.ar-cue'),{opacity:0,duration:.8},.9)
    .from(film||'#heroFilm',{opacity:0,scale:1.09,duration:1.7,ease:'power3.out'},0);

  /* Departure — the chapter recedes as you leave it. */
  gsap.timeline({scrollTrigger:{trigger:root,start:'top top',end:'bottom top',scrub:.6}})
    .to(root.querySelector('.ar-in'),{yPercent:-16,opacity:.15,ease:'none'},0)
    .to(film||'#heroFilm',{yPercent:5,scale:1.1,ease:'none'},0)
    .to('#heroVeil',{opacity:.55,ease:'none'},0);

  /* Scroll cue nudges until the visitor moves. */
  gsap.to(root.querySelector('.ar-cue i'),{scaleY:.3,transformOrigin:'top',duration:1.1,
    repeat:-1,yoyo:true,ease:'power1.inOut'});
});

/* ===== sections/ch-difference.js ===== */
/* =============================================================================
   SECTION: ch-difference
   Registered against .ch-difference; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-difference", function (W) {
  var root = document.getElementById('difference');

  /* Counters */
  root.querySelectorAll('[data-count]').forEach(function(el){
    var target = parseFloat(el.getAttribute('data-count')),
        dec    = parseInt(el.getAttribute('data-decimals')||'0',10),
        suf    = el.getAttribute('data-suffix')||'';
    function paint(v){
      el.textContent = (dec ? v.toFixed(dec) : Math.floor(v).toLocaleString('en-US')) + suf;
    }
    if(W.reduced){ paint(target); return; }
    var o = {v:0};
    gsap.to(o,{v:target,duration:1.9,ease:'power2.out',onUpdate:function(){ paint(o.v); },
      scrollTrigger:{trigger:el,start:'top 88%'}});
  });

  if(W.reduced) return;

  gsap.fromTo(root.querySelectorAll('.df-stat'),
    {opacity:0,y:26},
    {opacity:1,y:0,duration:.9,stagger:.1,ease:'power3.out',
     scrollTrigger:{trigger:'#diffStats',start:'top 85%'}});

  /* Marquee: loops continuously, and scroll velocity bends its speed and
     direction — the page feels physically connected to the wheel. */
  var row = document.getElementById('mqRow');
  row.innerHTML += row.innerHTML;                       // seamless loop needs a duplicate
  var half = row.scrollWidth / 2;
  var loop = gsap.to(row,{x:-half,duration:26,ease:'none',repeat:-1,
    modifiers:{x:function(x){ return (parseFloat(x) % half) + 'px'; }}});

  var vt = gsap.quickTo(loop,'timeScale',{duration:.5,ease:'power2'});
  ScrollTrigger.create({
    onUpdate:function(self){
      var v = self.getVelocity()/380;
      vt(gsap.utils.clamp(-7, 7, v === 0 ? 1 : (v < 0 ? Math.min(-1,v) : Math.max(1,v))));
    }
  });
  /* Settle back to a gentle drift when scrolling stops. */
  ScrollTrigger.addEventListener('scrollEnd', function(){ vt(1); });

  /* Comparison table: header first, then rows deal in from the left. */
  gsap.from('#versus .vs-head > *',{opacity:0,y:24,duration:.9,stagger:.12,ease:'power3.out',
    scrollTrigger:{trigger:'#versus',start:'top 78%'}});
  gsap.from('#versus .vs-row',{opacity:0,x:-34,duration:.85,stagger:.1,ease:'power3.out',
    scrollTrigger:{trigger:'#versus .vs-table',start:'top 82%'}});
});

/* ===== sections/ch-invitation.js ===== */
/* =============================================================================
   SECTION: ch-invitation
   Registered against .ch-invitation; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-invitation", function (W) {
  if(W.reduced) return;
  /* The bespoke `#locs .iv-loc` stagger that used to sit here is gone with the
     markup it animated. On 2026-08-24 the standalone locations strip was folded
     into the CTA band as `.cta-offices`, which carries `data-rv="stagger"` and
     is therefore revealed by the kit like every other staggered block. Leaving
     the old call in place would not have thrown — it would simply have matched
     nothing, which is the kind of dead animation nobody notices for months. */
  W.splitLines(document.getElementById('ctaTitle'), function(self){
    return gsap.from(self.lines,{yPercent:110,duration:1,stagger:.09,ease:'power4.out',
      scrollTrigger:{trigger:'#ctaTitle',start:'top 85%'}});
  });
});

/* ===== sections/ch-path.js ===== */
/* =============================================================================
   SECTION: ch-path
   Registered against .ch-path; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-path", function (W) {
  var pin   = document.getElementById('pathPin'),
      track = document.getElementById('pathTrack'),
      bar   = document.getElementById('pathBar'),
      sec   = document.querySelector('.ch-path');

  if(W.reduced){
    /* Fall back to a normal horizontal scroll region. */
    pin.style.height = 'auto';
    track.style.overflowX = 'auto';
    track.style.width = '100%';
    return;
  }

  /* Horizontal travel = track width beyond the viewport. Recomputed on
     refresh so it stays correct across resize and font loading. */
  function distance(){ return Math.max(0, track.scrollWidth - window.innerWidth + 40); }

  /* On a wide enough monitor all four cards are on screen at once and there is
     nothing to travel. Pinning anyway held the section still for 0.6 of a
     viewport height -- about 1300px of dead scroll on a 4K display -- while the
     reader stared at a row that never moved. So above that width the chapter is
     an ordinary static row, and the cards reveal instead of scrubbing.
     The threshold is measured, not a breakpoint: it is simply whether the track
     overflows, which depends on the card clamp and the gutter as much as on the
     viewport. Rebuilt on resize because a window can cross it either way. */
  var built = null;

  function buildStatic(){
    sec.classList.add('is-static');
    gsap.set(track,{x:0});
    gsap.set(bar,{scaleX:0});
    gsap.utils.toArray('#pathTrack .pa-card').forEach(function(card,i){
      gsap.from(card,{opacity:0,y:30,duration:.9,ease:'power3.out',delay:i*.07,
        scrollTrigger:{trigger:pin,start:'top 72%'}});
    });
  }

  function buildPinned(){
    sec.classList.remove('is-static');
    var tween = gsap.to(track,{
      x: function(){ return -distance(); },
      ease:'none',
      scrollTrigger:{
        trigger: pin,
        start:'top top',
        end: function(){ return '+=' + (distance() + window.innerHeight*0.6); },
        pin: true,
        scrub: .3,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        /* Refreshes AFTER Chapter 04 (refreshPriority 1), so this measures
           against a document that already includes that pin's spacer. */
        refreshPriority: 0,
        onUpdate: function(self){ gsap.set(bar,{scaleX:self.progress}); }
      }
    });

  /* Each card brightens its border as it reaches centre stage.

     The grayscale half of this only runs where the CSS applies grayscale in
     the first place, i.e. a fine pointer -- see 35-ch-path.css. Tweening
     `filter` is a main-thread PAINT animation, and on a phone it was repainting
     four images on every frame of the scrub. Nothing to un-grey on touch, so
     there is nothing to tween. */
  /* Runs on touch too now — see the note in css/35-ch-path.css. */
  var grey = function(card, on){
    gsap.to(card.querySelector('.pa-shot img'),{filter:'grayscale('+(on?1:0)+')',duration:.6});
  };
  gsap.utils.toArray('#pathTrack .pa-card').forEach(function(card){
    ScrollTrigger.create({
      trigger: card,
      containerAnimation: tween,
      start: 'left 72%',
      end: 'right 28%',
      onEnter:      function(){ gsap.to(card,{borderColor:'rgba(138,126,78,.55)',duration:.5}); grey(card,false); },
      onLeave:      function(){ gsap.to(card,{borderColor:'rgba(20,20,22,.13)',duration:.5}); },
      onEnterBack:  function(){ gsap.to(card,{borderColor:'rgba(138,126,78,.55)',duration:.5}); },
      onLeaveBack:  function(){ gsap.to(card,{borderColor:'rgba(20,20,22,.13)',duration:.5}); grey(card,true); }
    });
    gsap.fromTo(card.querySelector('.pa-no'),{opacity:.35},{opacity:1,duration:.4,
      scrollTrigger:{trigger:card,containerAnimation:tween,start:'left 78%',toggleActions:'play none none reverse'}});
    });
  }

  /* THE MOBILE PATH — a native swipe, not a scrubbed pin.

     Pinning this chapter and driving the track's `x` from scroll costs a phone
     the entire section: measured at p50 33.3ms with 67% of frames over 32ms on
     a 6x-throttled CPU, i.e. a sustained 30fps, while the unpinned chapters on
     the same page sat at 16.7ms. The work is compositor-side and inherent to
     the effect -- 1.3s of Layerize and 1367 raster tasks in an 11s trace --
     so it does not optimise away: gating the grayscale filter, the one clearly
     wasteful paint in here, moved it 67.3% -> 61.5% and left p50 untouched.

     Scroll-snap hands the same left-to-right reading to the compositor. No pin,
     no scrub, no per-frame JS at all, and the momentum is the platform's own,
     which is why it feels better than anything this file could animate.

     Touch is the condition, not width: a narrow desktop window has the CPU and
     the mouse wheel for the pinned version, and a large tablet has neither. */
  var TOUCH = window.matchMedia('(hover:none) and (pointer:coarse)').matches;

  function buildSwipe(){
    sec.classList.add('is-swipe');
    gsap.set(track,{x:0});
    gsap.set(bar,{scaleX:0});
    /* The bar still reports position, driven by the scroller rather than by a
       tween -- a passive scroll listener, not a rAF loop. */
    var onScroll = function(){
      var max = track.scrollWidth - track.clientWidth;
      gsap.set(bar,{scaleX: max > 0 ? track.scrollLeft / max : 0});
    };
    track.addEventListener('scroll', onScroll, {passive:true});
    onScroll();

    /* THE CARD REVEAL, restored for touch.

       The pinned build lights each card as it reaches centre stage -- gold
       border, the number up from 35%, the photo out of grayscale -- and all of
       it hangs off `containerAnimation`, which only exists when there IS a
       scrubbed tween. Dropping the pin dropped the animation with it, and the
       chapter went flat on phones while Webflow (still pinned there) kept it.

       An IntersectionObserver gives the same cue without the scrub. The root is
       the TRACK, the horizontal rootMargin narrows the trigger zone to the
       middle ~30% of it, and the class it toggles is animated by CSS
       transitions -- so this costs one callback per card per crossing instead
       of JS on every frame. That is the whole point: the swipe path exists
       because per-frame work on a phone is what caused the flicker, so the
       reveal must not reintroduce any.

       No fallback needed: IntersectionObserver predates every browser that can
       run ScrollSmoother, but guard anyway so an exotic engine degrades to
       "all cards lit" rather than none. */
    var cards = track.querySelectorAll('.pa-card');
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < cards.length; i++) cards[i].classList.add('is-live');
      return;
    }
    var io = new IntersectionObserver(function(entries){
      for (var i = 0; i < entries.length; i++) {
        entries[i].target.classList.toggle('is-live', entries[i].isIntersecting);
      }
    }, { root: track, rootMargin: '0px -35% 0px -35%', threshold: 0 });
    for (var c = 0; c < cards.length; c++) io.observe(cards[c]);
    /* gsap.context() reverts this build on resize; disconnect with it. */
    return function(){ io.disconnect(); };
  }

  function build(){
    if (built) built.revert();
    sec.classList.remove('is-swipe');
    /* Pinned on touch as well — the client's ask, and what Webflow does. The
       flicker that sent phones to `buildSwipe` came from ScrollSmoother forcing
       `pinType:'transform'`; the smoother is desktop-only now and the pin is
       native `position:fixed`. */
    built = gsap.context(distance() > 0 ? buildPinned : buildStatic);
  }
  build();

  /* A touch device never crosses back into the pinned build, and rebuilding on
     every address-bar show/hide is exactly the churn the swipe path exists to
     avoid -- so the resize watcher is desktop-only. */
  if (!TOUCH) {
    var t;
    window.addEventListener('resize', function(){
      clearTimeout(t);
      t = setTimeout(function(){
        var wants = distance() > 0;
        if (wants !== !sec.classList.contains('is-static')) build();
      }, 250);
    });
  }
});

/* ===== sections/ch-proof.js ===== */
/* =============================================================================
   SECTION: ch-proof
   Registered against .ch-proof; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-proof", function (W) {
  /* Resolved by CLASS with an id fallback, and every use guarded. Instatic's
     HTML importer maps <video> onto its own Video module, which has no
     htmlAttributes escape hatch, so the `id` is dropped on import: the film
     came through fine but `getElementById` returned null and the first
     onEnter threw, taking the rest of the chapter's ScrollTriggers with it.
     A class is data the importer keeps, so this survives the trip. */
  var film = document.querySelector('.pf-film video') || document.getElementById('film');

  /* Play only while on screen — saves battery and avoids background decode. */
  ScrollTrigger.create({
    trigger:'#proofFilm', start:'top 90%', end:'bottom 10%',
    onEnter:    function(){ if(!film) return; var p=film.play(); if(p&&p.catch) p.catch(function(){}); },
    onEnterBack:function(){ if(!film) return; var p=film.play(); if(p&&p.catch) p.catch(function(){}); },
    onLeave:    function(){ if(film) film.pause(); },
    onLeaveBack:function(){ if(film) film.pause(); }
  });

  if(W.reduced){ gsap.set('#storyShot',{clipPath:'inset(0 0 0% 0)'}); return; }

  if(film) gsap.fromTo(film,{scale:1.18},{scale:1.04,ease:'none',
    scrollTrigger:{trigger:'#proofFilm',start:'top bottom',end:'bottom top',scrub:.8}});

  W.splitLines(document.getElementById('filmTitle'), function(self){
    return gsap.from(self.lines,{yPercent:110,duration:1,stagger:.09,ease:'power4.out',
      scrollTrigger:{trigger:'#proofFilm',start:'top 55%'}});
  });
  gsap.from('#filmSub',{opacity:0,y:20,duration:.9,ease:'power3.out',
    scrollTrigger:{trigger:'#proofFilm',start:'top 50%'}});

  /* Image wipes open from the bottom, photo counter-drifts inside it. */
  gsap.to('#storyShot',{clipPath:'inset(0 0 0% 0)',duration:1.3,ease:'power4.inOut',
    scrollTrigger:{trigger:'#storyShot',start:'top 82%'}});
  gsap.fromTo('#storyImg',{scale:1.24,yPercent:-6},{scale:1.06,yPercent:6,ease:'none',
    scrollTrigger:{trigger:'#storyShot',start:'top bottom',end:'bottom top',scrub:.8}});
  gsap.from('#storyCopy > *',{opacity:0,y:26,duration:.9,stagger:.12,ease:'power3.out',
    scrollTrigger:{trigger:'#storyCopy',start:'top 80%'}});

  /* Reviews: header, then cards deal in on a slight diagonal. */
  gsap.from('#reviews .rv-head > *',{opacity:0,y:24,duration:.9,stagger:.12,ease:'power3.out',
    scrollTrigger:{trigger:'#reviews',start:'top 80%'}});
  /* The review wall is generated markup as of 2026-08-19, so it gets the kit's
     own stagger back. [data-rv="stagger"] on .rv-wall drives it; nothing needed
     here beyond letting that rule find it. */

  /* --- upgrade the cards to the LIVE feed, where the host permits it ---
     The client wants reviews that update the moment a patient leaves one, and
     the vendor's iframe does exactly that. It cannot run everywhere: Instatic
     publishes behind `frame-src 'none'` unless an operator widens it (see
     workflows/16-instatic-plugins). Rather than pick one platform and lose on
     the other, the generated cards ship as the content and this quietly swaps
     in the live widget wherever it actually loads.

     Success is judged on the vendor's own postMessage, not on the iframe's
     load event: a blocked frame still fires load (about:blank), so trusting
     that would leave an empty well exactly where the reviews should be. If no
     height arrives, everything added here is removed and the cards stay.

     THE VENDOR'S PARENT SCRIPT IS DELIBERATELY NOT LOADED. Its only job is to
     size the iframe from `lc.setHeight`, and we already receive that message
     ourselves — probe-widget-postmessage.mjs confirms the frame reports
     `{height: 1968}` with no parent script present at all. Loading it would
     mean granting `script-src https://reputationhub.site`, which lets that
     origin run arbitrary JavaScript against this document and its storage; a
     cross-origin iframe can do neither. So the widget is live on `frame-src`
     alone, and the script origin is never granted. Do not "fix" this by
     re-adding the script tag. */
  (function () {
    var slot = document.querySelector('.rv-live');
    var wall = document.querySelector('.rv-wall');
    if (!slot || !slot.dataset.widget) return;

    var widgetId = (slot.dataset.widget.match(/[?&]widgetId=([^&]+)/) || [])[1];
    var settled = false;

    var f = document.createElement('iframe');
    f.className = 'lc_reviews_widget';
    f.title = 'Patient reviews';
    f.src = slot.dataset.widget;
    f.setAttribute('frameborder', '0');
    f.setAttribute('scrolling', 'no');
    f.style.cssText = 'min-width:100%;width:100%';
    slot.appendChild(f);

    function accept() {
      if (settled) return;
      settled = true;
      slot.removeAttribute('data-probing');
      if (wall) wall.hidden = true;      /* keep it in the DOM: it is the copy
                                            a crawler without JS will read. */
    }
    function reject() {
      if (settled) return;
      settled = true;
      slot.remove();
    }

    window.addEventListener('message', function (e) {
      /* Parse first: a malformed origin on some unrelated message must not throw
         out of the listener and take the later, real one with it. */
      var host;
      try { host = new URL(e.origin).hostname } catch (_) { return }
      if (!/reputationhub\.site$/.test(host)) return;
      var name = e.data && e.data[0], data = e.data && e.data[1];
      if (name !== 'lc.setHeight') return;
      if (widgetId && data && data.widgetId && data.widgetId !== widgetId) return;
      /* The frame keeps reporting as its content reflows, so height is applied on
         every message, not only the one that settles the swap. */
      var h = data && parseInt(data.height, 10);
      if (h > 0) f.style.height = h + 'px';
      accept();
    });

    /* The widget renders server-side and reports within a second or two on a
       normal connection. Eight is generous, and the cost of being wrong is
       only that the visitor keeps the static cards. */
    setTimeout(reject, 8000);
  })();

  /* Aggregate score counts up like the other stats. The target is READ FROM THE
     MARKUP rather than written here as well. It was hardcoded to 5.0, so when
     the client corrected the rating the counter silently animated the new number
     straight back to the old one and the page showed 5.0 whatever the HTML
     said. One number, one home. */
  var sc = document.getElementById('rvScore');
  if(sc){
    var target = parseFloat(sc.textContent);
    if(!isNaN(target)){
      var o = {v:0};
      gsap.to(o,{v:target,duration:1.6,ease:'power2.out',
        onUpdate:function(){ sc.textContent = o.v.toFixed(1); },
        scrollTrigger:{trigger:'#reviews',start:'top 78%'}});
    }
  }
});

/* ===== sections/ch-reality.js ===== */
/* =============================================================================
   SECTION: ch-reality
   Registered against .ch-reality; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-reality", function (W) {
  var root = document.getElementById('reality');
  var big  = document.getElementById('realityBig');

  if(W.reduced) return;

  /* Words brighten one by one, tied to scroll position. */
  var sp = W.splitWords(big);
  if(sp && sp.words && sp.words.length){
    /* The final clause is excluded here and owned by the gold tween below.
       Two scrubbed tweens writing the same property on the same element,
       over overlapping scroll ranges, flicker — they overwrite each other
       every frame. One word, one owner. */
    var tail = sp.words.slice(-7);
    var body = sp.words.slice(0, -7);
    gsap.to(body,{
      color:'#141416', stagger:.4, ease:'none',
      scrollTrigger:{trigger:root,start:'top 62%',end:'center 42%',scrub:.5}
    });
    gsap.to(tail,{color:'#8A7E4E',ease:'none',stagger:.3,
      scrollTrigger:{trigger:root,start:'center 52%',end:'bottom 62%',scrub:.5}});
  }

  gsap.from('#realityAfter p',{opacity:0,y:28,duration:.9,stagger:.14,ease:'power3.out',
    scrollTrigger:{trigger:'#realityAfter',start:'top 82%'}});

  /* Case photo drifts and un-crops as the chapter passes. */
  /* Scale stays above 1 + drift so the photo always overfills its frame. */
  gsap.fromTo('#realityImg',{yPercent:-6,scale:1.2},{yPercent:6,scale:1.14,ease:'none',
    scrollTrigger:{trigger:root,start:'top bottom',end:'bottom top',scrub:.8}});
});

/* ===== sections/ch-services.js ===== */
/* =============================================================================
   SECTION: ch-services                                          BugHerd pin #8
   -----------------------------------------------------------------------------
   "On desktop I want to have a hover effect with an image showing following the
   cursor and on mobile and tablet the image should be present on the card with
   no hover effect."

   ONE shared floating element that swaps what it shows per hovered card — not
   eleven absolutely-positioned images. Eleven would mean eleven layers, eleven
   more nodes in a section that is deliberately a typographic index, and eleven
   images fetched by a visitor who may never reach the chapter.

   Guarded on `#svcGrid` rather than `.ch-services` so the module travels with
   the grid and costs nothing on the 25 pages that do not carry it.
   ============================================================================= */
WZ.section('ch-services', '#svcGrid', function (W) {
  /* Reduced motion keeps the image, and drops the chase. Returning here means
     `.wz-svfollow` is never set, so the card's own image stays laid out — the
     same fallback a coarse pointer gets. That is deliberately NOT the magnetic
     buttons' behaviour (js/90-boot.js), which simply returns and loses nothing;
     here returning without the class would leave a desktop with no image at
     all. */
  if (W.reduced) return;

  /* POINTER CAPABILITY, NOT WIDTH. `.wz-fine` is set from
     `(hover:hover) and (pointer:fine)` in js/90-boot.js and is how every other
     hover on this site is gated. A narrow desktop window keeps the follower; a
     1024px tablet does not. Width would have got both of those wrong. */
  if (!document.documentElement.classList.contains('wz-fine')) return;

  var grid  = document.getElementById('svcGrid');
  var cards = [].slice.call(grid.querySelectorAll('.sv-card'));
  var shots = cards.map(function (c) { return c.querySelector('.sv-shot img'); });
  if (!shots.some(Boolean)) return;   /* markup without images: leave the cards alone */

  /* --- the element ------------------------------------------------------- */
  var el = document.createElement('div');
  el.className = 'sv-follow';
  el.setAttribute('aria-hidden', 'true');
  var img = document.createElement('img');
  img.alt = '';
  img.decoding = 'async';
  el.appendChild(img);

  /* APPENDED TO <body>, OUTSIDE #smooth-wrapper.
     ScrollSmoother translates #smooth-content, and a transformed ancestor makes
     `position:fixed` resolve against THAT element instead of the viewport — the
     plate would scroll away with the page and drift further from the cursor the
     further down you were. Same reason the nav and the drawer live out here
     (css/02-base.css, "fixed UI lives OUTSIDE the wrapper"). */
  document.body.appendChild(el);

  /* Only now: the class that takes the in-card copies out of the flow. If
     anything above returned, or GSAP never loaded and the queue was never
     flushed, this never runs and the cards keep their images. */
  document.documentElement.classList.add('wz-svfollow');

  /* --- which variant to ask for ------------------------------------------
     `base.image` publishes a `srcset` of `-w<N>.webp` variants beside the
     original. The follower is at most 320 CSS px, so the original (up to
     3000px on the smile-makeover card) is 10x more image than it can show.
     Pick the smallest variant that still covers the plate at this DPR, and
     fall back to `src` when there is no srcset — the local build has none. */
  var want = Math.round(el.getBoundingClientRect().width * (window.devicePixelRatio || 1));
  function source (im) {
    var set = im.getAttribute('srcset');
    if (!set) return im.src;
    var best = null;
    set.split(',').forEach(function (part) {
      var m = /^\s*(\S+)\s+(\d+)w\s*$/.exec(part);
      if (!m) return;
      var w = +m[2];
      if (w >= want && (!best || w < best.w)) best = { url: m[1], w: w };
    });
    return best ? best.url : im.src;
  }
  var urls = shots.map(function (im) { return im ? source(im) : null; });

  /* --- motion -------------------------------------------------------------
     quickTo, the same primitive the magnetic buttons use: one pre-built tween
     per property, re-targeted on each move. The .55s power3 is the lag — the
     plate trails the cursor rather than being pinned to it, which is the whole
     effect. A pointermove handler that called gsap.to() would build a tween per
     event instead. */
  var xTo = gsap.quickTo(el, 'x', { duration: .55, ease: 'power3' });
  var yTo = gsap.quickTo(el, 'y', { duration: .55, ease: 'power3' });
  gsap.set(el, { xPercent: -50, yPercent: -50, scale: .94 });

  var open = false;
  var token = 0;          /* invalidates a decode that finished too late */
  var warmed = false;

  /* Preload once, and only for a visitor who actually reaches Chapter 07 — the
     ScrollTrigger below fires this the moment the section enters the viewport,
     which is the earliest honest signal and is well before a cursor can travel
     to a card. `pointerenter` on the grid is the backstop for a pointer that
     arrives without a scroll (an anchor jump, a restored scroll position).

     LOW priority, because these eleven are speculative and must not compete
     with the page's real work — or with the one image `show()` is waiting on.
     That race is not theoretical: warming on grid-enter alone put all eleven in
     flight in the same event burst as the first hover, and the wanted one came
     back after the plate had given up waiting. */
  function warm () {
    if (warmed) return;
    warmed = true;
    urls.forEach(function (u) {
      if (!u) return;
      var p = new Image();
      p.fetchPriority = 'low';
      p.decoding = 'async';
      p.src = u;
    });
  }

  function place (e, jump) {
    if (jump) { xTo(e.clientX, e.clientX); yTo(e.clientY, e.clientY); }
    else { xTo(e.clientX); yTo(e.clientY); }
  }

  function show (url, e) {
    var mine = ++token;
    place(e, !open);
    /* Decode BEFORE swapping. Assigning a cold src straight onto the visible
       element blanks the plate for a frame or two on the first hover of each
       card; loading into a detached Image first means the swap is a cache hit
       and the previous picture holds until the new one is ready. */
    var pre = new Image();
    pre.fetchPriority = 'high';   /* jump the queue ahead of warm()'s eleven */
    var swap = function () {
      if (mine !== token) return;
      img.src = url;
      open = true;
      gsap.to(el, { autoAlpha: 1, scale: 1, duration: .4, ease: 'power2.out', overwrite: 'auto' });
    };
    pre.onload = swap;
    pre.src = url;
    if (pre.complete) swap();
  }

  function hide () {
    token++;
    if (!open) return;
    open = false;
    gsap.to(el, { autoAlpha: 0, scale: .94, duration: .3, ease: 'power2.in', overwrite: 'auto' });
  }

  grid.addEventListener('pointerenter', warm);
  grid.addEventListener('pointermove', function (e) { if (open) place(e); });
  grid.addEventListener('pointerleave', hide);

  cards.forEach(function (card, i) {
    if (!urls[i]) return;
    card.addEventListener('pointerenter', function (e) { show(urls[i], e); });
  });

  /* Two jobs, no scrub and no per-frame work — four callbacks at the edges.
     Entering starts the preload. Leaving closes the plate: `pointerleave` does
     fire when the smoother slides the grid out from under a stationary cursor,
     because the browser re-runs hit-testing on the transform, but the plate is
     fixed to the VIEWPORT and would be left hanging over the next chapter if it
     ever did not. */
  ScrollTrigger.create({
    trigger: '#services', start: 'top bottom', end: 'bottom top',
    onEnter: warm, onEnterBack: warm, onLeave: hide, onLeaveBack: hide
  });
});

/* ===== sections/ch-specialist.js ===== */
/* =============================================================================
   SECTION: ch-specialist
   Registered against .ch-specialist; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-specialist", function (W) {
  if(W.reduced) return;

  W.splitLines(document.getElementById('specTitle'), function(self){
    return gsap.from(self.lines,{yPercent:110,duration:1,stagger:.09,ease:'power4.out',
      scrollTrigger:{trigger:'#specTitle',start:'top 84%'}});
  });
  gsap.from('#specBio p',{opacity:0,y:26,duration:.9,stagger:.13,ease:'power3.out',
    scrollTrigger:{trigger:'#specBio',start:'top 82%'}});

  /* Credentials deal in one line at a time — the length of the list is the point. */
  gsap.from('#credList li',{opacity:0,x:-22,duration:.6,stagger:.07,ease:'power2.out',
    scrollTrigger:{trigger:'#credList',start:'top 85%'}});

  /* Portrait rises slightly out of its plate as the chapter passes.

     x:0 is load-bearing, not decoration. The CSS centres this image with
     `left:50%; transform:translateX(-50%)` (css/33-ch-specialist.css), and that
     has to stay -- the `W.reduced` return above means this tween never runs
     under prefers-reduced-motion, so CSS is the only thing centring it there.
     But GSAP reads the element's starting transform through getComputedStyle,
     which hands back a resolved MATRIX: the -50% arrives as a plain pixel
     number and is recorded as the baseline `x`. xPercent:-50 is then layered on
     top of it as a second translate, and the portrait is shifted left by half
     its width twice --

       transform: translate(-50%, 2.4%) translate3d(-237.401px, 0px, 0px)

     Whether it visibly breaks depends on whether the image has a laid-out width
     at the moment GSAP takes that snapshot, which is why it hid locally and
     showed up on the host: the local <img> carries no width/height attributes,
     so before the file decodes the box is 0px wide, -50% of 0 is 0, and the
     snapshot is harmless. Instatic's uploader rewrites the tag with
     width/height (plus srcset/sizes), the browser knows the aspect ratio at
     parse time, and the real half-width gets baked in permanently.

     Pinning x:0 tells GSAP what the baseline is instead of letting it infer one
     from the matrix, so the CSS -50% and the tween stop stacking. */
  gsap.fromTo('#specPortrait',{xPercent:-50,x:0,yPercent:6},{xPercent:-50,x:0,yPercent:-4,ease:'none',
    scrollTrigger:{trigger:'#specialist',start:'top bottom',end:'bottom top',scrub:.8}});
});

/* ===== sections/ch-standard.js ===== */
/* =============================================================================
   SECTION: ch-standard
   Registered against .ch-standard; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-standard", function (W) {
  if(W.reduced) return;

  gsap.from('#standard .std-head > *',{opacity:0,y:26,duration:.9,stagger:.12,ease:'power3.out',
    scrollTrigger:{trigger:'#standard .std-head',start:'top 82%'}});

  /* Panels rise and un-mask; each image also drifts against the scroll. */
  gsap.utils.toArray('#stdGrid .std-card').forEach(function(card,i){
    gsap.fromTo(card,
      {opacity:0,y:44,clipPath:'inset(12% 0 0 0)'},
      {opacity:1,y:0,clipPath:'inset(0% 0 0 0)',duration:1.05,ease:'power3.out',delay:i*.07,
       scrollTrigger:{trigger:card,start:'top 88%'}});
    gsap.fromTo(card.querySelector('img'),{yPercent:-5},{yPercent:5,ease:'none',
      scrollTrigger:{trigger:card,start:'top bottom',end:'bottom top',scrub:.8}});
  });
});

/* ===== sections/ch-transformation.js ===== */
/* =============================================================================
   SECTION: ch-transformation
   Registered against .ch-transformation; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
WZ.section("ch-transformation", function (W) {
  var root  = document.getElementById('transformation'),
      pin   = document.getElementById('tPin'),
      cmp   = document.getElementById('cmp'),
      cap   = document.getElementById('tCaption'),
      dots  = document.getElementById('tDots').children,
      slides= cmp.querySelectorAll('.tf-slide'),
      handle= document.getElementById('tHandle');

  var CAPTIONS = [
    'Porcelain veneers with implant restoration · upper and lower arch',
    'Double-arch All-on-4 · full fixed teeth on four implants per arch',
    'Single-arch All-on-4 · upper arch restored on four implants'
  ];

  function show(i){
    for(var s=0;s<slides.length;s++) slides[s].classList.toggle('is-on', s===i);
    for(var d=0;d<dots.length;d++) dots[d].classList.toggle('is-on', d===i);
    cap.innerHTML = CAPTIONS[i];
  }
  function setPos(p){ cmp.style.setProperty('--pos', p + '%'); }

  if(W.reduced){
    /* Show the finished result rather than an un-wiped "before". */
    setPos(0); show(0);
    cmp.style.setProperty('--pos','0%');
    return;
  }

  setPos(100); // start fully on "before"; scrubbing wipes toward "after"
  gsap.set(handle,{opacity:1});

  /* Pin the chapter and drive three wipes from one scroll distance.
     Each case gets a wipe, then hands over to the next. */
  var state = {p:100, idx:0};
  var tl = gsap.timeline({
    scrollTrigger:{
      trigger: pin,
      start: 'top top',
      end: '+=' + (window.innerHeight * 3.2),
      pin: true,
      scrub: .3,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      /* REFRESH ORDER MATTERS ONCE TWO SECTIONS PIN. ScrollTrigger measures in
         creation order unless told otherwise, and Chapter 05 is built before
         this one — so it measured #pathPin at its PRE-SPACER position and
         started 2,700px too early, landing inside this chapter's pinned range
         and rendering on top of it. Higher priority refreshes first, so this
         pin's spacer is in the flow before anything downstream measures. */
      refreshPriority: 1
    }
  });

  for(var i=0;i<3;i++){
    (function(idx){
      tl.call(function(){ if(state.idx!==idx){ state.idx=idx; show(idx); } }, null, tl.duration())
        .fromTo(state,{p:100},{p:0,duration:1,ease:'none',
          onUpdate:function(){ setPos(state.p); }})
        .to({},{duration:.22});   // a beat to read the result before moving on
    })(i);
  }
  /* Reverse scrolling needs the slide index restored too. */
  tl.eventCallback('onUpdate', function(){
    var seg = Math.min(2, Math.floor(tl.progress() * 3));
    if(state.idx !== seg){ state.idx = seg; show(seg); }
  });

  gsap.from(root.querySelectorAll('.tf-head > *'),{opacity:0,y:24,duration:.9,stagger:.1,
    ease:'power3.out',scrollTrigger:{trigger:root,start:'top 70%'}});
});

/* ===== sections/gallery-filter.js ===== */
/* =============================================================================
   SECTION: gallery-filter
   Registered against #gaGrid; runs only when that is on the page, so
   this file can travel with the markup between pages without being edited.
   ============================================================================= */
/* Filtering is plain DOM work — it must keep working with GSAP absent, so this
   module uses WZ.dom, which runs immediately instead of queueing. It still goes
   through WZ.section so the registry knows about it and the gates can tell
   "this section is not on the page" apart from "this section is broken". */
WZ.dom('gallery-filter', '#gaGrid', function () {
  var bar = document.getElementById('gaFilters'),
      grid = document.getElementById('gaGrid');
  if (!bar || !grid) return;
  bar.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-cat]');
    if (!btn) return;
    var cat = btn.getAttribute('data-cat');
    bar.querySelectorAll('button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b === btn));
    });
    grid.querySelectorAll('.ga-item').forEach(function (item) {
      item.hidden = !(cat === 'all' || item.getAttribute('data-cat') === cat);
    });
    /* Pinned/scrubbed triggers elsewhere on the page measured the old height. */
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  });
});

/* ===== sections/lp-steps.js ===== */
/* =============================================================================
   SECTION: lp-steps — the process rail on the ads landing pages.

   Registered against `.lp-steps`, so it runs on the three landing pages and
   nowhere else, and it travels with the markup if the section is ever moved.

   Two things happen, and neither of them reveals content:

     1. `--p` on `.lp-steps-line` scrubs 0 to 1 across the section, which fills
        the hairline above the step row.
     2. each `.lp-step` takes `is-lit` as the fill passes it, which is what
        turns its numeral from a grey outline into the brand gradient.

   The numerals, headings and copy are all legible from the first paint. The lit
   state only ever adds emphasis, so a visitor with reduced motion, with JS off
   or on a page where GSAP failed to load reads exactly the same page — it just
   does not animate. That matters more here than anywhere else on the site,
   because this is the section that explains what happens after they book.
   ============================================================================= */
WZ.section("lp-steps", function (W) {
  gsap.utils.toArray(".lp-steps").forEach(function (rail) {
    var line = rail.querySelector(".lp-steps-line");
    var steps = gsap.utils.toArray(rail.querySelectorAll(".lp-step"));
    if (!steps.length) return;

    /* Reduced motion gets the finished state, not the animation: the line full
       and every numeral lit. Painting it here rather than leaving it at zero
       means the section does not read as half-loaded. */
    if (W.reduced) {
      if (line) line.style.setProperty("--p", 1);
      steps.forEach(function (s) { s.classList.add("is-lit"); });
      return;
    }

    if (line) {
      gsap.to(line, {
        "--p": 1, ease: "none",
        /* The rail is a horizontal line on desktop and a vertical spine on a
           phone, and the phone spine is not what fills — it is a static hair.
           Scrubbing the custom property regardless is harmless there and keeps
           one trigger rather than a matchMedia branch. */
        scrollTrigger: { trigger: rail, start: "top 72%", end: "bottom 62%", scrub: .3 },
      });
    }

    steps.forEach(function (step) {
      ScrollTrigger.create({
        trigger: step, start: "top 78%",
        onEnter: function () { step.classList.add("is-lit"); },
        /* No onLeaveBack. A step that un-lights when the reader scrolls back up
           to re-read it looks like the page losing its place. */
      });
    });
  });
});

/* ===== sections/video-library.js ===== */
/* =============================================================================
   SECTION: video-library
   Registered against .vl-card, so it only runs on a page that has a film
   facade, and registered with WZ.dom rather than WZ.section: the queue is only
   flushed once ScrollSmoother exists, so if GSAP ever fails to load a QUEUED
   click handler would never attach and every film on the page would be dead.
   Playing a video is not decoration.

   Click-to-play: the card is a facade (YouTube thumbnail + play button) until
   someone asks for the film, then it is replaced in place by a real iframe with
   autoplay=1. Fourteen eager embeds would cost about a megabyte and fourteen
   third-party connections before anyone watches anything.

   BOUND ON THE DOCUMENT, NOT ON THE FIRST GRID (2026-09-18). The first version
   did `document.querySelector('.vl-grid')` and listened there, which worked on
   the video library, where there is one grid, and silently left every card
   outside that first grid dead: the ads landing pages carry a `.vl-grid` in
   the differentiators, a lone card in the closer and, on the consultation
   pages, a grid under a story row. One listener on the document covers a card
   wherever it is, with no per-grid registration to forget.

   The swap is one-way and the node is replaced, so a second click cannot stack
   two players, and there is nothing to tear down on the way out.
   ============================================================================= */
WZ.dom("vl-card", function () {
  if (!document.querySelector('.vl-card[data-yt]')) return;

  function cardOf(target) {
    var card = target && target.closest ? target.closest('.vl-card') : null;
    return card && card.getAttribute('data-yt') ? card : null;
  }

  /* role="button" is a promise to behave like one, so Enter and Space have to
     be wired by hand. A <button> would give this for free, but Instatic's
     importer flattens a button's children and the card would lose its
     thumbnail; see gen-videos.mjs. */
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    var card = cardOf(e.target);
    if (!card) return;
    e.preventDefault();
    card.click();
  });

  document.addEventListener('click', function (e) {
    var card = cardOf(e.target);
    if (!card) return;
    var id = card.getAttribute('data-yt');

    var shot = card.querySelector('.vl-shot');
    var frame = document.createElement('div');
    frame.className = 'vl-frame';
    var f = document.createElement('iframe');
    /* autoplay only because this IS the click that asked for it. */
    f.src = 'https://www.youtube.com/embed/' + id + '?autoplay=1';
    var title = card.querySelector('.vl-title');
    f.title = title ? title.textContent.trim() : 'Video';
    f.setAttribute('allow',
      'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture');
    f.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    f.setAttribute('allowfullscreen', '');
    frame.appendChild(f);

    /* Once it holds a player the card is no longer a control, so the button
       role, the tab stop and the label all come off. Leaving them strands a
       screen reader on something that announces as a button and does nothing. */
    var open = document.createElement('div');
    open.className = 'vl-card';
    open.appendChild(frame);
    if (title) open.appendChild(title);
    card.replaceWith(open);
    if (shot) shot.remove();
  });
});

/* ===== js/90-boot.js ===== */
/* ==========================================================================
   FLUSH — smoother first, then every section's queued setup, then refresh.
   ========================================================================== */
(function(){
  var W = window.WZ;
  document.documentElement.classList.add('wz-ready');

  /* Pointer capability as a class, so CSS can branch on it without a media
     query. Instatic stores a non-viewport media query as a custom condition
     ordered by raw array position, which is a cascade trap; a class is not.
     Set before flush() so a section's setup sees it. */
  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.documentElement.classList.add('wz-fine');
  }

  if(!W || !W.ok){
    /* GSAP missing: reveal everything so the page is still readable. */
    document.querySelectorAll('[data-anim="hide"]').forEach(function(el){ el.style.visibility='visible'; });
    return;
  }

  /* Register here, not in <head> — body must exist before ScrollTrigger inits. */
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);
  if(window.ScrollSmoother) gsap.registerPlugin(ScrollSmoother);
  if(window.SplitText)      gsap.registerPlugin(SplitText);
  if(window.Observer)       gsap.registerPlugin(Observer);

  /* THE SMOOTHER IS DESKTOP-ONLY, and this is the mobile flicker fix.

     ScrollTrigger has two ways to pin. With NO smoother it uses native
     `position:fixed` and the browser holds the chapter still for free. With a
     smoother present it switches to `pinType:'transform'`, because fixed
     positioning cannot be trusted inside a smoothed container -- and then the
     pinned element's `translateY` has to be rewritten from JS on every single
     scroll update. Measured on the two live builds at the same scroll depth,
     mid-pin:

       Webflow  (no smoother)  #tPin  position:fixed   transform: identity
       Instatic (smoother on)  #tPin  position:static  transform: translateY(1350.5px)

     On a phone that per-frame write lands late whenever the main thread is
     busy, and the pinned chapter drifts against the finger. That is what the
     client has been reporting as flicker on Chapters 04 and 05.

     The Webflow build is smooth by accident, not by configuration: its
     `#smooth-wrapper` never survived the conversion, so `create()` is skipped
     and the page scrolls natively. `smoothTouch:false` does NOT get us there --
     it only disables the EASING on touch; the smoother is still instantiated,
     and its mere existence is what flips the pin strategy.

     Touch is the condition, not width -- same reasoning as sections/ch-path.js.
     A narrow desktop window keeps the smoother; a large tablet does not. */
  var TOUCH = window.matchMedia('(hover:none) and (pointer:coarse)').matches;

  if(!W.reduced && !TOUCH && window.ScrollSmoother && document.getElementById('smooth-wrapper')){
    try{
      W.smoother = ScrollSmoother.create({
        wrapper:'#smooth-wrapper', content:'#smooth-content',
        /* THE DIAL FOR "how smooth does the page feel". Higher = longer glide
           after the wheel stops, which is the effect itself:
             .8 -> the page eases for ~750ms
            1.2 -> ~1050ms  (here)
            1.4 -> ~2400ms, which starts to feel like the page is arguing
           This is only half the story. Every scrubbed trigger adds a SECOND
           lag on top, and it is that one — not this one — that reads as
           broken: at smooth 1.05 with scrub .7 the pinned chapters trailed
           the page by ~1.4s. With the pins at scrub .3 they now trail it by
           roughly 0ms, so the glide can be generous without the animation
           appearing to lag behind the scroll. Raise this, not the scrubs. */
        smooth: 1.2, effects: false, smoothTouch: false,
        /* normalizeScroll is deliberately OFF. It was tried: it makes no
           measurable difference to the pinned scrubs (257ms vs 273ms to
           settle) and it swallows touchmove, so on a phone a before/after
           slider jumps to the tap point instead of following the finger.
           Handing those elements back with `ignore` fixes the drag and
           then traps the page: a vertical swipe starting on a slider
           scrolls 0px instead of 535px. Not worth it. */
        normalizeScroll: false, ignoreMobileResize: true
      });
      /* `#smooth-wrapper{overflow:hidden}` is scoped to this class. Without a
         smoother the wrapper must NOT clip, or the page cannot scroll at all —
         which is exactly what happened when this was A/B tested by stubbing the
         plugin alone: two runs travelled 0px and reported a flattering 16.7ms
         for a stationary page. Set only on success, never optimistically. */
      document.documentElement.classList.add('wz-smooth');
    }catch(e){ console.warn('ScrollSmoother unavailable', e); }
  }

  W.flush();

  /* --- nav state: reading progress + chapter readout (global UI) --- */
  var navCh  = document.getElementById('navCh'),
      navNm  = document.getElementById('navName'),
      navBar = document.getElementById('navBar'),
      navPr  = document.getElementById('navProgress'),
      nav    = document.getElementById('nav');

  /* Whole-page reading progress along the top edge of the nav. */
  gsap.to(navPr,{scaleX:1,ease:'none',
    scrollTrigger:{start:0,end:'max',scrub:.25}});

  var CHAPTERS = gsap.utils.toArray('section[data-chapter]');
  var LAST = CHAPTERS.reduce(function(m, s){
    return Math.max(m, parseInt(s.getAttribute('data-chapter'), 10) || 0);
  }, 1);
  CHAPTERS.forEach(function(sec){
    var i = parseInt(sec.getAttribute('data-chapter'),10),
        name = sec.getAttribute('data-chapter-name');
    function activate(){
      if(navCh) navCh.textContent = String(i).padStart(2,'0');
      if(navNm) navNm.textContent = name;
      /* Divisor is the LAST chapter index, not a constant: Chapter 07 (The
         Services) was added on 2026-08-26 and Proof/Invitation shifted to 08
         and 09, so a hardcoded 8 would have driven the nav progress bar past
         100% on the final two sections. Derived so the next insertion cannot
         reintroduce the bug. */
      if(navBar) navBar.style.setProperty('--p', (i/LAST).toFixed(3));
    }
    ScrollTrigger.create({trigger:sec,start:'top 55%',end:'bottom 45%',
      onEnter:activate,onEnterBack:activate});
  });

  ScrollTrigger.create({start:40,end:99999,
    onToggle:function(self){ nav.classList.toggle('is-solid', self.isActive); }});

  /* --- anchors routed through the smoother so pinned sections land right --- */
  document.querySelectorAll('a[href^="#"]').forEach(function(a){
    a.addEventListener('click', function(e){
      var id = a.getAttribute('href');
      if(id.length < 2) return;
      var t = document.querySelector(id);
      if(!t) return;
      e.preventDefault();
      if(W.smoother) W.smoother.scrollTo(t, true, 'top top');
      else gsap.to(window,{duration: W.reduced?0:1, scrollTo:{y:t,autoKill:true},ease:'power2.inOut'});
    });
  });

  /* --- magnetic buttons, pointer-fine only --- */
  if(!W.reduced && window.matchMedia('(hover:hover) and (pointer:fine)').matches){
    document.querySelectorAll('.magnetic').forEach(function(el){
      var xTo = gsap.quickTo(el,'x',{duration:.5,ease:'power3'}),
          yTo = gsap.quickTo(el,'y',{duration:.5,ease:'power3'});
      el.addEventListener('pointermove',function(e){
        var r = el.getBoundingClientRect();
        xTo((e.clientX-r.left-r.width/2)*.22); yTo((e.clientY-r.top-r.height/2)*.38);
      });
      el.addEventListener('pointerleave',function(){ xTo(0); yTo(0); });
    });
  }

  /* --- re-hydrate what HTML importers strip ---
     Instatic's importer drops elements it considers empty and unwraps the only
     child of anything it maps onto a Button or Link module. Two live casualties:
     the burger's two <span> bars (so the menu button rendered as a blank 44px
     square on every page) and the <span> inside every .btn (which carries
     `position:relative;z-index:1`, i.e. the label's guarantee of sitting above
     the hover fill). Both are structure the CSS needs and neither survives a
     round trip, so they are rebuilt here rather than hand-patched per platform.
     A no-op wherever the markup arrived intact. */
  document.querySelectorAll('.burger').forEach(function(b){
    if(b.querySelector('span')) return;
    b.appendChild(document.createElement('span'));
    b.appendChild(document.createElement('span'));
  });
  document.querySelectorAll('.btn').forEach(function(b){
    if(b.querySelector('span') || !b.firstChild) return;
    var t = b.textContent.trim();
    if(!t) return;
    var sp = document.createElement('span'); sp.textContent = t;
    b.textContent = ''; b.appendChild(sp);
  });
  /* The filter chips read "All cases 54"; the count is a <b> so it can sit back
     at 78% opacity. Buttons are flattened to plain text on import, so the
     trailing digits are split back out here. */
  document.querySelectorAll('.ga-filters button').forEach(function(btn){
    if(btn.querySelector('b')) return;
    var m = /^(.*?)(\d+)$/.exec(btn.textContent.trim());
    if(!m) return;
    btn.textContent = m[1].trim();
    var b = document.createElement('b'); b.textContent = m[2];
    btn.appendChild(b);
  });

  /* --- mobile drawer --- */
  /* Both halves have to be present. The Instatic post template shipped with a
     .burger and no #drawer, so `drawer.querySelectorAll` threw on all 43 blog
     posts -- taking the Escape handler and both ScrollTrigger.refresh() calls
     below it down with it, on top of a menu button that did nothing. Skip the
     block instead, and leave the rest of boot to run. */
  var burger = document.getElementById('burger'), drawer = document.getElementById('drawer');
  if (!burger || !drawer) { if (burger) burger.hidden = true; return finishBoot(); }
  function closeDrawer(){
    burger.classList.remove('is-open'); drawer.classList.remove('is-open');
    document.getElementById('nav').classList.remove('is-menu-open');
    burger.setAttribute('aria-expanded','false'); drawer.setAttribute('aria-hidden','true');
    document.body.classList.remove('is-locked');
    if(W.smoother) W.smoother.paused(false);
  }
  burger.addEventListener('click',function(){
    var open = drawer.classList.toggle('is-open');
    burger.classList.toggle('is-open',open);
    document.getElementById('nav').classList.toggle('is-menu-open',open);
    burger.setAttribute('aria-expanded',String(open));
    drawer.setAttribute('aria-hidden',String(!open));
    burger.setAttribute('aria-label', open?'Close menu':'Open menu');
    document.body.classList.toggle('is-locked',open);
    if(W.smoother) W.smoother.paused(open);
  });
  drawer.querySelectorAll('a').forEach(function(a){
    a.addEventListener('click',function(){ closeDrawer(); });
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape' && drawer.classList.contains('is-open')) closeDrawer();
  });

  finishBoot();

  /* Pinned sections measure wrong if fonts or images land late. This is a
     declaration, so it is hoisted and reachable from the early return above. */
  function finishBoot(){
    if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ ScrollTrigger.refresh(); });
    window.addEventListener('load', function(){ ScrollTrigger.refresh(); });
  }
})();

/* ===== js/91-descender-rescue.js ===== */
/* ==========================================================================
   DESCENDER RESCUE
   SplitText(mask:'lines') sizes every line mask to the line box. Playfair
   Display paints about 1.34em of ink against this design's 1.02 line-height,
   so g/p/y/j stay clipped long after the reveal has finished — measured at
   ~8px on 52px type and ~21px on the 132px hero. The mask is only needed
   while a line is travelling, so the clip is dropped once the line lands.

   Polled rather than hooked to the tween: SplitText autoSplit rebuilds the
   masks on every resize, and the rebuilt ones come back clipped.

   TWO class names, deliberately. SplitText builds each mask by cloning the
   line and suffixing every class it carries with `-mask`, so the mask's name
   is whatever `linesClass` is plus `-mask`. The live Webflow build splits with
   `wz-mask-line` and gets `wz-mask-line-mask`; this package's runtime splits
   with `wz-line` (js/00-runtime.js) and gets `wz-line-mask`. This swept only
   for the Webflow name, so on every page built from this package it matched
   nothing and never ran — which is why the descenders were still clipped
   after the fix was written. Matching both is what stops the two vocabularies
   drifting apart again.

   Kept as its own block so it converts to a single Webflow footer script; it
   is registered there as `wzDescenderRescue`.
   ========================================================================== */
(function () {
  var EPS = 0.6;
  function ty(el) {
    var t = getComputedStyle(el).transform;
    if (!t || t === 'none') return 0;
    var m = t.match(/matrix\(([^)]+)\)/);
    if (m) return parseFloat(m[1].split(',')[5]) || 0;
    var m3 = t.match(/matrix3d\(([^)]+)\)/);
    if (m3) return parseFloat(m3[1].split(',')[13]) || 0;
    return 0;
  }
  function sweep() {
    var masks = document.querySelectorAll('.wz-line-mask,.wz-mask-line-mask');
    for (var i = 0; i < masks.length; i++) {
      var line = masks[i].firstElementChild;
      if (!line) continue;
      masks[i].style.overflow = Math.abs(ty(line)) < EPS ? 'visible' : 'clip';
    }
  }
  /* The poll used to run every 200ms for the life of the page. There are 8
     masks, `ty()` calls getComputedStyle on each and the loop then writes
     `style.overflow` back, so that was a forced style recalc five times a
     second, for ever, on every page -- 336ms of TimerFire in an 11s mobile
     trace, all of it after the lines had long since landed.

     A line only needs sweeping while it is TRAVELLING, so the poll now stops
     once nothing has moved for three consecutive passes and re-arms on the two
     events that can put a clipped mask back on the page: `load`, and the
     resize that makes SplitText autoSplit rebuild them. Same behaviour, no
     standing timer. */
  var timer = null, idle = 0;

  function pass() {
    var masks = document.querySelectorAll('.wz-line-mask,.wz-mask-line-mask');
    var moving = 0;
    for (var i = 0; i < masks.length; i++) {
      var line = masks[i].firstElementChild;
      if (!line) continue;
      var clipped = Math.abs(ty(line)) >= EPS;
      if (clipped) moving++;
      masks[i].style.overflow = clipped ? 'clip' : 'visible';
    }
    if (moving) idle = 0;
    else if (++idle >= 3) stop();
  }
  function start() { if (!timer) { idle = 0; timer = setInterval(pass, 200); } }
  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  pass();
  start();
  window.addEventListener('load', function () { pass(); start(); });
  var rt;
  window.addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(start, 120);   // autoSplit rebuilds masks clipped
  });
})();
