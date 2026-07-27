# Old Site — /windows/ Page Content Inventory (1:1 Rebuild Reference)

**Source**: https://www.cliftonexteriors.com/windows/ (downloaded 2026-07-07, 587 KB, WordPress/Elementor)
**Purpose**: verbatim content + structure reference for the Webflow rebuild
(`final-design/page-windows.html`). Design follows the staging homepage system
([staging-analysis.md](./staging-analysis.md)); content below is copied 1:1.

## Section order (top → bottom, main content only; nav/footer are site-wide)

| # | Section | Heading (verbatim) |
|---|---|---|
| 1 | Hero | H1 "Top Window Installer & Window Replacement Team In Northern Virgina" *(sic — typo "Virgina" on the live site; rebuild uses "Virginia")* + H2 "Elevate The Appearance Of Your Home With New And Improved Windows" |
| 2 | Financing band | H2 "We Offer Financing For Your Project" → Learn More `/financing/` |
| 3 | Feature split | H2 "Window Installation: Create An Inviting Atmosphere" |
| 4 | Upgrades list | H2 "Common Upgrades For Window Installation And Window Replacement In Clifton, VA" |
| 5 | Feature split (mirrored) | H2 "Upgrade Your Curb Appeal With Window Installation" |
| 6 | Portfolio gallery (9 imgs) | H2 "Our Window Installation Portfolio" → View Our Full Portfolio `/portfolio/` |
| 7 | Credentials cards ×3 + confidence | H3s "Lifetime Craftsmanship Warranty" / "25+ Years Of Experience" / "Award-Winning", then H2 "Feel Confident Working With Us" |
| 8 | Pricing tiers ×3 | H2 "Window Installation And Replacement Pricing In Clifton, VA" |
| 9 | Process CTA band | H2 "A Hassle Free Process" → Our Process `/our-process/` |
| 10 | FAQ ×6 | H2 "Frequently Asked Questions About Window Replacement & Installation" |
| 11 | Reviews | H2 "Reviews From Our Satisfied Clients" (Google widget, 45+ reviews) — rebuild reuses the existing `section_reviews-v2` payload |
| 12 | Contact form | H1(!) "Tell Us About Your Project" + form (13 fields) — rebuild keeps heading/copy; native Webflow form added in Designer |
| 13 | Closing CTA | H2 "Invite The Sunshine Into Your Home" + service-area line |

## Verbatim copy

### 1. Hero
- H1: `Top Window Installer & Window Replacement Team In Northern Virgina` (typo on live site)
- H2: `Elevate The Appearance Of Your Home With New And Improved Windows`
- CTAs: `Get A Quote` → `/contact-us/`, `Our Process` → `/our-process/`
- Trust badges (imgs): GAF-CERTIFIED, Google 5-star review, ProVia, ShingleMaster, 2024 Nextdoor Neighborhood Favorites

### 2. Financing
- H2: `We Offer Financing For Your Project` — CTA `Learn More` → `/financing/`
- Img: bedroom windows (`windowsCliftonsections_resizer5.webp`)

### 3. Window Installation: Create An Inviting Atmosphere
> Initiating a window installation in your Clifton home is a great way to fill the rooms with natural light and breathe life into your living spaces.
>
> What's more, replacing those old windows with something new will change the look of the whole house and create an inviting atmosphere that welcomes friends and family alike. Upgrading your windows with a window installer in Clifton is a wonderful way to renew both the exterior and interior of your home.

CTA: `Get A Quote` → `/contact-us/`

### 4. Common Upgrades
Items: `Low-E Argon` · `Internal Grids` · `Tempered Glass` · `Color Options`

### 5. Curb Appeal
> Installing new windows can make all the difference when it comes to improving your Clifton home's curb appeal. Not only do new windows look more attractive, with their shiny frames and crystal clear glass, but they also jumpstart a process of modernizing and brightening up the entire façade. *(live site runs this sentence into the next with a missing space — split into two paragraphs in the rebuild)* High-quality windows can also help you instantly upgrade your property and create the perfect first impression for guests or buyers. And that's not even mentioning their energy efficiency capabilities, which could save you money in the long run!

CTA: `Get A Quote` → `/contact-us/` · Img: tall windows (`windowsCliftonsections_resizer2.webp`)

### 6. Portfolio (9 gallery images, in order)
1. `2022/12/IMG_1083.jpg` 2. `2023/06/IMG_9825-scaled.jpg` 3. `2022/12/IMG_9378_1.jpg`
4. `2022/12/IMG_9702.jpg` 5. `2022/12/IMG_9670_1.jpg` 6. `2022/12/IMG_1135.jpg`
7. `2023/06/IMG_9414_1-scaled.jpg` 8. `2023/06/IMG_2411-1-scaled.jpg` 9. `2022/12/IMG_1131.jpg`
(all under `https://www.cliftonexteriors.com/wp-content/uploads/`)

### 7. Credentials + confidence
- `Lifetime Craftsmanship Warranty` — `Rest assured, knowing that we got your back.`
- `25+ Years Of Experience` — `We are the experts when it comes to exterior enhancements.`
- `Award-Winning` — `Clifton Exteriors has been recognized as Nextdoor's Neighborhood Favorite, Simonton Windows Preferred Installer, and James Hardie's Preferred Remodeler, in addition to many other honors.`
- H2: `Feel Confident Working With Us` — `We know that you've got options when it comes to enhancing your home. Thank you for considering Clifton Exteriors.`

### 8. Pricing
| Tier | Price | Includes |
|---|---|---|
| Standard | Starting At $5-8.5K | Includes 6-10 vinyl windows. / Complete in 1 day. |
| Deluxe | Starting At $10-17K | Includes 12-20 vinyl windows. / Complete in 1-2 days. |
| Premium | Starting At $20-40K | Includes 24+ vinyl windows. / Complete in 1-3 days. |

Disclaimer: `*Prices are averages and may change depending on the size of your home, materials used, and upgrades wanted. You will receive an exact quote for your window upgrade after the in-home consultation with our window installers in Burke.`

### 9. Process CTA
> Our window installer team has crafted a process that keeps your vision for your home at the forefront of everything we do. Let's upgrade your home together.

CTA: `Our Process` → `/our-process/`

### 10. FAQ (6 Q&A, verbatim)
1. **How long does it take to replace windows?** — Depending on how many windows are being replaced, it can take anywhere from 1-3 days.
2. **How much should I expect to pay to have a window installed?** — A good rule of thumb for window installation is about $800 – $1k per window. This can vary due to the type of window and complexity of the installation.
3. **What happens if you don't replace old windows?** — If you neglect to replace old windows, you'll face three key issues. First, your energy efficiency will suffer. Old windows typically lack the insulation features of modern ones, leading to an upswing in heating costs in winter and cooling costs in summer. Second, your home security will be compromised. Older windows are often easier to breach, making your property a more attractive target for burglars. Third, you risk structural damage. Over time, window rot can spread to surrounding structures, potentially leading to substantial repair costs. It's a fact that these problems are likely outcomes of failing to replace aging windows.
4. **How do I start the process of getting my windows replaced?** — Fill out the form on our contact page to connect with us so we can talk more about your project.
5. **Is it cheaper to replace all windows at once?** — It's usually cheaper to get all your windows replaced at once since you can buy them in bulk. Additionally, if you're getting your windows installed professionally, doing it all at once will lower the labor hours since the crew is able to install the windows more efficiently.
6. **Do vinyl windows decrease home value?** — Generally, installing vinyl windows does not decrease the value of your home. On the contrary, replacing old or outdated windows with new, energy-efficient vinyl ones can potentially increase your home's overall value. / New windows can augment the aesthetic appeal of your house, making it look well-kept and attractive, which potential buyers often seek. They also contribute to the energy efficiency of your home, lowering your energy costs and increasing the comfort of living spaces. / Vinyl windows have the added benefit of being relatively low-maintenance, a factor that can be attractive to buyers seeking a home that doesn't require constant care. These windows are also known for their durability and longevity, providing years of service without necessitating extensive repairs or replacement.

### 12. Contact
- Heading (H1 on live site; H2 in rebuild): `Tell Us About Your Project`
- Copy: `Use our contact form below to get in contact with us so we can start planning out the enhancements for your home.`
- Form: First/Last Name, Phone, Email, Street/City/State/Zip, How Did You Find Out About Us? (dropdown), What Can We Help With? (checkboxes), Briefly Describe Your Project, image upload, submit `Get Your Quote`. **Not pasteable** (converter has no native-form mapping) — add the site's native form component in the Designer.

### 13. Closing
- H2: `Invite The Sunshine Into Your Home` — CTA `Get A Quote` → `/contact-us/`
- Service area: `Proudly serving Fairfax County, Prince William County, Loudoun County, and Surrounding Areas.`

## Version Control
- Follows [SYSTEM_RULES.md - Section 4](../../../../../SYSTEM_RULES.md); lightweight `.tmp/` artifact committed for continuity.

## Infrastructure

- **Hosting**: Hostinger VPS
- **OS**: Ubuntu 24.04 LTS
