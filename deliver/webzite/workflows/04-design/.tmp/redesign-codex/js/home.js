const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
document.documentElement.classList.add("js");

function initNav() {
  const nav = document.querySelector("[data-nav]");
  const links = document.querySelectorAll(".nav-links a");
  const toggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-mobile-menu]");

  const onScroll = () => nav && nav.classList.toggle("is-stuck", window.scrollY > 16);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (toggle && menu) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      menu.classList.toggle("is-open", open);
      document.body.classList.toggle("is-locked", open);
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setOpen(false);
    });
  }

  const targets = Array.from(links)
    .map((link) => [link, document.querySelector(link.getAttribute("href"))])
    .filter((pair) => pair[1]);

  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      links.forEach((link) => link.classList.remove("is-active"));
      const found = targets.find((pair) => pair[1] === entry.target);
      if (found) found[0].classList.add("is-active");
    });
  }, { rootMargin: "-42% 0px -52% 0px" });

  targets.forEach((pair) => spy.observe(pair[1]));
}

function initFields() {
  const sections = document.querySelectorAll("[data-field-section]");
  if (!sections.length || prefersReduced) return;

  const fieldObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        document.body.dataset.field = entry.target.dataset.fieldSection;
      }
    });
  }, { rootMargin: "-36% 0px -50% 0px", threshold: 0.01 });

  sections.forEach((section) => fieldObserver.observe(section));
}

function initReveal() {
  const items = document.querySelectorAll("[data-reveal]");
  if (!items.length) return;

  items.forEach((item) => {
    const delay = Number(item.dataset.delay || 0);
    if (delay) item.style.setProperty("--delay", `${delay}ms`);
  });

  if (prefersReduced) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  items.forEach((item) => observer.observe(item));
}

function initServices() {
  const rows = document.querySelectorAll("[data-service]");
  const media = document.querySelectorAll("[data-service-media]");
  if (!rows.length) return;

  const activate = (key) => {
    rows.forEach((row) => row.classList.toggle("is-active", row.dataset.service === key));
    media.forEach((img) => img.classList.toggle("is-active", img.dataset.serviceMedia === key));
  };

  rows.forEach((row) => {
    const key = row.dataset.service;
    row.addEventListener("pointerenter", () => activate(key));
    row.addEventListener("focus", () => activate(key));
  });
}

function initMarquee() {
  const marquee = document.querySelector("[data-marquee]");
  const toggle = document.querySelector("[data-marquee-toggle]");
  if (!marquee || !toggle) return;

  toggle.addEventListener("click", () => {
    const paused = !marquee.classList.contains("is-paused");
    marquee.classList.toggle("is-paused", paused);
    toggle.setAttribute("aria-pressed", String(paused));
    toggle.textContent = paused ? "Play marquee" : "Pause marquee";
  });
}

function initWordFill() {
  const block = document.querySelector("[data-wordfill]");
  if (!block) return;

  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);

  textNodes.forEach((node) => {
    if (!node.textContent.trim()) return;
    const frag = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach((token) => {
      if (!token) return;
      if (/^\s+$/.test(token)) {
        frag.appendChild(document.createTextNode(token));
      } else {
        const span = document.createElement("span");
        span.className = "wf";
        span.textContent = token;
        frag.appendChild(span);
      }
    });
    node.parentNode.replaceChild(frag, node);
  });

  const words = Array.from(block.querySelectorAll(".wf"));
  if (prefersReduced) {
    words.forEach((word) => word.classList.add("is-lit"));
    return;
  }

  const update = () => {
    const rect = block.getBoundingClientRect();
    const start = window.innerHeight * 0.85;
    const end = window.innerHeight * 0.38;
    const progress = Math.min(1, Math.max(0, (start - rect.top) / (rect.height + start - end)));
    const lit = Math.round(progress * words.length);
    words.forEach((word, index) => word.classList.toggle("is-lit", index < lit));
  };

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }, { passive: true });
  update();
}

function initStats() {
  const nums = document.querySelectorAll("[data-count]");
  if (!nums.length) return;

  if (prefersReduced) return;

  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const run = (el) => {
    const target = Number(el.dataset.count);
    const duration = 1800;
    const start = performance.now();

    const frame = (now) => {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = String(Math.round(ease(p) * target));
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = String(target);
    };

    el.textContent = "0";
    requestAnimationFrame(frame);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        run(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.7 });

  nums.forEach((num) => observer.observe(num));
}

function initCalculator() {
  const rows = document.querySelectorAll("[data-pages]");
  const format = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  rows.forEach((row) => {
    const pages = Number(row.dataset.pages);
    const cost = row.querySelector("[data-cost]");
    const time = row.querySelector("[data-time]");
    if (cost) cost.textContent = format.format(pages * 400);
    if (time) time.textContent = `${pages * 2} days`;
  });
}

function initCursor() {
  const cursor = document.querySelector("[data-cursor]");
  if (!cursor || prefersReduced || window.matchMedia("(pointer: coarse)").matches) return;

  window.addEventListener("pointermove", (event) => {
    document.documentElement.style.setProperty("--cx", `${event.clientX}px`);
    document.documentElement.style.setProperty("--cy", `${event.clientY}px`);
    document.documentElement.style.setProperty("--mx", `${Math.round((event.clientX / window.innerWidth) * 100)}%`);
    document.documentElement.style.setProperty("--my", `${Math.round((event.clientY / window.innerHeight) * 100)}%`);
    cursor.classList.add("is-active");
  }, { passive: true });

  document.querySelectorAll("a, button, [tabindex]").forEach((el) => {
    el.addEventListener("pointerenter", () => cursor.classList.add("is-link"));
    el.addEventListener("pointerleave", () => cursor.classList.remove("is-link"));
  });
}

initNav();
initFields();
initReveal();
initServices();
initMarquee();
initWordFill();
initStats();
initCalculator();
initCursor();
