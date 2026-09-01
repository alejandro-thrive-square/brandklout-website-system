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
import { makeChapters } from "./chapters.mjs";
import { splitLongform, ledeText, routeSections, extractInlineFaq, extractEmbeddedFaq } from "./longform.mjs";

export const LOGO = "/wp-content/uploads/2023/08/Dentist-Katy-TX-Logo-2.webp";
export const BOOKING = "https://www.flexbook.me/masonpark/1";

// Office hours as published in the site footer and on the homepage. NOTE: the
// doctor pages of the old site published a DIFFERENT set (Mon 9-7, Fri open).
// This is the set the rebuild uses throughout; the practice still has to rule.
export const HOURS = [
  ["Monday", "9am - 6pm"], ["Tuesday", "8am - 5pm"], ["Wednesday", "9am - 6pm"],
  ["Thursday", "8am - 5pm"], ["Friday", "Closed"], ["Saturday", "Closed"], ["Sunday", "Closed"],
];

// The short form the Figma utility bar carries, verbatim from the comps.
export const HOURS_SHORT = "Mon &amp; Wed 9-6 &middot; Tue &amp; Thu 8-5";

export const ACCREDITATIONS = [
  ["/wp-content/uploads/2023/08/kois-1.webp", "Kois Center"],
  ["/wp-content/uploads/2023/08/ssc-1.webp", "Seattle Study Club"],
  ["/wp-content/uploads/2023/08/aapd.webp", "American Academy of Pediatric Dentistry"],
  ["/wp-content/uploads/2023/08/agd-1.webp", "Academy of General Dentistry"],
  ["/wp-content/uploads/2023/08/abpd-1.webp", "American Board of Pediatric Dentistry - Board Certified"],
];

// The footer columns the Figma specifies: CARE / PATIENTS / HOURS beside the
// brand block. The old footer ran "Useful Links" and "Menu" side by side, which
// repeated four of the same destinations twice.
const FOOTER_CARE = [
  { label: "Cosmetic dentistry", href: "/services/cosmetic-dentistry/" },
  { label: "Children's dentistry", href: "/services/pediatric-dental-care/" },
  { label: "Invisalign", href: "/services/invisalign/" },
  { label: "Dental implants", href: "/services/dental-implant-placement/" },
  { label: "Emergency dentist", href: "/services/emergency-dentist/" },
  { label: "All services", href: "/our-services/" },
];
const FOOTER_PATIENTS = [
  { label: "New patients", href: "/patient-resources/" },
  { label: "Financing", href: "/financing/" },
  { label: "Dental savings plan", href: "/dental-savings-plan/" },
  { label: "Special offers", href: "/special-offers/" },
  { label: "Virtual consultation", href: "/virtual-consultation/" },
  { label: "FAQs", href: "/faq-page/" },
];

export function makePresentation(ctx) {
  const {
    esc, img, link, rewrite, demoteH1, normaliseHeadings, fixRunOn, softenCaps, stripBoilerplate,
    titleOf, labelFor, routeOf, read, NAV, FOOTER_LINKS, PRACTICE, SERVICE_SLUGS,
    NAV_LABELS, SITE_URL,
  } = ctx;

  const C = makeComponents({ esc, img, link });
  const K = makeChapters({ esc, img, link, C, PRACTICE });

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

  // The utility bar carries the three facts a visitor looks for before anything
  // else — where, when, and what number to ring. Figma runs it full width above
  // the header; kept, at one line.
  const chromeHeader = () => `<a class="visually-hidden" href="#main">Skip to content</a>
<div class="topbar_component">
  <span><a href="${esc(PRACTICE.maps)}" target="_blank" rel="noopener">${esc(PRACTICE.street)}, ${esc(PRACTICE.city)} ${esc(PRACTICE.region)}</a></span>
  <span class="topbar_note">${HOURS_SHORT} &middot; Fri&ndash;Sun closed</span>
  <span><a href="${PRACTICE.phoneHref}">${esc(PRACTICE.phone)}</a></span>
</div>
<header class="navbar_component">
  <div class="padding-global"><div class="container-xlarge">
    <div class="navbar_container">
      <a class="navbar_logo-link" href="/" aria-label="${esc(PRACTICE.name)} home">
        ${img(LOGO, PRACTICE.name, { sizes: "192px", cls: "navbar_logo", eager: true, w: 406, h: 156 })}
      </a>
      <nav class="navbar_menu" id="navbar-menu" aria-label="Main">${navList(NAV, true)}</nav>
      <div class="navbar_actions">
        <a class="navbar_phone" href="${PRACTICE.phoneHref}">${esc(PRACTICE.phone)}</a>
        ${C.button({ label: "Book", href: BOOKING, external: true })}
      </div>
      <!-- The three bars are drawn in CSS, NOT as an inline svg child. Instatic's
           importer maps a button onto its base.button module, which carries a text
           label and takes NO child nodes - so a child svg is silently dropped at
           import and the live button renders as an empty box. Every other inline
           icon on the site survives; this is the one element that cannot hold one.
           See the .navbar_toggle rule in theme/site.css. -->
      <button class="navbar_toggle" type="button" aria-expanded="false" aria-controls="navbar-menu" aria-label="Menu"></button>
    </div>
  </div></div>
</header>
<button class="navbar_scrim" type="button" tabindex="-1" aria-hidden="true"></button>`;

  const footerList = (items) => `<ul class="footer_list">${items
    .map((l) => { const to = link(l.href); return to ? `<li><a href="${esc(to)}">${esc(l.label)}</a></li>` : ""; })
    .join("")}</ul>`;

  // The credential strip is NOT part of the footer. The comps put it high on the
  // homepage, where it answers "is this practice any good" while the hero is
  // still on screen; on inner pages it rides above the closing CTA (see
  // `pageCta`). Rendering it in the chrome would have put it below every
  // conversion point on the site.
  const chromeFooter = () => `
<footer class="footer_component section_footer">
  <div class="padding-global"><div class="container-xlarge"><div class="padding-section-large">
    <div class="footer_grid">
      <div>
        ${img(LOGO, PRACTICE.name, { sizes: "176px", cls: "footer_logo", w: 406, h: 156 })}
        <ul class="footer_list">
          <li><a href="${esc(PRACTICE.maps)}" target="_blank" rel="noopener">${esc(PRACTICE.street)}<br>${esc(PRACTICE.city)}, ${esc(PRACTICE.region)} ${esc(PRACTICE.postal)}</a></li>
          <li><a href="${PRACTICE.phoneHref}">${esc(PRACTICE.phone)}</a></li>
          <li><a href="mailto:${esc(PRACTICE.email)}">${esc(PRACTICE.email)}</a></li>
          <li><a href="${esc(PRACTICE.facebook)}" target="_blank" rel="noopener">Facebook</a></li>
        </ul>
      </div>
      <div>
        <h3 class="footer_heading">Care</h3>
        ${footerList(FOOTER_CARE)}
      </div>
      <div>
        <h3 class="footer_heading">Patients</h3>
        ${footerList(FOOTER_PATIENTS)}
      </div>
      <div>
        <h3 class="footer_heading">Hours</h3>
        ${C.hoursList(HOURS)}
      </div>
    </div>
    <div class="footer_legal">
      &copy; ${new Date().getFullYear()} ${esc(PRACTICE.name)}
      | <a href="/privacy-policy/">Privacy</a>
      | <a href="/terms-of-service/">Terms</a>
      | <a href="/cookie-policy/">Cookies</a>
      | <a href="/sitemap/">Sitemap</a>
      | ${FOOTER_LINKS.filter((l) => link(l.href)).slice(0, 3).map((l) => `<a href="${esc(link(l.href))}">${esc(l.label)}</a>`).join(" | ")}
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

  /** The closing block every inner page ends on, so no page dead-ends. */
  const pageCta = () => C.badgeStrip(ACCREDITATIONS) + "\n" + C.section({ name: "cta", bg: "paper", padding: "large", inner: C.split(
    `${C.eyebrow("Book a visit")}
     ${C.heading("One practice for the whole family")}
     ${C.spacer("small")}
     ${C.paragraph("Cosmetic and restorative care for adults, gentle first visits for kids, under one roof on Kingsland Boulevard.", { size: "medium" })}
     ${C.spacer("medium")}
     ${C.buttonGroup([
        { label: "Schedule online", href: BOOKING, external: true },
        { label: `Call ${PRACTICE.phone}`, href: PRACTICE.phoneHref, variant: "ghost" },
      ])}`,
    `<div class="card_component">
       <h2 class="heading-style-h4">Office hours</h2>
       ${C.hoursList(HOURS)}
     </div>`,
    { textWide: true },
  ) });

  // ------------------------------------------------------------- renderers
  /** A WordPress content page: header photo, then the article body and sidebar. */
  // =========================================================================
  // THE TREATMENT PAGE — 35 pages from one template.
  //
  // The old one was a hero, a breadcrumb, one column of 1,958 median words and
  // a sidebar. The client's note about the homepage applies here twice over:
  // big chunks of text do not convert. A visitor who came to find out what a
  // root canal involves had to read the whole page to learn whether it says.
  //
  // What makes it fixable is that the copy was ALREADY structured and the old
  // template discarded the structure: 479 h3 and 244 h4 across the set, a
  // median of 13 headings per page. site/longform.mjs cuts the body at them.
  // Nothing is rewritten, summarised or reordered; every character comes out in
  // the order it went in.
  //
  // Four chapters: the treatment, how a first visit works, what else is
  // offered, and the invitation. The first visit chapter is the same one the
  // homepage uses, because it is the same practice and the same four steps.
  // =========================================================================
  // =========================================================================
  // THE TREATMENT PAGE — 35 pages from one template.
  //
  // THE INFORMATION FLOW is copied from the reference the client's team called
  // "basically the perfect flow of information for a service page"
  // (01-content-intake/.tmp/preview.html). Its order is the argument: qualify
  // the reader, say what it is, say why this one, say what happens, compare the
  // alternatives, give the price, prove it, answer the objections, then ask.
  // The DESIGN and LAYOUT stay in this build's own direction, which is what the
  // client asked for.
  //
  // WHAT MADE THAT POSSIBLE WITHOUT WRITING A WORD. The old template poured a
  // median of 1,958 words into one column under a hero. But the copy was
  // already structured and the template discarded the structure: 472 sections
  // across the 35 pages. Routed by their own headings they fall into the
  // reference's beats almost exactly — 58 benefit sections on 31 pages, 52
  // questions on 26, 51 process on 28, 28 candidacy on 23, 16 comparisons, 13
  // on cost. site/longform.mjs does the cutting and the routing.
  //
  // Every section below is the practice's own copy, moved to where it does the
  // most work. A beat with nothing behind it is DROPPED, never invented: a page
  // with no cost section simply has no cost chapter.
  // =========================================================================
  const renderService = (d) => {
    const title = titleOf(d);

    // The pipeline, in order, and the order matters. `demoteH1` pushes the
    // body's own <h1> to <h2>; that heading is the page title again, which the
    // hero already shows, so it is dropped before the split runs.
    let body = fixRunOn(demoteH1(rewrite(d.html)));
    const flat = (x) => String(x).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
    body = body.replace(/^\s*<h2[^>]*>([\s\S]*?)<\/h2>/i, (whole, inner) => {
      const a = flat(inner), b = flat(title);
      // Same heading, or one is a prefix of the other: these titles run
      // "Oral Surgery in Katy, TX - Safe & Skilled..." against a page title of
      // "Oral Surgery in Katy, TX | Mason Park Dental".
      return a && (a === b || a.startsWith(b.slice(0, 24)) || b.startsWith(a.slice(0, 24))) ? "" : whole;
    });

    const { lede, sections } = splitLongform(body);
    const beat = routeSections(sections);

    // AN FAQ WRITTEN AS BODY COPY. 22 of the 35 pages carry one: a heading of
    // "Frequently Asked Questions" followed by a run of
    // <p><strong>1.Question?</strong><br>Answer</p>. That container routes to
    //  and renders as one more wall, which is the exact problem this pass
    // exists to remove, reappearing inside the fix. 126 questions were sitting
    // in there. Each container is replaced by its own rows, which then join the
    // Questions chapter with the ones that were already headings.
    // Two shapes, because whether the FAQ is its OWN section depends on which
    // heading level that page happens to use. Pages that use <h3> for sections
    // get the FAQ as a section; Invisalign uses <h2>, so its <h3>FAQ</h3> sits
    // inside another section and came back with two accordion rows while its
    // neighbours came back with twelve. Handling only the first shape recovers
    // 126 questions on 22 pages; handling both recovers 143 on 24.
    const inlineFaq = [];
    for (const key of Object.keys(beat)) {
      beat[key] = beat[key].filter((sec) => {
        const whole = extractInlineFaq(sec);
        if (whole) { inlineFaq.push(...whole); return false; }
        const embedded = extractEmbeddedFaq(sec.html);
        if (!embedded) return true;
        inlineFaq.push(...embedded.items);
        // The prose that came BEFORE the FAQ heading is ordinary body copy and
        // stays where it is. Only the questions move.
        sec.html = embedded.before;
        return Boolean(embedded.before.replace(/<[^>]+>/g, "").trim());
      });
    }
    const heroImg = d.featured?.src;
    const clean = softenCaps(title.replace(/\s*[|–—-]\s*Mason Park.*$/i, "").trim());

    // Renders a beat as its own chapter, or nothing at all when the page has no
    // section for it. `filter(Boolean)` at the end drops the empties.
    const beatChapter = ({ n, name, cls, id, theme, heading, lede: chapterLede, items, rail = false }) => {
      if (!items || !items.length) return "";
      // The contents rail is worth a column only when there is a list worth
      // reading. Once the other beats have taken their sections, a page can be
      // left with one or two here, and a rail listing a single entry beside a
      // narrow column is worse than no rail: it claims the page is navigable
      // and then proves it is not. Below four, this chapter uses the same split
      // frame every other beat uses.
      const useRail = rail && items.length >= 4;
      return K.chapter({
        n, name, cls, id, theme,
        inner: `
  ${useRail ? `<div class="wrap rg-head">
    ${K.tag(String(n).padStart(2, "0"), name)}
    <h2 data-split>${esc(heading)}</h2>
    ${chapterLede ? `<p class="pe-lede">${esc(chapterLede)}</p>` : ""}
  </div>` : ""}
  ${useRail
    ? K.longform({ lede: chapterLede ? "" : lede, sections: items })
    : `<div class="lf-layout lf-split"><div class="lf-aside">${K.tag(String(n).padStart(2, "0"), name)}<h2 data-split>${esc(heading)}</h2>${chapterLede ? `<p class="pe-lede">${esc(chapterLede)}</p>` : ""}</div><div class="lf-body text-rich-text">${items.map((sec) => `
      <section class="lf-section" id="${esc(sec.id)}"><h3>${esc(sec.title)}</h3>${sec.html}</section>`).join("")}</div></div>`}`,
      });
    };

    // The practice's own reviews, from the homepage's content file. Three, not
    // six: the reference puts proof here as reassurance, not as a reading task.
    const homeDoc = read("home");
    const rb = ((homeDoc && homeDoc.blocks) || []).filter((x) => x.section === 15);
    const reviews = [];
    const seen = new Set();
    for (let i = 0; i < rb.length && reviews.length < 3; i++) {
      if (rb[i].type !== "para") continue;
      const next = rb[i + 1];
      const quote = rb[i].text.trim().replace(/^[“”"'\s]+/, "").replace(/[“”"'\s]+$/, "");
      const author = next && next.type === "heading" ? next.text.replace(/^-\s*/, "") : "";
      const key = quote.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
      if (author && quote.length > 60 && quote.length < 260 && !seen.has(key)) {
        seen.add(key);
        reviews.push({ quote, author });
      }
    }

    let n = 0;
    return [
      // ---- beat 1 and 2: arrival, then the trust strip immediately under it
      K.arrival({
        n: n++, name: "Arrival", compact: true,
        image: heroImg || "/wp-content/uploads/2023/11/Dentist-in-Katy-Office.webp",
        alt: d.featured?.alt || clean,
        w: d.featured?.w, height: d.featured?.h,
        title: esc(clean),
        lede: ledeText(lede, d.description),
        actions: K.button({ label: "Book an appointment", href: BOOKING, large: true, external: true }),
      }),
      K.badges(ACCREDITATIONS),
      C.breadcrumb([
        { label: "Home", href: "/" },
        { label: "Services", href: "/our-services/" },
        { label: title },
      ]),

      // ---- beat 3: is this you
      beatChapter({
        n: n++, name: "Is this you", cls: "ch-qualify", id: "qualify",
        heading: "Is this the treatment you need?",
        items: beat.qualifier,
      }),

      // ---- beat 4: what it is. The bulk, and the only chapter with the rail.
      // A page with NO headings routes every beat empty, which dropped this
      // chapter and the lede with it — that is, the entire body. Two stub pages
      // (104 and 235 words) shipped carrying none of their own copy. When there
      // are no sections, the lede IS the page.
      (beat.body.length || beat.type.length)
        ? beatChapter({
            n: n++, name: "The Treatment", cls: "ch-treatment", id: "treatment",
            heading: "What it is, and what it involves.",
            items: [...beat.body, ...beat.type], rail: true,
          })
        : (lede ? K.chapter({
            n: n++, name: "The Treatment", cls: "ch-treatment", id: "treatment",
            inner: `
  <div class="wrap rg-head">
    ${K.tag(String(n - 1).padStart(2, "0"), "The Treatment")}
    <h2 data-split>What it is, and what it involves.</h2>
  </div>
  <div class="lf-layout is-solo"><div class="lf-body text-rich-text">${lede}</div></div>`,
          }) : ""),

      // ---- beat 5: why this one, and why here
      beatChapter({
        n: n++, name: "Why This One", cls: "ch-why", id: "why", theme: "warm",
        heading: "What it does for you.",
        items: [...beat.benefit],
      }),

      // ---- beat 6: what actually happens
      beatChapter({
        n: n++, name: "The Path", cls: "ch-process", id: "process",
        heading: "What happens, step by step.",
        items: beat.process,
      }),

      // ---- beat 7: the alternatives, honestly
      beatChapter({
        n: n++, name: "The Alternatives", cls: "ch-compare", id: "compare", theme: "warm",
        heading: "How it compares.",
        items: beat.compare,
      }),

      // ---- beat 8: the price, before the ask
      beatChapter({
        n: n++, name: "The Cost", cls: "ch-cost", id: "cost",
        heading: "What it costs, before it starts.",
        chapterLede: "Treatment is planned and priced in writing before any work begins. Cherry splits the balance at 0% APR with no hard credit check.",
        items: beat.cost,
      }),

      // ---- beat 9: proof
      reviews.length ? K.chapter({
        n: n++, name: "The Proof", cls: "ch-proof", id: "proof", theme: "warm",
        inner: `
  <div class="wrap rg-head">
    ${K.tag(String(n - 1).padStart(2, "0"), "The Proof")}
    <h2 data-split>What Katy families say about being here.</h2>
  </div>
  ${K.quoteRail(reviews, "serviceRail")}
  <div class="wrap pr-foot">${K.linkArrow({ label: "Read more reviews", href: "/patient-reviews/" })}</div>`,
      }) : "",

      // ---- beat 11: the questions, as the reference has them, near the end
      (beat.question.length || inlineFaq.length) ? K.chapter({
        n: n++, name: "Questions", cls: "ch-questions", id: "questions",
        inner: `
  <div class="wrap rg-head">
    ${K.tag(String(n - 1).padStart(2, "0"), "Questions")}
    <h2 data-split>Questions patients ask before they decide.</h2>
  </div>
  ${K.faqList([...beat.question.map((sec) => ({ question: sec.title, html: sec.html })), ...inlineFaq])}`,
      }) : "",

      // ---- beat 10 and 12: the soft option, then the ask
      K.chapter({
        n: n++, name: "The Invitation", cls: "ch-invitation", id: "invitation", theme: "dark",
        inner: `
  <div class="wrap iv-top">
    <div class="iv-copy">
      ${K.tag(String(n - 1).padStart(2, "0"), "The Invitation")}
      <h2 data-split>Ask about this one.</h2>
      <p class="iv-lede">Book a first visit and say what is bothering you. Nothing is started on the day you arrive, and the plan and the price come before the work does.</p>
      <div class="iv-actions">
        ${K.button({ label: "Book an appointment", href: BOOKING, large: true, external: true })}
        ${K.button({ label: PRACTICE.phone, href: PRACTICE.phoneHref, ghost: true, large: true })}
      </div>
      ${K.facts([
        ["Not ready to sit in a chair", `Send photographs and get an opinion first. <a href="/virtual-consultation/">Free virtual consult</a>.`],
        ["In pain today", `Call the practice. We keep same day slots. <a href="/services/emergency-dentist/">Emergency dentistry</a>.`],
        ["Paying for it", `0% APR through Cherry, no hard credit check. <a href="/financing/">Financing and insurance</a>.`],
        ["Hours", "Mon and Wed <b>9am to 6pm</b><br>Tue and Thu <b>8am to 5pm</b><br>Fri to Sun <b>Closed</b>"],
      ])}
    </div>
    <div class="iv-aside">
      <figure class="iv-shot">
        ${img("/wp-content/uploads/2023/11/Dentist-in-Katy-Office.webp", "The waiting room at Mason Park Dental of Katy", { sizes: "(max-width: 899px) 100vw, 42vw" })}
        <figcaption>Suite 104A, on the ground floor. Free parking at the door.</figcaption>
      </figure>
      ${relatedServices(d.slug) ? `<div class="iv-related">${relatedServices(d.slug)}</div>` : ""}
    </div>
  </div>`,
      }),
    ].filter(Boolean).join(String.fromCharCode(10));
  };

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
${C.section({ name: "article", padding: "large", inner: `
  <div class="article_layout">
    <article>${(() => { const body = normaliseHeadings(fixRunOn(demoteH1(rewrite(d.html))));
      return C.richText(body, { wide: body.includes("<table") }); })()}</article>
    ${sidebarCta(isService ? relatedServices(d.slug) : "")}
  </div>` })}
${pageCta()}`;
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
${body}
${pageCta()}`;
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

  // `motion` opts a page into the journey layer: GSAP plus theme/journey.js,
  // and the `has-journey` body class that lets the header overlay a full bleed
  // hero instead of sitting on a white strip above it. Only pages built as
  // chapters pass it, so the other seventy pay nothing.
  const layout = ({ title, description, route, body, ogImage, motion = false }) => `<!doctype html>
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
<meta name="theme-color" content="#8c6349">
<link rel="icon" href="/assets/uploads/2023/08/Dentist-Katy-TX-Logo-2.webp">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<!-- The three families used to be an @import at the top of site.css. They moved
     here when the fluid root took that position: an @import is only valid before
     any other rule in a sheet. A link is faster regardless, because an @import
     cannot begin downloading until the sheet holding it has arrived and parsed. -->
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Karla:wght@500;700&amp;family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;1,6..72,300;1,6..72,400&amp;family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700&amp;display=swap">
<link rel="stylesheet" href="/assets/site.css">
<script type="application/ld+json">${jsonLd(route)}</script>
</head>
<body${motion ? ' class="has-journey"' : ""}>
${pageBody(body)}
<script src="/assets/site.js" defer></script>
${motion ? `<script src="/assets/gsap/gsap.min.js" defer></script>
<script src="/assets/gsap/ScrollTrigger.min.js" defer></script>
<script src="/assets/gsap/SplitText.min.js" defer></script>
<script src="/assets/journey.js" defer></script>` : ""}
</body>
</html>
`;

  return {
    C, chromeHeader, chromeFooter, renderEmbed, sidebarCta, relatedServices, pageCta,
    renderArticle, renderService, renderBlocks, pageBody, layout, HOURS, ACCREDITATIONS, BOOKING, LOGO,
  };
}
