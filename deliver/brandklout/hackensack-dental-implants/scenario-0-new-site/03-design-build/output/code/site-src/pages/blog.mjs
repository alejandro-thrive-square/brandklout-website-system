/* /blog, the index. Copy: the live page (scrape/pages/blog.md): its H1 and its one paragraph. The live
   index listed three posts (the zygomatic, dentures and cost guides, in that order); the three
   recovery guides follow them here. Each card: the post's title, its publish date and its meta
   description. Left out: the footer blocks the scrape caught (address, hours, languages). */
import { page, hero, articles, cta } from '../lib/ui.mjs';

const crumbs = [['/blog', 'Blog']];

export default page({
  path: '/blog',
  crumbs,
  seo: {
    title: 'Dental Implant Blog in Hackensack, NJ | Hackensack Center',
    description: 'Dental implant guides from Hackensack Center for Dental Implants in Hackensack, NJ. Costs, procedures and recovery explained.',
  },
  chapters: [
    hero({
      crumbs,
      card: false,
      title: 'Blog',
      image: { src: 'blog-hero.webp', w: 1080, h: 1080, alt: 'The reception and the waiting area by the front windows' },
      lead: 'Have a question about implants, a full-mouth rebuild, or your first visit? The Hackensack Center blog answers the questions patients actually ask, in plain language, with honest, specialist-informed advice you can use before, during, and after your care.',
      actions: [],
    }),
    articles({
      posts: [
        {
          href: '/blog/dental-implants-no-bone-zygomatic-implants-explained',
          title: 'Can You Get Dental Implants If You Have No Bone? Zygomatic Implants Explained',
          meta: 'August 22, 2026',
          text: 'Learn how zygomatic implants may help patients with severe upper-jaw bone loss avoid grafting and review candidacy, treatment, and recovery in Hackensack, NJ.',
          image: { src: 'blog-zygomatic.webp', w: 1080, h: 1080, alt: 'Zygomatic implants anchored in the cheekbone, holding a full upper arch (3D illustration)' },
        },
        {
          href: '/blog/all-on-x-vs-traditional-dentures-comparison-2026',
          title: 'All-On-X vs Traditional Dentures: Which Is Right For You in 2026?',
          meta: 'August 22, 2026',
          text: 'Compare All-On-X implants and traditional dentures in Hackensack, NJ, including cost, comfort, eating, speaking, bone preservation, and longevity.',
          image: { src: 'blog-dentures.webp', w: 1200, h: 1200, alt: 'A full-arch denture design open on a screen' },
        },
        {
          href: '/blog/dental-implant-cost-hackensack-nj-2026-pricing-guide',
          title: 'How Much Do Dental Implants Cost in Hackensack, NJ? A Complete 2026 Guide',
          meta: 'August 22, 2026',
          text: 'Learn what affects dental implant costs in Hackensack, NJ, including single implants, full-arch treatment, insurance, financing, and treatment planning.',
          image: { src: 'blog-cost.webp', w: 1200, h: 1200, alt: 'A tooth model, a calculator, a notebook and dental instruments' },
        },
        {
          href: '/blog/all-on-x-recovery-day-after-same-day-teeth-surgery',
          title: 'All-On-X Recovery: What To Expect The Day After Same-Day Teeth Surgery',
          meta: 'August 22, 2026',
          text: 'Step-by-step All-On-X recovery guide for the day after same-day teeth surgery in Hackensack, NJ, including diet, pain management, and hygiene.',
          image: { src: 'blog-recovery-day-after.webp', w: 1200, h: 1200, alt: 'Smoothies and a bowl of soft cereal on a tray beside the sofa' },
        },
        {
          href: '/blog/dental-implant-recovery-week-by-week-aftercare-guide',
          title: 'Dental Implant Recovery: Your Complete Week-By-Week Aftercare Guide',
          meta: 'August 22, 2026',
          text: 'Dental implant recovery guide for Hackensack, NJ patients, with day-by-day and week-by-week aftercare, diet, hygiene, and healing milestones.',
          image: { src: 'blog-recovery-weeks.webp', w: 1200, h: 1200, alt: 'Mouthwash, a towel, a bamboo toothbrush and floss' },
        },
        {
          href: '/blog/foods-to-eat-and-avoid-after-dental-implant-surgery',
          title: 'Foods To Eat (And Avoid) After Dental Implant Surgery: A Complete Guide',
          meta: 'August 22, 2026',
          text: 'Complete guide to foods after dental implant surgery in Hackensack, NJ, including what to eat, what to avoid, and week-by-week diet progression.',
          image: { src: 'blog-foods.webp', w: 1200, h: 1200, alt: 'Bowls of yogurt, oats and soft fruit on a white table' },
        },
      ],
    }),
    cta({
      title: 'Schedule Your Consultation',
    }),
  ],
});
