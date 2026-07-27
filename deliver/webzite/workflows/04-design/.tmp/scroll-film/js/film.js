/* ==========================================================================
   Webzite Studio — Home scroll-film "It Adds Up" (Lane A, pure-code)
   One scrubbed GSAP timeline drives the whole film inside a single sticky
   stage; Lenis smooths the scroll; after-film content uses the design
   system's IO reveals. Ordering law respected: the pinned film timeline is
   created before every other ScrollTrigger.
   ========================================================================== */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const JUMP = new URLSearchParams(location.search).get("jump");
if (JUMP !== null) history.scrollRestoration = "manual";

const root = document.documentElement;
root.classList.add("js");
if (prefersReduced) root.classList.add("reduced");

const filmOn = !prefersReduced && window.gsap && window.ScrollTrigger;

/* --------------------------------------------------------------------------
   Char splitter — masked rise/exit units for the giant terms
   -------------------------------------------------------------------------- */

function splitChars(el) {
  const text = el.textContent;
  el.textContent = "";
  const chars = [];
  for (const ch of text) {
    const span = document.createElement("span");
    span.className = "ch";
    span.textContent = ch === " " ? " " : ch;
    el.appendChild(span);
    chars.push(span);
  }
  return chars;
}

/* --------------------------------------------------------------------------
   THE FILM
   -------------------------------------------------------------------------- */

let lenis = null;
let filmST = null;

function initFilm() {
  if (!filmOn) return;

  gsap.registerPlugin(ScrollTrigger);

  /* smooth scroll — skipped in jump mode so screenshots land settled */
  if (JUMP === null && window.Lenis) {
    lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  const stage = document.querySelector("[data-stage]");
  if (!stage) return;

  const chars = [[], [], []];
  document.querySelectorAll(".term").forEach((term) => {
    const i = Number(term.dataset.term);
    chars[i] = splitChars(term.querySelector("[data-split]"));
  });
  const profitChars = splitChars(document.querySelector(".eq-final [data-split]"));

  /* initial states (before first paint of the timeline) */
  gsap.set('[data-term="0"]', { autoAlpha: 1 });
  gsap.set(chars[1], { yPercent: 120 });
  gsap.set(chars[2], { yPercent: 120 });
  gsap.set(profitChars, { yPercent: 120 });
  gsap.set(".world-strategy", { opacity: 1 });
  gsap.set(".term-op", { autoAlpha: 0, rotate: -90 });
  gsap.set(".eq-final", { autoAlpha: 0 });
  gsap.set(".final-sum, .final-cta, .final-stats", { autoAlpha: 0, y: 26 });

  /* boot — curtain up (skipped when landing mid-film) */
  const midFilm = JUMP !== null || window.scrollY > 50;
  if (midFilm) {
    gsap.set(chars[0], { yPercent: 0 });
    gsap.set('[data-beat="0"], .hud-top, [data-hud], [data-hint]', { opacity: 1 });
  } else {
    gsap.set(chars[0], { yPercent: 120 });
    gsap.to(chars[0], {
      yPercent: 0, duration: 1.1, ease: "power4.out", stagger: 0.045, delay: 0.35,
    });
    gsap.fromTo(
      '[data-beat="0"], .hud-top, [data-hud], [data-hint]',
      { opacity: 0 },
      { opacity: 1, duration: 0.9, ease: "power2.out", stagger: 0.12, delay: 0.7 }
    );
  }

  /* ---- the scrubbed master timeline (0..100) --------------------------- */

  const tl = gsap.timeline({ defaults: { ease: "none" } });

  /* CH 01 — Strategy: the blueprint draws itself */
  tl.to(".bp-line.is-v", { scaleY: 1, duration: 7, ease: "power1.out", stagger: 1.2 }, 0)
    .to(".bp-line.is-h", { scaleX: 1, duration: 7, ease: "power1.out", stagger: 1.4 }, 1)
    .to(".bp-note", { opacity: 1, duration: 3, stagger: 2.2 }, 3)
    .to("[data-hint]", { opacity: 0, duration: 3 }, 3)
    /* exit */
    .to('[data-beat="0"]', { autoAlpha: 0, y: -18, duration: 3 }, 12)
    .to(chars[0], { yPercent: -120, duration: 4, ease: "power2.in", stagger: 0.05 }, 13.5)
    .to(".world-strategy", { opacity: 0, duration: 4 }, 14.5)
    .set('[data-term="0"]', { autoAlpha: 0 }, 19)
    .to('[data-led="0"]', { opacity: 1, duration: 2.5 }, 16);

  /* CH 02 — + Experience: the interface world drifts */
  tl.set('[data-term="1"]', { autoAlpha: 1 }, 18.5)
    .to(".world-experience", { opacity: 1, duration: 5 }, 18.5)
    .to('[data-term="1"] .term-op', { autoAlpha: 1, rotate: 0, duration: 3, ease: "power2.out" }, 19)
    .to(chars[1], { yPercent: 0, duration: 4.5, ease: "power3.out", stagger: 0.05 }, 19.5)
    .fromTo('[data-beat="1"]', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 3 }, 23)
    /* continuous parallax through the chapter */
    .fromTo('[data-xp="0"]', { y: 90, rotate: -2 }, { y: -110, rotate: 2, duration: 24 }, 19)
    .fromTo(".xp-card.is-b", { y: 140 }, { y: -160, duration: 24 }, 19)
    .fromTo(".xp-card.is-c", { y: 70, rotate: 3 }, { y: -80, rotate: -2, duration: 24 }, 19)
    .fromTo(".xp-orb", { xPercent: -16 }, { xPercent: 14, duration: 26 }, 18.5)
    /* exit */
    .to('[data-beat="1"]', { autoAlpha: 0, y: -18, duration: 3 }, 37)
    .to(chars[1], { yPercent: -120, duration: 4, ease: "power2.in", stagger: 0.05 }, 38.5)
    .to('[data-term="1"] .term-op', { autoAlpha: 0, duration: 2.5 }, 38.5)
    .to(".world-experience", { opacity: 0, duration: 4 }, 39.5)
    .set('[data-term="1"]', { autoAlpha: 0 }, 44)
    .to('[data-led="1"]', { opacity: 1, duration: 2.5 }, 41);

  /* CH 03 — + Function: the terminal reports */
  tl.set('[data-term="2"]', { autoAlpha: 1 }, 43.5)
    .to(".world-function", { opacity: 1, duration: 5 }, 43.5)
    .to('[data-term="2"] .term-op', { autoAlpha: 1, rotate: 0, duration: 3, ease: "power2.out" }, 44)
    .to(chars[2], { yPercent: 0, duration: 4.5, ease: "power3.out", stagger: 0.05 }, 44.5)
    .fromTo('[data-beat="2"]', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 3 }, 48)
    .fromTo(".fn-terminal", { y: 46 }, { y: -8, duration: 22 }, 44)
    .to("[data-fn]", { opacity: 1, duration: 2, stagger: 2.4 }, 47)
    /* exit */
    .to('[data-beat="2"]', { autoAlpha: 0, y: -18, duration: 3 }, 60)
    .to(chars[2], { yPercent: -120, duration: 4, ease: "power2.in", stagger: 0.05 }, 61.5)
    .to('[data-term="2"] .term-op', { autoAlpha: 0, duration: 2.5 }, 61.5)
    .to(".world-function", { opacity: 0, duration: 4 }, 62.5)
    .set('[data-term="2"]', { autoAlpha: 0 }, 67)
    .to('[data-led="2"]', { opacity: 1, duration: 2.5 }, 64);

  /* CH 04 — = Profit: the equation resolves (finale never fades) */
  tl.to(".world-profit", { opacity: 1, duration: 8 }, 68)
    .to("[data-ledger]", { opacity: 0, duration: 3 }, 70)
    .set(".eq-final", { autoAlpha: 1 }, 69)
    .to(".final-sum", { autoAlpha: 1, y: 0, duration: 4, ease: "power2.out" }, 70)
    .to(profitChars, { yPercent: 0, duration: 5, ease: "power4.out", stagger: 0.06 }, 73)
    .to(".final-cta", { autoAlpha: 1, y: 0, duration: 4, ease: "power2.out" }, 78)
    .to(".final-stats", { autoAlpha: 1, y: 0, duration: 4, ease: "power2.out" }, 80)
    .fromTo(
      ".final-stats b",
      { textContent: 0 },
      { textContent: (i, el) => Number(el.dataset.count), snap: { textContent: 1 }, duration: 8 },
      80
    )
    .to({}, { duration: 12 }, 88); /* center dwell before the stage unsticks */

  /* HUD readout — chapter label + local progress */
  const CHAPTERS = [
    [0, 0.19, "CH 01 / 04 — Strategy"],
    [0.19, 0.44, "CH 02 / 04 — Experience"],
    [0.44, 0.67, "CH 03 / 04 — Function"],
    [0.67, 1.0001, "CH 04 / 04 — = Profit"],
  ];
  const hudLabel = document.querySelector("[data-hud-label]");
  const hudBar = document.querySelector("[data-hud-bar]");

  filmST = ScrollTrigger.create({
    trigger: "[data-film]",
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    animation: tl,
    invalidateOnRefresh: true,
    onUpdate(self) {
      const p = self.progress;
      for (const [a, b, label] of CHAPTERS) {
        if (p >= a && p < b) {
          if (hudLabel.textContent !== label) hudLabel.textContent = label;
          hudBar.style.transform = `scaleX(${(p - a) / (b - a)})`;
          break;
        }
      }
    },
  });
}

/* --------------------------------------------------------------------------
   AFTER-FILM — marquee skew + word fill (created AFTER the pinned film)
   -------------------------------------------------------------------------- */

function initMarqueeSkew() {
  if (!filmOn) return;
  const track = document.querySelector("[data-marquee-track]");
  if (!track) return;

  const setSkew = gsap.quickSetter(track, "skewX", "deg");
  let clear = null;
  ScrollTrigger.create({
    trigger: "[data-marquee]",
    start: "top bottom",
    end: "bottom top",
    onUpdate(self) {
      const v = gsap.utils.clamp(-6, 6, self.getVelocity() / -220);
      setSkew(v);
      clearTimeout(clear);
      clear = setTimeout(() => setSkew(0), 140);
    },
  });
}

function initWordFill() {
  const el = document.querySelector("[data-wordfill]");
  if (!el) return;

  /* wrap every word (across child elements) in .wf spans */
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  textNodes.forEach((node) => {
    if (!node.textContent.trim()) return;
    const frag = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach((piece) => {
      if (!piece) return;
      if (/^\s+$/.test(piece)) {
        frag.appendChild(document.createTextNode(piece));
      } else {
        const span = document.createElement("span");
        span.className = "wf";
        span.textContent = piece;
        frag.appendChild(span);
      }
    });
    node.parentNode.replaceChild(frag, node);
  });

  const words = el.querySelectorAll(".wf");
  if (prefersReduced || !filmOn) {
    words.forEach((w) => w.classList.add("lit"));
    return;
  }

  ScrollTrigger.create({
    trigger: el,
    start: "top 82%",
    end: "bottom 48%",
    scrub: true,
    onUpdate(self) {
      const lit = Math.round(self.progress * words.length);
      words.forEach((w, i) => w.classList.toggle("lit", i < lit));
    },
  });
}

/* --------------------------------------------------------------------------
   Design-system behaviors (verbatim patterns from Home r2)
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

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  items.forEach((item) => observer.observe(item));
}

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

function initNav() {
  const nav = document.querySelector("[data-nav]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const drawer = document.querySelector("[data-nav-drawer]");
  if (!nav) return;

  const onScroll = () => nav.classList.toggle("is-stuck", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toggle && drawer) {
    const close = () => {
      toggle.setAttribute("aria-expanded", "false");
      drawer.classList.remove("is-open");
      document.body.classList.remove("is-locked");
    };
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      drawer.classList.toggle("is-open", !open);
      document.body.classList.toggle("is-locked", !open);
    });
    drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }
}

function initServices() {
  const rows = document.querySelectorAll("[data-service]");
  const wells = document.querySelectorAll("[data-well]");
  if (!rows.length) return;

  const activate = (i) => {
    rows.forEach((r) => r.classList.toggle("is-active", Number(r.dataset.service) === i));
    wells.forEach((w) => w.classList.toggle("is-active", Number(w.dataset.well) === i));
  };

  rows.forEach((row) => {
    const i = Number(row.dataset.service);
    row.addEventListener("mouseenter", () => activate(i));
    row.addEventListener("focus", () => activate(i));
  });
}

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

/* Ambient dust — brand motion layer (design system 05 Motion, verbatim) */
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

/* --------------------------------------------------------------------------
   Dev contract — ?jump=<y> lands force-settled; __ready gates screenshots.
   Jank meter: per-frame rAF deltas, judge p95/max (never average fps).
   -------------------------------------------------------------------------- */

function initJankMeter() {
  const deltas = [];
  let last = performance.now();
  const tick = (now) => {
    deltas.push(now - last);
    last = now;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  window.__jank = () => {
    const sorted = [...deltas].sort((a, b) => a - b);
    return {
      frames: sorted.length,
      p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
      max: sorted[sorted.length - 1] || 0,
    };
  };

  setInterval(() => {
    const { p95, max } = window.__jank();
    console.log(`[jank] p95 ${p95.toFixed(1)}ms · max ${max.toFixed(1)}ms`);
  }, 2000);
}

function settle() {
  if (JUMP !== null) {
    window.scrollTo(0, Number(JUMP) || 0);
    if (filmOn) {
      ScrollTrigger.refresh();
      window.scrollTo(0, Number(JUMP) || 0);
      ScrollTrigger.update();
      if (filmST) filmST.animation.progress(filmST.progress);
    }
  }
  window.__ready = true;
}

/* --------------------------------------------------------------------------
   Boot order — film (pinned) FIRST, every other trigger after.
   -------------------------------------------------------------------------- */

initFilm();
initMarqueeSkew();
initWordFill();
initReveal();
initProgress();
initNav();
initServices();
initRateCalc();
initDust();
initJankMeter();

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(() => {
    if (filmOn) ScrollTrigger.refresh();
    settle();
  });
} else {
  window.addEventListener("load", settle);
}
