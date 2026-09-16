// BugHerd #4 (2026-09-16): the brand guide's palette and type on site.css.
const fs = require('fs'), path = require('path');
const f = path.resolve(__dirname, '..', 'home', 'assets', 'site.css');
let s = fs.readFileSync(f, 'utf8');
const rep = (a, b, all) => { if (!s.includes(a)) throw new Error('missing: ' + a.slice(0, 80)); s = all ? s.split(a).join(b) : s.replace(a, b); };

// 1. faces
const a = s.indexOf('@font-face {\n  font-family: "Fraunces VF";');
const b = s.indexOf('}', s.indexOf('src: url("fonts/nunito-vf.woff2")')) + 1;
s = s.slice(0, a) + `/* 2026-09-16 (BugHerd #4): the brand guide's type. Collier and Avenir Next
   are Adobe-licensed with no web project here, so their nearest open faces are
   self-hosted instead: Marcellus (one weight, like Collier Book) and Figtree.
   The names are distinct from the platform's installed families for the same
   reason as before. \`font-synthesis: none\` below keeps the browser from
   inventing a bold or an italic Marcellus. */
@font-face {
  font-family: "Marcellus MP";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("fonts/marcellus.woff2") format("woff2");
}
@font-face {
  font-family: "Figtree VF";
  font-style: normal;
  font-weight: 300 900;
  font-display: swap;
  src: url("fonts/figtree-vf.woff2") format("woff2");
}
@font-face {
  font-family: "Figtree VF";
  font-style: italic;
  font-weight: 300 900;
  font-display: swap;
  src: url("fonts/figtree-vf-italic.woff2") format("woff2");
}` + s.slice(b);

// 2. tokens
const t0 = s.indexOf('  /* From the logo. */');
const t1 = s.indexOf('  --white: #ffffff;');
s = s.slice(0, t0) + `  /* The practices' brand guide (Nikole Culo Designs, Nov 2021), exact hexes:
     slate #545F62, sage #A0B4AA, light #EAE9E6, copper #B78668,
     sand #CCBCA6, beige #E2D5C5. Adopted 2026-09-16 for BugHerd #4; before
     that the palette was sampled from the logo plus a sun yellow and a sky. */
  --slate: #545f62;
  --sage: #a0b4aa;
  /* Derived from it. */
  --ink: #333c3f;          /* headings, the darkest text: the slate taken down */
  --ink-deep: #262d2f;     /* the ground of a dark chapter */
  --ink-mid: #30393b;      /* a raised panel on that ground */
  --body: #545f62;         /* running copy: the brand slate itself (6.4:1) */
  --muted: #858e91;        /* captions, timestamps */
  --sage-deep: #587a68;    /* the sage taken dark enough to carry text on white (4.7:1) */
  --sage-tint: #edf2ee;    /* a light sage ground */
  --sage-line: #d3ddd6;    /* rules and card edges */
  /* The warm accent is the guide's copper. The names stay "sun" and "sky"
     because 215 pages carry them as theme and variant names. */
  --sun: #b78668;          /* copper: dots, bars, rules. Too light for text on white. */
  --sun-fill: #93644a;     /* copper for a filled button or pill; white text 5.0:1 */
  --on-sun: #ffffff;
  --sun-glow: #d4aa8e;     /* copper as text on the dark grounds (6.3:1) */
  --sun-deep: #8a5a3e;     /* copper dark enough for a glyph on white (5.8:1) */
  --sun-tint: #f5efe8;     /* the beige, lightened for a ground */
  --sun-line: #e2d5c5;     /* beige */
  --sun-line-strong: #ccbca6; /* sand */
  --sky: #eae9e6;          /* the guide's light grey */
  --sky-deep: #545f62;
  --cream: #f6f3ee;        /* the warm ground, between white and the beige */
` + s.slice(t1);
rep('  --font-display: "Fraunces VF", "Fraunces", Georgia, "Times New Roman", serif;\n  --font-body: "Nunito VF", "Nunito", "Segoe UI", system-ui, sans-serif;\n  --font-ui: "Nunito VF", "Nunito", "Segoe UI", system-ui, sans-serif;',
    '  --font-display: "Marcellus MP", "Marcellus", Candara, Georgia, serif;\n  --font-body: "Figtree VF", "Avenir Next", Verdana, "Segoe UI", system-ui, sans-serif;\n  --font-ui: "Figtree VF", "Avenir Next", Verdana, "Segoe UI", system-ui, sans-serif;');
rep('html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }', 'html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; font-synthesis: none; }');

// 3. literal hexes that belonged to the old sun
rep('#ecd9a8', 'var(--sun-line)', true);
rep('#d9b76a', 'var(--sun-line-strong)', true);

// 4. fills that carry text: deeper copper, white text
rep('.button.is-sun { background: var(--sun); border-color: var(--sun); color: var(--ink); }', '.button.is-sun { background: var(--sun-fill); border-color: var(--sun-fill); color: var(--on-sun); }');
rep('.has-journey .masthead_component .masthead_actions .button { border-color: var(--sun); background: var(--sun); color: var(--ink); }', '.has-journey .masthead_component .masthead_actions .button { border-color: var(--sun-fill); background: var(--sun-fill); color: var(--on-sun); }');
rep('background: var(--sun); color: var(--ink);', 'background: var(--sun-fill); color: var(--on-sun);', true);

// 5. copper as text on dark grounds
rep('text-transform: uppercase; color: var(--sun); margin-bottom: 1.1rem;', 'text-transform: uppercase; color: var(--sun-glow); margin-bottom: 1.1rem;');
rep('.ch[data-theme="dark"] em { color: var(--sun); }', '.ch[data-theme="dark"] em { color: var(--sun-glow); }');
rep('.ar-title em { font-style: italic; color: var(--sun);', '.ar-title em { font-style: italic; color: var(--sun-glow);');
rep('text-transform: uppercase; color: var(--sun); margin-bottom: .6rem; }', 'text-transform: uppercase; color: var(--sun-glow); margin-bottom: .6rem; }');
rep('.pr-stars { display: inline-flex; gap: .15rem; color: var(--sun);', '.pr-stars { display: inline-flex; gap: .15rem; color: var(--sun-glow);');

fs.writeFileSync(f, s);
console.log('ok');
