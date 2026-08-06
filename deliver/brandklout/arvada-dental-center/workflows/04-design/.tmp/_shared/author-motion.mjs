// Author the motion choreography INTO each page, 2026-08-06.
//
// The engine previously inferred everything at runtime, which meant the page
// files themselves declared no motion at all: no data-split, no data-stagger, no
// prefers-reduced-motion. Auditing a page on its own turned up nothing, the
// choreography was tunable nowhere, and runtime-only classes are fragile for the
// eventual Webflow port.
//
// This writes the choreography into the markup:
//   data-split="lines|words"  on headings that resolve behind a mask
//   data-stagger="ms"         on groups that cascade
//   data-parallax="k"         on elements that drift
//   data-reveal="scale|left"  where the default rise is not the right entrance
// plus a per-page prefers-reduced-motion guard, so every page enforces the
// contract on its own rather than trusting a shared file to be present.
//
// Idempotent: re-running changes nothing.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url)).replace(/_shared$/, "");
const PAGES = ["implants", "aox", "veneers", "emergency", "dentist-near-me", "next-door"];

const GUARD = `<style>
  /* Per-page motion contract. The shared system lives in ../_shared/brand.css;
     this block guarantees the two rules that must hold even if that file is
     swapped, minified or ported: motion never hides content, and
     prefers-reduced-motion removes movement rather than removing information. */
  @media (prefers-reduced-motion: reduce) {
    [data-reveal], [data-split] .ln__i, [data-split] .wd,
    .trust__item, .form-card, [data-parallax] {
      opacity: 1 !important;
      transform: none !important;
      clip-path: none !important;
      transition: none !important;
      animation: none !important;
    }
    .progress { display: none !important; }
    html { scroll-behavior: auto; }
  }
  /* If the motion script never arms the system, nothing is left hidden. */
  html:not([data-motion="on"]) [data-reveal] { opacity: 1; transform: none; }
</style>
`;

let report = [];

for (const slug of PAGES) {
  const file = path.join(root, slug, "index.html");
  let s = fs.readFileSync(file, "utf8");
  const before = s;
  const hits = [];

  // ---- per-page reduced-motion guard, immediately after the shared stylesheet
  if (!s.includes("Per-page motion contract")) {
    s = s.replace(
      /(<link rel="stylesheet" href="\.\.\/_shared\/brand\.css">\n)/,
      `$1${GUARD}`
    );
    hits.push("reduced-motion guard");
  }

  // ---- headings: hero h1 and every section h2 resolve line by line
  let splits = 0;
  s = s.replace(/<h1 class="display"(?![^>]*data-split)/g, () => {
    splits++;
    return `<h1 class="display" data-split="lines"`;
  });
  s = s.replace(/<h2 class="display"(?![^>]*data-split)/g, () => {
    splits++;
    return `<h2 class="display" data-split="lines"`;
  });
  if (splits) hits.push(`${splits} headings split`);

  // ---- groups cascade, with intervals tuned to what the group is
  const STAGGER = [
    [/<div class="grid grid--4"(?![^>]*data-stagger)/g, 70],
    [/<div class="grid grid--3"(?![^>]*data-stagger)/g, 90],
    [/<div class="grid grid--2"(?![^>]*data-stagger)/g, 110],
    [/<div class="symptoms"(?![^>]*data-stagger)/g, 65],
    [/<ul class="checks([^"]*)"(?![^>]*data-stagger)/g, 45],
    [/<div class="steps"(?![^>]*data-stagger)/g, 120],
    [/<ul class="offer__includes"(?![^>]*data-stagger)/g, 70],
    [/<div class="stat-row([^"]*)"(?![^>]*data-stagger)/g, 90],
    [/<div class="trust"(?![^>]*data-stagger)/g, 90],
  ];
  let staggers = 0;
  for (const [re, ms] of STAGGER) {
    s = s.replace(re, (m) => {
      staggers++;
      return `${m} data-stagger="${ms}"`;
    });
  }
  if (staggers) hits.push(`${staggers} groups staggered`);

  // ---- the ridge watermark drifts; it is the brand motif, so it earns the move
  let drifts = 0;
  s = s.replace(/<div class="ridge-mark"(?![^>]*data-parallax)/g, () => {
    drifts++;
    return `<div class="ridge-mark" data-parallax="0.16"`;
  });
  if (drifts) hits.push(`${drifts} ridge parallax`);

  // ---- media enters with a scale rather than a rise
  let scales = 0;
  s = s.replace(
    /<figure class="(media-frame[^"]*)" data-reveal(?!=)/g,
    (m, cls) => {
      scales++;
      return `<figure class="${cls}" data-reveal="scale"`;
    }
  );
  if (scales) hits.push(`${scales} media scale-in`);

  if (s !== before) fs.writeFileSync(file, s, "utf8");
  report.push(`${slug.padEnd(17)} ${hits.length ? hits.join(" · ") : "(already authored)"}`);
}

console.log(report.join("\n"));
