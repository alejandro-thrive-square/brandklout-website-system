/* ==========================================================================
   THE SHELL — <head>, nav, site index (drawer), footer, mobile bar. Every
   page is wrapped by `page()`. The homepage body is hand-authored
   (pages/home.html); every other body is rendered from blocks.

   Instatic keeps only <body>: the <head> here is for the local build and the
   gates. Canonical, Open Graph and JSON-LD are ALSO carried on
   <main data-seo> (base64 JSON) and written into <head> at runtime by
   js/80-seo.js, because that is the only road to the published <head>
   (21-instatic-upload.md, trap 31).
   ========================================================================== */
import { SITE, INDEX } from './site.mjs'

const NAV_LINKS = [
  ['/dental-implants.html', 'Implants'],
  ['/technology.html', 'Technology'],
  ['/dr-tony-barriere.html', 'Dr. Barriere'],
  ['/results.html', 'Results'],
  ['/contact.html', 'Contact'],
]

export function nav(current) {
  const links = NAV_LINKS.map(([h, l]) => `<a href="${h}"${h === current ? ' aria-current="page"' : ''}>${l}</a>`).join('\n      ')
  return `<header class="nav_component" id="nav">
  <div class="nav_progress-bar" aria-hidden="true"><i id="navProgress"></i></div>
  <div class="container-xlarge nav_container">
    <a class="nav_logo" href="/index.html" aria-label="West LA Implants home">
      <img src="/media/img/logo-icon-white.png" alt=""><span class="brand_wordmark">West LA <em>Implants</em></span>
    </a>
    <nav class="nav_links" aria-label="Primary">
      ${links}
      <div class="nav_readout" aria-hidden="true"><b id="navCh">00</b><span id="navName">Arrival</span><span class="nav_readout-bar" id="navBar"></span></div>
    </nav>
    <div class="nav_actions">
      <a class="nav_phone" href="${SITE.phoneNewHref}">${SITE.phoneNew}</a>
      <a class="button is-primary nav_button is-magnetic" href="#invitation"><span>Request Consultation</span></a>
      <button class="nav_menu-button" id="burger" aria-label="Open the site index" aria-expanded="false" aria-controls="drawer"><span></span><span></span></button>
    </div>
  </div>
</header>`
}

export function drawer() {
  const cols = INDEX.map(
    (g) => `<div class="menu-drawer_column"><div class="menu-drawer_title">${g.group}</div><ul>${g.links.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ul></div>`,
  ).join('\n    ')
  return `<div class="menu-drawer_component" id="drawer" aria-hidden="true">
  <div class="container-xlarge menu-drawer_content">
    <div class="menu-drawer_grid">
    ${cols}
    </div>
    <div class="menu-drawer_meta">
      <a href="${SITE.phoneNewHref}">New patients ${SITE.phoneNew}</a>
      <a href="${SITE.zocdoc}" target="_blank" rel="noopener">Book online on Zocdoc</a>
      <span>${SITE.address1} · ${SITE.address2}</span>
    </div>
  </div>
</div>`
}

export function footer() {
  const cols = INDEX.slice(0, 3).map(
    (g) => `<div><div class="footer_title">${g.group}</div><ul>${g.links.map(([h, l]) => `<li><a href="${h}">${l}</a></li>`).join('')}</ul></div>`,
  ).join('\n      ')
  return `<footer class="footer_component">
  <div class="container-large">
    <div class="footer_grid">
      <div>
        <div class="footer_logo nav_logo"><img src="/media/img/logo-icon-white.png" alt=""><span class="brand_wordmark">West LA <em>Implants</em></span></div>
        <p class="footer_about">Dental implants, cosmetic dentistry and oral surgery on Wilshire Blvd. Minutes from Brentwood, Santa Monica, Westwood, Century City and Culver City.</p>
        <div class="footer_title">Los Angeles office</div>
        <p>${SITE.address1}<br>${SITE.address2}<br><a href="${SITE.phoneNewHref}">${SITE.phoneNew}</a> new patients<br><a href="${SITE.phoneCurrentHref}">${SITE.phoneCurrent}</a> current patients</p>
        <div class="footer_title">Hours</div>
        <p>Monday to Friday<br>9:00am to 5:00pm<br>Saturday &amp; Sunday closed</p>
      </div>
      ${cols}
    </div>
    <div class="footer_bottom">
      <span>&copy; West LA Implants &middot; Tony Barriere, DDS</span>
      <div class="footer_links">
        <a href="${SITE.social.instagram}" target="_blank" rel="noopener">Instagram</a>
        <a href="${SITE.social.facebook}" target="_blank" rel="noopener">Facebook</a>
        <a href="${SITE.social.youtube}" target="_blank" rel="noopener">YouTube</a>
        <a href="${SITE.social.yelp}" target="_blank" rel="noopener">Yelp</a>
        <a href="${SITE.zocdoc}" target="_blank" rel="noopener">Zocdoc</a>
        <a href="/privacy-policy.html">Privacy</a>
        <a href="/hipaa-disclosure.html">HIPAA Disclosure</a>
        <a href="/accessibility.html">Accessibility</a>
      </div>
    </div>
  </div>
</footer>`
}

export function mobileBar() {
  return `<div class="mobile-bar_component">
  <a class="button is-secondary" href="${SITE.phoneNewHref}"><span>Call ${SITE.phoneNew}</span></a>
  <a class="button is-primary" href="#invitation"><span>Request Consultation</span></a>
</div>`
}

/* ---------- the paid-traffic chrome (lib/lp.mjs): logo, phone, one button. No menu, no drawer. ----------
   `id="nav"` and `#navProgress` stay: js/90-boot.js drives both on every page. */
export function lpNav(chrome) {
  const book = chrome.role === 'landing' ? `
      <a class="button is-primary nav_button is-magnetic" href="${chrome.book}"><span>Book a Consultation</span></a>` : ''
  return `<header class="nav_component is-landing-header" id="nav">
  <div class="nav_progress-bar" aria-hidden="true"><i id="navProgress"></i></div>
  <div class="container-xlarge nav_container">
    <a class="nav_logo" href="${chrome.role === 'landing' ? '#top' : chrome.home}" aria-label="West LA Implants">
      <img src="/media/img/logo-icon-white.png" alt=""><span class="brand_wordmark">West LA <em>Implants</em></span>
    </a>
    <div class="nav_actions">
      <a class="nav_phone" href="${SITE.phoneAdsHref}">${SITE.phoneAds}</a>${book}
    </div>
  </div>
</header>`
}

export function lpMobileBar(chrome) {
  if (chrome.role !== 'landing') return ''
  return `<div class="mobile-bar_component">
  <a class="button is-secondary" href="${SITE.phoneAdsHref}"><span>Call Now</span></a>
  <a class="button is-primary" href="${chrome.book}"><span>Book a Consultation</span></a>
</div>`
}

const GSAP = ['gsap', 'ScrollTrigger', 'ScrollToPlugin', 'ScrollSmoother', 'SplitText', 'Observer']

/** Wrap a rendered body in the shell. `seo` is the object js/80-seo.js reads. */
export function page({ slug, title, description, body, seo, bodyClass = '', chrome = null }) {
  const lp = chrome && chrome.type === 'lp'
  const current = slug === 'index' ? '/index.html' : `/${slug}.html`
  const seoB64 = Buffer.from(JSON.stringify(seo), 'utf8').toString('base64')
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description.replace(/"/g, '&quot;')}">
<link rel="canonical" href="${seo.canonical}">${seo.noindex ? `
<meta name="robots" content="${seo.robots || 'noindex, nofollow'}">` : ''}
<link rel="icon" href="/media/img/logo-icon-dark.png">
<link rel="stylesheet" href="/assets/site.css">
<!-- GSAP is vendored: Instatic's CSP is script-src 'self', so no CDN.
     The runtime registers plugins at the END of <body>, never here. -->
${GSAP.map((f) => `<script src="/assets/gsap/${f}.min.js"></script>`).join('\n')}
</head>
<body${bodyClass || lp ? ` class="${[bodyClass, lp ? 'is-landing-page' : ''].filter(Boolean).join(' ')}"` : ''}>

<div class="cursor_component" id="cursor" aria-hidden="true"></div>

${lp ? lpNav(chrome) : nav(current)}

${lp ? '' : drawer()}

<div id="smooth-wrapper"><div id="smooth-content">
<main data-seo="${seoB64}">

${body}

</main>

${lp ? chrome.foot : footer()}

</div></div><!-- /smooth -->

${lp ? lpMobileBar(chrome) : mobileBar()}

<script src="/assets/site.js"></script>
</body>
</html>
`
}
