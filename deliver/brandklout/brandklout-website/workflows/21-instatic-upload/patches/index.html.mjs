/* Home page (package-v2/index.html) — agency changes on top of Sang's file. See ../patches.mjs.
   Copy is never changed here; these are layout and behaviour. */

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
]
