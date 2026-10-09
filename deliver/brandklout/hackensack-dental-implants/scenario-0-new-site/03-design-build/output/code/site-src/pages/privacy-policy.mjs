/* /privacy-policy. The practice's own Privacy Policy, verbatim and complete: the live page's text
   (mirror/raw-html/privacy-policy.html), placed, never edited. It is a legal text, so the house
   rules for marketing copy do not apply: its em dashes and its phone number stay as published.
   Phone in the text: (201) 488-8866 (twice: Getting Help, Contact Us). Links point at
   www.hackensackdentalimplants.com, as published.
   The live page has two H1s: the hero keeps "Privacy policy"; the text's own "PRIVACY POLICY" is an
   h2. The Effective Date line is the hero lead.
   Markup only, never the words: the Webflow classes and role attributes, the empty
   (zero-width-joiner) paragraphs, non-breaking spaces and the site chrome (nav, the footer's address,
   hours and languages) are gone; address lines the live page broke with <br> are a paragraph each;
   every h2 has an id for the contents list. */
import { page, hero, prose } from '../lib/ui.mjs';

const crumbs = [['/privacy-policy', 'Privacy Policy']];

const body = `
<h2 id="privacy-policy">PRIVACY POLICY</h2>
<p>Aesthetic Dental Center of Hackensack, LLC DBA Hackensack Center for Dental Implants (“Hackensack Center,” “we,” “us,” or “our”) respects your privacy.</p>
<p>This Privacy Policy explains how we collect, use, disclose, retain, and protect information received through <a href="https://www.hackensackdentalimplants.com/">https://www.hackensackdentalimplants.com/</a> (the “Site”), our text messaging program, and related electronic communications.</p>
<p>This policy applies to prospective patients, current patients, referring professionals, and other individuals who interact with the Site or our communications.</p>
<p>Information maintained in connection with your care may be protected health information (“PHI”) under the Health Insurance Portability and Accountability Act (“HIPAA”) and applicable New Jersey law. Our separate Notice of Privacy Practices describes our uses and disclosures of PHI and your rights concerning it.</p>
<p>This Privacy Policy does not replace the Notice of Privacy Practices. If the two conflict concerning PHI, the Notice of Privacy Practices controls.</p>
<h2 id="information-we-collect">1. INFORMATION WE COLLECT</h2>
<h3>Information You Provide</h3>
<p>We may collect information you provide when you:</p>
<ul>
  <li>Submit a contact, consultation, appointment-request, referral, or virtual-consultation form.</li>
  <li>Schedule or request an appointment.</li>
  <li>Opt in to receive text messages.</li>
  <li>Communicate with us by telephone, email, text message, or another method.</li>
  <li>Provide information in connection with treatment, payment, insurance, or financing.</li>
  <li>Submit photographs, imaging, records, or other materials through an authorized method.</li>
</ul>
<p>Information may include:</p>
<ul>
  <li>Your name, mailing address, email address, and telephone or mobile number.</li>
  <li>Appointment preferences, treatment interests, and the reason for contacting us.</li>
  <li>Referring-provider information.</li>
  <li>Medical and dental history, medications, allergies, imaging, treatment records, and other clinical information.</li>
  <li>Insurance, billing, payment, and financing information.</li>
  <li>Communications and questions you send to us.</li>
  <li>SMS consent status, date and method of consent, opt-out status, and message history.</li>
  <li>Other information you voluntarily provide.</li>
</ul>
<p>Payment-card information may be processed directly by a payment processor and may not be stored by Hackensack Center.</p>
<h3>Information Collected Automatically</h3>
<p>When you use the Site, we and our service providers may automatically collect:</p>
<ul>
  <li>IP address and approximate location.</li>
  <li>Browser type, operating system, and device information.</li>
  <li>Pages viewed, links selected, and time spent on the Site.</li>
  <li>Referring website or advertising source.</li>
  <li>Cookie identifiers and similar technical information.</li>
  <li>Information used to maintain security and diagnose technical problems.</li>
</ul>
<p>For more information, review our Cookie Policy:</p>
<p><a href="https://www.hackensackdentalimplants.com/cookie-policy">https://www.hackensackdentalimplants.com/cookie-policy</a></p>
<h3>Health-Related Information</h3>
<p>Please do not submit detailed medical histories, clinical records, imaging, diagnoses, financial account details, or similarly sensitive information through a general website form, ordinary email, or SMS.</p>
<p>When sensitive clinical information is necessary, ask our office for an approved secure method.</p>
<p>Health information maintained in connection with your care is handled under HIPAA, applicable New Jersey law, and our Notice of Privacy Practices.</p>
<h2 id="how-we-use-information">2. HOW WE USE INFORMATION</h2>
<p>We may use information to:</p>
<ul>
  <li>Respond to questions and requests.</li>
  <li>Schedule, confirm, and manage consultations and appointments.</li>
  <li>Provide treatment and coordinate care with authorized healthcare professionals.</li>
  <li>Send appointment reminders, preparation instructions, and follow-up communications.</li>
  <li>Provide two-way customer-care and scheduling communications by text.</li>
  <li>Send educational information, practice news, events, and promotional messages when authorized.</li>
  <li>Verify insurance benefits, submit claims, and process payments.</li>
  <li>Assist with financing applications you initiate.</li>
  <li>Operate our on-site laboratory and coordinate the fabrication of dental restorations.</li>
  <li>Maintain patient and business records.</li>
  <li>Operate, secure, troubleshoot, analyze, and improve the Site.</li>
  <li>Measure Site usage and advertising effectiveness.</li>
  <li>Prevent fraud, misuse, and security incidents.</li>
  <li>Comply with legal, regulatory, professional, and accreditation obligations.</li>
  <li>Establish, exercise, or defend legal rights.</li>
</ul>
<p>We do not use website analytics alone to make clinical decisions concerning your treatment.</p>
<h2 id="sms-and-text-messaging-program">3. SMS AND TEXT MESSAGING PROGRAM</h2>
<p>Hackensack Center offers an SMS/MMS messaging program for appointment communications, conversational support, patient-service messages, educational information, and promotional messages when authorized.</p>
<h3>How You Opt In</h3>
<p>You may opt in by:</p>
<ul>
  <li>Entering a mobile number, checking the separate SMS-consent checkbox on a Site form, and submitting the form.</li>
  <li>Affirmatively agreeing in writing or electronically to receive text messages.</li>
  <li>Using another opt-in method clearly presented by Hackensack Center.</li>
</ul>
<p>Consent to receive marketing or promotional text messages is not a condition of purchasing products, receiving treatment, or obtaining other services.</p>
<p>By opting in, you consent to receive recurring automated and conversational text messages from Hackensack Center at the number you provide. You represent that you own or are authorized to use that number.</p>
<p>Consent provided to Hackensack Center applies only to communications from Hackensack Center and is not transferable to another business.</p>
<h3>Types of Messages</h3>
<p>Messages may include:</p>
<ul>
  <li>Consultation and appointment requests, confirmations, reminders, and rescheduling notices.</li>
  <li>Treatment preparation and follow-up communications.</li>
  <li>Two-way responses from our staff.</li>
  <li>Insurance, financing, billing, and care-coordination messages.</li>
  <li>Educational information, service announcements, events, special offers, and practice news when authorized.</li>
</ul>
<h3>Message Frequency</h3>
<p>Message frequency varies depending on your appointments, requests, consent, and interactions with us.</p>
<h3>Message and Data Rates</h3>
<p>Message and data rates may apply according to your mobile carrier and plan. Hackensack Center does not charge a separate fee for its messages.</p>
<h3>Opting Out</h3>
<p>You may cancel SMS messages at any time by replying <strong>STOP</strong>. We may send one final message confirming your opt-out. We will then stop sending messages covered by the opt-out unless you subsequently provide new consent.</p>
<h3>Getting Help</h3>
<p>Reply <strong>HELP</strong> for assistance, call <strong>(201) 488-8866</strong>, or visit:</p>
<p><a href="https://www.hackensackdentalimplants.com/contact">https://www.hackensackdentalimplants.com/contact</a></p>
<h3>Carrier Disclaimer</h3>
<p>Mobile carriers are not responsible for delayed or undelivered messages. Message delivery is subject to wireless-network and messaging-provider availability.</p>
<h3>Mobile Information and Sharing</h3>
<p>We do not sell or rent mobile telephone numbers, SMS opt-in data, or messaging consent.</p>
<p>We do not share mobile information—including telephone numbers, SMS opt-in data, or consent—with third parties or affiliates for their own marketing or promotional purposes.</p>
<p>We may provide mobile information to service providers that support the messaging program, including messaging-platform providers, telecommunications carriers, and customer-support providers. These providers may use the information only to deliver and support our communications or comply with applicable law.</p>
<p>SMS is not a fully secure channel. Do not send detailed medical histories, clinical records, financial information, government identifiers, or other sensitive information by text.</p>
<h2 id="how-we-disclose-information">4. HOW WE DISCLOSE INFORMATION</h2>
<p>We do not sell or rent personal information.</p>
<p>We may disclose information as reasonably necessary to operate our practice and provide services, including to:</p>
<ul>
  <li>Practice-management, scheduling, charting, and electronic-record providers.</li>
  <li>Dentists, physicians, specialists, laboratories, imaging providers, and other participants in your care, as permitted by law.</li>
  <li>Insurance carriers and benefit administrators when you request billing or benefit verification.</li>
  <li>Payment processors and financing providers for transactions or applications you initiate.</li>
  <li>SMS, telephone, email, and secure-communication providers.</li>
  <li>Website hosting, analytics, advertising, security, and technical-support providers.</li>
  <li>Accountants, attorneys, consultants, and other professional advisers subject to appropriate confidentiality obligations.</li>
  <li>Governmental, regulatory, judicial, or law-enforcement authorities when required or permitted by law.</li>
  <li>Appropriate parties when necessary to address a serious threat to health or safety or to protect legal rights.</li>
</ul>
<p>Service providers handling PHI on our behalf are required to enter into HIPAA business associate agreements when applicable.</p>
<p>If the practice is sold, merged, reorganized, or transferred, information may be transferred as part of that transaction, subject to applicable healthcare privacy requirements.</p>
<p>Mobile numbers and SMS opt-in information are excluded from disclosures to third parties or affiliates for their own marketing or promotional purposes.</p>
<h2 id="protected-health-information">5. PROTECTED HEALTH INFORMATION</h2>
<p>Once you become a patient, certain information concerning your care may be PHI.</p>
<p>Subject to HIPAA and our Notice of Privacy Practices, PHI may be used or disclosed:</p>
<ul>
  <li><strong>For treatment:</strong> To evaluate, plan, provide, and coordinate your care.</li>
  <li><strong>For payment:</strong> To verify benefits, submit claims, collect payments, and support financing or billing activities you authorize.</li>
  <li><strong>For healthcare operations:</strong> For quality assessment, workforce training, licensing, compliance, auditing, and administration.</li>
  <li><strong>As permitted or required by law:</strong> Including lawful public-health reporting, court orders, regulatory requirements, and prevention of serious harm.</li>
</ul>
<p>We do not sell PHI. We do not use or disclose PHI for purposes requiring written authorization unless we obtain that authorization.</p>
<p>Identifiable photographs, testimonials, or before-and-after images are not used for marketing without appropriate written permission. An authorization may be withdrawn prospectively as described in the authorization and applicable law.</p>
<h2 id="third-party-tools">6. THIRD-PARTY TOOLS</h2>
<p>The Site may use third-party services for:</p>
<ul>
  <li>Online scheduling and practice management.</li>
  <li>Form processing and secure file transfer.</li>
  <li>SMS, telephone, and email communications.</li>
  <li>Payment processing and financing.</li>
  <li>Insurance verification.</li>
  <li>Website hosting, analytics, security, and advertising measurement.</li>
  <li>Maps, videos, social-media content, and patient-review displays.</li>
</ul>
<p>Third-party providers may collect or receive information under their own privacy policies and their agreements with us.</p>
<h2 id="cookies-and-similar-technologies">7. COOKIES AND SIMILAR TECHNOLOGIES</h2>
<p>We may use cookies, pixels, and similar technologies to:</p>
<ul>
  <li>Make the Site function.</li>
  <li>Remember preferences.</li>
  <li>Understand how visitors use the Site.</li>
  <li>Maintain security and prevent misuse.</li>
  <li>Measure the performance of content and advertising.</li>
</ul>
<p>You may be able to control cookies through your browser or controls presented on the Site. Disabling cookies may affect Site functionality.</p>
<p>Additional information is available at:</p>
<p><a href="https://www.hackensackdentalimplants.com/cookie-policy">https://www.hackensackdentalimplants.com/cookie-policy</a></p>
<h2 id="your-choices-and-rights">8. YOUR CHOICES AND RIGHTS</h2>
<p>Depending on the information involved and applicable law, you may have the right to:</p>
<ul>
  <li>Request access to or a copy of information we maintain about you.</li>
  <li>Request correction of inaccurate information.</li>
  <li>Request deletion when deletion is not prohibited by record-retention or healthcare laws.</li>
  <li>Request restrictions on certain uses or disclosures.</li>
  <li>Request confidential communications through a specified method or address.</li>
  <li>Request an accounting of certain PHI disclosures.</li>
  <li>Receive a paper copy of our Notice of Privacy Practices.</li>
  <li>Withdraw a marketing or photography authorization prospectively.</li>
  <li>Opt out of marketing emails using the unsubscribe link.</li>
  <li>Opt out of SMS messages by replying <strong>STOP</strong>.</li>
  <li>Adjust browser or Site cookie settings.</li>
  <li>Submit a privacy complaint without retaliation.</li>
</ul>
<p>Some requests may be limited by HIPAA, treatment requirements, professional record-retention obligations, or other applicable law.</p>
<p>To submit a request, contact us using the information in Section 14. We may need to verify your identity before fulfilling it.</p>
<p>If you believe your HIPAA rights have been violated, you may complain to us or to the U.S. Department of Health and Human Services Office for Civil Rights. We will not retaliate against you for filing a complaint.</p>
<h2 id="information-security">9. INFORMATION SECURITY</h2>
<p>We use administrative, physical, and technical safeguards designed to protect personal information. These may include encryption, access controls, audit logging, workforce training, and contractual protections with service providers.</p>
<p>No method of internet transmission, electronic storage, ordinary email, or SMS is completely secure. Use an approved secure channel when providing clinical or other sensitive information.</p>
<h2 id="information-retention">10. INFORMATION RETENTION</h2>
<p>We retain information for as long as reasonably necessary to provide services, satisfy the purposes described in this policy, meet legal and professional obligations, resolve disputes, and enforce agreements.</p>
<p>Dental records and radiographs are retained for at least seven years from the date of the last entry or treatment, as required by New Jersey law. Records concerning minors may be retained for seven years from the date of the last treatment or until two years after the patient’s 18th birthday, whichever is later. Records may be kept longer when legally required or reasonably appropriate.</p>
<p>We retain SMS consent, opt-out, and messaging records for the period reasonably necessary to document compliance with telecommunications and consumer-protection requirements.</p>
<p>Website inquiries that do not become patient records are retained only as long as reasonably necessary for communication, security, compliance, and legitimate business-record purposes.</p>
<h2 id="childrens-privacy">11. CHILDREN’S PRIVACY</h2>
<p>The Site and SMS program are not directed to children under 13, and we do not knowingly collect personal information or SMS consent directly from children under 13 through these services.</p>
<p>Individuals under 18 should use Site forms or enroll in text messaging only with the involvement and authorization of a parent or legal guardian.</p>
<p>We may treat minors as patients. In those circumstances, information is collected and handled with the involvement of a parent, guardian, or legally authorized representative and in accordance with healthcare privacy laws.</p>
<p>Contact us if you believe a child submitted information without appropriate authorization.</p>
<h2 id="links-to-other-websites">12. LINKS TO OTHER WEBSITES</h2>
<p>The Site may link to websites we do not operate. We are not responsible for their content, security, or privacy practices. Review the applicable privacy policy before providing information to a third-party website.</p>
<h2 id="changes-to-this-policy">13. CHANGES TO THIS POLICY</h2>
<p>We may revise this Privacy Policy periodically. When we do, we will update the Effective Date and post the revised policy on this page.</p>
<p>Material changes affecting PHI will also be addressed in our Notice of Privacy Practices when required.</p>
<h2 id="contact-us">14. CONTACT US</h2>
<p>Questions about this Privacy Policy, our SMS program, or a privacy request may be directed to:</p>
<p><strong>Aesthetic Dental Center of Hackensack, LLC</strong></p>
<p>DBA <strong>Hackensack Center for Dental Implants</strong></p>
<p>Attn: Privacy Officer</p>
<p>163 Main Street, Suite A1</p>
<p>Hackensack, NJ 07601</p>
<p>Phone: <strong>(201) 488-8866</strong></p>
<p>Contact: <a href="https://www.hackensackdentalimplants.com/contact"><strong>https://www.hackensackdentalimplants.com/contact</strong></a></p>
<p>Website: <a href="https://www.hackensackdentalimplants.com/"><strong>https://www.hackensackdentalimplants.com/</strong></a></p>
`;

/* the contents list: one link per h2, read off the body so the two cannot drift */
const toc = `<div class="prose_toc"><p class="prose_toc-title">Contents</p>${[...body.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)].map(([, id, t]) => `<a class="prose_toc-link" href="#${id}">${t}</a>`).join('')}</div>`;

export default page({
  path: '/privacy-policy',
  crumbs,
  seo: {
    title: 'Privacy Policy | Hackensack Center for Dental Implants',
    description: 'Privacy policy for Hackensack Center for Dental Implants in Hackensack, NJ, covering how patient and website information is collected and used.',
  },
  chapters: [
    hero({ variant: 'plain', card: false, crumbs, title: 'Privacy policy', lead: 'Effective Date: September 21, 2026', actions: [] }),
    prose({ body, aside: toc }),
  ],
});
