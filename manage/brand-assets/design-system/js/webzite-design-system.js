/* Webzite Studio — Design System v2.0 */

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* --------------------------------------------------------------------------
   Reveal — staggered entrance with optional data-delay (ms)
   -------------------------------------------------------------------------- */

function initReveal() {
  const items = document.querySelectorAll("[data-reveal]");
  if (!items.length) return;

  items.forEach((item) => {
    const delay = Number(item.dataset.delay || 0);
    if (delay) item.style.setProperty("--reveal-delay", `${delay}ms`);
  });

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
   Index rail scrollspy
   -------------------------------------------------------------------------- */

function initScrollSpy() {
  const links = document.querySelectorAll("[data-spy-link]");
  if (!links.length) return;

  const map = new Map();
  links.forEach((link) => {
    const section = document.getElementById(link.dataset.spyLink);
    if (section) map.set(section, link);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((link) => link.classList.remove("is-active"));
          const active = map.get(entry.target);
          if (active) active.classList.add("is-active");
        }
      });
    },
    { rootMargin: "-30% 0px -55% 0px" }
  );

  map.forEach((_link, section) => observer.observe(section));
}

/* --------------------------------------------------------------------------
   Grid overlay — button or "G"
   -------------------------------------------------------------------------- */

function initGridOverlay() {
  const toggle = () => document.body.classList.toggle("show-grid");

  const button = document.querySelector("[data-grid-toggle]");
  if (button) button.addEventListener("click", toggle);

  window.addEventListener("keydown", (event) => {
    const target = event.target;
    const typing =
      target instanceof HTMLElement &&
      (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
    if (typing || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key.toLowerCase() === "g") toggle();
  });
}

/* --------------------------------------------------------------------------
   Copy tokens — any [data-copy], with toast feedback
   -------------------------------------------------------------------------- */

function initCopy() {
  const toast = document.querySelector("[data-toast]");
  let timer;

  const notify = (value) => {
    if (!toast) return;
    toast.textContent = `Copied — ${value}`;
    toast.classList.add("is-visible");
    window.clearTimeout(timer);
    timer = window.setTimeout(() => toast.classList.remove("is-visible"), 1600);
  };

  document.querySelectorAll("[data-copy]").forEach((el) => {
    el.addEventListener("click", (event) => {
      // nested chips win over row-level copy targets
      if (el !== event.target.closest("[data-copy]")) return;
      const value = el.dataset.copy;
      navigator.clipboard
        .writeText(value)
        .then(() => notify(value))
        .catch(() => notify(value));
    });
  });
}

/* --------------------------------------------------------------------------
   Easing cards — draw curve on scroll-in, run ball demo on hover/click
   -------------------------------------------------------------------------- */

function initEasingCards() {
  document.querySelectorAll("[data-easing]").forEach((card) => {
    const play = () => {
      card.classList.remove("is-playing");
      // force restart of the keyframe animation
      void card.offsetWidth;
      card.classList.add("is-playing");
    };

    card.addEventListener("mouseenter", play);
    card.addEventListener("click", (event) => {
      if (!event.target.closest("[data-copy]")) play();
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );

  document.querySelectorAll("[data-easing]").forEach((card) => observer.observe(card));
}

/* --------------------------------------------------------------------------
   Testimonial proof rail
   -------------------------------------------------------------------------- */

const testimonials = [
  {
    quote:
      "Alejandro is a professional who stands out not only for his talent and knowledge, but also for his way of managing projects.",
    person: "Tiare Vildosola",
    company: "Banca.Me",
    avatar: "../assets/testimonials/avatar-tiare.png",
  },
  {
    quote: "He can handle multitasking as well as building great Webflow websites. He is great.",
    person: "Stan St-Fleur",
    company: "NSQ Inc",
    avatar: "../assets/testimonials/avatar-stan.png",
  },
  {
    quote:
      "Alejandro did a quality job and met all of my expectations. He was very responsive and delivered on time.",
    person: "Ovidio Diaz Espino",
    company: "Isthmus Financial",
    avatar: "../assets/testimonials/avatar-ovidio.png",
  },
];

function initTestimonials() {
  const root = document.querySelector("[data-testimonials]");
  if (!root) return;

  const quote = root.querySelector("[data-quote]");
  const person = root.querySelector("[data-person]");
  const company = root.querySelector("[data-company]");
  const avatar = root.querySelector("[data-avatar]");
  const controls = Array.from(root.querySelectorAll("[data-testimonial]"));
  let index = 0;
  let timer;

  const setActive = (nextIndex) => {
    index = nextIndex;
    const item = testimonials[index];
    quote.animate(
      [
        { opacity: 0, transform: "translateY(14px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: prefersReduced ? 1 : 420, easing: "cubic-bezier(0.19, 1, 0.22, 1)" }
    );
    quote.textContent = item.quote;
    person.textContent = item.person;
    company.textContent = item.company;
    avatar.src = item.avatar;
    controls.forEach((control, controlIndex) => {
      control.classList.toggle("is-active", controlIndex === index);
    });
  };

  const schedule = () => {
    if (prefersReduced) return;
    window.clearInterval(timer);
    timer = window.setInterval(() => {
      setActive((index + 1) % testimonials.length);
    }, 5200);
  };

  controls.forEach((control) => {
    control.addEventListener("click", () => {
      setActive(Number(control.dataset.testimonial));
      schedule();
    });
  });

  setActive(0);
  schedule();
}

/* --------------------------------------------------------------------------
   Ambient dust — brand motion layer (spec: 05 Motion)
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

/* --------------------------------------------------------------------------
   Tilt — imagery render tiles only, subtle
   -------------------------------------------------------------------------- */

function initTilt() {
  if (prefersReduced) return;

  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(700px) rotateX(${y * -4}deg) rotateY(${x * 4}deg)`;
    });

    card.addEventListener("pointerleave", () => {
      card.style.transform = "";
    });
  });
}

initReveal();
initProgress();
initScrollSpy();
initGridOverlay();
initCopy();
initEasingCards();
initTestimonials();
initDust();
initTilt();
