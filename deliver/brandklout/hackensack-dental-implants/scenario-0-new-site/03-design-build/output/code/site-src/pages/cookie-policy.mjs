/* /cookie-policy. The practice's own Cookie Policy, verbatim and complete: the live page's text
   (mirror/raw-html/cookie-policy.html), placed, never edited. No phone number or email in it.
   The live page sets its sections as h3 under the H1 with no h2; they are h2 here, so the heading
   order holds and the contents list has entries. The Last updated line is the hero lead ("the date
   at the top of this Cookie Policy"). The browser and advertising-alliance lists are plain text on
   the live page (no links), and stay so.
   Markup only, never the words: the Webflow classes and role attributes, the empty
   (zero-width-joiner) paragraphs, non-breaking spaces and the site chrome (nav, the footer's address,
   hours and languages) are gone; address lines the live page broke with <br> are a paragraph each;
   every h2 has an id for the contents list. */
import { page, hero, prose } from '../lib/ui.mjs';

const crumbs = [['/cookie-policy', 'Cookie Policy']];

const body = `
<p>This Cookie Policy explains how Hackensack Center for Dental Implants ("Company," "we," "us," and "our") uses cookies and similar technologies to recognize you when you visit our website ("Website"). It explains what these technologies are and why we use them, as well as your rights to control our use of them.</p>
<p>In some cases we may use cookies to collect personal information, or information that becomes personal information if we combine it with other information.</p>
<h2 id="what-are-cookies">What Are Cookies?</h2>
<p>Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.</p>
<p>Cookies set by the website owner (in this case, Hackensack Center for Dental Implants) are called "first-party cookies." Cookies set by parties other than the website owner are called "third-party cookies." Third-party cookies enable third-party features or functionality to be provided on or through the website (for example, advertising, interactive content, and analytics). The parties that set these third-party cookies can recognize your computer both when it visits the website in question and also when it visits certain other websites.</p>
<h2 id="why-do-we-use-cookies">Why Do We Use Cookies?</h2>
<p>We use first-party and third-party cookies for several reasons. Some cookies are required for technical reasons in order for our Website to operate, and we refer to these as "essential" or "strictly necessary" cookies. Other cookies enable us to understand how visitors use our Website and to improve their experience. Third parties may serve cookies through our Website for analytics and other purposes, as described in more detail below.</p>
<h2 id="how-can-i-control-cookies">How Can I Control Cookies?</h2>
<p>You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences through the Cookie Consent Manager on our Website, which allows you to select which categories of cookies you accept or reject. Essential cookies cannot be rejected as they are strictly necessary to provide you with services.</p>
<p>If you choose to reject non-essential cookies, you may still use our Website, though your access to some functionality and areas may be restricted. You may also set or amend your web browser controls to accept or refuse cookies.</p>
<h2 id="types-of-cookies-we-use">Types of Cookies We Use</h2>
<p>The specific cookies served through our Website fall into the following categories:</p>
<p><strong>Essential cookies.</strong> These cookies are strictly necessary to provide you with services available through our Website and to use some of its features, such as access to secure areas. Without these cookies, services you have asked for cannot be provided.</p>
<p><strong>Analytics and performance cookies.</strong> These cookies collect information about how visitors use our Website, such as which pages are visited most often and whether visitors encounter any errors. The information is used in aggregate form to help us understand how the Website is being used and how we can improve it. Common examples include cookies set by Google Analytics.</p>
<p><strong>Functionality cookies.</strong> These cookies allow the Website to remember choices you make (such as your language preference) and provide enhanced, more personal features.</p>
<p><strong>Advertising and targeting cookies.</strong> These cookies may be set through our Website by advertising partners. They may be used to build a profile of your interests and show you relevant content on our Website or other websites. They do not directly store personal information but are based on uniquely identifying your browser and internet device.</p>
<h2 id="how-can-i-control-cookies-on-my-browser">How Can I Control Cookies on My Browser?</h2>
<p>The means by which you can refuse cookies through your web browser controls vary from browser to browser, so you should visit your browser's help menu for more information. Here is where to find cookie settings in the most popular browsers:</p>
<ul>
  <li>Chrome</li>
  <li>Firefox</li>
  <li>Safari</li>
  <li>Edge</li>
  <li>Opera</li>
  <li>Internet Explorer</li>
</ul>
<p>In addition, most advertising networks offer you a way to opt out of targeted advertising. To learn more, please visit:</p>
<ul>
  <li>Digital Advertising Alliance</li>
  <li>Digital Advertising Alliance of Canada</li>
  <li>European Interactive Digital Advertising Alliance</li>
</ul>
<h2 id="what-about-other-tracking-technologies-like-web-beacons">What About Other Tracking Technologies, Like Web Beacons?</h2>
<p>Cookies are not the only way to recognize or track visitors to a website. We may use other, similar technologies from time to time, like web beacons (sometimes called "tracking pixels" or "clear gifs"). These are tiny graphics files that contain a unique identifier that enables us to recognize when someone has visited our Website or opened an email including them. This allows us to monitor traffic patterns, understand whether you have come to our Website from an online advertisement, improve site performance, and measure the success of email campaigns. In many instances, these technologies rely on cookies to function properly, so declining cookies may impair their functioning.</p>
<h2 id="do-you-use-flash-cookies-or-local-shared-objects">Do You Use Flash Cookies or Local Shared Objects?</h2>
<p>Websites may also use "Flash Cookies" (also known as Local Shared Objects or "LSOs") to collect and store information about your use of our services and for other site operations.</p>
<p>If you do not want Flash Cookies stored on your device, you can adjust the settings of your Flash player to block Flash Cookies storage using the tools available in the Website Storage Settings Panel. Please note that setting the Flash Player to restrict or limit acceptance of Flash Cookies may reduce or impede the functionality of some Flash applications.</p>
<h2 id="do-you-serve-targeted-advertising">Do You Serve Targeted Advertising?</h2>
<p>Third parties may serve cookies on your computer or mobile device to serve advertising through our Website. These companies may use information about your visits to this and other websites in order to provide relevant advertisements about goods and services that may be of interest to you. They may also use this information to measure the effectiveness of advertisements. The information collected through this process does not enable us or them to identify your name, contact details, or other details that directly identify you unless you choose to provide these.</p>
<h2 id="how-often-will-you-update-this-cookie-policy">How Often Will You Update This Cookie Policy?</h2>
<p>We may update this Cookie Policy from time to time in order to reflect changes to the cookies we use or for other operational, legal, or regulatory reasons. Please revisit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.</p>
<p>The date at the top of this Cookie Policy indicates when it was last updated.</p>
<h2 id="where-can-i-get-further-information">Where Can I Get Further Information?</h2>
<p>If you have any questions about our use of cookies or other technologies, please contact us through the form on our Contact page, or by post at:</p>
<p>Hackensack Center for Dental Implants</p>
<p>163 Main Street,</p>
<p>Suite A1,</p>
<p>Hackensack, NJ 07601</p>
<p>United States</p>
`;

/* the contents list: one link per h2, read off the body so the two cannot drift */
const toc = `<div class="prose_toc"><p class="prose_toc-title">Contents</p>${[...body.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)].map(([, id, t]) => `<a class="prose_toc-link" href="#${id}">${t}</a>`).join('')}</div>`;

export default page({
  path: '/cookie-policy',
  crumbs,
  seo: {
    title: 'Cookie Policy | Hackensack Center for Dental Implants',
    description: 'Cookie policy for the Hackensack Center for Dental Implants website, including information about cookies, tracking technologies, and website preferences.',
  },
  chapters: [
    hero({ variant: 'plain', card: false, crumbs, title: 'Cookie Policy', lead: 'Last updated: January 1, 2026', actions: [] }),
    prose({ body, aside: toc }),
  ],
});
