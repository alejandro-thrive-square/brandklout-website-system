/* agency/widget-fluid.js (2026-09-15): keep the site's type fluid under the accessibility widget.

   The sienna-accessibility widget (the embed-origins plugin's `siteScripts`, added outside this
   toolkit) runs `W(scale = 1)` on load: for every h1-h6, p, a, li, span, blockquote… it reads
   `parseInt(getComputedStyle(el).fontSize)` (whole px, rounded down: 64.8 -> 64), stores it in
   `data-asw-org-font-size`, and writes `style="font-size: <px * scale>px"`. That freezes the rem
   sizes, the fluid root and every breakpoint size at whatever the window was on load. Open at 1440,
   narrow to a phone, and the hero h1 stays 72px instead of 45px: "the heading is not scaling
   properly" (Alejandro, seq 24). The visual gates block the widget, so they never saw it.

   This keeps the widget and its text-size tool, and makes its sizes follow the page:
   - at 100% (the default, `states.fontSize` unset or 1 in `asw-user-settings`) its inline sizes are
     removed, so the stylesheet decides, exactly as without the widget;
   - at any other scale each size is recomputed from the stylesheet's current size × the scale,
     and again after every resize.
   Removal, reading and writing happen in three passes, so an inherited size (a span inside a
   scaled p) is never read while its parent still carries a scaled inline size. */
;(() => {
  const KEY = 'asw-user-settings'
  const scale = () => {
    let raw = null
    try {
      raw = localStorage.getItem(KEY)
    } catch {}
    if (raw == null) raw = decodeURIComponent((document.cookie.match(new RegExp('(?:^|; )' + KEY + '=([^;]*)')) || [])[1] || '')
    try {
      return Number(JSON.parse(raw || '{}')?.states?.fontSize) || 1
    } catch {
      return 1
    }
  }
  const fix = (els) => {
    const list = [...els]
    const s = scale()
    for (const el of list) el.style.removeProperty('font-size')
    if (s === 1) {
      for (const el of list) delete el.dataset.aswOrgFontSize
      return
    }
    const sizes = list.map((el) => parseFloat(getComputedStyle(el).fontSize))
    list.forEach((el, i) => {
      el.dataset.aswOrgFontSize = String(sizes[i])
      el.style.fontSize = `${sizes[i] * s}px`
    })
  }
  const observer = new MutationObserver((records) => {
    const els = new Set()
    for (const r of records) if (r.target.dataset && r.target.dataset.aswOrgFontSize !== undefined && r.target.style.fontSize) els.add(r.target)
    if (!els.size) return
    fix(els)
    observer.takeRecords() // our own writes are not the widget's
  })
  observer.observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ['style'] })
  let timer
  addEventListener('resize', () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      fix(document.querySelectorAll('[data-asw-org-font-size]'))
      observer.takeRecords()
    }, 150)
  })
})()
