(() => {
const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => io.observe(el));

    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', e => {
        const t = document.querySelector(a.getAttribute('href'));
        if (t) { e.preventDefault(); window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' }); }
      });
    });

    // Airtable-backed portfolio content
    const portfolioFeatured = document.getElementById('portfolio-featured');
    const portfolioFeaturedTags = document.getElementById('portfolio-featured-tags');
    const portfolioGroups = document.getElementById('portfolio-groups');

    const escapeHtml = (value = '') => String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    const titleHtml = (project) => {
      const name = escapeHtml(project.name);
      const subtitle = escapeHtml(project.subtitle);
      return subtitle ? `${name} &mdash;<br><em>${subtitle}</em>` : name;
    };

    const paragraphHtml = (description = '') => String(description)
      .split(/<br\s*\/?>\s*<br\s*\/?>|\n\s*\n/i)
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => `<p>${escapeHtml(part.replace(/<br\s*\/?>/gi, '\n')).replace(/\n/g, '<br>')}</p>`)
      .join('');

    const listHtml = (items = []) => items
      .map(item => String(item).replace(/^[-*]\s*/, '').trim())
      .filter(Boolean)
      .map(item => `<div class="li">${escapeHtml(item)}</div>`)
      .join('');

    const tagHtml = (tags = [], className = 'project-tag') => tags
      .map(tag => `<span class="${className}">${escapeHtml(tag)}</span>`)
      .join('');

    const observeReveals = (root) => {
      root.querySelectorAll('.reveal, .reveal-stagger').forEach(el => io.observe(el));
    };

    const renderPortfolio = ({ featured, groups }) => {
      if (!portfolioFeatured || !portfolioFeaturedTags || !portfolioGroups) return;

      if (featured) {
        portfolioFeatured.innerHTML = `
          <div class="cap reveal">
            <div class="left">
              ${featured.featuredContext ? `<span class="badge">${escapeHtml(featured.featuredContext)}</span>` : ''}
              <h3>${titleHtml(featured)}</h3>
              ${featured.overlineType ? `<div class="sub">${escapeHtml(featured.overlineType)}</div>` : ''}
              ${paragraphHtml(featured.description)}
              <div class="vitals">
                ${(featured.featuredMetrics || []).map(metric => `
                  <div class="v">
                    <div class="k">${escapeHtml(metric.label)}</div>
                    <div class="num">${escapeHtml(metric.value)}</div>
                  </div>
                `).join('')}
              </div>
            </div>
            <div class="right">
              <div>
                <div class="col-title">Analysis &amp; Design</div>
                ${listHtml(featured.analysisDesignList)}
              </div>
              <div>
                <div class="col-title">Financial &amp; Deliverables</div>
                ${listHtml(featured.financialDeliverablesList)}
              </div>
            </div>
          </div>
        `;

        portfolioFeaturedTags.innerHTML = `
          <div class="capstone-tags reveal">
            ${tagHtml(featured.tags, 'capstone-tag')}
          </div>
        `;
      } else {
        portfolioFeatured.innerHTML = '';
        portfolioFeaturedTags.innerHTML = '';
      }

      portfolioGroups.innerHTML = (groups || []).map(group => {
        const gridClass = group.projects.length >= 6 ? 'portfolio-grid-3' : 'portfolio-grid';
        return `
          <div class="portfolio-cat">${escapeHtml(group.name)}</div>
          <div class="${gridClass} reveal-stagger">
            ${group.projects.map(project => `
              <div class="project-card${project.tags.length > 3 ? ' wide' : ''}">
                ${project.overlineType ? `<div class="project-type">${escapeHtml(project.overlineType)}</div>` : ''}
                <div class="project-title">${project.subtitle ? `${escapeHtml(project.name)} &mdash; ${escapeHtml(project.subtitle)}` : escapeHtml(project.name)}</div>
                <div class="project-desc">${escapeHtml(project.description)}</div>
                <div class="project-tags">${tagHtml(project.tags)}</div>
              </div>
            `).join('')}
          </div>
        `;
      }).join('');

      observeReveals(document.getElementById('portfolio'));
    };

    const showPortfolioError = () => {
      if (!portfolioGroups) return;
      portfolioGroups.innerHTML = `
        <div class="portfolio-cat">Portfolio unavailable</div>
        <div class="portfolio-grid">
          <div class="project-card wide">
            <div class="project-type">Content loading issue</div>
            <div class="project-title">Portfolio content could not be loaded.</div>
            <div class="project-desc">Please check the Airtable connection and Vercel environment variables.</div>
          </div>
        </div>
      `;
    };

    fetch('/api/portfolio', { cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error(`Portfolio API returned ${response.status}`);
        return response.json();
      })
      .then(renderPortfolio)
      .catch(showPortfolioError);

    // hamburger nav
    const navToggle = document.querySelector('.nav-toggle');
    const navLinks = document.querySelector('nav.top .links');
    if (navToggle && navLinks) {
      navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        navToggle.textContent = navLinks.classList.contains('open') ? '✕' : '☰';
      });
      document.addEventListener('click', (e) => {
        if (!e.target.closest('nav.top')) {
          navLinks.classList.remove('open');
          navToggle.textContent = '☰';
        }
      });
    }

    // services draggable infinite slider — smoothed with rAF batching
    const track = document.getElementById('svc-track');
    if (track) {
      const originals = Array.from(track.children);
      const dragCursor = document.getElementById('svc-drag-cursor');
      let slideWidth = 0;
      let index = originals.length;
      let autoTimer = null;
      let resumeTimer = null;
      let isDragging = false;
      let didDrag = false;
      let startX = 0;
      let startScroll = 0;
      let lastX = 0;
      let lastTime = 0;
      let velocity = 0;
      let pendingScroll = null;
      let pendingCursor = null;
      let rafId = null;
      let cursorRafId = null;

      const prepareClone = (node) => {
        const clone = node.cloneNode(true);
        clone.classList.add('is-clone');
        clone.classList.remove('reveal');
        clone.setAttribute('aria-hidden', 'true');
        return clone;
      };

      const beforeClones = originals.map(prepareClone);
      const afterClones = originals.map(prepareClone);
      track.replaceChildren(...beforeClones, ...originals, ...afterClones);

      const slides = Array.from(track.children);
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

      const measure = () => {
        const first = slides[0];
        const second = slides[1];
        slideWidth = second.offsetLeft - first.offsetLeft || second.getBoundingClientRect().width;
        jumpTo(index);
      };

      const jumpTo = (nextIndex) => {
        index = nextIndex;
        track.scrollLeft = slideWidth * index;
      };

      const goTo = (nextIndex, behavior = 'smooth') => {
        index = nextIndex;
        track.scrollTo({ left: slideWidth * index, behavior });
      };

      const normalizeLoop = () => {
        if (index < originals.length) jumpTo(index + originals.length);
        if (index >= originals.length * 2) jumpTo(index - originals.length);
      };

      const stopAuto = () => {
        clearInterval(autoTimer);
        clearTimeout(resumeTimer);
      };

      const startAuto = () => {
        if (reduceMotion.matches) return;
        stopAuto();
        autoTimer = setInterval(() => goTo(index + 1), 4200);
      };

      const resumeAuto = () => {
        stopAuto();
        resumeTimer = setTimeout(startAuto, 1800);
      };

      const settleToNearest = () => {
        if (!slideWidth) return;
        // velocity-aware: if user flicked, advance one more slide in flick direction
        const projected = track.scrollLeft + velocity * 120;
        goTo(Math.round(projected / slideWidth));
      };

      // rAF-batched scrollLeft write — keeps drag silky on high-refresh displays
      const flushScroll = () => {
        rafId = null;
        if (pendingScroll == null) return;
        track.scrollLeft = pendingScroll;
        pendingScroll = null;
      };

      const flushCursor = () => {
        cursorRafId = null;
        if (!dragCursor || !pendingCursor) return;
        dragCursor.style.left = `${pendingCursor.x}px`;
        dragCursor.style.top = `${pendingCursor.y}px`;
        pendingCursor = null;
      };

      track.addEventListener('scroll', () => {
        if (!slideWidth) return;
        index = Math.round(track.scrollLeft / slideWidth);
        window.clearTimeout(track._loopTimer);
        track._loopTimer = window.setTimeout(normalizeLoop, 120);
      }, { passive: true });

      track.addEventListener('wheel', (e) => {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) resumeAuto();
      }, { passive: true });

      track.addEventListener('pointerdown', (e) => {
        if (e.button !== undefined && e.button !== 0) return;
        isDragging = true;
        didDrag = false;
        startX = e.clientX;
        lastX = e.clientX;
        lastTime = performance.now();
        velocity = 0;
        startScroll = track.scrollLeft;
        track.classList.add('dragging');
        dragCursor?.classList.add('dragging');
        track.setPointerCapture(e.pointerId);
        stopAuto();
      });

      track.addEventListener('pointermove', (e) => {
        if (!isDragging) return;
        const dx = e.clientX - startX;
        if (Math.abs(dx) > 6) didDrag = true;
        // track velocity for flick detection
        const now = performance.now();
        const dt = now - lastTime;
        if (dt > 0) {
          // px per ms — smoothed slightly
          velocity = velocity * 0.7 + ((lastX - e.clientX) / dt) * 0.3;
        }
        lastX = e.clientX;
        lastTime = now;
        // batch scrollLeft writes via rAF — single write per frame
        pendingScroll = startScroll - dx;
        if (rafId == null) rafId = requestAnimationFrame(flushScroll);
        e.preventDefault();
      });

      const endDrag = (e) => {
        if (!isDragging) return;
        isDragging = false;
        track.classList.remove('dragging');
        dragCursor?.classList.remove('dragging');
        if (track.hasPointerCapture(e.pointerId)) track.releasePointerCapture(e.pointerId);
        // flush any pending scroll before snapping
        if (rafId != null) {
          cancelAnimationFrame(rafId);
          rafId = null;
          if (pendingScroll != null) {
            track.scrollLeft = pendingScroll;
            pendingScroll = null;
          }
        }
        settleToNearest();
        resumeAuto();
      };

      track.addEventListener('pointerup', endDrag);
      track.addEventListener('pointercancel', endDrag);
      track.addEventListener('click', (e) => {
        if (!didDrag) return;
        e.preventDefault();
        e.stopPropagation();
        didDrag = false;
      }, true);
      track.addEventListener('pointerenter', () => {
        dragCursor?.classList.add('active');
      });
      track.addEventListener('pointerleave', () => {
        dragCursor?.classList.remove('active', 'dragging');
      });
      // batch cursor follow via rAF too
      track.addEventListener('pointermove', (e) => {
        if (!dragCursor) return;
        pendingCursor = { x: e.clientX, y: e.clientY, dragging: isDragging };
        if (cursorRafId == null) cursorRafId = requestAnimationFrame(flushCursor);
      }, { passive: true });
      window.addEventListener('resize', measure);

      requestAnimationFrame(() => {
        measure();
        startAuto();
      });
    }


    // proportional scale-up above 1920
    function applyDesktopZoom() {
      const w = window.innerWidth;
      document.documentElement.style.zoom = w > 1920 ? (w / 1920) : '';
    }
    applyDesktopZoom();
    window.addEventListener('resize', applyDesktopZoom);
})();
