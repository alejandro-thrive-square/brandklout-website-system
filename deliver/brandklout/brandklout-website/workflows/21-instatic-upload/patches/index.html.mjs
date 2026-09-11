/* Home page (package-v2/index.html) — agency changes on top of Sang's file. See ../patches.mjs.
   Copy is never changed here; these are layout and behaviour. */
import fs from 'node:fs'

/* The legal pop-up, cloned from brandklout.com (2026-09-11, Alejandro: "clone it exactly as it is").
   Text: assets/brandklout-com-legal.json, captured from the live modal, one body per tab, verbatim.
   Look: brandklout.com's own .modal-* / .glass rules (assets/index-BS16gr0v.css) with its variables
   resolved (--radius-lg 20px, --radius-sm 8px, --text-2xl 24px, --text-xl 20px, --text-lg 18px,
   --text-base 16px) and its system font. Its animations and the tab/close transitions are written
   `var(--transition-*) ease`, which expands to two timing functions and is invalid, so none of them
   run on brandklout.com (computed animation-name: none); the clone leaves them out. The glass
   card's own `transition: all .3s ease` is valid and kept. */
const LEGAL = JSON.parse(fs.readFileSync(new URL('./assets/brandklout-com-legal.json', import.meta.url), 'utf8'))
const WHY_LEGAL = 'Legal pop-up (2026-09-11, Alejandro): brandklout.com\'s Privacy / Terms / HIPAA modal, cloned'
const legalModal =
  '<div class="modal-overlay" id="legalModal" hidden>' +
  '<div class="modal-content glass" role="dialog" aria-modal="true" aria-labelledby="legalTitle">' +
  `<div class="modal-header"><h2 id="legalTitle">${LEGAL.tabs[0].title}</h2><button class="modal-close" type="button" aria-label="Close modal">×</button></div>` +
  '<div class="modal-tabs">' +
  LEGAL.tabs.map((t, i) => `<button class="modal-tab${i === 0 ? ' active' : ''}" type="button" data-tab="${t.id}">${t.title}</button>`).join('') +
  '</div>' +
  LEGAL.tabs.map((t, i) => `<div class="modal-body" data-panel="${t.id}" data-title="${t.title}"${i === 0 ? '' : ' hidden'}>${t.body}</div>`).join('') +
  '</div></div>\n'

const legalCss =
  '.modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:#000000b3;-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px}' +
  '.modal-overlay[hidden]{display:none}' +
  '.modal-content{max-width:700px;width:100%;max-height:85vh;display:flex;flex-direction:column;border-radius:20px;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;color:#1a1a1a;line-height:1.6}' +
  '.glass{background:#ffffffb3;border:0px solid rgba(0,0,0,.1);box-shadow:0 .5rem 2rem #0000000d;-webkit-backdrop-filter:blur(1.25rem);backdrop-filter:blur(1.25rem);transition:all .3s ease}' +
  '.modal-header{display:flex;justify-content:space-between;align-items:center;padding:30px 30px 20px}' +
  '.modal-header h2{margin:0;font-family:inherit;font-size:24px;font-weight:700;line-height:1.6;letter-spacing:normal;background:linear-gradient(90deg,#3b82f6,#9333ea);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}' +
  '.modal-close{background:none;border:none;font-family:Arial;font-size:32px;font-weight:400;color:#000;cursor:pointer;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:8px;padding:0;line-height:1}' +
  '.modal-close:hover{background:#ffffff1a;color:#ffffffe6}' +
  /* `height:10rem` looks wrong and is load-bearing: .modal-content is a flex column with a max
     height, and the strip (overflow-x:auto, so it may shrink to nothing) SHRINKS from this basis.
     On brandklout.com it lands at 56px. Leave it out and it shrinks from its content height
     instead, to 27px, with the tab labels cut off. Found by diffing computed styles, 2026-09-11. */
  '.modal-tabs{display:flex;gap:8px;padding:10px 30px 2px;border-bottom:2px solid rgba(255,255,255,.15);overflow-x:auto;background:#0003;height:10rem}' +
  '.modal-tab{background:#ffffff0d;border:1px solid rgba(255,255,255,.1);border-bottom:none;color:#000;cursor:pointer;padding:12px 24px;font-family:Arial;font-size:14px;font-weight:600;line-height:normal;white-space:nowrap;position:relative;border-radius:8px 8px 0 0;margin-bottom:-2px}' +
  '.modal-tab:hover{color:#fff;background:#ffffff1a;border-color:#fff3}' +
  '.modal-tab.active{color:#fff;background:#3b82f633;border-color:#3b82f666;border-bottom:2px solid transparent}' +
  '.modal-tab.active:after{content:"";position:absolute;bottom:-2px;left:0;right:0;height:3px;background:linear-gradient(90deg,#3b82f6,#9333ea)}' +
  '.modal-body{padding:30px;overflow-y:auto;flex:1;line-height:1.8}' +
  '.modal-body[hidden]{display:none}' +
  '.modal-body h3{margin-top:30px;margin-bottom:15px;font-family:inherit;font-size:20px;font-weight:700;line-height:1.8;letter-spacing:normal;color:#000}' +
  '.modal-body h3:first-child{margin-top:0}' +
  '.modal-body p{margin-top:0;margin-bottom:15px;color:#000;font-size:16px}' +
  '.modal-body ul,.modal-body ol{margin-top:0;margin-bottom:15px;padding-left:25px;color:#000}' +
  /* Trap 43: Instatic's reset stylesheet sets lists to `list-style: none`, so the published legal
     lists had no bullets while the local page (no reset) did. brandklout.com's are the browser
     default, so say it outright. */
  '.modal-body ul{list-style-type:disc}.modal-body ol{list-style-type:decimal}' +
  '.modal-body li{margin-bottom:8px}' +
  '.modal-body strong{color:#000;font-weight:600}' +
  '.modal-body a{color:#3b82f6;text-decoration:none}' +
  '.modal-body a:hover{color:#9333ea}' +
  '.modal-body::-webkit-scrollbar{width:8px}' +
  '.modal-body::-webkit-scrollbar-track{background:#ffffff0d;border-radius:8px}' +
  '.modal-body::-webkit-scrollbar-thumb{background:#fff3;border-radius:8px}' +
  '.modal-body::-webkit-scrollbar-thumb:hover{background:#ffffff4d}\n'

const legalMedia =
  '    @media(max-width:768px){.modal-content{max-height:90vh}.modal-header{padding:20px}.modal-header h2{font-size:20px}.modal-body{padding:20px}.modal-body h3{font-size:18px}}\n' +
  /* brandklout.com redefines `--text-xl: 1rem` inside `@media (max-width:480px) :root`, and the
     title uses --text-xl from 768px down, so on a phone it is 16px, not 20px. Found by the 390 diff:
     resolving a CSS variable once, at desktop width, misses a redefinition inside a media query. */
  '    @media(max-width:480px){.modal-overlay{padding:10px}.modal-header,.modal-body{padding:15px}.modal-header h2{font-size:16px}}\n'

/* brandklout.com's behaviour: a footer link opens the modal on its tab; the tabs switch the title
   and the body; the × and a click on the backdrop close it; so does Escape; the page does not
   scroll behind it (`overflow: hidden`, reset to `unset` on close). */
const legalJs =
  "\n    (()=>{const m=document.getElementById('legalModal');if(!m)return;const title=document.getElementById('legalTitle');" +
  "const tabs=[...m.querySelectorAll('.modal-tab')];const panels=[...m.querySelectorAll('.modal-body')];" +
  "const show=id=>{tabs.forEach(t=>t.classList.toggle('active',t.dataset.tab===id));panels.forEach(p=>{p.hidden=p.dataset.panel!==id;if(!p.hidden)title.textContent=p.dataset.title})};" +
  "const open=id=>{show(id);m.hidden=false;document.body.style.overflow='hidden'};const close=()=>{m.hidden=true;document.body.style.overflow='unset'};" +
  "document.querySelectorAll('[data-legal]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();open(a.dataset.legal)}));" +
  "tabs.forEach(t=>t.addEventListener('click',()=>show(t.dataset.tab)));" +
  "m.addEventListener('click',e=>{if(e.target===m)close()});m.querySelector('.modal-close').addEventListener('click',close);" +
  "document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!m.hidden)close()});})();"

const WHY_US = 'Why us (2026-09-11, Alejandro): the two cards stacked, and Sang\'s video plays in place'

export default [
  /* 1. Markup: the thumbnail linking out to YouTube becomes an embedded player. Imported as
        base.video, which is also what lifts the page's CSP `frame-src 'none'` for YouTube (trap 42's
        neighbour: a plain iframe would be blocked). The label stays, as a caption under the player;
        the `aria-label` becomes the player's title. The drawn "▶" goes: YouTube draws its own. */
  {
    why: WHY_US + ' — player instead of a link',
    find:
      '<a class="operator-media" href="https://www.youtube.com/watch?v=qxXc1GruLLY" target="_blank" rel="noopener" aria-label="Watch Sang Huynh explain why BrandKlout exists">\n' +
      '              <img src="https://i.ytimg.com/vi/qxXc1GruLLY/maxresdefault.jpg" alt="Sang Huynh, BrandKlout founder and dental practice owner" loading="lazy">\n' +
      '              <span class="play">▶</span><span class="operator-label">Sang Huynh · Founder + practice owner</span>\n' +
      '            </a>',
    replace:
      '<div class="operator-media">\n' +
      '              <div class="operator-video"><iframe src="https://www.youtube-nocookie.com/embed/qxXc1GruLLY?rel=0" title="Watch Sang Huynh explain why BrandKlout exists" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>\n' +
      '              <span class="operator-label">Sang Huynh · Founder + practice owner</span>\n' +
      '            </div>',
  },

  /* 2. The two cards stack: one column. */
  {
    why: WHY_US + ' — stack the grid',
    find: '.operator-grid{display:grid;grid-template-columns:.94fr 1.06fr;gap:22px;align-items:stretch}',
    replace: '.operator-grid{display:grid;grid-template-columns:1fr;gap:22px;align-items:stretch}',
  },
  /* 3. The operator card, now full width: player left (wider), quote right. No fixed height: the
        player's 16:9 decides it. */
  {
    why: WHY_US + ' — operator card proportions',
    find: '.operator-card{display:grid;grid-template-columns:.78fr 1.22fr;min-height:520px}',
    replace: '.operator-card{display:grid;grid-template-columns:1.2fr .8fr;min-height:0}',
  },
  {
    why: WHY_US + ' — the media column holds a player and its caption',
    find: '.operator-media{position:relative;min-height:100%;background:#0c1a28;overflow:hidden}',
    replace:
      '.operator-media{position:relative;display:flex;flex-direction:column;justify-content:center;gap:14px;padding:22px;background:#0c1a28;overflow:hidden}' +
      '.operator-video{position:relative;aspect-ratio:16/9;border-radius:18px;overflow:hidden;background:#02070b}' +
      '.operator-video iframe{position:absolute;inset:0;width:100%;height:100%;border:0}',
  },
  /* 4. The thumbnail's styling goes with the thumbnail. The dark gradient `::after` has to go in
        any case: it is an absolute overlay on the whole media column and would swallow every click
        on the player. */
  {
    why: WHY_US + ' — drop the thumbnail styles',
    find: '.operator-media img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.8}',
    replace: '',
  },
  {
    why: WHY_US + ' — drop the overlay that would block the player',
    find: '.operator-media:after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(7,16,25,.03) 25%,rgba(7,16,25,.92))}',
    replace: '',
  },
  {
    why: WHY_US + ' — drop the drawn play button',
    find: '.operator-media .play{z-index:2;left:22px;top:auto;bottom:62px;transform:none;width:58px;height:58px;font-size:18px}',
    replace: '',
  },
  {
    why: WHY_US + ' — the label becomes a caption',
    find: '.operator-label{position:absolute;z-index:2;left:22px;right:18px;bottom:22px;color:#fff;font-size:12px;font-weight:800}',
    replace: '.operator-label{position:relative;color:#fff;font-size:13px;font-weight:800}',
  },
  /* 5. The territory card, now full width: text left, map right, instead of a 1100px-wide map. */
  {
    why: WHY_US + ' — territory card as text | map',
    find: '.territory-card{padding:34px;background:#fff}',
    replace:
      '.territory-card{padding:34px;background:#fff;display:grid;grid-template-columns:.9fr 1.1fr;grid-template-rows:auto auto 1fr;grid-template-areas:"kicker map" "title map" "copy map";column-gap:40px;align-items:start}' +
      '.territory-card>.kicker{grid-area:kicker}.territory-card h3{grid-area:title}.territory-card>p{grid-area:copy}.territory-map{grid-area:map;align-self:stretch}',
  },
  /* 6. Tablet (≤980px): both cards single column, in the source order (kicker, title, map, copy). */
  {
    why: WHY_US + ' — tablet',
    find: '.operator-card{grid-template-columns:.85fr 1.15fr}',
    replace: '.operator-card{grid-template-columns:1fr}.territory-card{grid-template-columns:1fr;grid-template-rows:auto;grid-template-areas:"kicker" "title" "map" "copy"}',
  },
  /* 7. Phone (≤620px): the media column no longer needs a height floor. */
  {
    why: WHY_US + ' — phone',
    find: '.operator-media{min-height:300px}',
    replace: '.operator-media{padding:14px}',
  },

  /* 8–11. The legal pop-up. The footer links keep `href="#"` (as on brandklout.com) and carry the
     tab they open; links keep their data-* through the import. The modal sits before the mobile
     CTA; its base rules go BEFORE the stylesheet's @media blocks (trap 40's assertion), its own
     two breakpoints after them; its script is appended to Sang's, so it runs from the same guarded
     block in site.js. */
  {
    why: WHY_LEGAL + ' — footer links open it',
    find: '<a href="#">Privacy</a><a href="#">Terms</a><a href="#">HIPAA</a>',
    replace: '<a href="#" data-legal="privacy">Privacy</a><a href="#" data-legal="terms">Terms</a><a href="#" data-legal="hipaa">HIPAA</a>',
  },
  {
    why: WHY_LEGAL + ' — markup',
    find: '  <div class="mobile-cta">',
    replace: '  ' + legalModal + '  <div class="mobile-cta">',
  },
  {
    why: WHY_LEGAL + ' — base rules',
    find: '    @media(max-width:980px){',
    replace: '    ' + legalCss + '    @media(max-width:980px){',
  },
  {
    why: WHY_LEGAL + ' — breakpoints',
    find: '  </style>',
    replace: legalMedia + '  </style>',
  },
  {
    why: WHY_LEGAL + ' — behaviour',
    find: "document.getElementById('success').style.display='block';});",
    replace: "document.getElementById('success').style.display='block';});" + legalJs,
  },
]
