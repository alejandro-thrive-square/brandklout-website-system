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
