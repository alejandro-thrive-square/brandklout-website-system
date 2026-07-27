# Clifton Exteriors — Old Site Content Inventory (1:1 Rebuild Reference)

Source: https://www.cliftonexteriors.com (homepage HTML snapshot, WordPress + Elementor, captured 2026-07). This is the verbatim content reference for the redesign.

---

## 1. Business Summary

- **Company**: Clifton Exteriors, LLC — exterior remodeling contractor (roofing, window replacement, siding, gutters, doors).
- **Positioning / tagline (H1)**: "Quality Windows, Roofing, Siding, Doors & Gutters In Northern Virginia At A Fair Price"
- **Secondary tagline (H2)**: "Transform Your House Into A Place You're Proud To Come Home To"
- **Logo alt text**: "Locally Owned & Family Operated Exterior Remodeling Company"
- **Service area**: Northern Virginia — "Proudly serving Fairfax County, Prince William County, Loudoun County, and Surrounding Areas."
- **Address**: 12644 Chapel Rd #104, Clifton, VA 20124
- **Phone**: +1 (571) 249-1480 (`tel:+15712491480` — in header nav and footer)
- **Email**: info@cliftonexteriors.com (Cloudflare-obfuscated in HTML, decoded from `data-cfemail`)
- **Owner**: Chris McNulty (named repeatedly in reviews; sales contact "Mike" / Mike Sullivan also mentioned; "Rene" once)
- **Key trust facts used on site**: Lifetime craftsmanship warranty; 25+ years of experience; Nextdoor Neighborhood Favorite; Simonton Windows Preferred Installer; James Hardie Preferred Remodeler; veteran-owned (mentioned in a review); 5.0 Google rating based on 55 reviews.
- **SEO title**: "Roofing, Window, and Siding Contractor in Clifton, VA - Exterior Remodeling Near Me | Clifton Exteriors"
- **Meta description**: "Clifton Exteriors is a trusted exterior remodeling contractor in Northern Virginia. Roofing, window replacement, siding, gutters, and doors. Request a free consultation."

---

## 2. Homepage Section Structure (top to bottom, verbatim copy)

### 2.0 Announcement bar (above header)
- Heading: **"Found a Better Price? We'll Beat It."**
- Subtext: "Same quality, same warranty — we'll match any comparable quote or go lower. Guaranteed."

### 2.1 Sticky header
- Logo (links to homepage).
- Nav: Services (dropdown: Window Replacement And Installation / Front Door Installation & Replacement / Roofing Replacement And Installation / Siding Replacement And Installation / Gutter Installation And Replacement) | Insurance Claims | Our Process | About Us (dropdown: About Us / Portfolio / Media / Contact Us / Employment / Financing / Testimonials / Blog) | **+1 (571) 249-1480** (tel link)

### 2.2 Hero
- **H1**: "Quality **Windows, Roofing, Siding, Doors & Gutters** In Northern Virginia At A Fair Price" (the service list is highlighted in red #ED2A28)
- **H2**: "Transform Your House Into A Place You're Proud To Come Home To"
- Buttons:
  - **"Get A Quote"** → https://www.cliftonexteriors.com/contact-us/
  - **"Learn About Insurance Claims"** → https://www.cliftonexteriors.com/insurance-claims/
- Background image (preloaded, applied via CSS): https://www.cliftonexteriors.com/wp-content/uploads/2024/09/New-asphalt-roof-on-a-home.webp (new asphalt roof on a home)
- Contains an Elementor "HP Mini Form" (Name, Email*, Phone, "What Can We Help With?" select: Window Replacement And Installation / Door Replacement And Installation / Roofing Replacement And Installation / Siding Replacement And Installation / Gutter Replacement And Installation / Insurance Claim; reCAPTCHA v3; **"Send"** button). NOTE: the form carries `elementor-hidden-desktop elementor-hidden-tablet elementor-hidden-mobile` classes, i.e. it is currently hidden on all breakpoints — present in markup but not visible.

### 2.3 Our Services (`#services` anchor)
- **H2**: "Our Services" (with divider line)
- 5 clickable cards, each: icon image + heading + **"Learn More"** arrow button:
  1. "Window Replacement And Installation" → /windows/ (icon: .../2022/12/Windows1-copy.webp)
  2. "Door Replacement And Installation" → /doors/ (icon: .../2022/12/Doors1-copy.webp)
  3. "Roofing Replacement And Installation" → /roofing/ (icon: .../2022/12/Roof1-copy.webp)
  4. "Siding Replacement And Installation" → /siding/ (icon: .../2022/12/SidingIcon-copy.webp)
  5. "Gutter Replacement and Installation" → /gutters/ (icon: .../2022/12/Gutters2-copy.webp)

### 2.4 Insurance Claims
- Image (left): https://www.cliftonexteriors.com/wp-content/uploads/2024/06/InsuranceRoof-1-scaled.webp (alt: "Clifton Insurance Claim Approved Home Exterior Improvement")
- **H2**: "Insurance Claims Made Easy"
- Body: "Dealing with exterior damage to your home can be daunting, but Clifton Exteriors is here to simplify your insurance claims process. Our experienced team will guide you through every step, from the initial inspection to the final repair, ensuring you get the coverage you deserve and the quality repairs you need."
- Button: **"Learn More"** → https://www.cliftonexteriors.com/insurance-claims/

### 2.5 Portfolio teaser
- **H2**: "We Can Help Transform Your Clifton, Virginia Home"
- Body: "Browse our portfolio and see how we have been able to help your neighbors in Clifton, VA, enhance the exteriors of their homes."
- Button: **"View Our Full Portfolio"** → /portfolio/
- Image: https://www.cliftonexteriors.com/wp-content/uploads/2022/12/Collage1.webp (alt: "portfolio collage")

### 2.6 Trust / Why Us ("Feel Confident Working With Us")
- **H2**: "Feel Confident Working With Us" (with divider)
- Intro: "We know that you've got options when it comes to enhancing your home. Thank you for considering Clifton Exteriors."
- 3 icon boxes:
  1. (shield icon) **"Lifetime Craftsmanship Warranty"** — "Rest assured, knowing that we got your back."
  2. (paint-roller icon) **"25+ Years Of Experience"** — "We are the experts when it comes to exterior enhancements."
  3. (comments icon) **"Award-Winning"** — "Clifton Exteriors has been recognized as Nextdoor's Neighborhood Favorite, Simonton Windows Preferred Installer, and James Hardie's Preferred Remodeler, in addition to many other honors."

### 2.7 About
- Image (left): https://www.cliftonexteriors.com/wp-content/uploads/2025/07/be-funkey-clifton-new-logo-scaled.jpg (square brand image, "clifton new logo")
- **H2**: "About Clifton Exteriors"
- Body (2 paragraphs):
  - "The founder of Clifton Exteriors, a proud native of Clifton, holds the town and its name close to his heart, as they carry deep personal significance. The company was established with the mission of offering homeowners in Virginia an exceptional and luxurious experience, while providing high-quality products and installations at a fair price."
  - "With a strong emphasis on customer satisfaction, Clifton Exteriors focuses on streamlining processes to address each homeowner's needs quickly and efficiently. The company's core value is ensuring that every homeowner feels truly valued throughout the entire experience."
- Button: **"Learn More"** → /about-us/

### 2.8 Process teaser
- **H2**: "A Hassle Free Process"
- Body: "We have crafted a process that keeps your vision for your home in Clifton, Virginia, at the forefront of everything we do. Let's upgrade your home together."
- Button: **"Our Process"** → /our-process/

### 2.9 Reviews
- **H2**: "Reviews From Our Satisfied Clients"
- Google Reviews widget (see Section 3) — server-rendered slider of 45 reviews with header "Clifton Exteriors LLC — 5.0 — Based on 55 reviews — powered by Google" and a "review us on Google" link (Google write-review URL, place id `ChIJQ6AF4YZFtokRkW4KDIt1r_M`).

### 2.10 Final CTA band
- **H2**: "Add To The Curb Appeal Of Your Home"
- Button: **"Get A Quote"** → /contact-us/

### 2.11 Footer
- Footer logo: https://www.cliftonexteriors.com/wp-content/uploads/2025/07/clifton-exteriors-logo-transparent-red-logo.png
- Line: "Proudly serving Fairfax County, Prince William County, Loudoun County, and Surrounding Areas."
- **GET IN TOUCH** column: Address: Clifton Exteriors, LLC, 12644 Chapel Rd #104 Clifton VA 20124 | Phone: +1 (571) 249-1480 | Email: info@cliftonexteriors.com
- **SERVICES** column: Window Replacement And Installation (/windows/), Front Door Installation & Replacement (/doors/), Roofing Replacement And Installation (/roofing/), Siding Replacement And Installation (/siding/), Gutter Installation And Replacement (/gutters/)
- **ABOUT US** column: Home (/), About Us (/about-us/), Our Process (/our-process/), Portfolio (/portfolio/), Pricing (/pricing/), Media (/media/), Service Locations (/?page_id=4440), Contact Us (/contact-us/), Employment (/employment/), Insurance Claims (/insurance-claims/), Financing (/financing/), Testimonials (/testimonials/), Blog (/blog/)
- Copyright: "© 2026 Clifton Exteriors, LLC | All Rights Reserved"

---

## 3. Reviews / Testimonials (VERBATIM — CRITICAL)

**Source**: Google reviews, rendered server-side by the WordPress plugin **"Widget Google Reviews" (grw / rplg, v6.9.8)**. The reviews ARE present in the HTML (not JS-only). Widget header: **Clifton Exteriors LLC — 5.0 — "Based on 55 reviews" — powered by Google**, with a "review us on" Google link. 45 individual reviews are rendered; ALL are 5 stars. Dates shown as relative ("X years ago"); exact timestamps exist in `data-time` attributes. Listed in widget order (newest first):

1. **N Goodall** — 5 stars — 1 year ago
   > I have a hard time hiring contractors to work on my home, because I've had a few experiences where I felt quality was lacking. Not so with Clifton Exteriors, who installed a new sliding door for my deck. It was a great experience throughout the process. Chris recommended a ProVia door, which we're very happy with it. It's very well built and has a number of high end features without being prohibitively expensive.
   >
   > Like many people in Fairfax County, our house is 40 years old now and needs some upgrades. The team at Clifton did a fabulous job matching the color and finish of new trimwork to the sheet metal around it. That's very difficult to do well. Installation was efficient and methodical. They team worked quickly, but they were not "rushing" and took their time to do quality work. Would heartily recommend them for your exterior project.

2. **Hongjun Xu** — 5 stars — 1 year ago
   > Great window replacement project. Thank you for the hassle free experience.

3. **Jay Conklin** — 5 stars — 2 years ago
   > We had all of our windows replaced in the South Riding area. Selected Clifton Exteriors to support local business and based on reviews along with some friends who have used. Great experience from the start with Mike waking us through the process and options. The installation crew was on time, efficient and clean. The owner (Chris) and Mike were easy to reach throughout. Really happy with the work and I know they are only a call away if we run into an issue.

4. **John O'Neill** — 5 stars — 2 years ago
   > Great work, looks great, like a miracle!

5. **Gail Hogan** — 5 stars — 2 years ago
   > Clifton Exteriors replaced my front door and side lights and I couldn't be happier! Excellent communication and the work is superb! Highly recommend them for your home project - such an excellent contractor is very hard to find!

6. **Ben Shuman** — 5 stars — 2 years ago
   > We've used Clifton Exteriors for multiple projects around the exterior of our house and will continue to use them for any future projects. We've gotten windows, siding, roofing, trim, and gutters replaced and each time the crew was prompt, courteous, and cleaned up thoroughly once they were finished. There was full transparency and honesty with cost, and no unexpected bills came our way.
   >
   > The owner, Chris McNulty, was attentive and involved at every step of the process. He also helped a great deal with the insurance claims we made for the relevant jobs. We're always happy to support a local business, but in this case we got the best customer service experience I could've imagined. I would highly recommend that you use Clifton Exteriors for your next exterior home project. I know that we will.

7. **Simmi & Sim Sran** — 5 stars — 2 years ago
   > Our review is as the neighbor of someone who hired Clifton Exteriors. We reached out to Clifton after being disgruntled by staff driving over our front lawn. To be fair to Clifton - property lines are not obviously marked, and we suspect our neighbors never took the time to share information with their contractors. Regardless the owner, Chris, immediately called back, came out in person to investigate and remedied the situation after we came to an agreement in person. We commend Chris for his proactive approach -- we can tell he is committed and takes ownership of his jobs and crew seriously.

8. **Gregory Farrell** — 5 stars — 2 years ago — (rating only, no text)

9. **Andy Cassells** — 5 stars — 2 years ago
   > The team at Clifton Exteriors did an excellent job replacing our roof. Starting with our first interaction with Mike, and continuing with the hands-on involvement of Chris the owner, we feel like received a superior product on the promised schedule at a fair price. We would recommend this company!

10. **Art DesLauriers** — 5 stars — 2 years ago
    > Great customer service. Professional, fast.

11. **Seth Hunter** — 5 stars — 2 years ago
    > Professional, great communication, high-quality work, (NoVA) local, and good price.

12. **Ed ED** — 5 stars — 2 years ago
    > Finding a quality company providing home improvements is always a bit of a gamble. Happily, after considerable searching, Clifton Exteriors far exceeded our expectations!
    >
    > We hired the company to install oversized gutters and new downspouts. Our home is surrounded by tall trees and for that reason we also sought a means to keep our gutters clear of leaves and other detritus.
    >
    > Working with Clifton Exteriors was extremely easy. Their estimate aligned with other estimates, but the contract we received was among the most professionally generated contracts we've ever seen compared to previous jobs with other companies. The contract was extremely detailed and outlined everything we could expect.
    >
    > It took approximately 1 1/2 - 2 weeks to get onto their schedule, but once we had a date, owner Chris McNulty kept us well informed with respect to start time and other details. When they had to postpone the job, Chris was very flexible to reschedule our work date.
    >
    > The crew that came to our home was courteous, highly professional, and worked non stop to complete the job in approximately three hours. Cleanup was outstanding, to include ensuring the contents of our old gutters was not left behind.
    >
    > Clifton Exteriors installs the Bulldog gutter guard. The system does not include a mesh screen that can become clogged from shingle dust and other debris. We won't know if it solves our leaf problem for quite some time, but we're optimistic it will do the trick.
    >
    > Clifton Exteriors is a local company and we will definitely call them when future work on our home is required. Excellent company and very easy to work with - professional, responsive, and quick to answer all of your questions!!

13. **uscray** — 5 stars — 2 years ago
    > Great experience with Mike and Chris. Mike was very knowledgeable and no pressure. Offered me various options for my budget and needs. The crew worked efficiently and clean up was thorough. Got a new roof, windows, siding and gutters. Trust the reviews these guys are fantastic! Chris is a very proactive owner and made sure the job got completed on schedule and on budget. Will be doing doors next.

14. **GG MIA** — 5 stars — 2 years ago
    > My experience with this company was stellar. The customer service, products, and quality of the installation all 5 stars. Extremely pleased with Mike who has a great eye for aesthetics and is very detailed. His recommendations were within our budget and exceeded our expectations. The entire process was worry free and Mike was there to answer questions every step of the way. Highly recommended. The windows elevated the look of our property, the difference is astonishing!

15. **R. W. Hicks** — 5 stars — 2 years ago
    > They were prompt and professional and were kind enough to do a small job a bit outside of their normal efforts. I will use them again.

16. **Barbara Corcoran** — 5 stars — 2 years ago
    > 17 new windows for our 30-year-old house. Very pleased with the initial visit with Chris McNulty, the owner; ordering/delivery process went seamlessly; 1-day installation went great (including a very good interior/exterior cleanup and window cleaning before the excellent crew left the job. We were very pleased from start to finish!

17. **Gopal Lamsal** — 5 stars — 2 years ago
    > Clifton Exteriors LLC replaced roof and siding of my house in Centreville. I am giving 5 stars for provided service and recommend to those who are looking for a contractor company for their house's exterior project work.

18. **Dozer Doze** — 5 stars — 2 years ago
    > Clifton Exteriors was responsive, easy to work with, and provided very accurate timelines. Their installation team was prompt, efficient and did excellent work. I am very satisfied with their work.

19. **T Niazi** — 5 stars — 2 years ago
    > Great experience. Needed a quick repair on the rear rake board of my roof, where the aluminum cover got ripped off due to high winds. Chris sent over some of his workers, and they repaired it quickly.

20. **Gelf** — 5 stars — 2 years ago
    > The service provided by Clifton Exteriors was nothing short of exceptional. Mike was always available to answer questions and never once tried to hard sell any of their products. The payment process was super easy and the never once did they require an initial down payment for their services. The installation was excellent and their warranty is lifetime. Clifton exteriors has become my go to company for any and all roofing, gutter, and window needs.

21. **David Jablonski** — 5 stars — 2 years ago
    > Chris and his team replaced our siding, trim capping and exterior door this past winter and did an amazing job. Chris walked me through the process of replacing the door and siding, answered all of my questions as well. His team was on time to the job, finished in a timely manner, and cleaned up great after the job was complete. If you need any work done on your house, I couldn't recommend another company to work with.

22. **Erik Matson** — 5 stars — 2 years ago
    > Chris worked with me to navigate the process of submitting a claim to my home insurance, and my insurer ended up covering the replacement of my roof. The team at Clifton Exteriors was professional and detail-oriented. I'm very please with the work the did and would recommend them to others without reservation!

23. **TechSavvy Hero** — 5 stars — 2 years ago
    > We had our French door from our kitchen to our deck redone and Clifton Exteriors did a wonderful job. The door is beautiful and the guys that worked on it were professional and so nice. And a big shout out to Mike Sullivan who was so easy to work with.

24. **Bernard Assily** — 5 stars — 2 years ago
    > The guys during Installation were so efficient and neat. They provided a very prompt and thorough installation, and made sure to answer all my questions. They did a remarkable job, very detailed, and finished in 1 day. Chris and Mike also did a great job following up and visiting, making sure they are present and available to answer all questions or concerns on all the job level. Highly recommended

25. **Angela Brown** — 5 stars — 2 years ago
    > Updated! We just re-hired Clifton Exteriors to replace our windows and they did a fantastic job. The crew arrived EARLY and finished a whole-house replacement by mid-afternoon. They also left the windows and our house sparkling clean—it was like the new windows magically appeared!
    >
    > \*\*\*\*\*
    >
    > We had a really great experience with our recent front door replacement and new shutters. We experienced a significant delay due to COVID-related supply chain issues, but they communicated with us every step of the way, were committed to making sure everything was done quickly and to our satisfaction when the door arrived, and we're delighted with the refreshed exterior of our home.

26. **Tricia O'GRADY** — 5 stars — 2 years ago
    > Excellent, reliable service with very reasonable prices. The owner oversees all of the work.

27. **Laura Danner** — 5 stars — 2 years ago
    > Clifton Exteriors installed a new roof on my home and I couldn't be happier with the results. Not only does the roof look beautiful, but Clifton Exteriors is a wonderful company to work with. Mike and Chris kept me informed throughout the entire process and made sure to let me know of the various issues they came across during installation through texts, calls, and even pictures. I wouldn't hesitate to use Clifton Exteriors again in the future for additional projects as well as recommend them to others.

28. **Joseph Murphy** — 5 stars — 3 years ago
    > Clifton Exteriors just completed the installation of our old, hail-damaged roof, and we are thrilled with the results!
    > The crew was prompt and professional, and when they finished there was no trace of anyone having completed major exterior work.
    > This is the second time we have engaged Clifton Exteriors for renovations to our home. In 2020, they replaced the soffits and flashing, as well as wrapped our front porch structures. This gave us confidence to call Chris McNulty at Clifton Exteriors once again to upgrade our home.

29. **Andrew Chanthaphone** — 5 stars — 3 years ago
    > Chris and his company are awesome! They were a pleasure work with and got our insurance to cover everything. We even got skylights added and they make our back porch look so much more modern. A+++ company.

30. **Leah Roberts** — 5 stars — 3 years ago
    > Amazing company and did a phenomenal job on my doors! I would recommend them highly if you're considering any work on your house.

31. **Evan Del Duke** — 5 stars — 3 years ago
    > Chris and his team are OUTSTANDING! We replaced windows, wrapped the whole house trim, and replaced the gutters + gutter guards. The work was completed in a timely and orderly manner. Chris was very responsive to questions and provided routine updates on the project. Staff were polite, clean, and very hard working. They were able to stay on schedule and within budget. Would highly recommend, we could not be happier with how the work turned out.

32. **Michael St. Peter** — 5 stars — 3 years ago
    > Clifton Exteriors were very responsive and professional to deal with. Chris and Mike were very easy to work with and cared about our complete satisfaction. We had a new front door and storm door installed along with rotted trim replacement and wrapping and all new gutters installed. The instillation crews were very polite professional and did an outstanding job. Everything looks really good, and we were pleased with the work that was done.

33. **Wendy Ergler** — 5 stars — 3 years ago
    > I recently had Clifton Exteriors install new windows in my townhouse. From start to finish it was an extremely smooth experience. I will definitely use them again when the need arises.

34. **Simon Markovich** — 5 stars — 3 years ago
    > Clifton Exteriors replaced my roof, gutters, gutter guards, downspouts, and capped all windows damaged from a hail storm. Called Chris on short notice to meet with my insurance adjuster, he showed up, and got me approved for the previously listed replaced items. From there he kept me in the loop for each phase of the work. It was done timely, with quality and professionalism, with no issues. No pressure during the entire project, to include no upfront payment demands. All projects should be this easy.

35. **Ann Callaway** — 5 stars — 3 years ago
    > CE replaced the windows and siding on my house. The crews were so meticulous. No problems. No excuses. No mysterious disappearances, all of which are common with most contractors. It was so refreshing to deal with a company that values excellence. And, they cleaned up the mess!

36. **John Skoglund** — 5 stars — 3 years ago
    > From beginning sales to the actual installation, it was an awesome experience. Professional at all times and constant communication was much appreciated. Thank you!

37. **Peggy Bell** — 5 stars — 3 years ago
    > The personal and professional service received from Clifton Exteriors was fantastic. They kept me informed each step of the process and the work was completed on time as scheduled. They did a fantastic job. I highly recommend them.

38. **Jennifer Burson** — 5 stars — 3 years ago
    > Clifton exteriors installed all new windows at my daughters condo last year. What a great job they did! So I just got them to install a beautiful storm door at my house. They are so professional, prompt, have fair prices and are veteran owned. Highly recommend this company!

39. **Veronica Garcia** — 5 stars — 3 years ago
    > This review is a bit late but I made sure not to forget to come back to write it. We had our work done late April 2023.
    > Chris and Clifton Exteriors 100% exceeded our expectations in every way.
    > From the moment I submitted the quote for a request until the final inspection was done, everything was done with incredible professionalism and the workmanship was excellent.
    > We had windows and siding replaced and trim work done around some door frames, the trim being something Chris suggested and we are so happy he did. It gave the project the perfect finishing touch and he was the only one to suggest doing it for the best outcome.
    > Chris provided many options and colors for the windows and siding and all of the materials were high quality.
    > The estimate provided was very detailed with every item and price listed in an organized way, it was the best laid out estimate we received (we had 5 estimates done) and it was easy to read.
    > The crew that did the installation were meticulous and very clean and when they were finished there wasn't a single piece of trash or debris left behind. The foreman and Chris were always available to assist us in any way and communication was timely.
    > Christ definitely stands by his work and will make sure all his customers are happy with the final result.
    > I would very highly recommend Clifton Exteriors for any work you may need. You will not be disappointed.

40. **Kristie Kendall** — 5 stars — 3 years ago
    > Clifton Exteriors did the siding for our house renovation earlier this year. We looked into numerous companies, solicited quite a few bids, and we are sure glad that we used Clifton exteriors in the end. Chris worked with us to find a cheaper alternative to pricey Hardie plank that wouldn't break the bank but also wouldn't compromise quality. His team was prompt, responsive, and worked quickly and efficiently to get the project completed. We are in love with our siding and the job they did - we only wish we had found them sooner to do more exterior projects for us!

41. **Jim Ackert** — 5 stars — 4 years ago
    > Clifton Exteriors replaced my roof. From the first contact they were professional, responsive and ready to advise and assist. They were flexible in scheduling around other work being done by another contractor. The team that did the installation arrived on time and completed the work professionally and competently. When finished, the area around the house was thoroughly cleaned up...I couldn't find a single nail or piece of scrap. The roof recommended by Clifton Exteriors came out looking even better than expected. Chris was easy to work with and kept an eye on the work as it was being completed. I would definitely use this company for any future exterior upgrades.

42. **Steven Nelson** — 5 stars — 4 years ago
    > Contacted Clifton Exteriors after finding a leak in our roof. The team responded same-day, walked me through their process and discussed potential solutions. Appointment was scheduled for the very next day and they completed the repair within an hour. Super responsive, very professional and reasonably priced. Would highly recommend Chris, Mike and the team at Clifton.

43. **Kenneth Wilhelm** — 5 stars — 4 years ago
    > Clifton exteriors did an excellent job of replacing my gutters and gutter guards. They were on time and very professional. Would highly recommend.

44. **ellenpward** — 5 stars — 4 years ago
    > Chris, Mike and Rene were great to work with. Very responsive, and kept me informed every step of the way. Installers were fast and professional. Love my new front windows!

45. **Alison Burns** — 5 stars — 5 years ago
    > Highly recommend Clifton Exteriors for their quality of work, customer service, efficiency, and price point. They installed us a new roof, gutters, doors, and windows and managed to get each project done within a day. So happy we came across this business. Will use again for other exterior work!

**Note**: The site also has a dedicated /testimonials/ page (linked from nav and footer). The JSON-LD schema on the homepage carries `ratingValue: "5"` aggregate data.

---

## 4. Calls To Action

| # | Wording | Placement | Target |
|---|---------|-----------|--------|
| 1 | "Found a Better Price? We'll Beat It." + "Same quality, same warranty — we'll match any comparable quote or go lower. Guaranteed." | Announcement bar, top of every page | (text only, no link) |
| 2 | +1 (571) 249-1480 | Header nav, right side (sticky) | `tel:+15712491480` |
| 3 | **Get A Quote** | Hero, primary button | /contact-us/ |
| 4 | Learn About Insurance Claims | Hero, secondary button | /insurance-claims/ |
| 5 | Send (HP Mini Form: Name/Email/Phone/service select) | Hero form (currently hidden on all breakpoints) | Elementor form submit |
| 6 | Learn More (x5) | Each service card | /windows/, /doors/, /roofing/, /siding/, /gutters/ |
| 7 | Learn More | Insurance Claims section | /insurance-claims/ |
| 8 | View Our Full Portfolio | Portfolio teaser section | /portfolio/ |
| 9 | Learn More | About section | /about-us/ |
| 10 | Our Process | Process teaser section | /our-process/ |
| 11 | "review us on" Google | Reviews widget header | Google write-review link (place id ChIJQ6AF4YZFtokRkW4KDIt1r_M) |
| 12 | **Get A Quote** | Final CTA band ("Add To The Curb Appeal Of Your Home") | /contact-us/ |
| 13 | Phone / Email links | Footer GET IN TOUCH | tel:+15712491480, mailto info@cliftonexteriors.com |

**Strongest conversion message**: the price-match guarantee in the site-wide announcement bar — "Found a Better Price? We'll Beat It. Same quality, same warranty — we'll match any comparable quote or go lower. Guaranteed." Primary conversion action is **"Get A Quote" → /contact-us/** (hero + closing band), backed by "fair price" positioning in the H1 and the phone number kept persistently visible in the sticky header.

---

## 5. Site Pages (from nav + footer)

| Page | URL |
|------|-----|
| Home | https://www.cliftonexteriors.com/ |
| Windows (Window Replacement And Installation) | https://www.cliftonexteriors.com/windows/ |
| Doors (Front Door Installation & Replacement) | https://www.cliftonexteriors.com/doors/ |
| Roofing (Roofing Replacement And Installation) | https://www.cliftonexteriors.com/roofing/ |
| Siding (Siding Replacement And Installation) | https://www.cliftonexteriors.com/siding/ |
| Gutters (Gutter Installation And Replacement) | https://www.cliftonexteriors.com/gutters/ |
| Insurance Claims | https://www.cliftonexteriors.com/insurance-claims/ |
| Our Process | https://www.cliftonexteriors.com/our-process/ |
| About Us | https://www.cliftonexteriors.com/about-us/ |
| Portfolio | https://www.cliftonexteriors.com/portfolio/ |
| Pricing (footer only) | https://www.cliftonexteriors.com/pricing/ |
| Media | https://www.cliftonexteriors.com/media/ |
| Service Locations (footer only) | https://www.cliftonexteriors.com/?page_id=4440 |
| Contact Us | https://www.cliftonexteriors.com/contact-us/ |
| Employment | https://www.cliftonexteriors.com/employment/ |
| Financing | https://www.cliftonexteriors.com/financing/ |
| Testimonials | https://www.cliftonexteriors.com/testimonials/ |
| Blog | https://www.cliftonexteriors.com/blog/ |

Header nav groups: Services (dropdown of 5 service pages, anchor #services) | Insurance Claims | Our Process | About Us (dropdown: About Us, Portfolio, Media, Contact Us, Employment, Financing, Testimonials, Blog) | phone number.

---

## 6. Media

- **Header logo** (main, transparent): https://www.cliftonexteriors.com/wp-content/uploads/2021/04/clifton-exteriors-logo-transparent.webp (1005x527; alt: "Locally Owned & Family Operated Exterior Remodeling Company")
- **Footer logo** (red variant): https://www.cliftonexteriors.com/wp-content/uploads/2025/07/clifton-exteriors-logo-transparent-red-logo.png (1005w)
- **Hero background**: https://www.cliftonexteriors.com/wp-content/uploads/2024/09/New-asphalt-roof-on-a-home.webp — photo of a home with a new asphalt shingle roof; H1/H2/buttons overlaid. Brand accent color in hero H1: red #ED2A28.
- **Insurance section image**: https://www.cliftonexteriors.com/wp-content/uploads/2024/06/InsuranceRoof-1-scaled.webp (1920x960, "Clifton Insurance Claim Approved Home Exterior Improvement")
- **Portfolio collage**: https://www.cliftonexteriors.com/wp-content/uploads/2022/12/Collage1.webp (850x700)
- **About brand image**: https://www.cliftonexteriors.com/wp-content/uploads/2025/07/be-funkey-clifton-new-logo-scaled.jpg (1920x1920 square)
- **Service icons** (200x200 webp, /wp-content/uploads/2022/12/): Windows1-copy.webp, Doors1-copy.webp, Roof1-copy.webp, SidingIcon-copy.webp, Gutters2-copy.webp
- **Google place photo** (reviews widget): lh3.googleusercontent.com place image
- Fonts: Roboto + Montserrat (Google Fonts, self-hosted). Stack: WordPress, Elementor 4.0.9, The Plus Addons, WP Rocket, AIOSEO, Widget Google Reviews 6.9.8, reCAPTCHA v3, GTM/GA.

## Version Control

This document follows the root-level version control rules in [SYSTEM_RULES.md](/SYSTEM_RULES.md). Commit only non-secret, repo-friendly workflow context and artifacts.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
