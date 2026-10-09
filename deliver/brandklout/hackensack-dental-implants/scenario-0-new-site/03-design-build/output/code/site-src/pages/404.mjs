/* /404. Copy: the live 404 page (mirror/raw-html/404.html): its eyebrow "404 ERROR", its H1 "Page not
   found", its sentence, and its meta description as the description. Its "Back to Homepage" button is
   "Back to the home page" here; the popular-page links are new navigation, not copy. */
import { page, hero, links } from '../lib/ui.mjs';

export default page({
  path: '/404',
  seo: {
    title: 'Page Not Found | Hackensack Center for Dental Implants',
    description: 'The page could not be found. Return to Hackensack Center for Dental Implants to explore treatment options, doctors, and patient resources.',
  },
  chapters: [
    hero({
      variant: 'plain',
      card: false,
      tagline: '404 ERROR',
      title: 'Page not found',
      lead: 'The page you are looking for may have moved or no longer exists. Return to the homepage to continue exploring your care options.',
      actions: [{ label: 'Back to the home page', href: '/' }, { label: 'Contact Us', href: '/contact', kind: 'link' }],
    }),
    links({
      name: 'Popular Pages',
      title: 'Popular pages',
      items: [
        { href: '/services', title: 'Implant Solutions' },
        { href: '/services/all-on-x', title: 'All-on-X' },
        { href: '/gallery', title: 'Smile Gallery' },
        { href: '/contact', title: 'Contact' },
      ],
      columns: 4,
    }),
  ],
});
