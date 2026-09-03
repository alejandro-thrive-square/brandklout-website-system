# -*- coding: utf-8 -*-
"""
Stone Dental Implant Center - All-on-X landing page, v2.

Structure mirrors the ARVADA DENTAL CENTER All-on-X ad landing page
(site 693c51e685b19f0d0c149cab, page 6a8403e80803b770778d2d72) block for block.
All assets and all copy are Stone's own. See ../ARVADA-PARITY-GAP.md.

House rules enforced here: no em dashes, no invented facts, no Brandklout pricing,
no Arvada/Livewell copy or imagery.

Class namespace: axon- (single class per element). New v2 classes are axon-v2_* or
extend the existing vocabulary; shared classes keep their published values so the
CSS stays idempotent with the rest of the site.
"""

import content as C

SITE = C.SITE
PAGE_LANDING = C.PAGE_LANDING
A = C.A
PHONE_DISPLAY = C.PHONE_DISPLAY
PHONE_TEL = C.PHONE_TEL
CONSULT_URL = C.CONSULT_URL
LOGO = C.LOGO

MAPS_URL = "https://www.google.com/maps/search/?api=1&query=72+Andorra+Dr+%23110A,+Westlake,+TX+76262"
ADDRESS = "72 Andorra Dr #110A, Westlake, TX 76262"

# ---------------------------------------------------------------------------
# ASSETS  (every one verified to be Stone's own; see ARVADA-PARITY-GAP.md §2)
# ---------------------------------------------------------------------------
DR_BANNER = C.DR_BANNER                       # Dr. Stone, consult room, implant screen
DR_PHOTO = C.DR_PHOTO                         # Dr. Stone, consult room, arch on screen
DR_STANDING = f"{A}/6a08acf1dee55f6fabe78a25_Dr.%20Mona%20Stone%2C%20DDS..webp"
EXTERIOR = f"{A}/6a16079e87043846a4628ffd_656023592_18090389450155974_5574691659867219753_n.avif"
RECEPTION = f"{A}/6a242c6d587d8591d7f04c39_banner-office-bg-img.webp"
FRONTDESK = C.OFFICE                          # two team members at the front desk
ALLONX_SMILE = f"{A}/6a0dd7721fac1e363ecd0eaf_All-on-X%20smile.avif"

OPT_SINGLE = f"{A}/6a0ded9d1b6246a805b7d1c2_Single%20implant%20at%20stone%20surgical%20arts.webp"
OPT_ALLONX = f"{A}/6a0ded9d9e4b8a5c407fd460_all%20on%20x%20at%20stone%20surgical%20arts.webp"
OPT_GRAFT = f"{A}/6a0ded9f437fcacc0ea8b65e_Bone%20grafting%20at%20Stone%20Surgical%20Arts.avif"

# Real patient before/after pairs (combined, side by side).
BA = {
    "a": f"{A}/6a243c49dce540a251f39f96_Before%20%26%20After%20All%20on%20X%20implants.avif",
    "b": f"{A}/6a243c48f9cbac0dbfc993d6_Before%20%26%20After%20All%20on%20X%20implants%20(1).avif",
    "c": f"{A}/6a243c48a98c22a30080966a_Before%20%26%20After%20All%20on%20X%20implants%20(2).avif",
    "d": f"{A}/6a243c48f9cbac0dbfc993ec_Before%20%26%20After%20All%20on%20X%20implants%20(3).avif",
    "e": f"{A}/6a243c482c253b9e5efab9db_Before%20%26%20After%20All%20on%20X%20implants%20(4).avif",
    "f": f"{A}/6a26c04317afa4924cd7ae7e_Before%20%26%20After%20All%20on%20X%20implants%20(5).avif",
    "g": f"{A}/6a08ac1293771a1a18c7e260_imgi_43_576572682.webp",
    "h": f"{A}/6a08ac1293771a1a18c7e26f_IMG_4282.avif",
    "i": f"{A}/6a08ac1393771a1a18c7e27f_imgi_40_581424206.webp",
    "j": f"{A}/6a08ac1293771a1a18c7e259_d4734463ce3096cb6c9f56dcd8e9c502_imgi_38_590414907.avif",
    "k": f"{A}/6a08ac1293771a1a18c7e278_e5154d69ecbd046342a70001ae283c63_imgi_55_498670102.avif",
    "l": f"{A}/6a08ac1293771a1a18c7e252_20a5e2c4f57965099dd499469cb46b84_imgi_42_581579069.avif",
}

BA_ALT = "All-on-X full arch before and after result, actual patient of Stone Dental Implant Center"

# ---------------------------------------------------------------------------
# VIDEO  (13 of Stone's own; ids and titles confirmed from the client's site)
# ---------------------------------------------------------------------------
YT = "https://www.youtube.com/embed/"
VIMEO = "https://player.vimeo.com/video/"

V_EXPLAINER = "TfxI89BAY9w"      # All on 4 explained
V_DOCTOR = "MClykj3NC-M"         # Dr. Mona Stone doctor profile
V_OVERVIEW = "YYmE8wszrBw"       # Practice overview
V_WILLIAM = "WSBoMQuIwPU"        # William Goldman testimony
V_SAMUEL = "M6HwFDnQeJE"         # Samuel Compos testimony
V_DON = "nGXAhZDvsgs"            # Don Hull testimony
V_NOV = "Ts__XGC0sTc"            # patient testimony
V_RON = "0_DIwrmIGu0"            # patient Ron testimonial
V_WAYNE = "9Ha_jOTupqo"          # Wayne, facial trauma (not All-on-X)
V_BARBARA = "4cCSqJlfWGM"        # Barbara, alveoloplasty (not All-on-X)
VM_1 = "1188307662"              # So happy for him
VM_2 = "1188307682"              # All on four transformation
VM_3 = "1188307691"              # New smile for a deserving father and husband


def yt_embed(vid, title, ratio="56.25%"):
    return (
        f'<div style="position:relative;width:100%;padding-bottom:{ratio};'
        'border-radius:14px;overflow:hidden;background:#0b1622">'
        f'<iframe src="{YT}{vid}?rel=0" title="{title}" loading="lazy" '
        'style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" '
        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" '
        'allowfullscreen></iframe></div>'
    )


def vimeo_embed(vid, title, ratio="177.78%"):
    return (
        f'<div style="position:relative;width:100%;padding-bottom:{ratio};'
        'border-radius:14px;overflow:hidden;background:#0b1622">'
        f'<iframe src="{VIMEO}{vid}" title="{title}" loading="lazy" '
        'style="position:absolute;top:0;left:0;width:100%;height:100%;border:0" '
        'allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe></div>'
    )


CONSULT_IFRAME = C.CONSULT_IFRAME

# ---------------------------------------------------------------------------
# NEW CSS  (v2 blocks only; the v1 sheet is already published site-wide)
# ---------------------------------------------------------------------------
CSS_V2 = """
/* header address pill */
.axon-header_addr { display: inline-flex; align-items: center; gap: 8px; color: #081f33; font-family: Montserrat, sans-serif; font-size: 13px; font-weight: 600; text-decoration: none; letter-spacing: 0.2px; }
.axon-header_addr:hover { color: #2179a8; }

/* stat trust bar */
.axon-trustbar { position: relative; background-color: #f2f2f2; padding-top: 44px; padding-bottom: 44px; }
.axon-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 24px; align-items: start; }
.axon-stat { text-align: center; padding-left: 12px; padding-right: 12px; border-left: 1px solid rgba(8, 31, 51, 0.12); }
.axon-stat_n { display: block; font-family: Italiana, serif; font-size: 30px; line-height: 1.1; color: #081f33; margin-bottom: 6px; }
.axon-stat_l { display: block; font-family: Montserrat, sans-serif; font-size: 12px; line-height: 1.5; letter-spacing: 0.6px; text-transform: uppercase; color: #606060; }
.axon-badges { display: flex; align-items: center; justify-content: center; gap: 28px; margin-top: 28px; flex-wrap: wrap; }

/* journey: slider shell */
.axon-ba_shell { max-width: 640px; margin-left: auto; margin-right: auto; }

/* journey: before / after columns */
.axon-jcols { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 56px; }
.axon-jcol { border-radius: 16px; padding: 32px; }
.axon-jcol_before { background-color: #081f33; }
.axon-jcol_after { background-color: #ffffff; border: 1px solid rgba(8, 31, 51, 0.1); box-shadow: 0 12px 40px rgba(8, 31, 51, 0.08); }
.axon-jcol_h { font-family: Italiana, serif; font-size: 26px; line-height: 1.2; margin-top: 0px; margin-bottom: 20px; }
.axon-jcol_h-light { color: #ffffff; }
.axon-jcol_h-dark { color: #081f33; }
.axon-jlist { list-style-type: none; margin: 0px; padding: 0px; }
.axon-jitem { display: flex; gap: 12px; align-items: flex-start; font-family: Montserrat, sans-serif; font-size: 15px; line-height: 1.6; margin-bottom: 14px; }
.axon-jitem_light { color: rgba(255, 255, 255, 0.82); }
.axon-jitem_dark { color: #606060; }
.axon-mark_x { color: #ef7d7d; font-weight: 700; flex-shrink: 0; }
.axon-mark_v { color: #2179a8; font-weight: 700; flex-shrink: 0; }

/* journey chapters */
.axon-chapters { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-top: 56px; }
.axon-chapter { background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid rgba(8, 31, 51, 0.08); box-shadow: 0 12px 40px rgba(8, 31, 51, 0.08); }
.axon-chapter_img { width: 100%; height: 260px; object-fit: cover; display: block; }
.axon-chapter_body { padding: 28px; }
.axon-chapter_num { display: block; font-family: Montserrat, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: #2179a8; margin-bottom: 10px; }
.axon-chapter_q { font-family: Italiana, serif; font-size: 22px; line-height: 1.3; color: #081f33; margin-top: 0px; margin-bottom: 12px; }
.axon-chapter_p { font-family: Montserrat, sans-serif; font-size: 15px; line-height: 1.7; color: #606060; margin: 0px; }

/* video grids */
.axon-vid_wide { max-width: 860px; margin-left: auto; margin-right: auto; margin-top: 56px; }
.axon-vid_row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 32px; }
.axon-vid_row2 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 24px; }
.axon-vid_pair { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-top: 24px; max-width: 860px; margin-left: auto; margin-right: auto; }
.axon-vid_slot { width: 100%; }
.axon-vid_cap { display: block; font-family: Montserrat, sans-serif; font-size: 13px; line-height: 1.5; color: #606060; margin-top: 12px; text-align: center; }
.axon-vid_cap-light { display: block; font-family: Montserrat, sans-serif; font-size: 13px; line-height: 1.5; color: rgba(255, 255, 255, 0.75); margin-top: 12px; text-align: center; }
.axon-vid_star { color: #efb44d; letter-spacing: 2px; margin-right: 8px; }
.axon-subhead { font-family: Montserrat, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: #606060; text-align: center; margin-top: 64px; margin-bottom: 4px; }
.axon-subnote { font-family: Montserrat, sans-serif; font-size: 14px; line-height: 1.6; color: #606060; text-align: center; max-width: 620px; margin-left: auto; margin-right: auto; margin-top: 0px; margin-bottom: 24px; }

/* process */
.axon-proc_grid { display: grid; grid-template-columns: 1.25fr 0.75fr; gap: 56px; align-items: center; }
.axon-proc_steps { display: grid; grid-template-columns: 1fr; gap: 20px; margin-top: 40px; margin-bottom: 32px; }

/* specialist */
.axon-doc_grid { display: grid; grid-template-columns: 0.85fr 1.15fr; gap: 56px; align-items: center; }
.axon-doc_media { width: 100%; }
.axon-creds_list { list-style-type: none; margin-top: 28px; margin-bottom: 28px; padding: 0px; }
.axon-cred_row { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 16px; }
.axon-cred_txt { font-family: Montserrat, sans-serif; font-size: 15px; line-height: 1.6; color: rgba(255, 255, 255, 0.8); }
.axon-cred_lab { color: #ffffff; font-weight: 700; }
.axon-quote { border-left: 3px solid #e6ff0b; margin: 0px; padding-top: 8px; padding-bottom: 8px; padding-left: 20px; font-family: Italiana, serif; font-size: 22px; line-height: 1.4; color: #ffffff; }
.axon-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 56px; }
.axon-strip_img { width: 100%; height: 200px; object-fit: cover; object-position: 50% 30%; display: block; border-radius: 12px; }

/* options with spec tables */
.axon-grid3opt { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; align-items: stretch; }
.axon-opt { background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid rgba(8, 31, 51, 0.1); display: flex; flex-direction: column; }
.axon-opt_feat { border-color: #2179a8; box-shadow: 0 18px 50px rgba(33, 121, 168, 0.18); }
.axon-opt_img { width: 100%; height: 200px; object-fit: cover; display: block; }
.axon-opt_body { padding: 28px; display: flex; flex-direction: column; flex-grow: 1; }
.axon-opt_tag { display: inline-block; align-self: flex-start; background-color: #2179a8; color: #ffffff; font-family: Montserrat, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; padding: 6px 12px; border-radius: 999px; margin-bottom: 12px; }
.axon-opt_h { font-family: Italiana, serif; font-size: 24px; line-height: 1.25; color: #081f33; margin-top: 0px; margin-bottom: 12px; }
.axon-opt_d { font-family: Montserrat, sans-serif; font-size: 15px; line-height: 1.7; color: #606060; margin-top: 0px; margin-bottom: 20px; }
.axon-spec { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; padding-top: 12px; padding-bottom: 12px; border-top: 1px solid rgba(8, 31, 51, 0.08); }
.axon-spec_k { font-family: Montserrat, sans-serif; font-size: 13px; color: #606060; margin: 0px; }
.axon-spec_v { font-family: Montserrat, sans-serif; font-size: 13px; font-weight: 700; color: #081f33; text-align: right; margin: 0px; }
.axon-spec_note { font-family: Montserrat, sans-serif; font-size: 12px; line-height: 1.6; color: #606060; margin-top: 14px; margin-bottom: 20px; }
.axon-opt_foot { margin-top: auto; }

/* gallery */
.axon-gal3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.axon-gal_img { width: 100%; height: auto; display: block; border-radius: 14px; box-shadow: 0 12px 40px rgba(8, 31, 51, 0.1); }

/* office grid, five up */
.axon-off5 { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; }
.axon-off_a { grid-column: span 3; width: 100%; height: 300px; object-fit: cover; object-position: 50% 30%; display: block; border-radius: 14px; }
.axon-off_b { grid-column: span 3; width: 100%; height: 300px; object-fit: cover; object-position: 50% 30%; display: block; border-radius: 14px; }
.axon-off_c { grid-column: span 2; width: 100%; height: 220px; object-fit: cover; object-position: 50% 22%; display: block; border-radius: 14px; }

/* faq accordion slot */
.axon-faq_slot { width: 100%; max-width: 860px; margin-left: auto; margin-right: auto; }

/* closing */
.axon-final_media { max-width: 640px; margin-left: auto; margin-right: auto; margin-top: 32px; margin-bottom: 32px; }
.axon-alt { font-family: Montserrat, sans-serif; font-size: 14px; line-height: 1.6; color: rgba(255, 255, 255, 0.75); text-align: center; margin-top: 20px; }
.axon-alt_a { color: #e6ff0b; text-decoration: none; font-weight: 700; }
.axon-alt_a:hover { text-decoration: underline; }

/* credential marquee slot */
.axon-marks { background-color: #f2f2f2; padding-top: 40px; padding-bottom: 40px; }
.axon-marks_lab { font-family: Montserrat, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: #606060; text-align: center; margin-top: 0px; margin-bottom: 20px; }
.axon-marks_slot { width: 100%; }

/* footer disclaimer */
.axon-disc { font-family: Montserrat, sans-serif; font-size: 12px; line-height: 1.7; color: #8a8a8a; margin-top: 24px; }

@media screen and (max-width: 991px) {
  .axon-stats { grid-template-columns: repeat(3, 1fr); row-gap: 32px; }
  .axon-doc_grid { grid-template-columns: 1fr; gap: 40px; }
  .axon-proc_grid { grid-template-columns: 1fr; gap: 40px; }
  .axon-grid3opt { grid-template-columns: 1fr; }
  .axon-strip { grid-template-columns: repeat(2, 1fr); }
  .axon-vid_row { grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .axon-vid_row2 { grid-template-columns: repeat(2, 1fr); }
  .axon-gal3 { grid-template-columns: repeat(2, 1fr); }
  .axon-off_c { grid-column: span 3; }
}
@media screen and (max-width: 767px) {
  .axon-stats { grid-template-columns: repeat(2, 1fr); }
  .axon-jcols { grid-template-columns: 1fr; }
  .axon-chapters { grid-template-columns: 1fr; }
  .axon-vid_row { grid-template-columns: 1fr; }
  .axon-vid_row2 { grid-template-columns: 1fr; }
  .axon-vid_pair { grid-template-columns: 1fr; }
  .axon-gal3 { grid-template-columns: 1fr; }
  .axon-off5 { grid-template-columns: 1fr; }
  .axon-off_a { grid-column: span 1; }
  .axon-off_b { grid-column: span 1; }
  .axon-off_c { grid-column: span 1; }
  .axon-strip { grid-template-columns: repeat(2, 1fr); }
  .axon-header_addr { display: none; }
}
@media screen and (max-width: 479px) {
  .axon-stats { grid-template-columns: 1fr; }
  .axon-stat { border-left-style: none; }
  .axon-strip { grid-template-columns: 1fr; }
  .axon-jcol { padding: 24px; }
  .axon-chapter_body { padding: 22px; }
  .axon-opt_body { padding: 22px; }
}
"""

# ---------------------------------------------------------------------------
# SECTIONS  (Arvada order, block for block)
# ---------------------------------------------------------------------------

S_HEADER = f"""
<header class="axon-header"><div class="axon-header_inner">
<a href="{MAPS_URL}" target="_blank" rel="noopener" class="axon-header_addr">{ADDRESS}</a>
<a href="/" aria-label="Stone Dental Implant Center home"><img src="{LOGO}" alt="Stone Dental Implant Center logo" class="axon-logo" loading="eager"/></a>
<div class="axon-header_right">
<a href="{PHONE_TEL}" class="axon-header_phone">{PHONE_DISPLAY}</a>
<a href="{CONSULT_URL}" class="axon-button">Book a Consultation</a>
</div>
</div></header>"""

S_HERO = f"""
<section class="axon-section axon-section_navytop axon-hero-pad" id="top"><div class="axon-container"><div class="axon-grid2 axon-grid2_top">
<div>
<span class="axon-eyebrow axon-eyebrow_light">All-on-X Implants · Westlake, TX &amp; DFW</span><br/>
<span class="axon-rating"><span aria-hidden="true" class="axon-stars">★★★★★</span>255+ Five-Star Reviews · Board-Certified Surgeon</span>
<h1 class="axon-h1 axon-h1_light">Permanent Teeth. One Day.<br/><span class="axon-h1_accent">Designed Around Your Face.</span></h1>
<p class="axon-p axon-p_light axon-p_lead">Full-arch All-on-X restoration handled entirely in-house by Dr. Mona Stone, a board-certified oral &amp; maxillofacial surgeon in Westlake, TX.<br/><br/>Surgery, design, and the final smile, all under one roof.</p>
<ul class="axon-bullets" role="list">
<li class="axon-bullet"><span class="axon-check">✓</span>Complimentary first visit with a 3D CT scan and a full treatment plan</li>
<li class="axon-bullet"><span class="axon-check">✓</span>A fixed temporary arch the same day in most cases</li>
<li class="axon-bullet"><span class="axon-check">✓</span>Complex and atrophic cases welcome, including bone loss other clinics turn away</li>
</ul>
<div class="axon-ctas">
<a href="{CONSULT_URL}" class="axon-button axon-button_yellow">Book a Consultation</a>
<a href="{PHONE_TEL}" class="axon-button axon-button_ghost">Call {PHONE_DISPLAY}</a>
</div>
<p class="axon-note axon-note_light">Serving Westlake, Southlake, Keller, Trophy Club &amp; the DFW Metroplex</p>
<div class="axon-hero_media" data-embed="hero-video"></div>
<span class="axon-media_caption">▶ All-on-4 explained by Stone Dental Implant Center</span>
</div>
<div class="axon-form_card" id="book">
<p class="axon-form_title">Request Your All-on-X Consultation</p>
<p class="axon-form_sub">Send us your details and our team will call you to set up your visit.</p>
<div class="axon-form_embed"></div>
</div>
</div></div></section>"""

S_TRUST = f"""
<section class="axon-trustbar"><div class="axon-container">
<div class="axon-stats">
<div class="axon-stat"><span class="axon-stat_n">255+</span><span class="axon-stat_l">Five-Star Patient Reviews</span></div>
<div class="axon-stat"><span class="axon-stat_n">Board-Certified</span><span class="axon-stat_l">Oral &amp; Maxillofacial Surgeon</span></div>
<div class="axon-stat"><span class="axon-stat_n">3</span><span class="axon-stat_l">Level 1 Trauma Centers In Residency</span></div>
<div class="axon-stat"><span class="axon-stat_n">Baylor &amp; Methodist</span><span class="axon-stat_l">Attending Surgeon</span></div>
<div class="axon-stat"><span class="axon-stat_n">Full-Arch Focused</span><span class="axon-stat_l">Surgery, Grafting And The Final Arch, All In-House</span></div>
</div>
<div class="axon-badges">
<span class="axon-trust_item"><img src="{C.GOOGLE}" alt="Google" class="axon-trust_img"/>Five-Star Rated on Google</span>
<span class="axon-trust_stars" aria-hidden="true">★★★★★</span>
<span class="axon-trust_item"><img src="{C.YELP}" alt="Yelp" class="axon-trust_img"/>Five-Star Rated on Yelp</span>
</div>
</div></section>"""

S_JOURNEY = f"""
<section class="axon-section"><div class="axon-container">
<div class="axon-head-block axon-head-block_center axon-center">
<span class="axon-eyebrow">One Patient's Real Journey</span>
<h2 class="axon-h2">From a Failing Arch<br/><span class="axon-h1_accent">To a Smile That Stays In</span></h2>
<p class="axon-p">This is a real Stone Dental Implant Center patient. He arrived with several failing teeth and years of patchwork dentistry. Drag the handle to see what changed when the whole arch was rebuilt around one plan, designed for his face.</p>
</div>
<div class="axon-ba_shell"><div></div></div>
<div class="axon-jcols">
<div class="axon-jcol axon-jcol_before">
<h3 class="axon-jcol_h axon-jcol_h-light">Life Before</h3>
<ul class="axon-jlist" role="list">
<li class="axon-jitem axon-jitem_light"><span class="axon-mark_x">✕</span>Chewing on one side, and steering around whole categories of food</li>
<li class="axon-jitem axon-jitem_light"><span class="axon-mark_x">✕</span>A hand across the mouth in photographs</li>
<li class="axon-jitem axon-jitem_light"><span class="axon-mark_x">✕</span>An arch failing one tooth at a time, and one repair at a time</li>
<li class="axon-jitem axon-jitem_light"><span class="axon-mark_x">✕</span>Something removable to take out at night</li>
<li class="axon-jitem axon-jitem_light"><span class="axon-mark_x">✕</span>Being told the bone was too far gone to try</li>
</ul>
</div>
<div class="axon-jcol axon-jcol_after">
<h3 class="axon-jcol_h axon-jcol_h-dark">Life After</h3>
<ul class="axon-jlist" role="list">
<li class="axon-jitem axon-jitem_dark"><span class="axon-mark_v">✓</span>A full arch fixed to the bone, never removed at night</li>
<li class="axon-jitem axon-jitem_dark"><span class="axon-mark_v">✓</span>Teeth shaped to the proportion and lip line of that particular face</li>
<li class="axon-jitem axon-jitem_dark"><span class="axon-mark_v">✓</span>Implants that stimulate the jawbone the way natural roots do</li>
<li class="axon-jitem axon-jitem_dark"><span class="axon-mark_v">✓</span>One surgeon carrying the case from the first scan to the final arch</li>
<li class="axon-jitem axon-jitem_dark"><span class="axon-mark_v">✓</span>A plan built for how the result will age, not only whether it will hold</li>
</ul>
</div>
</div>
<div class="axon-chapters">
<div class="axon-chapter">
<img src="{DR_STANDING}" alt="Dr. Mona Stone, DDS, board-certified oral and maxillofacial surgeon at Stone Dental Implant Center" class="axon-chapter_img" loading="lazy"/>
<div class="axon-chapter_body">
<span class="axon-chapter_num">01 · The Turning Point</span>
<h3 class="axon-chapter_q">"I caught myself hiding my smile in photos."</h3>
<p class="axon-chapter_p">Soft foods. Chewing on one side. A hand across the mouth. The workarounds accumulate so slowly that years can pass before you notice how much of life has rearranged itself around your teeth.</p>
</div>
</div>
<div class="axon-chapter">
<img src="{DR_PHOTO}" alt="Dr. Mona Stone reviewing a full-arch implant plan at Stone Dental Implant Center" class="axon-chapter_img" loading="lazy"/>
<div class="axon-chapter_body">
<span class="axon-chapter_num">02 · The Plan</span>
<h3 class="axon-chapter_q">"Someone finally showed me the whole picture."</h3>
<p class="axon-chapter_p">Your first visit includes a 3D CT scan and a full treatment plan. The jaw is scanned, the bite is mapped, and the future arch is designed around your features before a single implant is placed.</p>
</div>
</div>
<div class="axon-chapter">
<img src="{RECEPTION}" alt="Reception at Stone Dental Implant Center in Westlake, TX" class="axon-chapter_img" loading="lazy"/>
<div class="axon-chapter_body">
<span class="axon-chapter_num">03 · The Day</span>
<h3 class="axon-chapter_q">"By that afternoon, it was behind me."</h3>
<p class="axon-chapter_p">Dr. Stone places the implants herself with a guided, minimally invasive approach, and sedation is available. In most cases you go home the same day with a fixed temporary arch already in place.</p>
</div>
</div>
<div class="axon-chapter">
<img src="{ALLONX_SMILE}" alt="All-on-X full-arch implant result at Stone Dental Implant Center" class="axon-chapter_img" loading="lazy"/>
<div class="axon-chapter_body">
<span class="axon-chapter_num">04 · The Reveal</span>
<h3 class="axon-chapter_q">"They feel like they were always mine."</h3>
<p class="axon-chapter_p">Once the implants integrate with the bone, typically 4 to 6 months, the custom final arch goes in, built to your bite, your smile, and the way your face moves.</p>
</div>
</div>
</div>
<div class="axon-ctas axon-ctas_center"><a href="{CONSULT_URL}" class="axon-button axon-button_dark">Book a Consultation</a></div>
</div></section>"""

S_STORY = f"""
<section class="axon-section axon-section_soft"><div class="axon-container">
<div class="axon-head-block axon-head-block_center axon-center">
<span class="axon-eyebrow">Why Stone</span>
<h2 class="axon-h2">Most Clinics Place Implants.<br/><span class="axon-h1_accent">Dr. Stone Designs Faces.</span></h2>
</div>
<div class="axon-grid4">
<div class="axon-feature"><h3 class="axon-h3">One surgeon, start to finish</h3><p class="axon-feature_p">Your case stays in one pair of hands from the first scan to the final arch. No repeating your story to a new provider, no referrals out.</p></div>
<div class="axon-feature"><h3 class="axon-h3">Designed around your face</h3><p class="axon-feature_p">Jawline, lip line, and proportion are mapped before placement. Your new teeth are shaped to fit your face, not chosen from a catalog.</p></div>
<div class="axon-feature"><h3 class="axon-h3">Comfort at every stage</h3><p class="axon-feature_p">Sedation is available and every case is planned for gentle, minimally invasive treatment, from your first visit through healing.</p></div>
<div class="axon-feature"><h3 class="axon-h3">Complex cases welcome</h3><p class="axon-feature_p">Complex and atrophic cases are welcome here, including bone loss that other clinics turn away. A 3D scan shows what is possible for you.</p></div>
</div>
<div class="axon-vid_wide">
<div class="axon-vid_slot" data-embed="story-wide"></div>
<span class="axon-vid_cap"><span class="axon-vid_star" aria-hidden="true">★★★★★</span>Patient story · William Goldman, in his own words</span>
</div>
<div class="axon-vid_row">
<div><div class="axon-vid_slot" data-embed="story-v1"></div><span class="axon-vid_cap"><span class="axon-vid_star" aria-hidden="true">★★★★★</span>All-on-4 transformation</span></div>
<div><div class="axon-vid_slot" data-embed="story-v2"></div><span class="axon-vid_cap"><span class="axon-vid_star" aria-hidden="true">★★★★★</span>A new smile before the holidays</span></div>
<div><div class="axon-vid_slot" data-embed="story-v3"></div><span class="axon-vid_cap"><span class="axon-vid_star" aria-hidden="true">★★★★★</span>One arch, one plan, one day</span></div>
</div>
<div class="axon-vid_row2">
<div><div class="axon-vid_slot" data-embed="story-v4"></div><span class="axon-vid_cap"><span class="axon-vid_star" aria-hidden="true">★★★★★</span>Patient story · Don Hull</span></div>
<div><div class="axon-vid_slot" data-embed="story-v5"></div><span class="axon-vid_cap"><span class="axon-vid_star" aria-hidden="true">★★★★★</span>Patient story · Samuel Compos</span></div>
<div><div class="axon-vid_slot" data-embed="story-v6"></div><span class="axon-vid_cap"><span class="axon-vid_star" aria-hidden="true">★★★★★</span>Patient story · in their own words</span></div>
</div>
<p class="axon-subhead">Beyond full-arch care</p>
<p class="axon-subnote">Dr. Stone practices the full scope of oral and maxillofacial surgery. These patients came for other procedures, and their experience says as much about the practice as any implant case.</p>
<div class="axon-vid_pair">
<div><div class="axon-vid_slot" data-embed="story-o1"></div><span class="axon-vid_cap">Wayne · facial trauma treatment</span></div>
<div><div class="axon-vid_slot" data-embed="story-o2"></div><span class="axon-vid_cap">Barbara · alveoloplasty</span></div>
</div>
<div class="axon-ctas axon-ctas_center"><a href="{CONSULT_URL}" class="axon-button axon-button_dark">Book a Consultation</a></div>
</div></section>"""

S_SPECIALIST = f"""
<section class="axon-section axon-section_dark"><div class="axon-container">
<div class="axon-doc_grid">
<div class="axon-doc_media" data-embed="doctor-video"></div>
<div>
<span class="axon-eyebrow axon-eyebrow_light">Your Surgeon</span>
<h2 class="axon-h2 axon-h2_light">A Surgeon's Training.<br/><span class="axon-h1_accent">An Artist's Eye.</span></h2>
<p class="axon-p axon-p_light">Dr. Mona Stone's path to surgery started in engineering: a biomedical engineering degree, a Doctorate of Dental Surgery from the University of Missouri-Kansas City, and a full residency in oral and maxillofacial surgery in Fort Lauderdale across three Level 1 trauma centers. She is an attending surgeon at Baylor and Methodist, and implant surgery is the heart of her practice.</p>
<ul class="axon-creds_list" role="list">
<li class="axon-cred_row"><span class="axon-check">✓</span><span class="axon-cred_txt"><span class="axon-cred_lab">Board-certified oral &amp; maxillofacial surgeon</span>, placing and restoring full-arch cases herself, start to finish</span></li>
<li class="axon-cred_row"><span class="axon-check">✓</span><span class="axon-cred_txt"><span class="axon-cred_lab">Biomedical engineering degree, then a UMKC DDS</span>, an engineer's read of load, bone and structure before a single implant is placed</span></li>
<li class="axon-cred_row"><span class="axon-check">✓</span><span class="axon-cred_txt"><span class="axon-cred_lab">Residency across three Level 1 trauma centers</span>, which is why complex and atrophic cases are welcome here</span></li>
<li class="axon-cred_row"><span class="axon-check">✓</span><span class="axon-cred_txt"><span class="axon-cred_lab">KLS MARTIN IPS® certified, Pinnacle faculty</span>, and an attending surgeon at Baylor and Methodist</span></li>
</ul>
<blockquote class="axon-quote">What truly sets her apart is how she sees.</blockquote>
<div class="axon-ctas"><a href="{CONSULT_URL}" class="axon-button axon-button_yellow">Book a Consultation</a></div>
</div>
</div>
<div class="axon-strip">
<img src="{EXTERIOR}" alt="Stone Dental Implant Center in Westlake, TX" class="axon-strip_img" loading="lazy"/>
<img src="{RECEPTION}" alt="Reception at Stone Dental Implant Center" class="axon-strip_img" loading="lazy"/>
<img src="{FRONTDESK}" alt="The Stone Dental Implant Center team at the front desk" class="axon-strip_img" loading="lazy"/>
<img src="{DR_PHOTO}" alt="Dr. Mona Stone reviewing a full-arch implant plan" class="axon-strip_img" loading="lazy"/>
</div>
</div></section>"""

S_OPTIONS = f"""
<section class="axon-section axon-section_soft"><div class="axon-container">
<div class="axon-head-block axon-head-block_center axon-center">
<span class="axon-eyebrow">Your Options</span>
<h2 class="axon-h2">From a Failing Arch<br/><span class="axon-h1_accent">To Teeth That Stay In</span></h2>
<p class="axon-p">Your consultation maps your bone, bite, timeline, and goals, then points to the path that fits. Here is the landscape before you walk in.</p>
</div>
<div class="axon-grid3opt">

<div class="axon-opt">
<img src="{OPT_SINGLE}" alt="Single dental implant at Stone Dental Implant Center" class="axon-opt_img" loading="lazy"/>
<div class="axon-opt_body">
<h3 class="axon-opt_h">Single Dental Implants</h3>
<p class="axon-opt_d">An implant rebuilds one missing tooth, root and crown, without grinding down the healthy teeth on either side of it.</p>
<div class="axon-spec"><p class="axon-spec_k">Implants placed</p><p class="axon-spec_v">1</p></div>
<div class="axon-spec"><p class="axon-spec_k">Replaces</p><p class="axon-spec_v">One tooth</p></div>
<div class="axon-spec"><p class="axon-spec_k">Ideal if you want</p><p class="axon-spec_v">One gap closed, neighbours untouched</p></div>
<div class="axon-spec"><p class="axon-spec_k">Investment</p><p class="axon-spec_v">$</p></div>
<p class="axon-spec_note">Your exact fee is itemized at your consultation, after the 3D scan shows whether any grafting is needed first.</p>
<div class="axon-opt_foot"><a href="{CONSULT_URL}" class="axon-button axon-button_dark">Ask About Single Implants</a></div>
</div>
</div>

<div class="axon-opt axon-opt_feat">
<img src="{OPT_ALLONX}" alt="All-on-X full-arch dental implants at Stone Dental Implant Center" class="axon-opt_img" loading="lazy"/>
<div class="axon-opt_body">
<span class="axon-opt_tag">Full-Arch Solution</span>
<h3 class="axon-opt_h">All-on-X Full-Arch Implants</h3>
<p class="axon-opt_d">A complete row of fixed teeth carried by four to six precisely placed implants. It stays in around the clock. Nothing removable, nothing to take out at night.</p>
<div class="axon-spec"><p class="axon-spec_k">Implants per arch</p><p class="axon-spec_v">4 to 6</p></div>
<div class="axon-spec"><p class="axon-spec_k">Treatment time</p><p class="axon-spec_v">Often same-day temporary teeth</p></div>
<div class="axon-spec"><p class="axon-spec_k">Ideal if you want</p><p class="axon-spec_v">Fixed, non-removable teeth</p></div>
<div class="axon-spec"><p class="axon-spec_k">Investment</p><p class="axon-spec_v">$$</p></div>
<p class="axon-spec_note">All-on-X in the Westlake and DFW area typically runs about $25,000 to $50,000 or more per arch, depending on the number of implants, the materials, and whether bone work is needed. Financing is available through Lending Club, Cherry, Sunbit and Proceed Finance.</p>
<div class="axon-opt_foot"><a href="{CONSULT_URL}" class="axon-button">Book a Consultation</a></div>
</div>
</div>

<div class="axon-opt">
<img src="{OPT_GRAFT}" alt="Bone grafting and sinus lift at Stone Dental Implant Center" class="axon-opt_img" loading="lazy"/>
<div class="axon-opt_body">
<h3 class="axon-opt_h">Full Arch With Bone Grafting or a Sinus Lift</h3>
<p class="axon-opt_d">For arches with significant bone loss. Dr. Stone can often angle implants around the loss, or rebuild the site with grafting and a sinus lift so a fixed arch becomes possible.</p>
<div class="axon-spec"><p class="axon-spec_k">Implants per arch</p><p class="axon-spec_v">4 to 6, plus site work</p></div>
<div class="axon-spec"><p class="axon-spec_k">Treatment time</p><p class="axon-spec_v">Longer, healing between stages</p></div>
<div class="axon-spec"><p class="axon-spec_k">Ideal if you want</p><p class="axon-spec_v">A yes after being told no</p></div>
<div class="axon-spec"><p class="axon-spec_k">Investment</p><p class="axon-spec_v">$$$</p></div>
<p class="axon-spec_note">Where a case falls depends on how much bone has to be rebuilt and how many stages that takes. The 3D scan at your consultation settles it.</p>
<div class="axon-opt_foot"><a href="{CONSULT_URL}" class="axon-button axon-button_dark">See If You Qualify</a></div>
</div>
</div>

</div></div></section>"""

S_PROCESS = f"""
<section class="axon-section"><div class="axon-container">
<div class="axon-proc_grid">
<div>
<span class="axon-eyebrow">The Process</span>
<h2 class="axon-h2">Three Visits Between You<br/><span class="axon-h1_accent">And a Permanent Smile</span></h2>
<p class="axon-p">A complimentary first visit, complete records, and a clear plan, because an arch you will chew on for decades begins with understanding, not urgency.</p>
<div class="axon-proc_steps">
<div class="axon-step"><p class="axon-step_num">01</p><div><h3 class="axon-h3">Consultation &amp; 3D Scan</h3><p class="axon-step_p">A complimentary exam with a 3D CT scan that maps your bone, bite, and goals, then hands you a clear plan and an itemized quote before anything begins.</p></div></div>
<div class="axon-step"><p class="axon-step_num">02</p><div><h3 class="axon-h3">Placement &amp; Same-Day Teeth</h3><p class="axon-step_p">Dr. Stone performs the placement with guided, minimally invasive technique; sedation is available. Most patients head home the same day with a fixed temporary arch in place.</p></div></div>
<div class="axon-step"><p class="axon-step_num">03</p><div><h3 class="axon-h3">Your Permanent Smile</h3><p class="axon-step_p">Once the implants have fused with the jaw, generally 4 to 6 months, your custom final arch goes in, shaped to your face and made to last.</p></div></div>
</div>
<div class="axon-ctas"><a href="{CONSULT_URL}" class="axon-button axon-button_dark">Book a Consultation</a></div>
</div>
<div class="axon-doc_media" data-embed="process-video"></div>
</div>
</div></section>"""

S_GALLERY = f"""
<section class="axon-section axon-section_soft"><div class="axon-container">
<div class="axon-head-block axon-head-block_center axon-center">
<span class="axon-eyebrow">Smile Gallery</span>
<h2 class="axon-h2">Real Patients.<br/><span class="axon-h1_accent">Real Arches. Real Results.</span></h2>
<p class="axon-p">Every arch below started with a conversation, a 3D scan, and a plan designed around that specific patient. No shortcuts, no standard molds.</p>
</div>
<div class="axon-gal3">
<img src="{BA['g']}" alt="{BA_ALT}" class="axon-gal_img" loading="lazy"/>
<img src="{BA['h']}" alt="{BA_ALT}" class="axon-gal_img" loading="lazy"/>
<img src="{BA['j']}" alt="{BA_ALT}" class="axon-gal_img" loading="lazy"/>
<img src="{BA['c']}" alt="{BA_ALT}" class="axon-gal_img" loading="lazy"/>
<img src="{BA['e']}" alt="{BA_ALT}" class="axon-gal_img" loading="lazy"/>
<img src="{BA['l']}" alt="{BA_ALT}" class="axon-gal_img" loading="lazy"/>
</div>
<p class="axon-disclaimer">Individual results vary. All photos show actual patients of Stone Dental Implant Center.</p>
<div class="axon-ctas axon-ctas_center"><a href="{CONSULT_URL}" class="axon-button axon-button_dark">Book a Consultation</a></div>
</div></section>"""

S_SPACE = f"""
<section class="axon-section"><div class="axon-container">
<div class="axon-head-block axon-head-block_center axon-center">
<span class="axon-eyebrow">The Experience</span>
<h2 class="axon-h2">Comfortable, Modern,<br/><span class="axon-h1_accent">And Built Around You</span></h2>
<p class="axon-p">The experience starts the moment you arrive. Our team speaks English and Spanish, and someone is available 24/7 to help you schedule. Virtual consultations are available for out-of-town patients.</p>
</div>
<div class="axon-off5">
<img src="{EXTERIOR}" alt="Stone Dental Implant Center in Westlake, TX" class="axon-off_a" loading="lazy"/>
<img src="{RECEPTION}" alt="Reception at Stone Dental Implant Center" class="axon-off_b" loading="lazy"/>
<img src="{FRONTDESK}" alt="The Stone Dental Implant Center team at the front desk" class="axon-off_c" loading="lazy"/>
<img src="{DR_PHOTO}" alt="Dr. Mona Stone in the consultation room at Stone Dental Implant Center" class="axon-off_c" loading="lazy"/>
<img src="{DR_STANDING}" alt="Dr. Mona Stone, DDS, at Stone Dental Implant Center" class="axon-off_c" loading="lazy"/>
</div>
<div class="axon-ctas axon-ctas_center"><a href="{PHONE_TEL}" class="axon-button axon-button_dark">Call {PHONE_DISPLAY}</a></div>
</div></section>"""

S_FAQ = """
<section class="axon-section axon-section_soft"><div class="axon-container">
<div class="axon-head-block axon-head-block_center axon-center">
<span class="axon-eyebrow">Before You Call</span>
<h2 class="axon-h2">Questions We Hear Most</h2>
</div>
<div class="axon-faq_slot"></div>
</div></section>"""

S_FINAL = f"""
<section class="axon-section axon-section_navytop axon-center"><div class="axon-container"><div class="axon-final_inner">
<span class="axon-eyebrow axon-eyebrow_light">Time Matters</span>
<h2 class="axon-h2 axon-h2_light">Bone Loss Doesn't Wait.<br/><span class="axon-h1_accent">See Where You Stand Today.</span></h2>
<p class="axon-p axon-p_light axon-p_lead">The 3D CT scan at your complimentary consultation maps exactly what your case needs before anything begins.</p>
<div class="axon-final_media" data-embed="final-video"></div>
<div class="axon-ctas axon-ctas_center">
<a href="{CONSULT_URL}" class="axon-button axon-button_yellow">Book a Consultation</a>
<a href="{PHONE_TEL}" class="axon-button axon-button_ghost">Call {PHONE_DISPLAY}</a>
</div>
<p class="axon-alt">Prefer to talk? Call <a href="{PHONE_TEL}" class="axon-alt_a">{PHONE_DISPLAY}</a>. Mon 9 to 5 · Tue 9 to 5 · Wed 9 to 3 · Thu 9 to 5 · Fri 9 to 4. Someone is available 24/7 to schedule.</p>
</div></div></section>"""

S_MARKS = """
<section class="axon-marks"><div class="axon-container">
<p class="axon-marks_lab">Dr. Mona Stone, DDS</p>
<div class="axon-marks_slot"></div>
</div></section>"""

S_FOOTER = f"""
<footer class="axon-footer"><div class="axon-container">
<div class="axon-footer_grid">
<div class="axon-footer_col">
<img src="{LOGO}" alt="Stone Dental Implant Center logo" class="axon-footer_logo" loading="lazy"/>
<p class="axon-footer_p">{ADDRESS}<br/>{PHONE_DISPLAY}</p>
<p class="axon-footer_p">Mon 9 to 5 · Tue 9 to 5 · Wed 9 to 3 · Thu 9 to 5 · Fri 9 to 4</p>
</div>
<div class="axon-footer_col">
<p class="axon-footer_h">Practice</p>
<a href="/meet-dr-mona-stone" class="axon-footer_link">Meet Dr. Mona Stone</a>
<a href="/patient-testimonials" class="axon-footer_link">Patient Testimonials</a>
<a href="/contact" class="axon-footer_link">Contact</a>
</div>
</div>
<p class="axon-disc">Individual results vary with each patient's oral health, anatomy and treatment plan. Nothing on this page is a diagnosis or a promise of a specific outcome. Candidacy for dental implants is determined at a clinical examination with Dr. Mona Stone. Any range shown is typical and is confirmed in an itemized quote at your consultation. All photographs on this page show actual patients of Stone Dental Implant Center.</p>
<div class="axon-footer_bottom">
<p class="axon-footer_legal">© 2026 Stone Dental Implant Center. All Rights Reserved.</p>
<div class="axon-footer_links">
<a href="/privacy-policy" class="axon-footer_legal">Privacy Policy</a>
<a href="/terms-of-service" class="axon-footer_legal">Terms of Service</a>
</div>
</div>
</div></footer>"""

LANDING_V2 = [
    ("header", S_HEADER, ""),
    ("hero", S_HERO, ""),
    ("trust", S_TRUST, ""),
    ("journey", S_JOURNEY, ""),
    ("story", S_STORY, ""),
    ("specialist", S_SPECIALIST, ""),
    ("options", S_OPTIONS, ""),
    ("process", S_PROCESS, ""),
    ("gallery", S_GALLERY, ""),
    ("space", S_SPACE, ""),
    ("faq", S_FAQ, ""),
    ("final", S_FINAL, ""),
    ("marks", S_MARKS, ""),
    ("footer", S_FOOTER, ""),
]

# ---------------------------------------------------------------------------
# EMBEDS  (inserted after the structure; whtml strips iframes, style and script)
# key -> (container style name, index among same-styled containers, code)
# ---------------------------------------------------------------------------
EMBEDS = {
    "hero-video": yt_embed(V_EXPLAINER, "All on 4 explained, Stone Dental Implant Center"),
    "story-wide": yt_embed(V_WILLIAM, "William Goldman, All-on-X patient testimony"),
    "story-v1": vimeo_embed(VM_2, "All-on-4 transformation, Stone Dental Implant Center"),
    "story-v2": vimeo_embed(VM_3, "A new smile before the holidays"),
    "story-v3": vimeo_embed(VM_1, "One arch, one plan, one day"),
    "story-v4": yt_embed(V_DON, "Don Hull, patient testimony"),
    "story-v5": yt_embed(V_SAMUEL, "Samuel Compos, patient testimony"),
    "story-v6": yt_embed(V_NOV, "Stone Dental Implant Center patient testimony"),
    "story-o1": yt_embed(V_WAYNE, "Wayne, facial trauma treatment"),
    "story-o2": yt_embed(V_BARBARA, "Barbara, alveoloplasty"),
    "doctor-video": yt_embed(V_DOCTOR, "Dr. Mona Stone, Stone Dental Implant Center"),
    "process-video": yt_embed(V_OVERVIEW, "Stone Dental Implant Center practice overview"),
    "final-video": yt_embed(V_RON, "Patient Ron, Stone Dental Implant Center testimonial"),
}

# ---------------------------------------------------------------------------
# FAQ  (10 questions; every answer traced to the client's own live pages)
# ---------------------------------------------------------------------------
FAQ = [
    ("How much do All-on-X implants cost?",
     "All-on-X in the Westlake and DFW area typically ranges from about $25,000 to $50,000 or more per arch, depending on the number of implants, materials, and whether any bone work is needed. Stone Dental Implant Center provides a full itemized quote at your consultation, with financing through Lending Club, Cherry, Sunbit and Proceed Finance."),
    ("What exactly is All-on-X?",
     "All-on-X replaces an entire arch of teeth using a few strategically placed titanium implants, usually four to six, that support a fixed set of permanent teeth. The X is the number of implants a case needs. Unlike dentures, they stay in permanently and function like natural teeth."),
    ("Am I a candidate if I have bone loss?",
     "In most cases, yes. Dr. Stone can often angle implants around areas of bone loss, or perform grafting and sinus lifts when needed. A 3D scan at your consultation determines your bone density and the right plan for your case, including complex cases other clinics turn away."),
    ("Will my new teeth look natural?",
     "Yes. This is the heart of the Stone Artistry approach. Your new arch is designed around your face, with the shape, shade, and proportion matched to your features, so the result looks like it always belonged to you, not like a generic set of teeth."),
    ("Who actually performs my surgery?",
     "Dr. Mona Stone does, start to finish. She is a board-certified oral and maxillofacial surgeon, and she places the implants and restores the case herself rather than referring your surgery out."),
    ("What happens at my first visit?",
     "Your first visit includes a 3D CT scan and a full treatment plan. Most patients leave with a clear plan and honest answers, not a sales pitch. Virtual consultations are available for out-of-town patients."),
    ("Is sedation available?",
     "Yes. Sedation is available, and every case is planned for gentle, minimally invasive treatment from your first visit through healing."),
    ("How long does the process take?",
     "Most patients leave with same-day temporary teeth on the day of surgery. The implants then integrate with the jawbone over about 4 to 6 months, after which your custom permanent arch is placed."),
    ("Does insurance cover All-on-X?",
     "Coverage varies. Some medical plans, including certain BlueCross BlueShield medical policies, may cover portions of full-arch treatment, and many PPO dental plans cover extractions, grafts, or sedation. We work with most PPO plans as an out-of-network provider and verify your benefits before treatment. We do not accept Medicaid or government grant programs."),
    ("What financing do you offer?",
     "Stone Dental Implant Center works with Lending Club, Cherry, Sunbit and Proceed Finance. Your itemized quote at the consultation shows what your plan covers and what financing would look like for the balance."),
]


def faq_code():
    items = []
    for q, a in FAQ:
        items.append(
            '<details class="sfaq__item">'
            f'<summary class="sfaq__q"><span>{q}</span><span class="sfaq__i" aria-hidden="true"></span></summary>'
            f'<div class="sfaq__a"><p>{a}</p></div>'
            "</details>"
        )
    return (
        "<style>"
        ".sfaq{display:block}"
        ".sfaq__item{background:#fff;border:1px solid rgba(8,31,51,.1);border-radius:12px;"
        "margin-bottom:12px;overflow:hidden}"
        ".sfaq__q{list-style:none;cursor:pointer;display:flex;align-items:center;"
        "justify-content:space-between;gap:16px;padding:20px 24px;font-family:Montserrat,sans-serif;"
        "font-size:16px;font-weight:600;color:#081f33;line-height:1.4}"
        ".sfaq__q::-webkit-details-marker{display:none}"
        ".sfaq__i{flex:0 0 auto;width:14px;height:14px;position:relative}"
        ".sfaq__i::before,.sfaq__i::after{content:'';position:absolute;background:#2179a8;"
        "transition:transform .2s ease}"
        ".sfaq__i::before{top:6px;left:0;width:14px;height:2px}"
        ".sfaq__i::after{top:0;left:6px;width:2px;height:14px}"
        ".sfaq__item[open] .sfaq__i::after{transform:rotate(90deg)}"
        ".sfaq__a{padding:0 24px 22px}"
        ".sfaq__a p{margin:0;font-family:Montserrat,sans-serif;font-size:15px;line-height:1.7;"
        "color:#606060}"
        "@media (max-width:479px){.sfaq__q{padding:16px 18px;font-size:15px}"
        ".sfaq__a{padding:0 18px 18px}}"
        "</style>"
        '<div class="sfaq">' + "".join(items) + "</div>"
    )


MARKS = [
    "Board-Certified Oral &amp; Maxillofacial Surgeon",
    "Biomedical Engineering Degree",
    "UMKC Doctorate of Dental Surgery",
    "Residency Across 3 Level 1 Trauma Centers",
    "Attending Surgeon, Baylor &amp; Methodist",
    "KLS MARTIN IPS® Certified",
    "Pinnacle Faculty",
]


def marks_code():
    run = "".join(f'<span class="smk__i">{m}</span>' for m in MARKS)
    return (
        "<style>"
        ".smk{overflow:hidden;position:relative;-webkit-mask-image:linear-gradient(90deg,"
        "transparent,#000 8%,#000 92%,transparent);mask-image:linear-gradient(90deg,transparent,"
        "#000 8%,#000 92%,transparent)}"
        ".smk__t{display:flex;width:max-content;animation:smkscroll 42s linear infinite}"
        ".smk:hover .smk__t{animation-play-state:paused}"
        ".smk__i{flex:0 0 auto;display:inline-flex;align-items:center;padding:0 28px;"
        "font-family:Montserrat,sans-serif;font-size:13px;font-weight:600;letter-spacing:1.2px;"
        "text-transform:uppercase;color:#081f33;white-space:nowrap}"
        ".smk__i::after{content:'\\00B7';margin-left:28px;color:#2179a8}"
        "@keyframes smkscroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}"
        "@media (prefers-reduced-motion:reduce){.smk__t{animation:none;"
        "flex-wrap:wrap;justify-content:center;width:100%}}"
        "</style>"
        '<div class="smk"><div class="smk__t">' + run + run + "</div></div>"
    )
