// Reusable components for the Mason Park rebuild.
//
// Every page composes these; no page hand-writes structural markup. Each
// component returns a string of Client-First markup and owns exactly one block
// of CSS in theme/site.css, so a change to how a card looks happens once.
//
// Naming follows Client-First: utilities are hyphenated and shared
// (`padding-global`, `heading-style-h2`), component classes use the underscore
// (`doctor-card_image`). Nothing here emits an inline style or a bare tag name -
// both collide site-wide once this markup is pasted into a builder.
//
// `makeComponents(h)` binds the library to the build's helpers (escaping, asset
// resolution, link rewriting) so components never reach for globals.
//
// v2 (2026-08-28): retooled for the Figma design system. The components added
// here — heroSplit, factStrip, propCard, svcGroup, reviewLockup, stepList,
// faqLayout, financePanel, ctaSplit, quoteBand — are the homepage's actual
// furniture. The comps compose that page as a stack of interchangeable
// full-width bands; these are shaped so each section has a job the one above it
// does not.

import { icon as svgIcon } from "./icons.mjs";

export function makeComponents(h) {
  const { esc, img, link } = h;

  // ------------------------------------------------------------- primitives
  const cx = (...parts) => parts.filter(Boolean).join(" ");

  /** The Client-First section shell: section_ > padding-global > container > padding-section. */
  const section = ({ name = "content", bg = "", container = "large", padding = "large", inner = "", raw = false }) => {
    const body = raw ? inner : `<div class="${cx("padding-section-" + padding)}">${inner}</div>`;
    return `<section class="${cx("section_" + name, bg && "background-color-" + bg)}">
  <div class="padding-global">
    <div class="container-${container}">
      ${body}
    </div>
  </div>
</section>`;
  };

  /** A section whose content must run full-bleed (hero images, badge strips). */
  const sectionFull = ({ name = "content", bg = "", inner = "" }) =>
    `<section class="${cx("section_" + name, bg && "background-color-" + bg)}">${inner}</section>`;

  const spacer = (size = "medium") => `<div class="spacer-${size}"></div>`;

  const eyebrow = (text) => (text ? `<p class="text-style-eyebrow">${esc(text)}</p>` : "");

  const heading = (text, { level = 2, style = null } = {}) =>
    text ? `<h${level} class="heading-style-h${style || level}">${esc(text)}</h${level}>` : "";

  const paragraph = (text, { size = "regular" } = {}) =>
    text ? `<p class="text-size-${size}">${esc(text)}</p>` : "";

  const button = ({ label, href, variant = "", external = false }) => {
    const to = link(href) || href;
    if (!to || !label) return "";
    const ext = external || (/^https?:/i.test(to) && !to.includes("bestdentistinkatytx.com"));
    return `<a class="${cx("button", variant && "is-" + variant)}" href="${esc(to)}"` +
      `${ext ? ' target="_blank" rel="noopener"' : ""}>${esc(label)}</a>`;
  };

  const buttonGroup = (buttons = []) => {
    const rendered = buttons.map((b) => (typeof b === "string" ? b : button(b))).filter(Boolean);
    return rendered.length ? `<div class="button-group">${rendered.join("")}</div>` : "";
  };

  /** The quiet underlined link that closes a card. */
  const linkArrow = ({ label, href, external = false }) => {
    const to = link(href) || href;
    if (!to || !label) return "";
    const ext = external || (/^https?:/i.test(to) && !to.includes("bestdentistinkatytx.com"));
    return `<a class="link-arrow" href="${esc(to)}"${ext ? ' target="_blank" rel="noopener"' : ""}>` +
      `${esc(label)}<span aria-hidden="true">&rarr;</span></a>`;
  };

  // `wide` drops the reading measure - use it for table-led content.
  const richText = (html, { wide = false } = {}) =>
    html ? `<div class="${cx("text-rich-text", wide && "is-wide")}">${html}</div>` : "";

  const notice = (html) => (html ? `<div class="notice_component">${html}</div>` : "");

  // -------------------------------------------------------------- headings
  const sectionHeading = ({ eyebrow: eb, title, text, centered = false, level = 2 }) => {
    const inner = [eyebrow(eb), heading(title, { level }), text ? paragraph(text, { size: "medium" }) : ""]
      .filter(Boolean).join("");
    return inner ? `<div class="${cx("section-heading_component", centered && "is-centered")}">${inner}</div>` : "";
  };

  // ----------------------------------------------------------------- heroes
  /**
   * The homepage hero. The comps run a symmetrical 50/50 split on white; this is
   * asymmetric, the photograph carries to the right edge, and the facts a first-
   * time visitor actually wants — how long the practice has been here, what the
   * rating is, who it treats — sit under the buttons instead of three sections
   * further down.
   */
  const heroSplit = ({ eyebrow: eb, title, lede, actions = "", image, alt, w, h: height, plate, facts = [] }) =>
    sectionFull({ name: "hero", inner: `<div class="hero_component hero_split">
    <div class="hero_copy">
      ${eyebrow(eb)}
      <h1 class="heading-style-h1">${esc(title)}</h1>
      ${lede ? `<p class="hero_lede">${esc(lede)}</p>` : ""}
      ${actions ? `<div class="hero_actions">${actions}</div>` : ""}
      ${facts.length ? factStrip(facts) : ""}
    </div>
    <div class="hero_frame">
      ${image ? img(image, alt, { sizes: "(max-width: 999px) 100vw, 55vw", eager: true, w, h: height }) : ""}
      ${plate ? `<p class="hero_plate"><strong>${esc(plate.value)}</strong>${esc(plate.label)}</p>` : ""}
    </div>
  </div>` });

  const factStrip = (facts = []) => `<div class="fact-strip_component">
    ${facts.map(([value, label]) => `<div class="fact-strip_item">
      <p class="fact-strip_value">${esc(value)}</p>
      <p class="fact-strip_label">${esc(label)}</p>
    </div>`).join("")}
  </div>`;

  /** Photo hero with the title laid over a scrim - inner pages with a picture. */
  const heroOverlay = ({ src, alt, eyebrow: eb, title, w, h: height }) => sectionFull({
    name: "hero", inner: `<div class="hero_component is-overlay">
    ${img(src, alt || title, { sizes: "100vw", eager: true, cls: "hero_image", w, h: height })}
    <div class="hero_overlay">
      <div class="padding-global"><div class="container-large">
        ${eyebrow(eb)}${heading(title, { level: 1 })}
      </div></div>
    </div>
  </div>`,
  });

  /** Title-only hero on the warm tint, for pages with no header photograph. */
  const heroPlain = ({ eyebrow: eb, title, text }) => `<section class="section_hero hero_component is-plain">
  <div class="padding-global"><div class="container-large"><div class="padding-section-large">
    ${eyebrow(eb)}${heading(title, { level: 1 })}${text ? `<div class="spacer-small"></div>${paragraph(text, { size: "medium" })}` : ""}
  </div></div></div>
</section>`;

  /** Full-width photograph inset to the container. */
  const heroMedia = ({ src, alt, w, h: height }) => section({
    name: "hero", padding: "small",
    inner: `<div class="hero_media">${img(src, alt, { sizes: "(max-width: 1400px) 100vw, 1360px", eager: true, w, h: height })}</div>`,
  });

  const breadcrumb = (trail = []) => `<div class="padding-global"><div class="container-large">
  <nav class="breadcrumb_component" aria-label="Breadcrumb">
    ${trail.map((t) => t.href
      ? `<span class="breadcrumb_item"><a href="${esc(link(t.href) || t.href)}">${esc(t.label)}</a></span>`
      : `<span class="breadcrumb_item">${esc(t.label)}</span>`).join("")}
  </nav>
</div></div>`;

  // ------------------------------------------------------------------ cards
  const card = ({ title, text, html, href, meta, level = 3 }) => {
    const inner = [
      heading(title, { level, style: 4 }),
      text ? paragraph(text) : "",
      html || "",
      meta ? `<p class="card_meta">${meta}</p>` : "",
    ].filter(Boolean).join("");
    const to = href ? (link(href) || href) : null;
    return to
      ? `<a class="card_component is-link" href="${esc(to)}">${inner}</a>`
      : `<div class="card_component">${inner}</div>`;
  };

  /**
   * The two audience panels. The comps call these "Value Prop Cards" — a heading,
   * a body and an image inside a beige rule. Leading with the photograph and
   * hanging the audience tag on it means the split between adult and child care
   * is legible before a word is read, which is the one thing this practice needs
   * a visitor to understand.
   */
  const propCard = ({ image, alt, tag, kids = false, title, text, linkLabel, href, w, h: height }) =>
    `<div class="prop-card_component">
    ${image ? `<div class="prop-card_media">
      ${img(image, alt, { sizes: "(max-width: 767px) 100vw, 44vw", w, h: height })}
      ${tag ? `<p class="${cx("prop-card_tag", kids && "is-kids")}">${esc(tag)}</p>` : ""}
    </div>` : ""}
    <div class="prop-card_body">
      ${heading(title, { level: 2, style: 3 })}
      ${text ? paragraph(text) : ""}
      ${linkLabel ? linkArrow({ label: linkLabel, href }) : ""}
    </div>
  </div>`;

  /** One treatment in the service index: icon, name, one line of plain English. */
  const serviceCard = ({ icon: name, label, text, href }) => {
    const to = link(href) || href;
    return `<a class="service-card_component" href="${esc(to)}">
    <span class="service-card_icon">${svgIcon(name)}</span>
    <h3 class="service-card_name">${esc(label)}</h3>
    ${text ? `<p class="service-card_text">${esc(text)}</p>` : ""}
  </a>`;
  };

  /**
   * Services, grouped. Fourteen identical tiles in one grid rank nothing and
   * make a visitor read every label to find the one they came for; a labelled
   * group answers "is this practice for me" in one glance.
   */
  const svcGroup = ({ label, cols = 4, items = [] }) => `<div class="svc-group_component">
    <h3 class="svc-group_label">${esc(label)}</h3>
    ${grid(cols, items.map(serviceCard))}
  </div>`;

  const doctorCard = ({ image, name, role, href, blurb }) => {
    const to = link(href) || href;
    return `<a class="doctor-card_component" href="${esc(to)}">
    ${img(image, name, { sizes: "(max-width: 767px) 100vw, 33vw", cls: "doctor-card_image" })}
    <h3 class="doctor-card_name heading-style-h3">${esc(name)}</h3>
    <p class="doctor-card_role">${esc(role)}</p>
    ${blurb ? `<p class="text-size-small">${esc(blurb)}</p>` : ""}
  </a>`;
  };

  /**
   * The rating lockup. The comps specify a screenshot of the Google reviews
   * panel; a screenshot cannot be read aloud, does not reflow on a phone and is
   * wrong the day the rating moves, so the same information is markup.
   */
  const reviewLockup = ({ score = "4.9", count = "" }) => `<div class="review-lockup_component">
    <p class="review-card_stars" aria-hidden="true">&#9733;&#9733;&#9733;&#9733;&#9733;</p>
    <p class="review-lockup_score">${esc(score)}</p>
    <p class="review-lockup_label">${esc(count ? `out of 5 across ${count} Google reviews` : "average rating on Google")}</p>
  </div>`;

  const reviewCard = ({ quote, author }) => `<div class="review-card_component">
    <p class="review-card_stars" aria-label="Five out of five stars">&#9733;&#9733;&#9733;&#9733;&#9733;</p>
    <blockquote class="review-card_quote">${esc(quote)}</blockquote>
    <cite class="review-card_author">${esc(author)}</cite>
  </div>`;

  const reviewList = (reviews = []) =>
    `<div class="review-list_component">${reviews.map(reviewCard).join("")}</div>`;

  const offerCard = ({ price, title, body = [] }) => `<div class="offer-card_component">
    ${price ? `<p class="offer-card_price">${esc(price)}</p>` : ""}
    <h3 class="offer-card_title heading-style-h4">${esc(title)}</h3>
    <div class="offer-card_body">${body.filter(Boolean).map((t) => `<p>${esc(t)}</p>`).join("")}</div>
  </div>`;

  /** Numbered steps. Figma: Newsreader numeral + Nunito step text on one row. */
  const stepList = (steps = []) => `<ol class="step-list_component">
    ${steps.map((s, i) => `<li class="step-card_component">
      <span class="step-card_numeral">${i + 1}</span>
      <span class="heading-style-h4">${esc(s)}</span>
    </li>`).join("")}
  </ol>`;

  const faqItem = ({ question, html }) => `<details class="faq_item">
    <summary class="faq_question">${esc(question)}</summary>
    <div class="faq_answer">${html || ""}</div>
  </details>`;

  const faqList = (items = []) => items.map(faqItem).join("");

  /** Sticky heading beside the accordion, so the question set keeps its label. */
  const faqLayout = ({ eyebrow: eb, title, text, aside = "", items = [] }) => `<div class="faq_layout">
    <div class="faq_intro">
      ${eyebrow(eb)}${heading(title)}
      ${text ? `<div class="spacer-small"></div>${paragraph(text)}` : ""}
      ${aside}
    </div>
    <div>${faqList(items)}</div>
  </div>`;

  /** The quiet full-width band that carries one idea and nothing else. */
  const quoteBand = ({ eyebrow: eb, title, text }) => `<div class="quote-band_component">
    <div>${eyebrow(eb)}${heading(title)}</div>
    <p class="quote-band_text">${esc(text)}</p>
  </div>`;

  /** Financing: the copy panel on sand beside the partner lockup on white. */
  const financePanel = ({ eyebrow: eb, title, text, actions = "", logo, logoAlt, note }) =>
    `<div class="layout-grid is-2col">
    <div class="finance_panel">
      ${eyebrow(eb)}${heading(title)}
      ${text ? paragraph(text) : ""}
      ${actions}
      ${note ? `<p class="card_meta">${esc(note)}</p>` : ""}
    </div>
    <div class="finance_logo">${logo ? img(logo, logoAlt, { sizes: "288px" }) : ""}</div>
  </div>`;

  /** Full-bleed closing CTA: copy on sand, photograph running to the edge. */
  const ctaSplit = ({ eyebrow: eb, title, text, actions = "", image, alt, flipped = false, w, h: height }) =>
    sectionFull({ name: "cta", inner: `<div class="${cx("cta-split_component", flipped && "is-flipped")}">
    <div class="cta-split_copy">
      ${eyebrow(eb)}${heading(title)}
      ${text ? paragraph(text, { size: "medium" }) : ""}
      ${actions}
    </div>
    <div class="cta-split_media">${image ? img(image, alt, { sizes: "(max-width: 999px) 100vw, 50vw", w, h: height }) : ""}</div>
  </div>` });

  // ----------------------------------------------------------------- lists
  const linkList = (items = []) => `<ul class="link-list_component">
    ${items.map((i) => `<li class="link-list_item"><a href="${esc(link(i.href) || i.href)}">${i.label}</a></li>`).join("")}
  </ul>`;

  const hoursList = (rows = []) => `<ul class="hours_list">
    ${rows.map(([day, time]) => `<li class="hours_row"><span>${day}</span><strong>${time}</strong></li>`).join("")}
  </ul>`;

  /**
   * The credential strip. The comps knock the five logos out to white on a dark
   * slab; the source files are dark artwork on transparency, so knocking them out
   * throws away the marks themselves. They stay as drawn, on the warm tint, under
   * a label that says what they are.
   */
  const badgeStrip = (items = []) => sectionFull({
    name: "accreditations",
    inner: `<div class="badge-strip_component">
      ${items.map(([src, alt]) => `<div class="badge-strip_item">${img(src, alt, { sizes: "180px", cls: "badge-strip_logo" })}</div>`).join("")}
    </div>`,
  });

  // ----------------------------------------------------------------- embeds
  /** Only the practice's own Maps pin and its own forms survive the rebuild. */
  const embed = (src, { title = "", form = false } = {}) => src
    ? `<div class="${cx("embed_component", form && "is-form")}">
    <iframe data-src="${esc(src)}" title="${esc(title)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
  </div>` : "";

  // ----------------------------------------------------------------- grids
  const grid = (cols, items = []) =>
    `<div class="layout-grid is-${cols}col">${items.filter(Boolean).join("")}</div>`;

  const split = (left, right, { flipped = false, textWide = false } = {}) =>
    `<div class="${cx("layout-split", textWide && "is-text-wide", flipped && "is-flipped")}">
    <div>${left}</div>
    <div>${right}</div>
  </div>`;

  return {
    cx, section, sectionFull, spacer, eyebrow, heading, paragraph, button, buttonGroup, linkArrow,
    richText, notice, sectionHeading, heroSplit, factStrip, heroOverlay, heroPlain, heroMedia,
    breadcrumb, card, propCard, serviceCard, svcGroup, doctorCard, reviewLockup, reviewCard,
    reviewList, offerCard, stepList, faqItem, faqList, faqLayout, quoteBand, financePanel,
    ctaSplit, linkList, hoursList, badgeStrip, embed, grid, split, svgIcon,
  };
}
