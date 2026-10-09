/* The shell every page shares: skip link and reading progress (outside the smooth wrapper, so they
   stay fixed), the top strip, the navbar with its menus, the footer and the call bar. Markup only;
   behaviour is in js/00-runtime.js, which finds every part by its data- attribute. */
import { FACTS, NAV, FOOTER, LEGAL } from './site.mjs';

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const tel = `tel:${FACTS.phoneE164}`;

export const before = () => `<a class="skip-link_component" href="#main">Skip to content</a>
<div class="progress_component" aria-hidden="true"><span class="progress_fill" id="navProgress" data-progress></span></div>`;

const current = (href, path) => href === path;
const groupHas = (g, path) => g.links && g.links.some(([h]) => current(h, path));

export function header(path) {
  const items = NAV.map((g) => {
    if (g.href) {
      const on = current(g.href, path);
      return `<li class="navbar_item"><a class="navbar_link${on ? ' is-current' : ''}" href="${g.href}"${on ? ' aria-current="page"' : ''}>${esc(g.label)}</a></li>`;
    }
    const on = groupHas(g, path);
    const links = g.links.map(([h, t], i) => {
      const cur = current(h, path);
      const cls = ['navbar_dropdown-link', i === 0 ? 'is-lead' : '', cur ? 'is-current' : ''].filter(Boolean).join(' ');
      return `<a class="${cls}" href="${h}"${cur ? ' aria-current="page"' : ''}>${esc(t)}</a>`;
    }).join('');
    return `<li class="navbar_item" data-dropdown>
        <button class="navbar_dropdown-toggle${on ? ' is-current' : ''}" type="button" aria-expanded="false" aria-controls="menu-${g.id}" data-dropdown-toggle>${esc(g.label)}<span class="navbar_dropdown-icon" aria-hidden="true" data-dropdown-icon></span></button>
        <div class="navbar_dropdown-list${g.wide ? ' is-wide' : ''}" id="menu-${g.id}" data-dropdown-list>${links}</div>
      </li>`;
  }).join('\n      ');
  return `<div class="topbar_component">
  <div class="padding-global"><div class="container-large"><div class="topbar_inner">
    <span class="topbar_text">Dedicated implant care in Bergen County, New Jersey</span>
    <span class="topbar_text is-phone">Questions? <a class="topbar_link" href="${tel}">${FACTS.phone}</a></span>
  </div></div></div>
</div>
<nav class="navbar_component" aria-label="Primary" data-navbar>
  <div class="padding-global"><div class="container-large"><div class="navbar_container">
    <a class="navbar_logo-link" href="/" aria-label="${esc(FACTS.name)}, home"${path === '/' ? ' aria-current="page"' : ''}>
      <img class="navbar_logo" src="/media/img/logo-stacked.webp" width="620" height="180" alt="${esc(FACTS.name)}">
    </a>
    <div class="navbar_menu" id="site-menu" data-menu>
      <ul class="navbar_list">
      ${items}
      </ul>
      <div class="navbar_drawer-foot">
        <a class="navbar_drawer-phone" href="${tel}">${FACTS.phone}</a>
        <a class="button" href="/contact#consultation" data-button>Schedule Consultation</a>
      </div>
    </div>
    <div class="navbar_actions">
      <a class="button navbar_button" href="${path === '/' ? '#consultation' : '/contact#consultation'}" data-button>Schedule Consultation</a>
      <button class="navbar_menu-button" type="button" aria-expanded="false" aria-controls="site-menu" aria-label="Open the menu" data-menu-button>
        <span class="navbar_menu-line" data-menu-line="top"></span>
        <span class="navbar_menu-line" data-menu-line="bottom"></span>
      </button>
    </div>
  </div></div></div>
</nav>`;
}

export function footer() {
  const col = (c) => `<div class="footer_column">
          <div class="footer_title">${esc(c.title)}</div>
          <ul class="footer_list">${c.links.map(([h, t]) => `<li><a class="footer_link" href="${h}">${esc(t)}</a></li>`).join('')}</ul>
        </div>`;
  return `<footer class="footer_component">
  <div class="padding-global"><div class="container-large"><div class="footer_inner">
    <div class="footer_top">
      <div class="footer_brand-column">
        <a class="footer_brand" href="/" data-footer-brand>${esc(FACTS.name)}</a>
        <p class="footer_text">Serving ${esc(FACTS.area)}.</p>
      </div>
      <div class="footer_column">
        <div class="footer_title">Visit</div>
        <p class="footer_text"><a class="footer_link" href="${FACTS.map}" target="_blank" rel="noopener">${esc(FACTS.street)}<br>${FACTS.city}, ${FACTS.regionName} ${FACTS.zip}</a></p>
        <p class="footer_text"><a class="footer_link" href="${tel}">${FACTS.phone}</a></p>
        <p class="footer_text">${FACTS.hours.map((h) => `${esc(h.days)}: ${esc(h.time)}`).join('<br>')}</p>
      </div>
      ${FOOTER.map(col).join('\n      ')}
    </div>
    <div class="footer_bottom">
      <span class="footer_copyright">Copyright © 2026 ${esc(FACTS.name)}</span>
      <ul class="footer_legal">${LEGAL.map(([h, t]) => `<li><a class="footer_legal-link" href="${h}">${esc(t)}</a></li>`).join('')}</ul>
    </div>
  </div></div></div>
</footer>`;
}

/* the call bar steps aside while a consultation form is on screen; "Book" goes to the page's own
   form when it has one */
export const callbar = (hasForm) => `<div class="callbar_component" data-callbar>
  <a class="callbar_link is-call" href="${tel}">Call Now</a>
  <a class="callbar_link is-book" href="${hasForm ? '#consultation' : '/contact#consultation'}">Book Consultation</a>
</div>`;
