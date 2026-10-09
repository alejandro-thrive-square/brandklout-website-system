/* Copy that the live site repeats on many pages, kept once. build.mjs skips files that start with _.
   Every line is the practice's own (scrape/pages/services-*.md, "Why Patients Choose Dr. Meskin");
   "4.7 stars on Google with over 1,000 reviews" is left out: it is the host's listing (BugHerd #10, #24). */
import { p } from '../lib/ui.mjs';

/* the specialist chapter of every treatment page; each page sets its own title */
export const MESKIN = {
  tagline: 'Precision-Trained, Patient-First',
  body: p('Dr. Meskin is a prosthodontist dedicated to one thing: replacing and restoring teeth so they look, feel, and function like the ones you were born with. He earned his Doctor of Dental Surgery degree and completed his specialty training in prosthodontics at NYU, then refined his implant work as an associate prosthodontist at ClearChoice, one of the largest dental implant networks in the country. Today he leads Hackensack Center for Dental Implants, where every case is planned in 3D, fabricated in an on-site lab, and designed around the patient sitting in front of him. He provides care in English, Spanish, and Russian.'),
  lead: 'NYU-trained specialist in replacing and restoring teeth.',
  credentials: [
    ['Doctor of Dental Surgery', 'DDS, NYU College of Dentistry'],
    ['Specialty', 'Certificate in Prosthodontics, NYU College of Dentistry'],
    ['Experience', 'Associate Prosthodontist, ClearChoice Dental Implant Centers'],
  ],
  recognition: [
    'Patients describe him as an artist with a gentle touch whose restorative work looks so natural no one can tell.',
    'Complex and referred-out cases trusted to him by other dental offices.',
  ],
};

/* "Smile Now, Pay Later": the four lenders, as every treatment page of the live site words them */
export const LENDER_COPY = [
    { key: 'cherry', text: 'Cherry is one of the most popular healthcare financing options, built specifically for dental and medical care. You can apply in minutes with a soft credit check that does not affect your score, and qualified applicants can access 0% APR plans with no deferred interest. Payment terms range from 3 to 60 months.', features: ['Soft credit check, no impact to apply', '0% APR for qualifying applicants, no deferred interest', 'Plans from 3 to 60 months', 'Fast online application with a quick decision'] },
    { key: 'hfd', text: 'HFD focuses on making larger treatment plans manageable, with flexible structures designed to fit a range of budgets and credit situations. Our coordinators can walk you through whether HFD is the right fit for your treatment.', features: ['Options for a range of credit profiles', 'Flexible terms for larger cases', 'Guided by our treatment coordinators'] },
    { key: 'proceed', text: 'Proceed specializes in financing larger and more comprehensive dental cases, such as full-arch and full-mouth treatment, with longer installment options and true 0% APR plans for those who qualify.', features: ['Built for larger, comprehensive cases', 'Longer-term installment options', '0% APR options for qualifying applicants'] },
    { key: 'carecredit', text: 'CareCredit is a long-established healthcare credit card offering promotional no-interest periods when the balance is paid in full within the promotional window. Our coordinators will explain the terms clearly, so you know exactly how the promotional period works before you commit.', features: ['Widely accepted healthcare financing', 'Promotional no-interest periods when paid in full on time', 'Soft credit check option to apply'] },
  ];
