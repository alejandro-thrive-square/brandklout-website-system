"""Prepare the client-sent implants landing page for the Webflow converter.

Unlike page-no-prep-veneers / page-cosmetic (authored to the 04-design standard),
`livewell-implants-landing (1).html` is the client's own file: bare generic class
names (`btn`, `card`, `wrap`), one page-level <script>, CSS counters, and
`summary::after` content toggles -- none of which survive the clipboard format or
a paste into the live Livewell site (Webflow merges classes BY NAME site-wide).

Transformations:
 1. Strip rules the clipboard cannot carry or that are unused:
    prefers-reduced-motion block, `html{scroll-behavior}` (re-applied via JS),
    `.compare s` (unused), `summary::-webkit-details-marker` / `summary::after`
    content toggles (replaced by explicit .fmark spans), step counters
    (replaced by explicit .stepnum spans).
 2. Give every unclassed / inline-styled top-level section a real class and
    move those inline styles into the stylesheet.
 3. Wrap all body content in ONE `.page_implants` root (single-root one-paste).
 4. Split the page-level script into per-section `<script data-embed>` IIFEs
    (lead form -> hero, before/after slider -> journey) and add a
    `<style data-embed>` for the FAQ open/close mark swap + the Google Fonts
    @import (hero), so the paste is fully self-contained.
 5. Prefix EVERY class with `imp-` (markup tokens + selectors inside <style>
    blocks) so nothing can merge with the live site's own classes. The root
    keeps the `page_implants` convention. JS uses only getElementById -- safe.

Regenerate with:  python .tmp/prep_source_implants.py
"""
import io, os, re, sys

SRC = "../04-design/.tmp/final-design/livewell-implants-landing (1).html"
OUT = ".tmp/page-implants/source.html"

here = os.path.dirname(os.path.abspath(__file__))
root = os.path.dirname(here)                       # 07-webflow-build/
src = os.path.normpath(os.path.join(root, SRC))
out = os.path.normpath(os.path.join(root, OUT))

html = io.open(src, encoding="utf-8").read()
before = len(html)
fail = []

# ---- 0. Brand palette remap (added 2026-07-29 on Brandklout request) --------
# The client file shipped its own forest-green/gold art direction; the site's
# brand tokens (established by the cosmetic/veneers builds, from the client's
# compiled CSS) are navy #0b2c41 / gold #d3aa5a / teal #376b7b / bone #f6f3ee /
# ink #101820. Every green-family value maps to its navy-family equivalent at
# the same lightness role; the salmon "before" marks (#E08A7A) stay.
PALETTE_HEX = {
    "#0F3D2E": "#0b2c41",   # --green      -> brand navy
    "#0A2A20": "#071e2d",   # --green-dk   -> deep navy
    "#111814": "#101820",   # --ink        -> brand ink
    "#F5F7F4": "#f6f3ee",   # --soft       -> brand bone
    "#E7EFE9": "#e3edf1",   # --sage       -> pale navy tint
    "#C79A3C": "#d3aa5a",   # --gold       -> brand gold
    "#DCE3DD": "#d8e0e4",   # --line       -> cool grey-blue
    "#4B5A52": "#4a5b66",   # --muted      -> grey-navy
    "#DCEAE2": "#d9e4ea",   # trust strip text
    "#B9CCC1": "#b6c8d3",   # dark-band sub text
    "#9DB5A9": "#9cb2c0",   # ba-hint
    "#C7D6CD": "#c3d3dd",   # jcol-before text / footer links
    "#83908A": "#83919b",   # privacy fine print
    "#93A29A": "#93a2ad",   # footer text
    "#8B958E": "#8b98a1",   # strike-through competitor price
}
PALETTE_RGBA = {
    "rgba(15,61,46,": "rgba(11,44,65,",     # green shadows/rings -> navy
    "rgba(199,154,60,": "rgba(211,170,90,",  # gold shadow
    "rgba(17,24,20,": "rgba(16,24,32,",      # ink shadows
    "rgba(10,42,32,": "rgba(7,30,45,",       # media-caption bg
}
for old, new in {**PALETTE_HEX, **PALETTE_RGBA}.items():
    html = re.sub(re.escape(old), new, html, flags=re.I)


def sub1(pat, repl, n=1, flags=0, what=""):
    global html
    html, c = re.subn(pat, repl, html, flags=flags)
    if c != n:
        fail.append("%s: expected %d, got %d" % (what or pat[:60], n, c))


def rep(old, new, n=1, what=""):
    global html
    c = html.count(old)
    if c != n:
        fail.append("%s: expected %d, got %d" % (what or old[:60], n, c))
        return
    html = html.replace(old, new)


# ---- 1. CSS removals -------------------------------------------------------
rep("@media (prefers-reduced-motion: reduce){html{scroll-behavior:auto} "
    "*{animation:none!important;transition:none!important}}\n", "",
    what="reduced-motion block")
rep("html{scroll-behavior:smooth}\n", "", what="html scroll-behavior")
sub1(r'\.compare s\{color:#\w+\}\n', "", what="unused .compare s")
rep("summary::-webkit-details-marker{display:none}\n", "", what="details-marker")
sub1(r'(?m)^summary::after\{[^}]*\}\n', "", what="summary::after")
sub1(r'details\[open\] summary::after\{[^}]*\}\n', "", what="open summary::after")
rep(".steps{counter-reset:step}\n", "", what="counter-reset")
rep(".step{counter-increment:step}\n", "", what="counter-increment")
sub1(r'\.step h3::before\{[^}]*\}\n', "", what="step ::before")

# ---- 1b. CSS additions (before the first media query) ----------------------
NEW_CSS = """
/* prep additions: explicit step numbers, FAQ marks, strike, section classes */
.stepnum{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:var(--green);color:#fff;font-family:'Archivo',sans-serif;font-size:15px;font-weight:800;margin-right:12px;vertical-align:middle}
.fmark{font-family:'Archivo',sans-serif;font-size:22px;font-weight:600;color:var(--green)}
.fmark-close{display:none}
.strike{text-decoration:line-through;color:#8B958E}
.gallery{background:var(--soft);padding-top:64px;padding-bottom:64px}
.options{background:var(--sage)}
.story{background:var(--soft)}
.how{background:var(--sage)}
.journey-intro{text-align:center;max-width:760px;margin:0 auto}
.sub-light{color:#b6c8d3}
.faq-wrap{max-width:840px}
.faq-list{margin-top:28px}
"""
rep("@media (max-width: 940px){", NEW_CSS + "\n@media (max-width: 940px){",
    what="css insert point")

# ---- 2. section / div classes ---------------------------------------------
rep('<!-- ============ VIDEOS ============ -->\n<section>',
    '<!-- ============ VIDEOS ============ -->\n<section class="videos">',
    what="videos section")
rep('<!-- ============ SMILE GALLERY ============ -->\n'
    '<section style="background:var(--soft);padding-top:64px;padding-bottom:64px">',
    '<!-- ============ SMILE GALLERY ============ -->\n<section class="gallery">',
    what="gallery section")
rep('<!-- ============ WHY ============ -->\n<section>',
    '<!-- ============ WHY ============ -->\n<section class="why">',
    what="why section")
rep('<!-- ============ OPTIONS ============ -->\n<section style="background:var(--sage)">',
    '<!-- ============ OPTIONS ============ -->\n<section class="options">',
    what="options section")
rep('<!-- ============ DOCTOR ============ -->\n<section>',
    '<!-- ============ DOCTOR ============ -->\n<section class="doctor">',
    what="doctor section")
rep('<!-- ============ JERRY STORY ============ -->\n<section style="background:var(--soft)">',
    '<!-- ============ JERRY STORY ============ -->\n<section class="story">',
    what="story section")
rep('<!-- ============ OFFICE ============ -->\n<section>',
    '<!-- ============ OFFICE ============ -->\n<section class="office">',
    what="office section")
rep('<!-- ============ STEPS ============ -->\n<section style="background:var(--sage)">',
    '<!-- ============ STEPS ============ -->\n<section class="how">',
    what="steps section")
rep('<!-- ============ FAQ ============ -->\n<section>',
    '<!-- ============ FAQ ============ -->\n<section class="faq">',
    what="faq section")
rep('<div class="wrap" style="max-width:840px">', '<div class="wrap faq-wrap">',
    what="faq wrap")
rep('<div style="margin-top:28px">', '<div class="faq-list">', what="faq list")
rep('<div style="text-align:center;max-width:760px;margin:0 auto">',
    '<div class="journey-intro">', what="journey intro")
rep('<div class="wrap hero-grid">\n    <div>',
    '<div class="wrap hero-grid">\n    <div class="hero-copy">', what="hero copy")
rep('<div>\n      <span class="eyebrow">Why We Publish Our Fees</span>',
    '<div class="price-copy">\n      <span class="eyebrow">Why We Publish Our Fees</span>',
    what="price copy")
rep('<div>\n        <span class="eyebrow">Your Implant Doctor</span>',
    '<div class="doc-copy">\n        <span class="eyebrow">Your Implant Doctor</span>',
    what="doc copy")
rep('<div>\n      <strong>Livewell Dental</strong>',
    '<div class="foot-col">\n      <strong>Livewell Dental</strong>',
    what="footer col 1")
rep('<div>\n      Serving Fairfax Station',
    '<div class="foot-col">\n      Serving Fairfax Station', what="footer col 2")

# ---- 2c. dark-band sub paragraphs get an explicit light class --------------
# `.journey .sub` / `.final .sub` recolor the sub via a CONTEXT rule; the
# converter loses a context override of a property the thin `.sub` record
# already declares (residual coverage is by property name), so on Webflow both
# paragraphs rendered muted-dark on the dark navy band. An explicit modifier
# class routes the light color through a real combo record instead.
rep('<p class="sub" style="margin:0 auto">This is a real Livewell patient.',
    '<p class="sub sub-light" style="margin:0 auto">This is a real Livewell patient.',
    what="journey sub light")
rep('<p class="sub">Every month you wait,',
    '<p class="sub sub-light">Every month you wait,', what="final sub light")

# ---- 2b. strike / small / steps / faq marks --------------------------------
rep('<s>$3,500–$5,000+</s>', '<span class="strike">$3,500–$5,000+</span>',
    what="strike span")
rep('<small>/ tooth</small>', '<span class="price-unit">/ tooth</span>',
    what="price unit span")
rep('.big-price small{', '.price-unit{', what="price unit rule")
rep('class="grid-3 steps"', 'class="grid-3"', what="steps grid class")
sub1(r'class="card step"', 'class="card"', n=3, what="step cards")
rep('<h3>Consultation &amp; 3D scan</h3>',
    '<h3><span class="stepnum">1</span>Consultation &amp; 3D scan</h3>',
    what="step 1 num")
rep('<h3>Guided placement</h3>',
    '<h3><span class="stepnum">2</span>Guided placement</h3>', what="step 2 num")
rep('<h3>Your final tooth</h3>',
    '<h3><span class="stepnum">3</span>Your final tooth</h3>', what="step 3 num")
sub1(r'</summary>',
     '<span class="fmark fmark-open" aria-hidden="true">+</span>'
     '<span class="fmark fmark-close" aria-hidden="true">−</span></summary>',
     n=6, what="faq marks")

# ---- 3. single root + drop the page-level script ---------------------------
rep('<body>\n\n<header>', '<body>\n<div class="page_implants">\n<header>',
    what="root open")
sub1(r'<script>\n/\* -+ Before/After slider[\s\S]*?</script>\n</body>',
     '</div>\n</body>', what="page script removal + root close")

# ---- 4. per-section data-embed style/script blocks -------------------------
HERO_EMBEDS = '''\
  <style data-embed>@import url("https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=Inter:wght@400;500;600;700&display=swap");</style>
  <script data-embed>
  (function(){
    document.documentElement.style.scrollBehavior='smooth';
    var form=document.getElementById('lead-form');
    if(!form||form.dataset.impInit)return;
    form.dataset.impInit='1';
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var name=document.getElementById('f-name');
      var phone=document.getElementById('f-phone');
      if(!name.value.trim()||!phone.value.trim()){(!name.value.trim()?name:phone).focus();return;}
      var data=Object.fromEntries(new FormData(form).entries());
      /* TODO before launch: POST `data` to a real lead endpoint (CRM webhook,
         Zapier/Make, or swap the embed for a native Webflow Form). */
      if(typeof gtag==='function'){gtag('event','generate_lead',{form:'implant_landing'});}
      if(typeof fbq==='function'){fbq('track','Lead');}
      document.getElementById('form-view').style.display='none';
      document.getElementById('thanks-view').style.display='block';
    });
  })();
  </script>
'''
rep('</section>\n\n<!-- ============ TRUST',
    HERO_EMBEDS + '</section>\n\n<!-- ============ TRUST', what="hero embeds")

JOURNEY_EMBED = '''\
  <script data-embed>
  (function(){
    var ba=document.getElementById('ba');
    if(!ba||ba.dataset.impInit)return;
    ba.dataset.impInit='1';
    var range=document.getElementById('ba-range');
    var after=document.getElementById('ba-after');
    var divider=document.getElementById('ba-divider');
    var knob=document.getElementById('ba-knob');
    function update(v){
      after.style.clipPath='inset(0 0 0 '+v+'%)';
      divider.style.left=v+'%';
      knob.style.left=v+'%';
    }
    range.addEventListener('input',function(){update(this.value);});
    update(range.value);
  })();
  </script>
'''
rep('</section>\n\n<!-- ============ VIDEOS',
    JOURNEY_EMBED + '</section>\n\n<!-- ============ VIDEOS',
    what="journey embed")

FAQ_EMBED = '''\
  <style data-embed>
  details[open][open] .fmark-open{display:none}
  details[open][open] .fmark-close{display:block}
  </style>
'''
rep('</section>\n\n<!-- ============ FINAL CTA',
    FAQ_EMBED + '</section>\n\n<!-- ============ FINAL CTA', what="faq embed")

# ---- 5. imp- prefix every class -------------------------------------------
names = set()
for m in re.finditer(r'class="([^"]+)"', html):
    names.update(m.group(1).split())
names.discard("page_implants")

def rename_attr(m):
    toks = [t if t == "page_implants" else "imp-" + t for t in m.group(1).split()]
    return 'class="%s"' % " ".join(toks)

html = re.sub(r'class="([^"]+)"', rename_attr, html)

def rename_css(block):
    for n in sorted(names, key=len, reverse=True):
        block = re.sub(r'\.' + re.escape(n) + r'(?![\w-])', '.imp-' + n, block)
    return block

html = re.sub(r'(<style[^>]*>)([\s\S]*?)(</style>)',
              lambda m: m.group(1) + rename_css(m.group(2)) + m.group(3), html)

# ---- checks ----------------------------------------------------------------
if fail:
    sys.exit("prep failed:\n  " + "\n  ".join(fail))
if '<div class="page_implants">' not in html:
    sys.exit("prep failed: .page_implants root missing")
leftover = sorted(set(re.findall(r'class="([^"]*)"', html)) -
                  {" ".join(t for t in c.split()) for c in []})
bad = [c for c in re.findall(r'class="([^"]+)"', html)
       for t in c.split() if not (t == "page_implants" or t.startswith("imp-"))]
if bad:
    sys.exit("prep failed: unprefixed class tokens: %r" % bad[:10])

os.makedirs(os.path.dirname(out), exist_ok=True)
io.open(out, "w", encoding="utf-8", newline="\n").write(html)
print("wrote %s  (%d -> %d bytes, %d classes imp-prefixed)"
      % (OUT, before, len(html), len(names)))
