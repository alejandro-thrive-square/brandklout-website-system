/* /blog/dental-implant-recovery-week-by-week-aftercare-guide.
   Copy: the live post (scenario-1-migration/01-old-site-capture/output/posts/posts/<slug>.md: the
   CMS body and its FAQ pairs), placed, not rewritten. Webflow cruft is gone (empty paragraphs,
   zero-width joiners, classes, inline styles); every <h2> has an id for the contents list beside
   the text, and the faq link goes to the contact page's form (this page carries none).
   Changes:
   - "In Conclusion" bold line -> <h2>
   - link /single-implant -> /services/single-implant ("single-tooth dental implant")
   - link /what-to-expect -> /first-visit-expectations ("What To Expect page")
   - body: phone (201) 488-8866 -> (551) 368-2476 (…Call Hackensack Center for Dental Implants at (201) 488-8866 immediately if you experience:…)
   Removed images (the live blog template's 6a05…/6a06… files, another practice's):
   - 6a73a1e0c0bac73322379e3f_6a060f9871741af52ec778aa_Recovery timeline calendar.png: "Dental implant recovery timeline showing healing stages over six months at Hackensack Center for Dental Implants in Hackensack, NJ"
   - 6a73a1e0c0bac73322379e3a_6a060dd19e42ab474b46ec12_Brushing around implant.jpeg: "Patient brushing carefully around a healing dental implant at Hackensack Center for Dental Implants in Hackensack, NJ" */
import { page, hero, prose, faq, cta } from '../../lib/ui.mjs';

const crumbs = [['/blog', 'Blog'], ['/blog/dental-implant-recovery-week-by-week-aftercare-guide', 'Dental Implant Recovery']];

const body = [
  '<p>Congratulations on taking the step to restore your smile with a dental implant. Whether you have just had your procedure or are preparing for one, knowing exactly what to expect during recovery will help you heal faster, avoid complications, and feel confident every step of the way.</p>',
  '<p>This guide walks you through dental implant recovery week by week, from the first 24 hours after surgery through full osseointegration over the next 3 to 6 months. Every patient heals slightly differently, but the timeline below reflects what most of our <a href="/services/single-implant">single-tooth dental implant</a> patients at Hackensack Center for Dental Implants experience.</p>',
  '<h2 id="the-first-24-hours-after-surgery">The First 24 Hours After Surgery</h2>',
  '<p>The first day after your implant surgery is the most important for setting up successful healing. Your job is simple: rest, control the bleeding, manage swelling, and avoid disturbing the surgical site.</p>',
  '<h3>What To Expect</h3>',
  '<ul><li><strong>Mild bleeding</strong> at the surgical site for the first 2 to 4 hours. Bite gently on the gauze we provide.</li><li><strong>Swelling</strong> that peaks at 48 to 72 hours after surgery. Apply ice packs to the cheek (20 minutes on, 20 minutes off) for the first 24 hours.</li><li><strong>Mild to moderate discomfort</strong> as the local anesthesia wears off. Take prescribed pain medication or ibuprofen as directed before the numbness fully wears off.</li><li><strong>Mild grogginess</strong> if you had IV sedation. You will need a driver and should not work, drive, or sign legal documents for the rest of the day.</li></ul>',
  '<h3>What To Do</h3>',
  '<ul><li>Rest with your head elevated on pillows to reduce swelling</li><li>Keep gauze in place with gentle pressure for 30 to 45 minutes at a time</li><li>Take pain medication as prescribed, before pain becomes severe</li><li>Apply ice packs to the outside of your cheek (20 min on, 20 min off)</li><li>Drink plenty of cool water and clear fluids, but avoid using a straw</li></ul>',
  '<h3>What To Avoid</h3>',
  '<ul><li>No smoking, vaping, or alcohol for at least 72 hours</li><li>No spitting forcefully, as this can dislodge the blood clot</li><li>No drinking through a straw for the first 5 days</li><li>No rinsing or spitting for the first 24 hours</li><li>No driving or operating machinery if you had IV sedation</li></ul>',
  '<h2 id="days-2-to-7-the-first-week">Days 2 to 7: The First Week</h2>',
  '<p>By day 2, the worst of the swelling and discomfort begins to subside. Most patients return to work in a desk job by day 3 to 5 if they feel up to it.</p>',
  '<h3>What To Expect</h3>',
  '<p>Swelling reaches its peak at 48 to 72 hours, then begins to subside. Bruising may appear on the cheek or jaw on day 2 or 3 and usually resolves within a week. Discomfort decreases steadily and is typically manageable with over-the-counter ibuprofen by day 4 or 5.</p>',
  '<h3>Salt Water Rinses Start on Day 2</h3>',
  '<p>Beginning 24 hours after surgery, gently rinse with warm salt water (1/2 teaspoon salt in 8 oz warm water) 3 to 4 times per day, especially after meals. Do not swish forcefully. Let the water flow gently over the surgical area, then let it drip out of your mouth instead of spitting.</p>',
  '<h3>Soft Food Diet</h3>',
  '<p>For the first 7 days, stick to a soft food diet that does not require chewing near the implant site. Good options include:</p>',
  '<ul><li>Smoothies, yogurt, and protein shakes</li><li>Mashed potatoes, cottage cheese, and applesauce</li><li>Soft scrambled eggs, oatmeal, and well-cooked pasta</li><li>Soft fish, ground meat, and tofu</li><li>Avocado, hummus, and refried beans</li></ul>',
  '<p>Avoid hard, crunchy, chewy, or spicy foods. Avoid hot temperatures for the first 24 to 48 hours. Avoid seeds, nuts, popcorn, and anything that could lodge in the surgical site.</p>',
  '<h2 id="weeks-2-to-4-the-soft-tissue-heals">Weeks 2 to 4: The Soft Tissue Heals</h2>',
  '<p>By week 2, the gum tissue around your implant is well on its way to healing. Most patients have returned to normal daily activities. Your follow-up appointment with Dr. Alan Meskin at the 1- to 2-week mark confirms that healing is progressing well.</p>',
  '<h3>What To Expect</h3>',
  '<p>Swelling should be completely gone by week 2. Mild tenderness when chewing on the implant side is normal. Stitches (if non-dissolving) are removed at your follow-up visit. You can begin gentle chewing on the opposite side of the implant.</p>',
  '<h3>Oral Hygiene Resumes</h3>',
  '<p>Begin brushing the implant site gently with a soft toothbrush starting at week 2. Continue salt water rinses after meals. Do not floss directly around the implant abutment until cleared by Dr. Alan Meskin, typically at the 4-week visit.</p>',
  '<h2 id="months-2-to-6-osseointegration">Months 2 to 6: Osseointegration</h2>',
  '<p>This is the longest phase of recovery and the most important biologically. During months 2 through 6, your implant is fusing with your jawbone in a process called osseointegration. The titanium surface of the implant bonds with the surrounding bone at a molecular level, creating a permanent anchor stronger than a natural tooth root.</p>',
  '<p>You will not feel osseointegration happening. From a daily-life perspective, this phase is uneventful. You eat normally, brush and floss normally, and go about your routine. The implant is healing quietly underneath the gum line.</p>',
  '<h3>The Final Crown</h3>',
  '<p>Once Dr. Alan Meskin confirms full osseointegration, typically at 3 to 6 months depending on bone quality, you return for your final crown placement. This visit takes about an hour and involves taking a final impression, then placing the custom-made permanent crown on the implant abutment. From this moment forward, your implant looks, feels, and functions like a natural tooth.</p>',
  '<h2 id="what-could-go-wrong-and-how-to-prevent-it">What Could Go Wrong (And How To Prevent It)</h2>',
  '<p>Dental implants have a success rate of 95% to 98% in healthy patients with proper aftercare. The small risk of failure is almost always preventable. The most common causes of implant failure are:</p>',
  '<ul><li><strong>Smoking</strong>: Smokers have 2 to 3 times the implant failure rate. Quit at least 2 weeks before surgery and avoid smoking for at least 4 weeks after.</li><li><strong>Poor oral hygiene</strong>: Plaque buildup around the implant can cause peri-implantitis, an infection that mimics gum disease.</li><li><strong>Skipping follow-ups</strong>: Regular check-ups catch small issues before they become big problems.</li><li><strong>Chewing too hard too soon</strong>: Putting heavy pressure on the implant during osseointegration can disrupt bone fusion.</li></ul>',
  '<p>For more information on what makes a successful long-term implant case, visit our <a href="/first-visit-expectations">What To Expect page</a>.</p>',
  '<h2 id="when-to-call-us">When To Call Us</h2>',
  '<p>Call Hackensack Center for Dental Implants at <strong>(551) 368-2476</strong> immediately if you experience:</p>',
  '<ul><li>Bleeding that does not stop after 4 hours of pressure</li><li>Severe pain not controlled by prescribed medication</li><li>Swelling that worsens after day 3 instead of improving</li><li>Fever above 101 degrees Fahrenheit</li><li>Pus or foul taste from the surgical site</li><li>Numbness in the lip, tongue, or chin that does not resolve within 24 hours</li></ul>',
  '<h2 id="in-conclusion">In Conclusion</h2>',
  '<p>Dental implant recovery is a marathon, not a sprint. The first week requires the most attention and care, but with proper rest, soft foods, and gentle oral hygiene, you will be back to normal activities quickly. The 3 to 6 month osseointegration period is uneventful from your perspective, but it is when the real long-term success of your implant is built underneath the gum. Follow this guide carefully, attend all your follow-up visits, and you will join the 95% to 98% of patients who enjoy their implants for a lifetime.</p>',
].join('');

/* the contents list, read off the body's h2s so it cannot drift from them */
const toc = '<div class="prose_toc"><p class="prose_toc-title">In this article</p>'
  + [...body.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)].map(([, id, t]) => `<a class="prose_toc-link" href="#${id}">${t}</a>`).join('')
  + '</div>';

export default page({
  path: '/blog/dental-implant-recovery-week-by-week-aftercare-guide',
  crumbs,
  seo: {
    title: 'Dental Implant Recovery: Week-By-Week Guide | Hackensack Center',
    description: 'Dental implant recovery guide for Hackensack, NJ patients, with day-by-day and week-by-week aftercare, diet, hygiene, and healing milestones.',
    image: 'blog-recovery-weeks.webp',
  },
  chapters: [
    hero({
      crumbs,
      variant: 'photo',
      card: false,
      tagline: 'August 22, 2026',
      title: 'Dental Implant Recovery: Your Complete Week-By-Week Aftercare Guide',
      lead: 'Dental implant recovery guide for Hackensack, NJ patients, with day-by-day and week-by-week aftercare, diet, hygiene, and healing milestones.',
      image: { src: 'blog-recovery-weeks.webp', w: 1200, h: 1200, alt: 'Mouthwash, a towel, a bamboo toothbrush and floss' },
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
        ['How long does it take to recover from dental implant surgery?', 'Most patients return to normal daily activities within 3 to 5 days after dental implant surgery. The gum tissue heals within 2 weeks, and the implant fully integrates with your jawbone over the next 3 to 6 months. Your final crown is placed once osseointegration is complete, typically 3 to 6 months after the initial surgery.'],
        ['What should I eat after dental implant surgery?', 'For the first 7 days, stick to a soft food diet including smoothies, yogurt, protein shakes, mashed potatoes, cottage cheese, applesauce, soft scrambled eggs, oatmeal, well-cooked pasta, soft fish, ground meat, and avocado. Avoid hard, crunchy, chewy, or spicy foods, and avoid seeds, nuts, popcorn, and anything that could lodge in the surgical site.'],
        ['How much pain should I expect after dental implant surgery?', 'Most patients experience mild to moderate discomfort for 3 to 5 days after surgery, easily managed with prescribed pain medication or over-the-counter ibuprofen. Many patients report the recovery was far more comfortable than expected. Severe pain that is not controlled by prescribed medication is unusual and should be reported to our office immediately.'],
        ['Can I smoke after dental implant surgery?', 'No. Smoking significantly increases the risk of implant failure. Smokers have 2 to 3 times the implant failure rate compared to non-smokers. We strongly recommend quitting at least 2 weeks before surgery and avoiding all tobacco products for at least 4 weeks after surgery. Vaping carries similar risks and should also be avoided.'],
        ['When can I brush near the implant site?', 'Avoid brushing the surgical site for the first 24 hours after surgery. Beginning 24 hours after surgery, you can gently brush nearby teeth while avoiding the implant site itself. Begin brushing the implant site gently with a soft toothbrush starting at week 2. Continue salt water rinses 3 to 4 times per day after meals during the first 2 weeks.'],
        ['How long does swelling last after dental implant surgery?', 'Swelling typically peaks at 48 to 72 hours after surgery and then begins to subside. Most swelling resolves completely by week 2. Apply ice packs to the cheek (20 minutes on, 20 minutes off) for the first 24 hours to minimize swelling. Bruising on the cheek or jaw may appear on day 2 or 3 and usually resolves within a week.'],
        ['Can I exercise after dental implant surgery?', 'Avoid strenuous exercise for the first 3 to 5 days after surgery. Vigorous activity increases blood pressure and bleeding at the surgical site. Light walking is fine starting day 2. You can usually return to your normal exercise routine after the first week if you feel up to it, but avoid contact sports for 4 weeks.'],
        ['When can I drink alcohol after dental implant surgery?', 'Avoid alcohol for at least 72 hours after surgery. Alcohol can interfere with healing, interact with prescribed medications, and increase bleeding. After 72 hours, light alcohol consumption is generally fine, but avoid heavy drinking for the first 2 weeks. Do not drink alcohol while taking prescription pain medication.'],
        ['Why can\'t I use a straw after dental implant surgery?', 'The suction created by drinking through a straw can dislodge the blood clot that forms at the surgical site, leading to a painful condition called dry socket and delayed healing. Avoid straws for the first 5 days after surgery. Drink directly from a glass or bottle instead, and avoid spitting forcefully for the same reason.'],
        ['When should I call the office during recovery?', 'Contact Hackensack Center for Dental Implants immediately if you experience bleeding that does not stop after 4 hours of pressure, severe pain not controlled by prescribed medication, swelling that worsens after day 3 instead of improving, fever above 101 degrees Fahrenheit, pus or a foul taste from the surgical site, or numbness in the lip, tongue, or chin that does not resolve within 24 hours.'],
      ],
    }),
    cta({
      title: 'Schedule Your Consultation',
    }),
  ],
});
