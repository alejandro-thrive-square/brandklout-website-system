// Native anchors work without JS; the current-section cue enhances the reading rail.
(() => {
  const sections = [...document.querySelectorAll('.journal_section')];
  if (!sections.length || !('IntersectionObserver' in window)) return;
  const links = [...document.querySelectorAll('.journal_toc-link')];
  const observer = new IntersectionObserver(entries => {
    const entry = entries.find(e => e.isIntersecting);
    if (!entry) return;
    links.forEach(link => {
      if (link.hash === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
  sections.forEach(section => observer.observe(section));
})();
