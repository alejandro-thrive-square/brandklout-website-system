// The practice's three legal documents — Privacy Policy, Terms of Service and
// Cookie Policy — as rich-text HTML, written ONCE here.
//
// WHY THIS FILE EXISTS SEPARATELY FROM site/pages.mjs
// The redesigned build and the site currently live on Instatic are two
// different stylesheets, and the redesign has not shipped. These documents had
// to be published into the LIVE (old) design while the local build carries the
// new one. Both renderers pull the same strings from here, so the two can never
// say different things about the same practice. Everything below is plain
// Client-First rich text (h2/h3/p/ul/strong/a) — no design-specific classes —
// which is exactly why it styles correctly under either sheet.
//
// SOURCE OF THE STRUCTURE
// Modelled on Grand Mission Dentistry's three published documents, which the
// client supplied as the reference:
//   grandmissiondentistry.com/{privacy-policy,terms-of-service,cookie-policy}
// The section order, headings and A2P 10DLC wording follow that reference so
// the two practices read as one standard. Every FACT is Mason Park's own.
//
// THE ENTITY LINE IS THE POINT OF THIS REVISION
// Grand Mission publishes "William Sung DMD PC DBA Grand Mission Dentistry" —
// the registered entity, then the name the public knows. Mason Park's own
// GoHighLevel business profile records the same split:
//   Legal Business Name  : Mason Park Dental PLLC   (as registered with the EIN)
//   Friendly Business Name: Mason Park Dental of Katy
// The Terms that were carried over from the old WordPress site said
// "Mason Park Dental of Katy PLLC", which is NEITHER of those — it welds the
// trading name onto the entity suffix and names a PLLC that is not registered.
// A2P 10DLC campaign vetting checks the entity name on the policy pages against
// the EIN record, so this is the line that has to be right.
//
// WHAT IS DELIBERATELY NOT COPIED FROM GRAND MISSION
//   - AI Smile Preview, OralDNA, Ahrefs Analytics, Sienna Accessibility: Grand
//     Mission runs these, Mason Park does not. Naming a tool the practice does
//     not use is a misstatement in a document that exists to be accurate.
//   - Fort Bend County venue. The office is at 21830 Kingsland Blvd, which is
//     in HARRIS County. The carried-over Terms already said Harris; it stays.
//   - Grand Mission's effective dates.

/** Bumped whenever the wording below changes. Shown at the top of all three. */
export const EFFECTIVE_DATE = "August 28, 2026";

/** The registered entity, exactly as it appears against the EIN. */
export const LEGAL_ENTITY = "Mason Park Dental PLLC";

/** How the entity is named on first reference in each document. */
export const ENTITY_LINE = `${LEGAL_ENTITY} DBA Mason Park Dental of Katy`;

/** Suit venue. The practice address sits in Harris County, not Fort Bend. */
export const VENUE_COUNTY = "Harris County, Texas";

// The third parties the site ACTUALLY loads, harvested from the build rather
// than assumed. Keep this list honest — it is quoted in all three documents.
//   GoHighLevel / LeadConnector  the contact form, the campaign lead forms, the
//                                SMS program, and the call-tracking number pool
//                                on the advertising landing pages
//   FlexBook                     online scheduling (flexbook.me/masonpark)
//   Google Maps                  the embedded pin on the contact pages
//   123FormBuilder               virtual consultation + special offers forms
//   Cherry                       patient financing, linked from /financing/
//   Elfsight                     the Google reviews widget on the landing pages

const P = {
  name: "Mason Park Dental of Katy",
  site: "https://www.masonparkdental.com/",
  siteLabel: "www.masonparkdental.com",
  phone: "(281) 769-8878",
  phoneHref: "tel:+12817698878",
  email: "office@masonparkdental.com",
  street: "21830 Kingsland Blvd #104A",
  cityLine: "Katy, TX 77450",
};

const tel = `<a href="${P.phoneHref}">${P.phone}</a>`;
const mail = `<a href="mailto:${P.email}">${P.email}</a>`;
const siteLink = `<a href="${P.site}">${P.site}</a>`;

/** The identical contact block that closes each of the three documents. */
const contactBlock = () => `
      <p><strong>${P.name}</strong><br>
      ${P.street}<br>
      ${P.cityLine}<br>
      Phone: ${tel}<br>
      Email: ${mail}<br>
      Website: ${siteLink}</p>`;

const effective = () => `<p><strong>Effective Date:</strong> ${EFFECTIVE_DATE}</p>`;

// ===========================================================================
// Privacy Policy
// ===========================================================================
export const privacyPolicyBody = () => `
      ${effective()}

      <p>${ENTITY_LINE} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) respects your privacy and is
      committed to protecting the personal information you share with us through our website,
      ${P.siteLabel} (the &ldquo;Site&rdquo;), and through our text messaging program. This Privacy
      Policy explains what information we collect, how we use it, with whom we share it, and the
      choices you have.</p>

      <p>This policy applies to information collected through our Site and our SMS messaging
      program. Information you provide to us as a patient in connection with dental care is
      governed by our separate <strong>Notice of Privacy Practices under HIPAA</strong>, which is
      available at our office and upon request.</p>

      <h2>1. Information We Collect</h2>

      <h3>Information you provide directly</h3>
      <p>We collect information you choose to give us, such as when you:</p>
      <ul>
        <li>Submit a contact or appointment request form</li>
        <li>Book an appointment through our online scheduling tool</li>
        <li>Claim a special offer or respond to one of our advertisements</li>
        <li>Request a virtual consultation, which may include photos you upload</li>
        <li>Opt in to receive text messages by checking a consent box on a website form</li>
        <li>Communicate with us by phone, email, or text</li>
      </ul>
      <p>This information may include your name, email address, phone number (mobile number for
      SMS), mailing address, date of birth, insurance details, reason for visit, and any other
      information you choose to share.</p>

      <h3>Information collected automatically</h3>
      <p>When you visit our Site, we and our service providers may automatically collect certain
      information about your device and how you interact with the Site, including:</p>
      <ul>
        <li>IP address and approximate location</li>
        <li>Browser type, operating system, and device identifiers</li>
        <li>Pages visited, time spent, and referring URLs</li>
        <li>Information collected through cookies and similar technologies (see Section 6)</li>
      </ul>

      <h3>Call tracking on our advertising pages</h3>
      <p>Our paid advertising landing pages display a tracking telephone number that is different
      from the practice&rsquo;s main number. Calls to that number reach the same front desk and are
      recorded as having come from a particular advertisement, so that we can tell which campaigns
      are working. This tells us how you found us; it does not change how your call is handled.</p>

      <h3>Health-related information</h3>
      <p>If you submit photos or describe symptoms through our virtual consultation or contact
      forms, we treat that information with the same care we apply to any patient health
      information. Please do not send detailed medical histories or sensitive health information
      through our website forms, text messages, or unencrypted email. For sensitive matters, please
      call our office at ${tel}.</p>

      <h2>2. How We Use Your Information</h2>
      <p>We use the information we collect to:</p>
      <ul>
        <li>Respond to your inquiries and schedule appointments</li>
        <li>Provide the dental services you have requested</li>
        <li>Send appointment reminders, confirmations, and follow-up communications by phone,
        email, or SMS</li>
        <li>Send conversational text messages in response to your inquiries or to coordinate your
        care</li>
        <li>Send promotional and marketing text messages about special offers, new services, and
        practice updates (only if you opt in)</li>
        <li>Process payments and verify insurance benefits</li>
        <li>Improve our Site, services, and patient experience</li>
        <li>Comply with legal, regulatory, and professional obligations</li>
      </ul>

      <h2>3. SMS / Text Messaging Program (A2P 10DLC)</h2>
      <p>${P.name} offers a text messaging program that allows us to communicate with you by SMS
      for appointment reminders, promotional offers, and two-way conversational messages related to
      your care. This section describes how that program works and your rights regarding it.</p>

      <h3>How you opt in</h3>
      <p>You may opt in to receive text messages from ${P.name} by:</p>
      <ul>
        <li>Checking the SMS consent checkbox on a form on our website (${P.siteLabel}), such as our
        contact, appointment request, or special offer form</li>
        <li>Providing your mobile number and affirmatively agreeing to receive text messages</li>
      </ul>
      <p><strong>Consent is not a condition of purchase or of receiving dental care.</strong> By
      checking the SMS consent box and submitting your mobile number, you agree to receive recurring
      automated and conversational text messages from ${P.name} at the mobile number you provided,
      including appointment reminders, confirmations, follow-ups, promotional offers, and other
      practice communications.</p>

      <h3>Types of messages you may receive</h3>
      <ul>
        <li><strong>Appointment messages:</strong> reminders, confirmations, rescheduling notices,
        and follow-up care instructions.</li>
        <li><strong>Conversational messages:</strong> two-way replies from our team in response to
        your questions or to coordinate your visit.</li>
        <li><strong>Promotional and marketing messages:</strong> special offers, seasonal
        promotions, new services, and practice updates.</li>
      </ul>

      <h3>Message frequency</h3>
      <p>Message frequency varies based on your interactions with us and your appointment schedule.
      You will not receive an unreasonable number of messages.</p>

      <h3>Message and data rates</h3>
      <p>Message and data rates may apply, depending on your mobile carrier and plan. ${P.name}
      does not charge a fee for the text messages themselves.</p>

      <h3>How to opt out (STOP)</h3>
      <p>You can cancel the SMS service at any time. Reply <strong>STOP</strong> to any text message
      you receive from us. After you send STOP, we will send you one final message confirming that
      you have been unsubscribed. After that, you will no longer receive SMS messages from us. If
      you want to rejoin, simply opt in again through our website form or contact our office.</p>

      <h3>How to get help (HELP)</h3>
      <p>If at any time you need assistance, reply <strong>HELP</strong> to any message from us, or
      contact us directly at ${tel} or ${mail}.</p>

      <h3>Supported carriers</h3>
      <p>Our SMS program is compatible with all major U.S. carriers, including AT&amp;T, Verizon
      Wireless, T-Mobile, Sprint, U.S. Cellular, Boost Mobile, MetroPCS, Cricket Wireless, and
      others. Carriers are not liable for delayed or undelivered messages.</p>

      <h3>Mobile information and sharing</h3>
      <p><strong>No mobile information will be shared with third parties or affiliates for marketing
      or promotional purposes.</strong> All other categories of personal information described in
      this Privacy Policy follow the standard sharing practices outlined in Section 4. Information
      sharing related to text messaging is limited to subcontractors who help us operate the SMS
      program (such as our messaging platform provider and telecommunications carriers) and only as
      needed to deliver messages to you.</p>

      <h3>Privacy and SMS</h3>
      <p>We do not sell, rent, or share your mobile phone number or SMS opt-in data with third
      parties for their marketing purposes. Standard messaging, in plain text, is not a secure
      channel; please do not send sensitive health, financial, or personally identifiable
      information by text.</p>

      <h2>4. How We Share Your Information</h2>
      <p>We do not sell or rent your personal information. We share information only as needed to
      operate our practice and serve you, including with:</p>
      <ul>
        <li><strong>Service providers</strong> who support our Site, scheduling, SMS messaging
        platform, communications, payment processing, and analytics, under agreements that limit how
        they may use your information</li>
        <li><strong>Insurance carriers and benefit administrators</strong>, when you request that we
        bill or verify coverage</li>
        <li><strong>Healthcare partners</strong> (for example specialists, laboratories, and imaging
        providers) involved in your care</li>
        <li><strong>Legal and regulatory authorities</strong> when required by law, subpoena, or to
        protect rights, property, or safety</li>
      </ul>
      <p>If our practice is ever sold, merged, or restructured, your information may be transferred
      as part of that transaction, subject to applicable law.</p>
      <p><strong>Mobile opt-in data and consent are never shared with third parties for marketing
      purposes.</strong></p>

      <h2>5. Third-Party Tools and Embedded Content</h2>
      <p>Our Site uses third-party tools to function and improve. These may include:</p>
      <ul>
        <li>Online appointment scheduling through FlexBook</li>
        <li>Lead and contact forms, and the SMS messaging platform, provided by GoHighLevel and its
        underlying telecommunications providers</li>
        <li>Call tracking numbers on our advertising landing pages, provided by the same messaging
        platform</li>
        <li>Virtual consultation and special offer forms provided by 123FormBuilder</li>
        <li>Google Maps embeds for directions</li>
        <li>Review widgets that display patient reviews</li>
        <li>Patient financing applications handled by Cherry</li>
        <li>Web analytics services that help us understand how visitors use our Site</li>
      </ul>
      <p>These third parties may collect information about your visit subject to their own privacy
      policies. We encourage you to review them.</p>

      <h2>6. Cookies and Similar Technologies</h2>
      <p>A &ldquo;cookie&rdquo; is a small data file stored on your device when you visit a website.
      We use cookies and similar technologies to:</p>
      <ul>
        <li>Remember your preferences and improve your experience</li>
        <li>Understand how visitors find and use our Site</li>
        <li>Measure the effectiveness of our content and offers</li>
      </ul>
      <p>You can control cookies through your browser settings. Disabling cookies may affect how
      parts of the Site function. For more detail, see our
      <a href="/cookie-policy/">Cookie Policy</a>.</p>

      <h2>7. Your Choices and Rights</h2>
      <p>You have several choices about your information:</p>
      <ul>
        <li><strong>Opt out of marketing emails</strong> by clicking &ldquo;unsubscribe&rdquo; in
        any email or contacting us directly.</li>
        <li><strong>Opt out of text messages</strong> by replying STOP to any SMS from us (see
        Section 3).</li>
        <li><strong>Request access, correction, or deletion</strong> of personal information we hold
        about you by contacting us using the details below.</li>
        <li><strong>Adjust cookie settings</strong> through your browser.</li>
      </ul>
      <p>Depending on where you live, you may have additional rights under laws such as the Texas
      Data Privacy and Security Act, the California Consumer Privacy Act, or other applicable laws.
      To exercise these rights, contact us using the information in Section 12. We will respond
      within the timeframe required by law and will not discriminate against you for exercising your
      rights.</p>
      <p>Please note that information we maintain as part of your protected dental record is
      governed by HIPAA and applicable state law, which may limit deletion or modification rights
      for clinical records.</p>

      <h2>8. How We Protect Your Information</h2>
      <p>We use administrative, technical, and physical safeguards designed to protect your personal
      information. However, no method of transmission over the internet, SMS, or electronic storage
      is completely secure. For your protection, please do not send confidential health information
      through website contact forms, text messages, or unencrypted email.</p>

      <h2>9. Data Retention</h2>
      <p>We retain personal information for as long as needed to fulfill the purposes described in
      this policy, to comply with our legal and professional obligations, to resolve disputes, and
      to enforce our agreements. SMS opt-in records and message logs are retained for the period
      required by applicable telecommunications and consumer protection laws. Dental records are
      retained in accordance with Texas State Board of Dental Examiners requirements and other
      applicable law.</p>

      <h2>10. Children&rsquo;s Privacy</h2>
      <p>Our Site and SMS program are not directed to children under 13, and we do not knowingly
      collect personal information or SMS opt-in data from children under 13. We do, of course,
      treat children as patients in our office; in those cases, information is collected from a
      parent or legal guardian and handled under HIPAA and applicable law. If you believe a child
      has submitted information through our Site or our SMS program, please contact us so we can
      delete it.</p>

      <h2>11. Links to Other Websites</h2>
      <p>Our Site may include links to third-party websites that we do not control, including the
      practice&rsquo;s pediatric site and the tools listed in Section 5. We are not responsible for
      the content or privacy practices of those sites. Please review their privacy policies before
      sharing information with them.</p>

      <h2>12. Contact Us</h2>
      <p>If you have questions about this Privacy Policy, our SMS program, or wish to exercise your
      rights, please contact us:</p>
      ${contactBlock()}

      <h2>13. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. When we do, we will revise the
      &ldquo;Effective Date&rdquo; above and, where appropriate, provide additional notice. We
      encourage you to review this policy periodically.</p>`;

// ===========================================================================
// Terms of Service
// ===========================================================================
export const termsOfServiceBody = () => `
      ${effective()}

      <p>These Terms of Service (&ldquo;Terms&rdquo;) govern your use of the website operated by
      ${ENTITY_LINE} (&ldquo;${P.name},&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
      &ldquo;our&rdquo;), located at ${siteLink} (the &ldquo;Site&rdquo;), as well as our text
      messaging program.</p>

      <p>By accessing or using this Site, submitting information through our forms, scheduling
      appointments, opting in to receive text messages from us, or communicating with us
      electronically, you agree to these Terms. If you do not agree, please do not use the Site or
      our online services.</p>

      <p>We may update these Terms from time to time. Updates will be posted on this page with a
      revised &ldquo;Effective Date.&rdquo; Your continued use of the Site or our SMS program after
      changes are posted means you accept the updated Terms.</p>

      <h2>1. Eligibility and Use of the Website</h2>
      <p>You must be at least 18 years old, or have the involvement of a parent or legal guardian,
      to use this Site, request an appointment, submit information through our forms, or opt in to
      receive text messages from us.</p>
      <p>You agree to use the Site only for lawful purposes and in a way that does not interfere
      with its operation, security, or accessibility for others.</p>

      <h2>2. Informational Purpose; No Dentist-Patient Relationship</h2>
      <p>The Site provides general information about our practice, dental services, treatment
      options, educational content, and patient resources.</p>
      <p>All content on the Site is provided for <strong>general informational and educational
      purposes only</strong>. It is not a substitute for an in-person examination, diagnosis, or
      treatment plan from a licensed dental professional.</p>
      <p>Use of the Site does not create a dentist-patient relationship. A relationship is formed
      only when you are accepted as a patient by our office and receive care from our clinical
      team.</p>
      <p><strong>Emergency notice:</strong> if you believe you are experiencing a dental or medical
      emergency, contact our office directly or call 911 or your local emergency number. Do not rely
      on website forms, text messages, or email for urgent care.</p>

      <h2>3. Appointment Requests and Scheduling</h2>
      <p>Through the Site, you may submit a contact form, request an appointment, use an external
      scheduling tool, or otherwise communicate with our office.</p>
      <p>Submitting a request does not guarantee an appointment. Appointments are confirmed only
      after our office or scheduling provider verifies availability and contacts you.</p>
      <p>You agree to provide accurate, current, and complete information when using our forms or
      scheduling tools. We reserve the right to modify, reschedule, or decline appointment requests
      based on provider availability, scheduling conflicts, emergencies, incomplete information, or
      other reasonable considerations.</p>

      <h2>4. Sensitive Information and Electronic Communications</h2>
      <p>Our website forms, text messaging program, and general electronic communications are
      intended for routine inquiries and appointment-related requests. Please do not submit
      sensitive medical, dental, insurance, or financial information through general website forms,
      text messages, or unencrypted email. For matters involving protected health information,
      please call our office or use a secure channel we direct you to.</p>
      <p>Information you provide as a patient in connection with dental care is governed by our
      separate <strong>Notice of Privacy Practices under HIPAA</strong>, available at our office and
      upon request.</p>

      <h2>5. Phone, Email, and SMS Communications</h2>
      <p>By providing your contact information through the Site, scheduling an appointment, or
      otherwise communicating with our office, you consent to receive non-marketing communications
      from ${P.name} related to your inquiry, appointment, or treatment by phone, voicemail, email,
      and (where you have provided a mobile number) SMS/text message.</p>
      <p>These communications may include appointment confirmations and reminders, treatment-related
      follow-ups, office updates, and responses to your inquiries.</p>

      <h3>SMS / Text Messaging Program (A2P 10DLC)</h3>
      <p>${P.name} operates a text messaging program through a third-party messaging platform.
      Messages are sent on our behalf using an Application-to-Person (A2P) 10DLC service. By opting
      in, you agree to the following terms:</p>

      <h3>How you opt in</h3>
      <p>You may opt in to receive text messages from ${P.name} by:</p>
      <ul>
        <li>Checking the SMS consent checkbox on a form on our website (such as the contact,
        appointment request, or special offer form) and submitting your mobile number</li>
        <li>Affirmatively agreeing in writing or electronically to receive text messages from us</li>
      </ul>
      <p><strong>Consent is not a condition of purchase or of receiving dental care.</strong> By
      checking the SMS consent box and submitting your mobile number, you agree to receive recurring
      automated and conversational text messages from ${P.name} at the mobile number you
      provided.</p>

      <h3>Types of messages</h3>
      <p>Messages you may receive include:</p>
      <ul>
        <li><strong>Appointment messages:</strong> reminders, confirmations, rescheduling notices,
        and follow-up care instructions</li>
        <li><strong>Conversational messages:</strong> two-way replies from our team in response to
        your questions or to coordinate your visit</li>
        <li><strong>Promotional and marketing messages:</strong> special offers, seasonal
        promotions, new services, and practice updates</li>
      </ul>

      <h3>Program details</h3>
      <ul>
        <li>Message frequency varies based on your appointments and interactions with us.</li>
        <li>Message and data rates may apply, depending on your mobile carrier and plan. ${P.name}
        does not charge a fee for the text messages themselves.</li>
        <li>You may opt out at any time by replying <strong>STOP</strong> to any message you
        receive. After you reply STOP, we will send one final message confirming your
        unsubscribe.</li>
        <li>For help, reply <strong>HELP</strong> to any message, or contact our office at ${tel} or
        ${mail}.</li>
        <li>Supported carriers include AT&amp;T, Verizon Wireless, T-Mobile, Sprint, U.S. Cellular,
        Boost Mobile, MetroPCS, Cricket Wireless, and others. Mobile carriers are not liable for
        delayed or undelivered messages.</li>
      </ul>

      <h3>Mobile information and privacy</h3>
      <p><strong>No mobile information will be shared with third parties or affiliates for marketing
      or promotional purposes.</strong> Information sharing related to text messaging is limited to
      subcontractors who help us operate the SMS program (such as our messaging platform provider
      and telecommunications carriers) and only as needed to deliver messages to you. We do not sell
      your phone number or SMS opt-in data.</p>
      <p>Electronic communications, including email and text messages, are not always fully secure
      and may be intercepted in transit. Please consider this before sharing sensitive information
      through these channels.</p>
      <p>Additional information about how we handle your SMS data is available in our
      <a href="/privacy-policy/">Privacy Policy</a>.</p>

      <h2>6. Third-Party Tools and Embedded Services</h2>
      <p>Certain features on the Site and in our messaging program are provided through third-party
      services, which may include:</p>
      <ul>
        <li>External appointment scheduling tools (FlexBook)</li>
        <li>Lead and contact forms, and the SMS messaging platform, provided by GoHighLevel and its
        underlying telecommunications providers</li>
        <li>Call tracking numbers on our advertising landing pages</li>
        <li>Virtual consultation and special offer forms provided by 123FormBuilder</li>
        <li>Financing and payment tools (such as Cherry)</li>
        <li>Embedded maps (Google Maps)</li>
        <li>Analytics and performance tools</li>
        <li>Embedded videos and review widgets</li>
        <li>Other integrated website features</li>
      </ul>
      <p>These services operate under their own terms of use and privacy policies. We are not
      responsible for the availability, accuracy, content, security, or practices of any third-party
      platform. Your use of any such tool is at your own discretion and subject to the third
      party&rsquo;s own terms.</p>

      <h2>7. Financing and Payment Tools</h2>
      <p>If the Site provides access to financing, payment, or prequalification tools through
      third-party providers such as Cherry, those services are offered by independent third parties
      &mdash; not directly by ${P.name}.</p>
      <p>We do not control financing approvals, application outcomes, credit requirements, payment
      terms, lending terms, or promotional offers. Questions about financing decisions, account
      terms, or payments should be directed to the applicable third-party provider.</p>

      <h2>8. Virtual Consultations and Photo Submissions</h2>
      <p>If you use our virtual consultation tool or submit photos through a virtual consultation
      form, you represent that you have the right to share the images submitted. Photos submitted
      for virtual consultation purposes are used to provide a preliminary, non-diagnostic assessment
      only and do not substitute for an in-person evaluation. Treatment recommendations require a
      complete clinical examination.</p>

      <h2>9. Your Responsibilities</h2>
      <p>By using the Site, opting in to our SMS program, or communicating with our office, you
      agree to:</p>
      <ul>
        <li>Provide truthful, accurate, and complete information, including a mobile number that you
        own or are authorized to use for SMS opt-in.</li>
        <li>Use the Site, its tools, and our SMS program only for legitimate personal or
        patient-related purposes.</li>
        <li>Refrain from submitting false, misleading, or unauthorized requests, including opting in
        any phone number that does not belong to you or that you are not authorized to enroll.</li>
        <li>Refrain from attempting to disrupt, damage, disable, reverse engineer, or gain
        unauthorized access to the Site, its systems, our messaging platform, or any connected
        services.</li>
        <li>Notify us promptly if your contact information changes and you wish to continue
        receiving appointment-related communications.</li>
      </ul>

      <h2>10. Intellectual Property</h2>
      <p>All content on this Site &mdash; including text, graphics, logos, icons, photographs,
      videos, page layouts, design elements, and written content &mdash; is owned by or licensed to
      ${LEGAL_ENTITY} and is protected by applicable intellectual property laws.</p>
      <p>You may not copy, reproduce, republish, distribute, modify, display, transmit, or otherwise
      use any content from the Site without our prior written permission, except for limited
      personal, non-commercial use such as printing a page for your own reference.</p>

      <h2>11. Third-Party Links</h2>
      <p>The Site may contain links to external websites for your convenience. These links do not
      imply endorsement or control by ${P.name}. We are not responsible for the content,
      functionality, accuracy, or privacy practices of any third-party site. Please review their
      terms and privacy policies before using them.</p>

      <h2>12. Medical and Dental Disclaimer</h2>
      <p>Content on the Site is not medical or dental advice and should not be relied on as a
      substitute for professional care. Always consult a licensed dental professional for diagnosis,
      treatment recommendations, and care specific to your individual needs.</p>

      <h2>13. Disclaimer of Warranties</h2>
      <p>The Site, our SMS program, and their content are provided &ldquo;as is&rdquo; and &ldquo;as
      available,&rdquo; without warranties of any kind, either express or implied, including
      warranties of merchantability, fitness for a particular purpose, accuracy, or
      non-infringement.</p>
      <p>While we work to keep the Site accurate and functional, we do not guarantee that the Site
      or our SMS program will always be available, that content or messages will be current,
      complete, error-free, or delivered without interruption, or that third-party tools and
      integrations will function without issue.</p>
      <p>Use of the Site and our SMS program is at your own risk.</p>

      <h2>14. Limitation of Liability</h2>
      <p>To the fullest extent permitted by law, ${LEGAL_ENTITY}, its owners, employees, and
      affiliates shall not be liable for any direct, indirect, incidental, consequential, special,
      or punitive damages arising out of or related to your use of (or inability to use) the Site or
      our SMS program, errors or omissions in Site content, delays or failures in communication
      (including undelivered or delayed text messages), technical issues or service interruptions,
      unauthorized access to transmitted information, or your use of third-party services linked
      through or embedded on the Site.</p>
      <p>This section does not limit liability that cannot be limited under applicable law.</p>

      <h2>15. Indemnification</h2>
      <p>You agree to defend, indemnify, and hold harmless ${LEGAL_ENTITY} and its owners,
      employees, and affiliates from any claims, damages, losses, liabilities, and expenses
      (including reasonable attorneys&rsquo; fees) arising out of or related to your violation of
      these Terms, your misuse of the Site or our SMS program (including opting in any phone number
      you do not own or are not authorized to enroll), or your violation of any law or the rights of
      a third party.</p>

      <h2>16. Governing Law and Venue</h2>
      <p>These Terms are governed by and construed in accordance with the laws of the State of
      Texas, without regard to its conflict-of-laws principles. You agree that any dispute arising
      out of or relating to these Terms or your use of the Site shall be brought exclusively in the
      state or federal courts located in ${VENUE_COUNTY}, and you consent to the personal
      jurisdiction of those courts.</p>

      <h2>17. Severability; No Waiver; Entire Agreement</h2>
      <p>If any provision of these Terms is found to be unenforceable, the remaining provisions will
      continue in full force and effect. Our failure to enforce any provision is not a waiver of
      that provision or any other.</p>
      <p>These Terms, together with our <a href="/privacy-policy/">Privacy Policy</a> and
      <a href="/cookie-policy/">Cookie Policy</a>, constitute the entire agreement between you and
      ${LEGAL_ENTITY} regarding your use of the Site and our SMS program and supersede any prior
      agreements relating to that subject.</p>

      <h2>18. Privacy and Cookies</h2>
      <p>Your use of the Site and our SMS program is also subject to our
      <a href="/privacy-policy/">Privacy Policy</a> and <a href="/cookie-policy/">Cookie Policy</a>,
      which describe how we collect, use, and manage information collected through the Site and our
      messaging program.</p>

      <h2>19. Changes to These Terms</h2>
      <p>We may revise these Terms at any time by posting an updated version on this page. Updates
      take effect as of the &ldquo;Effective Date&rdquo; shown above. We encourage you to review this
      page periodically.</p>

      <h2>20. Contact Us</h2>
      <p>If you have questions about these Terms of Service or our SMS program, please contact:</p>
      ${contactBlock()}`;

// ===========================================================================
// Cookie Policy
// ===========================================================================
export const cookiePolicyBody = () => `
      ${effective()}

      <p>This Cookie Policy explains how ${ENTITY_LINE} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
      &ldquo;our&rdquo;) uses cookies and similar tracking technologies on ${siteLink} (the
      &ldquo;Site&rdquo;). It should be read together with our
      <a href="/privacy-policy/">Privacy Policy</a> and
      <a href="/terms-of-service/">Terms of Service</a>.</p>

      <h2>1. What Cookies Are</h2>
      <p>Cookies are small text files placed on your device when you visit a website. Similar
      technologies &mdash; including web beacons, pixels, local storage, and tracking scripts &mdash;
      work in comparable ways. Throughout this policy, we use the term &ldquo;cookies&rdquo; to refer
      to all of them.</p>
      <p>Cookies generally do not identify you by name, but they can be associated with information
      you provide to us through forms or other interactions on the Site. They may collect technical
      and behavioral information such as your browser and device type, operating system, pages
      visited, time spent on the Site, referring website, and approximate location based on IP
      address.</p>

      <h2>2. How We Use Cookies</h2>
      <p>We use cookies to operate, secure, and improve our Site. Specifically, we use them to:</p>
      <ul>
        <li>Make the Site function properly and load efficiently</li>
        <li>Remember your preferences and form entries</li>
        <li>Support embedded content, scheduling, and other interactive tools</li>
        <li>Help maintain security and prevent spam or abuse</li>
        <li>Understand how visitors find and use the Site so we can improve it</li>
      </ul>

      <h2>3. Categories of Cookies We Use</h2>
      <p><strong>Essential cookies</strong> are necessary for the Site to function and cannot
      generally be disabled through our systems. They support core functions such as page
      navigation, form submission, accessibility features, security, and session management.
      Disabling them through your browser may break parts of the Site.</p>
      <p><strong>Performance and analytics cookies</strong> help us understand how visitors interact
      with the Site &mdash; which pages are most visited, how users move through the Site, and where
      they may encounter problems. This information is typically aggregated and helps us improve
      content and usability.</p>
      <p><strong>Functional cookies</strong> remember choices and preferences (such as form entries
      or display settings) so that returning to the Site is more convenient.</p>
      <p><strong>Third-party cookies</strong> are placed by services we integrate with on the Site.
      Depending on the features you use, these may include:</p>
      <ul>
        <li>Contact and lead forms, and our SMS messaging platform, provided by GoHighLevel</li>
        <li>Call tracking on our advertising landing pages, which records which advertisement
        brought you to us and which telephone number you called</li>
        <li>Online appointment scheduling (FlexBook) for booking and managing appointments</li>
        <li>Virtual consultation and special offer forms provided by 123FormBuilder</li>
        <li>Financing and payment tools (Cherry) when you use them</li>
        <li>Maps (Google Maps) for directions and the embedded office map</li>
        <li>Embedded videos and review widgets</li>
        <li>Website hosting, performance, and content delivery providers</li>
      </ul>
      <p>These third parties operate under their own privacy and cookie policies. We do not control
      all cookies they place. We encourage you to review the policies of any service you interact
      with through our Site.</p>

      <h2>4. Cookies and Personal Information</h2>
      <p>Cookies we use are intended to support functionality, convenience, and Site performance. If
      you submit information through a contact form, appointment request, or other tool, that
      information may be associated with your visit to help us respond to your inquiry and improve
      our Site.</p>
      <p>We do not sell or share cookie data or personal information collected through cookies for
      cross-context behavioral advertising or other unrelated marketing purposes. For more on how we
      handle the personal information you provide, including your rights to access, correct, or
      delete it, please see our <a href="/privacy-policy/">Privacy Policy</a>.</p>

      <h2>5. Managing Cookies</h2>
      <p>Most web browsers let you control cookies through their settings &mdash; including blocking
      all cookies, accepting only certain types, deleting stored cookies, and being notified when
      cookies are placed. Settings instructions for the most common browsers are available here:</p>
      <ul>
        <li>Google Chrome: <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener">support.google.com/chrome/answer/95647</a></li>
        <li>Apple Safari: <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener">support.apple.com/guide/safari/manage-cookies-sfri11471/mac</a></li>
        <li>Mozilla Firefox: <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener">support.mozilla.org/kb/cookies-information-websites-store-on-your-computer</a></li>
        <li>Microsoft Edge: <a href="https://support.microsoft.com/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener">support.microsoft.com/microsoft-edge/delete-cookies-in-microsoft-edge</a></li>
      </ul>
      <p>Disabling cookies may affect the functionality of certain parts of the Site, including
      forms, scheduling tools, embedded content, and other interactive features.</p>

      <h2>6. Browser Privacy Signals</h2>
      <p>Some browsers offer privacy signals such as &ldquo;Do Not Track&rdquo; (DNT) or the
      <strong>Global Privacy Control (GPC)</strong>. Standards for these signals continue to evolve,
      and there is no single industry-wide approach to honoring them. Where required by applicable
      law, we will treat a recognized GPC signal as a request to opt out of the sale or sharing of
      personal information collected through cookies. Our Site does not currently respond to DNT
      signals because there is no consistent industry standard for them.</p>

      <h2>7. Changes to This Cookie Policy</h2>
      <p>We may update this Cookie Policy from time to time to reflect changes in our practices, the
      technologies we use, our service providers, or applicable law. When we do, we will revise the
      &ldquo;Effective Date&rdquo; above and post the updated version on this page. We encourage you
      to review it periodically.</p>

      <h2>8. Contact Us</h2>
      <p>If you have any questions about this Cookie Policy or how ${P.name} uses cookies and
      similar technologies, please contact:</p>
      ${contactBlock()}`;

/** slug -> { title, description, sub, body } for the three documents. */
export const LEGAL_PAGES = {
  "privacy-policy": {
    title: "Privacy Policy | Mason Park Dental of Katy",
    description:
      "How Mason Park Dental of Katy collects, uses and protects your information, including our SMS text messaging program and your opt-out rights.",
    heading: "Privacy Policy",
    sub: "How we collect, use and protect your information, including our text messaging program.",
    body: privacyPolicyBody,
  },
  "terms-of-service": {
    title: "Terms of Service | Mason Park Dental of Katy",
    description:
      "The terms that govern your use of the Mason Park Dental of Katy website, our appointment forms and our SMS text messaging program.",
    heading: "Terms of Service",
    sub: "The terms that govern your use of this website and our text messaging program.",
    body: termsOfServiceBody,
  },
  "cookie-policy": {
    title: "Cookie Policy | Mason Park Dental of Katy",
    description:
      "How the Mason Park Dental of Katy website uses cookies and similar technologies, which third parties set them, and how to control them.",
    heading: "Cookie Policy",
    sub: "How this website uses cookies and similar technologies, and how to control them.",
    body: cookiePolicyBody,
  },
};
