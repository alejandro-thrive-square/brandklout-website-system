/* ==========================================================================
   Webzite Studio — Home (Isadora-layout revision)
   Motion layer: scroll-morphing scene + wandering orb, pinned hero theater,
   reveals, word fill, count-ups, dust. Every interaction has a reduced-motion
   fallback; scene colors interpolate BETWEEN design-system tokens only.
   ========================================================================== */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const pinnable = window.matchMedia("(min-width: 981px)");

/* Progressive enhancement flag — CSS only hides [data-boot]/[data-reveal]
   content once this class is present, so a failed script never blanks the page. */
document.documentElement.classList.add("js");

/* --------------------------------------------------------------------------
   Curtain-up boot sequence — dark canvas, then staged fade-ins (CSS delays)
   -------------------------------------------------------------------------- */

function initBoot() {
  const arm = () => document.body.classList.add("is-booted");
  if (prefersReduced) {
    arm();
    return;
  }
  // Two rAFs guarantee the pre-boot state paints once before transitions run.
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => window.setTimeout(arm, 250));
  });
}

/* --------------------------------------------------------------------------
   Scenography — scroll-tweened canvas color + wandering orb + hero pin.
   One rAF loop lerps everything (Isadora ships GSAP scrub; this is vanilla).
   -------------------------------------------------------------------------- */

function initScene() {
  if (prefersReduced) return;

  const root = document.documentElement;
  const stage = document.querySelector("[data-stage]");
  const reelToggle = document.querySelector("[data-reel-pause]");

  /* token RGBs (design-system values verbatim) */
  const INK = [17, 17, 20];
  const INK2 = [25, 25, 31];
  const BLUE = [70, 111, 255];
  const RED = [255, 70, 70];

  const mix = (a, b, t) => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];

  /* background stops along total scroll: ink → deep blue (theater) →
     warm red-mix (manifesto) → ink-2 (case studies) → ink (close) */
  const BG_STOPS = [
    { p: 0.0, c: INK },
    { p: 0.1, c: INK },
    { p: 0.2, c: mix(INK, BLUE, 0.26) },
    { p: 0.33, c: mix(INK, RED, 0.24) },
    { p: 0.48, c: INK2 },
    { p: 0.72, c: INK },
    { p: 1.0, c: INK },
  ];

  /* orb waypoints (viewport-relative) — the blob wanders the whole page */
  const ORB_STOPS = [
    { p: 0.0, x: 62, y: 34, s: 1 },
    { p: 0.14, x: 50, y: 58, s: 1.35 },
    { p: 0.28, x: 16, y: 28, s: 1.1 },
    { p: 0.42, x: 84, y: 62, s: 1.5 },
    { p: 0.58, x: 12, y: 72, s: 0.75 },
    { p: 0.75, x: 72, y: 28, s: 1.1 },
    { p: 1.0, x: 50, y: 84, s: 1.3 },
  ];

  const sample = (stops, p, pick) => {
    let a = stops[0];
    let b = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i += 1) {
      if (p >= stops[i].p && p <= stops[i + 1].p) {
        a = stops[i];
        b = stops[i + 1];
        break;
      }
    }
    const span = b.p - a.p || 1;
    return pick(a, b, (p - a.p) / span);
  };

  const state = {
    bg: INK.slice(),
    x: 62,
    y: 34,
    s: 1,
    hp: 0,
  };
  const LERP = 0.12;
  let toggleShown = false;

  const frame = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;

    const bg = sample(BG_STOPS, p, (a, b, t) => mix(a.c, b.c, t));
    const orb = sample(ORB_STOPS, p, (a, b, t) => ({
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      s: a.s + (b.s - a.s) * t,
    }));

    state.bg = mix(state.bg, bg, LERP);
    state.x += (orb.x - state.x) * LERP;
    state.y += (orb.y - state.y) * LERP;
    state.s += (orb.s - state.s) * LERP;

    root.style.setProperty(
      "--scene-bg",
      `rgb(${Math.round(state.bg[0])}, ${Math.round(state.bg[1])}, ${Math.round(state.bg[2])})`
    );
    root.style.setProperty("--orb-x", `${state.x.toFixed(2)}vw`);
    root.style.setProperty("--orb-y", `${state.y.toFixed(2)}vh`);
    root.style.setProperty("--orb-s", state.s.toFixed(3));

    /* hero pin progress — text exits, theater expands (scrub-like lerp) */
    if (stage && pinnable.matches) {
      const rect = stage.getBoundingClientRect();
      const runway = rect.height - window.innerHeight;
      // finish the expansion at ~82% of the runway so the theater dwells
      // center-locked before the sticky releases (Isadora end:"bottom 10%")
      const hp = runway > 0 ? Math.min(1, Math.max(0, -rect.top / (runway * 0.82))) : 0;
      state.hp += (hp - state.hp) * 0.16;
      root.style.setProperty("--hp", state.hp.toFixed(4));
      if (!toggleShown && reelToggle && state.hp > 0.9) {
        toggleShown = true;
        reelToggle.hidden = false;
        // next frame so the unhide paints before the fade-in transition
        window.requestAnimationFrame(() => reelToggle.classList.add("is-shown"));
      }
    } else if (reelToggle && !toggleShown) {
      /* unpinned layouts (tablet/mobile): show the control immediately */
      toggleShown = true;
      reelToggle.hidden = false;
      reelToggle.classList.add("is-shown");
    }

    window.requestAnimationFrame(frame);
  };

  window.requestAnimationFrame(frame);
}

/* --------------------------------------------------------------------------
   Reel — brand renders crossfade inside the theater card
   -------------------------------------------------------------------------- */

function initReel() {
  const reel = document.querySelector("[data-reel]");
  if (!reel) return;

  const frames = Array.from(reel.querySelectorAll("img"));
  const toggle = document.querySelector("[data-reel-pause]");
  if (frames.length < 2 || prefersReduced) return;

  let index = 0;
  let timer = null;
  let userPaused = false;

  const show = (next) => {
    frames[index].classList.remove("is-active");
    index = next;
    frames[index].classList.add("is-active");
  };

  const stop = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  const schedule = () => {
    stop();
    if (userPaused) return;
    timer = window.setInterval(() => show((index + 1) % frames.length), 2600);
  };

  if (toggle) {
    toggle.addEventListener("click", () => {
      userPaused = !userPaused;
      toggle.setAttribute("aria-pressed", String(userPaused));
      toggle.setAttribute("aria-label", userPaused ? "Play reel" : "Pause reel");
      toggle.classList.toggle("is-paused", userPaused);
      schedule();
    });
  }

  schedule();
}

/* --------------------------------------------------------------------------
   Reveal — staggered entrance, honours [data-delay] (ms)
   -------------------------------------------------------------------------- */

function initReveal() {
  const items = document.querySelectorAll("[data-reveal]");
  if (!items.length) return;

  items.forEach((item) => {
    const delay = Number(item.dataset.delay || 0);
    if (delay) item.style.setProperty("--reveal-delay", `${delay}ms`);
  });

  if (prefersReduced) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  // Stagger delays choreograph groups entering together; an element scrolled
  // into view later must not hold long — clamp instead of zeroing so small
  // staggers survive but nothing waits perceptibly.
  const OBSERVER_DELAY_CAP = 240;
  let initialPassDone = false;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (initialPassDone) {
            const delay = Number(entry.target.dataset.delay || 0);
            entry.target.style.setProperty(
              "--reveal-delay",
              `${Math.min(delay, OBSERVER_DELAY_CAP)}ms`
            );
          }
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  items.forEach((item) => observer.observe(item));

  window.requestAnimationFrame(() => {
    items.forEach((item) => {
      const rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        item.classList.add("is-visible");
        observer.unobserve(item);
      }
    });
    initialPassDone = true;
  });
}

/* --------------------------------------------------------------------------
   Scroll progress bar
   -------------------------------------------------------------------------- */

function initProgress() {
  const bar = document.querySelector("[data-progress]");
  if (!bar) return;

  let ticking = false;

  const update = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    ticking = false;
  };

  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    },
    { passive: true }
  );

  update();
}

/* --------------------------------------------------------------------------
   Nav — solidify + compress on scroll, mobile drawer, scrollspy
   -------------------------------------------------------------------------- */

function initNav() {
  const nav = document.querySelector("[data-nav]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const drawer = document.querySelector("[data-nav-drawer]");

  if (nav) {
    const onScroll = () => nav.classList.toggle("is-stuck", window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  if (toggle && drawer) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      drawer.classList.toggle("is-open", open);
      document.body.classList.toggle("is-locked", open);
    };
    toggle.addEventListener("click", () => {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    drawer.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setOpen(false));
    });
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
  }

  const spyLinks = document.querySelectorAll("[data-spy]");
  if (!spyLinks.length) return;

  const map = new Map();
  spyLinks.forEach((link) => {
    const section = document.getElementById(link.dataset.spy);
    if (section) map.set(section, link);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          spyLinks.forEach((link) => link.classList.remove("is-active"));
          const active = map.get(entry.target);
          if (active) active.classList.add("is-active");
        }
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );

  map.forEach((_link, section) => observer.observe(section));
}

/* --------------------------------------------------------------------------
   Services — hovered/focused row drives the image well
   -------------------------------------------------------------------------- */

function initServices() {
  const root = document.querySelector("[data-services]");
  if (!root) return;

  const rows = Array.from(root.querySelectorAll("[data-service]"));
  const wells = Array.from(root.querySelectorAll("[data-well]"));
  if (!rows.length) return;

  const activate = (indexValue) => {
    rows.forEach((row) => {
      row.classList.toggle("is-active", row.dataset.service === indexValue);
    });
    wells.forEach((img) => {
      img.classList.toggle("is-active", img.dataset.well === indexValue);
    });
  };

  rows.forEach((row) => {
    const key = row.dataset.service;
    row.addEventListener("pointerenter", () => activate(key));
    row.addEventListener("focus", () => activate(key));
  });
}

/* --------------------------------------------------------------------------
   Word fill — the statement brightens word-by-word as the reader scrolls.
   Splits text nodes only, so inline <a>/<em> accents survive intact.
   -------------------------------------------------------------------------- */

function initWordFill() {
  const blocks = document.querySelectorAll("[data-wordfill]");
  if (!blocks.length) return;

  const splitWords = (node) => {
    Array.from(node.childNodes).forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((token) => {
          if (!token) return;
          if (/^\s+$/.test(token)) {
            frag.append(token);
          } else {
            const span = document.createElement("span");
            span.className = "wf";
            span.textContent = token;
            frag.append(span);
          }
        });
        child.replaceWith(frag);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        splitWords(child);
      }
    });
  };

  blocks.forEach(splitWords);

  if (prefersReduced) {
    document.querySelectorAll(".wf").forEach((word) => word.classList.add("lit"));
    return;
  }

  const update = () => {
    blocks.forEach((block) => {
      const rect = block.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.88;
      const end = vh * 0.38;
      const travel = rect.height + (start - end);
      const progress = Math.min(1, Math.max(0, (start - rect.top) / travel));
      const words = block.querySelectorAll(".wf");
      const lit = Math.round(progress * words.length);
      words.forEach((word, index) => word.classList.toggle("lit", index < lit));
    });
  };

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(() => {
          update();
          ticking = false;
        });
      }
    },
    { passive: true }
  );

  update();
}

/* --------------------------------------------------------------------------
   Rate calculator — pages -> cost & duration (canonical per-page rule)
   Design $200/pg + Dev $200/pg = $400/pg ; 2 days/pg.
   -------------------------------------------------------------------------- */

function initRateCalc() {
  const root = document.querySelector("[data-calc]");
  if (!root) return;

  const rows = root.querySelectorAll("[data-pages]");
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  rows.forEach((row) => {
    const pages = Number(row.dataset.pages);
    const cost = pages * 400;
    const days = pages * 2;
    const costEl = row.querySelector("[data-cost]");
    const timeEl = row.querySelector("[data-time]");
    if (costEl) costEl.textContent = money.format(cost);
    if (timeEl) timeEl.textContent = `${days} days`;
  });
}

/* --------------------------------------------------------------------------
   Stats — slow, expensive-feeling count-up on first reveal (Isadora §2.7)
   Reduced-motion safe: the final value is already in the markup.
   -------------------------------------------------------------------------- */

function initMetrics() {
  const nums = document.querySelectorAll("[data-metrics] [data-count]");
  if (!nums.length || prefersReduced) return;

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  const run = (el) => {
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    const duration = 3200;
    let startTs = null;

    const step = (ts) => {
      if (startTs === null) startTs = ts;
      const progress = Math.min((ts - startTs) / duration, 1);
      el.textContent = String(Math.round(easeOut(progress) * target));
      if (progress < 1) window.requestAnimationFrame(step);
      else el.textContent = String(target);
    };

    el.textContent = "0";
    window.requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          run(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.6 }
  );

  nums.forEach((el) => observer.observe(el));
}

/* --------------------------------------------------------------------------
   Ambient dust — brand motion layer (design system 05 Motion, verbatim)
   -------------------------------------------------------------------------- */

function initDust() {
  if (prefersReduced) return;

  const canvas = document.querySelector("[data-dust]");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const particles = [];
  const particleCount = Math.min(120, Math.floor(window.innerWidth / 12));

  const resize = () => {
    canvas.width = Math.floor(window.innerWidth * window.devicePixelRatio);
    canvas.height = Math.floor(window.innerHeight * window.devicePixelRatio);
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  };

  const seed = () => {
    particles.length = 0;
    for (let i = 0; i < particleCount; i += 1) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 1.7 + 0.25,
        speed: Math.random() * 0.3 + 0.05,
        drift: Math.random() * 0.5 - 0.25,
        alpha: Math.random() * 0.4 + 0.1,
      });
    }
  };

  const frame = () => {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles.forEach((particle) => {
      const pullX = (pointer.x - window.innerWidth / 2) * 0.0008;
      const pullY = (pointer.y - window.innerHeight / 2) * 0.0006;
      particle.x += particle.drift + pullX;
      particle.y += particle.speed + pullY;

      if (particle.y > window.innerHeight + 8) particle.y = -8;
      if (particle.x > window.innerWidth + 8) particle.x = -8;
      if (particle.x < -8) particle.x = window.innerWidth + 8;

      ctx.beginPath();
      ctx.fillStyle = `rgba(255, 255, 255, ${particle.alpha})`;
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
    window.requestAnimationFrame(frame);
  };

  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  });

  window.addEventListener("resize", () => {
    resize();
    seed();
  });

  resize();
  seed();
  frame();
}

initBoot();
initScene();
initReel();
initReveal();
initProgress();
initNav();
initServices();
initWordFill();
initRateCalc();
initMetrics();
initDust();
