/* /hipaa-disclosure. The practice's own HIPAA Notice of Privacy Practices, verbatim and complete: the
   live page's text (mirror/raw-html/hipaa-disclosure.html), placed, never edited. It is a legal text,
   so the house rules for marketing copy do not apply: its dash and its phone number stay as
   published. Phones in the text: (201) 488-8866 (the practice, at the top) and 1-877-696-6775 (HHS
   Office for Civil Rights).
   The live page has two H1s: the hero keeps "HIPAA disclosure"; the text's own "HIPAA DISCLOSURE" is
   an h2. The Effective Date line is the hero lead. Three h2s repeat on the live page (YOUR RIGHTS,
   YOUR CHOICES, OUR USES AND DISCLOSURES: a summary, then the detail); the second set's ids end -2.
   Markup only, never the words: the Webflow classes and role attributes, the empty
   (zero-width-joiner) paragraphs, non-breaking spaces and the site chrome (nav, the footer's address,
   hours and languages) are gone; address lines the live page broke with <br> are a paragraph each;
   every h2 has an id for the contents list. */
import { page, hero, prose } from '../lib/ui.mjs';

const crumbs = [['/hipaa-disclosure', 'HIPAA Disclosure']];

const body = `
<h2 id="hipaa-disclosure">HIPAA DISCLOSURE</h2>
<p>This Notice of Privacy Practices applies to Aesthetic Dental Center of Hackensack, LLC DBA Hackensack Center for Dental Implants (“Hackensack Center,” “we,” “us,” or “our”). For information about how we handle information collected through our website and other communications, please see our <a href="/privacy-policy">Privacy Policy</a>.</p>
<p><strong>Your Information. Your Rights. Our Responsibilities.</strong></p>
<p>This notice describes how medical information about you may be used and disclosed and how you can get access to this information. Please review it carefully.</p>
<p><strong>Aesthetic Dental Center of Hackensack, LLC</strong></p>
<p>DBA <strong>Hackensack Center for Dental Implants</strong></p>
<p>163 Main Street, Suite A1</p>
<p>Hackensack, NJ 07601</p>
<p>Phone: <strong>(201) 488-8866</strong></p>
<h2 id="your-rights">YOUR RIGHTS</h2>
<p>You have the right to:</p>
<ul>
  <li>Get a copy of your paper or electronic medical record</li>
  <li>Correct your paper or electronic medical record</li>
  <li>Request confidential communication</li>
  <li>Ask us to limit the information we share</li>
  <li>Get a list of those with whom we’ve shared your information</li>
  <li>Get a copy of this privacy notice</li>
  <li>Choose someone to act for you</li>
  <li>File a complaint if you believe your privacy rights have been violated</li>
</ul>
<h2 id="your-choices">YOUR CHOICES</h2>
<p>You have some choices in the way that we use and share information as we:</p>
<ul>
  <li>Tell family and friends about your condition</li>
  <li>Provide disaster relief</li>
  <li>Include you in a hospital directory</li>
  <li>Provide mental health care</li>
  <li>Market our services and sell your information</li>
  <li>Raise funds</li>
</ul>
<h2 id="our-uses-and-disclosures">OUR USES AND DISCLOSURES</h2>
<p>We may use and share your information as we:</p>
<ul>
  <li>Treat you</li>
  <li>Run our organization</li>
  <li>Bill for your services</li>
  <li>Help with public health and safety issues</li>
  <li>Do research</li>
  <li>Comply with the law</li>
  <li>Respond to organ and tissue donation requests</li>
  <li>Work with a medical examiner or funeral director</li>
  <li>Address workers’ compensation, law enforcement, and other government requests</li>
  <li>Respond to lawsuits and legal actions</li>
</ul>
<h2 id="your-rights-2">YOUR RIGHTS</h2>
<p><strong>When it comes to your health information, you have certain rights.</strong> This section explains your rights and some of our responsibilities to help you.</p>
<h3>Get an electronic or paper copy of your medical record</h3>
<ul>
  <li>You can ask to see or get an electronic or paper copy of your medical record and other health information we have about you. Ask us how to do this.</li>
  <li>We will provide a copy or a summary of your health information, usually within 30 days of your request. We may charge a reasonable, cost-based fee.</li>
</ul>
<h3>Ask us to correct your medical record</h3>
<ul>
  <li>You can ask us to correct health information about you that you think is incorrect or incomplete. Ask us how to do this.</li>
  <li>We may say “no” to your request, but we’ll tell you why in writing within 60 days.</li>
</ul>
<h3>Request confidential communications</h3>
<ul>
  <li>You can ask us to contact you in a specific way (for example, home or office phone) or to send mail to a different address.</li>
  <li>We will say “yes” to all reasonable requests.</li>
</ul>
<h3>Ask us to limit what we use or share</h3>
<ul>
  <li>You can ask us not to use or share certain health information for treatment, payment, or our operations. We are not required to agree to your request, and we may say “no” if it would affect your care.</li>
  <li>If you pay for a service or health care item out-of-pocket in full, you can ask us not to share that information for the purpose of payment or our operations with your health insurer. We will say “yes” unless a law requires us to share that information.</li>
</ul>
<h3>Get a list of those with whom we’ve shared information</h3>
<ul>
  <li>You can ask for a list (accounting) of the times we’ve shared your health information for six years prior to the date you ask, who we shared it with, and why.</li>
  <li>We will include all the disclosures except for those about treatment, payment, and health care operations, and certain other disclosures (such as any you asked us to make). We’ll provide one accounting a year for free but will charge a reasonable, cost-based fee if you ask for another one within 12 months.</li>
</ul>
<h3>Get a copy of this privacy notice</h3>
<p>You can ask for a paper copy of this notice at any time, even if you have agreed to receive the notice electronically. We will provide you with a paper copy promptly.</p>
<h3>Choose someone to act for you</h3>
<ul>
  <li>If you have given someone medical power of attorney or if someone is your legal guardian, that person can exercise your rights and make choices about your health information.</li>
  <li>We will make sure the person has this authority and can act for you before we take any action.</li>
</ul>
<h3>File a complaint if you feel your rights are violated</h3>
<ul>
  <li>You can complain if you feel we have violated your rights by contacting us using the contact information at the top of this notice.</li>
  <li>You can file a complaint with the U.S. Department of Health and Human Services Office for Civil Rights by sending a letter to 200 Independence Avenue, S.W., Washington, D.C. 20201, calling 1-877-696-6775, or visiting <a href="https://www.hhs.gov/ocr/privacy/hipaa/complaints/">www.hhs.gov/ocr/privacy/hipaa/complaints/</a></li>
  <li>We will not retaliate against you for filing a complaint.</li>
</ul>
<h2 id="your-choices-2">YOUR CHOICES</h2>
<p><strong>For certain health information, you can tell us your choices about what we share.</strong> If you have a clear preference for how we share your information in the situations described below, talk to us. Tell us what you want us to do, and we will follow your instructions.</p>
<p>In these cases, you have both the right and choice to tell us to:</p>
<ul>
  <li>Share information with your family, close friends, or others involved in your care</li>
  <li>Share information in a disaster relief situation</li>
  <li>Include your information in a hospital directory</li>
</ul>
<p><em>If you are not able to tell us your preference, for example if you are unconscious, we may go ahead and share your information if we believe it is in your best interest. We may also share your information when needed to lessen a serious and imminent threat to health or safety.</em></p>
<p>In these cases we never share your information unless you give us written permission:</p>
<ul>
  <li>Marketing purposes</li>
  <li>Sale of your information</li>
  <li>Most sharing of psychotherapy notes</li>
</ul>
<p>In the case of fundraising:</p>
<ul>
  <li>We may contact you for fundraising efforts, but you can tell us not to contact you again.</li>
</ul>
<h2 id="our-uses-and-disclosures-2">OUR USES AND DISCLOSURES</h2>
<p>How do we typically use or share your health information?</p>
<p>We typically use or share your health information in the following ways.</p>
<h3>Treat you</h3>
<p>We can use your health information and share it with other professionals who are treating you.</p>
<p><em>Example: A doctor treating you for an injury asks another doctor about your overall health condition.</em></p>
<h3>Run our organization</h3>
<p>We can use and share your health information to run our practice, improve your care, and contact you when necessary.</p>
<p><em>Example: We use health information about you to manage your treatment and services.</em></p>
<h3>Bill for your services</h3>
<p>We can use and share your health information to bill and get payment from health plans or other entities.</p>
<p><em>Example: We give information about you to your health insurance plan so it will pay for your services.</em></p>
<h2 id="how-else-can-we-use-or-share-your-health-information">HOW ELSE CAN WE USE OR SHARE YOUR HEALTH INFORMATION?</h2>
<p>We are allowed or required to share your information in other ways – usually in ways that contribute to the public good, such as public health and research. We have to meet many conditions in the law before we can share your information for these purposes. For more information see: <a href="https://www.hhs.gov/ocr/privacy/hipaa/understanding/consumers/index.html">www.hhs.gov/ocr/privacy/hipaa/understanding/consumers/index.html</a>.</p>
<h3>Help with public health and safety issues</h3>
<p>We can share health information about you for certain situations such as:</p>
<ul>
  <li>Preventing disease</li>
  <li>Helping with product recalls</li>
  <li>Reporting adverse reactions to medications</li>
  <li>Reporting suspected abuse, neglect, or domestic violence</li>
  <li>Preventing or reducing a serious threat to anyone’s health or safety</li>
</ul>
<h3>Do research</h3>
<p>We can use or share your information for health research.</p>
<h3>Comply with the law</h3>
<p>We will share information about you if state or federal laws require it, including with the Department of Health and Human Services if it wants to see that we’re complying with federal privacy law.</p>
<h3>Respond to organ and tissue donation requests</h3>
<p>We can share health information about you with organ procurement organizations.</p>
<h3>Work with a medical examiner or funeral director</h3>
<p>We can share health information with a coroner, medical examiner, or funeral director when an individual dies.</p>
<h3>Address workers’ compensation, law enforcement, and other government requests</h3>
<p>We can use or share health information about you:</p>
<ul>
  <li>For workers’ compensation claims</li>
  <li>For law enforcement purposes or with a law enforcement official</li>
  <li>With health oversight agencies for activities authorized by law</li>
  <li>For special government functions such as military, national security, and presidential protective services</li>
</ul>
<h3>Respond to lawsuits and legal actions</h3>
<p>We can share health information about you in response to a court or administrative order, or in response to a subpoena.</p>
<h2 id="redisclosure-according-to-hipaa">REDISCLOSURE ACCORDING TO HIPAA</h2>
<p>When you consent to uses and disclosures for all future treatment and payment purposes and to run our business, we may share your information with other substance use disorder treatment programs, doctors’ offices, and health care businesses for those activities. If the person who receives it is subject to HIPAA, then they are allowed to use and share your information again without your consent for the purposes that HIPAA allows. Your information still cannot be used in legal proceedings against you unless (1) you consent or (2) based on a Part 2 court order and a subpoena (or similar legal requirement).</p>
<h2 id="our-responsibilities">OUR RESPONSIBILITIES</h2>
<ul>
  <li>We are required by law to maintain the privacy and security of your protected health information.</li>
  <li>We will let you know promptly if a breach occurs that may have compromised the privacy or security of your information.</li>
  <li>We must follow the duties and privacy practices described in this notice and give you a copy of it.</li>
  <li>We will not use or share your information other than as described here unless you tell us we can in writing. If you tell us we can, you may change your mind at any time. Let us know in writing if you change your mind.</li>
</ul>
<p>For more information see: <a href="https://www.hhs.gov/ocr/privacy/hipaa/understanding/consumers/noticepp.html">www.hhs.gov/ocr/privacy/hipaa/understanding/consumers/noticepp.html</a>.</p>
<h2 id="changes-to-the-terms-of-this-notice">CHANGES TO THE TERMS OF THIS NOTICE</h2>
<p>We can change the terms of this notice, and the changes will apply to all information we have about you. The new notice will be available upon request, in our office, and on our web site.</p>
`;

/* the contents list: one link per h2, read off the body so the two cannot drift */
const toc = `<div class="prose_toc"><p class="prose_toc-title">Contents</p>${[...body.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)].map(([, id, t]) => `<a class="prose_toc-link" href="#${id}">${t}</a>`).join('')}</div>`;

export default page({
  path: '/hipaa-disclosure',
  crumbs,
  seo: {
    title: 'HIPAA Disclosure | Hackensack Center for Dental Implants',
    description: 'HIPAA Notice of Privacy Practices for Hackensack Center for Dental Implants in Hackensack, NJ, describing how your health information may be used and shared and your rights.',
  },
  chapters: [
    hero({ variant: 'plain', card: false, crumbs, title: 'HIPAA disclosure', lead: 'Effective Date: September 28, 2026', actions: [] }),
    prose({ body, aside: toc }),
  ],
});
