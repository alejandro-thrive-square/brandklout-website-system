// Page chrome and the two generic renderers, composed entirely from
// site/components.mjs.
//
// build.mjs owns data: extraction, routes, assets, link rewriting, the demo
// stripper. This module owns markup. Nothing here reads the filesystem and
// nothing in build.mjs writes a tag, which is what keeps a change to how a card
// looks from turning into a change to how pages are resolved.
//
// `makePresentation(ctx)` binds to the build's helpers and config.

import { makeComponents } from "./components.mjs";

export const LOGO = "/wp-content/uploads/2023/08/Dentist-Katy-TX-Logo-2.webp";
export const BOOKING = "https://www.flexbook.me/masonpark/1";

// Office hours as published in the site footer and on the homepage. NOTE: the
// doctor pages of the old site published a DIFFERENT set (Mon 9-7, Fri open).
// This is the set the rebuild uses throughout; the practice still has to rule.
export const HOURS = [
  ["Monday", "9am - 6pm"], ["Tuesday", "8am - 5pm"], ["Wednesday", "9am - 6pm"],
  ["Thursday", "8am - 5pm"], ["Friday", "Closed"], ["Saturday", "Closed"], ["Sunday", "Closed"],
];

export const ACCREDITATIONS = [
  ["/wp-content/uploads/2023/08/aapd.webp", "American Academy of Pediatric Dentistry"],
  ["/wp-content/uploads/2023/08/abpd-1.webp", "American Board of Pediatric Dentistry - Board Certified"],
  ["/wp-content/uploads/2023/08/agd-1.webp", "Academy of General Dentistry"],
  ["/wp-content/uploads/2023/08/kois-1.webp", "Kois Center"],
  ["/wp-content/uploads/2023/08/ssc-1.webp", "Seattle Study Club"],
];

const FOOTER_MENU = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/our-services/" },
  { label: "About Us", href: "/about-us/" },
  { label: "Special Offers", href: "/special-offers/" },
  { label: "Contacts", href: "/contacts/" },
];

export function makePresentation(ctx) {
  const {
    esc, img, link, rewrite, demoteH1, normaliseHeadings, fixRunOn, softenCaps, stripBoilerplate,
    titleOf, labelFor, routeOf, NAV, FOOTER_LINKS, PRACTICE, SERVICE_SLUGS,
    NAV_LABELS, SITE_URL,
  } = ctx;

  const C = makeComponents({ esc, img, link });

  // ---------------------------------------------------------------- navbar
  // Menu entries pointing at something this build does not produce (the blog)
  // are dropped rather than rendered as a link into a 404.
  const navList = (items, top = false) => {
    const rendered = items.map((it) => {
      const to = link(it.href);
      const kids = it.children?.length ? navList(it.children) : "";
      if (!to) return kids ? `<li class="navbar_item">${kids}</li>` : "";
      return `<li class="${C.cx("navbar_item", kids && "has-dropdown")}">` +
        `<a class="navbar_link" href="${esc(to)}">${esc(it.label)}</a>${kids}</li>`;
    }).filter(Boolean).join("");
    if (!rendered) return "";
    return top
      ? `<ul class="navbar_menu-list">${rendered}</ul>`
      : `<ul class="navbar_dropdown-list">${rendered}</ul>`;
  };

  const chromeHeader = () => `<a class="visually-hidden" href="#main">Skip to content</a>
<div class="topbar_component">
  <span>Dentist Katy | ${esc(PRACTICE.street)} | ${esc(PRACTICE.city)}, ${esc(PRACTICE.region)} ${esc(PRACTICE.postal)} | </span>
  <a href="${PRACTICE.phoneHref}">${esc(PRACTICE.phone)}</a>
</div>
<header class="navbar_component">
  <div class="padding-global"><div class="container-large">
    <div class="navbar_container">
      <a class="navbar_logo-link" href="/" aria-label="${esc(PRACTICE.name)} home">
        ${img(LOGO, PRACTICE.name, { sizes: "185px", cls: "navbar_logo", eager: true, w: 406, h: 156 })}
      </a>
      <nav class="navbar_menu" id="navbar-menu" aria-label="Main">${navList(NAV, true)}</nav>
      <div class="navbar_actions">
        <a class="navbar_phone" href="${PRACTICE.phoneHref}">${esc(PRACTICE.phone)}</a>
        ${C.button({ label: "Schedule Online", href: BOOKING, variant: "slate", external: true })}
      </div>
      <button class="navbar_toggle" type="button" aria-expanded="false" aria-controls="navbar-menu" aria-label="Menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
      </button>
    </div>
  </div></div>
</header>
<button class="navbar_scrim" type="button" tabindex="-1" aria-hidden="true"></button>`;

  const chromeFooter = () => `
${C.section({ name: "contact-band", bg: "tan", padding: "medium", inner: `
  <div class="info-band_component layout-grid is-2col">
    <div>
      <h2 class="info-band_title">Contact Us</h2>
      <p>Dentist Katy</p>
      <p>${esc(PRACTICE.street)},<br>${esc(PRACTICE.city)}, ${esc(PRACTICE.region)} ${esc(PRACTICE.postal)}</p>
      <p><a href="${PRACTICE.phoneHref}">Call: ${esc(PRACTICE.phone)}</a></p>
    </div>
    <div>
      <h2 class="info-band_title">Office Hours</h2>
      ${HOURS.map(([d, t]) => `<p>${d}: ${t}</p>`).join("")}
    </div>
  </div>` })}
${C.badgeStrip(ACCREDITATIONS)}
<footer class="footer_component section_footer">
  <div class="padding-global"><div class="container-large"><div class="padding-section-large">
    <div class="footer_grid">
      <div>
        ${img(LOGO, PRACTICE.name, { sizes: "165px", cls: "footer_logo", w: 406, h: 156 })}
        <p class="text-size-small">Comprehensive family, cosmetic and restorative dentistry in Katy, Texas.</p>
      </div>
      <div>
        <h3 class="footer_heading">Useful Links</h3>
        <ul class="footer_list">${FOOTER_LINKS.map((l) => { const to = link(l.href); return to ? `<li><a href="${esc(to)}">${esc(l.label)}</a></li>` : ""; }).join("")}</ul>
      </div>
      <div>
        <h3 class="footer_heading">Menu</h3>
        <ul class="footer_list">${FOOTER_MENU.map((l) => `<li><a href="${esc(link(l.href) || l.href)}">${esc(l.label)}</a></li>`).join("")}</ul>
      </div>
      <div>
        <h3 class="footer_heading">Contact Us</h3>
        <ul class="footer_list">
          <li><a href="${esc(PRACTICE.maps)}" target="_blank" rel="noopener">${esc(PRACTICE.street)}<br>${esc(PRACTICE.city)}, ${esc(PRACTICE.region)} ${esc(PRACTICE.postal)}</a></li>
          <li><a href="${PRACTICE.phoneHref}">${esc(PRACTICE.phone)}</a></li>
          <li><a href="${esc(PRACTICE.facebook)}" target="_blank" rel="noopener">Facebook</a></li>
        </ul>
      </div>
    </div>
    <div class="footer_legal">
      &copy; ${new Date().getFullYear()} ${esc(PRACTICE.name)} | <a href="${PRACTICE.phoneHref}">${esc(PRACTICE.phone)}</a>
      | ${esc(PRACTICE.street)}, ${esc(PRACTICE.city)}, ${esc(PRACTICE.region)} ${esc(PRACTICE.postal)}
      | <a href="/privacy-policy/">Privacy Policy</a> | <a href="/terms-of-service/">Terms of Service</a>
    </div>
  </div></div></div>
</footer>
<a class="callbar_component" href="${PRACTICE.phoneHref}">Call ${esc(PRACTICE.phone)}</a>`;

  // ---------------------------------------------------------------- embeds
  // Only two third-party embeds survive: the practice's Maps pin and its own
  // forms. Everything the compromised install loaded is deliberately dropped.
  const renderEmbed = (src = "") => {
    if (/google\.com\/maps/.test(src)) return C.embed(src, { title: `Map to ${PRACTICE.name}` });
    if (/leadconnectorhq\.com\/widget\/form/.test(src)) return C.embed(src, { title: "Request an appointment", form: true });
    if (/(form\.)?123formbuilder\.com/.test(src)) return C.embed(src, { title: "Send us your details", form: true });
    return "";
  };

  const sidebarCta = (extra = "") => `<aside>
  <div class="sidebar_component">
    <h2 class="heading-style-h4">Book a visit</h2>
    <p class="text-size-small">New and existing patients welcome. Call the practice or request a time online.</p>
    ${C.button({ label: "Request an appointment", href: BOOKING, external: true })}
    <p><a class="phone-link_component" href="${PRACTICE.phoneHref}">${esc(PRACTICE.phone)}</a></p>
    ${extra}
  </div>
</aside>`;

  const relatedServices = (current) => {
    const pool = SERVICE_SLUGS.filter((s) => s !== current && NAV_LABELS.has(routeOf(s)));
    const start = Math.max(0, pool.indexOf(current));
    const items = [...pool.slice(start), ...pool.slice(0, start)].slice(0, 8);
    return `<h2 class="heading-style-h4">More services</h2>
    <ul class="sidebar_list">${items.map((s) => `<li><a href="${routeOf(s)}">${esc(labelFor(s))}</a></li>`).join("")}</ul>
    <p><a href="/our-services/">All services</a></p>`;
  };

  // ------------------------------------------------------------- renderers
  /** A WordPress content page: header photo, then the article body and sidebar. */
  const renderArticle = (d) => {
    const title = titleOf(d);
    const isService = SERVICE_SLUGS.includes(d.slug);
    const trail = [{ label: "Home", href: "/" }];
    if (isService) trail.push({ label: "Services", href: "/our-services/" });
    trail.push({ label: title });

    const hero = d.featured?.src
      ? C.heroOverlay({ src: d.featured.src, alt: d.featured.alt || title, eyebrow: isService ? "Katy, TX" : "", title, w: d.featured.w, h: d.featured.h })
      : C.heroPlain({ eyebrow: isService ? "Katy, TX" : "", title, text: d.description });

    return `${hero}
${C.breadcrumb(trail)}
${C.section({ name: "article", padding: "small", inner: `
  <div class="article_layout">
    <article>${(() => { const body = normaliseHeadings(fixRunOn(demoteH1(rewrite(d.html))));
      return C.richText(body, { wide: body.includes("<table") }); })()}</article>
    ${sidebarCta(isService ? relatedServices(d.slug) : "")}
  </div>` })}`;
  };

  /** An Elementor page with no hand-written template: replay the blocks. */
  const renderBlocks = (d) => {
    const title = titleOf(d);
    const norm = (t) => String(t || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    let blocks = stripBoilerplate(d.blocks || [])
      .filter((b) => !(b.type === "heading" && norm(b.text) === norm(title)));

    // These pages open with a full-width header image the theme showed under
    // the title. Left inline it reads as a stray stock photo mid-article, so it
    // is promoted to the hero - which is what it was.
    const firstSection = blocks.length ? blocks[0].section : null;
    const firstBlocks = blocks.filter((b) => b.section === firstSection);
    let heroImage = null;
    if (firstBlocks.length === 1 && firstBlocks[0].type === "image") {
      heroImage = firstBlocks[0];
      blocks = blocks.filter((b) => b !== heroImage);
    }

    // Elementor sections are layout seams, not content seams. Banding alternate
    // ones reads as design on a short page and as a zebra on a 20-item FAQ
    // list, so long pages render as one column and let the headings carry it.
    const sectionCount = new Set(blocks.map((b) => b.section)).size;
    const banded = sectionCount <= 3;

    const chunks = [];
    let current = { section: null, html: "" };
    const flush = () => { if (current.html) chunks.push(current); current = { section: null, html: "" }; };

    for (const b of blocks) {
      if (banded && b.section !== current.section) { flush(); current.section = b.section; }
      switch (b.type) {
        case "heading": {
          // "Dentist Katy, TX" is an eyebrow upstream, not a section heading.
          if (/^dentist\s+(in\s+)?katy(,?\s*(tx|texas))?$/i.test(b.text.trim())) {
            current.html += `<p class="text-style-eyebrow">${esc(b.text)}</p>`;
            break;
          }
          const lv = Math.min(Math.max(b.level, 2), 6);
          current.html += `<h${lv} class="heading-style-h${lv}">${esc(softenCaps(b.text))}</h${lv}>`;
          break;
        }
        case "para": current.html += fixRunOn(rewrite(b.html)) || `<p>${esc(fixRunOn(b.text))}</p>`; break;
        case "list": current.html += `<${b.ordered ? "ol" : "ul"}>${b.items.map((i) => `<li>${esc(i)}</li>`).join("")}</${b.ordered ? "ol" : "ul"}>`; break;
        case "image": current.html += img(b.src, b.alt, { sizes: "(max-width: 999px) 100vw, 700px", w: b.w, h: b.h }); break;
        case "cta": { const to = link(b.href); if (to) current.html += C.button({ label: b.text, href: to }); break; }
        case "table": current.html += rewrite(b.html); break;
        case "faq": current.html += C.faqItem({ question: b.question, html: rewrite(b.html) }); break;
        case "embed": current.html += renderEmbed(b.src); break;
        default: break;
      }
    }
    flush();

    // A chunk holding nothing but an eyebrow renders as a band of empty colour.
    // Fold it forward into the chunk that it introduces.
    const isEyebrowOnly = (html) => /^\s*<p class="text-style-eyebrow">[^<]*<\/p>\s*$/.test(html);
    for (let i = chunks.length - 2; i >= 0; i--) {
      if (isEyebrowOnly(chunks[i].html)) {
        chunks[i + 1].html = chunks[i].html + chunks[i + 1].html;
        chunks.splice(i, 1);
      }
    }
    if (chunks.length && isEyebrowOnly(chunks[chunks.length - 1].html)) chunks.pop();

    const body = banded
      ? chunks.map((c, i) => C.section({
          name: "content", bg: i % 2 === 1 ? "paper" : "",
          inner: C.richText(normaliseHeadings(c.html), { wide: c.html.includes("<table") }),
        })).join("\n")
      : (() => {
          const all = chunks.map((c) => c.html).join("");
          return C.section({ name: "content", inner: C.richText(normaliseHeadings(all), { wide: all.includes("<table") }) });
        })();

    const hero = heroImage
      ? C.heroOverlay({ src: heroImage.src, alt: heroImage.alt || title, eyebrow: `${PRACTICE.city}, ${PRACTICE.region}`, title, w: heroImage.w, h: heroImage.h })
      : C.heroPlain({ eyebrow: `${PRACTICE.city}, ${PRACTICE.region}`, title, text: d.description });

    return `${hero}
${C.breadcrumb([{ label: "Home", href: "/" }, { label: title }])}
${body}`;
  };

  // ---------------------------------------------------------------- layout
  const jsonLd = (route) => JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Dentist",
    name: PRACTICE.name,
    url: SITE_URL + route,
    telephone: PRACTICE.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: PRACTICE.street, addressLocality: PRACTICE.city,
      addressRegion: "Texas", postalCode: PRACTICE.postal, addressCountry: "US",
    },
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Wednesday"], opens: "09:00", closes: "18:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Tuesday", "Thursday"], opens: "08:00", closes: "17:00" },
    ],
    sameAs: [PRACTICE.facebook],
  });

  /** The shared body, without the document shell. This is what Instatic wants:
   *  it owns the head, and CSS/JS are site-wide code assets. */
  const pageBody = (body) => `<div class="page-wrapper">
${chromeHeader()}
<main class="main-wrapper" id="main">
${body}
</main>
${chromeFooter()}
</div>`;

  const layout = ({ title, description, route, body, ogImage }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description || "")}">
<link rel="canonical" href="${esc(SITE_URL + route)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description || "")}">
<meta property="og:url" content="${esc(SITE_URL + route)}">
${ogImage ? `<meta property="og:image" content="${esc(SITE_URL + ogImage)}">` : ""}
<meta name="theme-color" content="#00bde0">
<link rel="icon" href="/assets/uploads/2023/08/Dentist-Katy-TX-Logo-2.webp">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="/assets/site.css">
<script type="application/ld+json">${jsonLd(route)}</script>
</head>
<body>
${pageBody(body)}
<script src="/assets/site.js" defer></script>
</body>
</html>
`;

  return {
    C, chromeHeader, chromeFooter, renderEmbed, sidebarCta, relatedServices,
    renderArticle, renderBlocks, pageBody, layout, HOURS, ACCREDITATIONS, BOOKING, LOGO,
  };
}
