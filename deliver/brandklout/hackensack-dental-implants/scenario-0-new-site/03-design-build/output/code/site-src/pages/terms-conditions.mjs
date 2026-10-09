/* /terms-conditions. The practice's own Terms and Conditions, verbatim and complete: the live
   page's text (mirror/raw-html/terms-conditions.html), placed, never edited. It is a legal text, so
   the house rules for marketing copy do not apply: its em dashes and its phone number stay as
   published. Phone in the text: (201) 488-8866 (twice: How to Get Help, Contact Us). Links point at
   www.hackensackdentalimplants.com, as published.
   The live page has two H1s: the hero keeps "Terms & Conditions"; the text's own "TERMS AND
   CONDITIONS" is an h2. The Effective Date line is the hero lead ("the date displayed above").
   Markup only, never the words: the Webflow classes and role attributes, the empty
   (zero-width-joiner) paragraphs, non-breaking spaces and the site chrome (nav, the footer's address,
   hours and languages) are gone; address lines the live page broke with <br> are a paragraph each;
   every h2 has an id for the contents list. */
import { page, hero, prose } from '../lib/ui.mjs';

const crumbs = [['/terms-conditions', 'Terms & Conditions']];

const body = `
<h2 id="terms-and-conditions">TERMS AND CONDITIONS</h2>
<p>These Terms and Conditions (“Terms”) govern your use of the website operated by Aesthetic Dental Center of Hackensack, LLC DBA Hackensack Center for Dental Implants (“Hackensack Center for Dental Implants,” “we,” “us,” or “our”), located at <a href="https://www.hackensackdentalimplants.com/">https://www.hackensackdentalimplants.com/</a> (the “Site”), as well as our text messaging program and related electronic services.</p>
<p>By accessing or using the Site, submitting information through a form, requesting a consultation or appointment, opting in to receive text messages, or otherwise communicating with us electronically, you agree to these Terms. If you do not agree, please do not use the Site or our online services.</p>
<p>We may revise these Terms periodically. Revised Terms will be posted on this page with an updated Effective Date.</p>
<h2 id="about-us">1. ABOUT US</h2>
<p>The Site is operated by:</p>
<p><strong>Aesthetic Dental Center of Hackensack, LLC</strong></p>
<p>DBA <strong>Hackensack Center for Dental Implants</strong></p>
<p>163 Main Street, Suite A1</p>
<p>Hackensack, NJ 07601</p>
<p>References to “Hackensack Center,” “we,” “us,” and “our” mean this entity. References to “you” and “your” mean the individual using the Site or our services.</p>
<h2 id="eligibility-and-acceptable-use">2. ELIGIBILITY AND ACCEPTABLE USE</h2>
<p>You must be at least 18 years old, or use the Site with the involvement and permission of a parent or legal guardian, to submit information, request a consultation, schedule an appointment, or enroll in our text messaging program.</p>
<p>You agree to use the Site only for lawful purposes and in a manner that does not interfere with its operation, security, or availability.</p>
<p>You may not:</p>
<ul>
  <li>Submit false information or another person’s information without authorization.</li>
  <li>Enroll a telephone number you do not own or are not authorized to use.</li>
  <li>Impersonate another person or misrepresent your relationship with an individual or organization.</li>
  <li>Attempt to access accounts, systems, or information you are not authorized to access.</li>
  <li>Use bots, scrapers, or other automated systems to harvest information or submit forms.</li>
  <li>Introduce malware or otherwise disrupt the operation or security of the Site.</li>
  <li>Collect or store personal information about another user without authorization.</li>
  <li>Use Site content to advertise or promote another business without written permission.</li>
</ul>
<h2 id="informational-purpose-no-doctor-patient-relationship">3. INFORMATIONAL PURPOSE; NO DOCTOR-PATIENT RELATIONSHIP</h2>
<p>The Site provides general information about Hackensack Center for Dental Implants, dental implants, prosthodontics, oral surgery, restorative and cosmetic dentistry, treatment options, financing, and related patient resources.</p>
<p>Site content is provided for general informational and educational purposes only. It is not dental or medical advice, a diagnosis, or a treatment plan and should not be used as a substitute for an examination by a licensed healthcare professional.</p>
<p>Viewing the Site, submitting a form, requesting a consultation, exchanging text messages or email, or speaking with a staff member does not create a doctor-patient relationship. A doctor-patient relationship begins only after you have been accepted as a patient and the relationship has been appropriately documented.</p>
<p>If you believe you are experiencing a medical or dental emergency, including uncontrolled bleeding, difficulty breathing, rapidly increasing facial swelling, or another potentially life-threatening condition, call 911 or seek emergency care. Do not rely on website forms, email, or text messages for emergency assistance.</p>
<h2 id="consultation-and-appointment-requests">4. CONSULTATION AND APPOINTMENT REQUESTS</h2>
<p>The Site may allow you to request a consultation or appointment, submit a contact form, complete a virtual-consultation questionnaire, or communicate with our office.</p>
<p>Submitting a request does not guarantee an appointment or establish a treatment relationship. An appointment is confirmed only after our office or scheduling provider verifies availability and contacts you.</p>
<p>You agree to provide accurate, current, and complete information. We may modify, reschedule, or decline requests because of provider availability, scheduling conflicts, emergencies, incomplete information, clinical considerations, or other reasonable circumstances.</p>
<h2 id="sensitive-information-and-electronic-communications">5. SENSITIVE INFORMATION AND ELECTRONIC COMMUNICATIONS</h2>
<p>General website forms, ordinary email, and SMS text messages are intended for routine questions, scheduling, and other non-urgent communications.</p>
<p>Please do not use these channels to send detailed medical or dental histories, clinical records, diagnostic images, government identifiers, payment-card information, financial account information, or other highly sensitive information.</p>
<p>When clinical records, photographs, imaging, or other sensitive information are required, use only a secure method provided or approved by our office.</p>
<p>Electronic communications may be delayed, intercepted, misdirected, or viewed by someone with access to your device or account. Please consider these risks before communicating electronically.</p>
<p>Information created or maintained in connection with your care may constitute protected health information under the Health Insurance Portability and Accountability Act (“HIPAA”) and applicable New Jersey law. Such information is also governed by our separate Notice of Privacy Practices. If that notice conflicts with these Terms concerning protected health information, the Notice of Privacy Practices controls.</p>
<h2 id="phone-email-and-sms-communications">6. PHONE, EMAIL, AND SMS COMMUNICATIONS</h2>
<p>By providing contact information through the Site, requesting an appointment, or otherwise communicating with us, you authorize us to respond using the contact methods you provide.</p>
<p>Communications may include responses to inquiries, appointment confirmations and reminders, rescheduling notices, treatment preparation and follow-up information, billing or insurance communications, and other practice-related messages.</p>
<h3>Hackensack Center SMS Program</h3>
<p>Hackensack Center for Dental Implants operates an SMS/MMS text messaging program using third-party messaging platforms and telecommunications providers. Messages sent through this program may constitute Application-to-Person (“A2P”) messaging.</p>
<h3>How You Opt In</h3>
<p>You may opt in by:</p>
<ul>
  <li>Entering your mobile number, checking the separate SMS-consent checkbox on a Site form, and submitting the form.</li>
  <li>Affirmatively agreeing in writing or electronically to receive text messages.</li>
  <li>Using another opt-in method clearly presented by Hackensack Center.</li>
</ul>
<p>Consent to receive marketing or promotional text messages is not a condition of purchasing a product, receiving treatment, or obtaining services.</p>
<p>By affirmatively opting in, you consent to receive recurring automated and conversational SMS or MMS messages from Hackensack Center for Dental Implants at the mobile number you provide. You represent that you own or are authorized to use that number.</p>
<p>Your consent applies only to communications from Hackensack Center for Dental Implants and may not be sold or transferred to another business.</p>
<h3>Types of Messages</h3>
<p>Depending on the consent you provide, messages may include:</p>
<ul>
  <li><strong>Appointment messages:</strong> Consultation requests, confirmations, reminders, rescheduling notices, preparation information, and follow-up instructions.</li>
  <li><strong>Conversational messages:</strong> Two-way replies from our staff regarding your inquiry, appointment, or care.</li>
  <li><strong>Patient-service messages:</strong> Insurance, billing, financing, and care-coordination communications.</li>
  <li><strong>Marketing messages:</strong> Educational campaigns, special offers, new services, events, and other practice news when you have consented to receive them.</li>
</ul>
<h3>Message Frequency</h3>
<p>Message frequency varies based on your appointments, requests, consent, and interactions with us.</p>
<h3>Message and Data Rates</h3>
<p>Message and data rates may apply according to your mobile carrier and plan. Hackensack Center does not charge a separate fee for its text messages.</p>
<h3>How to Opt Out</h3>
<p>You may cancel SMS messages at any time by replying <strong>STOP</strong> to a message from us. We may send one final message confirming your opt-out. After that confirmation, we will stop sending messages covered by your opt-out unless you later provide new consent.</p>
<p>Your SMS opt-out does not prevent us from contacting you through another method when permitted by law, including when reasonably necessary for treatment, payment, healthcare operations, or responding to a communication you initiate.</p>
<h3>How to Get Help</h3>
<p>Reply <strong>HELP</strong> for assistance, call <strong>(201) 488-8866</strong>, or visit:</p>
<p><a href="https://www.hackensackdentalimplants.com/contact">https://www.hackensackdentalimplants.com/contact</a></p>
<h3>Carrier Disclaimer</h3>
<p>Wireless carriers are not responsible for delayed or undelivered messages. Message delivery is subject to wireless-network availability and the operation of third-party messaging providers.</p>
<h3>Mobile Information and Privacy</h3>
<p>We do not sell or rent your mobile number, SMS opt-in data, or messaging consent.</p>
<p>We do not share mobile information—including telephone numbers, opt-in data, or consent—with third parties or affiliates for their own marketing or promotional purposes.</p>
<p>We may provide mobile information to service providers that help operate and support the SMS program, including messaging platforms, telecommunications carriers, and customer-support providers. They may use the information only to provide those services or comply with applicable law.</p>
<p>Additional information is available in our Privacy Policy:</p>
<p><a href="https://www.hackensackdentalimplants.com/privacy-policy">https://www.hackensackdentalimplants.com/privacy-policy</a></p>
<h2 id="individual-results-vary">7. INDIVIDUAL RESULTS VARY</h2>
<p>Dental and surgical results depend on individual circumstances, including anatomy, bone and gum health, medical history, medications, tobacco use, oral hygiene, bite forces, healing response, and compliance with care instructions.</p>
<p>Photographs, testimonials, treatment timelines, success-rate statements, and descriptions of individual cases are illustrative. They do not promise or guarantee that another patient will receive the same result.</p>
<p>References to same-day teeth or similar treatments apply only to qualifying patients. Your candidacy, treatment plan, anticipated outcome, and recovery timeline can be determined only after an appropriate examination and diagnostic imaging.</p>
<h2 id="pricing-insurance-and-financing">8. PRICING, INSURANCE, AND FINANCING</h2>
<p>Pricing, payment, insurance, and financing information on the Site is general information and is subject to change.</p>
<ul>
  <li>Your actual treatment cost will be stated in a treatment plan following an appropriate evaluation.</li>
  <li>Additional procedures or services may involve separate charges.</li>
  <li>Insurance benefits are determined by your insurance carrier and plan. We cannot guarantee coverage or payment.</li>
  <li>Financing and prequalification services are offered by independent providers.</li>
  <li>Approval decisions, credit requirements, interest rates, promotional terms, and payment obligations are controlled by the applicable financing provider.</li>
</ul>
<p>References to Cherry, Healthcare Finance Direct, Proceed Finance, CareCredit, or another financing provider do not constitute a guarantee of approval or endorsement of a specific financial product.</p>
<p>Review all financing disclosures and agreements before accepting an offer.</p>
<h2 id="virtual-consultations-and-submitted-materials">9. VIRTUAL CONSULTATIONS AND SUBMITTED MATERIALS</h2>
<p>If the Site offers a virtual-consultation, photograph-upload, or secure-record feature, you represent that you have the right to provide the materials you submit.</p>
<p>A virtual consultation or preliminary review is informational and does not replace an in-person examination, diagnostic imaging, or a complete medical and dental history.</p>
<p>Do not submit another person’s records, images, or information without that person’s authorization or other legal authority.</p>
<h2 id="third-party-services">10. THIRD-PARTY SERVICES</h2>
<p>The Site and our communications may use third-party services, including:</p>
<ul>
  <li>Appointment and practice-management systems.</li>
  <li>Online forms and secure file-transfer systems.</li>
  <li>SMS, telephone, and email providers.</li>
  <li>Payment processors and financing providers.</li>
  <li>Insurance-verification services.</li>
  <li>Website hosting, analytics, security, and advertising services.</li>
  <li>Maps, embedded videos, social media, and review platforms.</li>
</ul>
<p>Third parties operate under their own terms and privacy policies. We do not control their availability, security, decisions, or independent practices.</p>
<h2 id="intellectual-property">11. INTELLECTUAL PROPERTY</h2>
<p>Site content—including text, graphics, photographs, videos, logos, trademarks, page designs, and software—is owned by or licensed to Hackensack Center and is protected by applicable intellectual-property laws.</p>
<p>You may view the Site, print a copy for personal reference, and share links to publicly accessible pages. You may not reproduce, modify, publish, sell, license, distribute, or commercially exploit Site content without prior written permission.</p>
<p>Nothing on the Site grants a license to use the names, trademarks, or logos of Aesthetic Dental Center of Hackensack, LLC or Hackensack Center for Dental Implants.</p>
<h2 id="third-party-links">12. THIRD-PARTY LINKS</h2>
<p>The Site may link to websites operated by financing companies, insurers, review platforms, social-media services, professional organizations, or other third parties.</p>
<p>Links are provided for convenience and do not imply that we control or endorse the third party. We are not responsible for a third-party website’s content, accuracy, availability, security, or privacy practices.</p>
<h2 id="disclaimer-of-warranties">13. DISCLAIMER OF WARRANTIES</h2>
<p>The Site, its content, and our SMS program are provided on an “as is” and “as available” basis.</p>
<p>To the fullest extent permitted by law, we disclaim express and implied warranties regarding the Site and messaging program, including warranties of merchantability, fitness for a particular purpose, availability, accuracy, and non-infringement.</p>
<p>We do not guarantee that the Site or messaging program will be uninterrupted or error-free, that all information will remain current and complete, or that every message will be delivered.</p>
<h2 id="limitation-of-liability">14. LIMITATION OF LIABILITY</h2>
<p>To the fullest extent permitted by law, Hackensack Center and its owners, clinicians, employees, contractors, and affiliates will not be liable for indirect, incidental, consequential, special, or punitive damages arising from:</p>
<ul>
  <li>Use of or inability to use the Site.</li>
  <li>Reliance on general Site content.</li>
  <li>Delayed, intercepted, misdirected, or undelivered communications.</li>
  <li>Technical failures or service interruptions.</li>
  <li>Unauthorized access to electronically transmitted information.</li>
  <li>Use of third-party services linked to or embedded in the Site.</li>
</ul>
<p>Nothing in these Terms excludes or limits liability that cannot lawfully be excluded, including liability for professional negligence in the care of a patient.</p>
<h2 id="indemnification">15. INDEMNIFICATION</h2>
<p>To the extent permitted by law, you agree to indemnify and hold harmless Hackensack Center and its owners, clinicians, employees, and affiliates from claims, losses, liabilities, and reasonable expenses arising from your unlawful misuse of the Site or SMS program, submission of information without authorization, violation of these Terms, or violation of another person’s rights.</p>
<h2 id="privacy-and-cookies">16. PRIVACY AND COOKIES</h2>
<p>Our Privacy Policy explains how we handle information collected through the Site and SMS program:</p>
<p><a href="https://www.hackensackdentalimplants.com/privacy-policy">https://www.hackensackdentalimplants.com/privacy-policy</a></p>
<p>Our Cookie Policy explains how the Site uses cookies and similar technologies:</p>
<p><a href="https://www.hackensackdentalimplants.com/cookie-policy">https://www.hackensackdentalimplants.com/cookie-policy</a></p>
<h2 id="governing-law-and-venue">17. GOVERNING LAW AND VENUE</h2>
<p>These Terms are governed by the laws of the State of New Jersey, without regard to conflict-of-law principles.</p>
<p>Any dispute concerning these Terms or use of the Site will be brought in a state or federal court with jurisdiction in Bergen County, New Jersey, and you consent to the jurisdiction of those courts.</p>
<h2 id="severability-no-waiver-and-entire-agreement">18. SEVERABILITY, NO WAIVER, AND ENTIRE AGREEMENT</h2>
<p>If a provision of these Terms is found unenforceable, the remaining provisions will continue in effect.</p>
<p>Our failure to enforce a provision is not a waiver of that provision or any other right.</p>
<p>These Terms, together with our Privacy Policy and Cookie Policy, constitute the agreement between you and Hackensack Center concerning the Site and SMS program. They do not replace treatment plans, informed-consent documents, financial agreements, or our HIPAA Notice of Privacy Practices.</p>
<h2 id="changes-to-these-terms">19. CHANGES TO THESE TERMS</h2>
<p>We may update these Terms by posting a revised version on this page. The revised Terms become effective on the date displayed above. We encourage you to review this page periodically.</p>
<h2 id="contact-us">20. CONTACT US</h2>
<p>Questions about these Terms or our SMS program may be directed to:</p>
<p><strong>Aesthetic Dental Center of Hackensack, LLC</strong></p>
<p>DBA <strong>Hackensack Center for Dental Implants</strong></p>
<p>163 Main Street, Suite A1</p>
<p>Hackensack, NJ 07601</p>
<p>Phone: <strong>(201) 488-8866</strong></p>
<p>Contact: <a href="https://www.hackensackdentalimplants.com/contact"><strong>https://www.hackensackdentalimplants.com/contact</strong></a></p>
<p>Website: <a href="https://www.hackensackdentalimplants.com/"><strong>https://www.hackensackdentalimplants.com/</strong></a></p>
`;

/* the contents list: one link per h2, read off the body so the two cannot drift */
const toc = `<div class="prose_toc"><p class="prose_toc-title">Contents</p>${[...body.matchAll(/<h2 id="([^"]+)">([\s\S]*?)<\/h2>/g)].map(([, id, t]) => `<a class="prose_toc-link" href="#${id}">${t}</a>`).join('')}</div>`;

export default page({
  path: '/terms-conditions',
  crumbs,
  seo: {
    title: 'Terms & Conditions | Hackensack Center for Dental Implants',
    description: 'Terms and conditions for using the Hackensack Center for Dental Implants website in Hackensack, NJ, including use of site content and services.',
  },
  chapters: [
    hero({ variant: 'plain', card: false, crumbs, title: 'Terms &amp; Conditions', lead: 'Effective Date: September 21, 2026', actions: [] }),
    prose({ body, aside: toc }),
  ],
});
