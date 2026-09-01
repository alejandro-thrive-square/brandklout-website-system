// ===========================================================================
// THE CHAPTER LIBRARY — the frozen system.
//
// DESIGN-STANDARD.md's Canary Gate: "finish one representative canary page
// first ... freeze the approved token set, shell, type scale, and interaction
// runtime for that batch before copying the system across the other pages."
//
// The homepage was that canary. This file is the freeze. Everything the eight
// chapters are made of now lives here as a named part, so an inner page
// composes the same vocabulary instead of growing its own copy of it, and a
// change to a chapter's shape happens once.
//
// THE RULE THAT MAKES THIS WORTH DOING: nothing in here emits a class the
// stylesheet does not already carry. `audit.mjs` fails the build on a class
// styled by nothing, which is the check that keeps this library and
// theme/journey.css from drifting apart.
//
// It was extracted by moving markup verbatim out of site/home.mjs and then
// diffing the built page byte for byte, so the extraction itself cannot have
// changed the design. Do the same if you refactor it again.
// ===========================================================================

export function makeChapters(h) {
  const esc = h.esc;

  // ---------------------------------------------------------------- the shell
  /** A named narrative beat. `n` is its number, `name` is what it does to the
   *  reader. Both are visible in the chapter tag and in the fixed readout, and
   *  `data-chapter` is what journey.js binds every scroll behaviour to: a
   *  section without it gets no motion, which is how an ordinary page stays
   *  ordinary. */
  const chapter = ({ n, name, cls, theme, inner, id }) =>
    `<section class="ch ${esc(cls)}" id="${esc(id || cls.replace(/^ch-/, ""))}"` +
    ` data-chapter="${esc(String(n))}" data-chapter-name="${esc(name)}"` +
    `${theme ? ` data-theme="${esc(theme)}"` : ""}>\n${inner}\n</section>`;

  /** The continuity device. Numbered and named, animated in from the left. */
  const tag = (n, name) =>
    `<p class="chapter-tag"><i></i><span>Chapter ${esc(String(n))}</span><b>${esc(name)}</b></p>`;

  const wrap = (inner, cls = "") => `<div class="${h.C.cx("wrap", cls)}">${inner}</div>`;

  // ----------------------------------------------------------------- buttons
  const button = ({ label, href, ghost = false, large = false, external = false }) =>
    `<a class="${h.C.cx("button", ghost && "is-ghost-light", large && "is-lg")}" href="${esc(href)}"` +
    `${external ? ' target="_blank" rel="noopener"' : ""}>${esc(label)}</a>`;

  const linkArrow = ({ label, href, light = false, external = false }) =>
    `<a class="${h.C.cx("link-arrow", light && "is-light")}" href="${esc(href)}"` +
    `${external ? ' target="_blank" rel="noopener"' : ""}>${esc(label)} <span aria-hidden="true">&rarr;</span></a>`;

  // ------------------------------------------------------------------- heroes
  /** The full bleed arrival. One sentence set very large over a photograph that
   *  fills the window, with the header floating on top of it. `facts` is the
   *  three things a first time visitor actually wants, under a rule. */
  /* `compact` is the INNER PAGE hero: the same shell at about two thirds the
     height, without the scroll cue or the fact strip. Inner pages need the
     arrival to hand over quickly, and a second hero component would be a second
     thing to keep in sync with this one for no gain. */
  const arrival = ({ n = 0, name = "Arrival", image, alt, w, height, eyebrow, title, lede, actions, facts = [], compact = false }) =>
    chapter({
      n, name, cls: "ch-arrival" + (compact ? " is-compact" : ""), theme: "dark", id: "arrival",
      inner: `
  <div class="ar-bg" data-drift>
    ${h.img(image, alt, { sizes: "100vw", eager: true, w, h: height })}
  </div>
  <div class="ar-veil" aria-hidden="true"></div>
  <div class="ar-in">
    ${tag(String(n).padStart(2, "0"), eyebrow || name)}
    <h1 class="ar-title" data-split>${title}</h1>
    <p class="ar-lede" data-anim="hide">${esc(lede)}</p>
    <div class="ar-actions" data-anim="hide">${actions}</div>
    <div class="ar-meta" data-anim="hide">
      ${facts.map(([b, s]) => `<div><b>${esc(b)}</b><span>${esc(s)}</span></div>`).join("")}
    </div>
  </div>
  ${compact ? "" : '<p class="ar-cue" aria-hidden="true"><span>Scroll</span><i></i></p>'}`,
    });

  // ------------------------------------------------------------- the figures
  /** Four numbers that count. The VALUE IS IN THE MARKUP and the tween counts
   *  up to it: a literal 0 for a script to replace means a reduced motion
   *  visitor reads "0 Doctors on staff". A number a page states must be true
   *  before any script runs. */
  const figures = (rows, id = "tgFigures") => `<div class="tg-figures" id="${esc(id)}">
      ${rows.map(([value, suffix, label]) => `
      <div class="tg-fig">
        <b data-count="${esc(value)}"${suffix ? ` data-suffix="${esc(suffix)}"` : ""}>${esc(value)}${esc(suffix || "")}</b>
        <span>${esc(label)}</span>
      </div>`).join("")}
    </div>`;

  /** Here, against the alternative. The conversion argument, written down
   *  rather than implied by a grid of icons. Stacks below 768 with the column
   *  names restated as pseudo-element labels, so the comparison survives. */
  /* `label` is authored, never concatenated from the column headers: gluing
     them gives "At Mason Park compared with Two separate practices", which is
     what a screen reader would then announce for the whole table. The visible
     headers are column labels; the accessible name is a sentence. */
  const versus = ({ title, a, b, rows, label }) => `<div class="tg-versus">
      <h3>${esc(title)}</h3>
      <div class="vs-table" role="table" aria-label="${esc(label || `${a} compared with ${b}`)}">
        <div class="vs-row is-head" role="row">
          <span role="columnheader" class="vs-a">${esc(a)}</span>
          <span class="vs-mid" aria-hidden="true">vs</span>
          <span role="columnheader" class="vs-b">${esc(b)}</span>
        </div>
        ${rows.map(([left, right]) => `
        <div class="vs-row" role="row">
          <span role="cell" class="vs-a">${esc(left)}</span>
          <span class="vs-mid" aria-hidden="true"><i></i></span>
          <span role="cell" class="vs-b">${esc(right)}</span>
        </div>`).join("")}
      </div>
    </div>`;

  /** Velocity reactive: it drifts on its own and the scroll adds to it, so a
   *  fast flick visibly throws it. journey.js duplicates the row once at
   *  runtime so the loop is seamless whatever it measures. */
  const marquee = (items) => `<div class="tg-marquee" aria-hidden="true">
    <div class="mq-row" id="mqRow">
      ${items.map((s) => `<span>${esc(s)}</span><b>&#9670;</b>`).join("")}
    </div>
  </div>`;

  // ---------------------------------------------------------------- the arcs
  /** One treatment group as a scene: a photograph with a display numeral over
   *  it, and the treatments as a hairline index with thumbnails. The previous
   *  build ranked nothing, putting fourteen equal bordered tiles in one grid so
   *  a visitor had to read every label to find theirs. */
  const arc = ({ key, numeral, label, title, text, image, imageAlt, items, flipped = false }) =>
    `<article class="rg-arc${flipped ? " is-flipped" : ""}" data-arc="${esc(key)}">
    <div class="rg-media" data-drift>
      ${h.img(image, imageAlt, { sizes: "(max-width: 899px) 100vw, 48vw" })}
      <span class="rg-numeral" aria-hidden="true">${esc(numeral)}</span>
    </div>
    <div class="rg-body">
      <p class="rg-label">${esc(label)}</p>
      <h3>${esc(title)}</h3>
      <p class="rg-text">${esc(text)}</p>
      <ul class="rg-index">
        ${items.map(({ name, blurb, href, thumb }) => {
          const to = h.link(href);
          const inner = `
            <span class="rg-thumb">${thumb ? h.img(thumb, "", { sizes: "72px", decorative: true }) : ""}</span>
            <span class="rg-name">${esc(name)}</span>
            <span class="rg-blurb">${esc(blurb)}</span>
            <span class="rg-go" aria-hidden="true">&rarr;</span>`;
          return `<li class="rg-item">${to ? `<a href="${esc(to)}">${inner}</a>` : `<span class="rg-item-plain">${inner}</span>`}</li>`;
        }).join("")}
      </ul>
    </div>
  </article>`;

  // -------------------------------------------------------------- the people
  /** Tall plates, grayscale at rest and colour on hover, with the one line that
   *  matters pulled out ABOVE the name. Three portraits shot on three different
   *  days against three different grounds; one treatment unifies them. */
  const plate = ({ image, name, role, href, blurb, note }) => {
    const to = h.link(href) || "/our-doctors/";
    return `
    <article class="pe-card">
      <a class="pe-plate" href="${esc(to)}">
        ${h.img(image, name, { sizes: "(max-width: 899px) 100vw, 31vw" })}
        <span class="pe-veil" aria-hidden="true"></span>
      </a>
      <p class="pe-note">${esc(note)}</p>
      <h3><a href="${esc(to)}">${esc(name)}</a></h3>
      <p class="pe-role">${esc(role)}</p>
      <p class="pe-blurb">${esc(blurb)}</p>
    </article>`;
  };

  const plates = (people) => `<div class="pe-grid">${people.map(plate).join("")}</div>`;

  /** A full bleed photographic band that closes a chapter. The chapter carries
   *  no padding under it, by design. */
  const band = ({ image, alt, text, link }) => `<div class="pe-band">
    ${h.img(image, alt, { sizes: "100vw" })}
    <div class="pe-band-in">
      <p>${esc(text)}</p>
      ${link}
    </div>
  </div>`;

  /** An editorial SPREAD: one person or subject at full width, portrait on one
   *  side and the copy on the other, alternating down the page. This is what an
   *  inner page uses where the homepage uses a `plate`. The difference is not
   *  decoration: a card is a thing in a grid of like things, and a spread is a
   *  subject that gets the page to itself for as long as it takes to read. */
  const spread = ({ image, alt, eyebrow, title, role, body = [], note, quote: pull, link, flipped = false }) =>
    `<article class="sp-row${flipped ? " is-flipped" : ""}">
    <div class="sp-media" data-drift>
      ${h.img(image, alt || title, { sizes: "(max-width: 899px) 100vw, 44vw" })}
    </div>
    <div class="sp-body">
      ${eyebrow ? `<p class="sp-eyebrow">${esc(eyebrow)}</p>` : ""}
      <h3>${esc(title)}</h3>
      ${role ? `<p class="sp-role">${esc(role)}</p>` : ""}
      ${body.map((t) => `<p class="sp-text">${esc(t)}</p>`).join("")}
      ${note ? `<p class="sp-note">${esc(note)}</p>` : ""}
      ${pull ? `<blockquote class="sp-quote"><p>${esc(pull)}</p></blockquote>` : ""}
      ${link || ""}
    </div>
  </article>`;

  // ---------------------------------------------------------------- the path
  /** The pinned horizontal journey. SIZED IN svh, not rem: a pinned scene has
   *  to fit the window, and with a fluid root every rem in it grows 12.5% at
   *  1920 and 25% at 2400. journey.js falls back to a snapping scroll region on
   *  touch and to a wrapped row on a reduced motion desktop. */
  const path = ({ n, name, title, steps, cta }) => chapter({
    n, name, cls: "ch-path", id: "path",
    inner: `
  <div class="pa-pin" id="pathPin">
    <div class="pa-head">
      ${tag(String(n).padStart(2, "0"), name)}
      <h2>${esc(title)}</h2>
    </div>
    <div class="pa-track" id="pathTrack">
      ${steps.map((s) => `
      <article class="pa-card">
        <div class="pa-shot">${h.img(s.image, s.alt, { sizes: "(max-width: 899px) 82vw, 30vw" })}</div>
        <span class="pa-no">${esc(s.n)}</span>
        <h3>${esc(s.title)}</h3>
        <p>${esc(s.text)}</p>
      </article>`).join("")}
      ${cta}
    </div>
    <div class="pa-bar" aria-hidden="true"><i id="pathBar"></i></div>
  </div>`,
  });

  // --------------------------------------------------------------- the proof
  /** One quote at display size, scrubbed word by word beside a portrait, then
   *  the rest as a rail. Six equal boxes of ninety word reviews rank nothing
   *  and nobody reads them. */
  const quote = ({ text, author, source = "Google review", portrait, portraitAlt }) => `<div class="wrap pr-lead">
    <figure class="pr-quote">
      <span class="pr-mark" aria-hidden="true">&#8220;</span>
      <blockquote id="proofQuote">${esc(text)}</blockquote>
      <figcaption><span class="pr-rule" aria-hidden="true"></span>${esc(author)}<b>${esc(source)}</b></figcaption>
    </figure>
    <div class="pr-portrait" data-drift>
      ${h.img(portrait, portraitAlt, { sizes: "(max-width: 959px) 100vw, 34vw" })}
    </div>
  </div>`;

  /** Travels sideways with the page. scroll-padding is not optional: a snap
   *  container aligns its first item to the SCROLLPORT edge and would otherwise
   *  scroll its own gutter away on load. */
  const quoteRail = (rows, id = "proofRail") => `<div class="pr-rail" id="${esc(id)}">
    <div class="pr-rail-in">
      ${rows.map((r) => `
      <blockquote class="pr-chip">
        <p>${esc(r.quote)}</p>
        <cite>${esc(r.author)}</cite>
      </blockquote>`).join("")}
    </div>
  </div>`;

  /** The five accreditation marks are white artwork on transparency, so they
   *  only read on an ink ground, and they carry one forced height: five marks
   *  at five intrinsic sizes told a visitor nothing. */
  const badges = (items, label = "Credentialed by") => `<div class="pr-badges">
    <div class="pr-badges-in">
      <p class="pr-badges-label">${esc(label)}</p>
      <ul>
        ${items.map(([src, alt]) => `<li>${h.img(src, alt, { sizes: "150px" })}</li>`).join("")}
      </ul>
    </div>
  </div>`;

  // ---------------------------------------------------------- the invitation
  /** Everything needed to act, in one place, with the objections folded in
   *  where they land. Nothing after it but the footer, so no page dead ends. */
  const facts = (rows) => `<dl class="iv-facts">
        ${rows.map(([term, html]) => `<div><dt>${esc(term)}</dt><dd>${html}</dd></div>`).join("")}
      </dl>`;

  const faqList = (items, { heading, link } = {}) => (items.length ? `
  <div class="wrap iv-faq">
    ${heading ? `<h3>${esc(heading)}</h3>` : ""}
    <div class="iv-faq-list">
      ${items.map((f) => `
      <details class="faq_item">
        <summary class="faq_question">${esc(f.question)}</summary>
        <div class="faq_answer">${f.html}</div>
      </details>`).join("")}
    </div>
    ${link || ""}
  </div>` : "");

  return {
    chapter, tag, wrap, button, linkArrow,
    arrival, figures, versus, marquee,
    arc, plate, plates, band, spread,
    path, quote, quoteRail, badges,
    facts, faqList,
  };
}

export default makeChapters;
