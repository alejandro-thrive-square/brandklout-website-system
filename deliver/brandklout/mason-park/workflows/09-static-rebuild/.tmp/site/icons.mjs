// Line icons for the service index.
//
// The Figma handoff ("Handoff — Icon Style Guide") specifies 14 service icons,
// 48x48px frames, single-colour #B78668, 2px outlined stroke, no fill, drawn
// from six different icon libraries. Six libraries is six licences and six
// visual grammars; these are drawn once, here, to one grammar — 24-unit box,
// 1.6 stroke, round caps and joins — and inherit `currentColor` so the copper
// lives in the stylesheet, not in fourteen files.
//
// Inline SVG rather than <img>: it costs no request, stays crisp at any size,
// and survives the Instatic import as ordinary markup.

const ICONS = {
  // A tooth in outline — the base shape most of the others are built from.
  tooth: '<path d="M12 3.6c-2.1 0-2.9.9-4.4.9-1.6 0-3.2 1.3-3.2 3.9 0 3 1.1 4.9 1.8 7.3.5 1.7.6 4.2 1.9 4.2s1.2-2.3 1.6-4c.3-1.4.8-2.2 2.3-2.2s2 .8 2.3 2.2c.4 1.7.3 4 1.6 4s1.4-2.5 1.9-4.2c.7-2.4 1.8-4.3 1.8-7.3 0-2.6-1.6-3.9-3.2-3.9-1.5 0-2.3-.9-4.4-.9Z"/>',

  // Cosmetic / veneers: a tooth with the polish sparkle beside it.
  sparkle: '<path d="M10 4.4c-1.8 0-2.5.8-3.8.8-1.4 0-2.8 1.1-2.8 3.4 0 2.6 1 4.2 1.6 6.3.4 1.5.5 3.6 1.6 3.6s1-2 1.4-3.4c.3-1.2.7-1.9 2-1.9s1.7.7 2 1.9c.3 1.4.3 3.4 1.4 3.4"/><path d="M18 3.2l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8.8-2.1Z"/>',

  // Invisalign / clear aligner: the tray arc over an arch of teeth.
  aligner: '<path d="M4 8.5c0-2 3.6-3.5 8-3.5s8 1.5 8 3.5c0 4.2-2.6 10-8 10s-8-5.8-8-10Z"/><path d="M6.6 9.6c1.6-.7 3.4-1 5.4-1s3.8.3 5.4 1"/><path d="M12 8.7v9.6"/>',

  // Implant: the crown above, the post and threads below.
  implant: '<path d="M7.5 7.2c0-1.7 2-2.9 4.5-2.9s4.5 1.2 4.5 2.9c0 1.4-1 2.3-2.6 2.3h-3.8c-1.6 0-2.6-.9-2.6-2.3Z"/><path d="M12 9.8v9.4"/><path d="M9.6 12.1h4.8M9.9 14.6h4.2M10.4 17h3.2"/>',

  // Dentures: the full arch on its plate.
  dentures: '<path d="M4 10.4c0-2.6 3.6-4.6 8-4.6s8 2 8 4.6c0 4.6-3.2 8-8 8s-8-3.4-8-8Z"/><path d="M4.4 11.7h15.2"/><path d="M8 11.7v3.4M12 11.7v4.2M16 11.7v3.4"/>',

  // Oral surgery: the scalpel.
  surgery: '<path d="M3.6 16.9 13 7.5l4 .4.4 4-9.4 9.4"/><path d="m14.3 6.2 3.4-3.4 3.5 3.5-3.4 3.4"/>',

  // Extraction: a tooth being lifted clear.
  extraction: '<path d="M6 12.4c0-3.5 2.2-5.4 6-5.4s6 1.9 6 5.4c0 2.4-.9 3.9-1.5 5.4-.4 1.2-.5 3-1.4 3s-.8-1.6-1.1-2.7c-.2-1-.5-1.5-1.7-1.5s-1.5.5-1.7 1.5c-.3 1.1-.2 2.7-1.1 2.7s-1-1.8-1.4-3C6.9 16.3 6 14.8 6 12.4Z"/><path d="M12 5.6V2M9.4 4.2 12 1.9l2.6 2.3"/>',

  // Root canal therapy: the file reaching into the root.
  rootcanal: '<path d="M5.6 8.9c0-2.6 2.8-4.3 6.4-4.3s6.4 1.7 6.4 4.3c0 2.7-1 4.4-1.6 6.1-.4 1.3-.5 3.4-1.6 3.4s-.9-1.9-1.2-3.1c-.3-1.1-.6-1.7-2-1.7"/><path d="M12 21V9.6"/><path d="m9.6 12.2 2.4-2.6 2.4 2.6"/>',

  // Pediatric care: a child's head with the practice's leaf sprig.
  child: '<circle cx="12" cy="9.5" r="3.6"/><path d="M5.6 20.4c0-3.1 2.9-5.2 6.4-5.2s6.4 2.1 6.4 5.2"/><path d="M12 5.9V3.2M12 4.6c-.9-.9-2-1.1-2.9-.9.1.9.5 1.9 1.4 2.3M12 4.6c.9-.9 2-1.1 2.9-.9-.1.9-.5 1.9-1.4 2.3"/>',

  // Sedation: the crescent and two soft marks.
  sedation: '<path d="M19.4 14.6A7.8 7.8 0 0 1 9.4 4.6a7.8 7.8 0 1 0 10 10Z"/><path d="M14.4 3.2h3.4l-3.4 3.6h3.4"/>',

  // Advanced technology: the scan reticle over a tooth.
  scan: '<path d="M3.4 8.2V5.4a2 2 0 0 1 2-2h2.8M20.6 8.2V5.4a2 2 0 0 0-2-2h-2.8M3.4 15.8v2.8a2 2 0 0 0 2 2h2.8M20.6 15.8v2.8a2 2 0 0 1-2 2h-2.8"/><path d="M12 8.2c-1.4 0-1.9.6-2.9.6-1 0-2 .8-2 2.4 0 1.9.7 3.1 1.2 4.5.3.9.4 2.3 1.2 2.3s.7-1.3.9-2.2c.2-.8.5-1.3 1.5-1.3s1.3.5 1.5 1.3c.2.9.2 2.2 1 2.2s.9-1.4 1.2-2.3c.5-1.4 1.2-2.6 1.2-4.5 0-1.6-1-2.4-2-2.4-1 0-1.5-.6-2.9-.6Z"/>',

  // Comprehensive / compassionate care: a heart held in a hand.
  care: '<path d="M12 20.4 5.4 14a3.9 3.9 0 0 1 0-5.6 3.9 3.9 0 0 1 5.6 0l1 1 1-1a3.9 3.9 0 0 1 5.6 0 3.9 3.9 0 0 1 0 5.6Z"/>',

  // Emergency: the tooth inside a shield.
  emergency: '<path d="M12 3.2 4.8 6v5.6c0 4.4 3 8.1 7.2 9.2 4.2-1.1 7.2-4.8 7.2-9.2V6Z"/><path d="M12 8.4c-.9 0-1.3.4-2 .4-.7 0-1.4.6-1.4 1.7 0 1.3.5 2.2.8 3.1.2.7.3 1.7.9 1.7s.5-1 .7-1.7c.1-.6.3-.9 1-.9s.8.3 1 .9c.2.7.1 1.7.7 1.7s.6-1 .9-1.7c.3-.9.8-1.8.8-3.1 0-1.1-.7-1.7-1.4-1.7-.7 0-1.1-.4-2-.4Z"/>',

  // Preventative / hygiene: the toothbrush, head up.
  brush: '<path d="M12 20.8V11.2"/><path d="M9.4 11.2V8.4a2.6 2.6 0 0 1 5.2 0v2.8Z"/><path d="M10.2 8V5.6M12 8V4.6M13.8 8V5.6"/>',

  // Restorative / crowns: the crown seated on the tooth.
  crown: '<path d="M4.6 11.4 3.4 5.6l4 2.6L12 3.6l4.6 4.6 4-2.6-1.2 5.8Z"/><path d="M4.6 11.4h14.8"/><path d="M6.6 14.4c0 3 2.4 5.6 5.4 5.6s5.4-2.6 5.4-5.6"/>',

  // Bridges: two abutments spanned.
  bridge: '<path d="M3.6 9.4c0-1.6 1.4-2.6 3-2.6s3 1 3 2.6c0 2.4-.8 3.6-1.2 4.8-.3.9-.3 2.4-1.1 2.4s-.7-1.4-.9-2.2M20.4 9.4c0-1.6-1.4-2.6-3-2.6s-3 1-3 2.6c0 2.4.8 3.6 1.2 4.8.3.9.3 2.4 1.1 2.4s.7-1.4.9-2.2"/><path d="M9.4 9.8h5.2v4.4H9.4z"/>',
};

/** Inline SVG for one icon name. Unknown names fall back to the plain tooth. */
export const icon = (name) =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">` +
  (ICONS[name] || ICONS.tooth) + `</svg>`;

export const ICON_NAMES = Object.keys(ICONS);
