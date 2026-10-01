/* ==========================================================================
   HIPAA DISCLOSURE — the Notice of Privacy Practices at /hipaa-disclosure.

   The HHS model notice our Webflow sites carry (Stone Dental Implant Center,
   Grand Mission Dentistry), verbatim, with only the practice-specific parts
   swapped. ONE source for two consumers:
     - pages/legal.mjs renders it to HTML for the build (toHtml below);
     - 21-instatic-upload/add-hipaa-page.mjs turns the same list into Instatic
       nodes, so the live page and the build cannot drift.

   Legal entity: neither this site's privacy notice nor the old WordPress site
   names one, so the practice name stands in (flagged 2026-10-01 for the
   practice to confirm). No email is published anywhere, so the contact block
   has none. One location.

   Shape: an item is { p }, { h2 }, { ul } or { sub, items } (an h3 section,
   rendered as a .dt-col so it takes the privacy page's own sub-heading style).
   Inline runs: a string, { b }, { em }, { a, href } or { br: true }.
   ========================================================================== */
import { SITE } from './site.mjs'

export const HIPAA = {
  entity: SITE.name,
  effective: 'October 1, 2026',
  privacyHref: '/privacy-policy',
  phone: SITE.phoneCurrent,
}

const OCR = 'https://www.hhs.gov/ocr/privacy/hipaa/complaints/'
const UNDERSTANDING = 'https://www.hhs.gov/ocr/privacy/hipaa/understanding/consumers/index.html'
const NOTICEPP = 'https://www.hhs.gov/ocr/privacy/hipaa/understanding/consumers/noticepp.html'

export const NOTICE = [
  { p: [{ b: 'Effective Date:' }, ' ' + HIPAA.effective] },
  { p: ['This Notice of Privacy Practices applies to ' + HIPAA.entity + ' (“we,” “us,” or “our”). For information about how we handle information collected through our website and other communications, please see our ', { a: 'Privacy Policy', href: HIPAA.privacyHref }, '.'] },
  { p: [{ b: 'Your Information. Your Rights. Our Responsibilities.' }] },
  { p: ['This notice describes how medical information about you may be used and disclosed and how you can get access to this information. Please review it carefully.'] },
  { p: [{ b: HIPAA.entity }, { br: true }, SITE.address1, { br: true }, SITE.address2, { br: true }, 'Phone: ' + HIPAA.phone] },

  { h2: 'Your Rights' },
  { p: ['You have the right to:'] },
  { ul: ['Get a copy of your paper or electronic medical record', 'Correct your paper or electronic medical record', 'Request confidential communication', 'Ask us to limit the information we share', 'Get a list of those with whom we’ve shared your information', 'Get a copy of this privacy notice', 'Choose someone to act for you', 'File a complaint if you believe your privacy rights have been violated'] },
  { h2: 'Your Choices' },
  { p: ['You have some choices in the way that we use and share information as we:'] },
  { ul: ['Tell family and friends about your condition', 'Provide disaster relief', 'Include you in a hospital directory', 'Provide mental health care', 'Market our services and sell your information', 'Raise funds'] },
  { h2: 'Our Uses and Disclosures' },
  { p: ['We may use and share your information as we:'] },
  { ul: ['Treat you', 'Run our organization', 'Bill for your services', 'Help with public health and safety issues', 'Do research', 'Comply with the law', 'Respond to organ and tissue donation requests', 'Work with a medical examiner or funeral director', 'Address workers’ compensation, law enforcement, and other government requests', 'Respond to lawsuits and legal actions'] },

  { h2: 'Your Rights' },
  { p: [{ b: 'When it comes to your health information, you have certain rights.' }, ' This section explains your rights and some of our responsibilities to help you.'] },
  { sub: 'Get an electronic or paper copy of your medical record', items: [
    { ul: ['You can ask to see or get an electronic or paper copy of your medical record and other health information we have about you. Ask us how to do this.', 'We will provide a copy or a summary of your health information, usually within 30 days of your request. We may charge a reasonable, cost-based fee.'] },
  ] },
  { sub: 'Ask us to correct your medical record', items: [
    { ul: ['You can ask us to correct health information about you that you think is incorrect or incomplete. Ask us how to do this.', 'We may say “no” to your request, but we’ll tell you why in writing within 60 days.'] },
  ] },
  { sub: 'Request confidential communications', items: [
    { ul: ['You can ask us to contact you in a specific way (for example, home or office phone) or to send mail to a different address.', 'We will say “yes” to all reasonable requests.'] },
  ] },
  { sub: 'Ask us to limit what we use or share', items: [
    { ul: ['You can ask us not to use or share certain health information for treatment, payment, or our operations. We are not required to agree to your request, and we may say “no” if it would affect your care.', 'If you pay for a service or health care item out-of-pocket in full, you can ask us not to share that information for the purpose of payment or our operations with your health insurer. We will say “yes” unless a law requires us to share that information.'] },
  ] },
  { sub: 'Get a list of those with whom we’ve shared information', items: [
    { ul: ['You can ask for a list (accounting) of the times we’ve shared your health information for six years prior to the date you ask, who we shared it with, and why.', 'We will include all the disclosures except for those about treatment, payment, and health care operations, and certain other disclosures (such as any you asked us to make). We’ll provide one accounting a year for free but will charge a reasonable, cost-based fee if you ask for another one within 12 months.'] },
  ] },
  { sub: 'Get a copy of this privacy notice', items: [
    { p: ['You can ask for a paper copy of this notice at any time, even if you have agreed to receive the notice electronically. We will provide you with a paper copy promptly.'] },
  ] },
  { sub: 'Choose someone to act for you', items: [
    { ul: ['If you have given someone medical power of attorney or if someone is your legal guardian, that person can exercise your rights and make choices about your health information.', 'We will make sure the person has this authority and can act for you before we take any action.'] },
  ] },
  { sub: 'File a complaint if you feel your rights are violated', items: [
    { ul: [
      'You can complain if you feel we have violated your rights by contacting us using the contact information at the top of this notice.',
      ['You can file a complaint with the U.S. Department of Health and Human Services Office for Civil Rights by sending a letter to 200 Independence Avenue, S.W., Washington, D.C. 20201, calling 1-877-696-6775, or visiting ', { a: 'www.hhs.gov/ocr/privacy/hipaa/complaints/', href: OCR }],
      'We will not retaliate against you for filing a complaint.',
    ] },
  ] },

  { h2: 'Your Choices' },
  { p: [{ b: 'For certain health information, you can tell us your choices about what we share.' }, ' If you have a clear preference for how we share your information in the situations described below, talk to us. Tell us what you want us to do, and we will follow your instructions.'] },
  { p: ['In these cases, you have both the right and choice to tell us to:'] },
  { ul: ['Share information with your family, close friends, or others involved in your care', 'Share information in a disaster relief situation', 'Include your information in a hospital directory'] },
  { p: [{ em: 'If you are not able to tell us your preference, for example if you are unconscious, we may go ahead and share your information if we believe it is in your best interest. We may also share your information when needed to lessen a serious and imminent threat to health or safety.' }] },
  { p: ['In these cases we never share your information unless you give us written permission:'] },
  { ul: ['Marketing purposes', 'Sale of your information', 'Most sharing of psychotherapy notes'] },
  { p: ['In the case of fundraising:'] },
  { ul: ['We may contact you for fundraising efforts, but you can tell us not to contact you again.'] },

  { h2: 'Our Uses and Disclosures' },
  { p: ['How do we typically use or share your health information?'] },
  { p: ['We typically use or share your health information in the following ways.'] },
  { sub: 'Treat you', items: [
    { p: ['We can use your health information and share it with other professionals who are treating you.'] },
    { p: [{ em: 'Example: A doctor treating you for an injury asks another doctor about your overall health condition.' }] },
  ] },
  { sub: 'Run our organization', items: [
    { p: ['We can use and share your health information to run our practice, improve your care, and contact you when necessary.'] },
    { p: [{ em: 'Example: We use health information about you to manage your treatment and services.' }] },
  ] },
  { sub: 'Bill for your services', items: [
    { p: ['We can use and share your health information to bill and get payment from health plans or other entities.'] },
    { p: [{ em: 'Example: We give information about you to your health insurance plan so it will pay for your services.' }] },
  ] },

  { h2: 'How else can we use or share your health information?' },
  { p: ['We are allowed or required to share your information in other ways – usually in ways that contribute to the public good, such as public health and research. We have to meet many conditions in the law before we can share your information for these purposes. For more information see: ', { a: 'www.hhs.gov/ocr/privacy/hipaa/understanding/consumers/index.html', href: UNDERSTANDING }, '.'] },
  { sub: 'Help with public health and safety issues', items: [
    { p: ['We can share health information about you for certain situations such as:'] },
    { ul: ['Preventing disease', 'Helping with product recalls', 'Reporting adverse reactions to medications', 'Reporting suspected abuse, neglect, or domestic violence', 'Preventing or reducing a serious threat to anyone’s health or safety'] },
  ] },
  { sub: 'Do research', items: [{ p: ['We can use or share your information for health research.'] }] },
  { sub: 'Comply with the law', items: [{ p: ['We will share information about you if state or federal laws require it, including with the Department of Health and Human Services if it wants to see that we’re complying with federal privacy law.'] }] },
  { sub: 'Respond to organ and tissue donation requests', items: [{ p: ['We can share health information about you with organ procurement organizations.'] }] },
  { sub: 'Work with a medical examiner or funeral director', items: [{ p: ['We can share health information with a coroner, medical examiner, or funeral director when an individual dies.'] }] },
  { sub: 'Address workers’ compensation, law enforcement, and other government requests', items: [
    { p: ['We can use or share health information about you:'] },
    { ul: ['For workers’ compensation claims', 'For law enforcement purposes or with a law enforcement official', 'With health oversight agencies for activities authorized by law', 'For special government functions such as military, national security, and presidential protective services'] },
  ] },
  { sub: 'Respond to lawsuits and legal actions', items: [{ p: ['We can share health information about you in response to a court or administrative order, or in response to a subpoena.'] }] },
  { sub: 'Redisclosure According to HIPAA', items: [{ p: ['When you consent to uses and disclosures for all future treatment and payment purposes and to run our business, we may share your information with other substance use disorder treatment programs, doctors’ offices, and health care businesses for those activities. If the person who receives it is subject to HIPAA, then they are allowed to use and share your information again without your consent for the purposes that HIPAA allows. Your information still cannot be used in legal proceedings against you unless (1) you consent or (2) based on a Part 2 court order and a subpoena (or similar legal requirement).'] }] },

  { h2: 'Our Responsibilities' },
  { ul: ['We are required by law to maintain the privacy and security of your protected health information.', 'We will let you know promptly if a breach occurs that may have compromised the privacy or security of your information.', 'We must follow the duties and privacy practices described in this notice and give you a copy of it.', 'We will not use or share your information other than as described here unless you tell us we can in writing. If you tell us we can, you may change your mind at any time. Let us know in writing if you change your mind.'] },
  { p: ['For more information see: ', { a: 'www.hhs.gov/ocr/privacy/hipaa/understanding/consumers/noticepp.html', href: NOTICEPP }, '.'] },
  { h2: 'Changes to the Terms of this Notice' },
  { p: ['We can change the terms of this notice, and the changes will apply to all information we have about you. The new notice will be available upon request, in our office, and on our web site.'] },
]

/* The aside beside the notice, the journal's "More entries" rail. */
export const ASIDE = { kicker: 'Related', links: [['/privacy-policy', 'Privacy Policy'], ['/accessibility', 'Accessibility'], ['/contact', 'Contact the office']] }

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const inline = (runs) => [].concat(runs).map((r) =>
  typeof r === 'string' ? esc(r)
    : r.br ? '<br>'
      : r.b ? `<strong>${esc(r.b)}</strong>`
        : r.em ? `<em>${esc(r.em)}</em>`
          : `<a href="${r.href}">${esc(r.a)}</a>`).join('')
const item = (it) =>
  it.p ? `<p>${inline(it.p)}</p>`
    : it.h2 ? `<h2>${esc(it.h2)}</h2>`
      : it.ul ? `<ul>${it.ul.map((li) => `<li>${inline(li)}</li>`).join('')}</ul>`
        : `<div class="dt-col"><h3 class="h3">${esc(it.sub)}</h3>${it.items.map(item).join('')}</div>`

export const toHtml = () => NOTICE.map(item).join('\n')
export const asideHtml = () => `<div class="kicker">${ASIDE.kicker}</div>${ASIDE.links.map(([h, l]) => `<a href="${h}">${l}</a>`).join('')}`
