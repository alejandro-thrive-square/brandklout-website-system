/* /blog/foods-to-eat-and-avoid-after-dental-implant-surgery.
   Copy: the live post (scenario-1-migration/01-old-site-capture/output/posts/posts/<slug>.md: the
   CMS body and its FAQ pairs), placed, not rewritten. Webflow cruft is gone (empty paragraphs,
   zero-width joiners, classes, inline styles); every <h2> has an id for the contents list beside
   the text, and the faq link goes to the contact page's form (this page carries none).
   Changes:
   - "In Conclusion" bold line -> <h2>
   - link /single-implant -> /services/single-implant ("single tooth implant")
   - link /all-on-x -> /services/all-on-x ("All-On-X surgery")
   - body: phone (201) 488-8866 -> (551) 368-2476 (…kensack and throughout the Greater Bergen County area. Call (201) 488-8866 to schedule a consultation.…)
   - closing call-to-action paragraph moved from the body into the CTA text
   Removed images (the live blog template's 6a05…/6a06… files, another practice's):
   - 6a66ac1e73b12cac2156b23d_6a06120d0ba59f201a267898_Soft food variety spread.png: "Variety of soft foods recommended after dental implant surgery at Hackensack Center for Dental Implants in Hackensack, NJ"
   - 6a66ac1e73b12cac2156b239_6a06123fb65070aa6c4d09ee_Foods to avoid.png: "Hard and crunchy foods to avoid after dental implant surgery at Hackensack Center for Dental Implants in Hackensack, NJ" */
import { page, hero, prose, faq, cta } from '../../lib/ui.mjs';

const crumbs = [['/blog', 'Blog'], ['/blog/foods-to-eat-and-avoid-after-dental-implant-surgery', 'Foods After Dental Implant Surgery']];

const body = [
  '<p>What you eat in the first weeks after dental implant surgery has a direct impact on how well and how quickly you heal. Eat the right foods, and you give your body the nutrients it needs to integrate the implant with your jawbone. Eat the wrong foods, and you can disrupt the surgical site, dislodge the blood clot, or even cause the implant to fail.</p>',
  '<p>This guide gives you a complete week-by-week list of safe foods, foods to avoid, and the science behind why each recommendation matters. Whether you have just had a <a href="/services/single-implant">single tooth implant</a> or full-arch <a href="/services/all-on-x">All-On-X surgery</a>, the same principles apply with slightly different timelines.</p>',
  '<h2 id="the-first-24-hours-cool-liquids-only">The First 24 Hours: Cool Liquids Only</h2>',
  '<p>For the first 24 hours after implant surgery, your priorities are staying hydrated, avoiding any disturbance to the surgical site, and getting some nutrition without chewing.</p>',
  '<h3>Best Foods For Day 1</h3>',
  '<ul><li><strong>Cool water</strong>, sipped slowly directly from a glass, no straws</li><li><strong>Cool fruit smoothies</strong> made with banana, mango, or berries (strain seeds), sipped not slurped</li><li><strong>Cold yogurt</strong>, plain or with smooth jam, no granola or chunks</li><li><strong>Lukewarm broth or clear soup</strong>, never hot</li><li><strong>Applesauce</strong>, plain or cinnamon</li><li><strong>Pudding</strong>, vanilla or chocolate, smooth texture</li><li><strong>Cold mashed banana</strong></li><li><strong>Protein shakes</strong>, cold or room temperature</li></ul>',
  '<h3>What To Avoid On Day 1</h3>',
  '<ul><li><strong>Hot foods and drinks</strong>, including hot coffee, tea, or soup, which can increase bleeding</li><li><strong>Straws of any kind</strong>, which create suction that can dislodge the blood clot</li><li><strong>Carbonated drinks</strong>, including soda and sparkling water, which can irritate the surgical site</li><li><strong>Alcohol</strong>, which interferes with healing and interacts with pain medication</li><li><strong>Hard, crunchy, or chewy foods</strong> of any kind</li><li><strong>Spicy foods</strong>, which can irritate the surgical site</li></ul>',
  '<h2 id="days-2-to-7-soft-foods-still-no-chewing">Days 2 to 7: Soft Foods, Still No Chewing</h2>',
  '<p>By day 2, you can introduce more variety while still avoiding heavy chewing near the surgical site. Focus on protein, vitamins, and minerals that support healing.</p>',
  '<h3>Protein-Rich Soft Foods</h3>',
  '<p>Protein is essential for tissue repair and bone healing. Aim for 60 to 80 grams of protein per day during the first week:</p>',
  '<ul><li><strong>Soft scrambled eggs</strong>, cooked just past runny</li><li><strong>Greek yogurt</strong>, full-fat for more calories and healing nutrients</li><li><strong>Cottage cheese</strong>, small curd</li><li><strong>Soft fish</strong> like tilapia, cod, or canned salmon</li><li><strong>Soft tofu</strong> in soup or smoothies</li><li><strong>Ground meat</strong> cooked very soft, like sloppy joes or meat sauce on soft pasta</li><li><strong>Refried beans</strong> or hummus</li><li><strong>Protein shakes</strong> with added protein powder if needed</li></ul>',
  '<h3>Vitamin and Mineral Rich Foods</h3>',
  '<p>Vitamin C, vitamin D, calcium, and zinc all support faster healing:</p>',
  '<ul><li><strong>Avocado</strong>, mashed or sliced thin (healthy fats, vitamin K, vitamin E)</li><li><strong>Bananas</strong>, mashed or in smoothies (potassium)</li><li><strong>Cooked spinach</strong>, well-chopped (iron, vitamin K)</li><li><strong>Sweet potato</strong>, mashed (vitamin A, vitamin C)</li><li><strong>Mashed potatoes</strong> with butter (carbs for energy)</li><li><strong>Oatmeal or cream of wheat</strong>, well-cooked (fiber, B vitamins)</li><li><strong>Pumpkin or butternut squash soup</strong>, lukewarm (vitamin A)</li></ul>',
  '<h3>Foods To Strictly Avoid During Week 1</h3>',
  '<ul><li><strong>Anything with seeds</strong>, like raspberries, strawberries, or sesame seed bread, which can lodge in the surgical site</li><li><strong>Nuts and granola</strong>, which are sharp and crunchy</li><li><strong>Popcorn</strong>, which can lodge between teeth and gums</li><li><strong>Chips, pretzels, and crackers</strong></li><li><strong>Hard or crusty bread</strong>, including baguettes and pizza crust</li><li><strong>Raw vegetables</strong>, especially carrots, celery, and bell peppers</li><li><strong>Tough meats</strong>, like steak or chewy chicken</li><li><strong>Spicy foods</strong>, including salsa, hot sauce, and curry</li><li><strong>Citrus fruits and juices</strong>, which can burn the surgical site</li><li><strong>Sticky candies</strong>, caramel, or chewing gum</li></ul>',
  '<h2 id="weeks-2-to-4-gentle-chewing-returns">Weeks 2 to 4: Gentle Chewing Returns</h2>',
  '<p>By week 2, the gum tissue has healed enough that you can start gentle chewing on the opposite side of the implant. The implant itself is still integrating with bone underneath, so you continue to protect the surgical site from heavy pressure.</p>',
  '<h3>New Foods You Can Add</h3>',
  '<ul><li><strong>Well-cooked pasta</strong> with creamy or meat sauce</li><li><strong>Soft rice dishes</strong>, including risotto</li><li><strong>Tender cooked vegetables</strong>, like steamed broccoli or zucchini</li><li><strong>Soft fruits</strong>, like peaches, ripe pears, and bananas</li><li><strong>Pancakes and waffles</strong>, soft and not crispy</li><li><strong>Soft sandwiches</strong> with tender bread, no crusts</li><li><strong>Quiche and frittatas</strong></li><li><strong>Slow-cooked meats</strong>, like pulled pork or pot roast</li></ul>',
  '<h3>Still Avoid</h3>',
  '<ul><li>Anything you have to bite into hard, like apples or corn on the cob</li><li>Anything crunchy, like chips or hard granola bars</li><li>Sticky foods that can pull on the surgical site</li><li>Anything with small seeds that can lodge in healing tissue</li></ul>',
  '<h2 id="weeks-4-to-12-approaching-normal-diet">Weeks 4 to 12: Approaching Normal Diet</h2>',
  '<p>For single tooth implants, most patients can resume normal eating around week 4 to 6, although hard biting on the implant side should still be avoided until the final crown is placed. For All-On-X patients, the temporary bridge requires a careful diet for the full 3 to 5 month integration period.</p>',
  '<h3>Now Fine For Single Implant Patients</h3>',
  '<ul><li>Steak (cut into small pieces, chew on the opposite side)</li><li>Apples and other crunchy fruits</li><li>Raw vegetables</li><li>Bread with crusts</li><li>Most foods you ate before surgery</li></ul>',
  '<h3>Still Avoid Until Implant Integration Is Complete</h3>',
  '<ul><li>Biting directly on the implant side with hard foods</li><li>Extremely hard items like ice, hard candy, or popcorn kernels</li><li>Sticky foods that could dislodge a temporary crown if you have one</li></ul>',
  '<h2 id="the-foods-that-actively-help-healing">The Foods That Actively Help Healing</h2>',
  '<p>Beyond just avoiding bad foods, certain nutrients actively speed implant healing and bone integration:</p>',
  '<ul><li><strong>Vitamin C</strong>: Supports collagen formation. Found in cooked bell peppers, well-cooked broccoli, kiwi (avoid seeds during week 1), and citrus once gum tissue is healed.</li><li><strong>Vitamin D and Calcium</strong>: Critical for bone integration. Found in milk, yogurt, cheese, fortified cereals, and salmon.</li><li><strong>Protein</strong>: The building block of tissue repair. Aim for 60 to 80 grams daily during week 1.</li><li><strong>Zinc</strong>: Speeds wound healing. Found in yogurt, eggs, cooked legumes, and pumpkin seeds (once cleared).</li><li><strong>Omega-3 fatty acids</strong>: Reduce inflammation. Found in salmon, walnuts (avoid during week 1), and flaxseed oil.</li></ul>',
  '<h2 id="drinks-what-to-choose-and-avoid">Drinks: What To Choose and Avoid</h2>',
  '<h3>Safe Drinks</h3>',
  '<ul><li>Water (still, never sparkling for the first week)</li><li>Smoothies (sipped, never with straw)</li><li>Protein shakes</li><li>Lukewarm decaf herbal tea (after day 2)</li><li>Milk and milk alternatives</li><li>Coconut water</li></ul>',
  '<h3>Drinks To Avoid</h3>',
  '<ul><li>Alcohol for the first 72 hours minimum</li><li>Hot coffee and hot tea for 24 hours</li><li>Carbonated drinks for the first 5 days</li><li>Citrus juices for the first week</li><li>Anything served through a straw</li></ul>',
  '<p>For more details on the full implant recovery timeline, visit our <a href="/first-visit-expectations">What To Expect page</a>.</p>',
  '<h2 id="in-conclusion">In Conclusion</h2>',
  '<p>The right diet after dental implant surgery is your most powerful tool for fast, successful healing.</p>',
  '<p>The first week requires cool, soft, nutrient-rich foods with no chewing. Weeks 2 through 4 allow gentle reintroduction of chewing on the opposite side of the implant. By week 4 to 6 for single implants, you are essentially back to normal eating with minor precautions. All-On-X patients follow a longer soft-food timeline through the full 3 to 5 month integration period. When in doubt, choose softer over harder, cooler over hotter, and protein-rich over carb-only, and your implant will thank you for years to come.</p>',
].join('');

/* the contents list, read off the body's h2s so it cannot drift from them */
const toc = '<div class="prose_toc"><p class="prose_toc-title">In this article</p>'
  + [...body.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)].map(([, id, t]) => `<a class="prose_toc-link" href="#${id}">${t}</a>`).join('')
  + '</div>';

export default page({
  path: '/blog/foods-to-eat-and-avoid-after-dental-implant-surgery',
  crumbs,
  seo: {
    title: 'Foods After Dental Implant Surgery: Eat & Avoid List | Hackensack, NJ',
    description: 'Complete guide to foods after dental implant surgery in Hackensack, NJ, including what to eat, what to avoid, and week-by-week diet progression.',
    image: 'blog-foods.webp',
  },
  chapters: [
    hero({
      crumbs,
      variant: 'photo',
      card: false,
      tagline: 'August 22, 2026',
      title: 'Foods To Eat (And Avoid) After Dental Implant Surgery: A Complete Guide',
      lead: 'Complete guide to foods after dental implant surgery in Hackensack, NJ, including what to eat, what to avoid, and week-by-week diet progression.',
      image: { src: 'blog-foods.webp', w: 1200, h: 1200, alt: 'Bowls of yogurt, oats and soft fruit on a white table' },
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
        ['What is the best food to eat right after dental implant surgery?', 'For the first 24 hours after dental implant surgery, the best foods are cool liquids and very soft foods that require no chewing. Top choices include cool fruit smoothies (no straw), cold yogurt, applesauce, pudding, mashed banana, lukewarm broth or clear soup, and protein shakes. Focus on nutrition and hydration while avoiding any disturbance to the surgical site.'],
        ['How long do I need to eat soft foods after implant surgery?', 'For single tooth implants, most patients eat exclusively soft foods for the first 7 days, then gradually reintroduce gentle chewing over weeks 2 to 4, and return to normal eating by week 4 to 6. For All-On-X full-arch surgery, the soft-food diet continues for 12 weeks while implants integrate with bone, before the final permanent zirconia bridge is placed and normal eating resumes.'],
        ['Why can I not use a straw after dental implant surgery?', 'The suction created by drinking through a straw can dislodge the blood clot that forms at the surgical site, leading to delayed healing or a painful condition called dry socket. Avoid all straws for the first 5 days after surgery. Drink directly from a glass or bottle, sipping slowly. The same rule applies to vaping, which also creates suction.'],
        ['Can I drink coffee after dental implant surgery?', 'Avoid hot coffee for the first 24 hours after surgery because heat increases bleeding at the surgical site. After 24 hours, lukewarm coffee is fine in moderation. Avoid using cream or sugar that requires stirring near the surgical area. Iced coffee is a good alternative once you are able to eat normally. Avoid coffee entirely if you are taking medications that warn against caffeine.'],
        ['What foods should I avoid forever after dental implants?', 'Once your implant is fully integrated and the final crown is placed, you can eat nearly everything natural teeth can eat. However, all dental implant patients should avoid biting directly into extremely hard items like ice cubes, hard candy, popcorn kernels, and bone-in foods because these can damage the implant crown or bridge over time. Treat your implants like high-quality natural teeth.'],
        ['How do I get enough protein during the first week after surgery?', 'Aim for 60 to 80 grams of protein per day during the first week to support tissue repair and bone healing. Good soft sources include Greek yogurt, cottage cheese, soft scrambled eggs, protein shakes with added protein powder, soft fish like tilapia or salmon, ground meat cooked very soft, refried beans, hummus, and soft tofu. Protein shakes are an easy way to hit your daily target.'],
        ['Can I eat ice cream after dental implant surgery?', 'Yes, plain ice cream and frozen yogurt are excellent options during the first few days after implant surgery. The cold can help reduce swelling and provide soothing relief. Avoid varieties with hard mix-ins like nuts, cookies, candy pieces, or anything crunchy. Soft-serve, smooth gelato, and frozen yogurt without toppings are the safest choices for the first week.'],
        ['When can I eat steak after dental implant surgery?', 'Single tooth implant patients can usually eat tender, well-cooked steak by week 4 to 6, cut into small pieces and chewed on the opposite side of the implant. Full-arch All-On-X patients should wait until their final permanent zirconia bridge is placed at the 3 to 5 month mark, then enjoy steak normally. Eating the first piece of steak after recovery is one of the most rewarding moments of the implant journey.'],
        ['Are smoothies a good option after implant surgery?', 'Yes, smoothies are an ideal post-surgery food because they pack protein, vitamins, and calories into a soft, easy-to-consume meal. Use cool ingredients like banana, mango, berries (strained for seeds), spinach, yogurt, and protein powder. Sip directly from the cup with no straw. Avoid acidic citrus smoothies in the first week as they can irritate the surgical site, and avoid berry seeds that can lodge in healing tissue.'],
        ['What nutrients help dental implants heal faster?', 'The most important nutrients for implant healing are protein for tissue repair, vitamin C for collagen formation, vitamin D and calcium for bone integration with the implant, and zinc for wound healing. Get these from yogurt, cheese, eggs, soft fish like salmon, well-cooked spinach and broccoli, sweet potato, and protein shakes. Omega-3 fatty acids from fish also reduce inflammation and support faster recovery.'],
      ],
    }),
    cta({
      title: 'Schedule Your Consultation',
      text: 'Questions about eating after implant surgery? Hackensack Center for Dental Implants serves patients in Hackensack and throughout the Greater Bergen County area. Call (551) 368-2476 to schedule a consultation.',
    }),
  ],
});
