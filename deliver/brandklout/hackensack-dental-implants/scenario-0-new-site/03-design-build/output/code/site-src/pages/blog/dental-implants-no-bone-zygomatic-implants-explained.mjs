/* /blog/dental-implants-no-bone-zygomatic-implants-explained.
   Copy: the live post (scenario-1-migration/01-old-site-capture/output/posts/posts/<slug>.md: the
   CMS body and its FAQ pairs), placed, not rewritten. Webflow cruft is gone (empty paragraphs,
   zero-width joiners, classes, inline styles); every <h2> has an id for the contents list beside
   the text, and the faq link goes to the contact page's form (this page carries none).
   Changes:
   - "In Conclusion" bold line -> <h2>
   - link /all-on-x-implants -> /services/all-on-x ("All-On-X implants")
   - body: "Arvada Dental Center & Implants" -> "Hackensack Center for Dental Implants"
   Removed images (the live blog template's 6a05…/6a06… files, another practice's):
   - 6a73a35f184b48df82b519ec_6a060a3585be8153358f2930_Zygomatic implant anatomical illustration.png: "Anatomical diagram showing zygomatic implant placement through the cheekbone for patients with severe upper-jaw bone loss at Hackensack Center for Dental Implants in Hackensack, NJ"
   - 6a73a35f184b48df82b519f0_6a060a5b34898f395584bb66_Patient transformation after zygomatic.png: "Smiling dental implant patient representing zygomatic implant treatment options in Hackensack, NJ" */
import { page, hero, prose, faq, cta } from '../../lib/ui.mjs';

const crumbs = [['/blog', 'Blog'], ['/blog/dental-implants-no-bone-zygomatic-implants-explained', 'Zygomatic Implants']];

const body = [
  '<p>If you have visited multiple dental practices and been told, “You do not have enough bone for dental implants,” you have likely felt the same disappointment many patients experience before seeking a specialist evaluation at Hackensack Center for Dental Implants.</p>',
  '<p>Severe upper-jaw bone loss does not automatically rule out fixed implant treatment. Zygomatic implants are an advanced treatment option that anchor in the cheekbone instead of relying entirely on the upper jaw. This guide explains what zygomatic implants are, who may qualify, how treatment works, and why specialized planning and surgical expertise are required.</p>',
  '<h2 id="why-most-dentists-say-no-bone-no-implants">Why Most Dentists Say "No Bone, No Implants"</h2>',
  '<p>Traditional dental implants are placed into the jawbone. The implant fuses with the bone over 3 to 5 months in a process called osseointegration, then a crown or bridge is attached on top.</p>',
  '<p>For this to work, you need enough healthy bone in the right places. Years of missing teeth, denture wear, gum disease, or trauma can cause the jawbone to resorb until there is not enough bone for an implant to anchor into. In the upper jaw, the bone often resorbs upward into the sinus cavity, leaving a thin shell of bone with the sinus floor sitting directly above where implants would need to go.</p>',
  '<p>When a general dentist tells you "you have no bone," they usually mean "I cannot place traditional implants because there is not enough bone in your jaw, and I am not trained in the advanced alternatives." This is technically correct from their training perspective, but it leaves patients believing they are out of options when they are not.</p>',
  '<h2 id="what-are-zygomatic-implants">What Are Zygomatic Implants?</h2>',
  '<p>Zygomatic implants are longer titanium implants (typically 30 to 55 mm long, compared to 8 to 13 mm for traditional implants) that anchor into the cheekbone (zygoma) rather than the jaw. The cheekbone is dense, structurally robust, and almost never affected by the bone loss that destroys the upper jaw.</p>',
  '<p>By bypassing the jaw entirely and anchoring into the cheekbone, zygomatic implants create a stable foundation for a fixed full-arch bridge even when the upper jaw is severely atrophied. Most zygomatic cases use 2 zygomatic implants combined with 2 to 4 traditional implants in the remaining front jawbone to support an All-On-X-style full-arch restoration.</p>',
  '<p>The result: a permanent, non-removable set of teeth for patients who have been told for years that implants were not possible for them.</p>',
  '<h2 id="who-is-a-candidate-for-zygomatic-implants">Who Is a Candidate for Zygomatic Implants?</h2>',
  '<p>Zygomatic implants are designed specifically for patients with severe upper-jaw bone loss. You may be a candidate if:</p>',
  '<ul><li>You have been told you have "no bone" for traditional implants</li><li>You have worn upper dentures for many years</li><li>You have had failed previous bone grafts</li><li>You have had failed sinus lifts</li><li>You have severe periodontal disease that has destroyed upper bone</li><li>You want to avoid 6 to 12 months of bone grafting and waiting</li><li>You have been told you need a "sinus lift" but want to skip it</li></ul>',
  '<p>Zygomatic implants are typically used only in the upper jaw because the lower jaw rarely experiences the same severe bone loss. Patients with adequate jawbone are better served by traditional <a href="/services/all-on-x">All-On-X implants</a>, which are less complex and less expensive.</p>',
  '<h2 id="what-is-the-zygomatic-implant-procedure-like">What Is the Zygomatic Implant Procedure Like?</h2>',
  '<p>The full zygomatic procedure at Hackensack Center for Dental Implants takes 2 to 4 hours and is performed under IV sedation, so you sleep through the entire surgery. Here is what to expect.</p>',
  '<h3>Step 1: 3D CBCT Scan and Surgical Planning</h3>',
  '<p>We begin with a detailed 3D Cone Beam CT scan that maps your cheekbones, sinus cavities, and remaining jawbone. Dr. Alan Meskin and the treatment team use this imaging to evaluate your anatomy and plan the position, angle, and depth of each proposed implant.</p>',
  '<h3>Step 2: Sedation and Surgery</h3>',
  '<p>On surgery day, the clinical team follows the personalized sedation and surgical plan established during your consultation. Any necessary extractions and implant placement are completed according to the 3D plan. The procedure time and anesthesia approach depend on your anatomy, health history, and case complexity.</p>',
  '<h3>Step 3: Same-Day Healing Teeth</h3>',
  '<p>When clinically appropriate, a temporary fixed bridge can be attached to the implants on the day of surgery. This allows many patients to leave with fixed temporary teeth while the implants integrate. Same-day loading is not appropriate for every patient and must be confirmed during treatment planning.</p>',
  '<h3>Step 4: Final Zirconia Bridge</h3>',
  '<p>Once integration is complete, your final permanent zirconia bridge is fabricated in our in-house dental lab and placed. The final bridge is custom-shaped, custom-shaded, and designed to last 15 to 20 years or more with proper care.</p>',
  '<h2 id="why-are-zygomatic-implants-available-at-so-few-practices">Why Are Zygomatic Implants Available at So Few Practices?</h2>',
  '<p>Zygomatic implant treatment is complex and requires detailed imaging, individualized surgical planning, and an appropriate anesthesia plan. At Hackensack Center for Dental Implants, the expected procedure time, treatment sequence, and sedation options are determined after a complete 3D evaluation.</p>',
  '<p>Dr. Alan Meskin is an NYU-trained prosthodontist who focuses on dental implants, full-mouth reconstruction, and complex restorative treatment. At Hackensack Center for Dental Implants, cases are planned with 3D CBCT imaging and supported by an on-site dental lab. For advanced zygomatic treatment, the appropriate surgical and anesthesia team is determined after a complete evaluation.</p>',
  '<p>Patients in Hackensack and throughout the Greater Bergen County area who have been told traditional implants are not possible can schedule a 3D evaluation to review advanced treatment options and determine whether zygomatic implants or another approach may be appropriate.</p>',
  '<h2 id="how-much-do-zygomatic-implants-cost">How Much Do Zygomatic Implants Cost?</h2>',
  '<p>Zygomatic implant treatment is highly individualized and pricing depends on how many zygomatic implants are needed, whether standard implants are placed alongside them, and the type of final restoration. We walk you through a fully itemized quote at consultation.</p>',
  '<p>Your treatment coordinator will explain the recommended sedation options and all associated costs in your itemized treatment plan. Financing is available through Cherry, HFD, Proceed, and CareCredit for qualified applicants. Terms and monthly payments vary by applicant. Visit our Insurance &amp; Financing page for additional information.</p>',
  '<h2 id="in-conclusion">In Conclusion</h2>',
  '<p>If you have been told you do not have enough bone for dental implants, advanced treatment options may still be available. Zygomatic implants can provide support for fixed teeth in selected patients by anchoring in the cheekbone instead of relying entirely on the upper jaw. Because the procedure is complex, candidacy depends on your anatomy, health history, and treatment goals. A consultation and 3D CBCT evaluation at Hackensack Center for Dental Implants can help determine whether zygomatic implants or another implant solution is appropriate for you.</p>',
].join('');

/* the contents list, read off the body's h2s so it cannot drift from them */
const toc = '<div class="prose_toc"><p class="prose_toc-title">In this article</p>'
  + [...body.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)].map(([, id, t]) => `<a class="prose_toc-link" href="#${id}">${t}</a>`).join('')
  + '</div>';

export default page({
  path: '/blog/dental-implants-no-bone-zygomatic-implants-explained',
  crumbs,
  seo: {
    title: 'Dental Implants With No Bone: Zygomatic Implants | Hackensack, NJ',
    description: 'Learn how zygomatic implants may help patients with severe upper-jaw bone loss avoid grafting and review candidacy, treatment, and recovery in Hackensack, NJ.',
    image: 'blog-zygomatic.webp',
  },
  chapters: [
    hero({
      crumbs,
      variant: 'photo',
      card: false,
      tagline: 'August 22, 2026',
      title: 'Can You Get Dental Implants If You Have No Bone? Zygomatic Implants Explained',
      lead: 'Learn how zygomatic implants may help patients with severe upper-jaw bone loss avoid grafting and review candidacy, treatment, and recovery in Hackensack, NJ.',
      image: { src: 'blog-zygomatic.webp', w: 1080, h: 1080, alt: 'Zygomatic implants anchored in the cheekbone, holding a full upper arch (3D illustration)' },
      actions: [],
    }),
    prose({
      name: 'The Article',
      body,
      aside: toc,
    }),
    faq({
      title: 'Frequently Asked Questions',
      link: { href: '/contact#consultation', label: 'Ask us your questions →' },
      items: [
        ['What are zygomatic implants?', 'Zygomatic implants are longer titanium implants, typically 30 to 55 mm long, that anchor into the cheekbone (zygoma) instead of the jawbone. They were designed for patients with severe upper-jaw bone loss who cannot receive traditional dental implants. Most zygomatic cases combine 2 zygomatic implants with 2 to 4 traditional implants to support a fixed full-arch bridge.'],
        ['Can I get dental implants if I have no bone in my jaw?', 'Yes, in almost all cases. Zygomatic implants anchor in the cheekbone rather than the jaw, bypassing missing bone entirely. Patients who have been told elsewhere they have no bone for implants are usually excellent candidates for zygomatic treatment. The only way to know for certain is a 3D CBCT scan and consultation with an experienced zygomatic implant specialist.'],
        ['Why do so few dentists offer zygomatic implants?', 'Zygomatic implant surgery is one of the most technically demanding procedures in implant dentistry. It requires advanced imaging, specialized surgical experience, careful restorative planning, and an appropriate anesthesia team. Dr. Alan Meskin is an NYU-trained prosthodontist who focuses on dental implants, full-mouth reconstruction, and complex restorative treatment. The appropriate clinical team and treatment approach are determined after a complete evaluation.'],
        ['How long does the zygomatic implant procedure take?', 'Procedure time varies according to the patient’s anatomy and treatment plan, but complex zygomatic surgery commonly takes several hours. Sedation and anesthesia are planned individually. When clinically appropriate, a temporary fixed bridge may be placed the same day. Implant integration and delivery of the final restoration generally occur over the following several months.'],
        ['Will I have teeth the same day as zygomatic surgery?', 'Many patients can receive a temporary fixed bridge on the day of surgery, but same-day loading is not appropriate in every case. Dr. Alan Meskin and the treatment team will determine whether your implants have the stability required to support temporary fixed teeth during healing.'],
        ['Is the zygomatic implant procedure painful?', 'Local anesthesia and sedation options are used to keep patients comfortable during treatment. The appropriate sedation method depends on your health history and surgical plan. Postoperative soreness and swelling are expected, and the clinical team will provide individualized instructions for managing discomfort during recovery.'],
        ['How much do zygomatic implants cost in Hackensack, NJ?', 'Zygomatic implant treatment is highly individualized. Pricing depends on the number and type of implants, the surgical plan, sedation requirements, and the final restoration. We provide a fully itemized quote following your evaluation. Financing is available through Cherry, HFD, Proceed, and CareCredit for qualified applicants, with terms varying by applicant.'],
        ['Are zygomatic implants safer than bone grafting?', 'For patients with severe upper-jaw bone loss, zygomatic implants are often safer and more predictable than multiple bone grafts and sinus lifts. Bone grafts have variable success rates, require 6 to 12 months of healing, and can fail in patients with poor bone quality. Zygomatic implants are immediate, predictable, and avoid the staged surgeries of conventional bone grafting paths.'],
        ['How long do zygomatic implants last?', 'Zygomatic implants are designed as a long-term treatment, but longevity depends on the patient’s health, implant integration, oral hygiene, professional maintenance, and restorative wear. The bridge attached to the implants may eventually require repair or replacement. Regular examinations, professional cleanings, and careful home care help support long-term success.'],
        ['What happens if I do nothing about my bone loss?', 'Untreated upper-jaw bone loss continues to progress. The jawbone keeps resorbing over time, which causes the sunken facial appearance many long-term denture wearers develop. Eating becomes increasingly difficult, dentures slip more, and the eventual procedures needed to restore function become more complex and expensive. The earlier you address bone loss with zygomatic implants or another solution, the simpler and more affordable your treatment will be.'],
      ],
    }),
    cta({
      title: 'Schedule Your Consultation',
      text: 'A consultation and 3D CBCT evaluation at Hackensack Center for Dental Implants can help determine whether zygomatic implants or another implant solution is appropriate for you.',
    }),
  ],
});
