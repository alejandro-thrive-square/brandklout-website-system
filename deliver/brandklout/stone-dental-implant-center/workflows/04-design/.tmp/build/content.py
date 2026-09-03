# -*- coding: utf-8 -*-
"""
Stone Dental Implant Center - All-on-X ad campaign pages.
Structure mirrors the Livewell Dental ad trio (dental-implants / consultation / thank-you)
with Stone brand: Italiana + Montserrat, navy #081f33, cyan #2179a8, yellow #e6ff0b.
All copy sourced from stonedentalimplantcenter.com (real facts only, no Livewell content).
Class namespace: axon- (single class per element, Client-First-style naming).
"""

SITE = "6a07d5aac093f0e4521d29bc"
PAGE_LANDING = "6a99792d6642f8d8d2c99716"      # exists, empty, in folder
PAGE_CONSULT = "6a9985eb38e229b39cdcd4d2"      # created
PAGE_THANKYOU = "6a9985ec10482f3af4ffd9b4"     # created
BODY = {
    PAGE_LANDING: "6a99792d6642f8d8d2c9971e",
}

A = "https://s3.amazonaws.com/webflow-prod-assets/6a07d5aac093f0e4521d29bc"
LOGO = f"{A}/6a34f5db3786087800f3849f_SDIC-logo-color-mark.avif"
DR_BANNER = f"{A}/6a3404b4443bc2708d79cb70_Doctor%20Mona%20Stone%20Banner.avif"
DR_PHOTO = f"{A}/6a340c349acbd3186be2deda_Doctor%20Mona%20Stone%20at%20Stone%20Dental%20Implant%20Center.avif"
BA1 = f"{A}/6a243c49dce540a251f39f96_Before%20%26%20After%20All%20on%20X%20implants.avif"
BA2 = f"{A}/6a243c48a98c22a30080966a_Before%20%26%20After%20All%20on%20X%20implants%20(2).avif"
BA3 = f"{A}/6a243c48f9cbac0dbfc993ec_Before%20%26%20After%20All%20on%20X%20implants%20(3).avif"
BA5 = f"{A}/6a26c04317afa4924cd7ae7e_Before%20%26%20After%20All%20on%20X%20implants%20(5).avif"
OFFICE = f"{A}/6a243dd05e851946a905e6b3_Why%20choose%20Stone%20Surgical%20Implant%20Center.avif"
REVIEWS_IMG = f"{A}/6a3407750e3beac5523da944_Testimonials.avif"
GALLERY_IMG = f"{A}/6a3408dc610055531405ef18_Before%20After%20gallery.avif"
GOOGLE = f"{A}/6a33f3e401860ff91205816a_google.png"
YELP = f"{A}/6a33f3e4f505bf94b3bedc68_yelp.png"

PHONE_DISPLAY = "(817) 383-8361"
PHONE_TEL = "tel:+18173838361"
CONSULT_URL = "/ads-landing-pages/all-on-x-consultation"
GHL_FORM = "https://api.leadconnectorhq.com/widget/form/0mtZk3CrshD7Y0OYOao4"

CONSULT_IFRAME = (
    '<iframe title="Stone Dental Implant Center Consultation Request" '
    f'src="{GHL_FORM}" style="width:100%;height:560px;border:none;border-radius:8px" '
    'loading="lazy" scrolling="auto"></iframe>'
)

# ---------------------------------------------------------------------------
# SHARED CSS  (styles are site-global; identical values are idempotent)
# ---------------------------------------------------------------------------
CSS = """
/* layout */
.page-wrapper { min-height: 100vh; position: relative; overflow: hidden; }
.axon-section { position: relative; padding-top: 96px; padding-bottom: 96px; }
.axon-section_dark { background-color: #081f33; }
.axon-section_soft { background-color: #f2f2f2; }
.axon-section_navytop { background-color: #081f33; background-image: radial-gradient(circle at 78% 18%, rgba(33, 121, 168, 0.35), transparent 55%); }
.axon-container { max-width: 1216px; margin-left: auto; margin-right: auto; padding-left: 32px; padding-right: 32px; position: relative; }
.axon-grid2 { display: grid; grid-template-columns: 1.05fr 0.95fr; gap: 64px; align-items: center; }
.axon-grid2_top { align-items: start; }
.axon-grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
.axon-grid4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
.axon-grid2ba { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
.axon-center { text-align: center; }
.axon-head-block { max-width: 720px; margin-bottom: 56px; }
.axon-head-block_center { margin-left: auto; margin-right: auto; }
/* type */
.axon-eyebrow { display: inline-block; color: #2179a8; letter-spacing: 2px; text-transform: uppercase; font-family: Montserrat, sans-serif; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
.axon-eyebrow_light { color: #7fb8d4; }
.axon-h1 { font-family: Italiana, sans-serif; color: #081f33; font-size: 60px; line-height: 1.08; font-weight: 400; margin-top: 0; margin-bottom: 24px; }
.axon-h1_light { color: #ffffff; }
.axon-h1_accent { color: #e6ff0b; }
.axon-h2 { font-family: Italiana, sans-serif; color: #081f33; font-size: 44px; line-height: 1.12; font-weight: 400; margin-top: 0; margin-bottom: 20px; }
.axon-h2_light { color: #ffffff; }
.axon-h3 { font-family: Montserrat, sans-serif; color: #081f33; font-size: 20px; line-height: 1.35; font-weight: 600; margin-top: 0; margin-bottom: 12px; }
.axon-h3_light { color: #ffffff; }
.axon-h4 { font-family: Montserrat, sans-serif; color: #081f33; font-size: 16px; line-height: 1.4; font-weight: 600; margin-top: 0; margin-bottom: 8px; }
.axon-p { font-family: Montserrat, sans-serif; color: #606060; font-size: 16px; line-height: 1.7; font-weight: 400; margin-top: 0; margin-bottom: 16px; }
.axon-p_light { color: rgba(255, 255, 255, 0.82); }
.axon-p_lead { font-size: 18px; }
.axon-p_small { font-size: 14px; margin-bottom: 8px; }
.axon-strong { color: #081f33; font-weight: 600; }
.axon-note { font-family: Montserrat, sans-serif; color: #4d4d4d; font-size: 14px; line-height: 1.6; margin-top: 16px; margin-bottom: 0; }
.axon-note_light { color: rgba(255, 255, 255, 0.6); }
.axon-stars { color: #efb44d; font-size: 18px; letter-spacing: 2px; margin-right: 8px; }
.axon-rating { display: inline-flex; align-items: center; background-color: rgba(255, 255, 255, 0.08); border-radius: 100px; padding: 8px 18px; font-family: Montserrat, sans-serif; color: rgba(255, 255, 255, 0.85); font-size: 14px; margin-bottom: 28px; }
.axon-rating_dark-text { color: #4d4d4d; background-color: #ffffff; box-shadow: 0 2px 10px rgba(8, 31, 51, 0.08); }
/* header */
.axon-header { background-color: #ffffff; position: sticky; top: 0; z-index: 1000; box-shadow: 0 2px 12px rgba(8, 31, 51, 0.08); }
.axon-header_inner { display: flex; align-items: center; justify-content: space-between; max-width: 1216px; margin-left: auto; margin-right: auto; padding-left: 32px; padding-right: 32px; height: 76px; }
.axon-logo { height: 48px; width: auto; display: block; }
.axon-header_right { display: flex; align-items: center; gap: 24px; }
.axon-header_phone { font-family: Montserrat, sans-serif; color: #081f33; font-size: 16px; font-weight: 600; text-decoration: none; }
.axon-header_phone:hover { color: #2179a8; }
/* buttons */
.axon-button { display: inline-block; background-color: #2179a8; color: #ffffff; font-family: Montserrat, sans-serif; font-size: 16px; font-weight: 600; line-height: 1.2; text-align: center; text-decoration: none; padding: 16px 32px; border-radius: 8px; transition: background-color 200ms ease; }
.axon-button:hover { background-color: #081f33; color: #ffffff; }
.axon-button_yellow { background-color: #e6ff0b; color: #081f33; }
.axon-button_yellow:hover { background-color: #ffffff; color: #081f33; }
.axon-button_ghost { background-color: transparent; color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.5); }
.axon-button_ghost:hover { background-color: rgba(255, 255, 255, 0.1); color: #ffffff; }
.axon-button_dark { background-color: #081f33; }
.axon-button_dark:hover { background-color: #2179a8; }
.axon-ctas { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-top: 32px; }
.axon-ctas_center { justify-content: center; }
/* hero */
.axon-hero-pad { padding-top: 72px; padding-bottom: 112px; }
.axon-bullets { display: grid; grid-template-columns: 1fr; gap: 12px; margin-top: 8px; margin-bottom: 0; padding-left: 0; list-style: none; }
.axon-bullet { display: flex; align-items: baseline; gap: 10px; font-family: Montserrat, sans-serif; color: rgba(255, 255, 255, 0.88); font-size: 16px; line-height: 1.5; }
.axon-check { color: #e6ff0b; font-weight: 700; }
.axon-hero_media { margin-top: 40px; border-radius: 14px; overflow: hidden; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35); }
.axon-hero_media-img { width: 100%; height: auto; display: block; }
.axon-media_caption { display: block; font-family: Montserrat, sans-serif; color: rgba(255, 255, 255, 0.65); font-size: 14px; margin-top: 14px; }
.axon-form_card { background-color: #ffffff; border-radius: 16px; padding: 36px 32px; box-shadow: 0 30px 70px rgba(0, 0, 0, 0.4); }
.axon-form_title { font-family: Montserrat, sans-serif; color: #081f33; font-size: 24px; line-height: 1.25; font-weight: 600; margin-top: 0; margin-bottom: 10px; }
.axon-form_sub { font-family: Montserrat, sans-serif; color: #4d4d4d; font-size: 14px; line-height: 1.6; margin-top: 0; margin-bottom: 22px; }
.axon-form_embed { width: 100%; }
.axon-chips { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 28px; }
.axon-chip { display: inline-flex; align-items: center; gap: 8px; background-color: rgba(255, 255, 255, 0.08); border-radius: 100px; padding: 10px 18px; font-family: Montserrat, sans-serif; color: rgba(255, 255, 255, 0.88); font-size: 14px; }
.axon-chip_dot { width: 8px; height: 8px; border-radius: 50%; background-color: #e6ff0b; display: inline-block; }
.axon-doctor_card { display: flex; align-items: center; gap: 16px; background-color: rgba(255, 255, 255, 0.06); border-radius: 12px; padding: 16px; margin-top: 32px; }
.axon-doctor_img { width: 72px; height: 72px; border-radius: 50%; object-fit: cover; }
.axon-doctor_name { font-family: Montserrat, sans-serif; color: #ffffff; font-size: 15px; font-weight: 600; margin-top: 0; margin-bottom: 4px; }
.axon-doctor_cred { font-family: Montserrat, sans-serif; color: rgba(255, 255, 255, 0.65); font-size: 13px; line-height: 1.5; margin: 0; }
/* trust strip */
.axon-trust { display: flex; align-items: center; justify-content: center; gap: 48px; padding-top: 28px; padding-bottom: 28px; flex-wrap: wrap; }
.axon-trust_item { display: flex; align-items: center; gap: 10px; font-family: Montserrat, sans-serif; color: #4d4d4d; font-size: 15px; font-weight: 500; }
.axon-trust_img { height: 28px; width: auto; }
.axon-trust_stars { color: #efb44d; letter-spacing: 2px; }
/* before/after */
.axon-ba_item { background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 12px 40px rgba(8, 31, 51, 0.1); }
.axon-ba_img { width: 100%; height: auto; display: block; }
.axon-ba_caption { display: flex; align-items: center; justify-content: space-between; padding: 16px 20px; }
.axon-ba_label { font-family: Montserrat, sans-serif; color: #081f33; font-size: 14px; font-weight: 600; margin: 0; }
.axon-ba_tag { font-family: Montserrat, sans-serif; color: #2179a8; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin: 0; }
.axon-disclaimer { font-family: Montserrat, sans-serif; color: #4d4d4d; font-size: 13px; text-align: center; margin-top: 28px; margin-bottom: 0; }
/* story cards */
.axon-story_card { background-color: #ffffff; border-radius: 14px; padding: 32px; box-shadow: 0 10px 30px rgba(8, 31, 51, 0.07); }
.axon-story_quote { font-family: Italiana, sans-serif; color: #081f33; font-size: 26px; line-height: 1.25; margin-top: 0; margin-bottom: 14px; }
.axon-story_num { display: inline-block; font-family: Italiana, sans-serif; color: #2179a8; font-size: 15px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 14px; }
/* features */
.axon-feature { background-color: #ffffff; border: 1px solid #e4e8ec; border-radius: 14px; padding: 28px; }
.axon-feature_dark { background-color: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.12); }
.axon-feature_p { font-family: Montserrat, sans-serif; color: #606060; font-size: 15px; line-height: 1.65; margin: 0; }
.axon-feature_p_light { color: rgba(255, 255, 255, 0.78); }
/* specialist */
.axon-doc_img { width: 100%; height: auto; display: block; border-radius: 14px; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35); }
.axon-creds { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
.axon-cred { background-color: rgba(255, 255, 255, 0.08); border-radius: 100px; padding: 8px 16px; font-family: Montserrat, sans-serif; color: rgba(255, 255, 255, 0.85); font-size: 13px; font-weight: 500; }
/* options */
.axon-option { background-color: #ffffff; border: 1px solid #e4e8ec; border-radius: 16px; padding: 36px 32px; display: flex; flex-direction: column; gap: 0; }
.axon-option_featured { border: 2px solid #2179a8; box-shadow: 0 20px 50px rgba(33, 121, 168, 0.15); }
.axon-option_tag { display: inline-block; align-self: flex-start; background-color: #2179a8; color: #ffffff; font-family: Montserrat, sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; border-radius: 100px; padding: 6px 14px; margin-bottom: 18px; }
.axon-option_p { font-family: Montserrat, sans-serif; color: #606060; font-size: 15px; line-height: 1.65; margin-top: 0; margin-bottom: 24px; }
.axon-option_meta { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #e4e8ec; padding-top: 14px; padding-bottom: 14px; }
.axon-option_k { font-family: Montserrat, sans-serif; color: #4d4d4d; font-size: 14px; margin: 0; }
.axon-option_v { font-family: Montserrat, sans-serif; color: #081f33; font-size: 14px; font-weight: 600; text-align: right; margin: 0; }
.axon-option_cta { margin-top: auto; padding-top: 24px; }
/* steps */
.axon-step { display: flex; gap: 24px; align-items: flex-start; }
.axon-step_num { font-family: Italiana, sans-serif; color: #2179a8; font-size: 52px; line-height: 1; margin: 0; flex-shrink: 0; }
.axon-step_p { font-family: Montserrat, sans-serif; color: #606060; font-size: 15px; line-height: 1.65; margin: 0; }
.axon-steps_grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; }
/* office */
.axon-office_img { width: 100%; height: auto; display: block; border-radius: 14px; box-shadow: 0 20px 50px rgba(8, 31, 51, 0.15); }
/* faq */
.axon-faq_list { max-width: 860px; margin-left: auto; margin-right: auto; }
.axon-faq_item { border-bottom: 1px solid #e4e8ec; padding-top: 24px; padding-bottom: 24px; }
.axon-faq_q { font-family: Montserrat, sans-serif; color: #081f33; font-size: 18px; line-height: 1.4; font-weight: 600; margin-top: 0; margin-bottom: 10px; }
.axon-faq_a { font-family: Montserrat, sans-serif; color: #606060; font-size: 15px; line-height: 1.7; margin: 0; }
/* thank-you */
.axon-ty_badge { display: inline-flex; align-items: center; gap: 10px; background-color: rgba(230, 255, 11, 0.12); border: 1px solid rgba(230, 255, 11, 0.4); border-radius: 100px; padding: 10px 20px; font-family: Montserrat, sans-serif; color: #e6ff0b; font-size: 14px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 28px; }
.axon-ty_center { max-width: 720px; margin-left: auto; margin-right: auto; }
.axon-ty_steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }
.axon-ty_step { background-color: #ffffff; border-radius: 14px; padding: 32px; box-shadow: 0 10px 30px rgba(8, 31, 51, 0.07); }
.axon-ty_num { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; border-radius: 50%; background-color: #081f33; color: #e6ff0b; font-family: Montserrat, sans-serif; font-size: 16px; font-weight: 700; margin-bottom: 18px; }
/* reviews */
.axon-reviews_img { width: 100%; height: auto; display: block; border-radius: 14px; box-shadow: 0 20px 50px rgba(8, 31, 51, 0.15); }
.axon-reviews_grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; align-items: center; margin-top: 48px; }
/* footer */
.axon-footer { background-color: #061725; padding-top: 64px; padding-bottom: 40px; }
.axon-footer_grid { display: flex; justify-content: space-between; gap: 48px; flex-wrap: wrap; }
.axon-footer_col { max-width: 380px; }
.axon-footer_logo { height: 52px; width: auto; margin-bottom: 20px; }
.axon-footer_p { font-family: Montserrat, sans-serif; color: rgba(255, 255, 255, 0.65); font-size: 14px; line-height: 1.7; margin-top: 0; margin-bottom: 12px; }
.axon-footer_h { font-family: Montserrat, sans-serif; color: #ffffff; font-size: 14px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; margin-top: 0; margin-bottom: 18px; }
.axon-footer_link { display: block; font-family: Montserrat, sans-serif; color: rgba(255, 255, 255, 0.65); font-size: 14px; text-decoration: none; margin-bottom: 10px; }
.axon-footer_link:hover { color: #ffffff; }
.axon-footer_bottom { border-top: 1px solid rgba(255, 255, 255, 0.1); margin-top: 48px; padding-top: 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.axon-footer_legal { font-family: Montserrat, sans-serif; color: rgba(255, 255, 255, 0.45); font-size: 13px; margin: 0; }
.axon-footer_links { display: flex; gap: 20px; flex-wrap: wrap; }
/* before-after slider (real elements; behavior from a small script embed) */
.axon-ba2 { position: relative; overflow: hidden; border-radius: 14px; max-width: 640px; margin-left: auto; margin-right: auto; box-shadow: 0 24px 60px rgba(8, 31, 51, 0.25); user-select: none; aspect-ratio: 572 / 763; background-color: #0b1622; touch-action: pan-y; }
.axon-ba2__img { position: absolute; left: 0; top: 0; width: 100%; height: 100%; object-fit: cover; }
.axon-ba2__before { position: absolute; left: 0; top: 0; width: 100%; height: 100%; }
.axon-ba2__bar { position: absolute; left: 50%; top: 0; width: 3px; height: 100%; background-color: #e6ff0b; transform: translateX(-50%); z-index: 3; pointer-events: none; }
.axon-ba2__knob { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); width: 46px; height: 46px; border-radius: 50%; background-color: #e6ff0b; color: #081f33; display: flex; align-items: center; justify-content: center; font-family: Montserrat, sans-serif; font-size: 18px; font-weight: 700; z-index: 3; pointer-events: none; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.4); }
.axon-ba2__tag { position: absolute; top: 16px; background-color: rgba(8, 31, 51, 0.72); color: #ffffff; font-family: Montserrat, sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; padding: 7px 14px; border-radius: 100px; pointer-events: none; z-index: 2; }
.axon-ba2__tag--l { left: 16px; }
.axon-ba2__tag--r { right: 16px; background-color: rgba(33, 121, 168, 0.85); }
.axon-ba2__hint { text-align: center; font-family: Montserrat, sans-serif; color: #4d4d4d; font-size: 14px; margin-top: 14px; margin-bottom: 0; }
.axon-gallery-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.axon-gallery_img { width: 100%; height: auto; display: block; border-radius: 14px; box-shadow: 0 12px 40px rgba(8, 31, 51, 0.1); }
.axon-office-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
.axon-office_img2 { width: 100%; height: auto; display: block; border-radius: 14px; box-shadow: 0 12px 40px rgba(8, 31, 51, 0.12); }
.axon-ba2_script { display: none; }
@media screen and (max-width: 767px) {
  .axon-gallery-grid { grid-template-columns: 1fr; }
  .axon-office-grid { grid-template-columns: 1fr; }
}
/* final cta */
.axon-final_inner { max-width: 760px; margin-left: auto; margin-right: auto; }
/* responsive */
@media screen and (max-width: 991px) {
  .axon-h1 { font-size: 46px; }
  .axon-h2 { font-size: 36px; }
  .axon-section { padding-top: 72px; padding-bottom: 72px; }
  .axon-hero-pad { padding-top: 48px; padding-bottom: 80px; }
  .axon-grid2 { grid-template-columns: 1fr; gap: 48px; }
  .axon-grid4 { grid-template-columns: 1fr 1fr; }
  .axon-steps_grid { grid-template-columns: 1fr; gap: 32px; }
  .axon-ty_steps { grid-template-columns: 1fr; gap: 24px; }
  .axon-form_card { padding: 28px 24px; }
  .axon-doctor_card { margin-top: 24px; }
}
@media screen and (max-width: 767px) {
  .axon-container { padding-left: 24px; padding-right: 24px; }
  .axon-header_inner { padding-left: 24px; padding-right: 24px; }
  .axon-header_phone { display: none; }
  .axon-h1 { font-size: 40px; }
  .axon-h2 { font-size: 31px; }
  .axon-grid3 { grid-template-columns: 1fr; }
  .axon-grid2ba { grid-template-columns: 1fr; }
  .axon-reviews_grid { grid-template-columns: 1fr; }
  .axon-ctas { flex-direction: column; align-items: stretch; }
  .axon-button { width: 100%; }
  .axon-trust { gap: 24px; }
}
@media screen and (max-width: 479px) {
  .axon-h1 { font-size: 34px; }
  .axon-h2 { font-size: 27px; }
  .axon-grid4 { grid-template-columns: 1fr; }
  .axon-section { padding-top: 56px; padding-bottom: 56px; }
  .axon-form_card { padding: 24px 20px; border-radius: 12px; }
  .axon-logo { height: 40px; }
}
"""

# ---------------------------------------------------------------------------
# PAGE 1: LANDING  (mirrors Livewell /ads-landing-pages/dental-implants)
# ---------------------------------------------------------------------------
LANDING = [
    ("header", f"""
<header class="axon-header"><div class="axon-header_inner">
<a href="/" aria-label="Stone Dental Implant Center home"><img src="{LOGO}" alt="Stone Dental Implant Center logo" class="axon-logo" loading="eager"/></a>
<div class="axon-header_right">
<a href="{PHONE_TEL}" class="axon-header_phone">{PHONE_DISPLAY}</a>
<a href="{CONSULT_URL}" class="axon-button">Book a Consultation</a>
</div>
</div></header>""", ""),

    ("hero", f"""
<section class="axon-section axon-section_navytop axon-hero-pad" id="top"><div class="axon-container"><div class="axon-grid2 axon-grid2_top">
<div>
<span class="axon-eyebrow axon-eyebrow_light">All-on-X Implants · Westlake, TX &amp; DFW</span><br/>
<span class="axon-rating"><span aria-hidden="true" class="axon-stars">★★★★★</span>255+ Five-Star Reviews · Board-Certified Surgeon</span>
<h1 class="axon-h1 axon-h1_light">Permanent Teeth. One Day.<br/><span class="axon-h1_accent">Designed Around Your Face.</span></h1>
<p class="axon-p axon-p_light axon-p_lead">Full-arch All-on-X restoration handled entirely in-house by Dr. Mona Stone, a board-certified oral &amp; maxillofacial surgeon in Westlake, TX.<br/><br/>Surgery, design, and the final smile, all under one roof.</p>
<ul class="axon-bullets" role="list">
<li class="axon-bullet"><span class="axon-check">✓</span>Complimentary first visit with a 3D scan</li>
<li class="axon-bullet"><span class="axon-check">✓</span>A fixed temporary arch the same day in most cases</li>
<li class="axon-bullet"><span class="axon-check">✓</span>Solutions for bone loss and complex cases</li>
</ul>
<div class="axon-ctas">
<a href="{CONSULT_URL}" class="axon-button axon-button_yellow">Book a Consultation</a>
<a href="{PHONE_TEL}" class="axon-button axon-button_ghost">Call {PHONE_DISPLAY}</a>
</div>
<p class="axon-note axon-note_light">Serving Westlake, Southlake, Keller, Trophy Club &amp; the DFW Metroplex</p>
<div class="axon-hero_media">
<img src="{DR_BANNER}" alt="Dr. Mona Stone, board-certified oral and maxillofacial surgeon at Stone Dental Implant Center" class="axon-hero_media-img" loading="eager"/>
</div>
<span class="axon-media_caption">▶ Dr. Mona Stone on the Stone approach to implant care</span>
</div>
<div class="axon-form_card" id="book">
<p class="axon-form_title">Request Your All-on-X Consultation</p>
<p class="axon-form_sub">Send us your details and our team will call you to set up your visit.</p>
<div class="axon-form_embed">{CONSULT_IFRAME}</div>
</div>
</div></div></section>""", ""),

    ("trust", f"""
<section class="axon-section axon-section_soft" style="padding-top: 28px; padding-bottom: 28px;"><div class="axon-container"><div class="axon-trust">
<span class="axon-trust_item"><img src="{GOOGLE}" alt="Google" class="axon-trust_img"/>Five-Star Rated on Google</span>
<span class="axon-trust_stars" aria-hidden="true">★★★★★</span>
<span class="axon-trust_item"><img src="{YELP}" alt="Yelp" class="axon-trust_img"/>Five-Star Rated on Yelp</span>
</div></div></section>""", ""),

    ("slider", f"""
<section class="axon-section"><div class="axon-container">
<div class="axon-head-block axon-head-block_center axon-center">
<span class="axon-eyebrow">One Patient's Real Journey</span>
<h2 class="axon-h2">One Patient. One Complete Plan.</h2>
<p class="axon-p">This is a real Stone Dental Implant Center patient. He arrived with several failing teeth and years of patchwork dentistry. Drag the handle to see what changed when his whole arch was rebuilt around one plan, designed for his face.</p>
</div>
<div class="axon-ba2">
<img class="axon-ba2__img" src="https://cdn.prod.website-files.com/6a07d5aac093f0e4521d29bc/6a999e0157206d63ef2f9e97_allonx-p1-after.jpg" alt="After full-arch All-on-X restoration at Stone Dental Implant Center"/>
<div class="axon-ba2__before" style="clip-path: inset(0 50% 0 0)"><img class="axon-ba2__img" src="https://cdn.prod.website-files.com/6a07d5aac093f0e4521d29bc/6a999d7673f796e2592d4891_allonx-p1-before.jpg" alt="Before full-arch restoration at Stone Dental Implant Center"/></div>
<div class="axon-ba2__bar" style="left: 50%"></div>
<div class="axon-ba2__knob" style="left: 50%">↔</div>
<div class="axon-ba2__tag axon-ba2__tag--l">Before</div>
<div class="axon-ba2__tag axon-ba2__tag--r">After</div>
</div>
<p class="axon-ba2__hint">Drag the handle to compare</p>
<div class="axon-ctas axon-ctas_center" style="margin-top: 40px;"><a href="/ads-landing-pages/all-on-x-consultation" class="axon-button">Book a Consultation</a></div>
</div></section>""", ""),
    ("journey", f"""
<section class="axon-section axon-section_soft"><div class="axon-container">
<div class="axon-head-block axon-head-block_center axon-center">
<span class="axon-eyebrow">What Life With All-on-X Feels Like</span>
<h2 class="axon-h2">Before, During, and Long After</h2>
</div>
<div class="axon-grid2">
<div class="axon-story_card"><span class="axon-story_num">01 · The Turning Point</span><p class="axon-story_quote">"I caught myself hiding my smile in photos."</p><p class="axon-feature_p">Soft foods. Chewing on one side. A hand across the mouth. The workarounds accumulate so slowly that years can pass before you notice how much of life has rearranged itself around your teeth.</p></div>
<div class="axon-story_card"><span class="axon-story_num">02 · The Plan</span><p class="axon-story_quote">"Someone finally showed me the whole picture."</p><p class="axon-feature_p">Your jaw is scanned in 3D, your bite is photographed and mapped, and your future smile is designed around your face, so the finish line is visible before treatment even starts.</p></div>
<div class="axon-story_card"><span class="axon-story_num">03 · The Day</span><p class="axon-story_quote">"By that afternoon, it was behind me."</p><p class="axon-feature_p">Dr. Stone places your implants with guided, minimally invasive surgery, and sedation is available. Most patients head home the same day with a fixed temporary arch already in place.</p></div>
<div class="axon-story_card"><span class="axon-story_num">04 · After</span><p class="axon-story_quote">"They feel like they were always mine."</p><p class="axon-feature_p">The final arch is built to your bite, your smile, and the way your face moves. The hardest part, patients tell us, is remembering there was ever anything else.</p></div>
</div>
</div></section>""", ""),

    ("why", f"""
<section class="axon-section"><div class="axon-container">
<div class="axon-head-block axon-head-block_center axon-center">
<span class="axon-eyebrow">Why Stone</span>
<h2 class="axon-h2">Most Clinics Place Implants.<br/>Dr. Stone Designs Faces.</h2>
</div>
<div class="axon-grid4">
<div class="axon-feature"><h3 class="axon-h3">One surgeon, start to finish</h3><p class="axon-feature_p">Your case stays in one pair of hands from the first scan to the final arch: no repeating your story to a new provider, no referrals out.</p></div>
<div class="axon-feature"><h3 class="axon-h3">Designed around your face</h3><p class="axon-feature_p">Jawline, lip line, and proportion are mapped before placement. Your new teeth are shaped to fit your face, not chosen from a catalog.</p></div>
<div class="axon-feature"><h3 class="axon-h3">Comfort at every stage</h3><p class="axon-feature_p">Sedation is available and every case is planned for gentle, minimally invasive treatment, from your first visit through healing.</p></div>
<div class="axon-feature"><h3 class="axon-h3">Complex cases welcome</h3><p class="axon-feature_p">Complex and atrophic cases are welcome here, including bone loss that other clinics turn away. A 3D scan shows what is possible for you.</p></div>
</div>
<div class="axon-ctas axon-ctas_center" style="margin-top: 40px;"><a href="{CONSULT_URL}" class="axon-button axon-button_dark">Book a Consultation</a></div>
</div></section>""", ""),

    ("specialist", f"""
<section class="axon-section axon-section_dark"><div class="axon-container"><div class="axon-grid2">
<img src="{DR_PHOTO}" alt="Dr. Mona Stone at Stone Dental Implant Center" class="axon-doc_img" loading="lazy"/>
<div>
<span class="axon-eyebrow axon-eyebrow_light">Your Surgeon</span>
<h2 class="axon-h2 axon-h2_light">A Surgeon's Training. An Artist's Eye.</h2>
<p class="axon-p axon-p_light">Dr. Mona Stone's path to surgery started in engineering: a biomedical engineering degree, a Doctorate of Dental Surgery from the University of Missouri-Kansas City, and a full oral &amp; maxillofacial surgery residency across three Level 1 trauma centers. Today she is an attending surgeon at Baylor and Methodist, and implant surgery is the heart of her practice.</p>
<p class="axon-p axon-p_light">Where many surgeons focus only on whether an implant will hold, Dr. Stone reads the whole face: proportion, balance, the line of the jaw. She designs each result to look, feel, and age naturally over the years that follow.</p>
<div class="axon-creds">
<span class="axon-cred">Board-Certified OMS</span>
<span class="axon-cred">Biomedical Engineer</span>
<span class="axon-cred">UMKC DDS</span>
<span class="axon-cred">3 Level 1 Trauma Centers</span>
<span class="axon-cred">Attending Surgeon, Baylor &amp; Methodist</span>
<span class="axon-cred">KLS MARTIN IPS® Certified</span>
</div>
<div class="axon-ctas"><a href="{CONSULT_URL}" class="axon-button axon-button_yellow">Book a Consultation</a></div>
</div>
</div></div></section>""", ""),

    ("options", f"""
<section class="axon-section axon-section_soft"><div class="axon-container">
<div class="axon-head-block axon-head-block_center axon-center">
<span class="axon-eyebrow">Your Options</span>
<h2 class="axon-h2">One Tooth or a Whole Arch: The Right Plan for You</h2>
<p class="axon-p">Your consultation maps your bone, bite, timeline, and goals, then points to the path that fits. A quick orientation before your visit.</p>
</div>
<div class="axon-grid2ba">
<div class="axon-option">
<h3 class="axon-h3">Single Dental Implants</h3>
<p class="axon-option_p">An implant rebuilds a single missing tooth, root and crown, without grinding down the healthy teeth beside it.</p>
<div class="axon-option_meta"><p class="axon-option_k">Implants per arch</p><p class="axon-option_v">1</p></div>
<div class="axon-option_meta"><p class="axon-option_k">Replaces</p><p class="axon-option_v">One tooth</p></div>
<div class="axon-option_cta"><a href="{CONSULT_URL}" class="axon-button axon-button_dark" style="width: 100%;">Ask About Single Implants</a></div>
</div>
<div class="axon-option axon-option_featured">
<span class="axon-option_tag">Full-Arch Solution</span>
<h3 class="axon-h3">All-on-X Full-Arch Implants</h3>
<p class="axon-option_p">A complete row of fixed teeth carried by four to six precisely placed implants. It stays in around the clock: nothing removable, nothing to take out at night.</p>
<div class="axon-option_meta"><p class="axon-option_k">Implants per arch</p><p class="axon-option_v">4-6</p></div>
<div class="axon-option_meta"><p class="axon-option_k">Replaces</p><p class="axon-option_v">Full arch</p></div>
<div class="axon-option_meta"><p class="axon-option_k">Same-day temporary teeth</p><p class="axon-option_v">Often yes</p></div>
<div class="axon-option_meta"><p class="axon-option_k">Fixed, non-removable</p><p class="axon-option_v">Yes</p></div>
<div class="axon-option_cta"><a href="{CONSULT_URL}" class="axon-button" style="width: 100%;">Book a Consultation</a></div>
</div>
</div>
</div></section>""", ""),

    ("process", f"""
<section class="axon-section"><div class="axon-container">
<div class="axon-head-block axon-head-block_center axon-center">
<span class="axon-eyebrow">The Process</span>
<h2 class="axon-h2">Three Visits Between You and a Permanent Smile</h2>
</div>
<div class="axon-steps_grid">
<div class="axon-step"><p class="axon-step_num">01</p><div><h3 class="axon-h3">Consultation &amp; 3D Scan</h3><p class="axon-step_p">A complimentary exam (3D scan included) that maps your bone, bite, and goals, then hands you a clear plan and an itemized quote before anything begins.</p></div></div>
<div class="axon-step"><p class="axon-step_num">02</p><div><h3 class="axon-h3">Placement &amp; Same-Day Teeth</h3><p class="axon-step_p">Dr. Stone performs the placement with guided, minimally invasive technique; sedation is available. Most patients head home the same day with a fixed temporary arch in place.</p></div></div>
<div class="axon-step"><p class="axon-step_num">03</p><div><h3 class="axon-h3">Your Permanent Smile</h3><p class="axon-step_p">Once the implants have fused with the jaw, generally 4 to 6 months, your custom final arch goes in, shaped to your face and made to last.</p></div></div>
</div>
</div></section>""", ""),

    ("gallery", f"""
<section class="axon-section axon-section_soft"><div class="axon-container">
<div class="axon-head-block axon-head-block_center axon-center">
<span class="axon-eyebrow">Smile Gallery</span>
<h2 class="axon-h2">Real Arches. Real Results.</h2>
<p class="axon-p">Every arch below started with a conversation, a 3D scan, and a plan designed around that specific patient. No shortcuts, no standard molds.</p>
</div>
<div class="axon-gallery-grid">
<img class="axon-gallery_img" src="https://s3.amazonaws.com/webflow-prod-assets/6a07d5aac093f0e4521d29bc/6a243c49dce540a251f39f96_Before%20%26%20After%20All%20on%20X%20implants.avif" alt="All-on-X patient before and after full-arch restoration" loading="lazy"/>
<img class="axon-gallery_img" src="https://s3.amazonaws.com/webflow-prod-assets/6a07d5aac093f0e4521d29bc/6a243c48a98c22a30080966a_Before%20%26%20After%20All%20on%20X%20implants%20(2).avif" alt="All-on-X full-arch patient result" loading="lazy"/>
<img class="axon-gallery_img" src="https://s3.amazonaws.com/webflow-prod-assets/6a07d5aac093f0e4521d29bc/6a243c48f9cbac0dbfc993ec_Before%20%26%20After%20All%20on%20X%20implants%20(3).avif" alt="All-on-X full-arch patient result" loading="lazy"/>
<img class="axon-gallery_img" src="https://s3.amazonaws.com/webflow-prod-assets/6a07d5aac093f0e4521d29bc/6a26c04317afa4924cd7ae7e_Before%20%26%20After%20All%20on%20X%20implants%20(5).avif" alt="All-on-X full-arch patient result" loading="lazy"/>
</div>
<p class="axon-disclaimer">Individual results vary. All photos show actual patients of Stone Dental Implant Center.</p>
<div class="axon-ctas axon-ctas_center" style="margin-top: 32px;"><a href="/ads-landing-pages/all-on-x-consultation" class="axon-button axon-button_dark">Book a Consultation</a></div>
</div></section>""", ""),
    ("office", f"""
<section class="axon-section axon-section_soft"><div class="axon-container"><div class="axon-grid2">
<div>
<span class="axon-eyebrow">The Experience</span>
<h2 class="axon-h2">Comfortable, Modern, and Built Around You</h2>
<p class="axon-p">The experience starts the moment you arrive. Our team speaks English and Spanish, and someone is available 24/7 to help you schedule.</p>
<div class="axon-ctas"><a href="tel:+18173838361" class="axon-button axon-button_dark">Call (817) 383-8361</a></div>
</div>
<div class="axon-office-grid">
<img class="axon-office_img2" src="https://s3.amazonaws.com/webflow-prod-assets/6a07d5aac093f0e4521d29bc/6a243dd05e851946a905e6b3_Why%20choose%20Stone%20Surgical%20Implant%20Center.avif" alt="The front desk team welcoming patients at Stone Dental Implant Center" loading="lazy"/>
<img class="axon-office_img2" src="https://s3.amazonaws.com/webflow-prod-assets/6a07d5aac093f0e4521d29bc/6a3408dc610055531405ef18_Before%20After%20gallery.avif" alt="A happy Stone Dental Implant Center patient" loading="lazy"/>
</div>
</div></div></section>""", ""),
    ("faq", f"""
<section class="axon-section"><div class="axon-container">
<div class="axon-head-block axon-head-block_center axon-center">
<span class="axon-eyebrow">FAQ</span>
<h2 class="axon-h2">Questions We Hear Most</h2>
</div>
<div class="axon-faq_list">
<div class="axon-faq_item"><h3 class="axon-faq_q">How much do All-on-X implants cost?</h3><p class="axon-faq_a">All-on-X in the Westlake and DFW area typically ranges from about $25,000 to $50,000 or more per arch, depending on the number of implants, materials, and whether any bone work is needed. Stone Dental Implant Center provides a full itemized quote at your consultation, with financing through Lending Club, Cherry, Sunbit and Proceed Finance.</p></div>
<div class="axon-faq_item"><h3 class="axon-faq_q">What exactly is All-on-X?</h3><p class="axon-faq_a">All-on-X replaces an entire arch of teeth using a few strategically placed titanium implants, usually four to six, that support a fixed set of permanent teeth. Unlike dentures, they stay in permanently and function like natural teeth.</p></div>
<div class="axon-faq_item"><h3 class="axon-faq_q">Am I a candidate if I have bone loss?</h3><p class="axon-faq_a">In most cases, yes. Dr. Stone can often angle implants around areas of bone loss or perform grafting and sinus lifts when needed. A 3D scan at your consultation determines your bone density and the right plan for your case, including complex cases other clinics turn away.</p></div>
<div class="axon-faq_item"><h3 class="axon-faq_q">Will my new teeth look natural?</h3><p class="axon-faq_a">Yes: this is the heart of the Stone approach. Your new arch is designed around your face, with the shape, shade, and proportion matched to your features, so the result looks like it always belonged to you.</p></div>
<div class="axon-faq_item"><h3 class="axon-faq_q">Does insurance cover All-on-X?</h3><p class="axon-faq_a">Coverage varies. Some medical plans, including certain BlueCross BlueShield medical policies, may cover portions of full-arch treatment, and many PPO dental plans cover extractions, grafts, or sedation. We work with most PPO plans as an out-of-network provider and verify your benefits before treatment.</p></div>
<div class="axon-faq_item"><h3 class="axon-faq_q">How long does the process take?</h3><p class="axon-faq_a">Most patients leave with same-day temporary teeth on the day of surgery. The implants then integrate with the jawbone over about 4 to 6 months, after which your custom permanent arch is placed.</p></div>
</div>
</div></section>""", ""),

    ("final-cta", f"""
<section class="axon-section axon-section_navytop axon-center"><div class="axon-container"><div class="axon-final_inner">
<span class="axon-eyebrow axon-eyebrow_light">Time Matters</span>
<h2 class="axon-h2 axon-h2_light">Bone Loss Doesn't Wait.<br/><span class="axon-h1_accent">See Where You Stand Today.</span></h2>
<p class="axon-p axon-p_light axon-p_lead">The 3D scan at your complimentary consultation maps exactly what your case needs, before anything begins.</p>
<div class="axon-ctas axon-ctas_center">
<a href="{CONSULT_URL}" class="axon-button axon-button_yellow">Book a Consultation</a>
<a href="{PHONE_TEL}" class="axon-button axon-button_ghost">Call {PHONE_DISPLAY}</a>
</div>
</div></div></section>""", ""),

    ("footer", f"""
<footer class="axon-footer"><div class="axon-container">
<div class="axon-footer_grid">
<div class="axon-footer_col">
<img src="{LOGO}" alt="Stone Dental Implant Center logo" class="axon-footer_logo"/>
<p class="axon-footer_p">Board-certified oral &amp; maxillofacial surgeon Dr. Mona Stone: full-arch All-on-X, single implants, and full scope oral surgery for Westlake, Southlake, Keller, Trophy Club &amp; the DFW Metroplex.</p>
<p class="axon-footer_p">72 Andorra Dr #110A, Westlake, TX 76262<br/>{PHONE_DISPLAY}</p>
</div>
<div class="axon-footer_col">
<p class="axon-footer_h">Implant Dentistry</p>
<a href="/all-on-x-implants" class="axon-footer_link">All-on-X Implants</a>
<a href="/single-dental-implants" class="axon-footer_link">Single Dental Implants</a>
<a href="/same-day-implants" class="axon-footer_link">Same-Day Implants</a>
<a href="/bone-grafting" class="axon-footer_link">Bone Grafting</a>
<a href="/sinus-lift" class="axon-footer_link">Sinus Lift</a>
</div>
<div class="axon-footer_col">
<p class="axon-footer_h">Practice</p>
<a href="/meet-dr-mona-stone" class="axon-footer_link">Meet Dr. Mona Stone</a>
<a href="/patient-testimonials" class="axon-footer_link">Patient Testimonials</a>
<a href="/before-after" class="axon-footer_link">Before &amp; After</a>
<a href="/contact" class="axon-footer_link">Contact</a>
</div>
</div>
<div class="axon-footer_bottom">
<p class="axon-footer_legal">© 2026 Stone Dental Implant Center. All Rights Reserved.</p>
<div class="axon-footer_links">
<a href="/privacy-policy" class="axon-footer_legal" style="text-decoration: none;">Privacy Policy</a>
<a href="/terms-of-service" class="axon-footer_legal" style="text-decoration: none;">Terms of Service</a>
</div>
</div>
</div></footer>""", ""),
]

# ---------------------------------------------------------------------------
# PAGE 2: CONSULTATION (mirrors Livewell /ads-landing-pages/dental-implant-consultation)
# ---------------------------------------------------------------------------
CONSULT = [
    ("header", f"""
<header class="axon-header"><div class="axon-header_inner">
<a href="/" aria-label="Stone Dental Implant Center home"><img src="{LOGO}" alt="Stone Dental Implant Center logo" class="axon-logo" loading="eager"/></a>
<div class="axon-header_right"><a href="{PHONE_TEL}" class="axon-button axon-button_dark">Call {PHONE_DISPLAY}</a></div>
</div></header>""", ""),

    ("hero", f"""
<section class="axon-section axon-section_navytop axon-hero-pad" id="quiz"><div class="axon-container"><div class="axon-grid2 axon-grid2_top">
<div>
<span class="axon-eyebrow axon-eyebrow_light">Now Booking Consultations</span><br/>
<span class="axon-rating"><span aria-hidden="true" class="axon-stars">★★★★★</span>255+ Five-Star Reviews · Board-Certified Surgeon</span>
<h1 class="axon-h1 axon-h1_light">Book Your<br/><span class="axon-h1_accent">Free Consultation</span></h1>
<p class="axon-p axon-p_light axon-p_lead">Share a few details below and our team will call you to set up your visit.</p>
<div class="axon-chips">
<span class="axon-chip"><span class="axon-chip_dot"></span>No cost, no obligation</span>
<span class="axon-chip"><span class="axon-chip_dot"></span>Every plan approved by Dr. Stone</span>
</div>
<div class="axon-doctor_card">
<img src="{DR_PHOTO}" alt="Dr. Mona Stone, DDS" class="axon-doctor_img" loading="lazy"/>
<div><p class="axon-doctor_name">Dr. Mona Stone, DDS</p><p class="axon-doctor_cred">Board-certified oral &amp; maxillofacial surgeon · Attending surgeon at Baylor &amp; Methodist</p></div>
</div>
</div>
<div class="axon-form_card" id="book">
<p class="axon-form_title">Request Your All-on-X Consultation</p>
<p class="axon-form_sub">Send us your details and our team will call you to set up your visit.</p>
<div class="axon-form_embed">{CONSULT_IFRAME}</div>
</div>
</div></div></section>""", ""),

    ("reviews", f"""
<section class="axon-section"><div class="axon-container">
<div class="axon-head-block axon-head-block_center axon-center">
<span class="axon-eyebrow">Patient Stories</span>
<h2 class="axon-h2">Trusted by Smiles Across DFW</h2>
<p class="axon-p">The people best qualified to describe this practice are the patients who have been through it. Here is what DFW patients say about care with Dr. Stone.</p>
</div>
<div class="axon-reviews_grid">
<img src="{REVIEWS_IMG}" alt="A Stone Dental Implant Center patient smiling" class="axon-reviews_img" loading="lazy"/>
<img src="{GALLERY_IMG}" alt="A happy Stone Dental Implant Center patient" class="axon-reviews_img" loading="lazy"/>
</div>
<p class="axon-disclaimer">Individual results vary. See more patient stories on <a href="/patient-testimonials" style="color: #2179a8;">our testimonials page</a>, or see our five-star ratings on <a href="https://share.google/Jp7TQU61UOoErBtcS" target="_blank" style="color: #2179a8;">Google</a> and <a href="https://www.yelp.com/biz/stone-dental-implant-center-westlake-5" target="_blank" style="color: #2179a8;">Yelp</a>.</p>
</div></section>""", ""),

    ("footer", f"""
<footer class="axon-footer"><div class="axon-container">
<div class="axon-footer_grid">
<div class="axon-footer_col">
<img src="{LOGO}" alt="Stone Dental Implant Center logo" class="axon-footer_logo"/>
<p class="axon-footer_p">72 Andorra Dr #110A, Westlake, TX 76262<br/>{PHONE_DISPLAY}</p>
<p class="axon-footer_p">Mon 9-5 · Tue 9-5 · Wed 9-3 · Thu 9-5 · Fri 9-4</p>
</div>
<div class="axon-footer_col">
<p class="axon-footer_h">Practice</p>
<a href="/meet-dr-mona-stone" class="axon-footer_link">Meet Dr. Mona Stone</a>
<a href="/patient-testimonials" class="axon-footer_link">Patient Testimonials</a>
<a href="/contact" class="axon-footer_link">Contact</a>
</div>
</div>
<div class="axon-footer_bottom">
<p class="axon-footer_legal">© 2026 Stone Dental Implant Center. All Rights Reserved.</p>
<div class="axon-footer_links">
<a href="/privacy-policy" class="axon-footer_legal" style="text-decoration: none;">Privacy Policy</a>
<a href="/terms-of-service" class="axon-footer_legal" style="text-decoration: none;">Terms of Service</a>
</div>
</div>
</div></footer>""", ""),
]

# ---------------------------------------------------------------------------
# PAGE 3: THANK YOU (mirrors Livewell /ads-landing-pages/thank-you-implants)
# ---------------------------------------------------------------------------
THANKYOU = [
    ("header", f"""
<header class="axon-header"><div class="axon-header_inner">
<a href="/" aria-label="Stone Dental Implant Center home"><img src="{LOGO}" alt="Stone Dental Implant Center logo" class="axon-logo" loading="eager"/></a>
<div class="axon-header_right"><a href="{PHONE_TEL}" class="axon-button axon-button_dark">Call {PHONE_DISPLAY}</a></div>
</div></header>""", ""),

    ("ty-hero", f"""
<section class="axon-section axon-section_navytop axon-hero-pad axon-center"><div class="axon-container"><div class="axon-ty_center">
<span class="axon-ty_badge"><span class="axon-chip_dot"></span>Request Received</span>
<h1 class="axon-h1 axon-h1_light">Your Request Is In.<br/><span class="axon-h1_accent">Here's What Happens Next.</span></h1>
<p class="axon-p axon-p_light axon-p_lead">Our team has your request and will reach out shortly. Prefer to move now? Call us and we will put your complimentary consultation with Dr. Stone on the calendar.</p>
<div class="axon-ctas axon-ctas_center">
<a href="{PHONE_TEL}" class="axon-button axon-button_yellow">Call {PHONE_DISPLAY}</a>
</div>
<p class="axon-note axon-note_light">The call takes about two minutes.</p>
</div></div></section>""", ""),

    ("ty-expect", f"""
<section class="axon-section"><div class="axon-container">
<div class="axon-head-block axon-head-block_center axon-center">
<span class="axon-eyebrow">On Your Call</span>
<h2 class="axon-h2">Here's What to Expect</h2>
<p class="axon-p">No pressure and no obligation: here is what we will cover when we talk.</p>
</div>
<div class="axon-ty_steps">
<div class="axon-ty_step"><span class="axon-ty_num">1</span><h3 class="axon-h3">Your treatment options</h3><p class="axon-feature_p">We note your situation and which options fit it, from replacing one tooth to restoring a full arch.</p></div>
<div class="axon-ty_step"><span class="axon-ty_num">2</span><h3 class="axon-h3">Your payment options</h3><p class="axon-feature_p">An overview of what insurance may contribute, what it usually does not, and the financing plans that can cover the rest.</p></div>
<div class="axon-ty_step"><span class="axon-ty_num">3</span><h3 class="axon-h3">Your complimentary consultation</h3><p class="axon-feature_p">We book your no-cost visit at our Westlake office, 3D scan included.</p></div>
</div>
</div></section>""", ""),

    ("ty-risks", f"""
<section class="axon-section axon-section_soft"><div class="axon-container"><div class="axon-grid2">
<div>
<span class="axon-eyebrow">Why Now</span>
<h2 class="axon-h2">Why the Calendar Matters</h2>
<p class="axon-p">Tooth loss is not static, and neither is the bone beneath it. The sooner you evaluate, the more doors stay open.</p>
<div class="axon-ctas"><a href="{PHONE_TEL}" class="axon-button axon-button_dark">Call {PHONE_DISPLAY}</a></div>
</div>
<div>
<div class="axon-story_card" style="margin-bottom: 16px;"><p class="axon-story_quote" style="font-size: 20px;">Jawbone recedes where teeth are missing, which can shrink your options later</p></div>
<div class="axon-story_card" style="margin-bottom: 16px;"><p class="axon-story_quote" style="font-size: 20px;">Adjacent teeth drift into the space, disturbing your bite and complicating care</p></div>
<div class="axon-story_card" style="margin-bottom: 16px;"><p class="axon-story_quote" style="font-size: 20px;">Gum disease and infection become harder to hold off over time</p></div>
<div class="axon-story_card"><p class="axon-story_quote" style="font-size: 20px;">Treatment tends to grow longer, more involved, and more expensive with every year</p></div>
</div>
</div></div></section>""", ""),

    ("ty-why", f"""
<section class="axon-section"><div class="axon-container">
<div class="axon-head-block axon-head-block_center axon-center">
<span class="axon-eyebrow">Why Patients Choose Stone</span>
<h2 class="axon-h2">Three Reasons Patients Trust Dr. Stone</h2>
</div>
<div class="axon-grid3">
<div class="axon-feature"><h3 class="axon-h3">Experience</h3><p class="axon-feature_p">Dr. Mona Stone is a board-certified oral &amp; maxillofacial surgeon, trained across three Level 1 trauma centers and an attending surgeon at Baylor and Methodist, who designs, places, and restores every arch herself.</p></div>
<div class="axon-feature"><h3 class="axon-h3">Face-first design</h3><p class="axon-feature_p">Your arch is mapped to your features with 3D planning and digital smile design, never a one-size-fits-all template. Sedation is available if you want it.</p></div>
<div class="axon-feature"><h3 class="axon-h3">Clear costs</h3><p class="axon-feature_p">Full-arch treatment is a major investment. We confirm your benefits, price any bone work in advance, and hand you an itemized figure before you decide anything.</p></div>
</div>
</div></section>""", ""),

    ("ty-faq", f"""
<section class="axon-section axon-section_soft"><div class="axon-container">
<div class="axon-head-block axon-head-block_center axon-center">
<span class="axon-eyebrow">FAQ</span>
<h2 class="axon-h2">Common Questions</h2>
</div>
<div class="axon-faq_list">
<div class="axon-faq_item"><h3 class="axon-faq_q">Is the consultation really free?</h3><p class="axon-faq_a">Yes. Your first visit is a complimentary evaluation that includes a 3D scan, a review of your options, and an itemized treatment plan with exact fees, before anything begins.</p></div>
<div class="axon-faq_item"><h3 class="axon-faq_q">Does it hurt?</h3><p class="axon-faq_a">Surgery is performed under anesthesia with sedation available. Mild soreness and swelling in the first days is normal and manageable, and most patients describe recovery as easier than they had braced for.</p></div>
<div class="axon-faq_item"><h3 class="axon-faq_q">Will I be without teeth?</h3><p class="axon-faq_a">No. In most cases a fixed temporary arch goes in the same day as surgery. The 3D scan from your consultation visit tells us whether your case qualifies.</p></div>
<div class="axon-faq_item"><h3 class="axon-faq_q">Am I a candidate if I was told I don't have enough bone?</h3><p class="axon-faq_a">Usually, yes. Dr. Stone can often angle implants around areas of bone loss, or rebuild bone with grafting and sinus lifts when needed. The 3D scan at your consultation settles what your case needs.</p></div>
</div>
</div></section>""", ""),

    ("ty-cta", f"""
<section class="axon-section axon-section_navytop axon-center"><div class="axon-container"><div class="axon-final_inner">
<h2 class="axon-h2 axon-h2_light">Talk to the Stone Team Today</h2>
<p class="axon-p axon-p_light axon-p_lead">Book your complimentary visit with Dr. Stone today; the call takes about two minutes.</p>
<div class="axon-ctas axon-ctas_center">
<a href="{PHONE_TEL}" class="axon-button axon-button_yellow">Call {PHONE_DISPLAY}</a>
</div>
<p class="axon-note axon-note_light">Available 24/7 to schedule appointments · 72 Andorra Dr #110A, Westlake, TX 76262</p>
</div></div></section>""", ""),

    ("footer", f"""
<footer class="axon-footer"><div class="axon-container">
<div class="axon-footer_grid">
<div class="axon-footer_col">
<img src="{LOGO}" alt="Stone Dental Implant Center logo" class="axon-footer_logo"/>
<p class="axon-footer_p">72 Andorra Dr #110A, Westlake, TX 76262<br/>{PHONE_DISPLAY}</p>
<p class="axon-footer_p">Mon 9-5 · Tue 9-5 · Wed 9-3 · Thu 9-5 · Fri 9-4</p>
</div>
<div class="axon-footer_col">
<p class="axon-footer_h">Practice</p>
<a href="/meet-dr-mona-stone" class="axon-footer_link">Meet Dr. Mona Stone</a>
<a href="/patient-testimonials" class="axon-footer_link">Patient Testimonials</a>
<a href="/contact" class="axon-footer_link">Contact</a>
</div>
</div>
<div class="axon-footer_bottom">
<p class="axon-footer_legal">© 2026 Stone Dental Implant Center. All Rights Reserved.</p>
<div class="axon-footer_links">
<a href="/privacy-policy" class="axon-footer_legal" style="text-decoration: none;">Privacy Policy</a>
<a href="/terms-of-service" class="axon-footer_legal" style="text-decoration: none;">Terms of Service</a>
</div>
</div>
</div></footer>""", ""),
]

PAGES = {
    PAGE_LANDING: LANDING,
    PAGE_CONSULT: CONSULT,
    PAGE_THANKYOU: THANKYOU,
}
