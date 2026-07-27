(() => {
  const f = { url: location.href, visibility: document.visibilityState,
              focus: document.hasFocus(), warnings: [] };
  if (document.visibilityState !== 'visible')
    f.warnings.push('TAB NOT VISIBLE: transitions/IntersectionObserver frozen; reveal/state reads are unreliable');
  f.sectionIds = [...document.querySelectorAll('section')].map(s => s.id || '(none)');
  f.headings = [...document.querySelectorAll('h1, h2, h3')]
    .map(h => (h.textContent || '').trim().replace(/\s+/g, ' ')).filter(Boolean);
  f.counts = {
    sections: document.querySelectorAll('section').length,
    reveals: document.querySelectorAll('.reveal, .reveal-stagger').length,
    revealed: document.querySelectorAll('.reveal.in, .reveal-stagger.in').length,
    details: document.querySelectorAll('details').length,
    forms: document.querySelectorAll('form').length,
    inputs: document.querySelectorAll('input, textarea').length,
    images: document.querySelectorAll('img').length,
    svgs: document.querySelectorAll('svg').length,
    links: document.querySelectorAll('a').length
  };
  f.textLen = (document.body.innerText || '').replace(/\s+/g, ' ').trim().length;
  f.stuckReveals = [...document.querySelectorAll('.reveal, .reveal-stagger')]
    .filter(el => { const r = el.getBoundingClientRect();
      return r.top < innerHeight && r.bottom > 0 && getComputedStyle(el).opacity === '0'; })
    .map(el => (el.className || '').toString().slice(0, 50)).slice(0, 12);
  // representative computed styles that broke during this project
  const probe = (sel, props) => { const el = document.querySelector(sel);
    if (!el) return 'MISSING';
    const cs = getComputedStyle(el);
    return Object.fromEntries(props.map(p => [p, cs.getPropertyValue(p)])); };
  f.probes = {
    body: probe('body', ['background-color', 'color', 'font-family', 'overflow-x']),
    h1: probe('h1', ['font-family', 'font-size', 'color']),
    sceneHeadSub: probe('.scene-head .sub', ['font-family', 'font-style', 'font-size']),
    reveal: probe('.reveal', ['opacity', 'transform']),
    compareBar: probe('.compare .bar', ['height', 'background-color']),
    faqAnswer: probe('.faq details .a, .faq details .a-inner', ['opacity']),
    footMark: probe('.foot-mark', ['color'])
  };
  return JSON.stringify(f, null, 1);
})()