/* The three supporting pages: accessibility statement, privacy notice, and
   the form's thank-you. Short by design; they carry the shell, a cover and
   editorial columns rather than a full journey.

   The privacy notice is a DRAFT for the practice's review. The current site
   loads its policy from a third-party iframe that the crawl could not read,
   so nothing here is copied from it. Until the practice or its counsel
   confirms the text, the page says so at the top. */
import { SITE } from '../lib/site.mjs'

const accessibility = {
  slug: 'accessibility',
  title: 'Accessibility Statement | West LA Implants',
  description: 'West LA Implants is committed to a website that everyone can use. How the site is built for accessibility, how to reach the practice another way, and how to report a problem.',
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'Accessibility',
      title: 'A website everyone can <em>use.</em>',
      lead: 'West LA Implants wants every patient to be able to read, navigate and book on this site, whatever tools they use to do it.',
      image: { src: '/media/img/still-front-desk-handshake.jpg', pos: '10% 50%', alt: 'A patient welcomed at the front desk' },
      actions: [{ href: '#invitation', label: 'Report a Problem' }],
    },
    {
      type: 'detail', name: 'The Commitment', tag: 'The Commitment', title: 'How the site is <em>built.</em>',
      lead: 'The site is designed to meet the Web Content Accessibility Guidelines (WCAG) 2.1 at level AA, and is checked against them as it changes.',
      columns: [
        { h: 'Structure', text: ['Every page has one heading that names it and a logical heading order beneath. Landmarks, lists and buttons are real HTML elements, so screen readers announce them correctly.', 'Every link on the site can be reached and activated with a keyboard, and the focus is always visible.'] },
        { h: 'Reading', text: ['Type is sized in relative units and scales with your browser settings. Colour contrast between text and background meets the AA ratio, including the text that fills in as you scroll, which starts readable and only gets stronger.', 'Photographs carry descriptive alternative text. Decorative images are marked so they are skipped.'] },
        { h: 'Motion', text: ['The site uses scroll-driven animation. If your system is set to reduce motion, every animation is disabled and every piece of content is shown in full, in place.', 'Films never autoplay with sound. Videos of patients are linked with descriptions.'] },
      ],
      body: [
        'Some pages carry a third-party accessibility widget that adjusts type size, contrast and spacing. It is provided by the practice’s web partner and can be opened from its icon.',
      ],
    },
    {
      type: 'detail', name: 'The Help', tag: 'The Help', title: 'If something does not <em>work.</em>', theme: 'light',
      lead: 'Tell the practice and it will be fixed. And anything on this site can also be done by phone.',
      list: [
        { b: SITE.phoneNew, span: 'New patients, Monday to Friday 9am to 5pm' },
        { b: SITE.phoneCurrent, span: 'Current patients' },
        { b: 'Zocdoc', span: 'An alternative way to book online' },
      ],
      body: ['When reporting a problem, say which page, what you were trying to do, and which browser or assistive technology you were using. The practice aims to reply within two business days.'],
    },
    { type: 'invite', name: 'Invitation', title: 'Tell us what to <em>fix.</em>', lead: 'Describe the page and the problem. Or simply call; everything on this site can be done by phone.', formTitle: 'Report an accessibility problem', interests: ['An accessibility problem', 'A consultation', 'Not sure yet'] },
  ],
}

const privacy = {
  slug: 'privacy-policy',
  title: 'Privacy Policy | West LA Implants',
  description: 'How West LA Implants handles the information you share through this website and as a patient: what is collected, how it is used, who it is shared with, and your choices.',
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'Privacy policy',
      title: 'Your information, <em>handled</em> with care.',
      lead: 'This notice explains what West LA Implants collects through this website, how it is used and protected, and the choices you have. Your health information is separately protected under HIPAA and the practice’s Notice of Privacy Practices, available at the office.',
      image: { src: '/media/img/front-desk-emily.jpg', alt: 'The front desk at West LA Implants' },
    },
    {
      type: 'detail', name: 'The Notice', tag: 'Draft for review', title: 'What this site <em>collects.</em>',
      lead: 'This text is a draft prepared for the practice’s review and has not yet been approved by the practice or its counsel. Until it is, the practice’s existing policy governs.',
      columns: [
        { h: 'Information you give', text: ['When you send a request through a form, book an appointment, or call, the practice receives what you provide: your name, phone number, email, the reason for your visit and your preferred way to be contacted. It is used to reply to you and to arrange your care.', 'Online booking is provided by Zocdoc under its own privacy policy. Forms may be processed by the practice’s scheduling and communication provider.'] },
        { h: 'Information collected automatically', text: ['Like most websites, this one may use cookies and similar technologies for analytics and, where you consent, for advertising measurement. A cookie preferences control lets you change your choices at any time.', 'Analytics data is aggregated and does not identify you by name.'] },
        { h: 'How it is used and shared', text: ['To respond to you, schedule and provide care, process insurance and payment, and improve the website. The practice does not sell your personal information.', 'Information is shared only with providers that help run the practice and the website, under contracts that restrict its use, and where the law requires.'] },
      ],
    },
    {
      type: 'detail', name: 'Your Choices', tag: 'Your Choices', title: 'Your <em>choices.</em>', theme: 'light',
      columns: [
        { h: 'Marketing', text: ['You can ask the practice to stop contacting you for marketing at any time by calling or replying to a message.'] },
        { h: 'Cookies', text: ['Use the cookie preferences control on the site, or your browser settings, to limit cookies. Some features may not work without them.'] },
        { h: 'Access and correction', text: ['To see, correct or delete personal information the practice holds about you, contact the office. Requests about medical records follow the Notice of Privacy Practices and HIPAA.'] },
      ],
      body: ['Questions about this notice: West LA Implants, ' + SITE.address1 + ', ' + SITE.address2 + ', ' + SITE.phoneCurrent + '. This notice may be updated; the date of the current version will be shown here once approved.'],
    },
    { type: 'invite', name: 'Invitation', title: 'A question about your <em>information?</em>', lead: 'Contact the office and ask for the office manager.', interests: ['A privacy question', 'A consultation', 'Not sure yet'] },
  ],
}

const thankyou = {
  slug: 'thank-you',
  title: 'Thank You | West LA Implants',
  description: 'Your request has reached West LA Implants. The front desk replies within one business day.',
  noindex: true,
  chapters: [
    {
      type: 'cover', name: 'Arrival', kicker: 'Request received',
      title: 'Thank you. We will be in <em>touch.</em>',
      lead: 'The front desk replies within one business day with times. If it is urgent, call (310) 692-9316 and say so; same-day appointments are kept for emergencies.',
      image: { src: '/media/img/still-doctor-patient-hug.jpg', alt: 'Dr. Barriere greeting a patient' },
      actions: [{ href: '/what-to-expect.html', label: 'What Happens at Your First Visit' }, { href: '/index.html', label: 'Back to the start', kind: 'text' }],
      meta: [
        { b: '1 business day', span: 'To hear back' },
        { b: SITE.phoneNew, span: 'If it cannot wait' },
        { b: 'Zocdoc', span: 'To pick a time yourself' },
        { b: 'Forms', span: 'Can be sent ahead' },
      ],
    },
    {
      type: 'detail', name: 'Meanwhile', tag: 'Meanwhile', title: 'While you <em>wait.</em>',
      columns: [
        { h: 'Read', text: ['What happens at a first visit, and the implant process from scan to final teeth, on the first-visit page.'] },
        { h: 'Watch', text: ['Leslie, Emily and Michael tell their stories on the results page, and Dr. Barriere explains the technology in his video library.'] },
        { h: 'Prepare', text: ['Gather your insurance card, a list of medications, and any recent X-rays or quotes from another office. Second opinions are free.'] },
      ],
      actions: [{ href: '/results.html', label: 'Results and stories', kind: 'text' }, { href: '/faq.html', label: 'Questions', kind: 'text' }],
    },
  ],
}

export default [accessibility, privacy, thankyou]
