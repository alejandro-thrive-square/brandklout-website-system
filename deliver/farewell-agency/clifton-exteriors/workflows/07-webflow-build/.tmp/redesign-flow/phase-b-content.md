# Phase B — Verbatim Content Spec (Old Site Extraction)

Source: saved WordPress/Elementor HTML in scratchpad `oldsite/` (fetched 2026-07-10). All text below is verbatim from the old site (entities decoded, curly quotes preserved). Icons are Font Awesome 5 classes as used by Elementor.

## Gaps & Notes

- **Insurance process steps have NO icons** — the old design uses large numbered headings ("1."–"9.", rendered as `h2`) next to plain icon-boxes. Icon column in section 2a is the number, not a glyph.
- **Financing "We Have Financing" (GreenSky) body copy is 100% lorem ipsum** — only the heading, the `fas fa-dollar-sign` icon, and the Learn More URL are real. Marked [LOREM].
- **No dedicated GreenSky logo image exists.** The page embeds GreenSky's hosted "financing module" widget images instead: `https://www.greensky.com/merchantkit/images/finance_buttons/headers/header_320.jpg?v=3.0.611` (header, alt "Financing Options from GreenSky") and `.../product_headers/hi_product_header_320.jpg?v=3.0.611` (alt "Finance Your Project"). That module (section `73ac4ee7`, heading "Section Headline" + [LOREM] body) also contains 4 plan-specific apply links (dealerplan 2511 / 2602 / 2601 / 2786).
- Financing page also has a fully-lorem "Your Trust Is Important To Us" section (3 icon-boxes "This is the heading" + [LOREM]) — not extracted further, nothing real in it.
- **SVC logo alt text is auto-generated garbage** ("the logo for the reserve of the reserve…") — write a proper alt for the new build.
- **Media page has no headings or captions per video or per grid** — just 4 bare video embeds in two 2-up rows below the standard page hero ("Our Media Center" / "Watch Us Transform Homes Throughout Virginia").
- Checkbox option labels in both forms contain zero-width-space characters (`​`) around some words (e.g. `​Siding​`) — stripped below; do not reproduce.
- Employment form quirks worth knowing: "Mobile" field is `type=text` (not tel); "How Did You Find Out About Us?" is a free **text** input (not the select used elsewhere); Street Address field's name attr is `form_fields[name]` (old-form mess, irrelevant to rebuild).
- FAQ answer 2 has a spacing artifact around a bold span: "the warranty period is 10 years ." — intended text is "…is 10 years."
- Both forms end with an invisible reCAPTCHA v3 field (not listed in tables).
- Insurance form file-upload is preceded by an HTML note (listed below the table); upload fields are not `required`.
- Old contact email is Cloudflare-obfuscated in the HTML; decoded: **info@cliftonexteriors.com**.

---

## 1. Our Process — "A Brand New Home In 10 Simple Steps" (our-process.html)

**H2:** A Brand New Home In 10 Simple Steps

| # | Icon (FA5) | Step title (h3) | Paragraph |
|---|---|---|---|
| 1 | `fab fa-wpforms` | Step 1. Contact Us | Fill out the form on our contact page with information about your project. |
| 2 | `fas fa-phone-alt` | Step 2. Phone Consultation | During the phone consultation, we will talk more in-depth about your project and together, we will go over ballpark pricing, details, and timeline. |
| 3 | `fas fa-house-user` | Step 3. On-Site Consultation | After we’ve discussed the project over the phone, we will come out to your home for an on-site consultation. |
| 4 | `fas fa-signature` | Step 4. Signing The Contract | When you’re comfortable with every aspect of your project and we pick out all the materials, we will sign the contract. We have a no-money-down policy, which means you don’t pay until the project is complete. |
| 5 | `fas fa-tape` | Step 5. Out For Measurements | Within 1 – 2 weeks from the contract date, you will receive a call from our installation department to schedule a visit to conduct precise measurements for your project. |
| 6 | `fas fa-cube` | Step 6. Materials Ordered | After we have taken all the necessary measurements, we will order the materials needed for your project. |
| 7 | `fas fa-lock` | Step 7. We Protect Your Home | On the day of your project’s start, we will make sure to protect the parts of your home that will not be under construction. We ensure to treat your home as if it were our own. |
| 8 | `fas fa-toolbox` | Step 8. We Get To Work | This is where the magic happens. From here, we will keep you updated on our progress and let you know if we encounter any unforeseen circumstances. |
| 9 | `fas fa-walking` | Step 9. Final Walkthrough | Now that your project is complete, we will do a final walkthrough of your improved space. If there is anything you are not 100% happy with, let us know and we’ll take care of it. |
| 10 | `fas fa-shield-alt` | Step 10. Warranty | Even after the project is done, you can rest assured knowing you have a lifetime craftsmanship warranty (10 years on roofing) on all things that are within our control and covered in the contract. You also benefit from the manufacturer’s warranty on materials. |

---

## 2a. Insurance Claims — "Our Insurance Claims Process" (insurance-claims.html)

**H2:** Our Insurance Claims Process
**Subheading (rendered as `p` heading widget):** Helping You Get Coverage For Your Home’s Damage

Icons: none — each step is marked by a large number heading ("1."–"9.").

**1. Initial Consultation**
Your journey begins with a thorough inspection of your home's exterior by one of our certified experts. We'll assess the damage and provide a detailed report, ensuring nothing is overlooked.

**2. Filing Your Claim**
We'll guide you through the process of filing your insurance claim, ensuring all necessary documentation is submitted accurately and on time. Our team will also work directly with your insurance company to advocate on your behalf, ensuring you receive the coverage you deserve.

**3. Inspection Day**
Once you have determined that you would like Clifton Exteriors to be your contractor of choice and represent you through the claims process, we will meet your adjuster during the home inspection and point out any damages observed during the initial contractor inspection. Please note that your insurance company will ultimately decide if there was a sufficient loss, but we can be a second pair of eyes for them during this process. We have been on many inspections after the adjuster inspected the home without us present and initially deemed it a non-sufficient loss. Then, we produced pictures and evidence to the insurance company proving a sufficient loss. So, it's essential to have a contractor present during this process.

**4. Insurance Company Statement Of Loss**
Once a sufficient loss has been deemed and your claim has been approved, your insurance company will send you the damage report in a "Statement of Loss," which outlines the damages in a line-item report. Remember, insurance companies are in the business of making money and may not always have your best interest at heart. It's very common for insurance companies to leave out critical costs that would allow your project to be completed per state code safety & compliance, as well as other items you are entitled to for a properly installed project. We examine the "Statement of Loss" for any missed items in the report and inform your insurance company of any discrepancies.

**5. Supplement Estimate Submission**
Once you forward us the Statement of Loss, we will look it over thoroughly. We will inform your insurance company of anything that was left out. In some cases, we submit a Contractor Supplemental Report to them. This report includes all the approved line items in the original Statement of Loss but may also include other items you are entitled to for code compliance, safety, etc. It's extremely rare that we do not get the insurance company to agree to our Supplemental Report. However, they can be unresponsive to us. Depending on the responsiveness of your assigned adjuster, we may need you to step in to give them a call to keep things moving forward.

**6. Establish The Final Agreement**
Once we work out any pending issues regarding the Statement of Loss with your insurance company, we send you the final agreement and scope of work. This agreement includes picking out colors, available options for the project, and any possible extra work you might want to add to the project that was not part of the Statement of Loss. Please note that we never charge you more than the insurance company has approved for your project. With this agreement, you are only obligated to pay your insurance company deductible out of pocket. With roofing projects, sometimes rotted plywood under the shingles is observed after the tear-off and must be replaced. Insurance companies will not approve added costs for replacing rotted plywood, so an extra charge for this is notated in the agreement if we come across wood rot.

**7. Quality Repairs And Replacements**
Our skilled craftsmen will get to work repairing and replacing the damaged areas of your home’s exterior. Whether it’s roofing, siding, windows, or gutters, we use only the highest quality materials and proven techniques to ensure lasting results.

**8. Final Inspection And Approval**
Upon completion of the project, we’ll conduct a final inspection to ensure everything meets our rigorous standards of quality and craftsmanship. Your satisfaction is our top priority, and we’ll make any necessary adjustments to ensure you’re pleased with the results.

**9. Lifetime Craftsmanship Warranty**
Even after we complete your project, you can rest assured knowing you have a lifetime craftsmanship warranty (10 years on roofing) on all things that are within our control and covered in the contract. You also benefit from the manufacturer’s warranty on materials.

---

## 2b. Insurance Claims — FAQ (4 items)

**Section H2:** Frequently Asked Questions About Insurance Claims In Clifton, VA

**Q1: How do I know if my Clifton home's exterior damage is covered by insurance?**
To determine if your home’s exterior damage is covered by insurance, you need an expert to inspect your property thoroughly. Our certified experts will assess the damage and provide a detailed report. We will help you understand your insurance policy and ensure all necessary documentation is submitted accurately.

**Q2: What is included in Clifton Exteriors' Lifetime Craftsmanship Warranty?**
Our Lifetime Craftsmanship Warranty covers all workmanship-related issues within our control and specified in the contract. This means that if there are any problems with our work, we will fix them at no cost. For roofing, the warranty period is 10 years. Additionally, you benefit from the manufacturer’s warranty on materials. *(note: "10 years" is bolded in the source)*

**Q3: How long does the insurance claims process take from start to finish?**
The duration of your insurance claims process can vary depending on the extent of the damage and your insurance company’s responsiveness. Typically, the process involves an initial consultation, filing the claim, getting approval, and completing the repairs. We strive to make this process as quick and seamless as possible, keeping you informed every step of the way.

**Q4: What types of exterior damage does Clifton Exteriors handle?**
Clifton Exteriors handles exterior damage, including roofing, siding, windows, and gutters. Whether the damage is caused by storms, hail, or other factors, our experienced team is equipped to repair and replace the affected areas using high-quality materials and proven techniques.

---

## 2c. Insurance Claims — Form "Experience Hassle-Free Insurance Claims"

**H1:** Experience Hassle-Free Insurance Claims
**Intro paragraph:** Let us take the stress out of the insurance claims process. Contact us today to schedule your initial consultation and get started on restoring your home’s exterior with confidence.

| # | Label | Type | Required | Options / Placeholder |
|---|---|---|---|---|
| 1 | First Name | text | yes | — |
| 2 | Last Name | text | yes | — |
| 3 | Phone | tel | yes | — |
| 4 | Email | email | yes | — |
| 5 | Street Address | text | yes | — |
| 6 | City | text | yes | — |
| 7 | State | text | yes | — |
| 8 | Zip | text | yes | — |
| 9 | Preferred Method Of Contact. | radio | yes | Call / Text / Email |
| 10 | How Did You Find Out About Us? | select | no | HOA Newsletter; Better Business Bureau; Consumer Checkbook; Yard Sign; Customer Referral; Facebook; Yelp; Nextdoor; Angi; Houzz; Google; Home Show; Other (Please explain below) |
| 11 | What Can We Help With? | checkbox | no | Windows; Siding; Roofing; Entry Doors; Sliding Glass Doors; Trim; Gutters; Leaf Guard; Insurance Claims; Other |
| 12 | Briefly Describe Your Project. | textarea (4 rows) | yes | — |
| — | *(HTML note between fields)* | — | — | "Optional: So we can learn more about your project, please upload a few photos of what we might be working on." |
| 13 | Upload Images Of Your Space | file (multiple) | no | — |

**Submit button:** Submit
*(hidden reCAPTCHA v3 field after field 13)*

---

## 3a. Employment — "Let's Work Together" (employment.html)

**H2:** Let's Work Together
**Paragraph:** Here at Clifton Exteriors, we pride ourselves on the passion and creativity of our team members. Everyone on board understands that client-oriented excellence is not only the goal that we strive for, but it’s what dictates our entire culture. Our 5-star standard demands nothing less than absolute perfection, every single time. That’s why we’re always looking to welcome new recruits who we can trust to embody the same commitment to meeting and exceeding expectations.

Split-section image: `https://www.cliftonexteriors.com/wp-content/uploads/2022/12/CliftonTeam1sections_resizer.webp` (alt: "Clifton Team Photo"). No button in this section.

## 3b. Employment — Form "Apply To Our Crew"

**H2:** Apply To Our Crew
**Intro paragraph:** Use the form below to apply to work with us here at Clifton Exteriors. We will follow up to schedule an interview.

| # | Label | Type | Required | Options / Placeholder |
|---|---|---|---|---|
| 1 | First Name | text | yes | — |
| 2 | Last Name | text | yes | — |
| 3 | Mobile | text *(sic — not tel)* | yes | — |
| 4 | Email | email | yes | — |
| 5 | Street Address | text | yes | — |
| 6 | City | text | yes | — |
| 7 | State | text | yes | — |
| 8 | Zip | text | yes | — |
| 9 | Preferred Method Of Contact. | radio | yes | Call / Text / Email |
| 10 | How Did You Find Out About Us? | text *(free text, not select)* | no | — |
| 11 | Do you have any experience in the following fields? | checkbox | no | Window Replacement and Install; Door Installation; Roofing Repair and Install; Siding Repair and Install; Gutter Repair and Install; Other |
| 12 | Tell us why you're a good candidate for this job. | textarea (4 rows) | yes | — |
| — | *(HTML note between fields)* | — | — | "Important: So we can learn more about you and your job experience, please upload your resume." |
| 13 | Upload Your Resume | file | no | — |

**Submit button:** Send Your Application
*(hidden reCAPTCHA v3 field after field 13)*

---

## 4a. Financing — SVC Financial partner section (financing.html)

**H2:** Get the best financing around with our partner
**Partner logo:** `https://www.cliftonexteriors.com/wp-content/uploads/2023/03/SVC-ENDORSED2x.png` *(alt in source is auto-junk — replace)*
**H2 (offer):** No interest if paid in full in 6 months
**Terms paragraph:** Subject to credit approval. Minimum monthly payment is required. Interest is billed during promotional period but all interest is waived if the purchase amount is paid in full in 6 months.
**Button:** 'Apply Now' → `https://apply.svcfin.com/home/dealerAuthentication?id=815128695&key=1742219857`

## 4b. Financing — "We Have Financing" (GreenSky)

**H2:** We Have Financing
**Icon:** `fas fa-dollar-sign`
**Body:** [LOREM] "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut elit tellus, luctus nec ullamcorper mattis, pulvinar dapibus leo." — needs real copy in redesign.
**Button:** 'Learn More' → `https://projects.greensky.com/merchantloanapplication?apptype=short&merchant=81092412&dealerplan=2511&channel=External-Button-03`
**Logo:** none on old site (see Gaps & Notes — GreenSky merchantkit widget images only).

Related (embedded GreenSky module elsewhere on page, section `73ac4ee7` — heading "Section Headline", body [LOREM]): 4 image-button apply links, all `https://projects.greensky.com/MerchantLoanApplication?apptype=short&merchant=81092412&dealerplan={2511|2602|2601|2786}&channel=External-Button-03`.

## 4c. Financing — icon-benefits trio

| Icon (FA5) | Title | Blurb |
|---|---|---|
| `fas fa-desktop` | Apply Online | Getting financing shouldn't be a hassel. Use the buttons below to apply now! *(sic: "hassel")* |
| `fas fa-stopwatch` | Quick Response Time | Our financing approval times are fast, so you can spend more time focusing on the vision for your home. |
| `fas fa-search-dollar` | Financing Options | We understand that when it comes to investing in your home, you want options. That's why we've partnered with a company that ensures you choose the option that fits your needs most. |

Section lead-in heading above trio: **Learn More About How to Finance Your Project Below**

---

## 5. Testimonials — Thank-you hero (testimonials.html)

**Logo:** `https://www.cliftonexteriors.com/wp-content/uploads/2025/07/be-funkey-clifton-new-logo-150x150.jpg`
**H1:** Thank You For Your Review!
**Blockquote:** It means the world to us that you’ve trusted us with your home renovation project. If we knocked it out of the park, please take a minute to talk about your experience working with us. Feel free to discuss why you were looking to have work done on your home and how we have been able to help solve your problem. Thank you again! - Clifton Exteriors, LLC
**Button 1:** 'Leave a Google review' → `https://g.page/r/CZFuCgyLda_zEB0/review`
**Button 2:** 'Leave a Facebook review' → `https://www.facebook.com/cliftonexteriors/reviews`

Below hero (context): H2 "Client Testimonials" + sub "Read through some of our amazing reviews from past customers and learn more about how we were able to help them achieve their visions for their homes." + Google Reviews shortcode widget.

---

## 6. Media — Videos (media.html)

Page hero: **H1** Our Media Center / **H2** Watch Us Transform Homes Throughout Virginia

No headings or captions per video or per grid row (see Gaps & Notes). Order:

| # | Row | YouTube URL | Video ID |
|---|---|---|---|
| 1 | Row 1 (section a83be5f) | https://www.youtube.com/watch?v=eHL1NqT7Twk | `eHL1NqT7Twk` |
| 2 | Row 1 (section a83be5f) | https://youtu.be/4489D9-zn3E | `4489D9-zn3E` |
| 3 | Row 2 (section 751e5cf) | https://www.youtube.com/watch?v=kqIA3RTBdGk | `kqIA3RTBdGk` |
| 4 | Row 2 (section 751e5cf) | https://www.youtube.com/watch?v=NELbJnxGM84 | `NELbJnxGM84` |

---

## 7. Contact — "Or Get In Touch Directly" (contact-us.html)

**H2:** Or Get In Touch Directly
**Logo:** `https://www.cliftonexteriors.com/wp-content/uploads/2025/07/be-funkey-clifton-new-logo-300x300.jpg`

| Item | Value | Link | Icon (FA5) |
|---|---|---|---|
| Address | 12644 Chapel Rd. #104, Clifton, VA 20124 | https://goo.gl/maps/7QMUL4y9k4cS4TyV7 | `fas fa-home` |
| Phone | +1 (571) 249-1480 | `tel:+1%20(571)%20249-1480` | `fas fa-phone-alt` |
| Email | info@cliftonexteriors.com *(decoded from data-cfemail)* | mailto | `fas fa-envelope` |

**Google Maps iframe src:**
`https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d12433.275260887865!2d-77.4154423!3d38.8251588!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0xf3af758b0c0a6e91!2sClifton%20Exteriors%20LLC!5e0!3m2!1sen!2sus!4v1671128787040!5m2!1sen!2sus`

Context above this section: contact form hero **H1** "Tell Us About Your Project" — "Use our contact form below to get in contact with us so we can start planning out the enhancements for your home." (form itself: same field set as insurance form minus contact-method radio, submit = 'Get Your Quote').

## Version Control

This document follows the root-level version control rules in [SYSTEM_RULES.md](/SYSTEM_RULES.md). Commit only non-secret, repo-friendly workflow context and artifacts.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
