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

  const richText = (html) => (html ? `<div class="text-rich-text">${html}</div>` : "");

  const notice = (html) => (html ? `<div class="notice_component">${html}</div>` : "");

  // -------------------------------------------------------------- headings
  const sectionHeading = ({ eyebrow: eb, title, text, centered = false, level = 2 }) => {
    const inner = [eyebrow(eb), heading(title, { level }), text ? paragraph(text, { size: "medium" }) : ""]
      .filter(Boolean).join("");
    return inner ? `<div class="${cx("section-heading_component", centered && "is-centered")}">${inner}</div>` : "";
  };

  // ----------------------------------------------------------------- heroes
  /** Photo hero with the title laid over a scrim - the pattern the old theme used. */
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

  /** Title-only hero on the paper tint, for pages with no header photograph. */
  const heroPlain = ({ eyebrow: eb, title, text }) => `<section class="section_hero hero_component is-plain">
  <div class="padding-global"><div class="container-large"><div class="padding-section-large">
    ${eyebrow(eb)}${heading(title, { level: 1 })}${text ? `<div class="spacer-small"></div>${paragraph(text, { size: "medium" })}` : ""}
  </div></div></div>
</section>`;

  /** Full-width photograph inset to the container, as on the homepage. */
  const heroMedia = ({ src, alt, w, h: height }) => section({
    name: "hero", padding: "small",
    inner: `<div class="hero_media">${img(src, alt, { sizes: "(max-width: 1264px) 100vw, 1200px", eager: true, w, h: height })}</div>`,
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

  const serviceCard = ({ icon, label, href }) => {
    const to = link(href) || href;
    return `<a class="card_component is-link" href="${esc(to)}">
    ${img(icon, "", { sizes: "54px", cls: "service-card_icon" })}
    <h3 class="heading-style-h4">${esc(label)}</h3>
  </a>`;
  };

  const doctorCard = ({ image, name, role, href, blurb }) => {
    const to = link(href) || href;
    return `<a class="doctor-card_component" href="${esc(to)}">
    ${img(image, name, { sizes: "(max-width: 899px) 100vw, 360px", cls: "doctor-card_image" })}
    <h3 class="doctor-card_name heading-style-h4">${esc(name)}</h3>
    <p class="doctor-card_role">${esc(role)}</p>
    ${blurb ? `<p class="text-size-small">${esc(blurb)}</p>` : ""}
  </a>`;
  };

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

  const stepList = (steps = []) => `<div class="layout-grid is-3col step-list_component">
    ${steps.map((s) => `<div class="card_component step-card_component"><h3 class="heading-style-h4">${esc(s)}</h3></div>`).join("")}
  </div>`;

  const faqItem = ({ question, html }) => `<details class="faq_item">
    <summary class="faq_question">${esc(question)}</summary>
    <div class="faq_answer">${html || ""}</div>
  </details>`;

  const faqList = (items = []) => items.map(faqItem).join("");

  // ----------------------------------------------------------------- lists
  const linkList = (items = []) => `<ul class="link-list_component">
    ${items.map((i) => `<li class="link-list_item"><a href="${esc(link(i.href) || i.href)}">${i.label}</a></li>`).join("")}
  </ul>`;

  const hoursList = (rows = []) => `<ul class="hours_list">
    ${rows.map(([day, time]) => `<li class="hours_row"><span>${day}</span><strong>${time}</strong></li>`).join("")}
  </ul>`;

  const badgeStrip = (items = []) => sectionFull({
    name: "accreditations", bg: "slate",
    inner: `<div class="badge-strip_component">
      ${items.map(([src, alt]) => `<div class="badge-strip_item">${img(src, alt, { sizes: "170px", cls: "badge-strip_logo" })}</div>`).join("")}
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
    cx, section, sectionFull, spacer, eyebrow, heading, paragraph, button, buttonGroup,
    richText, notice, sectionHeading, heroOverlay, heroPlain, heroMedia, breadcrumb,
    card, serviceCard, doctorCard, reviewCard, reviewList, offerCard, stepList,
    faqItem, faqList, linkList, hoursList, badgeStrip, embed, grid, split,
  };
}
