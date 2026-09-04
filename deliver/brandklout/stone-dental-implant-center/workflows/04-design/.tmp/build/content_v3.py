# -*- coding: utf-8 -*-
"""
Three fixes requested 2026-09-03 after client review:

  1. Landing page   - the FAQ was an HtmlEmbed, so the copy could not be edited in the
                      Designer. Rebuilt as real Webflow elements; only the open/close
                      behaviour stays in an embed, and it contains no copy.
  2. Consult page   - the closing CTA / proof section was missing. Added, cloned from
                      Arvada's `section_qz-proof`.
  3. Thank-you page - "what happens next" and the FAQ were not suited to Stone. Rebuilt to
                      Arvada's structure (two-column expect grid with the delay-risk column
                      and the reassurance line; an 11-item accordion) with Stone's own,
                      sourced content.

Class rule that applies throughout (RUNBOOK gotcha 13): never reuse an existing site class
name with a different rule body, or Webflow mints `name-1` and drops the original
properties. Everything new here uses fresh names (`axon-fq_*`, `axon-ty2_*`, `axon-qz_*`).
"""

import content as C
import content_v2 as V

SITE = C.SITE
PAGE_LANDING = C.PAGE_LANDING
PAGE_CONSULT = C.PAGE_CONSULT
PAGE_THANKYOU = C.PAGE_THANKYOU

PHONE_DISPLAY = C.PHONE_DISPLAY
PHONE_TEL = C.PHONE_TEL
CONSULT_URL = C.CONSULT_URL

# ---------------------------------------------------------------------------
# CSS  (all-new class names)
# ---------------------------------------------------------------------------
CSS_V3 = """
/* editable FAQ accordion: real elements, behaviour supplied by a copy-free embed */
.axon-fq_list { width: 100%; max-width: 860px; margin-left: auto; margin-right: auto; }
.axon-fq_item { background-color: #ffffff; border: 1px solid rgba(8, 31, 51, 0.1); border-radius: 12px; margin-bottom: 12px; overflow: hidden; }
.axon-fq_head { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 24px; cursor: pointer; }
.axon-fq_q { font-family: Montserrat, sans-serif; font-size: 16px; font-weight: 600; line-height: 1.4; color: #081f33; margin-top: 0px; margin-bottom: 0px; }
.axon-fq_icon { width: 14px; height: 14px; flex-shrink: 0; position: relative; }
.axon-fq_bar1 { position: absolute; top: 6px; left: 0px; width: 14px; height: 2px; background-color: #2179a8; }
.axon-fq_bar2 { position: absolute; top: 0px; left: 6px; width: 2px; height: 14px; background-color: #2179a8; }
.axon-fq_body { padding-left: 24px; padding-right: 24px; padding-bottom: 22px; display: flex; gap: 12px; align-items: flex-start; }
.axon-fq_mark { flex-shrink: 0; color: #2179a8; font-weight: 700; line-height: 1.7; font-family: Montserrat, sans-serif; }
.axon-fq_a { font-family: Montserrat, sans-serif; font-size: 15px; line-height: 1.7; color: #606060; margin-top: 0px; margin-bottom: 0px; }

.axon-fq_slotmount { width: 100%; }

/* consult page closing proof block */
.axon-qz_proof { position: relative; overflow: hidden; background-color: #081f33; padding-top: 96px; padding-bottom: 96px; text-align: center; }
.axon-qz_drift { position: absolute; top: 50%; left: 0px; width: 100%; font-family: Italiana, serif; font-size: 92px; line-height: 1; color: rgba(255, 255, 255, 0.05); white-space: nowrap; transform: translateY(-50%); pointer-events: none; }
.axon-qz_in { position: relative; max-width: 720px; margin-left: auto; margin-right: auto; padding-left: 32px; padding-right: 32px; }
.axon-qz_h2 { font-family: Italiana, serif; font-size: 46px; line-height: 1.15; color: #ffffff; margin-top: 16px; margin-bottom: 24px; }
.axon-qz_em { font-style: italic; color: #e6ff0b; }

/* thank-you: expect grid */
.axon-ty2_grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: start; }
.axon-ty2_label { font-family: Montserrat, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: #2179a8; margin-top: 0px; margin-bottom: 24px; }
.axon-ty2_risklabel { font-family: Montserrat, sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 1.4px; text-transform: uppercase; color: #b4472f; margin-top: 0px; margin-bottom: 24px; }
.axon-ty2_steps { display: grid; grid-template-columns: 1fr; gap: 24px; }
.axon-ty2_step { display: flex; gap: 16px; align-items: flex-start; }
.axon-ty2_num { flex-shrink: 0; width: 34px; height: 34px; border-radius: 50%; background-color: #2179a8; color: #ffffff; font-family: Montserrat, sans-serif; font-size: 14px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.axon-ty2_h3 { font-family: Montserrat, sans-serif; font-size: 16px; font-weight: 700; color: #081f33; margin-top: 4px; margin-bottom: 6px; }
.axon-ty2_p { font-family: Montserrat, sans-serif; font-size: 15px; line-height: 1.7; color: #606060; margin-top: 0px; margin-bottom: 0px; }
.axon-ty2_risks { display: grid; grid-template-columns: 1fr; gap: 16px; }
.axon-ty2_risk { display: flex; gap: 12px; align-items: flex-start; background-color: #ffffff; border: 1px solid rgba(180, 71, 47, 0.18); border-radius: 12px; padding: 16px 18px; }
.axon-ty2_riskmark { flex-shrink: 0; color: #b4472f; font-weight: 700; font-family: Montserrat, sans-serif; line-height: 1.6; }
.axon-ty2_reassure { margin-top: 40px; background-color: #ffffff; border-left: 3px solid #2179a8; border-radius: 8px; padding: 20px 24px; }
.axon-ty2_strong { color: #081f33; font-weight: 700; }

@media screen and (max-width: 991px) {
  .axon-qz_drift { font-size: 62px; }
  .axon-qz_h2 { font-size: 38px; }
}
@media screen and (max-width: 767px) {
  .axon-ty2_grid { grid-template-columns: 1fr; gap: 48px; }
  .axon-qz_drift { font-size: 44px; }
  .axon-qz_h2 { font-size: 32px; }
}
@media screen and (max-width: 479px) {
  .axon-fq_head { padding: 16px 18px; }
  .axon-fq_q { font-size: 15px; }
  .axon-fq_body { padding-left: 18px; padding-right: 18px; padding-bottom: 18px; }
  .axon-qz_drift { font-size: 32px; }
  .axon-qz_h2 { font-size: 28px; }
}
"""

# ---------------------------------------------------------------------------
# 1. EDITABLE FAQ  (real elements; the embed below carries behaviour only)
# ---------------------------------------------------------------------------


def faq_html(items):
    """Real Webflow elements. Every string here is editable in the Designer."""
    out = ['<div class="axon-fq_list">']
    for q, a in items:
        out.append(
            '<div class="axon-fq_item">'
            '<div class="axon-fq_head">'
            f'<h3 class="axon-fq_q">{q}</h3>'
            '<div class="axon-fq_icon"><div class="axon-fq_bar1"></div><div class="axon-fq_bar2"></div></div>'
            "</div>"
            '<div class="axon-fq_body">'
            '<span class="axon-fq_mark">&#10003;</span>'
            f'<p class="axon-fq_a">{a}</p>'
            "</div>"
            "</div>"
        )
    out.append("</div>")
    return "".join(out)


# Behaviour only. No copy lives in here, so editing the questions and answers in the
# Designer is safe and nothing in this string ever needs to change.
FAQ_BEHAVIOUR = (
    "<style>"
    ".axon-fq_item .axon-fq_body{display:none}"
    ".axon-fq_item.is-open .axon-fq_body{display:flex}"
    ".axon-fq_item.is-open .axon-fq_bar2{transform:rotate(90deg);transition:transform .2s ease}"
    ".axon-fq_bar2{transition:transform .2s ease}"
    ".axon-fq_head{-webkit-user-select:none;user-select:none}"
    "</style>"
    "<script>"
    "(function(){"
    "function init(){"
    "var heads=document.querySelectorAll('.axon-fq_head');"
    "if(!heads.length){return;}"
    "Array.prototype.forEach.call(heads,function(h,i){"
    "var item=h.parentNode;"
    "h.setAttribute('role','button');h.setAttribute('tabindex','0');"
    "h.setAttribute('aria-expanded', i===0?'true':'false');"
    "if(i===0){item.className+=' is-open';}"
    "function toggle(){"
    "var open=item.className.indexOf('is-open')>-1;"
    "item.className=open?item.className.replace(/\\s*is-open/,''):item.className+' is-open';"
    "h.setAttribute('aria-expanded',open?'false':'true');"
    "}"
    "h.addEventListener('click',toggle);"
    "h.addEventListener('keydown',function(e){"
    "if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle();}"
    "});"
    "});"
    "}"
    "if(document.readyState==='loading'){"
    "document.addEventListener('DOMContentLoaded',init);}else{init();}"
    "})();"
    "</script>"
)

# ---------------------------------------------------------------------------
# 2. CONSULT PAGE: the missing closing CTA / proof section
#    Cloned from Arvada `section_qz-proof`: drift text, label, h2 with an em, rating badge.
#    Arvada carries no button here; neither do we.
# ---------------------------------------------------------------------------
S_CONSULT_CTA = """
<section class="axon-qz_proof">
<div class="axon-qz_drift">implants · artistry · precision · implants · artistry · precision ·</div>
<div class="axon-qz_in">
<span class="axon-eyebrow axon-eyebrow_light">Why Others Chose Stone</span>
<h2 class="axon-qz_h2">One surgeon, <em class="axon-qz_em">start to finish</em></h2>
<span class="axon-rating"><span aria-hidden="true" class="axon-stars">★★★★★</span>255+ Five-Star Reviews · Board-Certified Surgeon</span>
</div>
</section>"""

# ---------------------------------------------------------------------------
# 3. THANK-YOU PAGE
# ---------------------------------------------------------------------------
S_TY_EXPECT = """
<section class="axon-section axon-section_soft"><div class="axon-container">
<div class="axon-head-block axon-head-block_center axon-center">
<span class="axon-eyebrow">What Happens Next</span>
<h2 class="axon-h2">We Are Dedicated To<br/><span class="axon-h1_accent">Getting You Your New Smile</span></h2>
<p class="axon-p">Here is what to expect on the call, and why acting now matters.</p>
</div>
<div class="axon-ty2_grid">
<div>
<p class="axon-ty2_label">On your call, we will go over</p>
<div class="axon-ty2_steps">
<div class="axon-ty2_step"><span class="axon-ty2_num">1</span><div><h3 class="axon-ty2_h3">Your treatment options</h3><p class="axon-ty2_p">We take down your situation and review which path fits, from a single implant through to a full arch, and whether any grafting or a sinus lift is likely to be part of it.</p></div></div>
<div class="axon-ty2_step"><span class="axon-ty2_num">2</span><div><h3 class="axon-ty2_h3">Your payment options</h3><p class="axon-ty2_p">What insurance is likely to contribute and what it does not, explained plainly. We work with most PPO plans as an out-of-network provider, and financing runs through Lending Club, Cherry, Sunbit and Proceed Finance.</p></div></div>
<div class="axon-ty2_step"><span class="axon-ty2_num">3</span><div><h3 class="axon-ty2_h3">Your complimentary consultation</h3><p class="axon-ty2_p">A no-cost visit with a 3D CT scan and a full treatment plan at our Westlake practice. Virtual consultations are available if you are travelling in.</p></div></div>
</div>
</div>
<div>
<p class="axon-ty2_risklabel">What can happen if treatment is delayed</p>
<div class="axon-ty2_risks">
<div class="axon-ty2_risk"><span class="axon-ty2_riskmark">!</span><p class="axon-ty2_p">Bone loss in the jaw, which can narrow the implant options open to you later</p></div>
<div class="axon-ty2_risk"><span class="axon-ty2_riskmark">!</span><p class="axon-ty2_p">Neighbouring teeth shifting, leading to bite problems and more complex treatment</p></div>
<div class="axon-ty2_risk"><span class="axon-ty2_riskmark">!</span><p class="axon-ty2_p">Facial structure changing as the jawbone recedes, the collapse that dentures allow and implants are designed to prevent</p></div>
<div class="axon-ty2_risk"><span class="axon-ty2_riskmark">!</span><p class="axon-ty2_p">More extensive, and more costly, treatment further down the line</p></div>
</div>
</div>
</div>
<div class="axon-ty2_reassure">
<p class="axon-ty2_p"><span class="axon-ty2_strong">No cost, no obligation.</span> We walk you through everything on the call. There is no pressure to decide, and nothing is booked until you say so.</p>
</div>
</div></section>"""

S_TY_FAQ = """
<section class="axon-section"><div class="axon-container">
<div class="axon-head-block axon-head-block_center axon-center">
<span class="axon-eyebrow">Before You Call</span>
<h2 class="axon-h2">Any Questions<br/><span class="axon-h1_accent">Before You Call?</span></h2>
</div>
<div class="axon-fq_slotmount"></div>
</div></section>"""

# 11 questions, matching Arvada's count, framed for someone who has just submitted the form.
# Every answer traced to the client's own live pages. No duplicates.
TY_FAQ = [
    ("Is the consultation really free?",
     "Yes. Your first visit is a complimentary evaluation that includes a 3D CT scan, a review of your options, and an itemized treatment plan with your exact fees before anything begins."),
    ("Who will I be speaking to when you call?",
     "A member of the Stone Dental Implant Center team, who will take down your situation and get your visit on the calendar. Our team speaks English and Spanish, and someone is available 24/7 to schedule."),
    ("Who actually performs the surgery?",
     "Dr. Mona Stone does, start to finish. She is a board-certified oral and maxillofacial surgeon, and she places the implants and restores the case herself rather than referring your surgery out."),
    ("Am I a candidate if I was told I do not have enough bone?",
     "Usually, yes. Dr. Stone can often angle implants around areas of bone loss, or rebuild the site with grafting and a sinus lift when needed. Complex and atrophic cases are welcome here, including cases other clinics turn away. The 3D scan at your consultation settles what your case needs."),
    ("Will I be without teeth at any point?",
     "In most cases, no. A fixed temporary arch goes in the same day as surgery. The 3D scan from your consultation tells us whether your case qualifies."),
    ("How much does All-on-X cost?",
     "All-on-X in the Westlake and DFW area typically ranges from about $25,000 to $50,000 or more per arch, depending on the number of implants, the materials, and whether any bone work is needed. You get a full itemized quote at your consultation."),
    ("What financing is available?",
     "Stone Dental Implant Center works with Lending Club, Cherry, Sunbit and Proceed Finance. Your itemized quote shows what your plan covers and what financing would look like for the balance."),
    ("Will my insurance cover any of it?",
     "Coverage varies. Some medical plans, including certain BlueCross BlueShield medical policies, may cover portions of full-arch treatment, and many PPO dental plans cover extractions, grafts, or sedation. We verify your benefits before treatment. We do not accept Medicaid or government grant programs."),
    ("Is sedation available?",
     "Yes. Sedation is available, and every case is planned for gentle, minimally invasive treatment from your first visit through healing."),
    ("How long does the whole process take?",
     "Most patients leave with same-day temporary teeth on the day of surgery. The implants then integrate with the jawbone over about 4 to 6 months, after which your custom permanent arch is placed."),
    ("Will my new teeth look natural?",
     "Yes. Your new arch is designed around your face, with the shape, shade, and proportion matched to your features, so the result looks like it always belonged to you rather than like a generic set of teeth."),
]

LANDING_FAQ = V.FAQ
